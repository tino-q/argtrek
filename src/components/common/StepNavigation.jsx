// Generic Step Navigation Component
// Uses step configuration to provide consistent navigation across all steps

import { useState } from "react";
import Navigation from "./Navigation";
import SafeSubmitButton from "./SafeSubmitButton";
import { getStepConfig } from "../../utils/stepConfig";
import { FORM_FIELDS } from "../../utils/config";

const StepNavigation = ({
  currentStep,
  onNavigate,
  onSubmit,
  isSubmitting,
  formData,
  showError,
  onNewEmailRequest,
  onRSVPContinue,
}) => {
  const [isNewEmailLoading, setIsNewEmailLoading] = useState(false);
  const stepConfig = getStepConfig(currentStep);

  if (!stepConfig?.showNavigation) {
    return null;
  }

  const handleBack = () => {
    if (stepConfig.backStep) {
      onNavigate(stepConfig.backStep);
    }
  };

  const handleForward = async () => {
    // Special handling for RSVP step to use custom validation
    if (currentStep === "rsvp" && onRSVPContinue) {
      onRSVPContinue();
      return;
    }

    if (stepConfig.forwardStep) {
      onNavigate(stepConfig.forwardStep);
    }
  };

  const handleNewEmailSubmit = async () => {
    if (currentStep === "new-email" && onNewEmailRequest) {
      // Get email and name from URL params and form data
      const urlParams = new URLSearchParams(window.location.search);
      const email = urlParams.get("email") || formData.newEmailEmail;
      const name = formData.newEmailName;

      if (!email || !name) {
        showError("Please provide both email and name.");
        return;
      }

      setIsNewEmailLoading(true);
      try {
        await onNewEmailRequest(email, name);
        // Navigation will be handled by the parent component after successful request
      } catch {
        // Error handling is done in the parent component
      } finally {
        setIsNewEmailLoading(false);
      }
    }
  };

  const handleSubmit = async () => {
    // Validate required fields for payment step
    if (currentStep === "payment") {
      if (!formData[FORM_FIELDS.PAYMENT_SCHEDULE]) {
        showError("Please select a payment schedule.");
        return;
      }

      if (!formData[FORM_FIELDS.PAYMENT_METHOD]) {
        showError("Please select a payment method.");
        return;
      }
    }

    if (onSubmit) {
      await onSubmit();
    }
  };

  // Handle custom forward component (like submit button)
  if (stepConfig.customForward === "SubmitButton") {
    return (
      <Navigation
        onBack={handleBack}
        onForward={null}
        backText={stepConfig.backText}
        showForward={false}
        forwardComponent={
          <SafeSubmitButton
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
            disabled={
              !formData[FORM_FIELDS.PAYMENT_SCHEDULE] ||
              !formData[FORM_FIELDS.PAYMENT_METHOD]
            }
            confirmText="You can only submit once, continue?"
            confirmDuration={3000}
          >
            <i className="fas fa-check"></i> Submit Registration
          </SafeSubmitButton>
        }
      />
    );
  }

  // Handle new email request with SafeSubmitButton
  if (stepConfig.customForward === "SafeSubmitButton") {
    return (
      <Navigation
        onBack={handleBack}
        onForward={null}
        backText={stepConfig.backText}
        showForward={false}
        forwardComponent={
          <SafeSubmitButton
            onSubmit={handleNewEmailSubmit}
            isLoading={isNewEmailLoading}
            disabled={!formData.newEmailName}
            confirmText="Submit account request?"
            confirmDuration={3000}
          >
            <i className="fas fa-paper-plane"></i> Request My Account
          </SafeSubmitButton>
        }
      />
    );
  }

  // Standard navigation
  return (
    <Navigation
      onBack={stepConfig.showBack ? handleBack : null}
      onForward={stepConfig.showForward ? handleForward : null}
      backText={stepConfig.backText}
      forwardText={stepConfig.forwardText}
      forwardIcon={stepConfig.forwardIcon}
      className={`${currentStep}-navigation`}
    />
  );
};

export default StepNavigation;
