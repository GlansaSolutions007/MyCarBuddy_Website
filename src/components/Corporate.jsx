import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAlert } from "../context/AlertContext";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CarFront,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Computer,
  GraduationCap,
  Headphones,
  Hotel,
  Landmark,
  Mail,
  MonitorSmartphone,
  Phone,
  ReceiptText,
  ShieldCheck,
  Truck,
  WalletCards,
  Clock3,
  Users,
  TrendingUp,
  Wrench,
  X,
  Send,
} from "lucide-react";
import "./corporate.css";
import itIndustryImage from "../images/it.png";
import corporateIndustryImage from "../images/corp.png";
import hospitalIndustryImage from "../images/hosp.png";
import educationIndustryImage from "../images/col.png";
import bankingIndustryImage from "../images/bank.png";
import logisticsIndustryImage from "../images/log.png";
import hotelIndustryImage from "../images/htl.png";
import businessIndustryImage from "../images/biz.png";
import corpimg from "../images/corpimg.png";

const services = [
  {
    icon: BadgeCheck,
    title: "Employee Car Care",
    items: ["Doorstep Car Wash", "Interior/Exterior Cleaning", "Periodic Maintenance", "Car Detailing"],
  },
  {
    icon: Truck,
    title: "Fleet Management",
    items: ["Preventive Maintenance", "Vehicle Health Checks", "Scheduled Servicing", "Emergency Assistance"],
  },
  {
    icon: CalendarCheck,
    title: "Corporate Service Camps",
    items: ["On-site Car Wash Camps", "Employee Special Offers", "Weekend Service Drives"],
  },
  {
    icon: ClipboardCheck,
    title: "Annual Maintenance Contracts (AMC) Plans",
    items: ["Flexible Service Plans", "Dedicated Support", "Customized Packages"],
  },
];

const servicePlans = [
  {
    medal: "🥉",
    name: "Basic Plan",
    suitableFor: "Small Businesses (10-25 Vehicles)",
    includes: [
      "Monthly Car Wash",
      "Interior Vacuum Cleaning",
      "Exterior Cleaning",
      "Basic Vehicle Inspection",
      "Priority Booking",
    ],
    pricing: "Starting from ₹499 per vehicle/month",
    note: "customizable based on volume",
  },
  {
    medal: "🥈",
    name: "Standard Plan",
    suitableFor: "Medium-Sized Companies (25-100 Vehicles)",
    includes: [
      "Two Car Washes per Month",
      "Interior & Exterior Cleaning",
      "Vehicle Health Check",
      "Battery & Tyre Inspection",
      "Dedicated Relationship Executive",
      "Monthly Service Report",
    ],
    pricing: "Starting from ₹899 per vehicle/month",
  },
  {
    medal: "🥇",
    name: "Premium Plan",
    suitableFor: "Large Corporates & Fleet Operators (100+ Vehicles)",
    includes: [
      "Weekly Car Wash",
      "Interior Detailing",
      "Exterior Detailing",
      "Periodic Vehicle Inspection",
      "Emergency Breakdown Support",
      "On-Site Service Camps",
      "Dedicated Account Manager",
      "Customized Reporting",
    ],
    pricing: "Custom Quote",
  },
];

const corporateBenefits = [
  "Employee Special Discounts",
  "Corporate Car Wash Camps",
  "Annual Maintenance Contracts (AMC)",
  "Doorstep Service at Office Premises",
  "GST Billing & Tax Invoices",
  "Flexible Monthly Billing",
];

const corporateWhatsappLink = "https://wa.me/917075243939";

const reasons = [
  {
    icon: CarFront,
    title: "Doorstep Service",
    text: "We come to your office or home.",
  },
  {
    icon: ShieldCheck,
    title: "Experienced & Verified Technicians",
    text: "Background-checked experts.",
  },
  {
    icon: WalletCards,
    title: "Transparent Pricing",
    text: "No hidden costs, upfront quotes.",
  },
  {
    icon: MonitorSmartphone,
    title: "Convenient Online Booking",
    text: "Schedule in seconds via app/web.",
  },
  {
    icon: MonitorSmartphone,
    title: "Flexible Scheduling",
    text: "Flexibility in scheduling service.",
  },
  {
    icon: ReceiptText,
    title: "GST Billing",
    text: "Proper invoicing for corporate tax.",
  },
  {
    icon: Headphones,
    title: "Dedicated Corporate Support",
    text: "Priority manager for corporates.",
  },
];

