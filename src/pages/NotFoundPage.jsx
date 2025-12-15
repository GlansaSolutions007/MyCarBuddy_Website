import React from 'react';
import { Link } from 'react-router-dom';
import HeaderOne from "../components/HeaderOne";
import FooterAreaOne from "../components/FooterAreaOne";
import { FaHome, FaSearch, FaArrowRight, FaExclamationTriangle } from 'react-icons/fa';
import "./NotFoundPage.css";

const NotFoundPage = () => {
  return (
    <>
      <HeaderOne />
      <section className="not-found-section">
        <div className="container">
          <div className="not-found-content">
            {/* 404 Number */}
            <div className="not-found-number">
              <span className="not-found-404">404</span>
            </div>

            {/* Icon */}
            <div className="not-found-icon-wrapper">
              <FaExclamationTriangle className="not-found-icon" />
            </div>

            {/* Title */}
            <h1 className="not-found-title">Page Not Found</h1>

            {/* Description */}
            <p className="not-found-description">
              Oops! The page you're looking for doesn't exist or has been moved. 
              Let's get you back on track.
            </p>

            {/* Action Buttons */}
            <div className="not-found-actions">
              <Link to="/" className="not-found-btn not-found-btn-primary">
                <FaHome />
                <span>Go Home</span>
                <FaArrowRight />
              </Link>
              <Link to="/service" className="not-found-btn not-found-btn-secondary">
                <FaSearch />
                <span>Browse Services</span>
                <FaArrowRight />
              </Link>
            </div>

            {/* Decorative Elements */}
            <div className="not-found-decoration not-found-decoration-1"></div>
            <div className="not-found-decoration not-found-decoration-2"></div>
            <div className="not-found-decoration not-found-decoration-3"></div>
          </div>
        </div>
      </section>
      <FooterAreaOne />
    </>
  );
};

export default NotFoundPage;
