// Main Trip Form React App
// Refactored for RSVP confirmation + add-ons selection + payment processing

import { useState, useRef, useEffect } from "react";
import { useNotifications } from "./hooks/useNotifications";
import { injectAnimationStyles } from "./hooks/useAnimations";
import { usePricing } from "./hooks/usePricing";
import { useFormSubmission } from "./hooks/useFormSubmission";
import { FORM_FIELDS } from "./utils/config";
import { getEmail, getTravelerName } from "./utils/rsvpData";

// Import components
import Header from "./components/layout/Header";
import StepRenderer from "./components/common/StepRenderer";
import StepNavigation from "./components/common/StepNavigation";
import NotificationContainer from "./components/common/NotificationContainer";
import Footer from "./components/layout/Footer";
import { STEPS } from "./utils/stepConfig";

function App() {
  // Application state
  const [currentStep, setCurrentStep] = useState(STEPS.LOGIN);
  const [userRSVP, setUserRSVP] = useState(null);
  const [formData, setFormData] = useState({});

  // Form reference for validation feedback
  const formRef = useRef(null);

  // Custom hooks
  const { notifications, showSuccess, showError, removeNotification } =
    useNotifications();
  const pricing = usePricing(userRSVP, formData);
  const { submitForm, isSubmitting } = useFormSubmission();

  // Initialize animations when component mounts
  useEffect(() => {
    injectAnimationStyles();
  }, []);

  // Generic navigation handler
  const navigateToStep = (step) => {
    setCurrentStep(step);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
    }, 100);
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
            "22 NOV": true,
            "23 NOV": true,
            "24 NOV": true,
            "25 NOV": true,
            "26 NOV": true,
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

      // Add user info from RSVP data to form data using centralized utility
      const submissionData = {
        ...formData,
        [FORM_FIELDS.EMAIL]: getEmail(userRSVP),
        [FORM_FIELDS.FULL_NAME]: getTravelerName(userRSVP),
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
    navigateToStep(STEPS.LOGIN);
    setUserRSVP(null);
    setFormData({});
    showSuccess(
      "Logged out successfully. You can now login with different credentials."
    );
  };

  return (
    <div className="container">
      <Header />

      <div ref={formRef} className="trip-form">
        <StepRenderer
          currentStep={currentStep}
          userRSVP={userRSVP}
          formData={formData}
          updateFormData={updateFormData}
          pricing={pricing}
          onEmailSubmit={handleEmailLogin}
          onLogout={handleLogout}
          onRSVPContinue={handleRSVPContinue}
        />

        <StepNavigation
          currentStep={currentStep}
          onNavigate={navigateToStep}
          onSubmit={handleSubmitForm}
          isSubmitting={isSubmitting}
          formData={formData}
          showError={showError}
        />
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
