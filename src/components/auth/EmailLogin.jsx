import { useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import { useNotificationContext } from "../../hooks/useNotificationContext";
import { useTripContext } from "../../hooks/useTripContext";
import { APPS_SCRIPT_URL } from "../../utils/config";
import { STEPS } from "../../utils/stepConfig";

const hardcodedProfile = {
  rsvpData: {
    Timestamp: "2025-06-29T02:36:54.163Z",
    name: "Ekin Karamalak",
    party: "Solo",
    plus1: false,
    option: "Option 2",
    email: "ekin@stanford.edu",
    comments: false,
    email2: "ekin@stanford.edu",
    "22Nov_BSAS": true,
    "23Nov_Tour": true,
    "23Nov_Dinner_Welcome": true,
    "23Nov_BSAS": true,
    "AEP-BRC": true,
    "24Nov_BARI": true,
    "25Nov_BARI": true,
    "26Nov_BARI": true,
    "BRC-MDZ": true,
    "27Nov_MDZ": true,
    "28Nov_MDZ": true,
    "MDZ-AEP": true,
    "29Nov_BSAS": true,
    PACKPRICE: 2680,
    PRIVATEROOM: 610,
    VALIJA: 75,
    USD_TO_EUR_EXCHANGE_RATE: 0.8486,
  },
  row: {
    "formData.email": "ekin@stanford.edu",
    "formData.firstName": "Ekin",
    "formData.lastName": "Karamalak",
    "formData.phoneNumber": 16502503899,
    "formData.roommateName": "",
    "formData.roommatePreference": "seeking",
    "formData.dietaryMessage": "",
    "formData.dietaryRestrictions": "none",
    "formData.checkedLuggage": true,
    "formData.privateRoomUpgrade": false,
    "formData.cooking": false,
    "formData.horseback": false,
    "formData.rafting": false,
    "formData.tango": false,
    "formData.paymentSchedule": "installments",
    "formData.paymentMethod": "credit",
    "formData.cryptoCurrency": "USDT",
    "formData.cryptoNetwork": "ETH",
    "pricing.activitiesPrice": 0,
    "pricing.basePrice": 2680,
    "pricing.installmentAmount": 965,
    "pricing.privateRoomUpgrade": 0,
    "pricing.processingFee": 76,
    "pricing.subtotal": 2680,
    "pricing.total": 2756,
    "rsvpData.22Nov_BSAS": true,
    "rsvpData.23Nov_BSAS": true,
    "rsvpData.23Nov_Dinner_Welcome": true,
    "rsvpData.23Nov_Tour": true,
    "rsvpData.24Nov_BARI": true,
    "rsvpData.25Nov_BARI": true,
    "rsvpData.26Nov_BARI": true,
    "rsvpData.27Nov_MDZ": true,
    "rsvpData.28Nov_MDZ": true,
    "rsvpData.29Nov_BSAS": true,
    "rsvpData.AEP-BRC": true,
    "rsvpData.BRC-MDZ": true,
    "rsvpData.MDZ-AEP": true,
    "rsvpData.PACKPRICE": 2680,
    "rsvpData.PRIVATEROOM": 610,
    "rsvpData.Timestamp": "2025-06-29T02:36:54.163Z",
    "rsvpData.comments": false,
    "rsvpData.email": "ekin@stanford.edu",
    "rsvpData.email2": "ekin@stanford.edu",
    "rsvpData.name": "Ekin Karamalak",
    "rsvpData.option": "Option 2",
    "rsvpData.party": "Solo",
    "rsvpData.plus1": false,
    "pricing.totalEUR": 2339.0172,
    "pricing.installmentAmountEUR": 819,
    "paymentLink.url": "",
    "": "",
    "TPV LINK ISSUED": false,
    PAYMENT_1: true,
    PAYMENT_2: "",
    ROOMMATE: "PENDING",
    ID: 5,
  },
  rowNumber: 5,
};

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
        let result;

        if (__DEV__) {
          result = { data: hardcodedProfile };
        } else {
          const response = await fetch(
            `${APPS_SCRIPT_URL}?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
            {
              method: "GET",
            }
          );
          result = await response.json();
        }

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
  }, [handleEmailLogin, isLoading, setEmail, setIsLoading, setPassword]);

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
