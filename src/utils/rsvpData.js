// RSVP Data Utility
// Centralized access to RSVP data with proper field mapping and validation

/**
 * RSVP Field Name Constants
 * These match the exact column names from the Google Sheets backend
 */
export const RSVP_FIELDS = {
  // Personal Information
  TRAVELER_NAME:
    "Please write your name exactly as it appears on the ID you'll be traveling with.",
  PLUS_ONE_NAME:
    "If traveling with plus one - Please write the name exactly as it appears on the ID of your plus one.",
  EMAIL: "Email (for all trip-related updates and communications)",
  PASSWORD: "PASSWORD",

  // Pricing
  PACK_PRICE: "PACK PRICE",
  PRIVATE_ROOM_UPGRADE: "PRIVATE ROOM UPGRADE",
  IVA_ALOJ: "IVA ALOJ",
  CHECKED_LUGGAGE: "VALIJA DESPACHADA",

  // Trip Configuration
  TRAVEL_TYPE: "Are you traveling solo or with a plus one?",

  // Accommodation Dates
  NOV_22: "22 NOV",
  NOV_23: "23 NOV",
  NOV_24: "24 NOV",
  NOV_25: "25 NOV",
  NOV_26: "26 NOV",
  NOV_27: "27 NOV",
  NOV_28: "28 NOV",
  NOV_29: "29 NOV",

  // Flights
  FLIGHT_AEP_BRC: "JA3045 AEP - BRC",
  FLIGHT_BRC_MDZ: "JA3725 BRC MDZ",
  FLIGHT_MDZ_AEP: "JA3073 MDZ AEP",
};

/**
 * Get traveler's primary name from RSVP data
 */
export const getTravelerName = (rsvpData) => {
  if (!rsvpData) return "Name not found";

  const name = rsvpData[RSVP_FIELDS.TRAVELER_NAME];
  return name || "Name not found";
};

/**
 * Get plus one's name from RSVP data
 */
export const getPlusOneName = (rsvpData) => {
  if (!rsvpData) return null;

  const plusOneName = rsvpData[RSVP_FIELDS.PLUS_ONE_NAME];
  return plusOneName && plusOneName.trim() ? plusOneName : null;
};

/**
 * Get email address from RSVP data
 */
export const getEmail = (rsvpData) => {
  if (!rsvpData) return "Email not found";

  const email = rsvpData[RSVP_FIELDS.EMAIL];
  return email || "Email not found";
};

/**
 * Get base trip price from RSVP data
 */
export const getBasePrice = (rsvpData) => {
  if (!rsvpData) return 0;

  const price = rsvpData[RSVP_FIELDS.PACK_PRICE];
  return parseFloat(price) || 0;
};

/**
 * Get private room upgrade price from RSVP data
 */
export const getPrivateRoomUpgradePrice = (rsvpData) => {
  if (!rsvpData) return 0;

  const price = rsvpData[RSVP_FIELDS.PRIVATE_ROOM_UPGRADE];
  return parseFloat(price) || 0;
};

/**
 * Get VAT amount for accommodation (for Argentine citizens)
 */
export const getVATAmount = (rsvpData) => {
  if (!rsvpData) return 0;

  const vatAmount = rsvpData[RSVP_FIELDS.IVA_ALOJ];
  return parseFloat(vatAmount) || 0;
};

/**
 * Get checked luggage price from RSVP data
 */
export const getCheckedLuggagePrice = (rsvpData) => {
  if (!rsvpData) return 0;

  const price = rsvpData[RSVP_FIELDS.CHECKED_LUGGAGE];
  return parseFloat(price) || 0;
};

/**
 * Check if traveler is traveling solo
 */
export const isSoloTraveler = (rsvpData) => {
  if (!rsvpData) return false;

  const travelType = rsvpData[RSVP_FIELDS.TRAVEL_TYPE];
  return travelType === "Solo";
};

