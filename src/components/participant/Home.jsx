import { useNavigate } from "react-router-dom";
import { useTripContext } from "../../hooks/useTripContext";

const Home = ({ onLogout, onNavigate }) => {
  const { userRSVP } = useTripContext();
  const navigate = useNavigate();

  if (!userRSVP) {
    navigate("/");
  }

  return (
    <div className="container">
      <div className="home-container">
        <div className="navigation-menu">
          <div className="nav-grid">
            <button
              className="nav-card"
              onClick={() => onNavigate("itinerary")}
            >
              <i className="fas fa-map"></i>
              <h3>Itinerary</h3>
              <p>View your complete trip schedule</p>
            </button>

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
