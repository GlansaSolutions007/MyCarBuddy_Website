import React, { useEffect, useState } from "react";
import HeaderOne from "../components/HeaderOne";
import FooterAreaOne from "../components/FooterAreaOne";
import Breadcrumb from "../components/Breadcrumb";
import ConfirmBookingsLayer from "../components/ConfirmBookingsLayer";
import Preloader from "../helper/Preloader";
import { useLocation } from "react-router-dom";

const ConfirmBookings = () => {
  let [active, setActive] = useState(true);
  const location = useLocation();
  
  useEffect(() => {
    setTimeout(function () {
      setActive(false);
    }, 2000);
  }, []);

  // Get passed state from navigation
  const { custId, bookingId, booking } = location.state || {};

  return (
    <>
      {/* Preloader */}
      {active === true && <Preloader />}

      {/* Header one */}
      <HeaderOne />

      {/* Breadcrumb */}
      <Breadcrumb title={"Confirm Booking"} />

      {/* ConfirmBookingsLayer with props */}
      <ConfirmBookingsLayer custId={custId} bookingId={bookingId} booking={booking} />

      {/* Footer Area One */}
      <FooterAreaOne />
    </>
  );
};

export default ConfirmBookings;
