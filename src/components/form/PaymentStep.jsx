// Payment Step Component
// Extracted from App.jsx for better component organization

import PaymentOptions from "./PaymentOptions";
import PricingSummary from "../layout/PricingSummary";

const PaymentStep = ({ formData, updateFormData, rsvpData, pricing }) => {
  return (
    <div className="payment-section">
      <PaymentOptions
        formData={formData}
        updateFormData={updateFormData}
        rsvpData={rsvpData}
      />

      <PricingSummary pricing={pricing} formData={formData} />

      {/* Information box about change requests */}
      <div className="change-request-notice">
        <div className="notice-content">
          <p>
            <i className="fas fa-info-circle"></i>Once submitted all change
            requests must be done through Maddie
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentStep;
