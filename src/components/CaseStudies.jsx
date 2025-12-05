import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  FaCarSide, 
  FaCheckCircle, 
  FaArrowRight, 
  FaClock, 
  FaMapMarkerAlt,
  FaStar,
  FaTools,
  FaShieldAlt,
  FaHandshake,
  FaRupeeSign,
  FaThumbsUp,
  FaUserCheck
} from "react-icons/fa";
import "./CaseStudies.css";

const caseStudiesData = [
  {
    id: 1,
    title: "Engine Noise Fixed",
    category: "Engine",
    carModel: "Honda City",
    year: "2019",
    location: "Madhapur",
    duration: "2 Days",
    savings: "12,000",
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=800&auto=format&fit=crop",
    beforeIssue: "Loud engine knocking",
    afterResult: "Smooth & silent engine",
    rating: 5,
    customerName: "Rajesh K."
  },
  {
    id: 2,
    title: "AC Cooling Restored",
    category: "AC Service",
    carModel: "Maruti Swift",
    year: "2021",
    location: "Gachibowli",
    duration: "4 Hours",
    savings: "5,500",
    image: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?q=80&w=800&auto=format&fit=crop",
    beforeIssue: "AC not cooling",
    afterResult: "Ice-cold AC in 5 mins",
    rating: 5,
    customerName: "Priya S."
  },
  {
    id: 3,
    title: "Dent & Paint Repair",
    category: "Denting",
    carModel: "Hyundai Creta",
    year: "2022",
    location: "Kondapur",
    duration: "5 Days",
    savings: "25,000",
    image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800&auto=format&fit=crop",
    beforeIssue: "Multiple dents & scratches",
    afterResult: "Showroom-like finish",
    rating: 5,
    customerName: "Amit P."
  },
  {
    id: 4,
    title: "Full Car Detailing",
    category: "Detailing",
    carModel: "Toyota Fortuner",
    year: "2020",
    location: "Jubilee Hills",
    duration: "1 Day",
    savings: "8,000",
    image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=800&auto=format&fit=crop",
    beforeIssue: "Faded & dirty interior",
    afterResult: "Brand new look",
    rating: 5,
    customerName: "Sneha R."
  },
  {
    id: 5,
    title: "Brake Service",
    category: "Brakes",
    carModel: "Tata Nexon",
    year: "2023",
    location: "HITEC City",
    duration: "3 Hours",
    savings: "4,000",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=800&auto=format&fit=crop",
    beforeIssue: "Squeaking brakes",
    afterResult: "Safe & silent brakes",
    rating: 5,
    customerName: "Vikram S."
  },
  {
    id: 6,
    title: "Suspension Repair",
    category: "Suspension",
    carModel: "Mahindra XUV500",
    year: "2018",
    location: "Banjara Hills",
    duration: "1 Day",
    savings: "15,000",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop",
    beforeIssue: "Rough bumpy ride",
    afterResult: "Smooth comfortable ride",
    rating: 5,
    customerName: "Deepak M."
  }
];

const categories = ["All", "Engine", "AC Service", "Denting", "Detailing", "Brakes", "Suspension"];

