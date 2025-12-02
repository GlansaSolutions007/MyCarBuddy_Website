import React from "react";
import { Link } from "react-router-dom";
import { FaHome, FaChevronRight } from "react-icons/fa";
import "./Breadcrumb.css";

const Breadcrumb = ({ title }) => {
  return (
    <div className="bc-wrapper">
      <div className="bc-bg-overlay"></div>
      <div className="container">
        <div className="bc-content">
          <h1 className="bc-title">{title}</h1>
          <nav className="bc-nav">
            <Link to="/" className="bc-link">
              <FaHome className="bc-home-icon" />
              <span>Home</span>
            </Link>
            <FaChevronRight className="bc-separator" />
            <span className="bc-current">{title}</span>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Breadcrumb;
