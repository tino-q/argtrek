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
import Footer from "./components/layout/Footer";

function App() {
  // Application state
  const [currentStep, setCurrentStep] = useState("login"); // "login", "rsvp", "addons", "payment"
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
            "IVA ALOJ": 0,
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

          setUserRSVP(mockUserData);
          setCurrentStep("rsvp");
          showSuccess("Development user logged in successfully!");

          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: "instant" });
          }, 100);
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
        // Valid RSVP found - store data and move to RSVP display
        console.log("✅ USER LOGIN SUCCESS - Complete RSVP Payload:");
        console.log("===============================================");
        console.table(result.data);
        console.log("Raw JSON Data:", JSON.stringify(result.data, null, 2));
        console.log("===============================================");

        setUserRSVP(result.data);
        setCurrentStep("rsvp");
        showSuccess("Trip details retrieved successfully!");

        // Scroll to top of page
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "instant" });
        }, 100);
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

  // Handle continuing to add-ons from RSVP display
  const handleContinueToAddons = () => {
    // Extract base trip price and accommodation upgrade price from RSVP data
    if (userRSVP) {
      const updates = {};

      // Extract trip price
      const priceField = Object.keys(userRSVP).find(
        (key) =>
          key.toLowerCase().includes("pack price") ||
          key.toLowerCase().includes("total price") ||
          key.toLowerCase().includes("package price") ||
          key.toLowerCase().includes("trip option price") ||
          key.toLowerCase().includes("price")
      );

      if (priceField && userRSVP[priceField]) {
        const price = parseFloat(userRSVP[priceField]);
        if (!isNaN(price)) {
          updates.tripOption = price;
        }
      }

      // Extract accommodation upgrade price
      const accommodationPriceField = Object.keys(userRSVP).find(
        (key) => key.toUpperCase() === "PRIVATE ROOM UPGRADE"
      );

      if (accommodationPriceField && userRSVP[accommodationPriceField]) {
        const accommodationPrice = parseFloat(
          userRSVP[accommodationPriceField]
        );
        if (!isNaN(accommodationPrice)) {
          updates[FORM_FIELDS.ACCOMMODATION_UPGRADE_PRICE] = accommodationPrice;
        }
      }

      // Update form data with extracted values
      if (Object.keys(updates).length > 0) {
        setFormData((prev) => ({
          ...prev,
          ...updates,
        }));
      }
    }
    setCurrentStep("addons");

    // Scroll to form area
    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "instant",
        block: "start",
      });
    }, 100);
  };

  // Handle continuing to payment from add-ons
  const handleContinueToPayment = () => {
    setCurrentStep("payment");

    // Scroll to form area
    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "instant",
        block: "start",
      });
    }, 100);
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

  // Handle logout
  const handleLogout = () => {
    setCurrentStep("login");
    setUserRSVP(null);
    setFormData({});
    showSuccess(
      "Logged out successfully. You can now login with different credentials."
    );
  };

  // Navigation helpers with scroll
  const goBackToRSVP = () => {
    setCurrentStep("rsvp");
    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "instant",
        block: "start",
      });
    }, 100);
  };

  const goBackToAddons = () => {
    setCurrentStep("addons");
    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "instant",
        block: "start",
      });
    }, 100);
  };

  return (
    <div className="container">
      <Header />

      {/* Show WelcomeSection only after successful login */}
      {currentStep !== "login" && <WelcomeSection />}

      <div ref={formRef} className="trip-form">
        {/* Login Step - Only show EmailLogin component */}
        {currentStep === "login" && (
          <EmailLogin onEmailSubmit={handleEmailLogin} />
        )}

        {/* RSVP Display Step */}
        {currentStep === "rsvp" && userRSVP && (
          <RSVPDisplay
            rsvpData={userRSVP}
            onContinue={handleContinueToAddons}
            onLogout={handleLogout}
            formData={formData}
            updateArrayField={updateArrayField}
          />
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

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={goBackToRSVP}
              >
                <i className="fas fa-arrow-left"></i> Back to RSVP
              </button>
              <button
                type="button"
                className="submit-btn"
                onClick={handleContinueToPayment}
              >
                <i className="fas fa-arrow-right"></i> Continue to Payment
              </button>
            </div>
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

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={goBackToAddons}
              >
                <i className="fas fa-arrow-left"></i> Back to Add-ons
              </button>
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
            </div>
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
