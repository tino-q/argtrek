// FormFlow Component
// Handles the registration form flow for new participants

import { useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePricing } from "../../hooks/usePricing";
import { useFormSubmission } from "../../hooks/useFormSubmission";
import { useTripContext } from "../../hooks/useTripContext";
import { useNotificationContext } from "../../hooks/useNotificationContext";
import { FORM_FIELDS } from "../../utils/config";
import { getEmail } from "../../utils/rsvpData";
import { STEPS } from "../../utils/stepConfig";

// Import form-specific components
import StepRenderer from "../common/StepRenderer";
import StepNavigation from "../common/StepNavigation";

const FormFlow = ({
  onLoginSuccess,
  onExistingSubmission,
  onFormSubmitted,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const formRef = useRef(null);

  // Trip context
  const { userRSVP, formData, resetFormData } = useTripContext();

  // Notification context
  const { showSuccess, showError } = useNotificationContext();

  // Custom hooks
  const pricing = usePricing(userRSVP, formData);
  const { submitForm, isSubmitting } = useFormSubmission();

  // Get current step from URL path
  const getCurrentStepFromPath = () => {
    const path = location.pathname.slice(1);
    return path || STEPS.LOGIN;
  };

  const currentStep = getCurrentStepFromPath();

  // Generic navigation handler
  const navigateToStep = (step) => {
    navigate(`/${step}`);
  };

  // Handle RSVP continue - proceed to next step
  const handleRSVPContinue = () => {
    // Validate required fields before continuing
    const errors = {};

    if (!formData[FORM_FIELDS.FIRST_NAME]?.trim()) {
      errors[FORM_FIELDS.FIRST_NAME] = true;
    }

    if (!formData[FORM_FIELDS.LAST_NAME]?.trim()) {
      errors[FORM_FIELDS.LAST_NAME] = true;
    }

    if (!formData[FORM_FIELDS.PHONE_NUMBER]?.trim()) {
      errors[FORM_FIELDS.PHONE_NUMBER] = true;
    }

    const hasFieldErrors = Object.keys(errors).length > 0;
    const hasConfirmationError = !formData.travelDocumentConfirmed;

    if (hasFieldErrors || hasConfirmationError) {
      let scrollTarget = null;
      let errorMessage = "";

      if (errors[FORM_FIELDS.FIRST_NAME]) {
        scrollTarget = document.getElementById("first-name-input");
        errorMessage = "Please enter your first name.";
      } else if (errors[FORM_FIELDS.LAST_NAME]) {
        scrollTarget = document.getElementById("last-name-input");
        errorMessage = "Please enter your last name.";
      } else if (errors[FORM_FIELDS.PHONE_NUMBER]) {
        scrollTarget = document.getElementById("phone-number-input");
        errorMessage = "Please enter your phone number.";
      } else if (hasConfirmationError) {
        scrollTarget = document.getElementById("travel-document-confirmation");
        errorMessage =
          "Please confirm that your travel document information is correct.";
      }

      if (hasFieldErrors) {
        showError(
          errorMessage ||
            "Please fill in all required fields: First Name, Last Name, and Phone Number."
        );
      } else if (hasConfirmationError) {
        showError(errorMessage);
      }

      if (scrollTarget) {
        scrollTarget.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        if (scrollTarget.id === "travel-document-confirmation") {
          scrollTarget.classList.add("highlight-error");
          setTimeout(() => {
            scrollTarget.classList.remove("highlight-error");
          }, 2000);
        } else {
          setTimeout(() => {
            scrollTarget.focus();
          }, 300);
        }
      }

      return;
    }

    navigateToStep(STEPS.ADDONS);
  };

  // Handle form submission
  const handleSubmitForm = async () => {
    try {
      if (!formData[FORM_FIELDS.PAYMENT_SCHEDULE]) {
        showError("Please select a payment schedule.");
        return;
      }

      if (!formData[FORM_FIELDS.PAYMENT_METHOD]) {
        showError("Please select a payment method.");
        return;
      }

      const submissionData = {
        ...formData,
        email: getEmail(userRSVP),
      };

      console.log("🚀 SUBMITTING FORM DATA:");
      console.log("========================");
      console.table(submissionData);
      console.log("Raw form data:", JSON.stringify(submissionData, null, 2));
      console.log("========================");

      const result = await submitForm(submissionData, userRSVP, pricing);

      if (result.success) {
        onFormSubmitted(result.data);
        navigateToStep(STEPS.PAYMENTS);
        showSuccess(
          "Registration confirmed! Check your payment details below.",
          {
            duration: 3000,
            autoClose: true,
          }
        );
      } else {
        showError(result.message, result.options);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      showError("An unexpected error occurred. Please try again.");
    }
  };

  // Handle logout
  const handleLogout = () => {
    navigateToStep(STEPS.LOGIN);
    resetFormData();
    showSuccess(
      "Logged out successfully. You can now login with different credentials."
    );
  };

  // Common step props
  const commonStepProps = {
    pricing,
    onLogout: handleLogout,
    onRSVPContinue: handleRSVPContinue,
    onNavigate: navigateToStep,
    onLoginSuccess, // New registration login success
    onExistingSubmission, // Existing user found during login
  };

  return (
    <div ref={formRef} className="trip-form">
      <StepRenderer currentStep={currentStep} {...commonStepProps} />

      <StepNavigation
        currentStep={currentStep}
        onNavigate={navigateToStep}
        onSubmit={handleSubmitForm}
        isSubmitting={isSubmitting}
        formData={formData}
        onRSVPContinue={handleRSVPContinue}
      />
    </div>
  );
};

export default FormFlow;
