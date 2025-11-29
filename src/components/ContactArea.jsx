import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

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
    // Extract digits only
    const number = phone.replace(/\D/g, "");

    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(
      navigator.userAgent
    );

    if (isMobile) {
      // Call on mobile
      window.location.href = `tel:${number}`;
    } else {
      // WhatsApp Web on desktop
      window.open(`https://wa.me/${number}`, "_blank");
    }
  };


  return (
    <>
      <div className="contact-area space">
        <div className="container">
          <div className="row gy-4 justify-content-center">
            <div className=" col-lg-4 col-md-6">
              <div className="contact-info">
                <div className="row">
                  <div className="col-md-2">
                    <div className="contact-info_icon">
                      <i className="fas fa-map-marker-alt" />
                    </div>
                  </div>
                  <div className="col-md-10 pl-3">
                    <h6 className="contact-info_title">Address</h6>
                    <p className="contact-info_text">
                      {companyInfo.address}
                    </p>
                    {/* <p className="contact-info_text"> </p> */}
                  </div>
                </div>
              </div>

            </div>
            <div className=" col-lg-4 col-md-6">
              <div className="contact-info">
                <div className="row">
                  <div className="col-md-2">
                    <div className="contact-info_icon">
                      <i className="fas fa-phone-alt" />
                    </div>
                  </div>
                  <div className="col-md-10 pl-3">
                    <h6 className="contact-info_title">Phone Number</h6>
                    <p className="contact-info_text">
                      {companyInfo.phones.map((phone, index) => (
                        <React.Fragment key={index}>
                          {/* <Link to={`tel:${phone.replace(/\D/g, '')}`}>{phone}</Link> */}
                          <a
                            onClick={() => handlePhoneClick(phone)}
                            style={{ cursor: "pointer" }}
                          >
                            {phone}
                          </a>
                          {index < companyInfo.phones.length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* <div className="col-xxl-3 col-lg-4 col-md-6">
              <div className="contact-info">
                <div className="contact-info_icon">
                  <i className="fas fa-clock" />
                </div>
                <h6 className="contact-info_title">Opening</h6>
                <p className="contact-info_text">Sun-10AM To 5PM</p>
                <p className="contact-info_text">Thurs-9AM To 8PM</p>
              </div>
            </div> */}
            <div className=" col-lg-4 col-md-6">
              <div className="contact-info">
                <div className="row">
                  <div className="col-md-2">
                    <div className="contact-info_icon">
                      <i className="fas fa-envelope" />
                    </div>
                  </div>
                  <div className="col-md-10 pl-3">
                    <h6 className="contact-info_title">E-mail</h6>
                    <p className="contact-info_text">
                      <a href={`mailto:${companyInfo.email}`}>
                        {companyInfo.email}
                      </a>
                    </p>
                    <p className="contact-info_text">
                      {/* <a href="mailto:nafiz 0121@gmail.com">nafiz 0121@gmail.com</a> */}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
      <div className="space-bottom1">
        <div className="container">
          {/* <div className="map-sec">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d60902.88409628053!2d78.31117294863282!3d17.439109100000007!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb9a3e6c6874dd%3A0x7abfee772aee3875!2sGlansa%20Solutions!5e0!3m2!1sen!2sin!4v1756129461537!5m2!1sen!2sin"
              allowFullScreen=""
              loading="lazy"
              title="address"
              height={"250"}
              width={"100%"}
            />
          </div> */}
        </div>
      </div>
      <div className="space-bottom ">
        <div className="container">
          <div className="row flex-row-reverse">
            <div className="col-lg-6 text-lg-end">

              <div className="map-sec">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d60902.88409628053!2d78.31117294863282!3d17.439109100000007!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb9a3e6c6874dd%3A0x7abfee772aee3875!2sGlansa%20Solutions!5e0!3m2!1sen!2sin!4v1756129461537!5m2!1sen!2sin"
                  allowFullScreen=""
                  loading="lazy"
                  title="address"
                  height={"250"}
                  width={"250"}
                />
              </div>

              {/* <div className="faq-thumb2 mb-xl-0 mb-50">
                <div className="about-counter-grid jump">
                  <img
                    src="assets/img/icon/faq2-counter-icon-1.svg"
                    alt="MyCarBuddy"
                  />
                  <div className="media-right">
                    <h3 className="about-counter">
                      <span className="counter-number">250</span>+
                    </h3>
                    <h4 className="about-counter-text">Services we provide</h4>
                  </div>
                </div>
                <img src="assets/img/normal/faq-thumb-2-1.webp" alt="MyCarBuddy" />
              </div> */}
            </div>
            <div className="col-lg-6">
              <div className="contact-form-wrap p-0">
                <div className="title-area">
                  <span className="sub-title">Contact form</span>
                  <h2 className="sec-title">Get In Touch</h2>
                </div>
                <form
                  onSubmit={handleSubmit}
                  className="appointment-form ajax-contact"
                >
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <input
                          type="text"
                          className="form-control"
                          name="name"
                          id="name"
                          placeholder="Your Name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          id="email"
                          placeholder="Email Address"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <input
                          type="tel"
                          className="form-control"
                          name="number"
                          id="number"
                          placeholder="Phone Number"
                          value={formData.number}
                          onChange={(e) => {
                            let value = e.target.value.replace(/[^0-9]/g, ""); // remove non-numeric

                            // Check first digit
                            if (value.length > 0 && !/^[6-9]/.test(value[0])) {
                              value = ""; // clear if invalid start
                            }

                            handleChange({ target: { name: "number", value } });
                          }}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <input
                          type="text"
                          className="form-control"
                          name="subject"
                          id="subject"
                          placeholder="Subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="form-group col-12">
                    <textarea
                      placeholder="Message here.."
                      id="contactForm"
                      className="form-control"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {success && <div className="alert alert-success">{success}</div>}
                  {error && <div className="alert alert-danger">{error}</div>}
                  <div className="form-btn col-12">
                    <button type="submit" className="btn style2 btn-contact" disabled={loading} style={{ padding: "8px 16px", fontSize: "20px" }} >
                      {loading ? 'Sending...' : 'Submit'} <i className="fas fa-arrow-right ms-2" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactArea;