/**
 * Check if traveler has a plus one
 */
export const hasPlusOne = (rsvpData) => {
  return !isSoloTraveler(rsvpData) && getPlusOneName(rsvpData) !== null;
};

/**
 * Get accommodation nights for a specific location
 */
export const getAccommodationNights = (rsvpData, location) => {
  if (!rsvpData) return [];

  const nightMappings = {
    "buenos-aires-arrival": [RSVP_FIELDS.NOV_22, RSVP_FIELDS.NOV_23],
    bariloche: [RSVP_FIELDS.NOV_24, RSVP_FIELDS.NOV_25, RSVP_FIELDS.NOV_26],
    mendoza: [RSVP_FIELDS.NOV_27, RSVP_FIELDS.NOV_28],
    "buenos-aires-departure": [RSVP_FIELDS.NOV_29],
  };

  const nightFields = nightMappings[location] || [];
  return nightFields.filter((field) => rsvpData[field] === true);
};

/**
 * Get all included accommodations with their nights
 */
export const getIncludedAccommodations = (rsvpData) => {
  if (!rsvpData) return [];

  const accommodations = [];

  // Buenos Aires - Arrival (Nov 22-23)
  const buenosAiresArrival = getAccommodationNights(
    rsvpData,
    "buenos-aires-arrival"
  );
  if (buenosAiresArrival.length > 0) {
    accommodations.push({
      location: "Buenos Aires",
      period: "arrival",
      hotelName: "Hotel Madero Buenos Aires",
      address: "Rosario Vera Peñaloza 360, Puerto Madero, Buenos Aires",
      nights: buenosAiresArrival.map((field) => {
        const date = field.split(" ")[0]; // Extract "22" from "22 NOV"
        return `Nov ${date}`;
      }),
    });
  }

  // Bariloche (Nov 24-26)
  const bariloche = getAccommodationNights(rsvpData, "bariloche");
  if (bariloche.length > 0) {
    accommodations.push({
      location: "Bariloche",
      hotelName: "Llao Llao Hotel & Resort",
      address: "Av. Bustillo Km 25, San Carlos de Bariloche, Río Negro",
      nights: bariloche.map((field) => {
        const date = field.split(" ")[0];
        return `Nov ${date}`;
      }),
    });
  }

  // Mendoza (Nov 27-28)
  const mendoza = getAccommodationNights(rsvpData, "mendoza");
  if (mendoza.length > 0) {
    accommodations.push({
      location: "Mendoza",
      hotelName: "Park Hyatt Mendoza",
      address: "Chile 1124, M5500 Mendoza, Argentina",
      nights: mendoza.map((field) => {
        const date = field.split(" ")[0];
        return `Nov ${date}`;
      }),
    });
  }

  // Buenos Aires - Departure (Nov 29)
  const buenosAiresDeparture = getAccommodationNights(
    rsvpData,
    "buenos-aires-departure"
  );
  if (buenosAiresDeparture.length > 0) {
    accommodations.push({
      location: "Buenos Aires",
      period: "departure",
      hotelName: "Hotel Madero Buenos Aires",
      address: "Rosario Vera Peñaloza 360, Puerto Madero, Buenos Aires",
      nights: ["Nov 29"],
    });
  }

  return accommodations;
};

/**
 * Get all excluded accommodations with their nights
 */
