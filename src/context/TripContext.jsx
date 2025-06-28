import { useState, useEffect } from "react";

import { useNotificationContext } from "../hooks/useNotificationContext";
import { clearCachedData } from "../utils/cache";
import { FORM_FIELDS } from "../utils/config";

import { TripContext } from "./tripContext";

const TripProvider = ({ children }) => {
  const { showSuccess } = useNotificationContext();

  const getFromStorage = (key, defaultValue) => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.warn(`Error reading from localStorage for key ${key}:`, error);
      return defaultValue;
    }
  };

  const setToStorage = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error writing to localStorage for key ${key}:`, error);
    }
  };

  // Get default form data state
  const getDefaultFormData = () => {
    return {
      [FORM_FIELDS.PAYMENT_SCHEDULE]: "full",
      [FORM_FIELDS.PAYMENT_METHOD]: "bank",
      [FORM_FIELDS.DIETARY_RESTRICTIONS]: "none",
      [FORM_FIELDS.PRIVATE_ROOM_UPGRADE]: false,
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
      travelDocumentConfirmed: false,
    };
  };

  // Application state
  const [userRSVP, setUserRSVP] = useState(() =>
    getFromStorage("userRSVP", null)
  );
  const [formData, setFormData] = useState(() =>
    getFromStorage("formData", getDefaultFormData())
  );

  const [submissionResult, setSubmissionResult] = useState(() =>
    getFromStorage("submissionResult", null)
  );

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (userRSVP) {
      setToStorage("userRSVP", userRSVP);
    }
  }, [userRSVP]);

  useEffect(() => {
    setToStorage("formData", formData);
  }, [formData]);

  useEffect(() => {
    if (submissionResult) {
      setToStorage("submissionResult", submissionResult);
    }
  }, [submissionResult]);

  // Form data management
  const updateFormData = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Clear all trip data
  const clearTripData = () => {
    setUserRSVP(null);
    setFormData(getDefaultFormData());
    setSubmissionResult(null);

    // Clear localStorage
    localStorage.removeItem("userRSVP");
    localStorage.removeItem("formData");
    localStorage.removeItem("submissionResult");
  };

  const handleLogout = () => {
    setSubmissionResult(null);
    setFormData(getDefaultFormData());
    setUserRSVP(null);
    // Clear all cached data
    clearCachedData([
      "userRSVP",
      "formData",
      "submissionResult",
      "timelineData",
      "raftingCount",
      "voucher",
    ]);
    showSuccess(
      "Logged out successfully. You can now login with different credentials."
    );
  };

  const value = {
    handleLogout,

    // State
    userRSVP,
    formData,
    submissionResult,

    // Setters
    setUserRSVP,
    setFormData,
    setSubmissionResult,

    // Helper functions
    updateFormData,
    clearTripData,
    getDefaultFormData,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
};

export default TripProvider;
