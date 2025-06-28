// Generic Step Renderer Component
// Renders the appropriate step component based on current step

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useTripContext } from "../../hooks/useTripContext";
import { getStepConfig } from "../../utils/stepConfig";
import EmailLogin from "../auth/EmailLogin";
import RSVPDisplay from "../display/RSVPDisplay";
import AddonsStep from "../form/AddonsStep";
import PaymentStep from "../form/PaymentStep";
import WelcomeSection from "../layout/WelcomeSection";
import Home from "../participant/Home";
import Payments from "../participant/Payments";

const StepRenderer = ({ currentStep, pricing, onRSVPContinue }) => {
  const { userRSVP, formData, updateFormData } = useTripContext();
  const navigate = useNavigate();
  const stepConfig = getStepConfig(currentStep);

  const handleHomeNavigation = useCallback(() => navigate("/home"), [navigate]);

  if (!stepConfig) {
    return null;
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case "login":
        return <EmailLogin />;

      case "welcome":
        return <WelcomeSection userRSVP={userRSVP} />;

      case "rsvp":
        if (!userRSVP) {
          return null;
        }
        return (
          <RSVPDisplay
            rsvpData={userRSVP}
            onContinue={onRSVPContinue}
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
        return <Home />;

      case "payments":
        return <Payments pricing={pricing} />;

      case "profile":
        return (
          <div className="placeholder-page">
            <h2>Profile & Trip Details</h2>
            <p>Coming soon - manage your profile and trip preferences here.</p>
            <button
              className="btn btn-secondary"
              onClick={handleHomeNavigation}
            >
              <i className="fas fa-arrow-left" />
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
              className="btn btn-secondary"
              onClick={handleHomeNavigation}
            >
              <i className="fas fa-arrow-left" />
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
