import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useAlert } from "../context/AlertContext"; // Adjust path to your context
import CryptoJS from "crypto-js";
import { v4 as uuidv4 } from "uuid";

const BookServiceModal = ({ isOpen, onClose, selectedService }) => {
  // --- STATES ---
  const [currentStep, setCurrentStep] = useState("inspection"); // "inspection" or "booking"
  const [inspection, setInspection] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [timer, setTimer] = useState(60);
  const [otp, setOtp] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [fullName, setFullName] = useState("");
  const [description, setDescription] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpExpired, setOtpExpired] = useState(false);

  const baseUrl = process.env.REACT_APP_CARBUDDY_BASE_URL;
  const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;
  const { showAlert } = useAlert();
  const user = JSON.parse(localStorage.getItem("user"));
  const isLoggedIn = user && user.token;

  useEffect(() => {
    if (isLoggedIn) {
      setFullName(user?.name || "");
      setIdentifier(user?.phone || "");
    }
  }, [isLoggedIn]);

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

  const handlePayment = () => {
    // Placeholder for Razorpay integration
    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY, // Replace with your Razorpay test key
      amount: 49900, // ₹499 in paise
      currency: 'INR',
      name: 'CarBuddy Inspection',
      description: 'Inspection Fee',
      handler: function (response) {
        // Handle success
        Swal.fire({
          title: "Payment Successful!",
          text: "Your inspection payment has been processed.",
          icon: "success",
          confirmButtonColor: "#0a6264",
        });
      },
      prefill: {
        name: fullName,
        email: '', // Add email if available
        contact: identifier,
      },
      theme: {
        color: '#0a6264',
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const normalSubmit = async () => {
    const leadPayload = {
      fullName,
      phoneNumber: identifier,
      email: "",
      description: `${selectedService?.title || "General Enquiry"} - ${description}`
    };

    await axios.post(`${baseUrl}Leads/MultipleLeads`, leadPayload);

    window.dispatchEvent(new Event("userProfileUpdated"));

    Swal.fire({
      title: "Thank You!",
      text: "Thank you! Your enquiry has been submitted. Our support team will reach out to you soon.",
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

      localStorage.setItem(
        "user",
        JSON.stringify({
          id: CryptoJS.AES.encrypt(res.data?.custID.toString(), secretKey).toString(),
          name: res.data?.name || "GUEST",
          phone: identifier,
          token: res.data?.token,
          profileImage: res?.data?.profileImage,
        })
      );

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
      const decryptedCustId = CryptoJS.AES.decrypt(
        user.id,
        secretKey
      ).toString(CryptoJS.enc.Utf8);

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

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: "15px",
        animation: "fadeIn 0.3s ease-in-out",
      }}
    >
      <style>
        {`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .modern-input:focus { border-color: #0a6264 !important; box-shadow: 0 0 0 3px rgba(10, 98, 100, 0.1) !important; outline: none; }
        .modern-input:disabled { background-color: #f9fafb; color: #9ca3af; cursor: not-allowed; border-color: #e5e7eb; }
        `}
      </style>

      <div
        style={{
          background: "#ffffff",
          padding: "25px",
          width: "100%",
          maxWidth: "450px",
          borderRadius: "20px",
          boxShadow: "0px 10px 40px rgba(0,0,0,0.2)",
          animation: "slideUp 0.3s ease-out",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {currentStep === "inspection" && (
          <div style={{ position: "relative", paddingTop: "20px" }}>

            {/* ❌ CLOSE BUTTON (TOP RIGHT) */}
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                background: "transparent",
                border: "none",
                fontSize: "30px",
                color: "#374151",
                cursor: "pointer",
              }}
            >
              ×
            </button>

            {/* TITLE */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <h5 style={{ color: "#0a6264", fontWeight: 800, fontSize: "22px" }}>
                Inspection Required Before Service
              </h5>
            </div>

            {/* LARGE INFO BLOCK */}
            <div
              style={{
                background: "#f0fdfa",
                border: "1px solid #99f6e4",
                padding: "18px",
                borderRadius: "12px",
                marginBottom: "25px",
                textAlign: "left",
                color: "#0a6264",
                fontSize: "15px",
                lineHeight: "1.5",
              }}
            >
              <strong>Why Inspection?</strong>
              <ul style={{ marginTop: "10px", paddingLeft: "18px" }}>
                <li>Ensures accurate diagnosis of your car’s issue</li>
                <li>Helps avoid unnecessary repairs or wrong part replacement</li>
                <li>Technician visits your location for inspection</li>
                <li>Helps us give correct estimate before actual service</li>
              </ul>
              <p style={{ marginTop: "12px", fontSize: "15px", lineHeight: "1.6", color: "#444" }}>
                <strong>Inspection Fee: ₹299</strong> — Mandatory Step to Ensure Accurate Repair & Avoid Extra Charges.
              </p>
            </div>

            {/* BUTTONS */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                onClick={handleInspectionYes}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#0a6264",
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                Continue with Inspection (Recommended)
              </button>

              <button
                onClick={handleInspectionNo}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "2px solid #d1d5db",
                  background: "#fff",
                  color: "#374151",
                  fontSize: "15px",
                  fontWeight: "bold",
                }}
              >
                Skip & Continue
              </button>
            </div>
          </div>
        )}

        {currentStep === "booking" && (
          <>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <h5 style={{ color: "#0a6264", fontWeight: 800, fontSize: "20px" }}>
                {otpStep ? "Verify Identity" : "Quick Enquiry"}
              </h5>
              <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
                {selectedService?.title ? (
                  <span>Service: <strong style={{ color: "#0a6264" }}>{selectedService.title}</strong></span>
                ) : (
                  "Please fill in your details"
                )}
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (isLoggedIn) {
                handleLoggedInSubmit();
              } else {
                otpStep ? handleVerifyOTP() : handleSendOTP();
              }
            }}>
              <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700 }}>Name</label>
                  <input
                    type="text"
                    className="modern-input"
                    required
                    value={fullName}
                    readOnly={isLoggedIn}
                    disabled={otpStep}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                    }}
                  />
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700 }}>Phone</label>
                  <input
                    type="tel"
                    className="modern-input"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, ""))}
                    readOnly={isLoggedIn}
                    disabled={otpStep}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700 }}>Message</label>
                <textarea
                  className="modern-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={otpStep}
                  style={{
                    width: "100%",
                    padding: "6px",
                    minHeight: "28px",
                    borderRadius: "6px",
                    border: "1px solid #e5e7eb"
                  }}
                />
              </div>

              {!isLoggedIn && (
                <div style={{
                  maxHeight: otpStep ? "120px" : "0px",
                  opacity: otpStep ? 1 : 0,
                  overflow: "hidden",
                  transition: "all 0.3s ease-in-out",
                  marginBottom: otpStep ? "15px" : "0"
                }}>
                  <div style={{
                    background: "rgba(10, 98, 100, 0.04)",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px dashed #0a6264",
                    textAlign: "center"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#0a6264" }}>Enter OTP Code</span>
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>
                        {timer > 0 ? `00:${timer}` : <span onClick={handleSendOTP} style={{ cursor: "pointer" }}>Resend</span>}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      placeholder="• • • • • •"
                      required={otpStep}
                      className="modern-input"
                      style={{
                        width: "100%",
                        padding: "8px",
                        fontSize: "16px",
                        textAlign: "center",
                        letterSpacing: "5px",
                        fontWeight: "bold",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db",
                        color: "#0a6264",
                        background: "#fff"
                      }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "5px" }}>
                <button
                  type="button"
                  onClick={() => otpStep ? setOtpStep(false) : setCurrentStep("inspection")}
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    background: "#fff"
                  }}
                >
                  {otpStep ? "Back" : "Back"}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "none",
                    background: loading ? "#6b7280" : "#0a6264",
                    color: "#fff"
                  }}
                >
                  {loading
                    ? "Processing..."
                    : isLoggedIn
                      ? "Submit Enquiry"
                      : otpStep
                        ? "Submit Enquiry"
                        : "Verify Number"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default BookServiceModal;
