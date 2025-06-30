import { FORM_FIELDS } from "../../utils/config";
import horsebackImage from "../../assets/horseback-riding-mendoza.png";
import empanadasImage from "../../assets/empanadas.png";
import raftingImage from "../../assets/bariloche-rafting.png";

const ACTIVITIES = [
  {
    id: "horseback",
    icon: "fas fa-horse",
    name: "Horse Back Riding",
    location: "Mendoza",
    date: "November 27th - Afternoon",
    price: 45,
    description: "",
    image: horsebackImage,
  },
  {
    id: "cooking",
    icon: "fas fa-utensils",
    name: "Empanadas Cooking Class",
    location: "Mendoza",
    date: "November 28th - Midday",
    price: 140,
    description: "3-course menu with wine pairing",
    image: empanadasImage,
  },
  {
    id: "rafting",
    icon: "fas fa-water",
    name: "Rafting Adventure",
    location: "Bariloche",
    date: "November 26th - All Day",
    price: 75,
    description: "",
    image: raftingImage,
  },
];

const ActivitySelection = ({ formData, updateArrayField }) => {
  const selectedActivities = formData[FORM_FIELDS.ACTIVITIES] || [];

  const handleActivityToggle = (activity, isSelected) => {
    updateArrayField(FORM_FIELDS.ACTIVITIES, activity, isSelected);
  };

  return (
    <section className="form-section">
      <h2>
        <i className="fas fa-hiking"></i> Optional Activities
      </h2>
      <p className="section-description">
        Enhance your trip with these amazing experiences!
      </p>

      <div className="activities-container">
        {ACTIVITIES.map((activity) => {
          const isSelected = selectedActivities.some(
            (selected) => selected.id === activity.id
          );

          return (
            <div
              key={activity.id}
              className={`activity-card ${isSelected ? "activity-selected" : ""}`}
              onClick={() => handleActivityToggle(activity, !isSelected)}
              style={{ cursor: "pointer" }}
            >
              <div className="activity-image">
                <img src={activity.image} alt={activity.name} />
              </div>

              <div className="activity-content">
                <div className="activity-header">
                  <input
                    type="checkbox"
                    id={activity.id}
                    name="activities"
                    checked={isSelected}
                    onChange={() => {}} // Handled by card click
                    style={{ pointerEvents: "none", marginRight: "12px" }}
                  />
                  <i className={activity.icon}></i>
                  <h3>{activity.name}</h3>
                </div>

                <div className="activity-details">
                  <p className="location">{activity.location}</p>
                  <p className="date">{activity.date}</p>
                  {activity.description && (
                    <p className="description">{activity.description}</p>
                  )}
                  <p className="price">${activity.price} USD</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ActivitySelection;
