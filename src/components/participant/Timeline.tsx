/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import React, {
  useEffect,
  useState,
  useContext,
  useCallback,
  useMemo,
  createContext,
} from "react";
import { useNavigate } from "react-router-dom";

import AuthContext from "../../context/AuthContext.jsx";
import { useNotificationContext } from "../../hooks/useNotificationContext";
import { useTripContext } from "../../hooks/useTripContext";
import { useUserDataRefresh } from "../../hooks/useUserDataRefresh";
import { ADMIN_EMAILS, CONTACTS } from "../../utils/config.js";
import {
  getTimelineData,
  getRaftingCount,
  setUserChoice,
} from "../../utils/api.js";
import { dayHasPendingChoices } from "../../utils/choiceAnswers.js";

import LuggageGate from "./LuggageGate.jsx";
import PassportGate from "./PassportGate.jsx";
import "./Timeline.css";
import type {
  TimelineItem,
  SubmissionResult,
  ConfirmationModalState,
  GroupedTimelineData,
  SimpleTimelineItemProps,
  RecommendationsModalProps,
  ChoicesGroupProps,
  ChoiceTimelineItemProps,
  DayItemProps,
  ChoiceGroup,
  ChoiceId,
} from "./Timeline.types";

const SelectedRecommendationContext = createContext<{
  selectedRecommendation: string | null;
  setSelectedRecommendation: (value: string | null) => void;
} | null>(null);

const SelectedRecommendationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [selectedRecommendation, setSelectedRecommendation] = useState<
    string | null
  >(null);

  return (
    <SelectedRecommendationContext.Provider
      value={{ selectedRecommendation, setSelectedRecommendation }}
    >
      {children}
    </SelectedRecommendationContext.Provider>
  );
};

const useSelectedRecommendation = () => {
  const context = useContext(SelectedRecommendationContext);
  if (!context) {
    throw new Error(
      "useSelectedRecommendation must be used within SelectedRecommendationProvider"
    );
  }
  return context;
};

const RaftingQueueContext = createContext<{
  raftingQueue: string[] | null;
  onJoinRafting: () => void;
} | null>(null);

const RaftingQueueProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [raftingQueue, setRaftingQueue] = useState<string[] | null>(null);
  const { email: userEmail, password: userPassword } = useContext(AuthContext);

  useEffect(() => {
    const fetchRaftingQueue = async () => {
      try {
        const data = await getRaftingCount(userEmail, userPassword);
        if (data.success && Array.isArray(data.raftingQueue)) {
          setRaftingQueue(data.raftingQueue);
          return;
        }
        throw new Error("Failed to load rafting count");
      } catch (err) {
        console.error("Error fetching rafting count:", err);
        setRaftingQueue([]);
      }
    };
    fetchRaftingQueue();
  }, []);

  const onJoinRafting = useCallback(() => {
    setRaftingQueue((prev) => (prev || []).concat([userEmail]));
  }, []);

  return (
    <RaftingQueueContext.Provider value={{ raftingQueue, onJoinRafting }}>
      {children}
    </RaftingQueueContext.Provider>
  );
};

const useRaftingQueue = () => {
  const context = useContext(RaftingQueueContext);
  if (!context) {
    throw new Error("useRaftingQueue must be used within RaftingQueueProvider");
  }
  return context;
};

const ConfirmationModalContext = createContext<{
  confirmationModal: ConfirmationModalState;
  showConfirmationModal: (
    choicesGroup: ChoiceGroup,
    choiceId: ChoiceId,
    selectedChoice: "yes" | "no"
  ) => void;
  closeConfirmationModal: () => void;
  confirmChoice: () => Promise<void>;
} | null>(null);

const ConfirmationModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [confirmationModal, setConfirmationModal] =
    useState<ConfirmationModalState>({
      isOpen: false,
      choicesGroup: null,
      selectedChoice: null,
      choiceId: null,
      title: "",
      message: "",
      isLoading: false,
    });

  const { email: userEmail, password: userPassword } = useContext(AuthContext);
  const { onJoinRafting } = useRaftingQueue();
  const { refreshUserData } = useUserDataRefresh();

  const showConfirmationModal = useCallback(
    (
      choicesGroup: ChoiceGroup,
      choiceId: ChoiceId,
      selectedChoice: "yes" | "no" | null
    ) => {
      setConfirmationModal({
        isOpen: true,
        choicesGroup,
        choiceId,
        selectedChoice,
        title: "Are you sure?",
        message:
          "This action cannot be undone and will have to be amended via Maddie.",
        isLoading: false,
      });
    },
    []
  );

  const closeConfirmationModal = useCallback(() => {
    setConfirmationModal({
      isOpen: false,
      choicesGroup: null,
      choiceId: null,
      selectedChoice: null,
      title: "",
      message: "",
      isLoading: false,
    });
  }, []);

  const handleChoiceSelection = useCallback(
    async (
      choicesGroup: ChoiceGroup,
      choiceId: ChoiceId,
      selectedChoice: "yes" | "no"
    ) => {
      if (!userEmail || !userPassword) {
        console.error("Cannot save choice: User credentials not available");
        return;
      }

      try {
        const data = await setUserChoice({
          email: userEmail,
          password: userPassword,
          itemKey: choicesGroup,
          choice: selectedChoice,
          option: choiceId,
        });

        if (!data.success) {
          console.error("Failed to save choice:", data.error);
        } else {
          // Refresh user data to get updated pricing after choice submission
          await refreshUserData(userEmail, userPassword, {
            showSuccessMessage: false,
            navigateOnSuccess: false,
            cleanupUrl: false,
          });

          if (
            choicesGroup === "bariloche-activity" &&
            choiceId === "rafting" &&
            selectedChoice === "yes"
          ) {
            onJoinRafting();
          }
        }
      } catch (err) {
        console.error("Error saving choice:", err);
      }
    },
    [userEmail, userPassword, refreshUserData, onJoinRafting]
  );

  const confirmChoice = useCallback(async () => {
    const { choicesGroup, choiceId, selectedChoice } = confirmationModal;

    if (!choicesGroup || !choiceId || !selectedChoice) {
      return;
    }

    setConfirmationModal((prev) => ({ ...prev, isLoading: true }));

    try {
      await handleChoiceSelection(choicesGroup, choiceId, selectedChoice);
      closeConfirmationModal();
    } catch (error) {
      setConfirmationModal((prev) => ({ ...prev, isLoading: false }));
      console.error("Error confirming choice:", error);
    }
  }, [confirmationModal, closeConfirmationModal, handleChoiceSelection]);

  const stopPropagation = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation(),
    []
  );

  return (
    <ConfirmationModalContext.Provider
      value={{
        confirmationModal,
        showConfirmationModal,
        closeConfirmationModal,
        confirmChoice,
      }}
    >
      {children}
      {confirmationModal.isOpen && (
        <div
          className="modal-overlay"
          onClick={
            confirmationModal.isLoading ? undefined : closeConfirmationModal
          }
        >
          <div className="modal-content" onClick={stopPropagation}>
            <div className="modal-header">
              <h3>{confirmationModal.title}</h3>
            </div>
            <div className="modal-body">
              <p>{confirmationModal.message}</p>
              {confirmationModal.isLoading ? (
                <div className="modal-loading">
                  <div className="loading-spinner" />
                  <p>Saving your choice...</p>
                </div>
              ) : (
                <div className="modal-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={closeConfirmationModal}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={confirmChoice}>
                    Confirm
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </ConfirmationModalContext.Provider>
  );
};

const useConfirmationModal = () => {
  const context = useContext(ConfirmationModalContext);
  if (!context) {
    throw new Error(
      "useConfirmationModal must be used within ConfirmationModalProvider"
    );
  }
  return context;
};

function RaftingProgressBar() {
  const { raftingQueue } = useRaftingQueue();
  const { email } = useContext(AuthContext);

  if (!raftingQueue) {
    throw new Error("Rafting queue not found");
  }

  const emailQueueIndex = raftingQueue
    .map((e) => e.toString().toLowerCase().trim())
    .indexOf(email.toLowerCase().trim());

  if (emailQueueIndex !== -1 && emailQueueIndex < 20) {
    return (
      <>
        <div className="timeline-parameter parameter-detail">
          You're registered!
        </div>
      </>
    );
  }

  const maxParticipants = 20;
  const raftingCount = raftingQueue.length;
  const pct = Math.max(
    0,
    Math.min(100, Math.round((raftingCount / maxParticipants) * 100))
  );
  const isOverCapacity = raftingCount > maxParticipants;
  const isComplete = raftingCount === maxParticipants;
  let raftingMessage;

  if ((isOverCapacity || isComplete) && emailQueueIndex !== -1) {
    raftingMessage = `You're registered, yet we need ${30 - raftingCount} more participants to guarantee your spot.`;
  } else {
    if (isOverCapacity) {
      raftingMessage = `${raftingCount - maxParticipants} over capacity! Need ${30 - raftingCount} more participants to guarantee spots. First come, first serve!`;
    } else if (isComplete) {
      raftingMessage = `Need 10 more participants to guarantee spots. First come, first serve!`;
    } else {
      raftingMessage = `Need ${maxParticipants - raftingCount} more participants. First come, first serve!`;
    }
  }

  return (
    <div className="timeline-progress">
      <div className="progress-header">
        {raftingCount}/{maxParticipants} registered
      </div>
      <div className="progress-bar-container">
        <div className="progress-bar">
          <div
            className={`progress-fill ${isOverCapacity || isComplete ? "over-capacity" : ""}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="progress-note">{raftingMessage}</div>
    </div>
  );
}

const SimpleTimelineItem: React.FC<SimpleTimelineItemProps> = ({ item }) => {
  const [part1, ...rest] = parseParameter1(item);
  const pin = item["PIN"];
  const pinData = parsePinData(pin);
  const hasRecommendations = Boolean(item.RECOMMENDATIONS?.trim().length);

  const { setSelectedRecommendation } = useSelectedRecommendation();

  const onClickTimelineItem = () =>
    hasRecommendations && setSelectedRecommendation(item.RECOMMENDATIONS!);

  return (
    <div
      className={`timeline-parameter ${hasRecommendations ? "clickable" : ""}`}
      onClick={onClickTimelineItem}
    >
      <div className="parameter-main">
        <span className="parameter-text">{part1}</span>
      </div>
      {rest.map((line, index) => {
        if (typeof line === "string") {
          return (
            <div key={line || `detail-${index}`} className="parameter-detail">
              {line}
            </div>
          );
        }

        return (
          // eslint-disable-next-line react/no-array-index-key
          <div key={index} className="parameter-detail">
            {line}
          </div>
        );
      })}

      {/* Add address hyperlink if PIN data is available */}
      {pinData && (
        <div className="parameter-detail">
          📍{" "}
          <a
            href={pinData.mapLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#0066cc", textDecoration: "underline" }}
          >
            {pinData.address}
          </a>
        </div>
      )}

      {/* {pricing && (
        <div key="pricing" style={{ marginTop: "0.5rem" }}>
          <div className="activity-price">${pricing}</div>
        </div>
      )} */}
    </div>
  );
};

const toBool = (x?: string | null) =>
  x?.toString().toLowerCase().trim() === "true";

const filterTimelineData = (
  timelineData: TimelineItem[],
  submissionResult: SubmissionResult
): TimelineItem[] => {
  const { row } = submissionResult;
  const buenosAiresArrivalHotel =
    toBool(row["rsvpData.22Nov_BSAS"]) || toBool(row["rsvpData.23Nov_BSAS"]);
  const welcomeDinner = toBool(row["rsvpData.23Nov_Dinner_Welcome"]);
  const bsasTour = toBool(row["rsvpData.23Nov_Tour"]);
  const bariHotel =
    toBool(row["rsvpData.24Nov_BARI"]) ||
    toBool(row["rsvpData.25Nov_BARI"]) ||
    toBool(row["rsvpData.26Nov_BARI"]);
  const mendozaHotel =
    toBool(row["rsvpData.27Nov_MDZ"]) || toBool(row["rsvpData.28Nov_MDZ"]);
  const bsasDepartureHotel = toBool(row["rsvpData.29Nov_BSAS"]);
  const bsasToBrcFlight = toBool(row["rsvpData.AEP-BRC"]);
  const brcToMendozaFlight = toBool(row["rsvpData.BRC-MDZ"]);
  const mdzToBsasFlight = toBool(row["rsvpData.MDZ-AEP"]);

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

function parseParameter1(item: TimelineItem) {
  return item["PARAMETER_1"]
    .split("//")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parsePinData(
  pin: string | null | undefined
): { address: string; mapLink: string } | null {
  if (!pin?.trim()) {
    return null;
  }

  const parts = pin
    .split("///")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length !== 2) {
    return null;
  }

  const [address, mapLink] = parts;
  return address && mapLink ? { address, mapLink } : null;
}

const RecommendationsModal: React.FC<RecommendationsModalProps> = ({}) => {
  const { selectedRecommendation, setSelectedRecommendation } =
    useSelectedRecommendation();

  const stopPropagation = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation(),
    []
  );

  const onClose = useCallback(() => {
    setSelectedRecommendation(null);
  }, [setSelectedRecommendation]);

  if (!selectedRecommendation) {
    return null;
  }

  if (!selectedRecommendation) {
    return <></>;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={stopPropagation}>
        <div className="modal-header right">
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <ul className="recommendations-list">
            <div dangerouslySetInnerHTML={{ __html: selectedRecommendation }} />
          </ul>
        </div>
      </div>
    </div>
  );
};

const ChoicesGroup: React.FC<ChoicesGroupProps> = ({
  choicesGroup,
  choiceId,
  options,
}) => {
  const { showConfirmationModal } = useConfirmationModal();
  if (!Array.isArray(options) || options.length === 0) {
    return null;
  }

  return (
    <div className="activity-choices" role="radiogroup" aria-label="Choices">
      {options.map((option) => (
        <button
          className="choice-option"
          key={option.value}
          onClick={() =>
            showConfirmationModal(choicesGroup, choiceId, option.value)
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

const PaidAddOnPicker: React.FC<{
  choicesGroup: ChoiceGroup;
  items: TimelineItem[];
  existingYesChoice?: ChoiceId | null;
}> = ({ items, choicesGroup, existingYesChoice }) => {
  const { submissionResult } = useTripContext();

  if (items.length !== 2 && items.length !== 3) {
    throw new Error(`${choicesGroup} picker: items must be 2 or 3`);
  }

  let includedItems = items.filter((item) => item.PRICING === "included");
  let paidItems = items.filter((item) => item.PRICING !== "included");

  let allOptionalActivities = false;
  if (paidItems.length === 0) {
    paidItems = includedItems;
    includedItems = [];
    allOptionalActivities = true;
  }

  const choseAnyPaidItem = Boolean(
    Object.entries(submissionResult.userChoices).some(
      ([key, value]) => key.startsWith(choicesGroup) && value !== "no"
    ) || existingYesChoice
  );

  return (
    <>
      {!choseAnyPaidItem && includedItems.length > 0 && (
        <div className={`has-choices light`}>
          <div className="optional-activity-label grey">Current Selection</div>
          <SimpleTimelineItem item={includedItems[0]} />
        </div>
      )}

      {paidItems.map((paidItem) => {
        const itemKey = `${choicesGroup}-${paidItem.CHOICE_ID}`;
        const joinedItem =
          existingYesChoice === paidItem.CHOICE_ID ||
          submissionResult.userChoices?.[itemKey] === "yes";
        const deniedItem = submissionResult.userChoices?.[itemKey] === "no";
        return (
          <div key={paidItem.id} className="has-choices">
            <div className="optional-activity-label">
              {joinedItem
                ? "Current Selection"
                : !allOptionalActivities
                  ? "Optional Paid Add-On"
                  : "Optional Add-On"}
            </div>
            <SimpleTimelineItem item={paidItem} />
            {!allOptionalActivities && (
              <div className="activity-price-row">
                <div className="activity-price">${paidItem.PRICING}</div>
              </div>
            )}
            {paidItem.CHOICE_ID === "rafting" && <RaftingProgressBar />}
            <div className="timeline-choices">
              <div className="choice-row">
                {!joinedItem && !deniedItem && !choseAnyPaidItem && (
                  <ChoicesGroup
                    choicesGroup={choicesGroup}
                    choiceId={paidItem.CHOICE_ID!}
                    options={[
                      { label: "Join!", value: "yes" },
                      { label: "No, thanks", value: "no" },
                    ]}
                  />
                )}

                {(deniedItem || (!joinedItem && choseAnyPaidItem)) && (
                  <div className="parameter-detail">
                    You have declined this add-on. To add it to your trip,
                    please{" "}
                    <a
                      href={
                        CONTACTS.find((contact) =>
                          contact.name.includes("Maddie")
                        )?.whatsapp
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      reach out to Maddie
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

const ChoiceTimelineItem = ({ items }: { items: TimelineItem[] }) => {
  const { formData } = useTripContext();
  const [item] = items;
  const choicesIdentifier: ChoiceGroup | null | undefined =
    item.CHOICES?.trim().toLowerCase() as ChoiceGroup | null | undefined;
  switch (choicesIdentifier) {
    case "bsas-lunch":
      return <PaidAddOnPicker items={items} choicesGroup="bsas-lunch" />;
    case "tango-night":
      const hasTangoAlready =
        formData.tango.toString().trim().toLowerCase() === "true";
      return (
        <PaidAddOnPicker
          items={items}
          choicesGroup="tango-night"
          existingYesChoice={hasTangoAlready ? "tango" : null}
        />
      );
    case "bariloche-activity":
      const hasRaftingAlready =
        formData.rafting.toString().trim().toLowerCase() === "true";
      return (
        <PaidAddOnPicker
          items={items}
          choicesGroup="bariloche-activity"
          existingYesChoice={hasRaftingAlready ? "rafting" : null}
        />
      );
    case "valle-de-uco-activity":
      return (
        <PaidAddOnPicker items={items} choicesGroup="valle-de-uco-activity" />
      );
    default:
      throw new Error(`Unknown identifier: ${choicesIdentifier}`);
  }
};

const TimelineRow: React.FC<ChoiceTimelineItemProps> = ({ items }) => {
  const start = items[0]["START HS"];
  const end = items[0]["END HS"];
  const [{ isIncluded }] = items;
  const timeDisplay = start && end ? `${start} - ${end}` : start || end || "";

  if (items.length === 0) {
    throw new Error("TimelineRow: items is empty");
  }

  return (
    <div className="timeline-row-wrapper">
      <div
        className={`timeline-item-row-mobile${isIncluded === false ? " not-included" : ""}`}
      >
        <div className="timeline-mobile-content">
          <div className="timeline-time">{timeDisplay}</div>
        </div>

        {items.length === 1 ? (
          <div className={`timeline-right-column`}>
            <SimpleTimelineItem item={items[0]} />
          </div>
        ) : (
          <div className={`timeline-right-column`}>
            <ChoiceTimelineItem items={items} />
          </div>
        )}
      </div>
    </div>
  );
};

const DayItem: React.FC<DayItemProps> = ({ dayData }) => {
  const p: TimelineItem[][] = [];

  // group items by choices
  for (let i = 0; i < dayData.items.length; i++) {
    const item = dayData.items[i];
    const itemChoice = item.CHOICES?.trim().toLowerCase();
    if (!itemChoice) {
      p.push([item]);
    } else {
      // look if the previous item has the same choice
      const prevArray = p[p.length - 1];
      const prevItem = prevArray[prevArray.length - 1];
      if (prevItem.CHOICES?.trim().toLowerCase() === itemChoice) {
        prevArray.push(item);
      } else {
        p.push([item]);
      }
    }
  }

  return (
    <div className="timeline-items">
      {p.map((items) => (
        <div
          key={items.map((item) => item.id).join("-")}
          className="timeline-item"
        >
          <TimelineRow items={items} />
        </div>
      ))}
    </div>
  );
};

const TimelineContent: React.FC = () => {
  const navigate = useNavigate();
  const [timelineData, setTimelineData] = useState<TimelineItem[] | null>(null);
  const [loadingTimeline, setLoadingTimeline] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());

  const [showAllItems, setShowAllItems] = useState<boolean>(false);
  const { email: userEmail } = useContext(AuthContext);
  const { submissionResult, formData } = useTripContext();
  const { showError } = useNotificationContext();

  // Passport presence from context (set at login or via PassportGate)
  const hasPassport = Boolean(submissionResult?.passport);
  const hasLuggageSelection = Boolean(submissionResult?.luggageSelection);

  const navigateToHome = useCallback(() => {
    navigate("/home");
  }, [navigate]);

  const isAdmin = ADMIN_EMAILS.includes(userEmail);

  const personalTimelineData = useMemo((): TimelineItem[] | null => {
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

  const reloadPage = useCallback(() => {
    window.location.reload();
  }, []);

  const toggleDay = useCallback((dayKey: string) => {
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
    (dayKey: string) => {
      return () => toggleDay(dayKey);
    },
    [toggleDay]
  );

  const handleShowAllItemsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setShowAllItems(e.target.checked);
    },
    []
  );

  useEffect(() => {
    if (!hasLuggageSelection) {
      return;
    }

    if (!hasPassport) {
      return;
    }

    const fetchTimelineData = async () => {
      try {
        const timelineData = await getTimelineData();

        if (timelineData) {
          setTimelineData(
            timelineData.map((item: TimelineItem, index: number) => ({
              ...item,
              id: index,
            }))
          );
          // Initialize all days as collapsed
          const dayKeys = new Set<string>();
          timelineData.forEach((item: TimelineItem) => {
            const dayKey = item["DAY OF MONTH"];
            dayKeys.add(dayKey);
          });
          setCollapsedDays(dayKeys);
        } else {
          setError("Failed to load timeline data");
        }
      } catch (err) {
        setError("Error fetching timeline data");
        console.error("Error fetching timeline data:", err);
      } finally {
        setLoadingTimeline(false);
      }
    };

    fetchTimelineData();
  }, [hasPassport, userEmail, showError, hasLuggageSelection]);

  // TODO: remove this after construction
  // if (!ADMIN_EMAILS.includes(userEmail)) {
  // return <UnderConstruction navigateToHome={navigateToHome} />;
  // }

  const groupByDay = (data: TimelineItem[]): GroupedTimelineData => {
    const grouped: GroupedTimelineData = {};
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

  const getDaySuffix = (day: number): string => {
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

  const isDayCollapsed = (dayKey: string): boolean => {
    return collapsedDays.has(dayKey);
  };

  if (!hasPassport) {
    return <PassportGate />;
  }

  if (!hasLuggageSelection) {
    return <LuggageGate />;
  }

  if (loadingTimeline) {
    return (
      <div className="container">
        <div className="timeline-loading">
          <div className="loading-spinner" />
          <p>Loading...</p>
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
        <h3>No trip itinerary data</h3>
        <p>Check back later for your trip details</p>
      </div>
    );
  }

  const groupedData = groupByDay(personalTimelineData || []);

  return (
    <div className="container">
      <div className="timeline-container">
        <div className="timeline-header">
          <div className="timeline-header-nav">
            <h1>Trip Itinerary</h1>
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
          {Object.entries(groupedData).map(([dayKey, dayData]) => {
            const dayNumber = parseInt(dayKey);
            const hasPendingChoices = dayHasPendingChoices(
              dayNumber,
              submissionResult.userChoices,
              formData
            );

            return (
              <div key={dayKey} className="timeline-day">
                <div
                  className="day-header"
                  onClick={createToggleHandler(dayKey)}
                >
                  <div className="collapse-indicator">
                    {isDayCollapsed(dayKey) ? "▼" : "▲"}
                  </div>
                  <h2>{dayData.date}</h2>
                  {hasPendingChoices && (
                    <div
                      className="pending-choice-indicator"
                      title="This day has pending activity choices"
                    >
                      <i
                        className="fas fa-exclamation-circle"
                        style={{ color: "#ff6b35", fontSize: "18px" }}
                      ></i>
                    </div>
                  )}
                </div>

                {!isDayCollapsed(dayKey) && <DayItem dayData={dayData} />}
              </div>
            );
          })}
        </div>
        <RecommendationsModal />
      </div>
    </div>
  );
};

const Timeline: React.FC = () => {
  return (
    <RaftingQueueProvider>
      <SelectedRecommendationProvider>
        <ConfirmationModalProvider>
          <TimelineContent />
        </ConfirmationModalProvider>
      </SelectedRecommendationProvider>
    </RaftingQueueProvider>
  );
};

export default Timeline;
