import {
  useEffect,
  useMemo,
  useState,
  useContext,
  useCallback,
  useRef,
} from "react";

import AuthContext from "../../context/AuthContext.jsx";
import { useTripContext } from "../../hooks/useTripContext";
import { useUserDataRefresh } from "../../hooks/useUserDataRefresh";
import { submitLuggage } from "../../utils/api.js";
import "./LuggageGate.css";

// Static flight definitions and pricing
const FLIGHTS = [
  { key: "AEP-BRC", label: "Buenos Aires → Bariloche", price: 25 },
  { key: "BRC-MDZ", label: "Bariloche → Mendoza", price: 25 },
  { key: "MDZ-AEP", label: "Mendoza → Buenos Aires", price: 25 },
];

const LuggageGate = () => {
  const { email, password } = useContext(AuthContext);
  const { submissionResult, formData } = useTripContext();
  const { refreshUserData } = useUserDataRefresh();

  // Derive available flights for this traveler from RSVP
  const availableFlights = useMemo(() => {
    const rsvpData = submissionResult?.rsvpData || {};
    return FLIGHTS.filter(
      (f) => rsvpData?.[f.key]?.toString().toLowerCase().trim() === "true"
    );
  }, [submissionResult?.rsvpData]);

  // Local selection state: which flights user wants checked luggage for
  const [luggageSelection, setLuggageSelection] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

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

      // Guard against double submission
      if (isSubmittingRef.current) {
        return;
      }

      if (!email || !password) {
        setError("Missing credentials. Please login again.");
        return;
      }

      try {
        isSubmittingRef.current = true;
        setSubmitting(true);

        const data = await submitLuggage({
          email,
          password,
          luggageSelection,
        });

        if (!data.success) {
          throw new Error(data.error || "Failed to save luggage selections");
        }

        // Refresh user data to get updated pricing after luggage selection
        await refreshUserData(email, password, {
          showSuccessMessage: false,
          navigateOnSuccess: false,
          cleanupUrl: false,
        });
      } catch (err) {
        console.error("Error saving luggage choice:", err);
        setError("Unexpected error. Please try again.");
      } finally {
        isSubmittingRef.current = false;
        setSubmitting(false);
      }
    },
    [email, password, luggageSelection, refreshUserData]
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
