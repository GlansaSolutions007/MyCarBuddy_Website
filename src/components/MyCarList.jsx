import React, { useEffect, useRef, useState } from "react";
import Car from "../images/car.avif";
import axios from "axios";
import BrandPopup from "./BrandPopup";
import CryptoJS from "crypto-js";
import { useAlert } from "../context/AlertContext";
import Swal from "sweetalert2";
import "./MyCarList.css";
import { FaCar, FaStar, FaEye, FaTrash, FaArrowLeft, FaGasPump, FaPlus, FaTachometerAlt, FaCog, FaCalendarAlt, FaIdCard } from "react-icons/fa";

const MyCarList = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = JSON.parse(localStorage.getItem("user"))?.token;
  const baseUrl = process.env.REACT_APP_CARBUDDY_BASE_URL;
  const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;
  const bytes = CryptoJS.AES.decrypt(user.id, secretKey);
  const decryptedCustId = bytes.toString(CryptoJS.enc.Utf8);
  const { showAlert } = useAlert();
  const [primaryCarId, setPrimaryCarId] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewCar, setViewCar] = useState(null);
  const [loading, setLoading] = useState(true);

  const BASE_URL = process.env.REACT_APP_CARBUDDY_BASE_URL;
  const IMAGE_BASE_URL = process.env.REACT_APP_CARBUDDY_IMAGE_URL;
  const [carType, setCarType] = useState("");
  const [brand, setBrand] = useState(null);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [fuels, setFuels] = useState([]);
  const [model, setModel] = useState("");
  const [fuel, setFuel] = useState("");
  const [showBrandPopup, setShowBrandPopup] = useState(false);
  const [showModelPopup, setShowModelPopup] = useState(false);
  const modalRef = useRef();
  const imageBaseURL = process.env.REACT_APP_CARBUDDY_IMAGE_URL;
  const BaseURL = process.env.REACT_APP_CARBUDDY_BASE_URL;

  const [carList, setCarList] = useState([]);

  const [formData, setFormData] = useState({
    brandID: "",
    modelID: "",
    fuelTypeID: "",
    registrationNumber: "",
    yearOfPurchase: "",
    engineType: "",
    kilometerDriven: "",
    transmissionType: "",
  });

  useEffect(() => {
    fetchMYCars();
  }, []);

  const fetchMYCars = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${baseUrl}CustomerVehicles/CustId?CustId=${decryptedCustId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCarList(response.data);
    } catch (error) {
      console.error("Error fetching cars:", error);
      // alert("Failed to load cars. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleBrandSelect = (id) => {
    setBrand(id);
    setModel("");
    setShowBrandPopup(false);
    fetchModels(id);
    setTimeout(() => {
      setShowModelPopup(true);
    }, 100);
  };

  const fetchModels = async (brandId) => {
    try {
      const token = JSON.parse(localStorage.getItem("user"))?.token;
      const response = await axios.get(
        `${BASE_URL}VehicleModels/GetListVehicleModel`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data?.status && Array.isArray(response.data.data)) {
        const getImageUrl = (path) => {
          if (!path) return "https://via.placeholder.com/100?text=No+Image";
          const fileName = path.split("/").pop();
          return `${imageBaseURL}${
            path.startsWith("/") ? path.slice(1) : path
          }`;
        };
        const filteredModels = response.data.data
          .filter((m) => m.BrandID === brandId && m.IsActive)
          .map((m) => ({
            id: m.ModelID,
            name: m.ModelName,
            logo: getImageUrl(m.VehicleImage), // Use the full valid image URL
          }));

        setModels(filteredModels);
      }
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  };

  const handleModelSelect = (id) => {
    setModel(id);
    setShowModelPopup(false);
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveCar = async () => {
    try {
      await axios.post(`${baseUrl}CustomerVehicles/InsertCustomerVehicle`, {
        custID: decryptedCustId,
        brandID: formData.brandID,
        modelID: formData.modelID,
        fuelTypeID: formData.fuelTypeID,
        VehicleNumber: formData.registrationNumber,
        yearOfPurchase: formData.yearOfPurchase,
        engineType: formData.engineType,
        kilometersDriven: formData.kilometerDriven,
        transmissionType: formData.transmissionType,
        CreatedBy: decryptedCustId,
      });
      await Swal.fire({
        icon: "success",
        title: "Car added successfully",
        confirmButtonColor: "#3085d6",
      });
      setShowAddForm(false);
      // reload or update carList if needed
    } catch (error) {
      console.error("Failed to add car", error);
      Swal.fire({
        icon: "error",
        title: "Failed to add car",
        text: error?.response?.data?.message || "Please try again later.",
        confirmButtonColor: "#d33",
      });
    }
  };

  const handleSetPrimary = async (id) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_CARBUDDY_BASE_URL}Customervehicles/primary-vehicle?VehicleID=${id}&CustId=${decryptedCustId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const updatedVehicles = carList
        .filter((car) => car.IsActive === true)
        .map((car) => ({
          ...car,
          IsPrimary: car.VehicleID === id,
        }));

      // Find the selected car
      const selectedCar = updatedVehicles.find((car) => car.VehicleID === id);

      // Extract brand, model, and fuel from the selected car directly
      const selectedCarDetails = {
        brand: {
          id: selectedCar.BrandID,
          name: selectedCar.BrandName,
          logo: `${imageBaseURL}${selectedCar.BrandLogo}`,
        },
        model: {
          id: selectedCar.ModelID,
          name: selectedCar.ModelName,
          logo: `${imageBaseURL}${selectedCar.VehicleImage}`,
        },
        fuel: {
          id: selectedCar.FuelTypeID,
          name: selectedCar.FuelTypeName,
          logo: `${imageBaseURL}${selectedCar.FuelImage}`,
        },
      };

      // Store in localStorage
      localStorage.setItem(
        "selectedCarDetails",
        JSON.stringify(selectedCarDetails)
      );
      setCarList(updatedVehicles);
      localStorage.removeItem("cartItems");
    } catch (error) {
      console.error("Error setting primary address:", error);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete this car?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete",
    });
    if (!result.isConfirmed) return;

    try {
      await axios.delete(
        `${process.env.REACT_APP_CARBUDDY_BASE_URL}CustomerVehicles/CustomerVehicleID?custvehicleid=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Remove deleted address from UI
      setCarList((prev) => prev.filter((car) => car.VehicleID !== id));
      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "The car has been removed.",
        confirmButtonColor: "#3085d6",
      });
    } catch (error) {
      showAlert(
        error.response?.data?.message ||
          "Something went wrong while deleting address."
      );
    }
  };

  // 📍 View mode
  if (viewCar) {
    return (
      <div className="mc-section">
        <div className="mc-detail">
          <div className="mc-detail-header">
            <h3 className="mc-detail-title">
              <FaCar /> {viewCar.BrandName} {viewCar.ModelName}
            </h3>
            <button className="mc-detail-back" onClick={() => setViewCar(null)}>
              <FaArrowLeft /> Back to Cars
            </button>
          </div>

          <div className="mc-detail-body">
            <div className="mc-detail-content">
              <div className="mc-detail-image-section">
                <img
                  src={`${IMAGE_BASE_URL}${viewCar.VehicleImage}`}
                  alt={viewCar.ModelName}
                  className="mc-detail-image"
                />
                <h4 className="mc-detail-model-name">{viewCar.ModelName}</h4>
                <div className="mc-detail-fuel">
                  <img
                    src={`${IMAGE_BASE_URL}${viewCar.FuelImage}`}
                    alt={viewCar.FuelTypeName}
                  />
                  {viewCar.FuelTypeName}
                </div>
              </div>

              <div className="mc-detail-info">
                <div className="mc-detail-info-item">
                  <div className="mc-detail-info-label">
                    <FaIdCard /> Vehicle Number
                  </div>
                  <div className="mc-detail-info-value">{viewCar.VehicleNumber || "N/A"}</div>
                </div>
                <div className="mc-detail-info-item">
                  <div className="mc-detail-info-label">
                    <FaCog /> Engine Type
                  </div>
                  <div className="mc-detail-info-value">{viewCar.EngineType || "N/A"}</div>
                </div>
                <div className="mc-detail-info-item">
                  <div className="mc-detail-info-label">
                    <FaCog /> Transmission
                  </div>
                  <div className="mc-detail-info-value">{viewCar.TransmissionType || "N/A"}</div>
                </div>
                <div className="mc-detail-info-item">
                  <div className="mc-detail-info-label">
                    <FaTachometerAlt /> Kilometers Driven
                  </div>
                  <div className="mc-detail-info-value">{viewCar.KilometersDriven || "N/A"}</div>
                </div>
                <div className="mc-detail-info-item">
                  <div className="mc-detail-info-label">
                    <FaCalendarAlt /> Year of Purchase
                  </div>
                  <div className="mc-detail-info-value">{viewCar.YearOfPurchase || "N/A"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 📍 Add Form mode
  if (showAddForm) {
    return (
      <div className="mc-section">
        <div className="mc-form">
          <h3 className="mc-form-title">
            <FaPlus /> Add New Car
          </h3>

          <div style={{ marginBottom: '20px' }}>
            <div
              onClick={() => setShowBrandPopup(true)}
              className={`mc-brand-box ${brand ? "selected" : ""}`}
            >
              <span className="mc-brand-label">Brand</span>
              {brand ? (
                <img
                  src={brands.find((b) => b.id === brand)?.logo}
                  alt="Brand Logo"
                />
              ) : (
                <FaCar style={{ fontSize: '2rem', color: '#0a6264' }} />
              )}
            </div>
          </div>

          <div className="mc-form-grid">
            <input
              type="text"
              className="mc-form-input"
              placeholder="Brand ID"
              name="brandID"
              value={formData.brandID}
              onChange={handleInputChange}
            />
            <input
              type="text"
              className="mc-form-input"
              placeholder="Model ID"
              name="modelID"
              value={formData.modelID}
              onChange={handleInputChange}
            />
            <input
              type="text"
              className="mc-form-input"
              placeholder="Fuel Type ID"
              name="fuelTypeID"
              value={formData.fuelTypeID}
              onChange={handleInputChange}
            />
            <input
              type="text"
              className="mc-form-input"
              placeholder="Registration Number"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleInputChange}
            />
            <input
              type="text"
              className="mc-form-input"
              placeholder="Year of Purchase"
              name="yearOfPurchase"
              value={formData.yearOfPurchase}
              onChange={handleInputChange}
            />
            <input
              type="text"
              className="mc-form-input"
              placeholder="Engine Type"
              name="engineType"
              value={formData.engineType}
              onChange={handleInputChange}
            />
            <input
              type="text"
              className="mc-form-input"
              placeholder="Kilometers Driven"
              name="kilometerDriven"
              value={formData.kilometerDriven}
              onChange={handleInputChange}
            />
            <select
              className="mc-form-select"
              name="transmissionType"
              value={formData.transmissionType}
              onChange={handleInputChange}
            >
              <option value="">Select Transmission</option>
              <option value="Manual">Manual</option>
              <option value="Automatic">Automatic</option>
            </select>
          </div>

          <div className="mc-form-actions">
            <button className="mc-form-btn save" onClick={handleSaveCar}>
              Save Car
            </button>
            <button
              className="mc-form-btn cancel"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 📍 Car list mode
  return (
    <div className="mc-section">
      {/* Header */}
      <div className="mc-header">
        <h2 className="mc-title">
          <span className="mc-title-icon">
            <FaCar />
          </span>
          My Cars
        </h2>
      </div>

      {loading ? (
        <div className="mc-loading">
          <div className="mc-spinner"></div>
          <span className="mc-loading-text">Loading cars...</span>
        </div>
      ) : carList.length === 0 ? (
        <div className="mc-empty">
          <img
            src="/assets/img/no-cars.png"
            alt="No Cars"
            className="mc-empty-img"
          />
          <h4>No cars yet</h4>
          <p>Looks like you haven't added any cars yet. Add your first car!</p>
        </div>
      ) : (
        <div className="mc-grid">
          {carList.map((car) => (
            <div key={car.VehicleID} className={`mc-card ${car.IsPrimary ? "primary" : ""}`}>
              <div className="mc-card-header">
                <span
                  className={`mc-primary-badge ${car.IsPrimary ? "active" : "inactive"}`}
                  onClick={() => handleSetPrimary(car.VehicleID)}
                  title="Set as Primary"
                >
                  <FaStar /> Primary
                </span>
                <div className="mc-card-actions">
                  <button
                    className="mc-action-btn view"
                    onClick={() => setViewCar(car)}
                    title="View Details"
                  >
                    <FaEye />
                  </button>
                  <button
                    className="mc-action-btn delete"
                    onClick={() => handleDelete(car.VehicleID)}
                    title="Delete Car"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              <div className="mc-card-body">
                <div className="mc-car-content">
                  <div className="mc-car-image-wrapper">
                    <img
                      src={`${IMAGE_BASE_URL}${car.VehicleImage}`}
                      alt={car.ModelName}
                      className="mc-car-image"
                    />
                    {car.VehicleNumber && (
                      <div className="mc-car-number">{car.VehicleNumber}</div>
                    )}
                  </div>
                  <div className="mc-car-details">
                    <div className="mc-car-brand">{car.BrandName} <span className="mc-car-model">{car.ModelName}</span></div>
                    {/* <div className="mc-car-model">{car.ModelName}</div> */}
                    <div className="mc-car-fuel">
                      <FaGasPump /> {car.FuelTypeName}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showBrandPopup && (
        <BrandPopup
          brands={brands}
          selected={brand}
          onSelect={handleBrandSelect}
          onClose={() => setShowBrandPopup(false)}
        />
      )}
    </div>
  );
};

export default MyCarList;
