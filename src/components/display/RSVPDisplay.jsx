import { useState, useEffect } from "react";
import { LUGGAGE, FORM_FIELDS } from "../../utils/config";
import {
  getPersonalInfo,
  getPricingInfo,
  getTripItinerary,
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
  const [showHealthInsuranceDetails, setShowHealthInsuranceDetails] =
    useState(false);
  const [showConfirmationDetails, setShowConfirmationDetails] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [hasInitialized, setHasInitialized] = useState(false);

  // Extract data using centralized utilities
  const personalInfo = getPersonalInfo(rsvpData, formData);
  const pricingInfo = getPricingInfo(rsvpData);
  const tripItinerary = getTripItinerary(rsvpData);
  const excludedServices = getExcludedTripServices(rsvpData);

  // Initialize form data with RSVP data only once, not when user clears fields
  useEffect(() => {
    if (!hasInitialized && (personalInfo.firstName || personalInfo.lastName)) {
      if (!formData[FORM_FIELDS.FIRST_NAME] && personalInfo.firstName) {
        updateFormData(FORM_FIELDS.FIRST_NAME, personalInfo.firstName);
      }
      if (!formData[FORM_FIELDS.LAST_NAME] && personalInfo.lastName) {
        updateFormData(FORM_FIELDS.LAST_NAME, personalInfo.lastName);
      }
      setHasInitialized(true);
    }
  }, [
    hasInitialized,
    personalInfo.firstName,
    personalInfo.lastName,
    formData,
    updateFormData,
  ]);

  // Initial validation check for empty required fields
  useEffect(() => {
    const errors = {};

    if (!formData[FORM_FIELDS.FIRST_NAME]?.trim()) {
      errors[FORM_FIELDS.FIRST_NAME] = true;
    }

    if (!formData[FORM_FIELDS.LAST_NAME]?.trim()) {
      errors[FORM_FIELDS.LAST_NAME] = true;
    }

    if (!formData[FORM_FIELDS.PHONE_NUMBER]?.trim()) {
      errors[FORM_FIELDS.PHONE_NUMBER] = true;
    }

    setValidationErrors(errors);
  }, [
    formData[FORM_FIELDS.FIRST_NAME],
    formData[FORM_FIELDS.LAST_NAME],
    formData[FORM_FIELDS.PHONE_NUMBER],
  ]);

  // Focus on phone number input when component loads
  useEffect(() => {
    const phoneInput = document.getElementById("phone-number-input");
    if (phoneInput) {
      phoneInput.focus();
    }
  }, []); // Empty dependency array means this runs once when component mounts

  // Validation function
  const validateRequiredFields = () => {
    const errors = {};

    if (!formData[FORM_FIELDS.FIRST_NAME]?.trim()) {
      errors[FORM_FIELDS.FIRST_NAME] = true;
    }

    if (!formData[FORM_FIELDS.LAST_NAME]?.trim()) {
      errors[FORM_FIELDS.LAST_NAME] = true;
    }

    if (!formData[FORM_FIELDS.PHONE_NUMBER]?.trim()) {
      errors[FORM_FIELDS.PHONE_NUMBER] = true;
    }

    setValidationErrors(errors);

    // Check if confirmation is checked
    const hasFieldErrors = Object.keys(errors).length > 0;
    const hasConfirmationError = !formData.travelDocumentConfirmed;

    // If confirmation checkbox is not checked, scroll to it
    if (hasConfirmationError) {
      const confirmationElement = document.getElementById(
        "travel-document-confirmation"
      );
      if (confirmationElement) {
        confirmationElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        // Add a visual flash effect
        confirmationElement.classList.add("highlight-error");
        setTimeout(() => {
          confirmationElement.classList.remove("highlight-error");
        }, 2000);
      }
    }

    return hasFieldErrors === false && hasConfirmationError === false;
  };

  // Handle continue with validation
  const handleContinueClick = () => {
    if (validateRequiredFields()) {
      onContinue();
    }
  };

  // Handle input change and real-time validation
  const handleInputChange = (field, value) => {
    updateFormData(field, value);

    // Real-time validation - show error if field is empty
    if (!value?.trim()) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: true,
      }));
    } else {
      // Clear validation error for this field if it now has a value
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle input blur for validation
  const handleInputBlur = (field, value) => {
    if (!value?.trim()) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: true,
      }));
    }
  };

  // Handle checked luggage selection
  const isLuggageSelected = Boolean(formData[FORM_FIELDS.CHECKED_LUGGAGE]);

  const handleLuggageToggle = () => {
    updateFormData(FORM_FIELDS.CHECKED_LUGGAGE, !isLuggageSelected);
  };

  // Helper function to get generic hotel description
  const getGenericHotelDescription = (location) => `Hotel in ${location}`;

  // Helper function to extract city names from route
  const extractCityNames = (route) => {
    const cities = route.split(" → ");
    return { origin: cities[0].replace("→", ""), destination: cities[1] };
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
    const flightToBRC = flights.find((flight) => flight.code === "JA3047");
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
                * per person, double occupancy
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
                    <div>
                      <span className="flight-segment">{cities.origin}</span>
                    </div>

                    <div className="flight-date ">
                      <span>
                        ({service.departure.airport}) {service.departure.time}
                      </span>
                      <span className="flight-arrow"> → </span>
                      <span>
                        {cities.destination} ({service.arrival.airport}){" "}
                        {service.arrival.time}
                      </span>
                    </div>
                  </div>
                );
              })()}
              <div className="flight-date">
                {service.date} - {service.code}
              </div>
              <div className="flight-date">{service.airline}</div>
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

          {/* Email - Always read-only, first */}
          <div className="info-row">
            <span className="label">Email:</span>
            <span className="value">{personalInfo.email}</span>
          </div>

          {/* First Name - Editable */}
          <div className="info-row">
            <span className="label">First Name:</span>
            <input
              id="first-name-input"
              type="text"
              value={formData[FORM_FIELDS.FIRST_NAME] || ""}
              onChange={(e) =>
                handleInputChange(FORM_FIELDS.FIRST_NAME, e.target.value)
              }
              onBlur={(e) =>
                handleInputBlur(FORM_FIELDS.FIRST_NAME, e.target.value)
              }
              placeholder="Enter your first name"
              className={`editable-input ${validationErrors[FORM_FIELDS.FIRST_NAME] ? "error" : ""}`}
              required
            />
          </div>

          {/* Last Name - Editable */}
          <div className="info-row">
            <span className="label">Last Name:</span>
            <input
              id="last-name-input"
              type="text"
              value={formData[FORM_FIELDS.LAST_NAME] || ""}
              onChange={(e) =>
                handleInputChange(FORM_FIELDS.LAST_NAME, e.target.value)
              }
              onBlur={(e) =>
                handleInputBlur(FORM_FIELDS.LAST_NAME, e.target.value)
              }
              placeholder="Enter your last name"
              className={`editable-input ${validationErrors[FORM_FIELDS.LAST_NAME] ? "error" : ""}`}
              required
            />
          </div>

          {/* Phone Number - Editable */}
          <div className="info-row">
            <span className="label">Phone Number:</span>
            <input
              id="phone-number-input"
              type="text"
              value={formData[FORM_FIELDS.PHONE_NUMBER] || ""}
              onChange={(e) =>
                handleInputChange(FORM_FIELDS.PHONE_NUMBER, e.target.value)
              }
              onBlur={(e) =>
                handleInputBlur(FORM_FIELDS.PHONE_NUMBER, e.target.value)
              }
              placeholder="Enter your phone number"
              className={`editable-input ${validationErrors[FORM_FIELDS.PHONE_NUMBER] ? "error" : ""}`}
              required
            />
          </div>

          {/* Plus One - Read-only, at bottom */}
          {personalInfo.plusOneName && (
            <div className="info-row">
              <span className="label">Plus One:</span>
              <span className="value">{personalInfo.plusOneName}</span>
            </div>
          )}

          {/* Room Type - Read-only, at bottom */}
        </div>

        {/* Travel Document & Health Insurance Confirmation */}
        <div
          id="travel-document-confirmation"
          className="travel-document-confirmation"
        >
          <div className="confirmation-checkbox">
            <input
              type="checkbox"
              id="travel-document-check"
              checked={formData.travelDocumentConfirmed}
              onChange={(e) =>
                updateFormData("travelDocumentConfirmed", e.target.checked)
              }
            />
            <label htmlFor="travel-document-check">
              <span className="checkmark"></span>
              <div className="confirmation-text">
                <strong>
                  I confirm that I have read, understood, and agreed to the
                  following terms and conditions
                </strong>

                {/* Collapsible Terms Details */}
                <div className="confirmation-details">
                  <button
                    type="button"
                    className="btn-link details-toggle"
                    onClick={() =>
                      setShowConfirmationDetails(!showConfirmationDetails)
                    }
                  >
                    {showConfirmationDetails ? "Hide" : "Show"} terms and
                    conditions
                    <i
                      className={`fas fa-chevron-${showConfirmationDetails ? "up" : "down"}`}
                    ></i>
                  </button>

                  {showConfirmationDetails && (
                    <div className="confirmation-requirements">
                      <div className="terms-section">
                        <h4>TRAVELER INFORMATION</h4>
                        <ul>
                          <li>
                            The name and surname above{" "}
                            <strong>exactly match</strong> my travel document
                            (passport/ID) for this trip
                          </li>
                          <li>
                            I have <strong>double-checked</strong> all my
                            traveler information above
                          </li>
                          <li>
                            All information provided is accurate and complete
                          </li>
                        </ul>
                      </div>

                      <div className="terms-section">
                        <h4>HEALTH INSURANCE</h4>
                        <ul>
                          <li>
                            I have or will obtain by the time of the trip a
                            valid health insurance policy that complies with the
                            new Argentine requirement established by{" "}
                            <a
                              href="https://www.boletinoficial.gob.ar/detalleAviso/primera/326096/20250529"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Decree 366/2025
                            </a>
                            , covering all regular medical treatments and
                            services during my stay in Argentina.
                          </li>
                        </ul>

                        {/* Collapsible Health Insurance Details */}
                        <div className="health-insurance-details">
                          <button
                            type="button"
                            className="btn-link details-toggle"
                            onClick={() =>
                              setShowHealthInsuranceDetails(
                                !showHealthInsuranceDetails
                              )
                            }
                          >
                            {showHealthInsuranceDetails ? "Hide" : "Show"}{" "}
                            health insurance requirements
                            <i
                              className={`fas fa-chevron-${showHealthInsuranceDetails ? "up" : "down"}`}
                            ></i>
                          </button>

                          {showHealthInsuranceDetails && (
                            <div className="health-insurance-requirements">
                              <p>
                                In accordance with{" "}
                                <a
                                  href="https://www.boletinoficial.gob.ar/detalleAviso/primera/326096/20250529"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Decree 366/2025
                                </a>
                                , all foreign visitors to Argentina must have
                                valid health insurance that:
                              </p>
                              <ul>
                                <li>
                                  Covers general medical care, outpatient
                                  treatment, and hospitalization.
                                </li>
                                <li>
                                  Is valid throughout the entire stay in
                                  Argentina.
                                </li>
                                <li>
                                  Clearly states that it covers the traveler
                                  while in Argentina (country-specific
                                  coverage).
                                </li>
                                <li>
                                  Includes coverage for medical emergencies.
                                </li>
                                <li>
                                  May be required to be presented at the border
                                  or upon request by local authorities.
                                </li>
                              </ul>
                              <p>
                                <strong>Note:</strong> Public healthcare
                                services in Argentina will only be available to
                                non-residents in cases of emergency. For all
                                other situations, proof of valid health
                                insurance will be required in order to receive
                                care.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="terms-section">
                        <h4>TERMS & CONDITIONS</h4>
                        <ul>
                          <li>
                            This proposal is subject to availability and may
                            change until the group reservation is confirmed with
                            a deposit. In case of delayed payments, prices may
                            be adjusted due to currency fluctuations or updated
                            supplier rates.
                          </li>
                          <li>
                            Deposits are non-refundable. The remaining balance
                            must be paid according to the specified deadlines.
                          </li>
                          <li>
                            Prices do not include visa processing fees or travel
                            insurance. Each traveler is responsible for
                            obtaining the necessary visa and health insurance.
                          </li>
                          <li>
                            All passengers must have valid travel documents in
                            good condition. It is the traveler's responsibility
                            to verify passport, visa, and health requirements. A
                            passport valid for at least 6 months is recommended.
                          </li>
                          <li>
                            The organizer acts solely as an intermediary and is
                            not responsible for delays, changes, or
                            cancellations due to weather, third parties, or
                            force majeure.
                          </li>
                          <li>
                            Participation in all activities implies voluntary
                            acceptance of associated risks.
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </label>
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
                href="https://wa.me/5491169729783"
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
          className={`luggage-addon-card discouraged ${isLuggageSelected ? "selected" : ""}`}
          onClick={(e) => {
            // Allow clicking the whole card to toggle, but not if clicking the checkbox directly
            if (e.target.id !== "checked-luggage-checkbox") {
              handleLuggageToggle();
            }
          }}
        >
          <div className="luggage-checkbox">
            <input
              type="checkbox"
              id="checked-luggage-checkbox"
              checked={isLuggageSelected}
              onChange={handleLuggageToggle}
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
            {isLuggageSelected && LUGGAGE.checked.warningMessage && (
              <div className="luggage-warning">
                {LUGGAGE.checked.warningMessage}
              </div>
            )}
          </div>
          <div className="luggage-price">
            <span className="price-amount on-demand">$ On demand</span>
            <span className="price-currency"></span>
          </div>
        </div>
      </div>

      {/* Navigation Buttons - Only show if hideNavigation is false */}
      {!hideNavigation && (
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onLogout}>
            <i className="fas fa-arrow-left"></i> Go Back
          </button>
          <button
            type="button"
            className="submit-btn"
            onClick={handleContinueClick}
          >
            <i className="fas fa-arrow-right"></i> Continue to Add-ons
          </button>
        </div>
      )}
    </section>
  );
};

export default RSVPDisplay;
