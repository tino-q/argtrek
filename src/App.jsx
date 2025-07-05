// Main Trip Form React App
// Enhanced with browser navigation integration using React Router

import { useState, useRef, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useNotifications } from "./hooks/useNotifications";
import { injectAnimationStyles } from "./hooks/useAnimations";
import { usePricing } from "./hooks/usePricing";
import { useFormSubmission } from "./hooks/useFormSubmission";
import { useRouteProtection } from "./hooks/useRouteProtection";
import { FORM_FIELDS, APPS_SCRIPT_URL, ACTION_TYPES } from "./utils/config";
import { getEmail } from "./utils/rsvpData";

// Import components
import Header from "./components/layout/Header";
import StepRenderer from "./components/common/StepRenderer";
import StepNavigation from "./components/common/StepNavigation";
import NotificationContainer from "./components/common/NotificationContainer";
import Footer from "./components/layout/Footer";
import { STEPS } from "./utils/stepConfig";

// Wrapper component to handle step rendering with common props
function StepWrapper({ step, commonProps }) {
  return <StepRenderer currentStep={step} {...commonProps} />;
}

function App() {
  // Get default form data state
  const getDefaultFormData = () => {
    return {
      [FORM_FIELDS.PAYMENT_SCHEDULE]: "full",
      [FORM_FIELDS.PAYMENT_METHOD]: "credit",
      [FORM_FIELDS.DIETARY_RESTRICTIONS]: "none",
      [FORM_FIELDS.PRIVATE_ROOM_UPGRADE]: false, // Default to shared room
      [FORM_FIELDS.RAFTING]: false,
      [FORM_FIELDS.HORSEBACK]: false,
      [FORM_FIELDS.COOKING]: false,
      [FORM_FIELDS.TANGO]: false,
      [FORM_FIELDS.CHECKED_LUGGAGE]: false,
      [FORM_FIELDS.CRYPTO_CURRENCY]: "USDT",
      [FORM_FIELDS.CRYPTO_NETWORK]: "ETH",
      [FORM_FIELDS.ROOMMATE_PREFERENCE]: "",
      [FORM_FIELDS.ROOMMATE_NAME]: "",
      [FORM_FIELDS.DIETARY_MESSAGE]: "",
      [FORM_FIELDS.EMAIL]: "",
      [FORM_FIELDS.FIRST_NAME]: "",
      [FORM_FIELDS.LAST_NAME]: "",
      [FORM_FIELDS.PHONE_NUMBER]: "",

      // Travel document confirmation
      travelDocumentConfirmed: false,
    };
  };

  // Application state - Simple initialization without localStorage
  const [userRSVP, setUserRSVP] = useState(null);
  const [formData, setFormData] = useState(getDefaultFormData());
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // React Router hooks
  const navigate = useNavigate();
  const location = useLocation();

  // Custom hooks
  const {
    notifications,
    showSuccess,
    showError,
    showWarning,
    removeNotification,
  } = useNotifications();
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
      [STEPS.NEW_EMAIL]: "Request Account - Argentina Trek",
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
  const handleLoginSuccess = (userData) => {
    setUserRSVP(userData);

    // Clean up URL parameters from magic link
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("email") && urlParams.get("password")) {
      // Remove email and password parameters from URL
      urlParams.delete("email");
      urlParams.delete("password");
      const newUrl =
        window.location.pathname +
        (urlParams.toString() ? "?" + urlParams.toString() : "");
      window.history.replaceState({}, "", newUrl);
    }

    navigateToStep(STEPS.WELCOME);
  };

  // Handle email not found - navigate to new email step
  const handleEmailNotFound = (email) => {
    navigateToStep(`${STEPS.NEW_EMAIL}?email=${encodeURIComponent(email)}`);
  };

  // Handle new email request submission
  const handleNewEmailRequest = async (email, name) => {
    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          action: ACTION_TYPES.NEW_EMAIL,
          email: email,
          name: name,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showSuccess(
          "Account creation request submitted successfully! We'll process your request ASAP and notify you by email when ready.",
          {
            duration: 6000,
            autoClose: true,
          }
        );
      } else {
        if (result.error.includes("already requested")) {
          showWarning(
            "Account creation has already been requested for this email. Please wait for processing."
          );
        } else if (result.error.includes("already exists")) {
          showWarning(
            "This email is already registered. Please try logging in instead."
          );
        } else {
          showError(
            result.error || "Failed to submit account creation request"
          );
        }
      }
    } catch (error) {
      console.error("Error submitting new email request:", error);
      showError(
        "Failed to submit account creation request. Please try again or contact Maddie on WhatsApp."
      );
    }
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
          // Let the EmailLogin component handle the "email not found" error
          // by throwing an error that it can catch
          throw new Error("Email not found in our RSVP database");
        } else {
          showError(result.error);
        }
      } else {
        // Valid RSVP found - check if there's an existing submission
        console.log("✅ USER LOGIN SUCCESS - Complete Response Payload:");
        console.log("===============================================");
        console.table(result.data);
        console.log("Raw JSON Data:", JSON.stringify(result.data, null, 2));
        console.log("===============================================");

        if (result.data.hasExistingSubmission) {
          // User has already submitted - load their existing data and show payment details
          console.log("🔄 EXISTING SUBMISSION FOUND - Loading previous data");

          // Set all the data from the existing submission
          setUserRSVP(result.data.rsvpData);
          setFormData(result.data.formData);
          setSubmissionResult(result.data.submissionResult);
          setIsFormSubmitted(true);

          // Clean up URL parameters from magic link
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get("email") && urlParams.get("password")) {
            // Remove email and password parameters from URL
            urlParams.delete("email");
            urlParams.delete("password");
            const newUrl =
              window.location.pathname +
              (urlParams.toString() ? "?" + urlParams.toString() : "");
            window.history.replaceState({}, "", newUrl);
          }

          // Navigate directly to payment details
          navigateToStep(STEPS.PAYMENT_DETAILS);
          showSuccess(
            "Welcome back! Your previous registration has been loaded.",
            {
              duration: 4000,
              autoClose: true,
            }
          );
        } else {
          // No existing submission - proceed with normal flow
          handleLoginSuccess(result.data.rsvpData);
        }
      }
    } catch (error) {
      console.error("Login error:", error);

      // Re-throw "Email not found" errors so EmailLogin component can handle them
      if (error.message && error.message.includes("Email not found")) {
        throw error;
      }

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
    // Validate required fields before continuing
    const errors = {};

    if (!formData[FORM_FIELDS.FIRST_NAME]?.trim()) {
      errors[FORM_FIELDS.FIRST_NAME] = true;
    }

    if (!formData[FORM_FIELDS.LAST_NAME]?.trim()) {
      errors[FORM_FIELDS.LAST_NAME] = true;
    }

    if (!formData[FORM_FIELDS.PHONE_NUMBER]?.trim()) {
      errors[FORM_FIELDS.PHONE_NUMBER] = true;
    }

    // Check if travel document confirmation is checked
    const hasFieldErrors = Object.keys(errors).length > 0;
    const hasConfirmationError = !formData.travelDocumentConfirmed;

    // If there are validation errors, show error message and scroll to first error
    if (hasFieldErrors || hasConfirmationError) {
      // Determine which field to scroll to based on priority order
      let scrollTarget = null;
      let errorMessage = "";

      // Check in priority order: First Name → Last Name → Phone Number → Checkbox
      if (errors[FORM_FIELDS.FIRST_NAME]) {
        scrollTarget = document.getElementById("first-name-input");
        errorMessage = "Please enter your first name.";
      } else if (errors[FORM_FIELDS.LAST_NAME]) {
        scrollTarget = document.getElementById("last-name-input");
        errorMessage = "Please enter your last name.";
      } else if (errors[FORM_FIELDS.PHONE_NUMBER]) {
        scrollTarget = document.getElementById("phone-number-input");
        errorMessage = "Please enter your phone number.";
      } else if (hasConfirmationError) {
        scrollTarget = document.getElementById("travel-document-confirmation");
        errorMessage =
          "Please confirm that your travel document information is correct.";
      }

      // Show appropriate error message
      if (hasFieldErrors) {
        showError(
          errorMessage ||
            "Please fill in all required fields: First Name, Last Name, and Phone Number."
        );
      } else if (hasConfirmationError) {
        showError(errorMessage);
      }

      // Scroll to the first error field
      if (scrollTarget) {
        scrollTarget.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        // Add highlight effect for checkbox, focus for input fields
        if (scrollTarget.id === "travel-document-confirmation") {
          scrollTarget.classList.add("highlight-error");
          setTimeout(() => {
            scrollTarget.classList.remove("highlight-error");
          }, 2000);
        } else {
          // Focus the input field
          setTimeout(() => {
            scrollTarget.focus();
          }, 300);
        }
      }

      return; // Stop navigation
    }

    // All validation passed, proceed to next step
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
      };

      console.log("🚀 SUBMITTING FORM DATA:");
      console.log("========================");
      console.table(submissionData);
      console.log("Raw form data:", JSON.stringify(submissionData, null, 2));
      console.log("========================");

      const result = await submitForm(submissionData, userRSVP, pricing);

      if (result.success) {
        // Store the submission result (including rowNumber)
        setSubmissionResult(result.data);

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
    setSubmissionResult(null);

    showSuccess(
      "Logged out successfully. You can now login with different credentials."
    );
  };

  // Extract common props to eliminate repetition
  const commonStepProps = {
    userRSVP,
    formData,
    updateFormData,
    pricing,
    onEmailSubmit: handleEmailLogin,
    onLogout: handleLogout,
    onRSVPContinue: handleRSVPContinue,
    isFormSubmitted,
    submissionResult,
    onNewEmailRequest: handleNewEmailRequest,
    onEmailNotFound: handleEmailNotFound,
    onNavigate: navigateToStep,
    showSuccess,
    showError,
    showWarning,
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
                <StepWrapper step={STEPS.LOGIN} commonProps={commonStepProps} />
              }
            />
            <Route
              path="/login"
              element={
                <StepWrapper step={STEPS.LOGIN} commonProps={commonStepProps} />
              }
            />
            <Route
              path="/new-email"
              element={
                <StepWrapper
                  step={STEPS.NEW_EMAIL}
                  commonProps={commonStepProps}
                />
              }
            />
            <Route
              path="/welcome"
              element={
                <StepWrapper
                  step={STEPS.WELCOME}
                  commonProps={commonStepProps}
                />
              }
            />
            <Route
              path="/rsvp"
              element={
                <StepWrapper step={STEPS.RSVP} commonProps={commonStepProps} />
              }
            />
            <Route
              path="/addons"
              element={
                <StepWrapper
                  step={STEPS.ADDONS}
                  commonProps={commonStepProps}
                />
              }
            />
            <Route
              path="/payment"
              element={
                <StepWrapper
                  step={STEPS.PAYMENT}
                  commonProps={commonStepProps}
                />
              }
            />
            <Route
              path="/payment-details"
              element={
                <StepWrapper
                  step={STEPS.PAYMENT_DETAILS}
                  commonProps={commonStepProps}
                />
              }
            />
            {/* Catch-all route for invalid URLs */}
            <Route
              path="*"
              element={
                <StepWrapper
                  step={userRSVP ? STEPS.WELCOME : STEPS.LOGIN}
                  commonProps={commonStepProps}
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
            onNewEmailRequest={handleNewEmailRequest}
            onRSVPContinue={handleRSVPContinue}
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
