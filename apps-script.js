/**
 * Google Apps Script for Argentina Trip Form
 * Handles both GET requests for RSVP lookup and POST requests for form submissions
 * Single webapp managing both "RSVP" and "Trip Registrations" sheets
 *
 * Google Apps Script globals: ContentService, SpreadsheetApp, Utilities
 */

/* global ContentService, SpreadsheetApp, Utilities, DriveApp, UrlFetchApp */

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbziRQK-OafA9kTX7uno20h16MrgHipqKnpz1Y6Evyrzjk8pTFAUz_XpBLfGYSBRR6O3/exec";
const MG_KEY = "<REDACTED>";
const REDSYS_USER = "<REDACTED>";
const REDSYS_PASS = "<REDACTED>"; // Note: \u0021 is '!'

// Email configuration
const USE_GMAIL = true; // Set to false to use Mailgun

// Configuration
const TRIP_REGISTRATIONS_SHEET_NAME = "Trip Registrations";
const RSVP_SHEET_NAME = "RSVP"; // Sheet containing RSVP data
const TPV_PAYMENTS_SHEET_NAME = "TPV PAYMENTS"; // Sheet for REDSYS TPV payment callbacks
const NEW_EMAILS_SHEET_NAME = "NEW EMAILS"; // Sheet for new email requests
const WELCOME_EMAILS_SHEET_NAME = "WELCOME EMAILS"; // Sheet for tracking welcome emails sent
const PAYMENTLINKSDB_SHEET_NAME = "PAYMENTLINKSDB";

/**
 * Validates user credentials by checking for presence of email and password,
 * and then verifying them against the RSVP sheet.
 * @param {string} email The user's email.
 * @param {string} password The user's password.
 * @returns {{success: boolean, response?: object, rsvpData?: object}} Validation result.
 */
function validateCredentials(email, password) {
  if (!email) {
    return {
      success: false,
      response: ContentService.createTextOutput(
        JSON.stringify({ success: false, error: "Email is required." })
      ).setMimeType(ContentService.MimeType.JSON),
    };
  }

  if (!password) {
    return {
      success: false,
      response: ContentService.createTextOutput(
        JSON.stringify({ success: false, error: "Password is required." })
      ).setMimeType(ContentService.MimeType.JSON),
    };
  }

  const rsvpResult = lookupRSVP(email.trim(), password.trim());

  if (!rsvpResult.success) {
    return {
      success: false,
      response: ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          error: rsvpResult.error,
        })
      ).setMimeType(ContentService.MimeType.JSON),
    };
  }

  return {
    success: true,
    rsvpData: rsvpResult.data,
  };
}

/**
 * Handle GET requests for RSVP lookup
 */
