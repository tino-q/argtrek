// UI Animations and Effects Module
// This module handles all visual animations and dynamic styling
// Depends on: config.js

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
  DOM.activityCheckboxes.forEach((checkbox) => {
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

// Add CSS animations and dynamic styles to the document
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

// Animate price updates with visual feedback
function animatePriceUpdate() {
  const priceElements = [
    DOM.baseCostElement,
    DOM.subtotalElement,
    DOM.totalAmountElement,
    DOM.dueNowElement,
  ];

  // Add accommodation element if visible
  if (DOM.accommodationRow.style.display !== "none") {
    priceElements.push(DOM.accommodationCostElement);
  }

  // Add VAT element if visible
  if (DOM.vatRow.style.display !== "none") {
    priceElements.push(DOM.vatAmountElement);
  }

  // Add processing fee element if visible
  if (DOM.processingFeeRow.style.display !== "none") {
    priceElements.push(DOM.processingFeeElement);
  }

  // Add activity elements to animation
  const activityElements = DOM.activitiesSection.querySelectorAll(
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

// Export functions for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    addFormAnimations,
    addDynamicStyles,
    animatePriceUpdate,
  };
}
