import { useState } from "react";
import { APPS_SCRIPT_URL } from "../utils/config";

/**
 * Custom hook for handling form submission to Google Apps Script
 * Simplified: Send raw form data, let backend handle all transformations
 */
export const useFormSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Submit form data to Google Apps Script with minimal transformation
   * Backend will handle all calculations and processing
   */
  const submitForm = async (formData, rsvpData, pricing) => {
    setIsSubmitting(true);

    console.log({ rsvpData });

    try {
      // Create FormData with raw form inputs + essential RSVP context
      const formDataPayload = new FormData();

      // Combine all data using spreading with prefixes
      const combinedData = {
        ...Object.fromEntries(
          Object.entries(formData).map(([key, value]) => [
            `formData.${key}`,
            value,
          ])
        ),
        ...Object.fromEntries(
          Object.entries(pricing).map(([key, value]) => [
            `pricing.${key}`,
            value,
          ])
        ),
        ...Object.fromEntries(
          Object.entries(rsvpData).map(([key, value]) => [
            `rsvpData.${key}`,
            value,
          ])
        ),
      };

      // Add all combined data to FormData
      Object.entries(combinedData).forEach(([key, value]) => {
        formDataPayload.append(key, value);
      });

      // Submit to Google Apps Script
      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: formDataPayload,
      });

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