// eslint-disable-next-line no-unused-vars
function doGet(e) {
  try {
    const email = e.parameter.email;
    const password = e.parameter.password;

    const validation = validateCredentials(email, password);
    if (!validation.success) {
      return validation.response;
    }

    // Check if there's an existing submission for this email
    const existingSubmission = getExistingSubmission(email.trim());

    const responseData = {
      rsvpData: validation.rsvpData,
      row: existingSubmission?.row || null,
      rowNumber: existingSubmission?.rowNumber || null,
    };

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        data: responseData,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error("Error processing RSVP lookup request:", error);
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: "Internal server error. Please contact Maddie for assistance.",
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Main function to handle POST requests for form submissions and REDSYS TPV callbacks
 */
// eslint-disable-next-line no-unused-vars
function doPost(e) {
  try {
    const data = e.parameter;

    // === Proof of Payment Upload Handler ===
    if (data.action === "upload_proof_of_payment") {
      // Required fields: fileData (base64), fileName, fileType, name, surname, orderNumber, timestamp, installments_0, installments_1
      if (
        !data.fileData ||
        !data.fileName ||
        !data.fileType ||
        !data.name ||
        !data.surname ||
        !data.orderNumber ||
        !data.timestamp ||
        !data.installments_0 ||
        !data.installments_1
      ) {
        return ContentService.createTextOutput(
          JSON.stringify({
            success: false,
            error: "Missing required fields for proof of payment upload.",
          })
        ).setMimeType(ContentService.MimeType.JSON);
      }
      try {
        var folder = DriveApp.getFolderById(
          "11OIHpYcakL5G08Z2B10mJNHkKjl0ID78"
        );
        var extension = data.fileName.split(".").pop();
        var safeName = data.name.replace(/[^a-zA-Z0-9]/g, "");
        var safeSurname = data.surname.replace(/[^a-zA-Z0-9]/g, "");
        var fileName = `proof_${data.orderNumber}_${safeSurname}_${safeName}_${data.timestamp}_${data.installments_0}_${data.installments_1}.${extension}`;
        var decoded = Utilities.base64Decode(data.fileData);
        var blob = Utilities.newBlob(decoded, data.fileType, fileName);
        var file = folder.createFile(blob);
        return ContentService.createTextOutput(
          JSON.stringify({
            success: true,
            fileId: file.getId(),
            fileUrl: file.getUrl(),
            fileName: fileName,
          })
        ).setMimeType(ContentService.MimeType.JSON);
      } catch (err) {
        return ContentService.createTextOutput(
          JSON.stringify({
            success: false,
            error: err.message,
          })
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Check if this is a REDSYS TPV callback
    if (data.Ds_MerchantParameters) {
      return handleRedsysCallback(data);
    }

    // Check if this is a new email request
    if (data.action === "new_email") {
      return handleNewEmailRequest(data);
    }

    // Check if this is a PDF upload request
    if (data.action === "upload_pdf") {
      return handlePdfUpload(e);
    }

    // Continue with existing form submission logic
    const result = saveToSheet(data);

    if (result.success) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          message: "Registration saved successfully",
          rowNumber: result.rowNumber,
          paymentLinkUrl: result.paymentLinkUrl,
        })
      ).setMimeType(ContentService.MimeType.JSON);
    } else {
      // Use the specific error message from saveToSheet instead of generic message
      throw new Error(result.error || "Failed to save to sheet");
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: "Internal server error: " + error.message,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle OPTIONS requests for CORS
 * Used by Google Apps Script web app deployment
 */
// eslint-disable-next-line no-unused-vars
function doOptions() {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
}

/**
 * Handle REDSYS TPV payment callback
 */
function handleRedsysCallback(data) {
  try {
    console.log("Processing REDSYS TPV callback");

    // Extract the required fields from the callback
    const dsSignatureVersion = data.Ds_SignatureVersion || "";
    const dsMerchantParameters = data.Ds_MerchantParameters || "";
    const dsSignature = data.Ds_Signature || "";

    // Decode the Base64 encoded merchant parameters
    let decodedJson = "";
    try {
      const decodedBytes = Utilities.base64Decode(dsMerchantParameters);
      decodedJson = Utilities.newBlob(decodedBytes).getDataAsString();
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
    const result = saveToTpvPaymentsSheet(paymentRecord);

    if (result.success) {
      console.log(
        "REDSYS callback processed successfully, row:",
        result.rowNumber
      );

      // Return HTTP 200 OK to REDSYS to confirm receipt
      return ContentService.createTextOutput("OK").setMimeType(
        ContentService.MimeType.TEXT
      );
    } else {
      throw new Error(result.error || "Failed to save TPV payment data");
    }
  } catch (error) {
    console.error("Error processing REDSYS callback:", error);

    // Still return HTTP 200 OK to avoid REDSYS retries
    // Log the error for manual review
    return ContentService.createTextOutput(
      "ERROR: " + error.message
    ).setMimeType(ContentService.MimeType.TEXT);
  }
}

/**
 * Save TPV payment data to the TPV PAYMENTS sheet
 */
function saveToTpvPaymentsSheet(paymentRecord) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(TPV_PAYMENTS_SHEET_NAME);

    // Create the sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(TPV_PAYMENTS_SHEET_NAME);
      console.log("Created new TPV PAYMENTS sheet");
    }

    // Define the headers (fixed structure)
    const headers = [
      "timestamp",
      "decoded_json",
      "raw_ds_merchant_parameters",
      "ds_signature_version",
      "ds_signature",
    ];

    // Check if this is the first row (no data yet)
    if (sheet.getLastRow() === 0) {
      // Add headers
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#f0f0f0");

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
      error: error.message,
    };
  }
}

/**
 * Look up RSVP data by email and password
 */
function lookupRSVP(email, password) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(RSVP_SHEET_NAME);

    if (!sheet) {
      return {
        success: false,
        error:
          "RSVP data sheet not found. Please contact Maddie for assistance.",
      };
    }

    // Get all data from the sheet
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();

    if (values.length < 2) {
      return {
        success: false,
        error: "No RSVP data available. Please contact Maddie for assistance.",
      };
    }

    // Get headers (first row)
    const headers = values[0];

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
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
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
        const rsvpData = {};

        for (let j = 0; j < headers.length; j++) {
          const header = headers[j];
          const value = row[j];

          // Don't include the password in the returned data for security
          if (header === "PASSWORD") {
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
function getExistingSubmission(email) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(TRIP_REGISTRATIONS_SHEET_NAME);

    if (!sheet || sheet.getLastRow() <= 1) {
      return null;
    }

    // Get all data from the sheet
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();

    // Get headers (first row)
    const headers = values[0];

    // Find the email column
    const emailColumnIndex = headers.indexOf("rsvpData.email");

    if (emailColumnIndex === -1) {
      console.log(
        "Email column 'rsvpData.email' not found in Trip Registrations sheet"
      );
      return null;
    }

    // Search for the email in the data rows (skip header row)
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const rowEmail = row[emailColumnIndex];

      if (
        rowEmail &&
        rowEmail.toString().toLowerCase().trim() === email.toLowerCase()
      ) {
        // Found the email! Reconstruct the data objects
        const rawData = {};
        for (let j = 0; j < headers.length; j++) {
          rawData[headers[j]] = row[j];
        }

        return {
          row: rawData,
          rowNumber: i + 1, // +1 because sheet rows are 1-indexed
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting existing submission:", error);
    return null;
  }
}

/**
 * Helper function to get RSVP data for pricing calculations
 */
function _getRsvpDataForEmail(email) {
  if (!email) return null;

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(RSVP_SHEET_NAME);

    if (!sheet) return null;

    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();

    if (values.length < 2) return null;

    const headers = values[0];
    const emailColumnIndex = headers.indexOf("email");

    if (emailColumnIndex === -1) return null;

    // Find the row with matching email
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const rowEmail = row[emailColumnIndex];

      if (
        rowEmail &&
        rowEmail.toString().toLowerCase().trim() === email.toLowerCase()
      ) {
        // Create object with headers as keys
        const rsvpData = {};
        for (let j = 0; j < headers.length; j++) {
          rsvpData[headers[j]] = row[j];
        }
        return rsvpData;
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting RSVP data:", error);
    return null;
  }
}

/**
 * Check if email already exists in the trip registrations sheet
 */
function emailExists(sheet, email) {
  if (sheet.getLastRow() <= 1) {
    // Only header row exists, no data yet
    return false;
  }

  // find the index of the email column
  const emailColumnIndex = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .indexOf("rsvpData.email");

  // If email column not found, return false (can't check duplicates)
  if (emailColumnIndex === -1) {
    console.log("Email column 'rsvpData.email' not found in sheet headers");
    return false;
  }

  // Check if the email already exists
  for (let i = 2; i <= sheet.getLastRow(); i++) {
    // Start from row 2 (skip header)
    const cellValue = sheet.getRange(i, emailColumnIndex + 1).getValue();
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
function saveToSheet(data) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(TRIP_REGISTRATIONS_SHEET_NAME);

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
    if (sheet.getLastRow() > 0) {
      sheet.getRange(1, 1, 1, headers.length).clearContent();
    }
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#f0f0f0");

    // Check if email already exists (primary key constraint)
    if (emailExists(sheet, data["rsvpData.email"])) {
      return {
        success: false,
        error: `Email ${data["rsvpData.email"]} has already been registered for this trip.`,
      };
    }

    // --- Payment Link Creation ---
    let paymentLinkData = null;
    let paymentLinkError = null;

    if (data["formData.paymentMethod"] === "credit" && false) {
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

    sheet.appendRow(finalValues);
    const rowNumber = sheet.getLastRow();

    return {
      success: true,
      rowNumber: rowNumber,
      paymentLinkUrl: paymentLinkData ? paymentLinkData.urlPaygold : "",
    };
  } catch (error) {
    console.error("Error saving to sheet:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Handle new email request submissions
 */
function handleNewEmailRequest(data) {
  try {
    console.log("Processing new email request:", data);

    // Validate required fields
    if (!data.email || !data.name) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          error: "Email and name are required",
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Check if email already exists in RSVP data
    if (_getRsvpDataForEmail(data.email)) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          error:
            "This email is already registered. Please try logging in instead.",
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Check if email already requested in NEW EMAILS sheet
    const alreadyRequested = checkEmailInNewEmails(data.email);
    if (alreadyRequested) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          error: "Account creation already requested for this email",
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Save to NEW EMAILS sheet
    const result = saveToNewEmailsSheet(data);

    if (result.success) {
      // Send notification email to admin
      try {
        sendNewAccountNotificationEmail(data.email, data.name);
      } catch (notificationError) {
        console.error("Failed to send notification email:", notificationError);
        // Don't fail the request if notification email fails
      }

      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          message: "Account creation request submitted successfully",
        })
      ).setMimeType(ContentService.MimeType.JSON);
    } else {
      throw new Error(result.error || "Failed to save new email request");
    }
  } catch (error) {
    console.error("Error processing new email request:", error);
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: "Internal server error: " + error.message,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Check if email already requested in NEW EMAILS sheet
 */
function checkEmailInNewEmails(email) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(NEW_EMAILS_SHEET_NAME);

    if (!sheet) {
      return false;
    }

    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();

    if (values.length < 2) {
      return false;
    }

    const headers = values[0];
    const emailColumnIndex = headers.indexOf("email");

    if (emailColumnIndex === -1) {
      return false;
    }

    // Search for the email in the data rows
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const rowEmail = row[emailColumnIndex];

      if (
        rowEmail &&
        rowEmail.toString().toLowerCase().trim() === email.toLowerCase()
      ) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking email in NEW EMAILS:", error);
    return false;
  }
}

/**
 * Save new email request to NEW EMAILS sheet
 */
function saveToNewEmailsSheet(data) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(NEW_EMAILS_SHEET_NAME);

    // Create NEW EMAILS sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(NEW_EMAILS_SHEET_NAME);
      // Add headers
      const headers = ["timestamp", "email", "name", "status"];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    // Prepare data row
    const timestamp = new Date().toISOString();
    const rowData = [timestamp, data.email, data.name, "pending"];

    // Append the new row
    sheet.appendRow(rowData);

    // Get the row number of the newly added row
    const lastRow = sheet.getLastRow();

    console.log("New email request saved successfully to row:", lastRow);

    return {
      success: true,
      rowNumber: lastRow,
    };
  } catch (error) {
    console.error("Error saving to NEW EMAILS sheet:", error);
    return {
      success: false,
      error: "Failed to save new email request",
    };
  }
}

/**
 * Helper to load all emails that have already received a welcome email
 */
function getAllWelcomeEmailsSent() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(WELCOME_EMAILS_SHEET_NAME);
    if (!sheet) {
      return new Set();
    }
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    if (values.length === 0) {
      return new Set();
    }
    // No headers - email is in column 2 (index 1)
    const emailSet = new Set();
    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const rowEmail = row[1]; // Column 2 (email)
      if (rowEmail) {
        emailSet.add(rowEmail.toString().toLowerCase().trim());
      }
    }
    return emailSet;
  } catch (error) {
    console.error("Error loading all welcome emails sent:", error);
    return new Set();
  }
}

