import { drive_v3 } from "@googleapis/drive";

import {
  getGoogleDriveApi,
  getGoogleSheetsApi,
  SpreadsheetWrapper,
} from "./spreadsheet";
import {
  discordLog,
  discordErrorLog,
} from "./shared/services/discord/discord.logger";
import { clearAllCache } from "./ddb";

/**
 * Google Apps Script for Argentina Trip Form
 * Handles both GET requests for RSVP lookup and POST requests for form submissions
 * Single webapp managing both "RSVP" and "Trip Registrations" sheets
 *
 * Google Apps Script globals: ContentService, SpreadsheetApp, Utilities
 */

const TRIP_REGISTRATIONS_SHEET_NAME = "Trip Registrations";
const RSVP_SHEET_NAME = "RSVP"; // Sheet containing RSVP data
const TPV_PAYMENTS_SHEET_NAME = "TPV PAYMENTS"; // Sheet for REDSYS TPV payment callbacks
const TIMELINE_SHEET_NAME = "TIMELINE"; // Sheet containing timeline data
const CHOICES_SHEET_NAME = "CHOICES"; // Sheet for tracking user activity choices
const PASSPORTS_SHEET_NAME = "PASSPORTS"; // Sheet for tracking traveler passport details
const LUGGAGE_SHEET_NAME = "Luggage"; // Sheet for tracking checked luggage selections per flight

/**
 * Validates user credentials by checking for presence of email and password,
 * and then verifying them against the RSVP sheet.
 * @param {string} email The user's email.
 * @param {string} password The user's password.
 * @returns {{success: boolean, response?: object, rsvpData?: object}} Validation result.
 */
async function validateCredentials(
  email: string,
  password: string,
  spreadsheet: SpreadsheetWrapper,
  refresh: boolean
) {
  if (!email) {
    throw new Error("Email is required.");
  }

  if (!password) {
    throw new Error("Password is required.");
  }

  return lookupRSVP(email.trim(), password.trim(), spreadsheet, refresh);
}

/**
 * Handle GET requests for RSVP lookup and timeline data
 */
export async function doGet(
  e: {
    parameter: {
      endpoint: string;
      email: string;
      password: string;
      refresh?: string;
    };
  },
  spreadsheet: SpreadsheetWrapper
) {
  const refresh = e.parameter.refresh === "1";

  const rsvpData = await validateCredentials(
    e.parameter.email,
    e.parameter.password,
    spreadsheet,
    refresh
  );

  // Check if this is a timeline request
  if (e.parameter.endpoint === "timeline") {
    return getTimelineData(spreadsheet, refresh);
  }

  // Check if this is a rafting registrations count request
  if (e.parameter.endpoint === "rafting_count") {
    const raftingQueue = await getRaftingRegistrations(
      spreadsheet,
      e.parameter.email,
      refresh
    );
    return {
      success: true,
      raftingQueue,
    };
  }

  // Check if this is an update completed choices sheet request (admin only)
  if (e.parameter.endpoint === "update_completed_choices") {
    return updateCompletedChoicesSheet(spreadsheet, e.parameter.email, refresh);
  }

  if (e.parameter.endpoint === "download_voucher") {
    return downloadVoucher(e.parameter.email, spreadsheet, refresh);
  }

  // await spreadsheet.cacheAllSheets();

  const responseData = await getEmailSubmissionData(
    e.parameter.email,
    spreadsheet,
    refresh,
    rsvpData
  );

  return {
    success: true,
    data: responseData,
  };
}

async function getEmailSubmissionData(
  email: string,
  spreadsheet: SpreadsheetWrapper,
  refresh: boolean,
  rsvpData: Record<string, string | number | boolean>
) {
  // Check if there's an existing submission for this email
  const existingSubmission = await findExistingSubmission(
    email.trim(),
    spreadsheet,
    refresh
  );

  // Look up passport details for this traveler
  const passportDetails = await findPassportDetails(
    email.trim(),
    spreadsheet,
    refresh
  );

  // Look up luggage selections for this traveler
  const luggageDetails = await findLuggageDetails(
    email.trim(),
    spreadsheet,
    refresh
  );

  // Look up user choices for this traveler
  const userChoices = await getUserChoices(email.trim(), spreadsheet, refresh);

  return {
    rsvpData,
    row: existingSubmission?.row || null,
    rowNumber: existingSubmission?.rowNumber || null,
    passport: passportDetails || null,
    luggageSelection: luggageDetails || null,
    userChoices: userChoices,
  };
}

/**
 * Get rafting registrations count across Trip Registrations and CHOICES sheets.
 * Logic:
 * - Build latest choice per email for itemKey 'rafting' from CHOICES (event-sourced using highest counter)
 * - Load Trip Registrations and read formData.rafting column
 * - Final inclusion per email:
 *   - If latest CHOICES for rafting exists: include if 'yes', exclude if 'no'
 *   - Else fall back to formData.rafting truthiness
 */
