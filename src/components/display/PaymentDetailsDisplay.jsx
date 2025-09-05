// Payment Details Display Component
// Shows payment information after successful trip registration

import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import { useNotificationContext } from "../../hooks/useNotificationContext";
import { copyToClipboard } from "../../utils/clipboard";
import {
  FORM_FIELDS,
  EMAIL_CONFIG,
  BANK_DETAILS,
  CRYPTO_WALLETS,
  NETWORK_INFO,
  APPS_SCRIPT_URL,
} from "../../utils/config";
import { getTravelerName, getUSDToEURExchangeRate } from "../../utils/rsvpData";
import CreditCardWarning from "../common/CreditCardWarning";
import ProofOfPaymentUpload from "../form/ProofOfPaymentUpload";
import PricingSummary from "../layout/PricingSummary";

import "../../styles/PaymentDetailsDisplay.css";

const PaymentDetailsDisplay = ({
  rsvpData,
  formData,
  pricing,
  submissionResult,
}) => {
  const { email, password } = useAuth();
  const { showError } = useNotificationContext();
  const navigate = useNavigate();
  const travelerName = getTravelerName(rsvpData, formData);
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
    if (isDownloading) return;
    
    try {
      setIsDownloading(true);
      
      if (!email || !password) {
        console.error("Missing email or password for voucher download");
        showError("Missing authentication credentials");
        return;
      }

      // Generate cache key based on user email
      const cacheKey = `voucher_${email.toLowerCase()}`;
      
      // Try to get cached file first
      let cachedFileData = null;
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          cachedFileData = JSON.parse(cached);
          console.log("Using cached voucher file");
        }
      } catch (cacheError) {
        console.warn("Failed to read cached voucher:", cacheError);
        // Clear invalid cache entry
        localStorage.removeItem(cacheKey);
      }

      let result = cachedFileData;

      // If no cache, fetch from server
      if (!result) {
        const response = await fetch(
          `${APPS_SCRIPT_URL}?endpoint=download_voucher&email=${encodeURIComponent(
            email
          )}&password=${encodeURIComponent(password)}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        result = await response.json();

        if (!result.success) {
          console.error("Voucher download failed:", result.error);
          showError(result.error);
          return;
        }

        // Cache the successful result
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            success: result.success,
            fileName: result.fileName,
            fileData: result.fileData,
            mimeType: result.mimeType,
            cachedAt: Date.now()
          }));
          console.log("Voucher cached successfully");
        } catch (cacheError) {
          console.warn("Failed to cache voucher:", cacheError);
          // Continue with download even if caching fails
        }
      }

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

  return (
    <div className="container">
      <div className="payment-details-section">
        <div className="confirmation-header">
          <h2>🎉 Registration Confirmed!</h2>
          <p className="confirmation-message">
            Thank you {travelerName}! Your trip registration has been
            successfully submitted.
          </p>
          {submissionResult?.rowNumber && (
            <div className="order-number">
              Order Number: <strong>#{submissionResult.rowNumber}</strong>
            </div>
          )}
        </div>

        <PricingSummary pricing={pricing} formData={formData} />

        <div className="payment-section">
          <h3>💳 Payment Information</h3>

          {/* Bank Transfer Details */}
          {formData[FORM_FIELDS.PAYMENT_METHOD] === "bank" && (
            <div className="payment-content">
              <div className="important-notes">
                <h4>Important Instructions</h4>
                <ul>
                  <li>
                    Feel free to group transfers with other travelers to save on
                    fees, just make sure to reference all the travelers in the
                    transfer receipt
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
              <h4>Bank Transfer Details</h4>
              {BANK_DETAILS.map((detail) => (
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

          {/* Crypto Payment Details */}
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
                      {NETWORK_INFO[formData[FORM_FIELDS.CRYPTO_NETWORK]]?.name}
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
                      {NETWORK_INFO[formData[FORM_FIELDS.CRYPTO_NETWORK]]?.name}
                      )
                    </li>
                    <li>
                      Only send {formData[FORM_FIELDS.CRYPTO_CURRENCY]} to this
                      address
                    </li>
                    <li>
                      Include your full name in the transaction memo if possible
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

          {/* Credit Card Payment Details */}
          {formData[FORM_FIELDS.PAYMENT_METHOD] === "credit" && (
            <div className="payment-content">
              <h4>Credit Card Payment</h4>
              {submissionResult?.paymentLinkUrl ? (
                <div className="payment-link-section">
                  <p>
                    Your secure payment link is ready! Click the button below to
                    complete your payment.
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
                    Your secure payment link will be sent to your email address
                    within <strong>24 hours</strong> once Maddie processes your
                    registration.
                  </p>
                  <div className="important-notes">
                    <h4>What to Expect</h4>
                    <ul>
                      <li>
                        <strong>Timeline:</strong> Payment links distributed
                        ASAP
                      </li>
                      <li>
                        <strong>Email Delivery:</strong> Check spam/junk folder
                        if not received
                      </li>
                      <li>
                        <strong>Link Validity:</strong> Payment link active for
                        24 hours
                      </li>
                      <li>
                        <strong>Support:</strong> Contact Maddie for assistance
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
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }} />
                  Downloading...
                </>
              ) : (
                '📄 Download voucher'
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
          formData[FORM_FIELDS.PAYMENT_METHOD] === "bank" && (
            <div className="form-group center-upload">
              <ProofOfPaymentUpload
                name={formData[FORM_FIELDS.FIRST_NAME] || ""}
                surname={formData[FORM_FIELDS.LAST_NAME] || ""}
                orderNumber={submissionResult.rowNumber}
                installments={pricing.installments}
              />
            </div>
          )}

        {/* Crypto Proof of Payment Upload */}
        {submissionResult?.rowNumber &&
          formData[FORM_FIELDS.PAYMENT_METHOD] === "crypto" && (
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
