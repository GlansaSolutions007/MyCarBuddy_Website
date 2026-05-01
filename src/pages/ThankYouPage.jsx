import React, { useEffect, useState } from "react";
import HeaderOne from "../components/HeaderOne";
import FooterAreaOne from "../components/FooterAreaOne";
import Breadcrumb from "../components/Breadcrumb";
import SubscribeOne from "../components/SubscribeOne";
import ThankYouLayer from "../components/ThankYouLayer";
import Preloader from "../helper/Preloader";
import { useNavigate } from "react-router-dom";

const ReschedulePage = () => {
  const [active, setActive] = useState(true);
    const navigate = useNavigate();


  useEffect(() => {
    setTimeout(function () {
      setActive(false);
    }, 2000);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 7000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <>
      {/* Preloader */}
      {active === true && <Preloader />}

      {/* Header one */}
      <HeaderOne />

      {/* Breadcrumb */}
      {/* <Breadcrumb title={"Payment Successful"} /> */}

      {/* Reschedule Area */}
      <ThankYouLayer />

      {/* Subscribe One */}
      {/* <SubscribeOne /> */}

      {/* Footer Area One */}
      <FooterAreaOne />
    </>
  );
};

export default ReschedulePage;
