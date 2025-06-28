// Payment Step Component
// Extracted from App.jsx for better component organization

import PricingSummaryRsvp from "../layout/PricingSummaryRsvp";

import PaymentOptions from "./PaymentOptions";

const PaymentStep = ({ formData, updateFormData, rsvpData, pricing }) => {
  return (
    <div className="payment-section">
      <PaymentOptions
        formData={formData}
        updateFormData={updateFormData}
        rsvpData={rsvpData}
      />

      <PricingSummaryRsvp pricing={pricing} />

      {/* Information box about change requests */}
      <div className="change-request-notice">
        <div className="notice-content">
          <p>
            <i className="fas fa-info-circle" />
            Once submitted all change requests must be done through Maddie
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentStep;
