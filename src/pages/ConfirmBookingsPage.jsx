import React, { useEffect, useState } from "react";
import HeaderOne from "../components/HeaderOne";
import FooterAreaOne from "../components/FooterAreaOne";
import Breadcrumb from "../components/Breadcrumb";
import ConfirmBookingsLayer from "../components/ConfirmBookingsLayer";
import Preloader from "../helper/Preloader";
import { useLocation, useSearchParams } from "react-router-dom";

const ConfirmBookings = () => {
  let [active, setActive] = useState(true);
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    setTimeout(function () {
      setActive(false);
    }, 2000);
  }, []);

  // Get from navigation state first, then fall back to URL params (e.g. confirm-bookings?custId=6&bookingId=12)
  const stateData = location.state || {};
  const custId = stateData.custId ?? searchParams.get("custId");
  const bookingId = stateData.bookingId ?? searchParams.get("bookingId");
  const booking = stateData.booking;

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
