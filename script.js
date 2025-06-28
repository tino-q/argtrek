// DOM Elements
const form = document.getElementById("tripForm");
const tripOptions = document.querySelectorAll('input[name="tripOption"]');
const accommodationOptions = document.querySelectorAll(
  'input[name="accommodation"]'
);
const roommateGroup = document.getElementById("roommateGroup");
const roommateInput = document.getElementById("roommate");
const activityCheckboxes = document.querySelectorAll(
  'input[name="activities"]'
);
const paymentScheduleOptions = document.querySelectorAll(
  'input[name="paymentSchedule"]'
);
const paymentMethodOptions = document.querySelectorAll(
  'input[name="paymentMethod"]'
);
const argentineCitizenCheckbox = document.getElementById("argentineCitizen");

// Price display elements
const baseCostElement = document.getElementById("baseCost");
const accommodationRow = document.getElementById("accommodationRow");
const accommodationCostElement = document.getElementById("accommodationCost");
const activitiesSection = document.getElementById("activitiesSection");
const subtotalElement = document.getElementById("subtotal");
const vatRow = document.getElementById("vatRow");
const vatAmountElement = document.getElementById("vatAmount");
const processingFeeRow = document.getElementById("processingFeeRow");
const processingFeeElement = document.getElementById("processingFee");
const totalAmountElement = document.getElementById("totalAmount");
const dueNowElement = document.getElementById("dueNow");

// Price calculation object
const prices = {
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

// Activity information
const activities = {
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
  activityCheckboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      const activityId = checkbox.id;
      const activity = activities[activityId];
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
  if (argentineCitizenCheckbox && argentineCitizenCheckbox.checked) {
    vatAmount = Math.round(subtotal * prices.vatRate);
  }

  // Calculate processing fee if credit card is selected
  let processingFee = 0;
  const selectedPaymentMethod = document.querySelector(
    'input[name="paymentMethod"]:checked'
  );
  if (selectedPaymentMethod && selectedPaymentMethod.value === "credit") {
    const baseForProcessing = subtotal + vatAmount;
    processingFee = Math.round(baseForProcessing * prices.creditCardFeeRate);
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
    dueNow = Math.round(totalAmount * prices.installmentRate);
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
  baseCostElement.textContent = `$${baseCost.toLocaleString()}`;

  // Show/hide accommodation upgrade row
  if (accommodationCost > 0) {
    accommodationRow.style.display = "flex";
    accommodationCostElement.textContent = `$${accommodationCost.toLocaleString()}`;
  } else {
    accommodationRow.style.display = "none";
  }

  // Update activities section
  updateActivitiesSection(selectedActivities);

  subtotalElement.textContent = `$${subtotal.toLocaleString()}`;

  // Show/hide VAT row
  if (vatAmount > 0) {
    vatRow.style.display = "flex";
    vatAmountElement.textContent = `$${vatAmount.toLocaleString()}`;
  } else {
    vatRow.style.display = "none";
  }

  // Show/hide processing fee row
  if (processingFee > 0) {
    processingFeeRow.style.display = "flex";
    processingFeeElement.textContent = `$${processingFee.toLocaleString()}`;
  } else {
    processingFeeRow.style.display = "none";
  }

  totalAmountElement.textContent = `$${totalAmount.toLocaleString()}`;
  dueNowElement.textContent = `$${dueNow.toLocaleString()}`;
}

// Update activities section with selected activities
function updateActivitiesSection(selectedActivities) {
  activitiesSection.innerHTML = "";

  if (selectedActivities.length === 0) {
    // Show placeholder when no activities are selected
    const noActivityRow = document.createElement("div");
    noActivityRow.className = "summary-row";
    noActivityRow.innerHTML = `
      <span>Optional Activities:</span>
      <span>$0</span>
    `;
    activitiesSection.appendChild(noActivityRow);
  } else {
    // Show each selected activity
    selectedActivities.forEach((activity) => {
      const activityRow = document.createElement("div");
      activityRow.className = "summary-row activity-row";
      activityRow.innerHTML = `
        <span>${activity.name} <small>(${activity.location})</small></span>
        <span>$${activity.price.toLocaleString()}</span>
      `;
      activitiesSection.appendChild(activityRow);
    });
  }
}

// Handle accommodation selection
function handleAccommodationChange() {
  const selectedAccommodation = document.querySelector(
    'input[name="accommodation"]:checked'
  );

  if (selectedAccommodation && selectedAccommodation.value === "0") {
    // Shared room selected - show roommate field
    roommateGroup.style.display = "block";
    roommateInput.setAttribute("required", "required");

    // Smooth animation
    roommateGroup.style.opacity = "0";
    roommateGroup.style.transform = "translateY(-10px)";

    setTimeout(() => {
      roommateGroup.style.transition = "all 0.3s ease";
      roommateGroup.style.opacity = "1";
      roommateGroup.style.transform = "translateY(0)";
    }, 10);
  } else {
    // Private room selected - hide roommate field
    roommateGroup.style.display = "none";
    roommateInput.removeAttribute("required");
    roommateInput.value = "";
  }

  calculatePrices();
}

// Add smooth animations to form interactions
function addFormAnimations() {
  // Add animation to radio options when selected
  const radioOptions = document.querySelectorAll(
    '.radio-option input[type="radio"]'
  );
  radioOptions.forEach((radio) => {
    radio.addEventListener("change", function () {
      // Remove animation class from all options in the same group
      const groupName = this.name;
      const groupOptions = document.querySelectorAll(
        `input[name="${groupName}"]`
      );
      groupOptions.forEach((option) => {
        option.closest(".radio-option").classList.remove("selected-animation");
      });

      // Add animation to selected option
      this.closest(".radio-option").classList.add("selected-animation");

      setTimeout(() => {
        this.closest(".radio-option").classList.remove("selected-animation");
      }, 300);
    });
  });

  // Add animation to activity cards when toggled
  activityCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      const card = this.closest(".activity-card");
      if (this.checked) {
        card.classList.add("activity-selected");
      } else {
        card.classList.remove("activity-selected");
      }
    });
  });
}

