import { useState, useEffect } from "react";

const NewEmailStep = ({ onNavigate, onNewEmailRequest }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get email from URL params if available (passed from login)
  const urlParams = new URLSearchParams(window.location.search);
  const emailFromUrl = urlParams.get("email");

  // Set initial email if available
  useEffect(() => {
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
  }, [emailFromUrl]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !name.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onNewEmailRequest(email, name);
      // Navigate back to login after successful submission
      setTimeout(() => {
        onNavigate("login");
      }, 2000);
    } catch (error) {
      console.error("Error submitting new email request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="trip-form">
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

          <form
            onSubmit={handleSubmit}
            className="new-email-form"
            style={{ marginTop: "20px" }}
          >
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
                disabled={!!emailFromUrl}
                autoFocus={!emailFromUrl}
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
                autoFocus={!!emailFromUrl}
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

            {/* Form buttons */}
            <div className="navigation-container">
              <div className="form-actions" style={{ marginTop: "20px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onNavigate("login")}
                  disabled={isSubmitting}
                >
                  <i className="fas fa-arrow-left"></i> Back to Login
                </button>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSubmitting || !email.trim() || !name.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Submitting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i> Request Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          <div className="login-help">
            <p>
              <strong>Need help?</strong> Contact{" "}
              <a
                href="https://wa.me/5491169729783"
                target="_blank"
                rel="noopener noreferrer"
              >
                Maddie on WhatsApp <i className="fab fa-whatsapp"></i>
              </a>{" "}
              if you have any questions.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default NewEmailStep;
