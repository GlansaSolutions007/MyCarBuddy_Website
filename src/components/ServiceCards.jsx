import React, { useEffect, useRef, useState } from "react";
import "./ServiceCards.css";
import { useNavigate, useParams } from "react-router-dom";
// import { FaSnowflake, FaCarBattery, FaCarSide, FaPaintRoller, FaMagic, FaShower, FaTools, FaGasPump } from "react-icons/fa";
// import servicetwo from '../../src/images/service-2.png';
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";
import axios from "axios";
import ChooseCarModal from "./ChooseCarModalGridLayout";
import AddToCartAnimation from "./AddToCartAnimation";
import BookServiceModal from "./BookServiceModal"

const SkeletonLoader = () => {
  return (
    <div className="container my-4">
      {/* Category Title Skeleton */}
      <div
        className="skeleton-category-title mb-3"
        style={{
          width: "200px",
          height: 28,
          backgroundColor: "#e0e0e0",
          borderRadius: "0.25rem",
        }}
      ></div>

      {/* Tabs Skeleton */}
      <div className="d-flex align-items-center position-relative mb-4">
        <div
          className="skeleton-arrow-btn"
          style={{
            width: 40,
            height: 40,
            backgroundColor: "#e0e0e0",
            borderRadius: "50%",
            marginRight: 8,
          }}
        ></div>
        <div className="d-flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="skeleton-tab"
              style={{
                width: 120,
                height: 36,
                backgroundColor: "#e0e0e0",
                borderRadius: "1rem",
              }}
            ></div>
          ))}
        </div>
        <div
          className="skeleton-arrow-btn"
          style={{
            width: 40,
            height: 40,
            backgroundColor: "#e0e0e0",
            borderRadius: "50%",
            marginLeft: 8,
          }}
        ></div>
      </div>

      {/* Services Cards Skeleton */}
      <div className="row">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="col-md-6 mb-4">
            <div className="pricing-card">
              <div className="pricing-card-price-wrap">
                <div
                  className="skeleton-card-image"
                  style={{
                    width: "100%",
                    height: 200,
                    backgroundColor: "#e0e0e0",
                    borderRadius: "0.5rem",
                  }}
                ></div>
              </div>
              <div className="pricing-card-details">
                <div
                  className="skeleton-card-title mb-2"
                  style={{
                    width: "80%",
                    height: 24,
                    backgroundColor: "#e0e0e0",
                    borderRadius: "0.25rem",
                  }}
                ></div>
                <div className="skeleton-card-list mb-3">
                  {[...Array(3)].map((_, j) => (
                    <div
                      key={j}
                      className="skeleton-list-item mb-1"
                      style={{
                        width: "90%",
                        height: 16,
                        backgroundColor: "#e0e0e0",
                        borderRadius: "0.25rem",
                      }}
                    ></div>
                  ))}
                </div>
                <div
                  className="skeleton-card-price mb-2"
                  style={{
                    width: "60px",
                    height: 20,
                    backgroundColor: "#e0e0e0",
                    borderRadius: "0.25rem",
                  }}
                ></div>
                <div
                  className="skeleton-card-button"
                  style={{
                    width: "120px",
                    height: 36,
                    backgroundColor: "#e0e0e0",
                    borderRadius: "0.25rem",
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ServiceCards() {
  const { categoryname, categoryId } = useParams();
  const [subcategories, setSubcategories] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [packages, setPackages] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [selectedCar, setSelectedCar] = useState(null);
  const [showCarModal, setShowCarModal] = useState(false);
  const [animationTrigger, setAnimationTrigger] = useState(false);
  const [animationStartPos, setAnimationStartPos] = useState({
    top: 0,
    left: 0,
  });
  const [animationEndPos, setAnimationEndPos] = useState({ top: 0, left: 0 });
  const [loadingSubcategories, setLoadingSubcategories] = useState(true);
  const [loadingPackages, setLoadingPackages] = useState(false);

  const navigate = useNavigate();
  const scrollRef = useRef();
  const BASE_URL = process.env.REACT_APP_CARBUDDY_BASE_URL;
  const baseUrlImage = process.env.REACT_APP_CARBUDDY_IMAGE_URL;
  const [selectedService, setSelectedService] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const [selectedService, setSelectedService] = useState(null);

  const { cartItems, addToCart, removeFromCart, updateQuantity } = useCart();

  const selectedCarDetails = JSON.parse(
    localStorage.getItem("selectedCarDetails")
  );
  let brandId;
  let modelId;
  let fuelId;
  if (selectedCarDetails) {
    brandId = selectedCarDetails.brand?.id;
    modelId = selectedCarDetails.model?.id;
    fuelId = selectedCarDetails.fuel?.id;

    console.log({ brandId, modelId, fuelId });
  } else {
    console.log("No car selected yet.");
  }

  useEffect(() => {
    const fetchCategoryAndSubcategories = async () => {
      setLoadingSubcategories(true);
      try {
        const [subRes, catRes] = await Promise.all([
          axios.get(
            `${BASE_URL}SubCategory1/subcategorybycategoryid?categoryid=${categoryId}`
          ),
          axios.get(`${BASE_URL}Category`),
        ]);

        if (Array.isArray(subRes.data)) {
          const activeSubcategories = subRes.data.filter(
            (sub) => sub.IsActive === true && sub.SubCategoryID !== 58
          );
          setSubcategories(activeSubcategories);
          setActiveTab(activeSubcategories[0]?.SubCategoryID || null);
        }

        if (catRes.data?.status && Array.isArray(catRes.data.data)) {
          const matchedCategory = catRes.data.data.find(
            (cat) => cat.CategoryID.toString() === categoryId
          );
          if (matchedCategory) {
            setCategoryName(matchedCategory.CategoryName);
          }
        }
      } catch (err) {
        console.error("Error fetching category or subcategories", err);
      } finally {
        setLoadingSubcategories(false);
      }
    };

    fetchCategoryAndSubcategories();
  }, [categoryId]);

  useEffect(() => {
    const fetchPackages = async () => {
      if (!activeTab) return;
      setLoadingPackages(true);
      try {
        const response = await axios.get(
          `${BASE_URL}PlanPackage/GetPlanPackagesByCategoryAndSubCategory?categoryId=${categoryId}&subCategoryId=${activeTab}&BrandId=${brandId || ""
          }&ModelId=${modelId || ""}&fuelTypeId=${fuelId || ""}`
        );

        const formatted = response.data
          .filter((pkg) => pkg.IsActive === true)
          // .filter((pkg) => pkg.Serv_Off_Price >= 200)
          .map((pkg) => ({
            id: pkg.PackageID,
            title: pkg.PackageName,
            description: pkg.SubCategoryName,
            image: `${baseUrlImage}${pkg.PackageImage}`,
            tag: "Featured Package",
            duration: "4 Hrs Taken",
            price: pkg.Serv_Off_Price,
            originalPrice: pkg.Serv_Reg_Price,
            includes: pkg.IncludeNames
              ? pkg.IncludeNames.split(",").map((i) => i.trim())
              : [],
            BrandId: "",
            ModelId: "",
            isActive: pkg.IsActive,
            categoryId: categoryId,
          }));

        setPackages(formatted);
        console.log("Fetched packages:", formatted);
      } catch (err) {
        console.error("Failed to fetch packages", err);
      } finally {
        setLoadingPackages(false);
      }
    };

    fetchPackages();
  }, [BASE_URL, baseUrlImage, categoryId, activeTab, brandId, modelId, fuelId]);

  useEffect(() => {
    setPackages([]);
  }, [activeTab]);

  const scroll = (direction) => {
    const container = scrollRef.current;
    const tabWidth = container?.firstChild?.offsetWidth || 150;
    const scrollAmount = tabWidth + 12;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

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

    // Listen to custom event triggered after login
    const handleProfileUpdate = () => {
      loadSelectedCar();
    };

    window.addEventListener("userProfileUpdated", handleProfileUpdate);

    return () => {
      window.removeEventListener("userProfileUpdated", handleProfileUpdate);
    };
  }, []);

  const handleAddToCartClick = (e, pkg) => {
    e.stopPropagation();

    // Get button position for animation start
    const rect = e.target.getBoundingClientRect();
    const startPos = { top: rect.top, left: rect.left };

    // Get cart icon position - using id 'GotoCart'
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
      .replace(/&/g, "and") // replace "&" with "and"
      .replace(/[^a-z0-9]+/g, "-") // replace all non-alphanumeric with "-"
      .replace(/^-+|-+$/g, ""); // trim starting/ending "-"
  };

  if (loadingSubcategories) {
    return <SkeletonLoader />;
  }

  return (
    <div className="container my-4">
      {categoryName && (
        <h4 className="mb-3 text-uppercase fw-bold">{categoryName}</h4>
      )}
      <div className="d-flex align-items-center position-relative mb-4">
        <button className="arrow-btn left" onClick={() => scroll("left")}>
          <i className="fa fa-arrow-left"></i>
        </button>
        <div className="scrollable-tabs" ref={scrollRef}>
          {subcategories.map((sub) => (
            <div
              key={sub.SubCategoryID}
              className={`tab-pill ${activeTab?.toString() === sub.SubCategoryID.toString()
                ? "active"
                : ""
                }`}
              onClick={() => setActiveTab(sub.SubCategoryID)}
            >
              <span>{sub.SubCategoryName}</span>
            </div>
          ))}
        </div>
        <button className="arrow-btn right" onClick={() => scroll("right")}>
          <i className="fa fa-arrow-right"></i>
        </button>
      </div>

      {/* Services */}
      <div className="row">
        {loadingPackages ? (
          <div className="row">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="col-md-6 mb-4">
                <div className="pricing-card">
                  <div className="pricing-card-price-wrap">
                    <div
                      className="skeleton-card-image"
                      style={{
                        width: "100%",
                        height: 200,
                        backgroundColor: "#e0e0e0",
                        borderRadius: "0.5rem",
                      }}
                    ></div>
                  </div>
                  <div className="pricing-card-details">
                    <div
                      className="skeleton-card-title mb-2"
                      style={{
                        width: "80%",
                        height: 24,
                        backgroundColor: "#e0e0e0",
                        borderRadius: "0.25rem",
                      }}
                    ></div>
                    <div className="skeleton-card-list mb-3">
                      {[...Array(3)].map((_, j) => (
                        <div
                          key={j}
                          className="skeleton-list-item mb-1"
                          style={{
                            width: "90%",
                            height: 16,
                            backgroundColor: "#e0e0e0",
                            borderRadius: "0.25rem",
                          }}
                        ></div>
                      ))}
                    </div>
                    <div
                      className="skeleton-card-price mb-2"
                      style={{
                        width: "60px",
                        height: 20,
                        backgroundColor: "#e0e0e0",
                        borderRadius: "0.25rem",
                      }}
                    ></div>
                    <div
                      className="skeleton-card-button"
                      style={{
                        width: "120px",
                        height: 36,
                        backgroundColor: "#e0e0e0",
                        borderRadius: "0.25rem",
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : packages.length === 0 ? (
          <p className="text-muted">
            No packages available for this subcategory.
          </p>
        ) : (
          packages.map((pkg) => {
            const isInCart = cartItems.some((i) => i.id === pkg.id);
            return (
              <>
                <div className="col-md-6 mb-4">
                  <div
                    className="pricing-card"
                    onClick={() =>
                      navigate(
                        `/servicedetails/${slugify(pkg.title)}/${pkg.id}`
                      )
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <div className="pricing-card-price-wrap">
                      <div className="pricing-card-price-wrap position-relative">
                        {/* <div className="pricing-badge">
                        10% OFF
                      </div> */}
                        <div className="pricing-card_icon">
                          <img
                            src={pkg.image}
                            className="img-fluid rounded service-img"
                            alt={pkg.title}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="pricing-card-details">
                      <h4 className="pricing-card_title">{pkg.title}</h4>
                      <div className="checklist style2">
                        <ul className="list-unstyled small mb-2">
                          {(() => {
                            const maxLines = 4;
                            const approxCharsPerLine = 30;
                            let totalLines = 0;
                            const visibleItems = [];

                            for (let i = 0; i < pkg.includes.length; i++) {
                              const item = pkg.includes[i];
                              const linesNeeded = Math.ceil(
                                item.length / approxCharsPerLine
                              );

                              if (totalLines + linesNeeded <= maxLines) {
                                visibleItems.push(item);
                                totalLines += linesNeeded;
                              } else {
                                break;
                              }
                            }

                            return visibleItems.map((item, idx) => (
                              <li key={idx}>
                                <i className="fas fa-angle-right"></i> {item}
                              </li>
                            ));
                          })()}

                          {pkg.includes.length > 0 &&
                            pkg.includes.some((item, idx) => idx >= 0) &&
                            (() => {
                              const maxLines = 4;
                              const approxCharsPerLine = 30;
                              let totalLines = 0;

                              for (let i = 0; i < pkg.includes.length; i++) {
                                const linesNeeded = Math.ceil(
                                  pkg.includes[i].length / approxCharsPerLine
                                );
                                totalLines += linesNeeded;
                                if (totalLines > maxLines) return true;
                              }
                              return false;
                            })() && (
                              <li>
                                <a
                                  href={`/servicedetails/${slugify(
                                    pkg.title
                                  )}/${pkg.id}`}
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
                          {/* <h3 className="pricing-card_price"><span className="currency">₹{pkg.price}</span></h3> */}

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
                                className="btn style-border2 ml-5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFromCart(pkg.id);
                                }}
                              >
                                <i className="bi bi-trash" />
                              </button>
                            </>
                          ) : (
                            // <button
                            //   className="btn style-border2 "
                            //   onClick={(e) => handleAddToCartClick(e, pkg)}
                            // >
                            //   + ADD TO CART
                            // </button>
                            // <button
                            //   className="btn style-border2 "
                            //   onClick={(e) => {
                            //     e.stopPropagation();
                            //     setSelectedService(pkg);
                            //     setOpenModal(true);
                            //   }}
                            // >
                            //   BOOK SERVICE
                            // </button>
                            <button
                              className="btn style-border2 "
                              onClick={(e) => {
                                e.stopPropagation();          // prevent card click
                                setSelectedService(pkg);      // <--- IMPORTANT
                                setIsModalOpen(true);
                              }}
                            >
                              BOOK SERVICE
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          {/* <div className="text-muted fst-italic mb-2">
                            Add your car to see price
                          </div>
                          <button
                            className="btn style-border2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowCarModal(true);
                            }}
                          >
                            Add Your Car
                          </button> */}
                           <button
                              className="btn style-border2 "
                              onClick={(e) => {
                                e.stopPropagation();          // prevent card click
                                setSelectedService(pkg);      // <--- IMPORTANT
                                setIsModalOpen(true);
                              }}
                            >
                              BOOK SERVICE
                            </button>
                        </>
                      )}
                      {/* <a className="btn style-border2" href="/about">Start now <i className="fas fa-arrow-right ms-2"></i></a> */}
                    </div>
                  </div>
                </div>
              </>
            );
          })
        )}
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
      <BookServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedService={selectedService}
      />
    </div>
  );
}
