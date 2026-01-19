import React, { useEffect, useRef, useState } from "react";
import "./ChooseCarModal.css";
import BrandPopup from "./BrandPopup"; // new popup component
import ModelPopup from "./ModelPopup";
import FuelPopup from "./FuelPopup";
import axios from "axios";
import Swal from "sweetalert2";
import CryptoJS from "crypto-js";
import { useAlert } from "../context/AlertContext";
import { v4 as uuidv4 } from "uuid";

const validateVehicleNumber = (number) => {
    const cleaned = (number || "").toUpperCase().trim();
    const regex = /^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{6,15}$/;
    return regex.test(cleaned);
};

const ChooseCarModal = ({ isVisible, onClose, onCarSaved }) => {
	// Alert API (optional)
	const { showAlert } = useAlert();
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
	const [showFuelPopup, setShowFuelPopup] = useState(false);
	const [loadingBrands, setLoadingBrands] = useState(true);
	const [loadingModels, setLoadingModels] = useState(false);
	const modalRef = useRef();
	const imageBaseURL = process.env.REACT_APP_CARBUDDY_IMAGE_URL;
	const BaseURL = process.env.REACT_APP_CARBUDDY_BASE_URL;
    const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;

    // Auth state (inline OTP login when not logged in)
    const [identifier, setIdentifier] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [timer, setTimer] = useState(0);
    const [otpExpired, setOtpExpired] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(!!JSON.parse(localStorage.getItem("user"))?.token);
    const regCheckTimeoutRef = useRef(null);
    const [savedVehicles, setSavedVehicles] = useState([]);
    const [loadingSavedVehicles, setLoadingSavedVehicles] = useState(false);
    const [selectedSavedVehicleId, setSelectedSavedVehicleId] = useState("");
    const [isLoadingVehicleData, setIsLoadingVehicleData] = useState(false);
    const [vehicleNumberTimeout, setVehicleNumberTimeout] = useState(null);

	// Vehicle detail form data
	const [formData, setFormData] = useState({
		registrationNumber: "",
		yearOfPurchase: "",
		engineType: "",
		kilometerDriven: "",
		transmissionType: "",
		brandID: "",
		modelID: "",
		fuelTypeID: "",
	});

		// Validation states
    const [yearError, setYearError] = useState(false);
	const [regError, setRegError] = useState(false);
	const [regMessage, setRegMessage] = useState("");

	// Bind IDs on selection
	useEffect(() => {
		setFormData((prev) => ({
			...prev,
			brandID: brand || "",
			modelID: model || "",
			fuelTypeID: fuel || "",
		}));
	}, [brand, model, fuel]);

	// Reset modal form when it is opened from header
	useEffect(() => {
		if (!isVisible) return;
		try {
			setSelectionMethod("manual");
			setBrand(null);
			setModel("");
			setFuel("");
			setRegistrationNumber("");
			setFormData({
				registrationNumber: "",
				yearOfPurchase: "",
				engineType: "",
				kilometerDriven: "",
				transmissionType: "",
				brandID: "",
				modelID: "",
				fuelTypeID: "",
			});
		} catch (_) { /* no-op */ }
	}, [isVisible]);

    // OTP countdown
    useEffect(() => {
        let interval;
        if (otpSent && timer > 0) {
            interval = setInterval(() => setTimer((t) => t - 1), 1000);
        } else if (otpSent && timer === 0) {
            setOtpExpired(true);
        }
        return () => clearInterval(interval);
    }, [otpSent, timer]);

    // Monitor login status changes
    useEffect(() => {
        const checkLoginStatus = () => {
            const user = JSON.parse(localStorage.getItem("user"));
            setIsLoggedIn(!!user?.token);
        };

        // Check on mount
        checkLoginStatus();

        // Listen for user profile updates
        window.addEventListener("userProfileUpdated", checkLoginStatus);
        
        return () => {
            window.removeEventListener("userProfileUpdated", checkLoginStatus);
        };
    }, []);

    const getDeviceId = () => {
        let deviceId = localStorage.getItem("deviceId");
        if (!deviceId) {
            deviceId = uuidv4();
            localStorage.setItem("deviceId", deviceId);
        }
        return deviceId;
    };

    const handleSendOTP = async (e) => {
        e?.preventDefault?.();
        const sanitized = (identifier || "").replace(/\D/g, "");
        if (!/^\d{10}$/.test(sanitized)) {
            showAlert && showAlert("Enter a valid 10-digit mobile number.", "warning");
            setOtpSent(false);
            return;
        }
        setLoginLoading(true);
        try {
            await axios.post(`${BaseURL}Auth/send-otp`, { loginId: sanitized });
            setOtpSent(true);
            setOtpExpired(false);
            setTimer(60);
        } catch (error) {
            console.error("Error sending OTP:", error);
            showAlert && showAlert("Failed to send OTP. Please try again.");
        } finally {
            setLoginLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e?.preventDefault?.();
        const sanitized = (identifier || "").replace(/\D/g, "");
        if (!/^\d{10}$/.test(sanitized)) {
            showAlert && showAlert("Enter a valid 10-digit mobile number.", "warning");
            return;
        }
        const deviceId = getDeviceId();
        setLoginLoading(true);
        try {
            const response = await axios.post(`${BaseURL}Auth/verify-otp`, {
                loginId: sanitized,
                otp,
                deviceToken: "web-token",
                deviceId,
            });

            localStorage.setItem(
                "user",
                JSON.stringify({
                    id: CryptoJS.AES.encrypt(response.data?.custID?.toString() || "", secretKey).toString(),
                    name: response.data?.name || "GUEST",
                    token: response.data?.token,
                    profileImage: response?.data?.profileImage,
                })
            );
            setIsLoggedIn(true);
            setOtpSent(false);
            setIdentifier("");
            setOtp("");
            // showAlert && showAlert("Signed in successfully", "success");
            
            // Dispatch event to update header
            window.dispatchEvent(new CustomEvent("userProfileUpdated"));
        } catch (error) {
            console.error("Error verifying OTP:", error);
            showAlert && showAlert("Invalid OTP. Please try again.", "error");
        } finally {
            setLoginLoading(false);
        }
    };

    const getDecryptedCustAuth = () => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.token || !user?.id) return { custId: null, token: null };
        try {
            const bytes = CryptoJS.AES.decrypt(user.id, secretKey);
            const decryptedCustId = bytes.toString(CryptoJS.enc.Utf8);
            return { custId: decryptedCustId, token: user.token };
        } catch (_) {
            return { custId: null, token: null };
        }
    };

    const checkVehicleExists = async (vehicleNumberUpper) => {
        const { custId, token } = getDecryptedCustAuth();
        if (!custId || !token || !vehicleNumberUpper) return;
        try {
            const res = await axios.get(
                `${BaseURL}CustomerVehicles/CustId?vehicleNumber=${encodeURIComponent(vehicleNumberUpper)}&custId=${encodeURIComponent(custId)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = res?.data;
            const exists = Array.isArray(data) ? data.length > 0 : (data?.status === true && (Array.isArray(data?.data) ? data.data.length > 0 : !!data?.vehicleID));
            if (exists) {
                Swal.fire({
                    title: 'Already Exists',
                    text: 'This vehicle is already saved. Please select it from your saved cars.',
                    icon: 'info',
                    confirmButtonText: 'OK'
                });
            }
        } catch (err) {
            // Silent fail; do not block user typing
            console.warn('Vehicle check failed', err?.response?.data || err?.message);
        }
    };

    // Fetch vehicle data by registration number
    const fetchVehicleByNumber = async (vehicleNumber) => {
		const { custId, token } = getDecryptedCustAuth();
        if (!vehicleNumber || vehicleNumber.length < 5) return;
        
        setIsLoadingVehicleData(true);
        try {
            const response = await axios.get(
                `${BaseURL}CustomerVehicles/VehicleNumber?VehicleNumber=${encodeURIComponent(vehicleNumber)}&CustId=${encodeURIComponent(custId)}`
            );

            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                const vehicleData = response.data[0];
				
                
                // Update form data with fetched vehicle information
                setFormData(prev => ({
                    ...prev,
                    registrationNumber: vehicleData.VehicleNumber,
                    yearOfPurchase: vehicleData.YearOfPurchase,
                    engineType: vehicleData.EngineType || "",
                    kilometerDriven: vehicleData.KilometersDriven || "",
                    transmissionType: vehicleData.TransmissionType || "",
					fuelTypeID: vehicleData.FuelTypeID,
                }));

                // Update brand, model, and fuel selections
                if (vehicleData.BrandID) {
                    setBrand(vehicleData.BrandID);
                    
                    // Fetch models for the brand to get the updated list
                    const loadedModels = await fetchModels(vehicleData.BrandID);
                    
                    // Update model selection
                    if (vehicleData.ModelID) {
                        setModel(vehicleData.ModelID);
                        
                        // Update the models state to include the vehicle image from API
                        if (vehicleData.VehicleImage && Array.isArray(loadedModels)) {
                            const updatedModels = loadedModels.map(model => {
                                if (model.id === vehicleData.ModelID) {
                                    return {
                                        ...model,
                                        logo: `${imageBaseURL}${vehicleData.VehicleImage.startsWith("/") ? vehicleData.VehicleImage.slice(1) : vehicleData.VehicleImage}`
                                    };
                                }
                                return model;
                            });
                            setModels(updatedModels);
                        }
                    }
                }
                
                if (vehicleData.FuelTypeID) {
                    // Ensure fuels are loaded before setting fuel
                    if (fuels.length === 0) {
                        await fetchFuels();
                    }
                    
                    // Convert to number to ensure type matching
                    const fuelId = Number(vehicleData.FuelTypeID);
                    setFuel(fuelId);
                    
                    console.log("Setting fuel ID:", fuelId, "Fuel name:", vehicleData.FuelTypeName);
                    console.log("Available fuels:", fuels);
                    console.log("Matching fuel:", fuels.find(f => f.id === fuelId));
                }

                // Show success message
                Swal.fire({
                    title: 'Vehicle Found!',
                    text: `Found ${vehicleData.BrandName} ${vehicleData.ModelName} - ${vehicleData.FuelTypeName}`,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });
            }
			else{

				if(response?.message === 'You have already added this vehicle.'){
					Swal.fire({
						title: 'Already Exists',
						text: 'This vehicle is already saved. Please select it from your saved cars.',
						icon: 'info',
						confirmButtonText: 'OK'
					});
				}
				else{
					Swal.fire({
						title: 'Error',
						text: response.data.message,
						icon: 'error',
						timer: 2000,
					});
				}
			}
        } catch (error) {
            console.error("Error fetching vehicle data:", error);
			// Swal.fire({
			// 	title: 'Error',
			// 	text: error.response.data.message,
			// 	icon: 'error',
			// 	timer: 2000,
			// 	showConfirmButton: false,
			// 	toast: true,
			// 	position: 'top-end'
			// });

            // Don't show error to user as this is optional functionality
        } finally {
            setIsLoadingVehicleData(false);
        }
    };

    // Debounced vehicle number change handler
    const handleVehicleNumberChange = (e) => {
        const { value } = e.target;
        const upperValue = value.toUpperCase();
        
        // Update the input value immediately
        setFormData((p) => ({ ...p, registrationNumber: upperValue }));

         // Validate registration number
         const isValid = validateVehicleNumber(upperValue);
         const error = !isValid && upperValue.length > 0;
         const message = error ? "Invalid registration number format." : "";

         setRegError(error);
         setRegMessage(message);
 
		 // Trigger API verification immediately when exactly 10 digits are entered
		 if (upperValue.length === 10) {
			 fetchVehicleByNumber(upperValue);
			 if (isLoggedIn) {
			 }
		 }
    };

	const fetchSavedVehicles = async () => {
		const { custId, token } = getDecryptedCustAuth();
		if (!custId || !token) {
			setSavedVehicles([]);
			return;
		}
		setLoadingSavedVehicles(true);
		try {
			const res = await axios.get(`${BaseURL}CustomerVehicles/CustId?CustId=${encodeURIComponent(custId)}`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []);
			setSavedVehicles(list || []);
		} catch (err) {
			console.warn('Failed to fetch saved vehicles', err?.response?.data || err?.message);
			setSavedVehicles([]);
		} finally {
			setLoadingSavedVehicles(false);
		}
	};


    // Fetch saved vehicles for logged-in users
    useEffect(() => {
  
        if (isLoggedIn) fetchSavedVehicles();
    }, [isLoggedIn]);

    // Debug fuel changes
    useEffect(() => {
        // console.log("Fuel state changed:", fuel, "Available fuels:", fuels);
        if (fuel) {
            const selectedFuel = fuels.find(f => f.id === fuel);
            console.log("Selected fuel:", selectedFuel);
        }
    }, [fuel, fuels]);

    const handleChooseSavedVehicle = () => {
        const v = savedVehicles.find(x => (x.VehicleID || x.vehicleID) === Number(selectedSavedVehicleId));
        if (!v) return;
        // Populate form and selections
        const vehicleNumber = (v.VehicleNumber || v.VehicleRegNo || "").toString().toUpperCase();
        // setFormData(p => ({
        //     ...p,
        //     registrationNumber: vehicleNumber,
        //     yearOfPurchase: v.YearOfPurchase || "",
        //     engineType: v.EngineType || "",
        //     kilometerDriven: v.KilometersDriven || "",
        //     transmissionType: v.TransmissionType || "",
        // }));
        if (v.BrandID) setBrand(v.BrandID);
        if (v.ModelID) setModel(v.ModelID);
        if (v.FuelTypeID) setFuel(v.FuelTypeID);

        // Prepare and store selectedCarDetails in localStorage
        const selectedCarDetails = {
            brand: {
                id: v.BrandID,
                name: v.BrandName,
                logo: v.BrandLogo ? `${imageBaseURL}${v.BrandLogo}` : undefined,
            },
            model: {
                id: v.ModelID,
                name: v.ModelName,
                logo: v.VehicleImage ? `${imageBaseURL}${v.VehicleImage}` : undefined,
            },
            fuel: {
                id: v.FuelTypeID,
                name: v.FuelTypeName,
                logo: v.FuelImage ? `${imageBaseURL}${v.FuelImage}` : undefined,
            },
            VehicleID: v.VehicleID || v.vehicleID,
            VehicleNumber: vehicleNumber,
            // Extra fields to hydrate step 3 in SelectTimeSlotPage
            registrationNumber: vehicleNumber,
            yearOfPurchase: v.YearOfPurchase || "",
            engineType: v.EngineType || "",
            kilometerDriven: v.KilometersDriven || "",
            transmissionType: v.TransmissionType || "",
        };
        try {
            localStorage.setItem('selectedCarDetails', JSON.stringify(selectedCarDetails));
        } catch (_) {}

        // Show confirmation toast
        Swal.fire({
            title: 'Vehicle Selected',
            text: 'We filled your form with the saved car details.',
            icon: 'success',
            timer: 1800,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
        // Ensure the manual form is visible with populated fields
        try { setSelectionMethod('manual'); } catch (_) {}
        try { window.dispatchEvent(new CustomEvent('selectedCarUpdated')); } catch (_) {}
        if (onCarSaved) {
            onCarSaved(selectedCarDetails);
        }
        if (onClose) onClose();
    };

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
				return filteredModels; // Return the models array
			} else {
				setModels([]);
				console.error("Error fetching models:", response.data);
				return []; // Return empty array
			}
		} catch (error) {
			console.error("Error fetching models:", error);
			return []; // Return empty array on error
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

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Required fields validation for registration number and year of purchase
		if (!formData.registrationNumber || !formData.transmissionType) {
			showAlert("Please enter registration number and transmission type.");
			return;
		}

		// Validate registration number
		if (regError) {
			return;
		}

		if (!brand || !model || !fuel) {
			if (showAlert) {
				showAlert( "Please select brand, model, and fuel type.");
			} else {
				alert("Please select brand, model, and fuel type.");
			}
			return;
		}

		// Validate year of purchase
		const currentYear = new Date().getFullYear();
		const year = parseInt(formData.yearOfPurchase, 10);
		if (isNaN(year) || year < 1900 || year > currentYear) {
			setYearError(true);
			return;
		}

		
        const selectedCarDetails = {
            brand: brands.find((b) => b.id === brand),
            model: models.find((m) => m.id === model),
            fuel: fuels.find((f) => f.id === fuel),
            registrationNumber: formData.registrationNumber,
            yearOfPurchase: formData.yearOfPurchase,
            engineType: formData.engineType,
            kilometerDriven: formData.kilometerDriven,
            transmissionType: formData.transmissionType,
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
		// Insert vehicle via API only if user is signed-in
		try {
			const user = JSON.parse(localStorage.getItem("user"));
			const token = user?.token || "";
			let decryptedCustId = null;

			if (token && user?.id) {
				try {
					const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;
					const bytes = CryptoJS.AES.decrypt(user.id, secretKey);
					decryptedCustId = bytes.toString(CryptoJS.enc.Utf8);
				} catch (err) {
					console.warn("Failed to decrypt customer id", err);
				}
			}

			if (token && decryptedCustId) {
				const payload = {
					custID: decryptedCustId,
					brandID: formData.brandID || brand,
					modelID: formData.modelID || model,
					fuelTypeID: formData.fuelTypeID || fuel,
					VehicleNumber: formData.registrationNumber,
					yearOfPurchase: formData.yearOfPurchase,
					engineType: formData.engineType,
					kilometersDriven: formData.kilometerDriven,
					transmissionType: formData.transmissionType,
					CreatedBy: decryptedCustId,
				};

				const resp = await axios.post(`${BaseURL}CustomerVehicles/InsertCustomerVehicle`, payload);
				const apiData = resp?.data || {};
				if (apiData?.status === false || apiData?.vehicleID === -1) {
					const errorMessage = apiData?.message || "Unable to save vehicle. Please check details.";
					console.error(errorMessage);
					if (showAlert) {
						showAlert(errorMessage);
					}
                } else if (apiData?.vehicleID) {
                    // store VehicleID with selected car and persist entered details
                    let saved = JSON.parse(localStorage.getItem("selectedCarDetails")) || {};
                    saved.VehicleID = apiData.vehicleID;
                    saved.registrationNumber = formData.registrationNumber;
                    saved.yearOfPurchase = formData.yearOfPurchase;
                    saved.engineType = formData.engineType;
                    saved.kilometerDriven = formData.kilometerDriven;
                    saved.transmissionType = formData.transmissionType;
                    localStorage.setItem("selectedCarDetails", JSON.stringify(saved));
					fetchSavedVehicles();
                }
			} else {
				showAlert && showAlert("Please sign in to save your vehicle.", "warning");
				return;
			}
		} catch (err) {
			console.error("Error inserting customer vehicle:", err);
		}

        console.log("Saved Car:", selectedCarDetails);
        try { window.dispatchEvent(new CustomEvent('selectedCarUpdated')); } catch (_) {}
        if (onCarSaved) {
            onCarSaved(selectedCarDetails);
        }
        if (onClose) onClose();
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
		setTimeout(() => {
			setShowFuelPopup(true);
		}, 100);
	};

	const handleFuelSelect = (id) => {
		setFuel(id);
		setShowFuelPopup(false);
	};

	return (
		<div className={`choose-car-modal ${isVisible ? "visible" : "hidden"}`}>
			<div className="modal-content" ref={modalRef}>
				<button className="modal-close" onClick={onClose}>
					×
				</button>
				{/* Mobile number verification - SignIn-like form */}
				{!isLoggedIn && (
				<div className="mb-3 p-3 rounded  bg-white">
					<h6 className="mb-3">Please Verify Your Mobile Number</h6>
					<form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP}>
						<div className="mb-3 text-start">
							<label className="form-label">Mobile Number</label>
							<div className="input-group">
								<input
									type="text"
									inputMode="numeric"
									pattern="[0-9]*"
									className="form-control"
									placeholder="Enter mobile number"
									value={identifier}
									onChange={(e) => {
										const value = e.target.value.replace(/\D/g, "");
										if (value.length <= 10) setIdentifier(value);
									}}
									maxLength={10}
									required
								/>
							</div>
						</div>

						{otpSent && (
							<>
								<label className="form-label text-start">Enter OTP</label>
								<div className="mb-3 text-start input-group">
									<input
										type="text"
										className="form-control"
										placeholder="Enter OTP"
										value={otp}
										onChange={(e) => setOtp(e.target.value)}
										required
									/>
									<div className="input-group-append">
										<button
											type="button"
											onClick={handleSendOTP}
											disabled={loginLoading}
											className="btn btn-outline-secondary"
											title="Resend OTP"
											style={{ padding: "12px 17px" }}
										>
											Resend
										</button>
									</div>
								</div>
								{otpSent && !otpExpired && <small className="text-muted">OTP will expire in {timer}s</small>}
								{otpExpired && <div className="text-danger small mb-2">OTP expired. Please resend.</div>}
							</>
						)}

						<div className="text-center mb-2">
							<button
								type="submit"
								className={`btn btn-primary btn-sm line-none ${loginLoading || otpExpired ? "disabled" : ""}`}
								disabled={loginLoading || otpExpired}
							>
								{loginLoading ? "Sending..." : otpSent ? (otpExpired ? "OTP Expired" : "Verify OTP") : "Send OTP"}
							</button>
						</div>
					</form>
				</div>
				)}

				{isLoggedIn && (
				<>
				<h6>Select Your Car Type</h6>
				{/* Dropdown */}
				<div className="mb-4 d-none">
					<select className="form-select" value={selectionMethod} onChange={(e) => setSelectionMethod(e.target.value)}>
						<option value="registration">Registration Number</option>
						<option value="manual">Manual Selection</option>
					</select>
				</div>

				{/* Saved vehicles chooser (only if exist) */}
				{isLoggedIn && savedVehicles.length > 0 && (
					<div className="mb-3 p-3 rounded border bg-white">
						<div className="row g-2 align-items-end">
							<div className="col-12 col-md-8">
								<label className="form-label small">Choose from saved cars</label>
								<select
									className="form-select"
									value={selectedSavedVehicleId}
									onChange={(e) => setSelectedSavedVehicleId(e.target.value)}
								>
									<option value="">Select a saved car</option>
									{savedVehicles.map((v) => (
										<option key={v.VehicleID || v.vehicleID} value={v.VehicleID || v.vehicleID}>
											{(v.BrandName || v.brandName || 'Brand')} {(v.ModelName || v.modelName || 'Model')} - {(v.VehicleNumber || v.VehicleRegNo || '').toUpperCase()}
										</option>
									))}
								</select>
							</div>
							<div className="col-12 col-md-4">
								<button type="button" className="btn btn-primary btn-confirm px-4 py-2" disabled={!selectedSavedVehicleId} onClick={handleChooseSavedVehicle}>
									Use This Car
								</button>
							</div>
						</div>
					</div>
				)}
				<h6>Or Add New Car</h6>
				<form onSubmit={handleSubmit}>
					{selectionMethod === "registration" ? (
						<div className="mb-4">
							<label className="form-label">Enter Vehicle Registration Number</label>
							<input
								type="text"
								className="form-control"
								value={registrationNumber}
								onChange={(e) => setRegistrationNumber(e.target.value)}
								placeholder="e.g. MH12AB1234"
							/>
						</div>
					) : (
						<>
                    {/* Vehicle Details FIRST */}
                    <div className="mt-3 text-start">
                        <div className="row g-2">
                            {/* Mobile number + OTP were moved to a separate block above */}
								<div className="col-12 col-md-6">
									<label className="form-label small">Registration Number <span className="text-danger">*</span></label>
									<div className="position-relative">
										<input
											type="text"
											className={`form-control ${regError ? 'is-invalid' : ''}`}
											value={formData.registrationNumber}
											onChange={handleVehicleNumberChange}
											style={{ textTransform: 'uppercase' }}
											placeholder="e.g., MH12AB1234"
											required
										/>
										{isLoadingVehicleData && (
											<div className="position-absolute top-50 end-0 translate-middle-y me-3">
												<div className="spinner-border spinner-border-sm text-primary" role="status">
													<span className="visually-hidden">Loading...</span>
												</div>
											</div>
										)}
										{regMessage && <div className="invalid-feedback">{regMessage}</div>}
									</div>
								</div>
								<div className="col-12 col-md-6">
									<label className="form-label small">Year of Purchase</label>
									<input
										type="text"
										className={`form-control ${yearError ? 'is-invalid' : ''}`}
										value={formData.yearOfPurchase}
										onChange={(e) => {
											const value = e.target.value.replace(/\D/g, '').slice(0, 4);
											setFormData((p) => ({ ...p, yearOfPurchase: value }));
											if (value.length === 4) {
												const currentYear = new Date().getFullYear();
												const year = parseInt(value, 10);
												if (isNaN(year) || year < 1900 || year > currentYear) {
													setYearError(true);
												} else {
													setYearError(false);
												}
											} else {
												setYearError(false);
											}
										}}
										placeholder="e.g., 2020"
									/>
									{yearError && <div className="invalid-feedback">Enter a valid year from 1900 and {new Date().getFullYear()}.</div>}
								</div>
								<div className="col-12 col-md-6">
									<label className="form-label small">Engine Type</label>
									<input
										type="text"
										className="form-control"
										value={formData.engineType}
										onChange={(e) => setFormData((p) => ({ ...p, engineType: e.target.value }))}
										placeholder="e.g., VVT"
									/>
								</div>
								<div className="col-12 col-md-6">
									<label className="form-label small">Kilometers Driven</label>
									<input
										type="text"
										className="form-control"
										value={formData.kilometerDriven}
                                        onChange={(e) => setFormData((p) => ({ ...p, kilometerDriven: e.target.value.replace(/\D/g, '') }))}
										placeholder="e.g., 25000"
									/>
								</div>
								<div className="col-12 col-md-6">
                                    <label className="form-label small">Transmission Type<span className="text-danger">*</span></label>
									<select
										className="form-select"
										value={formData.transmissionType}
										onChange={(e) => setFormData((p) => ({ ...p, transmissionType: e.target.value }))}
										required
									>
										<option value="">Select</option>
										<option value="Manual">Manual</option>
										<option value="Automatic">Automatic</option>
									</select>
								</div>
							</div>
						</div>

						{/* THEN: Choose Brand, Model & Fuel */}
            <div className="mb-4 mt-4">
						<label className="form-label">Choose Brand, Model & Fuel</label>
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

							{/* Fuel Card */}
							<div
								onClick={() => {
									if (model) setShowFuelPopup(true);
								}}
								className={`rounded shadow-sm text-center p-3 car-box ${
									fuel ? "border-primary border-2" : "border"
								} bg-white hover-shadow`}
								style={{
									width: 120,
									height: 120,
									cursor: !model ? "not-allowed" : "pointer",
									opacity: !model ? 0.6 : 1,
									transition: "0.3s",
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<div className="fw-semibold small mb-2 text-dark">Fuel</div>
								{fuel ? (
									<div>
										{(() => {
											const selectedFuel = fuels.find((f) => f.id === fuel);
											console.log("Fuel card render - fuel ID:", fuel, "selectedFuel:", selectedFuel);
											return (
												<>
													<img
														src={selectedFuel?.image}
														alt="Fuel Type"
														style={{ width: 45, height: 45, objectFit: "contain" }}
														onError={(e) => {
															console.log("Fuel image error - fuel ID:", fuel, "selectedFuel:", selectedFuel, "image URL:", selectedFuel?.image);
															e.target.style.display = 'none';
														}}
													/>
													<div className="small mt-1" style={{ fontSize: '10px', color: '#666' }}>
														{selectedFuel?.name || 'Unknown'}
													</div>
												</>
											);
										})()}
									</div>
								) : (
									<div className="text-muted small">Choose</div>
								)}
							</div>
						</div>

						{/* Chosen result display */}
						{(brand || model || fuel) && (
							<div className="mt-3 px-2 py-1 bg-white rounded shadow-sm text-center small fw-bold text-secondary">
								{brand && brands.find((b) => b.id === brand)?.name}
								{brand && model && " - "}
								{model && models.find((m) => m.id === model)?.name}
								{(brand || model) && fuel && " - "}
								{fuel && fuels.find((f) => f.id === fuel)?.name}
							</div>
						)}
					</div>
            </>
					)}

					


					{/* Booking Vehicle Details fields were moved above; keeping this block removed */}

					{/* Buttons */}
					<div className="d-flex justify-content-center gap-2 mt-3">
						<button type="button" className="btn btn-warning py-2 px-4" onClick={onClose}>
							Cancel
						</button>
						<button type="submit" className="btn btn-primary py-2 px-4">
							Save
						</button>
					</div>
				</form>
				</>
				)}
			</div>

			{isLoggedIn && showBrandPopup && (
				<BrandPopup
					brands={brands}
					selected={brand}
					onSelect={handleBrandSelect}
					onClose={() => setShowBrandPopup(false)}
				/>
			)}

			{isLoggedIn && showModelPopup && (
				<ModelPopup
					models={models}
					selected={model}
					onSelect={handleModelSelect}
					onClose={() => setShowModelPopup(false)}
					loading={loadingModels}
				/>
			)}

			{isLoggedIn && showFuelPopup && (
				<FuelPopup
					fuels={fuels}
					selected={fuel}
					onSelect={handleFuelSelect}
					onClose={() => setShowFuelPopup(false)}
				/>
			)}
		</div>
	);
};

export default ChooseCarModal;
