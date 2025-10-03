/**
 * Google Apps Script for Argentina Trip Form
 * Handles both GET requests for RSVP lookup and POST requests for form submissions
 * Single webapp managing both "RSVP" and "Trip Registrations" sheets
 *
 * Google Apps Script globals: ContentService, SpreadsheetApp, Utilities
 */

/* global ContentService, SpreadsheetApp, Utilities, DriveApp, UrlFetchApp */

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbx7yq8UhY2pVk4vMEJW6BfYqoD9GWAo1I2ntx3pDodSk2j4DWE0ZDakirCGKyppv4S9/exec";

const REDSYS_BASE_URL = "https://canales.redsys.es/admincanales-web/services";

const MG_KEY = "<REDACTED>";
const REDSYS_USER = "<REDACTED>";
const REDSYS_PASS = "<REDACTED>"; // Note: \u0021 is '!'

// Email configuration
const USE_GMAIL = false; // Set to false to use Mailgun

// Configuration
const TRIP_REGISTRATIONS_SHEET_NAME = "Trip Registrations";
const RSVP_SHEET_NAME = "RSVP"; // Sheet containing RSVP data
const TPV_PAYMENTS_SHEET_NAME = "TPV PAYMENTS"; // Sheet for REDSYS TPV payment callbacks
const AUTO_EMAILS_SHEET_NAME = "AUTO_EMAILS"; // Unified sheet for tracking all automated emails with type column
const PAYMENTLINKSDB_SHEET_NAME = "PAYMENTLINKSDB";
const PAYMENTLINKSDB_2_SHEET_NAME = "PAYMENTLINKSDB_2";
const COMPLETED_CHOICES_SHEET_NAME = "COMPLETED CHOICES";

// Hardcoded exchange rate for second payment links
const EXCHANGE_RATE_USD_TO_EUR = 0.85;
const PROCESSING_FEE_PERCENTAGE = 0.0285; // 2.85%

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
        const folder = DriveApp.getFolderById(
          "11OIHpYcakL5G08Z2B10mJNHkKjl0ID78"
        );
        const extension = data.fileName.split(".").pop();
        const safeName = data.name.replace(/[^a-zA-Z0-9]/g, "");
        const safeSurname = data.surname.replace(/[^a-zA-Z0-9]/g, "");
        const fileName = `proof_${data.orderNumber}_${safeSurname}_${safeName}_${data.timestamp}_${data.installments_0}_${data.installments_1}.${extension}`;
        const decoded = Utilities.base64Decode(data.fileData);
        const blob = Utilities.newBlob(decoded, data.fileType, fileName);
        const file = folder.createFile(blob);
        return ContentService.createTextOutput(
          JSON.stringify({
            success: true,
            fileId: file.getId(),
            fileUrl: file.getUrl(),
            fileName,
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

    throw new Error("Invalid request");
  } catch (error) {
    console.error("Error processing request:", error);
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: `Internal server error: ${error.message}`,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
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
    }

    throw new Error(result.error || "Failed to save TPV payment data");
  } catch (error) {
    console.error("Error processing REDSYS callback:", error);

    // Still return HTTP 200 OK to avoid REDSYS retries
    // Log the error for manual review
    return ContentService.createTextOutput(
      `ERROR: ${error.message}`
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
      rowNumber,
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
    const [headers] = values;

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
  if (!email) {
    return null;
  }

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(RSVP_SHEET_NAME);

    if (!sheet) {
      return null;
    }

    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();

    if (values.length < 2) {
      return null;
    }

    const [headers] = values;
    const emailColumnIndex = headers.indexOf("email");

    if (emailColumnIndex === -1) {
      return null;
    }

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
 * Helper to load all emails that have already received a welcome email
 */
function getAllWelcomeEmailsSent() {
  return getAllSentEmails(AUTO_EMAILS_SHEET_NAME, "welcome");
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
      const bcc = "sonsolesstays+argtrip@gmail.com";
      sendEmail(email, subject, htmlBody, [], bcc);
      console.log("Email sent successfully to", email);
      emailSent = true;
    } catch (emailError) {
      console.error(`Error sending email to ${email}:`, emailError);
      errorMessage = emailError.message;
      emailSent = false;
    }

    // Record the email sending attempt (for direct calls, batch calls handled in sendBatchEmails)
    const status = emailSent ? "sent" : "failed";
    const resultMessage = emailSent ? "" : errorMessage || "Unknown error";
    recordEmailSent(email, name, status, "welcome", resultMessage);

    return {
      success: emailSent,
      message: emailSent
        ? `Email sent successfully to ${email}`
        : `Failed to send email to ${email}: ${errorMessage}`,
      error: emailSent ? null : errorMessage,
    };
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);

    // Record the failed attempt (for direct calls, batch calls handled in sendBatchEmails)
    recordEmailSent(email, name, "failed", "welcome", error.message);

    return {
      success: false,
      error: error.message,
    };
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
  }

  return sendMailGunEmail(to, subject, htmlContent, attachments, bcc);
}

