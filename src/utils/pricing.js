/**
 * Pricing Configuration for Argentina Trip Services
 * All prices in USD
 */

export const PRICING_CONFIG = {
  // Accommodations (per night)
  accommodations: {
    "Buenos Aires": {
      arrival: 25, // Nov 22, 23
      departure: 50, // Nov 29
    },
    Bariloche: 50, // Nov 24, 25, 26
    Mendoza: 45, // Nov 27, 28
  },

  // Flights (per person)
  flights: {
    "JA3045 AEP - BRC": 200, // Buenos Aires → Bariloche
    "JA3725 BRC MDZ": 180, // Bariloche → Mendoza
    "JA3073 MDZ AEP": 200, // Mendoza → Buenos Aires
  },

  // Optional Activities (will be used later for add-ons)
  activities: {
    horsebackRiding: 45,
    cookingClass: 140,
    rafting: 75,
  },

  // Payment Processing Fees
  fees: {
    creditCardRate: 0.04, // 4%
    bankTransferFee: 0, // No fee for bank transfers
  },

  // Currency
  currency: "USD",
  currencySymbol: "$",
};

/**
 * Get price for accommodation
 * @param {string} location - "Buenos Aires", "Bariloche", "Mendoza"
 * @param {string} period - "Arrival", "Departure" (for Buenos Aires only)
 * @returns {number} Price per night in USD
 */
export const getAccommodationPrice = (location, period = null) => {
  const config = PRICING_CONFIG.accommodations[location];

  if (location === "Buenos Aires" && period) {
    return period === "Arrival" ? config.arrival : config.departure;
  }

  return typeof config === "number" ? config : config.arrival || 0;
};

/**
 * Get price for flight
 * @param {string} flightCode - Flight code like "JA3045 AEP - BRC"
 * @returns {number} Flight price in USD
 */
export const getFlightPrice = (flightCode) => {
  return PRICING_CONFIG.flights[flightCode] || 0;
};

/**
 * Format price for display
 * @param {number} price - Price amount
 * @param {string} currency - Currency symbol (optional)
 * @returns {string} Formatted price string
 */
export const formatPrice = (
  price,
  currency = PRICING_CONFIG.currencySymbol
) => {
  return `${currency}${price}`;
};

/**
 * Calculate total price for multiple nights
 * @param {number} pricePerNight - Price per night
 * @param {number} numNights - Number of nights
 * @returns {number} Total price
 */
export const calculateAccommodationTotal = (pricePerNight, numNights) => {
  return pricePerNight * numNights;
};