export async function getRaftingRegistrations(
  spreadsheet: SpreadsheetWrapper,
  email: string,
  refresh: boolean
) {
  // --- Load Trip Registrations formData.rafting ---
  const { rows: regsRows, headers } = await spreadsheet.getRowsWithHeaders(
    TRIP_REGISTRATIONS_SHEET_NAME,
    refresh
  );
  const emailIdx = headers.indexOf("rsvpData.email");
  const raftingIdx = headers.indexOf("formData.rafting");

  const raftingEmailsInOrder = regsRows
    .filter(
      (row) => row[raftingIdx]?.toString().toLowerCase().trim() === "true"
    )
    .map((row) => row[emailIdx]?.toString().toLowerCase().trim())
    .filter(Boolean);

  // --- Load CHOICES latest per email for rafting ---
  const { rows: choicesRows, headers: choicesHeaders } =
    await spreadsheet.getRowsWithHeaders(CHOICES_SHEET_NAME, refresh);

  const choicesEmailIdx = choicesHeaders.indexOf("email");
  const choiceIdx = choicesHeaders.indexOf("choice");
  const optionIdx = choicesHeaders.indexOf("option");

  for (const row of choicesRows) {
    const option = row[optionIdx]?.trim();
    const choice = row[choiceIdx]?.toLowerCase().trim();
    if (option === "rafting" && choice === "yes") {
      const email = row[choicesEmailIdx]?.toLowerCase().trim();
      if (email) {
        raftingEmailsInOrder.push(email);
      }
    }
  }

  return raftingEmailsInOrder.map((e) => {
    // keep the requester email in order so they know their position in rafting queue
    if (e?.trim().toLowerCase() === email.trim().toLowerCase()) {
      return e;
    }
    // hide other emails for security
    return true;
  });
}

type AuthenticatedRequest = {
  email: string;
  password: string;
};

type PassportSubmission = AuthenticatedRequest & {
  action: "submit_passport";
  passportName: string;
  passportNumber: string;
  expiryDate: string;
  birthDate: string;
  aAdvantage: string;
};

type LuggageSubmission = AuthenticatedRequest & {
  action: "submit_luggage";
  luggageSelection: Record<string, boolean>;
};

type ChoiceUpdate = AuthenticatedRequest & {
  action: "set_choice";
  itemKey: string;
  option: string;
  choice: string;
};

type ClearAllCache = AuthenticatedRequest & {
  action: "clear_all_cache";
};

type ErrorReport = {
  endpoint: "error-report";
  errorMessage: string;
  errorStack: string;
  url: string;
  userAgent: string;
  timestamp: string;
  userId: string;
  context: string;
};

type RedsysCallback = {
  action: undefined;
  Ds_SignatureVersion: string;
  Ds_MerchantParameters: string;
  Ds_Signature: string;
};

// Type guard functions
function isErrorReport(data: any): data is ErrorReport {
  return data.endpoint === "error-report";
}

function isRedsysCallback(data: any): data is RedsysCallback {
  return data.Ds_MerchantParameters !== undefined;
}

function isLuggageSubmission(data: any): data is LuggageSubmission {
  return data.action === "submit_luggage";
}

function isPassportSubmission(data: any): data is PassportSubmission {
  return data.action === "submit_passport";
}

function isChoiceUpdate(data: any): data is ChoiceUpdate {
  return data.action === "set_choice";
}

function isClearAllCache(data: any): data is ClearAllCache {
  return data.action === "clear_all_cache";
}

/**
 * Main function to handle POST requests for form submissions and REDSYS TPV callbacks
 */
export async function doPost(
  data:
    | PassportSubmission
    | LuggageSubmission
    | ChoiceUpdate
    | ErrorReport
    | RedsysCallback,
  spreadsheet: SpreadsheetWrapper,
  refresh: boolean
) {
  // Check if this is an error report
  if (isErrorReport(data)) {
    await handleErrorReport(data);
    return {
      success: true,
      message: "Error reported successfully",
    };
  }

  // Check if this is a REDSYS TPV callback
  if (isRedsysCallback(data)) {
    await handleRedsysCallback(data, spreadsheet);
    return {
      success: true,
      message: "OK",
    };
  }

  const email = ((data as AuthenticatedRequest).email || "").trim();
  const password = ((data as AuthenticatedRequest).password || "").trim();
  const rsvpData = await validateCredentials(
    email,
    password,
    spreadsheet,
    refresh
  );

  if (isClearAllCache(data)) {
    if (email !== "tinqueija@gmail.com") {
      return {
        success: false,
        message: "You are not authorized to clear the cache",
      };
    }
    await clearAllCache();
    return {
      success: true,
      message: "All cache cleared successfully",
    };
  }

  // === Luggage submission handler ===
  if (isLuggageSubmission(data)) {
    await saveLuggageSubmission(email, data.luggageSelection, spreadsheet);
    return {
      success: true,
      message: "Luggage selections saved successfully",
    };
  }

  // === Passport submission handler ===
  if (isPassportSubmission(data)) {
    const passport = await savePassportSubmission(
      {
        email,
        passportName: (data.passportName || "").toString().trim(),
        passportNumber: String(data.passportNumber).trim(),
        expiryDate: String(data.expiryDate).trim(),
        birthDate: String(data.birthDate).trim(),
        aAdvantage: (data.aAdvantage || "").toString().trim(),
      },
      spreadsheet
    );

    return {
      success: true,
      message: "Passport details saved successfully",
      passport,
    };
  }

  // Check if this is a choices update request
  if (isChoiceUpdate(data)) {
    await setUserChoice(
      {
        email: data.email,
        password: data.password,
        itemKey: data.itemKey,
        option: data.option,
        choice: data.choice,
      },
      spreadsheet
    );

    return {
      success: true,
      message: "Choices updated successfully",
    };
  }

  // Continue with existing form submission logic
  await saveTripRegistration(
    data as unknown as Record<string, string>,
    spreadsheet,
    refresh
  );

  const emailSubmissionData = await getEmailSubmissionData(
    email,
    spreadsheet,
    refresh,
    rsvpData
  );

  return {
    success: true,
    message: "Registration saved successfully",
    ...emailSubmissionData,
  };
}

