// Header Component
// Migrated from original index.html header section

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();

  const handleHeaderClick = useCallback(() => {
    navigate("/home");
  }, [navigate]);

  return (
    <div className="container">
      <header className="header">
        <div
          className="header-content"
          onClick={handleHeaderClick}
          style={{ cursor: "pointer" }}
        >
          <h1>
            <i className="fas fa-mountain" /> Argentina Trip
          </h1>
          <p className="subtitle">November 22-29, 2025</p>
        </div>
      </header>
    </div>
  );
};

export default Header;
