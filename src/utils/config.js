// Configuration and Constants for React App
// Migrated from original config.js

// Apps Script Configuration
export const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbx63_b0ZLWOEm9f-EK76NJBWw-LHnkBF_8guJy-GdWihf2XGdu2L_zxGGb2-OAytcHo/exec";

export const LAMBDA_URL =
  "https://at6nwfhebl.execute-api.us-east-1.amazonaws.com/dev/";

export const LOCAL_URL = "http://localhost:3001/";

import { IS_LOCAL } from "./env";

export const BACKEND_URL = IS_LOCAL ? LOCAL_URL : LAMBDA_URL;

// Action Types for Apps Script
export const ACTION_TYPES = {
  NEW_EMAIL: "new_email",
};

// Price Configuration
export const PRICES = {
  // Base price comes from RSVP data
  privateRoom: 0, // Dynamic price from RSVP data
  horseback: 0,
  cooking: 140,
  rafting: 130,
  circuitoChico: 100,
  tango: 25,
  creditCardFeeRate: 0.0285,
  installmentRate: 0.35,
  valleDeUco: 40,
};

// Luggage Configuration
export const LUGGAGE = {
  personalItem: {
    name: "Personal Item",
    description:
      "Small backpack or purse. It must not exceed the following dimensions: 45 cm x 35 cm x 25 cm",
    // maxWeight: "8kg",
    icon: "fas fa-hiking",
    included: true,
  },
  carryOn: {
    name: "Carry-on Luggage",
    description:
      "Small suitcase or bag. It must not exceed the following dimensions: 55 cm x 35 cm x 25 cm",
    maxWeight: "10kg",
    icon: "fas fa-suitcase-rolling",
    included: true,
  },
  checked: {
    name: "Checked Luggage (Not Recommended)",
    description:
      "Large suitcase or bag. It must not exceed 158 cm in total linear dimensions and 23kg maximum weight.",
    maxWeight: "23kg",
    icon: "fas fa-suitcase",
    included: false,
    discouraged: true,
    warningMessage:
      "We highly recommend traveling light, as we'll be changing cities every two days. If you think bringing a larger suitcase will be unavoidable, no problem! Just let us know and we'll help you arrange the extra checked luggage. 😊",
  },
};

// Contact Information
export const CONTACTS = [
  {
    name: "Maddie (Travel Coordinator)",
    phone: "+54 (911) 6972 9783",
    whatsapp: "https://wa.me/5491169729783",
  },
];

// Email Configuration
export const EMAIL_CONFIG = {
  MADDIE: "sonsolesstays+argtrip@gmail.com",
};

// Form Field Names - Direct 1:1 mapping to backend
export const FORM_FIELDS = {
  EMAIL: "email",
  FIRST_NAME: "firstName",
  LAST_NAME: "lastName",
  PHONE_NUMBER: "phoneNumber",
  PRIVATE_ROOM_UPGRADE: "privateRoomUpgrade",
  ROOMMATE_PREFERENCE: "roommatePreference",
  ROOMMATE_NAME: "roommateName",
  // Activities (sent as-is to backend)
  RAFTING: "rafting",
  HORSEBACK: "horseback",
  COOKING: "cooking",
  TANGO: "tango",
  // Luggage
  CHECKED_LUGGAGE: "checkedLuggage",
  // Payment options
  PAYMENT_SCHEDULE: "paymentSchedule",
  PAYMENT_METHOD: "paymentMethod",
  CRYPTO_CURRENCY: "cryptoCurrency",
  CRYPTO_NETWORK: "cryptoNetwork",
  // Dietary preferences
  DIETARY_RESTRICTIONS: "dietaryRestrictions",
  DIETARY_MESSAGE: "dietaryMessage",
};

// Application Configuration
// Central configuration file for the Argentina Trip form

// Form Steps Configuration
export const STEPS = {
  EMAIL_LOGIN: "email-login",
  NEW_EMAIL: "new-email",
  RSVP_DISPLAY: "rsvp-display",
  ADDONS: "addons",
  ACTIVITIES: "activities",
  PAYMENT: "payment",
  CONFIRMATION: "confirmation",
};

