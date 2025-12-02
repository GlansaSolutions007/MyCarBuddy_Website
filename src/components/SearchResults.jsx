import React, { useEffect, useMemo, useState } from "react";
import "./SearchResults.css";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";
import axios from "axios";
import ChooseCarModal from "./ChooseCarModal";
import AddToCartAnimation from "./AddToCartAnimation";
import BookServiceModal from "./BookServiceModal"
import Fuse from "fuse.js";
import { FaFilter, FaCheck, FaAngleRight, FaArrowRight, FaTimes, FaHeadset, FaCalendarAlt, FaShoppingCart, FaTrash } from "react-icons/fa";

// Function to highlight matching text
const highlightText = (text, highlight) => {
  if (!highlight) return text;
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} style={{ backgroundColor: "#fef08a", padding: "0 2px", borderRadius: "2px" }}>
        {part}
      </mark>
    ) : (
      part
    )
  );
};

const SkeletonLoader = () => {
  return (
    <div className="sr-results">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="sr-skeleton-card">
          <div className="sr-skeleton-image"></div>
          <div className="sr-skeleton-content">
            <div className="sr-skeleton-title"></div>
            <div className="sr-skeleton-line"></div>
            <div className="sr-skeleton-line"></div>
            <div className="sr-skeleton-line"></div>
            <div className="sr-skeleton-btn"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

const SearchResults = ({ searchTerm }) => {
  const [allData, setAllData] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [showCarModal, setShowCarModal] = useState(false);
  const [animationTrigger, setAnimationTrigger] = useState(false);
  const [animationStartPos, setAnimationStartPos] = useState({ top: 0, left: 0 });
  const [animationEndPos, setAnimationEndPos] = useState({ top: 0, left: 0 });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filters & Sorting
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(0);
  const [effectiveMin, setEffectiveMin] = useState(0);
  const [effectiveMax, setEffectiveMax] = useState(0);
  const [sortOption, setSortOption] = useState("relevance");

  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_CARBUDDY_BASE_URL;
  const baseUrlImage = process.env.REACT_APP_CARBUDDY_IMAGE_URL;

  const { cartItems, addToCart, removeFromCart } = useCart();
  const [openModal, setOpenModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      setLoading(true);
      try {
        const response = await axios.get(
          `${BASE_URL}PlanPackage/GetPlanPackagesByCategoryAndSubCategory?searchTerm=&page=1&pageSize=200`
        );

        const formatted = response.data
          .filter(pkg => pkg.IsActive === true && pkg.Serv_Off_Price > 300)
          .map(pkg => ({
            id: pkg.PackageID,
            title: pkg.PackageName,
            description: pkg.SubCategoryName,
            categoryName: pkg.CategoryName,
            image: `${baseUrlImage}${pkg.PackageImage}`,
            price: pkg.Serv_Off_Price,
            originalPrice: pkg.Serv_Reg_Price,
            includes: pkg.IncludeNames ? pkg.IncludeNames.split(',').map(i => i.trim()) : [],
          }));

        setAllData(formatted);
        setPackages(formatted);

        if (formatted.length > 0) {
          const prices = formatted.map(p => Number(p.price) || 0);
          const minP = Math.min(...prices);
          const maxP = Math.max(...prices);
          setEffectiveMin(minP);
          setEffectiveMax(maxP);
          setPriceMin(minP);
          setPriceMax(maxP);
        }

      } catch (err) {
        console.error("Failed to fetch search results", err);
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

  // Derived: unique category list
  const categories = useMemo(() => {
    const set = new Set(packages.map(p => p.categoryName).filter(Boolean));
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

    // Price filter
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
        break;
    }

    return result;
  }, [packages, selectedCategories, priceMin, priceMax, sortOption, selectedCar]);

  const toggleCategory = (cat) => {
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

  // Fuse.js Filtering
  useEffect(() => {
    if (!allData.length) return;

    if (!searchTerm) {
      setPackages(allData);
      return;
    }

    const fuse = new Fuse(allData, {
      keys: [
        { name: "title", weight: 0.7 },
        { name: "description", weight: 0.3 },
        { name: "includes", weight: 0.2 },
      ],
      threshold: 0.4,
      includeScore: true,
    });

    const results = fuse.search(searchTerm);
    const items = results.map((result) => result.item);

    setPackages(items);
  }, [searchTerm, allData]);

  return (
    <section className="sr-section">
      <div className="container">
        {/* Mobile Filter Toggle */}
        <button className="sr-filter-toggle" onClick={() => setSidebarOpen(true)}>
          <FaFilter />
          <span>Filter & Sort</span>
        </button>

        {/* Mobile Sidebar Overlay */}
        <div 
          className={`sr-sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        ></div>

        <div className="sr-layout">
          {/* Sidebar Filters */}
          <aside className={`sr-sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div className="sr-filter-card">
              <button className="sr-sidebar-close" onClick={() => setSidebarOpen(false)}>
                <FaTimes />
              </button>
              
              <div className="sr-filter-header">
                <h3 className="sr-filter-title">
                  <FaFilter className="sr-filter-title-icon" />
                  Filters
                </h3>
                <button className="sr-filter-clear" onClick={clearFilters}>
                  Clear All
                </button>
              </div>

              {/* Categories */}
              <div className="sr-filter-section">
                <span className="sr-filter-label">Categories</span>
                <div className="sr-categories-list">
                  {categories.map(cat => (
                    <div
                      key={cat}
                      className={`sr-category-item ${selectedCategories.includes(cat) ? 'active' : ''}`}
                      onClick={() => toggleCategory(cat)}
                    >
                      <span className="sr-category-checkbox">
                        {selectedCategories.includes(cat) && <FaCheck />}
                      </span>
                      <span className="sr-category-name">{cat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="sr-filter-section">
                <span className="sr-filter-label">Sort By</span>
                <select
                  className="sr-sort-select"
                  value={sortOption}
                  onChange={e => setSortOption(e.target.value)}
                >
                  <option value="relevance">Relevance</option>
                  <option value="name_asc">Name: A to Z</option>
                  <option value="name_desc">Name: Z to A</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="sr-results-wrapper">
            {loading ? (
              <SkeletonLoader />
            ) : filteredAndSortedPackages.length === 0 ? (
              <div className="sr-no-results">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/7486/7486754.png"
                  alt="No results"
                  className="sr-no-results-image"
                />
                <h4 className="sr-no-results-title">
                  No results found for "{searchTerm}"
                </h4>
                <p className="sr-no-results-text">
                  Try adjusting your filters or search with different keywords
                </p>
                <div className="sr-no-results-actions">
                  <button
                    className="sr-no-results-btn"
                    onClick={() => navigate("/#help")}
                  >
                    <FaHeadset />
                    Quick Support
                  </button>
                  <button
                    className="sr-no-results-btn"
                    onClick={() => {
                      setSelectedService(null);
                      setIsModalOpen(true);
                    }}
                  >
                    <FaCalendarAlt />
                    Quick Booking
                  </button>
                </div>
              </div>
            ) : (
              <div className="sr-results">
                {filteredAndSortedPackages.map((pkg) => {
                  const isInCart = cartItems.some((i) => i.id === pkg.id);
                  return (
                    <div key={pkg.id} className="sr-card">
                      <div
                        className="sr-card-image-wrapper"
                        onClick={() => navigate(`/servicedetails/${slugify(pkg.title)}/${pkg.id}`)}
                      >
                        <img
                          src={pkg.image}
                          alt={pkg.title}
                          className="sr-card-image"
                        />
                        <div className="sr-card-overlay"></div>
                        {pkg.categoryName && (
                          <span className="sr-card-badge">{pkg.categoryName}</span>
                        )}
                      </div>

                      <div className="sr-card-content">
                        <h4 className="sr-card-title">
                          {highlightText(pkg.title, searchTerm)}
                        </h4>

                        <ul className="sr-card-includes">
                          {pkg.includes.slice(0, 3).map((item, idx) => (
                            <li key={idx}>
                              <FaAngleRight />
                              {highlightText(item, searchTerm)}
                            </li>
                          ))}
                          {pkg.includes.length > 3 && (
                            <li>
                              <Link
                                to={`/servicedetails/${slugify(pkg.title)}/${pkg.id}`}
                                className="sr-card-more"
                              >
                                +{pkg.includes.length - 3} more
                              </Link>
                            </li>
                          )}
                        </ul>

                        <div className="sr-card-footer">
                          {isInCart ? (
                            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                              <button
                                className="sr-card-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate("/cart");
                                }}
                                style={{ flex: 1 }}
                              >
                                <FaShoppingCart />
                                View Cart
                              </button>
                              <button
                                className="sr-card-btn sr-card-btn-remove"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFromCart(pkg.id);
                                }}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          ) : (
                            <button
                              className="sr-card-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedService(pkg);
                                setIsModalOpen(true);
                              }}
                            >
                              <FaCalendarAlt />
                              Book Service
                              <FaArrowRight />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

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
              padding: "24px",
              width: "95%",
              maxWidth: "450px",
              borderRadius: "20px",
              boxShadow: "0px 10px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h5
              style={{
                textAlign: "center",
                marginBottom: "8px",
                color: "#0a6264",
                fontWeight: 700,
                fontSize: "1.2rem",
              }}
            >
              Book – {selectedService?.title}
            </h5>

            <p
              style={{
                textAlign: "center",
                fontSize: "0.85rem",
                marginBottom: "20px",
                color: "#666",
              }}
            >
              Enter your details and our team will contact you
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setOpenModal(false);
              }}
            >
              <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", display: "block", color: "#333" }}>Name</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    required
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      fontSize: "0.9rem",
                      borderRadius: "10px",
                      border: "2px solid #e0e0e0",
                      transition: "border-color 0.3s",
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", display: "block", color: "#333" }}>Phone</label>
                  <input
                    type="text"
                    placeholder="Phone number"
                    required
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      fontSize: "0.9rem",
                      borderRadius: "10px",
                      border: "2px solid #e0e0e0",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#f0f0f0",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: 600,
                    color: "#666",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "linear-gradient(135deg, #0a6264 0%, #1aa1a4 100%)",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: 600,
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BookServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedService={selectedService}
      />
    </section>
  );
};

export default SearchResults;
