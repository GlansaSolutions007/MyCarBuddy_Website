import React from "react";
import Marquee from "react-fast-marquee";
import "./MarqueeOne.css";

const MarqueeOne = () => {
  const marqueeItems = [
    { icon: "assets/img/icon/marquee-icon-1-1.svg", text: "Express Car Fix" },
    { icon: "assets/img/icon/marquee-icon-1-2.svg", text: "Car Care Clinic" },
    { icon: "assets/img/icon/marquee-icon-1-1.svg", text: "Premium Service" },
    { icon: "assets/img/icon/marquee-icon-1-2.svg", text: "Expert Mechanics" },
    { icon: "assets/img/icon/marquee-icon-1-1.svg", text: "Quality Parts" },
    { icon: "assets/img/icon/marquee-icon-1-2.svg", text: "Fast Repairs" },
  ];

  return (
    <section className="marquee-section">
      <div className="marquee-wrapper">
        <Marquee speed={50} gradient={false} pauseOnHover={true}>
          {marqueeItems.map((item, index) => (
            <div key={index} className="marquee-item">
              <div className="marquee-icon-wrapper">
                <img src={item.icon} alt={item.text} className="marquee-icon" />
              </div>
              <span className="marquee-text">{item.text}</span>
              <span className="marquee-separator">✦</span>
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  );
};

export default MarqueeOne;
