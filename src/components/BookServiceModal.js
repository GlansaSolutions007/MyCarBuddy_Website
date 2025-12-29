import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useAlert } from "../context/AlertContext";
import CryptoJS from "crypto-js";
import { v4 as uuidv4 } from "uuid";
import {
  FaTimes,
  FaTools,
  FaCheckCircle,
  FaClipboardCheck,
  FaArrowRight,
  FaCreditCard,
  FaUser,
  FaPhone,
  FaComment,
  FaShieldAlt,
  FaRedo,
  FaEnvelope,
  FaGift,
  FaCar
} from "react-icons/fa";
import "./BookServiceModal.css";
import { platform } from "process";
import { useNavigate } from "react-router-dom";

const BookServiceModal = ({ isOpen, onClose, selectedService, serviceTypeDetail, serviceIdCollect }) => {
  // --- STATES ---
  const [currentStep, setCurrentStep] = useState("inspection"); // "inspection" or "booking"
  const [inspection, setInspection] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [timer, setTimer] = useState(60);
  const [otp, setOtp] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpExpired, setOtpExpired] = useState(false);

  const baseUrl = process.env.REACT_APP_CARBUDDY_BASE_URL;
  const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;
  const { showAlert } = useAlert();
  const user = JSON.parse(localStorage.getItem("user"));
  const isLoggedIn = user && user.token;
  const [companyInfo, setCompanyInfo] = useState({ Amount: '' });
  const navigate = useNavigate();
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

  useEffect(() => {
    if (isLoggedIn) {
      setFullName(user?.name || "");
      setIdentifier(user?.phone || "");
      setEmail(user?.email || "");
    }
  }, [isLoggedIn]);

  console.log(`email is = ${fullName}`);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep("inspection");
      setInspection(false);
      setOtpStep(false);
      setTimer(60);
      setOtp("");
      setIdentifier(isLoggedIn ? user?.phone : "");
      setFullName(isLoggedIn ? user?.name : "");
      setDescription("");
      setOtpSent(false);
      setEmail(isLoggedIn ? user?.email : "");
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

  const handleInspectionYes = () => {
    setInspection(true);
    setCurrentStep("booking");
  };

  const handleInspectionNo = () => {
    setInspection(false);
    setCurrentStep("booking");
  };

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const response = await axios.get(`${baseUrl}CompanyInfo`);
        const data = response.data.data;
        const Amount = data.find(item => item.Type === 'InspectionAmount')?.Description || '';
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

  // Common function to build lead payload
  const buildLeadPayload = (withInspection) => {
    const services = [];
    // Get the selected inspection offer
    const selectedOfferData = selectedOffer === 1 ? offer1 : offer2;

    if (withInspection) {
      // Add inspection service first (the selected package)
      services.push({
        serviceId: selectedOfferData.packageId, // Inspection package ID (174 or 175)
        serviceName: selectedOfferData.packageName,
        serviceType: "Inspection",
        isUserClicked: true,
        price: selectedOfferData.newPrice,
        isInspection: true
      });

      // Add the selected service
      services.push({
        serviceId: serviceIdCollect || 0,
        serviceName: selectedService?.title || "N/A",
        serviceType: serviceTypeDetail || "N/A",
        price: 0, // Selected service price (to be determined after inspection)
        isInspection: true
      });
    } else {
      // Without inspection - only send the selected service
      services.push({
        serviceId: serviceIdCollect || 0,
        serviceName: selectedService?.title || "N/A",
        serviceType: serviceTypeDetail || "N/A",
        price: 0,
        isInspection: false
      });
    }

    return {
      fullName,
      phoneNumber: identifier,
      email: email || user?.email || "",
      description: description || "No description provided",
      platform: "Web",
      type: withInspection ? "online" : "cos",
      amount: withInspection ? selectedOfferData.newPrice : 0,
      services
    };
  };

  const handlePayment = async () => {
    try {
      // 1️⃣ First create order by calling backend
      const leadPayload = buildLeadPayload(true); // true = with inspection

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

  const normalSubmit = async () => {
    const leadPayload = buildLeadPayload(false); // false = without inspection

    await axios.post(`${baseUrl}Leads/MultipleLeads`, leadPayload);
    window.dispatchEvent(new Event("userProfileUpdated"));

    Swal.fire({
      title: "Thank You!",
      html: `
        <div style="text-align: center; padding: 10px 0;">
          <p style="margin-bottom: 10px; color: #374151;">Your enquiry has been submitted!</p>
          <p style="color: #6b7280; font-size: 14px;">Our support team will reach out to you soon.</p>
        </div>
      `,
      icon: "success",
      confirmButtonColor: "#0a6264",
    });

    onClose();
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
      await axios.post(`${baseUrl}Auth/send-otp`, { loginId: identifier, email });
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
        fullName,
        email,
        deviceToken: "web-token",
        deviceId,
      });

      localStorage.setItem(
        "user",
        JSON.stringify({
          id: CryptoJS.AES.encrypt(res.data?.custID.toString(), secretKey).toString(),
          name: res.data?.name || fullName,
          phone: identifier,
          email: res.data?.email || email,
          token: res.data?.token,
          profileImage: res?.data?.profileImage,
        })
      );

      window.dispatchEvent(new Event("userProfileUpdated"));

      if (inspection) {
        handlePayment();
      } else {
        await normalSubmit();
      }
    } catch (err) {
      console.error("OTP Verify Error", err);
      if (err.response?.config?.url?.includes("verify-otp")) {
        showAlert("Error", "Invalid OTP", 3000, "error");
      } else {
        showAlert("Error", "OTP verified but failed to save enquiry details.", 3000, "warning");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoggedInSubmit = async () => {
    setLoading(true);
    try {
      if (inspection) {
        handlePayment();
      } else {
        await normalSubmit();
      }
    } catch (err) {
      console.error("Logged-in enquiry submit error:", err);
      showAlert("Error", "Failed to submit enquiry", 3000, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (isLoggedIn) {
      handleLoggedInSubmit();
    } else {
      otpStep ? handleVerifyOTP() : handleSendOTP();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bsm-overlay" onClick={onClose}>
      {paymentProcessing && (
        <div className="payment-processing-overlay">
          <div className="loader"></div>
          <p className="loading-text">Processing your payment...</p>
        </div>
      )}

      <div className="bsm-modal" onClick={(e) => e.stopPropagation()}>

        {/* Close Button */}
        <button className="bsm-close-btn" onClick={onClose}>
          <FaTimes />
        </button>

        {/* STEP 1: Inspection Choice */}
        {currentStep === "inspection" && (
          <div className="bsm-content">
            {/* Left Panel */}
            <div className="bsm-left-panel">
              <div className="bsm-left-header">
                <div className="bsm-header-icon">
                  <FaClipboardCheck />
                </div>
                <h2 className="bsm-left-title">Why Inspection?</h2>
                <p className="bsm-left-subtitle">Before we proceed with the service</p>
              </div>

              <div className="bsm-left-benefits">
                <div className="bsm-left-benefit">
                  <FaCheckCircle />
                  {/* <span>50+ Point Health Checkup</span> */}
                  <span>100% Genuine Checkup Review</span>
                </div>
                <div className="bsm-left-benefit">
                  <FaCheckCircle />
                  <span>Transparent Diagnosis Report</span>
                </div>
                <div className="bsm-left-benefit">
                  <FaCheckCircle />
                  <span>30-45 Mins Quick Inspection</span>
                </div>
                <div className="bsm-left-benefit">
                  <FaCheckCircle />
                  <span>Technician Visits Your Home</span>
                </div>
                <div className="bsm-left-benefit">
                  <FaCheckCircle />
                  <span>Expert Repair Recommendations</span>
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="bsm-right-panel">
              <div className="bsm-right-header">
                <h3 className="bsm-title">Inspection Required</h3>
                <p className="bsm-subtitle">Mandatory step for accurate service</p>
                <p className="bsm-subtitle">Select your car based on the number of seats</p>
              </div>

              {/* Offer Cards Row */}
              <div className="bsm-offer-row">
                {/* Offer 1 - 5 Seater */}
                <div
                  className={`bsm-offer-card ${selectedOffer === 1 ? 'bsm-offer-card-selected' : 'bsm-offer-card-unselected'}`}
                  onClick={() => setSelectedOffer(1)}
                >
                  {selectedOffer === 1 && (
                    <div className="bsm-selected-checkmark">
                      <FaCheckCircle />
                    </div>
                  )}
                  <div className="bsm-offer-badge">
                    <FaGift /> Limited Offer
                  </div>
                  <div className="bsm-offer-content">
                    <div className="bsm-offer-price">
                      <span className="bsm-price-old">₹{offer1.oldPrice}</span>
                      <span className="bsm-price-new">₹{offer1.newPrice}</span>
                    </div>
                    <p className="bsm-offer-text">{offer1.packageName} <FaCar className="bsm-car-icon" /></p>
                  </div>
                </div>

                {/* Offer 2 - 7 Seater */}
                <div
                  className={`bsm-offer-card ${selectedOffer === 2 ? 'bsm-offer-card-selected' : 'bsm-offer-card-unselected'}`}
                  onClick={() => setSelectedOffer(2)}
                >
                  {selectedOffer === 2 && (
                    <div className="bsm-selected-checkmark">
                      <FaCheckCircle />
                    </div>
                  )}
                  <div className="bsm-offer-badge">
                    <FaGift /> Special Offer
                  </div>
                  <div className="bsm-offer-content">
                    <div className="bsm-offer-price">
                      <span className="bsm-price-old">₹{offer2.oldPrice}</span>
                      <span className="bsm-price-new">₹{offer2.newPrice}</span>
                    </div>
                    <p className="bsm-offer-text">{offer2.packageName} <FaCar className="bsm-car-icon" /></p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bsm-actions">
                <button className="bsm-btn bsm-btn-primary" onClick={handleInspectionYes}>
                  <FaCreditCard />
                  Continue with Inspection
                  <FaArrowRight className="bsm-btn-arrow" />
                </button>
                <button className="bsm-btn bsm-btn-secondary" onClick={handleInspectionNo}>
                  Skip & Submit Enquiry
                </button>
              </div>

              {/* Trust */}
              <div className="bsm-trust">
                <span>✓ 1,000+ Customers</span>
                <span>✓ Certified Mechanics</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Booking Form */}
        {currentStep === "booking" && (
          <div className="bsm-content">
            {/* Left Panel */}
            <div className="bsm-left-panel">
              <div className="bsm-left-header">
                <div className="bsm-header-icon">
                  <FaTools />
                </div>
                <h2 className="bsm-left-title">
                  {inspection ? "Book Inspection" : "Quick Enquiry"}
                </h2>
                <p className="bsm-left-subtitle">
                  {inspection
                    ? `Pay ₹${selectedOffer === 1 ? offer1.newPrice : offer2.newPrice} & book your slot`
                    : "We'll get back to you soon"}
                </p>
              </div>

              <div className="bsm-left-benefits">
                <div className="bsm-left-benefit">
                  <FaCheckCircle />
                  <span>100% Secure Payment</span>
                </div>
                <div className="bsm-left-benefit">
                  <FaCheckCircle />
                  <span>Expert Technicians</span>
                </div>
                <div className="bsm-left-benefit">
                  <FaCheckCircle />
                  <span>Doorstep Service</span>
                </div>
                <div className="bsm-left-benefit">
                  <FaCheckCircle />
                  <span>Transparent Pricing</span>
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="bsm-right-panel">
              <div className="bsm-right-header">
                <h3 className="bsm-title">
                  {otpStep ? "Verify OTP" : "Your Details"}
                </h3>
                <p className="bsm-subtitle">
                  {otpStep
                    ? `Enter OTP sent to +91 ${identifier}`
                    : "Fill in your information"}
                </p>
                {selectedService?.title && (
                  <span className="bsm-service-badge">
                    {selectedService.title}
                  </span>
                )}
              </div>

              <form className="bsm-form" onSubmit={handleFormSubmit}>
                {/* Name & Phone Row */}
                <div className="bsm-form-row">
                  <div className="bsm-form-group">
                    <label className="bsm-label">
                      <FaUser style={{ marginRight: 6 }} />
                      Your Name
                    </label>
                    <input
                      type="text"
                      className="bsm-input"
                      placeholder="Enter full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      // disabled={isLoggedIn || otpStep}
                      required
                    />
                  </div>
                  <div className="bsm-form-group">
                    <label className="bsm-label">
                      <FaPhone style={{ marginRight: 6, transform: "scaleX(-1)" }} />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="bsm-input"
                      placeholder="10-digit mobile"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      disabled={isLoggedIn || otpStep}
                      required
                    />
                  </div>
                  <div className="bsm-form-group full-width">
                    <label className="bsm-label">
                      <FaEnvelope style={{ marginRight: 6 }} />
                      Email
                    </label>
                    <input
                      type="email"
                      className="bsm-input"
                      placeholder="yourname@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      // disabled={isLoggedIn || otpStep}
                      required
                    />
                  </div>
                </div>

                {/* Message */}
                <div className="bsm-form-group">
                  <label className="bsm-label">
                    <FaComment style={{ marginRight: 6 }} />
                    What are you looking for? (Optional)
                  </label>
                  <textarea
                    className="bsm-textarea"
                    placeholder="Describe your car issue..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={otpStep}
                  />
                </div>

                {/* OTP Section */}
                {!isLoggedIn && otpStep && (
                  <div className="bsm-otp-section">
                    <div className="bsm-otp-header">
                      <span className="bsm-otp-label">Enter OTP Code</span>
                      {timer > 0 ? (
                        <span className="bsm-otp-timer">
                          Expires in <strong>{timer}s</strong>
                        </span>
                      ) : (
                        <span className="bsm-otp-expired">
                          Expired -
                          <button
                            type="button"
                            className="bsm-otp-resend"
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
                      className="bsm-otp-input"
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
                <div className="bsm-form-actions">
                  <button
                    type="button"
                    className="bsm-btn bsm-btn-secondary"
                    onClick={() => otpStep ? setOtpStep(false) : setCurrentStep("inspection")}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="bsm-btn bsm-btn-primary"
                    disabled={loading || (otpStep && otpExpired)}
                  >
                    <span className={loading ? "bsm-text-blur" : ""}>
                      {loading ? (
                        isLoggedIn
                          ? (inspection ? "Processing..." : "Submitting...")
                          : (otpStep ? "Verifying..." : "Sending OTP...")
                      ) : isLoggedIn ? (
                        <>
                          {inspection ? `Pay ₹${selectedOffer === 1 ? offer1.newPrice : offer2.newPrice} & Book` : "Submit Enquiry"}
                          <FaArrowRight className="bsm-btn-arrow" />
                        </>
                      ) : otpStep ? (
                        <>
                          {inspection ? `Verify & Pay ₹${selectedOffer === 1 ? offer1.newPrice : offer2.newPrice}` : "Verify & Submit"}
                          <FaArrowRight className="bsm-btn-arrow" />
                        </>
                      ) : (
                        <>
                          Get OTP
                          <FaArrowRight className="bsm-btn-arrow" />
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </form>

              {/* Trust */}
              <div className="bsm-trust">
                <span>✓ Secure & Private</span>
                <span>✓ No Spam Calls</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BookServiceModal;
