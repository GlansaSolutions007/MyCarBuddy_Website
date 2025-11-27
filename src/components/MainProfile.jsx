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
  const userName = user?.name || "Guest User";
  const userIdentifier = user?.identifier || "No identifier";
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
      // Smooth scroll to top after tab change
      setTimeout(() => {
        try {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (_) {}
      }, 0);
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
        const handleDelete = async () => {
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
        return (
          <div className="text-center">
            <h5 className="text-danger">Delete Account</h5>
            <p className="text-muted">
              Are you sure you want to delete your account? This action cannot be undone, and you will lose all your data.
            </p>
            <button
              className="btn btn-danger px-4 py-3"
              onClick={handleDelete}
            >
              Delete Account
            </button>
          </div>
        );
      default:
        return <Profile />;
    }
  };

  const tabs = [
    { key: "profile", label: "👤 Profile" },
    // { key: "mybookings", label: "📅 My Bookings" },
    // { key: "addresses", label: "🏠 Addresses" },
    // { key: "mycars", label: "🚗 My Car List" },
    // { key: "invoices", label: "📄 Invoices" },
    // { key: "tickets", label: "🎫 Ticket List" },
    { key: "logout", label: "🚪 Log Out" },
    { key: "DeleteAccount", label: "🗑️ Delete Account" },
  ];

  return (
    <div className="container py-4">

      {!user ? (
        <div className="alert alert-danger">
          {/* You are not logged in. Please log in to access your profile. */}
        </div>
      ) : (
        <div className="row">
        {/* Sidebar */}
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm p-3">
            <div className="text-center mb-3">
              <img
                  src={userData?.ProfileImage ? `${ImageURL}${userData.ProfileImage}` : "/assets/img/avatar.png"}
                  alt="Profile"
                  className="rounded-circle border"
                  style={{ width: "150px", height: "150px", objectFit: "cover" }}
                  onError={(e) => {
                    e.target.onerror = null; // prevent infinite loop
                    e.target.src = "/assets/img/avatar.png"; // fallback to default
                  }}
                />
              <h6 className="mt-2 mb-0">{userData.FullName}</h6>
              <small className="text-muted">{userData.PhoneNumber}</small>
            </div>

            <div className="nav flex-column nav-pills">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`nav-link text-start ${
                    activeTab === tab.key ? "active" : ""
                  }`}
                  onClick={() => handleTabClick(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="col-md-9" ref={contentRef}>
          <div className="card shadow-sm p-4">{renderContent()}</div>
        </div>
      </div>
      )}
      
    </div>
  );
};

export default MainProfile;
