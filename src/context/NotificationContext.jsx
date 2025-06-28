import { useNotifications } from "../hooks/useNotifications";

import { NotificationContext } from "./contexts";

// Notification provider component
function NotificationProvider({ children }) {
  const notificationHook = useNotifications();

  return (
    <NotificationContext.Provider value={notificationHook}>
      {children}
    </NotificationContext.Provider>
  );
}

export default NotificationProvider;
