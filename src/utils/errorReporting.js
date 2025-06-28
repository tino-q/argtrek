import { BACKEND_URL } from "./config";
import { IS_LOCAL } from "./env";

export async function reportError(error, context) {
  try {
    if (IS_LOCAL) {
      console.error("Development Error:", error);
      return;
    }

    const authEmail = localStorage.getItem("authEmail");

    const errorData = {
      endpoint: "error-report",
      errorMessage: error.message || "Unknown error",
      errorStack: error.stack || "No stack trace",
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: authEmail || "Anonymous",
      context,
    };

    await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorData),
    });
  } catch (e) {
    console.error("Error reporting failed:", e);
  }
}

export function setupGlobalErrorHandlers() {
  window.addEventListener("error", (event) => {
    reportError(
      new Error(event.message || "Uncaught Error"),
      "Global Error Handler"
    );
  });

  window.addEventListener("unhandledrejection", (event) => {
    const error =
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));

    reportError(error, "Unhandled Promise Rejection");
  });
}
