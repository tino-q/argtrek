// Utility functions for checking if user has answered activity choices
// Shared between PricingSummary and Timeline components

export const CHOICE_KEYS = {
  tango: "tango-night-tango",
  barilocheCircuito: "bariloche-activity-circuitochico",
  barilocheRafting: "bariloche-activity-rafting",
  valleDeUcoHorse: "valle-de-uco-activity-horse",
  valleDeUcoWalking: "valle-de-uco-activity-walking"
};

export const ACTIVITY_DATES = {
  tango: 23,        // Sunday 23rd
  bariloche: 26,    // Wednesday 26th
  mendoza: 28       // Friday 28th (Valle de Uco)
};

/**
 * Check if user has answered the tango choice
 * @param {Object} userChoices - User choices from submission result
 * @param {Object} formData - Form data from trip context
 * @returns {boolean} - True if answered, false if pending
 */
export const hasAnsweredTango = (userChoices, formData) => {
  const checkedOutTango = formData.tango.toString().trim().toLowerCase() === "true";
  return checkedOutTango || Boolean(userChoices[CHOICE_KEYS.tango]);
};

/**
 * Check if user has answered the Bariloche activity choice
 * @param {Object} userChoices - User choices from submission result
 * @param {Object} formData - Form data from trip context
 * @returns {boolean} - True if answered, false if pending
 */
export const hasAnsweredBariloche = (userChoices, formData) => {
  const checkedOutRafting = formData.rafting.toString().trim().toLowerCase() === "true";

  // yes to any, or no to both
  return checkedOutRafting ||
    userChoices[CHOICE_KEYS.barilocheCircuito] === "yes" ||
    userChoices[CHOICE_KEYS.barilocheRafting] === "yes" ||
    (userChoices[CHOICE_KEYS.barilocheCircuito] === "no" &&
     userChoices[CHOICE_KEYS.barilocheRafting] === "no");
};

/**
 * Check if user has answered the Valle de Uco activity choice
 * @param {Object} userChoices - User choices from submission result
 * @returns {boolean} - True if answered, false if pending
 */
export const hasAnsweredValleDeUco = (userChoices) => {
  // yes to any, or no to both
  return userChoices[CHOICE_KEYS.valleDeUcoHorse] === "yes" ||
    userChoices[CHOICE_KEYS.valleDeUcoWalking] === "yes" ||
    (userChoices[CHOICE_KEYS.valleDeUcoHorse] === "no" &&
     userChoices[CHOICE_KEYS.valleDeUcoWalking] === "no");
};

/**
 * Check if all activity choices have been answered
 * @param {Object} userChoices - User choices from submission result
 * @param {Object} formData - Form data from trip context
 * @returns {boolean} - True if all answered, false if any pending
 */
export const hasAnsweredAllChoices = (userChoices, formData) => {
  return hasAnsweredTango(userChoices, formData) &&
    hasAnsweredBariloche(userChoices, formData) &&
    hasAnsweredValleDeUco(userChoices);
};

/**
 * Get pending choices by day
 * @param {Object} userChoices - User choices from submission result
 * @param {Object} formData - Form data from trip context
 * @returns {Object} - Object with day numbers as keys and arrays of pending activities as values
 */
export const getPendingChoicesByDay = (userChoices, formData) => {
  const pendingByDay = {};

  if (!hasAnsweredTango(userChoices, formData)) {
    pendingByDay[ACTIVITY_DATES.tango] = pendingByDay[ACTIVITY_DATES.tango] || [];
    pendingByDay[ACTIVITY_DATES.tango].push("tango");
  }

  if (!hasAnsweredBariloche(userChoices, formData)) {
    pendingByDay[ACTIVITY_DATES.bariloche] = pendingByDay[ACTIVITY_DATES.bariloche] || [];
    pendingByDay[ACTIVITY_DATES.bariloche].push("bariloche");
  }

  if (!hasAnsweredValleDeUco(userChoices)) {
    pendingByDay[ACTIVITY_DATES.mendoza] = pendingByDay[ACTIVITY_DATES.mendoza] || [];
    pendingByDay[ACTIVITY_DATES.mendoza].push("valleDeUco");
  }

  return pendingByDay;
};

/**
 * Check if a specific day has pending choices
 * @param {number} dayOfMonth - Day number (23, 26, 28)
 * @param {Object} userChoices - User choices from submission result
 * @param {Object} formData - Form data from trip context
 * @returns {boolean} - True if day has pending choices
 */
export const dayHasPendingChoices = (dayOfMonth, userChoices, formData) => {
  const pendingByDay = getPendingChoicesByDay(userChoices, formData);
  return Boolean(pendingByDay[dayOfMonth] && pendingByDay[dayOfMonth].length > 0);
};