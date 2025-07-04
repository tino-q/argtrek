// Configuration and Constants for React App
// Migrated from original config.js

// Apps Script Configuration
export const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxCn7TIbAorWcIf9ZZSptok0VRoC203-iDMzwBukLlkfRezolntw0n6XKP72-DF-Orm/exec";

// Action Types for Apps Script
export const ACTION_TYPES = {
  NEW_EMAIL: "new_email",
};

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

// Email Configuration
export const EMAIL_CONFIG = {
  MADDIE: "sonsolesstays+argtrek@gmail.com",
};

// Form Field Names - Direct 1:1 mapping to backend
export const FORM_FIELDS = {
  EMAIL: "email",
  FULL_NAME: "fullName",
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
  // Luggage
  CHECKED_LUGGAGE: "checkedLuggage",
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
