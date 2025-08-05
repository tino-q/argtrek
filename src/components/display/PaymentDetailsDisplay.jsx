// Payment Details Display Component
// Shows payment information after successful trip registration

import { useEffect, useState, useCallback, useRef } from "react";
import { getTravelerName, getEmail, getUSDToEURExchangeRate } from "../../utils/rsvpData";
import { FORM_FIELDS, EMAIL_CONFIG, APPS_SCRIPT_URL } from "../../utils/config";

import { copyToClipboard } from "../../utils/clipboard";
import PricingSummary from "../layout/PricingSummary";

import { buildPDfDoc } from "./generatePdf";
import "../../styles/PaymentDetailsDisplay.css";

import ProofOfPaymentUpload from "../form/ProofOfPaymentUpload";
import CreditCardWarning from "../common/CreditCardWarning";

import { BANK_DETAILS, CRYPTO_WALLETS, NETWORK_INFO } from "../../utils/config";

const PaymentDetailsDisplay = ({
  rsvpData,
  formData,
  pricing,
  submissionResult,
}) => {
  const travelerName = getTravelerName(rsvpData, formData);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const hasGeneratedRef = useRef(false);

  const generateAndUploadPDF = useCallback(() => {
    try {
      if (!pricing.installmentAmountEUR) {
        return;
      }

      const doc = buildPDfDoc(rsvpData, submissionResult, formData, pricing);

      // Generate PDF
      const generatedPdfBlob = doc.output("blob");

      // Store PDF URL in state for later download
      const generatedPdfUrl = URL.createObjectURL(generatedPdfBlob);
      setPdfUrl(generatedPdfUrl);
      setIsGenerating(false);

      // Upload to Google Drive in background (fire and forget)
      const cleanTravelerName = travelerName.replace(/[^a-zA-Z0-9]/g, "_");
      const orderNumber = submissionResult?.rowNumber || "DRAFT";
      const filename = `Order_${orderNumber}_${cleanTravelerName}.pdf`;

      // Convert PDF blob to base64 and upload in background
      const reader = new FileReader();
      reader.onload = async function () {
        const base64Data = reader.result.split(",")[1]; // Remove data:application/pdf;base64, prefix

        try {
          const formData = new FormData();
          formData.append("action", "upload_pdf");
          formData.append("pdfData", base64Data);
          formData.append("filename", filename);
          formData.append("clientEmail", getEmail(rsvpData));
          formData.append("travelerName", travelerName);

          const response = await fetch(APPS_SCRIPT_URL, {
            method: "POST",
            body: formData,
          });

          const result = await response.json();

          if (result.success) {
            console.log("PDF uploaded successfully:", result);
          } else {
            console.error("PDF upload failed:", result.error);
          }
        } catch (error) {
          console.error("Error uploading PDF:", error);
        }
      };

      reader.readAsDataURL(generatedPdfBlob);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setIsGenerating(false);
    }
  }, [
    rsvpData,
    formData,
    pricing,
    submissionResult,
    travelerName,
    pricing.installmentAmountEUR,
  ]);

  // Generate PDF on component mount (only once)
  useEffect(() => {
    if (
      !hasGeneratedRef.current &&
      !isGenerating &&
      !pdfUrl &&
      submissionResult?.rowNumber
    ) {
      hasGeneratedRef.current = true;
      setIsGenerating(true);
      generateAndUploadPDF();
    }
  }, [submissionResult?.rowNumber, isGenerating, pdfUrl, generateAndUploadPDF]);

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

  const downloadPDF = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  };

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
                        onClick={(e) => {
                          const networkKey =
                            formData[FORM_FIELDS.CRYPTO_NETWORK] === "ARB"
                              ? "ETH"
                              : formData[FORM_FIELDS.CRYPTO_NETWORK];
                          handleCopyClick(CRYPTO_WALLETS[networkKey], e);
                        }}
                        title="Copy wallet address"
                      >
                        <i className="fas fa-copy"></i>
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
          <button className="print-button" onClick={downloadPDF} type="button">
            📄 Download voucher
          </button>
          <p className="print-note">
            Generate and print your comprehensive trip registration summary with
            all confirmed flights, hotels, and payment details.
          </p>
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
