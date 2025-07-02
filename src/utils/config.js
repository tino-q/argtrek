// Configuration and Constants for React App
// Migrated from original config.js

// Price Configuration
export const PRICES = {
  tripOption1: 2250,
  tripOption2: 2600,
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

// Trip Options
export const TRIP_OPTIONS = [
  {
    id: "option1",
    value: 2250,
    name: "Option 1",
    price: "~$2,250 USD",
    includes: [
      { location: "Buenos Aires", dates: "NOV 22nd - NOV 24th" },
      { location: "Bariloche", dates: "NOV 24th - NOV 27th" },
      { location: "Mendoza", dates: "NOV 27th - NOV 29th" },
    ],
    bestFor: [
      "People who do not want to miss Monday class",
      "People who want to explore Patagonia or Chile post Trek",
      "People who want to run El Cruce",
    ],
    endsIn: "Mendoza - November 29th",
  },
  {
    id: "option2",
    value: 2600,
    name: "Option 2",
    price: "~$2,600 USD",
    includes: [
      { location: "Buenos Aires", dates: "NOV 22nd - NOV 25th" },
      { location: "Bariloche", dates: "NOV 25th - NOV 28th" },
      { location: "Mendoza", dates: "NOV 28th - DEC 1st" },
    ],
    bestFor: [
      "People who want more time in each location",
      "People who want to experience more of Argentine culture",
      "People who prefer a more relaxed pace",
    ],
    endsIn: "Mendoza - December 1st",
  },
];

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

// Form Field Names (for consistency)
export const FORM_FIELDS = {
  EMAIL: "email",
  FULL_NAME: "fullName",
  TRIP_OPTION: "tripOption",
  ACCOMMODATION: "accommodation",
  ACCOMMODATION_UPGRADE_PRICE: "accommodationUpgradePrice",
  ROOMMATE: "roommate",
  ROOMMATE_PREFERENCE: "roommatePreference",
  ROOMMATE_NAME: "roommateName",
  ACTIVITIES: "activities",
  PRIVATE_ROOM_UPGRADE: "privateRoomUpgrade",
  SEEKING_ROOMMATE: "seekingRoommate",
  PAYMENT_SCHEDULE: "paymentSchedule",
  PAYMENT_METHOD: "paymentMethod",
  ARGENTINE_CITIZEN: "argentineCitizen",
};
