// Pricing Summary Component
// Pure display component - all calculations handled by usePricing hook

import { FORM_FIELDS } from "../../utils/config";

const PricingSummary = ({ pricing, formData }) => {
  const formatCurrency = (amount) => {
    return `$${Math.round(amount).toLocaleString()}`;
  };

  const hasAccommodationUpgrade =
    formData[FORM_FIELDS.ACCOMMODATION] === "private";

  const hasActivities = pricing.activities && pricing.activities.length > 0;

  const hasVAT = formData[FORM_FIELDS.ARGENTINE_CITIZEN];

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
              {formatCurrency(pricing.accommodationPrice)}
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
                  <small> (optional)</small>
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Subtotal */}
        <div className="summary-row subtotal">
          <span>Subtotal</span>
          <span>{formatCurrency(pricing.subtotal)}</span>
        </div>

        {/* VAT (Argentine Citizens) */}
        {hasVAT && (
          <div className="summary-row">
            <span>VAT (21%) on accommodation</span>
            <span>{formatCurrency(pricing.vatAmount)}</span>
          </div>
        )}

        {/* Intermediate Subtotal (when VAT is applied) */}
        {hasVAT && (
          <div className="summary-row subtotal">
            <span>Subtotal (incl. VAT)</span>
            <span>{formatCurrency(pricing.subtotal + pricing.vatAmount)}</span>
          </div>
        )}

        {/* Processing Fee (Credit Card) */}
        {hasProcessingFee && (
          <div className="summary-row">
            <span>Processing Fee (4%)</span>
            <span>{formatCurrency(pricing.processingFee)}</span>
          </div>
        )}

        {/* Total Amount */}
        <div className="summary-row total">
          <span>Total Amount</span>
          <span>{formatCurrency(pricing.total)}</span>
        </div>

        {/* Amount Due Now */}
        <div className="payment-amount">
          <span>Amount Due Now</span>
          <span>{formatCurrency(pricing.installmentAmount)}</span>
        </div>

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
