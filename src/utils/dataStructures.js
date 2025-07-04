/**
 * Data Structure Documentation and Validation
 * Central source of truth for all data structures used in the application
 * This prevents field naming errors and provides clear documentation
 */

// ========================================
// PRICING OBJECT STRUCTURE
// ========================================
export const PRICING_STRUCTURE = {
  basePrice: {
    type: "number",
    description: "Base trip price from RSVP data",
    required: true,
    source: "rsvpData.PACKPRICE",
  },
  privateRoomUpgrade: {
    type: "number",
    description: "Private room upgrade cost",
    required: true,
    source: "rsvpData.PRIVATEROOM",
  },
  activitiesPrice: {
    type: "number",
    description: "Total cost of selected activities",
    required: true,
    calculated: true,
  },
  vatAmount: {
    type: "number",
    description: "VAT amount for accommodation (Argentine citizens)",
    required: true,
    source: "rsvpData.IVAALOJ",
  },
  subtotal: {
    type: "number",
    description: "Base + accommodation + activities",
    required: true,
    calculated: true,
  },
  processingFee: {
    type: "number",
    description: "Credit card processing fee (4%)",
    required: true,
    calculated: true,
    aliases: ["creditCardFee"], // Common mistake
  },
  total: {
    type: "number",
    description: "Final total amount including all fees",
    required: true,
    calculated: true,
  },
  installmentAmount: {
    type: "number",
    description: "First payment amount (35% of total)",
    required: true,
    calculated: true,
    aliases: ["firstPayment"], // Common mistake
  },
  activities: {
    type: "array",
    description: "Array of selected activities with name and price",
    required: true,
    structure: {
      name: "string",
      price: "number",
    },
  },
};

// ========================================
// FORM DATA STRUCTURE
// ========================================
export const FORM_DATA_STRUCTURE = {
  // Personal Information
  email: {
    type: "string",
    description: "User email address",
    required: true,
    validation: "email",
  },
  fullName: {
    type: "string",
    description: "Full name of traveler",
    required: true,
  },
  firstName: {
    type: "string",
    description: "Traveler's first name",
    required: true,
  },
  lastName: {
    type: "string",
    description: "Traveler's last name",
    required: true,
  },
  phoneNumber: {
    type: "string",
    description: "Traveler's phone number",
    required: true,
    validation: "phone",
  },

  // Accommodation
  privateRoomUpgrade: {
    type: "boolean",
    description: "Whether user wants private room upgrade",
    required: true,
  },
  roommatePreference: {
    type: "string",
    description: "Roommate preference (specific/any)",
    required: false,
  },
  roommateName: {
    type: "string",
    description: "Specific roommate name if specified",
    required: false,
  },

  // Activities
  rafting: {
    type: "boolean",
    description: "Rafting activity selection",
    required: true,
  },
  horseback: {
    type: "boolean",
    description: "Horseback riding activity selection",
    required: true,
  },
  cooking: {
    type: "boolean",
    description: "Cooking class activity selection",
    required: true,
  },

  // Luggage
  checkedLuggage: {
    type: "boolean",
    description: "Whether user wants checked luggage (not recommended)",
    required: true,
  },

  // Payment
  paymentSchedule: {
    type: "string",
    description: "Payment schedule (full/installments)",
    required: true,
    values: ["full", "installments"],
  },
  paymentMethod: {
    type: "string",
    description: "Payment method (credit/bank/crypto)",
    required: true,
    values: ["credit", "bank", "crypto"],
  },
  cryptoCurrency: {
    type: "string",
    description: "Cryptocurrency type (USDT/USDC)",
    required: false,
    values: ["USDT", "USDC"],
  },
  cryptoNetwork: {
    type: "string",
    description: "Crypto network (ETH/ARB/SOL)",
    required: false,
    values: ["ETH", "ARB", "SOL"],
  },
  argentineCitizen: {
    type: "boolean",
    description: "Whether user is Argentine citizen",
    required: true,
  },

  // Dietary
  dietaryRestrictions: {
    type: "array|string",
    description: "Dietary restrictions (can be array or string)",
    required: false,
  },
  dietaryMessage: {
    type: "string",
    description: "Additional dietary notes",
    required: false,
  },
};

// ========================================
// RSVP DATA STRUCTURE
// ========================================
export const RSVP_DATA_STRUCTURE = {
  name: {
    type: "string",
    description: "Primary traveler name",
    required: true,
  },
  plus1: {
    type: "string",
    description: "Plus one name",
    required: false,
  },
  email: {
    type: "string",
    description: "Email address",
    required: true,
  },
  PACKPRICE: {
    type: "number",
    description: "Base trip price",
    required: true,
  },
  PRIVATEROOM: {
    type: "number",
    description: "Private room upgrade price",
    required: true,
  },
  IVAALOJ: {
    type: "number",
    description: "VAT amount for accommodation",
    required: true,
  },
  // VALIJA: {
  //   type: "number",
  //   description: "Checked luggage price",
  //   required: true,
  // }, // Removed - no longer pricing luggage
};

// ========================================
// VALIDATION FUNCTIONS
// ========================================