/**
 * Handle frontend error reports
 */
async function handleErrorReport(data: ErrorReport) {
  const discordMessage = `🚨 **Frontend Error Report** 🚨
    **Time:** ${data.timestamp}
    **User:** ${data.userId}
    **Page:** ${data.url}
    **Context:** ${data.context}
    **Error:** ${data.errorMessage}
    **Stack:**
    \`\`\`
    ${data.errorStack}
    \`\`\`
    **Browser:** ${data.userAgent}`;

  await discordLog(discordMessage);
}

/**
 * Handle REDSYS TPV payment callback
 */
async function handleRedsysCallback(
  data: {
    Ds_SignatureVersion: string;
    Ds_MerchantParameters: string;
    Ds_Signature: string;
  },
  spreadsheet: SpreadsheetWrapper
) {
  // Extract the required fields from the callback
  const dsSignatureVersion = data.Ds_SignatureVersion || "";
  const dsMerchantParameters = data.Ds_MerchantParameters || "";
  const dsSignature = data.Ds_Signature || "";

  // Decode the Base64 encoded merchant parameters
  let decodedJson = "";
  try {
    //   const decodedBytes = Utilities.base64Decode(dsMerchantParameters);
    //   decodedJson = Utilities.newBlob(decodedBytes).getDataAsString();
    decodedJson = Buffer.from(dsMerchantParameters, "base64").toString("utf-8");
  } catch (decodeError) {
    console.error("Error decoding Ds_MerchantParameters:", decodeError);
    decodedJson = "ERROR: Could not decode Base64 data";
  }

  // Create the payment record
  const paymentRecord = {
    timestamp: new Date().toISOString(),
    decoded_json: decodedJson,
    raw_ds_merchant_parameters: dsMerchantParameters,
    ds_signature_version: dsSignatureVersion,
    ds_signature: dsSignature,
  };

  // Save to TPV PAYMENTS sheet
  await saveToTpvPaymentsSheet(paymentRecord, spreadsheet);
}

/**
 * Save TPV payment data to the TPV PAYMENTS sheet
 */
async function saveToTpvPaymentsSheet(
  paymentRecord: {
    timestamp: string;
    decoded_json: string;
    raw_ds_merchant_parameters: string;
    ds_signature_version: string;
    ds_signature: string;
  },
  spreadsheet: SpreadsheetWrapper
) {
  // Add the payment record
  await spreadsheet.appendRow(TPV_PAYMENTS_SHEET_NAME, paymentRecord);
}

/**
 * Look up RSVP data by email and password
 */
async function lookupRSVP(
  email: string,
  password: string,
  spreadsheet: SpreadsheetWrapper,
  refresh: boolean
) {
  const { headers, rows } = await spreadsheet.getRowsWithHeaders(
    RSVP_SHEET_NAME,
    refresh
  );

  const emailColumnIndex = headers.indexOf("email");
  const passwordColumnIndex = headers.indexOf("PASSWORD");

  for (const row of rows) {
    const rowEmail = row[emailColumnIndex];

    if (
      rowEmail &&
      rowEmail.toString().toLowerCase().trim() === email.toLowerCase()
    ) {
      // Found the email! Now validate the password
      const rowPassword = row[passwordColumnIndex];

      if (!rowPassword || rowPassword.toString().trim() !== password) {
        throw new Error("Invalid password");
      }

      // Password matches! Create object with headers as keys
      const rsvpData: Record<string, string | number | boolean> = {};

      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        const value = row[j] as string | number | boolean;

        // Don't include the password in the returned data for security
        if (header === "PASSWORD" || !header || !value) {
          continue;
        }

        // Convert numeric values to numbers, handle boolean-like values
        if (value === 1 || value === "1") {
          rsvpData[header] = true;
        } else if (value === 0 || value === "0" || value === "") {
          rsvpData[header] = false;
        } else {
          rsvpData[header] = value;
        }
      }

      return rsvpData;
    }
  }

  throw new Error(`Email ${email} not found in RSVP sheet`);
}

/**
 * Get existing submission data for an email from Trip Registrations sheet
 */
