export type ChoiceId =
  | "default"
  | "cuartito"
  | "tango"
  | "circuitochico"
  | "rafting"
  | "walking"
  | "horse";

export type ChoiceGroup =
  | "bsas-lunch"
  | "tango-night"
  | "bariloche-activity"
  | "valle-de-uco-activity";

export interface TimelineItem {
  id: string;
  "DAY OF MONTH": string;
  "DAY OF WEEK": string;
  CITY: string;
  CATEGORY: string;
  "START HS": string | null | undefined;
  "END HS": string | null | undefined;
  PARAMETER_1: string;
  PARAMETER_2: string | null | undefined;
  PARAMETER_3: string | null | undefined;
  RECOMMENDATIONS: string | null | undefined;
  CHOICES: ChoiceGroup | null | undefined;
  PRICING: string | null | undefined;
  PIN: string | null | undefined;
  isIncluded: boolean | null | undefined;
  CHOICE_ID: ChoiceId | null | undefined;
}

export interface SubmissionResult {
  row: {
    "rsvpData.22Nov_BSAS": string | null | undefined;
    "rsvpData.23Nov_BSAS": string | null | undefined;
    "rsvpData.23Nov_Dinner_Welcome": string | null | undefined;
    "rsvpData.23Nov_Tour": string | null | undefined;
    "rsvpData.24Nov_BARI": string | null | undefined;
    "rsvpData.25Nov_BARI": string | null | undefined;
    "rsvpData.26Nov_BARI": string | null | undefined;
    "rsvpData.27Nov_MDZ": string | null | undefined;
    "rsvpData.28Nov_MDZ": string | null | undefined;
    "rsvpData.29Nov_BSAS": string | null | undefined;
    "rsvpData.AEP-BRC": string | null | undefined;
    "rsvpData.BRC-MDZ": string | null | undefined;
    "rsvpData.MDZ-AEP": string | null | undefined;
    PAYMENT_1: string | null | undefined;
    PAYMENT_2: string | null | undefined;
  };
  userChoices: Record<string, string> | null | undefined;
  passport: boolean | null | undefined;
  luggageSelection: boolean | null | undefined;
}

export interface ConfirmationModalState {
  isOpen: boolean;
  choicesGroup: ChoiceGroup | null;
  choiceId: ChoiceId | null;
  selectedChoice: "yes" | "no" | null;
  title: string;
  message: string;
  isLoading: boolean;
}

export interface DayData {
  date: string;
  city: string;
  items: TimelineItem[];
}

export interface GroupedTimelineData {
  [dayKey: string]: DayData;
}

export interface ChoiceOption {
  label: string;
  value: "yes" | "no";
}

// Component Props Interfaces
export interface SimpleTimelineItemProps {
  item: TimelineItem;
}

export interface RecommendationsModalProps {}

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading: boolean | null | undefined;
}

export interface ChoicesGroupProps {
  choicesGroup: ChoiceGroup;
  choiceId: ChoiceId;
  options: ChoiceOption[];
}

export interface ChoiceTimelineItemProps {
  items: TimelineItem[];
}

export interface DayItemProps {
  dayData: DayData;
}
