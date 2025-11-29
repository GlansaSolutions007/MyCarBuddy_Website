import React, { useEffect, useState } from "react";
import HeaderOne from "../components/HeaderOne";

import FooterAreaOne from "../components/FooterAreaOne";
import Breadcrumb from "../components/Breadcrumb";
// import SubscribeOne from "../components/SubscribeOne";
import ServiceAreaOneMultiImg from "../components/ServiceAreaOneMultiImg";
import Preloader from "../helper/Preloader";
import axios from "axios";
import { Helmet } from "react-helmet-async";

const ServicePage = () => {
  let [active, setActive] = useState(true);
    const [seoMeta, setSeoMeta] = useState(null);
    const BaseURL = process.env.REACT_APP_CARBUDDY_BASE_URL;

    useEffect(() => {
    const fetchSeoData = async () => {

      try {
        const res = await axios.get(
          `${BaseURL}Seometa/page_slug?page_slug=services`
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
    setTimeout(function () {
      setActive(false);
    }, 2000);
  }, []);
  return (
    <>

         {seoMeta && (
            <Helmet>
              <title>{seoMeta.seo_title || "Home | MyCarBuddy"}</title>
              <meta name="description" content={seoMeta.seo_description || ""} />
              <meta name="keywords" content={seoMeta.seo_keywords || ""} />
              <link rel="canonical" href="https://mycarbuddy.in/service" />
            </Helmet>
          )}
    
    
      {/* Preloader */}
      {active === true && <Preloader />}
      

      {/* Header one */}
      <HeaderOne />

      {/* Breadcrumb */}
      <Breadcrumb title={"Explore Services"} />

      {/* Service Area One */}
      <ServiceAreaOneMultiImg />

      {/* Subscribe One */}
      {/* <SubscribeOne /> */}

      {/* Footer Area One */}
      <FooterAreaOne />
    </>
  );
};

export default ServicePage;
