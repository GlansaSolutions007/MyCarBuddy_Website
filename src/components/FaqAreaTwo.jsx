import React, { useState } from "react";
import "./FaqAreaTwo.css";

const faqData = [
  {
    question: "What is usually checked during a car inspection service?",
    answer: "Car inspection from My Car Buddy can include brakes, clutch, tyres, batteries, lights, and overall body condition and physical conditioning."
  },
  {
    question: "What is included in My Car Buddy detailing services?",
    answer: "Detailing services with My Car Buddy usually include polishing, waxing, scratch removal, interior cleaning, and dashboard restoration for a refreshed look."
  },
  {
    question: "How much does denting & painting service cost?",
    answer: "Costs depend on car type, dent type, and paint quality. My Car Buddy provides denting & painting with options for panel-wise or full-body painting."
  },
  {
    question: "Where can I get My Car Buddy services in Hyderabad?",
    answer: "My Car Buddy services are available near your location in Hyderabad."
  },
  {
    question: "Does My Car Buddy handle clutch and body parts replacement?",
    answer: "Yes, My Car Buddy offers clutch replacement (clutch plate, pressure plate, cylinder) and body parts replacement like bumpers, doors, and fenders."
  },
  {
    question: "What battery replacement options are available?",
    answer: "My Car Buddy offers battery replacement, charging checks, and jump-start services for different car battery brands and models."
  },
  {
    question: "What suspension services are available?",
    answer: "My Car Buddy provides suspension checks, shock absorber replacement, and alignment services, which are handled at the garage only."
  },
  {
    question: "Is car wash vacuuming enough for cleaning car interiors?",
    answer: "Car wash vacuuming removes dust from carpets and seats. My Car Buddy also covers AC vent cleaning and dashboard care as part of extended services."
  },
  {
    question: "What does AC service and repairs usually include?",
    answer: "AC service may involve gas refill, filter cleaning, or cooling system checks. My Car Buddy provides these under AC service repairs also provides detailing of the AC functionality."
  },
  {
    question: "Can insurance claims be applied for dents and scratches?",
    answer: "Insurance claim services can cover dents, accidental repairs, windshield damages, and more, depending on policy."
  }
];

const FaqAreaTwo = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const toggleFaq = (index) => {
    setActiveIndex(activeIndex === index ? -1 : index);
  };

  return (
    <section className="faq-section" style={{marginTop: "100px"}} >
      <div className="container">
        {/* Section Header */}
        <div className="faq-header">
          <span className="faq-subtitle">FAQ</span>
          <h2 className="faq-title">Your Questions About Car Care, Answered</h2>
        </div>

        <div className="row align-items-center">
          {/* FAQ Image */}
          <div className="col-lg-5 col-xl-6 order-lg-2">
            <div className="faq-image-wrapper">
              <div className="faq-image">
                <img
                  src="assets/img/normal/faq-thumb-2-1.webp"
                  alt="Car Service FAQ"
                />
              </div>
              {/* Floating Badge */}
              <div className="faq-badge">
                <div className="faq-badge-icon">
                  <i className="fas fa-question-circle" />
                </div>
                <div className="faq-badge-text">
                  Got Questions?<br />We Have Answers!
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="col-lg-7 col-xl-6 order-lg-1">
            <div className="faq-accordion-wrapper">
              {faqData.map((faq, index) => (
                <div
                  key={index}
                  className={`faq-card ${activeIndex === index ? 'active' : ''}`}
                >
                  <button
                    className="faq-question"
                    onClick={() => toggleFaq(index)}
                  >
                    <span className="faq-number">{String(index + 1).padStart(2, '0')}</span>
                    <span className="faq-question-text">{faq.question}</span>
                    <span className="faq-question-icon">
                      <i className="fas fa-chevron-down" />
                    </span>
                  </button>
                  <div className="faq-answer">
                    <p className="faq-answer-content">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqAreaTwo;
