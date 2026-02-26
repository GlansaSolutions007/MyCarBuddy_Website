import React from "react";
import AppStoreBadges from "./AppStoreBadges";
import homePageImg from "../images/homepagess.png";
import "./AppDownloadSection.css";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.itglansa.mycarbuddy&pcampaignid=web_share";

const QR_CODE_URL = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
  PLAY_STORE_URL
)}&color=116d6e&bgcolor=ffffff`;

const AppDownloadSection = () => {
  const imgSrc = homePageImg?.default || homePageImg;

  return (
    <section className="app-download-section">
      <div className="container">
        <div className="app-download-inner">
          {/* Left: CTA + Badges */}
          <div className="app-download-content">
            <div className="app-download-decor app-download-decor--left" aria-hidden="true" />
            <h2 className="app-download-title">Download the app now!</h2>
            <p className="app-download-subtitle">
              Experience seamless car servicing only on the My Car Buddy app
            </p>
            <AppStoreBadges variant="banner" />
          </div>

          {/* Right: Phone (half visible) + QR beside it */}
          <div className="app-download-visual">
            <div className="app-download-decor app-download-decor--right" aria-hidden="true" />
            <div className="app-phone-mockup">
              <div className="app-phone-screen">
                <img src={imgSrc} alt="My Car Buddy App" className="app-phone-img" />
              </div>
            </div>
            <div className="app-qr-card">
              <p className="app-qr-label">Scan to download</p>
              <div className="app-qr-wrap">
                <img
                  src={QR_CODE_URL}
                  alt="QR Code - Scan to download My Car Buddy"
                  className="app-qr-img"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppDownloadSection;