/**
 * Manual trigger function to send password emails to all RSVP users
 * Run this function manually from the Apps Script editor when needed
 */
// eslint-disable-next-line no-unused-vars
function sendPasswordEmailsToAllRSVPs() {
  try {
    console.log("Starting to send password emails to all RSVP users...");

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(RSVP_SHEET_NAME);

    if (!sheet) {
      throw new Error("RSVP sheet not found");
    }

    // Get all data from the sheet
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();

    if (values.length < 2) {
      console.log("No RSVP data found");
      return;
    }

    // Get headers (first row)
    const headers = values[0];

    // Find column indices
    const emailColumnIndex = headers.indexOf("email");
    const passwordColumnIndex = headers.indexOf("PASSWORD");
    const nameColumnIndex = headers.indexOf("name");

    if (emailColumnIndex === -1) {
      throw new Error("Email column not found in RSVP sheet");
    }

    if (passwordColumnIndex === -1) {
      throw new Error("PASSWORD column not found in RSVP sheet");
    }

    let emailsSent = 0;
    let emailsSkipped = 0;
    let errors = 0;

    // Load all sent welcome emails into memory ONCE
    const sentWelcomeEmails = getAllWelcomeEmailsSent();

    // Process each row (skip header row)
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const email = row[emailColumnIndex];
      const password = row[passwordColumnIndex];
      const name = row[nameColumnIndex] || "Traveler";

      // Skip rows without email or password
      if (!email || !password) {
        console.log(`Skipping row ${i + 1}: missing email or password`);
        continue;
      }

      try {
        // Check if welcome email was already sent to this email (use in-memory set)
        const alreadySent = sentWelcomeEmails.has(
          email.toString().toLowerCase().trim()
        );

        if (alreadySent) {
          emailsSkipped++;
          console.log(`⏭️  Email already sent to: ${email}`);
          continue;
        }

        // Send the email
        const result = sendPasswordEmail(
          email.toString().trim(),
          password.toString().trim(),
          name.toString().trim()
        );

        if (result.success) {
          if (result.skipped) {
            emailsSkipped++;
            console.log(`⏭️  Email already sent to: ${email}`);
          } else {
            emailsSent++;
            console.log(`✓ Email sent to: ${email}`);
          }
        } else {
          errors++;
          console.error(
            `✗ Failed to send email to: ${email} - ${result.error}`
          );
        }

        // Add a small delay to avoid hitting Gmail sending limits
        Utilities.sleep(1000); // 1 second delay
      } catch (emailError) {
        errors++;
        console.error(`✗ Error sending email to ${email}:`, emailError);
      }
    }

    // Final summary
    console.log(`\n=== EMAIL SENDING SUMMARY ===`);
    console.log(`Total emails sent: ${emailsSent}`);
    console.log(`Total emails skipped (already sent): ${emailsSkipped}`);
    console.log(`Total errors: ${errors}`);
    console.log(`Total processed: ${emailsSent + emailsSkipped + errors}`);

    return {
      success: true,
      emailsSent: emailsSent,
      emailsSkipped: emailsSkipped,
      errors: errors,
      message: `Completed: ${emailsSent} emails sent, ${emailsSkipped} skipped, ${errors} errors`,
    };
  } catch (error) {
    console.error("Error in sendPasswordEmailsToAllRSVPs:", error);
    throw error;
  }
}

