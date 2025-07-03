// Generic Step Renderer Component
// Renders the appropriate step component based on current step

import EmailLogin from "../auth/EmailLogin";
import WelcomeSection from "../layout/WelcomeSection";
import RSVPDisplay from "../display/RSVPDisplay";
import AddonsStep from "../form/AddonsStep";
import PaymentStep from "../form/PaymentStep";
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
}) => {
  const stepConfig = getStepConfig(currentStep);

  if (!stepConfig) {
    return null;
  }

  switch (currentStep) {
    case "login":
      return <EmailLogin onEmailSubmit={onEmailSubmit} />;

    case "welcome":
      return <WelcomeSection onLogout={onLogout} />;

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

    default:
      return null;
  }
};

export default StepRenderer;
