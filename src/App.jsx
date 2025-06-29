// Main Trip Form React App
// Migrated from original index.html and JavaScript modules

import { useState, useRef, useEffect } from "react";
import { usePricing } from "./hooks/usePricing";
import { useNotifications } from "./hooks/useNotifications";
import { useAnimations, injectAnimationStyles } from "./hooks/useAnimations";
import { useFormSubmission } from "./hooks/useFormSubmission";
import { FORM_FIELDS } from "./utils/config";

// Styles are now imported in main.jsx via main.css

// Import components (we'll create these next)
import Header from "./components/layout/Header";
import WelcomeSection from "./components/layout/WelcomeSection";
import PersonalInfo from "./components/form/PersonalInfo";
import TripConfiguration from "./components/form/TripConfiguration";
import AccommodationSelector from "./components/form/AccommodationSelector";
import ActivitySelection from "./components/form/ActivitySelection";
import PaymentOptions from "./components/form/PaymentOptions";
import PricingSummary from "./components/layout/PricingSummary";
import NotificationContainer from "./components/common/NotificationContainer";

function App() {
  // Form state
  const [formData, setFormData] = useState({
    [FORM_FIELDS.EMAIL]: "",
    [FORM_FIELDS.FULL_NAME]: "",
    [FORM_FIELDS.TRIP_OPTION]: "",
    [FORM_FIELDS.ACCOMMODATION]: "0", // Default to shared room
    [FORM_FIELDS.ROOMMATE]: "",
    [FORM_FIELDS.ACTIVITIES]: [],
    [FORM_FIELDS.PAYMENT_SCHEDULE]: "full",
    [FORM_FIELDS.PAYMENT_METHOD]: "credit",
    [FORM_FIELDS.ARGENTINE_CITIZEN]: false,
  });

  // Form reference for validation feedback
  const formRef = useRef(null);

  // Custom hooks
  const pricing = usePricing(formData);
  const { notifications, showSuccess, showError, removeNotification } =
    useNotifications();
  const { pulseElement, shakeElement } = useAnimations();
  const { submitForm, isSubmitting } = useFormSubmission();

  // Initialize animations when component mounts
  useEffect(() => {
    injectAnimationStyles();
  }, []);

  // Update form data
  const updateFormData = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Update array field (for activities)
  const updateArrayField = (field, item, isSelected) => {
    setFormData((prev) => ({
      ...prev,
      [field]: isSelected
        ? [...prev[field], item]
        : prev[field].filter((existing) => existing !== item),
    }));
  };

  // Enhanced form validation with animations
  const validateForm = () => {
    const errors = [];

    // Check email
    if (!formData[FORM_FIELDS.EMAIL]) {
      errors.push("Email is required");
      const emailInput = document.getElementById("email");
      if (emailInput) {
        shakeElement(emailInput);
        emailInput.focus();
      }
    }

    // Check full name
    if (!formData[FORM_FIELDS.FULL_NAME]) {
      errors.push("Full name is required");
      const nameInput = document.getElementById("fullName");
      if (nameInput && errors.length === 1) {
        shakeElement(nameInput);
        nameInput.focus();
      }
    }

    // Check trip option
    if (!formData[FORM_FIELDS.TRIP_OPTION]) {
      errors.push("Please select a trip option");
      const tripSection = document.querySelector(
        '[data-section="trip-config"]'
      );
      if (tripSection && errors.length === 1) {
        shakeElement(tripSection);
        tripSection.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    // Check roommate for shared accommodation
    if (
      formData[FORM_FIELDS.ACCOMMODATION] === "0" &&
      !formData[FORM_FIELDS.ROOMMATE]
    ) {
      errors.push("Please specify your roommate for shared accommodation");
      const roommateInput = document.getElementById("roommate");
      if (roommateInput && errors.length === 1) {
        shakeElement(roommateInput);
        roommateInput.focus();
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateForm();

    if (!validation.isValid) {
      showError(validation.errors[0]);
      return;
    }

    // Submit form using the hook
    const result = await submitForm(formData);

    if (result.success) {
      showSuccess(result.message, result.options);

      // Add success animation to form
      if (formRef.current) {
        pulseElement(formRef.current);
      }
    } else {
      showError(result.message, result.options);
    }
  };

  return (
    <div className="container">
      <Header />

      <WelcomeSection />

      <form ref={formRef} className="trip-form" onSubmit={handleSubmit}>
        <PersonalInfo formData={formData} updateFormData={updateFormData} />

        <TripConfiguration
          formData={formData}
          updateFormData={updateFormData}
        />

        <AccommodationSelector
          formData={formData}
          updateFormData={updateFormData}
        />

        <ActivitySelection
          formData={formData}
          updateArrayField={updateArrayField}
        />

        <PaymentOptions formData={formData} updateFormData={updateFormData} />

        <PricingSummary pricing={pricing} formData={formData} />

        <div className="form-actions">
          <button
            type="submit"
            className={`submit-btn ${isSubmitting ? "form-success" : ""}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Processing...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i> Save Configuration
              </>
            )}
          </button>
        </div>
      </form>

      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
}

export default App;