/**
 * Record welcome email sending in WELCOME EMAILS sheet
 */
function recordWelcomeEmailSent(email, name, status, htmlBody) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(WELCOME_EMAILS_SHEET_NAME);

    // Create WELCOME EMAILS sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(WELCOME_EMAILS_SHEET_NAME);
      console.log("Created WELCOME EMAILS sheet");
      // Add headers including htmlBody
      const headers = ["timestamp", "email", "name", "status", "htmlBody"];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    } else {
      // If sheet exists but doesn't have htmlBody column, add it
      const headers = sheet
        .getRange(1, 1, 1, sheet.getLastColumn())
        .getValues()[0];
      if (!headers.includes("htmlBody")) {
        sheet.insertColumnAfter(headers.length);
        sheet.getRange(1, headers.length + 1).setValue("htmlBody");
      }
    }

    // Prepare data row: date, email, name, status, htmlBody
    const timestamp = new Date().toISOString();

    // Append the new row
    sheet.appendRow([timestamp, email, name, status, htmlBody]);

    // Get the row number of the newly added row
    const lastRow = sheet.getLastRow();

    console.log(
      `Welcome email record saved to row ${lastRow}: ${email} - ${status}`
    );

    return {
      success: true,
      rowNumber: lastRow,
    };
  } catch (error) {
    console.error("Error recording welcome email:", error);
    return {
      success: false,
      error: "Failed to record welcome email",
    };
  }
}

/**
 * Send password email to a specific user
 */
