import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import { useTripContext } from "../../hooks/useTripContext";
import { useUserDataRefresh } from "../../hooks/useUserDataRefresh";
import { IS_LOCAL } from "../../utils/env";

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
  const { handleLogout } = useTripContext();
  const { refreshUserData } = useUserDataRefresh();
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
        await refreshUserData(email, password, {
          showSuccessMessage: true,
          navigateOnSuccess: true,
          cleanupUrl: true,
        });
        setEmail(email);
        setPassword(password);
      } catch (error) {
        // Error handling is already done in refreshUserData
        console.error("Login error:", error);
      }
    },
    [refreshUserData, setEmail, setPassword]
  );

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
          await handleEmailLogin(emailParam.trim(), passwordParam.trim());
          setIsLoading(false);
        }
      }, 500);

      return () => clearTimeout(autoSubmit);
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

  const handleDevAutoLogin = useCallback(async () => {
    await handleEmailLogin("tinqueija@gmail.com", "dima");
  }, [handleEmailLogin]);

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

            {IS_LOCAL && (
              <button onClick={handleDevAutoLogin}>Dev Auto Login</button>
            )}
          </form>
        </section>
      </div>
    </div>
  );
};

export default EmailLogin;
