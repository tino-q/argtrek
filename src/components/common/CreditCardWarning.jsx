import React from "react";

const CreditCardWarning = ({ paymentSchedule, exchangeRate }) => {
  return (
    <div className="payment-warning">
      <i className="fas fa-exclamation-triangle"></i>
      <div>
        <h3>Important</h3>
        <ul>
          <li>
            Credit card payments are to be denominated in EUR, as we are
            a business operating from 🇪🇸 Spain.
          </li>
          <li>
            Bank transfers & crypto payments are denominated and handled in USD.
          </li>
          <li>Payment link supports local currencies</li>
          {exchangeRate && (
            <li>
              <div className="exchange-rate-note">
                Current exchange rate: 1 USD = {exchangeRate} EUR
              </div>
            </li>
          )}
          <li>
            <div className="variable-rate-warning">
              The final amount charged in your local currency may vary slightly
              depending on your credit card’s exchange rate.
            </div>
          </li>
          <li>
            <div className="variable-rate-warning">
              The quoted rate is valid for 48 hours while we await your payment.
              Once payment is made, the rate is locked in and cannot change
            </div>
          </li>
          {paymentSchedule === "installments" && (
            <li>
              <div className="variable-rate-warning">
                The rate for your second installment will be determined closer
                to the due date.
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default CreditCardWarning;
