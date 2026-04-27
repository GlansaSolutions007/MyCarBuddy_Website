import React, { useState, useEffect } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";
import Swal from "sweetalert2";
import { useAlert } from "../context/AlertContext";
import "./AddressTab.css";
import { FaMapMarkerAlt, FaStar, FaEye, FaTrash, FaArrowLeft, FaHome, FaPlus } from "react-icons/fa";

const AddressTab = ({ custID = 0 }) => {
      const [addresses, setAddresses] = useState([]);
      const [selectedAddress, setSelectedAddress] = useState(null);
      const [loading, setLoading] = useState(true);
      const { showAlert } = useAlert();
      const user = JSON.parse(localStorage.getItem("user")) || {};
      const token = user?.token || "";
      const BaseURL = process.env.REACT_APP_CARBUDDY_BASE_URL;
      const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;
      const bytes = CryptoJS.AES.decrypt(user.id, secretKey);
      const decryptedCustId = bytes.toString(CryptoJS.enc.Utf8);

  const formatAddressParts = (addr) => {
    const locationParts = [
      addr?.AddressLine2,
      addr?.CityName,
      addr?.StateName,
      addr?.Pincode,
    ].filter(Boolean);

    return {
      primaryAddress: addr?.AddressLine1 || "Saved Address",
      secondaryAddress: locationParts.join(", "),
    };
  };

  useEffect(() => {

    const fetchAddresses = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${BaseURL}CustomerAddresses/custid?custid=${decryptedCustId || ''}`,
          {
            headers: {
              Authorization: `Bearer ${user?.token}`,
            },
          }
        );

        const formatted = response.data.map((addr, index) => {
          const { primaryAddress, secondaryAddress } = formatAddressParts(addr);

          return {
            id: addr.AddressID,
            name: addr.IsPrimary || addr.IsDefault ? "Primary Address" : `Saved Address ${index + 1}`,
            phone: "",
            address1: primaryAddress,
            address2: secondaryAddress,
            fullAddress: [primaryAddress, secondaryAddress].filter(Boolean).join(", "),
            isPrimary: Boolean(addr.IsPrimary || addr.IsDefault),
            isDefault: Boolean(addr.IsDefault),
            lat: addr.Latitude,
            lng: addr.Longitude,
          };
        });

        setAddresses(formatted);
      } catch (error) {
        console.error("Error fetching addresses:", error);
       } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [decryptedCustId]);

  const handleSetPrimary = async (id) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_CARBUDDY_BASE_URL}CustomerAddresses/primary-address?AddressId=${id}&CustId=${decryptedCustId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }

      );
      const updatedAddresses = addresses.map((addr) => ({
        ...addr,
        isPrimary: addr.id === id,
      }));
      setAddresses(updatedAddresses);
    } catch (error) {
      console.error("Error setting primary address:", error);
    }
  };   
  
  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: "Delete address?",
        text: "This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#d33",
      });

      if (!result.isConfirmed) return;

      await axios.delete(
        `${BaseURL}CustomerAddresses/addressid?addressid=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAddresses((prev) => prev.filter((addr) => addr.id !== id));

      await Swal.fire({
        title: "Deleted",
        text: "Address removed successfully.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      showAlert(error.response?.data?.message || "Something went wrong while deleting address.");
    }
  };


  const handleBack = () => {
    setSelectedAddress(null);
  };

  return (
    <div className="at-section">
      {/* Header */}
      <div className="at-header">
        <h2 className="at-title">
          <span className="at-title-icon">
            <FaMapMarkerAlt />
          </span>
          My Address
        </h2>
      </div>

      {loading ? (
        <div className="at-loading">
          <div className="at-spinner"></div>
          <span className="at-loading-text">Loading address...</span>
        </div>
      ) : !selectedAddress ? (
        <>
          {addresses.length === 0 ? (
            <div className="at-empty">
              <img
                src="/assets/img/no-address.png"
                alt="No Addresses"
                className="at-empty-img"
              />
              <h4>No address yet</h4>
              <p>Looks like you haven't added any addresses yet. Add your first address!</p>
            </div>
          ) : (
            <div className="at-grid">
              {addresses.map((addr) => (
                <div key={addr.id} className={`at-card ${addr.isPrimary ? "primary" : ""}`}>
                  <div className="at-card-header">
                    <div className="at-card-info">
                      <div className="at-card-icon">
                        <FaHome />
                      </div>
                      <div>
                        <h4 className="at-card-title">{addr.name}</h4>
                        {addr.isPrimary && (
                          <span className="at-card-badge">
                            <FaStar /> Primary
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="at-card-actions">
                      <button
                        className={`at-action-btn primary ${addr.isPrimary ? "active" : ""}`}
                        onClick={() => handleSetPrimary(addr.id)}
                        title="Set as Primary"
                      >
                        <FaStar />
                      </button>
                      <button
                        className="at-action-btn view"
                        onClick={() => setSelectedAddress(addr)}
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      <button
                        className="at-action-btn delete"
                        onClick={() => handleDelete(addr.id)}
                        title="Delete Address"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="at-card-body">
                    <div className="at-card-address">
                      <FaMapMarkerAlt />
                      <span>{addr.fullAddress || addr.address1}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="at-detail">
          <div className="at-detail-header">
            <div className="at-detail-badges">
              <span className="at-detail-badge name">
                <FaHome /> {selectedAddress.name || "Saved Address"}
              </span>
              {selectedAddress.isPrimary && (
                <span className="at-detail-badge primary">
                  <FaStar /> Primary
                </span>
              )}
            </div>
            <button className="at-detail-back" onClick={handleBack}>
              <FaArrowLeft /> Back to Addresses
            </button>
          </div>

          <div className="at-detail-body">
            <div className="at-detail-address">
              <FaMapMarkerAlt />
              <span>{selectedAddress.fullAddress || selectedAddress.address1}</span>
            </div>
            {selectedAddress.lat && selectedAddress.lng ? (
              <div className="at-detail-map">
                <iframe
                  src={`https://maps.google.com/maps?q=${selectedAddress.lat},${selectedAddress.lng}&z=15&output=embed`}
                  allowFullScreen
                  loading="lazy"
                  title="Google Map"
                ></iframe>
              </div>
            ) : (
              <div className="at-detail-address">
                <FaMapMarkerAlt />
                <span>Map preview unavailable for this saved address.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressTab;
