import { useState } from "react";
import { FORM_FIELDS } from "../../utils/config";
import raftingImage from "../../assets/bariloche-rafting.png";
import ImageCarousel from "../common/ImageCarousel";

// Import all horseback images
import horseback1 from "../../assets/horseback-riding/horseback-riding-mendoza.png";
import horseback2 from "../../assets/horseback-riding/horseback-riding-mendoza-2.png";

// Import all rafting images
import rafting1 from "../../assets/rafting/rafting1.jpeg";
import rafting2 from "../../assets/rafting/rafting2.jpeg";
import rafting3 from "../../assets/rafting/rafting3.jpeg";
import rafting4 from "../../assets/rafting/rafting4.jpeg";
import rafting5 from "../../assets/rafting/rafting5.jpeg";
import rafting6 from "../../assets/rafting/rafting6.jpeg";
import rafting7 from "../../assets/rafting/rafting7.jpeg";
import rafting8 from "../../assets/rafting/rafting8.jpeg";
import rafting9 from "../../assets/rafting/rafting9.jpeg";
import rafting10 from "../../assets/rafting/rafting10.jpeg";
import rafting11 from "../../assets/rafting/rafting11.jpeg";
import rafting12 from "../../assets/rafting/rafting12.jpeg";

// Import all empanadas images
import empanadas1 from "../../assets/empanadas/empanadas.png";
import empanadas2 from "../../assets/empanadas/empanadas-2.png";

// Array of all horseback images
const HORSEBACK_IMAGES = [horseback1, horseback2];

// Array of all rafting images
const RAFTING_IMAGES = [
  rafting1,
  rafting2,
  rafting3,
  rafting4,
  rafting5,
  rafting6,
  rafting7,
  rafting8,
  rafting9,
  rafting10,
  rafting11,
  rafting12,
];

// Array of all empanadas images
const EMPANADAS_IMAGES = [empanadas1, empanadas2];

const ACTIVITIES = [
  {
    id: "horseback",
    icon: "fas fa-horse",
    name: "Horse Back Riding",
    location: "Mendoza",
    date: "November 27th - Afternoon",
    price: 45,
    description: "",
    image: horseback1,
  },
  {
    id: "cooking",
    icon: "fas fa-utensils",
    name: "Empanadas Cooking Class",
    location: "Mendoza",
    date: "November 28th - Midday",
    price: 140,
    description: "3-course menu with wine pairing",
    image: empanadas1,
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
  const [carouselState, setCarouselState] = useState({
    isOpen: false,
    activityId: null,
  });

  const handleActivityToggle = (activity, isSelected) => {
    updateArrayField(FORM_FIELDS.ACTIVITIES, activity, isSelected);
  };

  const handleImageClick = (e, activity) => {
    e.stopPropagation(); // Prevent card selection
    if (
      activity.id === "horseback" ||
      activity.id === "rafting" ||
      activity.id === "cooking"
    ) {
      setCarouselState({
        isOpen: true,
        activityId: activity.id,
      });
    }
  };

  const handleCloseCarousel = () => {
    setCarouselState({
      isOpen: false,
      activityId: null,
    });
  };

  // Get images array based on activity
  const getCarouselImages = () => {
    switch (carouselState.activityId) {
      case "horseback":
        return HORSEBACK_IMAGES;
      case "rafting":
        return RAFTING_IMAGES;
      case "cooking":
        return EMPANADAS_IMAGES;
      default:
        return [];
    }
  };

  // Check if activity has carousel
  const hasCarousel = (activityId) => {
    return (
      activityId === "horseback" ||
      activityId === "rafting" ||
      activityId === "cooking"
    );
  };

  return (
    <div>
      <div className="section-header">
        <h1>
          <i className="fas fa-plus-circle"></i> Optional Add-ons
        </h1>
        <p className="section-description">
          Enhance your Argentina adventure with these amazing experiences and
          upgrades!
        </p>
      </div>

      <section className="form-section">
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
                <div
                  className="activity-image"
                  onClick={(e) => handleImageClick(e, activity)}
                  style={{
                    cursor: hasCarousel(activity.id) ? "zoom-in" : "pointer",
                    position: "relative",
                  }}
                >
                  <img src={activity.image} alt={activity.name} />
                  {hasCarousel(activity.id) && (
                    <div className="image-overlay-hint">
                      <i className="fas fa-search-plus"></i>
                      <span>View Gallery</span>
                    </div>
                  )}
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

      <ImageCarousel
        images={getCarouselImages()}
        isOpen={carouselState.isOpen}
        onClose={handleCloseCarousel}
        initialIndex={0}
      />
    </div>
  );
};

export default ActivitySelection;
