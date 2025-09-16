import { useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import { useNotificationContext } from "../../hooks/useNotificationContext";
import { useTripContext } from "../../hooks/useTripContext";
import { BACKEND_URL } from "../../utils/config";
import { STEPS } from "../../utils/stepConfig";

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

const EmailLogin = () => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    setIsLoading,
    clearAuth,
  } = useAuth();
  const { showSuccess, showError } = useNotificationContext();
  const { setUserRSVP, setFormData, setSubmissionResult, handleLogout } =
    useTripContext();
  const hasLoggedOut = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const previousLocation = useRef(location.pathname);

  // Force logout and clear all data when navigating TO login page (not on re-renders)
  useEffect(() => {
    const currentPath = location.pathname;
    const isLoginPage = currentPath === "/login" || currentPath === "/";
    const isNavigatingToLogin =
      previousLocation.current !== currentPath && isLoginPage;

    // Clear all data when navigating to login page, regardless of current state
    if (!hasLoggedOut.current && isNavigatingToLogin) {
      hasLoggedOut.current = true;
      handleLogout();
    }

    // Update previous location
    previousLocation.current = currentPath;

    // Reset the flag when component unmounts
    return () => {
      hasLoggedOut.current = false;
    };
  }, [location.pathname, clearAuth, handleLogout]);

  // Main authentication handler
  const handleEmailLogin = useCallback(
    async (email, password) => {
      try {
        const response = await fetch(
          `${BACKEND_URL}?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
          {
            method: "GET",
          }
        );
        const result = await response.json();

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
        } else {
          console.log("result", result);
          console.log("✅ USER LOGIN SUCCESS - Complete Response Payload:");
          console.log("===============================================");
          console.table(result.data);
          console.log("Raw JSON Data:", JSON.stringify(result.data, null, 2));
          console.log("===============================================");

          if (result.data.row) {
            // User has already submitted - load their existing data and show home
            console.log("🔄 EXISTING SUBMISSION FOUND - Loading previous data");

            const keys = Object.keys(result.data.row);
            const formDataKeys = keys.filter((key) =>
              key.startsWith("formData.")
            );
            const formData = formDataKeys.reduce((acc, key) => {
              acc[key.replace("formData.", "")] = result.data.row[key];
              return acc;
            }, {});

            // Clean up URL parameters
            cleanupUrlParameters();

            setUserRSVP(result.data.rsvpData);
            setFormData(formData);
            setSubmissionResult(result.data);
            navigate(`/home`);

            showSuccess("Welcome!", {
              duration: 4000,
              autoClose: true,
            });
          } else {
            setUserRSVP(result.data.rsvpData);
            setSubmissionResult(null);
            navigate(`/${STEPS.WELCOME}`);

            showSuccess("Welcome!", {
              duration: 4000,
            });

            cleanupUrlParameters();
          }
        }
      } catch (error) {
        console.error("Login error:", error);

        if (error.message && error.message.includes("Email not found")) {
          throw error;
        }

        showError(
          "Failed to retrieve trip details. Please check your internet connection and try again."
        );
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

  // Check for magic link parameters and auto-fill/auto-submit
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get("email");
    const passwordParam = urlParams.get("password");

    if (emailParam && passwordParam) {
      handleLogout();
      // Magic link detected - auto-fill credentials
      setEmail(emailParam);
      setPassword(passwordParam);

      // Auto-submit after a brief delay to allow state to update
      const autoSubmit = setTimeout(async () => {
        if (!isLoading) {
          setIsLoading(true);
          await handleEmailLogin(emailParam.trim(), passwordParam.trim());
          setIsLoading(false);
        }
      }, 500);

      return () => clearTimeout(autoSubmit);
    }

    if (__DEV__) {
      setEmail("tinqueija@gmail.com");
      setPassword("dima");
    }
  }, [
    handleEmailLogin,
    isLoading,
    setEmail,
    setIsLoading,
    setPassword,
    handleLogout,
  ]);

  const handleEmailChange = useCallback(
    (e) => setEmail(e.target.value),
    [setEmail]
  );
  const handlePasswordChange = useCallback(
    (e) => setPassword(e.target.value),
    [setPassword]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!email.trim() || !password.trim()) {
        return;
      }

      setIsLoading(true);

      await handleEmailLogin(email.trim(), password.trim());

      setIsLoading(false);
    },
    [email, password, handleEmailLogin, setIsLoading]
  );

  return (
    <div className="container">
      <div className="trip-form">
        <section className="form-section">
          <form onSubmit={handleSubmit} className="email-login-form">
            <div className="form-group">
              <label htmlFor="loginEmail">
                <i className="fas fa-envelope" />
                Email Address *
              </label>
              <input
                type="email"
                id="loginEmail"
                name="loginEmail"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter your registration email"
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="loginPassword">
                <i className="fas fa-lock" />
                Password *
              </label>
              <input
                type="password"
                id="loginPassword"
                name="loginPassword"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className={`login-btn ${isLoading ? "loading" : ""}`}
                disabled={isLoading || !email.trim() || !password.trim()}
                style={{ marginBottom: "30px" }}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin" /> Loading...
                  </>
                ) : (
                  <>Login</>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default EmailLogin;
