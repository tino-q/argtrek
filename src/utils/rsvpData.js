// RSVP Data Utility
// Centralized access to RSVP data with proper field mapping and validation

/**
 * RSVP Field Name Constants
 * These match the exact column names from the Google Sheets backend
 */
export const RSVP_FIELDS = {
  // Personal Information
  TRAVELER_NAME: "name",
  PLUS_ONE_NAME: "plus1",
  EMAIL: "email",
  PASSWORD: "PASSWORD",

  // Pricing
  PACK_PRICE: "PACKPRICE",
  PRIVATE_ROOM_UPGRADE: "PRIVATEROOM",
  IVA_ALOJ: "IVAALOJ",
  // CHECKED_LUGGAGE: "VALIJA", // Removed - no longer pricing luggage

  // Trip Configuration
  TRIP_OPTION: "option",
  PARTY_SIZE: "party",
  COMMENTS: "comments",
  EMAIL2: "email2",

  // Accommodation Dates
  NOV_22: "22Nov_BSAS",
  NOV_23: "23Nov_BSAS",
  NOV_24: "24Nov_BARI",
  NOV_25: "25Nov_BARI",
  NOV_26: "26Nov_BARI",
  NOV_27: "27Nov_MDZ",
  NOV_28: "28Nov_MDZ",
  NOV_29: "29Nov_BSAS",

  // Flights
  FLIGHT_AEP_BRC: "AEP-BRC",
  FLIGHT_BRC_MDZ: "BRC-MDZ",
  FLIGHT_MDZ_AEP: "MDZ-AEP",
};

/**
 * Helper function to format field names to date strings
 * @param {string[]} fields - Array of field names (e.g. ["22Nov", "23Nov"])
 * @returns {string[]} - Array of formatted date strings (e.g. ["Nov 22", "Nov 23"])
 */
const formatFieldsToNights = (fields) => {
  const dates = fields.map((field) =>
    Number(field.split("_")[0].replace("Nov", ""))
  );

  const first = dates[0];
  const last = dates[dates.length - 1];

  console.log({ first, last });

  return [`Check in ${first} Nov - Check out ${last + 1} Nov`];
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
 * Check if traveler is traveling solo
 */
export const isSoloTraveler = (rsvpData) => {
  if (!rsvpData) return false;

  // Check if party size is 1 or if plus1 is empty/null
  const partySize = rsvpData[RSVP_FIELDS.PARTY_SIZE];
  const plusOne = rsvpData[RSVP_FIELDS.PLUS_ONE_NAME];

  return partySize === 1 || !plusOne || plusOne.trim() === "";
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
      hotelName: "Hotel in Buenos Aires",
      address: "",
      nights: formatFieldsToNights(buenosAiresArrival),
    });
  }

  // Bariloche (Nov 24-26)
  const bariloche = getAccommodationNights(rsvpData, "bariloche");
  if (bariloche.length > 0) {
    accommodations.push({
      location: "Bariloche",
      hotelName: "Hotel in Bariloche",
      address: "",
      nights: formatFieldsToNights(bariloche),
    });
  }

  // Mendoza (Nov 27-28)
  const mendoza = getAccommodationNights(rsvpData, "mendoza");
  if (mendoza.length > 0) {
    accommodations.push({
      location: "Mendoza",
      hotelName: "Hotel in Mendoza",
      address: "",
      nights: formatFieldsToNights(mendoza),
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
      hotelName: "Hotel in Buenos Aires",
      address: "",
      nights: ["Nov 29"],
    });
  }

  return accommodations;
};

/**
 * Get all excluded accommodations with their nights
 */
