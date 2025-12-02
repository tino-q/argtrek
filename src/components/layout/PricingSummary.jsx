// Pricing Summary Component
// Pure display component - all calculations handled by usePricing hook

import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";

import { useTripContext } from "../../hooks/useTripContext";
import {
  hasAnsweredTango,
  hasAnsweredBariloche,
  hasAnsweredValleDeUco,
  hasAnsweredAllChoices,
} from "../../utils/choiceAnswers";
import { FORM_FIELDS } from "../../utils/config";
import { reportError } from "../../utils/errorReporting";

const PricingSummary = ({ pricing }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const {
    submissionResult: { userChoices, row },
    formData,
  } = useTripContext();

  const payment1Done =
    row?.["PAYMENT_1"].toString().trim().toLowerCase() === "true";

  // Use shared utility functions for answer checking
  const answeredTango = hasAnsweredTango(userChoices, formData);
  const answeredBariloche = hasAnsweredBariloche(userChoices, formData);
  const answeredValleDeUco = hasAnsweredValleDeUco(userChoices);
  const answeredAll = hasAnsweredAllChoices(userChoices, formData);

  const formatCurrency = (amount, currency = "$", precision = 2) => {
    const isNegative = amount < 0;
    return `${isNegative ? "- " : ""}${currency}${Math.abs(amount).toFixed(precision)}`;
  };

  // const hasAccommodationUpgrade =
  //   formData[FORM_FIELDS.PRIVATE_ROOM_UPGRADE]
  //     .toString()
  //     .trim()
  //     .toLowerCase() === "true";

  // const isInstallmentPlan =
  //   formData[FORM_FIELDS.PAYMENT_SCHEDULE] === "installments";

  // Check if user had selected cooking class (which was later cancelled)
  // const checkedOutCookingClass = formData[FORM_FIELDS.COOKING] === true;

  // const cookingClassRefund = checkedOutCookingClass ? PRICES.cooking : 0;

  // Calculate remaining amount due (with cooking class refund applied if applicable)
  // const remainingDue = Math.max(
  //   0,
  //   pricing.total - pricing.installmentAmount - cookingClassRefund
  // );

  const pricingItemsPreFilter = [
    ["pricing.basePrice", "Base Trip Cost"],
    ["pricing.privateRoomUpgrade", "Private Room Upgrade"],
    // ["pricing.formCooking", "Cooking Class"],
    ["pricing.formTango", "Tango Night in Buenos Aires"],
    ["pricing.tango", "Tango Night in Buenos Aires"],
    ["pricing.circuito", "Circuito Chico in Bariloche"],
    ["pricing.formRafting", "Rafting in Bariloche"],
    ["pricing.rafting", "Rafting in Bariloche"],
    ["pricing.horse", "Horseback Riding in Mendoza"],
    ["pricing.hiking", "Hiking in Mendoza"],
    ["pricing.luggageAEPBRC", "Luggage: Buenos Aires → Bariloche"],
    ["pricing.luggageBRCMDZ", "Luggage: Bariloche → Mendoza"],
    ["pricing.luggageMDZAEP", "Luggage: Mendoza → Buenos Aires"],
    ["pricing.35pctPfee", "1st Payment Processing Fee"],
    ["ajustemanual", "Manual adjustment done by Maddie"],
  ].map(([pkey, name]) => ({
    name,
    p: row[pkey],
    price: Number(row[pkey]),
  }));

  const pricingItems = pricingItemsPreFilter.filter(
    ({ price }) => price > 0 || price < 0
  );
  const isCredit = formData[FORM_FIELDS.PAYMENT_METHOD] === "credit";
  const usdFirstInstallment = Number(
    row["pricing.installmentAmount"]?.toString().trim().replace(",", ".") || 0
  );
  const usdSecondInstallment = Number(
    row["pricing.inst_2"]?.toString().trim().replace(",", ".") || 0
  );
  const usdThirdInstallment = Number(
    row["pricing.inst_3"]?.toString().trim().replace(",", ".") || 0
  );
  const usdFourthInstallment = Number(
    row["pricing.inst_4"]?.toString().trim().replace(",", ".") || 0
  );

  const pricingItemsTotal = pricingItems.reduce(
    (acc, addon) => acc + addon.price,
    0
  );

  const pendingBalance =
    pricingItemsTotal -
    (payment1Done ? usdFirstInstallment : 0) -
    usdSecondInstallment -
    usdThirdInstallment -
    usdFourthInstallment;

  const isFullPayment = row["formData.paymentSchedule"] === "full";

  // Credit payment calculation variables
  const firstPaymentRate = Number(row["pricing.fpRate"]);

  // const rawInstallmentEur = Number(row["pricing.rawInstallmentEur"]);
  // const fppfee = Number(row["pricing.fppfee"]);
  const installmentAmountEur = Number(
    row["pricing.installmentAmountEUR"]
  ).toFixed(0);

  const handleTooltipEnter = useCallback(() => setShowTooltip(true), []);
  const handleTooltipLeave = useCallback(() => setShowTooltip(false), []);

  useEffect(() => {
    if (!(pricingItemsTotal > 0 && pricing?.subtotal > 0)) {
      return;
    }
    if (pricingItemsTotal !== pricing?.subtotal) {
      // Silently report pricing mismatch to backend with user identity and context
      const error = new Error("Pricing items total does not match subtotal");
      const context = {
        component: "PricingSummary",
        pricingItemsTotal,
        pricingSubtotal: pricing?.subtotal,
        difference: Math.abs(pricingItemsTotal - pricing?.subtotal),
        userChoices,
        paymentMethod: formData[FORM_FIELDS.PAYMENT_METHOD],
        isCredit,
        timestamp: new Date().toISOString(),
      };

      // Report silently - user won't notice
      reportError(error, JSON.stringify(context));

      // Still log to console for development debugging
      console.error("Pricing items total does not match subtotal", context);
    }

    if (pendingBalance < 0) {
      const error = new Error("Pending balance is negative");
      const context = {
        component: "PricingSummary",
        pendingBalance,
        userChoices,
        paymentMethod: formData[FORM_FIELDS.PAYMENT_METHOD],
      };
      reportError(error, JSON.stringify(context));
      console.error("Pending balance is negative", context);
    }

    // if (isFullPayment && pendingBalance > 0) {
    //   const error = new Error("Pending balance is positive for full payment");
    //   const context = {
    //     component: "PricingSummary",
    //     pendingBalance,
    //   };
    //   reportError(error, JSON.stringify(context));
    //   console.error("Pending balance is positive for full payment", context);
    // }
  }, [
    pricingItemsTotal,
    pricing?.subtotal,
    userChoices,
    formData,
    isCredit,
    pendingBalance,
    isFullPayment,
  ]);

  if (!answeredAll) {
    return (
      <section className="price-summary">
        <h2>
          Confirm optional addons in the Trip Itinerary page to process any
          pending balance.
        </h2>

        <div style={{ marginBottom: "20px" }}>
          <p>
            <strong>We're missing your answers on:</strong>
          </p>
          <ul style={{ marginLeft: "20px" }}>
            {!answeredTango && (
              <li>
                <strong>💃 Tango (Sunday 23rd)</strong> - Join our
                beginner-friendly tango class and milonga experience, or enjoy
                free time exploring Buenos Aires on your own.
              </li>
            )}
            {!answeredBariloche && (
              <li>
                <strong>🏔️ Bariloche (Wednesday 26th)</strong> - Join the scenic
                Lake District Route or Rafting Adventure, or explore Bariloche
                at your own pace.
              </li>
            )}
            {!answeredValleDeUco && (
              <li>
                <strong>🐴 Mendoza (Friday 28th)</strong> - Either join
                Horseback Riding, a guided hike, or enjoy a relaxed morning on
                your own.
              </li>
            )}
          </ul>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: "15px",
            marginBottom: "25px",
          }}
        >
          <Link to="/itinerary" className="btn btn-primary">
            Go to Trip Itinerary
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="price-summary">
      <h2>
        <i className="fas fa-calculator" /> Trip Cost Breakdown
      </h2>

      <div className="summary-content">
        {pricingItems.length > 0 &&
          pricingItems.map((addon) => (
            <div className="summary-row" key={addon.name}>
              <span>{addon.name}</span>
              <span>{formatCurrency(addon.price)}</span>
            </div>
          ))}

        <div className="summary-row subtotal">
          <span>Total Amount</span>
          <span>{formatCurrency(pricingItemsTotal)}</span>
        </div>

        {/* <div className="summary-row subtotal">
          <span>Total Amount Sheet</span>
          <span>{formatCurrency(pricing.subtotal)}</span>
        </div> */}

        {usdFirstInstallment ? (
          <div className="summary-row subtotal">
            <span>
              {`1st Payment ${payment1Done ? "" : " (Not Completed)"}`}
              {isCredit && (
                <span
                  className="tooltip-container"
                  onMouseEnter={handleTooltipEnter}
                  onMouseLeave={handleTooltipLeave}
                  style={{ position: "relative", marginLeft: "8px" }}
                >
                  <i
                    className="fas fa-question-circle"
                    style={{ cursor: "help", color: "#666" }}
                  />
                  {showTooltip && (
                    <div
                      className="tooltip"
                      style={{
                        position: "absolute",
                        bottom: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: "#333",
                        color: "white",
                        padding: "8px 12px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        whiteSpace: "nowrap",
                        zIndex: 1000,
                        marginBottom: "5px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      }}
                    >
                      <div style={{ textAlign: "left" }}>
                        <div>
                          {formatCurrency(usdFirstInstallment)} *{" "}
                          {firstPaymentRate} ={" "}
                          {formatCurrency(installmentAmountEur, "€")}
                        </div>
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: 0,
                          height: 0,
                          borderLeft: "5px solid transparent",
                          borderRight: "5px solid transparent",
                          borderTop: "5px solid #333",
                        }}
                      />
                    </div>
                  )}
                </span>
              )}
            </span>
            <span>{formatCurrency(usdFirstInstallment)}</span>
          </div>
        ) : (
          <div />
        )}

        {usdSecondInstallment ? (
          <div className="summary-row subtotal">
            <span>2nd Payment</span>
            <span>{formatCurrency(usdSecondInstallment)}</span>
          </div>
        ) : (
          <div />
        )}

        {usdThirdInstallment ? (
          <div className="summary-row subtotal">
            <span>3rd Payment</span>
            <span>{formatCurrency(usdThirdInstallment)}</span>
          </div>
        ) : (
          <div />
        )}

        {usdFourthInstallment ? (
          <div className="summary-row subtotal">
            <span>4th Payment</span>
            <span>{formatCurrency(usdFourthInstallment)}</span>
          </div>
        ) : (
          <div />
        )}

        <div className="summary-row subtotal">
          <span>Pending Balance</span>
          <span>{formatCurrency(pendingBalance)}</span>
        </div>
      </div>
    </section>
  );
};

export default PricingSummary;
