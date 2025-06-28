import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { usePricing } from "../../hooks/usePricing";
import { useTripContext } from "../../hooks/useTripContext";
import PaymentDetailsDisplay from "../display/PaymentDetailsDisplay";

const Payments = () => {
  const navigate = useNavigate();
  const { userRSVP, formData, submissionResult } = useTripContext();
  const pricing = usePricing(userRSVP, formData);

  const handleBackToHome = useCallback(() => navigate("/home"), [navigate]);

  useEffect(() => {
    if (!userRSVP) {
      navigate("/login");
    }
  }, [userRSVP, navigate]);

  if (!userRSVP) {
    return (
      <div className="payments-container">
        <h2>Payment Information</h2>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  // If form is submitted, show payment details
  if (submissionResult) {
    return (
      <div className="container">
        <PaymentDetailsDisplay
          rsvpData={userRSVP}
          formData={formData}
          pricing={pricing}
          submissionResult={submissionResult}
        />

        <div className="payment-actions">
          <button className="btn btn-secondary" onClick={handleBackToHome}>
            <i className="fas fa-arrow-left" />
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
  //           onClick={() => navigate("/home")}
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
