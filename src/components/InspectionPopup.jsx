import React from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { 
  FaTimes, 
  FaCarSide, 
  FaCheckCircle, 
  FaGift, 
  FaArrowRight,
  FaCreditCard
} from "react-icons/fa";
import "./InspectionPopup.css";

const InspectionPopup = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handlePayNow = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    
    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY,
      amount: 39900, // ₹399 in paise
      currency: 'INR',
      name: 'MyCarBuddy',
      description: 'Doorstep Car Inspection',
      image: '/assets/img/logo.png',
      handler: function (response) {
        // Handle success
        Swal.fire({
          title: "Payment Successful!",
          html: `
            <div style="text-align: center; padding: 10px 0;">
              <p style="margin-bottom: 10px; color: #374151;">Your inspection has been booked!</p>
              <p style="color: #6b7280; font-size: 14px;">Our expert technician will contact you shortly to schedule your <strong style="color: #0a6264;">doorstep inspection</strong>.</p>
              <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">Payment ID: ${response.razorpay_payment_id}</p>
            </div>
          `,
          icon: "success",
          confirmButtonColor: "#0a6264",
          confirmButtonText: "Got it!"
        });
        onClose();
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: user?.phone || '',
      },
      theme: {
        color: '#0a6264',
      },
      modal: {
        ondismiss: function() {
          // User closed payment modal
        }
      }
    };
    
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      Swal.fire({
        title: "Payment Failed",
        text: response.error.description || "Something went wrong. Please try again.",
        icon: "error",
        confirmButtonColor: "#0a6264",
      });
    });
    rzp.open();
  };

  const handleContinue = () => {
    onClose();
    navigate("/service");
  };

  if (!isOpen) return null;

  return (
    <div className="ip-overlay" onClick={onClose}>
      <div className="ip-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button className="ip-close-btn" onClick={onClose}>
          <FaTimes />
        </button>

        <div className="ip-content-horizontal">
          {/* Left Panel - Visual */}
          <div className="ip-left-panel">
            <div className="ip-left-header">
              <div className="ip-header-icon">
                <FaCarSide />
              </div>
              <h2 className="ip-left-title">Doorstep Car Inspection</h2>
              <p className="ip-left-subtitle">Expert technicians at your location</p>
            </div>

            <div className="ip-left-benefits">
              <div className="ip-left-benefit">
                <FaCheckCircle />
                <span>50+ Point Health Checkup</span>
              </div>
              <div className="ip-left-benefit">
                <FaCheckCircle />
                <span>Transparent Diagnosis Report</span>
              </div>
              <div className="ip-left-benefit">
                <FaCheckCircle />
                <span>30-45 Mins Quick Inspection</span>
              </div>
              <div className="ip-left-benefit">
                <FaCheckCircle />
                <span>Technician Visits Your Home</span>
              </div>
              <div className="ip-left-benefit">
                <FaCheckCircle />
                <span>Expert Repair Recommendations</span>
              </div>
            </div>
          </div>

          {/* Right Panel - Content */}
          <div className="ip-right-panel">
            <div className="ip-right-header">
              <h3 className="ip-title">Book Your Inspection</h3>
              <p className="ip-subtitle">Pay securely & book instantly</p>
            </div>

            {/* Offer Card */}
            <div className="ip-offer-card">
              <div className="ip-offer-badge">
                <FaGift /> Limited Offer
              </div>
              <div className="ip-offer-content">
                <div className="ip-offer-price">
                  <span className="ip-price-old">₹599</span>
                  <span className="ip-price-new">₹399</span>
                </div>
                <p className="ip-offer-text">Your Doorstep Inspection</p>
              </div>
            </div>

            {/* Service Tags */}
            {/* <div className="ip-services">
              <div className="ip-service-tag">AC Issues</div>
              <div className="ip-service-tag">Engine</div>
              <div className="ip-service-tag">Brakes</div>
              <div className="ip-service-tag">Battery</div>
              <div className="ip-service-tag">Oil Check</div>
            </div> */}

            {/* Action Buttons */}
            <div className="ip-actions">
              <button 
                className="ip-btn ip-btn-primary"
                onClick={handlePayNow}
              >
                <FaCreditCard />
                Pay ₹399 Now
                <FaArrowRight className="ip-btn-arrow" />
              </button>
              
              {/* <button 
                className="ip-btn ip-btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button> */}
            </div>

            {/* Trust Badge */}
            <div className="ip-trust">
              <span>✓ 10,000+ Customers</span>
              <span>✓ Certified Mechanics</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InspectionPopup;