async function findExistingSubmission(
  email: string,
  spreadsheet: SpreadsheetWrapper,
  refresh: boolean
) {
  const { headers, rows } = await spreadsheet.getRowsWithHeaders(
    TRIP_REGISTRATIONS_SHEET_NAME,
    refresh
  );

  // Find the email column
  const emailColumnIndex = headers.indexOf("rsvpData.email");

  if (emailColumnIndex === -1) {
    throw new Error(
      "Email column 'rsvpData.email' not found in Trip Registrations sheet"
    );
  }

  // Search for the email in the data rows (skip header row)
  let rowNumber = 2;

  for (const row of rows) {
    const rowEmail = row[emailColumnIndex];

    if (
      rowEmail &&
      rowEmail.toString().toLowerCase().trim() === email.toLowerCase()
    ) {
      // Found the email! Reconstruct the data objects
      const rawData: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        if (!header) {
          throw new Error(`No header for index ${j} found`);
        }
        rawData[header] = row[j] || "";
      }

      return {
        row: rawData,
        rowNumber,
      };
    }

    rowNumber++;
  }

  return null;
}

async function getExistingSubmission(
  email: string,
  spreadsheet: SpreadsheetWrapper,
  refresh: boolean
) {
  const submission = await findExistingSubmission(email, spreadsheet, refresh);
  if (!submission) {
    throw new Error(`email ${email} not found in Trip Registrations sheet`);
  }
  return submission;
}

/**
 * Get passport details for a given email (or null if not found)
 */
async function findPassportDetails(
  email: string,
  spreadsheet: SpreadsheetWrapper,
  refresh: boolean
) {
  const { headers, rows } = await spreadsheet.getRowsWithHeaders(
    PASSPORTS_SHEET_NAME,
    refresh
  );

  const emailIdx = headers.indexOf("email");
  if (emailIdx === -1) return null;
  for (const row of rows) {
    const rowEmail = row[emailIdx];
    if (
      rowEmail &&
      rowEmail.toString().toLowerCase().trim() === email.toLowerCase()
    ) {
      // Build object
      const obj: Record<string, string> = {};
      headers.forEach((h, j) => (obj[h] = row[j] || ""));
      return obj;
    }
  }
  return null;
}

/**
 * Save passport submission. Users can only submit once.
 */
async function savePassportSubmission(
  {
    email,
    passportName,
    passportNumber,
    expiryDate,
    birthDate,
    aAdvantage,
  }: {
    email: string;
    passportName: string;
    passportNumber: string;
    expiryDate: string;
    birthDate: string;
    aAdvantage: string;
  },
  spreadsheet: SpreadsheetWrapper
) {
  if (!passportNumber || !expiryDate || !birthDate) {
    throw new Error(
      `Missing required field: passportNumber, expiryDate, birthDate`
    );
  }
  const { headers, rows } =
    await spreadsheet.getRowsWithHeaders(PASSPORTS_SHEET_NAME);

  const emailIdx = headers.indexOf("email");
  for (const row of rows) {
    const rowEmail = row[emailIdx];
    if (
      rowEmail &&
      rowEmail.toString().toLowerCase().trim() === email.toLowerCase()
    ) {
      throw new Error(
        `Email ${email} already exists in PASSPORTS sheet. Please contact Maddie for assistance.`
      );
    }
  }

  const rowObject: Record<string, string> = {
    timestamp: new Date().toISOString(),
    email: email,
    passportName: passportName || "",
    passportNumber: passportNumber,
    expiryDate: expiryDate,
    birthDate: birthDate,
    aAdvantage: aAdvantage || "",
  };

  await spreadsheet.appendRow(PASSPORTS_SHEET_NAME, rowObject);

  // Clear Trip Registrations cache since passport data affects pricing calculations
  // await spreadsheet.clearTripRegistrationCache();

  return rowObject;
}

/**
 * Get luggage selections for a given email (or null if not found)
 */
async function findLuggageDetails(
  email: string,
  spreadsheet: SpreadsheetWrapper,
  refresh: boolean
) {
  const { rows, headers } = await spreadsheet.getRowsWithHeaders(
    LUGGAGE_SHEET_NAME,
    refresh
  );

  const emailIdx = headers.indexOf("email");
  if (emailIdx === -1) {
    throw new Error("Email column 'email' not found in LUGGAGE sheet");
  }

  for (const row of rows) {
    const rowEmail = row[emailIdx];
    if (
      rowEmail &&
      rowEmail.toString().toLowerCase().trim() === email.trim().toLowerCase()
    ) {
      const obj: Record<string, string | boolean> = {};
      headers.forEach((h, j) => (obj[h] = row[j] || ""));
      obj["AEP-BRC"] = obj["AEP-BRC"] === "1" ? true : false;
      obj["BRC-MDZ"] = obj["BRC-MDZ"] === "1" ? true : false;
      obj["MDZ-AEP"] = obj["MDZ-AEP"] === "1" ? true : false;
      return obj;
    }
  }
  return null;
}

/**
 * Save luggage submission. Overwrites existing row for the email if present.
 */