function sendPasswordEmail(email, password, name) {
  try {
    // Get RSVP data to check for Plus 1 registration status
    const rsvpData = _getRsvpDataForEmail(email);
    const shouldShowPlus1Warning =
      rsvpData && rsvpData.email2 && rsvpData.email2.toString().trim() === "x";

    const hasPlusOne = rsvpData && rsvpData.party === "Plus one";

    const subject = "Argentina awaits, confirm your trip";

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">¡Hola ${name}!</h2>
        
        <div style="background-color: #f8d7da; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h4 style="margin-top: 0; color: #721c24;">⚠️ Attention</h4>
          <p style="margin-bottom: 0; color: #721c24;">The registration deadline has passed, but you're still welcome to sign up! We'll do our best to accommodate you, though we can't guarantee a spot or quote at this stage. Once you confirm your registration, Maddie will get in touch in case any adjustments to the quote need to be considered.</p>
          <p style="margin-bottom: 0; color: #721c24;">Please complete payment within the next 48 hours to secure your spot.</p>
          ${
            shouldShowPlus1Warning
              ? `<p style="margin-bottom: 0; color: #721c24;">We've detected that your Plus 1 has not registered their email yet. Please have them register through <a href="https://argtrip.sonsolesstays.com/new-email" style="color: #721c24; text-decoration: underline;">this link</a> to secure their spot on the trip.</p>`
              : ""
          }
          ${
            hasPlusOne
              ? `<p style="margin-bottom: 0; color: #721c24;">Every participant must fill its own form</p>`
              : ""
          }
        </div>

        <p>Argentina awaits you! 🇦🇷✈️</p>
        <p>You're all set to confirm your spot on our amazing Argentina adventure. Use the details below to access your trip registration:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #495057;">Ready to confirm your trip?</h3>
          <div style="text-align: center;">
            <a href="https://argtrip.sonsolesstays.com?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}" 
               style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              🇦🇷 Access My Argentina Trip 🇦🇷
            </a>
          </div>
          <p style="margin-top: 15px; font-size: 14px; color: #6c757d;">
            <strong>Backup credentials (if needed):</strong><br>
            Email: ${email}<br>
            Password: <code style="background-color: #e9ecef; padding: 2px 6px; border-radius: 3px;">${password}</code>
          </p>
        </div>
        
        <p>Click the magic link above to instantly access your trip registration, or use the backup credentials if needed to:</p>
        <ul>
          <li>✅ Confirm your trip details</li>
          <li>🏠 Select your accommodation preferences</li>
          <li>🎯 Choose your activities</li>
          <li>💳 Complete your payment</li>
        </ul>
        
        <p><strong>Important:</strong> Please complete your registration as soon as possible to secure your spot!</p>
        
        <p>If you have any questions or need assistance, don't hesitate to reach out to Maddie:</p>
        <ul>
          <li>📱 WhatsApp: <a href="https://wa.me/5491169729783">+54 911 6972 9783</a></li>
          <li>📧 Email: sonsolesstays+argtrip@gmail.com</li>
          <li>↩️ Or simply reply to this email</li>
        </ul>
        
        <p style="margin-top: 30px;">¡Nos vemos en Argentina!</p>
        <p style="color: #6c757d; font-style: italic;">Sonsoles Stays</p>
        
        <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
        <p style="font-size: 12px; color: #6c757d;">
          This email contains your personal access credentials. Please keep them secure and don't share them with others.
        </p>
      </div>
    `;

    let emailSent = false;
    let errorMessage = null;

    try {
      // Send the email using Gmail API
      // MailApp.sendEmail({
      //   to: email,
      //   from: "sonsolesstays+argtrip@gmail.com",
      //   bcc: "sonsolesstays+argtrip@gmail.com",
      //   subject: subject,
      //   htmlBody: htmlBody,
      //   body: textBody,
      // });

      const bcc = "sonsolesstays+argtrip@gmail.com";
      sendEmail(email, subject, htmlBody, [], bcc);

      console.log("Email sent successfully to", email);
      emailSent = true;
    } catch (emailError) {
      console.error(`Error sending email to ${email}:`, emailError);
      errorMessage = emailError.message;
      emailSent = false;
    }

    // Record the email sending attempt, always save the HTML
    const status = emailSent ? "sent" : "failed";
    recordWelcomeEmailSent(email, name, status, htmlBody);

    return {
      success: emailSent,
      message: emailSent
        ? `Email sent successfully to ${email}`
        : `Failed to send email to ${email}: ${errorMessage}`,
      error: emailSent ? null : errorMessage,
    };
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);

    // Record the failed attempt, save HTML if possible
    recordWelcomeEmailSent(email, name, "failed", "");

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Handle PDF upload requests
 */
function handlePdfUpload(e) {
  try {
    const data = e.parameter;

    // YOU MUST PASTE YOUR DRIVE FOLDER ID HERE
    const DRIVE_FOLDER_ID = "12Tlr-aeKBSSJuzf8GxepYbePC5vY_HCh";

    if (!data.pdfData) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          error: "PDF data is required",
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    if (!data.filename) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          error: "Filename is required",
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    if (!data.clientEmail) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          error: "Client email is required",
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Decode the base64 PDF data
    const pdfBlob = Utilities.base64Decode(data.pdfData);
    const blob = Utilities.newBlob(pdfBlob, "application/pdf", data.filename);

    // Check if file already exists in Google Drive
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const existingFiles = folder.getFilesByName(data.filename);

    // If file exists, do nothing
    if (existingFiles.hasNext()) {
      const existingFile = existingFiles.next();
      console.log(
        `File already exists: ${data.filename} (ID: ${existingFile.getId()})`
      );

      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          message: "File already exists, no action taken",
          fileId: existingFile.getId(),
          filename: data.filename,
          driveUrl: existingFile.getUrl(),
          emailSent: false,
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // File doesn't exist, create new file
    const file = folder.createFile(blob);

    console.log(`PDF uploaded successfully: ${data.filename}`);
    console.log(`File ID: ${file.getId()}`);

    // Send email with PDF attachment (only for new files)
    try {
      sendPdfEmail(data.clientEmail, data.filename, blob, data.travelerName);
      console.log(`Email sent to ${data.clientEmail} with PDF attachment`);
    } catch (emailError) {
      console.error(`Failed to send email to ${data.clientEmail}:`, emailError);
      // Don't fail the upload if email fails
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: "PDF uploaded successfully",
        fileId: file.getId(),
        filename: data.filename,
        driveUrl: file.getUrl(),
        emailSent: true,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error("Error uploading PDF:", error);
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: "Failed to upload PDF: " + error.message,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Send notification email to admin when someone requests a new account
 */
function sendNewAccountNotificationEmail(email, name) {
  try {
    const subject = "New Account Request - Argentina Trip";
    const adminEmail = "sonsolesstays+argtrip@gmail.com";

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">🆕 New Account Request</h2>
        
        <p>Someone has requested a new account for the Argentina Trip registration system.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #495057;">Request Details:</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <p>To process this request, you'll need to:</p>
        <ul>
          <li>✅ Add their details to the RSVP sheet</li>
          <li>🔐 Generate a password for them</li>
          <li>📧 Send them a welcome email with their credentials</li>
        </ul>
        
        <p>The request has been automatically logged in the "NEW EMAILS" sheet for your reference.</p>
        
        <p style="margin-top: 30px; color: #6c757d; font-style: italic;">
          This is an automated notification from the Argentina Trip registration system.
        </p>
      </div>
    `;

    // Send notification email to admin
    sendEmail(adminEmail, subject, htmlBody);

    console.log(`New account notification email sent to ${adminEmail}`);
    return true;
  } catch (error) {
    console.error(`Error sending new account notification email:`, error);
    // Don't fail the request if notification email fails
    return false;
  }
}

