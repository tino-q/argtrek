// FormFlow Component
// Handles the registration form flow for new participants

import { useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { useFormSubmission } from "../../hooks/useFormSubmission";
import { useNotificationContext } from "../../hooks/useNotificationContext";
import { usePricing } from "../../hooks/usePricing";
import { useTripContext } from "../../hooks/useTripContext";
import { FORM_FIELDS } from "../../utils/config";
import { getEmail } from "../../utils/rsvpData";
import { STEPS } from "../../utils/stepConfig";
import StepNavigation from "../common/StepNavigation";
import StepRenderer from "../common/StepRenderer";

const FormFlow = () => {
  const { setSubmissionResult } = useTripContext();
  const navigate = useNavigate();
  const location = useLocation();
  const formRef = useRef(null);

  // Trip context
  const { userRSVP, formData } = useTripContext();

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

  // Handle RSVP continue - proceed to next step
  const handleRSVPContinue = useCallback(() => {
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

    navigate(`/${STEPS.ADDONS}`);
  }, [formData, showError, navigate]);

  // Handle form submission
  const handleSubmitForm = useCallback(async () => {
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

      const result = await submitForm(submissionData, userRSVP, pricing);

      if (result.success) {
        setSubmissionResult(result.data);
        navigate(`/${STEPS.PAYMENTS}`);
        showSuccess("Registration confirmed!", {
          duration: 3000,
          autoClose: true,
        });
      } else {
        showError(result.message, result.options);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      showError("An unexpected error occurred. Please try again.");
    }
  }, [
    formData,
    showError,
    submitForm,
    userRSVP,
    pricing,
    setSubmissionResult,
    navigate,
    showSuccess,
  ]);

  // Handle logout

  // Common step props
  const commonStepProps = {
    pricing,
    onRSVPContinue: handleRSVPContinue,
  };

  return (
    <div ref={formRef} className="trip-form">
      <StepRenderer currentStep={currentStep} {...commonStepProps} />

      <StepNavigation
        currentStep={currentStep}
        onSubmit={handleSubmitForm}
        isSubmitting={isSubmitting}
        formData={formData}
        onRSVPContinue={handleRSVPContinue}
      />
    </div>
  );
};

export default FormFlow;
