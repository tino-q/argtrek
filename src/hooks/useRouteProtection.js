// Route Protection Hook
// Prevents unauthorized access to steps and handles redirects

import { useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { STEPS } from "../utils/stepConfig";

export const useRouteProtection = (userRSVP, isFormSubmitted) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get current step and check access synchronously during render
  const currentStep = useMemo(() => {
    return location.pathname.slice(1) || STEPS.LOGIN;
  }, [location.pathname]);

  // Synchronous access check - prevents rendering if not authorized
  const isAuthorized = useMemo(() => {
    const stepRequirements = {
      [STEPS.LOGIN]: () => true, // Always accessible
      [STEPS.WELCOME]: () => !!userRSVP, // Requires user RSVP data
      [STEPS.RSVP]: () => !!userRSVP,
      [STEPS.ADDONS]: () => !!userRSVP,
      [STEPS.PAYMENT]: () => !!userRSVP,
      [STEPS.PAYMENT_DETAILS]: () => !!userRSVP && isFormSubmitted, // Requires RSVP and form submission
    };

    const requirement = stepRequirements[currentStep];
    return requirement ? requirement() : false;
  }, [currentStep, userRSVP, isFormSubmitted]);

  // Immediate redirect when unauthorized
  useEffect(() => {
    if (!isAuthorized) {
      console.log(
        `🔒 Unauthorized access to ${currentStep} - redirecting to login`
      );
      navigate("/login", { replace: true });
    }
  }, [isAuthorized, currentStep, navigate]);

  // Additional check for payment details specific case
  useEffect(() => {
    if (currentStep === STEPS.PAYMENT_DETAILS && userRSVP && !isFormSubmitted) {
      console.log(
        `🔒 Payment details requires form submission - redirecting to payment`
      );
      navigate("/payment", { replace: true });
    }
  }, [currentStep, userRSVP, isFormSubmitted, navigate]);

  return {
    isAuthorized,
    currentStep,
    isStepAccessible: (step) => {
      switch (step) {
        case STEPS.LOGIN:
          return true;
        case STEPS.WELCOME:
        case STEPS.RSVP:
        case STEPS.ADDONS:
        case STEPS.PAYMENT:
          return !!userRSVP;
        case STEPS.PAYMENT_DETAILS:
          return !!userRSVP && isFormSubmitted;
        default:
          return false;
      }
    },
  };
};
