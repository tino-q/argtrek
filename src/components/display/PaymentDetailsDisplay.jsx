// Payment Details Display Component
// Shows payment information after successful trip registration

import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import { useNotificationContext } from "../../hooks/useNotificationContext";
import { downloadVoucher } from "../../utils/api";
import { copyToClipboard } from "../../utils/clipboard";
import {
  FORM_FIELDS,
  EMAIL_CONFIG,
  CRYPTO_WALLETS,
  NETWORK_INFO,
  REVOLUT_BANK_DETAILS,
  FACEBANK_BANK_DETAILS,
} from "../../utils/config";
import { getUSDToEURExchangeRate } from "../../utils/rsvpData";
import CreditCardWarning from "../common/CreditCardWarning";
import ProofOfPaymentUpload from "../form/ProofOfPaymentUpload";
import PricingSummary from "../layout/PricingSummary";
import "../../styles/PaymentSummary.css";

import "../../styles/PaymentDetailsDisplay.css";

const PaymentDetailsDisplay = ({
  rsvpData,
  formData,
  pricing,
  submissionResult,
}) => {
  const { email, password } = useAuth();

  const isRevolutBank =
    submissionResult?.row?.["bankAccount"]?.trim()?.toLowerCase() === "revolut";

  const { showError } = useNotificationContext();
  const navigate = useNavigate();
  // const travelerName = getTravelerName(rsvpData, formData);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCopyClick = useCallback(async (value, event) => {
    const button = event.currentTarget;
    const success = await copyToClipboard(value);

    if (success) {
      // Add visual feedback
      button.classList.add("copied");
      setTimeout(() => {
        button.classList.remove("copied");
      }, 2000);
    }
  }, []);

  const downloadPDF = useCallback(async () => {
    if (isDownloading) {
      return;
    }

    try {
      setIsDownloading(true);

      if (!email || !password) {
        console.error("Missing email or password for voucher download");
        showError("Missing authentication credentials");
        return;
      }

      const result = await downloadVoucher(email, password);

      // Convert base64 to blob and trigger download
      const binaryString = atob(result.fileData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: result.mimeType });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = result.fileName;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading voucher:", error);
      showError("Failed to download voucher. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }, [email, password, showError, isDownloading]);

  const handleTermsClick = useCallback(() => {
    navigate("/terms");
  }, [navigate]);

  const handleBankDetailsClick = useCallback(
    (detail) => (e) => handleCopyClick(detail.value, e),
    [handleCopyClick]
  );

  const handleCryptoWalletClick = useCallback(
    (e) => {
      const networkKey =
        formData[FORM_FIELDS.CRYPTO_NETWORK] === "ARB"
          ? "ETH"
          : formData[FORM_FIELDS.CRYPTO_NETWORK];
      handleCopyClick(CRYPTO_WALLETS[networkKey], e);
    },
    [formData, handleCopyClick]
  );

  // const payment1Complete =
  //   submissionResult?.row?.["PAYMENT_1"].toString().trim().toLowerCase() ===
  //   "true"
  //     ? true
  //     : false;

  // const payment2Complete =
  //   submissionResult?.row?.["PAYMENT_2"].toString().trim().toLowerCase() ===
  //   "true"
  //     ? true
  //     : false;

  // const isFullyPaid =
  //   formData.paymentSchedule === "full"
  //     ? payment1Complete
  //     : payment1Complete && payment2Complete;

  // const formatCurrency = (amount, currency = "$") => {
  //   return `${currency}${Math.round(amount).toLocaleString()}`;
  // };

  // const getPaymentMethodDisplay = () => {
  //   switch (formData.paymentMethod) {
  //     case "credit":
  //       return "Credit Card";
  //     case "bank":
  //       return "Bank Transfer";
  //     case "crypto":
  //       return "Cryptocurrency";
  //     default:
  //       return "";
  //   }
  // };

  // const getScheduleDisplay = () => {
  //   return formData.paymentSchedule === "full"
  //     ? "Full Payment"
  //     : "Installments";
  // };

  return (
    <div className="container">
      <div className="payment-details-section">
        <div className="confirmation-header">
          <div className="order-number">
            Order Number: <strong>#{submissionResult.rowNumber}</strong>
          </div>
        </div>

        <PricingSummary pricing={pricing} />

        {false ? (
          <div className="payment-section">
            <h3>💳 Payment Information</h3>

            {formData[FORM_FIELDS.PAYMENT_METHOD] === "bank" && (
              <div className="payment-content">
                <div className="important-notes">
                  <h4>Important Instructions</h4>
                  <ul>
                    <li>
                      Feel free to group transfers with other travelers to save
                      on fees, just make sure to reference all the travelers in
                      the transfer receipt
                    </li>
                    <li>Include your full name in the transfer reference</li>
                    <li>
                      Configure the transfer to cover all fees on your end,
                      otherwise any unaccounted fees will be deducted from your
                      payment
                    </li>
                    <li>
                      Send transfer confirmation to{" "}
                      <a href={`mailto:${EMAIL_CONFIG.MADDIE}`}>
                        {EMAIL_CONFIG.MADDIE}
                      </a>
                    </li>
                  </ul>

                  <div className="revolut-note">
                    <strong>💡 Tip:</strong> Use{" "}
                    <a
                      href="https://revolut.com/referral/?referral-code=mbaklayan!JUN2-25-VR-ES-AE&geo-redirect"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Revolut
                    </a>{" "}
                    for free international transfers
                  </div>
                </div>
                <br />
                {!isRevolutBank && (
                  <div
                    className="important-notes"
                    style={{
                      backgroundColor: "#fff3cd",
                      borderColor: "#ffc107",
                    }}
                  >
                    <h4>⚠️ Important: ACH vs Wire Transfer</h4>
                    <ul>
                      <li>
                        <strong>Strongly Recommended:</strong> Use ACH transfer
                        to avoid additional fees
                      </li>
                      <li>
                        <strong>Wire Transfer Fee:</strong> If you must use a
                        wire transfer, you must add an additional{" "}
                        <strong>$15 USD</strong> to cover our incoming wire fee
                      </li>
                    </ul>
                  </div>
                )}
                <br />
                <h4>Bank Transfer Details</h4>
                {(isRevolutBank
                  ? REVOLUT_BANK_DETAILS
                  : FACEBANK_BANK_DETAILS
                ).map((detail) => (
                  <div key={detail.label} className="detail-row">
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
                        onClick={handleBankDetailsClick(detail)}
                        title="Copy to clipboard"
                      >
                        <i className="fas fa-copy" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {formData[FORM_FIELDS.PAYMENT_METHOD] === "crypto" &&
              formData[FORM_FIELDS.CRYPTO_CURRENCY] &&
              formData[FORM_FIELDS.CRYPTO_NETWORK] && (
                <div className="payment-content">
                  <h4>Cryptocurrency Payment Details</h4>
                  <div className="crypto-details">
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
                      <span className="label">Wallet Address:</span>
                      <div className="value-container">
                        <span className="value crypto-address">
                          {(() => {
                            const networkKey =
                              formData[FORM_FIELDS.CRYPTO_NETWORK] === "ARB"
                                ? "ETH"
                                : formData[FORM_FIELDS.CRYPTO_NETWORK];
                            return CRYPTO_WALLETS[networkKey];
                          })()}
                        </span>
                        <button
                          type="button"
                          className="copy-btn"
                          onClick={handleCryptoWalletClick}
                          title="Copy wallet address"
                        >
                          <i className="fas fa-copy" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="important-notes">
                    <h4>Important Instructions</h4>
                    <ul>
                      <li>
                        Ensure you're sending on the correct network (
                        {
                          NETWORK_INFO[formData[FORM_FIELDS.CRYPTO_NETWORK]]
                            ?.name
                        }
                        )
                      </li>
                      <li>
                        Only send {formData[FORM_FIELDS.CRYPTO_CURRENCY]} to
                        this address
                      </li>
                      <li>
                        Include your full name in the transaction memo if
                        possible
                      </li>
                      <li>
                        Send transaction hash and confirmation to{" "}
                        <a href={`mailto:${EMAIL_CONFIG.MADDIE}`}>
                          {EMAIL_CONFIG.MADDIE}
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

            {formData[FORM_FIELDS.PAYMENT_METHOD] === "credit" && (
              <div className="payment-content">
                <h4>Credit Card Payment</h4>
                {submissionResult?.paymentLinkUrl ? (
                  <div className="payment-link-section">
                    <p>
                      Your secure payment link is ready! Click the button below
                      to complete your payment.
                    </p>
                    <a
                      href={submissionResult.paymentLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="payment-link-button"
                    >
                      Proceed to Payment
                    </a>
                  </div>
                ) : (
                  <>
                    <p className="payment-timeline">
                      Your secure payment link will be sent to your email
                      address within <strong>24 hours</strong> once Maddie
                      processes your registration.
                    </p>
                    <div className="important-notes">
                      <h4>What to Expect</h4>
                      <ul>
                        <li>
                          <strong>Timeline:</strong> Payment links distributed
                          ASAP
                        </li>
                        <li>
                          <strong>Email Delivery:</strong> Check spam/junk
                          folder if not received
                        </li>
                        <li>
                          <strong>Link Validity:</strong> Payment link active
                          for 24 hours
                        </li>
                        <li>
                          <strong>Support:</strong> Contact Maddie for
                          assistance
                          <ul>
                            <li>
                              <a
                                href="https://wa.me/5491169729783"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                WhatsApp
                              </a>
                            </li>
                            <li>
                              Email: <strong>{EMAIL_CONFIG.MADDIE}</strong>
                            </li>
                          </ul>
                        </li>
                      </ul>
                    </div>
                    <br />
                    <CreditCardWarning
                      paymentSchedule={formData[FORM_FIELDS.PAYMENT_SCHEDULE]}
                      exchangeRate={getUSDToEURExchangeRate(rsvpData)}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div />
        )}

        <div className="print-section">
          <div className="action-buttons">
            <button
              className="payment-download-btn"
              onClick={downloadPDF}
              type="button"
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <i
                    className="fas fa-spinner fa-spin"
                    style={{ marginRight: "8px" }}
                  />
                  Downloading...
                </>
              ) : (
                "📄 Download voucher"
              )}
            </button>
            <button
              className="payment-terms-btn"
              onClick={handleTermsClick}
              type="button"
            >
              📋 Terms & Conditions
            </button>
          </div>
        </div>

        {/* Bank Transfer Proof of Payment Upload */}
        {submissionResult?.rowNumber &&
          ["bank", "crypto"].includes(formData[FORM_FIELDS.PAYMENT_METHOD]) && (
            <div className="form-group center-upload">
              <ProofOfPaymentUpload
                name={formData[FORM_FIELDS.FIRST_NAME] || ""}
                surname={formData[FORM_FIELDS.LAST_NAME] || ""}
                orderNumber={submissionResult.rowNumber}
                installments={pricing.installments}
              />
            </div>
          )}
      </div>
    </div>
  );
};

export default PaymentDetailsDisplay;

// <div className="payment-summary__header">
// <h3 className="payment-summary__title">Payment Status</h3>
// <div className="payment-summary__header-right">
//   <span
//     className={`payment-summary__status ${
//       isFullyPaid
//         ? "payment-summary__status--paid"
//         : "payment-summary__status--pending"
//     }`}
//   >
//     {isFullyPaid ? "✓ Fully Paid" : "Pending"}
//   </span>
// </div>
// </div>

// {/* Payment Info */}
// <div className="payment-summary__info">
// <div className="payment-summary__info-item">
//   <span className="payment-summary__info-label">Method</span>
//   <span className="payment-summary__info-value">
//     {getPaymentMethodDisplay()}
//   </span>
// </div>
// <div className="payment-summary__info-item">
//   <span className="payment-summary__info-label">Schedule</span>
//   <span className="payment-summary__info-value">
//     {getScheduleDisplay()}
//   </span>
// </div>
// </div>

// {/* Payment Breakdown */}
// <div className="payment-summary__breakdown">
// {formData.paymentSchedule === "installments" ? (
//   <>
//     {/* First Payment */}
//     <div
//       className={`payment-summary__payment-item ${
//         payment1Complete
//           ? "payment-summary__payment-item--completed"
//           : "payment-summary__payment-item--pending"
//       }`}
//     >
//       <div className="payment-summary__payment-content">
//         <div className="payment-summary__payment-header">
//           <span className="payment-summary__payment-title">
//             First Payment (35%)
//           </span>
//           {payment1Complete && (
//             <span className="payment-summary__payment-check">
//               ✓
//             </span>
//           )}
//         </div>
//         <span className="payment-summary__payment-status">
//           {payment1Complete ? "Completed" : "Due upon registration"}
//         </span>
//       </div>
//       <div className="payment-summary__payment-amount">
//         {formData.paymentMethod === "credit" ? (
//           <>
//             <span className="payment-summary__amount-primary">
//               {formatCurrency(pricing.installmentAmountEUR, "€")}
//             </span>
//             <span className="payment-summary__amount-secondary">
//               {formatCurrency(pricing.installmentAmount)}
//             </span>
//           </>
//         ) : (
//           <span className="payment-summary__amount-primary">
//             {formatCurrency(pricing.installmentAmount)}
//           </span>
//         )}
//       </div>
//     </div>

//     {/* Second Payment */}
//     <div
//       className={`payment-summary__payment-item ${
//         payment2Complete
//           ? "payment-summary__payment-item--completed"
//           : "payment-summary__payment-item--pending"
//       }`}
//     >
//       <div className="payment-summary__payment-content">
//         <div className="payment-summary__payment-header">
//           <span className="payment-summary__payment-title">
//             Second Payment (65%)
//           </span>
//           {payment2Complete && (
//             <span className="payment-summary__payment-check">
//               ✓
//             </span>
//           )}
//         </div>
//         <span className="payment-summary__payment-status">
//           {payment2Complete
//             ? "Completed"
//             : "Due closer to trip date"}
//         </span>
//       </div>
//       <div className="payment-summary__payment-amount--single">
//         <span className="payment-summary__amount-primary">
//           {formatCurrency(
//             pricing.total - pricing.installmentAmount
//           )}
//         </span>
//       </div>
//     </div>

//     {/* Total */}
//     <div className="payment-summary__total">
//       <span className="payment-summary__total-label">
//         Total Trip Cost
//       </span>
//       <span className="payment-summary__total-amount">
//         {formatCurrency(pricing.total)}
//       </span>
//     </div>
//   </>
// ) : (
//   <>
//     {/* Full Payment */}
//     <div
//       className={`payment-summary__payment-item ${
//         payment1Complete
//           ? "payment-summary__payment-item--completed"
//           : "payment-summary__payment-item--pending"
//       }`}
//     >
//       <div className="payment-summary__payment-content">
//         <div className="payment-summary__payment-header">
//           <span className="payment-summary__payment-title">
//             Full Payment
//           </span>
//           {payment1Complete && (
//             <span className="payment-summary__payment-check">
//               ✓
//             </span>
//           )}
//         </div>
//         <span className="payment-summary__payment-status">
//           {payment1Complete ? "Completed" : "Due upon registration"}
//         </span>
//       </div>
//       <div className="payment-summary__payment-amount">
//         {formData.paymentMethod === "credit" ? (
//           <>
//             <span className="payment-summary__amount-primary">
//               {formatCurrency(pricing.installmentAmountEUR, "€")}
//             </span>
//             <span className="payment-summary__amount-secondary">
//               {formatCurrency(pricing.total)}
//             </span>
//           </>
//         ) : (
//           <span className="payment-summary__amount-primary">
//             {formatCurrency(pricing.total)}
//           </span>
//         )}
//       </div>
//     </div>
//   </>
// )}
// </div>
