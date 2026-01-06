import React, { useEffect, useState } from "react";
import HeaderOne from "../components/HeaderOne";
import FooterAreaOne from "../components/FooterAreaOne";
import Breadcrumb from "../components/Breadcrumb";
import ConfirmBookingsLayer from "../components/ConfirmBookingsLayer";
import Preloader from "../helper/Preloader";

const ConfirmBookings = () => {
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
      <Breadcrumb title={"My Bookings's"} />

      {/* MyBookings */}
      <ConfirmBookingsLayer />

      {/* Footer Area One */}
      <FooterAreaOne />
    </>
  );
};

export default ConfirmBookings;
