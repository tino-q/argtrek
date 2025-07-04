import { CONTACTS } from "../../utils/config";

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-section">
        <p className="footer-line">
          Need help? Don't hesitate to reach out to{" "}
          <a
            href={
              CONTACTS.find((contact) => contact.name.includes("Maddie"))
                ?.whatsapp
            }
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link whatsapp-link"
          >
            Maddie on WhatsApp <i className="fab fa-whatsapp"></i>
          </a>
        </p>
      </div>
      <div className="footer-section">
        <p className="footer-line">
          <span className="footer-emoji">✨</span>
          <a
            href="https://github.com/tino-q/argtrek"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            vibe coded
          </a>{" "}
          with{" "}
          <a
            href="https://cursor.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            cursor
          </a>{" "}
          by{" "}
          <a
            href="https://www.linkedin.com/in/martin-queija-5271b899"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            tinoq
          </a>
          <span className="footer-emoji">🇦🇷</span>
        </p>
      </div>
      <div className="footer-section">
        <p className="footer-line">
          <span className="footer-emoji">⚛️</span>
          <a
            href="https://react.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            React
          </a>{" "}
          +{" "}
          <a
            href="https://vitejs.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Vite
          </a>{" "}
          on{" "}
          <a
            href="https://pages.github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            GitHub Pages
          </a>{" "}
          •{" "}
          <a
            href="https://developers.google.com/apps-script"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            <span className="footer-emoji">📊</span>
            Apps Script Web App
          </a>{" "}
          +{" "}
          <a
            href="https://sheets.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            🗄️ Google Sheets
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