export const getExcludedAccommodations = (rsvpData) => {
  console.log("🔍 getExcludedAccommodations called with:", rsvpData);

  if (!rsvpData) {
    return [];
  }

  const accommodations = [];

  // Buenos Aires - Arrival (Nov 22-23)
  const buenosAiresArrivalFields = [RSVP_FIELDS.NOV_22, RSVP_FIELDS.NOV_23];

  const buenosAiresArrivalExcluded = buenosAiresArrivalFields.filter(
    (field) => rsvpData[field] === false
  );
  console.log(
    "🏨 Buenos Aires arrival excluded nights:",
    buenosAiresArrivalExcluded
  );

  if (buenosAiresArrivalExcluded.length > 0) {
    const baArrivalAccommodation = {
      location: "Buenos Aires",
      period: "arrival",
      hotelName: "Hotel in Buenos Aires",
      address: "",
      nights: formatFieldsToNights(buenosAiresArrivalExcluded),
    };
    console.log(
      "✅ Adding Buenos Aires arrival accommodation:",
      baArrivalAccommodation
    );
    accommodations.push(baArrivalAccommodation);
  }

  // Bariloche (Nov 24-26)
  const barilocheFields = [
    RSVP_FIELDS.NOV_24,
    RSVP_FIELDS.NOV_25,
    RSVP_FIELDS.NOV_26,
  ];
  console.log("🏔️ Bariloche fields to check:", barilocheFields);
  console.log(
    "🏔️ Bariloche values:",
    barilocheFields.map((field) => ({
      field,
      value: rsvpData[field],
    }))
  );

  const barilocheExcluded = barilocheFields.filter(
    (field) => rsvpData[field] === false
  );
  console.log("🏔️ Bariloche excluded nights:", barilocheExcluded);

  if (barilocheExcluded.length > 0) {
    const barilocheAccommodation = {
      location: "Bariloche",
      hotelName: "Hotel in Bariloche",
      address: "",
      nights: formatFieldsToNights(barilocheExcluded),
    };
    console.log("✅ Adding Bariloche accommodation:", barilocheAccommodation);
    accommodations.push(barilocheAccommodation);
  }

  // Mendoza (Nov 27-28)
  const mendozaFields = [RSVP_FIELDS.NOV_27, RSVP_FIELDS.NOV_28];
  console.log("🍷 Mendoza fields to check:", mendozaFields);
  console.log(
    "🍷 Mendoza values:",
    mendozaFields.map((field) => ({
      field,
      value: rsvpData[field],
    }))
  );

  const mendozaExcluded = mendozaFields.filter(
    (field) => rsvpData[field] === false
  );
  console.log("🍷 Mendoza excluded nights:", mendozaExcluded);

  if (mendozaExcluded.length > 0) {
    const mendozaAccommodation = {
      location: "Mendoza",
      hotelName: "Hotel in Mendoza",
      address: "",
      nights: formatFieldsToNights(mendozaExcluded),
    };
    console.log("✅ Adding Mendoza accommodation:", mendozaAccommodation);
    accommodations.push(mendozaAccommodation);
  }

  // Buenos Aires - Departure (Nov 29)
  console.log("🏨 Buenos Aires departure field to check:", RSVP_FIELDS.NOV_29);
  console.log("🏨 Buenos Aires departure value:", rsvpData[RSVP_FIELDS.NOV_29]);

  if (rsvpData[RSVP_FIELDS.NOV_29] === false) {
    const baDepartureAccommodation = {
      location: "Buenos Aires",
      period: "departure",
      hotelName: "Hotel in Buenos Aires",
      address: "",
      nights: ["Nov 29"],
    };
    console.log(
      "✅ Adding Buenos Aires departure accommodation:",
      baDepartureAccommodation
    );
    accommodations.push(baDepartureAccommodation);
  }

  console.log("📊 Final excluded accommodations array:", accommodations);
  console.log("📊 Total excluded accommodations:", accommodations.length);
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
      code: "JA3047",
      airline: "JetSMART Argentina",
      route: "Buenos Aires → Bariloche",
      departure: {
        airport: "AEP",
        city: "Buenos Aires",
        name: "Jorge Newbery Airfield",
        time: "11:15",
      },
      arrival: {
        airport: "BRC",
        city: "Bariloche",
        name: "Bariloche Airport",
        time: "13:45",
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
        time: "10:15",
      },
      arrival: {
        airport: "MDZ",
        city: "Mendoza",
        name: "Governor Francisco Gabrielli International Airport",
        time: "12:15",
      },
      date: "Nov 27",
      duration: "2h 00m",
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
        time: "13:00",
      },
      arrival: {
        airport: "AEP",
        city: "Buenos Aires",
        name: "Jorge Newbery Airfield",
        time: "15:00",
      },
      date: "Nov 29",
      duration: "2h 00m",
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
      code: "JA3047",
      airline: "JetSMART Argentina",
      route: "Buenos Aires → Bariloche",
      departure: {
        airport: "AEP",
        city: "Buenos Aires",
        name: "Jorge Newbery Airfield",
        time: "11:15",
      },
      arrival: {
        airport: "BRC",
        city: "Bariloche",
        name: "Bariloche Airport",
        time: "13:45",
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
        time: "10:15",
      },
      arrival: {
        airport: "MDZ",
        city: "Mendoza",
        name: "Governor Francisco Gabrielli International Airport",
        time: "12:15",
      },
      date: "Nov 27",
      duration: "2h 00m",
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
        time: "13:00",
      },
      arrival: {
        airport: "AEP",
        city: "Buenos Aires",
        name: "Jorge Newbery Airfield",
        time: "15:00",
      },
      date: "Nov 29",
      duration: "2h 00m",
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
 * Split traveler name into first name and last name
 */
export const splitTravelerName = (rsvpData) => {
  const fullName = getTravelerName(rsvpData);

  if (!fullName || fullName === "Name not found") {
    return { firstName: "", lastName: "" };
  }

  const nameParts = fullName.trim().split(" ");

  if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: "" };
  }

  // First part is first name, rest is last name
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ");

  return { firstName, lastName };
};

/**
 * Get all personal information in one object
 */
export const getPersonalInfo = (rsvpData) => {
  const { firstName, lastName } = splitTravelerName(rsvpData);

  return {
    name: getTravelerName(rsvpData),
    firstName,
    lastName,
    plusOneName: getPlusOneName(rsvpData),
    email: getEmail(rsvpData),
    isSolo: isSoloTraveler(rsvpData),
    hasPlusOne: hasPlusOne(rsvpData),
    phoneNumber: "", // Not available in RSVP data, will be empty initially
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
