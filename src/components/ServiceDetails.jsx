import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useCart } from "../context/CartContext";
import ChooseCarModal from "./ChooseCarModalGridLayout";
import { Helmet } from "react-helmet-async";
import BookServiceModal from "./BookServiceModal";
import { FaCheck, FaShoppingCart, FaTrash, FaCalendarAlt, FaPhone, FaHeadset, FaChevronLeft, FaChevronRight, FaClock, FaQuestionCircle, FaArrowRight } from "react-icons/fa";
import "./ServiceDetails.css";

const BaseURL = process.env.REACT_APP_CARBUDDY_BASE_URL;
const ImageURL = process.env.REACT_APP_CARBUDDY_IMAGE_URL;

const SkeletonLoader = () => {
  return (
    <section className="sd-section">
      <div className="container">
        <div className="sd-layout">
          {/* Main Content Skeleton */}
          <div className="sd-main">
            <div className="sd-skeleton sd-skeleton-carousel"></div>
            <div className="sd-skeleton-actions">
              <div className="sd-skeleton sd-skeleton-btn"></div>
              <div className="sd-skeleton sd-skeleton-btn"></div>
            </div>
            <div className="sd-skeleton sd-skeleton-title"></div>
            <div className="sd-skeleton sd-skeleton-text"></div>
            <div className="sd-skeleton sd-skeleton-text-short"></div>
            <div className="sd-skeleton sd-skeleton-subtitle"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="sd-skeleton sd-skeleton-item"></div>
            ))}
          </div>

          {/* Sidebar Skeleton */}
          <div className="sd-sidebar">
            <div className="sd-skeleton sd-skeleton-sidebar-card"></div>
            <div className="sd-skeleton sd-skeleton-sidebar-card-small"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ServiceDetails = () => {
  const { packagename, id } = useParams();
  const navigate = useNavigate();
  const { cartItems, addToCart, removeFromCart } = useCart();
  const [services, setServices] = React.useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [showCarModal, setShowCarModal] = useState(false);
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seoMeta, setSeoMeta] = useState(null);
  const [categories, setCategories] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [explanations, setExplanations] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  }

  // if(selectedService.length > 0){
  //   console.log(selectedService);
  // }

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

    const handleProfileUpdate = () => {
      loadSelectedCar();
    };

    window.addEventListener("userProfileUpdated", handleProfileUpdate);

    return () => {
      window.removeEventListener("userProfileUpdated", handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${BaseURL}PlanPackage/GetPlanPackagesByCategoryAndSubCategory`
        );

        setAllServices(response.data);

        const formatted = response.data
          .filter((pkg) => pkg.PackageID === parseInt(id))
          .map((pkg) => {
            const hours = pkg.EstimatedDurationMinutes
              ? pkg.EstimatedDurationMinutes
              : null;

            return {
              id: pkg.PackageID,
              title: pkg.PackageName,
              banners: pkg.BannerImage
                ? pkg.BannerImage.split(",").map(
                  (img) => `${ImageURL}${img.trim()}`
                )
                : [],
              image: `${ImageURL}${pkg.PackageImage}`,
              tag: "Featured Package",
              duration: pkg.EstimatedDurationMinutes
                ? `${pkg.EstimatedDurationMinutes} `
                : "N/A",
              price: pkg.Serv_Off_Price,
              originalPrice: pkg.Serv_Reg_Price,
              includes: pkg.IncludeNames
                ? pkg.IncludeNames.split(",").map((i) => i.trim())
                : [],
              BrandId: "",
              ModelId: "",
              isActive: pkg.IsActive,
              EstimatedDurationMinutes: pkg.EstimatedDurationMinutes,
              EstimatedDurationHours: hours,
              Description: pkg.Description,
              categoryId: pkg.CategoryID,
            };
          });

        setServices(formatted);
      } catch (err) {
        console.error("Failed to fetch packages", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [id]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${BaseURL}Category`);
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
    const fetchSeoData = async () => {
      try {
        const slug = services[0].title.toLowerCase().replace(/\s+/g, "-"); // replace spaces with -

        const res = await axios.get(
          `${BaseURL}Seometa/page_slug?page_slug=${slug}`
        );

        if (res.data) {
          setSeoMeta(res.data[0]);
        }
      } catch (error) {
        console.error("Error fetching SEO metadata:", error);
      }
    };

    fetchSeoData();
  }, [services]);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        if (!id) return;

        const response = await axios.get(
          `${BaseURL}FAQS/Packages?PackageID=${id}&Type=package`
        );

        // Get FAQs from PackageFAQS array
        const packageFaqs = response.data?.PackageFAQS || [];

        if (packageFaqs.length > 0 && packageFaqs[0]?.FAQS) {
          setFaqs(packageFaqs[0].FAQS);
        } else {
          setFaqs([]);
        }
      } catch (error) {
        console.error("Error fetching FAQs:", error);
        setFaqs([]);
      }
    };

    fetchFaqs();
  }, [id]);

  useEffect(() => {
    const fetchExplanations = async () => {
      try {
        if (!id) return;

        const response = await axios.get(
          `${BaseURL}Explanations/Packages?PackageID=${id}&Type=package`
        );

        // Get Explanations from PackageFAQS array
        const packageExplanations = response.data?.PackageFAQS || [];

        if (packageExplanations.length > 0 && packageExplanations[0]?.FAQS) {
          setExplanations(packageExplanations[0].FAQS);
        } else {
          setExplanations([]);
        }
      } catch (error) {
        console.error("Error fetching Explanations:", error);
        setExplanations([]);
      }
    };

    fetchExplanations();
  }, [id]);

  const service = services.find((s) => s.id === parseInt(id));

  if (loading) {
    return <SkeletonLoader />;
  }

  if (!service) {
    return "";
  }

  const categoryServices = allServices.filter(
    (s) => s.CategoryID === service.categoryId && s.PackageID !== service.id
  );

  const otherCategories = categories.filter(
    (cat) => cat.CategoryID !== service.categoryId
  );

  const isInCart = cartItems.some((i) => i.id === service.id);

  const slugify = (text) => {
    return text
      .toLowerCase()
      .replace(/&/g, "and") // replace "&" with "and"
      .replace(/[^a-z0-9]+/g, "-") // replace all non-alphanumeric with "-"
      .replace(/^-+|-+$/g, ""); // trim starting/ending "-"
  };

  const handlePhoneClick = (phone) => {
    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|webOS|BlackBerry/i.test(
      navigator.userAgent
    );

    if (isMobile) {
      // On mobile, open phone dialer
      window.location.href = `tel:${phone}`;
    } else {
      // On desktop/laptop, open WhatsApp
      window.open(`https://wa.me/91${phone}`, "_blank");
    }
  };

  return (
    <>
      {/* Dynamic SEO Meta Tags */}
      {seoMeta && (
        <Helmet>
          <title>{seoMeta.seo_title || "About | MyCarBuddy"}</title>
          <meta name="description" content={seoMeta.seo_description || ""} />
          <meta name="keywords" content={seoMeta.seo_keywords || ""} />
        </Helmet>
      )}

      {/* Service Details Section */}
      <section className="sd-section">
        <div className="sd-bg-decoration sd-bg-decoration-1"></div>
        <div className="sd-bg-decoration sd-bg-decoration-2"></div>

        <div className="container">
          <div className="sd-layout">
            {/* Main Content */}
            <div className="sd-main">
              {/* Image Carousel */}
              <div className="sd-carousel-wrapper">
                <div
                  id="serviceCarousel"
                  className="carousel slide sd-carousel"
                  data-bs-ride="carousel"
                  data-bs-interval="4000"
                >
                  <div className="carousel-inner">
                    {service.banners.map((img, idx) => (
                      <div className={`carousel-item ${idx === 0 ? "active" : ""}`} key={idx}>
                        <img src={img} className="sd-carousel-image" alt={`${service.title} ${idx + 1}`} />
                      </div>
                    ))}
                  </div>

                  {service.banners.length > 1 && (
                    <>
                      <button className="sd-carousel-btn sd-carousel-prev" type="button" data-bs-target="#serviceCarousel" data-bs-slide="prev">
                        <FaChevronLeft />
                      </button>
                      <button className="sd-carousel-btn sd-carousel-next" type="button" data-bs-target="#serviceCarousel" data-bs-slide="next">
                        <FaChevronRight />
                      </button>
                    </>
                  )}

                  {/* Carousel Indicators */}
                  {service.banners.length > 1 && (
                    <div className="sd-carousel-indicators">
                      {service.banners.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          data-bs-target="#serviceCarousel"
                          data-bs-slide-to={idx}
                          className={idx === 0 ? "active" : ""}
                        ></button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              <div className="sd-action-bar">
                <button
                  className="sd-btn sd-btn-outline"
                  onClick={() => {
                    const phoneNumber = "+917075243939";

                    // Detect mobile devices
                    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

                    if (isMobile) {
                      // 📱 Mobile → Open Dial Pad
                      window.location.href = `tel:${phoneNumber}`;
                    } else {
                      // 💻 Desktop → Open WhatsApp Web
                      window.open(`https://wa.me/${phoneNumber}`, "_blank");
                    }
                  }}
                >
                  <FaHeadset />
                  <span>Free Quick Support</span>
                </button>


                {isInCart ? (
                  <div className="sd-cart-actions">
                    <button className="sd-btn sd-btn-secondary" onClick={() => navigate("/cart")}>
                      <FaShoppingCart />
                      <span>View Cart</span>
                    </button>
                    <button className="sd-btn sd-btn-danger" onClick={() => removeFromCart(service.id)}>
                      <FaTrash />
                    </button>
                  </div>
                ) : (
                  <button
                    className="sd-btn sd-btn-primary"
                    onClick={() => {
                      setSelectedService(service);
                      setIsModalOpen(true);
                    }}
                  >
                    <FaCalendarAlt />
                    <span>Book Service</span>
                  </button>
                )}
              </div>

              {/* Service Content */}
              <div className="sd-content">
                <h1 className="sd-title">{service.title}</h1>

                {service.duration && (
                  <div className="sd-duration">
                    <FaClock className="sd-duration-icon" />
                    <span>Estimated Time: {service.duration} minutes</span>
                  </div>
                )}

                {service.Description && (
                  <p className="sd-description">{service.Description}</p>
                )}

                {/* What's Included - In Main Content */}
                {service.includes.length > 0 && (
                  <div className="sd-includes-main">
                    <h3 className="sd-section-title">
                      <span className="sd-section-title-icon"><FaCheck /></span>
                      What's Included
                    </h3>
                    <ul className="sd-includes-list-main">
                      {service.includes.map((item, idx) => (
                        <li key={idx} className="sd-includes-item-main">
                          <span className="sd-includes-check-main"><FaCheck /></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* FAQ Section - In Main Content */}
                {faqs.length > 0 && (
                  <div className="sd-faq-main">
                    <h3 className="sd-section-title">
                      <span className="sd-section-title-icon"><FaQuestionCircle /></span>
                      Frequently Asked Questions
                    </h3>
                    <div className="sd-faq-accordion-main">
                      {faqs.map((faq, idx) => (
                        <div key={idx} className="sd-faq-card">
                          <button
                            className="sd-faq-question"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target={`#faqCollapse${idx}`}
                          >
                            <span className="sd-faq-number">{String(idx + 1).padStart(2, '0')}</span>
                            <span className="sd-faq-question-text">
                              {faq.Question.charAt(0).toUpperCase() + faq.Question.slice(1)}
                            </span>
                            <span className="sd-faq-chevron">
                              <i className="fas fa-chevron-down" />
                            </span>
                          </button>
                          <div id={`faqCollapse${idx}`} className="collapse sd-faq-answer">
                            <p>{faq.Answer.charAt(0).toUpperCase() + faq.Answer.slice(1)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Explanations Section */}
                {explanations.length > 0 && (
                  <div className="sd-explanations">
                    <h4 className="sd-sidebar-title">
                      <FaQuestionCircle className="sd-sidebar-title-icon" />
                      Explanation Details & Information
                    </h4>
                    <div className="sd-explanations-list">
                      {explanations.map((exp, idx) => (
                        <div key={exp.FAQID || idx} className="sd-explanation-item">
                          <div className="sd-explanation-header">
                            <span className="sd-explanation-number">{String(idx + 1).padStart(2, '0')}</span>
                            <h5 className="sd-explanation-question">{exp.Question}</h5>
                          </div>
                          <p className="sd-explanation-answer">
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
            </div>

            {/* Sidebar */}
            <aside className="sd-sidebar">
              {/* Other Services */}
              <div className="sd-sidebar-card">
                <h4 className="sd-sidebar-title">Other Services</h4>
                <ul className="sd-services-list">
                  {otherCategories.map((cat) => (
                    <li key={cat.CategoryID} className="sd-services-item">
                      <Link to={`/service/${slugify(cat.CategoryName)}/${cat.CategoryID}`}>
                        <span>{cat.CategoryName}</span>
                        <FaArrowRight className="sd-services-arrow" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact Card */}
              <div className="sd-contact-card">
                <div className="sd-contact-icon">
                  <FaPhone style={{ transform: "scaleX(-1)" }} />
                </div>
                <h4 className="sd-contact-title">Need Free Help?</h4>
                <p className="sd-contact-text">
                  Have questions about this service? Our team is ready to help.
                </p>
                <div className="sd-contact-phones">
                  <button
                    className="sd-phone-link"
                    onClick={() => handlePhoneClick("7075243939")}
                  >
                    <FaPhone style={{ transform: "scaleX(-1)" }} /> +91 707-524-3939
                  </button>
                  <button
                    className="sd-phone-link"
                    onClick={() => handlePhoneClick("9885653865")}
                  >
                    <FaPhone style={{ transform: "scaleX(-1)" }} /> +91 988-565-3865
                  </button>
                </div>
              </div>

              {/* Why Choose Us */}
              {/* <div className="sd-why-choose">
                <h4 className="sd-sidebar-title">
                  <FaQuestionCircle className="sd-sidebar-title-icon" />
                  Why Choose Us
                </h4>
                <div className="sd-why-list">
                  <div className="sd-why-item">
                    <span className="sd-why-number">01</span>
                    <div className="sd-why-content">
                      <h5>Expert Technicians</h5>
                      <p>Our certified mechanics have years of experience in all car makes and models.</p>
                    </div>
                  </div>
                  <div className="sd-why-item">
                    <span className="sd-why-number">02</span>
                    <div className="sd-why-content">
                      <h5>Doorstep Service</h5>
                      <p>Professional car servicing delivered right at your home or office.</p>
                    </div>
                  </div>
                  <div className="sd-why-item">
                    <span className="sd-why-number">03</span>
                    <div className="sd-why-content">
                      <h5>Transparent Pricing</h5>
                      <p>No hidden charges. Get detailed estimates before any work begins.</p>
                    </div>
                  </div>
                  <div className="sd-why-item">
                    <span className="sd-why-number">04</span>
                    <div className="sd-why-content">
                      <h5>Warranty Coverage</h5>
                      <p>All services come with warranty for your peace of mind.</p>
                    </div>
                  </div>
                </div>
              </div> */}


              {/* Image Area - Desktop Only */}
              <div className="sd-image-area">
                <img
                  src="/assets/img/package-side-cover-3.png"
                  alt="Package Side Cover"
                  className="sd-side-image"
                />
              </div>


            </aside>
          </div>

          {/* Related Services */}
          {categoryServices.length > 0 && (
            <div className="sd-related">
              <div className="sd-related-header">
                <h3 className="sd-related-title">Related Services</h3>
                <div className="sd-related-nav">
                  <button className="sd-related-btn" data-bs-target="#relatedServicesCarousel" data-bs-slide="prev">
                    <FaChevronLeft />
                  </button>
                  <button className="sd-related-btn" data-bs-target="#relatedServicesCarousel" data-bs-slide="next">
                    <FaChevronRight />
                  </button>
                </div>
              </div>

              <div id="relatedServicesCarousel" className="carousel slide">
                <div className="carousel-inner">
                  {(() => {
                    const chunkedServices = [];
                    for (let i = 0; i < categoryServices.length; i += 4) {
                      chunkedServices.push(categoryServices.slice(i, i + 4));
                    }
                    return chunkedServices.map((chunk, slideIndex) => (
                      <div key={slideIndex} className={`carousel-item ${slideIndex === 0 ? "active" : ""}`}>
                        <div className="sd-related-grid">
                          {chunk.map((s) => (
                            <div key={s.PackageID} className="sd-related-card">
                              <Link to={`/servicedetails/${slugify(s.PackageName)}/${s.PackageID}`}>
                                <div className="sd-related-image-wrapper">
                                  <img
                                    src={s.PackageImage ? `${ImageURL}${s.PackageImage}` : ""}
                                    alt={s.PackageName}
                                    className="sd-related-image"
                                  />
                                </div>
                                <div className="sd-related-content">
                                  <h5 className="sd-related-card-title">{s.PackageName}</h5>
                                  <ul className="sd-related-includes">
                                    {s.IncludeNames &&
                                      s.IncludeNames.split(",")
                                        .slice(0, 3)
                                        .map((inc, idx) => (
                                          <li key={idx}>
                                            <FaCheck className="sd-related-check" />
                                            <span>{inc.trim()}</span>
                                          </li>
                                        ))}
                                  </ul>
                                </div>
                              </Link>
                              <div className="sd-related-actions">
                                {cartItems.some((item) => item.id === s.PackageID) ? (
                                  <button className="sd-btn sd-btn-secondary sd-btn-sm" onClick={() => navigate("/cart")}>
                                    <FaShoppingCart /> View Cart
                                  </button>
                                ) : (
                                  <button
                                    className="sd-btn sd-btn-primary sd-btn-sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSelectedService({ title: s.PackageName });
                                      setIsModalOpen(true);
                                    }}
                                  >
                                    <FaCalendarAlt /> Book Now
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
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
      </section>

      <BookServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedService={selectedService}
      />
    </>
  );
};

export default ServiceDetails;
