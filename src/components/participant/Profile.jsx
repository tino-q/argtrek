import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useTripContext } from "../../hooks/useTripContext";
import { FORM_FIELDS } from "../../utils/config";

import "../../styles/Profile.css";

const Profile = () => {
  const navigate = useNavigate();
  const { userRSVP, formData, submissionResult } = useTripContext();

  useEffect(() => {
    if (!userRSVP) {
      navigate("/login");
      return;
    }
  }, [userRSVP, navigate]);

  const handleBackToHome = useCallback(() => {
    navigate("/home");
  }, [navigate]);

  const renderPersonalInfo = () => (
    <div className="profile-section">
      <h3>Personal Information</h3>
      <div className="profile-grid">
        <div className="profile-field">
          <label>Email</label>
          <div className="profile-value">
            {formData[FORM_FIELDS.EMAIL] || "Not provided"}
          </div>
        </div>

        <div className="profile-field">
          <label>First Name</label>
          <div className="profile-value">
            {formData[FORM_FIELDS.FIRST_NAME] || "Not provided"}
          </div>
        </div>

        <div className="profile-field">
          <label>Last Name</label>
          <div className="profile-value">
            {formData[FORM_FIELDS.LAST_NAME] || "Not provided"}
          </div>
        </div>

        <div className="profile-field">
          <label>Phone Number</label>
          <div className="profile-value">
            {formData[FORM_FIELDS.PHONE_NUMBER] || "Not provided"}
          </div>
        </div>

        <div className="profile-field">
          <label>Accommodation</label>
          <div className="profile-value">
            {formData[FORM_FIELDS.PRIVATE_ROOM_UPGRADE]
              .toString()
              .toLowerCase() === "true"
              ? "Private Room Upgrade"
              : `Roommate: ${submissionResult.row.ROOMMATE}`}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDietaryInformation = () => {
    const getDietaryRestrictionText = (value) => {
      switch (value) {
        case "vegetarian":
          return "Vegetarian";
        case "vegan":
          return "Vegan";
        case "gluten-free":
          return "Gluten-free";
        case "other":
          return "Other";
        case "none":
        default:
          return "No restrictions";
      }
    };

    return (
      <div className="profile-section">
        <h3>Dietary Information</h3>
        <div className="profile-grid">
          <div className="profile-field">
            <label>Dietary Restrictions</label>
            <div className="profile-value">
              {getDietaryRestrictionText(
                formData[FORM_FIELDS.DIETARY_RESTRICTIONS]
              )}
            </div>
          </div>

          {formData[FORM_FIELDS.DIETARY_MESSAGE] && (
            <div className="profile-field full-width">
              <label>Additional dietary notes</label>
              <div className="profile-value dietary-notes">
                {formData[FORM_FIELDS.DIETARY_MESSAGE]}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!userRSVP) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
      <div className="profile-container">
        <div className="profile-header">
          <button
            className="btn btn-secondary back-btn"
            onClick={handleBackToHome}
          >
            <i className="fas fa-arrow-left" />
            Back to Home
          </button>
        </div>

        <div className="profile-content">
          {renderPersonalInfo()}
          {renderDietaryInformation()}
        </div>
      </div>
    </div>
  );
};

export default Profile;
