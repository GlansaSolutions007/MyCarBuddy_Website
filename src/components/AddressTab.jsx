import React, { useState, useEffect } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";
import Swal from "sweetalert2";
import { useAlert } from "../context/AlertContext";

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

        const formatted = response.data.map((addr) => ({
          id: addr.AddressID,
          name: "Saved Address",
          phone: "", // API doesn't include phone, use empty or attach if available
          address1: addr.AddressLine1,
          address2: `${addr.AddressLine2 || ""}, ${addr.Pincode}`,
          isPrimary: addr.IsPrimary,
          lat: addr.Latitude,
          lng: addr.Longitude,
        }));

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
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">📍 Your Addresses</h5>
      </div>

    {loading ? (
      // loader (same as InvoicesTab)
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading addresses...</p>
      </div>
    ) : !selectedAddress ? (
        <div className="row">
          {addresses.length === 0 && (
            <div className="text-center py-5">
              <img
                src="/assets/img/no-address.png"
                alt="No Addresses"
                style={{ maxWidth: "500px", marginBottom: "20px" }}
              />
              <h4>No addresses yet</h4>
              <p>
                Looks like you haven't added any addresses yet. Add your first address!
              </p>
            </div>
          )}
          {addresses.map((addr) => (
            <div key={addr.id} className="col-md-6 mb-4">
              <div
                className={`card h-100 shadow-sm border-0 ${
                  addr.isPrimary ? "bg-light border-start border-danger border-3" : ""
                }`}
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="mb-1">{addr.name}</h6>
                      <small className="text-muted">{addr.phone}</small>
                    </div>
                    <div className="text-end">
                        <i
                           className={`bi ${addr.isPrimary ? "bi-star-fill bg-green text-white" : "bi-star"} fs-8 me-2 p-1 rounded-circle`}
                          role="button"
                          onClick={() => handleSetPrimary(addr.id)}
                          title="Set as Primary"
                        ></i>
                      <i
                        className="bi bi-eye text-primary fs-8 me-2 p-1"
                        role="button"
                        onClick={() => setSelectedAddress(addr)}
                        title="View"
                      ></i>
                      {/* <i className="bi bi-pencil text-secondary fs-5 me-2" role="button" title="Edit"></i> */}
                      <i className="bi bi-trash text-danger fs-8 p-1" role="button" title="Delete"  onClick={() => handleDelete(addr.id)}></i>
                    </div>
                  </div>
                  <hr />
                  <p className="mb-1">{addr.address2}</p>
                  {/* <p className="mb-0">{addr.address2}</p> */}
                  {/* {addr.isPrimary && (
                    <span className="badge bg-danger mt-2">Primary</span>
                  )} */}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-4 shadow-sm ">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 10px",
                  borderRadius: "9999px",
                  backgroundColor: "#eef7f7",
                  color: "#116d6e",
                  fontSize: 12,
                  border: "1px solid #cfe7e6",
                }}
              >
                {selectedAddress.name || "Saved Address"}
              </span>
              {selectedAddress.isPrimary ? (
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 10px",
                    borderRadius: "9999px",
                    backgroundColor: "#fde8e8",
                    color: "#b42318",
                    fontSize: 12,
                    border: "1px solid #f5c2c0",
                  }}
                >
                  Primary
                </span>
              ) : null}
            </div>
            <div>
              <button className="btn btn-outline-secondary px-3 py-1" onClick={handleBack}>
                <i className="bi bi-arrow-left"></i>
              </button>
            </div>
          </div>

          {/* <p className="mb-1">📞 {selectedAddress.phone}</p>
          <p className="mb-1">🏠 {selectedAddress.address1}</p> */}
          <p className="mb-3">📍 {selectedAddress.address2}</p>
          <div className="ratio ratio-16x9 rounded overflow-hidden border">
            <iframe
              src={`https://maps.google.com/maps?q=${selectedAddress.lat},${selectedAddress.lng}&z=15&output=embed`}
              allowFullScreen
              loading="lazy"
              title="Google Map"
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressTab;
