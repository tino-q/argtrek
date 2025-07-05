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
    descriptionLines: [
      "Approx. 70 km from Bariloche (1 hour by bus)",
      "📍 Located halfway between Bariloche and El Bolsón",
      "🕒 Total duration: ~5 hours",
      "",
      "Includes exclusive rafts for the group and full river gear (helmet, life jacket, paddle, wetsuit, etc.).",
      "",
      "Not everyone needs to raft! If someone prefers not to get on the river, they can still join the group — they'll be taken in a pickup truck (~25 min ride) to the meeting point.",
      "",
      "Activity breakdown:",
      "• ~1 hour prep & safety briefing",
      "• ~1 hour 15 min on the water (duration may vary depending on water level and optional swim stops)",
      "• ~1 hour snack & hangout at the riverside field/camp",
      "",
      "⚠️ Important: Water shoes are required (or sturdy footwear that can get wet).",
    ],
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
    descriptionLines: ["1-hour guided horseback riding experience"],
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
    descriptionLines: [
      "Exclusive cooking class with Casa del Visitante chefs.",
      "Learn to make traditional empanadas using regional products, followed by a 3-course lunch with wine pairing.",
    ],
    image: getMainActivityImage("empanadas"),
  },
  {
    id: "tango",
    formField: FORM_FIELDS.TANGO,
    icon: "fas fa-music",
    name: "💃 Tango Night – Hidden Milonga in Palermo",
    location: "Buenos Aires",
    date: "November 23rd - Evening",
    price: 85,
    descriptionLines: [
      "After dinner, we'll head to a traditional milonga tucked away in Palermo — a spot mostly known by those who live in the city.",
      "",
      "We'll start with a beginner-friendly tango class, then stay to enjoy the early part of the night with a glass of Argentine wine and take in the atmosphere as the dancing begins.",
      "",
      "A unique way to experience Buenos Aires beyond the usual path.",
    ],
    image: getMainActivityImage("milonga"),
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
      activity.id === "cooking" ||
      activity.id === "tango"
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
      case "tango":
        return getActivityImageSources("milonga");
      default:
        return [];
    }
  };

  // Check if activity has carousel
  const hasCarousel = (activityId) => {
    return (
      activityId === "horseback" ||
      activityId === "rafting" ||
      activityId === "cooking" ||
      activityId === "tango"
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

                    {activity.descriptionLines && (
                      <div className="description">
                        {activity.descriptionLines.map((line, index) => (
                          <p key={index} className="description-line">
                            {line || "\u00A0"}
                          </p>
                        ))}
                      </div>
                    )}

                    <p className="price">
                      {activity.price === 0
                        ? "I'm interested"
                        : `$${activity.price} USD`}
                    </p>
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
