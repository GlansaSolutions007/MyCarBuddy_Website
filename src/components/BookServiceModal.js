import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useAlert } from "../context/AlertContext";
import CryptoJS from "crypto-js";
import { v4 as uuidv4 } from "uuid";
import { saveUserFromVerifyOtp } from "../helper/authHelper";
import { getSelectedCarPayload, fetchSavedVehicles } from "../helper/carHelper";
import CarSelectorSection from "./CarSelectorSection";
import {
  FaTimes,
  FaTools,
  FaCheckCircle,
  FaClipboardCheck,
  FaArrowRight,
  FaCreditCard,
  FaUser,
  FaPhone,
  FaComment,
  FaShieldAlt,
  FaRedo,
  FaEnvelope,
  FaGift,
  FaCar
} from "react-icons/fa";
import "./BookServiceModal.css";
import { platform } from "process";
import { useNavigate } from "react-router-dom";

const BookServiceModal = ({ isOpen, onClose, selectedService, serviceTypeDetail, serviceIdCollect, inspectionOnly, startInEnquiry = false, redirectInspectionToPage = false }) => {
  // --- STATES ---
  const [currentStep, setCurrentStep] = useState("inspection"); // "inspection" or "booking"
  const [inspection, setInspection] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [timer, setTimer] = useState(60);
  const [otp, setOtp] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpExpired, setOtpExpired] = useState(false);

  // validation error messages (inline)
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");

  const baseUrl = process.env.REACT_APP_CARBUDDY_BASE_URL;
  const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;
  const { showAlert } = useAlert();
  /** Bumped after OTP verify so `user` / `isLoggedIn` re-read from localStorage without closing the modal */
  const [authTick, setAuthTick] = useState(0);
  const getSessionUser = useCallback(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);
  const user = useMemo(() => getSessionUser(), [getSessionUser, authTick, isOpen]);
  const isLoggedIn = !!(user && user.token);

  const resolveCustIdFromStoredUser = useCallback(
    (storedUser) => {
      if (!storedUser) return null;
      let resolvedCustId = null;
      if (storedUser.id && secretKey) {
        try {
          const bytes = CryptoJS.AES.decrypt(storedUser.id, secretKey);
          const decrypted = bytes.toString(CryptoJS.enc.Utf8);
          if (decrypted && !isNaN(Number(decrypted))) resolvedCustId = decrypted;
        } catch (_) {
          /* not encrypted */
        }
      }
      if (!resolvedCustId) {
        resolvedCustId =
          storedUser.custID || storedUser.custId || storedUser.CustID || storedUser.customerId || null;
      }
      return resolvedCustId;
    },
    [secretKey]
  );

  const fetchCustomerAddresses = useCallback(
    async (storedUser) => {
      const custId = resolveCustIdFromStoredUser(storedUser);
      if (!custId) return [];
      try {
        const res = await axios.get(`${baseUrl}CustomerAddresses/custid?custid=${custId}`);
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        console.warn("[BookServiceModal] fetchCustomerAddresses failed:", err);
        return [];
      }
    },
    [baseUrl, resolveCustIdFromStoredUser]
  );
  const [companyInfo, setCompanyInfo] = useState({ Amount: '' });
  const navigate = useNavigate();
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [offer1, setOffer1] = useState({
    oldPrice: 599,
    newPrice: 399,
    packageId: 174,
    packageName: '5-Seater Car',
    inspectionIncludes: []
  });
  const [offer2, setOffer2] = useState({
    oldPrice: 999,
    newPrice: 699,
    packageId: 175,
    packageName: '7-Seater Car',
    inspectionIncludes: []
  });
  const [selectedOffer, setSelectedOffer] = useState(1); // 1 for offer1, 2 for offer2
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null); // tracks selected tab
  const shouldPreviewPackages = redirectInspectionToPage;

  // ── Address selector state ──
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [useAddress, setUseAddress] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [manualAddress, setManualAddress] = useState({ line1: "", line2: "", city: "", state: "", pincode: "" });
  const OTHER_ADDRESS = { AddressID: "__other__" };

  // ── Car selector state ──
  const [savedVehicles, setSavedVehicles] = useState([]);
  const [selectedCarForBooking, setSelectedCarForBooking] = useState(null);
  const [carError, setCarError] = useState("");

  useEffect(() => {
    if (isLoggedIn) {
      setFullName(user?.name || "");
      setIdentifier(user?.phone || "");
      setEmail(user?.email || "");
    }
  }, [isLoggedIn]);

  const refreshSavedVehicles = useCallback(async () => {
    if (!isLoggedIn) return;
    const sk = process.env.REACT_APP_ENCRYPT_SECRET_KEY;
    const vehicles = await fetchSavedVehicles(baseUrl, sk);
    const active = Array.isArray(vehicles)
      ? vehicles.filter((v) => v.IsActive !== false)
      : [];
    setSavedVehicles(active);
  }, [isLoggedIn, baseUrl]);

  // ── Load saved vehicles when modal opens / login; refetch after Add New Car via onCarChange ──
  useEffect(() => {
    if (!isOpen || !isLoggedIn) return;
    refreshSavedVehicles();
  }, [isOpen, isLoggedIn, refreshSavedVehicles]);

  useEffect(() => {
    const onSelectedCarUpdated = () => {
      if (isOpen && isLoggedIn) refreshSavedVehicles();
    };
    window.addEventListener("selectedCarUpdated", onSelectedCarUpdated);
    return () => window.removeEventListener("selectedCarUpdated", onSelectedCarUpdated);
  }, [isOpen, isLoggedIn, refreshSavedVehicles]);


  // Pre-fill description based on selected service when modal opens
  useEffect(() => {
    if (isOpen && selectedService?.title) {
      const defaultDesc = `Requesting for ${selectedService.title}`;
      setDescription(defaultDesc);
      setDescriptionError("");
    }
  }, [isOpen, selectedService]);

  // console.log(`email is = ${fullName}`);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep("inspection");
      setInspection(false);
      setOtpStep(false);
      setTimer(60);
      setOtp("");
      setIdentifier(isLoggedIn ? user?.phone : "");
      setFullName(isLoggedIn ? user?.name : "");
      setDescription("");
      setOtpSent(false);
      setEmail(isLoggedIn ? user?.email : "");
      // clear any previous validation errors
      setNameError("");
      setPhoneError("");
      setEmailError("");
      setOtpError("");
      setDescriptionError("");
      // reset address selection
      setUseAddress(false);
      setSelectedAddress(null);
      setAddressError("");
      setManualAddress({ line1: "", line2: "", city: "", state: "", pincode: "" });
      setSavedAddresses([]);
      setSavedVehicles([]);
      setSelectedCarForBooking(null);
      setCarError("");
    }
  }, [isOpen, isLoggedIn]);

  useEffect(() => {
    if (!isOpen) return;

    if (startInEnquiry && !inspectionOnly) {
      setInspection(false);
      setCurrentStep("booking");
      setOtpStep(false);
      setOtpSent(false);
      setOtpExpired(false);
      setOtp("");
      setTimer(60);
    } else {
      setCurrentStep("inspection");
      setInspection(false);
    }
  }, [isOpen, startInEnquiry, inspectionOnly]);

  // Timer Logic
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

  const getDeviceId = () => {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem("deviceId", deviceId);
    }
    return deviceId;
  };

  const handleInspectionYes = () => {
    if (redirectInspectionToPage && !inspectionOnly) {
      onClose();
      navigate("/inspection", {
        state: {
          allowEnquiry: true,
          selectedService,
          serviceTypeDetail,
          serviceIdCollect: serviceIdCollect || selectedService?.id || 0,
          backPath: window.location.pathname,
        },
      });
      return;
    }
    setInspection(true);
    setCurrentStep("booking");
  };

  const handleInspectionNo = () => {
    setInspection(false);
    setCurrentStep("booking");
  };

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const response = await axios.get(`${baseUrl}CompanyInfo`);
        const data = response.data.data || [];

        // ✅ filter active records
        const Amount =
          data.find(
            item => item.Type === 'InspectionAmount' && item.IsActive === true
          )?.Description || '';

        setCompanyInfo({ Amount });
      } catch (err) {
        console.error('Failed to fetch company info:', err);
      }
    };

    fetchCompanyInfo();
  }, []);

  useEffect(() => {
    const fetchInspectionPackages = async () => {
      try {
        // Fetch Offer 1 (PackageID=174)
        const response1 = await axios.get(`${baseUrl}PlanPackage/GetPlanPackagesByCategoryAndSubCategory?PackageID=174`);
        if (response1.data && response1.data.length > 0) {
          const package1 = response1.data[0];
          setOffer1({
            oldPrice: package1.Serv_Reg_Price || 599,
            newPrice: package1.Serv_Off_Price || 399,
            gstPrice: package1.gst_amt || 0,
            gstPercent: package1.gst_p || 0,
            totalPrice: package1.inc_gstamt || 399,
            packageId: 174,
            packageName: package1.PackageName || '5-Seater Car',
            inspectionIncludes: package1.InspectionIncludes || []
          });
        }

        // Fetch Offer 2 (PackageID=175)
        const response2 = await axios.get(`${baseUrl}PlanPackage/GetPlanPackagesByCategoryAndSubCategory?PackageID=175`);
        if (response2.data && response2.data.length > 0) {
          const package2 = response2.data[0];
          setOffer2({
            oldPrice: package2.Serv_Reg_Price || 999,
            newPrice: package2.Serv_Off_Price || 699,
            gstPrice: package2.gst_amt || 0,
            gstPercent: package2.gst_p || 0,
            totalPrice: package2.inc_gstamt || 699,
            packageId: 175,
            packageName: package2.PackageName || '7-Seater Car',
            inspectionIncludes: package2.InspectionIncludes || []
          });
        }
      } catch (err) {
        console.error('Failed to fetch inspection packages:', err);
      }
    };
    fetchInspectionPackages();
  }, []);

  // ── Fetch saved addresses when modal opens and user is logged in ──
  useEffect(() => {
    if (!isOpen || !isLoggedIn) return;
    const load = async () => {
      try {
        const storedUser = getSessionUser();
        if (!storedUser) return;
        const all = await fetchCustomerAddresses(storedUser);
        setSavedAddresses(all);
        const primary = all.find((a) => a.IsPrimary);
        if (primary) setSelectedAddress(primary);
      } catch (err) {
        console.warn("[BookServiceModal] fetchAddresses failed (optional):", err);
      }
    };
    load();
  }, [isOpen, isLoggedIn, fetchCustomerAddresses, getSessionUser]);

  // ── Address payload helper ──
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
    if (savedAddresses.length === 0) return ""; // no addresses → skip
    if (!selectedAddress) return "Please select a service address to continue.";
    if (selectedAddress.AddressID === "__other__" && !manualAddress.line1.trim())
      return "Please enter at least Address Line 1.";
    return "";
  };

  // Common function to build lead payload
  const buildLeadPayload = (withInspection) => {
    const services = [];
    // Get the selected inspection offer
    const selectedOfferData = selectedOffer === 1 ? offer1 : offer2;
    // Use state-tracked car so switches via CarSelectorSection are picked up immediately
    const selectedCarPayload =
      isLoggedIn && selectedCarForBooking
        ? getSelectedCarPayload(selectedCarForBooking)
        : {
          registrationNumber: "", vehicleNumber: "", VehicleNumber: "",
          vehicleID: 0, brandID: 0, modelID: 0, fuelTypeID: 0,
          kmDriven: 0, kilometersDriven: 0, yearOfPurchase: 0, YearOfPurchase: 0,
        };

    if (withInspection) {
      // Add inspection service first (the selected package)
      services.push({
        serviceId: selectedOfferData.packageId, // Inspection package ID (174 or 175)
        serviceName: selectedOfferData.packageName,
        serviceType: "Inspection",
        isUserClicked: true,
        price: selectedOfferData.totalPrice,
        gstPrice: selectedOfferData.gstPrice,
        gstPercent: selectedOfferData.gstPercent,
        totalPrice: selectedOfferData.newPrice,
        isInspection: true
      });

    } else {
      // Without inspection - only send the selected service
      services.push({
        serviceId: serviceIdCollect || 0,
        serviceName: selectedService?.title || "N/A",
        serviceType: serviceTypeDetail || "N/A",
        price: 0,
        isInspection: false
      });
    }

    return {
      fullName,
      phoneNumber: identifier,
      email: email || getSessionUser()?.email || "",
      description: description || "No description provided",
      platform: "Web",
      type: withInspection ? "online" : "cos",
      amount: selectedOfferData.totalPrice,
      gstPrice: selectedOfferData.gstPrice,
      gstPercent: selectedOfferData.gstPercent,
      totalPrice: selectedOfferData.totalPrice,
      ...selectedCarPayload,
      // description: `Doorstep Car Inspection Offer - ${selectedOfferData.packageName} - ₹${selectedOfferData.newPrice}`,
      // description: `${selectedOfferData.packageName} - ${description || "No description provided"}`,
      description: withInspection
        ? `${selectedOfferData.packageName} - ${description || "No description provided"}`
        : `${selectedService?.title || "Service"} - ${description || "No description provided"}`,
      services,
      ...getAddressPayload(),
    };
  };

  const handlePayment = async () => {
    try {
      // 1️⃣ First create order by calling backend
      const leadPayload = buildLeadPayload(true); // true = with inspection

      // Update guest user details if needed
      const sessionUser = getSessionUser();
      const bytes = CryptoJS.AES.decrypt(sessionUser?.id || "", secretKey);
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
        const updatedUser = { ...sessionUser, email: email };
        localStorage.setItem("user", JSON.stringify(updatedUser));

      } catch (error) {
        console.error("Guest registration error:", error);
      }
      // }

      const res = await axios.post(`${baseUrl}Leads/MultipleLeads`, leadPayload);

      const orderId = res.data.razorpayOrderID;
      const leadId = res.data.leadId;
      const razorKey = res.data.razorpayKey;
      // const amount = res.data.amount * 100; // Razorpay requires paise
      const amount = Math.round(leadPayload.amount); // Razorpay requires paise

      // 2️⃣ Open Razorpay Checkout using backend key & orderID
      const options = {
        key: razorKey,               // Use key from backend
        amount: amount,              // in paise
        currency: "INR",
        name: "My Car Buddy",
        description: "Car Inspection Fee",
        order_id: orderId,           // Razorpay order ID from backend

        handler: function (response) {
          setPaymentProcessing(true);  // <-- show blur + loader instantly

          setTimeout(async () => {
            try {
              const res = await axios.post(
                `${baseUrl}Leads/confirm-Payment`,
                {
                  LeadId: leadId,
                  amountPaid: amount,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  razorpayOrderId: response.razorpay_order_id,
                },
                {
                  headers: {
                    // Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (res?.data?.success || res?.status === 200) {
                navigate("/payment-successful");
              } else {
                setPaymentProcessing(false);
                Swal.fire({
                  title: "Payment Failed!",
                  html: `
                              <div style="text-align: center; padding: 10px 0;">
                                <p style="margin-bottom: 10px; color: #374151;">
                                  Payment failed!
                                </p>
                                <p style="color: #6b7280; font-size: 14px;">
                                  Please try again.
                                </p>
                              </div>
                            `,
                  icon: "error",
                  confirmButtonColor: "#0a6264",
                });
              }
            } catch (error) {
              console.error(error);
              setPaymentProcessing(false);
              Swal.fire({
                title: "Payment Failed!",
                html: `
                              <div style="text-align: center; padding: 10px 0;">
                                <p style="margin-bottom: 10px; color: #374151;">
                                  Payment failed!
                                </p>
                                <p style="color: #6b7280; font-size: 14px;">
                                  Please try again.
                                </p>
                              </div>
                            `,
                icon: "error",
                confirmButtonColor: "#0a6264",
              });
            }
          }, 2000); // 2 seconds delay

        },

        prefill: {
          name: fullName,
          email: email,
          contact: identifier,
        },

        theme: {
          color: "#0a6264",
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
    const leadPayload = buildLeadPayload(false); // false = without inspection

    const sessionUser = getSessionUser();
    const bytes = CryptoJS.AES.decrypt(sessionUser?.id || "", secretKey);
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
      const updatedUser = { ...sessionUser, email: email };
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

    onClose();
  };

  const validateName = (name) => {
    if (!name.trim()) return "Name is required";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    if (!/^[a-zA-Z\s]+$/.test(name.trim()))
      return "Name can only contain letters and spaces";
    return ""; // empty string means valid, like SignIn
  };

  const validatePhone = (phone) => {
    if (!phone.trim()) return "Mobile number is required";
    if (!/^\d+$/.test(phone)) return "Mobile number must contain only digits";
    if (!/^[6-9]/.test(phone)) return "Mobile number must start with 6, 7, 8, or 9";
    if (phone.length !== 10) return "Mobile number must be exactly 10 digits";
    return "";
  };

  const validateEmail = (email) => {
    if (!email.trim()) return ""; // optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim()))
      return "Please enter a valid email address";
    return "";
  };

  const validateOTP = (otp) => {
    if (!otp) return "OTP is required";
    if (!/^\d+$/.test(otp)) return "OTP must contain only digits";
    if (otp.length !== 6) return "OTP must be 6 digits";
    return "";
  };

  const validateDescription = (desc) => {
    if (!desc.trim()) return "Description is required";
    if (desc.trim().length < 10) return "Description must be at least 10 characters";
    return "";
  };

  const validateCar = () => {
    if (!isLoggedIn || savedVehicles.length === 0) return "";
    if (!selectedCarForBooking) return "Please select a car to continue.";
    return "";
  };

  const handleSendOTP = async () => {

    // reset previous otp error if any
    setOtpError("");
    const nameErr = validateName(fullName);
    const phoneErr = validatePhone(identifier);
    const emailErr = validateEmail(email);
    const descErr = validateDescription(description);
    const addrErr = validateAddress();
    const carErr = validateCar();

    // set inline errors as well
    setNameError(nameErr);
    setPhoneError(phoneErr);
    setEmailError(emailErr);
    setDescriptionError(descErr);
    setAddressError(addrErr);
    setCarError(carErr);

    if (nameErr || phoneErr || emailErr || descErr || addrErr || carErr) {
      // also notify user via toast for first error
      const first = nameErr || phoneErr || emailErr || descErr || addrErr || carErr;
      showAlert("Error", first, 3000, "error");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${baseUrl}Auth/send-otp`, { loginId: identifier, email });
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

      if (inspection) {
        setAuthTick((t) => t + 1);
        handlePayment();
      } else {
        try {
          // Quick Enquiry: after login, auto-submit only if user has no saved cars and no saved addresses
          const storedUser = getSessionUser();
          const rawVehicles = await fetchSavedVehicles(baseUrl, secretKey);
          const activeVehicles = rawVehicles.filter((v) => v.IsActive !== false);
          const addresses = await fetchCustomerAddresses(storedUser);
          const hasSavedCarOrAddress = activeVehicles.length > 0 || addresses.length > 0;

          if (!hasSavedCarOrAddress) {
            await normalSubmit();
          } else {
            setSavedAddresses(addresses);
            const primaryAddr = addresses.find((a) => a.IsPrimary);
            setSelectedAddress(primaryAddr || null);
            setSavedVehicles(activeVehicles);
            setSelectedCarForBooking(null);
            setOtpStep(false);
            setOtpSent(false);
            setOtp("");
            setOtpError("");
            setOtpExpired(false);
            setTimer(60);
            setAuthTick((t) => t + 1);
          }
        } catch (postErr) {
          console.error("[BookServiceModal] post-login cars/addresses fetch:", postErr);
          showAlert(
            "Warning",
            "Could not load your saved cars or addresses. You can still submit your enquiry.",
            4000,
            "warning"
          );
          setOtpStep(false);
          setOtpSent(false);
          setOtp("");
          setOtpError("");
          setAuthTick((t) => t + 1);
        }
      }
    } catch (err) {
      console.error("OTP Verify Error", err);

      const msg = "Invalid OTP";
      setOtpError(msg);
      showAlert("Error", msg, 3000, "error");

    } finally {
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
      console.error("Logged-in enquiry submit error:", err);
      showAlert("Error", "Failed to submit enquiry", 3000, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (isLoggedIn) {
      // Validate fields before submitting for logged-in users
      const nameErr = validateName(fullName);
      const phoneErr = validatePhone(identifier);
      const emailErr = validateEmail(email);
      const descErr = validateDescription(description);
      const addrErr = validateAddress();
      const carErr = validateCar(); 

      setNameError(nameErr);
      setPhoneError(phoneErr);
      setEmailError(emailErr);
      setDescriptionError(descErr);
      setAddressError(addrErr);
      setCarError(carErr);

      if (nameErr || phoneErr || emailErr || descErr || addrErr || carErr) {
        const firstErr = nameErr || phoneErr || emailErr || descErr || addrErr || carErr;
        showAlert("Error", firstErr, 3000, "error");
        return;
      }

      handleLoggedInSubmit();
    } else {
      otpStep ? handleVerifyOTP() : handleSendOTP();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bsm-overlay" onClick={onClose}>
      {paymentProcessing && (
        <div className="payment-processing-overlay">
          <div className="loader"></div>
          <p className="loading-text">Processing your payment...</p>
        </div>
      )}

      {/* <div className="bsm-modal" onClick={(e) => e.stopPropagation()}> */}
      <div className={`bsm-modal ${inspectionOnly ? "is-inspection-only" : ""}`} onClick={(e) => e.stopPropagation()}>

        {/* Close Button */}
        <button className="bsm-close-btn" onClick={onClose}>
          <FaTimes />
        </button>

        {/* STEP 1: Inspection Choice */}
        {currentStep === "inspection" && (
          <div className="bsm-content">
            {/* Left Panel */}
            <div className="bsm-left-panel">
              <div className="bsm-left-header">
                <div className="bsm-header-icon">
                  <FaClipboardCheck />
                </div>
                <h2 className="bsm-left-title">Why Inspection?</h2>
                <p className="bsm-left-subtitle">Before we proceed with the service</p>
              </div>

              <div className="bsm-left-benefits">
                <div className="bsm-left-benefit">
                  <FaCheckCircle />
                  {/* <span>50+ Point Health Checkup</span> */}
                  <span>100% Genuine Checkup Review</span>
                </div>
                <div className="bsm-left-benefit">
                  <FaCheckCircle />
                  <span>Transparent Diagnosis</span>
                </div>
                <div className="bsm-left-benefit">
                  <FaCheckCircle />
                  <span>30-45 Mins Quick Inspection</span>
                </div>
                <div className="bsm-left-benefit">
                  <FaCheckCircle />
                  <span>Technician Visits Your Doorstep</span>
                </div>
                <div className="bsm-left-benefit">
                  <FaCheckCircle />
                  <span>Expert Repair Recommendations</span>
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="bsm-right-panel">
              <div className="bsm-right-header">
                <h3 className="bsm-title">Inspection Required?</h3>
                <p className="bsm-subtitle">Mandatory step for accurate service</p>
                {shouldPreviewPackages ? (
                  <p className="bsm-subtitle">
                    Compare both inspection packages here. You will choose the best-fit plan on the next page before payment.
                  </p>
                ) : (
                  <p className="bsm-subtitle">Select your car category to choose the right plan</p>
                )}
              </div>

              {shouldPreviewPackages && (
                <div className="bsm-compare-note">
                  <div className="bsm-compare-note-title">
                    <FaClipboardCheck />
                    Compare plans before you continue
                  </div>
                  <p className="bsm-compare-note-text">
                    Review the starting prices and package coverage below. The next page shows the full side-by-side comparison and lets you select the right package for your car.
                  </p>
                </div>
              )}

              {/* Offer Cards Row */}
              <div className="bsm-offer-row">
                {/* Offer 1 - 5 Seater */}
                <div
                  className={`bsm-offer-card ${shouldPreviewPackages ? 'bsm-offer-card-preview' : selectedOffer === 1 ? 'bsm-offer-card-selected' : 'bsm-offer-card-unselected'}`}
                  onClick={() => {
                    if (shouldPreviewPackages) return;
                    setSelectedOffer(1);
                    setActiveCategory(null);
                  }}
                >
                  {!shouldPreviewPackages && selectedOffer === 1 && (
                    <div className="bsm-selected-checkmark">
                      <FaCheckCircle />
                    </div>
                  )}
                  <div className="bsm-offer-badge">
                    <FaGift /> Limited Offer
                  </div>
                  <div className="bsm-offer-content">
                    <div className="bsm-offer-price">
                      <span className="bsm-price-old">₹{offer1.oldPrice}</span>
                      <span className="bsm-price-new">₹{offer1.totalPrice}</span>
                    </div>
                    <p className="bsm-offer-text">
                      {offer1.packageName?.split(" - ")[0]}
                      <FaCar className="bsm-car-icon" />
                      {offer1.packageName?.includes(" - ") && (
                        <div className="bsm-marquee">
                          <span className="bsm-marquee-text">
                            {offer1.packageName.split(" - ")[1]}
                          </span>
                        </div>
                      )}
                    </p>
                  </div>
                </div>

                {/* Offer 2 - 7 Seater */}
                <div
                  className={`bsm-offer-card ${shouldPreviewPackages ? 'bsm-offer-card-preview' : selectedOffer === 2 ? 'bsm-offer-card-selected' : 'bsm-offer-card-unselected'}`}
                  onClick={() => {
                    if (shouldPreviewPackages) return;
                    setSelectedOffer(2);
                    setActiveCategory(null);
                  }}
                >
                  {!shouldPreviewPackages && selectedOffer === 2 && (
                    <div className="bsm-selected-checkmark">
                      <FaCheckCircle />
                    </div>
                  )}
                  <div className="bsm-offer-badge">
                    <FaGift /> Special Offer
                  </div>
                  <div className="bsm-offer-content">
                    <div className="bsm-offer-price">
                      <span className="bsm-price-old">₹{offer2.oldPrice}</span>
                      <span className="bsm-price-new">₹{offer2.totalPrice}</span>
                    </div>
                    <p className="bsm-offer-text">
                      {offer2.packageName?.split(" - ")[0]}
                      <FaCar className="bsm-car-icon" />
                      {offer2.packageName?.includes(" - ") && (
                        <div className="bsm-marquee">
                          <span className="bsm-marquee-text">
                            {offer2.packageName.split(" - ")[1]}
                          </span>
                        </div>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* What's Included — Toggle Row */}
              {!shouldPreviewPackages && (() => {
                const activeOffer = selectedOffer === 1 ? offer1 : offer2;
                const includes = activeOffer.inspectionIncludes || [];
                if (includes.length === 0) return null;

                const grouped = includes.reduce((acc, item) => {
                  if (!acc[item.Category]) acc[item.Category] = [];
                  acc[item.Category].push(item.Includes);
                  return acc;
                }, {});
                const categories = Object.keys(grouped);
                const resolvedCat = activeCategory && grouped[activeCategory] ? activeCategory : categories[0];
                const visibleItems = grouped[resolvedCat] || [];
                const totalItems = includes.length;

                return (
                  <div className="bsm-includes-wrapper">
                    {/* Toggle header */}
                    <div className="bsm-includes-toggle-row">
                      <span className="bsm-includes-label">See what's covered in this plan</span>
                      <button
                        className={`bsm-includes-toggle-btn ${checklistOpen ? 'bsm-includes-toggle-btn--open' : ''}`}
                        onClick={() => setChecklistOpen(prev => !prev)}
                      >
                        <FaClipboardCheck style={{ fontSize: 11 }} />
                        {checklistOpen ? 'Hide' : "What's included"}
                        <span className={`bsm-includes-chevron ${checklistOpen ? 'bsm-includes-chevron--up' : ''}`}>▾</span>
                      </button>
                    </div>

                    {/* Tabbed panel */}
                    {checklistOpen && (
                      <div className="bsm-includes-panel">
                        {/* Panel header */}
                        <div className="bsm-includes-panel-header">
                          <FaClipboardCheck className="bsm-includes-panel-icon" />
                          <span>Inspection checklist</span>
                          <span className="bsm-includes-count-pill">{totalItems} items</span>
                        </div>

                        {/* Category tabs */}
                        <div className="bsm-includes-tabs">
                          {categories.map(cat => (
                            <button
                              key={cat}
                              className={`bsm-includes-tab ${resolvedCat === cat ? 'bsm-includes-tab--active' : ''}`}
                              onClick={() => setActiveCategory(cat)}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>

                        {/* Items grid */}
                        <div className="bsm-includes-grid">
                          {visibleItems.map((item, i) => (
                            <div key={i} className="bsm-includes-chip">
                              <span className="bsm-includes-dot" />
                              {item}
                            </div>
                          ))}
                        </div>

                        {/* Footer summary */}
                        <div className="bsm-includes-footer">
                          <span>Showing {visibleItems.length} of {totalItems} items</span>
                          <span className="bsm-includes-footer-cat">{resolvedCat}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Actions */}
              <div className="bsm-actions">
                <button className="bsm-btn bsm-btn-primary" onClick={handleInspectionYes}>
                  <FaCreditCard />
                  Book Inspection
                  <FaArrowRight className="bsm-btn-arrow" />
                </button>
              </div>

              {!inspectionOnly && (
                <>
                  {/* Separator Line */}
                  <div className="bsm-path-separator">
                    <span>OR</span>
                  </div>

                  {/* Bottom Enquiry Section */}
                  <div className="bsm-enquiry-section">
                    <div className="bsm-enquiry-header">
                      {/* <h4 className="bsm-enquiry-title">Not ready to book yet?</h4> */}
                      <p className="bsm-enquiry-text">Get service details for your requirement</p>
                    </div>

                    <button className="bsm-btn bsm-btn-secondary" onClick={handleInspectionNo}>
                      Enquiry for Service
                      <FaArrowRight className="bsm-btn-arrow" />
                    </button>
                  </div>
                </>
              )}

              {/* Trust */}
              <div className="bsm-trust">
                <span>✓ 120K+ Customers</span>
                <span>✓ 50+ Verified Mechanics</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Booking Form */}
        {currentStep === "booking" && (
          <div className="bsm-content">
            {/* Left Panel */}
            <div className="bsm-left-panel">
              <div className="bsm-left-header">
                <div className="bsm-header-icon">
                  <FaTools />
                </div>
                <h2 className="bsm-left-title">
                  {inspection ? "Book Inspection" : "Quick Enquiry"}
                </h2>
                <p className="bsm-left-subtitle">
                  {inspection
                    ? `Pay ₹${selectedOffer === 1 ? offer1.totalPrice : offer2.totalPrice} & book your slot`
                    : "We'll get back to you soon"}
                </p>
              </div>

              <div className="bsm-left-benefits">
                <div className="bsm-left-benefit">
                  <FaCheckCircle />
                  <span>100% Secure Payment</span>
                </div>
                <div className="bsm-left-benefit">
                  <FaCheckCircle />
                  <span>Expert Technicians</span>
                </div>
                <div className="bsm-left-benefit">
                  <FaCheckCircle />
                  <span>Doorstep Service</span>
                </div>
                <div className="bsm-left-benefit">
                  <FaCheckCircle />
                  <span>Transparent Pricing</span>
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="bsm-right-panel">
              <div className="bsm-right-header">
                <h3 className="bsm-title">
                  {otpStep ? "Verify OTP" : "Your Details"}
                </h3>
                <p className="bsm-subtitle">
                  {otpStep
                    ? `Enter OTP sent to +91 ${identifier}`
                    : "Fill in your information"}
                </p>
                {selectedService?.title && (
                  <span className="bsm-service-badge">
                    {selectedService.title}
                  </span>
                )}
              </div>

              <form className="bsm-form" onSubmit={handleFormSubmit} noValidate>
                {/* Name & Phone Row */}
                <div className="bsm-form-row">
                  <div className="bsm-form-group">
                    <label className="bsm-label">
                      <FaUser style={{ marginRight: 6 }} />
                      Your Name <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="text"
                      className={`bsm-input ${nameError ? 'bsm-input-error' : ''}`}
                      placeholder="Enter full name"
                      value={fullName}
                      onChange={(e) => {
                        const v = e.target.value
                          ? e.target.value[0].toUpperCase() + e.target.value.slice(1)
                          : "";
                        setFullName(v);
                        setNameError(validateName(v));
                      }}
                      required
                    />
                    {nameError && <p className="bsm-helper-text">{nameError}</p>}
                  </div>
                  <div className="bsm-form-group">
                    <label className="bsm-label">
                      <FaPhone style={{ marginRight: 6, transform: "scaleX(-1)" }} />
                      Phone Number <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="tel"
                      className={`bsm-input ${phoneError ? 'bsm-input-error' : ''}`}
                      placeholder="10-digit mobile"
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
                      disabled={isLoggedIn || otpStep}
                      required
                    />
                    {phoneError && <p className="bsm-helper-text">{phoneError}</p>}
                  </div>
                  <div className="bsm-form-group full-width">
                    <label className="bsm-label">
                      <FaEnvelope style={{ marginRight: 6 }} />
                      Email
                    </label>
                    <input
                      type="email"
                      className={`bsm-input ${emailError ? 'bsm-input-error' : ''}`}
                      placeholder="yourname@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError(validateEmail(e.target.value));
                      }}
                      // disabled={isLoggedIn || otpStep}
                      required
                    />
                    {emailError && <p className="bsm-helper-text">{emailError}</p>}
                  </div>
                </div>

                {/* Car Selector — logged-in users (list refetches after Add New Car) */}
                {isLoggedIn && (
                  <CarSelectorSection
                    savedVehicles={savedVehicles}
                    selectedCar={selectedCarForBooking}
                    onCarChange={(car) => {
                      setSelectedCarForBooking(car);
                      setCarError("");
                    }}
                    onVehiclesMutated={refreshSavedVehicles}
                    imageBaseURL={process.env.REACT_APP_CARBUDDY_IMAGE_URL || ""}
                    error={carError}
                    variant="bsm"
                  />
                )}

                {/* Address Selector — shown for enquiry when user has saved addresses */}
                {!inspection && savedAddresses.length > 0 && (
                  <div className="bsm-address-selector">
                    <div className="bsm-address-selector__label">
                      <span>📍 Service Address <span style={{ color: "#ef4444" }}>*</span></span>
                      <span style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 400 }}>Select where our technician should visit</span>
                    </div>

                    {/* Error banner */}
                    {addressError && (
                      <div className="bsm-address-error-banner">
                        <span>⚠️ {addressError}</span>
                      </div>
                    )}

                    <div className="bsm-address-list">
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
                            className={`bsm-address-card ${isSelected ? "bsm-address-card--selected" : ""}`}
                            onClick={() => { setSelectedAddress(addr); setAddressError(""); }}
                          >
                            <span className="bsm-address-card__left">
                              <span className="bsm-address-card__icon">🏠</span>
                              <span className="bsm-address-card__body">
                                <span className="bsm-address-card__title">{title}</span>
                                {rest && <span className="bsm-address-card__sub">{rest}</span>}
                                {addr.IsPrimary && <span className="bsm-address-card__badge">Primary</span>}
                              </span>
                            </span>
                            {isSelected && <span className="bsm-address-card__tick">✓</span>}
                          </button>
                        );
                      })}

                      {/* Other option */}
                      <button
                        type="button"
                        className={`bsm-address-card bsm-address-card--other ${selectedAddress?.AddressID === "__other__" ? "bsm-address-card--selected" : ""}`}
                        onClick={() => {
                          setSelectedAddress(OTHER_ADDRESS);
                          setAddressError("");
                          setManualAddress({ line1: "", line2: "", city: "", state: "", pincode: "" });
                        }}
                      >
                        <span className="bsm-address-card__left">
                          <span className="bsm-address-card__icon">✏️</span>
                          <span className="bsm-address-card__body">
                            <span className="bsm-address-card__title">Other</span>
                            <span className="bsm-address-card__sub">Enter a different address</span>
                          </span>
                        </span>
                        {selectedAddress?.AddressID === "__other__" && <span className="bsm-address-card__tick">✓</span>}
                      </button>
                    </div>

                    {/* Manual address fields — shown when Other is selected */}
                    {selectedAddress?.AddressID === "__other__" && (
                      <div className="bsm-manual-address">
                        <input
                          type="text"
                          className={`bsm-input${addressError && !manualAddress.line1.trim() ? " bsm-input-error" : ""}`}
                          placeholder="Address Line 1 *"
                          value={manualAddress.line1}
                          onChange={(e) => { setManualAddress((p) => ({ ...p, line1: e.target.value })); if (e.target.value.trim()) setAddressError(""); }}
                        />
                        <input
                          type="text"
                          className="bsm-input"
                          placeholder="Address Line 2"
                          value={manualAddress.line2}
                          onChange={(e) => setManualAddress((p) => ({ ...p, line2: e.target.value }))}
                        />
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input
                            type="text"
                            className="bsm-input"
                            placeholder="City"
                            style={{ flex: 1 }}
                            value={manualAddress.city}
                            onChange={(e) => setManualAddress((p) => ({ ...p, city: e.target.value }))}
                          />
                          <input
                            type="text"
                            className="bsm-input"
                            placeholder="State"
                            style={{ flex: 1 }}
                            value={manualAddress.state}
                            onChange={(e) => setManualAddress((p) => ({ ...p, state: e.target.value }))}
                          />
                        </div>
                        <input
                          type="text"
                          className="bsm-input"
                          placeholder="Pincode"
                          value={manualAddress.pincode}
                          onChange={(e) => setManualAddress((p) => ({ ...p, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Message */}
                <div className="bsm-form-group">
                  <label className="bsm-label">
                    <FaComment style={{ marginRight: 6 }} />
                    What are you looking for? <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <textarea
                    className={`bsm-textarea ${descriptionError ? 'bsm-input-error' : ''}`}
                    placeholder="Describe your car issue..."
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setDescriptionError(validateDescription(e.target.value));
                    }}
                    disabled={otpStep}
                    required
                  />
                  {descriptionError && <p className="bsm-helper-text">{descriptionError}</p>}
                </div>

                {/* OTP Section */}
                {!isLoggedIn && otpStep && (
                  <div className="bsm-otp-section">
                    <div className="bsm-otp-header">
                      <span className="bsm-otp-label">Enter OTP Code</span>
                      {timer > 0 ? (
                        <span className="bsm-otp-timer">
                          Expires in <strong>{timer}s</strong>
                        </span>
                      ) : (
                        <span className="bsm-otp-expired">
                          Expired -
                          <button
                            type="button"
                            className="bsm-otp-resend"
                            onClick={handleSendOTP}
                          >
                            <FaRedo style={{ marginRight: 4 }} />
                            Resend
                          </button>
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      className={`bsm-otp-input ${otpError ? 'bsm-input-error' : ''}`}
                      placeholder="• • • • • •"
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setOtp(value);

                        // Show validation only if less than 6 digits
                        if (value.length < 6) {
                          setOtpError("OTP must be 6 digits");
                        } else {
                          setOtpError("");
                        }
                      }}
                      maxLength={6}
                      required
                      autoFocus
                    />
                    {otpError && <p className="bsm-helper-text">{otpError}</p>}
                  </div>
                )}

                {/* Form Actions */}
                <div className="bsm-form-actions">
                  <button
                    type="button"
                    className="bsm-btn bsm-btn-secondary"
                    onClick={() => {
                      if (otpStep) {
                        setOtpStep(false);
                        setOtpError("");
                      } else {
                        setCurrentStep("inspection");
                      }
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="bsm-btn bsm-btn-primary"
                    disabled={loading || (otpStep && otpExpired)}
                  >
                    <span className={loading ? "bsm-text-blur" : ""}>
                      {loading ? (
                        isLoggedIn
                          ? (inspection ? "Processing..." : "Submitting...")
                          : (otpStep ? "Verifying..." : "Sending OTP...")
                      ) : isLoggedIn ? (
                        <>
                          {inspection ? `Pay ₹${selectedOffer === 1 ? offer1.totalPrice : offer2.totalPrice} & Book` : "Submit Enquiry"}
                          <FaArrowRight className="bsm-btn-arrow" />
                        </>
                      ) : otpStep ? (
                        <>
                          {inspection ? `Verify & Pay ₹${selectedOffer === 1 ? offer1.totalPrice : offer2.totalPrice}` : "Verify & Submit"}
                          <FaArrowRight className="bsm-btn-arrow" />
                        </>
                      ) : (
                        <>
                          Get OTP
                          <FaArrowRight className="bsm-btn-arrow" />
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </form>

              {/* Trust */}
              <div className="bsm-trust">
                <span>✓ Secure & Private</span>
                <span>✓ No Spam Calls</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BookServiceModal;