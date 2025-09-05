import React, { useCallback } from "react";

import { FORM_FIELDS } from "../../utils/config";
import "../../styles/DietaryOptions.css";

const DIETARY_OPTIONS = {
  vegetarian: {
    name: "Vegetarian",
    description: "No meat or fish",
    color: "#4CAF50",
    icon: "fas fa-leaf",
  },
  vegan: {
    name: "Vegan",
    description: "No animal products",
    color: "#8BC34A",
    icon: "fas fa-seedling",
  },
  gluten_Free: {
    name: "Gluten Free",
    description: "No gluten products",
    color: "#FF9800",
    icon: "fas fa-ban",
  },
  none: {
    name: "No Restrictions",
    description: "I can eat everything",
    color: "#757575",
    icon: "fas fa-utensils",
  },
};

const DietaryOptions = ({ formData, updateFormData }) => {
  // Always set default to "none" to ensure an option is selected
  React.useEffect(() => {
    if (!formData[FORM_FIELDS.DIETARY_RESTRICTIONS]) {
      updateFormData(FORM_FIELDS.DIETARY_RESTRICTIONS, "none");
    }
  }, [formData, updateFormData]);

  const handleDietaryRestrictionChange = useCallback((e) => {
    updateFormData(FORM_FIELDS.DIETARY_RESTRICTIONS, e.target.value);
  }, [updateFormData]);

  const handleDietaryMessageChange = useCallback((e) => {
    updateFormData(FORM_FIELDS.DIETARY_MESSAGE, e.target.value);
  }, [updateFormData]);

  return (
    <section className="form-section">
      <h2>
        <i className="fas fa-utensils" /> Dietary Preferences
      </h2>

      <div className="form-group">
        <div className="radio-group dietary-options-grid">
          {Object.entries(DIETARY_OPTIONS).map(([option, info]) => (
            <div key={option} className="radio-option">
              <input
                type="radio"
                id={`dietary-${option}`}
                name="dietaryRestrictions"
                value={option}
                checked={formData[FORM_FIELDS.DIETARY_RESTRICTIONS] === option}
                onChange={handleDietaryRestrictionChange}
                required
              />
              <label htmlFor={`dietary-${option}`}>
                <div className="option-content">
                  <div className="option-icon" style={{ color: info.color }}>
                    <i className={info.icon} />
                  </div>
                  <h3>{info.name}</h3>
                  <p className="description">{info.description}</p>
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="dietary-message" className="section-label">
          <i className="fas fa-info-circle" /> Allergies or anything else we
          should know?
        </label>
        <textarea
          id="dietary-message"
          name="dietaryMessage"
          value={formData[FORM_FIELDS.DIETARY_MESSAGE] || ""}
          onChange={handleDietaryMessageChange}
          placeholder="Please let us know about any allergies, food intolerances, or special dietary needs..."
          rows="4"
          className="dietary-message-input"
        />
      </div>
    </section>
  );
};

export default DietaryOptions;
