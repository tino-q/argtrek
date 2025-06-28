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
  subtotal: {
    type: "number",
    description: "Base + accommodation + activities",
    required: true,
    calculated: true,
  },
  processingFee: {
    type: "number",
    description: "Credit card processing fee (2.85%)",
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
  // Contact Information
  email: {
    type: "string",
    description: "Participant's email address",
    required: true,
    validation: "email",
  },
  firstName: {
    type: "string",
    description: "Participant's first name",
    required: true,
    minLength: 2,
  },
  lastName: {
    type: "string",
    description: "Participant's last name",
    required: true,
    minLength: 2,
  },
  phoneNumber: {
    type: "string",
    description: "Participant's phone number",
    required: true,
  },

  // Accommodation
  privateRoomUpgrade: {
    type: "boolean",
    description: "Whether user wants private room upgrade",
    required: true,
  },
  roommatePreference: {
    type: "string",
    description: "Roommate preference (random/specific)",
    required: false,
    values: ["random", "specific", ""],
  },
  roommateName: {
    type: "string",
    description: "Specific roommate name if applicable",
    required: false,
  },

  // Activities
  rafting: {
    type: "boolean",
    description: "Whether user selected rafting activity",
    required: true,
  },
  horseback: {
    type: "boolean",
    description: "Whether user selected horseback riding",
    required: true,
  },
  cooking: {
    type: "boolean",
    description: "Whether user selected cooking class",
    required: true,
  },
  tango: {
    type: "boolean",
    description: "Whether user selected tango night",
    required: true,
  },

  // Luggage
  checkedLuggage: {
    type: "boolean",
    description: "Whether user needs checked luggage",
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
 * Generate suggestions for common pricing structure errors
 * @param {Object} pricing - Pricing object
 * @returns {Array} Array of suggestion strings
 */
const generateSuggestions = (pricing) => {
  const suggestions = [];

  // Check for common alias mistakes
  if (pricing.creditCardFee && !pricing.processingFee) {
    suggestions.push(
      "Use 'processingFee' instead of 'creditCardFee' for consistency"
    );
  }

  if (pricing.firstPayment && !pricing.installmentAmount) {
    suggestions.push(
      "Use 'installmentAmount' instead of 'firstPayment' for consistency"
    );
  }

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
 * Validate form data structure
 * @param {Object} formData - Form data object to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateFormDataStructure = (formData) => {
  const errors = [];

  if (!formData || typeof formData !== "object") {
    return { isValid: false, errors: ["Form data object is required"] };
  }

  // Check required fields
  Object.entries(FORM_DATA_STRUCTURE).forEach(([key, config]) => {
    if (config.required && formData[key] === undefined) {
      errors.push(`Missing required field: ${key}`);
    }

    if (formData[key] !== undefined) {
      const value = formData[key];
      const expectedType = config.type;

      // Handle array|string type
      if (expectedType.includes("|")) {
        const types = expectedType.split("|");
        const isValidType = types.some((type) => {
          if (type === "array") {return Array.isArray(value);}
          return typeof value === type;
        });

        if (!isValidType) {
          errors.push(
            `Field ${key} should be one of: ${types.join(", ")}, got ${typeof value}`
          );
        }
      } else if (typeof value !== expectedType) {
        errors.push(
          `Field ${key} should be ${expectedType}, got ${typeof value}`
        );
      }

      // Check allowed values
      if (config.values && !config.values.includes(value)) {
        errors.push(
          `Field ${key} must be one of: ${config.values.join(", ")}, got: ${value}`
        );
      }

      // Check minimum length for strings
      if (
        config.minLength &&
        typeof value === "string" &&
        value.length < config.minLength
      ) {
        errors.push(
          `Field ${key} must be at least ${config.minLength} characters long`
        );
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ========================================
// CONSTANTS FOR SAFE ACCESS
// ========================================

export const SAFE_PRICING_FIELDS = {
  BASE_PRICE: "basePrice",
  PRIVATE_ROOM_UPGRADE: "privateRoomUpgrade",
  ACTIVITIES_PRICE: "activitiesPrice",
  SUBTOTAL: "subtotal",
  PROCESSING_FEE: "processingFee", // NOT creditCardFee
  TOTAL: "total",
  INSTALLMENT_AMOUNT: "installmentAmount", // First payment (35%)
  ACTIVITIES: "activities",
};

export const SAFE_FORM_FIELDS = {
  EMAIL: "email",
  FIRST_NAME: "firstName",
  LAST_NAME: "lastName",
  PHONE_NUMBER: "phoneNumber",
  PRIVATE_ROOM_UPGRADE: "privateRoomUpgrade",
  ROOMMATE_PREFERENCE: "roommatePreference",
  ROOMMATE_NAME: "roommateName",
  RAFTING: "rafting",
  HORSEBACK: "horseback",
  COOKING: "cooking",
  TANGO: "tango",
  CHECKED_LUGGAGE: "checkedLuggage",
  PAYMENT_SCHEDULE: "paymentSchedule",
  PAYMENT_METHOD: "paymentMethod",
  CRYPTO_CURRENCY: "cryptoCurrency",
  CRYPTO_NETWORK: "cryptoNetwork",
  DIETARY_RESTRICTIONS: "dietaryRestrictions",
  DIETARY_MESSAGE: "dietaryMessage",
};
