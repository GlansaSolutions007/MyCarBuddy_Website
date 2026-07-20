import React, { useEffect, useState } from "react";
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
  [Computer, "IT Companies"],
  [Building2, "Corporate Offices"],
  [Building2, "Hospitals"],
  [GraduationCap, "Educational Institutions"],
  [Landmark, "Banks & Financial Services"],
  [BriefcaseBusiness, "Logistics & Fleet Operators"],
  [Hotel, "Hotels"],
  [Hotel, "Small & Medium Businesses"],
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
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showProposalForm]);

  const openProposalForm = () => setShowProposalForm(true);
  const closeProposalForm = () => setShowProposalForm(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Proposal Request:", formData);

    // Here you can call your backend API
    alert("Thank you! We will contact you soon.");

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

    setShowProposalForm(false);
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
              Request a Proposal
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
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDAtcV9-ow05f_EFeomlvkm0W7k9bt2D4Dkv6NTAjPN_LYlqTOKVjVYHQgSUDhZltDlfHZBUkzSL9cR1rirSPrNPzXvowxOmy7W9qHi6koZ_9VwKysGcp3oYBSHTKuqBt-RmG_nXsiBOgEMf6KtGP64PKlUXAa1sWu705WA6brxmucio7enJbzY-1aO02l2laVqSFmQ83AH0pCNgbXyDghHTRDJDHUZujw1GZk3E1i7Ivsew3IGSrV2VQ"
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
            {industries.map(([Icon, label]) => (
              <div className="corporate-industry" key={label}>
                <Icon size={28} />
                <span>{label}</span>
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
              <a href="mailto:corporate@mycarbuddy.in">
                <Mail size={20} />
                <strong>corporate@mycarbuddy.in</strong>
              </a>
            </div>
            <button
              type="button"
              className="corporate-btn corporate-btn--orange"
              onClick={openProposalForm}
            >
              Request a Corporate Proposal
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
              <h2 id="proposal-modal-title">Request a Corporate Proposal</h2>
              <p>
                Tell us about your organization and we'll create a customized
                vehicle care solution for you.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="proposal-form">
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
                </div>

                <div className="proposal-form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    placeholder="+91 XXXXX XXXXX"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="proposal-form-group">
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
                </div>
              </div>

              <div className="proposal-form-group">
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
              </div>

              <div className="proposal-form-group">
                <label htmlFor="message">Additional Requirements</label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Tell us about your requirements..."
                  rows="4"
                  value={formData.message}
                  onChange={handleChange}
                />
              </div>

              <button
                type="submit"
                className="corporate-btn corporate-btn--orange proposal-submit-btn"
              >
                <Send size={18} />
                Submit Proposal Request
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Corporate;