// Add CSS for animations
function addDynamicStyles() {
  const style = document.createElement("style");
  style.textContent = `
        .selected-animation {
            animation: selectPulse 0.3s ease;
        }
        
        @keyframes selectPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
        }
        
        .activity-selected {
            background: var(--gradient-selected) !important;
            border-color: var(--primary-beige) !important;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px var(--shadow-beige);
        }
        
        .activity-selected .activity-header i {
            color: var(--primary-beige-dark) !important;
            animation: bounce 0.5s ease;
        }
        
        @keyframes bounce {
            0%, 20%, 60%, 100% { transform: translateY(0); }
            40% { transform: translateY(-5px); }
            80% { transform: translateY(-2px); }
        }
        
        .price-highlight {
            animation: priceUpdate 0.5s ease;
        }
        
        @keyframes priceUpdate {
            0% { transform: scale(1); color: inherit; }
            50% { transform: scale(1.05); color: var(--primary-beige); }
            100% { transform: scale(1); color: inherit; }
        }
    `;
  document.head.appendChild(style);
}

// Animate price updates
function animatePriceUpdate() {
  const priceElements = [
    baseCostElement,
    subtotalElement,
    totalAmountElement,
    dueNowElement,
  ];

  // Add accommodation element if visible
  if (accommodationRow.style.display !== "none") {
    priceElements.push(accommodationCostElement);
  }

  // Add VAT element if visible
  if (vatRow.style.display !== "none") {
    priceElements.push(vatAmountElement);
  }

  // Add activity elements to animation
  const activityElements = activitiesSection.querySelectorAll(
    ".activity-row span:last-child"
  );
  priceElements.push(...activityElements);

  priceElements.forEach((element) => {
    element.classList.add("price-highlight");
    setTimeout(() => {
      element.classList.remove("price-highlight");
    }, 500);
  });
}

