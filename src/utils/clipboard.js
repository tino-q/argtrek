// Clipboard utility functions for React
// Migrated from original clipboard.js

// Copy to clipboard function with better mobile support
export const copyToClipboard = async (text) => {
  try {
    // Try modern Clipboard API first (works on HTTPS and modern browsers)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return { success: true, method: "modern" };
    } 
      // Use fallback method for older browsers or non-secure contexts
      return await fallbackCopyMethod(text);
    
  } catch (error) {
    console.error("Clipboard operation failed:", error);
    return { success: false, error: error.message };
  }
};

// Fallback copy method for older browsers
const fallbackCopyMethod = (text) => {
  return new Promise((resolve) => {
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

      resolve({
        success: successful,
        method: "fallback",
        error: successful ? null : "Copy command failed",
      });
    } catch (err) {
      resolve({
        success: false,
        method: "fallback",
        error: err.message,
      });
    }
  });
};

// React hook for clipboard functionality
import { useState, useCallback } from "react";

export const useClipboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastCopied, setLastCopied] = useState(null);

  const copy = useCallback(async (text) => {
    setIsLoading(true);
    const result = await copyToClipboard(text);

    if (result.success) {
      setLastCopied({ text, timestamp: Date.now() });
    }

    setIsLoading(false);
    return result;
  }, []);

  const reset = useCallback(() => {
    setLastCopied(null);
  }, []);

  return {
    copy,
    reset,
    isLoading,
    lastCopied,
    isSupported: navigator.clipboard || document.execCommand,
  };
};