/**
 * Send email with PDF attachment to client
 */
function sendPdfEmail(clientEmail, filename, pdfBlob, travelerName) {
  try {
    const subject = "Your Argentina Trip Registration Voucher";
    const travelerDisplayName = travelerName || "Traveler";

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">¡Hola ${travelerDisplayName}!</h2>
        
        <p>Your Argentina Trip registration voucher is ready! 🇦🇷✈️</p>
        
        <p>Please find attached your comprehensive trip registration summary (<strong>${filename}</strong>) containing:</p>
        <ul>
          <li>✅ Your confirmed flight details</li>
          <li>🏨 Hotel accommodations</li>
          <li>💰 Pricing breakdown</li>
          <li>💳 Payment information</li>
          <li>📋 Terms and conditions</li>
        </ul>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #495057;">Important:</h3>
          <p>Please save this voucher for your records. You may need it for travel documentation.</p>
        </div>
        
        <p>If you have any questions about your registration or need to make changes, please contact Maddie:</p>
        <ul>
          <li>📧 Email: sonsolesstays+argtrip@gmail.com</li>
          <li>📱 WhatsApp: <a href="https://wa.me/5491169729783">+54 911 6972 9783</a></li>
          <li>↩️ Or simply reply to this email</li>
        </ul>
        
        <p style="margin-top: 30px;">¡Nos vemos en Argentina!</p>
        <p style="color: #6c757d; font-style: italic;">Sonsoles Stays</p>
        
        <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
        <p style="font-size: 12px; color: #6c757d;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    `;

    const bcc = "sonsolesstays+argtrip@gmail.com";
    // Send email with PDF attachment
    sendEmail(clientEmail, subject, htmlBody, [pdfBlob], bcc);

    console.log(`PDF email sent successfully to ${clientEmail}`);
    return true;
  } catch (error) {
    console.error(`Error sending PDF email to ${clientEmail}:`, error);
    throw error;
  }
}

/**
 * Unified email sending function that switches between Gmail and Mailgun
 * @param {string|string[]} to - recipient email(s)
 * @param {string} subject - email subject
 * @param {string} htmlContent - HTML email body
 * @param {Array<Blob>} attachments - optional attachments
 * @param {string} bcc - optional BCC recipient
 */
function sendEmail(to, subject, htmlContent, attachments = [], bcc) {
  if (USE_GMAIL) {
    return sendGmailEmail(to, subject, htmlContent, attachments, bcc);
  } else {
    return sendMailGunEmail(to, subject, htmlContent, attachments, bcc);
  }
}

/**
 * Send email using Gmail/MailApp
 */
function sendGmailEmail(to, subject, htmlContent, attachments = [], bcc) {
  try {
    const emailOptions = {
      to: Array.isArray(to) ? to.join(",") : to,
      subject: subject,
      htmlBody: htmlContent,
      replyTo: "sonsolesstays+argtrip@gmail.com",
    };

    if (bcc) {
      emailOptions.bcc = bcc;
    }

    if (attachments && attachments.length > 0) {
      emailOptions.attachments = attachments;
    }

    MailApp.sendEmail(emailOptions);
    console.log(`Gmail email sent successfully to: ${emailOptions.to}`);
  } catch (error) {
    console.error("Gmail email send failed:", error);
    throw error;
  }
}

/**
 * Sends an email via Mailgun.
 *
 * @param {string|string[]} to         – single address or an array
 * @param {string}           subject
 * @param {string}           htmlContent
 * @param {string}           [plainText]   – optional text fallback
 * @param {Array<Blob>}      [attachments] – optional Drive/AppScript blobs
 */
function sendMailGunEmail(to, subject, htmlContent, attachments = [], bcc) {
  const MG_DOMAIN = "mailing.sonsolesstays.com";
  if (!MG_KEY || !MG_DOMAIN) throw new Error("Missing Mailgun credentials");

  // Build the form payload
  const form = {
    from: "Sonsoles Stays<no-reply@" + MG_DOMAIN + ">",
    to: Array.isArray(to) ? to.join(",") : to,
    subject: subject,
    html: htmlContent,
    "h:Reply-To": "sonsolestays@gmail.com",
  };

  if (bcc) {
    form.bcc = bcc;
  }

  // Attachments, if provided
  if (attachments && attachments.length) {
    attachments.forEach((blob, i) => {
      form["attachment[" + i + "]"] = blob;
    });
  }

  // Send with HTTP Basic Auth (user "api")
  const options = {
    method: "post",
    payload: form,
    headers: {
      Authorization: "Basic " + Utilities.base64Encode("api:" + MG_KEY),
    },
    muteHttpExceptions: true,
  };
  const url = "https://api.eu.mailgun.net/v3/" + MG_DOMAIN + "/messages";
  const res = UrlFetchApp.fetch(url, options);

  if (res.getResponseCode() < 200 || res.getResponseCode() > 299) {
    console.error("Mailgun error:", res.getContentText());
    throw new Error("Email send failed (" + res.getResponseCode() + ")");
  }
  console.log(JSON.parse(res.getContentText()));
}

