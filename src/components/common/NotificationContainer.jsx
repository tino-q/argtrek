// Notification Container Component
// Displays notifications using React state instead of DOM manipulation

import { useCallback } from "react";

import { getNotificationIcon } from "../../hooks/useNotifications";

const NotificationContainer = ({ notifications, removeNotification }) => {
  const createRemoveHandler = useCallback((notificationId) => {
    return () => removeNotification(notificationId);
  }, [removeNotification]);

  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container">
      {notifications.map((notification) => {
        return (
          <div
            key={notification.id}
            className={`notification notification-${notification.type} ${notification.customClass || ""} show`}
          >
            <div className="notification-content">
              <i className={getNotificationIcon(notification.type)} />
              <span>{notification.message}</span>
              <button
                className="notification-close"
                onClick={createRemoveHandler(notification.id)}
                aria-label="Close notification"
              >
                <i className="fas fa-times" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationContainer;
