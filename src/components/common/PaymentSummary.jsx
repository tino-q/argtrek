import React from "react";
import "../../styles/PaymentSummary.css";

const PaymentSummary = ({ formData, pricing, submissionResult }) => {
  const payment1Complete = submissionResult?.row?.["PAYMENT_1"] ? true : false;
  const payment2Complete = submissionResult?.row?.["PAYMENT_2"] ? true : false;

  const isFullyPaid =
    formData.paymentSchedule === "full"
      ? payment1Complete
      : payment1Complete && payment2Complete;

  const formatCurrency = (amount, currency = "$") => {
    return `${currency}${Math.round(amount).toLocaleString()}`;
  };

  const getPaymentMethodDisplay = () => {
    switch (formData.paymentMethod) {
      case "credit":
        return "Credit Card";
      case "bank":
        return "Bank Transfer";
      case "crypto":
        return "Cryptocurrency";
      default:
        return "";
    }
  };

  const getScheduleDisplay = () => {
    return formData.paymentSchedule === "full"
      ? "Full Payment"
      : "Installments";
  };

  return (
    <div className="payment-summary">
      {/* Header */}
      <div className="payment-summary__header">
        <h3 className="payment-summary__title">Payment Summary</h3>
        <span
          className={`payment-summary__status ${
            isFullyPaid
              ? "payment-summary__status--paid"
              : "payment-summary__status--pending"
          }`}
        >
          {isFullyPaid ? "✓ Fully Paid" : "Pending"}
        </span>
      </div>

      {/* Payment Info */}
      <div className="payment-summary__info">
        <div className="payment-summary__info-item">
          <span className="payment-summary__info-label">Method</span>
          <span className="payment-summary__info-value">
            {getPaymentMethodDisplay()}
          </span>
        </div>
        <div className="payment-summary__info-item">
          <span className="payment-summary__info-label">Schedule</span>
          <span className="payment-summary__info-value">
            {getScheduleDisplay()}
          </span>
        </div>
      </div>

      {/* Payment Breakdown */}
      <div className="payment-summary__breakdown">
        {formData.paymentSchedule === "installments" ? (
          <>
            {/* First Payment */}
            <div
              className={`payment-summary__payment-item ${
                payment1Complete
                  ? "payment-summary__payment-item--completed"
                  : "payment-summary__payment-item--pending"
              }`}
            >
              <div className="payment-summary__payment-content">
                <div className="payment-summary__payment-header">
                  <span className="payment-summary__payment-title">
                    First Payment (35%)
                  </span>
                  {payment1Complete && (
                    <span className="payment-summary__payment-check">✓</span>
                  )}
                </div>
                <span className="payment-summary__payment-status">
                  {payment1Complete ? "Completed" : "Due upon registration"}
                </span>
              </div>
              <div className="payment-summary__payment-amount">
                {formData.paymentMethod === "credit" ? (
                  <>
                    <span className="payment-summary__amount-primary">
                      {formatCurrency(pricing.installmentAmountEUR, "€")}
                    </span>
                    <span className="payment-summary__amount-secondary">
                      {formatCurrency(pricing.installmentAmount)}
                    </span>
                  </>
                ) : (
                  <span className="payment-summary__amount-primary">
                    {formatCurrency(pricing.installmentAmount)}
                  </span>
                )}
              </div>
            </div>

            {/* Second Payment */}
            <div
              className={`payment-summary__payment-item ${
                payment2Complete
                  ? "payment-summary__payment-item--completed"
                  : "payment-summary__payment-item--pending"
              }`}
            >
              <div className="payment-summary__payment-content">
                <div className="payment-summary__payment-header">
                  <span className="payment-summary__payment-title">
                    Second Payment (65%)
                  </span>
                  {payment2Complete && (
                    <span className="payment-summary__payment-check">✓</span>
                  )}
                </div>
                <span className="payment-summary__payment-status">
                  {payment2Complete ? "Completed" : "Due closer to trip date"}
                </span>
              </div>
              <div className="payment-summary__payment-amount--single">
                <span className="payment-summary__amount-primary">
                  {formatCurrency(pricing.total - pricing.installmentAmount)}
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="payment-summary__total">
              <span className="payment-summary__total-label">
                Total Trip Cost
              </span>
              <span className="payment-summary__total-amount">
                {formatCurrency(pricing.total)}
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Full Payment */}
            <div
              className={`payment-summary__payment-item ${
                payment1Complete
                  ? "payment-summary__payment-item--completed"
                  : "payment-summary__payment-item--pending"
              }`}
            >
              <div className="payment-summary__payment-content">
                <div className="payment-summary__payment-header">
                  <span className="payment-summary__payment-title">
                    Full Payment
                  </span>
                  {payment1Complete && (
                    <span className="payment-summary__payment-check">✓</span>
                  )}
                </div>
                <span className="payment-summary__payment-status">
                  {payment1Complete ? "Completed" : "Due upon registration"}
                </span>
              </div>
              <div className="payment-summary__payment-amount">
                {formData.paymentMethod === "credit" ? (
                  <>
                    <span className="payment-summary__amount-primary">
                      {formatCurrency(pricing.installmentAmountEUR, "€")}
                    </span>
                    <span className="payment-summary__amount-secondary">
                      {formatCurrency(pricing.total)}
                    </span>
                  </>
                ) : (
                  <span className="payment-summary__amount-primary">
                    {formatCurrency(pricing.total)}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Credit Card Info */}
      {formData.paymentMethod === "credit" && (
        <div className="payment-summary__credit-info">
          <i className="fas fa-info-circle payment-summary__credit-icon"></i>
          <span className="payment-summary__credit-text">
            Credit card payments are processed in EUR
          </span>
        </div>
      )}
    </div>
  );
};

export default PaymentSummary;
