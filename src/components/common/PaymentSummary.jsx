import React from "react";
import "../../styles/PaymentDetailsDisplay.css";

const PaymentSummary = ({ formData, pricing, submissionResult }) => {
  console.log("PaymentSummary - submissionResult:", submissionResult);

  // Check payment completion status
  const payment1Complete = submissionResult?.row?.["PAYMENT_1"] ? true : false;
  const payment2Complete = submissionResult?.row?.["PAYMENT_2"] ? true : false;

  // Determine overall completion status
  const isFullyPaid =
    formData.paymentSchedule === "full"
      ? payment1Complete
      : payment1Complete && payment2Complete;

  return (
    <div className="payment-summary-section">
      <h3>Payment Summary</h3>

      <div className="payment-method-info">
        <div className="info-row">
          <span className="label">Payment Method:</span>
          <span className="value">
            {formData.paymentMethod === "credit" && "Credit Card"}
            {formData.paymentMethod === "bank" && "Bank Transfer"}
            {formData.paymentMethod === "crypto" && "Cryptocurrency"}
          </span>
        </div>

        <div className="info-row">
          <span className="label">Payment Schedule:</span>
          <span className="value">
            {formData.paymentSchedule === "full" && "Full Payment"}
            {formData.paymentSchedule === "installments" && "Installment Plan"}
          </span>
        </div>

        <div className="info-row">
          <span className="label">Payment Status:</span>
          <span
            className={`value ${isFullyPaid ? "status-complete" : "status-pending"}`}
          >
            {isFullyPaid ? "✅ Fully Paid" : "🔄 Pending"}
          </span>
        </div>
      </div>

      {formData.paymentSchedule === "installments" ? (
        <div className="installment-breakdown">
          <h4>Payment Schedule</h4>
          <div className="payment-plan">
            <div
              className={`payment-item first-payment ${payment1Complete ? "payment-complete" : ""}`}
            >
              <div className="payment-info">
                <span className="payment-label">
                  First Payment (35%)
                  {payment1Complete && (
                    <i className="fas fa-check-circle payment-check"></i>
                  )}
                </span>
                <span className="payment-note">
                  {payment1Complete ? "✅ Completed" : "Due upon registration"}
                </span>
              </div>
              <div className="payment-amount">
                {formData.paymentMethod === "credit" ? (
                  <span className="amount">
                    €
                    {Math.round(
                      pricing.installmentAmountEUR ||
                        pricing.installmentAmount * 0.8487
                    )}
                    <span className="usd-equivalent">
                      (${pricing.installmentAmount})
                    </span>
                  </span>
                ) : (
                  <span className="amount">${pricing.installmentAmount}</span>
                )}
              </div>
            </div>

            <div
              className={`payment-item second-payment ${payment2Complete ? "payment-complete" : ""}`}
            >
              <div className="payment-info">
                <span className="payment-label">
                  Second Payment (65%)
                  {payment2Complete && (
                    <i className="fas fa-check-circle payment-check"></i>
                  )}
                </span>
                <span className="payment-note">
                  {payment2Complete
                    ? "✅ Completed"
                    : "Due closer to trip date"}
                </span>
              </div>
              <div className="payment-amount">
                {formData.paymentMethod === "credit" ? (
                  <span className="amount">
                    €
                    {Math.round(
                      (pricing.total - pricing.installmentAmount) * 0.8487
                    )}
                    <span className="usd-equivalent">
                      (${pricing.total - pricing.installmentAmount})
                    </span>
                  </span>
                ) : (
                  <span className="amount">
                    ${pricing.total - pricing.installmentAmount}
                  </span>
                )}
              </div>
            </div>

            <div className="payment-total">
              <div className="payment-info">
                <span className="payment-label">Total Trip Cost</span>
              </div>
              <div className="payment-amount">
                {formData.paymentMethod === "credit" ? (
                  <span className="amount">
                    €{Math.round(pricing.totalEUR || pricing.total * 0.8487)}
                    <span className="usd-equivalent">(${pricing.total})</span>
                  </span>
                ) : (
                  <span className="amount">${pricing.total}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="full-payment-breakdown">
          <h4>Payment Due</h4>
          <div className="payment-plan">
            <div
              className={`payment-item full-payment ${payment1Complete ? "payment-complete" : ""}`}
            >
              <div className="payment-info">
                <span className="payment-label">
                  Full Payment
                  {payment1Complete && (
                    <i className="fas fa-check-circle payment-check"></i>
                  )}
                </span>
                <span className="payment-note">
                  {payment1Complete ? "✅ Completed" : "Due upon registration"}
                </span>
              </div>
              <div className="payment-amount">
                {formData.paymentMethod === "credit" ? (
                  <span className="amount">
                    €{Math.round(pricing.totalEUR || pricing.total * 0.8487)}
                    <span className="usd-equivalent">(${pricing.total})</span>
                  </span>
                ) : (
                  <span className="amount">${pricing.total}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {formData.paymentMethod === "credit" && (
        <div className="currency-note">
          <i className="fas fa-info-circle"></i>
          <span>
            Credit card payments are processed in EUR at current exchange rate
          </span>
        </div>
      )}
    </div>
  );
};

export default PaymentSummary;
