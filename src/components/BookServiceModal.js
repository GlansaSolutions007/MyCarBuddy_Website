import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useAlert } from "../context/AlertContext";
import CryptoJS from "crypto-js";
import { v4 as uuidv4 } from "uuid";
import { saveUserFromVerifyOtp } from "../helper/authHelper";
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

const BookServiceModal = ({ isOpen, onClose, selectedService, serviceTypeDetail, serviceIdCollect, inspectionOnly }) => {
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

  // validation error messages (inline)
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");

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

  // Pre-fill description based on selected service when modal opens
  useEffect(() => {
    if (isOpen && selectedService?.title) {
      const defaultDesc = `Requesting for ${selectedService.title}`;
      setDescription(defaultDesc);
      setDescriptionError("");
    }
  }, [isOpen, selectedService]);

  // console.log(`email is = ${fullName}`);

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
      // clear any previous validation errors
      setNameError("");
      setPhoneError("");
      setEmailError("");
      setOtpError("");
      setDescriptionError("");
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
        const data = response.data.data || [];

        // ✅ filter active records
        const Amount =
          data.find(
            item => item.Type === 'InspectionAmount' && item.IsActive === true
          )?.Description || '';

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
            totalPrice: package1.inc_gstamt || 399,
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
            totalPrice: package2.inc_gstamt || 699,
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
        price: selectedOfferData.totalPrice,
        gstPrice: selectedOfferData.gstPrice,
        gstPercent: selectedOfferData.gstPercent,
        totalPrice: selectedOfferData.newPrice,
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
      amount: selectedOfferData.totalPrice,
      gstPrice: selectedOfferData.gstPrice,
      gstPercent: selectedOfferData.gstPercent,
      totalPrice: selectedOfferData.totalPrice,
      // description: `Doorstep Car Inspection Offer - ${selectedOfferData.packageName} - ₹${selectedOfferData.newPrice}`,
      // description: `${selectedOfferData.packageName} - ${description || "No description provided"}`,
      description: withInspection
        ? `${selectedOfferData.packageName} - ${description || "No description provided"}`
        : `${selectedService?.title || "Service"} - ${description || "No description provided"}`,
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


      // if (user?.name === "GUEST") {
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
      // }

      const res = await axios.post(`${baseUrl}Leads/MultipleLeads`, leadPayload);

      const orderId = res.data.razorpayOrderID;
      const leadId = res.data.leadId;
      const razorKey = res.data.razorpayKey;
      // const amount = res.data.amount * 100; // Razorpay requires paise
      const amount = Math.round(leadPayload.amount); // Razorpay requires paise

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

    // Update guest user details if needed
    const bytes = CryptoJS.AES.decrypt(user?.id || "", secretKey);
    const decryptedCustId = bytes.toString(CryptoJS.enc.Utf8);

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

  const validateName = (name) => {
    if (!name.trim()) return "Name is required";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    if (!/^[a-zA-Z\s]+$/.test(name.trim()))
      return "Name can only contain letters and spaces";
    return ""; // empty string means valid, like SignIn
  };

  const validatePhone = (phone) => {
    if (!phone.trim()) return "Mobile number is required";
    if (!/^\d+$/.test(phone)) return "Mobile number must contain only digits";
    if (!/^[6-9]/.test(phone)) return "Mobile number must start with 6, 7, 8, or 9";
    if (phone.length !== 10) return "Mobile number must be exactly 10 digits";
    return "";
  };

  const validateEmail = (email) => {
    if (!email.trim()) return ""; // optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim()))
      return "Please enter a valid email address";
    return "";
  };

  const validateOTP = (otp) => {
    if (!otp) return "OTP is required";
    if (!/^\d+$/.test(otp)) return "OTP must contain only digits";
    if (otp.length !== 6) return "OTP must be 6 digits";
    return "";
  };

  const validateDescription = (desc) => {
    if (!desc.trim()) return "Description is required";
    if (desc.trim().length < 10) return "Description must be at least 10 characters";
    return "";
  };

  const handleSendOTP = async () => {

    // reset previous otp error if any
    setOtpError("");
    const nameErr = validateName(fullName);
    const phoneErr = validatePhone(identifier);
    const emailErr = validateEmail(email);
    const descErr = validateDescription(description);

    // set inline errors as well
    setNameError(nameErr);
    setPhoneError(phoneErr);
    setEmailError(emailErr);
    setDescriptionError(descErr);

    if (nameErr || phoneErr || emailErr || descErr) {
      // also notify user via toast for first error
      const first = nameErr || phoneErr || emailErr || descErr;
      showAlert("Error", first, 3000, "error");
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
        email,
        deviceToken: "web-token",
        deviceId,
      });

      saveUserFromVerifyOtp(res.data, { phone: identifier, name: fullName, email });

      window.dispatchEvent(new Event("userProfileUpdated"));

      if (inspection) {
        handlePayment();
      } else {
        await normalSubmit();
      }
    } catch (err) {
      console.error("OTP Verify Error", err);

      const msg = "Invalid OTP";
      setOtpError(msg);
      showAlert("Error", msg, 3000, "error");

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
      // Validate fields before submitting for logged-in users
      const nameErr = validateName(fullName);
      const phoneErr = validatePhone(identifier);
      const emailErr = validateEmail(email);
      const descErr = validateDescription(description);

      setNameError(nameErr);
      setPhoneError(phoneErr);
      setEmailError(emailErr);
      setDescriptionError(descErr);

      if (nameErr || phoneErr || emailErr || descErr) {
        const firstErr = nameErr || phoneErr || emailErr || descErr;
        showAlert("Error", firstErr, 3000, "error");
        return;
      }

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

      {/* <div className="bsm-modal" onClick={(e) => e.stopPropagation()}> */}
      <div className={`bsm-modal ${inspectionOnly ? "is-inspection-only" : ""}`} onClick={(e) => e.stopPropagation()}>

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
                  <span>Transparent Diagnosis</span>
                </div>
                <div className="bsm-left-benefit">
                  <FaCheckCircle />
                  <span>30-45 Mins Quick Inspection</span>
                </div>
                <div className="bsm-left-benefit">
                  <FaCheckCircle />
                  <span>Technician Visits Your Doorstep</span>
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
                <h3 className="bsm-title">Inspection Required?</h3>
                <p className="bsm-subtitle">Mandatory step for accurate service</p>
                <p className="bsm-subtitle">Select your car category to choose the right plan</p>
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
                      <span className="bsm-price-new">₹{offer1.totalPrice}</span>
                    </div>
                    {/* <p className="bsm-offer-text">{offer1.packageName} <FaCar className="bsm-car-icon" /></p> */}
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
                      <span className="bsm-price-new">₹{offer2.totalPrice}</span> 
                    </div>
                    {/* <p className="bsm-offer-text">{offer2.packageName} <FaCar className="bsm-car-icon" /></p> */}
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

              {/* Actions */}
              <div className="bsm-actions">
                <button className="bsm-btn bsm-btn-primary" onClick={handleInspectionYes}>
                  <FaCreditCard />
                  Book Inspection
                  <FaArrowRight className="bsm-btn-arrow" />
                </button>
                {/* <button className="bsm-btn bsm-btn-secondary" onClick={handleInspectionNo}>
                  Submit Enquiry for Service
                </button> */}
              </div>

              {!inspectionOnly && (
              <>
              {/* Separator Line */}
              <div className="bsm-path-separator">
                <span>OR</span>
              </div>

              {/* Bottom Enquiry Section */}
              <div className="bsm-enquiry-section">
                <div className="bsm-enquiry-header">
                  {/* <h4 className="bsm-enquiry-title">Not ready to book yet?</h4> */}
                  <p className="bsm-enquiry-text">Get service details for your requirement</p>
                </div>
                
                <button className="bsm-btn bsm-btn-secondary" onClick={handleInspectionNo}>
                  Enquiry for Service
                  <FaArrowRight className="bsm-btn-arrow" />
                </button>
              </div>
               </>
              )}

              {/* Trust */}
              <div className="bsm-trust">
                <span>✓ 120K+ Customers</span>
                <span>✓ 50+ Verified Mechanics</span>
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
                    ? `Pay ₹${selectedOffer === 1 ? offer1.totalPrice : offer2.totalPrice} & book your slot`
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

              <form className="bsm-form" onSubmit={handleFormSubmit} noValidate>
                {/* Name & Phone Row */}
                <div className="bsm-form-row">
                  <div className="bsm-form-group">
                    <label className="bsm-label">
                      <FaUser style={{ marginRight: 6 }} />
                      Your Name <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="text"
                      className={`bsm-input ${nameError ? 'bsm-input-error' : ''}`}
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
                  <div className="bsm-form-group">
                    <label className="bsm-label">
                      <FaPhone style={{ marginRight: 6, transform: "scaleX(-1)" }} />
                      Phone Number <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="tel"
                      className={`bsm-input ${phoneError ? 'bsm-input-error' : ''}`}
                      placeholder="10-digit mobile"
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
                      disabled={isLoggedIn || otpStep}
                      required
                    />
                    {phoneError && <p className="bsm-helper-text">{phoneError}</p>}
                  </div>
                  <div className="bsm-form-group full-width">
                    <label className="bsm-label">
                      <FaEnvelope style={{ marginRight: 6 }} />
                      Email
                    </label>
                    <input
                      type="email"
                      className={`bsm-input ${emailError ? 'bsm-input-error' : ''}`}
                      placeholder="yourname@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError(validateEmail(e.target.value));
                      }}
                      // disabled={isLoggedIn || otpStep}
                      required
                    />
                    {emailError && <p className="bsm-helper-text">{emailError}</p>}
                  </div>
                </div>

                {/* Message */}
                <div className="bsm-form-group">
                  <label className="bsm-label">
                    <FaComment style={{ marginRight: 6 }} />
                    What are you looking for? <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <textarea
                    className={`bsm-textarea ${descriptionError ? 'bsm-input-error' : ''}`}
                    placeholder="Describe your car issue..."
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setDescriptionError(validateDescription(e.target.value));
                    }}
                    disabled={otpStep}
                    required
                  />
                  {descriptionError && <p className="bsm-helper-text">{descriptionError}</p>}
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
                      className={`bsm-otp-input ${otpError ? 'bsm-input-error' : ''}`}
                      placeholder="• • • • • •"
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setOtp(value);

                        // Show validation only if less than 6 digits
                        if (value.length < 6) {
                          setOtpError("OTP must be 6 digits");
                        } else {
                          setOtpError("");
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
                <div className="bsm-form-actions">
                  <button
                    type="button"
                    className="bsm-btn bsm-btn-secondary"
                    onClick={() => {
                      if (otpStep) {
                        setOtpStep(false);
                        setOtpError("");
                      } else {
                        setCurrentStep("inspection");
                      }
                    }}
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
                          {inspection ? `Pay ₹${selectedOffer === 1 ? offer1.totalPrice : offer2.totalPrice} & Book` : "Submit Enquiry"}
                          <FaArrowRight className="bsm-btn-arrow" />
                        </>
                      ) : otpStep ? (
                        <>
                          {inspection ? `Verify & Pay ₹${selectedOffer === 1 ? offer1.totalPrice : offer2.totalPrice}` : "Verify & Submit"}
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
