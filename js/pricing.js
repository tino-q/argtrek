// Pricing Calculation Module
// This module handles all price calculations and display updates
// Depends on: config.js

// Calculate and update prices
function calculatePrices() {
  let baseCost = 0;
  let accommodationCost = 0;
  let activitiesCost = 0;

  // Get base trip cost
  const selectedTripOption = document.querySelector(
    'input[name="tripOption"]:checked'
  );
  if (selectedTripOption) {
    baseCost = parseInt(selectedTripOption.value);
  }

  // Get accommodation cost
  const selectedAccommodation = document.querySelector(
    'input[name="accommodation"]:checked'
  );
  if (selectedAccommodation) {
    accommodationCost = parseInt(selectedAccommodation.value);
  }

  // Get activities cost and details
  let selectedActivities = [];
  DOM.activityCheckboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      const activityId = checkbox.id;
      const activity = ACTIVITIES[activityId];
      if (activity) {
        selectedActivities.push(activity);
        activitiesCost += activity.price;
      }
    }
  });

  // Calculate subtotal
  const subtotal = baseCost + accommodationCost + activitiesCost;

  // Calculate VAT if Argentine citizen
  let vatAmount = 0;
  if (DOM.argentineCitizenCheckbox && DOM.argentineCitizenCheckbox.checked) {
    vatAmount = Math.round(subtotal * PRICES.vatRate);
  }

  // Calculate processing fee if credit card is selected
  let processingFee = 0;
  const selectedPaymentMethod = document.querySelector(
    'input[name="paymentMethod"]:checked'
  );
  if (selectedPaymentMethod && selectedPaymentMethod.value === "credit") {
    const baseForProcessing = subtotal + vatAmount;
    processingFee = Math.round(baseForProcessing * PRICES.creditCardFeeRate);
  }

  // Calculate total amount
  const totalAmount = subtotal + vatAmount + processingFee;

  // Calculate amount due now based on payment schedule
  let dueNow = totalAmount;
  const selectedPaymentSchedule = document.querySelector(
    'input[name="paymentSchedule"]:checked'
  );
  if (
    selectedPaymentSchedule &&
    selectedPaymentSchedule.value === "installments"
  ) {
    dueNow = Math.round(totalAmount * PRICES.installmentRate);
  }

  // Update display
  updatePriceDisplay(
    baseCost,
    accommodationCost,
    selectedActivities,
    subtotal,
    vatAmount,
    processingFee,
    totalAmount,
    dueNow
  );

  // Return calculation results for other modules to use
  return {
    baseCost,
    accommodationCost,
    selectedActivities,
    subtotal,
    vatAmount,
    processingFee,
    totalAmount,
    dueNow,
  };
}

// Update price display elements
function updatePriceDisplay(
  baseCost,
  accommodationCost,
  selectedActivities,
  subtotal,
  vatAmount,
  processingFee,
  totalAmount,
  dueNow
) {
  DOM.baseCostElement.textContent = `$${baseCost.toLocaleString()}`;

  // Show/hide accommodation upgrade row
  if (accommodationCost > 0) {
    DOM.accommodationRow.style.display = "flex";
    DOM.accommodationCostElement.textContent = `$${accommodationCost.toLocaleString()}`;
  } else {
    DOM.accommodationRow.style.display = "none";
  }

  // Update activities section
  updateActivitiesSection(selectedActivities);

  DOM.subtotalElement.textContent = `$${subtotal.toLocaleString()}`;

  // Show/hide VAT row
  if (vatAmount > 0) {
    DOM.vatRow.style.display = "flex";
    DOM.vatAmountElement.textContent = `$${vatAmount.toLocaleString()}`;
  } else {
    DOM.vatRow.style.display = "none";
  }

  // Show/hide processing fee row
  if (processingFee > 0) {
    DOM.processingFeeRow.style.display = "flex";
    DOM.processingFeeElement.textContent = `$${processingFee.toLocaleString()}`;
  } else {
    DOM.processingFeeRow.style.display = "none";
  }

  DOM.totalAmountElement.textContent = `$${totalAmount.toLocaleString()}`;
  DOM.dueNowElement.textContent = `$${dueNow.toLocaleString()}`;
}

// Update activities section with selected activities
function updateActivitiesSection(selectedActivities) {
  DOM.activitiesSection.innerHTML = "";

  if (selectedActivities.length === 0) {
    // Show placeholder when no activities are selected
    const noActivityRow = document.createElement("div");
    noActivityRow.className = "summary-row";
    noActivityRow.innerHTML = `
      <span>Optional Activities:</span>
      <span>$0</span>
    `;
    DOM.activitiesSection.appendChild(noActivityRow);
  } else {
    // Show each selected activity
    selectedActivities.forEach((activity) => {
      const activityRow = document.createElement("div");
      activityRow.className = "summary-row activity-row";
      activityRow.innerHTML = `
        <span>${activity.name} <small>(${activity.location})</small></span>
        <span>$${activity.price.toLocaleString()}</span>
      `;
      DOM.activitiesSection.appendChild(activityRow);
    });
  }
}

// Export functions for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    calculatePrices,
    updatePriceDisplay,
    updateActivitiesSection,
  };
}
