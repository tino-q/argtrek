import { FORM_FIELDS, PRICES } from "./config";
import { getMainActivityImage } from "./imageLoader";

export const ACTIVITY_LIST = [
  {
    id: "rafting",
    formField: FORM_FIELDS.RAFTING,
    icon: "fas fa-water",
    name: "Rafting Adventure",
    subtitles: ["Complete rafting experience", "Picnic lunch @ campsite"],
    location: "Bariloche",
    date: "November 26th - All Day",
    price: PRICES.rafting,
    descriptionLines: [
      "Approx. 70 km from Bariloche (1 hour by bus)",
      "📍 Located halfway between Bariloche and El Bolsón",
      "🕒 Total duration: ~5 hours",
      "",
      "Includes exclusive rafts for the group and full river gear (helmet, life jacket, paddle, wetsuit, etc.).",
      "",
      "Not everyone needs to raft! If someone prefers not to get on the river, they can still join the group — they'll be taken in a pickup truck (~25 min ride) to the meeting point.",
      "",
      "Activity breakdown:",
      "• ~1 hour prep & safety briefing",
      "• ~1 hour 15 min on the water (duration may vary depending on water level and optional swim stops)",
      "• ~1 hour picnic lunch & hangout at the riverside field/camp",
      "",
      "⚠️ Important: Water shoes are required (or sturdy footwear that can get wet).",
    ],
    image: getMainActivityImage("rafting"),
  },
  {
    id: "horseback",
    formField: FORM_FIELDS.HORSEBACK,
    icon: "fas fa-horse",
    name: "Horseback Riding",
    location: "Location TBD",
    date: "Date TBD",
    price: PRICES.horseback,
    descriptionLines: [
      "We're exploring the option of offering a horseback riding experience in either Mendoza or Bariloche.",
      "If this sounds like something you'd be interested in, please let us know so we can share more details as soon as they're confirmed!",
    ],
    image: getMainActivityImage("horseback"),
  },
  {
    id: "cooking",
    formField: FORM_FIELDS.COOKING,
    icon: "fas fa-utensils",
    name: "Empanadas Cooking Class",
    subtitles: ["3 Course lunch menu", "Wine pairing at iconic Mendoza winery"],
    location: "Mendoza",
    date: "November 28th - Midday",
    price: PRICES.cooking,
    descriptionLines: [
      "We'll start the day with a quick breakfast at Casa del Visitante, followed by a hands-on cooking class where you'll learn to make traditional Argentine empanadas — and, if time allows, pastelitos and homemade bread too.",
      "",
      "Each participant receives a souvenir apron.",
      "",
      "We'll end the experience with a three-course lunch paired with wines, enjoyed on-site.",
      "",
      "A delicious way to connect with local flavors and traditions.",
    ],
    image: getMainActivityImage("empanadas"),
  },
  {
    id: "tango",
    formField: FORM_FIELDS.TANGO,
    icon: "fas fa-music",
    name: "Tango Night",
    location: "Buenos Aires",
    date: "November 23rd - Evening",
    price: PRICES.tango,
    descriptionLines: [
      "After dinner, we'll head to a traditional milonga tucked away in Palermo — a spot mostly known by those who live in the city.",
      "",
      "We'll start with a beginner-friendly tango class, then stay to enjoy the early part of the night with a glass of Argentine wine and take in the atmosphere as the dancing begins.",
      "",
      "A unique way to experience Buenos Aires beyond the usual path.",
    ],
    image: getMainActivityImage("milonga"),
  },
];

// Helper function to get activity by ID
export const getActivityById = (id) => {
  return ACTIVITY_LIST.find((activity) => activity.id === id);
};

// Helper function to get activity by form field
export const getActivityByFormField = (formField) => {
  return ACTIVITY_LIST.find((activity) => activity.formField === formField);
};
