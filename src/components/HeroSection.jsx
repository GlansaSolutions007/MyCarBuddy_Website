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
      title: "Premium Car Care at Your Doorstep",
      description:
        "My Car Buddy delivers reliable doorstep car service you can trust—quick, transparent, and hassle-free. Just book, relax, and let My Car Buddy take care of everything.",
      buttonText: "Get Doorstep Inspection",
      buttonLink: "/service"
    },
    {
      id: 2,
      image: "assets/img/hero/bannerdesign2.png",
      subtitle: "Skilled Technicians • Quality Service",
      title: "Certified & Transparent Car Inspection",
      description:
        "Get a transparent, detail-oriented diagnosis before any repair. We ensure honest reporting, genuine solutions, and complete peace of mind.",
      buttonText: "Get Doorstep Inspection",
      buttonLink: "/service"
    },
    {
      id: 3,
      image: "assets/img/hero/bannerdesign3.png",
      subtitle: "Trusted by Car Owners",
      title: "Complete Car Service Made Simple",
      description:
        "Expert technicians, clear communication, and effortless doorstep service—car care made truly simple with My Car Buddy.",
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
      <h1 className="d-none">My Car Buddy Car Services</h1>

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
                  <i className="fas fa-tools pe-2 "></i>
                  {slide.buttonText}
                </button>

                <button onClick={handleContactClick} className="btn-outline-custom">
                  {/* Get Free Inspection on Call */}
                  <i className="fas fa-headset pe-2 "></i>
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