/**
 * Save payment link creation attempt data to the PAYMENTLINKSDB sheet
 */
function saveToPaymentLinksSheet(logData) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(PAYMENTLINKSDB_SHEET_NAME);

    // Create the sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(PAYMENTLINKSDB_SHEET_NAME);
      const headers = [
        "timestamp",
        "email",
        "link",
        "jsonResponse",
        "status",
        "error",
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    }

    // Prepare the values in the same order as headers
    const values = [
      logData.timestamp,
      logData.email,
      logData.link,
      logData.jsonResponse,
      logData.status,
      logData.error,
    ];

    // Add the payment record
    sheet.appendRow(values);
    return { success: true };
  } catch (error) {
    console.error("Error saving to PAYMENTLINKSDB sheet:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Retrieves payment link information for a given email.
 * It checks for a valid, non-expired payment link and also counts how many expired links exist for that email.
 *
 * @param {string} email The email to look up.
 * @returns {{activeLink: object|null, expiredCount: number}} An object containing the active link (if any) and the count of expired links.
 */
function getPaymentLinkInfo(email) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(PAYMENTLINKSDB_SHEET_NAME);

    if (!sheet || sheet.getLastRow() <= 1) {
      return { activeLink: null, expiredCount: 0 };
    }

    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    const headers = values.shift(); // Get and remove header row

    const emailColumnIndex = headers.indexOf("email");
    const statusColumnIndex = headers.indexOf("status");
    const jsonResponseColumnIndex = headers.indexOf("jsonResponse");
    const timestampColumnIndex = headers.indexOf("timestamp");

    if (
      emailColumnIndex === -1 ||
      statusColumnIndex === -1 ||
      jsonResponseColumnIndex === -1 ||
      timestampColumnIndex === -1
    ) {
      console.error(
        "PAYMENTLINKSDB sheet is missing required columns (email, status, jsonResponse, timestamp)."
      );
      return { activeLink: null, expiredCount: 0 };
    }

    let expiredCount = 0;
    let activeLink = null;
    let activeLinkTimestamp = null;

    // Iterate over all payment link records
    for (const row of values) {
      const rowEmail = row[emailColumnIndex];
      const rowStatus = row[statusColumnIndex];

      if (
        rowEmail &&
        rowEmail.toString().toLowerCase().trim() === email.toLowerCase() &&
        rowStatus === "success"
      ) {
        const timestampStr = row[timestampColumnIndex];
        if (timestampStr) {
          const linkTimestamp = new Date(timestampStr);
          const now = new Date();
          const hoursDifference = (now - linkTimestamp) / (1000 * 60 * 60);

          if (hoursDifference > 24) {
            expiredCount++;
          } else {
            // This is an active link. We want to store only the latest one.
            if (!activeLinkTimestamp || linkTimestamp > activeLinkTimestamp) {
              const jsonResponse = row[jsonResponseColumnIndex];
              if (jsonResponse) {
                try {
                  activeLink = JSON.parse(jsonResponse);
                  activeLinkTimestamp = linkTimestamp;
                } catch (e) {
                  /* ignore parse errors */
                  console.error(
                    `Failed to parse existing payment link JSON for ${email}:`,
                    e
                  );
                }
              }
            }
          }
        }
      }
    }

    if (activeLink) {
      console.log(
        `Found active payment link for ${email}, created at ${activeLinkTimestamp.toISOString()}.`
      );
    }
    if (expiredCount > 0) {
      console.log(`Found ${expiredCount} expired links for ${email}.`);
    }

    return { activeLink: activeLink, expiredCount: expiredCount };
  } catch (error) {
    console.error("Error in getPaymentLinkInfo:", error);
    return { activeLink: null, expiredCount: 0 };
  }
}

function createPaymentLinkOrderForRow(data, rowNumber, authToken, linkNumber) {
  try {
    const orderId = `ARG_${rowNumber}_${linkNumber}`;

    const isInstallments = data["formData.paymentSchedule"] === "installments";

    const order = {
      id: orderId,
      user: {
        name: `${data["formData.firstName"]} ${data["formData.lastName"]}`,
        email: data["formData.email"],
      },
      total: data["pricing.installmentAmountEUR"],
      subject: isInstallments
        ? "Argentina Trip Payment - First installment"
        : "Argentina Trip Payment",
    };
    return createPaymentLink(order, authToken);
  } catch (e) {
    console.error("Failed to create payment link:", e);
    return null;
  }
}

/**
 * Redsys API client for creating payment links.
 */
const REDSYS_BASE_URL = "https://canales.redsys.es/admincanales-web/services";

/**
 *
 * Logs into the Redsys platform and returns an authentication token.
 *
 * @returns {string} A promise that resolves with the authentication token.
 * @throws {Error} If login fails or the response does not contain a token.
 */
function login() {
  const url = `${REDSYS_BASE_URL}/usuarios/login`;
  const options = {
    method: "post",
    contentType: "application/json;charset=UTF-8",
    headers: {
      Accept: "application/json, text/plain, */*",
    },
    payload: JSON.stringify({ username: REDSYS_USER, password: REDSYS_PASS }),
    muteHttpExceptions: true,
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    if (responseCode < 200 || responseCode >= 300) {
      throw new Error(
        `Login failed with status: ${responseCode}. Response: ${responseBody}`
      );
    }

    const data = JSON.parse(responseBody);
    const token = data.token;
    console.log("token", token);
    if (!token) {
      throw new Error(
        `Login response did not include a token. Response: ${responseBody}`
      );
    }
    console.log("Successfully logged in to Redsys.");
    return token;
  } catch (error) {
    console.error("Error during Redsys login:", error);
    throw error;
  }
}

