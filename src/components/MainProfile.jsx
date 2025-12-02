import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Profile from "./Profile";
import AddressTab from "./AddressTab";
import MyBookings from "./MyBookings";
import MyCarList from "./MyCarList";
import InvoicesTab from "./InvoicesTab";
import RaisedTicketsTab from "./RaisedTicketsTab";
import axios from "axios";
import CryptoJS from "crypto-js";
import { useAlert } from "../context/AlertContext";
import "./MainProfile.css";

const ImageURL = process.env.REACT_APP_CARBUDDY_IMAGE_URL;
const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;

const MainProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [userData, setUserData] = useState({
    FullName: "",
    PhoneNumber: "",
    Email: "",
    AlternateNumber: "",
    ProfileImage: "",
  });

  const user = JSON.parse(localStorage.getItem("user"));
  const decryptedCustId = (() => {
    try {
      if (!user?.id) return "";
      const bytesLocal = CryptoJS.AES.decrypt(user.id, secretKey);
      return bytesLocal.toString(CryptoJS.enc.Utf8);
    } catch (_) {
      return "";
    }
  })();
  const { showAlert } = useAlert();
  const contentRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user || !decryptedCustId) return;
    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_CARBUDDY_BASE_URL}Customer/Id?Id=${decryptedCustId}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        const data = res.data[0] || {};
        setUserData({
          FullName: data.FullName || "",
          Email: data.Email,
          PhoneNumber: data.PhoneNumber || "",
          AlternateNumber: data.AlternateNumber || "",
          ProfileImage: data.ProfileImage || "",
        });
        const updatedUser = {
          ...user,
          profileImage: data.ProfileImage || "",
          name: data.FullName || user.name,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event("userProfileUpdated"));
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      }
    };
    fetchUser();
  }, []);

  const handleTabClick = (key) => {
    if (key === "logout") {
      localStorage.removeItem("user");
      localStorage.clear();
      sessionStorage.clear();
      navigate("/");
    } else {
      setActiveTab(key);
      setTimeout(() => {
        try {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (_) {}
      }, 0);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone, and you will lose all your data."
    );
    if (confirmed) {
      try {
        const response = await axios.delete(
          `${process.env.REACT_APP_CARBUDDY_BASE_URL}Customer/CustId?CustId=${decryptedCustId}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        if (response.status === 200) {
          showAlert("Account deleted successfully.", "success");
          localStorage.clear();
          sessionStorage.clear();
          navigate("/");
        } else {
          showAlert("Failed to delete account. Please try again.", "error");
        }
      } catch (error) {
        console.error("Error deleting account:", error);
        showAlert("Error deleting account. Please try again.", "error");
      }
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <Profile />;
      case "addresses":
        return <AddressTab />;
      case "mybookings":
        return <MyBookings />;
      case "mycars":
        return <MyCarList />;
      case "invoices":
        return <InvoicesTab />;
      case "tickets":
        return <RaisedTicketsTab />;
      case "DeleteAccount":
        return (
          <div className="delete-account-section">
            <div className="delete-account-icon">
              <i className="fas fa-exclamation-triangle" />
            </div>
            <h3 className="delete-account-title">Delete Your Account</h3>
            <p className="delete-account-text">
              Are you sure you want to delete your account? This action cannot be undone, 
              and you will permanently lose all your data, bookings, and preferences.
            </p>
            <button
              className="delete-account-btn"
              onClick={handleDeleteAccount}
            >
              <i className="fas fa-trash-alt" />
              Delete My Account
            </button>
          </div>
        );
      default:
        return <Profile />;
    }
  };

  const tabs = [
    { key: "profile", label: "Profile", icon: "fas fa-user" },
    { key: "mybookings", label: "My Bookings", icon: "fas fa-calendar-check" },
    { key: "addresses", label: "Addresses", icon: "fas fa-map-marker-alt" },
    { key: "mycars", label: "My Cars", icon: "fas fa-car" },
    { key: "invoices", label: "Invoices", icon: "fas fa-file-invoice" },
    { key: "tickets", label: "Tickets", icon: "fas fa-ticket-alt" },
    { key: "logout", label: "Log Out", icon: "fas fa-sign-out-alt", className: "logout" },
    { key: "DeleteAccount", label: "Delete Account", icon: "fas fa-trash-alt", className: "delete" },
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="main-profile-section">
      <div className="container">
        {/* Page Header */}
        <div className="profile-page-header">
          {/* <span className="profile-page-subtitle">My Account</span> */}
          <h2 className="profile-page-title">Account Settings</h2>
        </div>

        <div className="row">
          {/* Sidebar */}
          <div className="col-lg-3 col-md-4">
            <div className="profile-sidebar">
              {/* Sidebar Header */}
              <div className="profile-sidebar-header">
                <img
                  src={userData?.ProfileImage ? `${ImageURL}${userData.ProfileImage}` : "/assets/img/avatar.png"}
                  alt="Profile"
                  className="profile-sidebar-avatar"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/assets/img/avatar.png";
                  }}
                />
                <h4 className="profile-sidebar-name">
                  {userData.FullName || "User"}
                </h4>
                <p className="profile-sidebar-phone">
                  <i className="fas fa-phone" />
                  {userData.PhoneNumber || "No phone"}
                </p>
              </div>

              {/* Sidebar Navigation */}
              <div className="profile-sidebar-nav">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    className={`profile-nav-item ${activeTab === tab.key ? 'active' : ''} ${tab.className || ''}`}
                    onClick={() => handleTabClick(tab.key)}
                  >
                    <span className="nav-icon">
                      <i className={tab.icon} />
                    </span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="col-lg-9 col-md-8" ref={contentRef}>
            <div className="profile-content">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainProfile;
