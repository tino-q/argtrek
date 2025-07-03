import { useState, useEffect, useRef } from "react";

const SafeSubmitButton = ({
  onSubmit,
  isLoading = false,
  disabled = false,
  children,
  className = "submit-btn",
  confirmText = "You can only submit once, continue?",
  confirmDuration = 3000,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  // Clean up timers when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    if (disabled || isLoading) return;

    if (!isConfirming) {
      // First click - start confirmation state
      setIsConfirming(true);
      setCountdown(Math.ceil(confirmDuration / 1000));

      // Start countdown timer
      intervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Set timeout to reset state after confirmDuration
      timeoutRef.current = setTimeout(() => {
        setIsConfirming(false);
        setCountdown(0);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }, confirmDuration);
    } else {
      // Second click within confirmation period - actually submit
      setIsConfirming(false);
      setCountdown(0);

      // Clear timers
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Call the actual submit function
      if (onSubmit) {
        onSubmit();
      }
    }
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <i className="fas fa-spinner fa-spin"></i> Processing...
        </>
      );
    }

    if (isConfirming) {
      return (
        <>
          <i className="fas fa-exclamation-triangle"></i> {confirmText} (
          {countdown}s)
        </>
      );
    }

    return children;
  };

  const getButtonClass = () => {
    let classes = className;

    if (isConfirming) {
      classes += " confirming";
    }

    if (isLoading) {
      classes += " loading";
    }

    return classes;
  };

  return (
    <button
      type="button"
      className={getButtonClass()}
      onClick={handleClick}
      disabled={disabled || isLoading}
    >
      {getButtonContent()}
    </button>
  );
};

export default SafeSubmitButton;
