import { useState } from "react";

const EmailLogin = ({ onEmailSubmit }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      return;
    }

    setIsLoading(true);

    // Pass both email and password to the callback
    if (onEmailSubmit) {
      await onEmailSubmit(email.trim(), password.trim());
    }

    setIsLoading(false);
  };

  return (
    <section className="form-section">
      <h2>
        <i className="fas fa-sign-in-alt"></i> Access Your Trip Details
      </h2>

      <div className="login-description">
        <p>
          Enter your email address and password to access your confirmed
          Argentina trip itinerary and pricing information.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="email-login-form">
        <div className="form-group">
          <label htmlFor="loginEmail">
            <i className="fas fa-envelope"></i>
            Email Address *
          </label>
          <input
            type="email"
            id="loginEmail"
            name="loginEmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your registration email"
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="loginPassword">
            <i className="fas fa-lock"></i>
            Password *
          </label>
          <input
            type="password"
            id="loginPassword"
            name="loginPassword"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            disabled={isLoading}
          />
          <small className="password-help">
            Check your email for the password we sent you
          </small>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className={`login-btn ${isLoading ? "loading" : ""}`}
            disabled={isLoading || !email.trim() || !password.trim()}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Retrieving...
              </>
            ) : (
              <>
                <i className="fas fa-search"></i> Retrieve My Trip Details
              </>
            )}
          </button>
        </div>
      </form>

      <div className="login-help">
        <p>
          <strong>Need help?</strong> Contact{" "}
          <a
            href="https://wa.me/34689200162"
            target="_blank"
            rel="noopener noreferrer"
          >
            Madi on WhatsApp <i className="fab fa-whatsapp"></i>
          </a>{" "}
          if you can't find your email or password.
        </p>
      </div>
    </section>
  );
};

export default EmailLogin;
