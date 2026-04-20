import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import CryptoJS from "crypto-js";
import { v4 as uuidv4 } from "uuid";
import { Helmet } from "react-helmet-async";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCarSide,
  FaCar,
  FaCheckCircle,
  FaCreditCard,
  FaEnvelope,
  FaGift,
  FaPhone,
  FaRedo,
  FaUser,
} from "react-icons/fa";
import HeaderOne from "../components/HeaderOne";
import FooterAreaOne from "../components/FooterAreaOne";
import Preloader from "../helper/Preloader";
import { useAlert } from "../context/AlertContext";
import { saveUserFromVerifyOtp } from "../helper/authHelper";
import "./InspectionPage.css";

const DEFAULT_OFFER_1 = {
  // oldPrice: 599,
  // newPrice: 399,
  oldPrice: null,
  newPrice: null,
  gstPrice: 0,
  gstPercent: 0,
  // totalPrice: 399,
  totalPrice: null,
  packageId: 174,
  packageName: "5-Seater Car",
  inspectionIncludes: [],
};

const DEFAULT_OFFER_2 = {
  // oldPrice: 999,
  // newPrice: 699,
  oldPrice: null,
  newPrice: null,
  gstPrice: 0,
  gstPercent: 0,
  // totalPrice: 699,
  totalPrice: null,
  packageId: 175,
  packageName: "7-Seater Car",
  inspectionIncludes: [],
};

const getSelectedCarPayload = () => {
  try {
    const selectedCar = JSON.parse(localStorage.getItem("selectedCarDetails") || "null");
    const resolvedRegistrationNumber = selectedCar
      ? (selectedCar.vehicleNumber || selectedCar.VehicleNumber || selectedCar.registrationNumber || selectedCar.VehicleRegNo || "")
      : "";
    const resolvedYearOfPurchase = Number(selectedCar?.yearOfPurchase || selectedCar?.YearOfPurchase) || 0;
    const resolvedKmDriven = Number(selectedCar?.kilometersDriven || selectedCar?.KilometersDriven || selectedCar?.kilometerDriven) || 0;

    return {
      registrationNumber: resolvedRegistrationNumber,
      vehicleNumber: resolvedRegistrationNumber,
      VehicleNumber: resolvedRegistrationNumber,
      vehicleID: selectedCar ? Number(selectedCar.id || selectedCar.VehicleID || selectedCar.vehicleID) || 0 : 0,
      brandID: Number(selectedCar?.brandID || selectedCar?.BrandID || selectedCar?.brand?.id) || 0,
      modelID: Number(selectedCar?.modelID || selectedCar?.ModelID || selectedCar?.model?.id) || 0,
      fuelTypeID: Number(selectedCar?.fuelTypeID || selectedCar?.FuelTypeID || selectedCar?.fuel?.id) || 0,
      kmDriven: resolvedKmDriven,
      kilometersDriven: resolvedKmDriven,
      yearOfPurchase: resolvedYearOfPurchase,
      YearOfPurchase: resolvedYearOfPurchase,
    };
  } catch (error) {
    console.error("Error reading selectedCarDetails:", error);
    return {
      registrationNumber: "",
      vehicleNumber: "",
      VehicleNumber: "",
      vehicleID: 0,
      brandID: 0,
      modelID: 0,
      fuelTypeID: 0,
      kmDriven: 0,
      kilometersDriven: 0,
      yearOfPurchase: 0,
      YearOfPurchase: 0,
    };
  }
};

const InspectionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAlert();
  const [active, setActive] = useState(true);
  const [seoMeta, setSeoMeta] = useState(null);
  const [currentStep, setCurrentStep] = useState("offer");
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(60);
  const [otpExpired, setOtpExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [offer1, setOffer1] = useState(DEFAULT_OFFER_1);
  const [offer2, setOffer2] = useState(DEFAULT_OFFER_2);
  const [selectedOffer, setSelectedOffer] = useState(1);
  const [inspection, setInspection] = useState(true);
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [leadId, setLeadId] = useState(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [inspectionOfferDesc, setInspectionOfferDesc] = useState("");

  // ── Address selector state ──
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [useAddress, setUseAddress] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [manualAddress, setManualAddress] = useState({ line1: "", line2: "", city: "", state: "", pincode: "" });
  const OTHER_ADDRESS = { AddressID: "__other__" };
  const payActionsRef = useRef(null);
  const baseUrl = process.env.REACT_APP_CARBUDDY_BASE_URL;

  useEffect(() => {
    if (currentStep !== "offer") {
      setShowStickyBar(false);
      return;
    }

    const checkVisibility = () => {
      const el = payActionsRef.current;
      if (!el) return;
      // Show sticky bar the moment the bottom of the pay button row scrolls above the viewport
      setShowStickyBar(el.getBoundingClientRect().bottom < 0);
    };

    const timerId = setTimeout(checkVisibility, 0);
    window.addEventListener("scroll", checkVisibility, { passive: true });

    return () => {
      clearTimeout(timerId);
      window.removeEventListener("scroll", checkVisibility);
    };
  }, [currentStep]);


  const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;
  const user = JSON.parse(localStorage.getItem("user"));
  const isLoggedIn = user && user.token;
  const selectedService = location.state?.selectedService || null;
  const serviceTypeDetail = location.state?.serviceTypeDetail || "Package";
  const serviceIdCollect = location.state?.serviceIdCollect || selectedService?.id || 0;
  const backPath = location.state?.backPath || (selectedService ? "/service" : "/");

  useEffect(() => {
    const timerId = setTimeout(() => setActive(false), 500);
    return () => clearTimeout(timerId);
  }, []);

  useEffect(() => {
    document.body.classList.add("page-inspection");
    return () => {
      document.body.classList.remove("page-inspection");
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      setFullName(user?.name || "");
      setIdentifier(user?.phone || "");
      setEmail(user?.email || "");
    }
  }, [isLoggedIn, user?.email, user?.name, user?.phone]);

  useEffect(() => {
    if (selectedService?.title) {
      setDescription(`Requesting for ${selectedService.title}`);
      setDescriptionError("");
    } else {
      setDescription("");
    }
  }, [selectedService]);

  useEffect(() => {
    let interval;
    if (otpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && otpSent) {
      setOtpExpired(true);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  useEffect(() => {
    const fetchSeoData = async () => {
      try {
        const res = await axios.get(`${baseUrl}Seometa/page_slug?page_slug=home`);
        if (res.data) {
          setSeoMeta(res.data[0]);
        }
      } catch (error) {
        console.error("Error fetching SEO metadata:", error);
      }
    };

    const fetchInspectionPackages = async () => {
      setPackagesLoading(true);
      try {
        const [response1, response2] = await Promise.all([
          axios.get(`${baseUrl}PlanPackage/GetPlanPackagesByCategoryAndSubCategory?PackageID=174`),
          axios.get(`${baseUrl}PlanPackage/GetPlanPackagesByCategoryAndSubCategory?PackageID=175`),
        ]);

        if (response1.data && response1.data.length > 0) {
          const package1 = response1.data[0];
          setOffer1({
            oldPrice: package1.Serv_Reg_Price ?? null,
            newPrice: package1.Serv_Off_Price ?? null,
            gstPrice: package1.gst_amt || 0,
            gstPercent: package1.gst_p || 0,
            totalPrice: package1.inc_gstamt ?? null,
            packageId: 174,
            packageName: package1.PackageName || DEFAULT_OFFER_1.packageName,
            inspectionIncludes: package1.InspectionIncludes || [],
          });
        }

        if (response2.data && response2.data.length > 0) {
          const package2 = response2.data[0];
          setOffer2({
            oldPrice: package2.Serv_Reg_Price ?? null,
            newPrice: package2.Serv_Off_Price ?? null,
            gstPrice: package2.gst_amt || 0,
            gstPercent: package2.gst_p || 0,
            totalPrice: package2.inc_gstamt ?? null,
            packageId: 175,
            packageName: package2.PackageName || DEFAULT_OFFER_2.packageName,
            inspectionIncludes: package2.InspectionIncludes || [],
          });
        }
      } catch (err) {
        console.error("Failed to fetch inspection packages:", err);
      } finally {
        setPackagesLoading(false);
      }
    };

    fetchSeoData();
    fetchInspectionPackages();
    fetchCompanyInfo();
  }, [baseUrl]);

  const fetchCompanyInfo = async () => {
    try {
      const res = await axios.get("https://dev-api.mycarsbuddy.com/api/CompanyInfo");
      if (res.data?.status && res.data.data) {
        const offerItem = res.data.data.find(item => item.Type === "InspectionOffer");
        setInspectionOfferDesc(offerItem?.Description || "");
      }
    } catch (error) {
      console.error("Failed to fetch company info:", error);
    }
  };
  // ── Fetch saved addresses if user is logged in ──
  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchAddresses = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser) return;

        // Resolve plain integer custID — try AES decrypt first (user.id is encrypted),
        // then fall back to any plain custID fields authHelper may have stored directly.
        let resolvedCustId = null;

        if (storedUser.id) {
          try {
            const bytes = CryptoJS.AES.decrypt(storedUser.id, secretKey);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            if (decrypted && !isNaN(Number(decrypted))) {
              resolvedCustId = decrypted;
            }
          } catch (_) { /* not encrypted — fall through */ }
        }

        // Fallback: some auth helpers store the plain custID directly
        if (!resolvedCustId) {
          resolvedCustId =
            storedUser.custID ||
            storedUser.custId ||
            storedUser.CustID ||
            storedUser.customerId ||
            null;
        }

        console.log("[InspectionPage] fetchAddresses → resolvedCustId:", resolvedCustId);
        if (!resolvedCustId) return;

        const res = await axios.get(
          `${baseUrl}CustomerAddresses/custid?custid=${resolvedCustId}`
        );
        const all = Array.isArray(res.data) ? res.data : [];
        console.log("[InspectionPage] fetchAddresses → addresses:", all);
        setSavedAddresses(all);
        const primary = all.find((a) => a.IsPrimary);
        if (primary) setSelectedAddress(primary);
      } catch (err) {
        console.warn("[InspectionPage] fetchAddresses failed (optional):", err);
      }
    };
    fetchAddresses();
  }, [isLoggedIn, baseUrl, secretKey]);

  const getDeviceId = () => {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem("deviceId", deviceId);
    }
    return deviceId;
  };

  const validateName = (name) => {
    if (!name.trim()) return "Name is required";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) return "Name can only contain letters and spaces";
    return "";
  };

  const validatePhone = (phone) => {
    if (!phone.trim()) return "Mobile number is required";
    if (!/^\d+$/.test(phone)) return "Mobile number must contain only digits";
    if (!/^[6-9]/.test(phone)) return "Mobile number must start with 6, 7, 8, or 9";
    if (phone.length !== 10) return "Mobile number must be exactly 10 digits";
    return "";
  };

  const validateEmail = (value) => {
    if (!value.trim()) return "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) return "Please enter a valid email address";
    return "";
  };

  const validateOTP = (value) => {
    const cleanOtp = value.trim();
    if (!cleanOtp) return "OTP is required";
    if (!/^\d{6}$/.test(cleanOtp)) return "OTP must be exactly 6 digits";
    return "";
  };

  const validateDescription = (value) => {
    if (!value.trim()) return "Description is required";
    if (value.trim().length < 10) return "Description must be at least 10 characters";
    return "";
  };

  const getOfferMeta = (offer) => {
    const [title, subtitle] = (offer.packageName || "").split(" - ");
    return {
      title: title || offer.packageName,
      subtitle: subtitle || "",
    };
  };

  const getGroupedIncludes = (offer) => {
    return (offer.inspectionIncludes || []).reduce((acc, item) => {
      const category = item?.Category || "General";
      const value = item?.Includes?.trim();
      if (!value) return acc;
      if (!acc[category]) acc[category] = [];
      if (!acc[category].includes(value)) acc[category].push(value);
      return acc;
    }, {});
  };

  const groupedOffer1 = getGroupedIncludes(offer1);
  const groupedOffer2 = getGroupedIncludes(offer2);
  const activeOffer = selectedOffer === 1 ? offer1 : offer2;
  const packageColumns = [
    {
      offer: offer1,
      groupedIncludes: groupedOffer1,
      accentClass: "inspection-plan-card--starter",
      buttonClass: "inspection-plan-btn--starter",
    },
    {
      offer: offer2,
      groupedIncludes: groupedOffer2,
      accentClass: "inspection-plan-card--pro",
      buttonClass: "inspection-plan-btn--pro",
    },
  ];

  // Returns address fields
  const getAddressPayload = () => {
    if (!selectedAddress) return { city: null, longitude: null, latitude: null, addressId: null };
    if (selectedAddress.AddressID === "__other__") {
      const parts = [manualAddress.line1, manualAddress.line2, manualAddress.city, manualAddress.state, manualAddress.pincode].filter(Boolean).join(", ");
      return { city: parts || null, longitude: null, latitude: null, addressId: null };
    }
    return {
      city: selectedAddress.AddressLine1 || null,
      longitude: selectedAddress.Longitude ?? null,
      latitude: selectedAddress.Latitude ?? null,
      addressId: selectedAddress.AddressID ?? null,
    };
  };

  // Address is required whenever saved addresses are available
  const validateAddress = () => {
    if (savedAddresses.length === 0) return ""; // no addresses fetched → skip
    if (!selectedAddress) return "Please select a service address to continue.";
    if (selectedAddress.AddressID === "__other__" && !manualAddress.line1.trim())
      return "Please enter at least Address Line 1.";
    return "";
  };

  const buildLeadPayload = (withInspection, offerIndexOverride, leadIdOverride = null) => {
    const resolvedOffer = offerIndexOverride === 1 ? offer1 : offerIndexOverride === 2 ? offer2 : (selectedOffer === 1 ? offer1 : offer2);
    const selectedOfferData = resolvedOffer;
    const services = [];
    const selectedCarPayload = getSelectedCarPayload();

    if (withInspection) {
      services.push({
        serviceId: selectedOfferData.packageId,
        serviceName: selectedOfferData.packageName,
        serviceType: "Inspection",
        isUserClicked: true,
        price: (selectedOfferData.newPrice + selectedOfferData.gstPrice),
        gstPrice: selectedOfferData.gstPrice,
        gstPercent: selectedOfferData.gstPercent,
        totalPrice: selectedOfferData.newPrice,
        isInspection: true,
      });
    } else {
      services.push({
        serviceId: serviceIdCollect || 0,
        serviceName: selectedService?.title || "N/A",
        serviceType: serviceTypeDetail || "N/A",
        price: 0,
        isInspection: false,
      });
    }

    return {
      fullName,
      phoneNumber: identifier,
      email: email || user?.email || "",
      description: withInspection
        ? `Rs.${selectedOfferData.newPrice + selectedOfferData.gstPrice} - ${selectedOfferData.packageName} `
        : `${selectedService?.title || "Service"} - ${description || "No description provided"}`,
      platform: "Web",
      type: withInspection ? "online" : "cos",
      amount: selectedOfferData.newPrice + selectedOfferData.gstPrice,
      gstPrice: selectedOfferData.gstPrice,
      gstPercent: selectedOfferData.gstPercent,
      totalPrice: (selectedOfferData.newPrice + selectedOfferData.gstPrice),
      ...selectedCarPayload,
      services,
      leadId: leadIdOverride ?? leadId,
      ...getAddressPayload(),
    };
  };

  const handlePayment = async (offerIndexOverride) => {
    try {
      const leadPayload = buildLeadPayload(true, offerIndexOverride);
      console.log("PayLOadddd----", leadPayload);

      const bytes = CryptoJS.AES.decrypt(user?.id || "", secretKey);
      const decryptedCustId = bytes.toString(CryptoJS.enc.Utf8);

      if (user?.name === "GUEST") {
        try {
          const formDataToSend = new FormData();
          formDataToSend.append("custID", decryptedCustId);
          formDataToSend.append("FullName", leadPayload.fullName);
          formDataToSend.append("PhoneNumber", leadPayload.phoneNumber);
          formDataToSend.append("Email", email);
          formDataToSend.append("ProfileImageFile", "");
          formDataToSend.append("IsActive", true);

          await axios.post(`${baseUrl}Customer/update-customer`, formDataToSend, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          const updatedUser = { ...user, email };
          localStorage.setItem("user", JSON.stringify(updatedUser));
        } catch (error) {
          console.error("Guest registration error:", error);
        }
      }

      const res = await axios.post(`${baseUrl}Leads/MultipleLeads`, leadPayload);
      setLeadId(res.data.leadId);
      const orderId = res.data.razorpayOrderID;
      const LeadId = res.data.leadId;
      const razorKey = res.data.razorpayKey;
      const amount = leadPayload.amount;

      const options = {
        key: razorKey,
        amount,
        currency: "INR",
        name: "My Car Buddy",
        description: "Car Inspection Fee",
        order_id: orderId,
        handler: function (response) {
          setPaymentProcessing(true);

          setTimeout(async () => {
            try {
              const confirmRes = await axios.post(`${baseUrl}Leads/confirm-Payment`, {
                LeadId: LeadId,
                amountPaid: amount,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                razorpayOrderId: response.razorpay_order_id,
              });

              if (confirmRes?.data?.success || confirmRes?.status === 200) {
                navigate("/payment-successful");
              } else {
                setPaymentProcessing(false);
                Swal.fire({
                  title: "Payment Failed!",
                  text: "Please try again.",
                  icon: "error",
                  confirmButtonColor: "#0a6264",
                });
              }
            } catch (error) {
              console.error(error);
              setPaymentProcessing(false);
              Swal.fire({
                title: "Payment Failed!",
                text: "Please try again.",
                icon: "error",
                confirmButtonColor: "#0a6264",
              });
            }
          }, 2000);
        },
        prefill: {
          name: fullName,
          email,
          contact: identifier,
        },
        theme: {
          color: "#0a6264",
        },
        modal: {
          ondismiss: () => {
            setPaymentProcessing(false);
            setLoading(false);
            setCurrentStep("offer");
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (response) {
        Swal.fire({
          title: "Payment Failed",
          text: response.error.description || "Something went wrong.",
          icon: "error",
          confirmButtonColor: "#0a6264",
        });
      });

      rzp.open();
    } catch (err) {
      console.error("Payment Order Error:", err);
      Swal.fire("Error", "Unable to initiate payment", "error");
    }
  };

  const normalSubmit = async () => {
    const leadPayload = buildLeadPayload(false);
    const bytes = CryptoJS.AES.decrypt(user?.id || "", secretKey);
    const decryptedCustId = bytes.toString(CryptoJS.enc.Utf8);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("custID", decryptedCustId);
      formDataToSend.append("FullName", leadPayload.fullName);
      formDataToSend.append("PhoneNumber", leadPayload.phoneNumber);
      formDataToSend.append("Email", email);
      formDataToSend.append("ProfileImageFile", "");
      formDataToSend.append("IsActive", true);

      await axios.post(`${baseUrl}Customer/update-customer`, formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const updatedUser = { ...user, email };
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Guest registration error:", error);
    }

    await axios.post(`${baseUrl}Leads/MultipleLeads`, leadPayload);
    window.dispatchEvent(new Event("userProfileUpdated"));

    Swal.fire({
      title: "Thank You!",
      html: `
        <div style="text-align: center; padding: 10px 0;">
          <p style="margin-bottom: 10px; color: #374151;">Your enquiry has been submitted!</p>
          <p style="color: #6b7280; font-size: 14px;">Our support team will reach out to you soon.</p>
        </div>
      `,
      icon: "success",
      confirmButtonColor: "#0a6264",
    });

    navigate(-1);
  };

  const resetOtpState = () => {
    setOtpStep(false);
    setOtp("");
    setOtpError("");
    setOtpSent(false);
    setOtpExpired(false);
    setTimer(60);
  };

  const handlePackagePayNow = (offerIndex) => {
    // Always validate address first (for both logged-in and guest)
    const addrErr = validateAddress();
    if (addrErr) {
      setAddressError(addrErr);
      // Scroll address section into view so user sees the error
      setTimeout(() => {
        document.querySelector(".ip-address-selector")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }
    setAddressError("");
    setSelectedOffer(offerIndex);
    setInspection(true);
    resetOtpState();
    if (isLoggedIn) {
      handlePayment(offerIndex);
      return;
    }
    setCurrentStep("details");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSendOTP = async () => {
    setOtpError("");
    const nameErr = validateName(fullName);
    const phoneErr = validatePhone(identifier);
    const emailErr = validateEmail(email);
    const descErr = inspection ? "" : validateDescription(description);

    setNameError(nameErr);
    setPhoneError(phoneErr);
    setEmailError(emailErr);
    setDescriptionError(descErr);

    if (nameErr || phoneErr || emailErr || descErr) {
      showAlert("Error", nameErr || phoneErr || emailErr || descErr, 3000, "error");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${baseUrl}Auth/send-otp`, {
        loginId: identifier,
        email,
      });
      setOtpSent(true);
      setOtpExpired(false);
      setOtpStep(true);
      setTimer(60);
    } catch (err) {
      console.error("Send OTP Error", err);
      showAlert("Error", "Failed to send OTP", 3000, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (loading || timer > 0) return;
    setOtp("");
    setOtpError("");
    await handleSendOTP();
  };

  const handleVerifyOTP = async () => {
    const otpErr = validateOTP(otp);
    setOtpError(otpErr);

    if (otpErr) {
      showAlert("Error", otpErr, 3000, "error");
      return;
    }

    const deviceId = getDeviceId();
    setLoading(true);
    try {
      const res = await axios.post(`${baseUrl}Auth/verify-otp`, {
        loginId: identifier,
        otp,
        fullName,
        email,
        deviceToken: "web-token",
        deviceId,
      });

      saveUserFromVerifyOtp(res.data, { phone: identifier, name: fullName, email });
      window.dispatchEvent(new Event("userProfileUpdated"));

      setOtpStep(false);
      setOtp("");
      setOtpSent(false);
      setOtpExpired(false);
      if (inspection) {
        setCurrentStep("offer");
        handlePayment();
      } else {
        await normalSubmit();
      }
    } catch (err) {
      console.error("OTP Verify Error", err);
      const message = "Invalid OTP";
      showAlert("Error", message, 3000, "error");
      setOtpError(message);
      setLoading(false);
    }
  };

  const handleLoggedInSubmit = async () => {
    setLoading(true);
    try {
      if (inspection) {
        handlePayment();
      } else {
        await normalSubmit();
      }
    } catch (err) {
      console.error("Logged-in submission error:", err);
      showAlert("Error", inspection ? "Failed to start payment" : "Failed to submit enquiry", 3000, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (isLoggedIn) {
      const nameErr = validateName(fullName);
      const phoneErr = validatePhone(identifier);
      const emailErr = validateEmail(email);
      const descErr = inspection ? "" : validateDescription(description);
      const addrErr = validateAddress();

      setNameError(nameErr);
      setPhoneError(phoneErr);
      setEmailError(emailErr);
      setDescriptionError(descErr);
      setAddressError(addrErr);

      if (nameErr || phoneErr || emailErr || descErr || addrErr) {
        showAlert("Error", nameErr || phoneErr || emailErr || descErr || addrErr, 3000, "error");
        return;
      }

      handleLoggedInSubmit();
      return;
    }

    if (otpStep) {
      handleVerifyOTP();
      return;
    }

    const nameErr = validateName(fullName);
    const phoneErr = validatePhone(identifier);
    const emailErr = validateEmail(email);
    const descErr = inspection ? "" : validateDescription(description);
    const addrErr = validateAddress();

    setNameError(nameErr);
    setPhoneError(phoneErr);
    setEmailError(emailErr);
    setDescriptionError(descErr);
    setAddressError(addrErr);

    if (nameErr || phoneErr || emailErr || descErr || addrErr) {
      showAlert("Error", nameErr || phoneErr || emailErr || descErr || addrErr, 3000, "error");
      return;
    }

    handleSendOTP();
  };

  const handleBack = () => {
    if (backPath && backPath !== location.pathname) {
      navigate(backPath);
      setTimeout(() => {
        if (window.location.pathname === location.pathname) {
          window.location.assign(backPath);
        }
      }, 120);
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    window.location.assign("/");
    navigate("/");
  };

  const handleDetailsBack = () => {
    if (otpStep) {
      resetOtpState();
      return;
    }
    if (currentStep !== "details") {
      setCurrentStep("details");
      return;
    }
    setInspection(true);
    setCurrentStep("offer");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {seoMeta && (
        <Helmet>
          <title>Doorstep Inspection | MyCarBuddy</title>
          <meta
            name="description"
            content={seoMeta.seo_description || "Compare inspection packages and book doorstep car inspection."}
          />
          <meta name="keywords" content={seoMeta.seo_keywords || ""} />
          <link rel="canonical" href="https://mycarbuddy.in/inspection" />
        </Helmet>
      )}

      {active && <Preloader />}

      <HeaderOne />

      {paymentProcessing && (
        <div className="payment-processing-overlay">
          <div className="loader"></div>
          <p className="loading-text">Processing your payment...</p>
        </div>
      )}

      <main className="inspection-page">

        <section className="inspection-page-hero">
          <div className="inspection-page-shell">

            <div
              className={`inspection-page-booking inspection-page-booking--full ip-right-panel ${currentStep === "details" ? "inspection-page-booking--details" : ""
                }`}
            >
              {currentStep === "offer" && (
                <>
                  <div className="ip-card-header">
                    <button type="button" className="ip-card-back-btn" onClick={handleBack}>
                      <FaArrowLeft />
                      <span>Back</span>
                    </button>
                    <div className="ip-card-header-content">
                      <div className="ip-card-header-kicker">
                        <span>Need a Car Check?</span>
                      </div>
                      <h2 className="ip-card-header-title">
                        Book Your <span className="ip-card-header-title-accent">Inspection</span>
                      </h2>
                      <p className="ip-card-header-sub ip-card-header-sub--lead">
                        Premium car inspection, simplified for your schedule.
                      </p>
                      {inspectionOfferDesc && (
                        <p className="ip-card-header-sub ip-card-header-sub--promo">
                          {inspectionOfferDesc}
                        </p>
                      )}
                      {/* <p className="ip-card-header-sub">
                        Choose a package and let our experts inspect your car with confidence.
                      </p> */}
                    </div>
                  </div>

                  <div className="inspection-pricing-board inspection-pricing-board--standalone">
                    {packagesLoading ? (
                      [1, 2].map((item) => (
                        <article key={item} className="inspection-plan-card inspection-plan-card--skeleton" aria-hidden="true">
                          <div className="inspection-plan-top inspection-plan-top--skeleton">
                            <div className="inspection-skeleton inspection-skeleton-pill" />
                            <div className="inspection-skeleton inspection-skeleton-title" />
                            <div className="inspection-skeleton inspection-skeleton-subtitle" />
                            <div className="inspection-skeleton inspection-skeleton-price" />
                          </div>
                          <div className="inspection-plan-action">
                            <div className="inspection-skeleton inspection-skeleton-button" />
                          </div>
                          <div className="inspection-plan-features inspection-plan-features--skeleton">
                            <div className="inspection-skeleton inspection-skeleton-feature-heading" />
                            <div className="inspection-skeleton inspection-skeleton-feature" />
                            <div className="inspection-skeleton inspection-skeleton-feature" />
                            <div className="inspection-skeleton inspection-skeleton-feature" />
                          </div>
                        </article>
                      ))
                    ) : packageColumns.map(({ offer, groupedIncludes, accentClass, buttonClass }, index) => {
                      const meta = getOfferMeta(offer);
                      const categories = Object.entries(groupedIncludes);
                      const saving = offer.oldPrice - offer.totalPrice;

                      return (
                        <article
                          key={offer.packageId}
                          className={`inspection-plan-card ${accentClass}`}
                        >
                          {/* Header: dark gradient band with name, badge, price */}
                          <div className="inspection-plan-top">
                            <div className="inspection-plan-offer-badge">
                              <FaGift />
                              {index === 0 ? " Limited Offer" : " Special Offer"}
                            </div>

                            <div className="inspection-plan-offer-title">
                              <FaCar className="inspection-plan-car-icon" />
                              <span>{meta.title}</span>
                            </div>

                            {meta.subtitle && (
                              <div className="inspection-plan-marquee">
                                <span className="inspection-plan-marquee-text">{meta.subtitle}</span>
                              </div>
                            )}

                            {/* Single price row: strikethrough → final price → saving pill */}
                            <div className="inspection-plan-price-row">
                              <span className="inspection-plan-strike">Rs.{offer.oldPrice}</span>
                              <strong className="inspection-plan-final-price">Rs.{offer.totalPrice}</strong>
                              {saving > 0 && (
                                <span className="inspection-plan-saving-pill">Save Rs.{saving}</span>
                              )}
                            </div>
                          </div>

                          {/* CTA button — right below the header, always visible */}
                          <div className="inspection-plan-action" ref={index === 1 ? payActionsRef : null}>
                            <button
                              type="button"
                              className={`inspection-plan-btn ${buttonClass}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePackagePayNow(index + 1);
                              }}
                            >
                              <FaCreditCard />
                              Pay ₹{offer.totalPrice}
                            </button>
                          </div>

                          {/* Features list */}
                          {categories.length > 0 && (
                            <div className="inspection-plan-features">
                              {categories.map(([category, items]) => (
                                <div key={category} className="inspection-plan-category">
                                  <div className="inspection-plan-category-title">{category}</div>
                                  <div className="inspection-plan-feature-list">
                                    {items.map((item) => (
                                      <div key={`${offer.packageId}-${category}-${item}`} className="inspection-plan-feature-row">
                                        <FaCheckCircle className="inspection-plan-feature-check" />
                                        {item}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </article>
                      );
                    })}

                  </div>

                  <div className="ip-trust">
                    <span>✓ 120K+ Customers</span>
                    <span>✓ 50+ Verified Mechanics</span>
                    <span>✓ Secure Payment</span>
                  </div>
                </>
              )}
              {currentStep === "details" && (
                <>
                  <div className="ip-card-header">
                    <button type="button" className="ip-card-back-btn" onClick={handleDetailsBack}>
                      <FaArrowLeft />
                      <span>Back</span>
                    </button>
                    <div className="ip-card-header-content">
                      <h2 className="ip-card-header-title">{otpStep ? "Verify OTP" : "Your Details"}</h2>
                      <p className="ip-card-header-sub">
                        {otpStep ? `Enter OTP sent to +91 ${identifier}` : "Fill in your details to continue with booking."}
                      </p>
                    </div>
                  </div>

                  <form className="ip-form" onSubmit={handleFormSubmit} noValidate>
                    <div className="ip-row">
                      <div className="ip-form-group half">
                        <label className="ip-label">
                          <FaUser style={{ marginRight: 6 }} />
                          Your Name <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          type="text"
                          className={`ip-input ${nameError ? "bsm-input-error" : ""}`}
                          placeholder="Enter full name"
                          value={fullName}
                          onChange={(e) => {
                            const value = e.target.value
                              ? e.target.value[0].toUpperCase() + e.target.value.slice(1)
                              : "";
                            setFullName(value);
                            setNameError(validateName(value));
                          }}
                        />
                        {nameError && <p className="bsm-helper-text">{nameError}</p>}
                      </div>

                      <div className="ip-form-group half">
                        <label className="ip-label">
                          <FaPhone style={{ marginRight: 6, transform: "scaleX(-1)" }} />
                          Phone Number <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          type="tel"
                          className={`ip-input ${phoneError ? "bsm-input-error" : ""}`}
                          placeholder="10-digit mobile number"
                          value={identifier}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            if (
                              value === "" ||
                              (value.length === 1 && /^[6-9]$/.test(value)) ||
                              (value.length > 1 && value.length <= 10 && /^[6-9]/.test(value[0]))
                            ) {
                              setIdentifier(value);
                              setPhoneError(validatePhone(value));
                            }
                          }}
                          disabled={otpStep}
                        />
                        {phoneError && <p className="bsm-helper-text">{phoneError}</p>}
                      </div>
                    </div>

                    <div className="ip-form-group">
                      <label className="ip-label">
                        <FaEnvelope style={{ marginRight: 6 }} />
                        Email
                      </label>
                      <input
                        type="email"
                        className={`ip-input ${emailError ? "bsm-input-error" : ""}`}
                        placeholder="yourname@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailError(validateEmail(e.target.value));
                        }}
                      />
                      {emailError && <p className="bsm-helper-text">{emailError}</p>}
                    </div>


                    {!inspection && (
                      <div className="ip-form-group">
                        <label className="ip-label">
                          Service Requirement <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <textarea
                          className={`ip-input inspection-page-textarea ${descriptionError ? "bsm-input-error" : ""}`}
                          placeholder="Tell us what service support you need"
                          value={description}
                          onChange={(e) => {
                            setDescription(e.target.value);
                            setDescriptionError(validateDescription(e.target.value));
                          }}
                          rows={4}
                        />
                        {descriptionError && <p className="bsm-helper-text">{descriptionError}</p>}
                      </div>
                    )}


                    {otpStep && (
                      <div className="ip-otp-section">
                        <div className="ip-otp-header">
                          <span className="ip-otp-label">Enter OTP Code</span>
                          <div className="ip-otp-controls">
                            {timer > 0 ? (
                              <span className="ip-otp-timer">
                                Resend in <strong>{timer}s</strong>
                              </span>
                            ) : (
                              <span className="ip-otp-expired">OTP expired</span>
                            )}
                            <button
                              type="button"
                              className="ip-otp-resend"
                              onClick={handleResendOTP}
                              disabled={loading || timer > 0}
                            >
                              <FaRedo style={{ marginRight: 4 }} />
                              {loading && otpStep ? "Sending..." : "Resend OTP"}
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          className={`ip-otp-input ${otpError ? "bsm-input-error" : ""}`}
                          placeholder="• • • • • •"
                          value={otp}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                            setOtp(value);
                            setOtpError(value.length === 6 ? "" : "OTP must be exactly 6 digits");
                          }}
                          maxLength={6}
                          autoFocus
                        />
                        {otpError && <p className="bsm-helper-text">{otpError}</p>}
                      </div>
                    )}

                    <div className="ip-form-actions">
                      <button
                        type="submit"
                        className="ip-btn ip-btn-primary"
                        disabled={loading || (otpStep && (otpExpired || otp.length !== 6))}
                      >
                        <span className={loading ? "ip-text-blur" : ""}>
                          {loading ? (
                            otpStep ? "Verifying..." : "Sending OTP..."
                          ) : otpStep ? (
                            <>
                              {inspection ? `Verify & Pay Rs.${activeOffer.totalPrice}` : "Verify & Submit Enquiry"}
                              <FaArrowRight className="ip-btn-arrow" />
                            </>
                          ) : (
                            <>
                              Get OTP
                              <FaArrowRight className="ip-btn-arrow" />
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                    <div className="ip-trust ip-trust--after-actions">
                      <span>✓ Secure & Private</span>
                      <span>✓ No Spam Calls</span>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── Address Selector ── */}
        {savedAddresses.length > 0 && (
          <div className="ip-address-selector">
            <div className="ip-address-selector__label">
              <span>📍 Service Address <span style={{ color: "#ef4444" }}>*</span></span>
              <span className="ip-address-selector__label-line" />
              <span style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>Select where our technician should visit</span>
            </div>

            {/* Error banner — always visible when set */}
            {addressError && (
              <div className="ip-address-error-banner">
                <span>⚠️ {addressError}</span>
              </div>
            )}

            <div className="ip-address-list">
              {savedAddresses.map((addr) => {
                const isSelected = selectedAddress?.AddressID === addr.AddressID;
                const title = (addr.AddressLine1 || "").split("\n")[0];
                const rest = [
                  addr.AddressLine1?.includes("\n") && addr.AddressLine1.split("\n").slice(1).join(", "),
                  addr.AddressLine2,
                  addr.CityName,
                  addr.StateName,
                  addr.Pincode,
                ].filter(Boolean).join(", ");
                return (
                  <button
                    key={addr.AddressID}
                    type="button"
                    className={`ip-address-card ${isSelected ? "ip-address-card--selected" : ""} ${addressError && !selectedAddress ? "ip-address-card--highlight-error" : ""}`}
                    onClick={() => { setSelectedAddress(addr); setAddressError(""); }}
                  >
                    <span className="ip-address-card__left">
                      <span className="ip-address-card__icon">🏠</span>
                      <span className="ip-address-card__body">
                        <span className="ip-address-card__title">{title}</span>
                        {rest && <span className="ip-address-card__sub">{rest}</span>}
                        {addr.IsPrimary && <span className="ip-address-card__badge">Primary</span>}
                      </span>
                    </span>
                    {isSelected && <span className="ip-address-card__tick">✓</span>}
                  </button>
                );
              })}

              {/* Other option */}
              <button
                type="button"
                className={`ip-address-card ip-address-card--other ${selectedAddress?.AddressID === "__other__" ? "ip-address-card--selected" : ""}`}
                onClick={() => {
                  setSelectedAddress(OTHER_ADDRESS);
                  setAddressError("");
                  setManualAddress({ line1: "", line2: "", city: "", state: "", pincode: "" });
                }}
              >
                <span className="ip-address-card__left">
                  <span className="ip-address-card__icon">✏️</span>
                  <span className="ip-address-card__body">
                    <span className="ip-address-card__title">Other</span>
                    <span className="ip-address-card__sub">Enter a different address</span>
                  </span>
                </span>
                {selectedAddress?.AddressID === "__other__" && <span className="ip-address-card__tick">✓</span>}
              </button>
            </div>

            {/* Manual address fields — shown when Other is selected */}
            {selectedAddress?.AddressID === "__other__" && (
              <div className="ip-manual-address">
                <input
                  type="text"
                  className={`ip-input${addressError && !manualAddress.line1.trim() ? " bsm-input-error" : ""}`}
                  placeholder="Address Line 1 *"
                  value={manualAddress.line1}
                  onChange={(e) => { setManualAddress((p) => ({ ...p, line1: e.target.value })); if (e.target.value.trim()) setAddressError(""); }}
                />
                <input
                  type="text"
                  className="ip-input"
                  placeholder="Address Line 2"
                  value={manualAddress.line2}
                  onChange={(e) => setManualAddress((p) => ({ ...p, line2: e.target.value }))}
                />
                <div className="ip-row" style={{ gap: 10 }}>
                  <input
                    type="text"
                    className="ip-input"
                    placeholder="City"
                    value={manualAddress.city}
                    onChange={(e) => setManualAddress((p) => ({ ...p, city: e.target.value }))}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="text"
                    className="ip-input"
                    placeholder="State"
                    value={manualAddress.state}
                    onChange={(e) => setManualAddress((p) => ({ ...p, state: e.target.value }))}
                    style={{ flex: 1 }}
                  />
                </div>
                <input
                  type="text"
                  className="ip-input"
                  placeholder="Pincode"
                  value={manualAddress.pincode}
                  onChange={(e) => setManualAddress((p) => ({ ...p, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                />
              </div>
            )}
          </div>
        )}

        <section className="inspection-benefits-section">
          <div className="inspection-page-shell">
            <div className="inspection-benefits-showcase">
              <div className="inspection-benefits-copy">
                <div className="inspection-benefits-kicker">Why Book With MyCarBuddy</div>
                <div className="inspection-benefits-heading-row">
                  <div className="inspection-benefits-icon">
                    <FaCarSide />
                  </div>
                  <div>
                    <h2 className="inspection-benefits-title">Doorstep Car Inspection</h2>
                    <p className="inspection-benefits-subtitle">
                      A cleaner, faster way to compare inspection packages and book with confidence from your home.
                    </p>
                  </div>
                </div>

                <div className="inspection-benefits-highlights">
                  <div className="inspection-highlight-card">
                    <strong>120K+</strong>
                    <span>customers served across service bookings</span>
                  </div>
                  <div className="inspection-highlight-card">
                    <strong>30-45 min</strong>
                    <span>typical doorstep inspection visit</span>
                  </div>
                  <div className="inspection-highlight-card">
                    <strong>2 plans</strong>
                    <span>easy side-by-side package comparison</span>
                  </div>
                </div>
              </div>

              <div className="inspection-benefits-grid">
                <div className="inspection-benefit-card">
                  <FaCheckCircle />
                  <div>
                    <h3>Trusted inspection review</h3>
                    <p>Get a structured checkup with practical findings you can actually use.</p>
                  </div>
                </div>
                <div className="inspection-benefit-card">
                  <FaCheckCircle />
                  <div>
                    <h3>Transparent diagnosis</h3>
                    <p>Understand the condition of your car with clear observations and expert recommendations.</p>
                  </div>
                </div>
                <div className="inspection-benefit-card">
                  <FaCheckCircle />
                  <div>
                    <h3>Convenient doorstep visit</h3>
                    <p>Skip workshop hassle and get your inspection done at your preferred location.</p>
                  </div>
                </div>
                <div className="inspection-benefit-card">
                  <FaCheckCircle />
                  <div>
                    <h3>Right plan for your car</h3>
                    <p>Compare both packages in one place and choose the option that fits your car category.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky Pay Bar — shown on offer step when Pay buttons scroll out of view */}
      {currentStep === "offer" && (
        <div className={`inspection-sticky-bar ${showStickyBar ? "inspection-sticky-bar--visible" : ""}`}>
          <div className="inspection-sticky-bar__inner">
            <div className="inspection-sticky-bar__plans">
              <div className="inspection-sticky-bar__plan">
                <span className="inspection-sticky-bar__plan-name">
                  <FaCar className="inspection-sticky-bar__car-icon" />
                  {offer1.packageName}
                </span>
                <div className="inspection-sticky-bar__price-group">
                  <span className="inspection-sticky-bar__old-price">₹{offer1.oldPrice}</span>
                  <strong className="inspection-sticky-bar__new-price">₹{offer1.totalPrice}</strong>
                </div>
                <button
                  type="button"
                  className="inspection-sticky-bar__btn inspection-sticky-bar__btn--pro"
                  onClick={() => { handlePackagePayNow(1); }}
                >
                  <FaCreditCard />
                  Pay ₹{offer1.totalPrice}
                </button>
              </div>

              <div className="inspection-sticky-bar__divider" />

              <div className="inspection-sticky-bar__plan">
                <span className="inspection-sticky-bar__plan-name">
                  <FaCar className="inspection-sticky-bar__car-icon" />
                  {offer2.packageName}
                </span>
                <div className="inspection-sticky-bar__price-group">
                  <span className="inspection-sticky-bar__old-price">₹{offer2.oldPrice}</span>
                  <strong className="inspection-sticky-bar__new-price">₹{offer2.totalPrice}</strong>
                </div>
                <button
                  type="button"
                  className="inspection-sticky-bar__btn inspection-sticky-bar__btn--pro"
                  onClick={() => handlePackagePayNow(2)}
                >
                  <FaCreditCard />
                  Pay ₹{offer2.totalPrice}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <FooterAreaOne />
    </>
  );
};

export default InspectionPage;