import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Footer.css"; // Ensure you import the CSS file

const FooterAreaOne = () => {
  const [categories, setCategories] = useState([]);
  const [companyInfo, setCompanyInfo] = useState({ address: '', phones: [], email: '' });
  const API_URL = process.env.REACT_APP_CARBUDDY_BASE_URL;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}Category`);
        if (Array.isArray(response.data)) {
          const activeCategories = response.data.filter((cat) => cat.IsActive);
          const targetCategories = [
            "AC Service and Repair",
            "Car Spa & Cleaning",
            "Denting & Painting",
            "Car Inspections",
            "Detailing Services",
          ];
          const filteredCategories = activeCategories.filter((cat) =>
            targetCategories.includes(cat.CategoryName)
          );
          setCategories(filteredCategories);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };

    const fetchCompanyInfo = async () => {
      try {
        const response = await axios.get(`${API_URL}CompanyInfo`);
        const data = response.data.data;
        const address = data.find(item => item.Type === 'Address')?.Description || '';
        const phones = data.filter(item => item.Type === 'PhoneNumber').map(item => item.Description);
        const email = data.find(item => item.Type === 'E-mail')?.Description || '';
        setCompanyInfo({ address, phones, email });
      } catch (error) {
        console.error('Failed to fetch company info:', error);
      }
    };

    fetchCategories();
    fetchCompanyInfo();
  }, [API_URL]);

  const slugify = (text) => {
    return text
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Reusable Contact Handler
  const handleContactClick = (phone) => {
    const number = phone.replace(/\D/g, "");
    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(
      navigator.userAgent
    );

    if (isMobile) {
      window.location.href = `tel:${number}`;
    } else {
      window.open(`https://wa.me/${number}`, "_blank");
    }
  };

  // Format phone number to XXX-XXX-XXXX pattern
  const formatPhoneNumber = (phone) => {
    let digits = phone.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) {
      digits = digits.slice(2);
    }
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  return (
    <footer
      className="footer-wrapper"
      style={{ backgroundImage: "url(/assets/img/bg/footer-top-bg1-1.png)" }}
    >
      <div className="footer-overlay"></div>

      <div className="container pt-5 pb-4 footer-content">
        <div className="row justify-content-between footer-row-mobile">
          
          {/* Column 1: Logo & Social */}
          <div className="col-lg-3 col-md-6 mb-4 footer-col-logo">
            <div className="footer-widget text-center text-md-start">
              <Link to="/">
                <img
                  src="/assets/img/logoWhite.png"
                  alt="MyCarBuddy"
                  style={{ maxWidth: "250px", height: "auto" }}
                />
              </Link>
              <p className="mt-3 text-light opacity-75">
                {/* Your trusted partner for car care. Expert mechanics, doorstep service, and premium quality. */}
              </p>
              <div className="social-icon-box">
                <Link
                  to="https://www.facebook.com/people/Mycarbuddyin/61578291056729/?sk=about_details"
                  target="_blank"
                  className="social-link"
                  aria-label="Facebook"
                >
                  <i className="fab fa-facebook-f" />
                </Link>
                <Link
                  to="https://www.instagram.com/mycarbuddy.in/"
                  target="_blank"
                  className="social-link"
                  aria-label="Instagram"
                >
                  <i className="fab fa-instagram" />
                </Link>
                <Link
                  to="https://www.linkedin.com/company/108159284/admin/dashboard/"
                  target="_blank"
                  className="social-link"
                  aria-label="LinkedIn"
                >
                  <i className="fab fa-linkedin-in" />
                </Link>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="col-lg-2 col-md-6 mb-4 footer-col-links">
            <div className="footer-widget widget_nav_menu">
              <h3 className="widget_title">Quick Links</h3>
              <div className="menu-all-pages-container">
                <ul>
                  <li><Link to="/about">About Us</Link></li>
                  <li><Link to="/service">All Services</Link></li>
                  <li><Link to="/contact">Contact Support</Link></li>
                  <li><Link to="/privacy">Privacy Policy</Link></li>
                  <li><Link to="/terms">Terms & Conditions</Link></li>
                  {/* <li><Link to="/case-studies">Case Studies</Link></li> */}
                  {/* <li><Link to="/quick-bookings">Confirm Book Service</Link></li> */}
                </ul>
              </div>
            </div>
          </div>

          {/* Column 3: Services (Dynamic) */}
          <div className="col-lg-3 col-md-6 mb-4 footer-col-links">
            <div className="footer-widget widget_nav_menu">
              <h3 className="widget_title">Popular Services</h3>
              <div className="menu-all-pages-container">
                <ul>
                  {categories.map((category) => (
                    <li key={category.CategoryID}>
                      <Link
                        to={`/service/${slugify(category.CategoryName)}/${category.CategoryID}`}
                      >
                        {category.CategoryName}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Column 4: Contact Info */}
          <div className="col-lg-4 col-md-6 mb-4 footer-col-contact">
            <div className="footer-widget">
              <h3 className="widget_title">Reach Us</h3>
              <div className="widget-contact">
                <div className="contact-item">
                  <i className="fas fa-map-marker-alt contact-icon"></i>
                  <p className="mb-0" style={{color: "var(--text-light)"}}>
                    {companyInfo.address || 'Loading...'}
                  </p>
                </div>
                
                <div className="contact-item">
                  <i className="fas fa-phone-alt contact-icon"></i>
                  <div>
                    {companyInfo.phones.length > 0 ? (
                      companyInfo.phones.map((phone, index) => (
                        <div 
                          key={index}
                          onClick={() => handleContactClick(phone)} 
                          className="d-block contact-link" 
                          style={{cursor: 'pointer'}}
                        >
                          +91 {formatPhoneNumber(phone)}
                        </div>
                      ))
                    ) : (
                      'Loading...'
                    )}
                  </div>
                </div>

                <div className="contact-item">
                  <i className="fas fa-envelope contact-icon"></i>
                  <a href={`mailto:${companyInfo.email}`} className="contact-link">
                    {companyInfo.email || 'Loading...'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Strip */}
      <div className="copyright-wrap py-3">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-start">
              <p className="mb-0 copyright-text" style={{color: "var(--text-light)"}}>
                © {new Date().getFullYear()} <Link to="https://glansa.com/" target="_blank">Glansa Solutions Pvt Ltd</Link> | All Rights Reserved
              </p>
            </div>
            <div className="col-md-6 text-center text-md-end mt-2 mt-md-0">
              <div className="footer-links">
                <Link to="/refund-cancellation" className="text-decoration-none small" style={{color: "var(--text-light)"}}>
                  Cancellation & Refund Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterAreaOne;