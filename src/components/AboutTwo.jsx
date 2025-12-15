import React from "react";
import TrackVisibility from "react-on-screen";
import CountUp from "react-countup";
import "./AboutTwo.css";

const highlights = [
  "Doorstep Service",
  "Expert Mechanics",
  "Quality Products",
  "Live Tracking",
  "Upfront Pricing",
];

const features = [
  {
    icon: "assets/img/icon/about_icon2-3.svg",
    title: "Premium Interior Wash",
    description:
      "Deep vacuuming, dashboard polishing, door panel cleaning, and streak-free window cleaning for a fresh and comfortable ride.",
  },
  {
    icon: "assets/img/icon/about_icon2-4.svg",
    title: "Shiny Exterior Finish",
    description:
      "Gentle hand wash, high-pressure rinse, tyre cleaning, and wax protection to keep your car looking brand new — right in your driveway.",
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
              <span className="about-two-subtitle">Know About Us</span>
              <h2 className="about-two-title">
                At-Home <span>Interior & Exterior</span> Car Wash Experts
              </h2>

              <div className="about-two-description">
                <p>
                  At My Car Buddy, we make car care effortless by bringing
                  professional services straight to your doorstep. No more
                  waiting at garages or service centers. Our expert mechanics
                  and technicians come to you, whenever and wherever you need
                  them.
                </p>
                <p>
                  Whether it's a routine service, car wash, detailing, oil
                  change, battery replacement, or emergency breakdown support,
                  we've got you covered. With just a few taps on our app or
                  website, you can book a service at your convenience.
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
