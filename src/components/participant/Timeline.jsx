import React, { useEffect, useState, useContext } from "react";
import { useTripContext } from "../../hooks/useTripContext";
import { APPS_SCRIPT_URL, PRICES } from "../../utils/config.js";
import AuthContext from "../../context/AuthContext.jsx";
import "./Timeline.css";
import { useNavigate } from "react-router-dom";

const RecommendationsModal = ({ recommendations, onClose }) => {
  if (!recommendations) return null;

  const items = recommendations
    .split(" // ")
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Recommendations</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <ul className="recommendations-list">
            {items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// Generic, reusable helpers
const TimeRange = ({ start, end }) => {
  const hasStart = !!start;
  const hasEnd = !!end;
  return (
    <div className="timeline-item-time">
      {hasStart ? start : ""}
      {hasStart && hasEnd ? ` - ${end}` : ""}
    </div>
  );
};

const ChoicesGroup = ({ name, options, selectedValue, onChange, isSaving }) => {
  if (!Array.isArray(options) || options.length === 0) return null;
  const normalized = options.map((opt) => String(opt).trim()).filter(Boolean);
  return (
    <div
      className="activity-choices"
      role="radiogroup"
      aria-busy={isSaving || undefined}
      aria-label="Choices"
    >
      {isSaving ? (
        <span className="saving-text">Saving...</span>
      ) : (
        normalized.map((choice, index) => (
          <label key={index} className="choice-option">
            <input
              type="radio"
              name={name}
              value={choice}
              checked={selectedValue === choice}
              onChange={(e) => onChange(name, e.target.value)}
              disabled={isSaving}
            />
            <span className="choice-label">{choice}</span>
          </label>
        ))
      )}
    </div>
  );
};

const TimelineRow = ({
  start,
  end,
  parameter1,
  recommendations,
  onRecommendationClick,
  choices,
  itemKey,
  selectedChoice,
  onChoiceChange,
  isSaving,
  formData,
  activityChoices,
  savingChoices,
}) => {
  const timeDisplay = start && end ? `${start} - ${end}` : start || end || "";

  const renderParameter = () => {
    if (!parameter1) return null;

    const lines = parameter1
      .split("//")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) return null;

    return (
      <div className="timeline-parameter">
        <div className="parameter-main">
          <span className="parameter-text">{lines[0]}</span>
        </div>
        {lines.slice(1).map((line, index) => (
          <div key={index} className="parameter-detail">
            {line}
          </div>
        ))}
      </div>
    );
  };

  const renderChoices = () => {
    if (!choices || !choices.trim()) return null;

    const identifier = choices.trim();

    // Only handle specific identifiers
    if (!["tango", "rafting", "activity-valle-de-uco"].includes(identifier)) {
      return null;
    }

    // Handle join-type activities (tango, rafting)
    if (["tango", "rafting"].includes(identifier.trim())) {
      // Use identifier as itemKey for choices
      const choiceItemKey = identifier.trim();
      const choiceSelectedValue = activityChoices?.[choiceItemKey];
      const choiceIsSaving = savingChoices?.has(choiceItemKey);

      // Check if user already registered in formData or has made a choice
      const hasRegistered = formData?.[choiceItemKey];
      const hasChosen = choiceSelectedValue === "yes";

      if (hasRegistered || hasChosen) {
        return (
          <div className="timeline-choices">
            <div className="registered-status">You're registered!</div>
          </div>
        );
      } else {
        const price = PRICES?.[choiceItemKey];
        return (
          <div className="timeline-choices">
            <div className="price-button-row">
              {price && <div className="activity-price">${price}</div>}
              <button
                className="join-button"
                onClick={() => onChoiceChange(choiceItemKey, "yes")}
                disabled={choiceIsSaving}
              >
                {choiceIsSaving ? "Joining..." : "I want to join"}
              </button>
            </div>
          </div>
        );
      }
    }

    // Handle activity-valle-de-uco
    if (identifier === "activity-valle-de-uco") {
      // Use identifier as itemKey for choices
      const choiceItemKey = "activity-valle-de-uco";
      const choiceSelectedValue = activityChoices?.[choiceItemKey];
      const choiceIsSaving = savingChoices?.has(choiceItemKey);
      const choiceOptions = ["Horseback Riding", "Hiking"];
      const price = PRICES?.activityValleDeUco;

      return (
        <div className="timeline-choices">
          <div className="valle-choice-row">
            {price && <div className="activity-price">${price}</div>}
            <ChoicesGroup
              name={choiceItemKey}
              options={choiceOptions}
              selectedValue={choiceSelectedValue}
              onChange={onChoiceChange}
              isSaving={choiceIsSaving}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  const hasRecommendations = recommendations && recommendations.trim();
  const hasChoices =
    choices &&
    choices.trim() &&
    ["tango", "rafting", "activity-valle-de-uco"].includes(choices.trim());
  const handleClick = hasRecommendations
    ? () => onRecommendationClick(recommendations)
    : undefined;

  return (
    <div className="timeline-row-wrapper">
      {hasChoices && <div className="optional-activity-label">Paid Add-On</div>}
      <div
        className={`timeline-item-row-mobile ${hasRecommendations ? "clickable" : ""} ${hasChoices ? "has-choices" : ""}`}
        onClick={handleClick}
      >
        <div className="timeline-mobile-content">
          <div className="timeline-time">{timeDisplay}</div>
        </div>
        <div className="timeline-right-column">
          {renderParameter()}
          {renderChoices()}
        </div>
      </div>
    </div>
  );
};

const Timeline = () => {
  const navigate = useNavigate();
  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collapsedDays, setCollapsedDays] = useState(new Set());
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [activityChoices, setActivityChoices] = useState({});
  const [savingChoices, setSavingChoices] = useState(new Set());
  const { email: userEmail, password: userPassword } = useContext(AuthContext);
  const { formData } = useTripContext();

  const handleRecommendationClick = (recommendations) => {
    setSelectedRecommendation(recommendations);
  };

  const closeModal = () => {
    setSelectedRecommendation(null);
  };

  const handleChoiceSelection = async (itemKey, choice) => {
    if (!userEmail || !userPassword) {
      console.error("Cannot save choice: User credentials not available");
      return;
    }

    setSavingChoices((prev) => new Set(prev).add(itemKey));

    try {
      const formData = new FormData();
      formData.append("action", "update_choices");
      formData.append("email", userEmail);
      formData.append("password", userPassword);
      formData.append("itemKey", itemKey);
      formData.append("choice", choice);

      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!data.success) {
        console.error("Failed to save choice:", data.error);
        // Don't update state on failure
      } else {
        console.log("Choice saved successfully:", itemKey, choice);
        // Only update state after successful save
        setActivityChoices((prev) => ({
          ...prev,
          [itemKey]: choice,
        }));
      }
    } catch (err) {
      console.error("Error saving choice:", err);
      // Don't update state on error
    } finally {
      setSavingChoices((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }
  };

  const isChoiceSaving = (itemKey) => {
    return savingChoices.has(itemKey);
  };

  const getItemKey = (item, dayKey, itemIndex) => {
    return `${dayKey}-${itemIndex}-${item.CATEGORY}`;
  };

  // Mock in-memory store for localhost
  const mockChoicesStore = React.useRef(new Map());

  useEffect(() => {
    const fetchTimelineData = async () => {
      try {
        let data;

        // eslint-disable-next-line no-undef
        if (__DEV__) {
          // get queryparamt refresh
          const refresh = new URLSearchParams(window.location.search).get(
            "refresh"
          );
          if (refresh === "1") {
            // clear local storage
            localStorage.removeItem("timelineDataDev");
          }
          // get from local storage

          const timelineDataStr = localStorage.getItem("timelineDataDev");
          let timelineData = timelineDataStr
            ? JSON.parse(timelineDataStr)
            : null;
          if (!timelineData) {
            const response = await fetch(
              `${APPS_SCRIPT_URL}?endpoint=timeline`
            );
            const { success, data: timelineDataNew } = await response.json();
            if (success) {
              // write to local storage
              localStorage.setItem(
                "timelineDataDev",
                JSON.stringify(timelineDataNew)
              );
              timelineData = timelineDataNew;
            }
          }

          data = {
            success: true,
            data: timelineData,
          };
        } else {
          // Check for refresh parameter to clear cache
          const refresh = new URLSearchParams(window.location.search).get(
            "refresh"
          );
          if (refresh === "1") {
            localStorage.removeItem("timelineData");
            localStorage.removeItem("timelineDataTimestamp");
          }

          // Check if we have cached data and if it's still valid (1 hour)
          const timelineDataStr = localStorage.getItem("timelineData");
          const timestampStr = localStorage.getItem("timelineDataTimestamp");
          const now = Date.now();
          const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

          let timelineData = null;
          if (timelineDataStr && timestampStr) {
            const timestamp = parseInt(timestampStr);
            if (now - timestamp < oneHour) {
              // Cache is still valid
              timelineData = JSON.parse(timelineDataStr);
            }
          }

          if (!timelineData) {
            // Fetch fresh data
            const response = await fetch(
              `${APPS_SCRIPT_URL}?endpoint=timeline`
            );
            const { success, data: timelineDataNew } = await response.json();
            if (success) {
              // Cache the data with timestamp
              localStorage.setItem(
                "timelineData",
                JSON.stringify(timelineDataNew)
              );
              localStorage.setItem("timelineDataTimestamp", now.toString());
              timelineData = timelineDataNew;
            }
          }

          data = {
            success: true,
            data: timelineData,
          };
        }

        if (data.success) {
          setTimelineData(data.data);
          // Initialize all days as collapsed
          const dayKeys = new Set();
          data.data.forEach((item) => {
            const dayKey = item["DAY OF MONTH"];
            if (dayKey !== "22") {
              dayKeys.add(dayKey);
            }
          });
          setCollapsedDays(dayKeys);
        } else {
          setError(data.error || "Failed to load timeline data");
        }
      } catch (err) {
        setError("Error fetching timeline data");
        console.error("Error fetching timeline data:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserChoices = async () => {
      if (!userEmail || !userPassword) {
        return;
      }

      try {
        // eslint-disable-next-line no-undef
        if (__DEV__) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          const userKey = `${userEmail}-${userPassword}`;
          const userChoices = mockChoicesStore.current.get(userKey) || {};
          setActivityChoices(userChoices);
        } else {
          const response = await fetch(
            `${APPS_SCRIPT_URL}?endpoint=choices&email=${encodeURIComponent(userEmail)}&password=${encodeURIComponent(userPassword)}`
          );
          const data = await response.json();

          if (data.success) {
            setActivityChoices(data.data || {});
            console.log("User choices loaded:", data.data);
          } else {
            console.error("Failed to load user choices:", data.error);
            setActivityChoices({});
          }
        }
      } catch (err) {
        console.error("Error fetching user choices:", err);
        setActivityChoices({});
      }
    };

    fetchTimelineData();
    fetchUserChoices();
  }, [userEmail, userPassword]);

  const allowedEmails = [
    "nnavas@stanford.edu",
    "jeronimo.llacay@gmail.com",
    "talves@stanford.edu",
    "ftosi@stanford.edu",
    "verdaromjulieta@gmail.com",
    "guidoh@stanford.edu",
    "tinqueija@gmail.com",
    "madibakla@gmail.com",
    "ekin@stanford.edu",
  ];

  // TODO: remove this after construction
  if (!allowedEmails.includes(userEmail)) {
    return (
      <div className="container">
        <div
          className="timeline-loading"
          style={{
            height: "300px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-evenly",
            alignItems: "center",
          }}
        >
          <h3
            style={{
              margin: 0,
              background: "transparent",
              boxShadow: "none",
              textShadow: "none",
              border: "none",
            }}
          >
            Under Construction
          </h3>
          <p style={{ margin: 0 }}>
            Timeline is currently being updated. Please check back later.
          </p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate("/home")}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const groupByDay = (data) => {
    const grouped = {};
    data.forEach((item) => {
      const dayKey = item["DAY OF MONTH"];
      if (!grouped[dayKey]) {
        const dayNumber = parseInt(item["DAY OF MONTH"]);
        const suffix = getDaySuffix(dayNumber);
        grouped[dayKey] = {
          date: `${item["DAY OF WEEK"]} ${dayNumber}${suffix}`,
          city: item.CITY,
          items: [],
        };
      }

      grouped[dayKey].items.push(item);
    });
    return grouped;
  };

  const getDaySuffix = (day) => {
    if (day >= 11 && day <= 13) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const toggleDay = (dayKey) => {
    setCollapsedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dayKey)) {
        newSet.delete(dayKey); // Expand the day
      } else {
        newSet.add(dayKey); // Collapse the day
      }
      return newSet;
    });
  };

  const isDayCollapsed = (dayKey) => {
    return collapsedDays.has(dayKey);
  };

  const renderItemByType = (item, dayKey, itemIndex) => {
    const itemKey = getItemKey(item, dayKey, itemIndex);
    const selectedChoice = activityChoices[itemKey];
    const isSaving = isChoiceSaving(itemKey);

    // Handle special parameter formatting for different item types
    let parameter1 = item["PARAMETER _1"];

    if (item.CATEGORY === "FLIGHT") {
      parameter1 = `${item["PARAMETER _1"]} (${item["PARAMETER_2"]} → ${item["PARAMETER_3"]})`;
    } else if (item.CATEGORY === "BUS" || item.CATEGORY === "TRANSPORTATION") {
      parameter1 =
        parameter1 ||
        (item.CATEGORY === "BUS" ? "Bus Transfer" : "Transportation");
    }

    return (
      <TimelineRow
        start={item["START HS"]}
        end={item["END HS"]}
        parameter1={parameter1}
        recommendations={item.RECOMMENDATIONS}
        onRecommendationClick={handleRecommendationClick}
        choices={item.CHOICES}
        itemKey={itemKey}
        selectedChoice={selectedChoice}
        onChoiceChange={handleChoiceSelection}
        isSaving={isSaving}
        formData={formData}
        activityChoices={activityChoices}
        savingChoices={savingChoices}
      />
    );
  };

  if (loading) {
    return (
      <div className="container">
        <div className="timeline-loading">
          <div className="loading-spinner"></div>
          <p>Loading timeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="timeline-error">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  if (!timelineData || timelineData.length === 0) {
    return (
      <div className="timeline-empty">
        <h3>No timeline data</h3>
        <p>Check back later for your trip details</p>
      </div>
    );
  }

  const groupedData = groupByDay(timelineData);

  return (
    <div className="container">
      <div className="timeline-container">
        <div className="timeline-header">
          <div className="timeline-header-nav">
            <h1>Trip Timeline</h1>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/home")}
            >
              Back to Home
            </button>
          </div>
        </div>

        <div className="timeline-content">
          {Object.entries(groupedData).map(([dayKey, dayData]) => (
            <div key={dayKey} className="timeline-day">
              <div className="day-header" onClick={() => toggleDay(dayKey)}>
                <div className="collapse-indicator">
                  {isDayCollapsed(dayKey) ? "▼" : "▲"}
                </div>
                <h2>{dayData.date}</h2>
              </div>

              {!isDayCollapsed(dayKey) && (
                <div className="timeline-items">
                  {dayData.items.map((item, itemIndex) => (
                    <div
                      key={`${dayKey}-${itemIndex}`}
                      className="timeline-item"
                    >
                      {renderItemByType(item, dayKey, itemIndex)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {selectedRecommendation && (
          <RecommendationsModal
            recommendations={selectedRecommendation}
            onClose={closeModal}
          />
        )}
      </div>
    </div>
  );
};

export default Timeline;
