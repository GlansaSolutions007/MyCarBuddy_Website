import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useCart } from "../context/CartContext";
import ChooseCarModal from "./ChooseCarModalGridLayout";
import { Helmet } from "react-helmet-async";
import BookServiceModal from "./BookServiceModal"
import { Button } from "bootstrap";


const BaseURL = process.env.REACT_APP_CARBUDDY_BASE_URL;
const ImageURL = process.env.REACT_APP_CARBUDDY_IMAGE_URL;

const SkeletonLoader = () => {
  return (
    <div className="service-details-area py-5">
      <div className="container">
        <div className="row gx-5 flex-row">
          {/* Main Content Skeleton */}
          <div className="col-lg-8">
            <div className="service-page-single">
              <div className="page-img mb-4">
                <div
                  className="skeleton-carousel mb-4"
                  style={{
                    height: 400,
                    backgroundColor: "#e0e0e0",
                    borderRadius: "0.5rem",
                  }}
                ></div>
                <div
                  className="d-flex justify-content-between align-items-center px-4 py-3"
                  style={{ backgroundColor: "#f1f1f1" }}
                >
                  <div
                    className="skeleton-price"
                    style={{
                      width: "100px",
                      height: 24,
                      backgroundColor: "#e0e0e0",
                      borderRadius: "0.25rem",
                    }}
                  ></div>
                  <div
                    className="skeleton-button"
                    style={{
                      width: "120px",
                      height: 36,
                      backgroundColor: "#e0e0e0",
                      borderRadius: "0.25rem",
                    }}
                  ></div>
                </div>
              </div>

              <div className="page-content">
                <div
                  className="skeleton-title mb-3"
                  style={{
                    width: "60%",
                    height: 32,
                    backgroundColor: "#e0e0e0",
                    borderRadius: "0.25rem",
                  }}
                ></div>
                <div
                  className="skeleton-text mb-2"
                  style={{
                    width: "90%",
                    height: 16,
                    backgroundColor: "#e0e0e0",
                    borderRadius: "0.25rem",
                  }}
                ></div>
                <div
                  className="skeleton-text mb-4"
                  style={{
                    width: "80%",
                    height: 16,
                    backgroundColor: "#e0e0e0",
                    borderRadius: "0.25rem",
                  }}
                ></div>

                <div
                  className="skeleton-subtitle mb-2"
                  style={{
                    width: "200px",
                    height: 24,
                    backgroundColor: "#e0e0e0",
                    borderRadius: "0.25rem",
                  }}
                ></div>
                <div className="skeleton-list mb-4">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="skeleton-list-item mb-2"
                      style={{
                        width: "90%",
                        height: 20,
                        backgroundColor: "#e0e0e0",
                        borderRadius: "0.25rem",
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="col-lg-4">
            <aside className="sidebar-area">
              <div className="widget widget_service-list mb-4">
                <div
                  className="skeleton-sidebar-title mb-3"
                  style={{
                    width: "150px",
                    height: 24,
                    backgroundColor: "#e0e0e0",
                    borderRadius: "0.25rem",
                  }}
                ></div>
                <div className="skeleton-sidebar-list">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="skeleton-sidebar-item mb-2"
                      style={{
                        width: "100%",
                        height: 20,
                        backgroundColor: "#e0e0e0",
                        borderRadius: "0.25rem",
                      }}
                    ></div>
                  ))}
                </div>
              </div>

              <div className="widget widget_contact bg-light p-3 rounded text-center">
                <div
                  className="skeleton-contact-title mb-2"
                  style={{
                    width: "100px",
                    height: 20,
                    backgroundColor: "#e0e0e0",
                    borderRadius: "0.25rem",
                  }}
                ></div>
                <div
                  className="skeleton-contact-text mb-2"
                  style={{
                    width: "100%",
                    height: 16,
                    backgroundColor: "#e0e0e0",
                    borderRadius: "0.25rem",
                  }}
                ></div>
                <div
                  className="skeleton-contact-text mb-2"
                  style={{
                    width: "90%",
                    height: 16,
                    backgroundColor: "#e0e0e0",
                    borderRadius: "0.25rem",
                  }}
                ></div>
                <div
                  className="skeleton-contact-text mb-2"
                  style={{
                    width: "80%",
                    height: 16,
                    backgroundColor: "#e0e0e0",
                    borderRadius: "0.25rem",
                  }}
                ></div>
                <div
                  className="skeleton-contact-icon mb-2"
                  style={{
                    width: "40px",
                    height: 40,
                    backgroundColor: "#e0e0e0",
                    borderRadius: "50%",
                    margin: "0 auto",
                  }}
                ></div>
                <div
                  className="skeleton-contact-phone"
                  style={{
                    width: "120px",
                    height: 20,
                    backgroundColor: "#e0e0e0",
                    borderRadius: "0.25rem",
                    margin: "0 auto",
                  }}
                ></div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
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
        const response = await axios.get(
          `${BaseURL}FAQS/Packages?PackageID=${id}`
        );
        setFaqs(response.data[0]?.FAQS || []);
      } catch (error) {
        console.error("Error fetching FAQs:", error);
      }
    };

    if (id) {
      fetchFaqs();
    }
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

  return (
    <>
      {/* ✅ Dynamic SEO Meta Tags */}
      {seoMeta && (
        <Helmet>
          <title>{seoMeta.seo_title || "About | MyCarBuddy"}</title>
          <meta name="description" content={seoMeta.seo_description || ""} />
          <meta name="keywords" content={seoMeta.seo_keywords || ""} />
        </Helmet>
      )}
      {/* Service Details Area */}
      <div className="service-details-area py-5">
        <div className="container">
          <div className="row gx-5 flex-row">
            {/* Main Content */}
            <div className="col-lg-8">
              <div className="service-page-single">
                <div className="page-img mb-4">
                  <div className="d-flex1">
                    <div className="w-100">
                      <div
                        id="serviceCarousel"
                        className="carousel slide mb-4"
                        data-bs-ride="carousel"
                        data-bs-interval="3000"
                      >
                        <div className="carousel-inner">
                          {service.banners.map((img, idx) => (
                            <div
                              className={`carousel-item ${idx === 0 ? "active" : ""
                                }`}
                              key={idx}
                            >
                              <img
                                src={img}
                                className="d-block w-100 rounded"
                                alt={`${service.title} ${idx + 1}`}
                                style={{ objectFit: "cover", height: "400px" }}
                              />
                            </div>
                          ))}
                        </div>

                        <button
                          className="carousel-control-prev"
                          type="button"
                          data-bs-target="#serviceCarousel"
                          data-bs-slide="prev"
                        >
                          <span
                            className="carousel-control-prev-icon"
                            aria-hidden="true"
                          ></span>
                          <span className="visually-hidden">Previous</span>
                        </button>

                        <button
                          className="carousel-control-next"
                          type="button"
                          data-bs-target="#serviceCarousel"
                          data-bs-slide="next"
                        >
                          <span
                            className="carousel-control-next-icon"
                            aria-hidden="true"
                          ></span>
                          <span className="visually-hidden">Next</span>
                        </button>
                      </div>
                    </div>

                    <div className="w-50 d-flex flex-row justify-content-end gap-2"></div>
                  </div>

                  <div
                    className="d-flex justify-content-between align-items-center px-4 py-3"
                    style={{ backgroundColor: "#f1f1f1" }}
                  >
                    {selectedCar ? (
                      <>
                        <h5 className="mb-0 fw-bold text-dark">
                          {/* ₹ {service.price} */}
                          <button
                            className="btn btn-danger fw-bold px-4 py-2"
                            onClick={() => {
                              navigate("/#services");
                            }}
                          >
                            Quick Support
                          </button>
                        </h5>
                        {isInCart ? (
                          <div>
                            <button
                              className="btn style-border2 px-4 py-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate("/cart");
                              }}
                            >
                              ✔ View Cart
                            </button>
                            <button
                              className="btn style-border2 px-3 py-2 ml-5"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromCart(service.id);
                              }}
                            >
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        ) : (
                          // <button
                          //   className="btn btn-danger fw-bold px-4 py-2"
                          //   onClick={(e) => {
                          //     e.stopPropagation();
                          //     addToCart(service);
                          //     toast.success("Service added to cart");
                          //   }}
                          // >
                          //   + ADD TO CART
                          // </button>
                          <button
                            className="btn btn-danger fw-bold px-4 py-2"
                            onClick={(e) => {
                              e.stopPropagation();          // prevent card click
                              setSelectedService(service);      // <--- IMPORTANT
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
                          Select your car to see price
                        </div>
                        <button
                          className="btn style-border2 px-4 py-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCarModal(true);
                          }}
                        >
                          Choose Your Car
                        </button> */}
                        <button
                          className="btn btn-danger fw-bold px-4 py-2"
                          onClick={() => {
                            navigate("/#help");
                          }}
                        >
                          Quick Support
                        </button>
                        <button
                          className="btn btn-danger fw-bold px-4 py-2"
                          onClick={(e) => {
                            e.stopPropagation();          // prevent card click
                            setSelectedService(service);      // <--- IMPORTANT
                            setIsModalOpen(true);
                          }}
                        >
                          BOOK SERVICE
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="page-content">
                  <h2 className="page-title">{service.title}</h2>
                  <p className="text-muted mb-3">{service.duration}</p>
                  <p>{service.Description}</p>

                  <h4 className="mt-4 mb-2">Included in this service:</h4>
                  <ul className="list-group mb-4">
                    {service.includes.map((item, idx) => (
                      <li key={idx} className="list-group-item">
                        <i className="fas fa-check-circle text-success me-2"></i>
                        {item}
                      </li>
                    ))}
                  </ul>

                  {faqs.length > 0 && (
                    <div className="mt-4">
                      <h4 className="mb-3">Frequently Asked Questions</h4>
                      <div className="accordion mb-4" id="faqAccordion">
                        {faqs.map((faq, idx) => (
                          <div className="accordion-item px-0">
                            <h2 className="accordion-header" id={`heading${idx}`}>
                              <button
                                className="accordion-button collapsed fw-bold px-4 py-0"
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target={`#collapse${idx}`}
                                aria-expanded="false"
                                aria-controls={`collapse${idx}`}
                              >
                                {faq.Question.charAt(0).toUpperCase() + faq.Question.slice(1)}
                              </button>
                            </h2>
                            <div
                              id={`collapse${idx}`}
                              className="accordion-collapse collapse"
                              aria-labelledby={`heading${idx}`}
                              data-bs-parent="#faqAccordion"
                            >
                              <div className="accordion-body">
                                {faq.Answer.charAt(0).toUpperCase() + faq.Answer.slice(1)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-lg-4">
              <aside className="sidebar-area">
                <div
                  className="widget widget_service-list mb-4 d-flex flex-column"
                  style={{ height: "70vh" }}
                >
                  <h4 className="widget_title mb-3">Other Services</h4>
                  <ul
                    className="overflow-auto p-0 m-0"
                    style={{ listStyle: "none" }}
                  >
                    {otherCategories.map((cat) => (
                      <li
                        key={cat.CategoryID}
                        className="list-group-item d-flex justify-content-between align-items-center"
                      >
                        <Link
                          to={`/service/${slugify(cat.CategoryName)}/${cat.CategoryID
                            }`}
                        >
                          {cat.CategoryName}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="widget widget_contact bg-light p-3 rounded text-center">
                  <h5 className="widget_title mb-2">Need Help?</h5>
                  <p className="text-muted mb-2">
                    Have questions about this service?
                  </p>
                  <p>
                    At <strong>My Car Buddy</strong>, powered by{" "}
                    <strong>Glansa Solutions Pvt. Ltd.</strong>, we aim to make
                    your car care experience seamless and worry-free. Whether
                    you need assistance with booking, payments, service updates,
                    or technical support, our team is ready to help.
                  </p>
                  <div className="icon fs-3 mb-2 text-primary">
                    <i className="fas fa-phone-alt"></i>
                  </div>
                  <h5>
                    {" "}
                    <Link to="tel:7075243939">+91 707-524-3939</Link>
                    <br /> <Link to="tel:9885653865"> +91 988-565-3865</Link>
                  </h5>
                </div>
              </aside>
            </div>
          </div>
        </div>

        <div className="widget widget_related-services mb-4">
          <div
            className="d-flex justify-content-between align-items-center mb-3"
            style={{ position: "relative" }}
          >
            <h4 className="widget_title mb-0">Related Services</h4>
            <div
              className="testimonialOne arrow"
              style={{ position: "absolute", bottom: "0px", right: "0px" }}
            >
              <div
                className="testimonialOne-button-prev testimonialOne-button"
                data-bs-target="#relatedServicesCarousel"
                data-bs-slide="prev"
              >
                <i className="fas fa-arrow-left"></i>
              </div>
              <div
                className="testimonialOne-button-next testimonialOne-button"
                data-bs-target="#relatedServicesCarousel"
                data-bs-slide="next"
              >
                <i className="fas fa-arrow-right"></i>
              </div>
            </div>
          </div>
          <div id="relatedServicesCarousel" className="carousel slide">
            <div className="carousel-inner">
              {(() => {
                const services = categoryServices;
                const chunkedServices = [];
                for (let i = 0; i < services.length; i += 4) {
                  chunkedServices.push(services.slice(i, i + 4));
                }
                return chunkedServices.map((chunk, slideIndex) => (
                  <div
                    key={slideIndex}
                    className={`carousel-item ${slideIndex === 0 ? "active" : ""
                      }`}
                  >
                    <div className="row">
                      {chunk.map((s) => (
                        <div key={s.PackageID} className="col-md-3 mb-3">
                          <div className="card h-100">
                            <Link
                              to={`/servicedetails/${slugify(s.PackageName)}/${s.PackageID
                                }`}
                              style={{
                                textDecoration: "none",
                                color: "inherit",
                              }}
                            >
                              <img
                                src={
                                  s.PackageImage
                                    ? `${ImageURL}${s.PackageImage}`
                                    : ""
                                }
                                className="card-img-top"
                                alt={s.PackageName}
                                style={{ height: "150px", objectFit: "cover" }}
                              />
                              <div className="card-body d-flex flex-column">
                                <h5 className="card-title">{s.PackageName}</h5>
                                {/* <div className="mb-2">
                                  <span className="text-success fw-bold">
                                    ₹{s.Serv_Off_Price}
                                  </span>
                                  {s.Serv_Reg_Price && (
                                    <span className="text-decoration-line-through text-muted ms-1 small">
                                      ₹{s.Serv_Reg_Price}
                                    </span>
                                  )}
                                </div> */}
                                <ul className="list-unstyled">
                                  {s.IncludeNames
                                    ? s.IncludeNames.split(",")
                                      .slice(0, 4)
                                      .map((inc, idx) => (
                                        <li key={idx}>
                                          <i className="fas fa-check-circle text-success me-2"></i>
                                          {inc.trim()}
                                        </li>
                                      ))
                                    : null}
                                </ul>
                              </div>
                            </Link>
                            <div className="card-body pt-0">
                              <div className="mt-auto">
                                {cartItems.some(
                                  (item) => item.id === s.PackageID
                                ) ? (
                                  <>
                                    <button
                                      className="btn style-border2 px-4 py-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate("/cart");
                                      }}
                                    >
                                      ✔ View Cart
                                    </button>
                                    <button
                                      className="btn style-border2 px-3 py-2 ml-5"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeFromCart(s.PackageID);
                                      }}
                                    >
                                      <i className="bi bi-trash" />
                                    </button>
                                  </>
                                ) : (
                                  // <button
                                  //   className="btn btn-danger fw-bold px-4 py-2"
                                  //   onClick={(e) => {
                                  //     e.stopPropagation();
                                  //     addToCart({
                                  //       id: s.PackageID,
                                  //       title: s.PackageName,
                                  //       price: s.Serv_Off_Price,
                                  //       image: s.PackageImage
                                  //         ? `${ImageURL}${s.PackageImage}`
                                  //         : "",
                                  //       includes: s.IncludeNames
                                  //         ? s.IncludeNames.split(",").map((i) =>
                                  //             i.trim()
                                  //           )
                                  //         : [],
                                  //       categoryId: s.CategoryID,
                                  //     });
                                  //     toast.success("Service added to cart");
                                  //   }}
                                  // >
                                  //   + ADD TO CART
                                  // </button>
                                  <button
                                    className="btn btn-danger fw-bold px-4 py-2"
                                    onClick={(e) => {
                                      e.stopPropagation();          // prevent card click
                                      setSelectedService({title: s.PackageName});
                                      setIsModalOpen(true);
                                    }}
                                  >
                                    BOOK SERVICE
                                  </button>
                                )}
                              </div>
                            </div>
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
      </div>
      <BookServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedService={selectedService}
      />
    </>
  );
};

export default ServiceDetails;
