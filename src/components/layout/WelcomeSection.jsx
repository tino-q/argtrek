// Welcome Section Component
// Migrated from original index.html welcome section

import barilocheImage from "../../assets/bariloche.png";
import buenosAiresImage from "../../assets/buenos-aires.png";
import mendozaImage from "../../assets/mendoza.png";
import { useNotificationContext } from "../../hooks/useNotificationContext";
import { useClipboard } from "../../utils/clipboard";
import { CONTACTS } from "../../utils/config";
import { getTravelerName } from "../../utils/rsvpData";

const WelcomeSection = ({ userRSVP }) => {
  const { copy } = useClipboard();
  const { showSuccess, showError } = useNotificationContext();

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

  // Handle phone number copy
  const handlePhoneCopy = async (phone, name) => {
    try {
      const result = await copy(phone);
      if (result.success) {
        showSuccess(`${name}'s phone number copied to clipboard!`);
      } else {
        showError("Failed to copy phone number. Please try again.");
      }
    } catch {
      showError("Failed to copy phone number. Please try again.");
    }
  };

  return (
    <div className="container">
      <section>
        {/* Welcome Header */}
        <div className="welcome-step-header">
          <h1 className="welcome-title">Welcome {firstName}!</h1>
          <p className="welcome-subtitle">
            We're excited that you want to join us on this incredible journey
            through Argentina's most breathtaking destinations!
          </p>
        </div>

        {/* Destination Images */}
        <div className="destinations-stack">
          {destinations.map((destination) => (
            <div key={destination.name} className="destination-card">
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

        {/* Itinerary Section */}
        <div className="content-section">
          <div className="section-icon">
            <i className="fas fa-map-marked-alt" />
          </div>
          <h3>Explore the Full Itinerary</h3>
          <p>
            Full agenda coming soon! Until then, check out our RSVP presentation
            to get excited about your Argentina adventure.
          </p>
          <a
            href="https://docs.google.com/presentation/d/164WBfbVElZFp-EVOFWNsplV9U8s5IltaFy4t9rmcpO4/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="action-button primary"
          >
            View Presentation <i className="fas fa-external-link-alt" />
          </a>
        </div>

        {/* Contact Section */}
        <div className="content-section">
          <div className="section-icon">
            <i className="fas fa-headset" />
          </div>
          <h3>Need Assistance?</h3>
          <p>Our team is here to help with any questions</p>
          <div className="contacts-grid">
            {CONTACTS.map((contact) => (
              <div key={contact.name} className="contact-card">
                <div className="contact-info">
                  <span className="contact-name">{contact.name}</span>
                  <button
                    className="contact-phone"
                    onClick={handlePhoneCopy}
                    title={`Copy ${contact.name}'s phone number`}
                  >
                    {contact.phone}
                    <i className="fas fa-copy" />
                  </button>
                </div>
                <a
                  href={contact.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-btn"
                  title={`Message ${contact.name} on WhatsApp`}
                >
                  <i className="fab fa-whatsapp" />
                </a>
              </div>
            ))}
          </div>
        </div>
        <br />
      </section>
    </div>
  );
};

export default WelcomeSection;
