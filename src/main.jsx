import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./styles/main.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { setupGlobalErrorHandlers } from "./utils/errorReporting.js";

// One-time localStorage reset for backward compatibility
(function resetLocalStorageOnce() {
  const resetKey = "reset";
  const hasReset = localStorage.getItem(resetKey);

  if (!hasReset) {
    // Extract auth credentials before clearing localStorage
    const authEmail = localStorage.getItem("authEmail");
    const authPassword = localStorage.getItem("authPassword");

    // Clear localStorage and set reset flag
    localStorage.clear();
    localStorage.setItem(resetKey, "true");

    // If user was logged in, redirect to magic link for seamless re-authentication
    if (authEmail && authPassword) {
      window.location.href = `/login?email=${encodeURIComponent(authEmail)}&password=${encodeURIComponent(authPassword)}`;
    } else {
      window.location.reload();
    }
    return; // Prevent further execution
  }
})();

// Setup global error handlers
setupGlobalErrorHandlers();

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
