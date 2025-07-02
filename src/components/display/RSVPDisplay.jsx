import { useState } from "react";

const RSVPDisplay = ({
  rsvpData,
  onContinue,
  onLogout,
  formData,
  updateArrayField,
}) => {
  const [showAllDetails, setShowAllDetails] = useState(false);

  // Extract key information with flexible field matching
  // Handle potential variations in column headers from Google Sheets
  const nameField = Object.keys(rsvpData).find(
    (key) =>
      key.toLowerCase().includes("name exactly as it appears") ||
      key.toLowerCase().includes("write your name") ||
      key.includes("ID you'll be traveling")
  );

  const plusOneField = Object.keys(rsvpData).find(
    (key) =>
      key.toLowerCase().includes("plus one") &&
      key.toLowerCase().includes("name")
  );

  const emailField = Object.keys(rsvpData).find(
    (key) =>
      key.toLowerCase().includes("email") &&
      key.toLowerCase().includes("communications")
  );

  const name = nameField ? rsvpData[nameField] : "Name not found";
  const plusOneName = plusOneField ? rsvpData[plusOneField] : null;
  const email = emailField ? rsvpData[emailField] : "Email not found";

  // Find pack price field with flexible matching
  const packPriceField = Object.keys(rsvpData).find(
    (key) =>
      key.toLowerCase().includes("pack price") ||
      key.toLowerCase().includes("total price") ||
      key.toLowerCase().includes("package price")
  );
  const packPrice = packPriceField ? rsvpData[packPriceField] : null;

  // Get checked luggage price from RSVP data
  const checkedLuggagePrice = rsvpData["VALIJA DESPACHADA"] || null;

  // Handle checked luggage selection
  const selectedActivities = formData?.activities || [];
  const isLuggageSelected = selectedActivities.some(
    (activity) =>
      (typeof activity === "object" ? activity.id : activity) === "luggage"
  );

  const handleLuggageToggle = () => {
    const luggageActivity = {
      id: "luggage",
      name: "Checked Luggage",
      price: checkedLuggagePrice,
    };
    updateArrayField("activities", luggageActivity, !isLuggageSelected);
  };

  // Define all services in chronological order
  const chronologicalServices = [
    // Buenos Aires - Arrival (Nov 22-23)
    {
      type: "accommodation",
      location: "Buenos Aires",
      period: "Arrival",
      nights: [
        { key: "22 NOV", date: "Nov 22" },
        { key: "23 NOV", date: "Nov 23" },
      ],
    },
    // Flight to Bariloche (Nov 24)
    {
      type: "flight",
      key: "JA3045 AEP - BRC",
      route: "Buenos Aires → Bariloche",
      date: "Nov 24",
    },
    // Bariloche Accommodation (Nov 24-26)
    {
      type: "accommodation",
      location: "Bariloche",
      nights: [
        { key: "24 NOV", date: "Nov 24" },
        { key: "25 NOV", date: "Nov 25" },
        { key: "26 NOV", date: "Nov 26" },
      ],
    },
    // Flight to Mendoza (Nov 27)
    {
      type: "flight",
      key: "JA3725 BRC MDZ",
      route: "Bariloche → Mendoza",
      date: "Nov 27",
    },
    // Mendoza Accommodation (Nov 27-28)
    {
      type: "accommodation",
      location: "Mendoza",
      nights: [
        { key: "27 NOV", date: "Nov 27" },
        { key: "28 NOV", date: "Nov 28" },
      ],
    },
    // Flight back to Buenos Aires (Nov 29)
    {
      type: "flight",
      key: "JA3073 MDZ AEP",
      route: "Mendoza → Buenos Aires",
      date: "Nov 29",
    },
    // Buenos Aires - Departure (Nov 29)
    {
      type: "accommodation",
      location: "Buenos Aires",
      period: "Departure",
      nights: [{ key: "29 NOV", date: "Nov 29" }],
    },
  ];

  // Process all services and determine inclusion status
  const processedServices = chronologicalServices.map((service) => {
    if (service.type === "accommodation") {
      const includedNights = service.nights.filter(
        (night) => rsvpData[night.key] === true
      );
      const excludedNights = service.nights.filter(
        (night) => rsvpData[night.key] === false
      );

      return {
        ...service,
        includedNights,
        excludedNights,
        isIncluded: includedNights.length > 0,
      };
    } else {
      // Flight
      return {
        ...service,
        isIncluded: rsvpData[service.key] === true,
      };
    }
  });

  // Separate included and excluded services
  const includedServices = processedServices.filter(
    (service) => service.isIncluded
  );
  const excludedServices = processedServices.filter(
    (service) => !service.isIncluded
  );

  return (
    <section className="form-section">
      <h2>
        <i className="fas fa-check-circle"></i> Your Confirmed Trip Details
      </h2>

      {/* Personal Information */}
      <div className="rsvp-personal-info">
        <div className="info-card">
          <h3>Traveler Information</h3>
          <div className="info-row">
            <span className="label">Name:</span>
            <span className="value">{name}</span>
          </div>
          {plusOneName && (
            <div className="info-row">
              <span className="label">Plus One:</span>
              <span className="value">{plusOneName}</span>
            </div>
          )}
          <div className="info-row">
            <span className="label">Email:</span>
            <span className="value">{email}</span>
          </div>

          <div className="info-row">
            <span className="label">Room Type:</span>
            <span className="value">
              {plusOneName ? "Shared Room" : "Solo Traveler"}
            </span>
          </div>
        </div>
      </div>

      {/* Pack Price Display */}
      {packPrice && (
        <div className="pack-price-section">
          <div className="pack-price-card">
            <h3>
              <i className="fas fa-tag"></i> Trip Package Price
            </h3>
            <div className="pack-price-display">
              <span className="pack-price-label">
                Price for selected flights and accommodations
              </span>
              <span className="pack-price-amount">${packPrice}</span>
            </div>
          </div>
        </div>
      )}

      {/* Included Services */}
      <div className="services-section">
        <h3>
          <i className="fas fa-star"></i> Your Confirmed Services
        </h3>
        <p className="services-description">
          These flights and accommodations are confirmed for your trip:
        </p>

        <div className="services-grid">
          {includedServices.map((service, index) => (
            <div key={index} className="service-item included">
              <div className="service-icon">
                <i
                  className={
                    service.type === "accommodation"
                      ? "fas fa-bed"
                      : "fas fa-plane"
                  }
                ></i>
              </div>
              <div className="service-details">
                <div className="service-title">
                  {service.type === "accommodation"
                    ? `${service.location} Accommodation${service.period ? ` (${service.period})` : ""}`
                    : `Flight ${service.route}`}
                </div>
                {service.type === "accommodation" ? (
                  <div className="service-nights">
                    {service.includedNights.map((night, nightIndex) => (
                      <span key={nightIndex} className="night-badge">
                        {night.date}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="service-date">{service.date}</div>
                )}
              </div>
              <div className="service-status included">
                <i className="fas fa-check"></i>
                <span>Included</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Luggage Options */}
      <div className="luggage-addon-section">
        <h3>
          <i className="fas fa-suitcase"></i> Luggage Options
        </h3>

        {/* Carry-on Luggage - Always included */}
        <div className="luggage-addon-card included disabled">
          <div className="luggage-checkbox">
            <input
              type="checkbox"
              checked={true}
              disabled={true}
              style={{ pointerEvents: "none" }}
            />
          </div>
          <div className="luggage-icon carry-on">
            <i className="fas fa-carry-on"></i>
          </div>
          <div className="luggage-details">
            <div className="luggage-title">Carry-on Luggage</div>
            <div className="luggage-description">
              Personal item + carry-on bag (max 10kg)
            </div>
          </div>
          <div className="luggage-price included">
            <span className="price-amount">Included</span>
          </div>
        </div>

        {/* Checked Luggage - Optional addon */}
        {checkedLuggagePrice && (
          <div
            className={`luggage-addon-card ${isLuggageSelected ? "selected" : ""}`}
            onClick={handleLuggageToggle}
            style={{ cursor: "pointer" }}
          >
            <div className="luggage-checkbox">
              <input
                type="checkbox"
                checked={isLuggageSelected}
                onChange={() => {}} // Handled by card click
                style={{ pointerEvents: "none" }}
              />
            </div>
            <div className="luggage-icon">
              <i className="fas fa-suitcase-rolling"></i>
            </div>
            <div className="luggage-details">
              <div className="luggage-title">Checked Luggage</div>
              <div className="luggage-description">
                Add checked luggage to all your flights (max 23kg)
              </div>
            </div>
            <div className="luggage-price">
              <span className="price-amount">${checkedLuggagePrice}</span>
              <span className="price-currency">USD</span>
            </div>
          </div>
        )}
      </div>

      {/* Show excluded services if requested */}
      {showAllDetails && excludedServices.length > 0 && (
        <div className="services-section">
          <h3>
            <i className="fas fa-times-circle"></i> Services Not Included
          </h3>
          <p className="services-description">
            These flights and accommodations are not included in your trip:
          </p>

          <div className="services-grid">
            {excludedServices.map((service, index) => (
              <div key={`excluded-${index}`} className="service-item excluded">
                <div className="service-icon">
                  <i
                    className={
                      service.type === "accommodation"
                        ? "fas fa-bed"
                        : "fas fa-plane"
                    }
                  ></i>
                </div>
                <div className="service-details">
                  <div className="service-title">
                    {service.type === "accommodation"
                      ? `${service.location} Accommodation${service.period ? ` (${service.period})` : ""}`
                      : `Flight ${service.route}`}
                  </div>
                  {service.type === "accommodation" ? (
                    <div className="service-nights">
                      {service.excludedNights?.map((night, nightIndex) => (
                        <span key={nightIndex} className="night-badge excluded">
                          {night.date}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="service-date">{service.date}</div>
                  )}
                </div>
                <div className="service-status excluded">
                  <i className="fas fa-times"></i>
                  <span>Not Included</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toggle details button */}
      {excludedServices.length > 0 && (
        <div className="toggle-details">
          <button
            type="button"
            className="btn-link"
            onClick={() => setShowAllDetails(!showAllDetails)}
          >
            {showAllDetails ? "Hide" : "Show"} services not included
            <i
              className={`fas fa-chevron-${showAllDetails ? "up" : "down"}`}
            ></i>
          </button>
        </div>
      )}

      {/* Readonly Notice */}
      <div className="readonly-notice">
        <div className="notice-content">
          <i className="fas fa-info-circle"></i>
          <div>
            <h4>Need to make changes?</h4>
            <p>
              This information is based on your confirmed RSVP. If you need to
              modify any of these details, please contact{" "}
              <a
                href="https://wa.me/34689200162"
                target="_blank"
                rel="noopener noreferrer"
              >
                Maddie on WhatsApp <i className="fab fa-whatsapp"></i>
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onLogout}>
          <i className="fas fa-sign-out-alt"></i> Log Out
        </button>
        <button type="button" className="submit-btn" onClick={onContinue}>
          <i className="fas fa-arrow-right"></i> Continue to Add-ons
        </button>
      </div>
    </section>
  );
};

export default RSVPDisplay;
