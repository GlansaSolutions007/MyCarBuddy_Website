import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Chatbot from "./Chatbot";
import axios from "axios";

const FooterAreaOne = () => {
  const [categories, setCategories] = useState([]);
  const API_URL = process.env.REACT_APP_CARBUDDY_BASE_URL;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}Category`);
        if (Array.isArray(response.data)) {
          const activeCategories = response.data.filter((cat) => cat.IsActive);
          const filteredCategories = activeCategories.filter((cat) =>
            ["AC Service and Repair", "Car Spa & Cleaning", "Denting & Painting", "Car Inspections", "Detailing Services"].includes(cat.CategoryName)
          );
          setCategories(filteredCategories);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };

    fetchCategories();
  }, [API_URL]);

  const slugify = (text) => {
    return text
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  return (
    <footer
      className="footer-wrapper footer-layout1 "
      // style={{ backgroundImage: "url(assets/img/bg/footer-bg1-1.png)" }}
      style={{ backgroundColor: "url(assets/img/bg/footer-top-bg1-1.png)" }}
    >

      {/* <Chatbot/> */}
      <div className="widget-area p-0">
        {/* <div className="col-md-12 text-center">
             <img src="/assets/img/logoWhite.png" alt="MyCarBuddy"  width={"300px"}/>
        </div> */}
        <div className="row justify-content-between col-md-12 pt-4">
          <div className="col-md-3 pt-4">
            <div className="col-md-12 text-center">
             <img src="/assets/img/logoWhite.png" alt="MyCarBuddy"  width={"300px"}/>
             <div className="d-flex justify-content-start my-4 mx-4">
               <Link
                 to="https://www.facebook.com/people/Mycarbuddyin/61578291056729/?sk=about_details"
                 target="_blank"
                 style={{ margin: '0 16px', color: 'white', fontSize: '26px', width: '26px', height: '26px', }}
               >
                 <i className="fab fa-facebook-f" />
               </Link>
               <Link
                 to="https://www.instagram.com/mycarbuddy.in/"
                 target="_blank"
                 style={{ margin: '0 16px', color: 'white', fontSize: '26px', width: '26px', height: '26px', }}
               >
                 <i className="fab fa-instagram" />
               </Link>
               <Link
                 to="https://www.linkedin.com/company/108159284/admin/dashboard/"
                 target="_blank"
                 style={{ margin: '0 16px', color: 'white', fontSize: '26px', width: '26px', height: '26px', }}
               >
                 <i className="fab fa-linkedin" />
               </Link>
               </div>
          </div>
          </div>
          <div className="col-md-2 pt-4">
            <div className="widget widget_nav_menu footer-widget ">
              <h3 className="widget_title">Quick Links</h3>
              <div className="menu-all-pages-container">
                <ul className="menu d-inline-block">
                  <li>
                    <Link to="/about">About</Link>
                  </li>
                  <li>
                    <Link  to="/service">Services</Link>
                  </li>
                  <li>
                    <Link to="/contact">Contact</Link>
                  </li>
                  <li>
                    <Link to="/privacy">Privacy Policy</Link>
                  </li>
                  <li>
                    <Link to="/terms">Terms &amp; Condition</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="col-md-2 pt-4">
            <div className="widget widget_nav_menu footer-widget">
              <h3 className="widget_title" style={{ textAlign: 'left' }}>Our Services</h3>
              <div className="menu-all-pages-container">
                <ul
                  className="menu"
                  style={{
                    padding: "0px 0",
                    margin: 0,
                    display: "grid",
                    gridTemplateColumns: "repeat(1, 1fr)",
                    gap: "0px 2px",
                  }}
                >
                  {categories.map((category) => (
                    <li key={category.CategoryID} style={{ padding: "2px 0" }}>
                      <Link to={`/service/${slugify(category.CategoryName)}/${category.CategoryID}`}>
                        {category.CategoryName}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* <div className="col-md-2 ">
            <div className="widget footer-widget widget-newsletter">
              <h3 className="widget_title">About</h3>

              <p className="footer-text ">
              At My Car Buddy, we make car care effortless by bringing professional services straight to your doorstep. No more waiting at garages or service centers. Our expert mechanics and technicians come to you, whenever and wherever you need them.
              </p>

            </div>
          </div> */}

          <div className="col-md-3 pt-4">
            <div className="widget footer-widget ">
              <h3 className="widget_title">Reach Us</h3>
              <div className="widget-contact">
                <p>
                 Unit #B1, Second Floor Spaces & More Business Park,Madhapur #3 D.No# 1-89/A/8, C/2, Vittal Rao Nagar Rd, Madhapur,  Hyderabad India, 500081
                </p>
                <p>
                <Link to="tel:7075243939">Phone: +91 70752 43939</Link><br /> <Link to="tel:9885653865">Phone: +91 98856 53865</Link>
                </p>
                <p>
                  <Link to="mailto:info@mycarbuddy.in">Email: info@mycarbuddy.in</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="copyright-wrap">
        <div className="container">
        <div className="row gy-3 justify-content-md-between justify-content-center">
          <div className="col-auto align-self-center">
            <p className="copyright-text text-center">
              © <Link to="https://glansa.com/" target="_blank">Glansa Solutions Pvt Ltd</Link> 2025 | All Rights Reserved
            </p>
          </div>
          <div className="col-auto">
            <div className="footer-links">
              <Link to="/refund-cancellation">Cancellation & Refund Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Floating WhatsApp Chat Button */}
      {/* <a
        href="https://wa.me/9885653865"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#25D366',
          color: 'white',
          borderRadius: '50%',
          width: '55px',
          height: '55px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          zIndex: 1000,
          textDecoration: 'none',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        aria-label="Chat on WhatsApp"
      >
        <i className="fab fa-whatsapp" style={{ fontSize: '30px' }}></i>
      </a> */}
    </footer>
  );
};

export default FooterAreaOne;
