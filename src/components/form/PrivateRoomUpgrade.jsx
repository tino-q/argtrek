import { FORM_FIELDS } from "../../utils/config";
import {
  getPrivateRoomUpgradePrice,
  getIncludedAccommodations,
} from "../../utils/rsvpData";
import "../../styles/PrivateRoomUpgrade.css";

const PrivateRoomUpgrade = ({ formData, updateFormData, rsvpData }) => {
  // Get private room upgrade price - prioritize formData, then RSVP data, then 0 fallback
  const upgradePrice =
    formData[FORM_FIELDS.ACCOMMODATION_UPGRADE_PRICE] ||
    getPrivateRoomUpgradePrice(rsvpData);

  // Extract accommodation information from RSVP data using centralized utility
  const getAccommodations = () => {
    const includedAccommodations = getIncludedAccommodations(rsvpData);

    if (includedAccommodations.length === 0) {
      return ["Buenos Aires hotel", "Bariloche", "Mendoza"];
    }

    return includedAccommodations.map((acc) => {
      if (acc.period) {
        return `${acc.location} (${acc.period})`;
      }
      return acc.location;
    });
  };

  const accommodations = getAccommodations();

  const hasPrivateRoomUpgrade =
    formData[FORM_FIELDS.PRIVATE_ROOM_UPGRADE] === true;

  const roommatePreference =
    formData[FORM_FIELDS.ROOMMATE_PREFERENCE] || "random";
  const roommateName = formData[FORM_FIELDS.ROOMMATE_NAME] || "";

  const handleRoomSelection = (isPrivateRoom) => {
    updateFormData(FORM_FIELDS.PRIVATE_ROOM_UPGRADE, isPrivateRoom);
    // Set accommodation field for pricing calculations
    updateFormData(
      FORM_FIELDS.ACCOMMODATION,
      isPrivateRoom ? "private" : "shared"
    );
    // Clear roommate preference and name if switching to private room
    if (isPrivateRoom) {
      updateFormData(FORM_FIELDS.ROOMMATE_PREFERENCE, "");
      updateFormData(FORM_FIELDS.ROOMMATE_NAME, "");
    } else {
      // Set default preference to random if switching to shared room
      if (!formData[FORM_FIELDS.ROOMMATE_PREFERENCE]) {
        updateFormData(FORM_FIELDS.ROOMMATE_PREFERENCE, "random");
      }
    }
  };

  const handleRoommatePreferenceChange = (preference) => {
    updateFormData(FORM_FIELDS.ROOMMATE_PREFERENCE, preference);
    // Clear roommate name if not selecting "know" option
    if (preference !== "know") {
      updateFormData(FORM_FIELDS.ROOMMATE_NAME, "");
    }
  };

  const handleRoommateNameChange = (e) => {
    updateFormData(FORM_FIELDS.ROOMMATE_NAME, e.target.value);
  };

  return (
    <section className="form-section">
      <h2>
        <i className="fas fa-bed"></i> Room Accommodation
      </h2>
      <p className="section-description">
        Choose your preferred room arrangement
      </p>

      <div className="room-options-container">
        {/* Shared Room Option (Default) */}
        <div
          className={`room-option-card ${!hasPrivateRoomUpgrade ? "room-selected" : ""}`}
          onClick={() => handleRoomSelection(false)}
          style={{ cursor: "pointer" }}
        >
          <div className="room-option-content">
            <div className="room-option-header">
              <div className="radio-container">
                <input
                  type="radio"
                  id="sharedRoom"
                  name="roomType"
                  checked={!hasPrivateRoomUpgrade}
                  onChange={() => handleRoomSelection(false)}
                  className="room-radio"
                />
                <label htmlFor="sharedRoom" className="radio-label"></label>
              </div>
              <div className="option-info">
                <i className="fas fa-users"></i>
                <h3>Shared Room</h3>
              </div>
            </div>
            <div className="room-option-details">
              <div className="room-description">
                <p>Share a room with another solo traveler from the group</p>

                {/* Roommate Preference Options - only shown when shared room is selected */}
                {!hasPrivateRoomUpgrade && (
                  <div className="roommate-preferences">
                    <div className="roommate-option">
                      <label className="roommate-option-label">
                        <input
                          type="radio"
                          name="roommatePreference"
                          value="random"
                          checked={roommatePreference === "random"}
                          onChange={() =>
                            handleRoommatePreferenceChange("random")
                          }
                          className="roommate-radio"
                        />
                        <span className="radio-checkmark"></span>
                        <span className="option-text">
                          I'm ok with random assignment
                        </span>
                      </label>
                    </div>

                    <div className="roommate-option">
                      <label className="roommate-option-label">
                        <input
                          type="radio"
                          name="roommatePreference"
                          value="know"
                          checked={roommatePreference === "know"}
                          onChange={() =>
                            handleRoommatePreferenceChange("know")
                          }
                          className="roommate-radio"
                        />
                        <span className="radio-checkmark"></span>
                        <span className="option-text">
                          I know who I'm sharing with
                        </span>
                      </label>
                      {roommatePreference === "know" && (
                        <input
                          type="text"
                          placeholder="Enter roommate's name"
                          value={roommateName}
                          onChange={handleRoommateNameChange}
                          className="roommate-name-input"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </div>

                    <div className="roommate-option">
                      <label className="roommate-option-label">
                        <input
                          type="radio"
                          name="roommatePreference"
                          value="seeking"
                          checked={roommatePreference === "seeking"}
                          onChange={() =>
                            handleRoommatePreferenceChange("seeking")
                          }
                          className="roommate-radio"
                        />
                        <span className="radio-checkmark"></span>
                        <span className="option-text">
                          Add me to the "seeking a roomie list" - I'll let
                          Maddie know my roomie name afterwards
                        </span>
                      </label>
                      {roommatePreference === "seeking" && (
                        <div className="roommate-help-text">
                          <i className="fas fa-info-circle"></i>
                          <span>
                            We'll share the list with others seeking roommates
                            after everyone completes their configuration
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="room-price">
                <span className="price-label">Price:</span>
                <span className="price-amount">Included</span>
              </div>
            </div>
          </div>
        </div>

        {/* Private Room Upgrade Option */}
        <div
          className={`room-option-card ${hasPrivateRoomUpgrade ? "room-selected" : ""}`}
          onClick={() => handleRoomSelection(true)}
          style={{ cursor: "pointer" }}
        >
          <div className="room-option-content">
            <div className="room-option-header">
              <div className="radio-container">
                <input
                  type="radio"
                  id="privateRoom"
                  name="roomType"
                  checked={hasPrivateRoomUpgrade}
                  onChange={() => handleRoomSelection(true)}
                  className="room-radio"
                />
                <label htmlFor="privateRoom" className="radio-label"></label>
              </div>
              <div className="option-info">
                <i className="fas fa-crown"></i>
                <h3>Private Room Upgrade</h3>
              </div>
            </div>
            <div className="room-option-details">
              <div className="room-description">
                <p>Get your own private room in:</p>
                <ul>
                  {accommodations.map((accommodation, index) => (
                    <li key={index}>{accommodation}</li>
                  ))}
                </ul>
              </div>
              <div className="room-price">
                <span className="price-label">Upgrade Price:</span>
                <span className="price-amount">+${upgradePrice} USD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrivateRoomUpgrade;
