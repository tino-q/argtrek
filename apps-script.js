/**
 * Google Apps Script for Argentina Trip Form
 * Handles both GET requests for RSVP lookup and POST requests for form submissions
 * Single webapp managing both "RSVP" and "Trip Registrations" sheets
 *
 * Google Apps Script globals: ContentService, SpreadsheetApp, Utilities
 */

/* global ContentService, SpreadsheetApp, Utilities */

// Configuration
const TRIP_REGISTRATIONS_SHEET_NAME = "Trip Registrations";
const RSVP_SHEET_NAME = "RSVP"; // Sheet containing RSVP data
const TPV_PAYMENTS_SHEET_NAME = "TPV PAYMENTS"; // Sheet for REDSYS TPV payment callbacks
const NEW_EMAILS_SHEET_NAME = "NEW EMAILS"; // Sheet for new email requests
const PRICING = {
  // These base prices will be overridden by RSVP data
  tripOption1: 2250,
  tripOption2: 2600,
  privateRoomUpgrade: 350,
  horsebackRiding: 45,
  cookingClass: 140,
  rafting: 75,

  // Note: Luggage is no longer priced, only tracked as boolean preference

  creditCardFeeRate: 0.04,
  installmentRate: 0.35,
  vatRate: 0.21,
};

/**
 * Handle GET requests for RSVP lookup
 */
// eslint-disable-next-line no-unused-vars
function doGet(e) {
  try {
    // Get email and password parameters from query string
    const email = e.parameter.email;
    const password = e.parameter.password;

    if (!email) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          error: "Email parameter is required",
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    if (!password) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          error: "Password parameter is required",
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Look up RSVP data with password validation
    const rsvpResult = lookupRSVP(email.trim(), password.trim());

    if (rsvpResult.success) {
      // Check if there's an existing submission for this email
      const existingSubmission = getExistingSubmission(email.trim());

      const responseData = {
        rsvpData: rsvpResult.data,
        hasExistingSubmission: existingSubmission !== null,
      };

      // If there's an existing submission, include all the data
      if (existingSubmission) {
        responseData.formData = existingSubmission.formData;
        responseData.pricing = existingSubmission.pricing;
        responseData.submissionResult = {
          rowNumber: existingSubmission.rowNumber,
        };
      }

      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          data: responseData,
        })
      ).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          error: rsvpResult.error,
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
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
    // Get data from FormData (comes through e.parameter)
    const data = e.parameter;

    // Check if this is a REDSYS TPV callback
    if (data.Ds_MerchantParameters) {
      return handleRedsysCallback(data);
    }

    // Check if this is a new email request
    if (data.action === "new_email") {
      return handleNewEmailRequest(data);
    }

    // Continue with existing form submission logic
    const result = saveToSheet(data);

    if (result.success) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          message: "Registration saved successfully",
          rowNumber: result.rowNumber,
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

        // Reconstruct formData object
        const formData = {};
        Object.keys(rawData).forEach((key) => {
          if (key.startsWith("formData.")) {
            const formKey = key.replace("formData.", "");
            formData[formKey] = rawData[key];
          }
        });

        // Reconstruct pricing object
        const pricing = {};
        Object.keys(rawData).forEach((key) => {
          if (key.startsWith("pricing.")) {
            const pricingKey = key.replace("pricing.", "");
            pricing[pricingKey] = rawData[key];
          }
        });

        // Reconstruct rsvpData object
        const rsvpData = {};
        Object.keys(rawData).forEach((key) => {
          if (key.startsWith("rsvpData.")) {
            const rsvpKey = key.replace("rsvpData.", "");
            rsvpData[rsvpKey] = rawData[key];
          }
        });

        return {
          formData,
          pricing,
          rsvpData,
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
      "formData.argentineCitizen",

      "formData.cooking",
      "formData.horseback",
      "formData.rafting",

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
      "pricing.vatAmount",

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
      "rsvpData.IVAALOJ",
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
    ];

    // Use the hardcoded headers to ensure consistent ordering
    const headers = HEADERS_IN_ORDER;
    const values = headers.map((header) => data[header] || ""); // Use empty string for missing data

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

    // Add row to sheet using the hardcoded header order
    sheet.appendRow(values);
    const rowNumber = sheet.getLastRow();

    return {
      success: true,
      rowNumber: rowNumber,
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
