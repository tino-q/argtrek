// Welcome Section Component
// Migrated from original index.html welcome section

import { CONTACTS } from "../../utils/config";
import { getTravelerName } from "../../utils/rsvpData";
import barilocheImage from "../../assets/bariloche.png";
import buenosAiresImage from "../../assets/buenos-aires.png";
import mendozaImage from "../../assets/mendoza.png";

const WelcomeSection = ({ userRSVP }) => {
  const destinations = [
    {
      name: "Buenos Aires",
      description: "Culture & Tango",
      image: buenosAiresImage,
    },
    {
      name: "Bariloche",
      description: "Adventure & Rafting",
      image: barilocheImage,
    },

    {
      name: "Mendoza",
      description: "Wine & Mountains",
      image: mendozaImage,
    },
  ];

  // Get the user's name for personalization
  const travelerName = getTravelerName(userRSVP);
  const firstName =
    travelerName && travelerName !== "Name not found"
      ? travelerName.split(" ")[0] // Get first name for a more personal touch
      : "Traveler"; // Fallback if name is not available

  return (
    <section className="welcome-hero">
      {/* Main Hero Content */}
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title">Welcome {firstName}!</h1>
          <p className="hero-subtitle">
            We're excited that you want to join us on this incredible journey
            through Argentina's most breathtaking destinations!
          </p>
        </div>

        {/* Destination Images */}
        <div className="destinations-stack">
          {destinations.map((destination, index) => (
            <div key={index} className="destination-card">
              <div className="destination-image">
                <img src={destination.image} alt={destination.name} />
                <div className="destination-overlay">
                  <h3>{destination.name}</h3>
                  <p>{destination.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Cards */}
      <div className="action-cards">
        <div className="action-card itinerary-card">
          <div className="card-icon">
            <i className="fas fa-map-marked-alt"></i>
          </div>
          <div className="card-content">
            <h3>Explore the Full Itinerary</h3>
            <p>Discover every detail of your Argentina adventure</p>
            <a
              href="https://docs.google.com/presentation/d/164WBfbVElZFp-EVOFWNsplV9U8s5IltaFy4t9rmcpO4/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="action-button primary"
            >
              View Details <i className="fas fa-external-link-alt"></i>
            </a>
          </div>
        </div>

        <div className="action-card contact-card">
          <div className="card-icon">
            <i className="fas fa-headset"></i>
          </div>
          <div className="card-content">
            <h3>Need Assistance?</h3>
            <p>Our team is here to help with any questions</p>
            <div className="contacts-grid">
              {CONTACTS.map((contact, index) => (
                <div key={index} className="contact-row">
                  <div className="contact-info">
                    <span className="contact-name">{contact.name}</span>
                    <span className="contact-phone">{contact.phone}</span>
                  </div>
                  <a
                    href={contact.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whatsapp-btn"
                    title={`Message ${contact.name} on WhatsApp`}
                  >
                    <i className="fab fa-whatsapp"></i>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WelcomeSection;
