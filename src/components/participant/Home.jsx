import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import { useNotificationContext } from "../../hooks/useNotificationContext";
import { useTripContext } from "../../hooks/useTripContext";

const Home = () => {
  const navigate = useNavigate();
  const { clearAuth } = useAuth();
  const { clearTripData } = useTripContext();
  const { showSuccess } = useNotificationContext();

  const handleLogout = useCallback(() => {
    navigate("/login");
    clearTripData();
    clearAuth(); // Clear auth credentials
    localStorage.removeItem("timelineData");
    localStorage.removeItem("userRSVP");
    localStorage.removeItem("formData");
    localStorage.removeItem("submissionResult");
    localStorage.removeItem("timelineDataTimestamp");
    showSuccess(
      "Logged out successfully. You can now login with different credentials."
    );
  }, [navigate, clearTripData, clearAuth, showSuccess]);

  const navigateToItinerary = useCallback(() => {
    navigate("/itinerary");
  }, [navigate]);

  const navigateToPayments = useCallback(() => {
    navigate("/payments");
  }, [navigate]);

  const navigateToProfile = useCallback(() => {
    navigate("/profile");
  }, [navigate]);

  return (
    <div className="container">
      <div className="home-container">
        <div className="navigation-menu">
          <div className="nav-grid">
            <button className="nav-card" onClick={navigateToItinerary}>
              <i className="fas fa-map" />
              <h3>Itinerary</h3>
              <p>View your complete trip schedule</p>
            </button>

            <button className="nav-card" onClick={navigateToPayments}>
              <i className="fas fa-credit-card" />
              <h3>Payments</h3>
              <p>View payment status and details</p>
            </button>

            <button className="nav-card" onClick={navigateToProfile}>
              <i className="fas fa-user" />
              <h3>Profile</h3>
              <p>Manage your trip preferences</p>
            </button>
          </div>
        </div>

        <div className="account-actions">
          <button className="btn btn-secondary" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
