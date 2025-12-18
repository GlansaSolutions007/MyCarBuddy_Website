import React, { useEffect, useRef, useState } from "react";
import "./ServiceCards.css";
import { useNavigate, useParams } from "react-router-dom";
import { FaChevronLeft, FaChevronRight, FaCheck, FaShoppingCart, FaTrash, FaCalendarAlt, FaBoxOpen, FaQuestionCircle } from "react-icons/fa";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";
import axios from "axios";
import ChooseCarModal from "./ChooseCarModalGridLayout";
import AddToCartAnimation from "./AddToCartAnimation";
import BookServiceModal from "./BookServiceModal"

const SkeletonLoader = () => {
  return (
    <section className="sc-section">
      <div className="container">
        {/* Header Skeleton */}
        <div className="sc-header-skeleton">
          <div className="sc-skeleton sc-skeleton-title"></div>
        </div>

        {/* Tabs Skeleton */}
        <div className="sc-tabs-skeleton">
          <div className="sc-skeleton sc-skeleton-arrow"></div>
          <div className="sc-skeleton-tabs-wrapper">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="sc-skeleton sc-skeleton-tab"></div>
            ))}
          </div>
          <div className="sc-skeleton sc-skeleton-arrow"></div>
        </div>

        {/* Cards Skeleton */}
        <div className="sc-cards-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="sc-card-skeleton">
              <div className="sc-skeleton sc-skeleton-image"></div>
              <div className="sc-skeleton-content">
                <div className="sc-skeleton sc-skeleton-card-title"></div>
                <div className="sc-skeleton sc-skeleton-text"></div>
                <div className="sc-skeleton sc-skeleton-text-short"></div>
                <div className="sc-skeleton sc-skeleton-button"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
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
  const [faqs, setFaqs] = useState([]);
  const [explanations, setExplanations] = useState([]);

  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);


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
    const el = scrollRef.current;
    if (!el) return;

    const checkScroll = () => {
      setShowLeft(el.scrollLeft > 0);
      setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth);
    };

    checkScroll(); // run initially

    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [subcategories]);

  const scroller = (direction) => {
    const el = scrollRef.current;
    if (!el) return;

    const amount = 250; // scroll amount
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

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
            // tag: "Expert Service",
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

  // Fetch FAQs for the category
  useEffect(() => {
    const fetchFaqs = async () => {
      if (!categoryId) return;

      try {
        const response = await axios.get(
          `${BASE_URL}FAQS/Packages?CategoryID=${categoryId}&Type=category`
        );

        // Get FAQs from CategoryFAQS array
        const categoryFaqs = response.data?.CategoryFAQS || [];

        // Find FAQs for the current category
        const currentCategoryFaqs = categoryFaqs.find(c => c.CategoryID === parseInt(categoryId));

        if (currentCategoryFaqs?.FAQS) {
          setFaqs(currentCategoryFaqs.FAQS);
        } else if (categoryFaqs.length > 0) {
          // If no specific category FAQs found, use first category's FAQs
          setFaqs(categoryFaqs[0]?.FAQS || []);
        } else {
          setFaqs([]);
        }
      } catch (error) {
        console.error("Error fetching FAQs:", error);
        setFaqs([]);
      }
    };

    fetchFaqs();
  }, [categoryId, BASE_URL]);

  // Fetch Explanations for the category
  useEffect(() => {
    const fetchExplanations = async () => {
      if (!categoryId) return;

      try {
        const response = await axios.get(
          `${BASE_URL}Explanations/Packages?CategoryID=${categoryId}&Type=category`
        );

        // Get Explanations from CategoryFAQS array
        const categoryExplanations = response.data?.CategoryFAQS || [];

        // Find Explanations for the current category
        const currentCategoryExplanations = categoryExplanations.find(c => c.CategoryID === parseInt(categoryId));

        if (currentCategoryExplanations?.FAQS) {
          setExplanations(currentCategoryExplanations.FAQS);
        } else if (categoryExplanations.length > 0) {
          setExplanations(categoryExplanations[0]?.FAQS || []);
        } else {
          setExplanations([]);
        }
      } catch (error) {
        console.error("Error fetching Explanations:", error);
        setExplanations([]);
      }
    };

    fetchExplanations();
  }, [categoryId, BASE_URL]);

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
    <section className="sc-section">
      <div className="container">
        {/* Section Header */}
        {categoryName && (
          <div className="sc-header">
            <h2 className="sc-title">{categoryName}</h2>
            <p className="sc-subtitle">Choose from our premium service packages</p>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="sc-tabs-wrapper">
          {/* <button className="sc-arrow-btn sc-arrow-left" onClick={() => scroll("left")}>
            <FaChevronLeft />
          </button> */}
          {showLeft && (
            <button className="sc-arrow-btn sc-arrow-left" onClick={() => scroll("left")}>
              <FaChevronLeft />
            </button>
          )}
          <div className="sc-tabs" ref={scrollRef}>
            {subcategories.map((sub) => (
              <button
                key={sub.SubCategoryID}
                className={`sc-tab ${activeTab?.toString() === sub.SubCategoryID.toString() ? "sc-tab-active" : ""}`}
                onClick={() => setActiveTab(sub.SubCategoryID)}
              >
                {sub.SubCategoryName}
              </button>
            ))}
          </div>
          {/* <button className="sc-arrow-btn sc-arrow-right" onClick={() => scroll("right")}>
            <FaChevronRight />
          </button> */}
          {showRight && (
            <button className="sc-arrow-btn sc-arrow-right" onClick={() => scroller("right")}>
              <FaChevronRight />
            </button>
          )}
        </div>

        {/* Services Grid */}
        {loadingPackages ? (
          <div className="sc-cards-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="sc-card-skeleton">
                <div className="sc-skeleton sc-skeleton-image"></div>
                <div className="sc-skeleton-content">
                  <div className="sc-skeleton sc-skeleton-card-title"></div>
                  <div className="sc-skeleton sc-skeleton-text"></div>
                  <div className="sc-skeleton sc-skeleton-text-short"></div>
                  <div className="sc-skeleton sc-skeleton-button"></div>
                </div>
              </div>
            ))}
          </div>
        ) : packages.length === 0 ? (
          <div className="sc-empty-state">
            <div className="sc-empty-icon">
              <FaBoxOpen />
            </div>
            <h3 className="sc-empty-title">No Packages Available</h3>
            <p className="sc-empty-text">No packages available for this subcategory. Please try another option.</p>
          </div>
        ) : (
          <div className="sc-cards-grid">
            {packages.map((pkg, index) => {
              const isInCart = cartItems.some((i) => i.id === pkg.id);
              return (
                <div
                  key={pkg.id}
                  className="sc-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => navigate(`/servicedetails/${slugify(pkg.title)}/${pkg.id}`, {
                            state: { scrollToId: "whatsIncluded" } // Passing the ID to scroll to
                          })}
                >
                  {/* Card Image */}
                  <div className="sc-card-image-wrapper">
                    <img src={pkg.image} alt={pkg.title} className="sc-card-image" />
                    <div className="sc-card-overlay"></div>
                    {pkg.tag && <span className="sc-card-badge">{pkg.tag}</span>}
                  </div>

                  {/* Card Content */}
                  <div className="sc-card-content">
                    <h3 className="sc-card-title">{pkg.title}</h3>

                    {/* Includes List - Show only 2 items */}
                    <ul className="sc-card-includes">
                      {pkg.includes.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="sc-card-include-item">
                          <FaCheck className="sc-include-icon" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    {pkg.includes.length > 3 && (
                      // <span className="sc-view-more">+{pkg.includes.length - 3} more services</span>
                      <span
                        className="sc-view-more"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevents the main card click from firing
                          navigate(`/servicedetails/${slugify(pkg.title)}/${pkg.id}`, {
                            state: { scrollToId: "whatsIncluded" } // Passing the ID to scroll to
                          });
                        }}
                      >
                        +{pkg.includes.length - 3} more services
                      </span>
                    )}

                    {/* Card Actions */}
                    <div className="sc-card-actions">
                      {isInCart ? (
                        <div className="sc-cart-actions">
                          <button
                            className="sc-btn sc-btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/cart");
                            }}
                          >
                            <FaShoppingCart />
                            <span>View Cart</span>
                          </button>
                          <button
                            className="sc-btn sc-btn-danger"
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
                          className="sc-btn sc-btn-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedService(pkg);
                            setIsModalOpen(true);
                          }}
                        >
                          <FaCalendarAlt />
                          <span>Book Service</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FAQ Section with Image */}
        {faqs.length > 0 && (
          <div className="sc-faq-wrapper">
            {/* Image Side */}
            <div className="sc-faq-image-side">
              <div className="sc-faq-image-wrapper">
                <div className="sc-faq-image">
                  <img
                    src="/assets/img/normal/faq-thumb-2-1.webp"
                    alt="Car Service FAQ"
                  />
                </div>
                {/* Floating Badge */}
                <div className="sc-faq-badge">
                  <div className="sc-faq-badge-icon">
                    <FaQuestionCircle />
                  </div>
                  <div className="sc-faq-badge-text">
                    Got Questions?<br />We Have Answers!
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Side */}
            <div className="sc-faq-content-side">
              <div className="sc-faq-section">
                <h3 className="sc-faq-title">
                  <FaQuestionCircle className="sc-faq-title-icon" />
                  Frequently Asked Questions
                </h3>
                <div className="sc-faq-grid sc-faq-scrollable">
                  {faqs.map((faq, idx) => (
                    <div key={faq.FAQID || idx} className="sc-faq-card">
                      <button
                        className="sc-faq-question"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target={`#scFaqCollapse${idx}`}
                      >
                        <span className="sc-faq-number">{String(idx + 1).padStart(2, '0')}</span>
                        <span className="sc-faq-question-text">
                          {faq.Question.charAt(0).toUpperCase() + faq.Question.slice(1)}
                        </span>
                        <span className="sc-faq-chevron">
                          <i className="fas fa-chevron-down" />
                        </span>
                      </button>
                      <div id={`scFaqCollapse${idx}`} className="collapse sc-faq-answer">
                        <p>{faq.Answer.charAt(0).toUpperCase() + faq.Answer.slice(1)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Explanations Section */}
        {explanations.length > 0 && (
          <div className="sc-explanations-section">
            <h3 className="sc-explanations-title">
              <FaQuestionCircle className="sc-explanations-title-icon" />
              Explanation Details & Information
            </h3>
            <div className="sc-explanations-grid">
              {explanations.map((exp, idx) => (
                <div key={exp.FAQID || idx} className="sc-explanation-card">
                  <div className="sc-explanation-header">
                    <span className="sc-explanation-number">{String(idx + 1).padStart(2, '0')}</span>
                    <h4 className="sc-explanation-question">{exp.Question}</h4>
                  </div>
                  {/* <p className="sc-explanation-answer">{exp.Answer}</p> */}
                  <p className="sc-explanation-answer">
                    {exp.Answer.replace(/\n+/g, "\n")   // convert multiple \n into single \n
                      .split("\n")
                      .map((line, i) => (
                        <React.Fragment key={i}>
                          {line}
                          <br />
                        </React.Fragment>
                      ))}
                  </p>
                </div>
              ))}
            </div>
          </div>
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
        serviceTypeDetail="PACKAGE "
        serviceIdCollect= {selectedService ? selectedService.id : 0}
      />
    </section>
  );
}
