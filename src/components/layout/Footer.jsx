import { CONTACTS } from "../../utils/config";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Contact Section */}
        <div className="footer-item">
          <p>
            Need help? Reach out to{" "}
            <a
              href={
                CONTACTS.find((contact) => contact.name.includes("Maddie"))
                  ?.whatsapp
              }
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link whatsapp-link"
            >
              Maddie on WhatsApp
            </a>
          </p>
        </div>

        {/* Credits Section */}
        <div className="footer-item">
          <p>
            🔮{" "}
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
            </a>{" "}
            ⚡
          </p>
        </div>

        {/* Tech Stack Section */}
        <div className="footer-item">
          <p>
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
            •{" "}
            <a
              href="https://developers.google.com/apps-script"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Apps Script
            </a>{" "}
            +{" "}
            <a
              href="https://sheets.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Google Sheets
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
