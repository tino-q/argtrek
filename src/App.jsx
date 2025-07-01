// Main Trip Form React App
// Refactored for RSVP confirmation + add-ons selection + payment processing

import { useState, useRef, useEffect } from "react";
import { useNotifications } from "./hooks/useNotifications";
import { useAnimations, injectAnimationStyles } from "./hooks/useAnimations";

// Import components
import Header from "./components/layout/Header";
import WelcomeSection from "./components/layout/WelcomeSection";
import EmailLogin from "./components/auth/EmailLogin";
import RSVPDisplay from "./components/display/RSVPDisplay";
import NotificationContainer from "./components/common/NotificationContainer";

function App() {
  // Application state
  const [currentStep, setCurrentStep] = useState("login"); // "login", "rsvp", "addons", "payment"
  const [userRSVP, setUserRSVP] = useState(null);

  // Form reference for validation feedback
  const formRef = useRef(null);

  // Custom hooks
  const { notifications, showSuccess, showError, removeNotification } =
    useNotifications();
  const { _pulseElement, _shakeElement } = useAnimations();

  // Initialize animations when component mounts
  useEffect(() => {
    injectAnimationStyles();
  }, []);

  // Handle email and password login submission
  const handleEmailLogin = async (email, password) => {
    try {
      // Make GET request to RSVP Apps Script
      const RSVP_SCRIPT_URL =
        "https://script.google.com/macros/s/AKfycbwDS4eNkjF_ESiThcPyJUDxsJw7H2twEUVoHjjSzX_ZfPSugbReLiLUg22R11bCgJJFSw/exec";

      const response = await fetch(
        `${RSVP_SCRIPT_URL}?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
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
        // Valid RSVP found - store data and move to RSVP display
        setUserRSVP(result.data);
        setCurrentStep("rsvp");
        showSuccess("Trip details retrieved successfully!");
      }
    } catch (error) {
      console.error("Login error:", error);
      showError(
        "Failed to retrieve trip details. Please check your internet connection and try again."
      );
    }
  };

  // Handle continuing to add-ons from RSVP display
  const handleContinueToAddons = () => {
    setCurrentStep("addons");
  };

  return (
    <div className="container">
      <Header />

      <WelcomeSection />

      <div ref={formRef} className="trip-form">
        {currentStep === "login" && (
          <EmailLogin onEmailSubmit={handleEmailLogin} />
        )}

        {/* RSVP Display Step */}
        {currentStep === "rsvp" && userRSVP && (
          <RSVPDisplay
            rsvpData={userRSVP}
            onContinue={handleContinueToAddons}
          />
        )}

        {currentStep === "addons" && (
          <div className="form-section">
            <h2>Optional Add-ons</h2>
            <p>Activity selection will appear here...</p>
          </div>
        )}

        {currentStep === "payment" && (
          <div className="form-section">
            <h2>Payment Configuration</h2>
            <p>Payment options will appear here...</p>
          </div>
        )}
      </div>

      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />

      <footer className="app-footer">
        <p>
          <span className="footer-emoji">✨</span>
          vibe coded with{" "}
          <a
            href="https://cursor.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-link"
          >
            cursor
          </a>{" "}
          by{" "}
          <a
            href="https://www.linkedin.com/in/martin-queija-5271b899"
            target="_blank"
            rel="noopener noreferrer"
            className="author-name"
          >
            tinoq
          </a>
          <span className="footer-emoji">🇦🇷</span>
        </p>
      </footer>
    </div>
  );
}

export default App;
