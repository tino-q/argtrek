import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const EmailLogin = ({ onEmailSubmit, onLogout, onEmailNotFound }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const hasLoggedOut = useRef(false);
  const location = useLocation();
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
    }

    // Update previous location
    previousLocation.current = currentPath;

    // Reset the flag when component unmounts
    return () => {
      hasLoggedOut.current = false;
    };
  }, [location.pathname, onLogout]);

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
        if (onEmailSubmit && !isLoading) {
          setIsLoading(true);
          try {
            await onEmailSubmit(emailParam.trim(), passwordParam.trim());
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
        // setEmail("solo@gmail.com");
        setPassword("password");
      }
    }
  }, [onEmailSubmit, onEmailNotFound, isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      // Pass both email and password to the callback
      if (onEmailSubmit) {
        await onEmailSubmit(email.trim(), password.trim());
      }
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
    <>
      <section className="form-section">
        <h2>
          <i className="fas fa-sign-in-alt"></i> Access Your Trip Details
        </h2>

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
            <small className="password-help">
              Check your email for your login link
            </small>
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
                  <i className="fas fa-spinner fa-spin"></i> Retrieving...
                </>
              ) : (
                <>
                  <i className="fas fa-search"></i> Retrieve My Trip Details
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </>
  );
};

export default EmailLogin;
