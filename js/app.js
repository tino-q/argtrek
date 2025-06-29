// Main Application Bootstrap Module
// This module initializes the application and coordinates all other modules
// Depends on: config.js, pricing.js, validation.js, animations.js, form-handlers.js, notifications.js

// Initialize the application
function init() {
  // Add dynamic styles and error handling
  addDynamicStyles();
  addErrorStyles();

  // Add event listeners for trip options
  DOM.tripOptions.forEach((option) => {
    option.addEventListener("change", calculatePricesWithAnimation);
  });

  // Add event listeners for accommodation options
  DOM.accommodationOptions.forEach((option) => {
    option.addEventListener("change", handleAccommodationChange);
  });

  // Add event listeners for activity checkboxes
  DOM.activityCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", calculatePricesWithAnimation);
  });

  // Add event listeners for payment schedule options
  DOM.paymentScheduleOptions.forEach((option) => {
    option.addEventListener("change", calculatePricesWithAnimation);
  });

  // Add event listeners for payment method options
  DOM.paymentMethodOptions.forEach((option) => {
    option.addEventListener("change", function () {
      handlePaymentMethodChange();
      calculatePricesWithAnimation();
    });
  });

  // Add event listener for Argentine citizenship checkbox
  if (DOM.argentineCitizenCheckbox) {
    DOM.argentineCitizenCheckbox.addEventListener("change", function () {
      calculatePricesWithAnimation();

      // Add visual feedback
      const checkboxOption = this.closest(".checkbox-option");
      if (this.checked) {
        checkboxOption.style.borderColor = "var(--primary-beige)";
        checkboxOption.style.backgroundColor = "rgba(184, 149, 106, 0.1)";
      } else {
        checkboxOption.style.borderColor = "var(--border-light)";
        checkboxOption.style.backgroundColor = "var(--bg-light)";
      }
    });
  }

  // Add form submission handler
  DOM.form.addEventListener("submit", handleFormSubmit);

  // Initialize UI enhancements
  addFormAnimations();
  makeActivityCardsClickable();
  makeCheckboxOptionClickable();

  // Perform initial price calculation
  calculatePrices();

  // Log successful initialization
  console.log("🏔️ Argentina Trip Form initialized successfully!");
  console.log(
    "📊 Modules loaded: config, pricing, validation, animations, form-handlers, notifications, clipboard"
  );
}

// Start the application when DOM is ready
function startApp() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}

// Auto-start the application
startApp();

// Export for manual initialization if needed
if (typeof module !== "undefined" && module.exports) {
  module.exports = { init, startApp };
}
