/**
 * Google Apps Script for Argentina Trip Form
 * Handles POST requests and saves data to Google Sheets
 *
 * Google Apps Script globals: ContentService, SpreadsheetApp
 */

/* global ContentService, SpreadsheetApp */

// Configuration
const SHEET_NAME = "Trip Registrations";
const PRICING = {
  tripOption1: 2250,
  tripOption2: 2600,
  privateRoomUpgrade: 350,
  horsebackRiding: 45,
  cookingClass: 140,
  rafting: 75,
  creditCardFeeRate: 0.04,
  installmentRate: 0.35,
  vatRate: 0.21,
};

/**
 * Main function to handle POST requests
 */
// eslint-disable-next-line no-unused-vars
function doPost(e) {
  try {
    // Get data from FormData (comes through e.parameter)
    const data = e.parameter;

    // Validate required fields
    const validation = validateFormData(data);
    if (!validation.isValid) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          error: validation.errors.join(", "),
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Process and save data
    const processedData = processFormData(data);
    const result = saveToSheet(processedData);

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
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
}

/**
 * Validate incoming form data
 */
function validateFormData(data) {
  const errors = [];

  // Required fields validation
  if (!data.email || !isValidEmail(data.email)) {
    errors.push("Valid email address is required");
  }

  if (!data.fullName || data.fullName.trim() === "") {
    errors.push("Full name is required");
  }

  const tripOptionNum = parseInt(data.tripOption);
  if (!data.tripOption || (tripOptionNum !== 1 && tripOptionNum !== 2)) {
    errors.push("Trip option must be 1 or 2");
  }

  if (
    !data.paymentSchedule ||
    !["full", "installments"].includes(data.paymentSchedule)
  ) {
    errors.push('Payment schedule must be either "full" or "installments"');
  }

  if (!data.paymentMethod || !["credit", "bank"].includes(data.paymentMethod)) {
    errors.push('Payment method must be either "credit" or "bank"');
  }

  // Boolean fields validation (FormData sends strings, so check for 'true'/'false')
  const booleanFields = [
    "horsebackRiding",
    "cookingClass",
    "rafting",
    "argentineCitizen",
  ];
  booleanFields.forEach((field) => {
    if (data[field] !== "true" && data[field] !== "false") {
      errors.push(`${field} must be a boolean value`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
}

/**
 * Process form data and calculate pricing
 */
function processFormData(data) {
  const timestamp = new Date();

  // Convert string values from FormData to appropriate types
  const tripOption = parseInt(data.tripOption);
  const horsebackRiding = data.horsebackRiding === "true";
  const cookingClass = data.cookingClass === "true";
  const rafting = data.rafting === "true";
  const argentineCitizen = data.argentineCitizen === "true";

  // Calculate base price
  const basePrice =
    tripOption === 1 ? PRICING.tripOption1 : PRICING.tripOption2;

  // Calculate accommodation price (private room if roommate is empty/null)
  const accommodationPrice =
    !data.roommate || data.roommate.trim() === ""
      ? PRICING.privateRoomUpgrade
      : 0;

  // Calculate activities price
  let activitiesPrice = 0;
  if (horsebackRiding) activitiesPrice += PRICING.horsebackRiding;
  if (cookingClass) activitiesPrice += PRICING.cookingClass;
  if (rafting) activitiesPrice += PRICING.rafting;

  // Calculate subtotal
  const subtotal = basePrice + accommodationPrice + activitiesPrice;

  // Calculate processing fee (4% for credit cards)
  const processingFee =
    data.paymentMethod === "credit" ? subtotal * PRICING.creditCardFeeRate : 0;

  // Calculate VAT (21% for Argentine citizens)
  const vatAmount = argentineCitizen ? subtotal * PRICING.vatRate : 0;

  // Calculate total
  const total = subtotal + processingFee + vatAmount;

  // Calculate installment amount (35% for installments)
  const installmentAmount =
    data.paymentSchedule === "installments"
      ? total * PRICING.installmentRate
      : total;

  return {
    // Basic Information
    timestamp: timestamp,
    email: data.email.trim(),
    fullName: data.fullName.trim(),

    // Trip Configuration
    tripOption: tripOption,

    // Accommodation
    roommate: data.roommate ? data.roommate.trim() : "",

    // Activities
    horsebackRiding: horsebackRiding,
    cookingClass: cookingClass,
    rafting: rafting,

    // Payment Configuration
    paymentSchedule: data.paymentSchedule,
    paymentMethod: data.paymentMethod,
    argentineCitizen: argentineCitizen,

    // Calculated Pricing
    basePrice: basePrice,
    accommodationPrice: accommodationPrice,
    activitiesPrice: activitiesPrice,
    subtotal: subtotal,
    processingFee: Math.round(processingFee * 100) / 100, // Round to 2 decimal places
    vatAmount: Math.round(vatAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    installmentAmount: Math.round(installmentAmount * 100) / 100,
  };
}

/**
 * Check if email already exists in the sheet
 */
function emailExists(sheet, email) {
  if (sheet.getLastRow() <= 1) {
    // Only header row exists, no data yet
    return false;
  }

  // Get all email values (column B, starting from row 2)
  const emailRange = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1);
  const emailValues = emailRange.getValues();

  // Check if the email already exists
  for (let i = 0; i < emailValues.length; i++) {
    if (
      emailValues[i][0] &&
      emailValues[i][0].toString().toLowerCase() === email.toLowerCase()
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
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);

    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      setupSheetHeaders(sheet);
    }

    // Check if email already exists (primary key constraint)
    if (emailExists(sheet, data.email)) {
      return {
        success: false,
        error: `Email ${data.email} has already been registered for this trip.`,
      };
    }

    // Prepare row data in the correct order
    const rowData = [
      data.timestamp,
      data.email,
      data.fullName,
      data.tripOption,
      data.roommate,
      data.horsebackRiding,
      data.cookingClass,
      data.rafting,
      data.paymentSchedule,
      data.paymentMethod,
      data.argentineCitizen,
      data.basePrice,
      data.accommodationPrice,
      data.activitiesPrice,
      data.subtotal,
      data.processingFee,
      data.vatAmount,
      data.total,
      data.installmentAmount,
    ];

    // Add row to sheet
    sheet.appendRow(rowData);
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
 * Setup sheet headers
 */
function setupSheetHeaders(sheet) {
  const headers = [
    "Timestamp",
    "Email",
    "Full Name",
    "Trip Option",
    "Roommate",
    "Horseback Riding",
    "Cooking Class",
    "Rafting",
    "Payment Schedule",
    "Payment Method",
    "Argentine Citizen",
    "Base Price",
    "Accommodation Price",
    "Activities Price",
    "Subtotal",
    "Processing Fee",
    "VAT Amount",
    "Total",
    "Installment Amount",
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

/**
 * Email validation helper
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
