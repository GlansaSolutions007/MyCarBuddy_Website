import React from "react";
import "./Terms.css";
import {
  FaBuilding,
  FaClipboardList,
  FaUserCheck,
  FaRupeeSign,
  FaUndo,
  FaShieldAlt,
  FaRegCopyright,
  FaUserShield,
  FaLock,
  FaGavel,
  FaEdit,
  FaPhoneAlt,
  FaEnvelope,
} from "react-icons/fa";

const Terms = () => {
  return (
    <section className="terms-section">
      <div className="container">
        <div className="terms-layout">
          {/* Left: Title & Intro */}
          <div className="terms-header">
            <span className="terms-pill">Legal & Policy</span>
            <h1 className="terms-title">Terms & Conditions</h1>
            <p className="terms-subtitle">
              Please read these Terms carefully before using the My Car Buddy platform.
              By accessing or using our services, you agree to be bound by these Terms.
            </p>
            <div className="terms-meta">
              <div className="terms-meta-item">
                <span className="terms-meta-label">
                  <FaEdit className="terms-meta-icon" />
                  Last updated
                </span>
                <span className="terms-meta-value">16 December 2025</span>
              </div>
              <div className="terms-meta-item">
                <span className="terms-meta-label">
                  <FaGavel className="terms-meta-icon" />
                  Jurisdiction
                </span>
                <span className="terms-meta-value">Hyderabad, Telangana (India)</span>
              </div>
            </div>
          </div>

          {/* Right: Content Card */}
          <div className="terms-card">
            <div className="terms-scroll">
              <h4 className="terms-section-title">
                <FaBuilding className="terms-icon" />
                Mycarbuddy.in is a subsidiary of Glansa Solutions Private Limited
              </h4>
              <p>
                These Terms and Conditions (&ldquo;Terms&rdquo;) govern your use of the{" "}
                <strong>My Car Buddy</strong> mobile application, website, and services
                (collectively, the &ldquo;Platform&rdquo;).
              </p>
              <p>
                For the purpose of these Terms: The terms <strong>&quot;we&quot;</strong>,{" "}
                <strong>&quot;us&quot;</strong>, <strong>&quot;our&quot;</strong> shall mean{" "}
                <strong>Glansa Solutions Private Limited</strong>, a company incorporated
                under the Companies Act, 2013, with its registered/operational office at{" "}
                Flat No. 102, Mahalaxmi Paradise, Aswini Colony, West Maredpally,
                Secunderabad, Hyderabad, Telangana – 500026, Floor No.: B1,2 floor,
                Building No./Flat No.: 1-89/A/B/C2&3, Name Of Premises/Building: A1,
                Road/Street: Vittal Nagar Road, Locality/Sub Locality: Madhapur,
                City/Town/Village: Hyderabad, District: Hyderabad, State: Telangana,
                PIN Code: 500081, India. The terms <strong>&quot;you&quot;</strong>,{" "}
                <strong>&quot;your&quot;</strong>, <strong>&quot;user&quot;</strong>, or{" "}
                <strong>&quot;customer&quot;</strong> shall mean any person accessing or
                using the Platform. <strong>My Car Buddy</strong> is a registered product
                and service brand owned by Glansa Solutions Pvt. Ltd.
              </p>

              <h4 className="terms-section-title">
                <FaClipboardList className="terms-icon" />
                1. Scope of Services
              </h4>
              <p>
                My Car Buddy provides on-demand and scheduled vehicle care and car service
                solutions, including car wash, cleaning, detailing, diagnostics, repairs,
                and other technician services through verified partners and dealers.
              </p>

              <h4 className="terms-section-title">
                <FaUserCheck className="terms-icon" />
                2. Use of Platform
              </h4>
              <ul>
                <li>You must be at least 18 years old to use the Platform.</li>
                <li>You agree to provide accurate, current, and complete information.</li>
                <li>You are responsible for maintaining the confidentiality of your account.</li>
                <li>
                  Fraudulent or unauthorized use may result in suspension or termination of your
                  access to the Platform.
                </li>
              </ul>

              <h4 className="terms-section-title">
                <FaRupeeSign className="terms-icon" />
                3. Booking &amp; Payment
              </h4>
              <ul>
                <li>All bookings must be made through the app or website.</li>
                <li>
                  Payments can be made via cash, debit/credit card, UPI, wallets, or other
                  supported gateways.
                </li>
                <li>
                  Prepaid bookings not availed on time may be considered completed unless
                  cancelled as per our policy.
                </li>
              </ul>

              <h4 className="terms-section-title">
                <FaRupeeSign className="terms-icon" />
                4. Pricing &amp; Billing
              </h4>
              <p>
                Prices are subject to change without prior notice. Final billing is based on
                actual services availed, applicable taxes (GST), and discounts. An e-invoice
                will be generated and shared electronically.
              </p>

              <h4 className="terms-section-title">
                <FaUndo className="terms-icon" />
                5. Cancellation &amp; Refunds
              </h4>
              <p>
                Customers may cancel or reschedule before service begins. Refunds, if applicable,
                will be processed to the original payment method in line with the My Car Buddy
                Cancellation &amp; Refund Policy.
              </p>

              <h4 className="terms-section-title">
                <FaShieldAlt className="terms-icon" />
                6. Service Quality &amp; Liability
              </h4>
              <p>
                While we ensure reliable services via verified partners, My Car Buddy /
                Glansa Solutions Pvt. Ltd. shall not be liable for incidental or consequential
                damages, inaccurate service details provided by customers, or delays beyond our
                reasonable control.
              </p>

              <h4 className="terms-section-title">
                <FaRegCopyright className="terms-icon" />
                7. Intellectual Property
              </h4>
              <p>
                All logos, trademarks, designs, and content are the property of Glansa Solutions
                Pvt. Ltd. Unauthorized reproduction or modification is strictly prohibited.
              </p>

              <h4 className="terms-section-title">
                <FaUserShield className="terms-icon" />
                8. Customer Responsibilities
              </h4>
              <ul>
                <li>Ensure vehicle location is accessible and safe.</li>
                <li>Remove valuables before handing over for service.</li>
                <li>Provide accurate service/vehicle details and be available on time.</li>
              </ul>

              <h4 className="terms-section-title">
                <FaLock className="terms-icon" />
                9. Privacy &amp; Data Protection
              </h4>
              <p>
                We collect and process personal data in accordance with our Privacy Policy.
                Data is only shared with third parties as necessary for service fulfillment,
                payment, or legal compliance.
              </p>

              <h4 className="terms-section-title">
                <FaGavel className="terms-icon" />
                10. Governing Law
              </h4>
              <p>
                These Terms are governed by the laws of India. All disputes shall be subject to
                the exclusive jurisdiction of the courts in Hyderabad, Telangana, India.
              </p>

              <h4 className="terms-section-title">
                <FaEdit className="terms-icon" />
                11. Amendments
              </h4>
              <p>
                We may update these Terms from time to time. Continued use of the Platform
                implies acceptance of the revised Terms.
              </p>

              <h4 className="terms-section-title">
                <FaPhoneAlt className="terms-icon" />
                12. Contact Information
              </h4>
              <p>
                <strong>Glansa Solutions Private Limited</strong> <br />
                Flat No. 102, Mahalaxmi Paradise, Aswini Colony, West Maredpally,
                Secunderabad, Hyderabad, Telangana – 500026, India. <br />
                <span className="terms-contact-line">
                  <FaEnvelope className="terms-contact-icon" />
                  <span>info@glansa.com</span>
                </span>
                <br />
                <span className="terms-contact-line">
                  <FaPhoneAlt className="terms-contact-icon" />
                  <span>+91 98856 53865</span>
                </span>
                <br />
                <span className="terms-contact-line">
                  <FaPhoneAlt className="terms-contact-icon" />
                  <span>+91 70752 43939</span>
                </span>
              </p>

              <div className="text-muted text-center mt-3">
                You've reached the end of your Inspection
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Terms;