/**
 * Send email using Gmail/MailApp
 */
function sendGmailEmail(to, subject, htmlContent, attachments = [], bcc) {
  try {
    const emailOptions = {
      to: Array.isArray(to) ? to.join(",") : to,
      subject,
      htmlBody: htmlContent,
      replyTo: "sonsolesstays+argtrip@gmail.com",
    };

    if (bcc) {
      emailOptions.bcc = bcc;
    }

    if (attachments && attachments.length > 0) {
      emailOptions.attachments = attachments;
    }

    // eslint-disable-next-line no-undef
    MailApp.sendEmail(emailOptions);
    console.log(`Gmail email sent successfully to: ${emailOptions.to}`);
    return true;
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
  if (!MG_KEY || !MG_DOMAIN) {
    throw new Error("Missing Mailgun credentials");
  }

  // Build the form payload
  const form = {
    from: `Sonsoles Stays<no-reply@${MG_DOMAIN}>`,
    to: Array.isArray(to) ? to.join(",") : to,
    subject,
    html: htmlContent,
    "h:Reply-To": "sonsolestays@gmail.com",
  };

  if (bcc) {
    form.bcc = bcc;
  }

  // Attachments, if provided
  if (attachments && attachments.length) {
    attachments.forEach((blob, i) => {
      form[`attachment[${i}]`] = blob;
    });
  }

  // Send with HTTP Basic Auth (user "api")
  const options = {
    method: "post",
    payload: form,
    headers: {
      Authorization: `Basic ${Utilities.base64Encode(`api:${MG_KEY}`)}`,
    },
    muteHttpExceptions: true,
  };
  const url = `https://api.mailgun.net/v3/${MG_DOMAIN}/messages`;
  const res = UrlFetchApp.fetch(url, options);

  if (res.getResponseCode() < 200 || res.getResponseCode() > 299) {
    console.error("Mailgun error:", res.getContentText());
    throw new Error(`Email send failed (${res.getResponseCode()})`);
  }
  console.log(JSON.parse(res.getContentText()));

  return true;
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
 * Save second payment link creation attempt data to the PAYMENTLINKSDB_2 sheet
 */
function saveToPaymentLinksSheet2(logData) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(PAYMENTLINKSDB_2_SHEET_NAME);

    // Create the sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(PAYMENTLINKSDB_2_SHEET_NAME);
      const headers = [
        "timestamp",
        "email",
        "link",
        "jsonResponse",
        "status",
        "amount usd",
        "exchange rate",
        "amount eur",
        "processing fee",
        "total eur",
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
      logData.amountUsd,
      logData.exchangeRate,
      logData.amountEur,
      logData.processingFee,
      logData.totalEur,
    ];

    // Add the payment record
    sheet.appendRow(values);
    return { success: true };
  } catch (error) {
    console.error("Error saving to PAYMENTLINKSDB_2 sheet:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if a user has completed all choices by looking in COMPLETED CHOICES sheet
 * @param {string} email The email to check
 * @returns {boolean} True if user has completed all choices, false otherwise
 */
function hasCompletedAllChoices(email) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(COMPLETED_CHOICES_SHEET_NAME);

    if (!sheet || sheet.getLastRow() <= 1) {
      return false;
    }

    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    const [headers] = values;

    const emailColumnIndex = headers.indexOf("Email");

    if (emailColumnIndex === -1) {
      console.error("Email column not found in COMPLETED CHOICES sheet");
      return false;
    }

    // Check if email exists in the completed choices sheet
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
    console.error("Error checking completed choices:", error);
    return false;
  }
}

/**
 * Retrieves second payment link information for a given email from PAYMENTLINKSDB_2.
 * It checks for a valid, non-expired payment link and also counts how many expired links exist for that email.
 *
 * @param {string} email The email to look up.
 * @returns {{activeLink: object|null, expiredCount: number}} An object containing the active link (if any) and the count of expired links.
 */
function getPaymentLinkInfo2(email) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(PAYMENTLINKSDB_2_SHEET_NAME);

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
        "PAYMENTLINKSDB_2 sheet is missing required columns (email, status, jsonResponse, timestamp)."
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
                    `Failed to parse existing second payment link JSON for ${email}:`,
                    e
                  );
                }
              }
            }
          }
        }
      }
    }

    // if (activeLink) {
    //   console.log(
    //     `Found active second payment link for ${email}, created at ${activeLinkTimestamp.toISOString()}.`
    //   );
    // }
    // if (expiredCount > 0) {
    //   console.log(
    //     `Found ${expiredCount} expired second payment links for ${email}.`
    //   );
    // }

    return { activeLink, expiredCount };
  } catch (error) {
    console.error("Error in getPaymentLinkInfo2:", error);
    return { activeLink: null, expiredCount: 0 };
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

    return { activeLink, expiredCount };
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
    const { token } = data;
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
 * Get all registered emails from Trip Registrations sheet
 */
function getAllRegisteredEmails() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(TRIP_REGISTRATIONS_SHEET_NAME);

    if (!sheet || sheet.getLastRow() <= 1) {
      return [];
    }

    // Get all data from the sheet
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();

    if (values.length < 2) {
      return [];
    }

    // Get headers (first row)
    const [headers] = values;

    // Find column indices
    const emailColumnIndex = headers.indexOf("formData.email");
    const firstNameColumnIndex = headers.indexOf("formData.firstName");
    const lastNameColumnIndex = headers.indexOf("formData.lastName");

    if (emailColumnIndex === -1) {
      console.error(
        "Email column 'formData.email' not found in Trip Registrations sheet"
      );
      return [];
    }

    const emails = [];

    // Process each row (skip header row)
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const email = row[emailColumnIndex];
      const firstName = row[firstNameColumnIndex] || "";
      const lastName = row[lastNameColumnIndex] || "";

      // Skip rows without email
      if (!email) {
        continue;
      }

      emails.push({
        email: email.toString().trim(),
        firstName: firstName.toString().trim(),
        lastName: lastName.toString().trim(),
      });
    }

    console.log(`Found ${emails.length} registered emails`);
    return emails;
  } catch (error) {
    console.error("Error getting registered emails:", error);
    return [];
  }
}

