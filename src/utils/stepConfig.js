// Step Configuration
// Defines all form steps and their navigation properties

export const STEPS = {
  LOGIN: "login",
  NEW_EMAIL: "new-email",
  WELCOME: "welcome",
  RSVP: "rsvp",
  ADDONS: "addons",
  PAYMENT: "payment",
  PAYMENT_DETAILS: "payment-details",
  // Participant pages
  HOME: "home",
  PAYMENTS: "payments",
  PROFILE: "profile",
  ITINERARY: "itinerary",
};

export const STEP_CONFIG = {
  [STEPS.LOGIN]: {
    id: "login",
    showNavigation: false,
    component: "EmailLogin",
  },
  [STEPS.NEW_EMAIL]: {
    id: "new-email",
    showNavigation: true,
    showBack: true,
    showForward: false,
    backText: "Back to Login",
    backStep: STEPS.LOGIN,
    component: "NewEmailStep",
    customForward: "SafeSubmitButton",
  },
  [STEPS.WELCOME]: {
    id: "welcome",
    showNavigation: true,
    showBack: true,
    showForward: true,
    backText: "Back to Login",
    forwardText: "Trip Details",
    forwardIcon: "fas fa-arrow-right",
    backStep: STEPS.LOGIN,
    forwardStep: STEPS.RSVP,
    component: "WelcomeSection",
  },
  [STEPS.RSVP]: {
    id: "rsvp",
    showNavigation: true,
    showBack: true,
    showForward: true,
    backText: "Back to Welcome",
    forwardText: "Select Experiences",
    backStep: STEPS.WELCOME,
    forwardStep: STEPS.ADDONS,
    component: "RSVPDisplay",
  },
  [STEPS.ADDONS]: {
    id: "addons",
    showNavigation: true,
    showBack: true,
    showForward: true,
    backText: "Back to Trip Details",
    forwardText: "Continue to Payment",
    backStep: STEPS.RSVP,
    forwardStep: STEPS.PAYMENT,
    component: "AddonsStep",
  },
  [STEPS.PAYMENT]: {
    id: "payment",
    showNavigation: true,
    showBack: true,
    showForward: false,
    backText: "Back to Add-ons",
    backStep: STEPS.ADDONS,
    component: "PaymentStep",
    customForward: "SubmitButton",
  },
  [STEPS.PAYMENT_DETAILS]: {
    id: "payment-details",
    showNavigation: false,
    showBack: false,
    showForward: false,
    component: "PaymentDetailsDisplay",
  },
  // Participant pages
  [STEPS.HOME]: {
    id: "home",
    showNavigation: false,
    showBack: false,
    showForward: false,
    component: "Home",
  },
  [STEPS.PAYMENTS]: {
    id: "payments",
    showNavigation: false,
    showBack: false,
    showForward: false,
    component: "Payments",
  },
  [STEPS.PROFILE]: {
    id: "profile",
    showNavigation: false,
    showBack: false,
    showForward: false,
    component: "Profile",
  },
  [STEPS.ITINERARY]: {
    id: "itinerary",
    showNavigation: false,
    showBack: false,
    showForward: false,
    component: "Itinerary",
  },
};

// Get ordered list of steps
export const STEP_ORDER = [
  STEPS.LOGIN,
  STEPS.NEW_EMAIL,
  STEPS.WELCOME,
  STEPS.RSVP,
  STEPS.ADDONS,
  STEPS.PAYMENT,
  STEPS.PAYMENT_DETAILS,
];

// Helper functions
export const getStepConfig = (stepId) => STEP_CONFIG[stepId];
export const getNextStep = (currentStep) => {
  const config = getStepConfig(currentStep);
  return config?.forwardStep || null;
};
export const getPreviousStep = (currentStep) => {
  const config = getStepConfig(currentStep);
  return config?.backStep || null;
};
