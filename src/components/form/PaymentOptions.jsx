import React from "react";
import { FORM_FIELDS } from "../../utils/config";
import "../../styles/PaymentOptions.css";

const BANK_DETAILS = [
  { label: "Bank Name", value: "Revolut" },
  { label: "Account Holder", value: "SONSOLES RKT SL" },
  { label: "IBAN", value: "ES51 1583 0001 1093 9530 1696" },
  { label: "BIC/SWIFT", value: "CHASGB2L" },
  { label: "Currency", value: "USD" },
  {
    label: "Holder address",
    value: "CALLE BERNARDO LOPEZ GARCIA, 18 - BJ, 03013, ALICANTE",
  },
  { label: "Country", value: "Spain" },
];

const NETWORK_INFO = {
  ETH: {
    name: "Ethereum",
    symbol: "ETH",
    color: "#627EEA",
    icon: "fab fa-ethereum",
  },
  ARB: {
    name: "Arbitrum",
    symbol: "ARB",
    color: "#28A0F0",
    icon: "fas fa-layer-group",
  },
  SOL: {
    name: "Solana",
    symbol: "SOL",
    color: "#9945FF",
    icon: "fas fa-sun",
  },
};

const CURRENCY_INFO = {
  USDT: {
    name: "Tether USD",
    symbol: "₮",
    color: "#26A17B",
    icon: "fas fa-dollar-sign",
  },
  USDC: {
    name: "USD Coin",
    symbol: "USDC",
    color: "#2775CA",
    icon: "fas fa-coins",
  },
};

