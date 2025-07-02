// Main Trip Form React App
// Refactored for RSVP confirmation + add-ons selection + payment processing

import { useState, useRef, useEffect } from "react";
import { useNotifications } from "./hooks/useNotifications";
import { useAnimations, injectAnimationStyles } from "./hooks/useAnimations";
import { usePricing } from "./hooks/usePricing";
import { FORM_FIELDS, CONTACTS } from "./utils/config";

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
        console.log(result.data);
        setUserRSVP(result.data);
        setCurrentStep("rsvp");
        showSuccess("Trip details retrieved successfully!");

        // Scroll to form area
        setTimeout(() => {
          formRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
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
        behavior: "smooth",
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
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // Check if user is a solo traveler (no plus one)
  const isSoloTraveler = () => {
    if (!userRSVP) return false;

    return userRSVP["Are you traveling solo or with a plus one?"] === "Solo";
  };

  // Navigation helpers with scroll
  const goBackToRSVP = () => {
    setCurrentStep("rsvp");
    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const goBackToAddons = () => {
    setCurrentStep("addons");
    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  return (
    <div className="container">
      <Header />

      {currentStep === "login" && <WelcomeSection />}

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
              <button
                type="button"
                className="submit-btn"
                // onClick={handleSubmitForm}
              >
                <i className="fas fa-check"></i> Complete Registration
              </button>
            </div>
          </div>
        )}
      </div>

      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />

      <footer className="app-footer">
        <div className="footer-help">
          <p>
            Need help? Reach out to{" "}
            <a
              href={
                CONTACTS.find((contact) => contact.name.includes("Maddie"))
                  ?.whatsapp
              }
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-link"
            >
              Maddie anytime on WhatsApp <i className="fab fa-whatsapp"></i>
            </a>
          </p>
        </div>
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
