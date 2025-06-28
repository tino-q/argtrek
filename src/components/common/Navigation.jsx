// Generic Navigation Component
// Provides consistent back/forward navigation across all form steps

import PropTypes from "prop-types";

const Navigation = ({
  onBack,
  onForward,
  backText = "Go Back",
  forwardText = "Continue",
  backIcon = "fas fa-arrow-left",
  forwardIcon = "fas fa-arrow-right",
  showBack = true,
  showForward = true,
  forwardDisabled = false,
  forwardComponent = null, // For custom components like SafeSubmitButton
  className = "",
}) => {
  return (
    <div className={`navigation-container ${className}`}>
      <div className="form-actions">
        {showBack && (
          <button type="button" className="btn-secondary" onClick={onBack}>
            <i className={backIcon} /> {backText}
          </button>
        )}

        {forwardComponent ? (
          forwardComponent
        ) : showForward ? (
          <button
            type="button"
            className="submit-btn"
            onClick={onForward}
            disabled={forwardDisabled}
          >
            <i className={forwardIcon} /> {forwardText}
          </button>
        ) : null}
      </div>
    </div>
  );
};

Navigation.propTypes = {
  onBack: PropTypes.func,
  onForward: PropTypes.func,
  backText: PropTypes.string,
  forwardText: PropTypes.string,
  backIcon: PropTypes.string,
  forwardIcon: PropTypes.string,
  showBack: PropTypes.bool,
  showForward: PropTypes.bool,
  forwardDisabled: PropTypes.bool,
  forwardComponent: PropTypes.node,
  className: PropTypes.string,
};

export default Navigation;
