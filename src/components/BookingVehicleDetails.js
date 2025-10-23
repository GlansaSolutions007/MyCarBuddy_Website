import React, { useEffect, useState } from "react";
import ChooseCarModal from "./ChooseCarModalGridLayout";
import CryptoJS from "crypto-js";
import axios from "axios";

const BookingVehicleDetails = ({
  vehicle,
  setVehicle,
  registrationNumber,
  setRegistrationNumber,
  allowCarSelection = true,
  formData,
  handlereInputChange,
  setFormData,
}) => {
  const [savedCars, setSavedCars] = useState([]);
  const [errors, setErrors] = useState({}); // ✅ Validation errors
  const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;
  const baseUrl = process.env.REACT_APP_CARBUDDY_BASE_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token || "";

  // Get decrypted customer ID
  let decryptedCustId = null;
  if (user?.id) {
    const bytes = CryptoJS.AES.decrypt(user.id, secretKey);
    decryptedCustId = bytes.toString(CryptoJS.enc.Utf8);
  }

  const fetchSavedCars = async () => {
    if (!decryptedCustId || !token) return;

    try {
      const response = await axios.get(
        `${baseUrl}CustomerVehicles/CustId?CustId=${decryptedCustId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && Array.isArray(response.data)) {
        setSavedCars(response.data);
      }
    } catch (error) {
      console.error("Error fetching saved cars:", error);
    }
  };

  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [showChooseCarModal, setShowChooseCarModal] = useState(false);
  const [isLoadingVehicleData, setIsLoadingVehicleData] = useState(false);
  const [vehicleNumberTimeout, setVehicleNumberTimeout] = useState(null);

  const handleCarSelect = async (e) => {
    const selectedId = e.target.value;
    const selected = savedCars.find((car) => car.VehicleID.toString() === selectedId);
    if (selected) {
      // Immediately update vehicle state with basic info (no logo yet)
      setVehicle({
        brand: { brandName: selected.BrandName, id: selected.BrandID },
        model: {
          modelName: selected.ModelName,
          id: selected.ModelID,
          logo: null // Will be updated when fetched
        },
        fuelType: { fuelTypeName: selected.FuelTypeName, id: selected.FuelTypeID },
      });

      setRegistrationNumber(selected.VehicleNumber);

      // Update formData with all vehicle details immediately
      setFormData((prev) => ({
        ...prev,
        brandID: selected.BrandID,
        modelID: selected.ModelID,
        fuelTypeID: selected.FuelTypeID,
        registrationNumber: selected.VehicleNumber,
        yearOfPurchase: selected.YearOfPurchase,
        engineType: selected.EngineType,
        kilometerDriven: selected.KilometersDriven,
        transmissionType: selected.TransmissionType,
        VehicleID: selected.VehicleID,
      }));

      // Fetch model details to get the logo asynchronously
      setIsLoadingModel(true);
      try {
        const response = await axios.get(
          `${baseUrl}VehicleModels/GetListVehicleModel`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data?.status && Array.isArray(response.data.data)) {
          const modelData = response.data.data.find((m) => m.ModelID === selected.ModelID);
          if (modelData?.VehicleImage) {
            const imageBaseURL = process.env.REACT_APP_CARBUDDY_IMAGE_URL;
            const getImageUrl = (path) => {
              if (!path) return "https://via.placeholder.com/100?text=No+Image";
              return `${imageBaseURL}${path.startsWith("/") ? path.slice(1) : path}`;
            };
            const modelLogo = getImageUrl(modelData.VehicleImage);

            // Update vehicle state with the logo
            setVehicle((prev) => ({
              ...prev,
              model: {
                ...prev.model,
                logo: modelLogo
              }
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching model details:", error);
      } finally {
        setIsLoadingModel(false);
      }
    }
  };

  // ✅ Validation logic
  const validateField = (name, value) => {
    let errorMsg = "";

    if (name === "registrationNumber") {
      if (!/^[A-Z0-9-]{5,15}$/i.test(value)) {
        errorMsg =
          "Registration number must be 5–15 characters (letters, numbers, dashes).";
      }
    } 

    if (name === "yearOfPurchase") {
      const currentYear = new Date().getFullYear();
      if (!/^\d{4}$/.test(value) || value < 1900 || value > currentYear) {
        errorMsg = `Enter a valid year between 1900 and ${currentYear}.`;
      }
    }

    if (name === "kilometerDriven") {
      if (!/^\d+$/.test(value) || parseInt(value) < 0) {
        errorMsg = "Kilometers must be a positive number.";
      }
    }

    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  const handleChangeWithValidation = (e) => {
    const { name, value } = e.target;
    handlereInputChange(e);
    validateField(name, value);
  };

  // Fetch vehicle data by registration number
  const fetchVehicleByNumber = async (vehicleNumber) => {
    if (!vehicleNumber || vehicleNumber.length < 5) return;
    
    setIsLoadingVehicleData(true);
    try {
      const response = await axios.get(
        `${baseUrl}CustomerVehicles/VehicleNumber?VehicleNumber=${encodeURIComponent(vehicleNumber)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && response.data.VehicleID) {
        const vehicleData = response.data;
        
        // Update vehicle state with fetched data
        setVehicle({
          brand: { 
            brandName: vehicleData.BrandName, 
            id: vehicleData.BrandID 
          },
          model: {
            modelName: vehicleData.ModelName,
            id: vehicleData.ModelID,
            logo: null // Will be updated when fetched
          },
          fuelType: { 
            fuelTypeName: vehicleData.FuelTypeName, 
            id: vehicleData.FuelTypeID 
          },
        });

        // Update formData with all vehicle details
        setFormData((prev) => ({
          ...prev,
          brandID: vehicleData.BrandID,
          modelID: vehicleData.ModelID,
          fuelTypeID: vehicleData.FuelTypeID,
          registrationNumber: vehicleData.VehicleNumber,
          yearOfPurchase: vehicleData.YearOfPurchase,
          engineType: vehicleData.EngineType,
          kilometerDriven: vehicleData.KilometersDriven,
          transmissionType: vehicleData.TransmissionType,
          VehicleID: vehicleData.VehicleID,
        }));

        // Fetch model details to get the logo asynchronously
        try {
          const modelResponse = await axios.get(
            `${baseUrl}VehicleModels/GetListVehicleModel`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (modelResponse.data?.status && Array.isArray(modelResponse.data.data)) {
            const modelData = modelResponse.data.data.find((m) => m.ModelID === vehicleData.ModelID);
            if (modelData?.VehicleImage) {
              const imageBaseURL = process.env.REACT_APP_CARBUDDY_IMAGE_URL;
              const getImageUrl = (path) => {
                if (!path) return "https://via.placeholder.com/100?text=No+Image";
                return `${imageBaseURL}${path.startsWith("/") ? path.slice(1) : path}`;
              };
              const modelLogo = getImageUrl(modelData.VehicleImage);

              // Update vehicle state with the logo
              setVehicle((prev) => ({
                ...prev,
                model: {
                  ...prev.model,
                  logo: modelLogo
                }
              }));
            }
          }
        } catch (error) {
          console.error("Error fetching model details:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching vehicle data:", error);
      // Reset vehicle data if API call fails
      setVehicle({
        brand: { brandName: "", id: "" },
        model: { modelName: "", id: "", logo: null },
        fuelType: { fuelTypeName: "", id: "" },
      });
    } finally {
      setIsLoadingVehicleData(false);
    }
  };

  // Debounced vehicle number change handler
  const handleVehicleNumberChange = (e) => {
    const { value } = e.target;
    const upperValue = value.toUpperCase();
    
    // Update the input value immediately
    handleChangeWithValidation({
      target: { name: "registrationNumber", value: upperValue },
    });

    // Clear existing timeout
    if (vehicleNumberTimeout) {
      clearTimeout(vehicleNumberTimeout);
    }

    // Set new timeout for API call
    const timeoutId = setTimeout(() => {
      if (upperValue && upperValue.length >= 5) {
        fetchVehicleByNumber(upperValue);
      }
    }, 500);

    setVehicleNumberTimeout(timeoutId);
  };

  useEffect(() => {
    fetchSavedCars();
    
    // Load selectedCarDetails from localStorage and display the vehicle image
    const selectedCarDetails = localStorage.getItem("selectedCarDetails");
    if (selectedCarDetails) {
      try {
        const carData = JSON.parse(selectedCarDetails);
        if (carData.brand && carData.model) {
          // Update the vehicle state with the selected car details
          setVehicle({
            brand: {
              id: carData.brand.id,
              brandName: carData.brand.name,
              logo: carData.brand.logo
            },
            model: {
              id: carData.model.id,
              modelName: carData.model.name,
              logo: carData.model.logo
            },
            fuelType: {
              id: carData.fuel.id,
              fuelTypeName: carData.fuel.name,
              logo: carData.fuel.logo
            }
          });
        }
      } catch (error) {
        console.error("Error parsing selectedCarDetails:", error);
      }
    }

    // Cleanup timeout on unmount
    return () => {
      if (vehicleNumberTimeout) {
        clearTimeout(vehicleNumberTimeout);
      }
    };
  }, [vehicleNumberTimeout]);

  if (!vehicle) return null;

  return (
    <div className="card shadow-sm p-4 mb-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="mb-0 text-primary fw-bold">🚗 Vehicle Information</h5>
        {allowCarSelection && (
          <button
            type="button"
            className="btn btn-outline-primary px-3 py-1"
            onClick={() => setShowChooseCarModal(true)}
            title="Add or Choose Car"
          >
            <i className="bi bi-plus-circle me-1"></i> Choose Car
          </button>
        )}
      </div>

      {allowCarSelection && savedCars.length > 0 && (
        <div className="mb-3">
          {/* <label className="form-label fw-semibold">Choose from Saved Cars</label>
          <select
            className="form-select"
            onChange={handleCarSelect}
            defaultValue=""
          >
            <option value="" disabled>
              -- Select a Saved Car --
            </option>
            {savedCars.map((car) => (
              <option key={car.VehicleID} value={car.VehicleID}>
                {car.BrandName} - {car.ModelName} ({car.VehicleNumber})
              </option>
            ))}
          </select> */}
        </div>
      )}

      <div className="row">
        <div className="col-md-8 mb-3">
          <div className="row">
            {/* Registration Number */}
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">
                Registration Number
              </label>
              <div className="position-relative">
                <input
                  type="text"
                  name="registrationNumber"
                  className={`form-control ${
                    errors.registrationNumber ? "is-invalid" : ""
                  }`}
                  placeholder="Enter Registration Number"
                  value={formData.registrationNumber || registrationNumber || ""}
                  onChange={handleVehicleNumberChange}
                  style={{ textTransform: "uppercase" }}
                  readOnly={true}
                />
                {isLoadingVehicleData && (
                  <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                )}
              </div>
              {errors.registrationNumber && (
                <div className="invalid-feedback">{errors.registrationNumber}</div>
              )}
            </div>

            {/* Year of Purchase */}
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">
                Year of Purchase
              </label>
              <input
                type="text"
                name="yearOfPurchase"
                className={`form-control ${errors.yearOfPurchase ? "is-invalid" : ""}`}
                placeholder="e.g., 2020"
                value={formData.yearOfPurchase}
                onChange={handleChangeWithValidation}
                readOnly={true}
              />
              {errors.yearOfPurchase && (
                <div className="invalid-feedback">{errors.yearOfPurchase}</div>
              )}
            </div>

            {/* Engine Type */}
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Engine Type</label>
              <input
                type="text"
                name="engineType"
                className="form-control"
                placeholder="e.g., VVT"
                value={formData.engineType}
                onChange={handlereInputChange}
                readOnly={true}
              />
            </div>

            {/* Kilometer Driven */}
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Kilometer Driven</label>
              <input
                type="text"
                name="kilometerDriven"
                className={`form-control ${
                  errors.kilometerDriven ? "is-invalid" : ""
                }`}
                placeholder="e.g., 25000"
                value={formData.kilometerDriven}
                onChange={handleChangeWithValidation}
                readOnly={true}
              />
              {errors.kilometerDriven && (
                <div className="invalid-feedback">{errors.kilometerDriven}</div>
              )}
            </div>

            {/* Transmission */}
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Transmission Type</label>
              <select
                name="transmissionType"
                className="form-select"
                value={formData.transmissionType}
                onChange={handlereInputChange}
                disabled={true}
              >
                <option value="">Select</option>
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Side: Car Image */}
        <div className="col-md-4 mb-3">
          <input type="hidden" name="brandID" value={vehicle.brand?.id || ""} />
          <input type="hidden" name="modelID" value={vehicle.model?.id || ""} />
          <input
            type="hidden"
            name="fuelTypeID"
            value={vehicle.fuelType?.id || ""}
          />

          {isLoadingModel ? (
            // Loading skeleton
            <div
              style={{
                width: 150,
                height: 150,
                backgroundColor: "#f0f0f0",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            >
              <div style={{ color: "#999", fontSize: "14px" }}>Loading...</div>
            </div>
          ) : vehicle.model?.logo ? (
            <>
              {/* Brand Logo */}
              {vehicle.brand?.logo && (
                <div style={{ marginBottom: "10px", textAlign: "center" }}>
                  <img
                    src={vehicle.brand.logo}
                    alt={vehicle.brand.brandName}
                    style={{
                      width: 40,
                      height: 40,
                      objectFit: "contain",
                      backgroundColor: "#fff",
                      borderRadius: "4px",
                      padding: "5px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  />
                </div>
              )}
              
              {/* Vehicle Model Image */}
              <img
                src={vehicle.model.logo}
                alt={vehicle.model.modelName}
                style={{
                  width: 150,
                  height: 120,
                  objectFit: "contain",
                  backgroundColor: "#fff",
                  borderRadius: "8px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginTop: "10px",
                  textAlign: "center",
                }}
              >
                <small style={{ fontSize: "12px", color: "#555" }}>
                  {vehicle.brand?.brandName}
                </small>
                <strong style={{ fontSize: "14px", color: "#333" }}>
                  {vehicle.model?.modelName}
                </strong>
              </div>
            </>
          ) : vehicle.model?.modelName ? (
            // Show car info without image
            <div
              style={{
                width: 150,
                height: 150,
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: "2px dashed #dee2e6",
                textAlign: "center",
                padding: "10px",
              }}
            >
              {/* Brand Logo if available */}
              {vehicle.brand?.logo && (
                <img
                  src={vehicle.brand.logo}
                  alt={vehicle.brand.brandName}
                  style={{
                    width: 30,
                    height: 30,
                    objectFit: "contain",
                    marginBottom: "8px",
                  }}
                />
              )}
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>🚗</div>
              <small style={{ fontSize: "12px", color: "#555" }}>
                {vehicle.brand?.brandName}
              </small>
              <strong style={{ fontSize: "14px", color: "#333" }}>
                {vehicle.model?.modelName}
              </strong>
            </div>
          ) : (
            <div
              style={{
                width: 150,
                height: 150,
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px dashed #dee2e6",
              }}
            >
              <span style={{ color: "#6c757d", fontSize: "14px" }}>
                Choose Your Car
              </span>
            </div>
          )}
        </div>
      </div>
      {/* Choose Car Modal */}
      <ChooseCarModal
        isVisible={showChooseCarModal}
        onClose={() => setShowChooseCarModal(false)}
        onCarSaved={(car) => {
          try {
            if (car) {
              localStorage.setItem("selectedCarDetails", JSON.stringify(car));
              setVehicle({
                brand: { id: car.brand?.id, brandName: car.brand?.name, logo: car.brand?.logo },
                model: { id: car.model?.id, modelName: car.model?.name, logo: car.model?.logo },
                fuelType: { id: car.fuel?.id, fuelTypeName: car.fuel?.name, logo: car.fuel?.logo },
              });
              setFormData((prev) => ({
                ...prev,
                brandID: car.brand?.id || prev.brandID,
                modelID: car.model?.id || prev.modelID,
                fuelTypeID: car.fuel?.id || prev.fuelTypeID,
                VehicleID: car.VehicleID || prev.VehicleID,
              }));
            }
          } catch (_) {}
          setShowChooseCarModal(false);
        }}
      />
    </div>
  );
};

export default BookingVehicleDetails;
