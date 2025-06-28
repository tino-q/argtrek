import { useState } from "react";

import { submitForm } from "../utils/api";

import useAuth from "./useAuth";

/**
 * Custom hook for handling form submission to Google Apps Script
 * Simplified: Send raw form data, let backend handle all transformations
 */
export const useFormSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { email, password } = useAuth();

  /**
   * Submit form data to Google Apps Script with minimal transformation
   * Backend will handle all calculations and processing
   */
  const doSubmitForm = async (formData, rsvpData, pricing) => {
    setIsSubmitting(true);

    try {
      // Create FormData with raw form inputs + essential RSVP context

      // Combine all data using spreading with prefixes
      const combinedData = {
        email,
        password,
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

      // Submit to Google Apps Script
      const result = await submitForm(combinedData);

      if (result.success) {
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
      }
      throw new Error(result.error || "Submission failed");
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
    submitForm: doSubmitForm,
    isSubmitting,
  };
};
