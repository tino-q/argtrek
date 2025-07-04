// Generic Step Renderer Component
// Renders the appropriate step component based on current step

import EmailLogin from "../auth/EmailLogin";
import WelcomeSection from "../layout/WelcomeSection";
import RSVPDisplay from "../display/RSVPDisplay";
import AddonsStep from "../form/AddonsStep";
import PaymentStep from "../form/PaymentStep";
import PaymentDetailsDisplay from "../display/PaymentDetailsDisplay";
import NewEmailStep from "../form/NewEmailStep";
import { getStepConfig } from "../../utils/stepConfig";

const StepRenderer = ({
  currentStep,
  userRSVP,
  formData,
  updateFormData,
  pricing,
  onEmailSubmit,
  onLogout,
  onRSVPContinue,
  isFormSubmitted,
  submissionResult,
  onEmailNotFound,
  showSuccess,
  showError,
}) => {
  const stepConfig = getStepConfig(currentStep);

  if (!stepConfig) {
    return null;
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case "login":
        return (
          <EmailLogin
            onEmailSubmit={onEmailSubmit}
            onLogout={onLogout}
            onEmailNotFound={onEmailNotFound}
          />
        );

      case "new-email":
        return <NewEmailStep updateFormData={updateFormData} />;

      case "welcome":
        return (
          <WelcomeSection
            userRSVP={userRSVP}
            showSuccess={showSuccess}
            showError={showError}
          />
        );

      case "rsvp":
        if (!userRSVP) return null;
        return (
          <RSVPDisplay
            rsvpData={userRSVP}
            onContinue={onRSVPContinue}
            onLogout={onLogout}
            formData={formData}
            updateFormData={updateFormData}
            hideNavigation={true}
          />
        );

      case "addons":
        return (
          <AddonsStep
            formData={formData}
            updateFormData={updateFormData}
            rsvpData={userRSVP}
          />
        );

      case "payment":
        return (
          <PaymentStep
            formData={formData}
            updateFormData={updateFormData}
            rsvpData={userRSVP}
            pricing={pricing}
          />
        );

      case "payment-details":
        // Protect payment details - only show if form has been submitted
        if (!isFormSubmitted) {
          return (
            <div className="access-denied">
              <h2>Access Denied</h2>
              <p>
                Payment details are only available after completing your
                registration.
              </p>
            </div>
          );
        }
        return (
          <PaymentDetailsDisplay
            rsvpData={userRSVP}
            formData={formData}
            pricing={pricing}
            onLogout={onLogout}
            submissionResult={submissionResult}
          />
        );

      default:
        return null;
    }
  };

  return <div className="form-content-wrapper">{renderStepContent()}</div>;
};

export default StepRenderer;
