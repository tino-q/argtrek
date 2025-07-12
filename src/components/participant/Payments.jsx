import { useEffect } from "react";
import { useTripContext } from "../../hooks/useTripContext";
import PaymentDetailsDisplay from "../display/PaymentDetailsDisplay";
import PaymentSummary from "../common/PaymentSummary";

const Payments = ({ pricing, onNavigate }) => {
  const { userRSVP, formData, isFormSubmitted, submissionResult } =
    useTripContext();

  useEffect(() => {
    if (!userRSVP) {
      onNavigate("login");
    }
  }, [userRSVP, onNavigate]);

  if (!userRSVP) {
    return (
      <div className="payments-container">
        <h2>Payment Information</h2>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  // If form is submitted, show payment details
  if (isFormSubmitted && submissionResult) {
    return (
      <div className="container">
        <PaymentSummary
          formData={formData}
          pricing={pricing}
          submissionResult={submissionResult}
        />

        <PaymentDetailsDisplay
          rsvpData={userRSVP}
          formData={formData}
          pricing={pricing}
          submissionResult={submissionResult}
        />

        <div className="payment-actions">
          <button
            className="btn btn-secondary"
            onClick={() => onNavigate("home")}
          >
            <i className="fas fa-arrow-left"></i>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  throw "unreachable code detected";

  // const email = getEmail(userRSVP);

  // return (
  //   <div className="container">
  //     <div className="payments-container">
  //       <div className="payments-header">
  //         <h1>Payment Information</h1>
  //         <p className="user-email">Account: {email}</p>
  //       </div>

  //       <div className="payment-summary">
  //         <h2>Trip Cost Summary</h2>
  //         <div className="cost-breakdown">
  //           <div className="cost-item">
  //             <span className="label">Base Trip Cost:</span>
  //             <span className="value">${pricing.baseCost}</span>
  //           </div>
  //           <div className="cost-item">
  //             <span className="label">Activities & Add-ons:</span>
  //             <span className="value">${pricing.totalAddons}</span>
  //           </div>
  //           <div className="cost-item total">
  //             <span className="label">Total Cost:</span>
  //             <span className="value">${pricing.totalCost}</span>
  //           </div>
  //         </div>
  //       </div>

  //       <div className="payment-status">
  //         <h2>Payment Status</h2>
  //         <div className="status-card">
  //           <div className="status-icon">
  //             <i className="fas fa-clock"></i>
  //           </div>
  //           <div className="status-content">
  //             <h3>Payment Pending</h3>
  //             <p>
  //               Your payment details will be available after completing your
  //               registration. Please complete your trip registration to view
  //               payment instructions.
  //             </p>
  //           </div>
  //         </div>
  //       </div>

  //       <div className="payment-actions">
  //         <button
  //           className="btn btn-secondary"
  //           onClick={() => onNavigate("home")}
  //         >
  //           <i className="fas fa-arrow-left"></i>
  //           Back to Home
  //         </button>
  //       </div>
  //     </div>
  //   </div>
  // );
};

export default Payments;
