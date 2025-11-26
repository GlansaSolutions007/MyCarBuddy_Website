import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import SignIn from "./SignIn";
import RegisterModal from "./RegisterModal";
import { FaCarSide, FaSearch } from "react-icons/fa";
// import ChooseCarModal from "./ChooseCarModal";
import ChooseCarModal from "./ChooseCarModalGridLayout";

import { FaShoppingCart } from "react-icons/fa";
import { useCart } from "../context/CartContext";
import ProfileModal from "./ProfileModal";
import { useAlert } from "../context/AlertContext";
import axios from "axios";
import { FaCar } from "react-icons/fa";
import NotificationDropdown from "./NotificationDropdown";
import CryptoJS from "crypto-js";
import { BsGooglePlay } from "react-icons/bs"; // this line fixes the error

const API_URL = process.env.REACT_APP_CARBUDDY_BASE_URL;
const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;

const HeaderOne = () => {
  const [active, setActive] = useState(false);
  const [scroll, setScroll] = useState(false);
  const [signInVisible, setSignInVisible] = useState(false);
  const [registerVisible, setRegisterVisible] = useState(false);
  const [carModalVisible, setCarModalVisible] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const [locationText, setLocationText] = useState("");
  const [isServiceAvailable, setIsServiceAvailable] = useState(null);

  const [user, setUser] = useState(null);
  const [profileVisible, setProfileVisible] = useState(false);
  const profileImage = user?.profileImage;

  const { cartItems } = useCart();
  const itemCount = cartItems.length;
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const [showLocationSearchModal, setShowLocationSearchModal] = useState(false);
  const [cityList, setCityList] = useState([]);
  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [filteredCities, setFilteredCities] = useState([]);

  const [categories, setCategories] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // New state for service search
  const [serviceSearchTerm, setServiceSearchTerm] = useState("");
  const [decryptedUserId, setDecryptedUserId] = useState("");

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  const debouncedNavigate = useCallback(
    debounce((value) => {
      if (value.trim()) {
        navigate(`/search?q=${encodeURIComponent(value.trim())}`);
      }
    }, 500),
    [navigate]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setServiceSearchTerm(value);
    debouncedNavigate(value);
  };

  // Close full-width search on Escape
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsSearchOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Close search when clicking outside
  const searchRef = useRef(null);
  const searchBtnRef = useRef(null);
  useEffect(() => {
    if (!isSearchOpen) return;
    const onDocClick = (e) => {
      const withinPopup =
        searchRef.current && searchRef.current.contains(e.target);
      const onTrigger =
        searchBtnRef.current && searchBtnRef.current.contains(e.target);
      if (!withinPopup && !onTrigger) setIsSearchOpen(false);
    };
    // Slight delay so initial click that opens doesn't immediately close
    const id = setTimeout(
      () => document.addEventListener("mousedown", onDocClick),
      0
    );
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", onDocClick);
    };
  }, [isSearchOpen]);

  // const handleSearchSubmit = (e) => {
  // 	e.preventDefault();
  // 	if (serviceSearchTerm.trim()) {
  // 		navigate(`/search?q=${encodeURIComponent(serviceSearchTerm.trim())}`);
  // 	}
  // };

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    if (q) setServiceSearchTerm(q);
  }, [location.search]);

  useEffect(() => {
    let timeoutId;

    const handleScroll = () => {
      // Only show modal if it hasn't been shown yet
      const alreadyShown = localStorage.getItem("locationModalShown");
      if (!alreadyShown && !timeoutId) {
        // Wait 5 seconds after first scroll
        timeoutId = setTimeout(() => {
          // setShowLocationModal(true);
          handleGetLocation();
        }, 3000);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("selectedCarDetails");
    if (saved) {
      try {
        setSelectedCar(JSON.parse(saved));
      } catch (err) {
        console.error("Error parsing saved car", err);
      }
    }
  }, []);

  useEffect(() => {
    const loadUser = () => {
      const saved = localStorage.getItem("user");
      if (saved) {
        setUser(JSON.parse(saved));
      }

      const carData = localStorage.getItem("selectedCarDetails");
      if (carData) {
        setSelectedCar(JSON.parse(carData));
      }
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
          const activeCategories = response.data.filter((cat) => cat.IsActive);
          setCategories(activeCategories);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    var offCanvasNav = document.getElementById("offcanvas-navigation");
    var offCanvasNavSubMenu = offCanvasNav.querySelectorAll(".sub-menu");

    for (let i = 0; i < offCanvasNavSubMenu.length; i++) {
      offCanvasNavSubMenu[i].insertAdjacentHTML(
        "beforebegin",
        "<span class='mean-expand-class'>+</span>"
      );
    }

    var menuExpand = offCanvasNav.querySelectorAll(".mean-expand-class");
    var numMenuExpand = menuExpand.length;

    function sideMenuExpand() {
      if (this.parentElement.classList.contains("active") === true) {
        this.parentElement.classList.remove("active");
      } else {
        for (let i = 0; i < numMenuExpand; i++) {
          menuExpand[i].parentElement.classList.remove("active");
        }
        this.parentElement.classList.add("active");
      }
    }

    for (let i = 0; i < numMenuExpand; i++) {
      menuExpand[i].addEventListener("click", sideMenuExpand);
    }
    window.onscroll = () => {
      if (window.pageYOffset < 150) {
        setScroll(false);
      } else if (window.pageYOffset > 150) {
        setScroll(true);
      }
      return () => (window.onscroll = null);
    };
  }, []);

  const mobileMenu = () => {
    setActive(!active);
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = position.coords;
          setUserLocation(coords);
          localStorage.setItem("location", JSON.stringify(coords));
          localStorage.setItem("locationModalShown", "true");
          setShowLocationModal(false);

          const result = await getCityAndStateFromCoords(
            coords.latitude,
            coords.longitude
          );
          console.log(result);
          console.log(coords.latitude, coords.longitude);
          if (result) {
            const { city, state, pincode } = result;
            setLocationText(`${city}, ${state}`);

            try {
              const token = localStorage.getItem("token"); // adjust if you're storing token differently

              const res = await axios.get(`${API_URL}State`);
              const cityres = await axios.get(`${API_URL}City`);

              const states = res.data;
              const matched = states.find(
                (s) =>
                  s.StateName.toLowerCase() === state.toLowerCase() &&
                  s.IsActive
              );
              const cities = cityres.data;
              const matchedCity = cities.find(
                (c) =>
                  c.CityName.toLowerCase() === city.toLowerCase() && c.IsActive
              );
              const pincodeMatched = cities.find(
                (c) => c.Pincode === pincode.toLowerCase() && c.IsActive
              );

              console.log("Matched State:", pincodeMatched);

              if (matched && pincodeMatched) {
                setIsServiceAvailable(true);
              } else {
                setIsServiceAvailable(true);
                // showAlert("Service is not available in your state.");
              }
            } catch (err) {
              console.error("State API error:", err);
              setIsServiceAvailable(true);
              // showAlert("Service is not available in your state.");
            }
          }
        },
        (error) => {
          // const alreadyShown = localStorage.getItem("locationModalShown");
          // if (!alreadyShown) {
          //   handleCityPicker();
          // }
          // setLocationText("Location not found");
          // setIsServiceAvailable(false);
          // setShowLocationModal(false);
        }
      );
    } else {
      showAlert("Geolocation is not supported by this browser.");
      setLocationText("Location unavailable");
      setIsServiceAvailable(false);
      localStorage.setItem("locationModalShown", "true");
      setShowLocationModal(false);
    }
  };

  const handleCloseModal = () => {
    localStorage.setItem("locationModalShown", "true");
    setShowLocationModal(false);
  };

  const getCityAndStateFromCoords = async (lat, lon) => {
    console.log(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
    );
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();

      if (data.status === "OK") {
        let city = "";
        let district = "";
        let state = "";
        let pincode = "";

        const components = data.results[0].address_components;

        for (let comp of components) {
          if (comp.types.includes("locality")) {
            city = comp.long_name; // Hyderabad usually
          }
          if (comp.types.includes("administrative_area_level_2")) {
            district = comp.long_name; // Hyderabad district
          }
          if (comp.types.includes("administrative_area_level_1")) {
            state = comp.long_name; // Telangana
          }
          if (comp.types.includes("postal_code")) {
            pincode = comp.long_name;
          }
        }

        // ✅ Restriction logic
        return { city: city || district, state, pincode };
      } else {
        console.error("Geocode error:", data.status);
        return null;
      }
    } catch (error) {
      console.error("Google Maps reverse geocode error:", error);
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
        setShowLocationSearchModal(true);
      }
    } catch (error) {
      console.error("City API fetch error:", error);
    }
  };

  const handleCitySearch = (e) => {
    const value = e.target.value.toLowerCase();
    setCitySearchTerm(value);
    setFilteredCities(
      cityList.filter((c) => c.CityName.toLowerCase().includes(value))
    );
  };

  const handleSelectCity = (city) => {
    setLocationText(`${city.CityName}, ${city.StateName}`);
    localStorage.setItem("locationText", `${city.CityName}, ${city.StateName}`);
    localStorage.setItem("selectedCity", JSON.stringify(city));
    setIsServiceAvailable(true);
    setShowLocationSearchModal(false);
  };

  const slugify = (text) => {
    return text
      .toLowerCase()
      .replace(/&/g, "and") // replace "&" with "and"
      .replace(/[^a-z0-9]+/g, "-") // replace all non-alphanumeric with "-"
      .replace(/^-+|-+$/g, ""); // trim starting/ending "-"
  };

  const { hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [hash]);


  return (
    <>
      <header className={`nav-header header-layout1 ${scroll ? "m-180" : ""}`}>
        <div className="header-top">
          <div className="container">
            <div className="row justify-content-center justify-content-lg-between align-items-center gy-2">
              <div className="col-auto d-none d-lg-block">
                <div className="header-links pl-30">
                  <ul>
                    <li>
                      <i className="fas fa-envelope" />
                      <Link to="mailto:info@mycarbuddy.in">
                        info@mycarbuddy.in
                      </Link>
                    </li>
                    <li>
                      <i className="fas fa-map-marker-alt" />
                      {isServiceAvailable === false ? (
                        <span className="text-danger">
                          Service is not available in your state
                        </span>
                      ) : (
                        <>
                          <span
                            onClick={handleCityPicker}
                            style={{ cursor: "pointer" }}
                          >
                            {" "}
                            {locationText || "Pick your city"}
                          </span>
                        </>
                      )}
                    </li>
                    {/* <li>
                      <i className="fas fa-clock" />
                      Monday - Sunday
                    </li> */}
                  </ul>
                </div>
              </div>
              {isSearchOpen && (
                <div
                  style={{
                    position: "absolute",
                    zIndex: 1050,
                    display: "none",
                  }}
                  ref={searchRef}
                >
                  <div
                    className="position-absolute"
                    style={{ marginTop: 100, right: "35%", left: "auto" }}
                  >
                    <div className="input-group" style={{ width: 260 }}>
                      <span
                        className="input-group-text"
                        style={{ background: "#fff" }}
                      >
                        <FaSearch style={{ color: "#116d6e" }} />
                      </span>
                      <input
                        type="text"
                        placeholder="Search packages..."
                        value={serviceSearchTerm}
                        onChange={handleSearchChange}
                        className="form-control"
                        autoFocus
                      />
                      <button
                        className="btn btn-outline-secondary px-3 py-1"
                        onClick={() => setIsSearchOpen(false)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="col-auto">
                <div className="header-links ps-0">
                  <ul>
                    <li>
                      <div className="social-links">
                        <Link
                          to="https://www.facebook.com/people/Mycarbuddyin/61578291056729/?sk=about_details"
                          target="_blank"
                        >
                          <i className="fab fa-facebook-f" />
                        </Link>
                        <Link
                          to="https://www.instagram.com/mycarbuddy.in/"
                          target="_blank"
                        >
                          <i className="fab fa-instagram" />
                        </Link>
                        {/* <Link to="" target="_blank">
                          <i className="fab fa-twitter" />
                        </Link> */}
                        <Link
                          to="https://www.linkedin.com/company/108159284/admin/dashboard/"
                          target="_blank"
                        >
                          <i className="fab fa-linkedin" />
                        </Link>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={`sticky-wrapper ${scroll ? "sticky" : ""}`}>
          {/* Main Menu Area */}
          <div className="menu-area">
            {/* <div className="header-navbar-logo ">
              <Link to="/">
                <img src="/assets/img/MyCarBuddy-Logo1.png" alt="MyCarBuddy" />
              </Link>
            </div> */}
            <div className="container">
              <div className="row align-items-center justify-content-lg-start justify-content-between">
                <div className="col-auto d-block">
                  <div className="header-logo1 p-3">
                    <Link to="/">
                      <img
                        src="/assets/img/MyCarBuddy-Logo1.webp"
                        alt="MyCarBuddy"
                        width={200}
                        height={100}
                      />
                    </Link>
                  </div>
                </div>
                <div className="col-auto m-auto">
                  <nav className="main-menu d-none d-lg-inline-block">
                    <ul>
                      <li>
                        <Link to="/">Home</Link>
                      </li>
                      <li>
                        <NavLink
                          to="/about"
                          className={(navData) =>
                            navData.isActive ? "active" : ""
                          }
                        >
                          About Us
                        </NavLink>
                      </li>

                      {/* <li className="menu-item-has-children">
                        <Link to="/service">Services</Link>
                        <ul
                          className="sub-menu"
                          // onMouseEnter={() => setDropdownOpen(true)}
                          // onMouseLeave={() => setDropdownOpen(false)}
                          style={{
                            padding: "10px 20px",
                            margin: 0,
                            minWidth: "500px",
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: "10px 20px",
                            borderRadius: "6px",
                          }}
                        >
                          {categories.map((category) => (
                            <li
                              key={category.CategoryID}
                              style={{ padding: "5px 0" }}
                            >
                              <Link
                                to={`/service/${slugify(
                                  category.CategoryName
                                )}/${category.CategoryID}`}
                                style={{
                                  color: "#333",
                                  textDecoration: "none",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {category.CategoryName}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li> */}
                      <li>
                        {/* <a href="#services">Services</a> */}
                        <Link to="/#services">Services</Link>
                      </li>

                      <li>
                        <NavLink
                          to="/contact"
                          className={(navData) =>
                            navData.isActive ? "active" : ""
                          }
                        >
                          Contact
                        </NavLink>
                      </li>
                    </ul>
                  </nav>
                  <div className="navbar-right d-inline-flex d-lg-none">
                    <button
                      type="button"
                      className="menu-toggle icon-btn"
                      onClick={mobileMenu}
                    >
                      <i className="fas fa-bars" />
                    </button>
                  </div>
                </div>

                <div className="col-auto ml-auto d-xl-block ">
                  <div className="navbar-right-desc">
                    <div className="header-grid-wrap d-flex align-items-center gap-6">
                      <div className="search-area" style={{ height: "100%" }}>
                        <div
                          className="single-search"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            marginBottom: "auto",
                            marginTop: "auto",
                            height: 40,
                            backgroundColor: "white",
                            borderRadius: 30,
                            //  padding: 10,
                            background: "#8bb8b6",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <input
                            className="custom-input"
                            type="text"
                            placeholder="What are you looking for ..."
                            value={serviceSearchTerm}
                            onChange={handleSearchChange}
                            onFocus={() => setIsSearchOpen(true)}
                            style={{
                              border: 0,
                              outline: 0,
                              width: isSearchOpen ? "150px" : "0px",
                              lineHeight: "40px",
                              transition: "width 0.4s linear",
                              padding: isSearchOpen ? "0 10px" : "0",
                              fontSize: "16px",
                              background: "transparent",
                            }}
                          />
                          <a
                            href="#"
                            className="icon-area"
                            onClick={(e) => {
                              e.preventDefault();
                              setIsSearchOpen(!isSearchOpen);
                            }}
                            style={{
                              justifyContent: "center",
                              alignItems: "center",
                              borderRadius: "50%",
                              height: 40,
                              width: 40,
                              display: "flex",
                              textDecoration: "none",
                              color: "#262626",
                              background: isSearchOpen
                                ? "white"
                                : "transparent",
                            }}
                          >
                            <FaSearch style={{ color: "#116d6e" }} />
                          </a>
                        </div>
                      </div>

                      {/* <div className="header-search d-xl-block" ref={searchBtnRef}>
                                    <Link  aria-label="Open search" style={{ color: '#116d6e' }} onClick={() => setIsSearchOpen(s => !s)}>
										<FaSearch size={18} />
									</Link>
								</div> */}

                      {/* <div
                        className="navbar-right-desc-details "
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          cursor: "pointer",
                        }}
                        onClick={() => setCarModalVisible(true)}
                      >
                        {!selectedCar && (
                          <span
                            className="header-grid-text"
                            style={{
                              fontSize: "13px",
                              color: "#666",
                              marginBottom: "2px",
                            }}
                          >
                            Vehicle
                          </span>
                        )}
                        <h6
                          className="header-grid-title"
                          style={{
                            fontSize: "15px",
                            fontWeight: 600,
                            color: "#116d6e",
                          }}
                        >
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            {selectedCar ? (
                              <>
                                <img
                                  src={
                                    selectedCar.model?.logo ||
                                    "https://via.placeholder.com/50"
                                  }
                                  alt={selectedCar.model?.name}
                                  style={{
                                    width: 40,
                                    height: 40,
                                    objectFit: "contain",
                                    backgroundColor: "#fff",
                                  }}
                                />
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    marginTop: "10px",
                                  }}
                                >
                                  <small
                                    style={{ fontSize: "12px", color: "#555" }}
                                  >
                                    {selectedCar.brand?.name}
                                  </small>
                                  <strong>{selectedCar.model?.name}</strong>
                                </div>
                              </>
                            ) : (
                              <span style={{ textDecoration: "underline" }}>
                                Choose Your Car
                              </span>
                            )}
                          </span>
                        </h6>
                      </div> */}

                      {/* <div
                        className="navbar-right-desc-details signDiv d-none d-md-flex"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          if (user && (user.name || user.identifier)) {
                            navigate("/profile");
                          } else {
                            setSignInVisible(true); // Show sign-in modal
                          }
                        }}
                      >
                        {user?.name || user?.identifier ? (
                          <>
                            <div
                              style={{
                                width: "35px",
                                height: "35px",
                                borderRadius: "50%",
                                backgroundColor: "#f0f8ff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: "4px",
                                border: "2px solid #116d6e",
                                fontSize: "15px",
                                fontWeight: "600",
                                color: "#116d6e",
                              }}
                            >
                              {profileImage ? (
                                <img
                                  src={`${process.env.REACT_APP_CARBUDDY_IMAGE_URL}${profileImage}`}
                                  alt="Profile"
                                  className="rounded-circle border"
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "/assets/img/avatar.png";
                                  }}
                                />
                              ) : (
                                <div className="avatar-placeholder">
                                  {(user?.name || user?.identifier || "U")
                                    .split(" ")
                                    .map((word) => word.charAt(0).toUpperCase())
                                    .slice(0, 2)
                                    .join("")}
                                </div>
                              )}
                            </div>
                            <span
                              className="header-grid-text1 fw-bold"
                              style={{
                                fontSize: "12px",
                                color: "#555",
                                // textAlign: "center",
                                marginLeft: "5px",
                              }}
                            >
                              Hello,
                              <h6
                                class="header-grid-title"
                                style={{
                                  fontSize: "15px",
                                  color: "#136d6e",
                                  textDecoration: "underline",
                                }}
                              >
                                {user.name || user.identifier}
                              </h6>
                            </span>
                          </>
                        ) : (
                          <>
                            <span
                              className="header-grid-text1 fw-bold"
                              style={{
                                fontSize: "13px",
                                color: "#555",
                                marginBottom: "2px",
                              }}
                            >
                              Sign In
                              <h6
                                className="header-grid-title"
                                style={{
                                  fontSize: "15px",
                                  fontWeight: 600,
                                  color: "#116d6e",
                                  textDecoration: "underline",
                                }}
                              >
                                Account
                              </h6>
                            </span>
                          </>
                        )}
                      </div> */}

                      {/* <div
                        className="navbar-right-desc-details"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        id="GotoCart"
                      >
                        <span
                          className="header-grid-text"
                          style={{ visibility: "hidden" }}
                        > */}
                      {/* Cart */}
                      {/* </span>
                        <Link
                          to="/cart"
                          title="Go to Cart"
                          style={{ color: "#116d6e", position: "relative" }}
                        >
                          <FaShoppingCart size={22} />
                          {itemCount > 0 && (
                            <span className="badge bg-danger position-absolute top-0 start-100 translate-middle">
                              {itemCount}
                            </span>
                          )}
                        </Link>
                      </div> */}

                      {/* Notifications */}
                      {/* {user?.id && (
                        <div
                          className="navbar-right-desc-details"
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            className="header-grid-text"
                            style={{ visibility: "hidden" }}
                          >
                          </span>
                          <NotificationDropdown />
                        </div>
                      )} */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <SignIn
              isVisible={signInVisible}
              onClose={() => setSignInVisible(false)}
              onRegister={() => {
                setSignInVisible(false);
                setRegisterVisible(true);
              }}
              onForgotPassword={() => {
                setSignInVisible(false);
              }}
            />
            {/* <RegisterModal
              isVisible={registerVisible}
              onClose={() => setRegisterVisible(false)}
              onBackToSignIn={() => {
                setRegisterVisible(false);
                setSignInVisible(true);
              }}
              onRegistered={(updatedUser) => {
                setRegisterVisible(false);
                setUser(updatedUser);
              }}
            /> */}
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
              onRegister={() => {
                setProfileVisible(false);
                setRegisterVisible(true);
              }}
            />
            {/* <div className="logo-bg" /> */}
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`mobile-menu-wrapper  ${active && "body-visible"}`}>
          <div className="mobile-menu-area">
            <div className="mobile-logo">
              <Link to="/">
                <img src="/assets/img/MyCarBuddy-Logo1.png" alt="MyCarBuddy" />
              </Link>
              <button className="menu-toggle" onClick={mobileMenu}>
                <i className="fa fa-times" />
              </button>
            </div>
            <div className="mobile-menu">
              <ul id="offcanvas-navigation">
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li>
                  <NavLink
                    to="/about"
                    className={(navData) => (navData.isActive ? "active" : "")}
                  >
                    About
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/service"
                    className={(navData) => (navData.isActive ? "active" : "")}
                  >
                    Service
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/contact"
                    className={(navData) => (navData.isActive ? "active" : "")}
                  >
                    Contact
                  </NavLink>
                </li>

                {/* {user?.id ? (
                  <>
                    <li>
                      <NavLink
                        to="/profile"
                        className={(navData) =>
                          navData.isActive ? "active" : ""
                        }
                      >
                        Profile
                      </NavLink>
                    </li> */}
                {/* <li>
                                            <div className="d-flex align-items-center justify-content-between">
                                                <span>Notifications</span>
                                                <NotificationDropdown  />
                                            </div>
										</li> */}
                {/* <li>
                      <NavLink
                        to="/cart"
                        className={(navData) =>
                          navData.isActive ? "active" : ""
                        }
                      >
                        Cart
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        to="/"
                        onClick={() => {
                          localStorage.removeItem("user");
                          localStorage.removeItem("cartItems");
                          localStorage.removeItem("selectedCarDetails");
                          sessionStorage.clear();
                        }}
                        className={(navData) =>
                          navData.isActive ? "active" : ""
                        }
                      >
                        Logout
                      </NavLink>
                    </li>
                  </>
                ) : (
                  <li>
                    <NavLink
                      // to="/login"
                      className={(navData) =>
                        navData.isActive ? "active" : ""
                      }
                      onClick={() => {
                        if (user && (user.name || user.identifier)) {
                          navigate("/profile");
                        } else {
                          setSignInVisible(true); // Show sign-in modal
                        }
                        setActive(false); // Close mobile menu
                      }}
                    >
                      Login
                    </NavLink>
                  </li>
                )} */}
              </ul>
            </div>
          </div>
        </div>
      </header>

      {showLocationModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              backgroundColor: "#fff",
              borderRadius: "12px",
              padding: "10px",
              width: "90%",
              maxWidth: "350px",
              textAlign: "center",
              boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
            }}
          >
            {/* ✕ Close Icon */}
            <button
              onClick={handleCloseModal}
              style={{
                position: "absolute",
                top: "10px",
                right: "15px",
                background: "none",
                border: "none",
                fontSize: "22px",
                color: "#888",
                cursor: "pointer",
                display: "none",
              }}
              aria-label="Close"
            >
              &times;
            </button>

            <img
              src="https://cdn-icons-png.flaticon.com/512/684/684908.png"
              alt="Location Icon"
              style={{ width: 40, height: 40, marginBottom: 20, marginTop: 20 }}
            />
            <h4 style={{ marginBottom: 10 }}>Allow Location Access</h4>
            <p style={{ color: "#666", marginBottom: 25 }}>
              We use your location to show services near you.
            </p>
            <button
              onClick={handleGetLocation}
              style={{
                backgroundColor: "#e60012",
                color: "#fff",
                padding: "5px 15px",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Get Location
            </button>
          </div>
        </div>
      )}

      {showLocationSearchModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="text-end">
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowLocationSearchModal(false)}
                >
                  X
                </button>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  className="form-control mb-3"
                  placeholder="Search city..."
                  value={citySearchTerm}
                  onChange={handleCitySearch}
                />

                <div
                  className="list-group"
                  style={{
                    maxHeight: "250px", // Restrict list height
                    overflowY: "auto", // Scroll only list
                  }}
                >
                  {filteredCities.length > 0 ? (
                    filteredCities.map((city) => (
                      <button
                        key={city.CityID}
                        type="button"
                        className="list-group-item list-group-item-action"
                        onClick={() => handleSelectCity(city)}
                      >
                        {city.CityName}, {city.StateName}
                      </button>
                    ))
                  ) : (
                    <div className="list-group-item text-muted">
                      No cities found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Car Damage Analysis Button */}
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
        {/* <a
          href="https://mycarbuddy.in/assets/apk/MycarbuddyApp.apk"
          className="floating-right-button"
          title="Download MyCarBuddy App"
          download
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow =
              "0 12px 35px rgba(17, 109, 110, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow =
              "0 8px 25px rgba(17, 109, 110, 0.3)";
          }}
        >
          <BsGooglePlay size={20} />
          <span>Download App</span>
        </a> */}
      </div>
    </>
  );
};

export default HeaderOne;
