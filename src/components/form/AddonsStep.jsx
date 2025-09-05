// Addons Step Component
// Extracted from App.jsx for better component organization

import { isSoloTraveler } from "../../utils/rsvpData";

import ActivitySelection from "./ActivitySelection";
import DietaryOptions from "./DietaryOptions";
import PrivateRoomUpgrade from "./PrivateRoomUpgrade";

const AddonsStep = ({ formData, updateFormData, rsvpData }) => {
  // Check if user is a solo traveler using centralized utility
  const isSolo = isSoloTraveler(rsvpData);

  return (
    <div className="addons-section">
      <ActivitySelection formData={formData} updateFormData={updateFormData} />

      {isSolo && (
        <PrivateRoomUpgrade
          formData={formData}
          updateFormData={updateFormData}
          rsvpData={rsvpData}
        />
      )}

      <DietaryOptions formData={formData} updateFormData={updateFormData} />
    </div>
  );
};

export default AddonsStep;
