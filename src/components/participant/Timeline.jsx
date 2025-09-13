/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { useEffect, useState, useContext, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import AuthContext from "../../context/AuthContext.jsx";
import { useNotificationContext } from "../../hooks/useNotificationContext";
import { useTripContext } from "../../hooks/useTripContext";
import {
  setCachedData,
  fetchWithCache,
  CACHE_DURATIONS,
} from "../../utils/cache.js";
import { APPS_SCRIPT_URL, ADMIN_EMAILS } from "../../utils/config.js";

import LuggageGate from "./LuggageGate.jsx";
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
        case "tea":
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
        case "tea":
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
        case "tea":
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

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading,
}) => {
  const stopPropagation = useCallback((e) => e.stopPropagation(), []);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={isLoading ? undefined : onClose}>
      <div className="modal-content" onClick={stopPropagation}>
        <div className="modal-header">
          <h3>{title}</h3>
          {!isLoading && (
            <button className="modal-close" onClick={onClose}>
              ×
            </button>
          )}
        </div>
        <div className="modal-body">
          <p>{message}</p>
          {isLoading ? (
            <div className="modal-loading">
              <div className="loading-spinner" />
              <p>Saving your choice...</p>
            </div>
          ) : (
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={onConfirm}>
                Confirm
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Generic, reusable helpers

const ChoicesGroup = ({ name, options, onClickChoice, isSaving }) => {
  if (!Array.isArray(options) || options.length === 0) {
    return null;
  }
  // Accept strings or objects { label, value }
  const normalized = options
    .map((opt) => ({
      label: String(opt.label).trim(),
      value: String(opt.value).trim(),
    }))
    .filter((opt) => opt.label && opt.value);

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
          <button
            className="choice-option"
            key={choice.value}
            onClick={() => onClickChoice(name, choice.value)}
            disabled={isSaving}
          >
            {choice.label}
          </button>
        ))
      )}
    </div>
  );
};

const renderSimpleTimelineItem = (...parts) => {
  const [part1, ...rest] = parts;
  return (
    <div className="timeline-parameter">
      <div className="parameter-main">
        <span className="parameter-text">{part1}</span>
      </div>
      {rest.map((line, index) =>
        typeof line === "string" ? (
          <div key={line || `detail-${index}`} className="parameter-detail">
            {line}
          </div>
        ) : (
          // eslint-disable-next-line react/no-array-index-key
          <div key={index} className="parameter-detail">
            {line}
          </div>
        )
      )}
    </div>
  );
};

