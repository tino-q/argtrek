import { useState } from "react";
import { LUGGAGE } from "../../utils/config";
import {
  getPersonalInfo,
  getPricingInfo,
  getTripItinerary,
  getCheckedLuggagePrice,
} from "../../utils/rsvpData";

const RSVPDisplay = ({
  rsvpData,
  onContinue,
  onLogout,
  formData,
  updateFormData,
  hideNavigation = false,
}) => {
  const [showAllDetails, setShowAllDetails] = useState(false);

  // Extract data using centralized utilities
  const personalInfo = getPersonalInfo(rsvpData);
  const pricingInfo = getPricingInfo(rsvpData);
  const tripItinerary = getTripItinerary(rsvpData);
  const checkedLuggagePrice = getCheckedLuggagePrice(rsvpData);

  // Handle checked luggage selection
  const isLuggageSelected = Boolean(formData?.luggage);

  const handleLuggageToggle = () => {
    updateFormData("luggage", !isLuggageSelected);
  };

  // Define all services in chronological order using centralized data
  const processedServices = [
    // Accommodations
    ...tripItinerary.accommodations.map((accommodation) => ({
      type: "accommodation",
      location: accommodation.location,
      period: accommodation.period,
      nights: accommodation.nights.map((night) => ({ date: night })),
      isIncluded: true,
    })),
    // Flights
    ...tripItinerary.flights.map((flight) => ({
      type: "flight",
      code: flight.code,
      route: flight.route,
      date: flight.date,
      isIncluded: true,
    })),
  ];

  // For simplicity, assume all services from the utility are included
  const includedServices = processedServices;
  const excludedServices = []; // We'd need more logic here for excluded services

  return (
    <section className="form-section">
      <h2>
        <i className="fas fa-check-circle"></i> Trip Confirmed
      </h2>

      {/* Personal Information */}
      <div className="rsvp-personal-info">
        <div className="info-card">
          <h3>Traveler Information</h3>
          <div className="info-row">
            <span className="label">Name:</span>
            <span className="value">{personalInfo.name}</span>
          </div>
          {personalInfo.plusOneName && (
            <div className="info-row">
              <span className="label">Plus One:</span>
              <span className="value">{personalInfo.plusOneName}</span>
            </div>
          )}
          <div className="info-row">
            <span className="label">Email:</span>
            <span className="value">{personalInfo.email}</span>
          </div>

          <div className="info-row">
            <span className="label">Room Type:</span>
            <span className="value">
              {personalInfo.plusOneName ? "Shared Room" : "Solo Traveler"}
            </span>
          </div>
        </div>
      </div>

      {/* Pack Price Display */}
      {pricingInfo.basePrice && (
        <div className="pack-price-section">
          <div className="pack-price-card">
            <h3>
              <i className="fas fa-tag"></i> Trip Package Price
            </h3>
            <div className="pack-price-display">
              <span className="pack-price-label">
                Price for selected flights and accommodations
              </span>
              <span className="pack-price-amount">
                ${pricingInfo.basePrice}
              </span>
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
                    {service.nights.map((night, nightIndex) => (
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

      {/* Services Not Included */}
      {showAllDetails && excludedServices.length > 0 && (
        <div className="services-section">
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
                      {service.nights.map((night, nightIndex) => (
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

      {/* Luggage Options */}
      <div className="luggage-addon-section">
        <h3>
          <i className="fas fa-suitcase"></i> Luggage Options
        </h3>

        {/* Personal Item - Always included */}
        <div className="luggage-addon-card included disabled">
          <div className="luggage-checkbox">
            <input
              type="checkbox"
              checked={true}
              disabled={true}
              style={{ pointerEvents: "none" }}
            />
          </div>
          <div className="luggage-icon personal-item">
            <i className={LUGGAGE.personalItem.icon}></i>
          </div>
          <div className="luggage-details">
            <div className="luggage-title">{LUGGAGE.personalItem.name}</div>
            <div className="luggage-description">
              {LUGGAGE.personalItem.description} (max{" "}
              {LUGGAGE.personalItem.maxWeight})
            </div>
          </div>
          <div className="luggage-price included">
            <span className="price-amount">Included</span>
          </div>
        </div>

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
            <i className={LUGGAGE.carryOn.icon}></i>
          </div>
          <div className="luggage-details">
            <div className="luggage-title">{LUGGAGE.carryOn.name}</div>
            <div className="luggage-description">
              {LUGGAGE.carryOn.description} (max {LUGGAGE.carryOn.maxWeight})
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
              <i className={LUGGAGE.checked.icon}></i>
            </div>
            <div className="luggage-details">
              <div className="luggage-title">{LUGGAGE.checked.name}</div>
              <div className="luggage-description">
                {LUGGAGE.checked.description} (max {LUGGAGE.checked.maxWeight})
              </div>
            </div>
            <div className="luggage-price">
              <span className="price-amount">${checkedLuggagePrice}</span>
              <span className="price-currency">USD</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons - Only show if hideNavigation is false */}
      {!hideNavigation && (
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onLogout}>
            <i className="fas fa-arrow-left"></i> Go Back
          </button>
          <button type="button" className="submit-btn" onClick={onContinue}>
            <i className="fas fa-arrow-right"></i> Continue to Add-ons
          </button>
        </div>
      )}
    </section>
  );
};

export default RSVPDisplay;
