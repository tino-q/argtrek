import { useContext } from "react";

import { NotificationContext } from "../context/contexts";

// Custom hook to use the notification context
export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within a NotificationProvider"
    );
  }
  return context;
};
