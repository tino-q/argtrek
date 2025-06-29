// Welcome Section Component
// Migrated from original index.html welcome section

import { CONTACTS } from "../../utils/config";

const WelcomeSection = () => {
  return (
    <section className="welcome-section">
      <div className="welcome-content">
        <h2>Welcome to Your Argentina Adventure!</h2>
        <p>
          We're excited that you want to join us on this incredible journey
          through Argentina!
        </p>

        <div className="info-cards">
          <div className="info-card">
            <i className="fas fa-map-marked-alt"></i>
            <h3>Full Itinerary</h3>
            <a
              href="https://docs.google.com/presentation/d/164WBfbVElZFp-EVOFWNsplV9U8s5IltaFy4t9rmcpO4/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-link"
            >
              View Details <i className="fas fa-external-link-alt"></i>
            </a>
          </div>

          <div className="info-card">
            <i className="fas fa-phone"></i>
            <h3>Need Help?</h3>
            <div className="contact-info">
              {CONTACTS.map((contact, index) => (
                <p key={index}>
                  <strong>{contact.name}:</strong>
                  <a
                    href={contact.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whatsapp-link"
                  >
                    {contact.phone} <i className="fab fa-whatsapp"></i>
                  </a>
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WelcomeSection;
