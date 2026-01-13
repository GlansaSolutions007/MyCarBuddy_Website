import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import BookServiceModal from "./BookServiceModal";
import Fuse from "fuse.js";
import "./ServiceAreaTwo.css";

const ServiceAreaTwo = () => {
  const BASE_URL = process.env.REACT_APP_CARBUDDY_BASE_URL;
  const ImageURL = process.env.REACT_APP_CARBUDDY_IMAGE_URL;
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

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
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(services, {
      keys: [
        { name: "title", weight: 0.7 },
        { name: "description", weight: 0.3 }
      ],
      threshold: 0.4,
      includeScore: true,
    });
  }, [services]);

  const filteredServices = useMemo(() => {
    if (!searchTerm) return services;
    const results = fuse.search(searchTerm);
    return results.map((result) => result.item);
  }, [searchTerm, services, fuse]);

  return (
    <div className="service-area-2 space overflow-hidden">
      <div className="container">
        {/* Section Header */}
        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-6">
            <div className="title-area text-center mb-4">
              <span className="sub-title">Our Services</span>
              <h2 className="sec-title">
                Trusted Car Repair Professionals
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

        {/* Services Grid */}
        {filteredServices.length > 0 ? (
          <div className="row gy-4 justify-content-center">
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
                  {/* Background Image */}
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

                    {/* Title */}
                    <h4 className="service-card-title">{service.title}</h4>

                    {/* Description */}
                    <p className="service-card-desc">{service.description}</p>

                    {/* Book Button */}
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
            <h4>Whoops! No service found.</h4>
            <p>We couldn't find what you searched for. Try a different keyword.</p>
            <button
              className="btn"
              onClick={() => setSearchTerm('')}
            >
              Clear Search
            </button>
          </div>
        )}
      </div>

      {/* Book Service Modal */}
      <BookServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedService={selectedService}
        serviceTypeDetail="Category"
        serviceIdCollect= {selectedService ? selectedService.id : 0}
      />
    </div>
  );
};

export default ServiceAreaTwo;
