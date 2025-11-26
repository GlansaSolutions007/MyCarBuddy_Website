import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import BookServiceModal from "./BookServiceModal"


const ServiceAreaTwo = () => {
  const BASE_URL = process.env.REACT_APP_CARBUDDY_BASE_URL;
  const ImageURL = process.env.REACT_APP_CARBUDDY_IMAGE_URL;
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const [selectedService, setSelectedService] = useState(null);

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


  return (
    <div className="service-area-2 space overflow-hidden">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="title-area text-center">
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

      {services.length === 2 ? (
        <div className="container">
          <div className="counter-area-1 space-bottom">
            <div className="row gx-0 align-items-center justify-content-center gap-3">
              {services
                .filter((service) =>
                  service.title.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((service) => (
                  <div key={service.id} className="col-lg-5">
                    <div
                      className="counter-checklist-wrap d-flex flex-column"
                      style={{ backgroundImage: `url(${service.image})`, minHeight: '400px' }}
                    >
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
                      <div className="checklist style-white">
                        <div className="btn-wrap mt-20">
                          <Link className="btn style4 px-4 py-2" to={`/service/${slugify(service.title)}/${service.id}`}>
                            Book Servicee <i className="fas fa-arrow-right ms-2" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="container">
          <div className="row gy-4 justify-content-center">
            {services
              .filter((service) =>
                service.title.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((service) => (
                <div key={service.id} className="col-lg-4">
                  <Link className=" " to={`/service/${slugify(service.title)}/${service.id}`}>
                    <div
                      className="counter-checklist-wrap d-flex flex-column"
                      style={{ backgroundImage: `url(${service.image})`, minHeight: '250px' }}
                    >
                      <div className="call-media-wrap flex-grow-1">
                        <div className="icon">
                          <img src={service.icon} alt="icon" style={{ maxWidth: '80%' }} />
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
                      <div className="checklist style-white">
                        <div className="btn-wrap mt-20">
                          {/* <Link className="btn style4 px-4 py-2" to={`/service/${slugify(service.title)}/${service.id}`}>
                            Book Service <i className="fas fa-arrow-right ms-2" />
                          </Link> */}
                          {/* <Link
                            className="btn style4 px-4 py-2"
                            onClick={() => {
                              setSelectedService(service);
                              setOpenModal(true);
                            }}
                          >
                            Book Service <i className="fas fa-arrow-right ms-2" />
                          </Link> */}
                          <Link
                            className="btn style4 px-4 py-2"
                            onClick={(e) => {
                              e.stopPropagation();          // prevent card click
                              setSelectedService(service.title);      // <--- IMPORTANT
                              setIsModalOpen(true);
                            }}
                          >
                            Book Service <i className="fas fa-arrow-right ms-2" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
          </div>
        </div>
      )}
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
};

export default ServiceAreaTwo;
