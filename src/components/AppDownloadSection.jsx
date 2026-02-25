import React from "react";
import AppStoreBadges from "./AppStoreBadges";
import homePageImg from "../images/homepagess.png";
import "./AppDownloadSection.css";

const AppDownloadSection = () => {
  const imgSrc = homePageImg?.default || homePageImg;

  return (
    <section className="app-download-section">
      <div className="container">
        <div className="app-download-inner">
          {/* Left: CTA + Badges */}
          <div className="app-download-content">
            <h3 className="app-download-title">
              For better experience, download the My Car Buddy app now
            </h3>
            <AppStoreBadges variant="banner" />
          </div>

          {/* Right: Phone mockup */}
          <div className="app-download-visual">
            <div className="app-phone-mockup">
              <div className="app-phone-screen">
                <img src={imgSrc} alt="My Car Buddy App" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppDownloadSection;
