import React from "react";
import "./ProcessAreaOne.css";

const steps = [
  {
    icon: "/assets/img/icon/process-icon-1-1.svg",
    title: "Book Your Service & Inspection",
    description:
      "Choose your required service and schedule an inspection. Our team confirms the issue and provides a clear estimate.",
  },
  {
    icon: "/assets/img/icon/process-icon-1-2.svg",
    title: "Doorstep Service at Your Location",
    description:
      "Our certified technician arrives at your home or office, diagnoses the problem, and completes the repair or service on-site, according to our Garage Information and Pickup & Drop options.",
    featured: true,
  },
  {
    icon: "/assets/img/icon/process-icon-1-3.svg",
    title: "Get a Perfectly Serviced, Spotless Car",
    description:
      "Sit back and relax while we fix your car. You receive a fully serviced, clean, and ready-to-drive vehicle.",
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
            Simple Steps to a Spotless Car at <span className="process-one-title-highlight">Your Doorstep</span>
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
