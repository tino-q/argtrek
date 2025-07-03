import { useState } from "react";
import { FORM_FIELDS, ACTIVITIES } from "../../utils/config";
import ImageCarousel from "../common/ImageCarousel";

// Import dynamic image loader utility
import {
  getMainActivityImage,
  getActivityImageSources,
} from "../../utils/imageLoader";

const ACTIVITY_LIST = [
  {
    id: "rafting",
    formField: FORM_FIELDS.RAFTING,
    icon: "fas fa-water",
    name: "Rafting Adventure",
    location: "Bariloche",
    date: "November 26th - All Day",
    price: 75,
    description: "",
    image: getMainActivityImage("rafting"),
  },
  {
    id: "horseback",
    formField: FORM_FIELDS.HORSEBACK,
    icon: "fas fa-horse",
    name: "Horse Back Riding",
    location: "Mendoza",
    date: "November 27th - Afternoon",
    price: 45,
    description: "1-hour guided horseback riding experience",
    image: getMainActivityImage("horseback"),
  },
  {
    id: "cooking",
    formField: FORM_FIELDS.COOKING,
    icon: "fas fa-utensils",
    name: "Empanadas Cooking Class",
    location: "Mendoza",
    date: "November 28th - Midday",
    price: 140,
    description:
      "Exclusive cooking class with Casa del Visitante chefs. Learn to make traditional empanadas using regional products, followed by a 3-course lunch with wine pairing.",
    image: getMainActivityImage("empanadas"),
  },
];

const ActivitySelection = ({ formData, updateFormData }) => {
  const [carouselState, setCarouselState] = useState({
    isOpen: false,
    activityId: null,
  });

  const handleActivityToggle = (activity, isSelected) => {
    updateFormData(activity.formField, isSelected);
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
        return getActivityImageSources("horseback");
      case "rafting":
        return getActivityImageSources("rafting");
      case "cooking":
        return getActivityImageSources("empanadas");
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
          <i className="fas fa-plus-circle"></i> Experiences
        </h1>
      </div>

      <section className="form-section">
        <div className="activities-container">
          {ACTIVITY_LIST.map((activity) => {
            const isSelected = Boolean(formData[activity.formField]);

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
