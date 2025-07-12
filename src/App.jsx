// Main Argentina Trip Management App
// Enhanced with browser navigation integration using React Router
// Supports both registration flow and participant management

import { useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useNotificationContext } from "./hooks/useNotificationContext";
import { injectAnimationStyles } from "./hooks/useAnimations";
import { usePricing } from "./hooks/usePricing";
import { useTripContext } from "./hooks/useTripContext";
import TripProvider from "./context/TripContext.jsx";
import NotificationProvider from "./context/NotificationContext.jsx";
import { APPS_SCRIPT_URL, ACTION_TYPES } from "./utils/config";

// Import components
import Header from "./components/layout/Header";
import NotificationContainer from "./components/common/NotificationContainer";
import Footer from "./components/layout/Footer";
import FormFlow from "./components/flows/FormFlow";
import Home from "./components/participant/Home";
import Payments from "./components/participant/Payments";
import EmailLogin from "./components/auth/EmailLogin";
import NewEmailStep from "./components/form/NewEmailStep";
import { STEPS } from "./utils/stepConfig";

// Define registration flow paths (after authentication)
const REGISTRATION_FLOW_PATHS = ["/welcome", "/rsvp", "/addons", "/payment"];

function AppContent() {
  // React Router hooks
  const navigate = useNavigate();
  const location = useLocation();

  // Trip context
  const {
    userRSVP,
    formData,
    isFormSubmitted,
    setUserRSVP,
    setFormData,
    setSubmissionResult,
    setIsFormSubmitted,
    clearTripData,
    resetFormData,
  } = useTripContext();

  // Custom hooks
  const {
    notifications,
    showSuccess,
    showError,
    showWarning,
    removeNotification,
  } = useNotificationContext();

  const pricing = usePricing(userRSVP, formData);

  // Initialize animations when component mounts
  useEffect(() => {
    injectAnimationStyles();
  }, []);

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  // Update document title based on current route
  useEffect(() => {
    const stepTitles = {
      [STEPS.LOGIN]: "Login - Argentina Trip",
      [STEPS.NEW_EMAIL]: "Request Account - Argentina Trip",
      [STEPS.WELCOME]: "Welcome - Argentina Trip",
      [STEPS.RSVP]: "Trip Details - Argentina Trip",
      [STEPS.ADDONS]: "Select Experiences - Argentina Trip",
      [STEPS.PAYMENT]: "Payment - Argentina Trip",
      [STEPS.PAYMENT_DETAILS]: "Payment Details - Argentina Trip",
      [STEPS.HOME]: "Home - Argentina Trip",
      [STEPS.PAYMENTS]: "Payments - Argentina Trip",
      [STEPS.PROFILE]: "Profile - Argentina Trip",
      [STEPS.ITINERARY]: "Itinerary - Argentina Trip",
    };

    const currentPath = location.pathname.slice(1) || STEPS.LOGIN;
    document.title = stepTitles[currentPath] || "Argentina Trip";
  }, [location.pathname]);

  // Generic navigation handler
  const navigateToStep = (step) => {
    navigate(`/${step}`);
  };

  // Handle successful login for new registrations
  const handleLoginSuccess = (userData) => {
    setUserRSVP(userData);
    resetFormData();
    setIsFormSubmitted(false);
    setSubmissionResult(null);
    // Navigate to welcome step to start the registration flow
    navigateToStep(STEPS.WELCOME);
  };

  // Handle existing submission found during login
  const handleExistingSubmission = (submissionData, formData) => {
    setUserRSVP(submissionData.rsvpData);
    setFormData(formData);
    setSubmissionResult(submissionData);
    setIsFormSubmitted(true);
    // Navigate to participant home
    navigateToStep(STEPS.HOME);
  };

  // Handle form submission completion
  const handleFormSubmitted = (submissionData) => {
    setSubmissionResult(submissionData);
    setIsFormSubmitted(true);
  };

  // Handle logout
  const handleLogout = () => {
    navigateToStep(STEPS.LOGIN);
    clearTripData();
    showSuccess(
      "Logged out successfully. You can now login with different credentials."
    );
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

  // Render placeholder components for future pages
  const renderPlaceholderPage = (title, description) => (
    <div className="placeholder-page">
      <h2>{title}</h2>
      <p>{description}</p>
      <button
        className="btn btn-secondary"
        onClick={() => navigateToStep(STEPS.HOME)}
      >
        <i className="fas fa-arrow-left"></i>
        Back to Home
      </button>
    </div>
  );

  return (
    <div>
      <Header />

      <div className="main-content">
        <Routes>
          {/* Root path - redirect to login */}
          <Route
            path="/"
            element={
              <EmailLogin
                onLoginSuccess={handleLoginSuccess}
                onExistingSubmission={handleExistingSubmission}
                onEmailNotFound={handleEmailNotFound}
              />
            }
          />

          {/* Authentication Routes */}
          <Route
            path="/login"
            element={
              <EmailLogin
                onLoginSuccess={handleLoginSuccess}
                onExistingSubmission={handleExistingSubmission}
                onEmailNotFound={handleEmailNotFound}
              />
            }
          />
          <Route
            path="/new-email"
            element={
              <NewEmailStep
                onNavigate={navigateToStep}
                onNewEmailRequest={handleNewEmailRequest}
              />
            }
          />

          {/* Registration Flow Routes */}
          {REGISTRATION_FLOW_PATHS.map((path) => (
            <Route
              key={path}
              path={path}
              element={
                <FormFlow
                  onLoginSuccess={handleLoginSuccess}
                  onExistingSubmission={handleExistingSubmission}
                  onFormSubmitted={handleFormSubmitted}
                />
              }
            />
          ))}

          {/* Participant Flow Routes */}
          <Route
            path="/home"
            element={
              <Home onLogout={handleLogout} onNavigate={navigateToStep} />
            }
          />
          <Route
            path="/payments"
            element={<Payments pricing={pricing} onNavigate={navigateToStep} />}
          />
          <Route
            path="/profile"
            element={renderPlaceholderPage(
              "Profile & Trip Details",
              "Coming soon - manage your profile and trip preferences here."
            )}
          />
          <Route
            path="/itinerary"
            element={renderPlaceholderPage(
              "Trip Itinerary",
              "Coming soon - view your complete Argentina itinerary here."
            )}
          />

          {/* Catch-all route */}
          <Route
            path="*"
            element={
              isFormSubmitted ? (
                <Home onLogout={handleLogout} onNavigate={navigateToStep} />
              ) : (
                <EmailLogin
                  onLoginSuccess={handleLoginSuccess}
                  onExistingSubmission={handleExistingSubmission}
                  onEmailNotFound={handleEmailNotFound}
                />
              )
            }
          />
        </Routes>
      </div>

      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />

      <Footer />
    </div>
  );
}

function App() {
  return (
    <TripProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </TripProvider>
  );
}

export default App;
