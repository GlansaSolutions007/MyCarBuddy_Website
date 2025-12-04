import React, { useState, useEffect } from "react";
import { GoogleGenAI, createUserContent } from "@google/genai";
import { FaCar, FaUpload, FaSearch, FaExclamationTriangle, FaCloudUploadAlt, FaImages, FaTimes, FaRobot, FaArrowRight } from "react-icons/fa";
import { useAlert } from "../context/AlertContext";
import SignIn from "./SignIn";
import { useNavigate } from "react-router-dom";
import "./CarDamageAnalysis.css";

const CarDamageAnalysis = () => {
	const [images, setImages] = useState([]);
	const [previews, setPreviews] = useState([]);
	const [result, setResult] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const { showAlert } = useAlert();
	const [signInVisible, setSignInVisible] = useState(false);
	const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
	const [dragActive, setDragActive] = useState(false);
	const ai = new GoogleGenAI({ apiKey: "AIzaSyANYyBfF19iL8GMTGUwg_JTrwCBP-n8Ft0" });
	const navigate = useNavigate();

	const handleImagesChange = (event) => {
		const files = Array.from(event.target.files);
		setImages(files);
		const newPreviews = files.map((file) => URL.createObjectURL(file));
		setPreviews(newPreviews);
	};

	const handleDrag = (e) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	};

	const handleDrop = (e) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);
		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			const files = Array.from(e.dataTransfer.files);
			setImages(files);
			const newPreviews = files.map((file) => URL.createObjectURL(file));
			setPreviews(newPreviews);
		}
	};

	const removeImage = (index) => {
		const newImages = images.filter((_, i) => i !== index);
		const newPreviews = previews.filter((_, i) => i !== index);
		setImages(newImages);
		setPreviews(newPreviews);
	};

	const convertToBase64 = (file) => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result.split(",")[1]);
			reader.onerror = (error) => reject(error);
		});
	};

	const handleAnalyze = async () => {
		if (!user && user?.id !== "") {
			setSignInVisible(true);
			return;
		}
		if (images.length === 0) {
			setError("Please upload at least one image");
			return;
		}

		setLoading(true);
		setError("");
		setResult("");

		try {
			const imageParts = await Promise.all(
				images.map(async (image) => {
					const base64Data = await convertToBase64(image);
					return {
						inlineData: {
							mimeType: image.type,
							data: base64Data,
						},
					};
				})
			);

			const response = await ai.models.generateContent({
				model: "gemini-2.5-flash",
				contents: createUserContent([
					"Analyze the body damage in these car images. Describe any visible dents, scratches, crashes, rust, or other damages in detail. Create a formatted short report on the damages",
					...imageParts,
				]),
			});

			setResult(response.text);
		} catch (err) {
			setError("Error analyzing images: " + err.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		return () => {
			previews.forEach((preview) => URL.revokeObjectURL(preview));
		};
	}, [previews]);

	useEffect(() => {
		const handleUserUpdate = () => {
			setUser(JSON.parse(localStorage.getItem("user")));
		};
		window.addEventListener("userProfileUpdated", handleUserUpdate);
		return () => {
			window.removeEventListener("userProfileUpdated", handleUserUpdate);
		};
	}, []);

	return (
		<section className="damage-analysis-section">
			{/* Background Decorations */}
			<div className="damage-bg-decoration damage-bg-decoration-1"></div>
			<div className="damage-bg-decoration damage-bg-decoration-2"></div>

			<div className="container">
				{/* Section Header */}
				{/* <div className="damage-header">
					<span className="damage-subtitle">
						<FaRobot className="damage-subtitle-icon" />
						AI-Powered Analysis
					</span>
					<h2 className="damage-title">Car Damage Detection</h2>
					<p className="damage-description">
						Upload photos of your vehicle and let our AI instantly analyze and detect any damage
					</p>
				</div> */}

				<div className="damage-content-wrapper">

					{/* left Side - Result/Illustration Section */}
					<div className="damage-result-section">
						<div className={`damage-result-card ${result ? 'damage-result-card-active' : ''}`}>
							{result ? (
								<>
									{/* Analysis Report */}
									<div className="damage-report">
										<div className="damage-report-header">
											<div className="damage-report-icon-wrapper">
												<FaSearch />
											</div>
											<h3 className="damage-report-title">Analysis Report</h3>
										</div>
										<div className="damage-report-content">
											{result}
										</div>
										<button
											className="damage-service-btn"
											onClick={() => navigate("/service")}
										>
											<span>Go to Services</span>
											<FaArrowRight className="damage-service-btn-icon" />
										</button>
									</div>
								</>
							) : (
								<>
									{/* Illustration */}
									<div className="damage-illustration">
										<div className="damage-illustration-badge">
											<FaRobot />
											<span>AI Powered</span>
										</div>
										<div className="damage-illustration-content">
											<h3 className="damage-illustration-title">
												AI Car Damage Analysis
											</h3>
											<p className="damage-illustration-text">
												Upload your car images and get instant AI-powered damage assessment with detailed reports
											</p>
											<div className="damage-illustration-features">
												<div className="damage-feature-item">
													<span className="damage-feature-dot"></span>
													<span>Instant Detection</span>
												</div>
												<div className="damage-feature-item">
													<span className="damage-feature-dot"></span>
													<span>Detailed Reports</span>
												</div>
												<div className="damage-feature-item">
													<span className="damage-feature-dot"></span>
													<span>Multiple Images</span>
												</div>
											</div>
										</div>
										<div className="damage-car-icon">
											<FaCar />
										</div>
									</div>
								</>
							)}
						</div>
					</div>

					{/* Right Side - Upload Section */}
					<div className="damage-upload-section">
						{/* Upload Card */}
						<div className="damage-upload-card">
							<div className="damage-upload-card-header">
								<div className="damage-upload-icon-wrapper">
									<FaCloudUploadAlt className="damage-upload-header-icon" />
								</div>
								<h3 className="damage-upload-title">Upload Images</h3>
								<p className="damage-upload-subtitle">Drag & drop or click to browse</p>
							</div>

							{/* Drop Zone */}
							<label
								htmlFor="image-upload"
								className={`damage-dropzone ${dragActive ? 'damage-dropzone-active' : ''}`}
								onDragEnter={handleDrag}
								onDragLeave={handleDrag}
								onDragOver={handleDrag}
								onDrop={handleDrop}
							>
								<div className="damage-dropzone-content">
									<div className="damage-dropzone-icon">
										<FaImages />
									</div>
									<p className="damage-dropzone-text">
										Drop your car images here
									</p>
									<span className="damage-dropzone-or">or</span>
									<span className="damage-dropzone-browse">Browse Files</span>
									<p className="damage-dropzone-hint">
										Supports: JPG, PNG, WEBP (Max 10MB each)
									</p>
								</div>
								<input
									type="file"
									accept="image/*"
									multiple
									onChange={handleImagesChange}
									id="image-upload"
									className="damage-file-input"
								/>
							</label>

							{/* Preview Grid */}
							{previews.length > 0 && (
								<div className="damage-preview-section">
									<div className="damage-preview-header">
										<FaImages className="damage-preview-icon" />
										<span>Uploaded Images ({previews.length})</span>
									</div>
									<div className="damage-preview-grid">
										{previews.map((preview, index) => (
											<div key={index} className="damage-preview-item">
												<img src={preview} alt={`Preview ${index + 1}`} />
												<button
													className="damage-preview-remove"
													onClick={() => removeImage(index)}
												>
													<FaTimes />
												</button>
												<span className="damage-preview-number">{index + 1}</span>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Error Message */}
							{error && (
								<div className="damage-error">
									<FaExclamationTriangle className="damage-error-icon" />
									<span>{error}</span>
								</div>
							)}

							{/* Analyze Button */}
							<button
								onClick={handleAnalyze}
								disabled={loading || images.length === 0}
								className="damage-analyze-btn"
							>
								{loading ? (
									<>
										<span className="damage-spinner"></span>
										<span>Analyzing...</span>
									</>
								) : (
									<>
										<FaSearch className="damage-btn-icon" />
										<span>Analyze Damage</span>
									</>
								)}
							</button>
						</div>
					</div>

				</div>
			</div>

			{/* Sign In Modal */}
			<SignIn isVisible={signInVisible} onClose={() => setSignInVisible(false)} />
		</section>
	);
};

export default CarDamageAnalysis;
