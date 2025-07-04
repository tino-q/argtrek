import { useState } from "react";
import { LUGGAGE } from "../../utils/config";
import {
  getPersonalInfo,
  getPricingInfo,
  getTripItinerary,
  getCheckedLuggagePrice,
  getExcludedTripServices,
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
  const excludedServices = getExcludedTripServices(rsvpData);
  const checkedLuggagePrice = getCheckedLuggagePrice(rsvpData);

  // Handle checked luggage selection
  const isLuggageSelected = Boolean(formData?.luggage);

  const handleLuggageToggle = () => {
    updateFormData("luggage", !isLuggageSelected);
  };

  // Helper function to get generic hotel description
  const getGenericHotelDescription = (location) => `Hotel in ${location}`;

  // Helper function to extract city names from route
  const extractCityNames = (route) => {
    const cities = route.split(" → ");
    return { origin: cities[0], destination: cities[1] };
  };

  // Define all services in chronological order using centralized data
  const createChronologicalServices = (accommodations, flights, isIncluded) => {
    const services = [];

    // Nov 22-23: Buenos Aires Arrival
    const buenosAiresArrival = accommodations.find(
      (acc) => acc.location === "Buenos Aires" && acc.period === "arrival"
    );
    if (buenosAiresArrival) {
      services.push({
        type: "accommodation",
        location: buenosAiresArrival.location,
        period: buenosAiresArrival.period,
        hotelName: buenosAiresArrival.hotelName,
        address: buenosAiresArrival.address,
        nights: buenosAiresArrival.nights.map((night) => ({ date: night })),
        isIncluded,
        sortOrder: 1,
      });
    }

    // Nov 24: Flight Buenos Aires → Bariloche
    const flightToBRC = flights.find((flight) => flight.code === "JA3045");
    if (flightToBRC) {
      services.push({
        type: "flight",
        code: flightToBRC.code,
        airline: flightToBRC.airline,
        route: flightToBRC.route,
        departure: flightToBRC.departure,
        arrival: flightToBRC.arrival,
        date: flightToBRC.date,
        duration: flightToBRC.duration,
        aircraft: flightToBRC.aircraft,
        isIncluded,
        sortOrder: 2,
      });
    }

    // Nov 24-26: Bariloche
    const bariloche = accommodations.find(
      (acc) => acc.location === "Bariloche" && !acc.period
    );
    if (bariloche) {
      services.push({
        type: "accommodation",
        location: bariloche.location,
        period: bariloche.period,
        hotelName: bariloche.hotelName,
        address: bariloche.address,
        nights: bariloche.nights.map((night) => ({ date: night })),
        isIncluded,
        sortOrder: 3,
      });
    }

    // Nov 27: Flight Bariloche → Mendoza
    const flightToMDZ = flights.find((flight) => flight.code === "JA3725");
    if (flightToMDZ) {
      services.push({
        type: "flight",
        code: flightToMDZ.code,
        airline: flightToMDZ.airline,
        route: flightToMDZ.route,
        departure: flightToMDZ.departure,
        arrival: flightToMDZ.arrival,
        date: flightToMDZ.date,
        duration: flightToMDZ.duration,
        aircraft: flightToMDZ.aircraft,
        isIncluded,
        sortOrder: 4,
      });
    }

    // Nov 27-28: Mendoza
    const mendoza = accommodations.find(
      (acc) => acc.location === "Mendoza" && !acc.period
    );
    if (mendoza) {
      services.push({
        type: "accommodation",
        location: mendoza.location,
        period: mendoza.period,
        hotelName: mendoza.hotelName,
        address: mendoza.address,
        nights: mendoza.nights.map((night) => ({ date: night })),
        isIncluded,
        sortOrder: 5,
      });
    }

    // Nov 29: Flight Mendoza → Buenos Aires
    const flightToAEP = flights.find((flight) => flight.code === "JA3073");
    if (flightToAEP) {
      services.push({
        type: "flight",
        code: flightToAEP.code,
        airline: flightToAEP.airline,
        route: flightToAEP.route,
        departure: flightToAEP.departure,
        arrival: flightToAEP.arrival,
        date: flightToAEP.date,
        duration: flightToAEP.duration,
        aircraft: flightToAEP.aircraft,
        isIncluded,
        sortOrder: 6,
      });
    }

    // Nov 29: Buenos Aires Departure
    const buenosAiresDeparture = accommodations.find(
      (acc) => acc.location === "Buenos Aires" && acc.period === "departure"
    );
    if (buenosAiresDeparture) {
      services.push({
        type: "accommodation",
        location: buenosAiresDeparture.location,
        period: buenosAiresDeparture.period,
        hotelName: buenosAiresDeparture.hotelName,
        address: buenosAiresDeparture.address,
        nights: buenosAiresDeparture.nights.map((night) => ({ date: night })),
        isIncluded,
        sortOrder: 7,
      });
    }

    // Sort by chronological order
    return services.sort((a, b) => a.sortOrder - b.sortOrder);
  };

  // Create chronologically ordered services
  const includedServices = createChronologicalServices(
    tripItinerary.accommodations,
    tripItinerary.flights,
    true
  );

  console.log({
    accommodations: excludedServices.accommodations,
    flights: excludedServices.flights,
    createChronologicalServicesValue: createChronologicalServices(
      excludedServices.accommodations,
      excludedServices.flights,
      false
    ),
  });

  const excludedProcessedServices = createChronologicalServices(
    excludedServices.accommodations,
    excludedServices.flights,
    false
  );

  // Reusable service card component
  const ServiceCard = ({ service, index, isIncluded }) => (
    <div
      key={isIncluded ? index : `excluded-${index}`}
      className={`service-item ${isIncluded ? "included" : "excluded"}`}
    >
      <div className="service-icon">
        <i
          className={
            service.type === "accommodation" ? "fas fa-bed" : "fas fa-plane"
          }
        ></i>
      </div>
      <div className="service-details">
        {service.type === "accommodation" ? (
          <>
            <div className="accommodation-single-line">
              <div className="accommodation-info-line">
                <span className="hotel-name-simple">
                  {getGenericHotelDescription(service.location)}
                </span>
              </div>
              <div className="accommodation-dates">
                {service.nights.length === 1
                  ? service.nights[0].date
                  : `${service.nights[0].date} - ${service.nights[service.nights.length - 1].date}`}
              </div>
              <div className="accommodation-dates">
                * per person based on double occupancy
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Flight - Single Line Format */}
            <div className="flight-single-line">
              {(() => {
                const cities = extractCityNames(service.route);
                return (
                  <div className="flight-route-line">
                    <span className="flight-segment">
                      {cities.origin} ({service.departure.airport}){" "}
                      {service.departure.time}
                    </span>
                    <span className="flight-arrow"> → </span>
                    <span className="flight-segment">
                      {cities.destination} ({service.arrival.airport}){" "}
                      {service.arrival.time}
                    </span>
                  </div>
                );
              })()}
              <div className="flight-date">
                {service.date} - {service.code} - {service.airline}
              </div>
            </div>
          </>
        )}
      </div>
      <div className={`service-status ${isIncluded ? "included" : "excluded"}`}>
        <i className={`fas fa-${isIncluded ? "check" : "times"}`}></i>
        <span>{isIncluded ? "Included" : "Not Included"}</span>
      </div>
    </div>
  );

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
          {includedServices.map((service, index) => {
            return (
              <ServiceCard
                key={index}
                service={service}
                index={index}
                isIncluded={true}
              />
            );
          })}
        </div>
      </div>

      {/* Toggle details button */}
      {excludedProcessedServices.length > 0 && (
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
      {showAllDetails && excludedProcessedServices.length > 0 && (
        <div className="services-section">
          <h3>
            <i className="fas fa-times-circle"></i> Services Not Included
          </h3>
          <p className="services-description">
            These flights and accommodations are not included in your trip:
          </p>

          <div className="services-grid">
            {excludedProcessedServices.map((service, index) => {
              return (
                <ServiceCard
                  key={`excluded-${index}`}
                  service={service}
                  index={index}
                  isIncluded={false}
                />
              );
            })}
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
              {LUGGAGE.personalItem.description}
              {LUGGAGE.personalItem.maxWeight &&
                ` (max ${LUGGAGE.personalItem.maxWeight})`}
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
