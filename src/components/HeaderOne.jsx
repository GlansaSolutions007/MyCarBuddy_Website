import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import SignIn from "./SignIn";
import ChooseCarModal from "./ChooseCarModalGridLayout";
import ProfileModal from "./ProfileModal";
import { useCart } from "../context/CartContext";
import { useAlert } from "../context/AlertContext";
import axios from "axios";
import { FaSearch, FaCar, FaChevronDown, FaTimes, FaBars, FaHeadset } from "react-icons/fa";
import { Phone, MapPin, Mail } from "lucide-react";
import "./HeaderOne.css";
import NotificationDropdown from "./NotificationDropdown";

const API_URL = process.env.REACT_APP_CARBUDDY_BASE_URL;

const HeaderOne = () => {
  // States
  const [scroll, setScroll] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState(false);
  const [signInVisible, setSignInVisible] = useState(false);
  const [registerVisible, setRegisterVisible] = useState(false);
  const [carModalVisible, setCarModalVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [user, setUser] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [locationText, setLocationText] = useState("");
  const [isServiceAvailable, setIsServiceAvailable] = useState(null);
  const [cityList, setCityList] = useState([]);
  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [filteredCities, setFilteredCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [serviceSearchTerm, setServiceSearchTerm] = useState("");
  const [companyInfo, setCompanyInfo] = useState({ email: '', phone: '' });

  // Hooks
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const profileImage = user?.profileImage;

  // Utility Functions
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  const slugify = (text) =>
    text
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const debouncedNavigate = useCallback(
    debounce((value) => {
      if (value.trim()) {
        navigate(`/search?q=${encodeURIComponent(value.trim())}`);
      }
    }, 500),
    [navigate]
  );

  // Handlers
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setServiceSearchTerm(value);
    debouncedNavigate(value);
  };

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

  const isMobileDevice = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);

  const handleContactClick = () => {
    if (!companyInfo.phone) return;

    const number = companyInfo.phone.replace(/\D/g, "");
    if (isMobileDevice) {
      window.location.href = `tel:${number}`;
    } else {
      window.open(`https://wa.me/${number}`, "_blank");
    }
  };

  const handleUserClick = () => {
    if (user && (user.name || user.identifier)) {
      navigate("/profile");
    } else {
      setSignInVisible(true);
    }
    setMobileMenuOpen(false);
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = position.coords;
          localStorage.setItem("location", JSON.stringify(coords));
          localStorage.setItem("locationModalShown", "true");
          setShowLocationModal(false);

          const result = await getCityAndStateFromCoords(coords.latitude, coords.longitude);
          if (result) {
            const { city, state } = result;
            setLocationText(`${city}, ${state}`);
            setIsServiceAvailable(true);
          }
        },
        () => { }
      );
    } else {
      showAlert("Geolocation is not supported by this browser.");
      setLocationText("Location unavailable");
      setIsServiceAvailable(false);
      localStorage.setItem("locationModalShown", "true");
      setShowLocationModal(false);
    }
  };

  const getCityAndStateFromCoords = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === "OK") {
        let city = "", district = "", state = "", pincode = "";
        const components = data.results[0].address_components;

        for (let comp of components) {
          if (comp.types.includes("locality")) city = comp.long_name;
          if (comp.types.includes("administrative_area_level_2")) district = comp.long_name;
          if (comp.types.includes("administrative_area_level_1")) state = comp.long_name;
          if (comp.types.includes("postal_code")) pincode = comp.long_name;
        }
        return { city: city || district, state, pincode };
      }
      return null;
    } catch (error) {
      console.error("Geocode error:", error);
      return null;
    }
  };

  const handleCityPicker = async () => {
    try {
      const cityres = await axios.get(`${API_URL}City`);
      if (Array.isArray(cityres.data)) {
        const activeCities = cityres.data.filter((c) => c.IsActive);
        setCityList(activeCities);
        setFilteredCities(activeCities);
        setShowCityModal(true);
      }
    } catch (error) {
      console.error("City API error:", error);
    }
  };

  const handleCitySearch = (e) => {
    const value = e.target.value.toLowerCase();
    setCitySearchTerm(value);
    setFilteredCities(cityList.filter((c) => c.CityName.toLowerCase().includes(value)));
  };

  const handleSelectCity = (city) => {
    setLocationText(`${city.CityName}, ${city.StateName}`);
    localStorage.setItem("locationText", `${city.CityName}, ${city.StateName}`);
    localStorage.setItem("selectedCity", JSON.stringify(city));
    setIsServiceAvailable(true);
    setShowCityModal(false);
  };

  const renderUserInitials = () => {
    const name = user?.name || user?.identifier || "U";
    return name.split(" ").map((word) => word.charAt(0).toUpperCase()).slice(0, 2).join("");
  };

  // Effects
  useEffect(() => {
    const handleScroll = () => setScroll(window.pageYOffset > 80);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    if (q) setServiceSearchTerm(q);
  }, [location.search]);

  useEffect(() => {
    let timeoutId;
    const handleScroll = () => {
      const alreadyShown = localStorage.getItem("locationModalShown");
      if (!alreadyShown && !timeoutId) {
        timeoutId = setTimeout(() => handleGetLocation(), 3000);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const loadUser = () => {
      const saved = localStorage.getItem("user");
      if (saved) setUser(JSON.parse(saved));
      const carData = localStorage.getItem("selectedCarDetails");
      if (carData) setSelectedCar(JSON.parse(carData));
    };
    loadUser();
    window.addEventListener("userProfileUpdated", loadUser);
    return () => window.removeEventListener("userProfileUpdated", loadUser);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}Category`);
        if (Array.isArray(response.data)) {
          setCategories(response.data.filter((cat) => cat.IsActive));
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
        const response = await axios.get(`${API_URL}CompanyInfo`);
        const data = response.data.data || [];

        // ✅ keep only active records
        const activeData = data.filter(item => item.IsActive === true);

        const email =
          activeData.find(item => item.Type === 'E-mail')?.Description || '';

        const phones =
          activeData
            .filter(item => item.Type === 'PhoneNumber')
            .map(item => item.Description);

        const phone = phones.length > 0 ? phones[0] : '';

        setCompanyInfo({ email, phone });
      } catch (error) {
        console.error('Failed to fetch company info:', error);
      }
    };

    fetchCompanyInfo();
  }, []);

  useEffect(() => {
    if (!isSearchOpen) return;
    const onDocClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    const id = setTimeout(() => document.addEventListener("mousedown", onDocClick), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", onDocClick);
    };
  }, [isSearchOpen]);

  const { hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const element = document.querySelector(hash);
      if (element) element.scrollIntoView({ behavior: "smooth" });
    }
  }, [hash]);

  return (
    <>
      <header className="nav-header header-layout1">
        {/* Top Bar */}
        <div className="mcb-top-bar">
          <div className="container">
            <div className="mcb-top-left">
              <div className="mcb-top-item">
                <Mail size={13} />
                <a href={`mailto:${companyInfo.email}`}>
                  {companyInfo.email || 'Loading...'}
                </a>
              </div>
              <div className="mcb-top-divider" />
              <div className="mcb-top-item" onClick={handleContactClick}>
                {isMobileDevice ? (
                  <Phone size={18} className="mcb-contact-icon" />
                ) : (
                  <i className="fab fa-whatsapp mcb-contact-icon" style={{ fontSize: 18 }}></i>
                )}
                <span>
                  {companyInfo.phone ? `+91 ${formatPhoneNumber(companyInfo.phone)}` : 'Loading...'}
                </span>
              </div>
            </div>
            <div className="mcb-social-links">
              <a href="https://www.facebook.com/people/Mycarbuddyin/61578291056729/" target="_blank" rel="noopener noreferrer"><i className="fab fa-facebook-f" /></a>
              <a href="https://www.instagram.com/mycarbuddy.in/" target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram" /></a>
              <a href="https://www.linkedin.com/company/108159284/" target="_blank" rel="noopener noreferrer"><i className="fab fa-linkedin-in" /></a>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className={`mcb-header-main ${scroll ? "sticky" : ""}`}>
          <div className="container">
            <div className="mcb-header-content">
              {/* Logo */}
              <Link
                to="/"
                className="mcb-logo"
                style={{ display: "flex", alignItems: "center" }}
              >
                <img
                  src="/assets/img/MyCarBuddy-Logo1.webp"
                  alt="MyCarBuddy"
                  style={{
                    height: "50px",     // FIXED SIZE
                    width: "auto",      // ALWAYS KEEP ASPECT RATIO
                    objectFit: "contain",
                    transition: "none", // STOP AUTO SHRINK/GROW ON SCROLL
                  }}
                />
              </Link>

              {/* Navigation */}
              <nav className="mcb-nav">
                <ul className="mcb-nav-list">
                  <li className="mcb-nav-item">
                    <NavLink to="/" className={({ isActive }) => `mcb-nav-link ${isActive ? "active" : ""}`}>Home</NavLink>
                  </li>
                  <li className="mcb-nav-item">
                    <NavLink to="/about" className={({ isActive }) => `mcb-nav-link ${isActive ? "active" : ""}`}>About Us</NavLink>
                  </li>
                  <li className="mcb-nav-item">
                    <Link to="/service" className="mcb-nav-link">
                      Services <FaChevronDown className="mcb-dropdown-arrow" />
                    </Link>
                    <div className="mcb-dropdown">
                      <div className="mcb-dropdown-grid">
                        {categories
                          .filter(cat => cat.CategoryName !== "Custom Category") // <-- exclude this title
                          .map((cat) => (
                            <Link key={cat.CategoryID} to={`/service/${slugify(cat.CategoryName)}/${cat.CategoryID}`} className="mcb-dropdown-link">
                              <i className="fas fa-wrench" />
                              <span>{cat.CategoryName}</span>
                            </Link>
                          ))}
                      </div>
                    </div>
                  </li>
                  <li className="mcb-nav-item">
                    <NavLink to="/contact" className={({ isActive }) => `mcb-nav-link ${isActive ? "active" : ""}`}>Contact</NavLink>
                  </li>
                </ul>
              </nav>

              {/* Actions */}
              <div className="mcb-actions">
                {/* Search */}
                <div ref={searchRef} className={`mcb-search ${isSearchOpen ? "active" : ""}`}>
                  <input
                    type="text"
                    className="mcb-search-input"
                    placeholder="Find services..."
                    value={serviceSearchTerm}
                    onChange={handleSearchChange}
                    onFocus={() => setIsSearchOpen(true)}
                  />
                  <button className="mcb-search-btn" onClick={() => setIsSearchOpen(!isSearchOpen)}>
                    <FaSearch size={14} />
                  </button>
                </div>

                {/* Contact Button */}
                <div className="mcb-contact-wrapper">
                  <div className="mcb-contact-btn" onClick={handleContactClick}>
                    {isMobileDevice ? (
                      <Phone size={18} className="mcb-contact-icon" />
                    ) : (
                      <i className="fab fa-whatsapp mcb-contact-icon" style={{ fontSize: 18 }}></i>
                    )}

                    <div className="mcb-contact-text">
                      <span className="mcb-contact-label">
                        {isMobileDevice ? "Call Support" : "WhatsApp Support"}
                      </span>
                      <span className="mcb-contact-number">
                        {companyInfo.phone ? `+91 ${formatPhoneNumber(companyInfo.phone)}` : 'Loading...'}
                      </span>
                    </div>
                  </div>
                  <div className="mcb-contact-tooltip">
                    <div className="mcb-tooltip-glow"></div>
                    <div className="mcb-tooltip-content">
                      <div className="mcb-tooltip-icon-wrap">
                        <FaHeadset className="mcb-tooltip-icon" />
                        <span className="mcb-tooltip-pulse"></span>
                      </div>
                      <div className="mcb-tooltip-info">
                        <span className="mcb-tooltip-title">Get Our Expert Help?</span>
                        <span className="mcb-tooltip-desc">One tap to connect with our <br />car care specialists!</span>
                        {/* <span className="mcb-tooltip-badge">
                          <span className="mcb-badge-dot"></span>
                          Always Here to Help • Free Consultation</span> */}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notification Button */}
                {(user?.name || user?.identifier) && (
                  <div className="mcb-notification-btn">
                    <NotificationDropdown />
                  </div>
                )}

                {/* Choose Car Chip */}
                <div
                  className="mcb-car-chip"
                  onClick={() => setCarModalVisible(true)}
                  title={selectedCar ? `${selectedCar.brand?.name} ${selectedCar.model?.name}` : "Choose Your Car"}
                >
                  <div className="mcb-car-chip-avatar">
                    {selectedCar?.model?.logo ? (
                      <img
                        src={selectedCar.model.logo}
                        alt={selectedCar.model?.name}
                        onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; }}
                      />
                    ) : (
                      <FaCar size={16} className="mcb-car-chip-fallback" />
                    )}
                  </div>
                  <div className="mcb-car-chip-info">
                    <span className="mcb-car-chip-label">{selectedCar
                      ? `${selectedCar.brand?.name || ""}` 
                      : ""}
                    </span>
                    <span className="mcb-car-chip-name">
                      {selectedCar
                        ? `${selectedCar.model?.name || ""}`.trim()
                        : "Choose Car"}
                    </span>
                  </div>
                </div>

                {/* User Button */}
                <div className="mcb-user-wrapper">
                  <div className="mcb-user-btn" onClick={handleUserClick}>
                    <div className="mcb-user-avatar">
                      {user?.name || user?.identifier ? (
                        profileImage ? (
                          <img
                            src={`${process.env.REACT_APP_CARBUDDY_IMAGE_URL}${profileImage}`}
                            alt="Profile"
                            onError={(e) => { e.target.onerror = null; e.target.src = "/assets/img/avatar.png"; }}
                          />
                        ) : renderUserInitials()
                      ) : (
                        <i className="fas fa-user" style={{ fontSize: 12 }} />
                      )}
                    </div>
                    <div className="mcb-user-info">
                      <span className="mcb-user-label">{user?.name || user?.identifier ? "Hello," : "Sign In"}</span>
                      <span className="mcb-user-name">{user?.name || user?.identifier || "Account"}</span>
                    </div>
                  </div>

                  {/* User Dropdown on Hover */}
                  {(user?.name || user?.identifier) && (
                    <div className="mcb-user-dropdown">
                      <div className="mcb-user-dropdown-header">
                        <div className="mcb-dropdown-avatar">
                          {profileImage ? (
                            <img
                              src={`${process.env.REACT_APP_CARBUDDY_IMAGE_URL}${profileImage}`}
                              alt="Profile"
                              onError={(e) => { e.target.onerror = null; e.target.src = "/assets/img/avatar.png"; }}
                            />
                          ) : (
                            <span>{renderUserInitials()}</span>
                          )}
                        </div>
                        <div className="mcb-dropdown-user-info">
                          <span className="mcb-dropdown-name">{user?.name || "User"}</span>
                          <span className="mcb-dropdown-phone">{user?.phone || user?.identifier}</span>
                        </div>
                      </div>
                      <div className="mcb-user-dropdown-body">
                        <button className="mcb-dropdown-item" onClick={() => navigate("/profile")}>
                          <i className="fas fa-user-circle"></i>
                          <span>My Profile</span>
                        </button>
                        <button className="mcb-dropdown-item" onClick={() => navigate("/profile?tab=mybookings")}>
                          <i className="fas fa-calendar-check"></i>
                          <span>My Services</span>
                        </button>
                        {/* <button className="mcb-dropdown-item" onClick={() => navigate("/profile?tab=invoices")}>
                          <i className="fas fa-file-invoice"></i>
                          <span>Invoices</span>
                        </button> */}
                      </div>
                      <div className="mcb-user-dropdown-footer">
                        <button
                          className="mcb-logout-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            localStorage.removeItem("user");
                            localStorage.removeItem("selectedCarDetails");
                            setUser(null);
                            setSelectedCar(null);
                            window.dispatchEvent(new Event("userProfileUpdated"));
                            showAlert("Success", "Logged out successfully", 2000, "success");
                            navigate("/");
                          }}
                        >
                          <i className="fas fa-sign-out-alt"></i>
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Car Chip - visible only on mobile */}
                <div
                  className="mcb-header-car-chip-mobile"
                  onClick={() => setCarModalVisible(true)}
                  title={selectedCar ? `${selectedCar.brand?.name} ${selectedCar.model?.name}` : "Choose Car"}
                >
                  <div className="mcb-header-car-avatar-mobile">
                    {selectedCar?.model?.logo ? (
                      <img
                        src={selectedCar.model.logo}
                        alt={selectedCar.model?.name}
                        onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; }}
                      />
                    ) : (
                      <FaCar size={15} />
                    )}
                  </div>
                  {/* <div className="mcb-header-car-text-mobile">
                    <span className="mcb-header-car-label-mobile">My Car</span>
                    <span className="mcb-header-car-name-mobile">
                      {selectedCar
                        ? `${selectedCar.brand?.name || ""} ${selectedCar.model?.name || ""}`.trim()
                        : "Choose Car"}
                    </span>
                  </div> */}
                </div>

                {/* Mobile Toggle */}
                <button className="mcb-mobile-toggle" onClick={() => setMobileMenuOpen(true)}>
                  <FaBars />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`mcb-mobile-overlay ${mobileMenuOpen ? "active" : ""}`} onClick={() => setMobileMenuOpen(false)}>
          <div className="mcb-mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mcb-mobile-header">
              <Link to="/" className="mcb-mobile-logo" onClick={() => setMobileMenuOpen(false)}>
                <img src="/assets/img/MyCarBuddy-Logo1.png" alt="MyCarBuddy" />
              </Link>
              <button className="mcb-mobile-close" onClick={() => setMobileMenuOpen(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="mcb-mobile-body">
              <ul className="mcb-mobile-nav">
                <li className="mcb-mobile-nav-item">
                  <NavLink to="/" className={({ isActive }) => `mcb-mobile-nav-link ${isActive ? "active" : ""}`} onClick={() => setMobileMenuOpen(false)}>Home</NavLink>
                </li>
                <li className="mcb-mobile-nav-item">
                  <NavLink to="/about" className={({ isActive }) => `mcb-mobile-nav-link ${isActive ? "active" : ""}`} onClick={() => setMobileMenuOpen(false)}>About Us</NavLink>
                </li>
                <li className={`mcb-mobile-nav-item ${mobileSubmenuOpen ? "open" : ""}`}>
                  <div className="mcb-mobile-nav-link" onClick={() => setMobileSubmenuOpen(!mobileSubmenuOpen)}>
                    <span>Services</span>
                    <i className="fas fa-chevron-down" />
                  </div>
                  <div className="mcb-mobile-submenu">
                    <Link to="/service" className="mcb-mobile-submenu-link" onClick={() => setMobileMenuOpen(false)}>All Services</Link>
                    {categories.map((cat) => (
                      <Link key={cat.CategoryID} to={`/service/${slugify(cat.CategoryName)}/${cat.CategoryID}`} className="mcb-mobile-submenu-link" onClick={() => setMobileMenuOpen(false)}>
                        {cat.CategoryName}
                      </Link>
                    ))}
                  </div>
                </li>
                <li className="mcb-mobile-nav-item">
                  <NavLink to="/contact" className={({ isActive }) => `mcb-mobile-nav-link ${isActive ? "active" : ""}`} onClick={() => setMobileMenuOpen(false)}>Contact</NavLink>
                </li>
              </ul>
            </div>

            <div className="mcb-mobile-footer">
              <div className="mcb-mobile-contact">
                <a href={`mailto:${companyInfo.email}`} className="mcb-mobile-contact-item">
                  <Mail size={14} />
                  <span>{companyInfo.email || 'Loading...'}</span>
                </a>

              </div>
              <button className="mcb-mobile-call-btn" onClick={handleContactClick}>
                <Phone size={16} />
                <span>
                  {companyInfo.phone ? `Call +91 ${formatPhoneNumber(companyInfo.phone)}` : 'Loading...'}
                </span>
              </button>
              <div className="mcb-mobile-social">
                <a href="https://www.facebook.com/people/Mycarbuddyin/61578291056729/" target="_blank" rel="noopener noreferrer"><i className="fab fa-facebook-f" /></a>
                <a href="https://www.instagram.com/mycarbuddy.in/" target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram" /></a>
                <a href="https://www.linkedin.com/company/108159284/" target="_blank" rel="noopener noreferrer"><i className="fab fa-linkedin-in" /></a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="mcb-modal-overlay">
          <div className="mcb-modal mcb-location-modal">
            <div className="mcb-location-icon">
              <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="Location" />
            </div>
            <h4>Allow Location Access</h4>
            <p>We use your location to show services near you.</p>
            <button className="mcb-location-btn" onClick={handleGetLocation}>
              <MapPin size={16} />
              Get Location
            </button>
          </div>
        </div>
      )}

      {/* City Search Modal */}
      {showCityModal && (
        <div className="mcb-modal-overlay" onClick={() => setShowCityModal(false)}>
          <div className="mcb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mcb-modal-header">
              <h5>Select Your City</h5>
              <button className="mcb-modal-close" onClick={() => setShowCityModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="mcb-modal-body">
              <div className="mcb-city-search">
                <input
                  type="text"
                  className="mcb-city-input"
                  placeholder="Search city..."
                  value={citySearchTerm}
                  onChange={handleCitySearch}
                  autoFocus
                />
              </div>
              <div className="mcb-city-list">
                {filteredCities.length > 0 ? (
                  filteredCities.map((city) => (
                    <button key={city.CityID} className="mcb-city-item" onClick={() => handleSelectCity(city)}>
                      {city.CityName}, {city.StateName}
                    </button>
                  ))
                ) : (
                  <div className="mcb-city-empty">No cities found</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Button */}
      <div className="carAnalysisButton">
        <button
          onClick={() => navigate("/car-damage-analysis")}
          className="floating-right-button"
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.05)";
            e.target.style.boxShadow = "0 12px 35px rgba(17, 109, 110, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)";
            e.target.style.boxShadow = "0 8px 25px rgba(17, 109, 110, 0.3)";
          }}
          title="AI Car Damage Analysis"
        >
          <FaCar size={20} />
          <span>AI Damage Analysis</span>
        </button>
      </div>

      {/* Modals */}
      <SignIn
        isVisible={signInVisible}
        onClose={() => setSignInVisible(false)}
        onRegister={() => { setSignInVisible(false); setRegisterVisible(true); }}
        onForgotPassword={() => setSignInVisible(false)}
      />

      <ChooseCarModal
        isVisible={carModalVisible}
        onClose={() => {
          setCarModalVisible(false);
          const saved = localStorage.getItem("selectedCarDetails");
          if (saved) setSelectedCar(JSON.parse(saved));
        }}
        onCarSaved={(car) => setSelectedCar(car)}
      />

      <ProfileModal
        isVisible={profileVisible}
        onClose={() => setProfileVisible(false)}
        onRegister={() => { setProfileVisible(false); setRegisterVisible(true); }}
      />
    </>
  );
};

export default HeaderOne;