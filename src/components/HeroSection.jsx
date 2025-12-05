import React, { useState, useEffect } from "react";
import "./HeroSection.css"; // Imports the new CSS
import InspectionPopup from "./InspectionPopup";

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showInspectionPopup, setShowInspectionPopup] = useState(false);

  // --- SLIDE DATA CONFIGURATION ---
  // Add as many slides as you want here.
  const slides = [
    {
      id: 1,
      image: "assets/img/hero/bannerdesign1.png",
      subtitle: "Doorstep Car Service & Repair",
      title: "Premium Car Care at Home — No Garage Visits Needed",
      description:
        "Expert mechanics arrive at your location for repairs, inspections, AC service, and maintenance. Transparent pricing and trusted service every time.",
      buttonText: "Get Doorstep Inspection",
      buttonLink: "/service"
    },
    {
      id: 2,
      image: "assets/img/hero/bannerdesign2.png",
      subtitle: "Trusted by Car Owners",
      title: "Accurate Inspection Before Any Repair",
      description:
        "We diagnose issues with precision to avoid unnecessary repairs. Get genuine solutions, clear estimates, and reliable support from certified experts.",
      buttonText: "Get Doorstep Inspection",
      buttonLink: "/service"
    },
    {
      id: 3,
      image: "assets/img/hero/bannerdesign3.png",
      subtitle: "Skilled Technicians • Quality Parts",
      title: "Professional Car Repair You Can Count On",
      description:
        "From AC servicing and brake repair to denting-painting and detailing — we deliver dealership-level service with doorstep convenience.",
      buttonText: "Get Doorstep Inspection",
      buttonLink: "/service"
    },
  ];

  // --- AUTO SLIDE LOGIC ---
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000); // 6 seconds per slide

    return () => clearInterval(interval);
  }, [slides.length]);

  // --- CONTACT HANDLER ---
  const handleContactClick = () => {
    const phone = "7075243939";
    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(
      navigator.userAgent
    );

    if (isMobile) {
      window.location.href = `tel:${phone}`;
    } else {
      window.open(`https://wa.me/91${phone}`, "_blank");
    }
  };

  return (
    <section className="hero-section">
      {/* SEO Tags Hidden */}
      <h1 className="d-none">MyCarBuddy Car Services</h1>

      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`hero-slide ${index === currentSlide ? "active" : ""}`}
        >
          {/* Background Image with Zoom Effect */}
          <div
            className="slide-bg"
            style={{ backgroundImage: `url(${slide.image})` }}
          />

          {/* Dark Overlay for Readability */}
          <div className="hero-overlay"></div>

          {/* Content */}
          <div className="hero-content">
            <div className="text-content">

              <div className="hero-subtitle">
                {/* Optional Icon */}
                <i className="fa fa-wrench" style={{ fontSize: '14px' }}></i>
                {slide.subtitle}
              </div>

              <h2 className="hero-title">{slide.title}</h2>

              <p className="hero-desc">{slide.description}</p>

              <div className="hero-btns">
                <button
                  onClick={() => setShowInspectionPopup(true)}
                  className="btn-primary-custom"
                >
                  {slide.buttonText}
                </button>

                <button onClick={handleContactClick} className="btn-outline-custom">
                  {/* Get Free Inspection on Call */}
                  Call for Free Consultation
                </button>
              </div>

            </div>
          </div>
        </div>
      ))}

      {/* Navigation Dots */}
      <div className="slider-dots">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`dot ${index === currentSlide ? "active" : ""}`}
            onClick={() => setCurrentSlide(index)}
          ></div>
        ))}
      </div>

      {/* Inspection Popup */}
      <InspectionPopup
        isOpen={showInspectionPopup}
        onClose={() => setShowInspectionPopup(false)}
      />
    </section>
  );
};

export default HeroSection;