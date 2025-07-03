import { useState } from "react";
import { FORM_FIELDS } from "../utils/config";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxzlJgU4nNS9iVN6qfRlHD3e-qELz1lo_mU2EPupnoOpU0faBx92I38vYYkF_bos6Sm/exec";

/**
 * Custom hook for handling form submission to Google Apps Script
 */
export const useFormSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Transform form data to match Google Apps Script expected format
   */
  const transformFormData = (formData) => {
    return {
      email: formData[FORM_FIELDS.EMAIL],
      fullName: formData[FORM_FIELDS.FULL_NAME],
      basePrice: formData[FORM_FIELDS.BASE_PRICE] || 0,
      roommate: formData[FORM_FIELDS.ROOMMATE] || "",
      // Individual activity selections (now directly available as booleans)
      horsebackRiding: Boolean(formData[FORM_FIELDS.HORSEBACK]),
      cookingClass: Boolean(formData[FORM_FIELDS.COOKING]),
      rafting: Boolean(formData[FORM_FIELDS.RAFTING]),
      paymentSchedule: formData[FORM_FIELDS.PAYMENT_SCHEDULE],
      paymentMethod: formData[FORM_FIELDS.PAYMENT_METHOD],
      argentineCitizen: formData[FORM_FIELDS.ARGENTINE_CITIZEN],
    };
  };

  /**
   * Submit form data to Google Apps Script using FormData
   */
  const submitForm = async (formData) => {
    setIsSubmitting(true);

    try {
      // Transform data to expected format
      const submissionData = transformFormData(formData);

      // Create FormData object
      const formDataPayload = new FormData();

      // Append each field to FormData
      Object.keys(submissionData).forEach((key) => {
        formDataPayload.append(key, submissionData[key]);
      });

      // Submit to Google Apps Script using FormData
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: formDataPayload, // No Content-Type header needed for FormData
      });

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log("Form submitted successfully:", result);
        return {
          success: true,
          data: result,
          message:
            "🎉 Your trip registration has been confirmed! We'll contact you soon with payment details.",
          options: {
            duration: 6000,
            autoClose: true,
          },
        };
      } else {
        throw new Error(result.error || "Submission failed");
      }
    } catch (error) {
      console.error("Submission error:", error);

      // Handle specific error types with better messaging
      let errorMessage = "Failed to save configuration. Please try again.";
      let errorOptions = {};

      if (error.message && error.message.includes("already been registered")) {
        errorMessage =
          "⚠️ This email has already been registered for the trip. Each email can only register once. Please reach out to Maddie for modifications.";
        errorOptions = {
          customClass: "email-duplicate",
          duration: 8000,
          autoClose: true,
        };
      } else if (error.message && error.message.includes("HTTP error")) {
        errorMessage =
          "🔗 Connection issue detected. Please check your internet connection and try again.";
        errorOptions = {
          duration: 6000,
          autoClose: true,
        };
      } else if (
        error.message &&
        error.message.includes("Failed to save to sheet")
      ) {
        errorMessage =
          "📝 Unable to save your registration at the moment. Please try again in a few seconds.";
        errorOptions = {
          duration: 6000,
          autoClose: true,
        };
      } else if (error.message) {
        errorMessage = `❌ ${error.message}`;
        errorOptions = {
          duration: 6000,
          autoClose: true,
        };
      }

      return {
        success: false,
        error: error.message || errorMessage,
        message: errorMessage,
        options: errorOptions,
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitForm,
    isSubmitting,
  };
};
