// Main Argentina Trip Management App
// Enhanced with browser navigation integration using React Router
// Supports both registration flow and participant management

import { useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";

import EmailLogin from "./components/auth/EmailLogin";
import NotificationContainer from "./components/common/NotificationContainer";
import TermsAndConditions from "./components/display/TermsAndConditions";
import FormFlow from "./components/flows/FormFlow";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import Home from "./components/participant/Home";
import Payments from "./components/participant/Payments";
import Profile from "./components/participant/Profile";
import Timeline from "./components/participant/Timeline";
import NotificationProvider from "./context/NotificationContext.jsx";
import TripProvider from "./context/TripContext.jsx";
import { injectAnimationStyles } from "./hooks/useAnimations";
import { useNotificationContext } from "./hooks/useNotificationContext";
import { useTripContext } from "./hooks/useTripContext";

// Define registration flow paths (after authentication)
const REGISTRATION_FLOW_PATHS = ["/welcome", "/rsvp", "/addons", "/payment"];

const Redirect = ({ path }) => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(path);
  }, [navigate, path]);

  return <div> Redirecting... </div>;
};

const RegisteredTravelerRoute = ({ children }) => {
  const { submissionResult } = useTripContext();

  if (!submissionResult) {
    return <Redirect path="/login" />;
  }

  return children;
};

const RsvpTravelerRoute = ({ children }) => {
  const { userRSVP, submissionResult } = useTripContext();

  if (submissionResult) {
    return <Redirect path="/payments" />;
  }

  if (!userRSVP) {
    return <Redirect path="/login" />;
  }

  return children;
};

function AppContent() {
  const location = useLocation();
  const { notifications, removeNotification } = useNotificationContext();

  useEffect(() => {
    injectAnimationStyles();
  }, []);

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  return (
    <div>
      <Header />

      <div className="main-content">
        <Routes>
          {/* Registration flow routes */}
          {REGISTRATION_FLOW_PATHS.map((path) => (
            <Route
              key={path}
              path={path}
              element={
                <RsvpTravelerRoute>
                  <FormFlow />
                </RsvpTravelerRoute>
              }
            />
          ))}

          {/* Registered traveler routes */}
          <Route
            path="/home"
            element={
              <RegisteredTravelerRoute>
                <Home />
              </RegisteredTravelerRoute>
            }
          />

          <Route
            path="/payments"
            element={
              <RegisteredTravelerRoute>
                <Payments />
              </RegisteredTravelerRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <RegisteredTravelerRoute>
                <Profile />
              </RegisteredTravelerRoute>
            }
          />

          <Route
            path="/itinerary"
            element={
              <RegisteredTravelerRoute>
                <Timeline />
              </RegisteredTravelerRoute>
            }
          />

          {/* Public Routes */}
          <Route path="/login" element={<EmailLogin />} />
          <Route path="/terms" element={<TermsAndConditions />} />

          {/* Catch all route, redirect to home, home will redirect to login if user is not logged in */}
          <Route path="*" element={<Redirect path="/home" />} />
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
    <NotificationProvider>
      <TripProvider>
        <AppContent />
      </TripProvider>
    </NotificationProvider>
  );
}

export default App;

// Generic navigation handler

// Handle successful login for new registrations
// const handleLoginSuccess = (userData) => {
//   setUserRSVP(userData);
//   resetFormData();
//   setSubmissionResult(null);
//   // Navigate to welcome step to start the registration flow
//   navigateToStep(STEPS.WELCOME);
// };

// const handleExistingSubmission = (submissionData, formData) => {
//   setUserRSVP(submissionData.rsvpData);
//   setFormData(formData);
//   setSubmissionResult(submissionData);
//   setIsFormSubmitted(true);
//   // Navigate to participant home
//   navigateToStep(STEPS.HOME);
// };

// const handleFormSubmitted = (submissionData) => {
//   setSubmissionResult(submissionData);
//   setIsFormSubmitted(true);
// };

// Handle form submission completion
// const handleFormSubmitted = (submissionData) => {
//   setSubmissionResult(submissionData);
// };

// Handle logout

// Handle email not found - navigate to new email step
// const handleEmailNotFound = (email) => {
//   navigateToStep(`${STEPS.NEW_EMAIL}?email=${encodeURIComponent(email)}`);
// };

// Handle new email request submission
// const handleNewEmailRequest = async (email, name) => {
//   try {
//     const response = await fetch(APPS_SCRIPT_URL, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//       body: new URLSearchParams({
//         action: ACTION_TYPES.NEW_EMAIL,
//         email: email,
//         name: name,
//       }),
//     });

//     const result = await response.json();

//     if (result.success) {
//       showSuccess(
//         "Account creation request submitted successfully! We'll process your request ASAP and notify you by email when ready.",
//         {
//           duration: 6000,
//           autoClose: true,
//         }
//       );
//     } else {
//       if (result.error.includes("already requested")) {
//         showWarning(
//           "Account creation has already been requested for this email. Please wait for processing."
//         );
//       } else if (result.error.includes("already exists")) {
//         showWarning(
//           "This email is already registered. Please try logging in instead."
//         );
//       } else {
//         showError(
//           result.error || "Failed to submit account creation request"
//         );
//       }
//     }
//   } catch (error) {
//     console.error("Error submitting new email request:", error);
//     showError(
//       "Failed to submit account creation request. Please try again or contact Maddie on WhatsApp."
//     );
//   }
// };
