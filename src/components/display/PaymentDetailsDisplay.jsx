// Payment Details Display Component
// Shows payment information after successful trip registration

import { getTravelerName } from "../../utils/rsvpData";
import { FORM_FIELDS } from "../../utils/config";
import { copyToClipboard } from "../../utils/clipboard";
import PricingSummary from "../layout/PricingSummary";
import "../../styles/PaymentDetailsDisplay.css";

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

const CRYPTO_WALLETS = {
  ETH: {
    USDT: "0x1234567890123456789012345678901234567890",
    USDC: "0x1234567890123456789012345678901234567890",
  },
  ARB: {
    USDT: "0x1234567890123456789012345678901234567890",
    USDC: "0x1234567890123456789012345678901234567890",
  },
  SOL: {
    USDT: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    USDC: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  },
};

const NETWORK_INFO = {
  ETH: {
    name: "Ethereum",
    symbol: "ETH",
    color: "#627EEA",
    icon: "fab fa-ethereum",
  },
  ARB: {
    name: "Arbitrum",
    symbol: "ARB",
    color: "#28A0F0",
    icon: "fas fa-layer-group",
  },
  SOL: {
    name: "Solana",
    symbol: "SOL",
    color: "#9945FF",
    icon: "fas fa-sun",
  },
};

