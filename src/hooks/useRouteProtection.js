// Route Protection Hook
// Prevents unauthorized access to steps and handles redirects

import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { STEPS } from "../utils/stepConfig";

export const useRouteProtection = (userRSVP) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname.slice(1) || STEPS.LOGIN;

    // Define step requirements
    const stepRequirements = {
      [STEPS.LOGIN]: () => true, // Always accessible
      [STEPS.WELCOME]: () => !!userRSVP, // Requires user RSVP data
      [STEPS.RSVP]: () => !!userRSVP,
      [STEPS.ADDONS]: () => !!userRSVP,
      [STEPS.PAYMENT]: () => !!userRSVP,
    };

    // Check if current step is accessible
    const requirement = stepRequirements[currentPath];

    if (requirement && !requirement()) {
      // Redirect to appropriate step
      if (!userRSVP) {
        navigate("/login", { replace: true });
      }
    }
  }, [location.pathname, userRSVP, navigate]);

  return {
    isStepAccessible: (step) => {
      switch (step) {
        case STEPS.LOGIN:
          return true;
        case STEPS.WELCOME:
        case STEPS.RSVP:
        case STEPS.ADDONS:
        case STEPS.PAYMENT:
          return !!userRSVP;
        default:
          return false;
      }
    },
  };
};