const steps = [
  ["Contact Us", "Reach out with your fleet size and location."],
  ["Requirements", "Discuss specific service needs for employees."],
  ["Proposal", "Get a tailored commercial proposal."],
  ["Schedule", "Schedule dates for service."],
  ["Enjoy Care", "Enjoy Professional doorstep service."],
];

const industries = [
  { icon: Computer, label: "IT Companies", image: itIndustryImage },
  { icon: Building2, label: "Corporate Offices", image: corporateIndustryImage },
  { icon: Building2, label: "Hospitals", image: hospitalIndustryImage },
  { icon: GraduationCap, label: "Educational Institutions", image: educationIndustryImage },
  { icon: Landmark, label: "Banks & Financial Services", image: bankingIndustryImage },
  { icon: BriefcaseBusiness, label: "Logistics & Fleet Operators", image: logisticsIndustryImage },
  { icon: Hotel, label: "Hotels", image: hotelIndustryImage },
  { icon: BriefcaseBusiness, label: "Small & Medium Businesses", image: businessIndustryImage },
];

const organizationBenefits = [
  {
    icon: Clock3,
    title: "Save Time",
    text: "Doorstep services eliminate employee travel and waiting time.",
  },
  {
    icon: Users,
    title: "Employee Convenience",
    text: "Professional car care at the workplace improves employee satisfaction.",
  },
  {
    icon: Wrench,
    title: "Better Vehicle Health",
    text: "Scheduled maintenance keeps vehicles reliable and road-ready.",
  },
  {
    icon: TrendingUp,
    title: "Higher Productivity",
    text: "Employees stay focused while we take care of their vehicles.",
  },
  {
    icon: ShieldCheck,
    title: "Reliable & Cost-Effective",
    text: "Transparent pricing, preventive care, and dedicated corporate support.",
  },
];

const planPricing = {
  "Basic Plan": "Starting from Rs. 499 per vehicle/month",
  "Standard Plan": "Starting from Rs. 899 per vehicle/month",
  "Premium Plan": "Custom Quote",
};

