// Pricing Summary Component
// Pure display component - all calculations handled by usePricing hook

import { FORM_FIELDS } from "../../utils/config";

const PricingSummary = ({ pricing, formData }) => {
  const formatCurrency = (amount) => {
    return `$${Math.round(amount).toLocaleString()}`;
  };

  const hasAccommodationUpgrade =
    formData[FORM_FIELDS.PRIVATE_ROOM_UPGRADE] === true;

  const hasActivities = pricing.activities && pricing.activities.length > 0;

  const hasCheckedLuggage = formData[FORM_FIELDS.CHECKED_LUGGAGE] === true;

  const hasProcessingFee = formData[FORM_FIELDS.PAYMENT_METHOD] === "credit";

  const isInstallmentPlan =
    formData[FORM_FIELDS.PAYMENT_SCHEDULE] === "installments";

  return (
    <section className="price-summary">
      <h2>
        <i className="fas fa-calculator"></i> Price Summary
      </h2>

      <div className="summary-content">
        {/* Base Trip Cost */}
        <div className="summary-row">
          <span>Base Trip Cost</span>
          <span>{formatCurrency(pricing.basePrice)}</span>
        </div>

        {/* Accommodation Upgrade */}
        {hasAccommodationUpgrade && (
          <div className="summary-row activity-row">
            <span>Private Room Upgrade</span>
            <span>
              {formatCurrency(pricing.privateRoomUpgrade)}
              <small> (optional)</small>
            </span>
          </div>
        )}

        {/* Activities Section */}
        {hasActivities && (
          <div id="activitiesSection">
            {pricing.activities.map((activity, index) => (
              <div key={index} className="summary-row activity-row">
                <span>{activity.name}</span>
                <span>
                  {formatCurrency(activity.price)}
                  <small>
                    {" "}
                    ({`${activity.price > 0 ? "optional" : "pending"}`})
                  </small>
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Checked Luggage */}
        {hasCheckedLuggage && (
          <div className="summary-row activity-row">
            <span>Checked Luggage</span>
            <span>
              pending
              <small> (optional)</small>
            </span>
          </div>
        )}

        {/* Subtotal */}
        <div className="summary-row subtotal">
          <span>Subtotal</span>
          <span>{formatCurrency(pricing.subtotal)}</span>
        </div>

        {/* Processing Fee (Credit Card) */}
        {hasProcessingFee && (
          <div className="summary-row">
            <span>Processing Fee (2.85%)</span>
            <span>{formatCurrency(pricing.processingFee)}</span>
          </div>
        )}

        {/* Total Amount */}
        <div className="summary-row total">
          <span>Total Amount</span>
          <span>{formatCurrency(pricing.total)}</span>
        </div>

        {/* Amount Due Now */}
        {isInstallmentPlan && (
          <div className="payment-amount">
            <span>Amount Due Now (35%)</span>
            <span>{formatCurrency(pricing.installmentAmount)}</span>
          </div>
        )}

        {/* Installment Note */}
        {isInstallmentPlan && (
          <div
            className="summary-row"
            style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}
          >
            <span>Remaining due September 15th</span>
            <span>
              {formatCurrency(pricing.total - pricing.installmentAmount)}
            </span>
          </div>
        )}
      </div>
    </section>
  );
};

export default PricingSummary;