async function saveLuggageSubmission(
  email: string,
  luggageSelection: Record<string, boolean>,
  spreadsheet: SpreadsheetWrapper
) {
  const { headers, rows } =
    await spreadsheet.getRowsWithHeaders(LUGGAGE_SHEET_NAME);

  const emailIdx = headers.indexOf("email");
  for (const row of rows) {
    const rowEmail = row[emailIdx];
    if (
      rowEmail &&
      rowEmail.toString().toLowerCase().trim() === email.toLowerCase()
    ) {
      throw new Error(
        `Email ${email} already exists in LUGGAGE sheet. Please contact Maddie for assistance.`
      );
    }
  }

  const luggagePricePerFlight = 25;

  const rowObject: Record<string, string | number> = {
    timestamp: new Date().toISOString(),
    email,
    "AEP-BRC": luggageSelection?.["AEP-BRC"] ? luggagePricePerFlight : 0,
    "BRC-MDZ": luggageSelection?.["BRC-MDZ"] ? luggagePricePerFlight : 0,
    "MDZ-AEP": luggageSelection?.["MDZ-AEP"] ? luggagePricePerFlight : 0,
  };

  await spreadsheet.appendRow(LUGGAGE_SHEET_NAME, rowObject);

  // Clear Trip Registrations cache since luggage data affects pricing calculations
  await spreadsheet.clearTripRegistrationCache();
}

/**
 * Check if email already exists in the trip registrations sheet
 */
async function emailExists(
  email: string,
  spreadsheet: SpreadsheetWrapper,
  refresh: boolean
) {
  const { headers, rows } = await spreadsheet.getRowsWithHeaders(
    TRIP_REGISTRATIONS_SHEET_NAME,
    refresh
  );

  // find the index of the email column
  const emailColumnIndex = headers.indexOf("rsvpData.email");

  // If email column not found, return false (can't check duplicates)
  if (emailColumnIndex === -1) {
    throw new Error(
      "Email column 'rsvpData.email' not found in Trip Registrations sheet"
    );
  }

  // Check if the email already exists
  for (const row of rows) {
    // Start from row 2 (skip header)
    const rowEmail = row[emailColumnIndex];
    if (rowEmail && rowEmail.toLowerCase() === email.toLowerCase()) {
      return true;
    }
  }

  return false;
}

/**
 * Save processed data to Google Sheet
 */
async function saveTripRegistration(
  data: Record<string, string>,
  spreadsheet: SpreadsheetWrapper,
  refresh: boolean
) {
  const email = data["rsvpData.email"];

  if (!email) {
    throw new Error("Email not found in data");
  }

  // Check if email already exists (primary key constraint)
  if (await emailExists(email, spreadsheet, refresh)) {
    throw new Error(
      `Email ${data["rsvpData.email"]} has already been registered for this trip.`
    );
  }

  await spreadsheet.appendRow(TRIP_REGISTRATIONS_SHEET_NAME, data);
}

export const PRICES = {
  rafting: 130,
  circuitoChico: 100,
  tango: 25,
  valleDeUco: 40,
};

/**
 * Get timeline data from TIMELINE sheet
 * Returns an array of objects where keys are headers and values are row data
 */
async function getTimelineData(
  spreadsheet: SpreadsheetWrapper,
  refresh: boolean
) {
  const { rows, headers } = await spreadsheet.getRowsWithHeaders(
    TIMELINE_SHEET_NAME,
    refresh
  );

  // Convert data rows to objects
  const timelineData = [];
  let i = 1;
  for (const row of rows) {
    const rowObject: Record<string, string | number | null> = {};

    // Map each column value to its corresponding header
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];

      if (!header) {
        throw new Error("No header found");
      }

      rowObject[header] = row[j] || null;
    }

    rowObject["id"] = i;
    i++;
    timelineData.push(rowObject);
  }

  return {
    success: true,
    data: timelineData,
  };
}

/**
 * Get user choices from CHOICES sheet
 */
async function getUserChoices(
  email: string,
  spreadsheet: SpreadsheetWrapper,
  refresh: boolean
): Promise<Record<string, string>> {
  const { headers, rows } = await spreadsheet.getRowsWithHeaders(
    CHOICES_SHEET_NAME,
    refresh
  );

  // Find the required columns
  const emailColumnIndex = headers.indexOf("email");
  const itemKeyColumnIndex = headers.indexOf("itemKey");
  const choiceColumnIndex = headers.indexOf("choice");
  const optionColumnIndex = headers.indexOf("option");

  if (
    emailColumnIndex === -1 ||
    itemKeyColumnIndex === -1 ||
    choiceColumnIndex === -1 ||
    optionColumnIndex === -1
  ) {
    throw new Error("Required columns not found in CHOICES sheet");
  }

  // Build choices object for this user, keeping only the latest choice for each itemKey
  const userChoices: Record<string, string> = {};
  const latestChoices = new Map(); // itemKey -> {choice, counter}

  // Search for the user's choices in the data rows (skip header row)
  for (const row of rows) {
    const rowEmail = row[emailColumnIndex];
    const itemKey = row[itemKeyColumnIndex];
    const option = row[optionColumnIndex];
    const choice = row[choiceColumnIndex];

    if (
      rowEmail &&
      rowEmail.toString().toLowerCase().trim() === email.toLowerCase() &&
      itemKey &&
      choice &&
      option
    ) {
      // Check if this is the latest choice for this itemKey
      const existing = latestChoices.get(`${itemKey}-${option}`);
      if (!existing) {
        latestChoices.set(`${itemKey}-${option}`, { choice });
      }
    }
  }

  // Convert latest choices to the expected format
  for (const [itemKey, { choice }] of latestChoices) {
    userChoices[itemKey] = choice;
  }

  return userChoices;
}

