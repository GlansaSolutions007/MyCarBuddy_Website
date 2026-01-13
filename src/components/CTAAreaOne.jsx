import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";

const CTAAreaOne = () => {
  const [isHovered, setIsHovered] = useState(false);

  const buttonStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 28px",
    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    color: "#fff",
    fontWeight: "600",
    fontSize: "1rem",
    borderRadius: "50px",
    border: "none",
    textDecoration: "none",
    boxShadow: isHovered ? "0 12px 35px rgba(245, 158, 11, 0.45)" : "0 8px 25px rgba(245, 158, 11, 0.35)",
    transform: isHovered ? "translateY(-3px)" : "translateY(0)",
    transition: "all 0.3s ease",
  };

  const arrowStyle = {
    transition: "transform 0.3s ease",
    transform: isHovered ? "translateX(5px)" : "translateX(0)",
  };

  return (
    <div className="cta-area-1">
      <div className="cta1-bg-thumb" style={{ width: "100%" }}>
        <img src="assets/img/bg/cta-bg1-1.png" alt="Fixturbo" />
      </div>
      <div className="container">
        <div className="cta-wrap1">
          <div className="row justify-content-md-between align-items-center">
            <div className="col-lg-6 col-md-8">
              <div className="title-area mb-md-0">
                {/* <span className="sub-title style2 text-white">Case Studies</span> */}
                <span className="sub-title style2 text-white">About Us</span>
                <h2 className="sec-title text-white mb-0">
                  {/* Real Car Repair Stories, Real Results */}
                  Smart, Reliable & Transparent Car Care
                </h2>
              </div>
            </div>
            <div className="col-md-auto">
              <div className="title-area mb-0">
                <Link
                  // to="/case-studies"
                  to="/about"
                  style={buttonStyle}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  {/* View All Case Studies <FaArrowRight style={arrowStyle} /> */}
                  View About Us <FaArrowRight style={arrowStyle} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTAAreaOne;
