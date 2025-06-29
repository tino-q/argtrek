// Configuration and Constants Module
// This module contains all DOM selectors, pricing data, and activity information

// DOM Element Selectors
const DOM = {
  // Form elements
  form: document.getElementById("tripForm"),
  tripOptions: document.querySelectorAll('input[name="tripOption"]'),
  accommodationOptions: document.querySelectorAll(
    'input[name="accommodation"]'
  ),
  roommateGroup: document.getElementById("roommateGroup"),
  roommateInput: document.getElementById("roommate"),
  activityCheckboxes: document.querySelectorAll('input[name="activities"]'),
  paymentScheduleOptions: document.querySelectorAll(
    'input[name="paymentSchedule"]'
  ),
  paymentMethodOptions: document.querySelectorAll(
    'input[name="paymentMethod"]'
  ),
  argentineCitizenCheckbox: document.getElementById("argentineCitizen"),
  bankingDetails: document.getElementById("bankingDetails"),

  // Price display elements
  baseCostElement: document.getElementById("baseCost"),
  accommodationRow: document.getElementById("accommodationRow"),
  accommodationCostElement: document.getElementById("accommodationCost"),
  activitiesSection: document.getElementById("activitiesSection"),
  subtotalElement: document.getElementById("subtotal"),
  vatRow: document.getElementById("vatRow"),
  vatAmountElement: document.getElementById("vatAmount"),
  processingFeeRow: document.getElementById("processingFeeRow"),
  processingFeeElement: document.getElementById("processingFee"),
  totalAmountElement: document.getElementById("totalAmount"),
  dueNowElement: document.getElementById("dueNow"),
};

// Price Configuration
const PRICES = {
  tripOption1: 2250,
  tripOption2: 2600,
  privateRoom: 300,
  horseback: 45,
  cooking: 140,
  rafting: 75,
  creditCardFeeRate: 0.04,
  installmentRate: 0.35,
  vatRate: 0.21,
};

// Activity Information
const ACTIVITIES = {
  horseback: {
    name: "Horse Back Riding",
    price: 45,
    location: "Mendoza",
  },
  cooking: {
    name: "Empanadas Cooking Class",
    price: 140,
    location: "Mendoza",
  },
  rafting: {
    name: "Rafting Adventure",
    price: 75,
    location: "Bariloche",
  },
};

// Export configuration objects for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = { DOM, PRICES, ACTIVITIES };
}
