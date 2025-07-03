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
    </div>
  );
};

export default PaymentStep;
