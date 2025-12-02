import React from "react";
import "./ProcessAreaOne.css";

const steps = [
  {
    icon: "/assets/img/icon/process-icon-1-1.svg",
    title: "Book Your Service",
    description:
      "Schedule your interior or exterior wash online or via phone. Choose a time and location that's most convenient for you — home, office, or anywhere.",
  },
  {
    icon: "/assets/img/icon/process-icon-1-2.svg",
    title: "We Come to You",
    description:
      "Our fully equipped mobile team arrives with eco-friendly products and professional tools to give your car a gentle yet thorough wash.",
    featured: true,
  },
  {
    icon: "/assets/img/icon/process-icon-1-3.svg",
    title: "Enjoy the Shine",
    description:
      "Sit back and relax while we make your car sparkle inside and out. We leave you with a fresh, spotless, and protected vehicle ready to impress.",
  },
];

const ProcessAreaOne = () => {
  return (
    <section className="process-one-section">
      {/* Decorative Shapes */}
      <div className="process-one-shapes">
        <img
          className="process-one-shape process-one-shape-1"
          src="/assets/img/normal/about_shape1-2.svg"
          alt=""
        />
        <img
          className="process-one-shape process-one-shape-2"
          src="/assets/img/normal/about_shape1-1.svg"
          alt=""
        />
      </div>

      <div className="container">
        {/* Section Header */}
        <div className="process-one-header">
          <span className="process-one-subtitle">Our Work Process</span>
          <h2 className="process-one-title">
            Simple Steps to a Spotless Car at Your Doorstep
          </h2>
        </div>

        {/* Process Steps */}
        <div className="process-one-grid">
          {/* Connector Lines (Desktop Only) */}
          <div className="process-one-connector d-none d-lg-block" />
          <div className="process-one-connector d-none d-lg-block" />

          {steps.map((step, index) => (
            <div
              key={index}
              className={`process-one-card ${step.featured ? 'featured' : ''}`}
            >
              {/* Step Number */}
              <span className="process-one-number">0{index + 1}</span>

              {/* Icon */}
              <div className="process-one-icon">
                <img src={step.icon} alt={step.title} />
              </div>

              {/* Content */}
              <div className="process-one-card-content">
                <h4 className="process-one-card-title">{step.title}</h4>
                <p className="process-one-card-text">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessAreaOne;