/**
 * Update user choices in CHOICES sheet (event-sourced)
 */
async function setUserChoice(
  data: {
    email: string;
    password: string;
    itemKey: string;
    option: string;
    choice: string;
  },
  spreadsheet: SpreadsheetWrapper
) {
  // Validate required fields
  if (
    !data.email ||
    !data.password ||
    !data.itemKey ||
    !data.option ||
    !data.choice
  ) {
    throw new Error("Email, password, itemKey, and choice are required");
  }

  const { headers, rows } =
    await spreadsheet.getRowsWithHeaders(CHOICES_SHEET_NAME);

  if (
    rows.find((row) => {
      return (
        row[headers.indexOf("email")] === data.email.toLowerCase().trim() &&
        row[headers.indexOf("itemKey")] === data.itemKey.toLowerCase().trim() &&
        row[headers.indexOf("option")] === data.option.toLowerCase().trim()
      );
    })
  ) {
    throw new Error(
      `Choice already exists for ${data.email} ${data.itemKey} ${data.option}`
    );
  }

  let val;
  switch (data.itemKey.toLowerCase().trim()) {
    case "valle-de-uco-activity":
      val = PRICES.valleDeUco;
      break;
    case "bariloche-activity":
      if (data.option.toLowerCase().trim() === "rafting") {
        val = PRICES.rafting;
      } else {
        val = PRICES.circuitoChico;
      }
      break;
    case "tango-night":
      val = PRICES.tango;
      break;
    default:
      throw new Error(`Unknown itemKey: ${data.itemKey}`);
  }

  // Add new choice event (always insert, never update)
  const timestamp = new Date().toISOString();
  const rowObject: Record<string, string | number> = {
    timestamp,
    email: data.email.toLowerCase().trim(),
    itemKey: data.itemKey.toLowerCase().trim(),
    option: data.option.toLowerCase().trim(),
    choice: data.choice.toLowerCase().trim(),
    value: data.choice === "yes" ? val : 0,
  };

  await spreadsheet.appendRow(CHOICES_SHEET_NAME, rowObject);

  // Clear Trip Registrations cache since choices data affects pricing calculations
  await spreadsheet.clearTripRegistrationCache();

  // Check if user completed all choices and add them to COMPLETED CHOICES sheet if they did
  try {
    await addUserToCompletedChoicesIfComplete(spreadsheet, data.email, false);
  } catch (error) {
    console.error("Error updating completed choices sheet:", error);
    // Don't throw - we don't want to fail the choice save if this update fails

    // Notify error via Discord (already has internal try-catch, safe to call)
    await discordErrorLog(
      `Error updating COMPLETED CHOICES sheet after choice save for ${data.email}`,
      error
    );
  }
}

async function getVoucherFile(
  email: string,
  spreadsheet: SpreadsheetWrapper,
  refresh: boolean
): Promise<{
  file: drive_v3.Schema$File;
  rowId: number;
}> {
  const existingSubmission = await getExistingSubmission(
    email.trim(),
    spreadsheet,
    refresh
  );

  if (!existingSubmission || !existingSubmission.rowNumber) {
    throw new Error(`No registration found for ${email}`);
  }

  const rowId = existingSubmission.rowNumber;
  const fileName = `arg-trip-voucher-${rowId}.pdf`;
  const folderId = "1QuSXGvECgYCM2HeVwGDzEJkcRkACda4X";

  const drive = await getGoogleDriveApi();

  const res = await drive.files.list({
    q: `'${folderId}' in parents and name='${fileName}' and trashed=false`,
    fields: "files(id, name, mimeType)",
  });

  const file = res.data.files?.[0];
  if (!file) {
    throw new Error(`Voucher PDF not found (${fileName})`);
  }

  return {
    file,
    rowId,
  };
}

async function downloadVoucher(
  email: string,
  spreadsheet: SpreadsheetWrapper,
  refresh: boolean
) {
  // Get voucher file
  const voucherResult = await getVoucherFile(email, spreadsheet, refresh);

  const drive = await getGoogleDriveApi();

  // Get file content (binary)
  const res = await drive.files.get(
    {
      fileId: voucherResult.file.id!,
      alt: "media",
    },
    { responseType: "arraybuffer" }
  );

  const fileBuffer = Buffer.from(res.data as ArrayBuffer);
  const base64Data = fileBuffer.toString("base64");

  return {
    success: true,
    fileName: `arg-trip-voucher-${voucherResult.rowId}.pdf`,
    fileData: base64Data,
    mimeType: "application/pdf",
  };
}

/**
 * Check if a specific user has completed all choices and add them to COMPLETED CHOICES sheet if they have
 * This is optimized to only check and update one user instead of rebuilding the entire sheet
 */
