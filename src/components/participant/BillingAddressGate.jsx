import { useState, useContext, useCallback, useRef } from "react";

import AuthContext from "../../context/AuthContext.jsx";
import { useNotificationContext } from "../../hooks/useNotificationContext";
import { useTripContext } from "../../hooks/useTripContext";
import { submitBillingAddress } from "../../utils/api.js";
import "./BillingAddressGate.css";

const BillingAddressGate = () => {
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
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isSubmittingRef = useRef(false);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");

      // Guard against double submission
      if (isSubmittingRef.current) {
        return;
      }

      if (!email || !password) {
        setError("Missing credentials. Please login again.");
        return;
      }

      if (!fullName || !address || !city || !zipCode || !country) {
        setError("Please fill in all required fields.");
        return;
      }

      try {
        isSubmittingRef.current = true;
        setSubmitting(true);

        const data = await submitBillingAddress({
          email,
          password,
          fullName,
          address,
          city,
          state,
          zipCode,
          country,
        });

        if (!data.success) {
          setError(data.error || "Failed to save billing address.");
          return;
        }

        // Update TripContext so the Timeline sees billing address without another fetch
        if (data.billingAddress) {
          setSubmissionResult((prev) => ({
            ...(prev || {}),
            billingAddress: data.billingAddress,
          }));
        }

        showSuccess("Billing address saved. Loading trip itinerary...");
      } catch (err) {
        console.error("Error submitting billing address:", err);
        showError("Unexpected error. Please try again.");
      } finally {
        isSubmittingRef.current = false;
        setSubmitting(false);
      }
    },
    [
      email,
      password,
      fullName,
      address,
      city,
      state,
      zipCode,
      country,
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
  const handleAddressChange = useCallback(
    (e) => setAddress(e.target.value),
    []
  );
  const handleCityChange = useCallback((e) => setCity(e.target.value), []);
  const handleStateChange = useCallback((e) => setState(e.target.value), []);
  const handleZipCodeChange = useCallback(
    (e) => setZipCode(e.target.value),
    []
  );
  const handleCountryChange = useCallback(
    (e) => setCountry(e.target.value),
    []
  );

  return (
    <div className="container">
      <div className="billing-address-gate">
        <h2>Billing Address Required</h2>
        <p>
          Oops! We forgot to collect your billing address. Before accessing your
          trip itinerary, please provide the address of the person or entity who
          made the payment.
        </p>

        <form className="billing-address-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Full Name *
              <span className="field-note">
                Name as it appears on your billing statement
              </span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={handleFullNameChange}
              placeholder="E.g., John Doe"
              required
            />
          </div>

          <div className="form-row">
            <label>Street Address *</label>
            <input
              type="text"
              value={address}
              onChange={handleAddressChange}
              placeholder="E.g., 123 Main St, Apt 4B"
              required
            />
          </div>

          <div className="form-row">
            <label>City *</label>
            <input
              type="text"
              value={city}
              onChange={handleCityChange}
              placeholder="E.g., New York"
              required
            />
          </div>

          <div className="form-row">
            <label>State / Province (Optional)</label>
            <input
              type="text"
              value={state}
              onChange={handleStateChange}
              placeholder="E.g., NY"
            />
          </div>

          <div className="form-row">
            <label>ZIP / Postal Code *</label>
            <input
              type="text"
              value={zipCode}
              onChange={handleZipCodeChange}
              placeholder="E.g., 10001"
              required
            />
          </div>

          <div className="form-row">
            <label>Country *</label>
            <input
              type="text"
              value={country}
              onChange={handleCountryChange}
              placeholder="E.g., United States"
              required
            />
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
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Save and Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BillingAddressGate;
