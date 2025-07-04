// Main Trip Form React App
// Enhanced with browser navigation integration using React Router

import { useState, useRef, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useNotifications } from "./hooks/useNotifications";
import { injectAnimationStyles } from "./hooks/useAnimations";
import { usePricing } from "./hooks/usePricing";
import { useFormSubmission } from "./hooks/useFormSubmission";
import { useRouteProtection } from "./hooks/useRouteProtection";
import { FORM_FIELDS, APPS_SCRIPT_URL } from "./utils/config";
import { getEmail, getTravelerName } from "./utils/rsvpData";

// Import components
import Header from "./components/layout/Header";
import StepRenderer from "./components/common/StepRenderer";
import StepNavigation from "./components/common/StepNavigation";
import NotificationContainer from "./components/common/NotificationContainer";
import Footer from "./components/layout/Footer";
import { STEPS } from "./utils/stepConfig";

function App() {
  // Get default form data state
  const getDefaultFormData = () => {
    return {
      [FORM_FIELDS.PAYMENT_SCHEDULE]: "full",
      [FORM_FIELDS.PAYMENT_METHOD]: "credit",
      [FORM_FIELDS.ARGENTINE_CITIZEN]: false,
      [FORM_FIELDS.DIETARY_RESTRICTIONS]: "none",
      [FORM_FIELDS.PRIVATE_ROOM_UPGRADE]: false, // Default to shared room
      [FORM_FIELDS.RAFTING]: false,
      [FORM_FIELDS.HORSEBACK]: false,
      [FORM_FIELDS.COOKING]: false,
      [FORM_FIELDS.CRYPTO_CURRENCY]: "USDT",
      [FORM_FIELDS.CRYPTO_NETWORK]: "ETH",
      [FORM_FIELDS.ROOMMATE_PREFERENCE]: "",
      [FORM_FIELDS.ROOMMATE_NAME]: "",
      [FORM_FIELDS.DIETARY_MESSAGE]: "",
      [FORM_FIELDS.EMAIL]: "",
      [FORM_FIELDS.FULL_NAME]: "",
    };
  };

  // Application state - Simple initialization without localStorage
  const [userRSVP, setUserRSVP] = useState(null);
  const [formData, setFormData] = useState(getDefaultFormData());
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  // React Router hooks
  const navigate = useNavigate();
  const location = useLocation();

  // Custom hooks
  const { notifications, showSuccess, showError, removeNotification } =
    useNotifications();
  const pricing = usePricing(userRSVP, formData);
  const { submitForm, isSubmitting } = useFormSubmission();

  // Route protection (automatically handles redirects)
  const { isAuthorized, currentStep: protectedCurrentStep } =
    useRouteProtection(userRSVP, isFormSubmitted);

  // Form reference for validation feedback
  const formRef = useRef(null);

  // Get current step from URL path
  const getCurrentStepFromPath = () => {
    const path = location.pathname.slice(1); // Remove leading slash
    return path || STEPS.LOGIN; // Default to login if no path
  };

  const currentStep = getCurrentStepFromPath();

  // Initialize animations when component mounts
  useEffect(() => {
    injectAnimationStyles();
  }, []);

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  // Update document title based on current step
  useEffect(() => {
    const stepTitles = {
      [STEPS.LOGIN]: "Login - Argentina Trek",
      [STEPS.WELCOME]: "Welcome - Argentina Trek",
      [STEPS.RSVP]: "Trip Details - Argentina Trek",
      [STEPS.ADDONS]: "Select Experiences - Argentina Trek",
      [STEPS.PAYMENT]: "Payment - Argentina Trek",
      [STEPS.PAYMENT_DETAILS]: "Payment Details - Argentina Trek",
    };

    document.title = stepTitles[currentStep] || "Argentina Trek";
  }, [currentStep]);

  // Generic navigation handler using React Router
  const navigateToStep = (step) => {
    navigate(`/${step}`);
  };

  // Handle successful login
  const handleLoginSuccess = (userData, successMessage) => {
    setUserRSVP(userData);
    navigateToStep(STEPS.WELCOME);
    showSuccess(successMessage);
  };

  // Handle email and password login submission
  const handleEmailLogin = async (email, password) => {
    try {
      // Make GET request to RSVP Apps Script
      const response = await fetch(
        `${APPS_SCRIPT_URL}?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
        {
          method: "GET",
        }
      );

      const result = await response.json();

      if (result.error) {
        // Handle specific error types
        if (
          result.error.includes("password") ||
          result.error.includes("Invalid password")
        ) {
          showError(
            "Invalid password. Please check your password and try again."
          );
        } else if (
          result.error.includes("email") ||
          result.error.includes("Email not found")
        ) {
          showError(
            "Email not found. Please check your email address and try again."
          );
        } else {
          showError(result.error);
        }
      } else {
        // Valid RSVP found - store data and move to welcome display
        console.log("✅ USER LOGIN SUCCESS - Complete RSVP Payload:");
        console.log("===============================================");
        console.table(result.data);
        console.log("Raw JSON Data:", JSON.stringify(result.data, null, 2));
        console.log("===============================================");

        handleLoginSuccess(result.data, "Trip details retrieved successfully!");
      }
    } catch (error) {
      console.error("Login error:", error);
      showError(
        "Failed to retrieve trip details. Please check your internet connection and try again."
      );
    }
  };

  // Form data management functions
  const updateFormData = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle RSVP continue - proceed to next step
  const handleRSVPContinue = () => {
    // No need to copy RSVP data to formData - pricing hook will handle it
    navigateToStep(STEPS.ADDONS);
  };

  // Handle form submission
  const handleSubmitForm = async () => {
    try {
      // Validate required fields
      if (!formData[FORM_FIELDS.PAYMENT_SCHEDULE]) {
        showError("Please select a payment schedule.");
        return;
      }

      if (!formData[FORM_FIELDS.PAYMENT_METHOD]) {
        showError("Please select a payment method.");
        return;
      }

      // Create submission data with user info from RSVP (simplified 1:1 mapping)
      const submissionData = {
        ...formData,
        email: getEmail(userRSVP),
        fullName: getTravelerName(userRSVP),
      };

      console.log("🚀 SUBMITTING FORM DATA:");
      console.log("========================");
      console.table(submissionData);
      console.log("Raw form data:", JSON.stringify(submissionData, null, 2));
      console.log("========================");

      const result = await submitForm(submissionData, userRSVP, pricing);

      if (result.success) {
        // Mark form as submitted and navigate to payment details
        setIsFormSubmitted(true);
        navigateToStep(STEPS.PAYMENT_DETAILS);
        showSuccess(
          "Registration confirmed! Check your payment details below.",
          {
            duration: 3000,
            autoClose: true,
          }
        );
      } else {
        showError(result.message, result.options);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      showError("An unexpected error occurred. Please try again.");
    }
  };

  // Handle logout - goes back to login and clears all data
  const handleLogout = () => {
    navigateToStep(STEPS.LOGIN);
    setUserRSVP(null);
    setFormData(getDefaultFormData()); // Reset to default form state
    setIsFormSubmitted(false);

    showSuccess(
      "Logged out successfully. You can now login with different credentials."
    );
  };

  // Block rendering of protected content if not authorized
  const shouldBlockRender =
    !isAuthorized && protectedCurrentStep !== STEPS.LOGIN;

  return (
    <div className="container">
      <Header />

      <div ref={formRef} className="trip-form">
        {shouldBlockRender ? (
          // Show loading while redirect happens
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "200px",
              color: "#666",
            }}
          >
            <div>
              <i
                className="fas fa-spinner fa-spin"
                style={{ marginRight: "8px" }}
              ></i>
              Redirecting to login...
            </div>
          </div>
        ) : (
          <Routes>
            <Route
              path="/"
              element={
                <StepRenderer
                  currentStep={STEPS.LOGIN}
                  userRSVP={userRSVP}
                  formData={formData}
                  updateFormData={updateFormData}
                  pricing={pricing}
                  onEmailSubmit={handleEmailLogin}
                  onLogout={handleLogout}
                  onRSVPContinue={handleRSVPContinue}
                  isFormSubmitted={isFormSubmitted}
                />
              }
            />

            <Route
              path="/login"
              element={
                <StepRenderer
                  currentStep={STEPS.LOGIN}
                  userRSVP={userRSVP}
                  formData={formData}
                  updateFormData={updateFormData}
                  pricing={pricing}
                  onEmailSubmit={handleEmailLogin}
                  onLogout={handleLogout}
                  onRSVPContinue={handleRSVPContinue}
                  isFormSubmitted={isFormSubmitted}
                />
              }
            />

            <Route
              path="/welcome"
              element={
                <StepRenderer
                  currentStep={STEPS.WELCOME}
                  userRSVP={userRSVP}
                  formData={formData}
                  updateFormData={updateFormData}
                  pricing={pricing}
                  onEmailSubmit={handleEmailLogin}
                  onLogout={handleLogout}
                  onRSVPContinue={handleRSVPContinue}
                  isFormSubmitted={isFormSubmitted}
                />
              }
            />

            <Route
              path="/rsvp"
              element={
                <StepRenderer
                  currentStep={STEPS.RSVP}
                  userRSVP={userRSVP}
                  formData={formData}
                  updateFormData={updateFormData}
                  pricing={pricing}
                  onEmailSubmit={handleEmailLogin}
                  onLogout={handleLogout}
                  onRSVPContinue={handleRSVPContinue}
                  isFormSubmitted={isFormSubmitted}
                />
              }
            />

            <Route
              path="/addons"
              element={
                <StepRenderer
                  currentStep={STEPS.ADDONS}
                  userRSVP={userRSVP}
                  formData={formData}
                  updateFormData={updateFormData}
                  pricing={pricing}
                  onEmailSubmit={handleEmailLogin}
                  onLogout={handleLogout}
                  onRSVPContinue={handleRSVPContinue}
                  isFormSubmitted={isFormSubmitted}
                />
              }
            />

            <Route
              path="/payment"
              element={
                <StepRenderer
                  currentStep={STEPS.PAYMENT}
                  userRSVP={userRSVP}
                  formData={formData}
                  updateFormData={updateFormData}
                  pricing={pricing}
                  onEmailSubmit={handleEmailLogin}
                  onLogout={handleLogout}
                  onRSVPContinue={handleRSVPContinue}
                  isFormSubmitted={isFormSubmitted}
                />
              }
            />

            <Route
              path="/payment-details"
              element={
                <StepRenderer
                  currentStep={STEPS.PAYMENT_DETAILS}
                  userRSVP={userRSVP}
                  formData={formData}
                  updateFormData={updateFormData}
                  pricing={pricing}
                  onEmailSubmit={handleEmailLogin}
                  onLogout={handleLogout}
                  onRSVPContinue={handleRSVPContinue}
                  isFormSubmitted={isFormSubmitted}
                />
              }
            />

            {/* Catch-all route for invalid URLs */}
            <Route
              path="*"
              element={
                <StepRenderer
                  currentStep={userRSVP ? STEPS.WELCOME : STEPS.LOGIN}
                  userRSVP={userRSVP}
                  formData={formData}
                  updateFormData={updateFormData}
                  pricing={pricing}
                  onEmailSubmit={handleEmailLogin}
                  onLogout={handleLogout}
                  onRSVPContinue={handleRSVPContinue}
                  isFormSubmitted={isFormSubmitted}
                />
              }
            />
          </Routes>
        )}

        {!shouldBlockRender && (
          <StepNavigation
            currentStep={currentStep}
            onNavigate={navigateToStep}
            onSubmit={handleSubmitForm}
            isSubmitting={isSubmitting}
            formData={formData}
            showError={showError}
          />
        )}
      </div>

      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />

      <Footer />
    </div>
  );
}

export default App;
