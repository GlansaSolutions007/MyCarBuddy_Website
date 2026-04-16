import React, { useEffect, useRef, useState } from "react";
import "./SignInModal.css";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { useAlert } from "../context/AlertContext";
import CryptoJS from "crypto-js";
import { saveUserFromVerifyOtp } from "../helper/authHelper";
import { FaTimes, FaUser, FaPhone, FaEnvelope, FaMobileAlt, FaShieldAlt, FaArrowRight, FaRedo, FaCar, FaCheckCircle } from "react-icons/fa";

const SignIn = ({ isVisible, onClose, onRegister }) => {
	const [identifier, setIdentifier] = useState("");
	// const [isLoading, setIsLoading] = useState(false);
	const [otpSent, setOtpSent] = useState(false);
	const [otp, setOtp] = useState("");
	const [timer, setTimer] = useState(0);
	const [otpExpired, setOtpExpired] = useState(false);
	const [loading, setLoading] = useState(false);
	const baseUrl = process.env.REACT_APP_CARBUDDY_BASE_URL;
	const imageBaseURL = process.env.REACT_APP_CARBUDDY_IMAGE_URL;
	const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;
	const { showAlert } = useAlert();
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [nameError, setNameError] = useState("");
	const [emailError, setEmailError] = useState("");
	const [phoneError, setPhoneError] = useState("");
	const [otpError, setOtpError] = useState("");

	const modalRef = useRef();

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (modalRef.current && !modalRef.current.contains(event.target)) {
				onClose();
			}
		};
		if (isVisible) {
			document.addEventListener("mousedown", handleClickOutside);
		} else {
			document.removeEventListener("mousedown", handleClickOutside);
		}
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isVisible, onClose]);

	useEffect(() => {
		if (isVisible) {
			// Reset form when modal opens
			setOtpSent(false);
			setIdentifier("");
			setFullName("");
			setEmail("");
			setOtpExpired(false);
			setLoading(false);
			setTimer(0);
			setOtp("");
			setPhoneError("");
			setOtpError("");
			setEmailError("");
			setNameError("");
		}
	}, [isVisible]);

	// OTP timer
	useEffect(() => {
		let interval;
		if (otpSent && timer > 0) {
			interval = setInterval(() => {
				setTimer((prev) => prev - 1);
			}, 1000);
		} else if (timer === 0 && otpSent) {
			setOtpExpired(true);
		}
		return () => clearInterval(interval);
	}, [otpSent, timer]);

	const getDeviceId = () => {
		let deviceId = localStorage.getItem("deviceId");
		if (!deviceId) {
			deviceId = uuidv4(); // Generate a new UUID
			localStorage.setItem("deviceId", deviceId);
		}
		return deviceId;
	};

	const validatePhone = (phone) => {
		if (!phone.trim()) return "Mobile number is required";
		if (!/^\d+$/.test(phone)) return "Mobile number must contain only digits";
		if (!/^[6-9]/.test(phone)) return "Mobile number must start with 6, 7, 8, or 9";
		if (phone.length !== 10) return "Mobile number must be exactly 10 digits";
		return "";
	};

	const validateOTP = (otp) => {
		if (!otp) return "OTP is required";
		if (!/^\d+$/.test(otp)) return "OTP must contain only digits";
		if (otp.length !== 6) return "OTP must be 6 digits";
		return "";
	};

	const validateEmail = (email) => {
		if (!email.trim()) return "";
		const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!regex.test(email)) return "Please enter a valid email address";
		return "";
	};

	const validateName = (name) => {
		if (!name.trim()) return "";
		if (name.length < 2) return "Name must be at least 2 characters";
		if (!/^[a-zA-Z\s]+$/.test(name)) return "Name can only contain letters";
		return "";
	};

	const handleSendOTP = async (e) => {
		e.preventDefault();

		const phoneErr = validatePhone(identifier);
		const emailErr = validateEmail(email);
		const nameErr = validateName(fullName);

		setPhoneError(phoneErr);
		setEmailError(emailErr);
		setNameError(nameErr);

		if (phoneErr || emailErr || nameErr) {
			// show first error in popup as well
			const first = phoneErr || emailErr || nameErr;
			showAlert("Error", first, 3000, "error");
			return;
		}

		setLoading(true);
		try {
			await axios.post(`${baseUrl}Auth/send-otp`, {
				loginId: identifier,
				email
			});

			setOtpSent(true);
			setOtpExpired(false);
			setTimer(60);
		} catch (error) {
			showAlert("Error", "Failed to send OTP", 3000, "error");
		} finally {
			setLoading(false);
		}
	};


	const handleVerifyOTP = async (e) => {
		e.preventDefault();
		const otpErr = validateOTP(otp);
		setOtpError(otpErr);

		if (otpErr) {
			showAlert("Error", otpErr, 3000, "error");
			return;
		}

		const deviceId = getDeviceId();
		setLoading(true);

		try {
			const response = await axios.post(`${baseUrl}Auth/verify-otp`, {
				loginId: identifier,
				otp,
				fullName,
				email,
				deviceToken: "web-token",
				deviceId,
			});
			saveUserFromVerifyOtp(response.data, {
				phone: identifier,
				name: fullName?.trim() || (response.data?.name && response.data.name !== "User" ? response.data.name : "User"),
				email: email?.trim() || response.data?.email || "",
			});

			getVehicleList();
			window.dispatchEvent(new Event("userProfileUpdated"));
			onClose();
		} catch (error) {
			setOtpError("Invalid OTP");
			showAlert("Error", "Invalid OTP", 3000, "error");
		} finally {
			setLoading(false);
		}
	};


	const getVehicleList = async () => {
		try {
			const userData = JSON.parse(localStorage.getItem("user"));
			if (!userData || !userData.id || !userData.token) return;
			const bytes = CryptoJS.AES.decrypt(userData.id, secretKey);
			const decryptedCustId = bytes.toString(CryptoJS.enc.Utf8);

			const res = await axios.get(`${baseUrl}CustomerVehicles/CustId?CustId=${decryptedCustId}`, {
				headers: {
					Authorization: `Bearer ${userData.token}`,
				},
			});

			const vehicleList = res.data;
			console.log("Vehicle list:", vehicleList);

			const primaryCar = vehicleList.find((car) => car.IsPrimary === true);

			if (primaryCar) {
				const resolvedVehicleId = Number(primaryCar.VehicleID || primaryCar.vehicleID || primaryCar.id) || 0;
				const resolvedRegistrationNumber = (
					primaryCar.VehicleNumber ||
					primaryCar.VehicleRegNo ||
					primaryCar.registrationNumber ||
					""
				).toString().toUpperCase();
				const resolvedYearOfPurchase = Number(primaryCar.YearOfPurchase || primaryCar.yearOfPurchase) || 0;
				const resolvedKilometersDriven = Number(primaryCar.KilometersDriven || primaryCar.kilometersDriven || primaryCar.kilometerDriven) || 0;

				const selectedCarDetails = {
					brand: {
						id: primaryCar.BrandID,
						name: primaryCar.BrandName,
						logo: `${imageBaseURL}${primaryCar.BrandLogo}`,
					},
					model: {
						id: primaryCar.ModelID,
						name: primaryCar.ModelName,
						logo: `${imageBaseURL}${primaryCar.VehicleImage}`,
					},
					fuel: {
						id: primaryCar.FuelTypeID,
						name: primaryCar.FuelTypeName,
						logo: `${imageBaseURL}${primaryCar.FuelImage}`,
					},
					id: resolvedVehicleId,
					VehicleID: resolvedVehicleId,
					vehicleID: resolvedVehicleId,
					vehicleNumber: resolvedRegistrationNumber,
					VehicleNumber: resolvedRegistrationNumber,
					registrationNumber: resolvedRegistrationNumber,
					yearOfPurchase: resolvedYearOfPurchase,
					YearOfPurchase: resolvedYearOfPurchase,
					brandID: Number(primaryCar.BrandID) || 0,
					modelID: Number(primaryCar.ModelID) || 0,
					fuelTypeID: Number(primaryCar.FuelTypeID) || 0,
					kilometersDriven: resolvedKilometersDriven,
					kilometerDriven: resolvedKilometersDriven,
					engineType: primaryCar.EngineType || "",
					transmissionType: primaryCar.TransmissionType || "",
				};

				localStorage.setItem("selectedCarDetails", JSON.stringify(selectedCarDetails));
				window.dispatchEvent(new Event("userProfileUpdated"));
				window.dispatchEvent(new CustomEvent("selectedCarUpdated"));
			} else {
				console.warn("No primary car found.");
			}
		} catch (err) {
			console.error("Error fetching vehicle list:", err);
		}
	};

	return (
		<div className={`si-overlay ${isVisible ? "visible" : "hidden"}`} onClick={onClose}>
			<div className="si-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
				{/* Close Button */}
				<button className="si-close-btn" onClick={onClose}>
					<FaTimes />
				</button>

				{/* Left Panel - Branding */}
				<div className="si-left-panel">
					<div className="si-brand">
						<div className="si-brand-icon">
							<FaCar />
						</div>
						<h2 className="si-brand-title">My Car Buddy</h2>
						<p className="si-brand-tagline">
							Your Trusted Car Care Partner
							<br />
							<span style={{ color: "#fbbf24", fontWeight: "bold", display: "inline-block", marginTop: "1px" }}>
								at your Doorstep
							</span>
						</p>
					</div>

					<div className="si-features">
						<div className="si-feature">
							<FaCheckCircle />
							<span>Doorstep Car Service</span>
						</div>
						<div className="si-feature">
							<FaCheckCircle />
							<span>Verified Mechanics</span>
						</div>
						<div className="si-feature">
							<FaCheckCircle />
							<span>Transparent Pricing</span>
						</div>
						<div className="si-feature">
							<FaCheckCircle />
							<span>100% Satisfaction</span>
						</div>
					</div>
				</div>

				{/* Right Panel - Form */}
				<div className="si-right-panel">
					<div className="si-form-header">
						<h3 className="si-title">{otpSent ? "Verify OTP" : "Welcome to My Car Buddy!"}</h3>
						<p className="si-subtitle">
							{otpSent
								? `Enter the OTP sent to +91 ${identifier}`
								: "Sign in with your mobile number"}
						</p>
					</div>

					<form className="si-form" onSubmit={otpSent ? handleVerifyOTP : handleSendOTP} noValidate>

						{!otpSent && (
							<>
								{/* Name */}
								{/* <div className="si-input-group">
									<div className="si-input-icon">
										<FaUser />
									</div>
									<div className="si-input-wrapper">
										<label className="si-label">Your Name</label>
										<input
											type="text"
											className="si-input"
											placeholder="Enter full name"
											value={fullName}
											onChange={(e) => setFullName(e.target.value)}
											required
										/>
									</div>
								</div> */}

								{/* Email */}
								{/* <div className="si-input-group">
									<div className="si-input-icon">
										<FaEnvelope />
									</div>
									<div className="si-input-wrapper">
										<label className="si-label">Email</label>
										<input
											type="email"
											className="si-input"
											placeholder="yourname@example.com"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											required
										/>
									</div>
								</div> */}
							</>
						)}

						{/* Mobile Number Input */}
						<div className={`si-input-group ${otpSent ? "si-disabled" : ""}`}>
							<div className="si-input-icon">
								<FaPhone />
							</div>

							<div className="si-input-wrapper">
								<label className="si-label">Mobile Number</label>

								<div className="si-input-row">
									<span className="si-country-code">+91</span>

									<input
										type="text"
										inputMode="numeric"
										className={`si-input ${phoneError ? "si-input-error" : ""}`}
										placeholder="Enter 10-digit number"
										value={identifier}
										onChange={(e) => {
											const value = e.target.value.replace(/\D/g, "");

											if (
												value === "" ||
												(value.length === 1 && /^[6-9]$/.test(value)) ||
												(value.length > 1 && value.length <= 10 && /^[6-9]/.test(value[0]))
											) {
												setIdentifier(value);
												setPhoneError(validatePhone(value));
											}
										}}
										maxLength={10}
										disabled={otpSent}
									/>
								</div>

								{phoneError && (
									<p className="si-helper-text">{phoneError}</p>
								)}
							</div>

							{otpSent && (
								<button
									type="button"
									className="si-edit-btn"
									onClick={() => {
										setOtpSent(false);
										setOtp("");
										setOtpError("");
										setOtpExpired(false);
									}}
								>
									Edit
								</button>
							)}
						</div>

						{/* OTP Input */}
						{otpSent && (
							<div className="si-otp-section">
								<div className="si-input-group">
									<div className="si-input-icon">
										<FaShieldAlt />
									</div>

									<div className="si-input-wrapper">
										<label className="si-label">One-Time Password</label>

										<input
											type="text"
											inputMode="numeric"
											className={`si-input si-otp-input ${otpError ? "si-input-error" : ""}`} 
											placeholder="Enter 6-digit OTP"
											value={otp}
											onChange={(e) => {
												const value = e.target.value.replace(/\D/g, "").slice(0, 6);
												setOtp(value);

												// Show validation only if less than 6 digits
												if (value.length < 6) {
													setOtpError("OTP must be 6 digits");
												} else {
													setOtpError("");
												}
											}}
											maxLength={6}
											autoFocus
										/>

										{otpError && (
											<p className="si-helper-text">{otpError}</p>
										)}
									</div>
								</div>

								<div className="si-otp-footer">
									{!otpExpired ? (
										<span className="si-timer">
											Resend OTP in <strong>{timer}s</strong>
										</span>
									) : (
										<span className="si-expired">OTP expired</span>
									)}
									<button
										type="button"
										className="si-resend-btn"
										onClick={handleSendOTP}
										disabled={loading || (!otpExpired && timer > 0)}
									>
										<span className={(loading || (!otpExpired && timer > 0)) ? "si-text-blur" : ""}>
											<FaRedo />
											Resend OTP
										</span>
									</button>
								</div>
							</div>
						)}

						{/* Submit Button */}
						<button
							type="submit"
							className="si-submit-btn"
							disabled={loading || (otpSent && otpExpired)}
						>
							<span className={(loading || (otpSent && otpExpired)) ? "si-text-blur" : ""}>
								{loading ? (
									<>
										<span className="si-spinner"></span>
										{otpSent ? "Verifying..." : "Sending OTP..."}
									</>
								) : (
									<>
										{otpSent ? "Verify & Login" : "Get OTP"}
										<FaArrowRight />
									</>
								)}
							</span>
						</button>
					</form>

					{/* Footer */}
					<div className="si-footer">
						<p className="si-terms">
							By continuing, you agree to our{" "}
							<a href="/terms">Terms of Service</a> and{" "}
							<a href="/privacy">Privacy Policy</a>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SignIn;
