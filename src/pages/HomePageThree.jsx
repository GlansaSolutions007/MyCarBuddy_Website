import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderOne from "./../components/HeaderOne";
// import HeaderTwo from "./../components/HeaderTwo";
import FaqAreaTwo from "../components/FaqAreaTwo";
import MarqueeOne from "../components/MarqueeOne";
import CTAAreaOne from "../components/CTAAreaOne";
import TestimonialOne from "../components/TestimonialOne";
import FooterAreaOne from "../components/FooterAreaOne";
// import SubscribeOne from "../components/SubscribeOne";
import Preloader from "../helper/Preloader";
import AboutFour from "../components/AboutFour";
import HeroSection from "../components/HeroSection";
import ChooseCarModal from "../components/ChooseCarModal";
import ServiceAreaHomePage from "../components/ServiceAreaHomePage";
import ProcessAreaTwo from "../components/ProcessAreaTwo";
import axios from "axios";
import { Helmet } from "react-helmet-async";
import { FaCar } from 'react-icons/fa';

const HomePageThree = () => {
  const navigate = useNavigate();
  let [active, setActive] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCarDamageModal, setShowCarDamageModal] = useState(false);
  const [seoMeta, setSeoMeta] = useState(null);
  const serviceRef = useRef(null);
  const BaseURL = process.env.REACT_APP_CARBUDDY_BASE_URL;

  // Fetch SEO metadata from API using page_slug=home
  useEffect(() => {
    const fetchSeoData = async () => {

      try {
        const res = await axios.get(
          `${BaseURL}Seometa/page_slug?page_slug=home`
        );
        if (res.data) {
          setSeoMeta(res.data[0]);
        }
      } catch (error) {
        console.error("Error fetching SEO metadata:", error);
      }
    };

    fetchSeoData();
  }, []);

  useEffect(() => {
    setTimeout(() => setActive(false), 500);
    // const selectedCar = localStorage.getItem("selectedCarType");
    // if (!selectedCar) setShowModal(true);
  }, []);

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     // Only show modal if not dismissed before
  //     const dismissed = localStorage.getItem('carDamageModalDismissed');
  //     if (dismissed !== 'true') {
  //       setShowCarDamageModal(true);
  //     }
  //   }, 10000); // 10 seconds delay

  //   return () => clearTimeout(timer);
  // }, []);

  useEffect(() => {
    const handleScrollToService = () => {
      if (serviceRef.current) {
        serviceRef.current.scrollIntoView({ behavior: "smooth" });
      }
    };

    window.addEventListener("scrollToService", handleScrollToService);

    return () => {
      window.removeEventListener("scrollToService", handleScrollToService);
    };
  }, []);

  useEffect(() => {
    if (window.location.hash === "#services") {
      setTimeout(() => {
        window.dispatchEvent(new Event("scrollToService"));
      }, 300);
    }
  }, []);

  return (
    <>
      {/* ✅ Dynamic SEO Meta Tags */}
      {seoMeta && (
        <Helmet>
          <title>{seoMeta.seo_title || "Home | MyCarBuddy"}</title>
          <meta name="description" content={seoMeta.seo_description || ""} />
          <meta name="keywords" content={seoMeta.seo_keywords || ""} />
        </Helmet>
      )}

      {/* Preloader */}
      {active === true && <Preloader />}

      {/* Header Two */}
      <HeaderOne />

      {/* Hero Three */}
      {/* <HeroThree /> */}
      <HeroSection />

      {/* Car Damage Analysis Section */}




      {/* Service Area Two */}
      <div ref={serviceRef}>
        <ServiceAreaHomePage />
      </div>

      {/* Choose Car Modal */}
      <ChooseCarModal isVisible={showModal} onClose={() => setShowModal(false)} />

      {/* Car Damage Analysis Modal */}
      {showCarDamageModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxWidth: "600px" }}>
            <div className="modal-content" style={{
              borderRadius: "20px",
              border: "none",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
              overflow: "hidden",
              maxWidth: "600px",
              padding: "0px 30px 30px"
            }}>
              <div className="modal-header" >
                <div className="row">
                  <div className="col-md-2">
                    <FaCar size={40} color="#116d6e" />
                  </div>
                  <div className="col-md-10">
                    <h2 style={{ color: '#116d6e', fontWeight: '700', fontSize: '1.8rem' }}>AI Car Damage Analysis</h2>

                  </div>
                </div>

                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowCarDamageModal(false);
                    localStorage.setItem('carDamageModalDismissed', 'true');
                  }}
                  style={{ marginTop: "-1.5rem" }}
                >X</button>
              </div>
              <div className="modal-body" style={{ padding: "10px" }}>
                <div className="row align-items-center">
                  <div className="col-md-12">
                    {/* <h2 className="mb-3" style={{ color: '#116d6e' }}>AI Car Damage Analysis</h2> */}
                    <p className="mb-4">
                      Upload images of your car to detect and analyze body damages using advanced AI technology.
                      Get detailed reports on dents, scratches, rust, and other damages instantly.
                    </p>
                    <button
                      className="btn btn-primary px-4 py-2"
                      onClick={() => {
                        localStorage.setItem('carDamageModalDismissed', 'true');
                        navigate('/car-damage-analysis');
                      }}
                      style={{ backgroundColor: '#116d6e', borderColor: '#116d6e' }}
                    >
                      Click Here to Analyze
                    </button>
                  </div>
                  {/* <div className="col-md-6">
                      <FaCar size={200} color="#116d6e" />
                    </div> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ProcessAreaTwo />

      {/* Feature Area One */}
      <AboutFour />


      {/* CTA Area One */}
      <CTAAreaOne />

      {/* Faq Area Two */}
      <FaqAreaTwo />

      {/* Testimonial One */}
      <TestimonialOne />

      {/* Marquee One */}

      <MarqueeOne />

      {/* TeamAreaThree */}
      {/* <TeamAreaThree /> */}





      {/* Blog Area Three */}
      {/* <BlogAreaThree /> */}

      {/* Subscribe One */}
      {/* <SubscribeOne /> */}

      {/* Footer Area One */}
      <FooterAreaOne />


    </>
  );
};

export default HomePageThree;
