import React from "react";
import TrackVisibility from "react-on-screen";
import CountUp from "react-countup";
import { Link } from "react-router-dom";
import "./AboutFour.css";

const checklistItems = [
  "Interior & Exterior Car Wash",
  "Waterless Eco-Friendly Wash",
  "AC & Engine Deep Cleaning",
  "Quick and Efficient Service",
];

const AboutFour = () => {
  return (
    <div className="about-section">
      <div className="container">
        <div className="row align-items-center">
          {/* Image Gallery */}
          <div className="col-lg-6 animate-left">
            <div className="about-gallery">
              {/* Main Image */}
              <div className="about-image-main">
                <img
                  src="assets/img/normal/about_2-1.webp"
                  alt="Professional Car Service"
                />
              </div>

              {/* Secondary Image */}
              <div className="about-image-secondary">
                <img
                  src="assets/img/normal/about_2-2.webp"
                  alt="Car Detailing"
                />
              </div>

              {/* Experience Badge */}
              <div className="experience-badge">
                <img
                  src="assets/img/icon/about_icon2-1.svg"
                  alt="Experience"
                  className="badge-icon"
                />
                <TrackVisibility once>
                  {({ isVisible }) =>
                    isVisible && (
                      <div className="badge-number">
                        <CountUp delay={0} start={0} end={25} duration={2.5} />
                        <span>+</span>
                        <span className="years-text">Years</span>
                      </div>
                    )
                  }
                </TrackVisibility>
                <div className="badge-label">Domain Industry Expertise</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="col-lg-6 animate-right">
            <div className="about-content">
              <span className="about-subtitle">Know About Us</span>
              <h2 className="about-title">
                Professional Car Service You Can Trust
              </h2>
              <p className="about-description">
                At My Car Buddy, we make car care effortless by bringing
                professional services straight to your doorstep. No more waiting
                at garages or service centers. Our expert mechanics and
                technicians come to you, whenever and wherever you need them.
                <br />
                <br />
                Whether it's a routine service, car wash, detailing, oil change,
                battery replacement, or emergency breakdown support, we've got
                you covered.
              </p>

              {/* Checklist */}
              <div className="about-checklist">
                {checklistItems.map((item, index) => (
                  <div key={index} className="checklist-item">
                    <span className="check-icon">
                      <i className="fas fa-check" />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Link to="/about" className="about-btn">
                Read More
                <i className="fas fa-arrow-right" />
              </Link>

              {/* Stats Bar */}
              {/* <div className="stats-bar">
                <TrackVisibility once>
                  {({ isVisible }) =>
                    isVisible && (
                      <>
                        <div className="stat-item">
                          <div className="stat-icon">
                            <i className="fas fa-users" />
                          </div>
                          <div className="stat-content">
                            <span className="stat-number">
                              <CountUp delay={0} start={0} end={10} duration={2} />K+
                            </span>
                            <span className="stat-label">Customers</span>
                          </div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-icon">
                            <i className="fas fa-tools" />
                          </div>
                          <div className="stat-content">
                            <span className="stat-number">
                              <CountUp delay={0} start={0} end={50} duration={2} />+
                            </span>
                            <span className="stat-label">Mechanics</span>
                          </div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-icon">
                            <i className="fas fa-star" />
                          </div>
                          <div className="stat-content">
                            <span className="stat-number">
                              <CountUp delay={0} start={0} end={100} duration={2} />%
                            </span>
                            <span className="stat-label">Satisfaction</span>
                          </div>
                        </div>
                      </>
                    )
                  }
                </TrackVisibility>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutFour;
