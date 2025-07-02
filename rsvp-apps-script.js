/**
 * Google Apps Script for Argentina Trip RSVP Lookup
 * Handles GET requests to lookup RSVP data from backend-data.csv sheet
 * This is READ-ONLY - used to retrieve confirmed trip details
 *
 * Google Apps Script globals: ContentService, SpreadsheetApp
 */

/* global ContentService, SpreadsheetApp */

// Configuration
const RSVP_SHEET_NAME = "Sheet1"; // Name of the sheet containing RSVP data (backend-data.csv)

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
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          data: rsvpResult.data,
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
 * Handle OPTIONS requests for CORS
 */
// eslint-disable-next-line no-unused-vars
function doOptions() {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
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

    // Find the email column - look for the specific column name
    const emailColumnName =
      "Email (for all trip-related updates and communications)";
    const emailColumnIndex = headers.indexOf(emailColumnName);

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
 * Email validation helper
 */
// eslint-disable-next-line no-unused-vars
function _isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
