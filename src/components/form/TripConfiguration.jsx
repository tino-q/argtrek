// Trip Configuration Component - Placeholder
// TODO: Implement full trip options from original HTML

import { FORM_FIELDS } from "../../utils/config";

const TripConfiguration = ({ formData, updateFormData }) => {
  return (
    <section className="form-section">
      <h2>
        <i className="fas fa-route"></i> Trip Configuration
      </h2>

      <div className="form-group">
        <label className="section-label">Choose Your Trip Option *</label>

        {/* Warning Section */}
        <div className="trip-option-warning">
          <i className="fas fa-exclamation-triangle"></i>
          <div>
            <p>
              <strong>Important:</strong> We recommend selecting the shorter
              version if you're unsure about your availability.
            </p>
            <p>
              While extensions may be available later,{" "}
              <strong>
                we cannot guarantee the same rates will be available
              </strong>{" "}
              if you decide to book the extended version at a later stage.
              Pricing depends on group size and availability.
            </p>
          </div>
        </div>

        <div className="radio-group">
          {/* Option 1 */}
          <div className="radio-option">
            <input
              type="radio"
              id="option1"
              name="tripOption"
              value="2250"
              checked={formData[FORM_FIELDS.TRIP_OPTION] === "2250"}
              onChange={(e) =>
                updateFormData(FORM_FIELDS.TRIP_OPTION, e.target.value)
              }
              required
            />
            <label htmlFor="option1">
              <div className="option-content">
                <h3>Option 1</h3>
                <p className="price">~$2,250 USD</p>

                <div className="trip-details">
                  <div className="detail-section">
                    <h4>
                      <i className="fas fa-map-marker-alt"></i> Includes
                    </h4>
                    <ul className="detail-list">
                      <li>
                        <strong>Buenos Aires:</strong> NOV 22nd - NOV 24th
                      </li>
                      <li>
                        <strong>Bariloche:</strong> NOV 24th - NOV 27th
                      </li>
                      <li>
                        <strong>Mendoza:</strong> NOV 27th - NOV 29th
                      </li>
                    </ul>
                  </div>

                  <div className="detail-section">
                    <h4>
                      <i className="fas fa-users"></i> Best for
                    </h4>
                    <ul className="detail-list">
                      <li>
                        People who{" "}
                        <strong>do not want to miss Monday class</strong>
                      </li>
                      <li>
                        People who want to explore{" "}
                        <strong>Patagonia or Chile post Trek</strong>
                      </li>
                      <li>
                        People who want to run <strong>El Cruce</strong> (
                        <a
                          href="https://wa.me/16505126902"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="whatsapp-link"
                        >
                          talk to Facu <i className="fab fa-whatsapp"></i>
                        </a>{" "}
                        if interested)
                      </li>
                    </ul>
                  </div>

                  <div className="detail-section">
                    <h4>
                      <i className="fas fa-calendar-check"></i> Ends in
                    </h4>
                    <p className="end-location">Mendoza - November 29th</p>
                  </div>
                </div>
              </div>
            </label>
          </div>

          {/* Option 2 */}
          <div className="radio-option">
            <input
              type="radio"
              id="option2"
              name="tripOption"
              value="2600"
              checked={formData[FORM_FIELDS.TRIP_OPTION] === "2600"}
              onChange={(e) =>
                updateFormData(FORM_FIELDS.TRIP_OPTION, e.target.value)
              }
              required
            />
            <label htmlFor="option2">
              <div className="option-content">
                <h3>
                  Option 2{" "}
                  <span className="recommended-badge">
                    <i className="fas fa-star"></i> Recommended
                  </span>
                </h3>
                <p className="price">~$2,600 USD</p>

                <div className="trip-details">
                  <div className="detail-section">
                    <h4>
                      <i className="fas fa-map-marker-alt"></i> Includes
                    </h4>
                    <ul className="detail-list">
                      <li>
                        <strong>Buenos Aires:</strong> NOV 22nd - NOV 24th
                      </li>
                      <li>
                        <strong>Bariloche:</strong> NOV 24th - NOV 27th
                      </li>
                      <li>
                        <strong>Mendoza:</strong> NOV 27th - NOV 29th
                      </li>
                      <li>
                        <strong>Salta:</strong> NOV 29th - DEC 2nd
                      </li>
                    </ul>
                  </div>

                  <div className="detail-section">
                    <h4>
                      <i className="fas fa-users"></i> Best for
                    </h4>
                    <ul className="detail-list">
                      <li>
                        People who want the{" "}
                        <strong>full Argentina experience</strong>
                      </li>
                      <li>
                        People who want to see{" "}
                        <strong>Northern Argentina (Salta)</strong>
                      </li>
                      <li>
                        People who are{" "}
                        <strong>flexible with their schedule</strong>
                      </li>
                      <li>
                        People who want <strong>maximum value for money</strong>
                      </li>
                    </ul>
                  </div>

                  <div className="detail-section">
                    <h4>
                      <i className="fas fa-calendar-check"></i> Ends in
                    </h4>
                    <p className="end-location">Salta - December 2nd</p>
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TripConfiguration;