const PaymentOptions = ({ formData, updateFormData }) => {
  const isCrypto = formData[FORM_FIELDS.PAYMENT_METHOD] === "crypto";

  // Set default payment schedule to "full" (Single Payment) if not set
  React.useEffect(() => {
    if (!formData[FORM_FIELDS.PAYMENT_SCHEDULE]) {
      updateFormData(FORM_FIELDS.PAYMENT_SCHEDULE, "full");
    }
  }, [formData, updateFormData]);

  // Set default payment method to "credit" (Credit Card) if not set
  React.useEffect(() => {
    if (!formData[FORM_FIELDS.PAYMENT_METHOD]) {
      updateFormData(FORM_FIELDS.PAYMENT_METHOD, "credit");
    }
  }, [formData, updateFormData]);

  // Set default Argentine citizenship to false if not already set
  React.useEffect(() => {
    if (
      formData[FORM_FIELDS.ARGENTINE_CITIZEN] === undefined ||
      formData[FORM_FIELDS.ARGENTINE_CITIZEN] === null
    ) {
      updateFormData(FORM_FIELDS.ARGENTINE_CITIZEN, false);
    }
  }, [formData, updateFormData]);

  // Set default crypto currency to USDT when crypto is selected
  React.useEffect(() => {
    if (isCrypto && !formData[FORM_FIELDS.CRYPTO_CURRENCY]) {
      updateFormData(FORM_FIELDS.CRYPTO_CURRENCY, "USDT");
    }
  }, [isCrypto, formData, updateFormData]);

  // Set default crypto network to ETH when crypto is selected
  React.useEffect(() => {
    if (isCrypto && !formData[FORM_FIELDS.CRYPTO_NETWORK]) {
      updateFormData(FORM_FIELDS.CRYPTO_NETWORK, "ETH");
    }
  }, [isCrypto, formData, updateFormData]);

  return (
    <section className="form-section">
      <h2>
        <i className="fas fa-credit-card"></i> Payment Configuration
      </h2>

      {/* Payment Warning */}
      <div className="payment-warning">
        <i className="fas fa-exclamation-triangle"></i>
        <div>
          <h3>Important</h3>
          <ul>
            <li>
              All rates are <strong>non-refundable</strong> - no exceptions
            </li>
            <li>
              <strong>Group Size Impact:</strong> Our rates are based on
              confirmed group size. Unregistering from the trip impacts pricing
              for all remaining participants
            </li>
            <li>
              <strong>Transferable Spots:</strong> While refunds are not
              possible, your spot is fully transferable to another person if
              your plans change
            </li>
            <li>
              <strong>Commitment Required:</strong> Please only register if
              you're committed to the full trip experience
            </li>
          </ul>
        </div>
      </div>

      {/* Payment Schedule */}
      <div className="form-group">
        <label className="section-label">Payment Schedule *</label>
        <div className="radio-group">
          <div className="radio-option">
            <input
              type="radio"
              id="fullPayment"
              name="paymentSchedule"
              value="full"
              checked={formData[FORM_FIELDS.PAYMENT_SCHEDULE] === "full"}
              onChange={(e) =>
                updateFormData(FORM_FIELDS.PAYMENT_SCHEDULE, e.target.value)
              }
              required
            />
            <label htmlFor="fullPayment">
              <div className="option-content">
                <h3>Single Payment</h3>
                <p className="description">Pay 100% now</p>
              </div>
            </label>
          </div>

          <div className="radio-option">
            <input
              type="radio"
              id="installments"
              name="paymentSchedule"
              value="installments"
              checked={
                formData[FORM_FIELDS.PAYMENT_SCHEDULE] === "installments"
              }
              onChange={(e) =>
                updateFormData(FORM_FIELDS.PAYMENT_SCHEDULE, e.target.value)
              }
              required
            />
            <label htmlFor="installments">
              <div className="option-content">
                <h3>2 Installments</h3>
                <p className="description">
                  35% now, remainder due September 15th
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="form-group">
        <label className="section-label">Payment Method *</label>
        <div className="radio-group payment-methods-column">
          <div className="radio-option">
            <input
              type="radio"
              id="creditCard"
              name="paymentMethod"
              value="credit"
              checked={formData[FORM_FIELDS.PAYMENT_METHOD] === "credit"}
              onChange={(e) =>
                updateFormData(FORM_FIELDS.PAYMENT_METHOD, e.target.value)
              }
              required
            />
            <label htmlFor="creditCard">
              <div className="option-content">
                <h3>Credit Card</h3>
                <p className="price">+4% processing fee</p>
                <p className="description">
                  Pay through a secure link sent to your email
                </p>
                <p className="description">Supports Apple & Google Pay</p>
              </div>
            </label>
          </div>

          <div className="radio-option">
            <input
              type="radio"
              id="bankTransfer"
              name="paymentMethod"
              value="bank"
              checked={formData[FORM_FIELDS.PAYMENT_METHOD] === "bank"}
              onChange={(e) =>
                updateFormData(FORM_FIELDS.PAYMENT_METHOD, e.target.value)
              }
              required
            />
            <label htmlFor="bankTransfer">
              <div className="option-content">
                <h3>Bank Transfer (USD)</h3>
                <p className="price" style={{ whiteSpace: "nowrap" }}>
                  0% via Revolut,
                  <a
                    href="https://revolut.com/referral/?referral-code=mbaklayan!JUN2-25-VR-ES-AE&geo-redirect"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "var(--primary)",
                      textDecoration: "underline",
                      marginLeft: "4px",
                    }}
                  >
                    sign up!
                  </a>
                </p>
                <p className="description">
                  Free via Revolut. Other banks: select "sender pays all fees"
                  and add any additional fees to ensure we receive the full
                  amount
                </p>
              </div>
            </label>
          </div>

          <div className="radio-option">
            <input
              type="radio"
              id="crypto"
              name="paymentMethod"
              value="crypto"
              checked={formData[FORM_FIELDS.PAYMENT_METHOD] === "crypto"}
              onChange={(e) =>
                updateFormData(FORM_FIELDS.PAYMENT_METHOD, e.target.value)
              }
              required
            />
            <label htmlFor="crypto">
              <div className="option-content">
                <h3>Crypto</h3>
                <p className="price">0%</p>
                <p className="description">
                  USDT or USDC on ETH, ARB, or SOLANA blockchains
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Crypto Options (Conditional) */}
      {isCrypto && (
        <div className="form-group">
          <div className="crypto-options">
            {/* Currency Selection */}
            <div className="form-group">
              <div className="radio-group crypto-currency-grid">
                {Object.entries(CURRENCY_INFO).map(([currency, info]) => (
                  <div key={currency} className="radio-option">
                    <input
                      type="radio"
                      id={`crypto-${currency}`}
                      name="cryptoCurrency"
                      value={currency}
                      checked={
                        formData[FORM_FIELDS.CRYPTO_CURRENCY] === currency
                      }
                      onChange={(e) =>
                        updateFormData(
                          FORM_FIELDS.CRYPTO_CURRENCY,
                          e.target.value
                        )
                      }
                      required
                    />
                    <label htmlFor={`crypto-${currency}`}>
                      <div className="option-content">
                        <div
                          className="option-icon"
                          style={{ color: info.color }}
                        >
                          <i className={info.icon}></i>
                        </div>
                        <h3>{currency}</h3>
                        <p className="description">{info.name}</p>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Network Selection */}
            <div className="form-group">
              <div className="radio-group crypto-network-grid">
                {Object.entries(NETWORK_INFO).map(([network, info]) => (
                  <div key={network} className="radio-option">
                    <input
                      type="radio"
                      id={`network-${network}`}
                      name="cryptoNetwork"
                      value={network}
                      checked={formData[FORM_FIELDS.CRYPTO_NETWORK] === network}
                      onChange={(e) =>
                        updateFormData(
                          FORM_FIELDS.CRYPTO_NETWORK,
                          e.target.value
                        )
                      }
                      required
                    />
                    <label htmlFor={`network-${network}`}>
                      <div className="option-content">
                        <div
                          className="option-icon"
                          style={{ color: info.color }}
                        >
                          <i className={info.icon}></i>
                        </div>
                        <h3>{info.name}</h3>
                        <p className="description">{info.symbol}</p>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PaymentOptions;
