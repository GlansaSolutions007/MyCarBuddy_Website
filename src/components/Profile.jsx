import React, { useEffect, useState } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";
import { useAlert } from "../context/AlertContext";
import { useNavigate } from "react-router-dom";
import "./MainProfile.css";

const ImageURL = process.env.REACT_APP_CARBUDDY_IMAGE_URL;
const API_BASE = process.env.REACT_APP_CARBUDDY_BASE_URL;

const Profile = () => {
  const [user, setUser] = useState({
    FullName: "",
    PhoneNumber: "",
    Email: "",
    AlternateNumber: "",
    ProfileImage: "",
  });
  const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingBank, setEditingBank] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [bankAccordionOpen, setBankAccordionOpen] = useState(false);
  const userdata = JSON.parse(localStorage.getItem("user")) || {};
  const token = userdata?.token || "";
  const bytes = CryptoJS.AES.decrypt(userdata.id, secretKey);
  const decryptedCustId = bytes.toString(CryptoJS.enc.Utf8);
  const [originalUser, setOriginalUser] = useState(null);
  const [hasUploadedImage, setHasUploadedImage] = useState(false);
  const [accountDetails, setAccountDetails] = useState({
    id: 0,
    accountHolderName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    bankName: "",
    branch: "",
  });


  useEffect(() => {
    const fetchBankDetails = async (customerId) => {
      try {
        const headers = token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : {};

        const res = await axios.get(
          `${API_BASE}Customer/get-customer-bank-details?customerId=${customerId}`,
          headers
        );
        const data = Array.isArray(res.data) ? res.data[0] : res.data;

        if (data) {
          setAccountDetails({
            id: data.Id || 0,
            accountHolderName: data.AccountHolderName || "",
            accountNumber: data.AccountNumber || "",
            confirmAccountNumber: data.AccountNumber || "",
            ifscCode: data.IFSCCode || "",
            bankName: data.BankName || "",
            branch: data.Branch || "",
          });
        } else {
          setAccountDetails((prev) => ({
            ...prev,
            id: 0,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch bank details", err);
      }
    };

    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}Customer/Id?Id=${decryptedCustId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = res.data[0] || {};

        setUser({
          FullName: data.FullName || "",
          Email: data.Email,
          PhoneNumber: data.PhoneNumber || "",
          AlternateNumber: data.AlternateNumber || "",
          ProfileImage: data.ProfileImage || "",
        });

        const isEmptyProfile =
          !data.FullName &&
          (!data.Email || data.Email === "null") &&
          !data.AlternateNumber &&
          !data.ProfileImage;

        if (isEmptyProfile) {
          setEditingProfile(true);
        }
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      }
    };

    fetchProfile();
    if (decryptedCustId) {
      fetchBankDetails(decryptedCustId);
    }
  }, []);

  const handleAccountInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "accountNumber" || name === "confirmAccountNumber") {
      setAccountDetails((prev) => ({
        ...prev,
        [name]: value.replace(/[^0-9]/g, "").slice(0, 18),
      }));
      return;
    }
    if (name === "ifscCode") {
      setAccountDetails((prev) => ({
        ...prev,
        [name]: value.replace(/\s/g, "").toUpperCase().slice(0, 11),
      }));
      return;
    }
    setAccountDetails((prev) => ({ ...prev, [name]: value }));
  };

  const validateAccountDetails = () => {
    const {
      accountHolderName,
      accountNumber,
      confirmAccountNumber,
      ifscCode,
      bankName,
      branch,
    } = accountDetails;

    if (!accountHolderName.trim()) return "Account holder name is required";
    if (!bankName.trim()) return "Bank name is required";
    if (!accountNumber) return "Account number is required";
    if (!branch.trim()) return "Branch name is required";
    if (accountNumber.length < 8) return "Invalid account number";
    if (accountNumber !== confirmAccountNumber)
      return "Account numbers do not match";
    const ifsc = ifscCode?.replace(/\s/g, "").toUpperCase();
    if (!ifsc) return "IFSC code is required";
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc))
      return "Invalid IFSC code";

    return null;
  };

  const saveBankDetails = async () => {
    const hasAnyBankField = [
      accountDetails.accountHolderName,
      accountDetails.accountNumber,
      accountDetails.confirmAccountNumber,
      accountDetails.ifscCode,
      accountDetails.bankName,
      accountDetails.branch,
    ].some((value) => String(value || "").trim() !== "");

    // Allow profile-only updates when bank details are not provided yet.
    if (!hasAnyBankField && !accountDetails.id) {
      return;
    }

    const validationMessage = validateAccountDetails();
    if (validationMessage) {
      throw new Error(validationMessage);
    }

    const payload = {
      Id: accountDetails.id || 0,
      CustomerId: Number(decryptedCustId),
      AccountHolderName: accountDetails.accountHolderName.trim(),
      AccountNumber: accountDetails.accountNumber.trim(),
      IFSCCode: accountDetails.ifscCode.replace(/\s/g, "").toUpperCase(),
      BankName: accountDetails.bankName.trim(),
      Branch: accountDetails.branch.trim(),
    };

    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};

    const endpoint = payload.Id
      ? `${API_BASE}Customer/upsert-customer-bank-details`
      : `${API_BASE}Customer/add-customer-bank-details`;

    const response = await axios.post(endpoint, payload, config);
    if (response?.status === 200 || response?.status === 201) {
      const savedData = Array.isArray(response.data) ? response.data[0] : response.data;
      if (savedData?.Id) {
        setAccountDetails((prev) => ({ ...prev, id: savedData.Id }));
      }
      return;
    }
    throw new Error("Failed to save bank details");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // 📞 Phone & Alternate Number (numbers only)
    if (name === "AlternateNumber") {
      let numericValue = value.replace(/[^0-9]/g, "");

      // First digit must be 6–9
      if (numericValue.length > 0 && !/^[6-9]/.test(numericValue[0])) {
        return;
      }

      setUser((prev) => ({
        ...prev,
        [name]: numericValue.slice(0, 10),
      }));
      return;
    }

    // 👤 Name (letters & spaces only)
    if (name === "FullName") {
      setUser((prev) => ({
        ...prev,
        [name]: value.replace(/[^a-zA-Z\s]/g, ""),
      }));
      return;
    }

    // 📧 Email (allow full email syntax)
    if (name === "Email") {
      setUser((prev) => ({
        ...prev,
        [name]: value,
      }));
      return;
    }
  };


  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append("CustID", decryptedCustId || "");
      formData.append("FullName", user.FullName || "");
      formData.append("Email", user.Email || "");
      formData.append("PhoneNumber", user.PhoneNumber || "");
      formData.append("AlternateNumber", user.AlternateNumber || "");

      if (user.ProfileImage?.startsWith("data:image")) {
        const blob = await fetch(user.ProfileImage).then((r) => r.blob());
        formData.append("ProfileImageFile", blob, "profile.jpg");
      }

      const res = await fetch(
        `${API_BASE}Customer/update-customer`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Failed to update profile");

      // Update localStorage user data after profile update
      const existingUser = JSON.parse(localStorage.getItem("user")) || {};

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...existingUser, // keep token, id, phone, etc.
          name: user.FullName,
          email: user.Email,
          profileImage: user.ProfileImage,
          alternateNumber: user.AlternateNumber,
        })
      );

      window.dispatchEvent(new Event("userProfileUpdated"));
      setEditingProfile(false);
      setHasUploadedImage(false);
      showAlert("success", "Profile updated successfully!", 3000, "success");
      window.location.reload();
    } catch (err) {
      console.error("Save failed:", err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Error updating profile";
      showAlert("error", errorMessage, 4000, "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveBankDetails = async () => {
    setSavingBank(true);
    try {
      await saveBankDetails();
      setEditingBank(false);
      showAlert("success", "Bank details updated successfully!", 3000, "success");
    } catch (err) {
      console.error("Bank save failed:", err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Error updating bank details";
      showAlert("error", errorMessage, 4000, "error");
    } finally {
      setSavingBank(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setUser((prev) => ({ ...prev, ProfileImage: reader.result }));
    };
    reader.readAsDataURL(file);
    setHasUploadedImage(true);
  };

  const handleRemoveImage = async () => {
    try {
      const response = await axios.delete(
        `${API_BASE}Customer/remove-customer-image/${decryptedCustId}`
      );

      if (response.status === 200) {
        setUser((prev) => ({ ...prev, ProfileImage: "" }));
        setHasUploadedImage(false);

        showAlert(
          "success",
          "Profile image removed successfully!",
          3000,
          "success"
        );

        // Update localStorage
        const existingUser = JSON.parse(localStorage.getItem("user")) || {};
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...existingUser,
            profileImage: "",
          })
        );

        window.dispatchEvent(new Event("userProfileUpdated"));
      }
    } catch (error) {
      console.error("Failed to remove profile image:", error);
      showAlert("error", "Failed to remove profile image", 3000, "error");
    }
  };


  const getProfileImageSrc = () => {
    if (user?.ProfileImage?.startsWith("data:")) {
      return user.ProfileImage;
    }
    if (user?.ProfileImage) {
      return `${ImageURL}${user.ProfileImage}`;
    }
    return "/assets/img/avatar.png";
  };

  return (
    <>
      {/* Tab Header */}
      <div className="profile-tab-header">
        <h3 className="profile-tab-title">
          <i className="fas fa-user-circle" />
          Personal Information
        </h3>
        {!editingProfile && (
          <button
            className="profile-edit-btn"
            onClick={() => setEditingProfile(true)}
          >
            <i className="fas fa-pencil-alt" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Tab Body */}
      <div className="profile-tab-body">
        <div className="profile-layout">
          {/* Left: Image Section */}
          <div className="profile-image-section">
            <div className="profile-image-wrapper">
              <img
                src={getProfileImageSrc()}
                alt="Profile"
                className="profile-main-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/assets/img/avatar.png";
                }}
              />
              {editingProfile && (
                <div className="profile-image-actions">
                  <label className="profile-image-upload">
                    <i className="fas fa-camera" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                  {user.ProfileImage && (
                    <button
                      className="profile-image-remove"
                      onClick={handleRemoveImage}
                      title="Remove image"
                    >
                      <i className="fas fa-trash" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="profile-user-info">
              <h4>{user.FullName || "Your Name"}</h4>
              <span className="profile-user-badge">
                <i className="fas fa-check-circle" />
                Verified Customer
              </span>
            </div>

            {/* Mini Stats */}
            {/* <div className="profile-mini-stats">
              <div className="profile-mini-stat">
                <div className="profile-mini-stat-value">0</div>
                <div className="profile-mini-stat-label">Bookings</div>
              </div>
              <div className="profile-mini-stat">
                <div className="profile-mini-stat-value">0</div>
                <div className="profile-mini-stat-label">Services</div>
              </div>
              <div className="profile-mini-stat">
                <div className="profile-mini-stat-value">5.0</div>
                <div className="profile-mini-stat-label">Rating</div>
              </div>
            </div> */}
          </div>

          {/* Right: Form Section */}
          <div className="profile-form-section">
            <div className="profile-form">
              <div className="profile-form-row" style={{ marginBottom: "14px" }}>
                {/* Full Name */}
                <div className="profile-form-group">
                  <label className="profile-form-label">Full Name</label>
                  <div className="profile-form-input-wrapper">
                    <i className="fas fa-user profile-form-icon" />
                    <input
                      type="text"
                      className={`profile-form-input ${editingProfile ? 'editing' : ''}`}
                      name="FullName"
                      value={user.FullName}
                      onChange={(e) => {
                        const { name, value } = e.target;

                        handleInputChange({
                          target: {
                            name,
                            value: value
                              ? value[0].toUpperCase() + value.slice(1)
                              : "",
                          },
                        });
                      }}
                      placeholder="Enter your full name"
                      readOnly={!editingProfile}
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="profile-form-group">
                  <label className="profile-form-label">Mobile Number</label>
                  <div className="profile-form-input-wrapper">
                    <i className="fas fa-phone-alt profile-form-icon" />
                    <input
                      type="text"
                      className="profile-form-input"
                      name="PhoneNumber"
                      value={user.PhoneNumber}
                      readOnly
                    />
                    <i className="fas fa-lock profile-form-lock" title="Cannot be changed" />
                  </div>
                </div>
              </div>

              <div className="profile-form-row" style={{ marginBottom: "14px" }}>
                {/* Email */}
                <div className="profile-form-group">
                  <label className="profile-form-label">Email Address</label>
                  <div className="profile-form-input-wrapper">
                    <i className="fas fa-envelope profile-form-icon" />
                    <input
                      type="email"
                      className={`profile-form-input ${editingProfile ? 'editing' : ''}`}
                      name="Email"
                      value={user.Email === "null" ? "" : user.Email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      readOnly={!editingProfile}
                    />
                  </div>
                </div>

                {/* Alternate Number */}
                <div className="profile-form-group">
                  <label className="profile-form-label">Alternate Number</label>
                  <div className="profile-form-input-wrapper">
                    <i className="fas fa-phone-alt profile-form-icon" />
                    <input
                      type="tel"
                      className={`profile-form-input ${editingProfile ? 'editing' : ''}`}
                      name="AlternateNumber"
                      maxLength={10}
                      value={user.AlternateNumber}
                      onChange={handleInputChange}
                      placeholder="Enter alternate number"
                      readOnly={!editingProfile}
                    />
                  </div>
                </div>
              </div>

              {/* Profile Action Buttons */}
              {editingProfile && (
                <div className="profile-actions">
                  <button
                    className="profile-btn profile-btn-primary"
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                  >
                    {savingProfile ? (
                      <>
                        <i className="fas fa-spinner fa-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check" />
                        Save Profile
                      </>
                    )}
                  </button>
                  <button
                    className="profile-btn profile-btn-secondary"
                    onClick={() => {
                      setEditingProfile(false);
                      setHasUploadedImage(false);
                      window.location.reload();
                    }}
                    disabled={savingProfile}
                  >
                    <i className="fas fa-times" />
                    Cancel
                  </button>
                </div>
              )}

              <div className="accordion mt-4" id="bankDetailsAccordion">
                <div className="accordion-item">
                  <h2 className="accordion-header" id="bankDetailsHeading">
                    <button
                      className={`accordion-button ${bankAccordionOpen ? "" : "collapsed"}`}
                      type="button"
                      onClick={() => setBankAccordionOpen((prev) => !prev)}
                      aria-expanded={bankAccordionOpen}
                      aria-controls="bankDetailsCollapse"
                    >
                      <i className="fas fa-university me-2" />
                      Bank Details
                    </button>
                  </h2>

                  <div
                    id="bankDetailsCollapse"
                    className={`accordion-collapse collapse ${bankAccordionOpen ? "show" : ""}`}
                    aria-labelledby="bankDetailsHeading"
                  >
                    <div className="accordion-body">
                      <div className="d-flex justify-content-end mb-3">
                        {!editingBank ? (
                          <button
                            className="profile-edit-btn"
                            onClick={() => {
                              setEditingBank(true);
                              setBankAccordionOpen(true);
                            }}
                            style={{
                              backgroundColor: "#0a6264",
                              color: "#ffffff",
                              border: "1px solid #0a6264",
                              borderRadius: "6px",
                              padding: "8px 14px",
                            }}
                          >
                            <i className="fas fa-pencil-alt" />
                            Edit Bank
                          </button>
                        ) : (
                          <button
                            className="profile-btn profile-btn-secondary"
                            onClick={() => setEditingBank(false)}
                            disabled={savingBank}
                          >
                            <i className="fas fa-times" />
                            Cancel Edit
                          </button>
                        )}
                      </div>
              <div className="profile-form-row" style={{ marginBottom: "14px" }}>
                <div className="profile-form-group">
                  <label className="profile-form-label">Account Holder Name</label>
                  <div className="profile-form-input-wrapper">
                    <i className="fas fa-user profile-form-icon" />
                    <input
                      type="text"
                      className={`profile-form-input ${editingBank ? "editing" : ""}`}
                      name="accountHolderName"
                      value={accountDetails.accountHolderName}
                      onChange={handleAccountInputChange}
                      placeholder="Enter account holder name"
                      readOnly={!editingBank}
                    />
                  </div>
                </div>
                <div className="profile-form-group">
                  <label className="profile-form-label">Bank Name</label>
                  <div className="profile-form-input-wrapper">
                    <i className="fas fa-university profile-form-icon" />
                    <input
                      type="text"
                      className={`profile-form-input ${editingBank ? "editing" : ""}`}
                      name="bankName"
                      value={accountDetails.bankName}
                      onChange={handleAccountInputChange}
                      placeholder="Enter bank name"
                      readOnly={!editingBank}
                    />
                  </div>
                </div>
              </div>

              <div className="profile-form-row" style={{ marginBottom: "14px" }}>
                <div className="profile-form-group">
                  <label className="profile-form-label">Account Number</label>
                  <div className="profile-form-input-wrapper">
                    <i className="fas fa-credit-card profile-form-icon" />
                    <input
                      type="text"
                      className={`profile-form-input ${editingBank ? "editing" : ""}`}
                      name="accountNumber"
                      value={accountDetails.accountNumber}
                      onChange={handleAccountInputChange}
                      placeholder="Enter account number"
                      readOnly={!editingBank}
                    />
                  </div>
                </div>
                <div className="profile-form-group">
                  <label className="profile-form-label">Confirm Account Number</label>
                  <div className="profile-form-input-wrapper">
                    <i className="fas fa-credit-card profile-form-icon" />
                    <input
                      type="text"
                      className={`profile-form-input ${editingBank ? "editing" : ""}`}
                      name="confirmAccountNumber"
                      value={accountDetails.confirmAccountNumber}
                      onChange={handleAccountInputChange}
                      placeholder="Re-enter account number"
                      readOnly={!editingBank}
                    />
                  </div>
                </div>
              </div>

              <div className="profile-form-row">
                <div className="profile-form-group">
                  <label className="profile-form-label">IFSC Code</label>
                  <div className="profile-form-input-wrapper">
                    <i className="fas fa-code profile-form-icon" />
                    <input
                      type="text"
                      className={`profile-form-input ${editingBank ? "editing" : ""}`}
                      name="ifscCode"
                      value={accountDetails.ifscCode}
                      onChange={handleAccountInputChange}
                      placeholder="Enter IFSC code"
                      readOnly={!editingBank}
                    />
                  </div>
                </div>
                <div className="profile-form-group">
                  <label className="profile-form-label">Branch</label>
                  <div className="profile-form-input-wrapper">
                    <i className="fas fa-code-branch profile-form-icon" />
                    <input
                      type="text"
                      className={`profile-form-input ${editingBank ? "editing" : ""}`}
                      name="branch"
                      value={accountDetails.branch}
                      onChange={handleAccountInputChange}
                      placeholder="Enter branch name"
                      readOnly={!editingBank}
                    />
                  </div>
                </div>
              </div>

              {/* Bank Action Buttons */}
              {editingBank && (
                <div className="profile-actions">
                  <button
                    className="profile-btn profile-btn-primary"
                    onClick={handleSaveBankDetails}
                    disabled={savingBank}
                  >
                    {savingBank ? (
                      <>
                        <i className="fas fa-spinner fa-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check" />
                        Save Bank Details
                      </>
                    )}
                  </button>
                </div>
              )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
