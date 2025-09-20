import { PRICES } from "../../utils/config.js";

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
      margin-bottom: 3px;
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
      margin-bottom: 5px;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #1e3c72;
      margin-bottom: 5px;
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
  const buenosAiresArrivalHotel =
    rsvpData["22Nov_BSAS"] || rsvpData["23Nov_BSAS"];

  const bariHotel =
    rsvpData["24Nov_BARI"] || rsvpData["25Nov_BARI"] || rsvpData["26Nov_BARI"];
  const mendozaHotel = rsvpData["27Nov_MDZ"] || rsvpData["28Nov_MDZ"];
  const bsasDepartureHotel = rsvpData["29Nov_BSAS"];
  const welcomeDinner = rsvpData["23Nov_Dinner_Welcome"];

  // Generate hotel HTML if accommodations exist
  const hotelSection = `
  <div class="section">
    <div class="section-title">Accommodations</div>
    <div class="activities">
      ${[
        {
          hotelName: "Hotel in Buenos Aires",
          nights: ["Check in 22 Nov - Check out 24 Nov"],
          enable: buenosAiresArrivalHotel,
        },
        {
          hotelName: "Hotel in Bariloche",
          nights: ["Check in 24 Nov - Check out 27 Nov"],
          enable: bariHotel,
        },
        {
          hotelName: "Hotel in Mendoza",
          nights: ["Check in 27 Nov - Check out 29 Nov"],
          enable: mendozaHotel,
        },
        {
          hotelName: "Hotel in Buenos Aires",
          nights: ["Check in 29 Nov - Check out 30 Nov"],
          enable: bsasDepartureHotel,
        },
      ]
        .map(
          (hotel) => `
        ${
          hotel.enable
            ? `<div class="activity">
          <div class="activity-name">${hotel.hotelName}</div>
          <div class="activity-price">${hotel.nights[0].split(" - ")[0]}</div>
          <div class="activity-price">${hotel.nights[0].split(" - ")[1]}</div>
        </div>`
            : ""
        }
      `
        )
        .join("")}
    </div>
  </div>
  `;

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
    <div class="section-title">Group Activities (full confirmed agenda COMING SOON)</div>
    <div class="activities">
      ${
        welcomeDinner
          ? `<div class="activity">
        <div class="activity-name">Buenos Aires</div>
        <div class="activity-price">Day outing</div>
        <div class="activity-price">Welcome Dinner</div>
      </div>`
          : ""
      }
      ${
        bariHotel
          ? `<div class="activity">
            <div class="activity-name">Bariloche</div>
            <div class="activity-price">Day outing</div>
            <div class="activity-price">Welcome & Closing Dinner</div>
          </div>`
          : ""
      }
      ${
        mendozaHotel
          ? `<div class="activity">
        <div class="activity-name">Mendoza</div>
        <div class="activity-price">Day outing</div>
        <div class="activity-price">Welcome & Closing Dinner</div>
      </div>`
          : ""
      }

      ${
        bsasDepartureHotel
          ? `
      <div class="activity">
        <div class="activity-name">Buenos Aires</div>
        <div class="activity-price">Closing Dinner</div>
      </div>
        `
          : ""
      } 
    </div>
  </div>
  
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
      ${
        formData.checkedLuggage
          ? `<div class="pricing-row">
              <span>Checked Luggage:</span>
              <span>Pending</span>
            </div>`
          : ""
      }
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
    <div class="section-title">Terms and Conditions Highlights</div>
    <div class="terms-content">
    <h4>TRAVELER DECLARES</h4>
    <p>To have read, understood, and accepted the complete Terms and Conditions in their entirety. To understand that a personal travel insurance is strongly recommended to cover flight disruptions, schedule changes, cancellations, lost luggage, or trip interruptions.</p>
    <p>To understand that in compliance with Decree 366/2025 of the Republic of Argentina, every foreign TRAVELER must have valid health insurance for the entire duration of their stay, with the policy issued in English or Spanish. The TRAVELER must carry and present the policy when required by border authorities, airlines, or local authorities.</p>
    <p>To assume responsibility for complying with required health and vaccination obligations. The PROVIDER offers indicative information, but it is the TRAVELER’s responsibility to confirm requirements with relevant consulates and health authorities. Lack of documentation or failure to meet requirements shall not entitle the TRAVELER to any refund.</p>
    <p>To be a person with sufficient legal capacity to contract and assume all obligations set forth herein. To be responsible for the veracity of the personal data provided to the PROVIDER. The TRAVELER is responsible for ensuring they hold valid documentation necessary for the trip (passports, visas, minor authorizations, residence permits, etc.), as well as complying with entry, transit, and exit requirements of the destination country.</p>
  
  <h4>COORDINATOR ROLE & INCLUDED SERVICES</h4>
<p>The PROVIDER acts solely as a coordinator of services provided by third parties (accommodations, land transport companies, activity providers, etc.).</p>
<p>The PROVIDER will not be responsible for booking errors attributable to the TRAVELER (including but not limited to errors in personal data provided for tickets or reservations) or for problems arising from unavoidable and extraordinary circumstances beyond its control (strikes, government decisions, war, natural disasters, epidemics, etc.).</p>
<p>Not included in the package travel price: flights, insurance, visas, tourist taxes. International and/or domestic flights are not part of the package travel covered by this contract. The TRAVELER is solely responsible for handling any incidents related to such flights (delays, cancellations, schedule changes, or other contingencies). The PROVIDER assumes no responsibility with respect to air transportation.</p>
<p>Provision of certain services (excursions, transfers, activities) may be subject to a minimum number of participants required by the supplier. If this minimum is not reached or due to issues attributable to the supplier, the PROVIDER may replace the affected service with another of equal or similar quality and value, without this constituting a substantial alteration of the contract.</p>


<h4>CLAIMS</h4>
<p>The Traveler must promptly notify the Provider of any lack of conformity or issue during the trip in order to allow the Provider to remedy the situation within a reasonable period. Failure to communicate such issues while in destination affects the Traveler’s right to subsequently claim compensation.</p>

<h4>APPLICABLE LAW AND JURISDICTION</h4>
<p>This contract shall be governed by Spanish law. Any dispute will first be submitted to an Alternative Dispute Resolution (ADR) or mediation body recognized in Spain or the EU.</p>
<p>If unresolved, both parties expressly and exclusively submit to the Courts and Tribunals of Spain, waiving any other forum. This does not limit the Traveler’s mandatory consumer protection rights.</p>

<h4>FULL TERMS & CONDITIONS IN WEB PAGE</h4>

<p>These Reduced Terms and Conditions provide a summary of the key points of your contract. The complete Terms and Conditions, which form an integral part of this agreement, are available at any time through your personal login area on our website. By accepting these Reduced Terms and Conditions, the Traveler acknowledges having been informed of the existence of the full Terms and Conditions and agrees that they apply in their entirety to the contract.</p>
    <p>You can find the complete terms and conditions <a href="https://argtrip.sonsolesstays.com/terms" target="_blank">here</a>.</p>

  
    </div>
</div>`;
  return pageTemplate(content, voucherId);
}

/*
function generateThirdPageHTML(voucherId) {
  const content = `<div class="content">
  <div class="section">
    <div class="section-title">Terms and Conditions Highlights</div>
    <div class="terms-content">  
    </div>
  </div>
</div>`;
  return pageTemplate(content, voucherId);
}
*/

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
    // await toPdf(browser, generateThirdPageHTML(voucherId)),
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
