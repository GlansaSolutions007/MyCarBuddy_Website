import React, { useEffect, useRef, useState } from "react";
import "./ChooseCarModal.css";
import BrandPopup from "./BrandPopup"; // new popup component
import ModelPopup from "./ModelPopup";
import axios from "axios";

const ChooseCarModal = ({ isVisible, onClose, onCarSaved }) => {
	const BASE_URL = process.env.REACT_APP_CARBUDDY_BASE_URL;
	const [selectionMethod, setSelectionMethod] = useState("manual"); // default manual
	const [registrationNumber, setRegistrationNumber] = useState("");
	const [carType, setCarType] = useState("");
	const [brand, setBrand] = useState(null);
	const [brands, setBrands] = useState([]);
	const [models, setModels] = useState([]);
	const [fuels, setFuels] = useState([]);
	const [model, setModel] = useState("");
	const [fuel, setFuel] = useState("");
	const [showBrandPopup, setShowBrandPopup] = useState(false);
	const [showModelPopup, setShowModelPopup] = useState(false);
	const [loadingBrands, setLoadingBrands] = useState(true);
	const [loadingModels, setLoadingModels] = useState(false);
	const modalRef = useRef();
	const imageBaseURL = process.env.REACT_APP_CARBUDDY_IMAGE_URL;
	const BaseURL = process.env.REACT_APP_CARBUDDY_BASE_URL;

	useEffect(() => {
		const fetchBrands = async () => {
			setLoadingBrands(true);
			try {
				const token = JSON.parse(localStorage.getItem("user"))?.token;
				const response = await axios.get(`${BASE_URL}VehicleBrands/GetVehicleBrands`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});
				if (response.data?.status && Array.isArray(response.data.data)) {
					const formattedBrands = response.data.data
						.filter((b) => b.IsActive === true)
						.map((b) => ({
							id: b.BrandID,
							name: b.BrandName,
							logo: `${imageBaseURL}${b.BrandLogo.startsWith("/") ? b.BrandLogo.slice(1) : b.BrandLogo}`,
						}));
					// console.log("Formatted brands:", formattedBrands);
					setBrands(formattedBrands);
				}
			} catch (err) {
				console.error("Failed to fetch brands", err);
			} finally {
				setLoadingBrands(false);
			}
		};

		fetchBrands();
		fetchFuels();
	}, []);

	const fetchModels = async (brandId) => {
		setLoadingModels(true);
		try {
			const token = JSON.parse(localStorage.getItem("user"))?.token;
			const response = await axios.get(`${BASE_URL}VehicleModels/BrandId?brandid=${brandId}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			console.log("Raw models data:", response.data);

			if (Array.isArray(response.data)) {
				console.log("Raw models data:", response.data);
				const getImageUrl = (path) => {
					if (!path) return "https://via.placeholder.com/100?text=No+Image";
					const fileName = path.split("/").pop();
					return `${imageBaseURL}${path.startsWith("/") ? path.slice(1) : path}`;
				};
				const filteredModels = response.data
					.filter((m) => m.BrandID === brandId && m.IsActive)
					.map((m) => ({
						id: m.ModelID,
						name: m.ModelName,
						logo: getImageUrl(m.VehicleImage), // Use the full valid image URL
					}));

				setModels(filteredModels);
			} else {
				setModels([]);
				console.error("Error fetching models:", response.data);
			}
		} catch (error) {
			console.error("Error fetching models:", error);
		} finally {
			setLoadingModels(false);
		}
	};

	const fetchFuels = async () => {
		try {
			const token = JSON.parse(localStorage.getItem("user"))?.token;
			const res = await axios.get(`${BASE_URL}FuelTypes/GetFuelTypes`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (res.data?.status && Array.isArray(res.data.data)) {
				const formatted = res.data.data
					.filter((f) => f.IsActive)
					.map((f) => {
						const fileName = f.FuelImage?.split("/").pop();
						const encodedFileName = encodeURIComponent(fileName);
						const imageUrl = `${imageBaseURL}${f.FuelImage}`;

						return {
							id: f.FuelTypeID,
							name: f.FuelTypeName,
							image: imageUrl,
						};
					});
				setFuels(formatted);
			}
		} catch (err) {
			console.error("Failed to fetch fuels", err);
		}
	};

	const handleSubmit = (e) => {
		e.preventDefault();

		if (!brand || !model || !fuel) {
			alert("Please select brand, model, and fuel type.");
			return;
		}

		const selectedCarDetails = {
			brand: brands.find((b) => b.id === brand),
			model: models.find((m) => m.id === model),
			fuel: fuels.find((f) => f.id === fuel),
		};

		localStorage.setItem("selectedCarDetails", JSON.stringify(selectedCarDetails));

		const user = JSON.parse(localStorage.getItem("user"));
		if (user?.identifier) {
			const userCarKey = `selectedCar_${user.identifier}`;
			localStorage.setItem(userCarKey, JSON.stringify(selectedCarDetails));
		}
		if (onCarSaved) {
			onCarSaved(selectedCarDetails);
		}
		// localStorage.removeItem("cartItems");
		window.location.reload();

		setTimeout(() => {
			window.location.reload();
		}, 500);

		console.log("Saved Car:", selectedCarDetails);

		// onClose();
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

	const handleModelSelect = (id) => {
		setModel(id);
		setShowModelPopup(false);
	};

	return (
		<div className={`choose-car-modal ${isVisible ? "visible" : "hidden"}`}>
			<div className="modal-content" ref={modalRef}>
				<button className="modal-close" onClick={onClose}>
					×
				</button>
				<h6>Select Your Car Type</h6>
				{/* Dropdown */}
				<div className="mb-4 d-none">
					<select className="form-select" value={selectionMethod} onChange={(e) => setSelectionMethod(e.target.value)}>
						<option value="registration">Registration Number</option>
						<option value="manual">Manual Selection</option>
					</select>
				</div>

				<form onSubmit={handleSubmit}>
					{selectionMethod === "registration" ? (
						<div className="mb-4">
							<label className="form-label">Enter Vehicle Registration Number</label>
							<input
								type="text"
								className="form-control"
								value={registrationNumber}
								onChange={(e) => setRegistrationNumber(e.target.value)}
								placeholder="e.g. MH12AB123456"
							/>
						</div>
					) : (
						<>
            <div className="mb-4">
						<label className="form-label">Choose Brand & Model</label>
						<div className="d-flex gap-3 flex-wrap justify-content-center">
							{/* Brand Card */}
							<div
								onClick={() => {
									if (!loadingBrands) setShowBrandPopup(true);
								}}
								className={`rounded shadow-sm text-center p-3 car-box ${
									brand ? "border-primary border-2" : "border"
								} bg-white hover-shadow`}
								style={{
									width: 120,
									height: 120,
									cursor: loadingBrands ? "not-allowed" : "pointer",
									transition: "0.3s",
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									justifyContent: "center",
									opacity: loadingBrands ? 0.6 : 1,
								}}
							>
								<div className="fw-semibold small mb-2 text-dark">Brand</div>
								{loadingBrands ? (
									<div
										className="skeleton-loader"
										style={{
											width: 70,
											height: 70,
											backgroundColor: "#e0e0e0",
											borderRadius: "4px",
											animation: "pulse 1.5s ease-in-out infinite",
										}}
									></div>
								) : brand ? (
									<img
										src={brands.find((b) => b.id === brand)?.logo}
										alt="Brand Logo"
										style={{ width: 70, height: 70, objectFit: "contain" }}
									/>
								) : (
									<div className="text-muted small">Choose</div>
								)}
							</div>

							{/* Model Card */}
							<div
								onClick={() => {
									if (!loadingModels && brand) setShowModelPopup(true);
								}}
								className={`rounded shadow-sm text-center p-3 car-box ${
									model ? "border-primary border-2" : "border"
								} bg-white hover-shadow`}
								style={{
									width: 120,
									height: 120,
									cursor: loadingModels || !brand ? "not-allowed" : "pointer",
									opacity: loadingModels || !brand ? 0.6 : 1,
									transition: "0.3s",
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<div className="fw-semibold small mb-2 text-dark">Model</div>
								{loadingModels ? (
									<div
										className="skeleton-loader"
										style={{
											width: 70,
											height: 70,
											backgroundColor: "#e0e0e0",
											borderRadius: "4px",
											animation: "pulse 1.5s ease-in-out infinite",
										}}
									></div>
								) : model ? (
									<img
										src={models.find((m) => m.id === model)?.logo}
										alt="Model Image"
										style={{ width: 70, height: 70, objectFit: "contain" }}
									/>
								) : (
									<div className="text-muted small">Choose</div>
								)}
							</div>
						</div>

						{/* Chosen result display */}
						{(brand || model) && (
							<div className="mt-3 px-2 py-1 bg-white rounded shadow-sm text-center small fw-bold text-secondary">
								{brand && brands.find((b) => b.id === brand)?.name}
								{brand && model && " - "}
								{model && models.find((m) => m.id === model)?.name}
							</div>
						)}
					</div>
            </>
					)}

					

					{/* Fuel Type Section (unchanged) */}
					{model && (
						<div className="mb-4">
							<label className="form-label">Fuel Type</label>
							<div className="d-flex gap-3 flex-wrap justify-content-center">
								{fuels.map((f) => (
									<div
										key={f.id}
										className={`text-center px-2 py-2 border rounded shadow-sm ${
											fuel === f.id ? "border-primary" : ""
										}`}
										style={{ cursor: "pointer", width: 100 }}
										onClick={() => setFuel(f.id)}
									>
										<img src={f.image} alt={f.name} style={{ width: "40px", height: "40px", objectFit: "contain" }} />
										<small className="d-block mt-1">{f.name}</small>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Buttons */}
					<div className="d-flex justify-content-center gap-2">
						<button type="button" className="btn btn-light py-2 px-4" onClick={onClose}>
							Cancel
						</button>
						<button type="submit" className="btn btn-primary py-2 px-4">
							Save
						</button>
					</div>
				</form>
			</div>

			{showBrandPopup && (
				<BrandPopup
					brands={brands}
					selected={brand}
					onSelect={handleBrandSelect}
					onClose={() => setShowBrandPopup(false)}
				/>
			)}

			{showModelPopup && (
				<ModelPopup
					models={models}
					selected={model}
					onSelect={handleModelSelect}
					onClose={() => setShowModelPopup(false)}
					loading={loadingModels}
				/>
			)}
		</div>
	);
};

export default ChooseCarModal;
