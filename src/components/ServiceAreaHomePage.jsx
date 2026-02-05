import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ServiceAreaTwo.css";
import { FaSearch, FaPhoneAlt, FaRobot, FaArrowRight } from "react-icons/fa";
import { Calendar, MapPin, CheckCircle } from "lucide-react";
import Swal from "sweetalert2";
import { useAlert } from "../context/AlertContext";
import CryptoJS from "crypto-js";
import { v4 as uuidv4 } from "uuid";
import { saveUserFromVerifyOtp } from "../helper/authHelper";
import BookServiceModal from "./BookServiceModal"
import Fuse from "fuse.js";

const steps = [
  {
    icon: Calendar,
    title: "Book Your Service & Inspection",
    description:
      "Choose your required service and schedule an inspection. Our team confirms the issue and provides a clear estimate.",
  },
  {
    icon: MapPin,
    title: "Doorstep Service at Your Location",
    description:
      "Our certified technician visits your home or office, diagnoses the issue, and completes the service on-site. If required, we also provide garage service with pickup & drop support for your convenience.",
  },
  {
    icon: CheckCircle,
    title: "Get a Perfectly Serviced, Spotless Car",
    description:
      "Sit back and relax while we fix your car. You receive a fully serviced, clean, and ready-to-drive vehicle.",
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
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [companyInfo, setCompanyInfo] = useState({ phones: [] });

  // Auth & Form States
  const [otpStep, setOtpStep] = useState(false);
  const [timer, setTimer] = useState(60);
  const [otp, setOtp] = useState("");
  const [identifier, setIdentifier] = useState(""); // This is the PhoneNumber
  const [fullName, setFullName] = useState(""); // NEW: To capture Name
  const [description, setDescription] = useState(""); // NEW: To capture Description
  const [otpExpired, setOtpExpired] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const baseUrl = process.env.REACT_APP_CARBUDDY_BASE_URL;
  const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;
  const { showAlert } = useAlert();

  const [isModalOpen, setIsModalOpen] = useState(false);
  // const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    let interval;
    if (otpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0 && otpSent) {
      setOtpExpired(true);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  const handleSendOTP = async () => {
    if (!identifier) {
      showAlert("Error", "Please enter a valid phone number", 3000, "error");
      return;
    }
    if (!fullName) {
      showAlert("Error", "Please enter your name", 3000, "error");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${baseUrl}Auth/send-otp`, { loginId: identifier });

      setOtpSent(true);
      setOtpExpired(false);
      setOtpStep(true);
      setTimer(60);
    } catch (err) {
      console.error("Send OTP Error", err);
      showAlert("Error", "Failed to send OTP", 3000, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const deviceId = getDeviceId();
    setLoading(true);

    try {
      // 1. Verify the OTP
      const res = await axios.post(`${baseUrl}Auth/verify-otp`, {
        loginId: identifier,
        otp,
        deviceToken: "web-token",
        deviceId,
      });

      // 2. Store User Data (Auth Logic)
      saveUserFromVerifyOtp(res.data, { phone: identifier, name: fullName });

      // 3. SEND LEAD DATA (The new requirement)
      // Note: We use res.data.custID from the response
      const leadPayload = {
        custID: res.data?.custID, // Integer from Auth response
        fullName: fullName,       // String from State
        phoneNumber: identifier,  // String from State
        email: "",                // Static Empty String
        platform: "web",          // Static "web"
        description: `${selectedService.title} - ${description}`  // String from State
      };

      await axios.put(`${baseUrl}Leads/UpdateCustomerAndLead`, leadPayload);

      // 4. Cleanup & UI Success
      window.dispatchEvent(new Event("userProfileUpdated"));

      // Reset Form
      setOpenModal(false);
      setOtpStep(false);
      setOtp("");
      setFullName("");
      setIdentifier("");
      setDescription("");

      Swal.fire({
        title: 'Thank You!',
        text: 'Your inquiry has been successfully submitted.',
        icon: 'success',
        confirmButtonColor: '#0a6264',
      });

    } catch (err) {
      console.error("OTP Verify / Lead Submit Error", err);
      // Determine if it was OTP error or API error for better feedback
      if (err.response?.config?.url?.includes("verify-otp")) {
        showAlert("Error", "Invalid OTP", 3000, "error");
      } else {
        showAlert("Error", "OTP verified but failed to save inquiry details.", 3000, "warning");
      }
    } finally {
      setLoading(false);
    }
  };

  const getDeviceId = () => {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem("deviceId", deviceId);
    }
    return deviceId;
  };

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

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const response = await axios.get(`${BASE_URL}CompanyInfo`);
        const data = response.data.data || [];

        // ✅ filter only active records
        const phones = data
          .filter(item => item.Type === 'PhoneNumber' && item.IsActive === true)
          .map(item => item.Description);

        setCompanyInfo({ phones });
      } catch (error) {
        console.error('Failed to fetch company info:', error);
      }
    };

    fetchCompanyInfo();
  }, [BASE_URL]);

  const slugify = (text) => {
    return text
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Configure Fuse Options
  const fuseOptions = {
    includeScore: true,
    shouldSort: true,
    keys: [
      { name: "title", weight: 0.7 },
      { name: "description", weight: 0.3 }
    ],
    threshold: 0.4,
  };

  // Initialize Fuse with your data
  const fuse = new Fuse(services, fuseOptions);

  // Create the results variable
  const filteredServices = searchTerm
    ? fuse.search(searchTerm).map((result) => result.item)
    : services;

  // Format phone number to XXX-XXX-XXXX pattern
  const formatPhoneNumber = (phone) => {
    let digits = phone.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) {
      digits = digits.slice(2);
    }
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  const handleContactClick = () => {
    if (companyInfo.phones.length === 0) return;

    const phone = companyInfo.phones[0];
    const number = phone.replace(/\D/g, "");

    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(
      navigator.userAgent
    );

    if (isMobile) {
      window.location.href = `tel:${number}`;
    } else {
      window.open(`https://wa.me/${number}`, "_blank");
    }
  };

  return (
    <div className="service-area-2 pt-50 overflow-hidden">
      <div className="container px-2 px-sm-3 px-md-4">
        {/* Section Header */}
        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-6">
            <div className="title-area text-center mb-4">
              <span className="sub-title" id="services">Our Services</span>
              <h2 className="sec-title">
                Trusted Car Repair Professionals
                <img
                  className="title-bg-shape shape-center d-none d-md-inline"
                  src="assets/img/bg/title-bg-shape.png"
                  alt="Fixturbo"
                />
              </h2>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {/* <div className="search-container mb-4">
          <div className="search-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div> */}
      </div>

      {/* Services Grid */}
      <div className="container">
        {filteredServices.length > 0 ? (
          <div className="row gy-2 gy-md-4 justify-content-center">
            {filteredServices
              .filter(service => service.title !== "Custom Category") // <-- exclude this title
              .map((service, index) => (
                <div
                  key={service.id}
                  className={`col-6 col-sm-6 col-md-4 col-lg-3 animate-fadeInUp delay-${(index % 4) + 1}`}
                >
                  <div
                    className="service-card-minimal"
                    onClick={() => navigate(`/service/${slugify(service.title)}/${service.id}`)}
                  >
                    {/* Background Image - Always Visible */}
                    <div
                      className="service-card-bg"
                      style={{ backgroundImage: `url(${service.image})` }}
                    />

                    {/* Gradient Overlay */}
                    <div className="service-card-overlay" />

                    {/* Card Content */}
                    <div className="service-card-content">
                      {/* Icon */}
                      <div className="service-card-icon">
                        <img src={service.icon} alt={service.title} />
                      </div>

                      {/* Title - Always Visible */}
                      <h4 className="service-card-title">{service.title}</h4>

                      {/* Description - Shows on Hover */}
                      <p className="service-card-desc">{service.description}</p>

                      {/* Book Button - Shows on Hover */}
                      <button
                        className="service-card-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedService(service);
                          setIsModalOpen(true);
                        }}
                      >
                        Book Service <i className="fas fa-arrow-right" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="no-results">
            <img
              src="https://cdn-icons-png.flaticon.com/512/7486/7486754.png"
              alt="No results"
            />
            <h4>Whoops! No search result found.</h4>
            <p>It looks like we don't have what you're looking for right now.</p>
            <button
              className="btn"
              onClick={() => setSearchTerm('')}
            >
              View All Services
            </button>
          </div>
        )}
      </div>

      {/* Quick Support Section */}
      <div className="container support-section mt-5">
        <div className="row justify-content-center mb-4">
          <div className="col-lg-8 col-xl-6">
            <div className="title-area text-center">
              <span className="sub-title">Need Help?</span>
              <h2 className="sec-title">Get Support Instantly</h2>
            </div>
          </div>
        </div>

        <div className="row justify-content-center g-4" id="help">
          {/* Call Support Card */}
          <div className="col-12 col-md-6 col-lg-5">
            <div className="support-card call-support">
              <div
                className="bg-image"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1556740758-90de374c12ad?q=80&w=1000&auto=format&fit=crop')"
                }}
              />
              <div className="overlay" />
              <div className="content">
                <div className="icon-wrapper">
                  <i className="bi bi-telephone"></i>
                </div>
                <h4>
                  Quick Call Support - {companyInfo.phones.length > 0
                    ? `(+91 ${formatPhoneNumber(companyInfo.phones[0])})`
                    : '(Loading...)'}
                </h4>
                <p>
                  Connect directly with our support team for immediate help.
                  <br />
                  {/* <strong>+91 707-524-3939</strong> */}
                </p>
                <button
                  className="support-btn"
                  onClick={handleContactClick}
                  disabled={companyInfo.phones.length === 0}
                >
                  <FaPhoneAlt />
                  <span>Get Free Call Support</span>
                  <FaArrowRight className="btn-arrow" />
                </button>
              </div>
            </div>
          </div>

          {/* AI Support Card */}
          <div className="col-12 col-md-6 col-lg-5">
            <div className="support-card ai-support">
              <div
                className="bg-image"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop')"
                }}
              />
              <div className="overlay" />
              <div className="content">
                <div className="icon-wrapper">
                  <i className="bi bi-robot"></i>
                </div>
                <h4>AI Analysis Support</h4>
                <p>
                  Get instant answers from our AI-powered support assistant.
                </p>
                <button
                  className="support-btn"
                  onClick={() => {
                    window.dispatchEvent(new Event("open-ai-chat"));
                  }}
                >
                  <FaRobot />
                  <span>Chat with AI</span>
                  <FaArrowRight className="btn-arrow" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="container steps-section">
        <div className="row justify-content-center mb-4">
          <div className="col-lg-8 col-xl-6">
            <div className="title-area text-center">
              <span className="sub-title">How It Works</span>
              <h2 className="sec-title">Your Service in 3 Easy Steps</h2>
            </div>
          </div>
        </div>

        <div className="row justify-content-center g-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isHovered = hoveredIndex === index;

            return (
              <div
                className="col-12 col-md-4"
                key={index}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="step-card position-relative">
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="step-connector d-none d-md-block" />
                  )}

                  {/* Icon */}
                  <div
                    className="step-icon-wrapper"
                    style={{
                      background: isHovered
                        ? 'linear-gradient(135deg, #1aa1a4 0%, #0a6264 100%)'
                        : 'linear-gradient(135deg, #0a6264 0%, #0e4e50 100%)',
                      transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                      boxShadow: isHovered
                        ? '0 15px 40px rgba(10, 98, 100, 0.4)'
                        : '0 10px 30px rgba(10, 98, 100, 0.3)',
                    }}
                  >
                    <Icon
                      size={36}
                      color="#fff"
                      style={{
                        transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1)',
                        transition: 'transform 0.4s ease',
                      }}
                    />
                    <span className="step-number">{index + 1}</span>
                  </div>

                  {/* Text */}
                  <h4
                    className="step-title"
                    style={{ color: isHovered ? '#0a6264' : '#1a1a2e' }}
                  >
                    {step.title}
                  </h4>
                  <p className="step-description">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Book Service Modal */}
      <BookServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedService={selectedService}
        serviceTypeDetail="Category"
        serviceIdCollect={selectedService ? selectedService.id : 0}
      />
    </div>
  );
};

export default ServiceAreaHomePage;
