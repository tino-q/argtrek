// Payment Details Display Component
// Shows payment information after successful trip registration

import {
  getEmail,
  getBasePrice,
  getPrivateRoomUpgradePrice,
  getTripItinerary,
  getTravelerName,
  getPlusOneName,
} from "../../utils/rsvpData";
import { FORM_FIELDS, EMAIL_CONFIG } from "../../utils/config";
import { getActivityByFormField } from "../../utils/activities";
import jsPDF from "jspdf";

import { BANK_DETAILS, CRYPTO_WALLETS, NETWORK_INFO } from "../../utils/config";

export function buildPDfDoc(rsvpData, submissionResult, formData, pricing) {
  const tripItinerary = getTripItinerary(rsvpData);
  const travelerName = getTravelerName(rsvpData);
  const plusOneName = getPlusOneName(rsvpData);

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 25;
  const contentWidth = pageWidth - margin * 2;
  const maxYPosition = pageHeight - 40;
  let yPosition = margin;

  // Color scheme
  const colors = {
    primary: [24, 119, 242], // Blue
    secondary: [108, 117, 125], // Gray
    accent: [40, 167, 69], // Green
    text: [33, 37, 41], // Dark gray
    light: [248, 249, 250], // Light gray
    success: [25, 135, 84], // Success green
  };

  // Typography helpers
  const setSubtitle = (size = 14) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(...colors.primary);
  };

  const setBody = (size = 10) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...colors.text);
  };

  const setLabel = (size = 9) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(...colors.secondary);
  };

  const setSmall = (size = 8) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...colors.secondary);
  };

  // Helper functions
  const checkPageBreak = (requiredSpace = 15) => {
    if (yPosition + requiredSpace > maxYPosition) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  const addBox = (x, y, width, height, fillColor = colors.light) => {
    doc.setFillColor(...fillColor);
    doc.setDrawColor(...colors.secondary);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, width, height, 2, 2, "FD");
  };

  const addKeyValue = (label, value, yPos = yPosition, indent = 0) => {
    setLabel();
    doc.text(label + ":", margin + indent, yPos);
    setBody();
    doc.text(value, margin + indent + 57, yPos);
    return yPos + 6;
  };

  // === HEADER SECTION ===
  // Header background
  addBox(0, 0, pageWidth, 60, colors.primary);

  // Company logo/title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text("ARGENTINA TRIP", pageWidth / 2, 25, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Trip Registration Summary", pageWidth / 2, 35, {
    align: "center",
  });

  // Order number badge
  if (submissionResult?.rowNumber) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`ORDER #${submissionResult.rowNumber}`, pageWidth / 2, 45, {
      align: "center",
    });
  }

  setSmall();
  doc.setTextColor(255, 255, 255);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`,
    pageWidth / 2,
    52,
    { align: "center" }
  );

  yPosition = 75;

  // === TRAVELER INFORMATION ===
  checkPageBreak(35);
  setSubtitle(16);
  doc.text("Traveler Information", margin, yPosition);
  yPosition += 8;

  addBox(margin, yPosition, contentWidth, 25, colors.light);
  yPosition += 8;

  yPosition = addKeyValue("Primary Traveler", travelerName, yPosition, 8);
  if (plusOneName) {
    yPosition = addKeyValue("Plus One", plusOneName, yPosition, 8);
  }
  yPosition = addKeyValue("Email", getEmail(rsvpData), yPosition, 8);
  yPosition += 12;

  // === CONFIRMED FLIGHTS ===
  if (tripItinerary.flights && tripItinerary.flights.length > 0) {
    // Don't break page for flights - keep them on first page
    setSubtitle(14);
    doc.text("Confirmed Flights", margin, yPosition);
    yPosition += 10;

    tripItinerary.flights.forEach((flight, index) => {
      // Don't break page for individual flights - keep all on first page
      // Flight card - increased height for better spacing
      addBox(
        margin,
        yPosition,
        contentWidth,
        30,
        index % 2 === 0 ? [248, 249, 250] : [255, 255, 255]
      );

      // Flight number and airline (left side) - with text wrapping
      setLabel(8);
      const flightCode = flight.code || "";
      const airline = flight.airline || "";
      const flightHeader = `${flightCode} - ${airline}`;

      // Check if text fits, if not split it
      const maxLeftWidth = contentWidth * 0.6; // Use 60% of width for left side
      const flightHeaderLines = doc.splitTextToSize(flightHeader, maxLeftWidth);

      let currentY = yPosition + 8;
      flightHeaderLines.forEach((line, lineIndex) => {
        doc.text(line, margin + 6, currentY + lineIndex * 5);
      });

      // Route (left side, adjust position based on header lines)
      setBody(8);
      const routeY = currentY + flightHeaderLines.length * 5 + 2;
      const routeLines = doc.splitTextToSize(flight.route, maxLeftWidth);
      routeLines.forEach((line, lineIndex) => {
        doc.text(line, margin + 6, routeY + lineIndex * 5);
      });

      // Right side content - date, times, duration
      const rightX = pageWidth - margin - 6;

      // Date (right side, first line)
      setSmall(8);
      doc.text(flight.date, rightX, yPosition + 8, {
        align: "right",
      });

      // Times (right side, second line)
      setSmall(8);
      const timeText = `${flight.departure.time} - ${flight.arrival.time}`;
      doc.text(timeText, rightX, yPosition + 15, {
        align: "right",
      });

      // Duration and aircraft (right side, third line)
      setSmall(7);
      const durationText = `${flight.duration} - ${flight.aircraft}`;
      doc.text(durationText, rightX, yPosition + 22, {
        align: "right",
      });

      yPosition += 36;
    });
  }

  // === CONFIRMED ACCOMMODATIONS ===
  if (tripItinerary.accommodations && tripItinerary.accommodations.length > 0) {
    // Force page break - hotels always start on second page
    doc.addPage();
    yPosition = margin;
    setSubtitle(14);
    doc.text("Confirmed Accommodations", margin, yPosition);
    yPosition += 10;

    tripItinerary.accommodations.forEach((hotel, index) => {
      // Check if we need page break for individual hotels
      checkPageBreak(35);

      // Hotel card - increased height for better spacing
      addBox(
        margin,
        yPosition,
        contentWidth,
        30,
        index % 2 === 0 ? [248, 249, 250] : [255, 255, 255]
      );

      // Hotel name (left side) - with text wrapping
      setLabel(8);
      const maxLeftWidth = contentWidth * 0.65; // Use 65% of width for left side
      const hotelNameLines = doc.splitTextToSize(hotel.hotelName, maxLeftWidth);

      let currentY = yPosition + 8;
      hotelNameLines.forEach((line, lineIndex) => {
        doc.text(line, margin + 6, currentY + lineIndex * 5);
      });

      // Hotel location (left side, adjust position based on name lines)
      setBody(8);
      const locationY = currentY + hotelNameLines.length * 5 + 2;
      const locationLines = doc.splitTextToSize(hotel.location, maxLeftWidth);
      locationLines.forEach((line, lineIndex) => {
        doc.text(line, margin + 6, locationY + lineIndex * 5);
      });

      // Dates (right side)
      setSmall(8);
      const nightsText =
        hotel.nights.length === 1
          ? hotel.nights[0]
          : `${hotel.nights[0]} - ${hotel.nights[hotel.nights.length - 1]}`;
      doc.text(nightsText, pageWidth - margin - 6, yPosition + 15, {
        align: "right",
      });

      yPosition += 36;
    });
  }

  // === PRICING BREAKDOWN ===
  yPosition += 20; // Add more space before pricing breakdown
  checkPageBreak(100);
  setSubtitle(16);
  doc.text("Pricing Breakdown", margin, yPosition);
  yPosition += 10;

  // Pricing box - extended height to accommodate all content including checked luggage
  addBox(margin, yPosition, contentWidth, 85, [248, 252, 255]);
  yPosition += 8;

  // Base price
  yPosition = addKeyValue(
    "Base Trip Price",
    `$${getBasePrice(rsvpData)}`,
    yPosition,
    8
  );

  // Private room upgrade
  if (formData[FORM_FIELDS.PRIVATE_ROOM_UPGRADE]) {
    yPosition = addKeyValue(
      "Private Room Upgrade",
      `$${getPrivateRoomUpgradePrice(rsvpData)}`,
      yPosition,
      8
    );
  }

  // Activities
  const activities = [];
  if (formData[FORM_FIELDS.RAFTING]) {
    const activity = getActivityByFormField(FORM_FIELDS.RAFTING);
    activities.push({
      name: activity.name,
      price: activity.price,
    });
  }

  if (formData[FORM_FIELDS.HORSEBACK]) {
    const activity = getActivityByFormField(FORM_FIELDS.HORSEBACK);
    activities.push({
      name: "Horseback Riding (Optional Activity)", // Clean name for PDF
      price: activity.price,
    });
  }

  if (formData[FORM_FIELDS.COOKING]) {
    const activity = getActivityByFormField(FORM_FIELDS.COOKING);
    activities.push({
      name: activity.name,
      price: activity.price,
    });
  }

  if (formData[FORM_FIELDS.TANGO]) {
    const activity = getActivityByFormField(FORM_FIELDS.TANGO);
    activities.push({
      name: "Tango Night", // Clean name for PDF
      price: activity.price,
    });
  }

  if (activities.length > 0) {
    activities.forEach((activity) => {
      yPosition = addKeyValue(
        activity.name,
        activity.price > 0 ? `$${activity.price}` : "pending",
        yPosition,
        8
      );
    });
  }

  // Checked luggage - informational line
  if (formData[FORM_FIELDS.CHECKED_LUGGAGE]) {
    yPosition = addKeyValue("Checked Luggage", "pending", yPosition, 8);
  }

  // Subtotal
  yPosition += 3;
  doc.setDrawColor(...colors.secondary);
  doc.setLineWidth(0.3);
  doc.line(margin + 8, yPosition, pageWidth - margin - 8, yPosition);
  yPosition += 8;

  yPosition = addKeyValue("Subtotal", `$${pricing.subtotal}`, yPosition, 8);

  // Fees and taxes
  if (pricing.processingFee > 0) {
    yPosition = addKeyValue(
      "Processing Fee (2.85%)",
      `$${pricing.processingFee}`,
      yPosition,
      8
    );
  }

  // Total
  yPosition += 3;
  // doc.setDrawColor(...colors.success);
  doc.setLineWidth(0.5);
  doc.line(margin + 8, yPosition, pageWidth - margin - 8, yPosition);
  yPosition += 8;

  setLabel(12);
  // doc.setTextColor(...colors.success);
  // Show EUR for credit card, USD for others
  const paymentMethod = formData[FORM_FIELDS.PAYMENT_METHOD];
  const isInstallmentPlan =
    formData[FORM_FIELDS.PAYMENT_SCHEDULE] === "installments";
  if (paymentMethod === "credit" && !isInstallmentPlan) {
    doc.text("TOTAL:", margin + 8, yPosition);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(
      `€${Math.round(pricing.totalEUR).toLocaleString()} ($${Math.round(pricing.total).toLocaleString()})`,
      margin + 8 + 56,
      yPosition
    );
  } else {
    doc.text("TOTAL:", margin + 8, yPosition);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`$${pricing.total}`, margin + 8 + 56, yPosition);
  }

  yPosition += 55;

  // === PAYMENT INFORMATION ===
  checkPageBreak(100);
  setSubtitle(16);
  doc.text("Payment Information", margin, yPosition);
  yPosition += 10;

  // Payment method header
  addBox(margin, yPosition, contentWidth, 15, colors.primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  const methodText =
    paymentMethod === "bank"
      ? "BANK TRANSFER"
      : paymentMethod === "crypto"
        ? "CRYPTOCURRENCY"
        : "CREDIT CARD";
  doc.text(methodText, margin + 8, yPosition + 10);
  yPosition += 20;

  if (paymentMethod === "bank") {
    // Bank details box
    addBox(margin, yPosition, contentWidth, 70, [248, 255, 248]);
    yPosition += 8;

    setLabel(9);
    doc.text("BANK TRANSFER DETAILS", margin + 8, yPosition);
    yPosition += 8;

    BANK_DETAILS.forEach((detail) => {
      checkPageBreak(5);
      // Use single column layout to prevent overflow
      yPosition = addKeyValue(detail.label, detail.value, yPosition, 8);
    });

    yPosition += 15;

    // Important instructions
    checkPageBreak(40);
    addBox(margin, yPosition, contentWidth, 35, [255, 248, 240]);
    yPosition += 8;

    setLabel(9);
    doc.setTextColor(180, 83, 9);
    doc.text("IMPORTANT INSTRUCTIONS", margin + 8, yPosition);
    yPosition += 8;

    setSmall(8);
    doc.setTextColor(...colors.text);
    const instructions = [
      "- Select 'OUR' option to cover ALL transfer fees in your bank",
      "- Include your full name in the transfer reference",
      "- Send transfer receipt to " + EMAIL_CONFIG.MADDIE,
      "- Recommended: Use Revolut for free transfers",
    ];

    instructions.forEach((instruction) => {
      doc.text(instruction, margin + 8, yPosition);
      yPosition += 5;
    });

    yPosition += 10;
  } else if (paymentMethod === "crypto") {
    // Crypto details
    addBox(margin, yPosition, contentWidth, 30, [248, 248, 255]);
    yPosition += 8;

    yPosition = addKeyValue(
      "Network",
      NETWORK_INFO[formData[FORM_FIELDS.CRYPTO_NETWORK]]?.name ||
        formData[FORM_FIELDS.CRYPTO_NETWORK],
      yPosition,
      8
    );
    yPosition = addKeyValue(
      "Currency",
      formData[FORM_FIELDS.CRYPTO_CURRENCY],
      yPosition,
      8
    );

    // Get wallet address (ARB uses the same wallet as ETH)
    const networkKey =
      formData[FORM_FIELDS.CRYPTO_NETWORK] === "ARB"
        ? "ETH"
        : formData[FORM_FIELDS.CRYPTO_NETWORK];
    const walletAddress = CRYPTO_WALLETS[networkKey];
    if (walletAddress) {
      yPosition = addKeyValue("Wallet Address", walletAddress, yPosition, 8);

      // setLabel();
      // doc.text("Wallet Address:", margin + 8, yPosition);
      // yPosition += 6;
      // setBody(7);
      // // Split long wallet address into multiple lines if needed
      // const maxWidth = contentWidth - 16;
      // const addressLines = doc.splitTextToSize(walletAddress, maxWidth);
      // addressLines.forEach((line) => {
      //   doc.text(line, margin + 8, yPosition);
      //   yPosition += 5;
      // });
      // yPosition += 3;
    }

    yPosition += 10;
  } else if (paymentMethod === "credit") {
    // Credit card info
    addBox(margin, yPosition, contentWidth, 25, [255, 248, 248]);
    yPosition += 8;

    setBody();
    const creditInstructions = [
      "- Payment link will be sent to your email within 24 hours",
      "- Check spam/junk folder if not received",
      "- Supports Apple Pay & Google Pay",
    ];

    creditInstructions.forEach((instruction) => {
      doc.text(instruction, margin + 8, yPosition);
      yPosition += 5;
    });

    yPosition += 10;
  }

  // Payment schedule
  if (formData[FORM_FIELDS.PAYMENT_SCHEDULE] === "installments") {
    checkPageBreak(25);
    addBox(margin, yPosition, contentWidth, 30, [248, 255, 248]);
    yPosition += 8;

    setLabel();
    doc.text("INSTALLMENT PLAN", margin + 8, yPosition);
    yPosition += 6;

    const firstPayment = pricing.installmentAmount;

    const firstPaymentEur = pricing.installmentAmountEUR;

    const secondPayment = pricing.total - firstPayment;

    yPosition = addKeyValue(
      "1st Payment (35%)",
      paymentMethod === "credit"
        ? `€${firstPaymentEur} ($${firstPayment})`
        : `$${firstPayment}`,
      yPosition,
      8
    );
    yPosition = addKeyValue(
      "2nd Payment (65%) by Sept 15th",
      `$${secondPayment}`,
      yPosition,
      8
    );
    yPosition += 25;
  }

  // === DIETARY INFORMATION ===
  const dietaryRestrictions = formData[FORM_FIELDS.DIETARY_RESTRICTIONS];
  if (dietaryRestrictions && dietaryRestrictions !== "none") {
    checkPageBreak(30);
    setSubtitle(14);
    doc.text("Dietary Information", margin, yPosition);
    yPosition += 10;

    addBox(margin, yPosition, contentWidth, 20, [248, 255, 248]);
    yPosition += 8;

    let dietaryText = "";
    if (Array.isArray(dietaryRestrictions)) {
      dietaryText = dietaryRestrictions.join(", ");
    } else {
      dietaryText = String(dietaryRestrictions);
    }

    yPosition = addKeyValue("Dietary Restrictions", dietaryText, yPosition, 8);

    if (formData[FORM_FIELDS.DIETARY_MESSAGE]) {
      yPosition = addKeyValue(
        "Additional Notes",
        formData[FORM_FIELDS.DIETARY_MESSAGE],
        yPosition,
        8
      );
    }
    yPosition += 15;
  }

  // === TERMS AND CONDITIONS ===
  checkPageBreak(50);
  setSubtitle(16);
  doc.text("Terms and Conditions", margin, yPosition);
  yPosition += 10;

  // TRAVELER INFORMATION section
  addBox(margin, yPosition, contentWidth, 35, [248, 252, 255]);
  yPosition += 8;

  setSubtitle(12);
  doc.text("TRAVELER INFORMATION", margin + 8, yPosition);
  yPosition += 8;

  setBody(9);
  const travelerTerms = [
    "• The name and surname above exactly match my travel document (passport/ID) for this trip",
    "• I have double-checked all my traveler information above",
    "• All information provided is accurate and complete",
  ];

  travelerTerms.forEach((term) => {
    checkPageBreak(5);
    const termLines = doc.splitTextToSize(term, contentWidth - 16);
    termLines.forEach((line) => {
      doc.text(line, margin + 8, yPosition);
      yPosition += 5;
    });
    yPosition += 2;
  });

  yPosition += 8;

  // HEALTH INSURANCE section
  checkPageBreak(70);
  addBox(margin, yPosition, contentWidth, 80, [248, 252, 255]);
  yPosition += 8;

  setSubtitle(12);
  doc.text("HEALTH INSURANCE", margin + 8, yPosition);
  yPosition += 8;

  setBody(9);
  const healthInsuranceText =
    "• I have or will obtain by the time of the trip a valid health insurance policy that complies with the new Argentine requirement established by Decree 366/2025, covering all regular medical treatments and services during my stay in Argentina.";
  const healthInsuranceLines = doc.splitTextToSize(
    healthInsuranceText,
    contentWidth - 16
  );
  healthInsuranceLines.forEach((line) => {
    doc.text(line, margin + 8, yPosition);
    yPosition += 5;
  });
  yPosition += 8;

  // Health insurance requirements details
  setLabel(10);
  doc.text("Health Insurance Requirements:", margin + 8, yPosition);
  yPosition += 6;

  setBody(8);
  const healthRequirements = [
    "• Covers general medical care, outpatient treatment, and hospitalization",
    "• Is valid throughout the entire stay in Argentina",
    "• Clearly states that it covers the traveler while in Argentina (country-specific coverage)",
    "• Includes coverage for medical emergencies",
    "• May be required to be presented at the border or upon request by local authorities",
  ];

  healthRequirements.forEach((requirement) => {
    checkPageBreak(5);
    const reqLines = doc.splitTextToSize(requirement, contentWidth - 16);
    reqLines.forEach((line) => {
      doc.text(line, margin + 8, yPosition);
      yPosition += 4;
    });
    yPosition += 1;
  });

  setBody(8);
  const healthNote =
    "Note: Public healthcare services in Argentina will only be available to non-residents in cases of emergency. For all other situations, proof of valid health insurance will be required in order to receive care.";
  const healthNoteLines = doc.splitTextToSize(healthNote, contentWidth - 16);
  healthNoteLines.forEach((line) => {
    doc.text(line, margin + 8, yPosition);
    yPosition += 4;
  });

  yPosition += 15;

  // TERMS & CONDITIONS section
  checkPageBreak(100);
  addBox(margin, yPosition, contentWidth, 95, [248, 252, 255]);
  yPosition += 8;

  setSubtitle(12);
  doc.text("TERMS & CONDITIONS", margin + 8, yPosition);
  yPosition += 8;

  setBody(9);
  const termsAndConditions = [
    "• A 21% VAT will be added to accommodation expenses for Argentinean guests.",
    "• Quotation is based on RSVP submissions. This proposal is subject to availability and may change until the group reservation is confirmed with a deposit. In case of delayed payments, prices may be adjusted due to currency fluctuations or updated supplier rates.",
    "• Deposits are non-refundable. The remaining balance must be paid according to the specified deadlines.",
    "• Prices do not include visa processing fees or travel insurance. Each traveler is responsible for obtaining the necessary visa and health insurance.",
    "• All passengers must have valid travel documents in good condition. It is the traveler's responsibility to verify passport, visa, and health requirements. A passport valid for at least 6 months is recommended.",
    "• The organizer acts solely as an intermediary and is not responsible for delays, changes, or cancellations due to weather, third parties, or force majeure.",
    "• Participation in all activities implies voluntary acceptance of associated risks.",
  ];

  termsAndConditions.forEach((condition) => {
    checkPageBreak(8);
    const conditionLines = doc.splitTextToSize(condition, contentWidth - 16);
    conditionLines.forEach((line) => {
      doc.text(line, margin + 8, yPosition);
      yPosition += 4;
    });
    yPosition += 3;
  });

  yPosition += 20;

  // === FOOTER ===
  yPosition = Math.max(yPosition, pageHeight - 35);

  // Footer background
  addBox(0, yPosition - 5, pageWidth, 30, colors.primary);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(
    "Thank you for choosing Argentina Trip!",
    pageWidth / 2,
    yPosition + 8,
    { align: "center" }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Contact: ${EMAIL_CONFIG.MADDIE}`, pageWidth / 2, yPosition + 16, {
    align: "center",
  });

  return doc;
}
