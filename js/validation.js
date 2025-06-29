// Form Validation Module
// This module handles all form validation logic and error styling
// Depends on: config.js

// Form validation with better UX
function validateForm() {
  const requiredFields = DOM.form.querySelectorAll("[required]");
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

// Add error styles to the document
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

// Export functions for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    validateForm,
    addErrorStyles,
  };
}
