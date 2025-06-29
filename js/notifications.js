// Notifications utility module

// Show notification function with enhanced UX and animations
function showNotification(message, type = "info") {
  // Remove any existing notifications
  const existingNotifications = document.querySelectorAll(".notification");
  existingNotifications.forEach((notification) => notification.remove());

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;

  // Set icon based on type
  let icon = "fas fa-info-circle";
  if (type === "success") icon = "fas fa-check-circle";
  if (type === "error") icon = "fas fa-exclamation-circle";
  if (type === "warning") icon = "fas fa-exclamation-triangle";

  notification.innerHTML = `
    <div class="notification-content">
      <i class="${icon}"></i>
      <span>${message}</span>
      <button class="notification-close" onclick="this.closest('.notification').remove()" aria-label="Close notification">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;

  // Add notification styles if not already added
  addNotificationStyles();

  // Add to page
  document.body.appendChild(notification);

  // Trigger animation
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  // Auto remove after 4 seconds
  const autoRemoveTimer = setTimeout(() => {
    hideNotification(notification);
  }, 4000);

  // Add click to dismiss
  notification.addEventListener("click", () => {
    clearTimeout(autoRemoveTimer);
    hideNotification(notification);
  });

  // Add hover to pause auto-removal
  notification.addEventListener("mouseenter", () => {
    clearTimeout(autoRemoveTimer);
  });

  notification.addEventListener("mouseleave", () => {
    setTimeout(() => {
      hideNotification(notification);
    }, 2000);
  });

  return notification;
}

// Hide notification with animation
function hideNotification(notification) {
  if (notification && notification.parentNode) {
    notification.classList.remove("show");
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }
}

// Add notification styles to the page
function addNotificationStyles() {
  if (!document.querySelector("#notification-styles")) {
    const style = document.createElement("style");
    style.id = "notification-styles";
    style.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 20px;
        border-radius: 12px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        max-width: 400px;
        min-width: 300px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
      }
      
      .notification.show {
        transform: translateX(0);
        opacity: 1;
      }
      
      .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .notification-content i:first-child {
        font-size: 18px;
        flex-shrink: 0;
      }
      
      .notification-content span {
        flex: 1;
        line-height: 1.4;
      }
      
      .notification-close {
        background: none;
        border: none;
        color: inherit;
        font-size: 14px;
        cursor: pointer;
        padding: 4px;
        border-radius: 50%;
        opacity: 0.7;
        transition: opacity 0.2s ease;
        flex-shrink: 0;
      }
      
      .notification-close:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.1);
      }
      
      .notification-success {
        background: linear-gradient(135deg, #10b981, #059669);
        border-color: rgba(16, 185, 129, 0.3);
      }
      
      .notification-error {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        border-color: rgba(239, 68, 68, 0.3);
      }
      
      .notification-warning {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        border-color: rgba(245, 158, 11, 0.3);
      }
      
      .notification-info {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        border-color: rgba(59, 130, 246, 0.3);
      }
      
      @media (max-width: 768px) {
        .notification {
          top: 10px;
          right: 10px;
          left: 10px;
          max-width: none;
          min-width: auto;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Show success notification (convenience method)
function showSuccess(message) {
  return showNotification(message, "success");
}

// Show error notification (convenience method)
function showError(message) {
  return showNotification(message, "error");
}

// Show warning notification (convenience method)
function showWarning(message) {
  return showNotification(message, "warning");
}

// Show info notification (convenience method)
function showInfo(message) {
  return showNotification(message, "info");
}

// Export functions for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}