const TimelineRow = ({
  pricing,
  start,
  end,
  parameter1,
  recommendations,
  onRecommendationClick,
  choicesIdentifier,
  showConfirmationModal,
  activityChoices,
  savingChoices,
  raftingCount,
  raftingMinRequired,
  isIncluded = true,
}) => {
  if (!parameter1) {
    return null;
  }

  const parameter1parts = parameter1
    .split("//")
    .map((line) => line.trim())
    .filter(Boolean);

  const timeDisplay = start && end ? `${start} - ${end}` : start || end || "";

  const renderChoiceTimelineItem = () => {
    if (!choicesIdentifier) {
      return null;
    }

    const choiceSelectedValue = activityChoices?.[choicesIdentifier];
    const choiceIsSaving = savingChoices?.has(choicesIdentifier);

    switch (choicesIdentifier) {
      case "cuartito":
        return elCuartitoPicker();
      case "tango":
        return tangoPicker();
      case "rafting":
        return raftingPicker();
      case "activity-valle-de-uco":
        return valleDeUcoPicker();
      default:
        throw new Error(`Unknown identifier: ${choicesIdentifier}`);
    }

    function elCuartitoPicker() {
      const joinedCuartito = choiceSelectedValue === "cuartito";

      if (joinedCuartito) {
        return (
          <div>
            {renderSimpleTimelineItem(
              ...parameter1parts,
              <div style={{ marginTop: "0.5rem" }}>
                <div className="activity-price">${pricing}</div>
              </div>
            )}
          </div>
        );
      }

      return (
        <>
          {!joinedCuartito && (
            <div className={`has-choices light`}>
              {renderSimpleTimelineItem(
                "Lunch on my own",
                "I will join the group after lunch for the city tour",
                <div>
                  @ 14:30 @{" "}
                  <a
                    href="https://maps.app.goo.gl/54cPdbaqNACTU7ua6"
                    target="_blank"
                  >
                    maps
                  </a>
                </div>
              )}
            </div>
          )}

          <div
            className={`has-choices ${joinedCuartito ? "selected-choice" : ""}`}
          >
            {<div className="optional-activity-label">Paid Add-On</div>}
            {renderSimpleTimelineItem(...parameter1parts)}

            <div className="timeline-choices">
              <div className="choice-row">
                {joinedCuartito && (
                  <div className="activity-price">You're registered!</div>
                )}
                {!joinedCuartito && (
                  <ChoicesGroup
                    name={choicesIdentifier}
                    options={[{ label: "I want to join", value: "cuartito" }]}
                    onClickChoice={showConfirmationModal}
                    isSaving={choiceIsSaving}
                  />
                )}

                {pricing && <div className="activity-price">${pricing}</div>}
              </div>
            </div>
          </div>
        </>
      );
    }

    function tangoPicker() {
      const joinedTango = choiceSelectedValue === "tango";
      if (joinedTango) {
        return (
          <div>
            {renderSimpleTimelineItem(
              ...parameter1parts,
              <div style={{ marginTop: "0.5rem" }}>
                <div className="activity-price">${pricing}</div>
              </div>
            )}
          </div>
        );
      }
      return (
        <div className="timeline-choices">
          <div className="has-choices">
            {<div className="optional-activity-label">Paid Add-On</div>}

            {renderSimpleTimelineItem(...parameter1parts)}

            <div className="timeline-choices">
              <div className="choice-row">
                {joinedTango && (
                  <div className="activity-price">You're registered!</div>
                )}
                {!joinedTango && (
                  <ChoicesGroup
                    name={choicesIdentifier}
                    options={[{ label: "I want to join", value: "tango" }]}
                    onClickChoice={showConfirmationModal}
                    isSaving={choiceIsSaving}
                  />
                )}

                {pricing && <div className="activity-price">${pricing}</div>}
              </div>
            </div>
          </div>
        </div>
      );
    }

    function raftingPicker() {
      const totalNeeded =
        typeof raftingMinRequired === "number" && raftingMinRequired > 0
          ? raftingMinRequired
          : 40;
      const currentCount = typeof raftingCount === "number" ? raftingCount : 0;
      const pct = Math.max(
        0,
        Math.min(100, Math.round((currentCount / totalNeeded) * 100))
      );
      const joinedRafting = choiceSelectedValue === "rafting";
      return (
        <div className="timeline-choices">
          <div className="has-choices">
            {renderSimpleTimelineItem(...parameter1parts)}

            <div className="timeline-progress">
              <div className="progress-header">
                {currentCount}/{totalNeeded} registered
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="progress-note">
                We need at least {totalNeeded} participants to run this
                activity.
              </div>
            </div>

            {/* {joinedRafting ? (
              <div className="activity-price">You're registered!</div>
            ) : (
              <div className="price-button-row">
                {pricing && <div className="activity-price">${pricing}</div>}
                <button
                  className="join-button"
                  onClick={() =>
                    showConfirmationModal(choicesIdentifier, "rafting")
                  }
                  disabled={choiceIsSaving}
                >
                  {choiceIsSaving ? "Joining..." : "I want to join"}
                </button>
              </div>
            )} */}

            <div className="choice-row">
              {!joinedRafting && (
                <ChoicesGroup
                  name={choicesIdentifier}
                  options={[{ label: "I want to join", value: "rafting" }]}
                  onClickChoice={showConfirmationModal}
                  isSaving={choiceIsSaving}
                />
              )}

              {pricing && <div className="activity-price">${pricing}</div>}
            </div>
          </div>
        </div>
      );
    }

    function valleDeUcoPicker() {
      return (
        <div className="timeline-choices">
          <div className="choice-row">
            {pricing && <div className="activity-price">${pricing}</div>}
            <ChoicesGroup
              name={choicesIdentifier}
              options={[
                { label: "Horseback Riding", value: "horseback" },
                { label: "Hiking", value: "hiking" },
              ]}
              onClickChoice={showConfirmationModal}
              isSaving={choiceIsSaving}
            />
          </div>
        </div>
      );
    }
  };

  const hasRecommendations = recommendations && recommendations.trim();
  const hasChoices =
    choicesIdentifier &&
    choicesIdentifier.trim() &&
    ["tango", "rafting", "activity-valle-de-uco", "cuartito"].includes(
      choicesIdentifier.trim()
    );
  const handleClick = hasRecommendations
    ? () => onRecommendationClick(recommendations)
    : undefined;

  return (
    <div className="timeline-row-wrapper">
      <div
        className={`timeline-item-row-mobile ${hasRecommendations ? "clickable" : ""}  ${!isIncluded ? "not-included" : ""}`}
        onClick={handleClick}
      >
        <div className="timeline-mobile-content">
          <div className="timeline-time">{timeDisplay}</div>
        </div>

        {!hasChoices ? (
          <div className={`timeline-right-column`}>
            {renderSimpleTimelineItem(...parameter1parts)}
          </div>
        ) : (
          <div className={`timeline-right-column`}>
            {renderChoiceTimelineItem()}
          </div>
        )}
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
  const [raftingCount, setRaftingCount] = useState(null);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    itemKey: null,
    choice: null,
    title: "",
    message: "",
    isLoading: false,
  });
  const { email: userEmail, password: userPassword } = useContext(AuthContext);
  const { formData, submissionResult } = useTripContext();
  const { showError } = useNotificationContext();

  // Passport presence from context (set at login or via PassportGate)
  const hasPassport = Boolean(submissionResult?.passport);
  const hasLuggageSelection = Boolean(submissionResult?.luggageSelection);

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

  const showConfirmationModal = useCallback((itemKey, choice) => {
    setConfirmationModal({
      isOpen: true,
      itemKey,
      choice,
      title: "Are you sure?",
      message:
        "This action cannot be undone and will have to be amended via Maddie.",
    });
  }, []);

  const closeConfirmationModal = useCallback(() => {
    setConfirmationModal({
      isOpen: false,
      itemKey: null,
      choice: null,
      title: "",
      message: "",
      isLoading: false,
    });
  }, []);

  const handleChoiceSelection = useCallback(
    async (itemKey, choice) => {
      if (!userEmail || !userPassword) {
        console.error("Cannot save choice: User credentials not available");
        return;
      }

      if (__DEV__) {
        console.log("Saving choice:", itemKey, choice);
        setSavingChoices((prev) => new Set(prev).add(itemKey));
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setActivityChoices((prev) => ({
          ...prev,
          [itemKey]: choice,
        }));
        setSavingChoices((prev) => {
          const newSet = new Set(prev);
          newSet.delete(itemKey);
          return newSet;
        });
        if (itemKey === "rafting" && choice === "rafting") {
          setRaftingCount((prev) =>
            typeof prev === "number" ? prev + 1 : prev
          );
        }
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
          const updatedChoices = {
            ...activityChoices,
            [itemKey]: choice,
          };
          setActivityChoices(updatedChoices);

          setCachedData("userChoices", updatedChoices);

          if (itemKey === "rafting" && choice === "yes") {
            setRaftingCount((prev) =>
              typeof prev === "number" ? prev + 1 : prev
            );
          }
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
    },
    [userEmail, userPassword, activityChoices]
  );

  const confirmChoice = useCallback(async () => {
    const { itemKey, choice } = confirmationModal;

    // Set loading state
    setConfirmationModal((prev) => ({ ...prev, isLoading: true }));

    try {
      await handleChoiceSelection(itemKey, choice);
      // Close modal after successful save
      closeConfirmationModal();
    } catch (error) {
      // Reset loading state on error, keep modal open
      setConfirmationModal((prev) => ({ ...prev, isLoading: false }));
      console.error("Error confirming choice:", error);
    }
  }, [confirmationModal, closeConfirmationModal, handleChoiceSelection]);

  const isChoiceSaving = (itemKey) => {
    return savingChoices.has(itemKey);
  };

  const getItemKey = (item, dayKey, itemIndex) => {
    return `${dayKey}-${itemIndex}-${item.CATEGORY}`;
  };

  const onPassportSuccess = useCallback(() => {
    setLoading(true);
  }, []);

  useEffect(() => {
    if (!hasPassport) {
      return;
    }
    const fetchTimelineData = async () => {
      try {
        const timelineData = await fetchWithCache(
          "timelineData",
          async () => {
            const response = await fetch(
              `${APPS_SCRIPT_URL}?endpoint=timeline`
            );
            const { success, data } = await response.json();
            if (!success) {
              throw new Error("Failed to fetch timeline data");
            }
            return data;
          },
          CACHE_DURATIONS.ONE_HOUR,
          new URLSearchParams(window.location.search).get("refresh") === "1"
        );

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
        const choices = await fetchWithCache("userChoices", async () => {
          const response = await fetch(
            `${APPS_SCRIPT_URL}?endpoint=choices&email=${encodeURIComponent(userEmail)}&password=${encodeURIComponent(userPassword)}`
          );
          const data = await response.json();

          if (!data.success) {
            throw new Error(data.error || "Failed to fetch user choices");
          }

          return data.data || {};
        });

        setActivityChoices(choices);
      } catch (err) {
        console.error("Error fetching user choices:", err);
      }
    };

    const fetchRaftingCount = async () => {
      if (__DEV__) {
        setRaftingCount(10);
        return;
      }

      try {
        const count = await fetchWithCache(
          "raftingCount",
          async () => {
            const response = await fetch(
              `${APPS_SCRIPT_URL}?endpoint=rafting_count`
            );
            const data = await response.json();
            if (data.success) {
              return typeof data.count === "number" ? data.count : 0;
            }
            throw new Error("Failed to load rafting count");
          },
          CACHE_DURATIONS.FIVE_MINUTES
        );

        setRaftingCount(count);
      } catch (err) {
        console.error("Error fetching rafting count:", err);
        setRaftingCount(0);
        showError("Failed to load rafting count");
      }
    };

    fetchTimelineData();
    fetchUserChoices();
    fetchRaftingCount();
  }, [hasPassport, userEmail, userPassword, showError]);

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
    return false;
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
        choicesIdentifier={item.CHOICES?.trim().toLowerCase()}
        itemKey={itemKey}
        selectedChoice={selectedChoice}
        showConfirmationModal={showConfirmationModal}
        isSaving={isSaving}
        formData={formData}
        activityChoices={activityChoices}
        savingChoices={savingChoices}
        pricing={item["PRICING"]}
        raftingCount={raftingCount}
        isIncluded={item.isIncluded}
      />
    );
  };

  if (!hasPassport) {
    return <PassportGate onSuccess={onPassportSuccess} />;
  }
  if (!hasLuggageSelection) {
    return <LuggageGate />;
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
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          title={confirmationModal.title}
          message={confirmationModal.message}
          isLoading={confirmationModal.isLoading}
          onClose={closeConfirmationModal}
          onConfirm={confirmChoice}
        />
      </div>
    </div>
  );
};

export default Timeline;