// Step Navigation Configuration
export const STEP_CONFIG = {
  [STEPS.EMAIL_LOGIN]: {
    title: "Login",
    description: "Enter your credentials",
    showInNavigation: false,
  },
  [STEPS.NEW_EMAIL]: {
    title: "Request Access",
    description: "Request trip access",
    showInNavigation: false,
  },
  [STEPS.RSVP_DISPLAY]: {
    title: "Trip Details",
    description: "Review your confirmed itinerary",
    showInNavigation: true,
  },
  [STEPS.ADDONS]: {
    title: "Add-ons",
    description: "Accommodation & dietary preferences",
    showInNavigation: true,
  },
  [STEPS.ACTIVITIES]: {
    title: "Activities",
    description: "Optional excursions",
    showInNavigation: true,
  },
  [STEPS.PAYMENT]: {
    title: "Payment",
    description: "Payment method & schedule",
    showInNavigation: true,
  },
  [STEPS.CONFIRMATION]: {
    title: "Confirmation",
    description: "Registration complete",
    showInNavigation: false,
  },
};

// Get ordered steps for navigation
export const getOrderedSteps = () => {
  return Object.keys(STEP_CONFIG).filter(
    (step) => STEP_CONFIG[step].showInNavigation
  );
};

// Validation Configuration
export const VALIDATION = {
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_PATTERN: /^[\d\s\-+()]+$/,
  MIN_NAME_LENGTH: 2,
  MAX_MESSAGE_LENGTH: 500,
};

// UI Constants
export const UI_CONSTANTS = {
  ANIMATION_DURATION: 300,
  TOAST_DURATION: 5000,
  LOADING_DELAY: 500,
  SUCCESS_COLOR: "#22c55e",
  ERROR_COLOR: "#ef4444",
  WARNING_COLOR: "#f59e0b",
};

export const REVOLUT_BANK_DETAILS = [
  { label: "Bank Name", value: "Revolut" },
  { label: "Revolut Handle", value: "sonsol1a9x" },
  { label: "Account Holder", value: "SONSOLES RKT SL" },
  { label: "IBAN", value: "ES51 1583 0001 1093 9530 1696" },
  { label: "BIC", value: "REVOESM2" },
  { label: "SWIFT", value: "CHASGB2L" },
  { label: "Currency", value: "USD" },
  {
    label: "Holder address",
    value: "CALLE BERNARDO LOPEZ GARCIA, 18 - BJ, 03013, ALICANTE",
  },

  { label: "Country", value: "Spain" },
];

export const FACEBANK_BANK_DETAILS = [
  { label: "Bank Name", value: "Facebank" },
  { label: "Account Holder", value: "Maria Alejandra di Tada" },
  { label: "Account Type", value: "Checking" },
  { label: "Account Number", value: "56100188851" },
  { label: "Routing Number (ABA)", value: "021502189" },
  { label: "SWIFT", value: "FILCPR22" },
  { label: "Currency", value: "USD" },
  { label: "Country", value: "United States" },
];

export const CRYPTO_WALLETS = {
  ETH: "0xB15E94F7eDD9bB738E5Ba0991ee173E4Fb40d6B3", // Used for both ETH and ARB
  SOL: "6GtbPf58peWCT2EQEpbPdvAx4XuRAGmCW4vQszt1vqjy", // Used for SOL
};

export const NETWORK_INFO = {
  ETH: {
    name: "Ethereum",
    symbol: "ETH",
    color: "#627EEA",
    icon: "fab fa-ethereum",
  },
  ARB: {
    name: "Arbitrum",
    symbol: "ARB",
    color: "#28A0F0",
    icon: "fas fa-layer-group",
  },
  SOL: {
    name: "Solana",
    symbol: "SOL",
    color: "#9945FF",
    icon: "fas fa-sun",
  },
};