const Corporate = () => {
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showAlert } = useAlert();

  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    companySize: "",
    fleetSize: "",
    services: "",
    message: "",
  });
  useEffect(() => {
    if (!showProposalForm) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowProposalForm(false);
        setFormErrors({});
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showProposalForm]);

  const openProposalForm = () => {
    setShowProposalForm(true);
  };
  const closeProposalForm = () => {
    setShowProposalForm(false);
    setFormErrors({});
  };

  const validateName = (value) => /^[A-Z][A-Za-z]*(?: [A-Z][A-Za-z]*)*$/.test(value.trim());

  const formatNameValue = (value) => {
    const sanitizedValue = value.replace(/[^A-Za-z ]/g, "");
    return sanitizedValue
      .split(" ")
      .map((word) => {
        if (!word) return "";
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  };

  const validateForm = () => {
    const errors = {};
    const companyName = formData.companyName.trim();
    const contactPerson = formData.contactPerson.trim();
    const phone = formData.phone.trim();
    const businessEmail = formData.email.trim();
    const servicesRequired = formData.message.trim();

    if (!companyName) {
      errors.companyName = "Company name is required.";
    } else if (!validateName(companyName)) {
      errors.companyName =
        "Company name must start with a capital letter and each word after a space must also start with a capital letter.";
    }

    if (!contactPerson) {
      errors.contactPerson = "Contact person is required.";
    } else if (!validateName(contactPerson)) {
      errors.contactPerson =
        "Contact person name must start with a capital letter and each word after a space must also start with a capital letter.";
    }

    if (!businessEmail) {
      errors.email = "Business email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessEmail)) {
      errors.email = "Enter a valid business email address.";
    }

    if (!phone) {
      errors.phone = "Phone number is required.";
    } else if (!/^\d{10}$/.test(phone)) {
      errors.phone = "Mobile number must be exactly 10 digits.";
    }

if (!servicesRequired) {
      errors.message = "Please tell us which services you require.";
    }

    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;

    if (name === "phone") {
      nextValue = value.replace(/\D/g, "").slice(0, 10);
    } else if (name === "companyName" || name === "contactPerson") {
      nextValue = formatNameValue(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    const baseUrl = process.env.REACT_APP_CARBUDDY_BASE_URL;
    if (!baseUrl) {
      showAlert("Unable to submit request", "Please try again later.", 4000, "error");
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post(`${baseUrl}Contact/SendCorporateProposal`, {
        companyName: formData.companyName.trim(),
        contactPerson: formData.contactPerson.trim(),
        businessEmail: formData.email.trim(),
        phoneNumber: formData.phone.trim(),
        servicesRequired: formData.message.trim(),
      });

      showAlert("Proposal request sent", "Thank you! We will contact you soon.", 6000, "success");
      setFormData({
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        companySize: "",
        fleetSize: "",
        services: "",
        message: "",
      });
      setFormErrors({});
      setShowProposalForm(false);
} catch (error) {
      showAlert(
        "Unable to submit request",
        error.response?.data?.message ||
          "We couldn't submit your request. Please try again or contact us on WhatsApp.",
        5000,
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="corporate-page">
      <section className="corporate-hero">
        <div className="corporate-hero__media" />
        <div className="corporate-container corporate-hero__content">
          <span className="corporate-eyebrow">Elevate Employee Satisfaction</span>
          <h1>
            Corporate <span>Car Care</span> Solutions
          </h1>
          <h4>
            Reliable Doorstep Car Care for Your Employees & Fleet
          </h4>
          <p>
           My Car Buddy (MCB) provides professional doorstep car care services for corporate offices, businesses, and fleet operators across Hyderabad. 
           We help organizations save time, improve employee convenience, and keep vehicles in excellent condition through scheduled maintenance and on-site services.
          </p>
          <div className="corporate-actions">
            <button
              type="button"
              className="corporate-btn corporate-btn--orange"
              onClick={openProposalForm}
            >
              Request an Enquiry
            </button>
            <a className="corporate-btn corporate-btn--teal" href={corporateWhatsappLink} target="_blank" rel="noreferrer">
              Contact Us
            </a>
          </div>
        </div>
      </section>

      <section className="corporate-section corporate-section--white">
        <div className="corporate-container">
          <div className="corporate-heading">
            <h2>Our Corporate Services</h2>
            <span />
          </div>
          <div className="corporate-services">
            {services.map(({ icon: Icon, title, items }) => (
              <article className="corporate-service-card" key={title}>
                <div className="corporate-icon-box">
                  <Icon size={23} />
                </div>
                <h3>{title}</h3>
                <ul>
                  {items.map((item) => (
                    <li key={item}>
                      <Circle size={8} />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="corporate-section corporate-plans">
        <div className="corporate-container">
          <div className="corporate-heading">
            <h2>Corporate Service Plans</h2>
            <span />
          </div>
          <div className="corporate-plan-grid">
            {servicePlans.map(({ name, suitableFor, includes, note }, index) => (
              <article className="corporate-plan-card" key={name}>
                <div className="corporate-plan-card__top">
                  <span className="corporate-plan-card__medal">{index + 1}</span>
                  <div>
                    <h3>{name}</h3>
                    <p>
                      <strong>Suitable for:</strong> {suitableFor}
                    </p>
                  </div>
                </div>
                <div className="corporate-plan-card__body">
                  <h4>Includes:</h4>
                  <ul>
                    {includes.map((item) => (
                      <li key={item}>
                        <CheckCircle2 size={17} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="corporate-plan-card__pricing">
                  <span>Pricing</span>
                  <strong>{planPricing[name]}</strong>
                  {note && <small>({note})</small>}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="corporate-section corporate-section--white corporate-benefits-section">
        <div className="corporate-container">
          <div className="corporate-heading">
            <h2>Additional Corporate Benefits</h2>
            <span />
          </div>
          <div className="corporate-benefits">
            {corporateBenefits.map((benefit) => (
              <div className="corporate-benefit" key={benefit}>
                <CheckCircle2 size={22} />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="corporate-section corporate-why">
        <div className="corporate-container corporate-why__grid">
          <div>
            <h2>Why Choose My Car Buddy?</h2>
            <div className="corporate-reasons">
              {reasons.map(({ icon: Icon, title, text }) => (
                <div className="corporate-reason" key={title}>
                  <Icon size={26} />
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="corporate-photo-card">
            <img
              src={corpimg}
              alt="Professional technician servicing a car"
            />
            <div className="corporate-stat">
              <strong>120k+</strong>
              <span>Happy Customers trust our doorstep services across India.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="corporate-section corporate-section--white corporate-organization-section">
        <div className="corporate-container">
          <div className="corporate-heading corporate-organization-heading">
            <h2>How My Car Buddy Helps Organizations</h2>
            <span />
            <p>
              We simplify corporate vehicle care by saving time, improving employee
              convenience, and ensuring every vehicle receives professional attention.
            </p>
          </div>

          <div className="corporate-organization-grid">
            {organizationBenefits.map(({ icon: Icon, title, text }) => (
              <article className="corporate-organization-card" key={title}>
                <div className="corporate-organization-icon">
                  <Icon size={24} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="corporate-section corporate-process">
        <div className="corporate-container">
          <div className="corporate-heading corporate-heading--light">
            <h2>How It Works</h2>
            <p>Simple steps to professional corporate car care</p>
          </div>
          <div className="corporate-steps">
            {steps.map(([title, text], index) => (
              <div className="corporate-step" key={title}>
                <div className={index === steps.length - 1 ? "active" : ""}>{index + 1}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="corporate-section corporate-section--white">
        <div className="corporate-container">
          <div className="corporate-heading">
            <h2>Industries We Serve</h2>
            <span />
          </div>
          <div className="corporate-industries">
            {industries.map(({ icon: Icon, label, image }) => (
              <div className="corporate-industry" key={label}>
                <img src={image} alt="" aria-hidden="true" />
                <div className="corporate-industry__content">
                  <div className="corporate-industry__icon">
                    <Icon size={22} />
                  </div>
                  <span>{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="corporate-cta-wrap">
        <div className="corporate-container">
          <div className="corporate-cta">
            <h2>Let's Work Together</h2>
            <p>
              Looking for a reliable car care partner for your employees or fleet?
            </p>
            <h5>Get in touch with My Car Buddy today for a customized corporate vehicle care solution.</h5>
            <div className="corporate-contact-row">
              <a href="tel:+917075243939">
                <Phone size={20} />
                <strong>+91 707-524-3939</strong>
              </a>
              <a href="mailto:info@mycarbuddy.in">
                <Mail size={20} />
                <strong>info@mycarbuddy.in</strong>
              </a>
            </div>
            <button
              type="button"
              className="corporate-btn corporate-btn--orange"
              onClick={openProposalForm}
            >
              Request a Corporate Enquiry
            </button>
          </div>
        </div>
      </section>

      <a className="corporate-whatsapp" href={corporateWhatsappLink} target="_blank" rel="noreferrer">
        <i className="fab fa-whatsapp" />
        <span>
          <small>WhatsApp Support</small>
          <strong>+91 707-524-3939</strong>
        </span>
      </a>
      {showProposalForm && (
        <div
          className="proposal-modal-overlay"
          onClick={closeProposalForm}
          role="presentation"
        >
          <div
            className="proposal-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="proposal-modal-title"
          >
            <button
              type="button"
              className="proposal-modal-close"
              onClick={closeProposalForm}
              aria-label="Close proposal form"
            >
              <X size={22} />
            </button>
            <div className="proposal-modal-header">
              <span className="proposal-modal-kicker">
                <ShieldCheck size={15} /> Priority corporate support
              </span>
              <h2 id="proposal-modal-title">Request a Corporate Enquiry</h2>
              <p>
                Tell us about your organization and we'll create a customized
                vehicle care solution for you.
              </p>
              {/* <div className="proposal-modal-trust">
                <CheckCircle2 size={16} /> Usually responds within one business day
              </div> */}
            </div>

            <form onSubmit={handleSubmit} className="proposal-form" noValidate>
              <div className="proposal-form-grid">
                <div className="proposal-form-group">
                  <label htmlFor="companyName">Company Name *</label>
                  <input
                    id="companyName"
                    type="text"
                    name="companyName"
                    placeholder="Enter company name"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                  />
                  {formErrors.companyName && (
                    <small style={{ color: "#dc2626", display: "block", marginTop: "0.25rem" }}>
                      {formErrors.companyName}
                    </small>
                  )}
                </div>

                <div className="proposal-form-group">
                  <label htmlFor="contactPerson">Contact Person *</label>
                  <input
                    id="contactPerson"
                    type="text"
                    name="contactPerson"
                    placeholder="Enter your name"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    required
                  />
                  {formErrors.contactPerson && (
                    <small style={{ color: "#dc2626", display: "block", marginTop: "0.25rem" }}>
                      {formErrors.contactPerson}
                    </small>
                  )}
                </div>

                <div className="proposal-form-group">
                  <label htmlFor="email">Business Email *</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {formErrors.email && (
                    <small style={{ color: "#dc2626", display: "block", marginTop: "0.25rem" }}>
                      {formErrors.email}
                    </small>
                  )}
                </div>

                <div className="proposal-form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    placeholder="Enter 10 digit mobile number"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={10}
                    required
                  />
                  {formErrors.phone && (
                    <small style={{ color: "#dc2626", display: "block", marginTop: "0.25rem" }}>
                      {formErrors.phone}
                    </small>
                  )}
                </div>

                {/* <div className="proposal-form-group">
                  <label htmlFor="companySize">Company Size</label>
                  <select
                    id="companySize"
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleChange}
                  >
                    <option value="">Select company size</option>
                    <option value="10-25">10 - 25 Employees</option>
                    <option value="25-100">25 - 100 Employees</option>
                    <option value="100-500">100 - 500 Employees</option>
                    <option value="500+">500+ Employees</option>
                  </select>
                </div>

                <div className="proposal-form-group">
                  <label htmlFor="fleetSize">Number of Vehicles</label>
                  <input
                    id="fleetSize"
                    type="number"
                    name="fleetSize"
                    placeholder="Approximate number of vehicles"
                    value={formData.fleetSize}
                    onChange={handleChange}
                  />
                </div> */}
              </div>

              {/* <div className="proposal-form-group">
                <label htmlFor="services">Services Required</label>
                <select
                  id="services"
                  name="services"
                  value={formData.services}
                  onChange={handleChange}
                >
                  <option value="">Select a service</option>
                  <option value="employee-car-care">Employee Car Care</option>
                  <option value="fleet-management">Fleet Management</option>
                  <option value="service-camps">Corporate Service Camps</option>
                  <option value="amc">Annual Maintenance Contract</option>
                  <option value="multiple">Multiple Services</option>
                </select>
              </div> */}

              <div className="proposal-form-group">
                <label htmlFor="message">Enquiry Details *</label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Tell us about your requirements..."
                  rows="4"
                  value={formData.message}
                  onChange={handleChange}
                />
                  {formErrors.message && (
                    <small style={{ color: "#dc2626", display: "block", marginTop: "0.25rem" }}>
                      {formErrors.message}
                    </small>
                  )}
              </div>
              <button
                type="submit"
                className="corporate-btn corporate-btn--orange proposal-submit-btn"
                disabled={isSubmitting}
              >
                <Send size={18} />
                {isSubmitting ? "Submitting..." : "Submit Enquiry Request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Corporate;
