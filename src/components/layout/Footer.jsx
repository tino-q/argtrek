import { useCallback } from "react";

import useAuth from "../../hooks/useAuth";
import { useTripContext } from "../../hooks/useTripContext";
import { clearAllCache, updateCompletedChoicesSheet } from "../../utils/api";
import { CONTACTS } from "../../utils/config";

const Footer = () => {
  const { email, password } = useAuth();
  const { submissionResult } = useTripContext();
  const onClearCache = useCallback(() => {
    clearAllCache(email, password);
  }, [email, password]);

  const onUpdateChoices = useCallback(async () => {
    try {
      await updateCompletedChoicesSheet(email, password);
      alert("Completed choices sheet updated successfully!");
    } catch (error) {
      alert(`Error updating choices sheet: ${error.message}`);
    }
  }, [email, password]);
  return (
    <div className="container">
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

          {email === "tinqueija@gmail.com" && submissionResult && (
            <>
              <div className="footer-item">
                <p>
                  <button onClick={onClearCache}>Clear Cache</button>
                </p>
              </div>
              <div className="footer-item">
                <p>
                  <button onClick={onUpdateChoices}>Update Choices</button>
                </p>
              </div>
            </>
          )}

          {/* Credits Section */}
          <div className="footer-item">
            <p>
              🔮{" "}
              <a
                href="https://github.com/tino-q/argtrip"
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
    </div>
  );
};

export default Footer;
