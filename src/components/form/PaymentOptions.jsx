import React, { useCallback } from "react";

import { FORM_FIELDS } from "../../utils/config";
import "../../styles/PaymentOptions.css";
import { getUSDToEURExchangeRate } from "../../utils/rsvpData";
import CreditCardWarning from "../common/CreditCardWarning";

const isCreditCurrentlySupported = false;
const isInstallmentsCurrentlySupported = false;


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

const PaymentOptions = ({ formData, updateFormData, rsvpData }) => {
  const isCrypto = formData[FORM_FIELDS.PAYMENT_METHOD] === "crypto";

  // Handler functions
  const handlePaymentScheduleChange = useCallback(
    (e) => {
      updateFormData(FORM_FIELDS.PAYMENT_SCHEDULE, e.target.value);
    },
    [updateFormData]
  );

  const handlePaymentMethodChange = useCallback(
    (e) => {
      updateFormData(FORM_FIELDS.PAYMENT_METHOD, e.target.value);
    },
    [updateFormData]
  );

  // Style objects - move outside component to prevent recreation
  const priceStyle = { whiteSpace: "nowrap" };
  const linkStyle = {
    color: "var(--primary)",
    textDecoration: "underline",
    marginLeft: "4px",
  };

  const handleCryptoCurrencyChange = useCallback(
    (e) => {
      updateFormData(FORM_FIELDS.CRYPTO_CURRENCY, e.target.value);
    },
    [updateFormData]
  );

  const handleCryptoNetworkChange = useCallback(
    (e) => {
      updateFormData(FORM_FIELDS.CRYPTO_NETWORK, e.target.value);
    },
    [updateFormData]
  );

  const getCryptoIconStyle = useCallback((color) => ({ color }), []);

  // Set default payment schedule to "full" (Single Payment) if not set
  React.useEffect(() => {
    if (!formData[FORM_FIELDS.PAYMENT_SCHEDULE]) {
      updateFormData(FORM_FIELDS.PAYMENT_SCHEDULE, "full");
    }
    // Reset to supported option if current selection is not supported
    else if (formData[FORM_FIELDS.PAYMENT_SCHEDULE] === "installments" && !isInstallmentsCurrentlySupported) {
      updateFormData(FORM_FIELDS.PAYMENT_SCHEDULE, "full");
    }
  }, [formData, updateFormData]);

  // Set default payment method to "credit" (Credit Card) if not set and supported, otherwise "bank"
  React.useEffect(() => {
    if (!formData[FORM_FIELDS.PAYMENT_METHOD]) {
      updateFormData(FORM_FIELDS.PAYMENT_METHOD, isCreditCurrentlySupported ? "credit" : "bank");
    }
    // Reset to supported option if current selection is not supported
    else if (formData[FORM_FIELDS.PAYMENT_METHOD] === "credit" && !isCreditCurrentlySupported) {
      updateFormData(FORM_FIELDS.PAYMENT_METHOD, "bank");
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
        <i className="fas fa-credit-card" /> Payment Configuration
      </h2>

      {/* Payment Warning */}
      <div className="payment-warning">
        <i className="fas fa-exclamation-triangle" />
        <div>
          <h3>Important</h3>
          <ul>
            <li>
              <strong>Transferable Spots:</strong> While refunds are not
              possible, your spot is fully transferable (until Sept. 15th) to
              another person if your plans change
            </li>
            <li>
              <strong>Commitment Required:</strong> Our rates are based on
              confirmed group size. Unregistering from the trip impacts pricing
              for all remaining participants
            </li>
            <li>
              A 21% VAT will be added to accommodation expenses only for
              Argentinean guests.
            </li>
          </ul>
        </div>
      </div>

      {/* Payment Schedule */}
      {isInstallmentsCurrentlySupported && (
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
                onChange={handlePaymentScheduleChange}
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
                onChange={handlePaymentScheduleChange}
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
      )}

      {/* Payment Method */}
      <div className="form-group">
        <label className="section-label">Payment Method *</label>
        <div className="radio-group payment-methods-column">
          <div className="radio-option">
            <input
              type="radio"
              id="bankTransfer"
              name="paymentMethod"
              value="bank"
              checked={formData[FORM_FIELDS.PAYMENT_METHOD] === "bank"}
              onChange={handlePaymentMethodChange}
              required
            />
            <label htmlFor="bankTransfer">
              <div className="option-content">
                <h3>Bank Transfer</h3>
                <p className="price" style={priceStyle}>
                  0% via Revolut,
                  <a
                    href="https://revolut.com/referral/?referral-code=mbaklayan!JUN2-25-VR-ES-AE&geo-redirect"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={linkStyle}
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

          {isCreditCurrentlySupported && (
            <div className="radio-option">
              <input
                type="radio"
                id="creditCard"
                name="paymentMethod"
                value="credit"
                checked={formData[FORM_FIELDS.PAYMENT_METHOD] === "credit"}
                onChange={handlePaymentMethodChange}
                required
              />
              <label htmlFor="creditCard">
                <div className="option-content">
                  <h3>Credit Card</h3>
                  <p className="price">+2.85% processing fee</p>
                  <p className="description">
                    Pay through a secure link sent to your email
                  </p>
                  <p className="description">Supports Apple & Google Pay</p>
                </div>
              </label>
            </div>
          )}

          <div className="radio-option">
            <input
              type="radio"
              id="crypto"
              name="paymentMethod"
              value="crypto"
              checked={formData[FORM_FIELDS.PAYMENT_METHOD] === "crypto"}
              onChange={handlePaymentMethodChange}
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

      {/* Payment Warning (Credit Card Only) */}
      {isCreditCurrentlySupported && formData[FORM_FIELDS.PAYMENT_METHOD] === "credit" && (
        <CreditCardWarning
          paymentSchedule={formData[FORM_FIELDS.PAYMENT_SCHEDULE]}
          exchangeRate={getUSDToEURExchangeRate(rsvpData)}
        />
      )}

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
                      onChange={handleCryptoCurrencyChange}
                      required
                    />
                    <label htmlFor={`crypto-${currency}`}>
                      <div className="option-content">
                        <div
                          className="option-icon"
                          style={getCryptoIconStyle(info.color)}
                        >
                          <i className={info.icon} />
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
                      onChange={handleCryptoNetworkChange}
                      required
                    />
                    <label htmlFor={`network-${network}`}>
                      <div className="option-content">
                        <div
                          className="option-icon"
                          style={getCryptoIconStyle(info.color)}
                        >
                          <i className={info.icon} />
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
