import { useState } from "react";
import ImageCarousel from "../common/ImageCarousel";
import { ACTIVITY_LIST } from "../../utils/activities";

// Import dynamic image loader utility
import { getActivityImageSources } from "../../utils/imageLoader";

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
        <div className="container">
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
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <h3>{activity.name}</h3>
                        {activity.subtitles &&
                          activity.subtitles.length > 0 && (
                            <div className="activity-subtitles">
                              {activity.subtitles.map((subtitle, i) => (
                                <div key={i}>{subtitle}</div>
                              ))}
                            </div>
                          )}
                      </div>
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
