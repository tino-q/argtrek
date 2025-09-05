import { useState, useCallback } from "react";

import { ACTIVITY_LIST } from "../../utils/activities";
import { getActivityImageSources } from "../../utils/imageLoader";
import ImageCarousel from "../common/ImageCarousel";

const ActivitySelection = ({ formData, updateFormData }) => {
  const [carouselState, setCarouselState] = useState({
    isOpen: false,
    activityId: null,
  });

  const handleActivityToggle = useCallback(
    (activity, isSelected) => {
      updateFormData(activity.formField, isSelected);
    },
    [updateFormData]
  );

  const handleImageClick = useCallback((e, activity) => {
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
  }, []);

  // Factory functions for creating handlers inside map
  const createActivityToggleHandler = useCallback((activity, isSelected) => {
    return () => handleActivityToggle(activity, !isSelected);
  }, [handleActivityToggle]);

  const createImageClickHandler = useCallback((activity) => {
    return (e) => handleImageClick(e, activity);
  }, [handleImageClick]);

  const createEmptyHandler = useCallback(() => {
    return () => {}; // Handled by card click
  }, []);

  const handleCloseCarousel = useCallback(() => {
    setCarouselState({
      isOpen: false,
      activityId: null,
    });
  }, []);

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
  const hasCarousel = useCallback((activityId) => {
    return (
      activityId === "horseback" ||
      activityId === "rafting" ||
      activityId === "cooking" ||
      activityId === "tango"
    );
  }, []);

  return (
    <div>
      <div className="section-header">
        <h1>
          <i className="fas fa-plus-circle" /> Experiences
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
                  onClick={createActivityToggleHandler(activity, isSelected)}
                  style={{ cursor: "pointer" }}
                >
                  <div
                    className="activity-image"
                    onClick={createImageClickHandler(activity)}
                    style={{
                      cursor: hasCarousel(activity.id) ? "zoom-in" : "pointer",
                      position: "relative",
                    }}
                  >
                    <img src={activity.image} alt={activity.name} />
                    {hasCarousel(activity.id) && (
                      <div className="image-overlay-hint">
                        <i className="fas fa-search-plus" />
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
                        onChange={createEmptyHandler()}
                        style={{ pointerEvents: "none", marginRight: "12px" }}
                      />
                      <i className={activity.icon} />
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <h3>{activity.name}</h3>
                        {activity.subtitles &&
                          activity.subtitles.length > 0 && (
                            <div className="activity-subtitles">
                              {activity.subtitles.map((subtitle, i) => (
                                <div key={subtitle || `subtitle-${i}`}>
                                  {subtitle}
                                </div>
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
                            <p
                              key={line || `description-${index}`}
                              className="description-line"
                            >
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
