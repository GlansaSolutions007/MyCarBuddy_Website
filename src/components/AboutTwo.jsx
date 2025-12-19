import React from "react";
import TrackVisibility from "react-on-screen";
import CountUp from "react-countup";
import "./AboutTwo.css";

const highlights = [
  // "Doorstep Service",
  // "Expert Mechanics",
  // "Quality Products",
  // "Live Tracking",
  // "Upfront Pricing",
  "Doorstep Car Services",
  "Certified & Background-Verified Technicians",
  "Transparent Pricing with No Hidden Charges",
  "Expert Vehicle Inspection",
  "Fast Booking via App or Website",
  "Trusted by 1000+ Happy Customers",
  "Dedicated Customer Support & Service Assistance",
];

const features = [
  {
    icon: "assets/img/icon/about_icon2-3.svg",
    title: "Doorstep Convenience",
    description:
      "Car care designed around your schedule, location, and comfort — no waiting, no service center visits.",
  },
  {
    icon: "assets/img/icon/about_icon2-4.svg",
    title: "Trusted & Verified Professionals",
    description:
      "Every professional is background-verified, trained, and monitored to ensure safety, quality, and reliability at every step.",
  },
];

const AboutTwo = () => {
  return (
    <section className="about-two-section">
      <div className="container">
        <div className="row align-items-center">
          {/* Image Gallery */}
          <div className="col-lg-6">
            <div className="about-two-gallery">
              {/* Main Image */}
              <div className="about-two-image-main">
                <img
                  src="assets/img/normal/about_2-1.webp"
                  alt="Professional Car Wash"
                />
              </div>

              {/* Secondary Image */}
              <div className="about-two-image-secondary">
                <img
                  src="assets/img/normal/about_2-2.webp"
                  alt="Car Detailing"
                />
              </div>

              {/* Floating Badge */}
              <div className="about-two-badge">
                <img
                  src="assets/img/icon/about_icon2-1.svg"
                  alt="Experience"
                  className="about-two-badge-icon"
                />
                <TrackVisibility once>
                  {({ isVisible }) =>
                    isVisible && (
                      <div className="about-two-badge-number">
                        <CountUp delay={0} start={0} end={1000} duration={2.5} />+
                      </div>
                    )
                  }
                </TrackVisibility>
                <div className="about-two-badge-text">Happy Customers</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="col-lg-6">
            <div className="about-two-content">
              <span className="about-two-subtitle">About My Car Buddy</span>
              <h2 className="about-two-title">
                Your Trusted <span>Doorstep Partner</span> for Hassle-Free Car Care
              </h2>

              <div className="about-two-description">
                <p>
                  My Car Buddy is a technology-driven car care platform built to simplify vehicle
                  ownership. We remove the inconvenience of traditional service centers by
                  connecting you with trusted automotive professionals at your preferred location.
                </p>
                <p>
                  Our mission is to deliver a seamless, stress-free experience through transparency,
                  reliability, and quality assurance. With a strong focus on customer satisfaction,
                  My Car Buddy is redefining modern car care with dependable, customer-first support.
                </p>
              </div>

              {/* Highlight Tags */}
              <div className="about-two-highlights">
                {highlights.map((highlight, index) => (
                  <span key={index} className="about-two-highlight">
                    <i className="fas fa-check-circle" />
                    {highlight}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="about-two-features">
          <div className="row g-4">
            {features.map((feature, index) => (
              <div key={index} className="col-md-6">
                <div className="about-two-feature-card">
                  {/* Number Badge */}
                  <span className="about-two-feature-number">
                    0{index + 1}
                  </span>

                  {/* Icon */}
                  <div className="about-two-feature-icon">
                    <img src={feature.icon} alt={feature.title} />
                  </div>

                  {/* Content */}
                  <div className="about-two-feature-content">
                    <h4 className="about-two-feature-title">{feature.title}</h4>
                    <p className="about-two-feature-text">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutTwo;
