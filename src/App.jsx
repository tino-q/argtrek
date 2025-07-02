// Main Trip Form React App
// Refactored for RSVP confirmation + add-ons selection + payment processing

import { useState, useRef, useEffect } from "react";
import { useNotifications } from "./hooks/useNotifications";
import { useAnimations, injectAnimationStyles } from "./hooks/useAnimations";
import { usePricing } from "./hooks/usePricing";
import { useFormSubmission } from "./hooks/useFormSubmission";
import { FORM_FIELDS } from "./utils/config";

// Import components
import Header from "./components/layout/Header";
import WelcomeSection from "./components/layout/WelcomeSection";
import EmailLogin from "./components/auth/EmailLogin";
import RSVPDisplay from "./components/display/RSVPDisplay";
import ActivitySelection from "./components/form/ActivitySelection";
import PrivateRoomUpgrade from "./components/form/PrivateRoomUpgrade";
import PaymentOptions from "./components/form/PaymentOptions";
import PricingSummary from "./components/layout/PricingSummary";
import NotificationContainer from "./components/common/NotificationContainer";
import SafeSubmitButton from "./components/common/SafeSubmitButton";
import Navigation from "./components/common/Navigation";
import Footer from "./components/layout/Footer";

function App() {
  // Application state
  const [currentStep, setCurrentStep] = useState("login"); // "login", "welcome", "rsvp", "addons", "payment"
  const [userRSVP, setUserRSVP] = useState(null);
  const [formData, setFormData] = useState({});

  // Form reference for validation feedback
  const formRef = useRef(null);

  // Custom hooks
  const { notifications, showSuccess, showError, removeNotification } =
    useNotifications();
  const { _pulseElement, _shakeElement } = useAnimations();
  const pricing = usePricing(formData);
  const { submitForm, isSubmitting } = useFormSubmission();

  // Initialize animations when component mounts
  useEffect(() => {
    injectAnimationStyles();
  }, []);

  // Handle successful login
  const handleLoginSuccess = (userData, successMessage) => {
    setUserRSVP(userData);
    setCurrentStep("welcome");
    showSuccess(successMessage);

    // Scroll to top of page
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
    }, 100);
  };

  // Handle email and password login submission
  const handleEmailLogin = async (email, password) => {
    try {
      // Development bypass for localhost and local networks
      const hostname = window.location.hostname;
      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.startsWith("192.")
      ) {
        if (email === "dev@test.com" && password === "dev123") {
          const mockUserData = {
            "Please write your name exactly as it appears on the ID you'll be traveling with.":
              "Development User",
            "If traveling with plus one - Please write the name exactly as it appears on the ID of your plus one.":
              "",
            "Email (for all trip-related updates and communications)":
              "dev@test.com",
            "PACK PRICE": 2250,
            "PRIVATE ROOM UPGRADE": 350,
            "IVA ALOJ": 120,
            "22 NOV": false,
            "23 NOV": false,
            "24 NOV": false,
            "25 NOV": false,
            "26 NOV": false,
            "27 NOV": true,
            "28 NOV": true,
            "29 NOV": true,
            "JA3045 AEP - BRC": true,
            "JA3725 BRC MDZ": true,
            "JA3073 MDZ AEP": true,
            "Are you traveling solo or with a plus one?": "Solo",
            "VALIJA DESPACHADA": 69,
          };

          console.log("🚀 DEVELOPMENT BYPASS - Mock User Data:");
          console.log("==========================================");
          console.table(mockUserData);
          console.log("==========================================");

          handleLoginSuccess(
            mockUserData,
            "Development user logged in successfully!"
          );
          return;
        }
      }

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

  const updateArrayField = (field, item, isSelected) => {
    setFormData((prev) => {
      const currentArray = prev[field] || [];
      if (isSelected) {
        // Add item if not already present
        return {
          ...prev,
          [field]: currentArray.some((existing) => existing.id === item.id)
            ? currentArray
            : [...currentArray, item],
        };
      } else {
        // Remove item
        return {
          ...prev,
          [field]: currentArray.filter((existing) => existing.id !== item.id),
        };
      }
    });
  };

  // Navigation helpers with scroll
  const navigateToStep = (step) => {
    setCurrentStep(step);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
    }, 100);
  };

  // Centralized navigation handlers
  const handleWelcomeBack = () => {
    navigateToStep("login");
  };

  const handleWelcomeForward = () => {
    navigateToStep("rsvp");
  };

  const handleRSVPBack = () => {
    navigateToStep("welcome");
  };

  const handleRSVPForward = () => {
    // Extract base trip price and accommodation upgrade price from RSVP data
    if (userRSVP) {
      const updates = {};

      // Extract pack price
      if (userRSVP["PACK PRICE"]) {
        updates[FORM_FIELDS.TRIP_OPTION] = userRSVP["PACK PRICE"].toString();
      }

      // Extract accommodation upgrade price
      if (userRSVP["PRIVATE ROOM UPGRADE"]) {
        updates[FORM_FIELDS.ACCOMMODATION_UPGRADE_PRICE] =
          userRSVP["PRIVATE ROOM UPGRADE"];
      }

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        setFormData((prev) => ({
          ...prev,
          ...updates,
        }));
      }
    }
    navigateToStep("addons");
  };

  const handleAddonsBack = () => {
    navigateToStep("rsvp");
  };

  const handleAddonsForward = () => {
    navigateToStep("payment");
  };

  const handlePaymentBack = () => {
    navigateToStep("addons");
  };

  // Check if user is a solo traveler (no plus one)
  const isSoloTraveler = () => {
    if (!userRSVP) return false;
    return userRSVP["Are you traveling solo or with a plus one?"] === "Solo";
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

      // Add user info from RSVP data to form data
      const submissionData = {
        ...formData,
        [FORM_FIELDS.EMAIL]: userRSVP
          ? userRSVP["Email (for all trip-related updates and communications)"]
          : "",
        [FORM_FIELDS.FULL_NAME]: userRSVP
          ? userRSVP[
              "Please write your name exactly as it appears on the ID you'll be traveling with."
            ]
          : "",
      };

      console.log("🚀 SUBMITTING FORM DATA:");
      console.log("========================");
      console.table(submissionData);
      console.log("Raw form data:", JSON.stringify(submissionData, null, 2));
      console.log("========================");

      const result = await submitForm(submissionData);

      if (result.success) {
        showSuccess(result.message, result.options);
        // Could redirect or show success state here
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
    setCurrentStep("login");
    setUserRSVP(null);
    setFormData({});
    showSuccess(
      "Logged out successfully. You can now login with different credentials."
    );

    // Scroll to top of page
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
    }, 100);
  };

  return (
    <div className="container">
      <Header />

      {/* Show WelcomeSection only in the dedicated welcome step */}
      {currentStep === "welcome" && <WelcomeSection onLogout={handleLogout} />}

      <div ref={formRef} className="trip-form">
        {/* Login Step */}
        {currentStep === "login" && (
          <EmailLogin onEmailSubmit={handleEmailLogin} />
        )}

        {/* Welcome Step - Dedicated step for welcome information */}
        {currentStep === "welcome" && (
          <div className="welcome-step">
            <div className="welcome-actions">
              <Navigation
                onBack={handleWelcomeBack}
                onForward={handleWelcomeForward}
                backText="Back to Login"
                forwardText="Continue to Trip Details"
                forwardIcon="fas fa-arrow-right"
                className="welcome-navigation"
              />
            </div>
          </div>
        )}

        {/* RSVP Display Step */}
        {currentStep === "rsvp" && userRSVP && (
          <>
            <RSVPDisplay
              rsvpData={userRSVP}
              onContinue={handleRSVPForward}
              onLogout={handleLogout}
              formData={formData}
              updateArrayField={updateArrayField}
              hideNavigation={true} // Hide the built-in navigation
            />
            <Navigation
              onBack={handleRSVPBack}
              onForward={handleRSVPForward}
              backText="Back to Welcome"
              forwardText="Continue to Add-ons"
            />
          </>
        )}

        {currentStep === "addons" && (
          <div className="addons-section">
            <ActivitySelection
              formData={formData}
              updateArrayField={updateArrayField}
            />

            {isSoloTraveler() && (
              <PrivateRoomUpgrade
                formData={formData}
                updateFormData={updateFormData}
                rsvpData={userRSVP}
              />
            )}

            <Navigation
              onBack={handleAddonsBack}
              onForward={handleAddonsForward}
              backText="Back to Trip Details"
              forwardText="Continue to Payment"
            />
          </div>
        )}

        {currentStep === "payment" && (
          <div className="payment-section">
            <PaymentOptions
              formData={formData}
              updateFormData={updateFormData}
              rsvpData={userRSVP}
            />

            <PricingSummary
              pricing={pricing}
              formData={formData}
              rsvpData={userRSVP}
            />

            <Navigation
              onBack={handlePaymentBack}
              onForward={null}
              backText="Back to Add-ons"
              showForward={false}
              forwardComponent={
                <SafeSubmitButton
                  onSubmit={handleSubmitForm}
                  isLoading={isSubmitting}
                  disabled={
                    !formData[FORM_FIELDS.PAYMENT_SCHEDULE] ||
                    !formData[FORM_FIELDS.PAYMENT_METHOD]
                  }
                  confirmText="You can only submit once, sure?"
                  confirmDuration={3000}
                >
                  <i className="fas fa-check"></i> Complete Registration
                </SafeSubmitButton>
              }
            />
          </div>
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
