import React from "react";
import "./ProcessAreaTwo.css";

const features = [
  {
    icon: "assets/img/icon/icon3.1-04.png",
    title: "Convenience at Your Fingertips",
    description:
      "Book a service in seconds and let us handle the rest. We come to you, wherever you are, so you never have to disrupt your day for car care.",
  },
  {
    icon: "assets/img/icon/icon3.1-02.png",
    title: "Expertise You Can Rely On",
    description:
      "Gentle hand wash, high-pressure rinse, tyre cleaning, and wax protection to keep your car looking brand new — right in your driveway.",
  },
  {
    icon: "assets/img/icon/icon3.1-01.png",
    title: "Transparent & Honest Service",
    description:
      "No hidden fees, no surprises. We provide clear estimates, upfront pricing, and honest recommendations—so you always know what to expect.",
  },
  {
    icon: "assets/img/icon/icon3.1-03.png",
    title: "Comprehensive Solutions",
    description:
      "From emergency repairs to routine maintenance, we cover it all. Whether it's a flat tire, battery issue, or a full service, Car Buddy is your one-stop solution.",
  },
];

const ProcessAreaTwo = () => {
  return (
    <div className="process-area-2 space-top pb-50" style={{marginTop: "-60px"}} >
      <div className="container">
        {/* Section Header */}
        <div className="row justify-content-center mb-5">
          <div className="col-12">
            <div className="title-area text-center mb-0">
              <span
                className="sub-title"
                style={{
                  display: "inline-block",
                  padding: "8px 24px",
                  background: "linear-gradient(135deg, #1aa1a4 0%, #0a6264 50%, #0e4e50 100%)",
                  color: "#fff",
                  borderRadius: "50px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  marginBottom: "16px",
                  boxShadow: "0 4px 15px rgba(10, 98, 100, 0.3)",
                }}
              >
                Why Choose Us?
              </span>
              <h2
                className="sec-title"
                style={{
                  fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                  fontWeight: "700",
                  color: "#1a1a2e",
                  lineHeight: "1.3",
                  // whiteSpace: "nowrap",
                }}
              >
                Reliable Car Care, Right Where <span className="gradient-text">You Need It</span>
              </h2>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="row g-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`col-12 col-md-6 animate-feature animate-delay-${index + 1}`}
            >
              <div className="feature-card">
                {/* Number Badge */}
                <span className="feature-card-number">0{index + 1}</span>

                {/* Icon */}
                <div className="feature-card-icon">
                  <img src={feature.icon} alt={feature.title} />
                </div>

                {/* Content */}
                <div className="feature-card-content">
                  <h5 className="feature-card-title">{feature.title}</h5>
                  <p className="feature-card-text">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProcessAreaTwo;
