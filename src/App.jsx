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

// Backward compatibility for legacy magic links at root
const RootRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const email = params.get("email");
    const password = params.get("password");

    if (email && password) {
      const target = `/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
      navigate(target, { replace: true });
    } else {
      navigate("/home", { replace: true });
    }
  }, [location.search, navigate]);

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
          {/* Root route: preserve legacy magic links */}
          <Route path="/" element={<RootRedirect />} />
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
