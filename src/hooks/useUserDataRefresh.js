import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { loginUser } from "../utils/api";
import { STEPS } from "../utils/stepConfig";

import { useNotificationContext } from "./useNotificationContext";
import { useTripContext } from "./useTripContext";

function cleanupUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("email") && urlParams.get("password")) {
    urlParams.delete("email");
    urlParams.delete("password");
    const newUrl =
      window.location.pathname +
      (urlParams.toString() ? `?${urlParams.toString()}` : "");
    window.history.replaceState({}, "", newUrl);
  }
}

export const useUserDataRefresh = () => {
  const { showSuccess, showError } = useNotificationContext();
  const { setUserRSVP, setFormData, setSubmissionResult } = useTripContext();
  const navigate = useNavigate();

  const refreshUserData = useCallback(
    async (email, password, options = {}) => {
      const {
        showSuccessMessage = true,
        navigateOnSuccess = true,
        cleanupUrl = false,
      } = options;

      try {
        const result = await loginUser(email, password);

        if (result.error) {
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
            throw new Error("Email not found in our RSVP database");
          } else {
            showError(result.error);
          }
          return { success: false, error: result.error };
        }

        if (result.data.row) {
          // User has already submitted - load their existing data
          const keys = Object.keys(result.data.row);
          const formDataKeys = keys.filter((key) =>
            key.startsWith("formData.")
          );
          const formData = formDataKeys.reduce((acc, key) => {
            let value = result.data.row[key];

            if (value.toString().toLowerCase() === "true") {
              value = true;
            } else if (value.toString().toLowerCase() === "false") {
              value = false;
            }

            const formDataKey = key.replace("formData.", "");
            acc[formDataKey] = value;
            return acc;
          }, {});

          if (cleanupUrl) {
            cleanupUrlParameters();
          }

          setUserRSVP(result.data.rsvpData);
          setFormData(formData);
          setSubmissionResult(result.data);

          if (navigateOnSuccess) {
            navigate(`/home`);
          }

          if (showSuccessMessage) {
            showSuccess("Welcome!", {
              duration: 4000,
              autoClose: true,
            });
          }

          return {
            success: true,
            data: result.data,
            hasSubmittedData: true
          };
        }

        // User hasn't submitted yet
        setUserRSVP(result.data.rsvpData);
        setSubmissionResult(null);

        if (navigateOnSuccess) {
          navigate(`/${STEPS.WELCOME}`);
        }

        if (showSuccessMessage) {
          showSuccess("Welcome!", {
            duration: 4000,
          });
        }

        if (cleanupUrl) {
          cleanupUrlParameters();
        }

        return {
          success: true,
          data: result.data,
          hasSubmittedData: false
        };
      } catch (error) {
        console.error("User data refresh error:", error);

        if (error.message && error.message.includes("Email not found")) {
          throw error;
        }

        showError(
          "Failed to retrieve trip details. Please check your internet connection and try again."
        );
        return { success: false, error: error.message };
      }
    },
    [
      showError,
      setUserRSVP,
      setFormData,
      setSubmissionResult,
      navigate,
      showSuccess,
    ]
  );

  return { refreshUserData };
};