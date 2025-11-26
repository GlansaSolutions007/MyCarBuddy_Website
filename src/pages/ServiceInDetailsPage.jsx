import React, { useEffect, useState } from "react";
import HeaderOne from "../components/HeaderOne";
import FooterAreaOne from "../components/FooterAreaOne";
import Breadcrumb from "../components/Breadcrumb";
import ServiceDetails from "../components/ServiceDetails";
import Preloader from "../helper/Preloader";
import { useParams } from "react-router-dom";

const ServiceInDetailsPage = () => {
  const { packagename } = useParams(); // <-- get dynamic part
  let [active, setActive] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setActive(false);
    }, 2000);
  }, []);

  const formatTitle = (text) => {
    if (!text) return "";
    return text
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <>
      {active && <Preloader />}

      <HeaderOne />

      {/* Dynamic Title */}
      <Breadcrumb title={formatTitle(packagename)} />
      <ServiceDetails />

      <FooterAreaOne />
    </>
  );
};

export default ServiceInDetailsPage;
