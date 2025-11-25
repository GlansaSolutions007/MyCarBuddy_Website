import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ServiceAreaTwo.css";
import { FaSearch } from "react-icons/fa";
import { Calendar, MapPin, CheckCircle } from "lucide-react";
import Swal from "sweetalert2";

const steps = [
  {
    icon: Calendar,
    title: "Pick How You Want Help",
    description:
      "Choose between quick call support or AI chat based on your convenience.",
  },
  {
    icon: MapPin,
    title: "Instant Connection",
    description:
      "No waiting—connect with a real specialist or our AI assistant instantly.",
  },
  {
    icon: CheckCircle,
    title: "Fast Resolution",
    description:
      "Get your questions answered and issues resolved quickly and efficiently.",
  },
];


const ServiceAreaHomePage = () => {
  const BASE_URL = process.env.REACT_APP_CARBUDDY_BASE_URL;
  const ImageURL = process.env.REACT_APP_CARBUDDY_IMAGE_URL;
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  // Add this state at the top of your component
  const [otpStep, setOtpStep] = useState(false);
  const [timer, setTimer] = useState(60);
  const [otp, setOtp] = useState("");

  useEffect(() => {
    let countdown;
    if (otpStep && timer > 0) {
      countdown = setTimeout(() => setTimer(timer - 1), 1000);
    }
    return () => clearTimeout(countdown);
  }, [otpStep, timer]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${BASE_URL}Category`);
        if (Array.isArray(response.data)) {
          const activeCategories = response.data.filter(cat => cat.IsActive);

          const formatted = activeCategories.map((cat) => ({
            id: cat.CategoryID,
            title: cat.CategoryName,
            description: cat.Description || "No description provided.",
            image: `${ImageURL}${cat.ThumbnailImage}`,
            icon: `${ImageURL}${cat.IconImage}`,
          }));

          setServices(formatted);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const slugify = (text) => {
    return text
      .toLowerCase()
      .replace(/&/g, "and")     // replace "&" with "and"
      .replace(/[^a-z0-9]+/g, "-") // replace all non-alphanumeric with "-"
      .replace(/^-+|-+$/g, ""); // trim starting/ending "-"
  };

  const filteredServices = services.filter((service) =>
    service.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="service-area-2 space overflow-hidden" id="services">
      <div className="container px-2 px-sm-3 px-md-4">
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="title-area text-center mb-0">
              <span className="sub-title">Our Services</span>
              <h2 className="sec-title">
                Trusted Car Repair the Professionals{" "}
                <img
                  className="title-bg-shape shape-center"
                  src="assets/img/bg/title-bg-shape.png"
                  alt="Fixturbo"
                />
              </h2>

            </div>
          </div>
        </div>
        <div className="text-end mb-4">
          <div className="position-relative ml-20">
            <FaSearch
              className="fasearch"
              style={{ left: "85%" }}
            />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "5px 10px 5px 35px",
                borderRadius: "20px",
                border: "1px solid #116d6e",
                width: "200px",
              }}
            />
          </div>
        </div>
      </div>

      <div className="container">
        <div className="row gy-4 justify-content-center">
          {services
            .filter((service) =>
              service.title.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((service) => (
              <div key={service.id} className="col-6 col-sm-6 col-md-4 col-lg-3">
                <div
                  className="service-card-minimal d-flex flex-column"
                  style={{ minHeight: '150px' }}
                >
                  <div className="service-card-minimal-content d-flex flex-column align-items-center justify-content-center h-100" onClick={() => navigate(`/service/${slugify(service.title)}/${service.id}`)}>
                    <div className="icon">
                      <img src={service.icon} alt="icon" className="service-icon" />
                    </div>
                    <p className="service-title text-center mt-3">
                      {service.title}
                    </p>
                  </div>
                  <div
                    className="service-card-full d-flex flex-column"
                    style={{ backgroundImage: `url(${service.image})` }}
                  >
                    <div className="call-media-wrap flex-grow-1" onClick={() => navigate(`/service/${slugify(service.title)}/${service.id}`)}>
                      <div className="call-media-wrap flex-grow-1">
                        <div className="icon">
                          <img src={service.icon} alt="icon" />
                        </div>
                        <div className="media-body">
                          <h4 className="link">
                            <Link className="text-white" to={`/service/${slugify(service.title)}/${service.id}`}>
                              {service.title}
                            </Link>
                          </h4>
                          <p className="service-card_text text-white mt-2">
                            {service.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="checklist style-white">
                      <div className="btn-wrap mt-20">
                        {/* <Link className="btn style4 px-4 py-2" to={`/service/${slugify(service.title)}/${service.id}`}>
                          Book Service <i className="fas fa-arrow-right ms-2" />
                        </Link> */}
                        <Link
                          className="btn style4 px-4 py-2"
                          onClick={() => {
                            setSelectedService(service);
                            setOpenModal(true);
                          }}
                        >
                          Book Service <i className="fas fa-arrow-right ms-2" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {filteredServices.length > 0 ? (
        filteredServices.map((service) => (
          // ... your existing card code
          <div key={service.id} className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
            {/* ... */}
          </div>
        ))
      ) : (
        <div className="col-12 text-center my-5">
          <div style={{ maxWidth: "400px", margin: "0 auto" }}>
            <img
              src="https://cdn-icons-png.flaticon.com/512/7486/7486754.png"
              alt="No results"
              style={{ width: "150px", marginBottom: "20px", opacity: "0.8" }}
            />
            <h4 style={{ color: "#5a5a5a", fontWeight: "600" }}>
              Whoops! No search result found.
            </h4>
            <p style={{ color: "#888" }}>
              It looks like we don't have what you're looking for right now.
            </p>
            {/* Optional: Add a button to clear search */}
            <button
              className="btn btn-primary mt-2"
              style={{ borderRadius: "20px", padding: "8px 24px" }}
              onClick={() => window.location.reload()} // Replace with your clear search function
            >
              View All Services
            </button>
            <button
              className="btn btn-primary mt-2 ms-2"
              style={{ borderRadius: "20px", padding: "8px 24px" }}
            // onClick={() => window.location.reload()} // Replace with your clear search function
            >
              Get support
            </button>
          </div>
        </div>
      )}

      {/* 🔹 Quick Support Section */}
      <div className="row mt-50 justify-content-center">
        <div className="col-xl-10">
          <div className="title-area text-center mb-4">
            <h3 className="sub-title">Need Help?</h3>
            <h2 className="sec-title text-dark">
              Get Support Instantly
            </h2>
          </div>
        </div>
      </div>

      <div className="row justify-content-center mt-4">
        {/* Styles for hover animations */}
        <style>
          {`
      .support-card { transition: all 0.4s ease; border: 1px solid rgba(255, 255, 255, 0.2); overflow: hidden; }
      .support-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.3) !important; }
      .support-card:hover .bg-image { transform: scale(1.1); }
      .glass-btn { backdrop-filter: blur(4px); transition: all 0.3s ease; }
      .glass-btn:hover { transform: scale(1.05); background: #ffffff !important; color: #fdfdfdff !important; }
    `}
        </style>

        <div className="row justify-content-center mt-4">
          {/* Quick Call Support */}
          <div className="col-12 col-md-5 mb-4">
            <div
              className="p-5 text-center position-relative support-card"
              style={{
                borderRadius: 20,
                color: "#fff",
                boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                background: "#136d6f", // Fallback color
              }}
            >
              {/* Background Image */}
              <div
                className="bg-image"
                style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundImage: "url('https://images.unsplash.com/photo-1556740758-90de374c12ad?q=80&w=1000&auto=format&fit=crop')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  zIndex: 0,
                  transition: "transform 0.5s ease",
                }}
              />
              {/* Gradient Overlay */}
              <div
                style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: "linear-gradient(135deg, rgba(19, 109, 111, 0.95) 0%, rgba(19, 109, 111, 0.75) 100%)",
                  zIndex: 1,
                }}
              />
              {/* Content */}
              <div style={{ position: "relative", zIndex: 2 }}>
                <div
                  className="mb-3 d-flex justify-content-center align-items-center"
                  style={{
                    width: 60, height: 60,
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: "50%",
                    margin: "0 auto",
                    backdropFilter: "blur(5px)",
                  }}
                >
                  <i className="bi bi-telephone" style={{ fontSize: "28px" }}></i>
                </div>
                <h4 className="fw-bold mb-2" style={{ color: "#ffffffc9" }} >Quick Call Support</h4>
                <p className="mb-4" style={{ opacity: 0.9, color: "#ffffffc9" }}>
                  Connect directly with our support team for immediate help.
                </p>
                <button
                  className="btn glass-btn px-4 py-2"
                  style={{
                    background: "#fff",
                    color: "#181818ff",
                    fontWeight: "700",
                    borderRadius: 30,
                    border: "1px solid rgba(255,255,255,0.4)",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                  }}
                  onClick={() => (window.location.href = "tel:+911234567890")}
                >
                  Call Now
                </button>
              </div>
            </div>
          </div>

          {/* AI Support */}
          <div className="col-12 col-md-5 mb-4">
            <div
              className="p-5 text-center position-relative support-card"
              style={{
                borderRadius: 20,
                color: "#fff",
                boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                background: "#2c3e50", // Fallback color
              }}
            >
              {/* Background Image */}
              <div
                className="bg-image"
                style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundImage: "url('https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  zIndex: 0,
                  transition: "transform 0.5s ease",
                }}
              />
              {/* Gradient Overlay */}
              <div
                style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: "linear-gradient(135deg, rgba(30, 30, 40, 0.9) 0%, rgba(19, 109, 111, 0.75) 100%)",
                  zIndex: 1,
                }}
              />
              {/* Content */}
              <div style={{ position: "relative", zIndex: 2 }}>
                <div
                  className="mb-3 d-flex justify-content-center align-items-center"
                  style={{
                    width: 60, height: 60,
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: "50%",
                    margin: "0 auto",
                    backdropFilter: "blur(5px)",
                  }}
                >
                  <i className="bi bi-robot" style={{ fontSize: "28px" }}></i>
                </div>
                <h4 className="fw-bold mb-2" style={{ color: "#ffffffc9" }}>AI Analysis Support</h4>
                <p className="mb-4" style={{ opacity: 0.9, color: "#ffffffc9" }}>
                  Get instant answers from our AI-powered support assistant.
                </p>
                <button
                  className="btn glass-btn px-4 py-2"
                  style={{
                    background: "#fff",
                    color: "#181818ff",
                    fontWeight: "600",
                    borderRadius: 30,
                    border: "1px solid rgba(255,255,255,0.4)",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                  }}
                  onClick={() => navigate("/car-damage-analysis")}
                >
                  Chat Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-50 justify-content-center">
        <div className="col-xl-10">
          <div className="title-area text-center mb-4">
            <h3 className="sub-title">How It Works</h3>
            <h2 className="sec-title text-dark">
              Your Service in 3 Easy Steps
            </h2>
          </div>
        </div>
      </div>
      <div className="row justify-content-center mt-50">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isHovered = hoveredIndex === index;

          return (
            <div
              className="col-12 col-md-4 mb-4 d-flex flex-column align-items-center text-center position-relative"
              key={index}
              style={{ minHeight: 250, cursor: "default" }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Connecting Line (Desktop Only) */}
              {index < steps.length - 1 && (
                <div
                  className="d-none d-md-block"
                  style={{
                    position: "absolute",
                    top: "75px",
                    right: "-20%",
                    width: "40%",
                    height: 4,
                    background: "linear-gradient(90deg, #136d6f, rgba(19, 109, 111, 0.2))",
                    zIndex: 0,
                    borderRadius: "10px",
                  }}
                />
              )}

              {/* Circular Icon Container */}
              <div
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: "50%",
                  background: isHovered
                    ? "linear-gradient(135deg, #1aa1a4, #136d6f)" // Lighter gradient on hover
                    : "linear-gradient(135deg, #136d6f, #0e4e50)", // Darker gradient default
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 25,
                  position: "relative",
                  zIndex: 1,
                  // Active Effects:
                  transform: isHovered ? "translateY(-5px) scale(1.05)" : "translateY(0) scale(1)",
                  boxShadow: isHovered
                    ? "0 15px 35px rgba(19, 109, 111, 0.4)" // Glow effect
                    : "0 8px 20px rgba(0,0,0,0.1)",
                  border: "4px solid #fff", // Crisp white ring
                  outline: "4px solid rgba(19, 109, 111, 0.1)", // Outer faint ring
                  transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)", // Bouncy transition
                }}
              >
                {/* The Icon itself */}
                <div
                  style={{
                    transition: "transform 0.4s ease",
                    transform: isHovered ? "scale(1.1) rotate(5deg)" : "scale(1) rotate(0)",
                  }}
                >
                  <Icon size={40} color="#fff" />
                </div>

                {/* Step Number Badge */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: 35,
                    height: 35,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--bs-info), var(--bs-primary))",
                    color: "#fff",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontWeight: "800",
                    fontSize: 14,
                    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                    border: "2px solid #fff",
                    transform: isHovered ? "scale(1.2)" : "scale(1)",
                    transition: "transform 0.3s ease",
                  }}
                >
                  {index + 1}
                </div>
              </div>

              {/* Title */}
              <h4
                className="fw-bold mb-2"
                style={{
                  color: isHovered ? "#136d6f" : "#212529",
                  transition: "color 0.3s ease"
                }}
              >
                {step.title}
              </h4>

              {/* Description */}
              <p className="text-muted" style={{ maxWidth: 300, fontSize: "0.95rem" }}>
                {step.description}
              </p>
            </div>
          );
        })}
      </div>








      {openModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            padding: "15px",
            animation: "fadeIn 0.3s ease-in-out",
          }}
        >
          <style>
            {`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .modern-input:focus { border-color: #0a6264 !important; box-shadow: 0 0 0 3px rgba(10, 98, 100, 0.1) !important; outline: none; }
        .modern-input:disabled { background-color: #f9fafb; color: #9ca3af; cursor: not-allowed; border-color: #e5e7eb; }
        textarea::-webkit-scrollbar { width: 6px; }
        textarea::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 4px; }
      `}
          </style>

          <div
            style={{
              background: "#ffffff",
              padding: "25px",
              width: "100%",
              maxWidth: "450px",
              borderRadius: "20px",
              boxShadow: "0px 10px 40px rgba(0,0,0,0.2)",
              animation: "slideUp 0.3s ease-out",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* 🔹 Header Section */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <h5
                style={{
                  margin: "0 0 4px 0",
                  color: "#0a6264",
                  fontWeight: 800,
                  fontSize: "20px",
                  letterSpacing: "-0.5px",
                }}
              >
                {otpStep ? "Verify Identity" : "Quick Inquiry"}
              </h5>
              <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
                {selectedService?.title ? (
                  <span>Service: <strong style={{ color: "#0a6264" }}>{selectedService.title}</strong></span>
                ) : (
                  "Please fill in your details"
                )}
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!otpStep) {
                  // Move to OTP Step
                  setOtpStep(true);
                  setTimer(60);
                } else {
                  // 🔹 FINAL SUBMISSION LOGIC
                  setOpenModal(false);
                  setOtpStep(false);
                  setOtp("");

                  // 🔹 Trigger SweetAlert Popup
                  Swal.fire({
                    title: 'Thank You!',
                    text: 'Your inquiry has been successfully submitted. Our team will review your requirements and contact you shortly.',
                    icon: 'success',
                    confirmButtonColor: '#0a6264',
                    confirmButtonText: 'Okay',
                    width: '400px',
                    padding: '20px',
                    timer: 10000 // Auto close after 5 seconds
                  });
                }
              }}
            >
              {/* 🔹 Row: Name & Phone (Side by Side) */}
              <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>
                    Name
                  </label>
                  <input
                    type="text"
                    className="modern-input"
                    placeholder="Your Name"
                    disabled={otpStep}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      fontSize: "13px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#fff",
                      color: "#1f2937",
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    className="modern-input"
                    placeholder="Mobile No."
                    disabled={otpStep}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      fontSize: "13px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#fff",
                      color: "#1f2937",
                    }}
                  />
                </div>
              </div>

              {/* 🔹 Description Field */}
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#374151",
                    marginBottom: "4px",
                  }}
                >
                  Message / Description
                </label>

                <textarea
                  className="modern-input"
                  placeholder="Briefly describe your requirements..."
                  disabled={otpStep}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                  style={{
                    width: "100%",
                    padding: "6px",
                    fontSize: "12px",
                    borderRadius: "6px",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#fff",
                    color: "#1f2937",
                    resize: "none",       // user can't stretch manually
                    fontFamily: "inherit",
                    minHeight: "28px",     // very small default height
                    lineHeight: "1.2",
                    overflow: "hidden",    // hide scrollbar until needed
                  }}
                />
              </div>

              {/* 🔹 Expandable OTP Section */}
              <div
                style={{
                  maxHeight: otpStep ? "120px" : "0px",
                  opacity: otpStep ? 1 : 0,
                  overflow: "hidden",
                  transition: "all 0.3s ease-in-out",
                  marginBottom: otpStep ? "15px" : "0",
                }}
              >
                <div
                  style={{
                    background: "rgba(10, 98, 100, 0.04)",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px dashed #0a6264",
                    textAlign: "center"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#0a6264" }}>Enter OTP Code</span>
                    <span style={{ fontSize: "11px", color: "#6b7280" }}>
                      {timer > 0 ? `00:${timer.toString().padStart(2, '0')}` : <span style={{ cursor: 'pointer', color: '#0a6264', fontWeight: 'bold' }} onClick={() => setTimer(60)}>Resend</span>}
                    </span>
                  </div>

                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    placeholder="• • • • • •"
                    required={otpStep}
                    className="modern-input"
                    style={{
                      width: "100%",
                      padding: "8px",
                      fontSize: "16px",
                      textAlign: "center",
                      letterSpacing: "5px",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      fontWeight: "bold",
                      color: "#0a6264",
                      background: "#fff"
                    }}
                  />
                </div>
              </div>

              {/* 🔹 Action Buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "5px" }}>
                <button
                  type="button"
                  onClick={() => {
                    if (otpStep) {
                      setOtpStep(false);
                      setOtp("");
                    } else {
                      setOpenModal(false);
                    }
                  }}
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    color: "#4b5563",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  {otpStep ? "Back" : "Cancel"}
                </button>

                <button
                  type="submit"
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#0a6264",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(10, 98, 100, 0.25)",
                  }}
                >
                  {otpStep ? "Submit Inquiry" : "Verify Number"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceAreaHomePage;