const CaseStudies = () => {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredStudies = activeCategory === "All" 
    ? caseStudiesData 
    : caseStudiesData.filter(study => study.category === activeCategory);

  return (
    <div className="cs-page">
      {/* Hero Section */}
      <section className="cs-hero">
        <div className="cs-hero-bg"></div>
        <div className="container">
          <div className="cs-hero-content">
            <span className="cs-badge">
              <FaThumbsUp /> Success Stories
            </span>
            <h1 className="cs-hero-title">
              See Our <span>Transformations</span>
            </h1>
            <p className="cs-hero-desc">
              Real cars, real results – discover how we've helped car owners like you
            </p>
          </div>
        </div>
        <div className="cs-hero-wave"></div>
      </section>

      {/* Quick Stats */}
      <section className="cs-quick-stats">
        <div className="container">
          <div className="cs-stats-bar">
            <div className="cs-stat-pill">
              <FaCarSide />
              <span><strong>10,000+</strong> Cars Fixed</span>
            </div>
            <div className="cs-stat-pill">
              <FaStar />
              <span><strong>4.9</strong> Rating</span>
            </div>
            <div className="cs-stat-pill">
              <FaUserCheck />
              <span><strong>98%</strong> Happy Customers</span>
            </div>
            <div className="cs-stat-pill">
              <FaShieldAlt />
              <span><strong>Quality</strong> Warranty</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter */}
      <section className="cs-filter">
        <div className="container">
          <div className="cs-filter-bar">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`cs-filter-pill ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Cards Grid */}
      <section className="cs-cards">
        <div className="container">
          <div className="cs-cards-grid">
            {filteredStudies.map((study, index) => (
              <div 
                key={study.id} 
                className="cs-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Card Image */}
                <div className="cs-card-image">
                  <img src={study.image} alt={study.title} />
                  <div className="cs-card-badge">{study.category}</div>
                  <div className="cs-card-saved">
                    <FaRupeeSign />
                    {study.savings} Saved
                  </div>
                </div>

                {/* Card Body */}
                <div className="cs-card-body">
                  {/* Title & Rating */}
                  <div className="cs-card-header">
                    <h3>{study.title}</h3>
                    <div className="cs-rating">
                      <FaStar />
                      {study.rating}
                    </div>
                  </div>

                  {/* Car Info */}
                  <div className="cs-car-info">
                    <FaCarSide />
                    <span>{study.carModel} • {study.year}</span>
                  </div>

                  {/* Before → After */}
                  <div className="cs-transform">
                    <div className="cs-before">
                      <span className="cs-label">Before</span>
                      <p>{study.beforeIssue}</p>
                    </div>
                    <div className="cs-arrow">
                      <FaArrowRight />
                    </div>
                    <div className="cs-after">
                      <span className="cs-label">After</span>
                      <p>{study.afterResult}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="cs-card-footer">
                    <div className="cs-meta">
                      <span><FaMapMarkerAlt /> {study.location}</span>
                      <span><FaClock /> {study.duration}</span>
                    </div>
                    <div className="cs-customer">
                      <FaCheckCircle />
                      {study.customerName}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredStudies.length === 0 && (
            <div className="cs-no-results">
              <FaTools />
              <h3>No results found</h3>
              <p>Try a different category</p>
              <button onClick={() => setActiveCategory("All")}>View All</button>
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="cs-benefits">
        <div className="container">
          <h2 className="cs-section-title">Why Choose My Car Buddy?</h2>
          <div className="cs-benefits-grid">
            <div className="cs-benefit">
              <div className="cs-benefit-icon">
                <FaShieldAlt />
              </div>
              <h4>Genuine Parts</h4>
              <p>100% OEM quality parts</p>
            </div>
            <div className="cs-benefit">
              <div className="cs-benefit-icon">
                <FaTools />
              </div>
              <h4>Expert Mechanics</h4>
              <p>Certified professionals</p>
            </div>
            <div className="cs-benefit">
              <div className="cs-benefit-icon">
                <FaRupeeSign />
              </div>
              <h4>Fair Pricing</h4>
              <p>No hidden charges</p>
            </div>
            <div className="cs-benefit">
              <div className="cs-benefit-icon">
                <FaHandshake />
              </div>
              <h4>Your Doorstep Service</h4>
              <p>We come to you</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cs-cta">
        <div className="container">
          <div className="cs-cta-card">
            <div className="cs-cta-text">
              <h2>Ready to Transform Your Car?</h2>
              <p>Book a service today and experience the difference</p>
            </div>
            <div className="cs-cta-btns">
              <Link to="/service" className="cs-btn-primary">
                Book Service <FaArrowRight className="cs-btn-arrow" />
              </Link>
              <Link to="/contact" className="cs-btn-secondary">
                Contact Us <FaArrowRight className="cs-btn-arrow" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CaseStudies;
