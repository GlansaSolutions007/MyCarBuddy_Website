import React from "react";
import "./Privacy.css";

const Privacy = () => {
  return (
    <section className="privacy-section">
      <div className="container">
        <div className="privacy-layout">
          {/* Left: Title & Intro */}
          <div className="privacy-header">
            <span className="privacy-pill">Legal & Policy</span>
            <h1 className="privacy-title">Privacy Policy</h1>
            <p className="privacy-subtitle">
              Learn how My Car Buddy, powered by Glansa Solutions Pvt. Ltd.,
              collects, uses, and protects your personal data when you use our
              app, website, and services.
            </p>
            <div className="privacy-meta">
              <div className="privacy-meta-item">
                <span className="privacy-meta-label">Last updated</span>
                <span className="privacy-meta-value">16 December 2025</span>
              </div>
              <div className="privacy-meta-item">
                <span className="privacy-meta-label">Applies to</span>
                <span className="privacy-meta-value">App & Website Users</span>
              </div>
            </div>
          </div>

          {/* Right: Content Card */}
          <div className="privacy-card">
            <div className="privacy-scroll">
              <p>
                At <strong>My Car Buddy</strong>, operated by{" "}
                <strong>Glansa Solutions Private Limited</strong>, we value your
                privacy and are committed to protecting your personal
                information. This policy explains how we collect, use, and
                safeguard your data when you use our app, website, and services.
              </p>

              <h4 className="privacy-section-title">1. Information We Collect</h4>
              <p>
                We collect only the necessary details required to provide a smooth
                and reliable experience, including:
              </p>
              <ul>
                <li>Your name and contact information (phone, email).</li>
                <li>Vehicle details (brand, model, registration number, fuel type).</li>
                <li>Service and booking history with My Car Buddy.</li>
                <li>
                  Location information to enable doorstep service, nearest partner
                  allocation, and accurate time estimates.
                </li>
              </ul>

              <h4 className="privacy-section-title">2. How We Use Your Information</h4>
              <p>Your data is used strictly to:</p>
              <ul>
                <li>Confirm, manage, and complete your service bookings.</li>
                <li>Provide customer support and resolve queries or complaints.</li>
                <li>Improve our services, offers, and user experience.</li>
                <li>
                  Send booking updates, reminders, important notifications, and
                  relevant promotional offers (only where permitted).
                </li>
              </ul>

              <h4 className="privacy-section-title">3. Data Security</h4>
              <p>
                All personal data is securely stored and accessed only on a
                need-to-know basis. <strong>Glansa Solutions</strong> does{" "}
                <strong>not</strong> sell, trade, or rent your personal
                information to third parties. We use industry-standard security
                practices to protect your data against unauthorized access,
                alteration, or disclosure.
              </p>

              <h4 className="privacy-section-title">4. Third-Party Services</h4>
              <p>
                In specific scenarios, we integrate trusted third-party services
                such as:
              </p>
              <ul>
                <li>Payment gateways (for secure online transactions).</li>
                <li>Map and location providers (for navigation and service reach).</li>
                <li>Notification and communication platforms.</li>
              </ul>
              <p>
                Your data is shared with such partners only to the extent
                required to complete or enhance the service and always in line
                with applicable privacy and security standards.
              </p>

              <h4 className="privacy-section-title">5. Cookies & Tracking</h4>
              <p>
                Our website may use cookies and similar technologies to improve
                your experience, remember preferences, and provide personalized
                content. You can control cookie permissions through your browser
                settings, though disabling cookies may affect some features.
              </p>

              <h4 className="privacy-section-title">6. Your Rights & Choices</h4>
              <ul>
                <li>
                  You may update or correct your profile details within the app
                  or by contacting support.
                </li>
                <li>
                  You can opt out of promotional communications at any time by
                  using the unsubscribe option or reaching out to our team.
                </li>
                <li>
                  You may request clarification regarding how your data is used
                  or ask for certain data to be deleted, subject to legal and
                  operational requirements.
                </li>
              </ul>

              <h4 className="privacy-section-title">7. Policy Updates</h4>
              <p>
                This Privacy Policy may be updated periodically. The latest
                version will always be available on our website or app. Continued
                use of the Platform after such updates constitutes your
                acceptance of the revised policy.
              </p>

              <h4 className="privacy-section-title">8. Contact Us</h4>
              <p>
                For any questions regarding this Privacy Policy or your personal
                data, please contact{" "}
                <strong>Glansa Solutions Private Limited</strong> at{" "}
                <a href="mailto:info@glansa.com">info@glansa.com</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Privacy;
