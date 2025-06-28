import { useState, useContext, useCallback } from "react";

import AuthContext from "../../context/AuthContext.jsx";
import { useNotificationContext } from "../../hooks/useNotificationContext";
import { useTripContext } from "../../hooks/useTripContext";
import { submitPassport } from "../../utils/api.js";
import "./PassportGate.css";

const PassportGate = () => {
  const { email, password } = useContext(AuthContext);
  const { setSubmissionResult, submissionResult } = useTripContext();
  const { showSuccess, showError } = useNotificationContext();

  const initialFullName = (() => {
    const row = submissionResult?.row || null;
    const rsvp = submissionResult?.rsvpData || null;
    const first = row?.["formData.firstName"] || "";
    const last = row?.["formData.lastName"] || "";
    const combined = `${first} ${last}`.trim();
    if (combined) {
      return combined;
    }
    return (rsvp?.name || "").trim();
  })();

  const [fullName, setFullName] = useState(initialFullName || "");
  const [passportNumber, setPassportNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [aAdvantage, setaAdvantage] = useState("");
  // New confirmations required before submission
  const [ackHealthInsurance, setAckHealthInsurance] = useState(false);
  const [ackTravelInsurance, setAckTravelInsurance] = useState(false);
  const [ackTerms, setAckTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");

      if (!email || !password) {
        setError("Missing credentials. Please login again.");
        return;
      }

      if (!fullName || !passportNumber || !expiryDate || !birthDate) {
        setError("Please fill in all required fields.");
        return;
      }

      if (!ackHealthInsurance || !ackTravelInsurance || !ackTerms) {
        setError("Please confirm all the required acknowledgements.");
        return;
      }

      setSubmitting(true);
      try {
        const data = await submitPassport({
          email,
          password,
          passportName: fullName,
          passportNumber,
          expiryDate,
          birthDate,
          aAdvantage: aAdvantage || "",
        });

        if (!data.success) {
          setError(data.error || "Failed to save passport details.");
          return;
        }

        // Update TripContext so the Timeline sees passport without another fetch
        if (data.passport) {
          setSubmissionResult((prev) => ({
            ...(prev || {}),
            passport: data.passport,
          }));
        }

        showSuccess("Passport details saved. Loading trip itinerary...");
      } catch (err) {
        console.error("Error submitting passport:", err);
        showError("Unexpected error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [
      email,
      password,
      fullName,
      passportNumber,
      expiryDate,
      birthDate,
      aAdvantage,
      ackHealthInsurance,
      ackTravelInsurance,
      ackTerms,
      setSubmissionResult,
      showSuccess,
      showError,
    ]
  );

  // Stable input change handlers to satisfy react-perf rule
  const handleFullNameChange = useCallback(
    (e) => setFullName(e.target.value),
    []
  );
  const handlePassportNumberChange = useCallback(
    (e) => setPassportNumber(e.target.value),
    []
  );
  const handleExpiryDateChange = useCallback(
    (e) => setExpiryDate(e.target.value),
    []
  );
  const handleBirthDateChange = useCallback(
    (e) => setBirthDate(e.target.value),
    []
  );
  const handleaAdvantageChange = useCallback(
    (e) => setaAdvantage(e.target.value),
    []
  );
  const handleAckHealthInsurance = useCallback(
    (e) => setAckHealthInsurance(e.target.checked),
    []
  );
  const handleAckTravelInsurance = useCallback(
    (e) => setAckTravelInsurance(e.target.checked),
    []
  );
  const handleAckTerms = useCallback((e) => setAckTerms(e.target.checked), []);

  return (
    <div className="container">
      <div className="passport-gate">
        <h2>Travel Document Required</h2>
        <p>
          Before accessing your trip itinerary, please provide your passport
          details. We’ll also optionally associate your AAdvantage number to
          your flights.
        </p>

        <form className="passport-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Full Name *
              <span className="field-note">
                Ensure this name matches your passport
              </span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={handleFullNameChange}
              placeholder="E.g., John Alexander Doe"
              required
            />
          </div>
          <div className="form-row">
            <label>Passport Number *</label>
            <input
              type="text"
              value={passportNumber}
              onChange={handlePassportNumberChange}
              placeholder="E.g., 123456789"
              required
            />
          </div>

          <div className="form-row">
            <label>Passport Expiry Date *</label>
            <input
              type="date"
              value={expiryDate}
              onChange={handleExpiryDateChange}
              required
            />
          </div>

          <div className="form-row">
            <label>Date of Birth *</label>
            <input
              type="date"
              value={birthDate}
              onChange={handleBirthDateChange}
              required
            />
          </div>

          <div className="form-row">
            <label>AAdvantage Number (Optional)</label>
            <input
              type="text"
              value={aAdvantage}
              onChange={handleaAdvantageChange}
              placeholder="AAdvantage"
            />
          </div>

          {/* Required confirmations */}
          <div className="form-row">
            <label>
              <input
                type="checkbox"
                checked={ackHealthInsurance}
                onChange={handleAckHealthInsurance}
              />
              <span style={{ marginLeft: 10 }}>
                I acknowledge Decree 366/2025 requires valid health insurance
                for entry and I will carry proof.
              </span>
            </label>
          </div>
          <div className="form-row">
            <label>
              <input
                type="checkbox"
                checked={ackTravelInsurance}
                onChange={handleAckTravelInsurance}
              />
              <span style={{ marginLeft: 10 }}>
                I understand that we recommend purchasing personal travel
                insurance.
              </span>
            </label>
          </div>
          <div className="form-row">
            <label>
              <input
                type="checkbox"
                checked={ackTerms}
                onChange={handleAckTerms}
              />
              <span style={{ marginLeft: 10 }}>
                I have read the Terms & Conditions sent by email in the new
                voucher (
                <a href="/terms" target="_blank" rel="noreferrer">
                  view
                </a>
                ).
              </span>
            </label>
          </div>

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={
                submitting ||
                !ackHealthInsurance ||
                !ackTravelInsurance ||
                !ackTerms
              }
            >
              {submitting ? "Submitting..." : "Save and Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PassportGate;
