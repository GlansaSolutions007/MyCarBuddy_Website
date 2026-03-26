import React, { useEffect, useState } from "react";
import HeaderOne from "../components/HeaderOne";
import TestimonialOne from "../components/TestimonialOne";
import FooterAreaOne from "../components/FooterAreaOne";
import Breadcrumb from "../components/Breadcrumb";
import FeedbackLayer from "../components/FeedbackLayer";
import Preloader from "../helper/Preloader";

const CheckoutPage = () => {
  let [active, setActive] = useState(true);
  useEffect(() => {
    setTimeout(function () {
      setActive(false);
    }, 2000);
  }, []);
  return (
    <>
      {/* Preloader */}
      {active === true && <Preloader />}

      {/* Header one */}
      <HeaderOne />

      {/* Breadcrumb */}
      <Breadcrumb title={"Service Feedback"} />

      {/* Checkout */}
      <FeedbackLayer />

      <TestimonialOne/>

      {/* Footer Area One */}
      <FooterAreaOne />
    </>
  );
};

export default CheckoutPage;
