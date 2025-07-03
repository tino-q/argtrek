// Addons Step Component
// Extracted from App.jsx for better component organization

import ActivitySelection from "./ActivitySelection";
import PrivateRoomUpgrade from "./PrivateRoomUpgrade";
import DietaryOptions from "./DietaryOptions";
import { isSoloTraveler } from "../../utils/rsvpData";

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
