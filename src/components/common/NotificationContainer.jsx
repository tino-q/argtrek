// Notification Container Component
// Displays notifications using React state instead of DOM manipulation

import { getNotificationIcon } from "../../hooks/useNotifications";

const NotificationContainer = ({ notifications, onRemove }) => {
  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type} ${notification.customClass || ""} show`}
        >
          <div className="notification-content">
            <i className={getNotificationIcon(notification.type)}></i>
            <span>{notification.message}</span>
            <button
              className="notification-close"
              onClick={() => onRemove && onRemove(notification.id)}
              aria-label="Close notification"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;
