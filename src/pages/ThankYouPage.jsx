import React, { useEffect, useState } from "react";
import HeaderOne from "../components/HeaderOne";
import FooterAreaOne from "../components/FooterAreaOne";
import Breadcrumb from "../components/Breadcrumb";
import SubscribeOne from "../components/SubscribeOne";
import ThankYouLayer from "../components/ThankYouLayer";
import Preloader from "../helper/Preloader";

const ReschedulePage = () => {
  const [active, setActive] = useState(true);

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