/**
 * Creates a Paygold payment link. It handles login automatically.
 *
 * {
  comercio: '51628063',
  terminal: '1',
  numeroPedido: 'TEST_422',
  codigoAutorizacion: '',
  importe: '10.00',
  importeEuros: '10.00',
  descripcion: '',
  nombreComercio: 'SONSOLES STAYS',
  moneda: '978',
  urlPaygold: 'https://sis.redsys.es/sis/p2f?t=84149B5A0DE60194B3E0A8445345F92BD6B3007D'
}
 * 
 * 
 * @param {object} paymentData - The data for the payment link.
 * @returns {object} A promise that resolves with the payment operation details.
 * @throws {Error} If the payment link creation fails.
 */
function createPaymentLink(order, authToken) {
  try {
    const paymentData = {
      comercio: "051628063",
      terminal: 1,
      ds_merchant_order: order.id,
      moneda: "978",
      descripcion: "",
      ds_merchant_p2f_expirydate_type: "",
      ds_merchant_p2f_expirydate_minutos: "",
      ds_merchant_p2f_expirydate_dias: "3",
      ds_merchant_p2f_expirydate: "",
      ds_merchant_consumerlanguage: "2",
      nombrecliente: order.user.name,
      direccionComprador: "",
      correo: order.user.email,
      subjectMailCliente: order.subject,
      telefono: "",
      ds_merchant_customer_sms_text: "",
      fecha: "",
      mes: "",
      hora: "",
      minu: "",
      anno: "",
      dia: "",
      referencia: "",
      urlNotificacion: APPS_SCRIPT_URL,
      idCliente: "",
      altTransType: "",
      importe: order.total,
    };

    const tokenToUse = authToken || login();

    if (!tokenToUse) {
      throw new Error("Could not obtain Redsys auth token.");
    }

    const url = `${REDSYS_BASE_URL}/operaciones/new/realizar_operacion_paygold`;
    const options = {
      method: "post",
      contentType: "application/json;charset=UTF-8",
      headers: {
        Accept: "application/json, text/plain, */*",
        "admincanales-auth-token": tokenToUse,
        "admincanales-language": "es",
      },
      payload: JSON.stringify(paymentData),
      muteHttpExceptions: true,
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    if (responseCode < 200 || responseCode >= 300) {
      throw new Error(
        `Failed to create payment link with status: ${responseCode}. Response: ${responseBody}`
      );
    }

    const data = JSON.parse(responseBody);
    if (data.autorizada !== "true") {
      throw new Error(
        `Payment link not authorized. Response: ${JSON.stringify(data)}`
      );
    }
    console.log("Successfully created payment link.");
    return data ? data.operacion : null;
  } catch (error) {
    console.error("Error creating payment link:", error, error.stack);
    return null;
  }
}

/**
 * Manually-triggered function to generate Redsys payment links in batch for a predefined list of users.
 * This function logs into Redsys once, then for each email, it looks up the registration data,
 * and creates a payment link if one doesn't already exist.
 * Results are logged to the PAYMENTLINKSDB sheet.
 */
function generatePaymentLinksBatch() {
  const emailsToProcess = ["maximilian.mancini@stanford.edu"];

  let authToken;
  try {
    authToken = login();
    if (!authToken) {
      console.error("Failed to get auth token from Redsys. Aborting batch.");
      return;
    }
    console.log(
      "Successfully obtained Redsys auth token for batch processing."
    );
  } catch (e) {
    console.error("Redsys login failed, cannot proceed with batch.", e);
    return;
  }

  for (const email of emailsToProcess) {
    try {
      console.log(`Processing user: ${email}`);

      const submission = getExistingSubmission(email);
      if (!submission) {
        console.error(
          `Could not find trip registration for email: ${email}. Skipping.`
        );
        continue;
      }

      const paymentInfo = getPaymentLinkInfo(email);
      if (paymentInfo.activeLink) {
        console.log(
          `Skipping ${email}: an active payment link already exists.`
        );
        continue;
      }

      let paymentLinkData = null;
      let paymentLinkError = null;

      try {
        const flatData = {
          "formData.firstName": submission.row["formData.firstName"],
          "formData.lastName": submission.row["formData.lastName"],
          "formData.email": submission.row["formData.email"],
          "formData.paymentSchedule":
            submission.row["formData.paymentSchedule"],
          "pricing.installmentAmountEUR":
            submission.row["pricing.installmentAmountEUR"],
        };

        const linkNumber = paymentInfo.expiredCount + 1;
        paymentLinkData = createPaymentLinkOrderForRow(
          flatData,
          submission.rowNumber,
          authToken,
          linkNumber
        );
      } catch (e) {
        paymentLinkError = e;
      }

      saveToPaymentLinksSheet({
        timestamp: new Date().toISOString(),
        email: email,
        link: paymentLinkData ? paymentLinkData.urlPaygold : "",
        jsonResponse: paymentLinkData ? JSON.stringify(paymentLinkData) : "",
        status: paymentLinkData ? "success" : "failed",
        error: paymentLinkError ? paymentLinkError.toString() : "",
      });

      console.log(
        `Finished processing for ${email}. Status: ${
          paymentLinkData ? "success" : "failed"
        }`
      );
    } catch (loopError) {
      console.error(
        `An unexpected error occurred processing ${email}:`,
        loopError
      );
    }

    // Add a small delay to avoid overwhelming the API
    Utilities.sleep(500); // 500ms delay
  }

  console.log("Batch payment link generation complete.");
}
