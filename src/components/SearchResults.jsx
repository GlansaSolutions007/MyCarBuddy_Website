import React, { useEffect, useMemo, useState } from "react";
import "./ServiceCards.css";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";
import axios from "axios";
import ChooseCarModal from "./ChooseCarModal";
import AddToCartAnimation from "./AddToCartAnimation";

// Function to highlight matching text in yellow
const highlightText = (text, highlight) => {
  if (!highlight) return text;
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} style={{ backgroundColor: "yellow" }}>
        {part}
      </span>
    ) : (
      part
    )
  );
};

const SkeletonLoader = () => {
  return (
    <div className="container my-4 search-results">
      <div className="row">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="col-md-6 mb-4">
            <div className="pricing-card">
              <div className="pricing-card-price-wrap">
                <div className="skeleton-card-image" style={{ width: "100%", height: 200, backgroundColor: "#e0e0e0", borderRadius: "0.5rem" }}></div>
              </div>
              <div className="pricing-card-details">
                <div className="skeleton-card-title mb-2" style={{ width: "80%", height: 24, backgroundColor: "#e0e0e0", borderRadius: "0.25rem" }}></div>
                <div className="skeleton-card-list mb-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="skeleton-list-item mb-1" style={{ width: "90%", height: 16, backgroundColor: "#e0e0e0", borderRadius: "0.25rem" }}></div>
                  ))}
                </div>
                <div className="skeleton-card-price mb-2" style={{ width: "60px", height: 20, backgroundColor: "#e0e0e0", borderRadius: "0.25rem" }}></div>
                <div className="skeleton-card-button" style={{ width: "120px", height: 36, backgroundColor: "#e0e0e0", borderRadius: "0.25rem" }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SearchResults = ({ searchTerm }) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [showCarModal, setShowCarModal] = useState(false);
  const [animationTrigger, setAnimationTrigger] = useState(false);
  const [animationStartPos, setAnimationStartPos] = useState({ top: 0, left: 0 });
  const [animationEndPos, setAnimationEndPos] = useState({ top: 0, left: 0 });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filters & Sorting
  const [selectedCategories, setSelectedCategories] = useState([]); // array of strings
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(0);
  const [effectiveMin, setEffectiveMin] = useState(0);
  const [effectiveMax, setEffectiveMax] = useState(0);
  const [sortOption, setSortOption] = useState("relevance"); // name_asc, name_desc, price_asc, price_desc

  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_CARBUDDY_BASE_URL;
  const baseUrlImage = process.env.REACT_APP_CARBUDDY_IMAGE_URL;

  const { cartItems, addToCart, removeFromCart } = useCart();
  const [openModal, setOpenModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const selectedCarDetails = JSON.parse(localStorage.getItem("selectedCarDetails"));
  let brandId, modelId, fuelId;
  if (selectedCarDetails) {
    brandId = selectedCarDetails.brand?.id;
    modelId = selectedCarDetails.model?.id;
    fuelId = selectedCarDetails.fuel?.id;
  }

  useEffect(() => {
    setSelectedCategories([]);
    setPriceMin(0);
    setPriceMax(0);
    setEffectiveMin(0);
    setEffectiveMax(0);
    setSortOption("relevance");
    const fetchSearchResults = async () => {
      if (!searchTerm) return;
      setLoading(true);
      setPage(1);
      setHasMore(true);
      try {
        const response = await axios.get(
          `${BASE_URL}PlanPackage/GetPlanPackagesByCategoryAndSubCategory?searchTerm=${encodeURIComponent(searchTerm)}&page=1&pageSize=10`
        );

        const formatted = response.data.filter(pkg => pkg.IsActive === true && pkg.Serv_Off_Price > 300).map(pkg => ({
          id: pkg.PackageID,
          title: pkg.PackageName,
          description: pkg.SubCategoryName,
          categoryName: pkg.CategoryName,
          image: `${baseUrlImage}${pkg.PackageImage}`,
          price: pkg.Serv_Off_Price,
          originalPrice: pkg.Serv_Reg_Price,
          includes: pkg.IncludeNames ? pkg.IncludeNames.split(',').map(i => i.trim()) : [],
        }));

        setPackages(formatted);
        setHasMore(formatted.length === 10); // Assuming pageSize=10
        // initialize price bounds
        if (formatted.length > 0) {
          const prices = formatted.map(p => Number(p.price) || 0);
          const minP = Math.min(...prices);
          const maxP = Math.max(...prices);
          setEffectiveMin(minP);
          setEffectiveMax(maxP);
          setPriceMin(minP);
          setPriceMax(maxP);
        } else {
          setEffectiveMin(0);
          setEffectiveMax(0);
          setPriceMin(0);
          setPriceMax(0);
        }
        setSelectedCategories([]);
        setSortOption("relevance");
      } catch (err) {
        console.error("Failed to fetch search results", err);
        setPackages([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchTerm, BASE_URL, baseUrlImage]);

  const loadMore = async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `${BASE_URL}PlanPackage/GetPlanPackagesByCategoryAndSubCategory?searchTerm=${encodeURIComponent(searchTerm)}&page=${page + 1}&pageSize=10`
      );

      const formatted = response.data.filter(pkg => pkg.IsActive === true).map(pkg => ({
        id: pkg.PackageID,
        title: pkg.PackageName,
        description: pkg.SubCategoryName,
        categoryName: pkg.CategoryName,
        image: `${baseUrlImage}${pkg.PackageImage}`,
        price: pkg.Serv_Off_Price,
        originalPrice: pkg.Serv_Reg_Price,
        includes: pkg.IncludeNames ? pkg.IncludeNames.split(',').map(i => i.trim()) : [],
      }));

      setPackages(prev => [...prev, ...formatted]);
      setPage(prev => prev + 1);
      setHasMore(formatted.length === 10);
    } catch (err) {
      console.error("Failed to load more results", err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 100) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, page, searchTerm]);

  useEffect(() => {
    const loadSelectedCar = () => {
      const saved = localStorage.getItem("selectedCarDetails");
      if (saved) {
        try {
          setSelectedCar(JSON.parse(saved));
        } catch (err) {
          console.error("Error parsing selected car", err);
        }
      } else {
        setSelectedCar(null);
      }
    };

    loadSelectedCar();

    window.addEventListener("userProfileUpdated", loadSelectedCar);
    return () => window.removeEventListener("userProfileUpdated", loadSelectedCar);
  }, []);

  const handleAddToCartClick = (e, pkg) => {
    e.stopPropagation();

    const rect = e.target.getBoundingClientRect();
    const startPos = { top: rect.top, left: rect.left };

    const cartIcon = document.getElementById("GotoCart");
    let endPos = { top: window.innerHeight - 50, left: window.innerWidth - 50 };
    if (cartIcon) {
      const cartRect = cartIcon.getBoundingClientRect();
      endPos = { top: cartRect.top, left: cartRect.left };
    }

    setAnimationStartPos(startPos);
    setAnimationEndPos(endPos);
    setAnimationTrigger(true);

    addToCart(pkg);
    toast.success("Service added to cart");
  };

  const handleAnimationEnd = () => {
    setAnimationTrigger(false);
  };

  const slugify = (text) => {
    return text
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Derived: unique category list from description (SubCategoryName)
  const categories = useMemo(() => {
    const set = new Set(packages.map(p => p.categoryName).filter(Boolean));
    console.log(packages);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [packages]);

  // Apply filters and sorting
  const filteredAndSortedPackages = useMemo(() => {
    let result = packages;

    // Category filter
    if (selectedCategories.length > 0) {
      const set = new Set(selectedCategories);
      result = result.filter(p => set.has(p.categoryName));
    }

    // Price filter - only apply when car is selected
    if (selectedCar) {
      result = result.filter(p => {
        const price = Number(p.price) || 0;
        return (price >= priceMin && price <= priceMax);
      });
    }

    // Sorting
    switch (sortOption) {
      case "name_asc":
        result = [...result].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "name_desc":
        result = [...result].sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "price_asc":
        result = [...result].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        break;
      case "price_desc":
        result = [...result].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        break;
      default:
        break; // relevance = API order
    }

    return result;
  }, [packages, selectedCategories, priceMin, priceMax, sortOption, selectedCar]);

  const toggleCategory = (cat) => {
    console.log(selectedCategories);
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    if (selectedCar) {
      setPriceMin(effectiveMin);
      setPriceMax(effectiveMax);
    }
    setSortOption("relevance");
  };

  return (
    <div className="container my-4">
      {/* <h4 className="mb-3">Search Results for "{searchTerm}"</h4> */}

      {loading ? (
        <SkeletonLoader />
      ) : packages.length === 0 ? (
        // <p className="text-muted">No packages found for "{searchTerm}".</p>
        <div className="col-12 text-center my-5">
          <div style={{ maxWidth: "500px", margin: "0 auto" }}>
            <img
              src="https://cdn-icons-png.flaticon.com/512/7486/7486754.png"
              alt="No results"
              style={{ width: "150px", marginBottom: "20px", opacity: "0.8" }}
            />
            <h4 style={{ color: "#5a5a5a", fontWeight: "600" }}>
              Whoops! No search result found for "{searchTerm}".
            </h4>
            <p style={{ color: "#888" }}>
              It looks like we don't have what you're looking for right now.
            </p>
          </div>
        </div>
      ) : (
        <div className="row">
          {/* Sidebar Filters */}
          <div className="col-lg-3 mb-4">
            <div className="card p-3 sticky-top" style={{ top: 90 }}>
              <h6 className="mb-3">Filters</h6>

              {/* Category Filter */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <strong>Categories</strong>
                  {/* <span className="badge bg-light text-dark">{categories.length}</span> */}
                </div>
                <div className="mt-2" style={{ maxHeight: 220, overflowY: 'auto', padding: '10px 0px' }}>
                  {categories.map(cat => (
                    <div key={cat} className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`cat-${cat}`}
                        checked={selectedCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                      />
                      <label className="form-check-label" htmlFor={`cat-${cat}`}>
                        {cat}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Filter - Only show when car is selected */}
              {/* {selectedCar && (
                <div className="mb-3">
                  <strong>Price Range</strong>
                  <div className="d-flex gap-2 align-items-center mt-2">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text">₹</span>
                      <input
                        type="number"
                        className="form-control"
                        value={priceMin}
                        min={effectiveMin}
                        max={priceMax}
                        onChange={e => setPriceMin(Number(e.target.value))}
                      />
                    </div>
                    <span className="text-muted">to</span>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text">₹</span>
                      <input
                        type="number"
                        className="form-control"
                        value={priceMax}
                        min={priceMin}
                        max={effectiveMax}
                        onChange={e => setPriceMax(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="small text-muted mt-1">Min: ₹{effectiveMin} • Max: ₹{effectiveMax}</div>
                </div>
              )} */}

              {/* Sort Options */}
              <div className="mb-3">
                <strong>Sort By</strong>
                <select
                  className="form-select form-select-sm mt-2"
                  value={sortOption}
                  onChange={e => setSortOption(e.target.value)}
                >
                  <option value="relevance">Relevance</option>
                  <option value="name_asc">Name: A to Z</option>
                  <option value="name_desc">Name: Z to A</option>
                  {selectedCar ? (<>
                    {/* <option value="price_asc">Price: Low to High</option> */}
                    {/* <option value="price_desc">Price: High to Low</option> */}
                  </>) : (
                    <></>
                  )}
                </select>
              </div>

              <button className="btn btn-warning px-3 py-2" onClick={clearFilters}>Clear Filters</button>
            </div>
          </div>

          {/* Results */}
          <div className="col-lg-9 search-results-container">
            <div className="row">
              {filteredAndSortedPackages.map((pkg) => {
                const isInCart = cartItems.some((i) => i.id === pkg.id);
                return (
                  <div key={pkg.id} className="col-12 col-md-6 col-lg-4 mb-4">
                    <div className="pricing-card d-flex flex-column h-100">
                      <div
                        className="pricing-card-price-wrap position-relative"
                        onClick={() => navigate(`/servicedetails/${slugify(pkg.title)}/${pkg.id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="pricing-card_icon">
                          <img
                            src={pkg.image}
                            className="img-fluid rounded service-img"
                            alt={pkg.title}
                            style={{ width: '100%', height: 190, objectFit: 'cover' }}
                          />
                        </div>
                      </div>
                      <div className="pricing-card-details d-flex flex-column" style={{ minHeight: 180 }}>
                        <h4 className="pricing-card_title mb-2">{highlightText(pkg.title, searchTerm)}</h4>
                        <div className="checklist style2">
                          <ul className="list-unstyled small mb-2">
                            {pkg.includes.slice(0, 3).map((item, idx) => (
                              <li key={idx}>
                                <i className="fas fa-angle-right"></i> {highlightText(item, searchTerm)}
                              </li>
                            ))}
                            {pkg.includes.length > 3 && (
                              <li>
                                <a
                                  href={`/servicedetails/${slugify(pkg.title)}/${pkg.id}`}
                                  className="text-danger text-decoration-underline"
                                >
                                  View More
                                </a>
                              </li>
                            )}
                          </ul>
                        </div>

                        {selectedCar ? (
                          <>
                            {/* <div className="ribbon">
                          ₹{pkg.price}
                          <p>
                            <div className="text-muted1 text-decoration-line-through">
                              ₹{pkg.originalPrice}
                            </div>
                          </p>
                        </div> */}

                            {isInCart ? (
                              <>
                                <div className="mt-auto d-flex align-items-center gap-2">
                                  <button
                                    className="btn style-border2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate("/cart");
                                    }}
                                  >
                                    ✔ View Cart
                                  </button>
                                  <button
                                    className="btn style-border2 ml-2"
                                    onClick={() => removeFromCart(pkg.id)}
                                  >
                                    <i className="bi bi-trash" />
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="mt-auto">
                                {/* <button
                              className="btn style-border2"
                              onClick={(e) => handleAddToCartClick(e, pkg)}
                            >
                              + ADD TO CART
                            </button> */}
                                <Link
                                  className="btn style4 px-4 py-2"
                                  onClick={() => {
                                    setSelectedService(pkg);
                                    setOpenModal(true);
                                  }}
                                >
                                  Book Service <i className="fas fa-arrow-right ms-2" />
                                </Link>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="text-muted fst-italic mb-2">
                              Select your car to see price
                            </div>
                            <div className="mt-auto">
                              <button
                                className="btn style-border2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowCarModal(true);
                                }}
                              >
                                Choose Your Car
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <ChooseCarModal
        isVisible={showCarModal}
        onClose={() => {
          setShowCarModal(false);
          const saved = localStorage.getItem("selectedCarDetails");
          if (saved) {
            try {
              setSelectedCar(JSON.parse(saved));
            } catch (err) {
              console.error("Error parsing selected car", err);
            }
          }
        }}
        onCarSaved={(car) => setSelectedCar(car)}
      />
      <AddToCartAnimation
        trigger={animationTrigger}
        startPosition={animationStartPos}
        endPosition={animationEndPos}
        onAnimationEnd={handleAnimationEnd}
      />
      {openModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999999,
            padding: "10px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              padding: "20px",
              width: "95%",
              maxWidth: "450px",
              borderRadius: "14px",
              boxShadow: "0px 6px 18px rgba(0,0,0,0.15)",
              animation: "fadeIn 0.25s ease-in-out",
            }}
          >
            <h5
              style={{
                textAlign: "center",
                marginBottom: "8px",
                color: "#0a6264",
                fontWeight: 700,
              }}
            >
              Book – {selectedService?.title}
            </h5>

            {/* ✨ New Description Line */}
            <p
              style={{
                textAlign: "center",
                fontSize: "12px",
                marginTop: "-5px",
                marginBottom: "18px",
                color: "#555",
              }}
            >
              Give few information about you, our team will contact you.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setOpenModal(false);
              }}
            >
              {/* Row - Name + Contact */}
              <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "13px", fontWeight: 600 }}>Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter your name"
                    required
                    style={{
                      padding: "8px",
                      fontSize: "13px",
                      borderRadius: "6px",
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "13px", fontWeight: 600 }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Phone number"
                    required
                    style={{
                      padding: "8px",
                      fontSize: "13px",
                      borderRadius: "6px",
                    }}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "14px",
                }}
              >
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: "#8b8b8bff",
                    fontSize: "13px",
                    padding: "8px 20px",
                    borderRadius: "6px",
                    fontWeight: 600,
                  }}
                  onClick={() => setOpenModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn"
                  style={{
                    background: "#0a6264",
                    color: "#fff",
                    fontSize: "13px",
                    padding: "8px 20px",
                    borderRadius: "6px",
                    fontWeight: 600,
                  }}
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
