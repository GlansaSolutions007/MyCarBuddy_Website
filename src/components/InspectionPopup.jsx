import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import CryptoJS from "crypto-js";
import { v4 as uuidv4 } from "uuid";
import { useAlert } from "../context/AlertContext";
import { 
  FaTimes, 
  FaCarSide, 
  FaCheckCircle, 
  FaGift, 
  FaArrowRight,
  FaCreditCard,
  FaUser,
  FaPhone,
  FaRedo
} from "react-icons/fa";
import "./InspectionPopup.css";

const InspectionPopup = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  
  // States
  const [currentStep, setCurrentStep] = useState("offer"); // "offer" or "details"
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(60);
  const [otpExpired, setOtpExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const baseUrl = process.env.REACT_APP_CARBUDDY_BASE_URL;
  const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;
  const user = JSON.parse(localStorage.getItem("user"));
  const isLoggedIn = user && user.token;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep("offer");
      setFullName(isLoggedIn ? user?.name : "");
      setIdentifier(isLoggedIn ? user?.phone : "");
      setOtp("");
      setOtpStep(false);
      setOtpSent(false);
      setTimer(60);
      setOtpExpired(false);
    }
  }, [isOpen, isLoggedIn]);

  // Timer Logic
  useEffect(() => {
    let interval;
    if (otpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && otpSent) {
      setOtpExpired(true);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  const getDeviceId = () => {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem("deviceId", deviceId);
    }
    return deviceId;
  };

  const openRazorpay = (userName, userPhone) => {
    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY,
      amount: 39900, // ₹399 in paise
      currency: 'INR',
      name: 'MyCarBuddy',
      description: 'Doorstep Car Inspection',
      image: '/assets/img/logo.png',
      handler: function (response) {
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
        name: userName || '',
        email: '',
        contact: userPhone || '',
      },
      theme: {
        color: '#0a6264',
      },
      modal: {
        ondismiss: function() {
          // User closed payment modal without completing payment
          onClose();
          navigate("/");
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
      onClose();
      navigate("/");
    });
    rzp.open();
  };

  const handlePayNow = () => {
    if (isLoggedIn) {
      // User is logged in, directly open Razorpay
      openRazorpay(user?.name, user?.phone);
    } else {
      // User not logged in, show details form
      setCurrentStep("details");
    }
  };

  const handleSendOTP = async () => {
    if (!identifier) {
      showAlert("Error", "Please enter a valid phone number", 3000, "error");
      return;
    }
    if (!fullName) {
      showAlert("Error", "Please enter your name", 3000, "error");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${baseUrl}Auth/send-otp`, { loginId: identifier });
      setOtpSent(true);
      setOtpExpired(false);
      setOtpStep(true);
      setTimer(60);
    } catch (err) {
      console.error("Send OTP Error", err);
      showAlert("Error", "Failed to send OTP", 3000, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const deviceId = getDeviceId();
    setLoading(true);
    try {
      const res = await axios.post(`${baseUrl}Auth/verify-otp`, {
        loginId: identifier,
        otp,
        deviceToken: "web-token",
        deviceId,
      });

      // Store user data
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: CryptoJS.AES.encrypt(res.data?.custID.toString(), secretKey).toString(),
          name: res.data?.name || fullName,
          phone: identifier,
          token: res.data?.token,
          profileImage: res?.data?.profileImage,
        })
      );

      window.dispatchEvent(new Event("userProfileUpdated"));

      // Open Razorpay after successful verification
      openRazorpay(fullName, identifier);
    } catch (err) {
      console.error("OTP Verify Error", err);
      showAlert("Error", "Invalid OTP", 3000, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    otpStep ? handleVerifyOTP() : handleSendOTP();
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
            
            {/* STEP 1: Offer Screen */}
            {currentStep === "offer" && (
              <>
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

                {/* Action Buttons */}
                <div className="ip-actions">
                  <button 
                    className="ip-btn ip-btn-primary"
                    onClick={handlePayNow}
                  >
                    <FaCreditCard />
                    Pay Now
                    <FaArrowRight className="ip-btn-arrow" />
                  </button>
                </div>

                {/* Trust Badge */}
                <div className="ip-trust">
                  <span>✓ 1,000+ Customers</span>
                  <span>✓ Certified Mechanics</span>
                </div>
              </>
            )}

            {/* STEP 2: User Details Form (for non-logged in users) */}
            {currentStep === "details" && (
              <>
                <div className="ip-right-header">
                  <h3 className="ip-title">
                    {otpStep ? "Verify OTP" : "Your Details"}
                  </h3>
                  <p className="ip-subtitle">
                    {otpStep 
                      ? `Enter OTP sent to +91 ${identifier}` 
                      : "Fill in your information"}
                  </p>
                </div>

                <form className="ip-form" onSubmit={handleFormSubmit}>
                  {/* Name Field */}
                  <div className="ip-form-group">
                    <label className="ip-label">
                      <FaUser style={{ marginRight: 6 }} />
                      Your Name
                    </label>
                    <input
                      type="text"
                      className="ip-input"
                      placeholder="Enter full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={otpStep}
                      required
                    />
                  </div>

                  {/* Phone Field */}
                  <div className="ip-form-group">
                    <label className="ip-label">
                      <FaPhone style={{ marginRight: 6 }} />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="ip-input"
                      placeholder="10-digit mobile number"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      disabled={otpStep}
                      required
                    />
                  </div>

                  {/* OTP Section */}
                  {otpStep && (
                    <div className="ip-otp-section">
                      <div className="ip-otp-header">
                        <span className="ip-otp-label">Enter OTP Code</span>
                        {timer > 0 ? (
                          <span className="ip-otp-timer">
                            Expires in <strong>{timer}s</strong>
                          </span>
                        ) : (
                          <span className="ip-otp-expired">
                            Expired - 
                            <button 
                              type="button" 
                              className="ip-otp-resend"
                              onClick={handleSendOTP}
                            >
                              <FaRedo style={{ marginRight: 4 }} />
                              Resend
                            </button>
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        className="ip-otp-input"
                        placeholder="• • • • • •"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        maxLength={6}
                        required
                        autoFocus
                      />
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="ip-form-actions">
                    <button
                      type="button"
                      className="ip-btn ip-btn-secondary"
                      onClick={() => otpStep ? setOtpStep(false) : setCurrentStep("offer")}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="ip-btn ip-btn-primary"
                      disabled={loading || (otpStep && otpExpired)}
                    >
                      <span className={loading ? "ip-text-blur" : ""}>
                        {loading ? (
                          otpStep ? "Verifying..." : "Sending OTP..."
                        ) : otpStep ? (
                          <>
                            Verify & Pay ₹399
                            <FaArrowRight className="ip-btn-arrow" />
                          </>
                        ) : (
                          <>
                            Get OTP
                            <FaArrowRight className="ip-btn-arrow" />
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </form>

                {/* Trust Badge */}
                <div className="ip-trust">
                  <span>✓ Secure & Private</span>
                  <span>✓ No Spam Calls</span>
                </div>
              </>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default InspectionPopup;

