import React from "react";

const PaymentSummary = ({ formData, pricing, submissionResult }) => {
  const payment1Complete = submissionResult?.row?.["PAYMENT_1"] ? true : false;
  const payment2Complete = submissionResult?.row?.["PAYMENT_2"] ? true : false;

  const isFullyPaid =
    formData.paymentSchedule === "full"
      ? payment1Complete
      : payment1Complete && payment2Complete;

  const formatCurrency = (amount, currency = "$") => {
    return `${currency}${Math.round(amount).toLocaleString()}`;
  };

  const getPaymentMethodDisplay = () => {
    switch (formData.paymentMethod) {
      case "credit":
        return "Credit Card";
      case "bank":
        return "Bank Transfer";
      case "crypto":
        return "Cryptocurrency";
      default:
        return "";
    }
  };

  const getScheduleDisplay = () => {
    return formData.paymentSchedule === "full" ? "Full Payment" : "Installments";
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: "10px",
        border: "2px solid var(--border-light)",
        padding: "clamp(16px, 4vw, 24px)",
        boxShadow: "0 2px 8px var(--shadow-dark)",
        marginBottom: "20px",
        transition: "all 0.3s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <h3
          style={{
            color: "var(--text-primary)",
            fontSize: "clamp(1.1rem, 2.5vw, 1.25rem)",
            fontWeight: "600",
            margin: "0",
          }}
        >
          Payment Summary
        </h3>
        <span
          style={{
            padding: "6px 12px",
            borderRadius: "20px",
            fontSize: "0.875rem",
            fontWeight: "500",
            background: isFullyPaid ? "var(--success-bg)" : "var(--warning-bg)",
            color: isFullyPaid ? "var(--success-dark)" : "var(--warning-text)",
            border: `1px solid ${isFullyPaid ? "var(--success-border)" : "var(--warning-border-light)"}`,
          }}
        >
          {isFullyPaid ? "✓ Fully Paid" : "Pending"}
        </span>
      </div>

      {/* Payment Info */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <span
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.875rem",
              fontWeight: "500",
            }}
          >
            Method
          </span>
          <span
            style={{
              color: "var(--text-primary)",
              fontSize: "0.95rem",
              fontWeight: "600",
            }}
          >
            {getPaymentMethodDisplay()}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <span
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.875rem",
              fontWeight: "500",
            }}
          >
            Schedule
          </span>
          <span
            style={{
              color: "var(--text-primary)",
              fontSize: "0.95rem",
              fontWeight: "600",
            }}
          >
            {getScheduleDisplay()}
          </span>
        </div>
      </div>

      {/* Payment Breakdown */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {formData.paymentSchedule === "installments" ? (
          <>
            {/* First Payment */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px",
                background: payment1Complete
                  ? "var(--success-bg)"
                  : "var(--bg-light)",
                border: `1px solid ${
                  payment1Complete ? "var(--success-border)" : "var(--border-light)"
                }`,
                borderRadius: "8px",
                transition: "all 0.3s ease",
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      color: "var(--text-primary)",
                      fontSize: "0.95rem",
                      fontWeight: "600",
                    }}
                  >
                    First Payment (35%)
                  </span>
                  {payment1Complete && (
                    <span
                      style={{
                        color: "var(--success-dark)",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>
                <span
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.875rem",
                  }}
                >
                  {payment1Complete ? "Completed" : "Due upon registration"}
                </span>
              </div>
              <div
                style={{
                  textAlign: "right",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                }}
              >
                {formData.paymentMethod === "credit" ? (
                  <>
                    <span
                      style={{
                        color: "var(--text-primary)",
                        fontSize: "1rem",
                        fontWeight: "700",
                      }}
                    >
                      {formatCurrency(pricing.installmentAmountEUR, "€")}
                    </span>
                    <span
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {formatCurrency(pricing.installmentAmount)}
                    </span>
                  </>
                ) : (
                  <span
                    style={{
                      color: "var(--text-primary)",
                      fontSize: "1rem",
                      fontWeight: "700",
                    }}
                  >
                    {formatCurrency(pricing.installmentAmount)}
                  </span>
                )}
              </div>
            </div>

            {/* Second Payment */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px",
                background: payment2Complete
                  ? "var(--success-bg)"
                  : "var(--bg-light)",
                border: `1px solid ${
                  payment2Complete ? "var(--success-border)" : "var(--border-light)"
                }`,
                borderRadius: "8px",
                transition: "all 0.3s ease",
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      color: "var(--text-primary)",
                      fontSize: "0.95rem",
                      fontWeight: "600",
                    }}
                  >
                    Second Payment (65%)
                  </span>
                  {payment2Complete && (
                    <span
                      style={{
                        color: "var(--success-dark)",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>
                <span
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.875rem",
                  }}
                >
                  {payment2Complete ? "Completed" : "Due closer to trip date"}
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span
                  style={{
                    color: "var(--text-primary)",
                    fontSize: "1rem",
                    fontWeight: "700",
                  }}
                >
                  {formatCurrency(pricing.total - pricing.installmentAmount)}
                </span>
              </div>
            </div>

            {/* Total */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px",
                background: "var(--primary-bg)",
                border: "2px solid var(--primary-border)",
                borderRadius: "8px",
                marginTop: "8px",
              }}
            >
              <span
                style={{
                  color: "var(--text-primary)",
                  fontSize: "1rem",
                  fontWeight: "700",
                }}
              >
                Total Trip Cost
              </span>
              <span
                style={{
                  color: "var(--primary-dark)",
                  fontSize: "1.1rem",
                  fontWeight: "700",
                }}
              >
                {formatCurrency(pricing.total)}
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Full Payment */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px",
                background: payment1Complete
                  ? "var(--success-bg)"
                  : "var(--bg-light)",
                border: `1px solid ${
                  payment1Complete ? "var(--success-border)" : "var(--border-light)"
                }`,
                borderRadius: "8px",
                transition: "all 0.3s ease",
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      color: "var(--text-primary)",
                      fontSize: "0.95rem",
                      fontWeight: "600",
                    }}
                  >
                    Full Payment
                  </span>
                  {payment1Complete && (
                    <span
                      style={{
                        color: "var(--success-dark)",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>
                <span
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.875rem",
                  }}
                >
                  {payment1Complete ? "Completed" : "Due upon registration"}
                </span>
              </div>
              <div
                style={{
                  textAlign: "right",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                }}
              >
                {formData.paymentMethod === "credit" ? (
                  <>
                    <span
                      style={{
                        color: "var(--text-primary)",
                        fontSize: "1rem",
                        fontWeight: "700",
                      }}
                    >
                      {formatCurrency(pricing.installmentAmountEUR, "€")}
                    </span>
                    <span
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {formatCurrency(pricing.total)}
                    </span>
                  </>
                ) : (
                  <span
                    style={{
                      color: "var(--text-primary)",
                      fontSize: "1rem",
                      fontWeight: "700",
                    }}
                  >
                    {formatCurrency(pricing.total)}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Credit Card Info */}
      {formData.paymentMethod === "credit" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 16px",
            background: "var(--warning-bg)",
            border: "1px solid var(--warning-border-light)",
            borderRadius: "8px",
            marginTop: "16px",
          }}
        >
          <i
            className="fas fa-info-circle"
            style={{
              color: "var(--warning-icon)",
              fontSize: "0.875rem",
            }}
          ></i>
          <span
            style={{
              color: "var(--warning-text)",
              fontSize: "0.875rem",
              lineHeight: "1.4",
            }}
          >
            Credit card payments are processed in EUR at current exchange rate
          </span>
        </div>
      )}
    </div>
  );
};

export default PaymentSummary;
