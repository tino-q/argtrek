// Notifications Hook for React App
// Migrated and improved from original notifications.js

import { useState, useCallback } from "react";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback(
    (message, type = "info", options = {}) => {
      const notification = {
        id: Date.now() + Math.random(),
        message,
        type,
        timestamp: Date.now(),
        autoClose: options.autoClose !== false, // Default to true
        duration: options.duration || 4000,
      };

      setNotifications((prev) => [...prev, notification]);

      // Auto-remove if enabled
      if (notification.autoClose) {
        setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);
      }

      return notification.id;
    },
    []
  );

  const removeNotification = useCallback((id) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback(
    (message, options) => {
      return addNotification(message, "success", options);
    },
    [addNotification]
  );

  const showError = useCallback(
    (message, options) => {
      return addNotification(message, "error", options);
    },
    [addNotification]
  );

  const showWarning = useCallback(
    (message, options) => {
      return addNotification(message, "warning", options);
    },
    [addNotification]
  );

  const showInfo = useCallback(
    (message, options) => {
      return addNotification(message, "info", options);
    },
    [addNotification]
  );

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

// Notification types constants
export const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
};

// Get icon for notification type
export const getNotificationIcon = (type) => {
  const icons = {
    success: "fas fa-check-circle",
    error: "fas fa-exclamation-circle",
    warning: "fas fa-exclamation-triangle",
    info: "fas fa-info-circle",
  };
  return icons[type] || icons.info;
};
