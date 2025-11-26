import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useAlert } from "../context/AlertContext"; // Adjust path to your context
import CryptoJS from "crypto-js";
import { v4 as uuidv4 } from "uuid";

const BookServiceModal = ({ isOpen, onClose, selectedService }) => {
  // --- STATES MOVED FROM PARENT ---
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

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setOtpStep(false);
      setTimer(60);
      setOtp("");
      setIdentifier("");
      setFullName("");
      setDescription("");
      setOtpSent(false);
    }
  }, [isOpen]);

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
          token: res.data?.token,
          profileImage: res?.data?.profileImage,
        })
      );

      const leadPayload = {
        custID: res.data?.custID,
        fullName: fullName,
        phoneNumber: identifier,
        email: "",
        platform: "web",
        description: `${selectedService?.title || "General Enquiry"} - ${description}`,
      };

      await axios.put(`${baseUrl}Leads/UpdateCustomerAndLead`, leadPayload);

      window.dispatchEvent(new Event("userProfileUpdated"));
      onClose(); // Close the modal via prop

      Swal.fire({
        title: "Thank You!",
        text: "Thank you! Your Enquiry has been submitted. Our support team will reach out to you soon.",
        icon: "success",
        confirmButtonColor: "#0a6264",
      });
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
      {/* ... Insert your CSS Styles here (keyframes, input styles) ... */}
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

        <form onSubmit={(e) => { e.preventDefault(); otpStep ? handleVerifyOTP() : handleSendOTP(); }}>
          <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "11px", fontWeight: 700 }}>Name</label>
              <input type="text" className="modern-input" required value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={otpStep} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e5e7eb" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "11px", fontWeight: 700 }}>Phone</label>
              <input type="tel" className="modern-input" required value={identifier} onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, ""))} disabled={otpStep} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e5e7eb" }} />
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700 }}>Message</label>
            <textarea className="modern-input" value={description} onChange={(e) => setDescription(e.target.value)} disabled={otpStep} style={{ width: "100%", padding: "6px", minHeight: "28px", borderRadius: "6px", border: "1px solid #e5e7eb" }} />
          </div>

          {/* OTP Section */}
          <div style={{ maxHeight: otpStep ? "120px" : "0px", opacity: otpStep ? 1 : 0, overflow: "hidden", transition: "all 0.3s ease-in-out", marginBottom: otpStep ? "15px" : "0" }}>
            <div style={{ background: "rgba(10, 98, 100, 0.04)", padding: "12px", borderRadius: "10px", border: "1px dashed #0a6264", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#0a6264" }}>Enter OTP Code</span>
                <span style={{ fontSize: "11px", color: "#6b7280" }}>{timer > 0 ? `00:${timer}` : <span onClick={handleSendOTP} style={{ cursor: "pointer" }}>Resend</span>}</span>
              </div>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} placeholder="• • • • • •" required={otpStep} className="modern-input" style={{ width: "100%", padding: "8px", fontSize: "16px", textAlign: "center", letterSpacing: "5px", fontWeight: "bold", borderRadius: "6px", border: "1px solid #d1d5db", color: "#0a6264", background: "#fff" }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "5px" }}>
            <button type="button" onClick={() => otpStep ? setOtpStep(false) : onClose()} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #e5e7eb", background: "#fff" }}>{otpStep ? "Back" : "Cancel"}</button>
            <button type="submit" disabled={loading} style={{ padding: "10px", borderRadius: "8px", border: "none", background: loading ? "#6b7280" : "#0a6264", color: "#fff" }}>{loading ? "Processing..." : (otpStep ? "Submit Enquiry" : "Verify Number")}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookServiceModal;