// Configuration and Constants for React App
// Migrated from original config.js

// Apps Script Configuration
export const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyo2LxXwOCiIXSzObrgcjrXutVvdHzpJ8zSpG99JLii6uMcMW-xCMu9FjwVmohSRY29/exec";

// Price Configuration
export const PRICES = {
  // Base price comes from RSVP data
  privateRoom: 0, // Dynamic price from RSVP data
  horseback: 45,
  cooking: 140,
  rafting: 75,
  creditCardFeeRate: 0.04,
  installmentRate: 0.35,
  vatRate: 0.21,
};

// Activity Information
export const ACTIVITIES = {
  horseback: {
    id: "horseback",
    name: "Horse Back Riding",
    price: 45,
    location: "Mendoza",
  },
  cooking: {
    id: "cooking",
    name: "Empanadas Cooking Class",
    price: 140,
    location: "Mendoza",
  },
  rafting: {
    id: "rafting",
    name: "Rafting Adventure",
    price: 75,
    location: "Bariloche",
  },
};

// Luggage Configuration
export const LUGGAGE = {
  personalItem: {
    name: "Personal Item",
    description: "Small backpack or purse",
    maxWeight: "8kg",
    icon: "fas fa-hiking",
    included: true,
  },
  carryOn: {
    name: "Carry-on Luggage",
    description: "Small suitcase or bag",
    maxWeight: "10kg",
    icon: "fas fa-suitcase-rolling",
    included: true,
  },
  checked: {
    name: "Checked Luggage",
    description: "Add checked luggage to all your flights",
    maxWeight: "23kg",
    icon: "fas fa-suitcase",
    included: false,
  },
};

// Contact Information
export const CONTACTS = [
  {
    name: "Maddie (Travel Coordinator)",
    phone: "+34 (689) 200 162",
    whatsapp: "https://wa.me/34689200162",
  },
  {
    name: "Nati",
    phone: "+1 (469) 612 2335",
    whatsapp: "https://wa.me/14696122335",
  },
  {
    name: "Facu",
    phone: "+1 (650) 512 6902",
    whatsapp: "https://wa.me/16505126902",
  },
];

// Form Field Names - Direct 1:1 mapping to backend
export const FORM_FIELDS = {
  EMAIL: "email",
  FULL_NAME: "fullName",
  PRIVATE_ROOM_UPGRADE: "privateRoomUpgrade",
  ROOMMATE_PREFERENCE: "roommatePreference",
  ROOMMATE_NAME: "roommateName",
  // Activities (sent as-is to backend)
  RAFTING: "rafting",
  HORSEBACK: "horseback",
  COOKING: "cooking",
  // Payment options
  PAYMENT_SCHEDULE: "paymentSchedule",
  PAYMENT_METHOD: "paymentMethod",
  CRYPTO_CURRENCY: "cryptoCurrency",
  CRYPTO_NETWORK: "cryptoNetwork",
  ARGENTINE_CITIZEN: "argentineCitizen",
  // Dietary preferences
  DIETARY_RESTRICTIONS: "dietaryRestrictions",
  DIETARY_MESSAGE: "dietaryMessage",
};
