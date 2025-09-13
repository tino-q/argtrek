import { useEffect, useMemo, useState, useContext, useCallback } from "react";

import AuthContext from "../../context/AuthContext.jsx";
import { useTripContext } from "../../hooks/useTripContext";
import { APPS_SCRIPT_URL } from "../../utils/config.js";
import "./LuggageGate.css";

// Static flight definitions and pricing
const FLIGHTS = [
  { key: "AEP-BRC", label: "Buenos Aires → Bariloche", price: 10 },
  { key: "BRC-MDZ", label: "Bariloche → Mendoza", price: 15 },
  { key: "MDZ-AEP", label: "Mendoza → Buenos Aires", price: 20 },
];

const LuggageGate = () => {
  const { email, password } = useContext(AuthContext);
  const { submissionResult, formData, setSubmissionResult } = useTripContext();

  // Derive available flights for this traveler from RSVP
  const availableFlights = useMemo(() => {
    const rsvpData = submissionResult?.rsvpData || {};
    return FLIGHTS.filter((f) => Boolean(rsvpData?.[f.key]));
  }, [submissionResult?.rsvpData]);

  // Local selection state: which flights user wants checked luggage for
  const [luggageSelection, setLuggageSelection] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Initialize defaults: if user preselected interest, check all available
  useEffect(() => {
    const interested = Boolean(formData?.checkedLuggage);
    const defaults = Object.fromEntries(
      availableFlights.map((f) => [f.key, interested])
    );
    setLuggageSelection(defaults);
  }, [availableFlights, formData?.checkedLuggage]);

  const subtotal = useMemo(() => {
    return availableFlights.reduce((sum, f) => {
      return luggageSelection[f.key] ? sum + f.price : sum;
    }, 0);
  }, [availableFlights, luggageSelection]);

  const toggleFlight = useCallback((key) => {
    setLuggageSelection((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSave = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");

      if (!email || !password) {
        setError("Missing credentials. Please login again.");
        return;
      }

      try {
        setSubmitting(true);

        const form = new FormData();
        form.append("action", "submit_luggage");
        form.append("email", email);
        form.append("password", password);
        form.append("luggageSelection", JSON.stringify(luggageSelection));

        const res = await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          body: form,
        });
        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to save luggage selections");
        }

        setSubmissionResult((prev) => ({
          ...(prev || {}),
          luggageSelection,
        }));
      } catch (err) {
        console.error("Error saving luggage choice:", err);
        setError("Unexpected error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [email, password, luggageSelection, setSubmissionResult]
  );

  return (
    <div className="container">
      <div className="luggage-gate">
        <h2>Checked Luggage</h2>
        <p>
          Add checked luggage to any of your internal flights. We recommend
          traveling light.
        </p>

        <form className="luggage-form" onSubmit={handleSave}>
          <div className="flights-list" role="group" aria-label="Flights">
            {availableFlights.map((flight) => (
              <label key={flight.key} className="flight-row">
                <input
                  type="checkbox"
                  style={{ width: 15, height: 15 }}
                  checked={Boolean(luggageSelection[flight.key])}
                  // eslint-disable-next-line react-perf/jsx-no-new-function-as-prop
                  onChange={() => toggleFlight(flight.key)}
                />
                {/* <div className="flight-info"> */}
                <div className="flight-label">{flight.label}</div>
                <div className="flight-price" style={{ marginLeft: "auto" }}>
                  ${flight.price}
                </div>
                {/* </div> */}
              </label>
            ))}
          </div>

          <div className="subtotal-row">
            <span>Subtotal</span>
            <span className="subtotal-amount">${subtotal}</span>
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
              {submitting ? "Saving..." : "Save and Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LuggageGate;
