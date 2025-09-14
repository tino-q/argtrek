import * as fs from "fs";
import { drive_v3 } from "@googleapis/drive";

import {
  getGoogleDriveApi,
  getSpreadsheet,
  type SheetWrapper,
} from "./spreadsheet";

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
async function validateCredentials(email: string, password: string) {
  if (!email) {
    return {
      success: false,
      error: "Email is required.",
    };
  }

  if (!password) {
    return {
      success: false,
      error: "Password is required.",
    };
  }

  const rsvpResult = await lookupRSVP(email.trim(), password.trim());

  if (!rsvpResult.success) {
    return {
      success: false,
      error: rsvpResult.error,
    };
  }

  return {
    success: true,
    rsvpData: rsvpResult.data,
  };
}

/**
 * Handle GET requests for RSVP lookup and timeline data
 */
export async function doGet(e: {
  parameter: { endpoint: string; email: string; password: string };
}) {
  // Check if this is a timeline request
  if (e.parameter.endpoint === "timeline") {
    return getTimelineData();
  }

  // Check if this is a rafting registrations count request
  if (e.parameter.endpoint === "rafting_count") {
    return getRaftingRegistrationsCount();
  }

  if (e.parameter.endpoint === "download_voucher") {
    return downloadVoucher(e.parameter.email, e.parameter.password);
  }

  const email = e.parameter.email;
  const password = e.parameter.password;

  const validation = await validateCredentials(email, password);
  if (!validation.success) {
    return validation.error;
  }

  // Check if there's an existing submission for this email
  const existingSubmission = await getExistingSubmission(email.trim());

  // Look up passport details for this traveler
  const passportDetails = await getPassportDetails(email.trim());

  // Look up luggage selections for this traveler
  const luggageDetails = await getLuggageDetails(email.trim());

  // Look up user choices for this traveler
  const userChoices = await getUserChoices(email.trim());

  const responseData = {
    rsvpData: validation.rsvpData,
    row: existingSubmission?.row || null,
    rowNumber: existingSubmission?.rowNumber || null,
    passport: passportDetails || null,
    luggageSelection: luggageDetails || null,
    userChoices: userChoices || {},
  };

  return {
    success: true,
    data: responseData,
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
async function getRaftingRegistrationsCount() {
  const spreadsheet = await getSpreadsheet();

  // --- Load CHOICES latest per email for rafting ---
  const choicesSheet = await spreadsheet.getSheetByName(CHOICES_SHEET_NAME);
  const latestChoiceByEmail: Record<string, string> = {};
  if (choicesSheet && (await choicesSheet.getLastRow()) >= 2) {
    const values = await (await choicesSheet.getDataRange()).getValues();
    const headers = values[0];
    if (!headers) {
      throw new Error("Headers not found");
    }
    const emailIdx = headers.indexOf("email");
    const itemKeyIdx = headers.indexOf("itemKey");
    const choiceIdx = headers.indexOf("choice");
    const counterIdx = headers.indexOf("counter");

    if (
      emailIdx !== -1 &&
      itemKeyIdx !== -1 &&
      choiceIdx !== -1 &&
      counterIdx !== -1
    ) {
      // Track highest counter per email for rafting
      const maxCounterByEmail: Record<string, number> = {};
      for (let i = 1; i < values.length; i++) {
        const row = values[i];

        if (!row) {
          throw new Error("Row not found");
        }

        const email = (row[emailIdx] || "").toString().toLowerCase().trim();
        const itemKey = (row[itemKeyIdx] || "").toString().trim();
        if (!email || itemKey !== "rafting") continue;
        const choiceVal = (row[choiceIdx] || "")
          .toString()
          .toLowerCase()
          .trim();
        const counterVal = parseInt(row[counterIdx] || "") || 0;
        if (
          maxCounterByEmail[email] === undefined ||
          counterVal > maxCounterByEmail[email]
        ) {
          maxCounterByEmail[email] = counterVal;
          latestChoiceByEmail[email] = choiceVal; // 'yes' or 'no'
        }
      }
    }
  }

  // --- Load Trip Registrations formData.rafting ---
  const regsSheet = await spreadsheet.getSheetByName(
    TRIP_REGISTRATIONS_SHEET_NAME
  );
  const formRaftingByEmail: Record<string, boolean> = {};
  if (regsSheet && (await regsSheet.getLastRow()) >= 2) {
    const values = await (await regsSheet.getDataRange()).getValues();
    const headers = values[0];
    if (!headers) {
      throw new Error("Headers not found");
    }
    const emailIdx = headers.indexOf("rsvpData.email");
    const raftingIdx = headers.indexOf("formData.rafting");
    if (emailIdx !== -1 && raftingIdx !== -1) {
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (!row) {
          throw new Error("Row not found");
        }
        const email = (row[emailIdx] || "").toString().toLowerCase().trim();
        if (!email) continue;
        const raftingVal = row[raftingIdx];
        // Normalize truthy values: true boolean, 'true', 'yes', '1', 'x'
        let isTrue = false;
        if (typeof raftingVal === "boolean") {
          isTrue = raftingVal;
        } else if (typeof raftingVal === "string") {
          const v = raftingVal.toLowerCase().trim();
          isTrue = v === "true" || v === "yes" || v === "1" || v === "x";
        } else if (typeof raftingVal === "number") {
          isTrue = raftingVal === 1;
        }
        formRaftingByEmail[email] = Boolean(isTrue);
      }
    }
  }

  // --- Combine with precedence to CHOICES ---
  const emailSet = new Set([
    ...Object.keys(formRaftingByEmail),
    ...Object.keys(latestChoiceByEmail),
  ]);

  let count = 0;
  for (const email of emailSet) {
    if (latestChoiceByEmail[email] !== undefined) {
      if (latestChoiceByEmail[email] === "yes") count++;
    } else if (formRaftingByEmail[email]) {
      count++;
    }
  }

  return {
    success: true,
    count: count,
  };
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
  action: "update_choices";
  itemKey: string;
  option: string;
  choice: string;
};

type RedsysCallback = {
  action: undefined;
  Ds_SignatureVersion: string;
  Ds_MerchantParameters: string;
  Ds_Signature: string;
};

/**
 * Main function to handle POST requests for form submissions and REDSYS TPV callbacks
 */
export async function doPost(
  data: PassportSubmission | LuggageSubmission | ChoiceUpdate | RedsysCallback
) {
  // === Luggage submission handler ===
  if (data.action === "submit_luggage") {
    // Required: email, password, chosen (JSON object mapping flight codes to boolean)
    const email = (data.email || "").trim();
    const password = (data.password || "").trim();
    const validation = await validateCredentials(email, password);
    if (!validation.success) {
      return validation.error;
    }

    const result = saveLuggageSubmission({
      email,
      luggageSelection: data.luggageSelection,
    });

    return result;
  }

  // === Passport submission handler ===
  if (data.action === "submit_passport") {
    // Required: email, password, passportNumber, expiryDate, birthDate
    const email = (data.email || "").trim();
    const password = (data.password || "").trim();
    const validation = await validateCredentials(email, password);
    if (!validation.success) {
      return validation.error;
    }

    if (!data.passportNumber || !data.expiryDate || !data.birthDate) {
      return JSON.stringify({
        success: false,
        error: `Missing required field: passportNumber, expiryDate, birthDate`,
      });
    }

    const result = savePassportSubmission({
      email,
      passportName: (data.passportName || "").toString().trim(),
      passportNumber: String(data.passportNumber).trim(),
      expiryDate: String(data.expiryDate).trim(),
      birthDate: String(data.birthDate).trim(),
      aAdvantage: (data.aAdvantage || "").toString().trim(),
    });

    return result;
  }

  // Check if this is a choices update request
  if (data.action === "update_choices") {
    return updateUserChoices({
      email: data.email,
      password: data.password,
      itemKey: data.itemKey,
      option: data.option,
      choice: data.choice,
    });
  }

  // Check if this is a REDSYS TPV callback
  if (data.Ds_MerchantParameters) {
    return await handleRedsysCallback(data);
  }

  // Continue with existing form submission logic
  const result = await saveToSheet(data as unknown as Record<string, string>);

  if (result.success) {
    return {
      success: true,
      message: "Registration saved successfully",
      rowNumber: result.rowNumber,
    };
  } else {
    // Use the specific error message from saveToSheet instead of generic message
    throw new Error(result.error || "Failed to save to sheet");
  }
}

/**
 * Handle REDSYS TPV payment callback
 */
async function handleRedsysCallback(data: {
  Ds_SignatureVersion: string;
  Ds_MerchantParameters: string;
  Ds_Signature: string;
}) {
  console.log("Processing REDSYS TPV callback");

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
  const result = await saveToTpvPaymentsSheet(paymentRecord);

  if (result.success) {
    console.log(
      "REDSYS callback processed successfully, row:",
      result.rowNumber
    );

    // Return HTTP 200 OK to REDSYS to confirm receipt
    return {
      success: true,
      message: "OK",
    };
  } else {
    throw new Error(result.error || "Failed to save TPV payment data");
  }
}

/**
 * Save TPV payment data to the TPV PAYMENTS sheet
 */
async function saveToTpvPaymentsSheet(paymentRecord: {
  timestamp: string;
  decoded_json: string;
  raw_ds_merchant_parameters: string;
  ds_signature_version: string;
  ds_signature: string;
}) {
  try {
    const spreadsheet = await getSpreadsheet();
    const sheet = await spreadsheet.getOrCreateSheet(TPV_PAYMENTS_SHEET_NAME);

    // Define the headers (fixed structure)
    const headers = [
      "timestamp",
      "decoded_json",
      "raw_ds_merchant_parameters",
      "ds_signature_version",
      "ds_signature",
    ];

    // Check if this is the first row (no data yet)
    if ((await sheet.getLastRow()) === 0) {
      // Add headers
      await sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

      // Format header row
      //   const headerRange = sheet.getRange(1, 1, 1, headers.length);
      //   await headerRange.setFontWeight("bold");
      //   await headerRange.setBackground("#f0f0f0");

      console.log("Added headers to TPV PAYMENTS sheet");
    }

    // Prepare the values in the same order as headers
    const values = [
      paymentRecord.timestamp,
      paymentRecord.decoded_json,
      paymentRecord.raw_ds_merchant_parameters,
      paymentRecord.ds_signature_version,
      paymentRecord.ds_signature,
    ];

    // Add the payment record
    sheet.appendRow(values);
    const rowNumber = sheet.getLastRow();

    console.log("TPV payment record saved to row:", rowNumber);

    return {
      success: true,
      rowNumber: rowNumber,
    };
  } catch (error) {
    console.error("Error saving TPV payment data:", error);
    return {
      success: false,
      error: (error as { message: string }).message,
    };
  }
}

/**
 * Look up RSVP data by email and password
 */
async function lookupRSVP(email: string, password: string) {
  try {
    const spreadsheet = await getSpreadsheet();
    const sheet = await spreadsheet.getSheetByName(RSVP_SHEET_NAME);

    if (!sheet) {
      return {
        success: false,
        error:
          "RSVP data sheet not found. Please contact Maddie for assistance.",
      };
    }

    // Get all data from the sheet
    const dataRange = await sheet.getDataRange();
    const values = await dataRange.getValues();

    if (values.length < 2) {
      return {
        success: false,
        error: "No RSVP data available. Please contact Maddie for assistance.",
      };
    }

    // Get headers (first row)
    const headers = values[0];

    if (!headers) {
      throw new Error(
        "No headers found in RSVP data. Please contact Maddie for assistance."
      );
    }

    // Find the email column using the actual column name
    const emailColumnIndex = headers.indexOf("email");

    if (emailColumnIndex === -1) {
      console.error("Email column not found. Available headers:", headers);
      return {
        success: false,
        error:
          "Email column not found in RSVP data. Please contact Maddie for assistance.",
      };
    }

    // Find the password column
    const passwordColumnIndex = headers.indexOf("PASSWORD");

    if (passwordColumnIndex === -1) {
      console.error("Password column not found. Available headers:", headers);
      return {
        success: false,
        error:
          "Password column not found in RSVP data. Please contact Maddie for assistance.",
      };
    }

    // Search for the email in the data rows (skip header row)
    for (const row of values.slice(1)) {
      const rowEmail = row[emailColumnIndex];

      if (
        rowEmail &&
        rowEmail.toString().toLowerCase().trim() === email.toLowerCase()
      ) {
        // Found the email! Now validate the password
        const rowPassword = row[passwordColumnIndex];

        if (!rowPassword || rowPassword.toString().trim() !== password) {
          return {
            success: false,
            error:
              "Invalid password. Please check your password or contact Maddie on WhatsApp for assistance.",
          };
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

        return {
          success: true,
          data: rsvpData,
        };
      }
    }

    // Email not found
    return {
      success: false,
      error:
        "Email not found in our RSVP database. Please check your email address or contact Maddie on WhatsApp for assistance.",
    };
  } catch (error) {
    console.error("Error in lookupRSVP:", error);
    return {
      success: false,
      error:
        "Unable to retrieve RSVP data. Please contact Maddie for assistance.",
    };
  }
}

/**
 * Get existing submission data for an email from Trip Registrations sheet
 */
async function getExistingSubmission(email: string) {
  const spreadsheet = await getSpreadsheet();
  const sheet = await spreadsheet.getSheetByName(TRIP_REGISTRATIONS_SHEET_NAME);

  if (!sheet || (await sheet.getLastRow()) <= 1) {
    return null;
  }

  // Get all data from the sheet
  const dataRange = await sheet.getDataRange();
  const values = await dataRange.getValues();

  // Get headers (first row)
  const headers = values[0];

  if (!headers) {
    throw new Error(
      "No headers found in Trip Registrations sheet. Please contact Maddie for assistance."
    );
  }

  // Find the email column
  const emailColumnIndex = headers.indexOf("rsvpData.email");

  if (emailColumnIndex === -1) {
    throw new Error(
      "Email column 'rsvpData.email' not found in Trip Registrations sheet"
    );
  }

  // Search for the email in the data rows (skip header row)
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row) {
      throw new Error("No row found");
    }
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
          fs.writeFileSync("headers.txt", JSON.stringify(headers, null, 2));
          throw new Error(" no header found");
        }
        rawData[header] = row[j] || "";
      }

      return {
        row: rawData,
        rowNumber: i + 1, // +1 because sheet rows are 1-indexed
      };
    }
  }

  throw new Error(`email ${email} not found in Trip Registrations sheet`);
}

