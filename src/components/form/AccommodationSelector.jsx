import { FORM_FIELDS } from "../../utils/config";

const AccommodationSelector = ({ formData, updateFormData }) => {
  const isSharedRoom = formData[FORM_FIELDS.ACCOMMODATION] === "0";

  return (
    <section className="form-section">
      <h2>
        <i className="fas fa-bed"></i> Accommodation
      </h2>

      <div className="form-group">
        <label className="section-label">Accommodation Preference *</label>

        <div className="radio-group">
          <div className="radio-option">
            <input
              type="radio"
              id="privateRoom"
              name="accommodation"
              value="private"
              checked={formData[FORM_FIELDS.ACCOMMODATION] === "private"}
              onChange={(e) =>
                updateFormData(FORM_FIELDS.ACCOMMODATION, e.target.value)
              }
              required
            />
            <label htmlFor="privateRoom">
              <div className="option-content">
                <h3>Private Room</h3>
                <p className="price">+$350 USD</p>
                <p className="description">
                  Single occupancy in Buenos Aires, Mendoza & Bariloche
                </p>
              </div>
            </label>
          </div>

          <div className="radio-option">
            <input
              type="radio"
              id="sharedRoom"
              name="accommodation"
              value="0"
              checked={formData[FORM_FIELDS.ACCOMMODATION] === "0"}
              onChange={(e) =>
                updateFormData(FORM_FIELDS.ACCOMMODATION, e.target.value)
              }
              required
            />
            <label htmlFor="sharedRoom">
              <div className="option-content">
                <h3>Shared Room</h3>
                <p className="price">Included</p>
                <p className="description">Share with another participant</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Conditional Roommate Field */}
      {isSharedRoom && (
        <div className="form-group">
          <label htmlFor="roommate">Roommate Name</label>
          <input
            type="text"
            id="roommate"
            name="roommate"
            value={formData[FORM_FIELDS.ROOMMATE] || ""}
            onChange={(e) =>
              updateFormData(FORM_FIELDS.ROOMMATE, e.target.value)
            }
            placeholder="Name of the person you're sharing with"
          />
        </div>
      )}
    </section>
  );
};

export default AccommodationSelector;
