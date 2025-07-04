import { useState, useEffect } from "react";

const NewEmailStep = ({ updateFormData }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Get email from URL params if available (passed from login)
  const urlParams = new URLSearchParams(window.location.search);
  const emailFromUrl = urlParams.get("email");

  // Set initial email if available
  useEffect(() => {
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
  }, [emailFromUrl]);

  // Update form data when name changes so StepNavigation can access it
  useEffect(() => {
    if (updateFormData) {
      updateFormData("newEmailName", name);
    }
  }, [name]);

  return (
    <section className="form-section">
      <h2>
        <i className="fas fa-envelope-open"></i>
        Email Not Registered
      </h2>

      <div className="new-email-description">
        <div className="email-not-found-notice">
          <p>
            The email <strong>{email || "you entered"}</strong> is not
            registered in our system.
          </p>
          <p>Would you like us to create an account for you?</p>
        </div>
      </div>

      <div style={{ marginTop: "20px" }} className="new-email-form">
        <div className="form-group">
          <label htmlFor="requestEmail">
            <i className="fas fa-envelope"></i>
            {` `}Email Address *
          </label>
          <input
            type="email"
            id="requestEmail"
            name="requestEmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            disabled
          />
        </div>

        <div className="form-group">
          <label htmlFor="requestName">
            <i className="fas fa-user"></i>
            {` `}Your Name (for reference) *
          </label>
          <input
            type="text"
            id="requestName"
            name="requestName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            required
            autoFocus
          />
        </div>

        <div className="processing-info">
          <div className="info-content">
            <div className="info-text">
              <h4>
                <i className="fas fa-info-circle"></i> What happens next:
              </h4>
              <ul style={{ marginLeft: "30px", marginTop: "10px" }}>
                <li>We'll send you an email with your password</li>
                <li>This requires manual processing by our team</li>
                <li>We'll try to process your request ASAP</li>
                <li>You'll be notified by email when ready</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="login-help">
        <p>
          <strong>Need help?</strong> Contact{" "}
          <a
            href="https://wa.me/34689200162"
            target="_blank"
            rel="noopener noreferrer"
          >
            Maddie on WhatsApp <i className="fab fa-whatsapp"></i>
          </a>{" "}
          if you have any questions.
        </p>
      </div>
    </section>
  );
};

export default NewEmailStep;
