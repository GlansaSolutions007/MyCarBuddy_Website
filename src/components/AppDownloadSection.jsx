import React from "react";
import { SiAppstore, SiGoogleplay } from "react-icons/si";
import AppStoreBadges from "./AppStoreBadges";
import homePageImg from "../images/homepage.jpeg";
import "./AppDownloadSection.css";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.itglansa.mycarbuddy&pcampaignid=web_share";
const APP_STORE_URL = "https://apps.apple.com/in/app/mycarbuddy-services/id6758207165";

const makeQrUrl = (url) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}&color=116d6e&bgcolor=ffffff`;

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
            <div className="app-qr-cards">
              <div className="app-qr-card app-qr-card--play">
                <img
                  src={makeQrUrl(PLAY_STORE_URL)}
                  alt="QR Code - Google Play"
                  className="app-qr-img"
                />
                <span className="app-qr-store">
                  <SiGoogleplay className="app-qr-store-icon" aria-hidden />
                  Google Play
                </span>
              </div>
              <div className="app-qr-card app-qr-card--apple">
                <img
                  src={makeQrUrl(APP_STORE_URL)}
                  alt="QR Code - App Store"
                  className="app-qr-img"
                />
                <span className="app-qr-store">
                  <SiAppstore className="app-qr-store-icon" aria-hidden />
                  App Store
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppDownloadSection;