async function addUserToCompletedChoicesIfComplete(
  spreadsheet: SpreadsheetWrapper,
  email: string,
  refresh: boolean
) {
  const COMPLETED_CHOICES_SHEET_NAME = "COMPLETED CHOICES";
  const normalizedEmail = email.toLowerCase().trim();

  // Get user's registration data
  const { rows: regsRows, headers } = await spreadsheet.getRowsWithHeaders(
    TRIP_REGISTRATIONS_SHEET_NAME,
    refresh
  );

  const emailIdx = headers.indexOf("rsvpData.email");
  const raftingIdx = headers.indexOf("formData.rafting");
  const tangoIdx = headers.indexOf("formData.tango");

  if (emailIdx === -1) {
    throw new Error("Email column not found in Trip Registrations");
  }

  // Find user's registration
  const userReg = regsRows.find(
    (row) => row[emailIdx]?.toString().toLowerCase().trim() === normalizedEmail
  );

  if (!userReg) {
    console.log(`User ${email} not found in Trip Registrations`);
    return;
  }

  // Get user's choices
  const userChoices = await getUserChoices(email, spreadsheet, refresh);

  const formData = {
    rafting: userReg[raftingIdx]?.toString() || "false",
    tango: userReg[tangoIdx]?.toString() || "false",
  };

  // Check if user has answered all choices
  const hasCompleted = hasAnsweredAllChoices(userChoices, formData);

  if (!hasCompleted) {
    console.log(`User ${email} has not completed all choices`);
    return;
  }

  // Check if user is already in COMPLETED CHOICES sheet
  const { rows: completedRows, headers: completedHeaders } =
    await spreadsheet.getRowsWithHeaders(COMPLETED_CHOICES_SHEET_NAME, true);

  const completedEmailIdx = completedHeaders.indexOf("Email") !== -1
    ? completedHeaders.indexOf("Email")
    : completedHeaders.indexOf("email");

  if (completedEmailIdx === -1) {
    throw new Error("Email column not found in COMPLETED CHOICES sheet");
  }

  const alreadyExists = completedRows.some(
    (row) =>
      row[completedEmailIdx]?.toString().toLowerCase().trim() ===
      normalizedEmail
  );

  if (alreadyExists) {
    console.log(`User ${email} already in COMPLETED CHOICES sheet`);
    return;
  }

  // Add user to COMPLETED CHOICES sheet
  const sheets = await getGoogleSheetsApi();
  await sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheet.spreadsheetId,
    range: `${COMPLETED_CHOICES_SHEET_NAME}!A:A`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[normalizedEmail]],
    },
  });

  console.log(`Added ${email} to COMPLETED CHOICES sheet`);
}

/**
 * Internal function to update the COMPLETED CHOICES sheet
 * This iterates over all trip registrations, skipping those already present,
 * and appends any users who have completed choices
 */
async function updateCompletedChoicesSheetInternal(
  spreadsheet: SpreadsheetWrapper,
  refresh: boolean
) {
  const COMPLETED_CHOICES_SHEET_NAME = "COMPLETED CHOICES";

  // Get existing completed choices to skip those already in the sheet
  const { rows: completedRows, headers: completedHeaders } =
    await spreadsheet.getRowsWithHeaders(COMPLETED_CHOICES_SHEET_NAME, true);

  const completedEmailIdx = completedHeaders.indexOf("Email") !== -1
    ? completedHeaders.indexOf("Email")
    : completedHeaders.indexOf("email");

  if (completedEmailIdx === -1) {
    throw new Error("Email column not found in COMPLETED CHOICES sheet");
  }

  // Build set of emails already in completed choices
  const alreadyCompletedEmails = new Set(
    completedRows.map((row) =>
      row[completedEmailIdx]?.toString().toLowerCase().trim()
    )
  );

  // Get all trip registrations
  const { rows: regsRows, headers } = await spreadsheet.getRowsWithHeaders(
    TRIP_REGISTRATIONS_SHEET_NAME,
    refresh
  );

  const emailIdx = headers.indexOf("rsvpData.email");
  const raftingIdx = headers.indexOf("formData.rafting");
  const tangoIdx = headers.indexOf("formData.tango");

  if (emailIdx === -1) {
    throw new Error("Email column not found in Trip Registrations");
  }

  let addedCount = 0;

  // Check each registration to see if they've completed all choices
  for (const row of regsRows) {
    const userEmail = row[emailIdx]?.toString().toLowerCase().trim();

    if (!userEmail) continue;

    // Skip if already in completed choices
    if (alreadyCompletedEmails.has(userEmail)) {
      continue;
    }

    try {
      // Get user's choices
      const userChoices = await getUserChoices(userEmail, spreadsheet, refresh);

      const formData = {
        rafting: row[raftingIdx]?.toString() || "false",
        tango: row[tangoIdx]?.toString() || "false",
      };

      // Check if user has answered all choices
      const hasCompleted = hasAnsweredAllChoices(userChoices, formData);

      if (hasCompleted) {
        // Append to COMPLETED CHOICES sheet
        const sheets = await getGoogleSheetsApi();
        await sheets.spreadsheets.values.append({
          spreadsheetId: spreadsheet.spreadsheetId,
          range: `${COMPLETED_CHOICES_SHEET_NAME}!A:A`,
          valueInputOption: "RAW",
          requestBody: {
            values: [[userEmail]],
          },
        });
        addedCount++;
        console.log(`Added ${userEmail} to COMPLETED CHOICES sheet`);
      }
    } catch (error) {
      console.error(`Error processing ${userEmail}:`, error);
      // Continue with other users
    }
  }

  return {
    success: true,
    count: addedCount,
    message: `Successfully added ${addedCount} new emails to ${COMPLETED_CHOICES_SHEET_NAME}`,
  };
}

