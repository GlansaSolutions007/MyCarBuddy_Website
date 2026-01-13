import React, { useEffect, useState } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";
import { useAlert } from "../context/AlertContext";
import { useNavigate } from "react-router-dom";
import "./MainProfile.css";

const ImageURL = process.env.REACT_APP_CARBUDDY_IMAGE_URL;

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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const userdata = JSON.parse(localStorage.getItem("user")) || {};
  const token = userdata?.token || "";
  const bytes = CryptoJS.AES.decrypt(userdata.id, secretKey);
  const decryptedCustId = bytes.toString(CryptoJS.enc.Utf8);
  const [originalUser, setOriginalUser] = useState(null);
  const [hasUploadedImage, setHasUploadedImage] = useState(false);


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_CARBUDDY_BASE_URL}Customer/Id?Id=${decryptedCustId}`,
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
          setEditing(true);
        }
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      }
    };

    fetchProfile();
  }, []);

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


  const handleSave = async () => {
    setSaving(true);
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
        `${process.env.REACT_APP_CARBUDDY_BASE_URL}Customer/update-customer`,
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
      setEditing(false);
      setHasUploadedImage(false);
      showAlert("success", "Profile updated successfully!", 3000, "success");
      window.location.reload();
    } catch (err) {
      console.error("Save failed:", err);
      alert("Error updating profile");
    } finally {
      setSaving(false);
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

  const handleRemoveImage = () => {
    setUser((prev) => ({ ...prev, ProfileImage: "" }));
    setHasUploadedImage(false);
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
        {!editing && (
          <button
            className="profile-edit-btn"
            onClick={() => setEditing(true)}
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
              {editing && (
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
              <div className="profile-form-row">
                {/* Full Name */}
                <div className="profile-form-group">
                  <label className="profile-form-label">Full Name</label>
                  <div className="profile-form-input-wrapper">
                    <i className="fas fa-user profile-form-icon" />
                    <input
                      type="text"
                      className={`profile-form-input ${editing ? 'editing' : ''}`}
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
                      readOnly={!editing}
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

              <div className="profile-form-row">
                {/* Email */}
                <div className="profile-form-group">
                  <label className="profile-form-label">Email Address</label>
                  <div className="profile-form-input-wrapper">
                    <i className="fas fa-envelope profile-form-icon" />
                    <input
                      type="email"
                      className={`profile-form-input ${editing ? 'editing' : ''}`}
                      name="Email"
                      value={user.Email === "null" ? "" : user.Email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      readOnly={!editing}
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
                      className={`profile-form-input ${editing ? 'editing' : ''}`}
                      name="AlternateNumber"
                      maxLength={10}
                      value={user.AlternateNumber}
                      onChange={handleInputChange}
                      placeholder="Enter alternate number"
                      readOnly={!editing}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {editing && (
                <div className="profile-actions">
                  <button
                    className="profile-btn profile-btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <i className="fas fa-spinner fa-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check" />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    className="profile-btn profile-btn-secondary"
                    onClick={() => {
                      setEditing(false);
                      setHasUploadedImage(false);
                      window.location.reload();
                    }}
                    disabled={saving}
                  >
                    <i className="fas fa-times" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
