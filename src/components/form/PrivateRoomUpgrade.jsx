import { useCallback } from "react";

import { FORM_FIELDS } from "../../utils/config";
import {
  getPrivateRoomUpgradePrice,
  getIncludedAccommodations,
} from "../../utils/rsvpData";
import "../../styles/PrivateRoomUpgrade.css";

const PrivateRoomUpgrade = ({ formData, updateFormData, rsvpData }) => {
  // Get private room upgrade price - prioritize formData, then RSVP data, then 0 fallback
  const upgradePrice = getPrivateRoomUpgradePrice(rsvpData);

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

  const handleRoomSelection = useCallback(
    (isPrivateRoom) => {
      updateFormData(FORM_FIELDS.PRIVATE_ROOM_UPGRADE, isPrivateRoom);

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
    },
    [updateFormData, formData]
  );

  const handleRoommatePreferenceChange = useCallback(
    (preference) => {
      updateFormData(FORM_FIELDS.ROOMMATE_PREFERENCE, preference);
      // Clear roommate name if not selecting "know" option
      if (preference !== "know") {
        updateFormData(FORM_FIELDS.ROOMMATE_NAME, "");
      }
    },
    [updateFormData]
  );

  const handleRoommateNameChange = useCallback(
    (e) => {
      updateFormData(FORM_FIELDS.ROOMMATE_NAME, e.target.value);
    },
    [updateFormData]
  );

  // Memoized handlers for JSX
  const handlePrivateRoom = useCallback(
    () => handleRoomSelection(true),
    [handleRoomSelection]
  );
  const handleSharedRoom = useCallback(
    () => handleRoomSelection(false),
    [handleRoomSelection]
  );
  const handleStopPropagation = useCallback((e) => e.stopPropagation(), []);

  // Roommate preference handlers
  const handleRandomPreference = useCallback(
    () => handleRoommatePreferenceChange("random"),
    [handleRoommatePreferenceChange]
  );
  const handleKnowPreference = useCallback(
    () => handleRoommatePreferenceChange("know"),
    [handleRoommatePreferenceChange]
  );
  const handleSeekingPreference = useCallback(
    () => handleRoommatePreferenceChange("seeking"),
    [handleRoommatePreferenceChange]
  );

  return (
    <section className="form-section">
      <h2>
        <i className="fas fa-bed" /> Room Accommodation
      </h2>
      <p className="section-description">
        Choose your preferred room arrangement
      </p>

      <div className="room-options-container">
        {/* Private Room Upgrade Option */}
        <div
          className={`room-option-card ${hasPrivateRoomUpgrade ? "room-selected" : ""}`}
          onClick={handlePrivateRoom}
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
                  onChange={handlePrivateRoom}
                  className="room-radio"
                />
                <label htmlFor="privateRoom" className="radio-label" />
              </div>
              <div className="option-info">
                <i className="fas fa-crown" />
                <h3>Private Room Upgrade</h3>
              </div>
            </div>
            <div className="room-option-details">
              <div className="room-description">
                <p>Get your own private room in:</p>
                <ul>
                  {accommodations.map((accommodation) => (
                    <li key={accommodation}>{accommodation}</li>
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

        {/* Shared Room Option (Default) */}
        <div
          className={`room-option-card ${!hasPrivateRoomUpgrade ? "room-selected" : ""}`}
          onClick={handleSharedRoom}
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
                  onChange={handleSharedRoom}
                  className="room-radio"
                />
                <label htmlFor="sharedRoom" className="radio-label" />
              </div>
              <div className="option-info">
                <i className="fas fa-users" />
                <h3>Shared Room</h3>
              </div>
            </div>
            <div className="room-option-details">
              <div className="room-description">
                <p>
                  Share a room with another solo traveler from the group
                  (Subject to availability)
                </p>

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
                          onChange={handleRandomPreference}
                          className="roommate-radio"
                        />
                        <span className="radio-checkmark" />
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
                          onChange={handleKnowPreference}
                          className="roommate-radio"
                        />
                        <span className="radio-checkmark" />
                        <span className="option-text">I'm sharing with</span>
                      </label>
                      {roommatePreference === "know" && (
                        <input
                          type="text"
                          placeholder="Name"
                          value={roommateName}
                          onChange={handleRoommateNameChange}
                          className="roommate-name-input"
                          onClick={handleStopPropagation}
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
                          onChange={handleSeekingPreference}
                          className="roommate-radio"
                        />
                        <span className="radio-checkmark" />
                        <span className="option-text">
                          Add me to the "find a roommate list"
                        </span>
                      </label>
                      {roommatePreference === "seeking" && (
                        <span className="roommate-help-text">
                          <i className="fas fa-info-circle" />
                          Once everyone completes their registration, we'll
                          share the list with others looking for roommates
                        </span>
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
      </div>
    </section>
  );
};

export default PrivateRoomUpgrade;
