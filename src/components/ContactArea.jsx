import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ContactArea.css";

const ContactArea = () => {
  const BASE_URL = process.env.REACT_APP_CARBUDDY_BASE_URL;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    number: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [companyInfo, setCompanyInfo] = useState({ address: '', phones: [], email: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const response = await axios.get(`${BASE_URL}CompanyInfo`);
        const data = response.data.data;
        const address = data.find(item => item.Type === 'Address')?.Description || '';
        const phones = data.filter(item => item.Type === 'PhoneNumber').map(item => item.Description);
        const email = data.find(item => item.Type === 'E-mail')?.Description || '';
        setCompanyInfo({ address, phones, email });
      } catch (err) {
        console.error('Failed to fetch company info:', err);
      }
    };
    fetchCompanyInfo();
  }, [BASE_URL]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      await axios.post(`${BASE_URL}contact`, {
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.number,
        subject: formData.subject,
        message: formData.message,
        type: 'contact'
      });
      setSuccess('Message sent successfully!');
      setFormData({
        name: '',
        email: '',
        number: '',
        subject: '',
        message: ''
      });
    } catch (err) {
      setError('Failed to send message. Please try again.');
    }
    setLoading(false);
  };

  const handlePhoneClick = (phone) => {
    const number = phone.replace(/\D/g, "");
    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(
      navigator.userAgent
    );

    if (isMobile) {
      window.location.href = `tel:${number}`;
    } else {
      window.open(`https://wa.me/${number}`, "_blank");
    }
  };

  // Format phone number to XXX-XXX-XXXX pattern
  const formatPhoneNumber = (phone) => {
    // Remove all non-digit characters
    let digits = phone.replace(/\D/g, "");

    // If starts with 91 (country code) and has 12 digits, remove the 91
    if (digits.length === 12 && digits.startsWith("91")) {
      digits = digits.slice(2);
    }

    // Format as XXX-XXX-XXXX if 10 digits
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    return phone; // Return original if not matching pattern
  };

  return (
    <section className="contact-section">
      <div className="container">
        {/* Section Header */}
        {/* <div className="contact-header">
          <span className="contact-subtitle">Contact Us</span>
          <h2 className="contact-title">Get In Touch With Us</h2>
          <p className="contact-description">
            Have questions or need assistance? We're here to help. Reach out to us through any of the channels below.
          </p>
        </div> */}

        {/* Contact Info Cards */}
        <div className="contact-info-grid">
          {/* Address Card */}
          <div className="contact-info-card">
            <div className="contact-info-icon">
              <i className="fas fa-map-marker-alt" />
            </div>
            <div className="contact-info-content">
              <h4 className="contact-info-title">Our Location</h4>
              <p className="contact-info-text">{companyInfo.address || 'Loading...'}</p>
            </div>
          </div>

          {/* Phone Card */}
          <div className="contact-info-card">
            <div className="contact-info-icon">
              <i className="fas fa-phone-alt" />
            </div>
            <div className="contact-info-content">
              <h4 className="contact-info-title">Phone Number</h4>
              <p className="contact-info-text">

                {companyInfo.phones.length > 0 ? (
                  companyInfo.phones.map((phone, index) => (
                    <React.Fragment key={index}>
                      <span className="country-code-static">+91 </span>
                      <a onClick={() => handlePhoneClick(phone)}>{formatPhoneNumber(phone)}</a>
                      {index < companyInfo.phones.length - 1 && <br />}
                    </React.Fragment>
                  ))
                ) : (
                  'Loading...'
                )}
              </p>
            </div>
          </div>

          {/* Email Card */}
          <div className="contact-info-card">
            <div className="contact-info-icon">
              <i className="fas fa-envelope" />
            </div>
            <div className="contact-info-content">
              <h4 className="contact-info-title">Email Address</h4>
              <p className="contact-info-text">
                <a href={`mailto:${companyInfo.email}`}>
                  {companyInfo.email || 'Loading...'}
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Main Content: Form + Map */}
        <div className="contact-main">
          {/* Contact Form */}
          <div className="contact-form-wrapper">
            <div className="contact-form-header">
              <h3 className="contact-form-title">
                <i className="fas fa-paper-plane" />
                Send Us a Message
              </h3>
              <p className="contact-form-subtitle">
                Fill out the form below and we'll get back to you as soon as possible.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="contact-form">
              <div className="contact-form-row">
                <div className="contact-form-group">
                  <i className="fas fa-user contact-form-icon" />
                  <input
                    type="text"
                    className="contact-form-input"
                    name="name"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="contact-form-group">
                  <i className="fas fa-envelope contact-form-icon" />
                  <input
                    type="email"
                    className="contact-form-input"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="contact-form-row">
                <div className="contact-form-group">
                  <i className="fas fa-phone contact-form-icon" />
                  <input
                    type="tel"
                    className="contact-form-input"
                    name="number"
                    maxLength={10}
                    placeholder="Phone Number"
                    value={formData.number}
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^0-9]/g, "");
                      if (value.length > 0 && !/^[6-9]/.test(value[0])) {
                        value = "";
                      }
                      handleChange({ target: { name: "number", value } });
                    }}
                    required
                  />
                </div>
                <div className="contact-form-group">
                  <i className="fas fa-tag contact-form-icon" />
                  <input
                    type="text"
                    className="contact-form-input"
                    name="subject"
                    placeholder="Subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="contact-form-group">
                <textarea
                  className="contact-form-textarea"
                  name="message"
                  placeholder="Write your message here..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                />
              </div>

              {success && (
                <div className="contact-alert contact-alert-success">
                  <i className="fas fa-check-circle" />
                  {success}
                </div>
              )}
              {error && (
                <div className="contact-alert contact-alert-error">
                  <i className="fas fa-exclamation-circle" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="contact-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <i className="fas fa-arrow-right" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Map Section */}
          <div className="contact-map-wrapper">
            <div className="contact-map-header">
              <h3 className="contact-map-title">
                <i className="fas fa-map-marked-alt" />
                Find Us Here
              </h3>
            </div>

            <div className="contact-map">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d60902.88409628053!2d78.31117294863282!3d17.439109100000007!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb9a3e6c6874dd%3A0x7abfee772aee3875!2sGlansa%20Solutions!5e0!3m2!1sen!2sin!4v1756129461537!5m2!1sen!2sin"
                allowFullScreen=""
                loading="lazy"
                title="Our Location"
              />
            </div>

            {/* Quick Contact Card */}
            <div className="contact-quick-card">
              <div className="contact-quick-icon">
                <i className="fas fa-headset" />
              </div>
              <div className="contact-quick-content">
                <h4>Need Quick Free Support?</h4>
                <p>Call us now for immediate assistance with your car service needs.</p>
                {companyInfo.phones.length > 0 ? (
                  <p 
                    className="contact-quick-phone"
                    onClick={() => handlePhoneClick(companyInfo.phones[0])}
                  >
                    <span className="country-code-static">+91 </span>
                    {formatPhoneNumber(companyInfo.phones[0])}
                  </p>
                ) : (
                  <p className="contact-quick-phone">Loading...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactArea;
