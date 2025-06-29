// Clipboard utility functions
// Note: This module depends on notifications.js being loaded first

// Copy to clipboard function with better mobile support
function copyToClipboard(text, button) {
  // Function to show success feedback
  function showSuccessFeedback() {
    const originalContent = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i>';
    button.classList.add("copied");

    // Show notification using the global notifications module
    showSuccess("Copied to clipboard!");

    // Reset button after 2 seconds
    setTimeout(() => {
      button.innerHTML = originalContent;
      button.classList.remove("copied");
    }, 2000);
  }

  // Function to show error feedback
  function showErrorFeedback() {
    showError("Copy failed. Please copy manually.");
  }

  // Try modern Clipboard API first (works on HTTPS and modern browsers)
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showSuccessFeedback();
      })
      .catch((err) => {
        console.error("Clipboard API failed:", err);
        tryFallbackMethod();
      });
  } else {
    // Use fallback method for older browsers or non-secure contexts
    tryFallbackMethod();
  }

  function tryFallbackMethod() {
    try {
      // Create a temporary textarea element
      const textArea = document.createElement("textarea");
      textArea.value = text;

      // Style the textarea to be invisible but still selectable
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "-9999px";
      textArea.style.opacity = "0";
      textArea.style.pointerEvents = "none";
      textArea.style.zIndex = "-1";

      // Add to DOM
      document.body.appendChild(textArea);

      // Select and copy
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, 99999); // For mobile devices

      // Try to copy
      const successful = document.execCommand("copy");

      // Remove from DOM
      document.body.removeChild(textArea);

      if (successful) {
        showSuccessFeedback();
      } else {
        showErrorFeedback();
      }
    } catch (err) {
      console.error("Fallback copy method failed:", err);
      showErrorFeedback();
    }
  }
}

// Export functions for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = { copyToClipboard };
}