/**
 * Update the COMPLETED CHOICES sheet with emails of users who have completed all choices (admin only)
 * This is the public API with authentication
 */
async function updateCompletedChoicesSheet(
  spreadsheet: SpreadsheetWrapper,
  email: string,
  refresh: boolean
) {
  // Check admin access
  if (email.trim().toLowerCase() !== "tinqueija@gmail.com") {
    throw new Error(
      "Unauthorized: Only tinqueija@gmail.com can access this endpoint"
    );
  }

  return await updateCompletedChoicesSheetInternal(spreadsheet, refresh);
}

/**
 * Helper functions for checking if user has answered all choices
 * Ported from frontend src/utils/choiceAnswers.js
 */
const CHOICE_KEYS = {
  tango: "tango-night-tango",
  barilocheCircuito: "bariloche-activity-circuitochico",
  barilocheRafting: "bariloche-activity-rafting",
  valleDeUcoHorse: "valle-de-uco-activity-horse",
  valleDeUcoWalking: "valle-de-uco-activity-walking",
};

function hasAnsweredTango(
  userChoices: Record<string, string>,
  formData: { tango: string }
): boolean {
  const checkedOutTango =
    formData.tango.toString().trim().toLowerCase() === "true";
  return checkedOutTango || Boolean(userChoices[CHOICE_KEYS.tango]);
}

function hasAnsweredBariloche(
  userChoices: Record<string, string>,
  formData: { rafting: string }
): boolean {
  const checkedOutRafting =
    formData.rafting.toString().trim().toLowerCase() === "true";

  return (
    checkedOutRafting ||
    userChoices[CHOICE_KEYS.barilocheCircuito] === "yes" ||
    userChoices[CHOICE_KEYS.barilocheRafting] === "yes" ||
    (userChoices[CHOICE_KEYS.barilocheCircuito] === "no" &&
      userChoices[CHOICE_KEYS.barilocheRafting] === "no")
  );
}

function hasAnsweredValleDeUco(userChoices: Record<string, string>): boolean {
  return (
    userChoices[CHOICE_KEYS.valleDeUcoHorse] === "yes" ||
    userChoices[CHOICE_KEYS.valleDeUcoWalking] === "yes" ||
    (userChoices[CHOICE_KEYS.valleDeUcoHorse] === "no" &&
      userChoices[CHOICE_KEYS.valleDeUcoWalking] === "no")
  );
}

function hasAnsweredAllChoices(
  userChoices: Record<string, string>,
  formData: { tango: string; rafting: string }
): boolean {
  return (
    hasAnsweredTango(userChoices, formData) &&
    hasAnsweredBariloche(userChoices, formData) &&
    hasAnsweredValleDeUco(userChoices)
  );
}

// --- Payment Link Creation ---

/*
    let paymentLinkData = null;

    let paymentLinkError = null;
    if (data["formData.paymentMethod"] === "credit") {
      paymentLinkData = createPaymentLinkOrderForRow(
        data,
        sheet.getLastRow() + 1
      );

      // Log the attempt to the PAYMENTLINKSDB sheet
      saveToPaymentLinksSheet({
        timestamp: new Date().toISOString(),
        email: data["formData.email"],
        link: paymentLinkData ? paymentLinkData.urlPaygold : "",
        jsonResponse: paymentLinkData ? JSON.stringify(paymentLinkData) : "",
        status: paymentLinkData ? "success" : "failed",
        error: paymentLinkError ? paymentLinkError.toString() : "",
      });
    }
    // --- End Payment Link Creation ---

    // Add row to sheet using the hardcoded header order
    const finalValues = headers.map((header) => {
      if (header === "paymentLink.url") {
        return paymentLinkData ? paymentLinkData.urlPaygold : "";
      }
      return data[header] || "";
    });
    */

// /**
//  * Ensure Luggage sheet exists with correct headers. Return the sheet.
//  */
// async function ensureLuggageSheet() {
//   const spreadsheet = await getSpreadsheet();
//   let sheet = await spreadsheet.findSheetByName(LUGGAGE_SHEET_NAME);
//   if (!sheet) {
//     sheet = await spreadsheet.insertSheet(LUGGAGE_SHEET_NAME);
//     const headers = ["timestamp", "email", "AEP-BRC", "BRC-MDZ", "MDZ-AEP"];
//     await sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
//   }

//   return sheet;
// }

/**
//  * Ensure PASSPORTS sheet exists with correct headers. Return the sheet.
//  */
// async function ensurePassportsSheet() {
//   const spreadsheet = await getSpreadsheet();
//   const sheet = await spreadsheet.getOrCreateSheet(PASSPORTS_SHEET_NAME);

//   // Headers we expect
//   const headers = [
//     "timestamp",
//     "email",
//     "passportName",
//     "passportNumber",
//     "expiryDate",
//     "birthDate",
//     "aAdvantage",
//   ];

//   if ((await sheet.getLastRow()) === 0) {
//     sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
//   }

//   return sheet;
// }
