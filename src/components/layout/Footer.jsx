import { CONTACTS } from "../../utils/config";

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-help">
        <p>
          Need help? Reach out to{" "}
          <a
            href={
              CONTACTS.find((contact) => contact.name.includes("Maddie"))
                ?.whatsapp
            }
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-link"
          >
            Maddie anytime on WhatsApp <i className="fab fa-whatsapp"></i>
          </a>
        </p>
      </div>
      <p>
        <span className="footer-emoji">✨</span>
        vibe coded with{" "}
        <a
          href="https://cursor.sh"
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-link"
        >
          cursor
        </a>{" "}
        by{" "}
        <a
          href="https://www.linkedin.com/in/martin-queija-5271b899"
          target="_blank"
          rel="noopener noreferrer"
          className="author-name"
        >
          tinoq
        </a>
        <span className="footer-emoji">🇦🇷</span>
      </p>
    </footer>
  );
};

export default Footer;
