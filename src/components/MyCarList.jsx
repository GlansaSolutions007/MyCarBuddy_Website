import React, { useEffect, useRef, useState } from "react";
import Car from "../images/car.avif";
import axios from "axios";
import BrandPopup from "./BrandPopup";
import CryptoJS from "crypto-js";
import { useAlert } from "../context/AlertContext";
import Swal from "sweetalert2";

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
      <div className="container py-4">
        <div className="card p-4 shadow-sm">
          <div className="d-flex justify-content-end mb-4">
            <button
              className="btn btn-primary mb-3 px-3 py-2"
              onClick={() => setViewCar(null)}
            >
              <i className="bi bi-arrow-left" />
            </button>
          </div>
          <div className="text-center mb-3">
            <div className="d-flex justify-content-center gap-4">
              <div className="">
                <img
                  src={`${IMAGE_BASE_URL}${viewCar.VehicleImage}`}
                  alt={viewCar.ModelName}
                  className="img-fluid rounded"
                  style={{ maxWidth: "180px", objectFit: "contain" }}
                />
                <h5 className="text-center">{viewCar.ModelName}</h5>
                <div className="d-flex justify-content-center align-items-center gap-2">
                  <img
                    src={`${IMAGE_BASE_URL}${viewCar.FuelImage}`}
                    alt={viewCar.FuelTypeName}
                    className="img-fluid rounded"
                    style={{ maxWidth: "20px", objectFit: "contain" }}
                  />
                  <h5 className="text-center mb-0">{viewCar.FuelTypeName}</h5>
                </div>
              </div>

              <div>
                <ul className="list-group list-group-flush mt-3">
                  <li className="list-group-item">
                    <strong>Vehicle No:</strong> {viewCar.VehicleNumber}
                  </li>

                  <li className="list-group-item">
                    <strong>Engine Type:</strong> {viewCar.EngineType}
                  </li>
                  <li className="list-group-item">
                    <strong>Transmission:</strong> {viewCar.TransmissionType}
                  </li>
                  <li className="list-group-item">
                    <strong>Kilometers Driven:</strong>{" "}
                    {viewCar.KilometersDriven}
                  </li>
                  <li className="list-group-item">
                    <strong>Year of Purchase:</strong> {viewCar.YearOfPurchase}
                  </li>
                </ul>
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
      <div className="container py-4">
        <h4 className="fw-bold mb-4">Add New Car</h4>

        <div className="row g-3">
          {/* all input fields same as before */}

          <div
            onClick={() => {
              setShowBrandPopup(true);
            }}
            className={`rounded shadow-sm text-center p-3 car-box ${
              brand ? "border-primary border-2" : "border"
            } bg-white hover-shadow`}
            style={{
              width: 120,
              height: 120,
              cursor: "pointer",
              transition: "0.3s",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div className="fw-semibold small mb-2 text-dark">Brand</div>
            {brand ? (
              <img
                src={brands.find((b) => b.id === brand)?.logo}
                alt="Brand Logo"
                style={{ width: 70, height: 70, objectFit: "contain" }}
              />
            ) : (
              <div className="text-muted small">Choose</div>
            )}
          </div>

          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Brand ID"
              name="brandID"
              value={formData.brandID}
              onChange={handleInputChange}
            />
          </div>
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Model ID"
              name="modelID"
              value={formData.modelID}
              onChange={handleInputChange}
            />
          </div>
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Fuel Type ID"
              name="fuelTypeID"
              value={formData.fuelTypeID}
              onChange={handleInputChange}
            />
          </div>
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Registration Number"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleInputChange}
            />
          </div>
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Year of Purchase"
              name="yearOfPurchase"
              value={formData.yearOfPurchase}
              onChange={handleInputChange}
            />
          </div>
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Engine Type"
              name="engineType"
              value={formData.engineType}
              onChange={handleInputChange}
            />
          </div>
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Kilometers Driven"
              name="kilometerDriven"
              value={formData.kilometerDriven}
              onChange={handleInputChange}
            />
          </div>
          <div className="col-md-6">
            <select
              className="form-select"
              name="transmissionType"
              value={formData.transmissionType}
              onChange={handleInputChange}
            >
              <option value="">Select Transmission</option>
              <option value="Manual">Manual</option>
              <option value="Automatic">Automatic</option>
            </select>
          </div>
        </div>
        <div className="mt-4 d-flex gap-3 justify-content-center">
          <button className="btn btn-success px-4 py-2" onClick={handleSaveCar}>
            Save
          </button>
          <button
            className="btn btn-secondary px-4 py-2"
            onClick={() => setShowAddForm(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // 📍 Car list mode
  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold">My Cars</h4>
        {/* <button className="btn btn-outline-primary d-flex align-items-center gap-2 px-3 py-2" onClick={() => setShowAddForm(true)}>
          <i className="bi bi-plus-circle" />
        </button> */}
      </div>

      <div className="row g-4">
        {carList.map((car) => {
          const isPrimary = car.VehicleID === primaryCarId;

          return (
            <div className="col-md-6 mb-4" key={car.VehicleID}>
              <div
                className={`card h-100 shadow-sm border-0 rounded-3 ${
                  car.IsPrimary ? "border border-success" : ""
                }`}
              >
                <div className="card-body p-3 d-flex flex-column">
                  {/* Primary Tag */}
                  <div
                    className="d-flex justify-content-end"
                    onClick={() => handleSetPrimary(car.VehicleID)}
                    style={{
                      lineHeight: "1.5",
                      fontSize: "13px",
                      cursor: "pointer",
                      position: "relative",
                      zIndex: 99,
                    }}
                  >
                    {/* <i className={`bi ${isPrimary ? "bi-star-fill text-warning" : "bi-star"} fs-5 cursor-pointer`} title="Toggle Primary" role="button"  /> */}
                    <span
                      className={`${
                        car.IsPrimary
                          ? "tab-pill tab-green text-white"
                          : "tab-pill "
                      }  px-2 py-0`}
                    >
                      Primary
                    </span>
                  </div>

                  {/* Vehicle Details */}
                  <div className="row g-3">
                    {/* Vehicle Image */}
                    <div className="col-md-7 text-center">
                      <img
                        src={`${IMAGE_BASE_URL}${car.VehicleImage}`}
                        alt={car.ModelName}
                        className="img-fluid rounded"
                        style={{ maxHeight: "120px", objectFit: "cover" }}
                      />
                      <div className="mt-2">
                        <span className="text-muted border-car py-1 px-2">
                          {car.VehicleNumber}
                        </span>
                      </div>
                    </div>

                    {/* Vehicle Info */}
                    <div className="col-md-5 d-flex flex-column justify-content-between">
                      <div>
                        <p className="text-dark fw-semibold mb-1 mt-3">
                          {car.BrandName}
                        </p>
                        <p className="text-dark fw-semibold mb-1">
                          {car.ModelName}
                        </p>
                        <p className="text-muted small mb-1">
                          {car.FuelTypeName}
                        </p>
                      </div>

                      <div className="text-end">
                        <i
                          className="bi bi-eye text-primary fs-5 me-2 cursor-pointer"
                          title="View"
                          role="button"
                          onClick={() => setViewCar(car)}
                        />
                        <i
                          className="bi bi-trash text-danger fs-5 cursor-pointer"
                          title="Delete"
                          role="button"
                          onClick={() => handleDelete(car.VehicleID)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    {loading ? (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading cars...</p>
      </div>
    ) : (
      carList.length === 0 && (
        <div className="text-center py-5">
          <img
            src="/assets/img/no-cars.png"
            alt="No Cars"
            style={{ maxWidth: "500px", marginBottom: "20px" }}
          />
          <h4>No cars yet</h4>
          <p>Looks like you haven't added any cars yet. Add your first car!</p>
        </div>
      )
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