// Enhanced calculate prices with animation
function calculatePricesWithAnimation() {
  calculatePrices();
  animatePriceUpdate();
}

// Form validation with better UX
function validateForm() {
  const requiredFields = form.querySelectorAll("[required]");
  let isValid = true;
  let firstInvalidField = null;

  requiredFields.forEach((field) => {
    const value =
      field.type === "radio" || field.type === "checkbox"
        ? document.querySelector(`input[name="${field.name}"]:checked`)
        : field.value.trim();

    if (!value) {
      isValid = false;
      if (!firstInvalidField) {
        firstInvalidField = field;
      }

      // Add error styling
      if (field.type === "radio") {
        const radioGroup = field.closest(".form-group");
        radioGroup.classList.add("error");
      } else {
        field.classList.add("error");
      }
    } else {
      // Remove error styling
      if (field.type === "radio") {
        const radioGroup = field.closest(".form-group");
        radioGroup.classList.remove("error");
      } else {
        field.classList.remove("error");
      }
    }
  });

  return { isValid, firstInvalidField };
}

// Add error styles
function addErrorStyles() {
  const style = document.createElement("style");
  style.textContent = `
        .error input,
        .error .radio-option label {
            border-color: var(--error-primary) !important;
            box-shadow: 0 0 0 3px var(--error-focus) !important;
        }
        
        .error::after {
            content: "This field is required";
            color: var(--error-primary);
            font-size: 0.875rem;
            margin-top: 5px;
            display: block;
        }
        
        .form-success {
            background: linear-gradient(135deg, var(--success-primary), var(--success-dark));
            transform: scale(1.02);
        }
    `;
  document.head.appendChild(style);
}

// Handle form submission
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

    // Show error message
    showNotification("Please fill in all required fields", "error");
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
    showNotification(
      "Your trip configuration has been saved successfully!",
      "success"
    );

    setTimeout(() => {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      submitBtn.classList.remove("form-success");
    }, 3000);
  }, 2000);
}

// Show notification
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
        <i class="fas fa-${type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle"}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; font-size: 1.2rem; cursor: pointer; margin-left: auto;">×</button>
    `;

  // Add notification styles if not already added
  if (!document.querySelector("#notification-styles")) {
    const style = document.createElement("style");
    style.id = "notification-styles";
    style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 10px;
                color: white;
                font-weight: 500;
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 10px;
                max-width: 400px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                animation: slideIn 0.3s ease;
            }
            
            .notification-success {
                background: linear-gradient(135deg, var(--success-primary), var(--success-dark));
            }
            
            .notification-error {
                background: linear-gradient(135deg, var(--error-primary), var(--error-dark));
            }
            
            .notification-info {
                background: var(--gradient-primary);
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// Make checkbox option clickable
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

// Make activity cards clickable
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

// Initialize the application
function init() {
  // Add dynamic styles
  addDynamicStyles();
  addErrorStyles();

  // Add event listeners
  tripOptions.forEach((option) => {
    option.addEventListener("change", calculatePricesWithAnimation);
  });

  accommodationOptions.forEach((option) => {
    option.addEventListener("change", handleAccommodationChange);
  });

  activityCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", calculatePricesWithAnimation);
  });

  paymentScheduleOptions.forEach((option) => {
    option.addEventListener("change", calculatePricesWithAnimation);
  });

  paymentMethodOptions.forEach((option) => {
    option.addEventListener("change", calculatePricesWithAnimation);
  });

  // Argentine citizenship checkbox
  if (argentineCitizenCheckbox) {
    argentineCitizenCheckbox.addEventListener("change", function () {
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

  // Form submission
  form.addEventListener("submit", handleFormSubmit);

  // Add form animations
  addFormAnimations();

  // Make activity cards clickable
  makeActivityCardsClickable();

  // Make checkbox option clickable
  makeCheckboxOptionClickable();

  // Initial calculation
  calculatePrices();

  console.log("Argentina Trip Form initialized successfully! 🏔️");
}

// Start the application when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
