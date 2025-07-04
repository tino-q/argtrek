// Payment Details Display Component
// Shows payment information after successful trip registration

import {
  getTravelerName,
  getEmail,
  getPlusOneName,
  getBasePrice,
  getPrivateRoomUpgradePrice,
  getTripItinerary,
} from "../../utils/rsvpData";
import { FORM_FIELDS, EMAIL_CONFIG, ACTIVITIES } from "../../utils/config";
import { copyToClipboard } from "../../utils/clipboard";
import PricingSummary from "../layout/PricingSummary";
import jsPDF from "jspdf";
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
    USDT: "0xB15E94F7eDD9bB738E5Ba0991ee173E4Fb40d6B3",
    USDC: "0xB15E94F7eDD9bB738E5Ba0991ee173E4Fb40d6B3",
  },
  ARB: {
    USDT: "0xB15E94F7eDD9bB738E5Ba0991ee173E4Fb40d6B3",
    USDC: "0xB15E94F7eDD9bB738E5Ba0991ee173E4Fb40d6B3",
  },
  SOL: {
    USDT: "6GtbPf58peWCT2EQEpbPdvAx4XuRAGmCW4vQszt1vqjy",
    USDC: "6GtbPf58peWCT2EQEpbPdvAx4XuRAGmCW4vQszt1vqjy",
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
  submissionResult,
}) => {
  const travelerName = getTravelerName(rsvpData, formData);

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

  const generatePDFSummary = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const maxYPosition = pageHeight - 40; // Leave space for footer
    let yPosition = margin;

    // Get trip itinerary data
    const tripItinerary = getTripItinerary(rsvpData);

    // Helper function to check if we need a new page
    const checkPageBreak = (requiredSpace = 10) => {
      if (yPosition + requiredSpace > maxYPosition) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(
      "Argentina Trek - Trip Registration Summary",
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );
    yPosition += 15;

    // Order Number
    if (submissionResult?.rowNumber) {
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Order #${submissionResult.rowNumber}`,
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );
      yPosition += 15;
    }

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Generated: ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );
    yPosition += 20;

    // Customer Information
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text("Customer Information", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Primary Traveler: ${travelerName}`, 20, yPosition);
    yPosition += 5;

    const plusOneName = getPlusOneName(rsvpData);
    if (plusOneName) {
      doc.text(`Plus One: ${plusOneName}`, 20, yPosition);
      yPosition += 5;
    }

    doc.text(`Email: ${getEmail(rsvpData)}`, 20, yPosition);
    yPosition += 5;

    // Confirmed Flights
    if (tripItinerary.flights && tripItinerary.flights.length > 0) {
      checkPageBreak(50);
      yPosition += 15;
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("Confirmed Flights", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);

      tripItinerary.flights.forEach((flight) => {
        checkPageBreak(30);
        doc.text(`Flight ${flight.code} - ${flight.airline}`, 20, yPosition);
        yPosition += 5;
        doc.text(`  ${flight.route}`, 20, yPosition);
        yPosition += 5;
        doc.text(
          `  ${flight.date} - Departure: ${flight.departure.time} (${flight.departure.airport})`,
          20,
          yPosition
        );
        yPosition += 5;
        doc.text(
          `  Arrival: ${flight.arrival.time} (${flight.arrival.airport})`,
          20,
          yPosition
        );
        yPosition += 5;
        doc.text(
          `  Duration: ${flight.duration} - Aircraft: ${flight.aircraft}`,
          20,
          yPosition
        );
        yPosition += 8;
      });
    }

    // Confirmed Hotels
    if (
      tripItinerary.accommodations &&
      tripItinerary.accommodations.length > 0
    ) {
      checkPageBreak(50);
      yPosition += 10;
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("Confirmed Hotels", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);

      tripItinerary.accommodations.forEach((hotel) => {
        checkPageBreak(25);
        doc.text(`${hotel.hotelName} - ${hotel.location}`, 20, yPosition);
        yPosition += 5;
        doc.text(`  ${hotel.address}`, 20, yPosition);
        yPosition += 5;
        const nightsText =
          hotel.nights.length === 1
            ? hotel.nights[0]
            : `${hotel.nights[0]} - ${hotel.nights[hotel.nights.length - 1]}`;
        doc.text(`  Dates: ${nightsText}`, 20, yPosition);
        yPosition += 8;
      });
    }

    // Trip Details
    checkPageBreak(40);
    yPosition += 10;
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text("Trip Details", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Base Trip Price: $${getBasePrice(rsvpData)}`, 20, yPosition);
    yPosition += 5;

    // Accommodations
    if (formData[FORM_FIELDS.PRIVATE_ROOM_UPGRADE]) {
      doc.text(
        `Private Room Upgrade: $${getPrivateRoomUpgradePrice(rsvpData)}`,
        20,
        yPosition
      );
      yPosition += 5;
    }

    // Activities
    const activities = [];
    if (formData[FORM_FIELDS.RAFTING]) {
      activities.push({
        name: ACTIVITIES.rafting.name,
        price: ACTIVITIES.rafting.price,
      });
    }
    if (formData[FORM_FIELDS.HORSEBACK]) {
      activities.push({
        name: ACTIVITIES.horseback.name,
        price: ACTIVITIES.horseback.price,
      });
    }
    if (formData[FORM_FIELDS.COOKING]) {
      activities.push({
        name: ACTIVITIES.cooking.name,
        price: ACTIVITIES.cooking.price,
      });
    }

    if (activities.length > 0) {
      checkPageBreak(15 + activities.length * 5);
      yPosition += 5;
      doc.text("Selected Activities:", 20, yPosition);
      yPosition += 5;
      activities.forEach((activity) => {
        doc.text(`• ${activity.name}: $${activity.price}`, 25, yPosition);
        yPosition += 5;
      });
    }

    // Pricing Summary
    checkPageBreak(50);
    yPosition += 10;
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text("Pricing Summary", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Subtotal: $${pricing.subtotal}`, 20, yPosition);
    yPosition += 5;

    if (pricing.vatAmount > 0) {
      doc.text(`VAT (21%): $${pricing.vatAmount}`, 20, yPosition);
      yPosition += 5;
    }

    if (pricing.processingFee > 0) {
      doc.text(`Processing Fee (4%): $${pricing.processingFee}`, 20, yPosition);
      yPosition += 5;
    }

    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(`Total: $${pricing.total}`, 20, yPosition);
    yPosition += 5;

    // Payment Information
    checkPageBreak(60);
    yPosition += 15;
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text("Payment Information", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    const paymentMethod = formData[FORM_FIELDS.PAYMENT_METHOD];
    if (paymentMethod === "bank") {
      doc.text("Payment Method: Bank Transfer", 20, yPosition);
      yPosition += 10;

      // Bank Details
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text("Bank Transfer Details:", 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      BANK_DETAILS.forEach((detail) => {
        checkPageBreak(5);
        doc.text(`${detail.label}: ${detail.value}`, 20, yPosition);
        yPosition += 5;
      });

      // Transfer Instructions
      checkPageBreak(40);
      yPosition += 5;
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text("Important Transfer Instructions:", 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(
        "• Fee Coverage: Select option to cover ALL transfer fees",
        20,
        yPosition
      );
      yPosition += 5;
      doc.text(
        "  (often listed as 'OUR' in your bank's transfer settings)",
        25,
        yPosition
      );
      yPosition += 5;
      doc.text(
        "• Reference: Include your full name in the transfer reference",
        20,
        yPosition
      );
      yPosition += 5;
      doc.text(
        "• Note: Any unaccounted fees will be deducted from payment",
        20,
        yPosition
      );
      yPosition += 5;
      doc.text(
        "• Confirmation: Send transfer receipt to Maddie via email to " +
          EMAIL_CONFIG.MADDIE,
        20,
        yPosition
      );
      yPosition += 8;

      // Revolut Recommendation
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.text("Recommended: Use Revolut for Free Transfers", 20, yPosition);
      yPosition += 5;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(
        "Transfers between Revolut users are free and instant",
        20,
        yPosition
      );
      yPosition += 5;
      doc.text("Create account at: https://www.revolut.com/", 20, yPosition);
      yPosition += 5;
    } else if (paymentMethod === "crypto") {
      doc.text("Payment Method: Cryptocurrency", 20, yPosition);
      yPosition += 10;

      // Crypto Details
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text("Cryptocurrency Payment Details:", 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(
        `Network: ${NETWORK_INFO[formData[FORM_FIELDS.CRYPTO_NETWORK]]?.name || formData[FORM_FIELDS.CRYPTO_NETWORK]}`,
        20,
        yPosition
      );
      yPosition += 5;
      doc.text(
        `Currency: ${formData[FORM_FIELDS.CRYPTO_CURRENCY]}`,
        20,
        yPosition
      );
      yPosition += 5;

      // Wallet Address
      const walletAddress =
        CRYPTO_WALLETS[formData[FORM_FIELDS.CRYPTO_NETWORK]]?.[
          formData[FORM_FIELDS.CRYPTO_CURRENCY]
        ];
      if (walletAddress) {
        doc.text("Wallet Address:", 20, yPosition);
        yPosition += 5;
        // Split long wallet address across lines if needed
        const addressParts = walletAddress.match(/.{1,50}/g) || [walletAddress];
        addressParts.forEach((part, index) => {
          doc.text(index === 0 ? part : `  ${part}`, 20, yPosition);
          yPosition += 5;
        });
      }

      // Crypto Instructions
      checkPageBreak(35);
      yPosition += 5;
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text("Important Instructions:", 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(
        `• Network Verification: Ensure you're sending on ${NETWORK_INFO[formData[FORM_FIELDS.CRYPTO_NETWORK]]?.name || formData[FORM_FIELDS.CRYPTO_NETWORK]}`,
        20,
        yPosition
      );
      yPosition += 5;
      doc.text(
        `• Currency Match: Only send ${formData[FORM_FIELDS.CRYPTO_CURRENCY]} to this address`,
        20,
        yPosition
      );
      yPosition += 5;
      doc.text(
        "• Transaction Reference: Include your full name in memo if possible",
        20,
        yPosition
      );
      yPosition += 5;
      doc.text(
        "• Confirmation: Send transaction hash to Maddie via email to " +
          EMAIL_CONFIG.MADDIE,
        20,
        yPosition
      );
      yPosition += 5;
    } else if (paymentMethod === "credit") {
      doc.text("Payment Method: Credit Card", 20, yPosition);
      yPosition += 10;

      // Credit Card Details
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text("Credit Card Payment Process:", 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(
        "• Payment link will be sent to your email within 24 hours",
        20,
        yPosition
      );
      yPosition += 5;
      doc.text("• Check your spam/junk folder if not received", 20, yPosition);
      yPosition += 5;
      doc.text("• Payment link remains active for 24 hours", 20, yPosition);
      yPosition += 5;
      doc.text("• Supports Apple Pay & Google Pay", 20, yPosition);
      yPosition += 5;
      doc.text("• Contact Maddie if you need assistance", 20, yPosition);
      yPosition += 5;
    }

    // Payment Schedule
    if (formData[FORM_FIELDS.PAYMENT_SCHEDULE] === "installments") {
      checkPageBreak(20);
      yPosition += 5;
      doc.text("Payment Schedule: Installments", 20, yPosition);
      yPosition += 5;

      // Calculate installment payments
      const firstPayment =
        pricing.installmentAmount || Math.round(pricing.total * 0.35);
      const secondPayment = pricing.total - firstPayment;

      doc.text(`First Payment (35%): $${firstPayment}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Second Payment (65%): $${secondPayment}`, 20, yPosition);
      yPosition += 5;
    }

    // Dietary Restrictions
    const dietaryRestrictions = formData[FORM_FIELDS.DIETARY_RESTRICTIONS];
    if (dietaryRestrictions && dietaryRestrictions.length > 0) {
      checkPageBreak(40);
      yPosition += 15;
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("Dietary Information", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);

      // Handle different data types for dietary restrictions
      let dietaryText = "";
      if (Array.isArray(dietaryRestrictions)) {
        dietaryText = dietaryRestrictions.join(", ");
      } else if (typeof dietaryRestrictions === "string") {
        dietaryText = dietaryRestrictions;
      } else {
        dietaryText = String(dietaryRestrictions);
      }

      doc.text(`Dietary Restrictions: ${dietaryText}`, 20, yPosition);
      yPosition += 5;

      if (formData[FORM_FIELDS.DIETARY_MESSAGE]) {
        doc.text(
          `Additional Notes: ${formData[FORM_FIELDS.DIETARY_MESSAGE]}`,
          20,
          yPosition
        );
        yPosition += 5;
      }
    }

    // Footer
    checkPageBreak(20);
    yPosition = Math.max(yPosition + 10, pageHeight - 30);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      "Thank you for choosing Argentina Trek!",
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );
    yPosition += 5;
    doc.text(`Contact: ${EMAIL_CONFIG.MADDIE}`, pageWidth / 2, yPosition, {
      align: "center",
    });

    // Generate PDF and open print dialog for the PDF (not the webpage)
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Open PDF in new window and trigger print dialog
    const printWindow = window.open(pdfUrl, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
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
                    <li>
                      <strong>Confirmation:</strong> Please send any
                      transfer/receipt confirmation to Maddie via email to{" "}
                      <a href={`mailto:${EMAIL_CONFIG.MADDIE}`}>
                        {EMAIL_CONFIG.MADDIE}
                      </a>
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
                        hash and any receipt confirmation to Maddie via email to{" "}
                        <a href={`mailto:${EMAIL_CONFIG.MADDIE}`}>
                          {EMAIL_CONFIG.MADDIE}
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

          {/* Credit Card Payment Details - Only show if credit card was selected */}
          {formData[FORM_FIELDS.PAYMENT_METHOD] === "credit" && (
            <div className="credit-card-payment-section">
              <h4>Credit Card Payment</h4>
              <div className="credit-card-info">
                {/* Credit Card Instructions */}
                <div className="credit-card-instructions">
                  <h4>
                    <i className="fas fa-info-circle"></i> What to Expect
                  </h4>
                  <p>
                    Your secure payment link will be sent to your email address
                    within <strong>24 hours</strong> once Maddie processes your
                    registration.
                  </p>
                  <ul style={{ marginTop: "1rem" }}>
                    <li>
                      <strong>Timeline:</strong> Maddie will distribute payment
                      links ASAP
                    </li>
                    <li>
                      <strong>Email Delivery:</strong> Check your spam/junk
                      folder if you don't receive it
                    </li>
                    <li>
                      <strong>Link Validity:</strong> Payment link will remain
                      active for 24 hours
                    </li>
                    <li>
                      <strong>Support:</strong> Contact Maddie if you need
                      assistance
                      <ul style={{ marginTop: "0.5rem", marginLeft: "1rem" }}>
                        <li>
                          <a
                            href="https://wa.me/34689200162"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#059669",
                              textDecoration: "underline",
                            }}
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
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="print-section">
        <button
          className="print-button"
          onClick={generatePDFSummary}
          type="button"
        >
          📄 Generate PDF Summary
        </button>
        <p className="print-note">
          Generate and print your comprehensive trip registration summary with
          all confirmed flights, hotels, and payment details.
        </p>
      </div>
    </div>
  );
};

export default PaymentDetailsDisplay;
