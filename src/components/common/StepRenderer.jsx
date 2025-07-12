// Generic Step Renderer Component
// Renders the appropriate step component based on current step

import { useTripContext } from "../../hooks/useTripContext";
import EmailLogin from "../auth/EmailLogin";
import WelcomeSection from "../layout/WelcomeSection";
import RSVPDisplay from "../display/RSVPDisplay";
import AddonsStep from "../form/AddonsStep";
import PaymentStep from "../form/PaymentStep";
import NewEmailStep from "../form/NewEmailStep";
import Home from "../participant/Home";
import Payments from "../participant/Payments";
import { getStepConfig } from "../../utils/stepConfig";

const StepRenderer = ({
  currentStep,
  pricing,
  onLoginSuccess,
  onExistingSubmission,
  onLogout,
  onRSVPContinue,
  onEmailNotFound,
  onNavigate,
}) => {
  const { userRSVP, formData, updateFormData } = useTripContext();
  const stepConfig = getStepConfig(currentStep);

  if (!stepConfig) {
    return null;
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case "login":
        return (
          <EmailLogin
            onLoginSuccess={onLoginSuccess}
            onExistingSubmission={onExistingSubmission}
            onLogout={onLogout}
            onEmailNotFound={onEmailNotFound}
          />
        );

      case "new-email":
        return <NewEmailStep updateFormData={updateFormData} />;

      case "welcome":
        return <WelcomeSection userRSVP={userRSVP} />;

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

      case "home":
        return <Home onLogout={onLogout} onNavigate={onNavigate} />;

      case "payments":
        return <Payments pricing={pricing} onNavigate={onNavigate} />;

      case "profile":
        return (
          <div className="placeholder-page">
            <h2>Profile & Trip Details</h2>
            <p>Coming soon - manage your profile and trip preferences here.</p>
            <button
              className="btn btn-primary"
              onClick={() => onNavigate("home")}
            >
              Back to Home
            </button>
          </div>
        );

      case "itinerary":
        return (
          <div className="placeholder-page">
            <h2>Trip Itinerary</h2>
            <p>Coming soon - view your complete Argentina itinerary here.</p>
            <button
              className="btn btn-primary"
              onClick={() => onNavigate("home")}
            >
              Back to Home
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return renderStepContent();
};

export default StepRenderer;
