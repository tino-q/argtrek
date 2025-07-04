// Generic Step Navigation Component
// Uses step configuration to provide consistent navigation across all steps

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
}) => {
  const stepConfig = getStepConfig(currentStep);

  if (!stepConfig?.showNavigation) {
    return null;
  }

  const handleBack = () => {
    if (stepConfig.backStep) {
      onNavigate(stepConfig.backStep);
    }
  };

  const handleForward = () => {
    if (stepConfig.forwardStep) {
      onNavigate(stepConfig.forwardStep);
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
