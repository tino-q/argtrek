import { useTripContext } from "../../hooks/useTripContext";
import { getEmail } from "../../utils/rsvpData";

const Home = ({ onLogout, onNavigate }) => {
  const { userRSVP } = useTripContext();

  if (!userRSVP) {
    return (
      <div className="participant-home">
        <h2>Welcome</h2>
        <p>Please log in to access your trip details.</p>
        <button className="btn btn-primary" onClick={() => onNavigate("login")}>
          Login
        </button>
      </div>
    );
  }

  const email = getEmail(userRSVP);

  return (
    <div className="container">
      <div className="home-container">
        <div className="navigation-menu">
          <div className="nav-grid">
            <button className="nav-card" onClick={() => onNavigate("payments")}>
              <i className="fas fa-credit-card"></i>
              <h3>Payments</h3>
              <p>View payment status and details</p>
            </button>

            <button className="nav-card" onClick={() => onNavigate("profile")}>
              <i className="fas fa-user"></i>
              <h3>Profile</h3>
              <p>Manage your trip preferences</p>
            </button>

            <button
              className="nav-card"
              onClick={() => onNavigate("itinerary")}
            >
              <i className="fas fa-map"></i>
              <h3>Itinerary</h3>
              <p>View your complete trip schedule</p>
            </button>
          </div>
        </div>

        <div className="account-actions">
          <button className="btn btn-secondary" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
