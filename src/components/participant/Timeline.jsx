import React, {
  useEffect,
  useState,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";

import AuthContext from "../../context/AuthContext.jsx";
import { useTripContext } from "../../hooks/useTripContext";
import { APPS_SCRIPT_URL, PRICES, ADMIN_EMAILS } from "../../utils/config.js";

import PassportGate from "./PassportGate.jsx";

import "./Timeline.css";

const filterTimelineData = (timelineData, submissionResult) => {
  const { row } = submissionResult;
  const buenosAiresArrivalHotel =
    row["rsvpData.22Nov_BSAS"] || row["rsvpData.23Nov_BSAS"];
  const welcomeDinner = row["rsvpData.23Nov_Dinner_Welcome"];
  const bsasTour = row["rsvpData.23Nov_Tour"];
  const bariHotel =
    row["rsvpData.24Nov_BARI"] ||
    row["rsvpData.25Nov_BARI"] ||
    row["rsvpData.26Nov_BARI"];
  const mendozaHotel = row["rsvpData.27Nov_MDZ"] || row["rsvpData.28Nov_MDZ"];
  const bsasDepartureHotel = row["rsvpData.29Nov_BSAS"];
  const bsasToBrcFlight = row["rsvpData.AEP-BRC"];
  const brcToMendozaFlight = row["rsvpData.BRC-MDZ"];
  const mdzToBsasFlight = row["rsvpData.MDZ-AEP"];

  return timelineData.filter((item) => {
    const city = item.CITY; // "Buenos Aires", "Mendoza", "Bariloche";
    const dayOfMonth = item["DAY OF MONTH"];
    const category = item["CATEGORY"];
    const parameter1 = item["PARAMETER_1"];
    if ([22, 23, 24].includes(Number(dayOfMonth)) && city === "Buenos Aires") {
      switch (category.toLowerCase().trim()) {
        case "dinner":
          return welcomeDinner;
        case "flight":
          return bsasToBrcFlight;
        case "activity":
          if (parameter1.toLowerCase().includes("city tour")) {
            return bsasTour;
          }
          return buenosAiresArrivalHotel;
        case "free time":
        case "hotel check in":
        case "breakfast":
        case "lunch":
        case "hotel checkout":
        case "transportation":
          return buenosAiresArrivalHotel;
        default:
          throw new Error(`Unknown category: ${category}`);
      }
    }

    if (city === "Bariloche") {
      switch (category.toLowerCase().trim()) {
        case "flight":
          return brcToMendozaFlight;
        case "dinner":
        case "activity":
        case "drinks":
        case "lunchdinner":
        case "free time":
        case "hotel check in":
        case "breakfast":
        case "lunch":
        case "hotel checkout":
        case "transportation":
          return bariHotel;
        default:
          throw new Error(
            `Unknown category3: ${category.toLowerCase().trim()}`
          );
      }
    }

    if (city === "Mendoza") {
      switch (category.toLowerCase().trim()) {
        case "flight":
          return mdzToBsasFlight;
        case "dinner":
        case "activity":
        case "free time":
        case "hotel check in":
        case "breakfast":
        case "lunch":
        case "drinks":
        case "hotel checkout":
        case "transportation":
          return mendozaHotel;
        default:
          throw new Error(
            `Unknown category2: ${category.toLowerCase().trim()}`
          );
      }
    }

    if (city === "Buenos Aires") {
      switch (category.toLowerCase().trim()) {
        case "dinner":
        case "activity":
        case "free time":
        case "hotel check in":
        case "breakfast":
        case "lunch":
        case "hotel checkout":
        case "transportation":
          return bsasDepartureHotel;
        default:
          throw new Error(
            `Unknown category1: ${category.toLowerCase().trim()}`
          );
      }
    }

    throw new Error(`Problematic item: ${JSON.stringify(item)}`);
  });
};

const RecommendationsModal = ({ recommendations, onClose }) => {
  const stopPropagation = useCallback((e) => e.stopPropagation(), []);

  if (!recommendations) {
    return null;
  }

  const items = recommendations
    .split(" // ")
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={stopPropagation}>
        <div className="modal-header">
          <h3>Recommendations</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <ul className="recommendations-list">
            {items.map((item, index) => (
              <li key={item || `item-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// Generic, reusable helpers

const ChoicesGroup = ({ name, options, selectedValue, onChange, isSaving }) => {
  const handleRadioChange = useCallback(
    (e) => {
      onChange(name, e.target.value);
    },
    [name, onChange]
  );

  if (!Array.isArray(options) || options.length === 0) {
    return null;
  }
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
        normalized.map((choice) => (
          <label key={choice} className="choice-option">
            <input
              type="radio"
              name={name}
              value={choice}
              checked={selectedValue === choice}
              onChange={handleRadioChange}
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
  // itemKey,
  // selectedChoice,
  onChoiceChange,
  // isSaving,
  formData,
  activityChoices,
  savingChoices,
  isIncluded = true,
}) => {
  const timeDisplay = start && end ? `${start} - ${end}` : start || end || "";

  const createJoinHandler = useCallback(
    (choiceItemKey) => {
      return () => onChoiceChange(choiceItemKey, "yes");
    },
    [onChoiceChange]
  );

  const renderParameter = () => {
    if (!parameter1) {
      return null;
    }

    const lines = parameter1
      .split("//")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      return null;
    }

    return (
      <div className="timeline-parameter">
        <div className="parameter-main">
          <span className="parameter-text">{lines[0]}</span>
        </div>
        {lines.slice(1).map((line, index) => (
          <div key={line || `detail-${index}`} className="parameter-detail">
            {line}
          </div>
        ))}
      </div>
    );
  };

  const renderChoices = () => {
    if (!choices || !choices.trim()) {
      return null;
    }

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
      }
      const price = PRICES?.[choiceItemKey];
      return (
        <div className="timeline-choices">
          <div className="price-button-row">
            {price && <div className="activity-price">${price}</div>}
            <button
              className="join-button"
              onClick={createJoinHandler(choiceItemKey)}
              disabled={choiceIsSaving}
            >
              {choiceIsSaving ? "Joining..." : "I want to join"}
            </button>
          </div>
        </div>
      );
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
        className={`timeline-item-row-mobile ${hasRecommendations ? "clickable" : ""} ${hasChoices ? "has-choices" : ""} ${!isIncluded ? "not-included" : ""}`}
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
  const [showAllItems, setShowAllItems] = useState(false);
  const { email: userEmail, password: userPassword } = useContext(AuthContext);
  const { formData, submissionResult } = useTripContext();

  // Passport presence from context (set at login or via PassportGate)
  const hasPassport = Boolean(submissionResult?.passport);

  const isAdmin = ADMIN_EMAILS.includes(userEmail);

  const personalTimelineData = useMemo(() => {
    if (!timelineData) {
      return null;
    }

    if (showAllItems && isAdmin) {
      // Return all items with inclusion status for styling
      return timelineData.map((item) => {
        const isIncluded = submissionResult
          ? filterTimelineData([item], submissionResult).length > 0
          : false;
        return {
          ...item,
          isIncluded,
        };
      });
    }

    return submissionResult
      ? filterTimelineData(timelineData, submissionResult)
      : null;
  }, [timelineData, submissionResult, showAllItems, isAdmin]);

  const handleRecommendationClick = useCallback((recommendations) => {
    setSelectedRecommendation(recommendations);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedRecommendation(null);
  }, []);

  const navigateToHome = useCallback(() => {
    navigate("/home");
  }, [navigate]);

  const reloadPage = useCallback(() => {
    window.location.reload();
  }, []);

  const toggleDay = useCallback((dayKey) => {
    setCollapsedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dayKey)) {
        newSet.delete(dayKey);
      } else {
        newSet.add(dayKey);
      }
      return newSet;
    });
  }, []);

  const createToggleHandler = useCallback(
    (dayKey) => {
      return () => toggleDay(dayKey);
    },
    [toggleDay]
  );

  const handleShowAllItemsChange = useCallback((e) => {
    setShowAllItems(e.target.checked);
  }, []);

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

  // Stable handler for PassportGate success
  const onPassportSuccess = useCallback(() => {
    setLoading(true);
  }, []);

  useEffect(() => {
    if (!hasPassport) {
      return;
    }
    const fetchTimelineData = async () => {
      try {
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
          const response = await fetch(`${APPS_SCRIPT_URL}?endpoint=timeline`);
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

        if (timelineData) {
          setTimelineData(timelineData);
          // Initialize all days as collapsed
          const dayKeys = new Set();
          timelineData.forEach((item) => {
            const dayKey = item["DAY OF MONTH"];
            if (dayKey !== "22") {
              dayKeys.add(dayKey);
            }
          });
          setCollapsedDays(dayKeys);
        } else {
          setError("Failed to load timeline data");
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
  }, [hasPassport, userEmail, userPassword]);

  // TODO: remove this after construction
  if (!ADMIN_EMAILS.includes(userEmail)) {
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
          <button className="btn btn-secondary btn-sm" onClick={navigateToHome}>
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
    if (day >= 11 && day <= 13) {
      return "th";
    }
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

  const isDayCollapsed = (dayKey) => {
    return collapsedDays.has(dayKey);
  };

  const renderItemByType = (item, dayKey, itemIndex) => {
    const itemKey = getItemKey(item, dayKey, itemIndex);
    const selectedChoice = activityChoices[itemKey];
    const isSaving = isChoiceSaving(itemKey);

    // Handle special parameter formatting for different item types
    let parameter1 = item["PARAMETER_1"];

    if (item.CATEGORY === "FLIGHT") {
      parameter1 = `${item["PARAMETER_1"]} (${item["PARAMETER_2"]} → ${item["PARAMETER_3"]})`;
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
        isIncluded={item.isIncluded}
      />
    );
  };

  console.log("hasPassport", { hasPassport });
  // If passport missing, show gate form
  if (!hasPassport) {
    return <PassportGate onSuccess={onPassportSuccess} />;
  }

  if (loading) {
    return (
      <div className="container">
        <div className="timeline-loading">
          <div className="loading-spinner" />
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
        <button onClick={reloadPage}>Try Again</button>
      </div>
    );
  }

  if (!personalTimelineData || personalTimelineData.length === 0) {
    return (
      <div className="timeline-empty">
        <h3>No timeline data</h3>
        <p>Check back later for your trip details</p>
      </div>
    );
  }

  const groupedData = groupByDay(personalTimelineData);

  return (
    <div className="container">
      <div className="timeline-container">
        <div className="timeline-header">
          <div className="timeline-header-nav">
            <h1>Trip Timeline</h1>
            {isAdmin && (
              <div className="admin-controls">
                <label className="admin-toggle">
                  <input
                    type="checkbox"
                    checked={showAllItems}
                    onChange={handleShowAllItemsChange}
                  />
                  Show All Items
                </label>
              </div>
            )}
            <button className="btn btn-secondary" onClick={navigateToHome}>
              Back to Home
            </button>
          </div>
        </div>

        <div className="timeline-content">
          {Object.entries(groupedData).map(([dayKey, dayData]) => (
            <div key={dayKey} className="timeline-day">
              <div className="day-header" onClick={createToggleHandler(dayKey)}>
                <div className="collapse-indicator">
                  {isDayCollapsed(dayKey) ? "▼" : "▲"}
                </div>
                <h2>{dayData.date}</h2>
              </div>

              {!isDayCollapsed(dayKey) && (
                <div className="timeline-items">
                  {dayData.items.map((item, itemIndex) => (
                    <div
                      key={getItemKey(item, dayKey, itemIndex)}
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
