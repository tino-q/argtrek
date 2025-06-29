// Personal Information Form Component
// Migrated from original index.html personal information section

import { FORM_FIELDS } from "../../utils/config";

const PersonalInfo = ({ formData, updateFormData }) => {
  return (
    <section className="form-section">
      <h2>
        <i className="fas fa-user"></i> Personal Information
      </h2>

      <div className="form-group">
        <label htmlFor="email">Email Address *</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData[FORM_FIELDS.EMAIL]}
          onChange={(e) => updateFormData(FORM_FIELDS.EMAIL, e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="fullName">Full Name *</label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          placeholder="Exactly as it appears on your travel ID"
          value={formData[FORM_FIELDS.FULL_NAME]}
          onChange={(e) =>
            updateFormData(FORM_FIELDS.FULL_NAME, e.target.value)
          }
          required
        />
      </div>
    </section>
  );
};

export default PersonalInfo;