export const getExcludedAccommodations = (rsvpData) => {
  if (!rsvpData) return [];

  const accommodations = [];

  // Buenos Aires - Arrival (Nov 22-23)
  const buenosAiresArrivalExcluded = [
    RSVP_FIELDS.NOV_22,
    RSVP_FIELDS.NOV_23,
  ].filter((field) => rsvpData[field] === false);

  if (buenosAiresArrivalExcluded.length > 0) {
    accommodations.push({
      location: "Buenos Aires",
      period: "arrival",
      hotelName: "Hotel Madero Buenos Aires",
      address: "Rosario Vera Peñaloza 360, Puerto Madero, Buenos Aires",
      nights: buenosAiresArrivalExcluded.map((field) => {
        const date = field.split(" ")[0]; // Extract "22" from "22 NOV"
        return `Nov ${date}`;
      }),
    });
  }

  // Bariloche (Nov 24-26)
  const barilocheExcluded = [
    RSVP_FIELDS.NOV_24,
    RSVP_FIELDS.NOV_25,
    RSVP_FIELDS.NOV_26,
  ].filter((field) => rsvpData[field] === false);

  if (barilocheExcluded.length > 0) {
    accommodations.push({
      location: "Bariloche",
      hotelName: "Llao Llao Hotel & Resort",
      address: "Av. Bustillo Km 25, San Carlos de Bariloche, Río Negro",
      nights: barilocheExcluded.map((field) => {
        const date = field.split(" ")[0];
        return `Nov ${date}`;
      }),
    });
  }

  // Mendoza (Nov 27-28)
  const mendozaExcluded = [RSVP_FIELDS.NOV_27, RSVP_FIELDS.NOV_28].filter(
    (field) => rsvpData[field] === false
  );

  if (mendozaExcluded.length > 0) {
    accommodations.push({
      location: "Mendoza",
      hotelName: "Park Hyatt Mendoza",
      address: "Chile 1124, M5500 Mendoza, Argentina",
      nights: mendozaExcluded.map((field) => {
        const date = field.split(" ")[0];
        return `Nov ${date}`;
      }),
    });
  }

  // Buenos Aires - Departure (Nov 29)
  if (rsvpData[RSVP_FIELDS.NOV_29] === false) {
    accommodations.push({
      location: "Buenos Aires",
      period: "departure",
      hotelName: "Hotel Madero Buenos Aires",
      address: "Rosario Vera Peñaloza 360, Puerto Madero, Buenos Aires",
      nights: ["Nov 29"],
    });
  }

  return accommodations;
};

/**
 * Get included flights
 */
export const getIncludedFlights = (rsvpData) => {
  if (!rsvpData) return [];

  const flights = [];

  if (rsvpData[RSVP_FIELDS.FLIGHT_AEP_BRC]) {
    flights.push({
      code: "JA3045",
      airline: "JetSMART Argentina",
      route: "Buenos Aires → Bariloche",
      departure: {
        airport: "AEP",
        city: "Buenos Aires",
        name: "Jorge Newbery Airfield",
        time: "09:15",
      },
      arrival: {
        airport: "BRC",
        city: "Bariloche",
        name: "Bariloche Airport",
        time: "11:45",
      },
      date: "Nov 24",
      duration: "2h 30m",
      aircraft: "Airbus A320",
    });
  }

  if (rsvpData[RSVP_FIELDS.FLIGHT_BRC_MDZ]) {
    flights.push({
      code: "JA3725",
      airline: "JetSMART Argentina",
      route: "Bariloche → Mendoza",
      departure: {
        airport: "BRC",
        city: "Bariloche",
        name: "Bariloche Airport",
        time: "13:20",
      },
      arrival: {
        airport: "MDZ",
        city: "Mendoza",
        name: "Governor Francisco Gabrielli International Airport",
        time: "15:10",
      },
      date: "Nov 27",
      duration: "1h 50m",
      aircraft: "Airbus A320",
    });
  }

  if (rsvpData[RSVP_FIELDS.FLIGHT_MDZ_AEP]) {
    flights.push({
      code: "JA3073",
      airline: "JetSMART Argentina",
      route: "Mendoza → Buenos Aires",
      departure: {
        airport: "MDZ",
        city: "Mendoza",
        name: "Governor Francisco Gabrielli International Airport",
        time: "16:45",
      },
      arrival: {
        airport: "AEP",
        city: "Buenos Aires",
        name: "Jorge Newbery Airfield",
        time: "18:20",
      },
      date: "Nov 29",
      duration: "1h 35m",
      aircraft: "Airbus A320",
    });
  }

  return flights;
};