/**
 * Validate pricing object structure
 * @param {Object} pricing - Pricing object to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validatePricingStructure = (pricing) => {
  const errors = [];

  if (!pricing || typeof pricing !== "object") {
    return { isValid: false, errors: ["Pricing object is required"] };
  }

  // Check required fields
  Object.entries(PRICING_STRUCTURE).forEach(([key, config]) => {
    if (config.required && pricing[key] === undefined) {
      errors.push(`Missing required field: ${key}`);
    }

    if (pricing[key] !== undefined && typeof pricing[key] !== config.type) {
      errors.push(
        `Field ${key} should be ${config.type}, got ${typeof pricing[key]}`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    suggestions: errors.length > 0 ? generateSuggestions(pricing) : [],
  };
};

/**
 * Generate suggestions for common field name mistakes
 * @param {Object} obj - Object to analyze
 * @returns {Array} Array of suggestions
 */
const generateSuggestions = (obj) => {
  const suggestions = [];

  // Check for common aliases
  Object.entries(PRICING_STRUCTURE).forEach(([correctKey, config]) => {
    if (config.aliases && obj[correctKey] === undefined) {
      config.aliases.forEach((alias) => {
        if (obj[alias] !== undefined) {
          suggestions.push(`Found '${alias}', did you mean '${correctKey}'?`);
        }
      });
    }
  });

  return suggestions;
};

/**
 * Get calculated pricing properties
 * @param {Object} pricing - Base pricing object
 * @returns {Object} Object with calculated properties
 */
export const getCalculatedPricingProperties = (pricing) => {
  if (!pricing || typeof pricing !== "object") {
    return {};
  }

  return {
    // Second payment calculation
    secondPayment: pricing.total - (pricing.installmentAmount || 0),

    // Payment breakdown
    paymentBreakdown: {
      firstPayment: pricing.installmentAmount || pricing.total,
      secondPayment: pricing.total - (pricing.installmentAmount || 0),
      totalPayments: pricing.installmentAmount ? 2 : 1,
    },

    // Percentage breakdown
    percentageBreakdown: {
      firstPaymentPercentage: pricing.installmentAmount ? 35 : 100,
      secondPaymentPercentage: pricing.installmentAmount ? 65 : 0,
    },
  };
};

/**
 * Safe field accessor with fallback and suggestions
 * @param {Object} obj - Object to access
 * @param {string} field - Field name to access
 * @param {*} fallback - Fallback value
 * @returns {*} Field value or fallback
 */
export const safeFieldAccess = (obj, field, fallback = null) => {
  if (!obj || typeof obj !== "object") {
    console.warn(
      `safeFieldAccess: Invalid object provided for field '${field}'`
    );
    return fallback;
  }

  if (obj[field] !== undefined) {
    return obj[field];
  }

  // Check for common aliases
  const structure = PRICING_STRUCTURE[field] || FORM_DATA_STRUCTURE[field];
  if (structure && structure.aliases) {
    for (const alias of structure.aliases) {
      if (obj[alias] !== undefined) {
        console.warn(
          `Field '${field}' not found, using alias '${alias}'. Consider updating your code.`
        );
        return obj[alias];
      }
    }
  }

  console.warn(
    `Field '${field}' not found in object. Available fields: ${Object.keys(obj).join(", ")}`
  );
  return fallback;
};

/**
 * Development helper: Log structure mismatches
 * @param {Object} obj - Object to analyze
 * @param {Object} expectedStructure - Expected structure
 * @param {string} objectName - Name for logging
 */
export const logStructureMismatches = (
  obj,
  expectedStructure,
  objectName = "Object"
) => {
  // Only log in development mode
  if (import.meta.env.MODE !== "development") return;

  const validation = validatePricingStructure(obj);
  if (!validation.isValid) {
    console.group(`🔍 ${objectName} Structure Issues:`);
    validation.errors.forEach((error) => console.warn(`❌ ${error}`));
    validation.suggestions.forEach((suggestion) =>
      console.info(`💡 ${suggestion}`)
    );
    console.groupEnd();
  }
};

// ========================================
// CONSTANTS FOR SAFE ACCESS
// ========================================

export const SAFE_PRICING_FIELDS = {
  BASE_PRICE: "basePrice",
  PRIVATE_ROOM_UPGRADE: "privateRoomUpgrade",
  ACTIVITIES_PRICE: "activitiesPrice",
  VAT_AMOUNT: "vatAmount",
  SUBTOTAL: "subtotal",
  PROCESSING_FEE: "processingFee", // NOT creditCardFee
  TOTAL: "total",
  INSTALLMENT_AMOUNT: "installmentAmount", // First payment (35%)
  ACTIVITIES: "activities",
};

export const SAFE_FORM_FIELDS = {
  EMAIL: "email",
  FULL_NAME: "fullName",
  FIRST_NAME: "firstName",
  LAST_NAME: "lastName",
  PHONE_NUMBER: "phoneNumber",
  PRIVATE_ROOM_UPGRADE: "privateRoomUpgrade",
  ROOMMATE_PREFERENCE: "roommatePreference",
  ROOMMATE_NAME: "roommateName",
  RAFTING: "rafting",
  HORSEBACK: "horseback",
  COOKING: "cooking",
  CHECKED_LUGGAGE: "checkedLuggage",
  PAYMENT_SCHEDULE: "paymentSchedule",
  PAYMENT_METHOD: "paymentMethod",
  CRYPTO_CURRENCY: "cryptoCurrency",
  CRYPTO_NETWORK: "cryptoNetwork",
  ARGENTINE_CITIZEN: "argentineCitizen",
  DIETARY_RESTRICTIONS: "dietaryRestrictions",
  DIETARY_MESSAGE: "dietaryMessage",
};