/**
 * Ensure PASSPORTS sheet exists with correct headers. Return the sheet.
 */
async function ensurePassportsSheet() {
  const spreadsheet = await getSpreadsheet();
  const sheet = await spreadsheet.getOrCreateSheet(PASSPORTS_SHEET_NAME);

  // Headers we expect
  const headers = [
    "timestamp",
    "email",
    "passportName",
    "passportNumber",
    "expiryDate",
    "birthDate",
    "aAdvantage",
  ];

  if ((await sheet.getLastRow()) === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return sheet;
}

/**
 * Get passport details for a given email (or null if not found)
 */
async function getPassportDetails(email: string) {
  try {
    const sheet = await ensurePassportsSheet();
    if ((await sheet.getLastRow()) < 2) return null;

    const data = await (await sheet.getDataRange()).getValues();
    const headers = data[0];

    if (!headers) {
      throw new Error(
        "No headers found in PASSPORTS sheet. Please contact Maddie for assistance."
      );
    }

    const emailIdx = headers.indexOf("email");
    if (emailIdx === -1) return null;
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      if (!row) {
        throw new Error("No row found");
      }

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
  } catch (error) {
    console.error("Error getting passport details:", error);
    return null;
  }
}

/**
 * Save passport submission. Users can only submit once.
 */
async function savePassportSubmission({
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
}) {
  try {
    const sheet = await ensurePassportsSheet();

    // Check duplicates
    const existing = await getPassportDetails(email);
    if (existing) {
      return {
        success: false,
        error: "Passport information already submitted for this email.",
      };
    }

    const timestamp = new Date().toISOString();
    // Build an object and map to existing header order to avoid column mismatch
    const rowObject: Record<string, string> = {
      timestamp: timestamp,
      email: email,
      passportName: passportName || "",
      passportNumber: passportNumber,
      expiryDate: expiryDate,
      birthDate: birthDate,
      aAdvantage: aAdvantage || "",
    };

    const lastColumn = await sheet.getLastColumn(1);

    const headers = (
      await (await sheet.getRange(1, 1, 1, lastColumn)).getValues()
    )[0];

    if (!headers) {
      throw new Error(
        "No headers found in PASSPORTS sheet. Please contact Maddie for assistance."
      );
    }

    const row = headers.map((h: string) =>
      rowObject[h] !== undefined ? rowObject[h] : ""
    );

    sheet.appendRow(row);
    const passport = {
      timestamp: timestamp,
      email: email,
      passportName: passportName || "",
      passportNumber: passportNumber,
      expiryDate: expiryDate,
      birthDate: birthDate,
      aAdvantage: aAdvantage || "",
    };
    return {
      success: true,
      message: "Passport details saved successfully.",
      passport: passport,
    };
  } catch (error) {
    console.error("Error saving passport submission:", error);
    return {
      success: false,
      error:
        (error as { message: string }).message ||
        "Failed to save passport details.",
    };
  }
}

/**
 * Ensure Luggage sheet exists with correct headers. Return the sheet.
 */
async function ensureLuggageSheet() {
  const spreadsheet = await getSpreadsheet();
  let sheet = await spreadsheet.findSheetByName(LUGGAGE_SHEET_NAME);
  if (!sheet) {
    sheet = await spreadsheet.insertSheet(LUGGAGE_SHEET_NAME);
    const headers = ["timestamp", "email", "AEP-BRC", "BRC-MDZ", "MDZ-AEP"];
    await sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return sheet;
}

/**
 * Get luggage selections for a given email (or null if not found)
 */
async function getLuggageDetails(email: string) {
  try {
    const sheet = await ensureLuggageSheet();
    if ((await sheet.getLastRow()) < 2) return null;

    const data = await (await sheet.getDataRange()).getValues();
    const headers = data[0];

    if (!headers) {
      throw new Error(
        "No headers found in LUGGAGE sheet. Please contact Maddie for assistance."
      );
    }

    const emailIdx = headers.indexOf("email");
    if (emailIdx === -1) return null;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row) {
        throw new Error("No row found");
      }

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
  } catch (error) {
    console.error("Error getting luggage details:", error);
    return null;
  }
}

/**
 * Save luggage submission. Overwrites existing row for the email if present.
 */
async function saveLuggageSubmission({
  email,
  luggageSelection,
}: {
  email: string;
  luggageSelection: Record<string, boolean>;
}) {
  try {
    const sheet = await ensureLuggageSheet();
    const headers = (
      await (
        await sheet.getRange(1, 1, 1, await sheet.getLastColumn(1))
      ).getValues()
    )[0];

    if (!headers) {
      throw new Error(
        "No headers found in LUGGAGE sheet. Please contact Maddie for assistance."
      );
    }

    const timestamp = new Date().toISOString();
    const rowObject: Record<string, string> = {
      timestamp,
      email,
      "AEP-BRC": luggageSelection?.["AEP-BRC"] ? "1" : "0",
      "BRC-MDZ": luggageSelection?.["BRC-MDZ"] ? "1" : "0",
      "MDZ-AEP": luggageSelection?.["MDZ-AEP"] ? "1" : "0",
    };

    // Find existing row for email
    const emailIdx = headers.indexOf("email");
    let targetRow = -1;
    if (emailIdx !== -1) {
      const lastRow = await sheet.getLastRow();
      if (lastRow >= 2) {
        const values = await (
          await sheet.getRange(2, 1, lastRow - 1, await sheet.getLastColumn(1))
        ).getValues();
        for (let i = 0; i < values.length; i++) {
          const row = values[i];
          if (!row) {
            throw new Error("No row found");
          }
          const rowEmail = row[emailIdx];
          if (
            rowEmail &&
            rowEmail.toString().toLowerCase().trim() === email.toLowerCase()
          ) {
            targetRow = i + 2; // convert to sheet row number
            break;
          }
        }
      }
    }

    const row = headers.map((h) =>
      rowObject[h] !== undefined ? rowObject[h] : ""
    );

    if (targetRow === -1) {
      sheet.appendRow(row);
    } else {
      sheet.getRange(targetRow, 1, 1, headers.length).setValues([row]);
    }

    return {
      success: true,
      message: "Luggage selections saved successfully.",
      luggage: rowObject,
    };
  } catch (error) {
    console.error("Error saving luggage submission:", error);
    return {
      success: false,
      error:
        (error as { message: string }).message ||
        "Failed to save luggage selections.",
    };
  }
}

/**
 * Check if email already exists in the trip registrations sheet
 */
async function emailExists(email: string) {
  const spreadsheet = await getSpreadsheet();
  const sheet = await spreadsheet.getSheetByName(TRIP_REGISTRATIONS_SHEET_NAME);
  const lastRow = await sheet.getLastRow();

  if (lastRow <= 1) {
    // Only header row exists, no data yet
    return false;
  }

  const lastColumn = await sheet.getLastColumn(1);
  const headerRange = await sheet.getRange(1, 1, 1, lastColumn);
  const [headers] = await headerRange.getValues();

  if (!headers) {
    throw new Error(
      "No headers found in Trip Registrations sheet. Please contact Maddie for assistance."
    );
  }

  // find the index of the email column
  const emailColumnIndex = headers.indexOf("rsvpData.email");

  // If email column not found, return false (can't check duplicates)
  if (emailColumnIndex === -1) {
    console.log("Email column 'rsvpData.email' not found in sheet headers");
    return false;
  }

  // Check if the email already exists
  for (let i = 2; i <= lastRow; i++) {
    // Start from row 2 (skip header)
    const cellRange = await sheet.getRange(i, emailColumnIndex + 1);
    const cellValue = await cellRange.getValue();
    if (
      cellValue &&
      cellValue.toString().toLowerCase() === email.toLowerCase()
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Save processed data to Google Sheet
 */
async function saveToSheet(data: Record<string, string>) {
  try {
    const spreadsheet = await getSpreadsheet();
    let sheet = await spreadsheet.getSheetByName(TRIP_REGISTRATIONS_SHEET_NAME);

    const HEADERS_IN_ORDER = [
      "formData.email",
      "formData.firstName",
      "formData.lastName",
      "formData.phoneNumber",
      "formData.roommateName",
      "formData.roommatePreference",
      "formData.dietaryMessage",
      "formData.dietaryRestrictions",

      "formData.checkedLuggage",
      "formData.privateRoomUpgrade",

      "formData.cooking",
      "formData.horseback",
      "formData.rafting",
      "formData.tango",

      "formData.paymentSchedule",
      "formData.paymentMethod",
      "formData.cryptoCurrency",
      "formData.cryptoNetwork",

      "pricing.activitiesPrice",
      "pricing.basePrice",
      "pricing.installmentAmount",
      "pricing.privateRoomUpgrade",
      "pricing.processingFee",
      "pricing.subtotal",
      "pricing.total",

      "rsvpData.22Nov_BSAS",
      "rsvpData.23Nov_BSAS",
      "rsvpData.23Nov_Dinner_Welcome",
      "rsvpData.23Nov_Tour",
      "rsvpData.24Nov_BARI",
      "rsvpData.25Nov_BARI",
      "rsvpData.26Nov_BARI",
      "rsvpData.27Nov_MDZ",
      "rsvpData.28Nov_MDZ",
      "rsvpData.29Nov_BSAS",
      "rsvpData.AEP-BRC",
      "rsvpData.BRC-MDZ",
      "rsvpData.MDZ-AEP",
      "rsvpData.PACKPRICE",
      "rsvpData.PRIVATEROOM",
      "rsvpData.Timestamp",
      // "rsvpData.VALIJA", // Removed - no longer pricing luggage
      "rsvpData.comments",
      "rsvpData.email",
      "rsvpData.email2",
      "rsvpData.name",
      "rsvpData.option",
      "rsvpData.party",
      "rsvpData.plus1",

      "pricing.totalEUR",
      "pricing.installmentAmountEUR",
      "paymentLink.url",
    ];

    // Use the hardcoded headers to ensure consistent ordering
    const headers = HEADERS_IN_ORDER;

    // Always rewrite the header row to ensure consistency
    // if ((await sheet.getLastRow()) > 0) {
    //   sheet.getRange(1, 1, 1, headers.length).clearContent();
    // }
    // sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format header row

    const email = data["rsvpData.email"];

    if (!email) {
      throw new Error("Email not found in data");
    }

    // Check if email already exists (primary key constraint)
    if (await emailExists(email)) {
      return {
        success: false,
        error: `Email ${data["rsvpData.email"]} has already been registered for this trip.`,
      };
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

    sheet.appendRow(headers.map((header) => data[header] || ""));
    const rowNumber = sheet.getLastRow();

    return {
      success: true,
      rowNumber: rowNumber,
      //   paymentLinkUrl: paymentLinkData ? paymentLinkData.urlPaygold : "",
    };
  } catch (error) {
    console.error("Error saving to sheet:", error);
    return {
      success: false,
      error: (error as { message: string }).message,
    };
  }
}

/**
 * Get timeline data from TIMELINE sheet
 * Returns an array of objects where keys are headers and values are row data
 */
async function getTimelineData() {
  const spreadsheet = await getSpreadsheet();
  const sheet = await spreadsheet.getSheetByName(TIMELINE_SHEET_NAME);

  if (!sheet) {
    throw new Error("TIMELINE sheet not found");
  }

  // Get all data from the sheet
  const dataRange = await sheet.getDataRange();
  const values = await dataRange.getDisplayValues();

  if (values.length === 0) {
    throw new Error("No data found in TIMELINE sheet");
  }

  // Get headers from first row
  const headers = values[0];

  if (!headers) {
    throw new Error("No headers found in TIMELINE sheet");
  }

  // Convert data rows to objects
  const timelineData = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];

    if (!row) {
      throw new Error("No row found");
    }

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
async function getUserChoices(email: string) {
  try {
    const spreadsheet = await getSpreadsheet();
    const sheet = await spreadsheet.getSheetByName(CHOICES_SHEET_NAME);

    if (!sheet) {
      // If sheet doesn't exist, return empty choices
      return {
        success: true,
        data: {},
      };
    }

    // Get all data from the sheet
    const dataRange = await sheet.getDataRange();
    const values = await dataRange.getValues();

    if (values.length < 2) {
      // Only header row exists, return empty choices
      return {
        success: true,
        data: {},
      };
    }

    // Get headers (first row)
    const headers = values[0];

    if (!headers) {
      throw new Error("No headers found in CHOICES sheet");
    }

    // Find the required columns
    const emailColumnIndex = headers.indexOf("email");
    const itemKeyColumnIndex = headers.indexOf("itemKey");
    const choiceColumnIndex = headers.indexOf("choice");
    const counterColumnIndex = headers.indexOf("counter");
    const optionColumnIndex = headers.indexOf("option");

    if (
      emailColumnIndex === -1 ||
      itemKeyColumnIndex === -1 ||
      choiceColumnIndex === -1 ||
      counterColumnIndex === -1 ||
      optionColumnIndex === -1
    ) {
      throw new Error("Required columns not found in CHOICES sheet");
    }

    // Build choices object for this user, keeping only the latest choice for each itemKey
    const userChoices: Record<string, string> = {};
    const latestChoices = new Map(); // itemKey -> {choice, counter}

    // Search for the user's choices in the data rows (skip header row)
    for (let i = 1; i < values.length; i++) {
      const row = values[i];

      if (!row) {
        throw new Error("No row found");
      }

      const rowEmail = row[emailColumnIndex];
      const itemKey = row[itemKeyColumnIndex];
      const option = row[optionColumnIndex];
      const choice = row[choiceColumnIndex];
      const counter = parseInt(row[counterColumnIndex] || "") || 0;

      if (
        rowEmail &&
        rowEmail.toString().toLowerCase().trim() === email.toLowerCase() &&
        itemKey &&
        choice &&
        option
      ) {
        // Check if this is the latest choice for this itemKey
        const existing = latestChoices.get(`${itemKey}-${option}`);
        if (!existing || counter > existing.counter) {
          latestChoices.set(`${itemKey}-${option}`, { choice, counter });
        }
      }
    }

    // Convert latest choices to the expected format
    for (const [itemKey, { choice }] of latestChoices) {
      userChoices[itemKey] = choice;
    }

    return userChoices;
  } catch (error) {
    console.error("Error getting user choices:", error);
    return {
      success: false,
      error: "Failed to retrieve user choices",
    };
  }
}

/**
 * Update user choices in CHOICES sheet (event-sourced)
 */
async function updateUserChoices(data: {
  email: string;
  password: string;
  itemKey: string;
  option: string;
  choice: string;
}) {
  // Validate required fields
  if (
    !data.email ||
    !data.password ||
    !data.itemKey ||
    !data.option ||
    !data.choice
  ) {
    return {
      success: false,
      error: "Email, password, itemKey, and choice are required",
    };
  }

  // Validate credentials first
  const validation = await validateCredentials(data.email, data.password);
  if (!validation.success) {
    return validation.error;
  }

  const spreadsheet = await getSpreadsheet();
  let sheet = await spreadsheet.findSheetByName(CHOICES_SHEET_NAME);

  // Create CHOICES sheet if it doesn't exist
  if (!sheet) {
    sheet = await spreadsheet.insertSheet(CHOICES_SHEET_NAME);
    const headers = ["timestamp", "email", "itemKey", "choice", "counter"];
    await sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  // Get the next counter for this user and itemKey
  const nextCounter = await getNextCounterForItem(
    sheet,
    data.email,
    data.itemKey,
    data.option
  );

  // Add new choice event (always insert, never update)
  const timestamp = new Date().toISOString();
  const newRow = [
    timestamp,
    data.email,
    data.itemKey,
    data.option,
    data.choice,
    nextCounter,
  ];

  sheet.appendRow(newRow);

  console.log(
    `Added new choice event for ${data.email} - ${data.itemKey}: ${data.option} - ${data.choice} (counter: ${nextCounter})`
  );

  return {
    success: true,
    message: "Choice updated successfully",
    counter: nextCounter,
  };
}

/**
 * Get the next counter value for a specific user and itemKey
 */
async function getNextCounterForItem(
  sheet: SheetWrapper,
  email: string,
  itemKey: string,
  option: string
) {
  try {
    const dataRange = await sheet.getDataRange();
    const values = await dataRange.getValues();

    if (values.length < 2) {
      // Only header row exists, start with counter 1
      return 1;
    }

    const headers = values[0];

    if (!headers) {
      throw new Error("No headers found in CHOICES sheet");
    }

    const emailColumnIndex = headers.indexOf("email");
    const itemKeyColumnIndex = headers.indexOf("itemKey");
    const counterColumnIndex = headers.indexOf("counter");
    const optionColumnIndex = headers.indexOf("option");

    if (
      emailColumnIndex === -1 ||
      itemKeyColumnIndex === -1 ||
      counterColumnIndex === -1 ||
      optionColumnIndex === -1
    ) {
      throw new Error("Required columns not found in CHOICES sheet");
    }

    let maxCounter = 0;

    // Find the highest counter for this user and itemKey
    for (let i = 1; i < values.length; i++) {
      const row = values[i];

      if (!row) {
        throw new Error("No row found");
      }

      const rowEmail = row[emailColumnIndex];
      const rowItemKey = row[itemKeyColumnIndex];
      const rowOption = row[optionColumnIndex];
      const counter = parseInt(row[counterColumnIndex] || "") || 0;

      if (
        rowEmail &&
        rowEmail.toString().toLowerCase().trim() === email.toLowerCase() &&
        rowItemKey &&
        rowItemKey.toString().trim() === itemKey.toString().trim() &&
        rowOption &&
        rowOption.toString().trim() === option.toString().trim()
      ) {
        if (counter > maxCounter) {
          maxCounter = counter;
        }
      }
    }

    return maxCounter + 1;
  } catch (error) {
    console.error("Error getting next counter:", error);
    return 1; // Fallback to 1 if there's an error
  }
}

async function getVoucherFile(email: string): Promise<{
  file: drive_v3.Schema$File;
  rowId: number;
}> {
  console.log("getting voucher file");
  const existingSubmission = await getExistingSubmission(email.trim());

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

  console.log("got files list");

  const file = res.data.files?.[0];
  if (!file) {
    throw new Error(`Voucher PDF not found (${fileName})`);
  }

  return {
    file,
    rowId,
  };
}

async function downloadVoucher(email: string, password: string) {
  // Validate credentials first
  const validation = await validateCredentials(email, password);
  if (!validation.success) {
    return validation.error;
  }

  // Get voucher file
  const voucherResult = await getVoucherFile(email);

  console.log("got voucher result");

  const drive = await getGoogleDriveApi();

  // Get file content (binary)
  const res = await drive.files.get(
    {
      fileId: voucherResult.file.id!,
      alt: "media",
    },
    { responseType: "arraybuffer" }
  );

  console.log("got file content");

  const fileBuffer = Buffer.from(res.data as ArrayBuffer);
  const base64Data = fileBuffer.toString("base64");

  return {
    success: true,
    fileName: `arg-trip-voucher-${voucherResult.rowId}.pdf`,
    fileData: base64Data,
    mimeType: "application/pdf",
  };
}
