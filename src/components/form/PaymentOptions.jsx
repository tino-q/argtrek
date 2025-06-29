import { FORM_FIELDS } from "../../utils/config";
import { copyToClipboard } from "../../utils/clipboard";

const BANK_DETAILS = [
  { label: "Bank Name", value: "Revolut" },
  { label: "Account Holder", value: "SONSOLES RKT SL" },
  { label: "IBAN", value: "ES51 1583 0001 1093 9530 1696" },
  { label: "BIC/SWIFT", value: "CHASGB2L" },
  { label: "Currency", value: "USD" },
  {
    label: "Holder address",
    value: "CALLE BERNARDO LOPEZ GARCIA, 18 - BJ, 03013, ALICANTE",
  },
  { label: "Country", value: "Spain" },
];

const PaymentOptions = ({ formData, updateFormData }) => {
  const isBankTransfer = formData[FORM_FIELDS.PAYMENT_METHOD] === "bank";

  const handleCopyClick = async (value, event) => {
    const button = event.currentTarget;
    const success = await copyToClipboard(value);

    if (success) {
      // Add visual feedback
      button.classList.add("copied");
      setTimeout(() => {
        button.classList.remove("copied");
      }, 2000);
    }
  };

  return (
    <section className="form-section">
      <h2>
        <i className="fas fa-credit-card"></i> Payment Configuration
      </h2>

      {/* Payment Warning */}
      <div className="payment-warning">
        <i className="fas fa-exclamation-triangle"></i>
        <div>
          <h3>Important Payment Information</h3>
          <ul>
            <li>
              All rates are <strong>non-refundable</strong> - no exceptions
            </li>
            <li>
              <strong>Group Size Impact:</strong> Our rates are based on
              confirmed group size. Unregistering from the trip impacts pricing
              for all remaining participants
            </li>
            <li>
              <strong>Transferable Spots:</strong> While refunds are not
              possible, your spot is fully transferable to another person if
              your plans change
            </li>
            <li>
              <strong>Commitment Required:</strong> Please only register if
              you're committed to the full trip experience
            </li>
          </ul>
        </div>
      </div>

      {/* Payment Schedule */}
      <div className="form-group">
        <label className="section-label">Payment Schedule *</label>
        <div className="radio-group">
          <div className="radio-option">
            <input
              type="radio"
              id="fullPayment"
              name="paymentSchedule"
              value="full"
              checked={formData[FORM_FIELDS.PAYMENT_SCHEDULE] === "full"}
              onChange={(e) =>
                updateFormData(FORM_FIELDS.PAYMENT_SCHEDULE, e.target.value)
              }
              required
            />
            <label htmlFor="fullPayment">
              <div className="option-content">
                <h3>Single Payment</h3>
                <p className="description">Pay 100% now</p>
              </div>
            </label>
          </div>

          <div className="radio-option">
            <input
              type="radio"
              id="installments"
              name="paymentSchedule"
              value="installments"
              checked={
                formData[FORM_FIELDS.PAYMENT_SCHEDULE] === "installments"
              }
              onChange={(e) =>
                updateFormData(FORM_FIELDS.PAYMENT_SCHEDULE, e.target.value)
              }
              required
            />
            <label htmlFor="installments">
              <div className="option-content">
                <h3>2 Installments</h3>
                <p className="description">
                  35% now, remainder due September 15th
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="form-group">
        <label className="section-label">Payment Method *</label>
        <div className="radio-group">
          <div className="radio-option">
            <input
              type="radio"
              id="creditCard"
              name="paymentMethod"
              value="credit"
              checked={formData[FORM_FIELDS.PAYMENT_METHOD] === "credit"}
              onChange={(e) =>
                updateFormData(FORM_FIELDS.PAYMENT_METHOD, e.target.value)
              }
              required
            />
            <label htmlFor="creditCard">
              <div className="option-content">
                <h3>Credit Card</h3>
                <p className="price">+4% processing fee</p>
                <p className="description">Secure payment link sent to email</p>
              </div>
            </label>
          </div>

          <div className="radio-option">
            <input
              type="radio"
              id="bankTransfer"
              name="paymentMethod"
              value="bank"
              checked={formData[FORM_FIELDS.PAYMENT_METHOD] === "bank"}
              onChange={(e) =>
                updateFormData(FORM_FIELDS.PAYMENT_METHOD, e.target.value)
              }
              required
            />
            <label htmlFor="bankTransfer">
              <div className="option-content">
                <h3>Bank Transfer</h3>
                <p className="price">No additional fees</p>
                <p className="description">
                  Revolut recommended for free transfers
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Banking Details (Conditional) */}
      {isBankTransfer && (
        <div className="form-group">
          <div className="banking-info">
            <h3>
              <i className="fas fa-university"></i> Bank Transfer Details
            </h3>

            <div className="bank-details">
              {BANK_DETAILS.map((detail, index) => (
                <div key={index} className="detail-row">
                  <span className="label">{detail.label}:</span>
                  <div className="value-container">
                    <span className="value">{detail.value}</span>
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={(e) => handleCopyClick(detail.value, e)}
                      title="Copy to clipboard"
                    >
                      <i className="fas fa-copy"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Transfer Instructions */}
            <div className="transfer-instructions">
              <h4>
                <i className="fas fa-exclamation-circle"></i> Important Transfer
                Instructions
              </h4>
              <ul>
                <li>
                  <strong>Fee Coverage:</strong> Select the option to cover ALL
                  transfer fees on your end (often listed as "OUR" in your
                  bank's transfer settings)
                </li>
                <li>
                  <strong>Reference:</strong> Please include your full name in
                  the transfer reference
                </li>
                <li>
                  <strong>Note:</strong> Any unaccounted fees will be deducted
                  from your payment
                </li>
              </ul>
            </div>

            {/* Revolut Recommendation */}
            <div className="revolut-recommendation">
              <div className="revolut-highlight">
                <i className="fas fa-star"></i>
                <div>
                  <h4>Recommended: Use Revolut for Free Transfers</h4>
                  <p>
                    Transfers between Revolut users are free and instant, even
                    internationally
                  </p>
                  <a
                    href="https://www.revolut.com/en-US/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="revolut-link"
                  >
                    Create Revolut Account{" "}
                    <i className="fas fa-external-link-alt"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Argentine Citizen Checkbox */}
      <div className="form-group">
        <div
          className="checkbox-option"
          onClick={() =>
            updateFormData(
              FORM_FIELDS.ARGENTINE_CITIZEN,
              !formData[FORM_FIELDS.ARGENTINE_CITIZEN]
            )
          }
          style={{ cursor: "pointer" }}
        >
          <input
            type="checkbox"
            id="argentineCitizen"
            name="argentineCitizen"
            checked={formData[FORM_FIELDS.ARGENTINE_CITIZEN] || false}
            onChange={(e) =>
              updateFormData(FORM_FIELDS.ARGENTINE_CITIZEN, e.target.checked)
            }
            style={{ pointerEvents: "none" }}
          />
          <label
            htmlFor="argentineCitizen"
            className="checkbox-label"
            style={{ pointerEvents: "none" }}
          >
            <strong>I have Argentine citizenship</strong>
            <p className="help-text">
              Argentine citizens are subject to 21% VAT on all services
            </p>
          </label>
        </div>
      </div>
    </section>
  );
};

export default PaymentOptions;