/**
 * Get excluded flights
 */
export const getExcludedFlights = (rsvpData) => {
  if (!rsvpData) return [];

  const flights = [];

  if (rsvpData[RSVP_FIELDS.FLIGHT_AEP_BRC] === false) {
    flights.push({
      code: "JA3045",
      airline: "JetSMART Argentina",
      route: "Buenos Aires → Bariloche",
      departure: {
        airport: "AEP",
        city: "Buenos Aires",
        name: "Jorge Newbery Airfield",
        time: "09:15",
      },
      arrival: {
        airport: "BRC",
        city: "Bariloche",
        name: "Bariloche Airport",
        time: "11:45",
      },
      date: "Nov 24",
      duration: "2h 30m",
      aircraft: "Airbus A320",
    });
  }

  if (rsvpData[RSVP_FIELDS.FLIGHT_BRC_MDZ] === false) {
    flights.push({
      code: "JA3725",
      airline: "JetSMART Argentina",
      route: "Bariloche → Mendoza",
      departure: {
        airport: "BRC",
        city: "Bariloche",
        name: "Bariloche Airport",
        time: "13:20",
      },
      arrival: {
        airport: "MDZ",
        city: "Mendoza",
        name: "Governor Francisco Gabrielli International Airport",
        time: "15:10",
      },
      date: "Nov 27",
      duration: "1h 50m",
      aircraft: "Airbus A320",
    });
  }

  if (rsvpData[RSVP_FIELDS.FLIGHT_MDZ_AEP] === false) {
    flights.push({
      code: "JA3073",
      airline: "JetSMART Argentina",
      route: "Mendoza → Buenos Aires",
      departure: {
        airport: "MDZ",
        city: "Mendoza",
        name: "Governor Francisco Gabrielli International Airport",
        time: "16:45",
      },
      arrival: {
        airport: "AEP",
        city: "Buenos Aires",
        name: "Jorge Newbery Airfield",
        time: "18:20",
      },
      date: "Nov 29",
      duration: "1h 35m",
      aircraft: "Airbus A320",
    });
  }

  return flights;
};

/**
 * Check if user should have Argentine citizenship auto-enforced
 * (for specific users like Jero or Nati)
 */
export const shouldEnforceArgentineCitizenship = (rsvpData) => {
  if (!rsvpData) return false;

  const name = getTravelerName(rsvpData);
  if (!name) return false;

  const lowerName = name.toLowerCase().trim();
  return lowerName.includes("jero") || lowerName.includes("nati");
};

/**
 * Get all personal information in one object
 */
export const getPersonalInfo = (rsvpData) => {
  return {
    name: getTravelerName(rsvpData),
    plusOneName: getPlusOneName(rsvpData),
    email: getEmail(rsvpData),
    isSolo: isSoloTraveler(rsvpData),
    hasPlusOne: hasPlusOne(rsvpData),
  };
};

/**
 * Get all pricing information in one object
 */
export const getPricingInfo = (rsvpData) => {
  return {
    basePrice: getBasePrice(rsvpData),
    privateRoomUpgrade: getPrivateRoomUpgradePrice(rsvpData),
    vatAmount: getVATAmount(rsvpData),
    checkedLuggage: getCheckedLuggagePrice(rsvpData),
  };
};

/**
 * Get complete trip itinerary
 */
export const getTripItinerary = (rsvpData) => {
  return {
    accommodations: getIncludedAccommodations(rsvpData),
    flights: getIncludedFlights(rsvpData),
  };
};

/**
 * Get excluded trip services
 */
export const getExcludedTripServices = (rsvpData) => {
  return {
    accommodations: getExcludedAccommodations(rsvpData),
    flights: getExcludedFlights(rsvpData),
  };
};
