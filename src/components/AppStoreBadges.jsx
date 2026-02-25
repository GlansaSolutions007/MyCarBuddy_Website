import React from "react";
import { SiAppstore, SiGoogleplay } from "react-icons/si";
import playstoreLogo from "../images/playstorelogo.png";
import appstoreLogo from "../images/appstorelogo.png";
import "./AppStoreBadges.css";

const APP_STORE_URL = "https://apps.apple.com/in/app/mycarbuddy-services/id6758207165";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.itglansa.mycarbuddy&pcampaignid=web_share";

const AppStoreBadges = ({ variant = "hero" }) => {
  const openLink = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (variant === "banner") {
    const playSrc = playstoreLogo?.default || playstoreLogo;
    const appSrc = appstoreLogo?.default || appstoreLogo;
    return (
      <div className="app-store-badges app-store-badges--banner">
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="app-badge-link app-badge-link--google"
          aria-label="Get it on Google Play"
        >
          <img src={playSrc} alt="Get it on Google Play" className="app-badge-img" />
        </a>
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="app-badge-link app-badge-link--apple"
          aria-label="Download on the App Store"
        >
          <img src={appSrc} alt="Download on the App Store" className="app-badge-img" />
        </a>
      </div>
    );
  }

  return (
    <div className={`app-store-badges app-store-badges--${variant}`}>
      <button
        type="button"
        className="app-badge app-badge--apple"
        onClick={() => openLink(APP_STORE_URL)}
        aria-label="Download on the App Store"
      >
        <SiAppstore className="app-badge__icon" aria-hidden="true" />
        <span className="app-badge__text">
          <span className="app-badge__label">Download on the</span>
          <span className="app-badge__store">App Store</span>
        </span>
      </button>
      <button
        type="button"
        className="app-badge app-badge--google"
        onClick={() => openLink(PLAY_STORE_URL)}
        aria-label="Get it on Google Play"
      >
        <SiGoogleplay className="app-badge__icon" aria-hidden="true" />
        <span className="app-badge__text">
          <span className="app-badge__label">Get it on</span>
          <span className="app-badge__store">Google Play</span>
        </span>
      </button>
    </div>
  );
};

export default AppStoreBadges;