const PaymentDetailsDisplay = ({
  rsvpData,
  formData,
  pricing,
  onLogout,
  submissionResult,
}) => {
  const travelerName = getTravelerName(rsvpData);

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
    <div className="payment-details-section">
      <div className="confirmation-header">
        <h2>🎉 Registration Confirmed!</h2>
        <p className="confirmation-message">
          Thank you {travelerName}! Your trip registration has been successfully
          submitted.
        </p>
        {submissionResult?.rowNumber && (
          <div className="order-number">
            <p>
              Order Number: <strong>#{submissionResult.rowNumber}</strong>
            </p>
          </div>
        )}
      </div>

      <PricingSummary pricing={pricing} formData={formData} />

      <div className="payment-instructions" style={{ marginTop: "2rem" }}>
        <h3>💳 Payment Information</h3>
        <div className="payment-method-details">
          {/* Bank Transfer Details - Only show if bank transfer was selected */}
          {formData[FORM_FIELDS.PAYMENT_METHOD] === "bank" && (
            <div className="bank-payment-section">
              <h4>Bank Transfer Details</h4>
              <div className="banking-info">
                <div className="bank-details">
                  {BANK_DETAILS.map((detail, index) => (
                    <div key={index} className="detail-row">
                      <span className="label">{detail.label}:</span>
                      <div className="value-container">
                        <span
                          className="value"
                          data-type={
                            detail.label.toLowerCase().includes("iban")
                              ? "iban"
                              : undefined
                          }
                        >
                          {detail.value}
                        </span>
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
                    <i className="fas fa-exclamation-circle"></i> Important
                    Transfer Instructions
                  </h4>
                  <ul>
                    <li>
                      <strong>Fee Coverage:</strong> Select the option to cover
                      ALL transfer fees on your end (often listed as "OUR" in
                      your bank's transfer settings)
                    </li>
                    <li>
                      <strong>Reference:</strong> Please include your full name
                      in the transfer reference
                    </li>
                    <li>
                      <strong>Note:</strong> Any unaccounted fees will be
                      deducted from your payment
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
                        Transfers between Revolut users are free and instant,
                        even internationally
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

          {/* Crypto Payment Details - Only show if crypto was selected */}
          {formData[FORM_FIELDS.PAYMENT_METHOD] === "crypto" &&
            formData[FORM_FIELDS.CRYPTO_CURRENCY] &&
            formData[FORM_FIELDS.CRYPTO_NETWORK] && (
              <div className="crypto-payment-section">
                <h4>Cryptocurrency Payment Details</h4>
                <div className="wallet-info">
                  <div className="wallet-address-container">
                    <div className="wallet-details">
                      <div className="detail-row">
                        <span className="label">Network:</span>
                        <span
                          className="value"
                          style={{
                            color:
                              NETWORK_INFO[formData[FORM_FIELDS.CRYPTO_NETWORK]]
                                ?.color,
                          }}
                        >
                          {
                            NETWORK_INFO[formData[FORM_FIELDS.CRYPTO_NETWORK]]
                              ?.name
                          }
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Currency:</span>
                        <span className="value">
                          {formData[FORM_FIELDS.CRYPTO_CURRENCY]}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="label">
                          Address:
                          <button
                            type="button"
                            className="copy-btn"
                            onClick={(e) =>
                              handleCopyClick(
                                CRYPTO_WALLETS[
                                  formData[FORM_FIELDS.CRYPTO_NETWORK]
                                ]?.[formData[FORM_FIELDS.CRYPTO_CURRENCY]],
                                e
                              )
                            }
                            title="Copy wallet address"
                          >
                            <i className="fas fa-copy"></i>
                          </button>
                        </span>
                        <span className="value crypto-address">
                          {
                            CRYPTO_WALLETS[
                              formData[FORM_FIELDS.CRYPTO_NETWORK]
                            ]?.[formData[FORM_FIELDS.CRYPTO_CURRENCY]]
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Crypto Instructions */}
                  <div className="crypto-instructions">
                    <h4>
                      <i className="fas fa-exclamation-circle"></i> Important
                      Instructions
                    </h4>
                    <ul>
                      <li>
                        <strong>Network Verification:</strong> Ensure you're
                        sending on the correct network (
                        {
                          NETWORK_INFO[formData[FORM_FIELDS.CRYPTO_NETWORK]]
                            ?.name
                        }
                        )
                      </li>
                      <li>
                        <strong>Currency Match:</strong> Only send{" "}
                        {formData[FORM_FIELDS.CRYPTO_CURRENCY]} to this address
                      </li>
                      <li>
                        <strong>Transaction Reference:</strong> Include your
                        full name in the transaction memo if possible
                      </li>
                      <li>
                        <strong>Confirmation:</strong> Please send transaction
                        hash after payment for verification
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
        </div>

        <div className="payment-schedule">
          <h4>Payment Schedule</h4>
          <div className="schedule-details">
            {formData.paymentSchedule === "full" ? (
              <p>
                Full payment is due <strong>15th September</strong>
              </p>
            ) : (
              <div>
                <p>
                  50% deposit due: <strong>Within 7 days</strong>
                </p>
                <p>
                  Remaining balance due:{" "}
                  <strong>15 days before departure</strong>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="total-amount">
          <h4>Total Amount</h4>
          <p className="amount">
            <strong>USD ${pricing.total.toLocaleString()}</strong>
          </p>
        </div>
      </div>

      <div className="next-steps">
        <h3>📋 Next Steps</h3>
        <ul>
          <li>Complete payment using your preferred method above</li>
          <li>
            Send payment confirmation to{" "}
            <strong>maddie@argentinatrek.com</strong>
          </li>
          <li>You'll receive a detailed itinerary within 48 hours</li>
          <li>Passport and visa requirements will be sent separately</li>
        </ul>
      </div>

      <div className="contact-info">
        <h3>📞 Questions?</h3>
        <p>Contact Maddie at:</p>
        <p>
          Email: <strong>maddie@argentinatrek.com</strong>
        </p>
        <p>
          WhatsApp: <strong>+54 9 11 1234-5678</strong>
        </p>
      </div>

      <div className="logout-section">
        <button className="logout-button" onClick={onLogout} type="button">
          Complete Registration
        </button>
        <p className="logout-note">
          You can now close this page. All details have been saved and emailed
          to you.
        </p>
      </div>
    </div>
  );
};

export default PaymentDetailsDisplay;
