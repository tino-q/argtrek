import puppeteer from "puppeteer";
import { PRICES } from "../../utils/config.js";
import { getTripItinerary } from "../../utils/rsvpData.js";

const pageTemplate = (content, voucherId) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: white;
      margin: 0;
      padding: 0;
    }
    
    .voucher {
      background: white;
      width: 100%;
      min-height: 100vh;
      overflow: hidden;
      position: relative;
      display: flex;
      flex-direction: column;
    }
    
    .header {
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      color: white;
      padding: 20px;
      text-align: center;
      flex-shrink: 0;
    }
    
    .header h1 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    
    .header .subtitle {
      font-size: 13px;
      opacity: 0.9;
    }
    
    .content {
      padding: 25px;
      flex: 1;
    }
    
    .section {
      margin-bottom: 20px;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #1e3c72;
      margin-bottom: 10px;
      border-bottom: 2px solid #e0e6ed;
      padding-bottom: 6px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    
    .info-item {
      margin-bottom: 1px;
    }
    
    .info-label {
      font-weight: 600;
      color: #4a5568;
      margin-bottom: 3px;
      font-size: 12px;
    }
    
    .info-value {
      color: #2d3748;
      font-size: 13px;
    }
    
    .activities {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
      margin-top: 10px;
    }
    
    .activity {
      background: #f7fafc;
      padding: 10px;
      border-radius: 6px;
      border-left: 3px solid #4299e1;
    }
    
    .activity-name {
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 3px;
      font-size: 12px;
    }
    
    .activity-price {
      color: #4a5568;
      font-size: 11px;
    }
    
    .pricing-summary {
      background: #f7fafc;
      padding: 15px;
      border-radius: 6px;
      margin-top: 10px;
    }
    
    .pricing-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 12px;
    }
    
    .pricing-total {
      font-weight: 600;
      font-size: 14px;
      border-top: 2px solid #e2e8f0;
      padding-top: 8px;
      margin-top: 8px;
    }
    
    .terms-content {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      border-left: 3px solid #e2e8f0;
    }
    
    .terms-content h4 {
      font-size: 13px;
      font-weight: 600;
      color: #1e3c72;
      margin: 15px 0 8px 0;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    
    .terms-content h4:first-child {
      margin-top: 0;
    }
    
    .terms-content p {
      margin-bottom: 10px;
      font-size: 11px;
      line-height: 1.4;
      color: #4a5568;
      text-align: justify;
    }
    
    .terms-content p:last-child {
      margin-bottom: 0;
    }
    
    .footer {
      background: #f7fafc;
      padding: 15px;
      text-align: center;
      color: #4a5568;
      font-size: 11px;
      flex-shrink: 0;
      margin-top: auto;
    }
  </style>
</head>
<body>
  <div class="voucher">
    <div class="header">
      <h1>ARGENTINA TRIP VOUCHER</h1>
      <div class="subtitle">Voucher ID: ${voucherId}</div>
    </div>
    
${content}
    
    <div class="footer">
      <strong>ARGENTINA TRIP</strong> • Contact: sonsolesstays@gmail.com<br>
      Thank you for joining! Remember this voucher renders the previously generated one invalid.
    </div>
  </div>
</body>
</html>
`;

function generateFirstPageHTML(
  formData,
  pricing,
  rsvpData,
  voucherId,
  roommateName
) {
  // Extract hotel information from rsvpData
  const tripItinerary = getTripItinerary(rsvpData);
  const accommodations = tripItinerary?.accommodations || [];

  // Generate hotel HTML if accommodations exist
  const hotelSection =
    accommodations.length > 0
      ? `
  <div class="section">
    <div class="section-title">Accommodations</div>
    <div class="activities">
      ${accommodations
        .map(
          (hotel) => `
        <div class="activity">
          <div class="activity-name">${hotel.hotelName}</div>
          <div class="activity-price">${hotel.nights[0].split(" - ")[0]}</div>
          <div class="activity-price">${hotel.nights[0].split(" - ")[1]}</div>
        </div>
      `
        )
        .join("")}
    </div>
  </div>
  `
      : "";

  const content = `<div class="content">
  <div class="section">
    <div class="section-title">Traveler Information</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Name</div>
        <div class="info-value">${formData.firstName} ${formData.lastName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Email</div>
        <div class="info-value">${formData.email}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Phone</div>
        <div class="info-value">${formData.phoneNumber}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Roommate</div>
        <div class="info-value">${roommateName === "PRIVATE ROOM" ? "Private Room" : roommateName}</div>
      </div>
    </div>
  </div>
  
  ${hotelSection}
  
  <div class="section">
    <div class="section-title">Optional Activities</div>
    <div class="activities">
      ${!formData.rafting && !formData.tango && !formData.cooking ? `<div class="activity"><div class="activity-name">No optional activities selected</div><div class="activity-price"></div></div>` : ""}
      ${formData.rafting ? `<div class="activity"><div class="activity-name">Rafting Adventure</div><div class="activity-price">$${PRICES.rafting}</div></div>` : ""}
      ${formData.tango ? `<div class="activity"><div class="activity-name">Tango Night</div><div class="activity-price">$${PRICES.tango}</div></div>` : ""}
      ${formData.cooking ? `<div class="activity"><div class="activity-name">Cooking Class</div><div class="activity-price">$${PRICES.cooking}</div></div>` : ""}
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Pricing Summary</div>
    <div class="pricing-summary">
      <div class="pricing-row">
        <span>Base Price:</span>
        <span>$${pricing.basePrice}</span>
      </div>
      <div class="pricing-row">
        <span>Activities:</span>
        <span>$${pricing.activitiesPrice}</span>
      </div>
      <div class="pricing-row">
        <span>Private Room Upgrade:</span>
        <span>$${pricing.privateRoomUpgrade}</span>
      </div>
      <div class="pricing-row">
        <span>Processing Fee:</span>
        <span>$${pricing.processingFee}</span>
      </div>
      <div class="pricing-row pricing-total">
        <span>Total:</span>
        <span>$${pricing.total}</span>
      </div>
      <div class="pricing-row" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
        <span>Payment Method:</span>
        <span>${formData.paymentMethod === "bank" ? "Bank Transfer" : formData.paymentMethod === "crypto" ? "Cryptocurrency" : "Credit Card"}</span>
      </div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title" style="color: #dc2626;">⚠️ DOCUMENTATION</div>
    <div class="info-item" style="color: #dc2626; font-size: 12px;">
      <div class="info-value" style="margin-bottom: 8px;">Avoid relying on unofficial sources as ChatGPT. Check your passport's expiration date. Verify visa requirements directly with the Argentina consulate (or all corresponding consulates depending on your trip itinerary). Review vaccination rules based on your travel history.</div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title" style="color: #dc2626;">⚠️ INSURANCE REQUIREMENTS</div>
    <div class="info-item" style="color: #dc2626; font-size: 12px;">
      <div class="info-value">In accordance with a new Decree 366/2025, all foreign visitors must have valid health insurance for the entire duration of their stay in Argentina (with country-specific coverage). Proof may be requested at the border, by airlines, or by local authorities during your trip so keep your certificate in English or Spanish accessible throughout your trip.</div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title" style="color: #dc2626;">⚠️ INSURANCE RECOMMENDATION</div>
    <div class="info-item" style="color: #dc2626; font-size: 12px;">
      <div class="info-value">Beyond mandatory health insurance, I very strongly recommend personal travel insurance mainly to cover flight disruptions, schedule changes, lost luggage, or trip interruptions.</div>
    </div>
  </div>
  
</div>`;

  return pageTemplate(content, voucherId);
}

function generateSecondPageHTML(voucherId) {
  const content = `<div class="content">
  <div class="section">
    <div class="section-title">Terms and Conditions</div>
    <div class="terms-content">
      <h4>TRAVELER INFORMATION</h4>
      <p>• The name and surname above exactly match my travel document (passport/ID) for this trip</p>
      <p>• I have double-checked all my traveler information above</p>
      <p>• All information provided is accurate and complete</p>
      
      <h4>TERMS & CONDITIONS</h4>
      <p>• Quotation is based on RSVP submissions. This proposal is subject to availability and may change until the group reservation is confirmed with a deposit. In case of delayed payments, prices may be adjusted due to currency fluctuations or updated supplier rates.</p>
      <p>• Deposits are non-refundable. The remaining balance must be paid according to the specified deadlines.</p>
      <p>• Prices do not include visa processing fees or travel insurance. Each traveler is responsible for obtaining the necessary visa and health insurance.</p>
      <p>• All passengers must have valid travel documents in good condition. It is the traveler's responsibility to verify passport, visa, and health requirements. A passport valid for at least 6 months is recommended.</p>
      <p>• The organizer acts solely as an intermediary and is not responsible for delays, changes, or cancellations due to weather, third parties, or force majeure.</p>
      <p>• Participation in all activities implies voluntary acceptance of associated risks.</p>
      
      <h4>TRAVEL INSURANCE</h4>
      <p>• I am responsible for obtaining my own travel insurance. The organizers are not liable for any lost, damaged, or stolen property at any time during the trip. Lost luggage must be claimed directly with the airline.</p>
      
      <h4>HEALTH INSURANCE</h4>
      <p>• I have or will obtain by the time of the trip a valid health insurance policy that complies with the new Argentine requirement established by Decree 366/2025, covering all regular medical treatments and services during my stay in Argentina.</p>
      <p>• In accordance with Decree 366/2025, all foreign visitors to Argentina must have valid health insurance that covers general medical care, outpatient treatment, and hospitalization, is valid throughout the entire stay in Argentina, clearly states that it covers the traveler while in Argentina (country-specific coverage), includes coverage for medical emergencies, and may be required to be presented at the border or upon request by local authorities.</p>
      <p>• Note: Public healthcare services in Argentina will only be available to non-residents in cases of emergency. For all other situations, proof of valid health insurance will be required in order to receive care.</p>
      
      <h4>PAYMENT TERMS</h4>
      <p>• All payments must be made in accordance with the specified payment schedule. Late payments may result in cancellation of the reservation.</p>
      <p>• Payment methods accepted include bank transfer, credit card, and cryptocurrency as specified in the booking process.</p>
      <p>• Processing fees are non-refundable and apply to all payment methods.</p>
      
      <h4>CANCELLATION POLICY</h4>
      <p>• Cancellations must be made in writing and received by the organizers within the specified timeframe.</p>
      <p>• Refund policies vary based on the timing of cancellation and may be subject to supplier penalties.</p>
      <p>• No refunds will be provided for no-shows or early departures.</p>
      </div>
  </div>
</div>`;
  return pageTemplate(content, voucherId);
}

function generateThirdPageHTML(voucherId) {
  const content = `<div class="content">
  <div class="section">
    <div class="section-title">Terms and Conditions</div>
    <div class="terms-content">

      <h4>ITINERARY CHANGES</h4>
      <p>• The organizers reserve the right to modify the itinerary due to circumstances beyond their control, including but not limited to weather conditions, political unrest, or supplier changes.</p>
      <p>• Participants will be notified of any significant changes as soon as possible.</p>
      <p>• Alternative arrangements will be made when feasible, but no compensation will be provided for minor itinerary adjustments.</p>
      
      <h4>LIABILITY AND RESPONSIBILITY</h4>
      <p>• Participants acknowledge that travel involves inherent risks and agree to participate at their own risk.</p>
      <p>• The organizers are not liable for personal injury, property damage, or other losses that may occur during the trip.</p>
      <p>• Participants are responsible for their own behavior and must comply with local laws and customs.</p>
      
      <h4>PHOTOGRAPHY AND MEDIA</h4>
      <p>• By participating in this trip, participants consent to the use of their image in promotional materials unless otherwise specified in writing.</p>
      <p>• Participants are encouraged to share their experiences but must respect the privacy of other participants.</p>
      
      <h4>FORCE MAJEURE</h4>
      <p>• The organizers are not responsible for any failure to perform due to circumstances beyond their reasonable control, including but not limited to natural disasters, government actions, or other unforeseeable events.</p>
      <p>• In such cases, the organizers will make reasonable efforts to provide alternative arrangements or refunds as appropriate.</p>
    </div>
  </div>
</div>`;
  return pageTemplate(content, voucherId);
}

export async function generatePdfPuppeteer(
  browser,
  { formData, pricing, rsvpData, ID: voucherId, ROOMMATE: roommateName }
) {
  return [
    await toPdf(
      browser,
      generateFirstPageHTML(
        formData,
        pricing,
        rsvpData,
        voucherId,
        roommateName
      )
    ),
    await toPdf(browser, generateSecondPageHTML(voucherId)),
    await toPdf(browser, generateThirdPageHTML(voucherId)),
  ];
}
async function toPdf(browser, html) {
  const page = await browser.newPage();
  await page.setContent(html, {
    waitUntil: "networkidle0",
    timeout: 30000,
  });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "0mm",
      right: "0mm",
      bottom: "0mm",
      left: "0mm",
    },
    displayHeaderFooter: false,
    preferCSSPageSize: true,
  });
  return pdf;
}
