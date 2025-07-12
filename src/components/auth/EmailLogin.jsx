import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { APPS_SCRIPT_URL } from "../../utils/config";
import { STEPS } from "../../utils/stepConfig";
import { useNotificationContext } from "../../hooks/useNotificationContext";

const EmailLogin = ({
  onLoginSuccess,
  onLogout,
  onEmailNotFound,
  onExistingSubmission,
}) => {
  const { email, setEmail, password, setPassword, isLoading, setIsLoading } =
    useAuth();
  const { showSuccess, showError } = useNotificationContext();
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
    if (onLogout && !hasLoggedOut.current && isNavigatingToLogin) {
      hasLoggedOut.current = true;
      onLogout();

      // Also clear localStorage to ensure clean state
      localStorage.removeItem("userRSVP");
      localStorage.removeItem("formData");
      localStorage.removeItem("isFormSubmitted");
      localStorage.removeItem("submissionResult");
    }

    // Update previous location
    previousLocation.current = currentPath;

    // Reset the flag when component unmounts
    return () => {
      hasLoggedOut.current = false;
    };
  }, [location.pathname, onLogout]);

  // Main authentication handler
  const handleEmailLogin = async (email, password) => {
    try {
      const response = await fetch(
        `${APPS_SCRIPT_URL}?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
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
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get("email") && urlParams.get("password")) {
            urlParams.delete("email");
            urlParams.delete("password");
            const newUrl =
              window.location.pathname +
              (urlParams.toString() ? "?" + urlParams.toString() : "");
            window.history.replaceState({}, "", newUrl);
          }

          // Navigate to home for registered participants and notify parent
          navigate(`/${STEPS.HOME}`);
          if (onExistingSubmission) {
            onExistingSubmission(result.data, formData);
          }
          showSuccess("Welcome back! Your registration is complete.", {
            duration: 4000,
            autoClose: true,
          });
        } else {
          // No existing submission - start registration flow
          // Clean up URL parameters
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get("email") && urlParams.get("password")) {
            urlParams.delete("email");
            urlParams.delete("password");
            const newUrl =
              window.location.pathname +
              (urlParams.toString() ? "?" + urlParams.toString() : "");
            window.history.replaceState({}, "", newUrl);
          }

          navigate(`/${STEPS.WELCOME}`);
          if (onLoginSuccess) {
            onLoginSuccess(result.data.rsvpData);
          }
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
  };

  // Check for magic link parameters and auto-fill/auto-submit
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get("email");
    const passwordParam = urlParams.get("password");

    if (emailParam && passwordParam) {
      // Magic link detected - auto-fill credentials
      setEmail(emailParam);
      setPassword(passwordParam);

      // Auto-submit after a brief delay to allow state to update
      const autoSubmit = setTimeout(async () => {
        if (!isLoading) {
          setIsLoading(true);
          try {
            await handleEmailLogin(emailParam.trim(), passwordParam.trim());
          } catch (error) {
            // Check if this is an email not found error
            if (
              error &&
              error.message &&
              error.message.includes("Email not found")
            ) {
              // Navigate to new email step instead of showing modal
              if (onEmailNotFound) {
                onEmailNotFound(emailParam.trim());
              }
            } else {
              // Re-throw other errors to be handled by the parent component
              throw error;
            }
          }
          setIsLoading(false);
        }
      }, 500);

      return () => clearTimeout(autoSubmit);
    } else {
      // Auto-prefill dev credentials on localhost or 192.x networks
      const hostname = window.location.hostname;
      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.startsWith("192.")
      ) {
        // setEmail("dev@test.com");
        // setPassword("dev123");
        // setEmail("madibakla@gmail.com");
        // setPassword("dima");
      }
    }
  }, [isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      await handleEmailLogin(email.trim(), password.trim());
    } catch (error) {
      // Check if this is an email not found error
      if (error && error.message && error.message.includes("Email not found")) {
        // Navigate to new email step instead of showing modal
        if (onEmailNotFound) {
          onEmailNotFound(email.trim());
        }
      } else {
        // Re-throw other errors to be handled by the parent component
        throw error;
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="container">
      <div className="trip-form">
        <section className="form-section">
          <form onSubmit={handleSubmit} className="email-login-form">
            <div className="form-group">
              <label htmlFor="loginEmail">
                <i className="fas fa-envelope"></i>
                Email Address *
              </label>
              <input
                type="email"
                id="loginEmail"
                name="loginEmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registration email"
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="loginPassword">
                <i className="fas fa-lock"></i>
                Password *
              </label>
              <input
                type="password"
                id="loginPassword"
                name="loginPassword"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                    <i className="fas fa-spinner fa-spin"></i> Loading...
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
