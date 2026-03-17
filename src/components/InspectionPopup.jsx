import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import CryptoJS from "crypto-js";
import { v4 as uuidv4 } from "uuid";
import { useAlert } from "../context/AlertContext";
import { saveUserFromVerifyOtp } from "../helper/authHelper";
import {
  FaTimes,
  FaCarSide,
  FaCheckCircle,
  FaGift,
  FaArrowRight,
  FaCreditCard,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaRedo,
  FaCar,
} from "react-icons/fa";
import "./InspectionPopup.css";

const InspectionPopup = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  // --- STATES ---
  const [currentStep, setCurrentStep] = useState("offer"); // "offer" or "details"
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState(""); // Added Email state
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(60);
  const [otpExpired, setOtpExpired] = useState(false);
  const [loading, setLoading] = useState(false);

  // inline validation errors
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");

  const baseUrl = process.env.REACT_APP_CARBUDDY_BASE_URL;
  const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;
  const user = JSON.parse(localStorage.getItem("user"));
  const isLoggedIn = user && user.token;
  const [companyInfo, setCompanyInfo] = useState({ Amount: '' });
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [offer1, setOffer1] = useState({
    oldPrice: 599,
    newPrice: 399,
    packageId: 174,
    packageName: '5-Seater Car'
  });
  const [offer2, setOffer2] = useState({
    oldPrice: 999,
    newPrice: 699,
    packageId: 175,
    packageName: '7-Seater Car'
  });
  const [selectedOffer, setSelectedOffer] = useState(1); // 1 for offer1, 2 for offer2

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep("offer");
      setFullName(isLoggedIn ? user?.name : "");
      setIdentifier(isLoggedIn ? user?.phone : "");
      setEmail(isLoggedIn ? user?.email : ""); // Pre-fill email
      setOtp("");
      setOtpStep(false);
      setOtpSent(false);
      setTimer(60);
      setOtpExpired(false);
      setSelectedOffer(1); // Reset to first offer
      // clear errors
      setNameError("");
      setPhoneError("");
      setEmailError("");
      setOtpError("");
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

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const response = await axios.get(`${baseUrl}CompanyInfo`);
        const data = response.data.data || [];

        // ✅ keep only active records
        const activeData = data.filter(item => item.IsActive === true);

        const Amount =
          activeData.find(item => item.Type === 'InspectionAmount')?.Description || '';

        setCompanyInfo({ Amount });
      } catch (err) {
        console.error('Failed to fetch company info:', err);
      }
    };

    fetchCompanyInfo();
  }, []);

  useEffect(() => {
    const fetchInspectionPackages = async () => {
      try {
        // Fetch Offer 1 (PackageID=174)
        const response1 = await axios.get(`${baseUrl}PlanPackage/GetPlanPackagesByCategoryAndSubCategory?PackageID=174`);
        if (response1.data && response1.data.length > 0) {
          const package1 = response1.data[0];
          setOffer1({
            oldPrice: package1.Serv_Reg_Price || 599,
            newPrice: package1.Serv_Off_Price || 399,
            gstPrice: package1.gst_amt || 0,
            gstPercent: package1.gst_p || 0,
            totalPrice: Math.round(package1.Serv_Off_Price + package1.gst_amt),
            packageId: 174,
            packageName: package1.PackageName || '5-Seater Car'
          });
        }

        // Fetch Offer 2 (PackageID=175)
        const response2 = await axios.get(`${baseUrl}PlanPackage/GetPlanPackagesByCategoryAndSubCategory?PackageID=175`);
        if (response2.data && response2.data.length > 0) {
          const package2 = response2.data[0];
          setOffer2({
            oldPrice: package2.Serv_Reg_Price || 999,
            newPrice: package2.Serv_Off_Price || 699,
            gstPrice: package2.gst_amt || 0,
            gstPercent: package2.gst_p || 0,
            totalPrice: Math.round(package2.Serv_Off_Price + package2.gst_amt),
            packageId: 175,
            packageName: package2.PackageName || '7-Seater Car'
          });
        }
      } catch (err) {
        console.error('Failed to fetch inspection packages:', err);
      }
    };
    fetchInspectionPackages();
  }, []);

  const validateName = (name) => { if (!name.trim()) return "Name is required"; if (name.trim().length < 2) return "Name must be at least 2 characters"; if (!/^[a-zA-Z\s]+$/.test(name.trim())) return "Name can only contain letters and spaces"; return ""; };

  const validatePhone = (phone) => {
    if (!phone.trim()) return "Mobile number is required";
    if (!/^\d+$/.test(phone)) return "Mobile number must contain only digits";
    if (!/^[6-9]/.test(phone)) return "Mobile number must start with 6, 7, 8, or 9";
    if (phone.length !== 10) return "Mobile number must be exactly 10 digits";
    return "";
  };

  const validateEmail = (email) => {
    if (!email.trim()) return ""; // optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return "Please enter a valid email address";
    return "";
  };

  const validateOTP = (otp) => {
    const cleanOtp = otp.trim();

    if (!cleanOtp) return "OTP is required";
    if (!/^\d{6}$/.test(cleanOtp)) return "OTP must be exactly 6 digits";

    return "";
  };

  // --- PAYMENT LOGIC (Backend Initiated) ---
  const handlePayment = async () => {

    try {
      // Get the selected offer
      const selectedOfferData = selectedOffer === 1 ? offer1 : offer2;
      console.log("selectedOfferData", selectedOfferData);

      // 1️⃣ First create order by calling backend
      const services = [{
        serviceId: selectedOfferData.packageId,
        serviceName: selectedOfferData.packageName,
        serviceType: "Inspection",
        isUserClicked: true,
        price: Math.round(selectedOfferData.newPrice + selectedOfferData.gstPrice),
        gstPrice: selectedOfferData.gstPrice,
        gstPercent: selectedOfferData.gstPercent,
        totalPrice: selectedOfferData.newPrice,
        isInspection: true
      }];

      const leadPayload = {
        fullName,
        phoneNumber: identifier,
        email: email || user?.email || "",
        platform: "Web",
        type: "online",
        amount: Math.round(selectedOfferData.newPrice + selectedOfferData.gstPrice),
        gstPrice: selectedOfferData.gstPrice,
        gstPercent: selectedOfferData.gstPercent,
        totalPrice: Math.round(selectedOfferData.newPrice + selectedOfferData.gstPrice),
        // description: `Doorstep Car Inspection Offer - ${selectedOfferData.packageName} - ₹${selectedOfferData.newPrice}`,
        description: `Rs.${selectedOfferData.newPrice} Rs Offered - Doorstep Car Inspection`,
        services
      };

      // Update guest user details if needed
      const bytes = CryptoJS.AES.decrypt(user?.id || "", secretKey);
      const decryptedCustId = bytes.toString(CryptoJS.enc.Utf8);


      if (user?.name === "GUEST") {
        try {
          const formDataToSend = new FormData();
          formDataToSend.append("custID", decryptedCustId);
          formDataToSend.append("FullName", leadPayload.fullName);
          formDataToSend.append("PhoneNumber", leadPayload.phoneNumber);
          formDataToSend.append("Email", email);
          formDataToSend.append("ProfileImageFile", "");
          formDataToSend.append("IsActive", true);

          await axios.post(`${baseUrl}Customer/update-customer`, formDataToSend, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          // ✅ Update user object in localStorage after success
          const updatedUser = { ...user, email: email };
          localStorage.setItem("user", JSON.stringify(updatedUser));

        } catch (error) {
          console.error("Guest registration error:", error);
        }
      }

      const res = await axios.post(`${baseUrl}Leads/MultipleLeads`, leadPayload);

      const orderId = res.data.razorpayOrderID;
      const leadId = res.data.leadId;
      const razorKey = res.data.razorpayKey;
      // const amount = res.data.amount * 100; // Razorpay requires paise
      const amount = leadPayload.amount; // Razorpay requires paise

      // 2️⃣ Open Razorpay Checkout using backend key & orderID
      const options = {
        key: razorKey,               // Use key from backend
        amount: amount,              // in paise
        currency: "INR",
        name: "My Car Buddy",
        description: "Car Inspection Fee",
        order_id: orderId,           // Razorpay order ID from backend

        handler: function (response) {
          setPaymentProcessing(true);  // <-- show blur + loader instantly

          // Show a modal indicating processing
          // setPaymentStatus("processing");
          // setPaymentMessage("Please wait... your booking is being processed.");
          // setShowPaymentModal(true);

          // Wait for 5 seconds before calling confirm-payment
          setTimeout(async () => {
            try {
              const res = await axios.post(
                `${baseUrl}Leads/confirm-Payment`,
                {
                  LeadId: leadId,
                  amountPaid: amount,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  razorpayOrderId: response.razorpay_order_id,
                },
                {
                  headers: {
                    // Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (res?.data?.success || res?.status === 200) {
                navigate("/payment-successful");
                // setPaymentStatus("success");
                // setPaymentMessage("Payment was successful!");
                // clearCart();
              } else {
                setPaymentProcessing(false);
                Swal.fire({
                  title: "Payment Failed!",
                  html: `
                                <div style="text-align: center; padding: 10px 0;">
                                  <p style="margin-bottom: 10px; color: #374151;">
                                    Payment failed!
                                  </p>
                                  <p style="color: #6b7280; font-size: 14px;">
                                    Please try again.
                                  </p>
                                </div>
                              `,
                  icon: "error",
                  confirmButtonColor: "#0a6264",
                });

                // setPaymentStatus("error");
                // setPaymentMessage("Payment failed! Please try again.");
                // clearCart();
              }
            } catch (error) {
              console.error(error);
              setPaymentProcessing(false);
              Swal.fire({
                title: "Payment Failed!",
                html: `
                                <div style="text-align: center; padding: 10px 0;">
                                  <p style="margin-bottom: 10px; color: #374151;">
                                    Payment failed!
                                  </p>
                                  <p style="color: #6b7280; font-size: 14px;">
                                    Please try again.
                                  </p>
                                </div>
                              `,
                icon: "error",
                confirmButtonColor: "#0a6264",
              });
            }
          }, 2000); // 2 seconds delay

          // Swal.fire({
          //   title: "Payment Successful!",
          //   html: `
          //   <div style="text-align: center; padding: 10px 0;">
          //     <p style="margin-bottom: 10px; color: #374151;">
          //       Your inspection has been booked!
          //     </p>
          //     <p style="color: #6b7280; font-size: 14px;">
          //       Our expert technician will contact you shortly.
          //     </p>
          //     <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
          //       Payment ID: ${response.razorpay_payment_id}
          //     </p>
          //   </div>
          // `,
          //   icon: "success",
          //   confirmButtonColor: "#0a6264",
          // });
          // navigate("/payment-successful");
          // onClose();
        },

        prefill: {
          name: fullName,
          email: email,
          contact: identifier,
        },

        theme: {
          color: "#0a6264",
        },

        modal: {
          ondismiss: () => {
            console.log("User closed Razorpay manually");

            // Reset all loading states
            setPaymentProcessing(false);
            setLoading(false);

            // Return to normal UI
            setCurrentStep("offer");
          }
        }

      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (response) {
        Swal.fire({
          title: "Payment Failed",
          text: response.error.description || "Something went wrong.",
          icon: "error",
          confirmButtonColor: "#0a6264",
        });
      });

      rzp.open();
    } catch (err) {
      console.error("Payment Order Error:", err);
      Swal.fire("Error", "Unable to initiate payment", "error");
    }
  };

  const handlePayNow = () => {
    if (isLoggedIn) {
      // User is logged in, directly initiate backend payment
      handlePayment();
    } else {
      // User not logged in, show details form
      setCurrentStep("details");
    }
  };

  // --- OTP & AUTH LOGIC ---

  const handleSendOTP = async () => {    // reset otp error if user resends
    setOtpError("");
    const nameErr = validateName(fullName);
    const phoneErr = validatePhone(identifier);
    const emailErr = validateEmail(email);

    // set inline states so helpers show
    setNameError(nameErr);
    setPhoneError(phoneErr);
    setEmailError(emailErr);

    if (nameErr || phoneErr || emailErr) {
      // show first error as toast
      const first = nameErr || phoneErr || emailErr;
      showAlert("Error", first, 3000, "error");
      return;
    }

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
      // Send Email in payload if required by your API
      await axios.post(`${baseUrl}Auth/send-otp`, {
        loginId: identifier,
        email: email,
      });
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
    const otpErr = validateOTP(otp);
    setOtpError(otpErr);

    if (otpErr) {
      showAlert("Error", otpErr, 3000, "error");
      return;
    }

    const deviceId = getDeviceId();
    setLoading(true);
    try {
      const res = await axios.post(`${baseUrl}Auth/verify-otp`, {
        loginId: identifier,
        otp,
        fullName,
        email, // Pass email to backend during verification/registration
        deviceToken: "web-token",
        deviceId,
      });

      saveUserFromVerifyOtp(res.data, { phone: identifier, name: fullName, email });

      window.dispatchEvent(new Event("userProfileUpdated"));

      // IMPORTANT 👇  
      // RESET OTP state so UI goes back to normal
      setOtpStep(false);
      setOtp("");
      setOtpSent(false);
      setOtpExpired(false);

      // SHOW normal Pay button ("Pay 399 & Book")
      setCurrentStep("offer");

      // 🚀 Logged in successfully, now trigger the Payment Flow
      handlePayment();
    } catch (err) {
      console.error("OTP Verify Error", err);
      const message = "Invalid OTP";
      showAlert("Error", message, 3000, "error");
      setOtpError(message);
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    otpStep ? handleVerifyOTP() : handleSendOTP();
  };

  if (!isOpen) return null;

  return (
    <div className="ip-overlay" onClick={onClose}>
      {paymentProcessing && (
        <div className="payment-processing-overlay">
          <div className="loader"></div>
          <p className="loading-text">Processing your payment...</p>
        </div>
      )}
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
              <p className="ip-left-subtitle">
                Expert technicians at your location
              </p>
            </div>

            <div className="ip-left-benefits">
              <div className="ip-left-benefit">
                <FaCheckCircle />
                {/* <span>50+ Point Health Checkup</span> */}
                <span>100% Genuine Checkup Review</span>
              </div>
              <div className="ip-left-benefit">
                <FaCheckCircle />
                <span>Transparent Diagnosis</span>
              </div>
              <div className="ip-left-benefit">
                <FaCheckCircle />
                <span>30-45 Mins Quick Inspection</span>
              </div>
              <div className="ip-left-benefit">
                <FaCheckCircle />
                <span>Technician Visits Your Doorstep</span>
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
                  <p className="ip-subtitle">Select your car category to choose the right plan</p>
                </div>

                {/* Offer Cards Row */}
                <div className="ip-offer-row">
                  {/* Offer 1 */}
                  <div
                    className={`ip-offer-card ${selectedOffer === 1 ? 'ip-offer-card-selected' : 'ip-offer-card-unselected'}`}
                    onClick={() => setSelectedOffer(1)}
                  >
                    {selectedOffer === 1 && (
                      <div className="ip-selected-checkmark">
                        <FaCheckCircle />
                      </div>
                    )}
                    <div className="ip-offer-badge">
                      <FaGift /> Limited Offer
                    </div>
                    <div className="ip-offer-content">
                      <div className="ip-offer-price">
                        <span className="ip-price-old">₹{offer1.oldPrice}</span>
                        <span className="ip-price-new"> ₹{Math.round(offer1.totalPrice)}</span>
                      </div>
                      {/* <p className="ip-offer-text">{offer1.packageName} <FaCar className="ip-car-icon" /></p> */}
                      <p className="bsm-offer-text">
                        {offer1.packageName?.split(" - ")[0]}
                        <FaCar className="bsm-car-icon" />


                        {offer1.packageName?.includes(" - ") && (
                          <div className="bsm-marquee">
                            <span className="bsm-marquee-text">
                              {offer1.packageName.split(" - ")[1]}
                            </span>
                          </div>
                        )}

                      </p>
                    </div>
                  </div>

                  {/* Offer 2 */}
                  <div
                    className={`ip-offer-card ${selectedOffer === 2 ? 'ip-offer-card-selected' : 'ip-offer-card-unselected'}`}
                    onClick={() => setSelectedOffer(2)}
                  >
                    {selectedOffer === 2 && (
                      <div className="ip-selected-checkmark">
                        <FaCheckCircle />
                      </div>
                    )}
                    <div className="ip-offer-badge">
                      <FaGift /> Special Offer
                    </div>
                    <div className="ip-offer-content">
                      <div className="ip-offer-price">
                        <span className="ip-price-old">₹{offer2.oldPrice}</span>
                        <span className="ip-price-new"> ₹{Math.round(offer2.totalPrice)}</span>
                      </div>
                      {/* <p className="ip-offer-text">{offer2.packageName} <FaCar className="ip-car-icon" /></p> */}
                      <p className="bsm-offer-text">
                        {offer2.packageName?.split(" - ")[0]}
                        <FaCar className="bsm-car-icon" />

                        {offer2.packageName?.includes(" - ") && (
                          <div className="bsm-marquee">
                            <span className="bsm-marquee-text">
                              {offer2.packageName.split(" - ")[1]}
                            </span>
                          </div>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="ip-actions">
                  <button
                    className="ip-btn ip-btn-primary"
                    onClick={handlePayNow}
                    disabled={loading}
                  >
                    {loading ? (
                      "Processing..."
                    ) : (
                      <>
                        <FaCreditCard /> Pay Now
                        <FaArrowRight className="ip-btn-arrow" />
                      </>
                    )}
                  </button>
                </div>

                {/* Trust Badge */}
                <div className="ip-trust">
                  <span>✓ 120K+ Customers</span>
                  <span>✓ 50+ Certified Mechanics</span>
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

                <form className="ip-form" onSubmit={handleFormSubmit} noValidate>
                  <div className="ip-row">
                    {/* Name Field */}
                    <div className="ip-form-group half">
                      <label className="ip-label">
                        <FaUser style={{ marginRight: 6 }} />
                        Your Name <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input
                        type="text"
                        className={`ip-input ${nameError ? 'bsm-input-error' : ''}`}
                        placeholder="Enter full name"
                        value={fullName}
                        onChange={(e) => {
                          const v = e.target.value
                            ? e.target.value[0].toUpperCase() + e.target.value.slice(1)
                            : "";
                          setFullName(v);
                          setNameError(validateName(v));
                        }}
                        required
                      />
                      {nameError && <p className="bsm-helper-text">{nameError}</p>}
                    </div>

                    {/* Phone Field */}
                    <div className="ip-form-group half">
                      <label className="ip-label">
                        <FaPhone style={{ marginRight: 6, transform: "scaleX(-1)" }} />
                        Phone Number <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input
                        type="tel"
                        className={`ip-input ${phoneError ? 'bsm-input-error' : ''}`}
                        placeholder="10-digit mobile number"
                        value={identifier}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          if (
                            value === "" ||
                            (value.length === 1 && /^[6-9]$/.test(value)) ||
                            (value.length > 1 && value.length <= 10 && /^[6-9]/.test(value[0]))
                          ) {
                            setIdentifier(value);
                            setPhoneError(validatePhone(value));
                          }
                        }}
                        disabled={otpStep}
                        required
                      />
                      {phoneError && <p className="bsm-helper-text">{phoneError}</p>}
                    </div>
                  </div>

                  {/* Email Field (Added) */}
                  <div className="ip-form-group">
                    <label className="ip-label">
                      <FaEnvelope style={{ marginRight: 6 }} />
                      Email
                    </label>
                    <input
                      type="email"
                      className={`ip-input ${emailError ? 'bsm-input-error' : ''}`}
                      placeholder="yourname@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError(validateEmail(e.target.value));
                      }}
                    // disabled={otpStep}
                    />
                    {emailError && <p className="bsm-helper-text">{emailError}</p>}
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
                        className={`ip-otp-input ${otpError ? 'bsm-input-error' : ''}`}
                        placeholder="• • • • • •"
                        value={otp}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setOtp(v);
                          if (v.length === 6) {
                            setOtpError(""); // Clear error when 6 digits are entered
                          }
                          else {
                            setOtpError("OTP must be exactly 6 digits");
                          }
                        }}
                        maxLength={6}
                        required
                        autoFocus
                      />
                      {otpError && <p className="bsm-helper-text">{otpError}</p>}
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="ip-form-actions">
                    <button
                      type="button"
                      className="ip-btn ip-btn-secondary"
                      onClick={() => {
                        if (otpStep) {
                          setOtpStep(false);
                          setOtpError("");
                        } else {
                          setCurrentStep("offer");
                        }
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="ip-btn ip-btn-primary"
                      disabled={loading || (otpStep && (otpExpired || otp.length !== 6))}
                    >
                      <span className={loading ? "ip-text-blur" : ""}>
                        {loading ? (
                          otpStep ? (
                            "Verifying..."
                          ) : (
                            "Sending OTP..."
                          )
                        ) : otpStep ? (
                          <>
                            Verify & Pay ₹{selectedOffer === 1 ? offer1.newPrice : offer2.newPrice}
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
    </div >
  );
};

export default InspectionPopup;