/**
 * Send WhatsApp group invite email to a specific user
 */
function sendWhatsAppInviteEmail(email, name, whatsappLink) {
  try {
    const subject = "Join our Argentina Trip WhatsApp Group! 🇦🇷";

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <h2 style="color: #2c3e50;">¡Hola ${name}!</h2>
        
        <p>We invite you to join our Argentina trip WhatsApp group to connect with fellow travelers and receive important trip updates.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${whatsappLink}" 
             style="display: inline-block; background-color: #25D366; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; border: none;">
            📱 Join Our WhatsApp Group
          </a>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #25D366;">
          <h4 style="margin-top: 0; color: #495057;">Group Guidelines:</h4>
          <ul style="margin-bottom: 0; padding-left: 20px;">
            <li>Keep conversations trip-related and positive</li>
            <li>Be respectful to all group members</li>
            <li>Feel free to share your excitement and questions!</li>
          </ul>
        </div>
        
        <p>Questions? Contact Maddie: <a href="https://wa.me/5491169729783" style="color: #25D366; text-decoration: none;">+54 911 6972 9783</a></p>
        
        <p style="color: #6c757d; font-style: italic; margin-top: 30px;">Sonsoles Stays</p>
      </div>
    `;

    let emailSent = false;
    let errorMessage = null;

    try {
      // Send the email
      const bcc = "sonsolesstays+argtrip@gmail.com";

      sendEmail(email, subject, htmlBody, [], bcc);

      console.log("WhatsApp invite email sent successfully to", email);
      emailSent = true;
    } catch (emailError) {
      console.error(
        `Error sending WhatsApp invite email to ${email}:`,
        emailError
      );
      errorMessage = emailError.message;
      emailSent = false;
    }

    // Email recording is now handled generically in sendBatchEmails

    return {
      success: emailSent,
      message: emailSent
        ? `WhatsApp invite email sent successfully to ${email}`
        : `Failed to send WhatsApp invite email to ${email}: ${errorMessage}`,
      error: emailSent ? null : errorMessage,
    };
  } catch (error) {
    console.error(`Error sending WhatsApp invite email to ${email}:`, error);

    // Email recording is now handled generically in sendBatchEmails

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generic batch email sender that can be used for any type of email campaign
 * @param {string} emailType - Description of email type for logging (e.g., "WhatsApp invite", "Terms & Conditions")
 * @param {function} emailSenderFunction - Function that sends individual emails
 * @param {number} delayMs - Delay between emails in milliseconds (default: 2000)
 */
function sendBatchEmails(
  emailType,
  emailSenderFunction,
  delayMs = 2000,
  { sendToEmails, excludeEmails } = {}
) {
  try {
    console.log(`Starting to send ${emailType} emails...`);

    // Get all emails from Trip Registrations sheet
    const emails = getAllRegisteredEmails();

    if (emails.length === 0) {
      console.log("No registered emails found");
      return {
        success: false,
        message: "No registered emails found in Trip Registrations sheet",
      };
    }

    let emailsSent = 0;
    let emailsSkipped = 0;
    let errors = 0;

    const sentEmails = getAllSentEmails(AUTO_EMAILS_SHEET_NAME, emailType);

    // Process each email
    for (const emailData of emails) {
      const { email, firstName: name } = emailData;

      try {
        // Check if email was already sent
        const alreadySent = sentEmails.has(
          email.toString().toLowerCase().trim()
        );

        if (alreadySent) {
          emailsSkipped++;
          console.log(`⏭️  ${emailType} email already sent to: ${email}`);
          continue;
        }

        if (
          excludeEmails &&
          excludeEmails
            .map((e) => e.toLowerCase().trim())
            .includes(email.toLowerCase().trim())
        ) {
          console.log(
            `This email is excluded from ${emailType} emails: ${email}`
          );
          continue;
        }

        if (
          sendToEmails &&
          !sendToEmails
            .map((e) => e.toLowerCase().trim())
            .includes(email.toLowerCase().trim())
        ) {
          console.log(
            `This email is not in the sendToEmails list for ${emailType} emails: ${email}`
          );
          continue;
        }

        // Call the specific email sender function
        const result = emailSenderFunction(
          email.toString().trim(),
          name.toString().trim()
        );

        // Record the email attempt in the unified sheet
        const status = result.success ? "sent" : "failed";
        const resultMessage = result.success
          ? ""
          : result.error || "Unknown error";
        recordEmailSent(email, name, status, emailType, resultMessage);

        if (result.success) {
          emailsSent++;
          console.log(`✓ ${emailType} email sent to: ${email}`);
        } else {
          errors++;
          console.error(
            `✗ Failed to send ${emailType} email to: ${email} - ${result.error}`
          );
        }

        // Add delay to avoid hitting Gmail sending limits
        if (delayMs > 0) {
          Utilities.sleep(delayMs);
        }
      } catch (emailError) {
        errors++;
        console.error(
          `✗ Error sending ${emailType} email to ${email}:`,
          emailError
        );
        // Record the exception as a failed attempt
        recordEmailSent(email, name, "failed", emailType, emailError.message);
      }
    }

    // Final summary
    console.log(`\n=== ${emailType.toUpperCase()} EMAIL SUMMARY ===`);
    console.log(`Total emails sent: ${emailsSent}`);
    console.log(`Total emails skipped (already sent): ${emailsSkipped}`);
    console.log(`Total errors: ${errors}`);
    console.log(`Total processed: ${emailsSent + emailsSkipped + errors}`);

    return {
      success: true,
      emailsSent,
      emailsSkipped,
      errors,
      message: `Completed: ${emailsSent} emails sent, ${emailsSkipped} skipped, ${errors} errors`,
    };
  } catch (error) {
    console.error(`Error in sendBatchEmails for ${emailType}:`, error);
    throw error;
  }
}

/**
 * Generic function to load all emails that have already received a specific type of email
 * @param {string} sheetName - Name of the tracking sheet
 * @param {string} emailType - Type of email to filter by (whatsapp, welcome, terms)
 */
function getAllSentEmails(sheetName, emailType = null) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      return new Set();
    }
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    if (values.length === 0) {
      return new Set();
    }

    // Get headers to find column indices
    const [headers] = values;
    const emailColumnIndex = headers.indexOf("email");
    const statusColumnIndex = headers.indexOf("status");
    const typeColumnIndex = headers.indexOf("type");

    if (emailColumnIndex === -1) {
      return new Set();
    }

    const emailSet = new Set();
    for (let i = 1; i < values.length; i++) {
      // Skip header row
      const row = values[i];
      const rowEmail = row[emailColumnIndex];
      const rowStatus = row[statusColumnIndex];
      const rowType = row[typeColumnIndex];

      if (
        rowEmail &&
        rowStatus === "sent" &&
        (!emailType || rowType === emailType)
      ) {
        emailSet.add(rowEmail.toString().toLowerCase().trim());
      }
    }
    console.log(
      `Loaded ${emailSet.size} sent emails from ${sheetName} for type: ${emailType || "all"}`
    );
    return emailSet;
  } catch (error) {
    console.error(`Error loading all sent emails from ${sheetName}:`, error);
    return new Set();
  }
}

/**
 * Generic function to record email sending in tracking sheet
 * @param {string} email - Email address
 * @param {string} name - Recipient name
 * @param {string} status - Status: "sent" or "failed"
 * @param {string} type - Email type: "whatsapp", "welcome", "terms"
 * @param {string} result - Error message if failed, success message if sent
 */
function recordEmailSent(email, name, status, type = "unknown", result = "") {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(AUTO_EMAILS_SHEET_NAME);

    // Create tracking sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(AUTO_EMAILS_SHEET_NAME);
      // Add headers
      const headers = [
        "timestamp",
        "email",
        "name",
        "status",
        "type",
        "result",
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#f0f0f0");
    }

    // Prepare data row
    const timestamp = new Date().toISOString();

    // Append the new row
    sheet.appendRow([timestamp, email, name, status, type, result]);

    // Get the row number of the newly added row
    const lastRow = sheet.getLastRow();

    console.log(
      `Email record saved to ${AUTO_EMAILS_SHEET_NAME} row ${lastRow}: ${email} - ${status}`
    );

    return {
      success: true,
      rowNumber: lastRow,
    };
  } catch (error) {
    console.error(`Error recording email in ${AUTO_EMAILS_SHEET_NAME}:`, error);
    return {
      success: false,
      error: `Failed to record email in ${AUTO_EMAILS_SHEET_NAME}`,
    };
  }
}

/**
 * Helper function to get voucher file from Google Drive
 * @param {string} email - User email
 * @returns {Object} - {success: boolean, file?: GoogleFile, error?: string, rowId?: number}
 */
function getVoucherFile(email) {
  try {
    const existingSubmission = getExistingSubmission(email.trim());

    if (!existingSubmission || !existingSubmission.rowNumber) {
      return {
        success: false,
        error: `No registration found for ${email}`,
      };
    }

    const rowId = existingSubmission.rowNumber;
    const fileName = `arg-trip-voucher-${rowId}.pdf`;
    const driveFolder = DriveApp.getFolderById(
      "1QuSXGvECgYCM2HeVwGDzEJkcRkACda4X"
    );

    const files = driveFolder.getFilesByName(fileName);
    if (!files.hasNext()) {
      return {
        success: false,
        error: `Voucher PDF not found (${fileName})`,
      };
    }

    const file = files.next();
    return {
      success: true,
      file,
      rowId,
    };
  } catch (error) {
    return {
      success: false,
      error: `Error accessing voucher: ${error.message}`,
    };
  }
}

/**
 * Send terms and conditions email with voucher attachment
 */
function sendTermsAndConditionsEmail(email, name) {
  try {
    const subject = "Updated trip info - Argentina Trip";

    // Get RSVP data to retrieve password for magic link
    const rsvpData = _getRsvpDataForEmail(email);
    const password = rsvpData ? rsvpData.PASSWORD : null;

    if (!password) {
      throw new Error("No password found for email");
    }

    // Get voucher attachment - required for T&C emails
    const voucherResult = getVoucherFile(email);
    if (!voucherResult.success) {
      throw new Error(
        `${voucherResult.error} - cannot send T&C without voucher`
      );
    }

    const blob = voucherResult.file.getBlob();
    const voucherAttachment = blob.setName(
      `Argentina_Trip_Voucher_${voucherResult.rowId}.pdf`
    );

    const textBody = `Hola ${name}, hope you are having a great day!

I want to share flight reservations updates, a new trip voucher and highlight some important trip details!

I'd appreciate it if you could reply with a quick “Received” so I know you've got this email. 

<strong>ABOUT ME & MY ROLE</strong>
I'm Maddie, Nati's friend since high school. I’m based in Alicante, Spain, where I manage vacation rentals. I’m super thrilled to be coordinating this trip! I used to do this when I lived in Argentina. Together with my partner Martin, we created the trip registration app. It’s homemade, but we hope it makes the trip's communication smoother for everyone!

<strong>Important: I am acting as a group coordinator, not as a travel agency.</strong> My role is to centralize logistics, secure group rates, and book activities and hotels on behalf of each passenger. All services are provided directly by third-party companies, not by me personally.

<u>In the unlikely event of a trip disruption such as a flight delay, any extra costs for new flights or hotel nights are the traveler's responsibility</u> — I’ll still be there to guide and support.

<strong>FLIGHTS</strong>
We’ve updated how flight reservations are handled: Argentine participants will now book and manage these reservations. Schedules, operations, and payments remain the same; nothing to worry about. The difference is that I’m not the one managing those bookings directly so this will not be included in the voucher. Flight details will still be shared in the app. If you prefer to book your flights independently, you can let me know and I’ll deduct the corresponding amount from your next payment.

You can find your new trip voucher attached to this email.

<strong>DOCUMENTATION & INSURANCE REQUIREMENTS</strong>
Each traveler is responsible for checking their passport validity, visa requirements, health/insurance obligations, and vaccination rules based on their travel itinerary/history.

Friendly reminder: <strong>All foreign visitors must have valid health insurance</strong> covering the entire stay in Argentina (with country-specific coverage). In addition, <strong>I strongly recommend purchasing personal travel insurance</strong> to cover flight disruptions, schedule changes, lost luggage, or trip interruptions.

Thank you so much for trusting me with this adventure! Don't hesitate to reach out to me at <a href="https://wa.me/5491169729783">+54 911 6972 9783</a>.

To login to the app, please <a href="https://argtrip.sonsolesstays.com/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}">click here</a>; full trip agenda coming soon!

Warm regards,
Maddie
`;

    let emailSent = false;
    let errorMessage = null;

    try {
      const bcc = "sonsolesstays+argtrip@gmail.com";
      if (!voucherAttachment) {
        throw new Error("No voucher attachment found");
      }
      const attachments = [voucherAttachment];

      // Convert text body to HTML by replacing line breaks
      const htmlBody = textBody.replace(/\n/g, "<br>");

      // Send email using unified helper function
      sendEmail(email, subject, htmlBody, attachments, bcc);

      console.log("Terms and conditions email sent successfully to", email);
      emailSent = true;
    } catch (emailError) {
      console.error(
        `Error sending terms and conditions email to ${email}:`,
        emailError
      );
      errorMessage = emailError.message;
      emailSent = false;
    }

    // Email recording is now handled generically in sendBatchEmails

    return {
      success: emailSent,
      message: emailSent
        ? `Terms and conditions email sent successfully to ${email}`
        : `Failed to send terms and conditions email to ${email}: ${errorMessage}`,
      error: emailSent ? null : errorMessage,
    };
  } catch (error) {
    console.error(
      `Error sending terms and conditions email to ${email}:`,
      error
    );

    // Email recording is now handled generically in sendBatchEmails

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send Terms & Conditions emails to all registered participants
 * This function reads all emails from the Trip Registrations sheet and sends T&C emails
 * Uses TC EMAILS sheet to track sent emails and prevent duplicates
 */
// eslint-disable-next-line no-unused-vars
function sendTermsAndConditionsEmails() {
  return sendBatchEmails(
    "terms",
    sendTermsAndConditionsEmail,
    2000, // 2 second delay
    {
      sendToEmails: [],
      excludeEmails: [], // optional override of emails to send to for testing
    }
  );
}

/**
 * Manually-triggered function to generate Redsys payment links in batch for a predefined list of users.
 * This function logs into Redsys once, then for each email, it looks up the registration data,
 * and creates a payment link if one doesn't already exist.
 * Results are logged to the PAYMENTLINKSDB sheet.
 */
// eslint-disable-next-line no-unused-vars
function generatePaymentLinksBatch() {
  const emailsToProcess = [];

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
        email,
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

/**
 * Send WhatsApp group invite emails to all registered participants
 * This function reads all emails from the Trip Registrations sheet and sends invite emails
 * Uses WHATSAPP EMAILS sheet to track sent emails and prevent duplicates
 */
// eslint-disable-next-line no-unused-vars
function sendWhatsAppInviteEmails() {
  const whatsappLink = "https://chat.whatsapp.com/IYh0cLoxU4V12Njmp8CcnE";

  // Wrapper function that passes the WhatsApp link to the individual sender
  const whatsappEmailSender = (email, name) => {
    return sendWhatsAppInviteEmail(email, name, whatsappLink);
  };

  return sendBatchEmails(
    "whatsapp",
    whatsappEmailSender,
    3000 // 3 second delay
  );
}

/**
 * Send trip agenda launch announcement emails to all registered participants
 * Includes special text for participants who showed interest in horseback riding
 */
// eslint-disable-next-line no-unused-vars
function sendTripAgendaAnnouncementEmails() {
  return sendBatchEmails(
    "agenda",
    sendTripAgendaAnnouncementEmail,
    2000, // 2 second delay
    {
      sendToEmails: [],
    }
  );
}

/**
 * Send individual trip agenda announcement email
 */
function sendTripAgendaAnnouncementEmail(email, name) {
  try {
    console.log(`Sending trip agenda announcement email to: ${email}`);

    // Get participant's registration data to check for horseback riding interest
    const submission = getExistingSubmission(email);
    if (!submission) {
      console.error(
        `Could not find trip registration for email: ${email}. Skipping.`
      );
      return;
    }

    const hasHorsebackInterest =
      submission.row["formData.horseback"].toString().trim().toLowerCase() ===
      "true";

    const hasRaftingSelected =
      submission.row["formData.rafting"].toString().trim().toLowerCase() ===
      "true";

    const isFacebank =
      submission.row["bankAccount"].toString().trim().toLowerCase() ===
      "facebank";

    // Get RSVP data to retrieve password for magic link
    const rsvpData = _getRsvpDataForEmail(email);
    const password = rsvpData ? rsvpData.PASSWORD : null;

    if (!password) {
      throw new Error("No password found for email");
    }

    const subject = "✨ Trip Itinerary is Live!";

    let htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #2c3e50;">Hello ${name}! ✨</h2>

        <p>The trip itinerary is now live in the app!</p>

        <p>You'll notice a notification icon on each day that requires your confirmation on new optional activities. Please confirm them as soon as possible to secure your spot as they are limited.</p>

        ${
          hasRaftingSelected
            ? `
               <p>Due to new group schedule arrangements, the rafting activity has a USD 10 price reduction, as lunch will now be provided to-go instead of served at the campsite.</p>
              `
            : `
              <p>I highly recommend considering one of the last day Bariloche experiences:</p>
              <ul style="margin: 20px 0; padding-left: 20px;">
                <li style="margin-bottom: 10px;"><strong>Rafting</strong> — perfect if you're feeling adventurous.</li>
                <li style="margin-bottom: 10px;"><strong>Circuito Chico</strong> — perfect for breathtaking views, lakes, and nature walks.</li>
              </ul>
              `
        }

        <p>If you have any questions, feel free to reach out anytime — I'll be glad to help! ❤️</p>

        ${
          isFacebank
            ? `<p style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <strong>⚠️ Important - Action Required:</strong> You have been selected to use our new United States bank account for ACH payments. Please <strong>do not</strong> use our Revolut account. Please use
  only the new account details provided in the payment section.
        </p>`
            : ""
        }`;

    // Add horseback riding specific text if the participant showed interest
    if (hasHorsebackInterest) {
      htmlBody += `
        <p style="background-color: #d1ecf1; padding: 15px; border-left: 4px solid #17a2b8; margin: 20px 0;">
          <strong>P.S.</strong> I remember you had shown interest in the horseback riding activity — we've now added this optional activity for the second morning in Mendoza. If you have any questions, just let me know!
        </p>`;
    }

    htmlBody += `
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <a href="https://argtrip.sonsolesstays.com?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}"
             style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin: 10px 0;">
            👉 Click here to view your itinerary
          </a>
        </div>
        <br>
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          Maddie
        </p>
      </div>
    `;

    const bcc = "sonsolesstays+argtrip@gmail.com";
    const emailSent = sendEmail(email, subject, htmlBody, [], bcc);

    const successMessage = hasHorsebackInterest
      ? `Trip agenda announcement email with horseback riding note sent successfully to ${email}`
      : `Trip agenda announcement email sent successfully to ${email}`;

    const failMessage = `Failed to send trip agenda announcement email to ${email}`;

    return {
      success: emailSent,
      message: emailSent ? successMessage : failMessage,
      error: emailSent ? null : "Email sending failed",
    };
  } catch (error) {
    console.error(
      `Error sending trip agenda announcement email to ${email}:`,
      error
    );
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Manual trigger function to send password emails to all RSVP users
 * Run this function manually from the Apps Script editor when needed
 */
// eslint-disable-next-line no-unused-vars
function sendPasswordEmailsToAllRSVPs() {
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
  const [headers] = values;

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
        console.error(`✗ Failed to send email to: ${email} - ${result.error}`);
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
    emailsSent,
    emailsSkipped,
    errors,
    message: `Completed: ${emailsSent} emails sent, ${emailsSkipped} skipped, ${errors} errors`,
  };
}

/**
 * Send individual second payment due today email
 */
function sendSecondPaymentDueTodayEmail(email, name) {
  try {
    console.log(`Sending second payment due today email to: ${email}`);

    // Get RSVP data to retrieve password for magic link
    const rsvpData = _getRsvpDataForEmail(email);
    const password = rsvpData ? rsvpData.PASSWORD : null;

    if (!password) {
      throw new Error("No password found for email");
    }

    const subject = "Payment Due Today";

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #2c3e50;">Hola ${name}! ✨</h2>

        <p><strong>Reminder:</strong> the second payment is due today, Thursday, October 2nd.</p>

        <p>To receive the payment link or view the bank transfer details, please make sure to accept or decline all optional activities in your itinerary. (Days with pending activities are marked with a red icon.)</p>

        <p>👉 Even if you don't plan to join, it's important to press decline so your itinerary is complete and the payment info becomes visible.</p>

        <p>If you have any trouble accessing the details or need help with the process, please don't hesitate to reach out — I'll be happy to assist.</p>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <a href="https://argtrip.sonsolesstays.com?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}"
             style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin: 10px 0;">
            👉 Click here to access the app
          </a>
        </div>

        <p style="color: #666; font-size: 14px;">
          Warm regards,<br>
          Maddie
        </p>
      </div>
    `;

    const bcc = "sonsolesstays+argtrip@gmail.com";
    const emailSent = sendEmail(email, subject, htmlBody, [], bcc);

    return {
      success: emailSent,
      message: emailSent
        ? `Second payment due today email sent successfully to ${email}`
        : `Failed to send second payment due today email to ${email}`,
      error: emailSent ? null : "Email sending failed",
    };
  } catch (error) {
    console.error(
      `Error sending second payment due today email to ${email}:`,
      error
    );
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send second payment due today emails to all registered participants
 */
// eslint-disable-next-line no-unused-vars
function sendSecondPaymentDueTodayEmails() {
  return sendBatchEmails(
    "secondPaymentDueToday",
    sendSecondPaymentDueTodayEmail,
    2000, // 2 second delay
    {
      sendToEmails: ["tinqueija@gmail.com"],
      excludeEmails: ["wconte@stanford.edu", "crinehart247@gmail.com"],
    }
  );
}

/**
 * Manually-triggered function to generate Redsys payment links in batch for second installment.
 * This function processes credit users who have completed all choices and have a pricing.balance > 0.
 * It calculates EUR amounts using hardcoded exchange rate and processing fee.
 * Results are logged to the PAYMENTLINKSDB_2 sheet.
 */
// eslint-disable-next-line no-unused-vars
function generate2ndPaymentLinksBatch() {
  let authToken = null;

  // Get all trip registrations
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(TRIP_REGISTRATIONS_SHEET_NAME);

  if (!sheet || sheet.getLastRow() <= 1) {
    console.error("Trip Registrations sheet is empty or not found");
    return;
  }

  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const [headers] = values;

  // Find required column indices
  const emailColumnIndex = headers.indexOf("formData.email");
  const firstNameColumnIndex = headers.indexOf("formData.firstName");
  const lastNameColumnIndex = headers.indexOf("formData.lastName");
  const paymentMethodColumnIndex = headers.indexOf("formData.paymentMethod");
  const balanceColumnIndex = headers.indexOf("pricing.balance");
  const secondPaymentDoneColumnIndex = headers.indexOf("PAYMENT_2");

  if (
    emailColumnIndex === -1 ||
    firstNameColumnIndex === -1 ||
    lastNameColumnIndex === -1 ||
    paymentMethodColumnIndex === -1 ||
    balanceColumnIndex === -1
  ) {
    console.error("Required columns not found in Trip Registrations sheet");
    return;
  }

  // Process each row
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const email = row[emailColumnIndex];
    const firstName = row[firstNameColumnIndex];
    const lastName = row[lastNameColumnIndex];
    const paymentMethod = row[paymentMethodColumnIndex];
    const balance = parseFloat(row[balanceColumnIndex]) || 0;
    const secondPaymentDone =
      row[secondPaymentDoneColumnIndex]?.toString().toLowerCase().trim() ===
      "true";

    if (secondPaymentDone) {
      // console.log(`Skipping ${email}: second payment already done`);
      continue;
    }

    // Skip if not credit payment method
    if (
      !paymentMethod ||
      paymentMethod.toString().toLowerCase().trim() !== "credit"
    ) {
      // console.log(`Skipping ${email}: payment method is not credit`);
      continue;
    }

    // Skip if balance is 0 or negative
    if (balance <= 0) {
      // console.log(`Skipping ${email}: balance is ${balance}`);
      continue;
    }

    // Check if user has completed all choices
    if (!hasCompletedAllChoices(email)) {
      // console.log(`Skipping ${email}: has not completed all choices`);
      continue;
    }

    // Check if there's already an active payment link for this user
    const paymentInfo = getPaymentLinkInfo2(email);
    if (paymentInfo.activeLink) {
      // console.log(
      //   `Skipping ${email}: an active second payment link already exists.`
      // );
      continue;
    }

    // Calculate EUR amounts
    const amountUsd = balance;
    const amountEur = amountUsd * EXCHANGE_RATE_USD_TO_EUR;
    const processingFee = amountEur * PROCESSING_FEE_PERCENTAGE;
    const totalEur = amountEur + processingFee;

    // Round to 2 decimal places
    const amountEurRounded = Math.round(amountEur * 100) / 100;
    const processingFeeRounded = Math.round(processingFee * 100) / 100;
    const totalEurRounded = Math.round(totalEur * 100) / 100;

    console.log(
      `email: ${email} Amount USD: ${amountUsd}, Amount EUR: ${amountEurRounded}, Processing Fee: ${processingFeeRounded}, Total EUR: ${totalEurRounded}`
    );

    continue;

    // Lazy initialization: get auth token only when we need to create the first payment link
    if (!authToken) {
      try {
        authToken = login();
        if (!authToken) {
          console.error(
            "Failed to get auth token from Redsys. Aborting batch."
          );
          return;
        }
        console.log(
          "Successfully obtained Redsys auth token for batch processing."
        );
      } catch (e) {
        console.error("Redsys login failed, cannot proceed with batch.", e);
        return;
      }
    }

    let paymentLinkData = null;

    try {
      const linkNumber = paymentInfo.expiredCount + 1;
      const orderId = `ARG_2ND_${i + 1}_${linkNumber}`;
      const order = {
        id: orderId,
        user: {
          name: `${firstName} ${lastName}`,
          email,
        },
        total: totalEurRounded.toFixed(2),
        subject: "Argentina Trip Payment - Final payment",
      };

      paymentLinkData = createPaymentLink(order, authToken);
    } catch (e) {
      console.error(`Error creating payment link for ${email}:`, e);
    }

    // Save to PAYMENTLINKSDB_2 sheet
    saveToPaymentLinksSheet2({
      timestamp: new Date().toISOString(),
      email,
      link: paymentLinkData ? paymentLinkData.urlPaygold : "",
      jsonResponse: paymentLinkData ? JSON.stringify(paymentLinkData) : "",
      status: paymentLinkData ? "success" : "failed",
      amountUsd: amountUsd.toFixed(2),
      exchangeRate: EXCHANGE_RATE_USD_TO_EUR,
      amountEur: amountEurRounded.toFixed(2),
      processingFee: processingFeeRounded.toFixed(2),
      totalEur: totalEurRounded.toFixed(2),
    });

    console.log(
      `Finished processing for ${email}. Status: ${
        paymentLinkData ? "success" : "failed"
      }`
    );

    // Add a small delay to avoid overwhelming the API
    Utilities.sleep(500); // 500ms delay
  }

  console.log("Batch second payment link generation complete.");
}
