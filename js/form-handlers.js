// Form Interaction Handlers Module
// This module handles all form interactions, user events, and form submission
// Depends on: config.js, pricing.js, validation.js, animations.js, notifications.js

// Enhanced calculate prices with animation - bridges pricing and animations modules
function calculatePricesWithAnimation() {
  calculatePrices();
  animatePriceUpdate();
}

// Handle accommodation selection changes
function handleAccommodationChange() {
  const selectedAccommodation = document.querySelector(
    'input[name="accommodation"]:checked'
  );

  if (selectedAccommodation && selectedAccommodation.value === "0") {
    // Shared room selected - show roommate field
    DOM.roommateGroup.style.display = "block";
    DOM.roommateInput.required = true;

    // Add animation
    DOM.roommateGroup.style.opacity = "0";
    DOM.roommateGroup.style.transform = "translateY(-10px)";
    setTimeout(() => {
      DOM.roommateGroup.style.transition = "all 0.3s ease";
      DOM.roommateGroup.style.opacity = "1";
      DOM.roommateGroup.style.transform = "translateY(0)";
    }, 10);
  } else {
    // Private room selected - hide roommate field
    DOM.roommateGroup.style.display = "none";
    DOM.roommateInput.required = false;
    DOM.roommateInput.value = "";
  }

  // Recalculate prices
  calculatePricesWithAnimation();
}

// Handle payment method changes (show/hide banking details)
function handlePaymentMethodChange() {
  const selectedPaymentMethod = document.querySelector(
    'input[name="paymentMethod"]:checked'
  );

  if (selectedPaymentMethod && selectedPaymentMethod.value === "bank") {
    // Bank transfer selected - show banking details
    DOM.bankingDetails.style.display = "block";

    // Add animation
    DOM.bankingDetails.style.opacity = "0";
    DOM.bankingDetails.style.transform = "translateY(-10px)";
    setTimeout(() => {
      DOM.bankingDetails.style.transition = "all 0.3s ease";
      DOM.bankingDetails.style.opacity = "1";
      DOM.bankingDetails.style.transform = "translateY(0)";
    }, 10);
  } else {
    // Credit card selected - hide banking details
    DOM.bankingDetails.style.display = "none";
  }

  // Recalculate prices for processing fee
  calculatePricesWithAnimation();
}

// Handle form submission with validation and user feedback
function handleFormSubmit(event) {
  event.preventDefault();

  const validation = validateForm();

  if (!validation.isValid) {
    // Scroll to first invalid field
    if (validation.firstInvalidField) {
      validation.firstInvalidField.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }

    // Show error message using notifications module
    showError("Please fill in all required fields");
    return;
  }

  // Simulate form processing
  const submitBtn = document.querySelector(".submit-btn");
  const originalText = submitBtn.innerHTML;

  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  submitBtn.disabled = true;
  submitBtn.classList.add("form-success");

  setTimeout(() => {
    submitBtn.innerHTML = '<i class="fas fa-check"></i> Configuration Saved!';
    showSuccess("Your trip configuration has been saved successfully!");

    setTimeout(() => {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      submitBtn.classList.remove("form-success");
    }, 3000);
  }, 2000);
}

// Make checkbox option clickable for better UX
function makeCheckboxOptionClickable() {
  const checkboxOption = document.querySelector(".checkbox-option");

  if (checkboxOption) {
    checkboxOption.addEventListener("click", function (e) {
      // Only prevent if clicking directly on the checkbox itself
      if (e.target.type === "checkbox") {
        return;
      }

      const checkbox = this.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event("change"));
      }
    });
  }
}

// Make activity cards clickable for better user experience
function makeActivityCardsClickable() {
  const activityCards = document.querySelectorAll(".activity-card");

  activityCards.forEach((card) => {
    // Add cursor pointer to indicate clickability
    card.style.cursor = "pointer";

    card.addEventListener("click", function (e) {
      // Don't trigger if clicking directly on the checkbox or label
      if (e.target.type === "checkbox" || e.target.tagName === "LABEL") {
        return;
      }

      const checkbox = card.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.checked = !checkbox.checked;

        // Trigger the change event to update animations and calculations
        checkbox.dispatchEvent(new Event("change"));
      }
    });

    // Add hover effect
    card.addEventListener("mouseenter", function () {
      if (!this.querySelector('input[type="checkbox"]').checked) {
        this.style.transform = "translateY(-2px)";
        this.style.transition = "all 0.2s ease";
      }
    });

    card.addEventListener("mouseleave", function () {
      if (!this.querySelector('input[type="checkbox"]').checked) {
        this.style.transform = "translateY(0)";
      }
    });
  });
}

// Export functions for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    calculatePricesWithAnimation,
    handleAccommodationChange,
    handlePaymentMethodChange,
    handleFormSubmit,
    makeCheckboxOptionClickable,
    makeActivityCardsClickable,
  };
}
