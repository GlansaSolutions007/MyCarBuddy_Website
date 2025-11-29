import React, { useEffect, useMemo, useState } from "react";
import CryptoJS from "crypto-js";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useAlert } from "../context/AlertContext";
import { useCart } from "../context/CartContext";
import Swal from "sweetalert2";
import NewTicket from "./NewTicket";

const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;
const BaseURL = process.env.REACT_APP_CARBUDDY_BASE_URL;
const ImageURL = process.env.REACT_APP_CARBUDDY_IMAGE_URL;

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [visibleCount, setVisibleCount] = useState(3);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const { showAlert } = useAlert();
  const { addToCart, clearCart } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("All"); // All | Active | Completed | Cancelled
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedBookingIds, setExpandedBookingIds] = useState(new Set());
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const bytes = CryptoJS.AES.decrypt(user.id, secretKey);
  const decryptedCustId = bytes.toString(CryptoJS.enc.Utf8);
  const token = user?.token;
  const location = useLocation();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState("");
  const [showCancelSection, setShowCancelSection] = useState(false);
  const [technicianRating, setTechnicianRating] = useState(0);
  const [cancelReasons, setCancelReasons] = useState([]);
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [otherChecked, setOtherChecked] = useState(false);
  const [showFeedbackSection, setShowFeedbackSection] = useState(false);
  const [serviceQuality, setServiceQuality] = useState(0);
  const [feedbackExists, setFeedbackExists] = useState(false);
  const [showResumeForm, setShowResumeForm] = useState(false);
  const [resumeDate, setResumeDate] = useState("");
  const [resumePaymentMethod, setResumePaymentMethod] = useState("");
  const [selectedResumeTimes, setSelectedResumeTimes] = useState([]);
  const [resumeMorningSlots, setResumeMorningSlots] = useState([]);
  const [resumeAfternoonSlots, setResumeAfternoonSlots] = useState([]);
  const [resumeEveningSlots, setResumeEveningSlots] = useState([]);
  const [isSubmittingResume, setIsSubmittingResume] = useState(false);
  const [showPackagesOpen, setShowPackagesOpen] = useState(false);
  const [expandedPackageIdxs, setExpandedPackageIdxs] = useState(new Set());
  const [expandedAddOnIdxs, setExpandedAddOnIdxs] = useState(new Set());
  const [couponList, setCouponList] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponApplied, setCouponApplied] = useState(false);
  const [showCouponPicker, setShowCouponPicker] = useState(false);
  const [isProcessingBookAgain, setIsProcessingBookAgain] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentStatus, setPaymentStatus] = useState(""); // "processing" | "success" | "error"
  const [showRaisedTicketModal, setShowRaisedTicketModal] = useState(false);
  const [ticketDescription, setTicketDescription] = useState("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [isAddOnsOpen, setIsAddOnsOpen] = useState(false);

  const handleBack = () => {
    setSelectedBooking(null);
  };

  const handleRaisedTicket = () => {
    setShowRaisedTicketModal(true);
    setTicketDescription("");
  };

  const handleSubmitTicket = async () => {
    if (!ticketDescription.trim()) {
      showAlert("Please enter a description for the ticket.", "warning");
      return;
    }

    try {
      setIsSubmittingTicket(true);
      const payload = {
        custID: parseInt(decryptedCustId),
        bookingID: selectedBooking.BookingID,
        description: ticketDescription.trim(),
      };

      const response = await axios.post(`${BaseURL}Tickets`, payload, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200 || response.status === 201) {
        showAlert("Ticket raised successfully!", "success");
        setShowRaisedTicketModal(false);
        setTicketDescription("");
      } else {
        showAlert("Failed to raise ticket. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error raising ticket:", error);
      showAlert("Error while raising ticket. Please try again.", "error");
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Add booking packages to cart
  const handleAddBookingToCart = async (booking) => {
    if (!booking?.Packages || booking.Packages.length === 0) {
      showAlert("No packages found in this booking.", "warning");
      return;
    }

    try {
      setIsProcessingBookAgain(true);

      // Clear existing cart first
      clearCart();

      // Add each package to cart
      let addedCount = 0;
      for (const pkg of booking.Packages) {
        const cartItem = {
          id: pkg.PackageID,
          title: pkg.PackageName,
          price: pkg.PackagePrice || 0,
          image: pkg.PackageImage
            ? `${ImageURL}${pkg.PackageImage}`
            : "/assets/img/service-1-1.png",
          category: pkg.CategoryName || "Service",
          subCategory: pkg.SubCategoryName || "",
        };
        addToCart(cartItem);
        addedCount++;
      }

      // showAlert(`Cart cleared and ${addedCount} package(s) added to your cart!`, "success");

      // Redirect to cart page
      setTimeout(() => {
        navigate("/cart");
      }, 1500);
    } catch (error) {
      console.error("Error adding packages to cart:", error);
      showAlert("Failed to add packages to cart. Please try again.", "error");
    } finally {
      setIsProcessingBookAgain(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${BaseURL}Bookings/${decryptedCustId}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "application/json",
        },
      });

      const data = res.data;
      if (Array.isArray(data) && data.length > 0) {
        setBookings(data);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const currentTab = searchParams.get("tab");

    fetchBookings();

    // Add event listener for notificationReceived event
    const handleNotification = () => {
      fetchBookings();
    };
    window.addEventListener("notificationReceived", handleNotification);

    return () => {
      window.removeEventListener("notificationReceived", handleNotification);
    };
  }, []); // 👀 Watch for URL search param changes

  // If URL contains bookingId, auto-select that booking when data is loaded
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const targetId = params.get("bookingId");
      if (!targetId) return;
      if (!Array.isArray(bookings) || bookings.length === 0) return;
      const found = bookings.find(
        (b) =>
          String(b.BookingID) === String(targetId) ||
          String(b.BookingTrackID) === String(targetId)
      );
      if (found) setSelectedBooking(found);
    } catch (_) {
      /* no-op */
    }
  }, [bookings, location.search]);

  // Tab counts
  const { allCount, activeCount, completedCount, cancelledCount } =
    useMemo(() => {
      const all = bookings.length;
      const completed = bookings.filter(
        (b) => b.BookingStatus === "Completed"
      ).length;
      const cancelled = bookings.filter(
        (b) => b.BookingStatus === "Cancelled"
      ).length;
      const active = bookings.filter(
        (b) =>
          !["Completed", "Cancelled", "Failed", "Refunded"].includes(
            b.BookingStatus
          )
      ).length;
      return {
        allCount: all,
        activeCount: active,
        completedCount: completed,
        cancelledCount: cancelled,
      };
    }, [bookings]);

  useEffect(() => {
    // keep legacy statusFilter roughly in sync for any dependent logic
    if (activeTab === "All") setStatusFilter("All");
    else if (activeTab === "Completed") setStatusFilter("Completed");
    else if (activeTab === "Cancelled") setStatusFilter("Cancelled");
    else setStatusFilter("Active");
  }, [activeTab]);

  // Define filteredBookings with tab and search
  const filteredBookings = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return bookings.filter((booking) => {
      const matchesSearch = booking.BookingTrackID?.toString()
        .toLowerCase()
        .includes(q);
      let matchesTab = true;
      if (activeTab === "Completed")
        matchesTab = booking.BookingStatus === "Completed";
      else if (activeTab === "Cancelled")
        matchesTab = booking.BookingStatus === "Cancelled";
      else if (activeTab === "Active")
        matchesTab = !["Completed", "Cancelled", "Failed", "Refunded"].includes(
          booking.BookingStatus
        );
      return matchesSearch && matchesTab;
    });
  }, [bookings, searchTerm, activeTab]);

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = (e) => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      const threshold = 100; // Load more when 100px from bottom

      if (scrollHeight - scrollTop <= clientHeight + threshold) {
        if (visibleCount < filteredBookings.length && !isLoadingMore) {
          setIsLoadingMore(true);
          // Simulate loading delay for better UX
          setTimeout(() => {
            setVisibleCount((prev) => prev + 3);
            setIsLoadingMore(false);
          }, 500);
        }
      }
    };

    const scrollContainer = document.querySelector(
      ".bookings-scroll-container"
    );
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, [visibleCount, filteredBookings.length, isLoadingMore]);

  useEffect(() => {
    const fetchFeedback = async () => {
      if (!selectedBooking) return;

      try {
        const { CustID, TechID, BookingID } = selectedBooking;
        const response = await axios.get(`${BaseURL}Feedback/feedback`, {
          params: {
            custId: CustID,
            techId: TechID,
            bookingId: BookingID,
          },
          headers: {
            Authorization: `Bearer ${user?.token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 200 && response.data) {
          console.log("Feedback data:", response.data[0].ServiceReview);
          setFeedback(response.data[0].ServiceReview || "");
          setTechnicianRating(parseInt(response.data[0].TechRating) || 0);
          setServiceQuality(parseInt(response.data[0].ServiceRating) || 0);
          setFeedbackExists(true);
        }
      } catch (error) {
        console.error("Error fetching existing feedback:", error);
      }
    };

    fetchFeedback();
  }, [selectedBooking]);

  // Request Refund handler
  const handleRequestRefund = async () => {
    if (!selectedBooking) return;
    try {
      const payload = {
        bookingID: selectedBooking.BookingID,
        isRefunded: true,
      };
      const res = await axios.put(`${BaseURL}Payments`, payload, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.status === 200) {
        showAlert("Refund requested successfully.");
        // Optimistically update local state
        setSelectedBooking((prev) =>
          prev
            ? {
                ...prev,
                BookingStatus:
                  prev.BookingStatus === "Cancelled"
                    ? prev.BookingStatus
                    : "Refunded",
                Payments: Array.isArray(prev.Payments)
                  ? [
                      {
                        ...prev.Payments[0],
                        isRefunded: true,
                        IsRefunded1: true,
                        RefundStatus: null,
                      },
                      ...prev.Payments.slice(1),
                    ]
                  : prev.Payments,
              }
            : prev
        );
        setBookings((prev) =>
          prev.map((b) =>
            b.BookingID === selectedBooking.BookingID
              ? {
                  ...b,
                  BookingStatus:
                    b.BookingStatus === "Cancelled"
                      ? b.BookingStatus
                      : "Refunded",
                }
              : b
          )
        );
      } else {
        showAlert("Failed to request refund. Please try again.");
      }
    } catch (err) {
      console.error("Refund request error:", err);
      showAlert("Error while requesting refund. Please try again.");
    }
  };

  // Populate payment method for resume when opening details
  useEffect(() => {
    if (selectedBooking) {
      setResumePaymentMethod(selectedBooking?.paymentMethod || "");
    }
  }, [selectedBooking]);

  // Fetch coupons for Pay Now (full view)
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const response = await axios.get(`${BaseURL}Coupons`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        const now = new Date();
        const formatted = (response.data || [])
          .filter((coupon) => {
            const from = new Date(coupon.ValidFrom);
            const till = new Date(coupon.ValidTill);
            return coupon.Status && from <= now && now <= till;
          })
          .map((coupon) => ({
            id: coupon.CouponID,
            Code: coupon.Code,
            Description: coupon.Description,
            DiscountValue: coupon.DiscountValue,
            DiscountType: coupon.DiscountType,
            MaxDisAmount: coupon.MaxDisAmount,
            MinBookingAmount: coupon.MinBookingAmount,
            validTill: new Date(coupon.ValidTill),
          }));
        setCouponList(formatted);
      } catch (err) {
        console.error("Error fetching coupons (MyBookings)", err);
      }
    };

    fetchCoupons();
  }, [BaseURL, user?.token]);

  const getBookingOriginalTotal = (booking) => {
    const base = Number(booking?.TotalPrice) || 0;
    const gst = Number(booking?.GSTAmount) || 0;
    return base;
  };

  const computeCouponDiscount = (originalTotal) => {
    if (!appliedCoupon) return 0;
    let discount = 0;
    if (appliedCoupon.DiscountType === "percentage") {
      discount = (originalTotal * appliedCoupon.DiscountValue) / 100;
      if (appliedCoupon.MaxDisAmount && discount > appliedCoupon.MaxDisAmount) {
        discount = appliedCoupon.MaxDisAmount;
      }
    } else {
      discount = appliedCoupon.DiscountValue || 0;
    }
    return Math.min(discount, originalTotal);
  };

  const getBookingFinalTotalWithCoupon = (booking) => {
    const original = getBookingOriginalTotal(booking);
    const discount = computeCouponDiscount(original);
    return Math.max(original - discount, 0);
  };

  const handleApplyCouponFullView = (coupon) => {
    const original = getBookingOriginalTotal(selectedBooking || {});
    if ((coupon.MinBookingAmount || 0) > original) {
      showAlert(
        `This coupon requires a minimum booking amount of ₹${coupon.MinBookingAmount}`
      );
      return;
    }
    setAppliedCoupon(coupon);
    setCouponApplied(true);
    setShowCouponPicker(false);
  };

  const handleRemoveCouponFullView = () => {
    setAppliedCoupon(null);
    setCouponApplied(false);
  };

  const handlePayNow = async () => {
    if (!selectedBooking) return;
    try {
      // 1) Ensure backend knows we are paying via Razorpay
      const form = new FormData();
      form.append("BookingTrackID", selectedBooking.BookingTrackID);
      form.append("PaymentMethod", "Razorpay");
      form.append("BookingFrom", "web");

      let finalTotal, gstAmount, couponAmount;

      if (appliedCoupon) {
        // Calculate discount amount
        couponAmount = Number(
          getBookingOriginalTotal(selectedBooking) -
            getBookingFinalTotalWithCoupon(selectedBooking)
        ).toFixed(2);

        // Calculate new base amount after discount
        const discountedBaseAmount =
          getBookingFinalTotalWithCoupon(selectedBooking);

        // Calculate new GST on discounted amount (18%)
        gstAmount = Number((discountedBaseAmount * 0.18).toFixed(2));

        // Final total = discounted base + new GST
        finalTotal = Number((discountedBaseAmount + gstAmount).toFixed(2));

        form.append("CouponAmount", couponAmount);
        form.append("GSTAmount", gstAmount);
        form.append("TotalAmount", discountedBaseAmount);
      } else {
        // No coupon applied, use original amounts
        couponAmount = "0";
        gstAmount = selectedBooking.GSTAmount;
        finalTotal = Number(
          (
            selectedBooking.TotalPrice +
            selectedBooking.GSTAmount -
            selectedBooking.CouponAmount
          ).toFixed(2)
        );

        form.append("CouponAmount", couponAmount);
        form.append("GSTAmount", gstAmount);
        form.append("TotalAmount", selectedBooking.TotalPrice);
      }

      form.append("BookingDate", selectedBooking.BookingDate);
      form.append("TimeSlot", selectedBooking.TimeSlot);
      form.append("Paynowtype", "Paynow");

      const res = await axios.put(`${BaseURL}Bookings/update-booking`, form, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (res.status === 200 || res.status === 201) {
        // Send the calculated final total to Razorpay
        loadRazorpay(finalTotal, res.data);
      } else {
        showAlert("Failed to resume booking. Please try again.");
      }
    } catch (err) {
      console.error("Pay Now error:", err);
      showAlert("Error initiating payment. Please try again.");
    }
  };

  // Fetch TimeSlots for resume form
  const fetchResumeTimeSlots = async (dateStr) => {
    try {
      const res = await axios.get(`${BaseURL}TimeSlot`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      const timeSlots = res.data || [];
      const sorted = timeSlots
        .filter((s) => s?.Status === true)
        .sort((a, b) => a.StartTime.localeCompare(b.StartTime));

      const categorized = { morning: [], afternoon: [], evening: [] };

      const now = new Date();
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const isToday =
        dateStr &&
        new Date(dateStr).toDateString() === twoHoursLater.toDateString();

      sorted.forEach(({ StartTime, EndTime }) => {
        const [sh, sm] = StartTime.split(":").map(Number);
        const [eh, em] = EndTime.split(":").map(Number);

        const startDate = new Date(dateStr);
        startDate.setHours(sh, sm, 0, 0);
        const endDate = new Date(dateStr);
        endDate.setHours(eh, em, 0, 0);
        const isExpired = isToday && startDate <= twoHoursLater;

        const fmt = (d) =>
          d.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
        const label = `${fmt(startDate)} - ${fmt(endDate)}`;

        const slot = { label, disabled: isExpired };
        if (sh < 12) categorized.morning.push(slot);
        else if (sh < 16) categorized.afternoon.push(slot);
        else categorized.evening.push(slot);
      });

      setResumeMorningSlots(categorized.morning);
      setResumeAfternoonSlots(categorized.afternoon);
      setResumeEveningSlots(categorized.evening);
    } catch (err) {
      console.error("Error fetching time slots:", err);
    }
  };

  // Fetch and filter cancel reasons
  const fetchCancelReasons = async () => {
    try {
      const response = await axios.get(`${BaseURL}AfterServiceLeads`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Filter for cancel reasons only
      const cancelReasons = response.data.filter(
        (item) => item.ReasonType === "Cancel" && item.IsActive === true
      );

      setCancelReasons(cancelReasons);
    } catch (error) {
      console.error("Error fetching cancel reasons:", error);
      return [];
    }
  };

  useEffect(() => {
    if (showResumeForm && resumeDate) {
      fetchResumeTimeSlots(resumeDate);
    }
  }, [showResumeForm, resumeDate]);

  const handleOpenResume = () => {
    setShowCancelSection(false);
    setShowResumeForm(true);
    setSelectedResumeTimes([]);
    // Default date to today if empty
    if (!resumeDate) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      setResumeDate(`${yyyy}-${mm}-${dd}`);
    }
  };

  const handleResumeSubmit = async () => {
    if (!selectedBooking) return;
    if (
      !resumeDate ||
      selectedResumeTimes.length === 0 ||
      !resumePaymentMethod
    ) {
      showAlert(
        "Please select date, at least one timeslot and payment method."
      );
      return;
    }

    try {
      setIsSubmittingResume(true);
      const form = new FormData();
      form.append("BookingTrackID", selectedBooking.BookingTrackID);
      form.append("BookingDate", resumeDate);
      form.append("TimeSlot", selectedResumeTimes.join(","));
      form.append("PaymentMethod", resumePaymentMethod);
      form.append("BookingFrom", "web");
      form.append("CouponAmount", selectedBooking.CouponAmount);
      form.append("GSTAmount", selectedBooking.GSTAmount);
      form.append("TotalAmount", selectedBooking.TotalPrice);

      const res = await axios.put(`${BaseURL}Bookings/update-booking`, form, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (res.status === 200 || res.status === 201) {
        // alert("Booking resumed successfully!");

        if (resumePaymentMethod === "razorpay") {
          const finalTotal = (
            selectedBooking.TotalPrice +
            selectedBooking.GSTAmount -
            selectedBooking.CouponAmount
          ).toFixed(2);
          loadRazorpay(finalTotal, res.data);
        } else {
          showAlert(
            "success",
            "Booking resumed successfully!",
            3000,
            "success"
          );
          setShowResumeForm(false);
          setSelectedBooking(null);
          fetchBookings();
        }
      } else {
        showAlert("Failed to resume booking. Please try again.");
      }
    } catch (err) {
      console.error("Error resuming booking:", err);
      showAlert("Error while resuming booking. Please try again.");
    } finally {
      setIsSubmittingResume(false);
    }
  };

  const loadRazorpay = (amount, data) => {
    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY,
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      name: "MyCarBuddy a product by Glansa Solutions Pvt. Ltd.",
      order_id: data?.razorpay?.orderID,
      description: `Payment for ${
        selectedBooking?.BookingTrackID || selectedBooking?.BookingID
      }`,
      image: "/assets/img/MyCarBuddy-Logo1.png",
      handler: function (response) {
        // Wait for 5 seconds before calling confirm-payment (backend settlement time)
        setPaymentStatus("processing");
        setPaymentMessage("Please wait... your booking is being processed.");
        setShowPaymentModal(true);
        setTimeout(async () => {
          try {
            const res = await axios.post(
              `${BaseURL}Bookings/confirm-Payment`,
              {
                bookingID: data.bookingID,
                amountPaid: amount,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                razorpayOrderId: response.razorpay_order_id,
                paymentMode: "Razorpay",
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res?.data?.success || res?.status === 200) {
              setPaymentStatus("success");
              setPaymentMessage("Payment was successful!");
              fetchBookings();
              setShowResumeForm(false);
              // setSelectedResumeTimes([]);
              clearCart();
            } else {
              setPaymentStatus("error");
              setPaymentMessage("Payment failed! Please try again.");
            }
          } catch (error) {
            console.error(error);
            setPaymentStatus("error");
            setPaymentMessage("Payment failed! Please try again.");
          }
        }, 5000);
      },
      prefill: {
        name: selectedBooking?.CustFullName,
        email: selectedBooking?.CustEmail,
        contact: selectedBooking?.CustPhoneNumber,
      },
      theme: { color: "#1890ae" },
      modal: {
        ondismiss: function () {
          setPaymentStatus("error");
          setPaymentMessage("Payment window closed.");
        },
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handleCancel = async (
    bookingId,
    paymentMethod,
    transactionID,
    type,
    Amount
  ) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      const res = await axios.post(
        `${BaseURL}TechnicianTracking/UpdateTechnicianTracking`,
        {
          bookingId: bookingId,
          actionType: type,
        },
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (paymentMethod === "Razorpay" || paymentMethod === "razorpay") {
        showAlert("Refund has been initiated");
        const res_refund = await axios.post(
          `${BaseURL}Refund/Refund`,
          {
            paymentId: transactionID,
            amount: Amount,
          },
          {
            headers: {
              Authorization: `Bearer ${user?.token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (res_refund.status === 200) {
          if (res_refund.data.status === "success") {
            showAlert("Refund has been initiated");
          }
        }
      }

      if (res.status === 200) {
        if (type === "Cancelled") {
          showAlert("Booking has been cancelled");
        }
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
    }
  };

  // New function to handle showing cancel section
  const openCancelModal = () => {
    setShowCancelSection(true);
    setSelectedReason("");
    setOtherReason("");
    setOtherChecked(false);
    fetchCancelReasons();
  };

  // New function to handle submitting cancellation with reason
  const submitCancellation = async () => {
    // Confirm before submitting cancellation
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to cancel this booking?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, cancel it",
      cancelButtonText: "No, keep booking",
    });

    if (!confirm.isConfirmed) {
      return;
    }

    if (!selectedReason && !otherChecked) {
      showAlert(
        "Please select a reason or choose 'Other' and provide a reason."
      );
      return;
    }
    if (otherChecked && !otherReason.trim()) {
      showAlert("Please provide a reason in the text area.");
      return;
    }

    const reasonToSend = otherChecked ? otherReason.trim() : selectedReason;

    try {
      const payload = {
        bookingID: selectedBooking.BookingID,
        cancelledBy: decryptedCustId || "",
        reason: reasonToSend,
        refundStatus: "Pending",
        paymentStatus: selectedBooking.Payments?.[0]?.PaymentStatus || "",
      };

      const response = await axios.post(`${BaseURL}Cancellations`, payload, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        setShowCancelSection(false);

        if (
          selectedBooking.paymentMethod === "Razorpay" ||
          selectedBooking.paymentMethod === "razorpay"
        ) {
          showAlert(
            "Booking cancellation submitted successfully. Please wait for refund."
          );
        } else {
          showAlert("Booking cancellation submitted successfully.");
        }

        //       const res_refund = await axios.post(`${BaseURL}Refund/Refund`, {
        //         paymentId: selectedBooking.TransactionID,
        //         amount: selectedBooking.TotalPrice + selectedBooking.GSTAmount - selectedBooking.CouponAmount
        //       },
        //       {
        //         headers: {
        //           Authorization: `Bearer ${user?.token}`,
        //           "Content-Type": "application/json",
        //         },
        //       }
        //       );

        //       if(res_refund.status === 200 ){
        //         if(res_refund.data.status === 'success'){
        //            setShowCancelSection(false);
        //           showAlert("Refund has been initiated");
        //         }
        //       }
        //   }
        //   else{
        //       setShowCancelSection(false);
        //   }
        setBookings((prevBookings) =>
          prevBookings.map((booking) =>
            booking.BookingID === selectedBooking.BookingID
              ? { ...booking, BookingStatus: "Cancelled" }
              : booking
          )
        );
        setSelectedBooking((prev) => ({ ...prev, BookingStatus: "Cancelled" }));
      } else {
        alert("Failed to submit cancellation. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting cancellation:", error);
      alert("Something went wrong while submitting cancellation.");
    }
  };

  const handleSubmitReview = async (bookingID) => {
    try {
      const payload = {
        bookingID: bookingID,
        custID: selectedBooking.CustID, // from selected booking
        techID: selectedBooking.TechID, // from selected booking
        techReview: "",
        serviceReview: feedback,
        techRating: String(technicianRating), // convert to string
        serviceRating: String(serviceQuality), // convert to string
      };

      const response = await axios.post(`${BaseURL}Feedback`, payload, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        alert("Feedback submitted successfully!");
      } else {
        alert("Failed to submit feedback. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Something went wrong while submitting feedback.");
    }
  };

  const StarRating = ({ rating, onRatingChange }) => {
    return (
      <div className="d-flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => onRatingChange(star)}
            style={{
              cursor: "pointer",
              color: star <= rating ? "gold" : "#ccc",
              fontSize: "1.5rem",
              marginRight: "5px",
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  // Skeleton Loading Component
  const BookingSkeleton = () => {
    return (
      <div
        className="card shadow-sm mb-4 position-relative border-start border-1"
        style={{ animation: "pulse 1.5s ease-in-out infinite" }}
      >
        {/* Header Skeleton */}
        <div
          className="d-flex justify-content-between align-items-start mb-2 p-3"
          style={{ backgroundColor: "#136d6e" }}
        >
          <div>
            <div className="placeholder-glow">
              <span
                className="placeholder col-3 bg-light"
                style={{ height: "12px" }}
              ></span>
            </div>
            <div className="placeholder-glow mt-2">
              <span
                className="placeholder col-4 bg-light"
                style={{ height: "16px" }}
              ></span>
            </div>
          </div>
          <div>
            <div className="placeholder-glow">
              <span
                className="placeholder col-3 bg-light"
                style={{ height: "12px" }}
              ></span>
            </div>
            <div className="placeholder-glow mt-2">
              <span
                className="placeholder col-6 bg-warning"
                style={{ height: "20px" }}
              ></span>
            </div>
          </div>
          <div className="placeholder-glow">
            <span
              className="placeholder col-2 bg-light"
              style={{ height: "32px", width: "60px" }}
            ></span>
          </div>
        </div>

        {/* Timeline Skeleton */}
        <div className="timeline-container p-3">
          <div className="d-flex justify-content-between">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="text-center">
                <div className="placeholder-glow">
                  <span
                    className="placeholder bg-secondary rounded-circle d-block mx-auto"
                    style={{ width: "30px", height: "30px" }}
                  ></span>
                </div>
                <div className="placeholder-glow mt-2">
                  <span
                    className="placeholder col-6 bg-light"
                    style={{ height: "10px" }}
                  ></span>
                </div>
                <div className="placeholder-glow mt-1">
                  <span
                    className="placeholder col-4 bg-light"
                    style={{ height: "8px" }}
                  ></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Info Skeleton */}
        <div className="row g-3 p-3">
          <div className="col-md-4">
            <div className="d-flex align-items-center gap-2">
              <div className="placeholder-glow">
                <span
                  className="placeholder bg-light rounded"
                  style={{ width: "20px", height: "20px" }}
                ></span>
              </div>
              <div className="flex-grow-1">
                <div className="placeholder-glow">
                  <span
                    className="placeholder col-3 bg-light"
                    style={{ height: "10px" }}
                  ></span>
                </div>
                <div className="placeholder-glow mt-1">
                  <span
                    className="placeholder col-4 bg-light"
                    style={{ height: "12px" }}
                  ></span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="d-flex align-items-center gap-2">
              <div className="placeholder-glow">
                <span
                  className="placeholder bg-light rounded"
                  style={{ width: "20px", height: "20px" }}
                ></span>
              </div>
              <div className="flex-grow-1">
                <div className="placeholder-glow">
                  <span
                    className="placeholder col-3 bg-light"
                    style={{ height: "10px" }}
                  ></span>
                </div>
                <div className="placeholder-glow mt-1">
                  <span
                    className="placeholder col-5 bg-light"
                    style={{ height: "12px" }}
                  ></span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="d-flex align-items-center gap-2">
              <div className="placeholder-glow">
                <span
                  className="placeholder bg-light rounded"
                  style={{ width: "20px", height: "20px" }}
                ></span>
              </div>
              <div className="flex-grow-1">
                <div className="placeholder-glow">
                  <span
                    className="placeholder col-3 bg-light"
                    style={{ height: "10px" }}
                  ></span>
                </div>
                <div className="placeholder-glow mt-1">
                  <span
                    className="placeholder col-6 bg-light"
                    style={{ height: "12px" }}
                  ></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container ">
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          .placeholder-glow .placeholder {
            animation: pulse 1.5s ease-in-out infinite;
          }
        `}
      </style>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h6 className="mb-0">My Bookings</h6>
        <button
          className="btn btn-outline-secondary px-4 py-2"
          onClick={() => {
            setShowFilters((s) => !s);
            setSearchTerm("");
            setActiveTab("All");
            setSelectedBooking(null);
            setShowCancelSection(false);
            setShowFeedbackSection(false);
            setShowResumeForm(false);
            setShowPackagesOpen(false);
            setExpandedPackageIdxs(new Set());
            setCouponList([]);
            setAppliedCoupon(null);
            setCouponApplied(false);
            setShowCouponPicker(false);
            setIsProcessingBookAgain(false);
            setShowPaymentModal(false);
            setPaymentMessage("");
            setPaymentStatus("");
            setShowRaisedTicketModal(false);
            setTicketDescription("");
            setIsSubmittingTicket(false);
          }}
        >
          <i className="bi bi-funnel me-1"></i> Filter
        </button>
      </div>

      {showFilters && (
        <div className="d-flex gap-2 mb-2 flex-wrap">
          <button
            className="btn px-4 py-2 shadow-sm"
            style={{
              borderRadius: 999,
              background:
                activeTab === "All"
                  ? "linear-gradient(135deg,#04b1a6d6,#136e6f)"
                  : "#f8f9fa",
              color: activeTab === "All" ? "#fff" : "#495057",
              border: activeTab === "All" ? "none" : "1px solid #e9ecef",
            }}
            onClick={() => setActiveTab("All")}
          >
            <i className="bi bi-grid me-2"></i>All
            <span
              className={`badge ms-2 ${
                activeTab === "All"
                  ? "bg-light text-primary"
                  : "bg-secondary-subtle text-secondary"
              }`}
            >
              {allCount}
            </span>
          </button>
          <button
            className="btn px-4 py-2 shadow-sm"
            style={{
              borderRadius: 999,
              background:
                activeTab === "Active"
                  ? "linear-gradient(135deg,#04b1a6d6,#136e6f)"
                  : "#f8f9fa",
              color: activeTab === "Active" ? "#fff" : "#495057",
              border: activeTab === "Active" ? "none" : "1px solid #e9ecef",
            }}
            onClick={() => setActiveTab("Active")}
          >
            <i className="bi bi-lightning-charge me-2"></i>Active
            <span
              className={`badge ms-2 ${
                activeTab === "Active"
                  ? "bg-light text-primary"
                  : "bg-secondary-subtle text-secondary"
              }`}
            >
              {activeCount}
            </span>
          </button>
          <button
            className="btn px-4 py-2 shadow-sm"
            style={{
              borderRadius: 999,
              background:
                activeTab === "Completed"
                  ? "linear-gradient(135deg,#04b1a6d6,#136e6f)"
                  : "#f8f9fa",
              color: activeTab === "Completed" ? "#fff" : "#495057",
              border: activeTab === "Completed" ? "none" : "1px solid #e9ecef",
            }}
            onClick={() => setActiveTab("Completed")}
          >
            <i className="bi bi-check2-circle me-2"></i>Completed
            <span
              className={`badge ms-2 ${
                activeTab === "Completed"
                  ? "bg-light text-success"
                  : "bg-secondary-subtle text-secondary"
              }`}
            >
              {completedCount}
            </span>
          </button>
          <button
            className="btn px-4 py-2 shadow-sm"
            style={{
              borderRadius: 999,
              background:
                activeTab === "Cancelled"
                  ? "linear-gradient(135deg,#04b1a6d6,#136e6f)"
                  : "#f8f9fa",
              color: activeTab === "Cancelled" ? "#fff" : "#495057",
              border: activeTab === "Cancelled" ? "none" : "1px solid #e9ecef",
            }}
            onClick={() => setActiveTab("Cancelled")}
          >
            <i className="bi bi-x-octagon me-2"></i>Cancelled
            <span
              className={`badge ms-2 ${
                activeTab === "Cancelled"
                  ? "bg-light text-danger"
                  : "bg-secondary-subtle text-secondary"
              }`}
            >
              {cancelledCount}
            </span>
          </button>
        </div>
      )}

      {showFilters && (
        <div className="card card-body mb-3">
          <div className="row g-2 align-items-end">
            <div className="col-md-8">
              <label className="form-label small">
                Search by Booking Track ID
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 123456"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-4 text-end">
              <button
                className="btn btn-outline-secondary px-4 py-2"
                onClick={() => setSearchTerm("")}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {!selectedBooking && (
        <div
          className="bookings-scroll-container"
          style={{ maxHeight: "75vh", overflowY: "auto" }}
        >
          {isLoading ? (
            // Show skeleton loading
            <>
              <BookingSkeleton />
              <BookingSkeleton />
              <BookingSkeleton />
            </>
          ) : Array.isArray(filteredBookings) && filteredBookings.length > 0 ? (
            filteredBookings.slice(0, visibleCount).map((booking) => {
              const tracking = Array.isArray(booking.TechnicianTracking)
                ? booking.TechnicianTracking[0]
                : {};
              const hasServiceStarted = !!tracking?.ServiceStartedAt;

              const statusTimeline = [
                { label: "Booking Created", date: booking.BookingDate },
                ...(booking?.Reschedules?.length
                  ? booking.Reschedules.map((r, index) => ({
                      label: `Rescheduled (${index + 1})`,
                      date: r.NewSchedule,
                      oldDate: r.OldSchedule,
                      reason: r.Reason || null,
                    }))
                  : []),
                { label: "Buddy Assigned", date: booking.TechAssignDate },
                { label: "Buddy Started", date: tracking?.JourneyStartedAt },
                { label: "Buddy Reached", date: tracking?.ReachedAt },
                { label: "Service Started", date: tracking?.ServiceStartedAt },
                { label: "Service Completed", date: tracking?.ServiceEndedAt },
              ];

              return (
                <div key={booking.BookingID} className="card shadow-sm mb-3">
                  <div
                    className="p-3"
                    style={{ borderBottom: "1px solid #eee" }}
                  >
                    <div className="row align-items-center">
                      <div className="col-12 col-md-5">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle bg-primary d-flex align-items-center justify-content-center bg-radial"
                            style={{ width: 40, height: 40, color: "#fff" }}
                          >
                            <i className="bi bi-receipt"></i>
                          </div>
                          <div>
                            <div className="small text-muted">
                              BID :{" "}
                              <span className="fw-bold">
                                #{booking.BookingTrackID} ({" "}
                                {booking.BookingDate
                                  ? new Date(
                                      booking.BookingDate
                                    ).toLocaleDateString("en-GB")
                                  : "N/A"}
                                )
                              </span>
                            </div>
                            <div className="small text-muted"></div>
                          </div>
                        </div>
                      </div>
                      <div className="col-12 col-md-7">
                        <div className="d-flex align-items-center gap-2 justify-content-md-end mt-2 mt-md-0">
                          {/* Status chip */}
                          {booking.Status !== "Completed" &&
                          booking.Status !== "Cancelled" &&
                          booking.Status !== "Failed" ? (
                            <>
                              <div className="text-start me-2">
                                <div className="small text-muted">
                                  Payment :{" "}
                                  <span
                                    className={`px-2 py-1 rounded fw-semibold ${
                                      booking.Payments?.[0]?.PaymentStatus ===
                                      "Success"
                                        ? "bg-success text-white"
                                        : "bg-danger text-white"
                                    }`}
                                  >
                                    {booking.Payments?.[0]?.PaymentStatus ||
                                      "Pending"}
                                  </span>
                                </div>
                              </div>
                              <div className="text-end me-2">
                                <div className="small text-muted">
                                  {booking.CompletedOTP
                                    ? "Completion"
                                    : "Start"}{" "}
                                  OTP :{" "}
                                  <span className="bg-warning px-2 py-1 rounded text-dark fw-semibold">
                                    {booking.CompletedOTP
                                      ? booking.CompletedOTP
                                      : booking.BookingOTP}
                                  </span>
                                </div>
                              </div>
                            </>
                          ) : null}
                          <button
                            className="btn btn-warning px-4 py-2"
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <i className="bi bi-arrows-fullscreen"></i> view
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Timeline (horizontal on desktop, vertical on mobile) with side details */}
                  <div className="p-3">
                    <div className="row g-3">
                      <div className="col-lg-12">
                        {/* Horizontal (desktop) using timeline-step blocks */}
                        <div className="d-none d-lg-block">
                          <div className="timeline-container d-flex w-100">
                            {[
                              ...statusTimeline,
                              ...(booking.BookingStatus === "Cancelled"
                                ? [{ label: "Cancelled", date: new Date() }]
                                : []),
                              ...(booking.BookingStatus === "Failed"
                                ? [{ label: "Failed", date: new Date() }]
                                : []),
                              ...(booking.Payments === null
                                ? [{ label: "Resume", date: new Date() }]
                                : []),
                            ].map((step, index, arr) => {
                              const isCompleted = !!step.date;
                              const isBad =
                                step.label === "Cancelled" ||
                                step.label === "Failed";
                              const circleBg = isBad
                                ? "bg-red-radial"
                                : isCompleted
                                ? "bg-radial"
                                : "bg-gray-radial";
                              const icon =
                                step.label === "Booking Created"
                                  ? "bi-clipboard-check"
                                  : step.label?.startsWith("Rescheduled")
                                  ? "bi-arrow-repeat"
                                  : step.label === "Buddy Assigned"
                                  ? "bi-person-check"
                                  : step.label === "Buddy Started"
                                  ? "bi-play-circle"
                                  : step.label === "Buddy Reached"
                                  ? "bi-geo-alt"
                                  : step.label === "Service Started"
                                  ? "bi-tools"
                                  : step.label === "Service Completed"
                                  ? "bi-check2-circle"
                                  : step.label === "Cancelled"
                                  ? "bi-x-circle"
                                  : step.label === "Failed"
                                  ? "bi-x-octagon"
                                  : "bi-dot";
                              const connectorBg =
                                isCompleted && !isBad
                                  ? "linear-gradient(135deg, rgb(4 177 166 / 84%) 0%, rgb(19 110 111) 100%)"
                                  : "#e9ecef";
                              return (
                                <div
                                  key={`${booking.BookingID}-h-${index}`}
                                  className={`timeline-step ${
                                    isCompleted ? "completed" : ""
                                  }`}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    minWidth: 120,
                                  }}
                                >
                                  <div
                                    className="text-center"
                                    style={{ minWidth: 120 }}
                                  >
                                    <div
                                      className={`circle ${circleBg}`}
                                      style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 20,
                                        margin: "0 auto 8px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#fff",
                                        top: "-5px",
                                        boxShadow: isCompleted
                                          ? "0 2px 6px rgba(32,201,151,0.35)"
                                          : "0 2px 6px rgba(0,0,0,0.05) ",
                                      }}
                                    >
                                      <i
                                        className={`bi ${icon}`}
                                        style={{ fontSize: 18 }}
                                      ></i>
                                    </div>
                                    <div
                                      className="label small fw-semibold"
                                      style={{ color: "#495057" }}
                                    >
                                      {step.label}
                                    </div>
                                    <div
                                      className="date xsmall text-muted"
                                      style={{ fontSize: 11 }}
                                    >
                                      {step.date
                                        ? new Date(
                                            step.date
                                          ).toLocaleDateString("en-GB")
                                        : ""}
                                    </div>
                                  </div>
                                  {index < arr.length - 1 && (
                                    <div
                                      className="line"
                                      style={{
                                        height: 6,
                                        background: connectorBg,
                                        opacity: 0.9,
                                        flex: 1,
                                        minWidth: 60,
                                        borderRadius: 999,
                                      }}
                                    ></div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        {/* Vertical (mobile) */}
                        <div className="d-block d-lg-none">
                          <div
                            className="position-relative"
                            style={{ paddingLeft: 34 }}
                          >
                            {[
                              ...statusTimeline,
                              ...(booking.BookingStatus === "Cancelled"
                                ? [{ label: "Cancelled", date: new Date() }]
                                : []),
                              ...(booking.BookingStatus === "Failed"
                                ? [{ label: "Failed", date: new Date() }]
                                : []),
                              ...(booking.Payments === null
                                ? [{ label: "Resume", date: new Date() }]
                                : []),
                            ].map((step, index, arr) => {
                              const isCompleted = !!step.date;
                              const isBad =
                                step.label === "Cancelled" ||
                                step.label === "Failed";
                              const circleBg = isCompleted
                                ? "bg-radial"
                                : isBad
                                ? "bg-red-radial"
                                : "bg-gray-radial";
                              const color = isBad
                                ? "#fff"
                                : isCompleted
                                ? "#fff"
                                : "#6c757d";
                              const icon =
                                step.label === "Booking Created"
                                  ? "bi-clipboard-check"
                                  : step.label?.startsWith("Rescheduled")
                                  ? "bi-arrow-repeat"
                                  : step.label === "Buddy Assigned"
                                  ? "bi-person-check"
                                  : step.label === "Buddy Started"
                                  ? "bi-play-circle"
                                  : step.label === "Buddy Reached"
                                  ? "bi-geo-alt"
                                  : step.label === "Service Started"
                                  ? "bi-tools"
                                  : step.label === "Service Completed"
                                  ? "bi-check2-circle"
                                  : step.label === "Cancelled"
                                  ? "bi-x-circle"
                                  : step.label === "Failed"
                                  ? "bi-x-octagon"
                                  : "bi-dot";
                              return (
                                <div
                                  key={`${booking.BookingID}-v-${index}`}
                                  className="d-flex align-items-start"
                                  style={{
                                    marginBottom:
                                      index < arr.length - 1 ? 14 : 0,
                                  }}
                                >
                                  <div style={{ position: "relative" }}>
                                    <div
                                      className={`${circleBg}`}
                                      style={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: 15,
                                        boxShadow: isCompleted
                                          ? "0 2px 6px rgba(32,201,151,0.35)"
                                          : "0 2px 6px rgba(0,0,0,0.05)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color,
                                      }}
                                    >
                                      <i
                                        className={`bi ${icon}`}
                                        style={{ fontSize: 15 }}
                                      ></i>
                                    </div>
                                    {index < arr.length - 1 && (
                                      <div
                                        style={{
                                          position: "absolute",
                                          top: 30,
                                          left: 14,
                                          width: 2,
                                          height: 14,
                                          background: "#e5e5e5",
                                        }}
                                      ></div>
                                    )}
                                  </div>
                                  <div style={{ marginLeft: 10, marginTop: 2 }}>
                                    <div
                                      className="fw-semibold"
                                      style={{ lineHeight: 1.2 }}
                                    >
                                      {step.label}
                                    </div>
                                    <div
                                      className="xsmall text-muted"
                                      style={{ fontSize: 11 }}
                                    >
                                      {step.date
                                        ? new Date(
                                            step.date
                                          ).toLocaleDateString("en-GB")
                                        : "Pending"}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="col-12">
                        {booking?.Payments &&
                        (booking.BookingStatus === "Pending" ||
                          booking.BookingStatus === "Confirmed" ||
                          booking.BookingStatus === "JourneyStarted") ? (
                          <div className="alert alert-warning " role="alert">
                            <div className="row align-items-center g-2">
                              <div className="col-12 col-md-10">
                                {booking?.Reschedules &&
                                booking.Reschedules.length >= 2 ? (
                                  <span>
                                    You have reached the maximum reschedule
                                    limit. Please contact customer support to
                                    reschedule your booking.
                                  </span>
                                ) : (
                                  <span>
                                    Need a different time? Go ahead and
                                    reschedule your booking.
                                  </span>
                                )}
                              </div>
                              <div className="col-auto  ">
                                {booking?.Reschedules &&
                                booking.Reschedules.length >= 2 ? (
                                  <a
                                    href="tel:7075243939"
                                    className="tab-pill pill border-info text-info px-3 py-1 d-flex align-items-center gap-1 text-decoration-none"
                                  >
                                    <i className="bi bi-telephone"></i>
                                    Contact Support
                                  </a>
                                ) : (
                                  <button
                                    className="tab-pill pill border-warning text-warning px-3 py-1"
                                    onClick={() =>
                                      navigate(
                                        `/reschedule?bookingId=${booking.BookingID}`
                                      )
                                    }
                                  >
                                    Reschedule
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : !booking?.Payments ? (
                          <div className="alert alert-warning" role="alert">
                            <div className="row align-items-center g-2">
                              <div className="col">
                                Your payment is pending. Please resume your
                                booking to complete the payment.
                              </div>
                              <div className="col-auto">
                                <button
                                  className="btn btn-primary px-3 py-1"
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    handleOpenResume();
                                  }}
                                >
                                  Resume Booking
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-5">
              <img
                src="/assets/img/not-booked.png"
                alt="No Bookings"
                style={{ maxWidth: "500px", marginBottom: "20px" }}
              />
              <h4>No bookings yet</h4>
              <p>
                Looks like you haven't booked any services yet. Book your first
                service!
              </p>
            </div>
          )}

          {/* Infinite scroll loading indicator */}
          {isLoadingMore && (
            <div className="text-center py-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">
                  Loading more bookings...
                </span>
              </div>
              <div className="mt-2 text-muted">Loading more bookings...</div>
            </div>
          )}

          {/* End of results indicator */}
          {visibleCount >= filteredBookings.length &&
            filteredBookings.length > 0 && (
              <div className="text-center py-3">
                <div className="text-muted">
                  <i className="bi bi-check-circle me-2"></i>
                  You've reached the end of your bookings
                </div>
              </div>
            )}
        </div>
      )}

      {selectedBooking && (
        <div className="card shadow-lg p-4 rounded-4">
          {/* Back Button */}
          <div className="d-flex justify-content-end mb-4">
            <button
              className="btn btn-outline-secondary d-flex align-items-center gap-2  px-3 py-1"
              onClick={handleBack}
            >
              <i className="bi bi-arrow-left"></i> Back
            </button>
          </div>

          {/* Header - trendy gradient card */}
          <div
            className="mb-4 w-100 bg-radial"
            style={{
              color: "#fff",
              borderRadius: 16,
              padding: 16,
              boxShadow: "0 8px 24px rgba(13,110,253,0.15)",
            }}
          >
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
              <div className="row w-100">
                <div className="col-md-6">
                  <div className="small" style={{ opacity: 0.9 }}>
                    Booking ID
                  </div>
                  <h4 className="fw-bold mb-1 text-white">
                    #{selectedBooking.BookingTrackID}
                  </h4>
                </div>
                <div className="col-md-6">
                  <div className="small" style={{ opacity: 0.9 }}>
                    Date & Time
                  </div>
                  <div className="small" style={{ opacity: 0.95 }}>
                    {new Date(selectedBooking.BookingDate).toLocaleDateString(
                      "en-GB"
                    )}{" "}
                    •{" "}
                    {selectedBooking.TimeSlot &&
                    selectedBooking.TimeSlot.includes(",") ? (
                      <span>
                        {selectedBooking.TimeSlot.split(",").map(
                          (timeSlot, index) => (
                            <span key={index}>
                              {timeSlot.trim()}
                              {index <
                                selectedBooking.TimeSlot.split(",").length -
                                  1 && <span> • </span>}
                            </span>
                          )
                        )}
                      </span>
                    ) : (
                      selectedBooking.TimeSlot || "N/A"
                    )}
                  </div>
                </div>
              </div>
              <div className="small mt-2" style={{ opacity: 0.9 }}>
                <i className="bi bi-geo-alt me-1" />
                {selectedBooking.CityName}, {selectedBooking.StateName}
              </div>

              <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
                {/* Actions inside header: Resume/Cancel based on state */}
                {selectedBooking?.Payments ? (
                  selectedBooking.BookingStatus !== "Completed" &&
                  selectedBooking.BookingStatus !== "Cancelled" &&
                  selectedBooking.BookingStatus !== "Refunded" &&
                  selectedBooking.BookingStatus !== "Failed" &&
                  !showCancelSection ? (
                    <div className="d-flex gap-2">
                      {(() => {
                        const fullTracking = Array.isArray(
                          selectedBooking?.TechnicianTracking
                        )
                          ? selectedBooking.TechnicianTracking[0]
                          : {};
                        const hasServiceStartedFull =
                          !!fullTracking?.ServiceStartedAt;
                        const canReschedule =
                          !hasServiceStartedFull &&
                          selectedBooking?.Reschedules &&
                          selectedBooking.Reschedules.length < 2;

                        return canReschedule ? (
                          <button
                            className="btn btn-warning px-3 py-1"
                            onClick={() =>
                              navigate(
                                `/reschedule?bookingId=${selectedBooking.BookingID}`
                              )
                            }
                          >
                            Reschedule
                          </button>
                        ) : !hasServiceStartedFull &&
                          selectedBooking?.Reschedules &&
                          selectedBooking.Reschedules.length >= 2 ? (
                          <a
                            href="tel:7075243939"
                            className="btn btn-warning px-3 py-1 d-flex align-items-center gap-1 text-decoration-none"
                            title="Call customer support for rescheduling assistance"
                          >
                            <i className="bi bi-telephone"></i>
                            Contact Support
                          </a>
                        ) : null;
                      })()}
                      {(selectedBooking.BookingStatus === "Pending" ||
                        selectedBooking.BookingStatus === "Confirmed" ||
                        selectedBooking.BookingStatus === "JourneyStarted") && (
                        <>
                          <button
                            className="btn btn-warning px-3 py-1"
                            onClick={() => openCancelModal()}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  ) : null
                ) : selectedBooking.BookingStatus !== "Failed" &&
                  selectedBooking.BookingStatus !== "Completed" &&
                  selectedBooking.BookingStatus !== "Cancelled" &&
                  selectedBooking.BookingStatus !== "Refunded" &&
                  !showResumeForm ? (
                  <button
                    className="btn btn-warning px-3 py-1"
                    onClick={handleOpenResume}
                  >
                    Resume booking
                  </button>
                ) : null}
                {selectedBooking.BookingStatus !== "Cancelled" && (
                  <>
                    {/* {selectedBooking?.BookingStatus === 'Completed' &&
              selectedBooking?.Payments?.length > 0 &&
              selectedBooking?.Payments?.[0]?.PaymentStatus === 'Success' && (
                <>
                  {selectedBooking?.Payments?.[0]?.IsRefunded === true &&
                    selectedBooking?.RefundStatus === null ? (
                    <button className="btn btn-warning px-3 py-1 text-decoration-none" disabled>
                      Refund Raised
                    </button>
                  ) :
                  selectedBooking?.Payments?.[0]?.IsRefunded === true &&
                  selectedBooking?.RefundStatus !== null ? (
                    <button className="btn btn-warning px-3 py-1 text-decoration-none" disabled>
                      Refund {selectedBooking?.RefundStatus}
                    </button>
                  ) :
                  selectedBooking?.Payments?.[0]?.IsRefunded !== true && (
                    <button
                      className="btn btn-warning px-3 py-1 text-decoration-none"
                      onClick={handleRequestRefund}
                    >
                      Request Refund
                    </button>
                  )}
                </>
            )} */}
                    <button
                      className="btn btn-warning px-3 py-1"
                      onClick={() => setShowNewTicket(true)}
                    >
                      Raise A Ticket
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* NewTicket Component */}
          {showNewTicket && (
            <NewTicket
              onClose={() => setShowNewTicket(false)}
              onTicketCreated={() => {
                setShowNewTicket(false);
              }}
              selectedTicketBookingId={selectedBooking?.BookingID}
            />
          )}

          {/* Resume Booking Form or Details */}
          {showResumeForm ? (
            <div className="border rounded-4 p-3 mb-4">
              <h6 className="mb-3">Resume booking</h6>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Select date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={resumeDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => {
                      setResumeDate(e.target.value);
                      setSelectedResumeTimes([]);
                    }}
                  />
                </div>
                <div className="col-md-8">
                  <label className="form-label">Payment method</label>
                  <div className="d-flex align-items-center gap-4 mt-1">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="resumePaymentMethod"
                        id="pm-razorpay"
                        value="razorpay"
                        checked={resumePaymentMethod === "razorpay"}
                        onChange={(e) => setResumePaymentMethod(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="pm-razorpay">
                        razorpay
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="resumePaymentMethod"
                        id="pm-cos"
                        value="COS"
                        checked={resumePaymentMethod === "COS"}
                        onChange={(e) => setResumePaymentMethod(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="pm-cos">
                        COS
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <label className="form-label">
                  Select time slots (multi-select)
                </label>
                <div className="row">
                  <div className="col-md-4">
                    <div className="fw-semibold mb-2">Morning</div>
                    {resumeMorningSlots.length === 0 && (
                      <div className="text-muted small">No slots</div>
                    )}
                    {resumeMorningSlots.map((s) => (
                      <div className="form-check" key={`m-${s.label}`}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`m-${s.label}`}
                          disabled={s.disabled}
                          checked={selectedResumeTimes.includes(s.label)}
                          onChange={(e) => {
                            setSelectedResumeTimes((prev) =>
                              e.target.checked
                                ? [...prev, s.label]
                                : prev.filter((x) => x !== s.label)
                            );
                          }}
                        />
                        <label
                          className="form-check-label"
                          htmlFor={`m-${s.label}`}
                        >
                          {s.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="col-md-4">
                    <div className="fw-semibold mb-2">Afternoon</div>
                    {resumeAfternoonSlots.length === 0 && (
                      <div className="text-muted small">No slots</div>
                    )}
                    {resumeAfternoonSlots.map((s) => (
                      <div className="form-check" key={`a-${s.label}`}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`a-${s.label}`}
                          disabled={s.disabled}
                          checked={selectedResumeTimes.includes(s.label)}
                          onChange={(e) => {
                            setSelectedResumeTimes((prev) =>
                              e.target.checked
                                ? [...prev, s.label]
                                : prev.filter((x) => x !== s.label)
                            );
                          }}
                        />
                        <label
                          className="form-check-label"
                          htmlFor={`a-${s.label}`}
                        >
                          {s.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="col-md-4">
                    <div className="fw-semibold mb-2">Evening</div>
                    {resumeEveningSlots.length === 0 && (
                      <div className="text-muted small">No slots</div>
                    )}
                    {resumeEveningSlots.map((s) => (
                      <div className="form-check" key={`e-${s.label}`}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`e-${s.label}`}
                          disabled={s.disabled}
                          checked={selectedResumeTimes.includes(s.label)}
                          onChange={(e) => {
                            setSelectedResumeTimes((prev) =>
                              e.target.checked
                                ? [...prev, s.label]
                                : prev.filter((x) => x !== s.label)
                            );
                          }}
                        />
                        <label
                          className="form-check-label"
                          htmlFor={`e-${s.label}`}
                        >
                          {s.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-3">
                  <button
                    className="btn btn-outline-secondary px-4 py-2"
                    onClick={() => setShowResumeForm(false)}
                    disabled={isSubmittingResume}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary px-4  py-2"
                    onClick={handleResumeSubmit}
                    disabled={isSubmittingResume}
                  >
                    {isSubmittingResume ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Timeline removed as requested */}
              {(() => {
                const fullTracking = Array.isArray(
                  selectedBooking?.TechnicianTracking
                )
                  ? selectedBooking.TechnicianTracking[0]
                  : {};
                var hasServiceStartedFull = !!fullTracking?.ServiceStartedAt;
                return null;
              })()}

              <div className="row g-3 mb-4">
                {/* Customer Info (trendy card) */}
                <div className="col-md-7">
                  <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
                    <div
                      className="d-flex align-items-center gap-2 px-3 py-2"
                      style={{ background: "#f8f9fa" }}
                    >
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center bg-radial"
                        style={{ width: 32, height: 32, color: "#fff" }}
                      >
                        <i className="bi bi-person"></i>
                      </div>
                      <h6 className="mb-0 text-muted">User Details</h6>
                    </div>
                    <div className="p-3">
                      <div className="fw-bold fs-6">
                        {selectedBooking.IsOthers
                          ? selectedBooking.OthersFullName
                          : selectedBooking.CustomerName}{" "}
                        (
                        <span className="text-muted small">
                          {selectedBooking.IsOthers
                            ? selectedBooking.OthersPhoneNumber
                            : selectedBooking.PhoneNumber}
                        </span>
                        )
                      </div>
                      <div className="small">
                        <strong>Address:</strong> {selectedBooking.FullAddress},{" "}
                        {selectedBooking.Pincode}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Info (trendy card) */}
                <div className="col-md-5">
                  <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
                    <div
                      className="d-flex align-items-center gap-2 px-3 py-2"
                      style={{ background: "#f8f9fa" }}
                    >
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center bg-radial"
                        style={{ width: 32, height: 32, color: "#fff" }}
                      >
                        <i className="bi bi-car-front"></i>
                      </div>
                      <h6 className="mb-0 text-muted">Vehicle</h6>
                    </div>
                    <div className="p-3 d-flex gap-3 align-items-start">
                      <img
                        src={`${ImageURL}${selectedBooking.VehicleImage}`}
                        alt="Vehicle"
                        className="img-fluid rounded-3"
                        style={{ width: 120, height: 80, objectFit: "cover" }}
                      />
                      <div className="small">
                        <div>
                          <strong>Number:</strong>{" "}
                          {selectedBooking.VehicleNumber}
                        </div>
                        <div>
                          <strong>Brand:</strong> {selectedBooking.BrandName}
                        </div>
                        <div>
                          <strong>Model:</strong> {selectedBooking.ModelName}
                        </div>
                        <div>
                          <strong>Fuel:</strong> {selectedBooking.FuelTypeName}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Packages (accordion list) */}
              {selectedBooking.Packages?.length > 0 && (
                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h5 className="fw-semibold mb-0 d-flex align-items-center">
                      <i className="bi bi-box-seam me-2 text-primary"></i>
                      Included Packages
                    </h5>
                    <div className="d-flex align-items-center gap-2">
                      <button
                        className="btn btn-outline-primary px-4 py-2"
                        onClick={() => handleAddBookingToCart(selectedBooking)}
                        disabled={isProcessingBookAgain}
                      >
                        {isProcessingBookAgain ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Processing...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-cart-plus me-1"></i>Book Again
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="accordion" id="packagesAccordion">
                    {selectedBooking.Packages.map((pkg, idx) => {
                      const isOpen = expandedPackageIdxs.has(idx);
                      return (
                        <div className="accordion-item" key={idx}>
                          <h2 className="accordion-header">
                            <button
                              className={`accordion-button ${
                                isOpen ? "" : "collapsed"
                              } py-0`}
                              type="button"
                              onClick={() => {
                                const next = new Set(expandedPackageIdxs);
                                if (next.has(idx)) next.delete(idx);
                                else next.add(idx);
                                setExpandedPackageIdxs(next);
                              }}
                            >
                              <i className="bi bi-box-seam me-2"></i>{" "}
                              {pkg.PackageName}
                            </button>
                          </h2>
                          <div
                            className={`accordion-collapse collapse ${
                              isOpen ? "show" : ""
                            }`}
                          >
                            <div className="accordion-body">
                              {pkg.Category?.SubCategories?.[0]?.Includes
                                ?.length ? (
                                <ul className="text-muted small mb-0">
                                  {pkg.Category.SubCategories[0].Includes.map(
                                    (inc) => (
                                      <li key={inc.IncludeID}>
                                        {inc.IncludeName}
                                      </li>
                                    )
                                  )}
                                </ul>
                              ) : (
                                <div className="text-muted small">
                                  No includes available.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Additional Services (accordion with table) */}
              {selectedBooking.BookingAddOns?.length > 0 && (
                <div className="mb-4">
                  <h5 className="fw-semibold mb-0 d-flex align-items-center mb-2">
                    <i className="bi bi-plus-circle me-2 text-primary"></i>
                    Additional Services
                  </h5>
                  <div className="accordion" id="addOnsAccordion">
                    <div className="accordion-item">
                      <h2 className="accordion-header">
                        <button
                          className={`accordion-button ${
                            isAddOnsOpen ? "" : "collapsed"
                          } py-0`}
                          type="button"
                          onClick={() => setIsAddOnsOpen(!isAddOnsOpen)}
                        >
                          <i className="bi bi-plus-circle me-2"></i> Additional
                          Services
                        </button>
                      </h2>
                      <div
                        className={`accordion-collapse collapse ${
                          isAddOnsOpen ? "show" : ""
                        }`}
                      >
                        <div className="accordion-body">
                          <table className="table table-striped">
                            <thead>
                              <tr>
                                <th>Service Name</th>
                                <th>Price</th>
                                <th>GST %</th>
                                <th>GST Amount</th>
                                <th>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedBooking.BookingAddOns.map(
                                (addOn, idx) => (
                                  <tr key={idx}>
                                    <td>{addOn.ServiceName}</td>
                                    <td>₹{addOn.ServicePrice}</td>
                                    <td>{addOn.GSTPercent}%</td>
                                    <td>₹{addOn.GSTPrice}</td>
                                    <td>₹{addOn.TotalPrice}</td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Combined Booking Information Card */}
              <div className="col-12">
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                  {/* Header */}
                  <div
                    className="d-flex align-items-center gap-2 px-3 py-2"
                    style={{ background: "#f8f9fa" }}
                  >
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center bg-radial"
                      style={{ width: 32, height: 32, color: "#fff" }}
                    >
                      <i className="bi bi-info-circle"></i>
                    </div>
                    <h6 className="mb-0 text-muted">Booking Information</h6>
                  </div>

                  <div className="p-3">
                    {/* Booking Status Row */}
                    <div className="row align-items-start border-bottom pb-2 mb-2">
                      <div className="col-md-4 fw-semibold text-muted">
                        Booking Status
                      </div>
                      <div className="col-md-4 fw-semibold text-success">
                        #{selectedBooking?.BookingTrackID || "N/A"}
                      </div>
                      <div className="col-md-4 text-end">
                        <span
                          className={`fw-bold ${
                            selectedBooking?.BookingStatus === "Success"
                              ? "text-success"
                              : selectedBooking?.BookingStatus === "Completed"
                              ? "text-success"
                              : selectedBooking?.BookingStatus === "Assigned"
                              ? "text-success"
                              : "text-danger"
                          }`}
                        >
                          {selectedBooking?.BookingStatus || "Pending"}
                        </span>
                      </div>
                    </div>

                    {/* Technician Row */}
                    <div className="row align-items-start border-bottom pb-2 mb-2">
                      <div className="col-md-4 fw-semibold text-muted">
                        Technician
                      </div>
                      <div className="col-md-4">
                        <span
                          className={`fw-bold ${
                            selectedBooking?.TechID
                              ? "text-success"
                              : "text-danger"
                          }`}
                        >
                          {selectedBooking?.TechID ? "Assigned" : "Pending"}
                        </span>
                      </div>
                      <div className="col-md-4 text-end">
                        {selectedBooking?.TechID ? (
                          <>
                            <div className="fw-bold">
                              {selectedBooking.TechFullName}
                            </div>
                            {selectedBooking?.BookingStatus !== "Completed" && (
                              <div className="text-muted small">
                                +91 707-524-3939
                              </div>
                            )}
                            {selectedBooking?.AssignedTimeSlot && (
                              <div className="text-muted small">
                                Time Slot: {selectedBooking.AssignedTimeSlot}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-muted small fst-italic">
                            Technician not assigned
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Row */}
                    <div className="row align-items-start">
                      <div className="col-md-4 fw-semibold text-muted">
                        Payment
                      </div>
                      <div className="col-md-4">
                        <span
                          className={`fw-bold ${
                            selectedBooking?.Payments?.[0]?.PaymentStatus ===
                            "Success"
                              ? "text-success"
                              : "text-danger"
                          }`}
                        >
                          {selectedBooking?.Payments?.[0]?.PaymentStatus ||
                            "Pending"}
                        </span>
                      </div>
                      <div className="col-md-4 text-end">
                        <div className="small text-muted">
                          Payment Method:{" "}
                          {selectedBooking?.PaymentMethod || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount Summary + COS Pay Now */}
              <div className="border-top pt-4">
                {(() => {
                  const addOnTotal =
                    selectedBooking.BookingAddOns?.reduce(
                      (sum, addOn) => sum + Number(addOn.TotalPrice || 0),
                      0
                    ) || 0;

                  const isPaid =
                    selectedBooking?.Payments?.[0]?.PaymentStatus === "Success";
                  const isCOS = selectedBooking?.PaymentMethod === "COS";
                  const isCOSUnpaid =
                    isCOS &&
                    !isPaid &&
                    ["Pending", "Confirmed", "JourneyStarted"].includes(
                      selectedBooking?.BookingStatus
                    );

                  const hasAddOns = addOnTotal > 0;
                  const isAllPaid = isPaid && !isCOSUnpaid && !hasAddOns;

                  // ✅ CASE 1: Online Paid + Add-ons present
                  if (isPaid && hasAddOns) {
                    return (
                      <div className="row justify-content-between py-3">
                        {/* Left: Paid Service Amount */}
                        <div className="col-md-5">
                          <div className="card border-0 shadow-sm rounded-4 p-3">
                            <h6 className="fw-semibold mb-3 text-muted">
                              Paid Service Amount
                            </h6>

                            <div className="d-flex justify-content-between mb-2">
                              <div className="fw-semibold">Amount</div>
                              <div className="fw-bold text-primary">
                                ₹{selectedBooking.TotalPrice.toFixed(2)}
                              </div>
                            </div>

                            <div className="d-flex justify-content-between mb-2">
                              <div className="fw-semibold">SGST (9%)</div>
                              <div className="fw-bold text-primary">
                                ₹
                                {(
                                  Number(selectedBooking.GSTAmount || 0) / 2
                                ).toFixed(2)}
                              </div>
                            </div>

                            <div className="d-flex justify-content-between mb-2">
                              <div className="fw-semibold">CGST (9%)</div>
                              <div className="fw-bold text-primary">
                                ₹
                                {(
                                  Number(selectedBooking.GSTAmount || 0) / 2
                                ).toFixed(2)}
                              </div>
                            </div>

                            <hr />
                            <div className="d-flex justify-content-between mb-2">
                              <div className="fw-semibold fs-5">Total</div>
                              <div className="fw-bold text-success fs-5">
                                ₹
                                {(
                                  selectedBooking.TotalPrice +
                                  selectedBooking.GSTAmount
                                ).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right: Add-on Service Amount */}
                        <div className="col-md-5">
                          <div className="card border-0 shadow-sm rounded-4 p-3">
                            <h6 className="fw-semibold mb-3 text-muted">
                              Additional Services Amount
                            </h6>
                            <div
                              style={{ visibility: "hidden", height: "65px" }}
                            ></div>
                            <div className="d-flex justify-content-between mb-2">
                              <div className="fw-semibold">Total Amount</div>
                              <div className="fw-bold text-primary">
                                ₹{addOnTotal.toFixed(2)}
                              </div>
                            </div>

                            <hr />
                            <div className="d-flex justify-content-between mb-2">
                              <div className="fw-semibold fs-5">
                                Amount to Pay
                              </div>
                              <div className="fw-bold text-success fs-5">
                                ₹{addOnTotal.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // ✅ CASE 2: All Paid (COS + add-ons paid OR online + no add-ons)
                  if (isAllPaid || (isPaid && !hasAddOns)) {
                    return (
                      <div className="d-flex justify-content-end py-3">
                        <div className="col-md-5">
                          <div className="card border-0 shadow-sm rounded-4 p-3">
                            <h6 className="fw-semibold mb-3 text-muted">
                              Amount Summary
                            </h6>

                            <div className="d-flex justify-content-between mb-2">
                              <div className="fw-semibold">Amount</div>
                              <div className="fw-bold text-primary">
                                ₹{selectedBooking.TotalPrice.toFixed(2)}
                              </div>
                            </div>

                            {(selectedBooking.CouponAmount > 0 ||
                              appliedCoupon) && (
                              <div className="d-flex justify-content-between mb-2">
                                <div className="fw-semibold">Coupon</div>
                                <div className="fw-bold text-danger">
                                  -₹
                                  {appliedCoupon
                                    ? (
                                        getBookingOriginalTotal(
                                          selectedBooking
                                        ) -
                                        getBookingFinalTotalWithCoupon(
                                          selectedBooking
                                        )
                                      ).toFixed(2)
                                    : selectedBooking.CouponAmount.toFixed(2)}
                                </div>
                              </div>
                            )}

                            <div className="d-flex justify-content-between mb-2">
                              <div className="fw-semibold">SGST (9%)</div>
                              <div className="fw-bold text-primary">
                                ₹
                                {(
                                  Number(selectedBooking.GSTAmount || 0) / 2
                                ).toFixed(2)}
                              </div>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                              <div className="fw-semibold">CGST (9%)</div>
                              <div className="fw-bold text-primary">
                                ₹
                                {(
                                  Number(selectedBooking.GSTAmount || 0) / 2
                                ).toFixed(2)}
                              </div>
                            </div>

                            {hasAddOns && (
                              <div className="d-flex justify-content-between mb-2">
                                <div className="fw-semibold">
                                  Additional Total
                                </div>
                                <div className="fw-bold text-primary">
                                  ₹{addOnTotal.toFixed(2)}
                                </div>
                              </div>
                            )}

                            <hr />
                            <div className="d-flex justify-content-between mb-2">
                              <div className="fw-semibold fs-5">Total</div>
                              <div className="fw-bold text-success fs-5">
                                ₹
                                {(
                                  selectedBooking.TotalPrice +
                                  selectedBooking.GSTAmount -
                                  selectedBooking.CouponAmount +
                                  addOnTotal
                                ).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // ✅ CASE 3: COS (Paid or Unpaid) + no add-ons
                  if (isCOS && !hasAddOns) {
                    return (
                      <div className="border-top pt-4">
                        <div className="col-md-12">
                          <h6 className="fw-semibold mb-3 text-muted">
                            Amount Summary
                          </h6>

                          <div className="d-flex justify-content-between mb-2">
                            <div className="fw-semibold">Amount</div>
                            <div className="fw-bold text-primary">
                              ₹{selectedBooking.TotalPrice.toFixed(2)}
                            </div>
                          </div>

                          <div className="d-flex justify-content-between mb-2">
                            <div className="fw-semibold">SGST (9%)</div>
                            <div className="fw-bold text-primary">
                              ₹
                              {(
                                Number(selectedBooking.GSTAmount || 0) / 2
                              ).toFixed(2)}
                            </div>
                          </div>

                          <div className="d-flex justify-content-between mb-2">
                            <div className="fw-semibold">CGST (9%)</div>
                            <div className="fw-bold text-primary">
                              ₹
                              {(
                                Number(selectedBooking.GSTAmount || 0) / 2
                              ).toFixed(2)}
                            </div>
                          </div>

                          <hr />
                          <div className="d-flex justify-content-between mb-2">
                            <div className="fw-semibold fs-5">Total</div>
                            <div className="fw-bold text-success fs-5">
                              ₹
                              {(
                                selectedBooking.TotalPrice +
                                selectedBooking.GSTAmount
                              ).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // ✅ CASE 4: Unpaid COS (with coupon + pay now)
                  return (
                    <>
                      <div className="mb-2">
                        <div className="d-flex justify-content-between mb-2">
                          <div className="fw-semibold">Amount</div>
                          <div className="fw-bold text-primary">
                            ₹{selectedBooking.TotalPrice.toFixed(2)}
                          </div>
                        </div>

                        {(selectedBooking.CouponAmount > 0 ||
                          appliedCoupon) && (
                          <div className="d-flex justify-content-between mb-2">
                            <div className="fw-semibold">Coupon</div>
                            <div className="fw-bold text-danger">
                              -₹
                              {appliedCoupon
                                ? (
                                    getBookingOriginalTotal(selectedBooking) -
                                    getBookingFinalTotalWithCoupon(
                                      selectedBooking
                                    )
                                  ).toFixed(2)
                                : selectedBooking.CouponAmount.toFixed(2)}
                            </div>
                          </div>
                        )}

                        <div className="d-flex justify-content-between mb-2">
                          <div className="fw-semibold">SGST (9%)</div>
                          <div className="fw-bold text-primary">
                            ₹
                            {(
                              Number(selectedBooking.GSTAmount || 0) / 2
                            ).toFixed(2)}
                          </div>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <div className="fw-semibold">CGST (9%)</div>
                          <div className="fw-bold text-primary">
                            ₹
                            {(
                              Number(selectedBooking.GSTAmount || 0) / 2
                            ).toFixed(2)}
                          </div>
                        </div>

                        {hasAddOns && (
                          <div className="d-flex justify-content-between mb-2">
                            <div className="fw-semibold">Additional Total</div>
                            <div className="fw-bold text-primary">
                              ₹{addOnTotal.toFixed(2)}
                            </div>
                          </div>
                        )}

                        <hr />
                        <div className="d-flex justify-content-between mb-2">
                          <div className="fw-semibold fs-5">Total</div>
                          <div className="fw-bold text-success fs-5">
                            ₹
                            {(
                              selectedBooking.TotalPrice +
                              selectedBooking.GSTAmount -
                              selectedBooking.CouponAmount +
                              addOnTotal
                            ).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mt-3">
                        <div className="col-6">
                          {isCOSUnpaid && (
                            <div
                              className="card p-3 border-0 shadow-sm rounded-4"
                              style={{ maxWidth: 420 }}
                            >
                              <h6 className="mb-2">Have a coupon?</h6>
                              {!couponApplied ? (
                                <>
                                  <button
                                    className="btn btn-outline-primary px-4 py-2"
                                    onClick={() => setShowCouponPicker(true)}
                                  >
                                    View Coupons
                                  </button>
                                  {showCouponPicker && (
                                    <div
                                      className="mt-3"
                                      style={{
                                        maxHeight: 200,
                                        overflowY: "auto",
                                      }}
                                    >
                                      {couponList.map((c) => (
                                        <div
                                          key={c.id}
                                          className="d-flex justify-content-between align-items-start border rounded p-2 mb-2"
                                        >
                                          <div>
                                            <div className="fw-semibold">
                                              {c.Code}
                                            </div>
                                            <div className="small text-muted">
                                              {c.Description}
                                            </div>
                                            {c.MinBookingAmount ? (
                                              <div className="small text-muted">
                                                Min ₹{c.MinBookingAmount}
                                              </div>
                                            ) : null}
                                          </div>
                                          <button
                                            className="btn btn-primary px-2 py-1"
                                            onClick={() =>
                                              handleApplyCouponFullView(c)
                                            }
                                          >
                                            Apply
                                          </button>
                                        </div>
                                      ))}
                                      {couponList.length === 0 && (
                                        <div className="text-muted small">
                                          No coupons available.
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="d-flex justify-content-between align-items-center w-100">
                                  <div>
                                    <div className="fw-semibold">
                                      Applied: {appliedCoupon?.Code}
                                    </div>
                                    <div className="small text-muted">
                                      {appliedCoupon?.Description}
                                    </div>
                                    <div className="small text-success mt-1">
                                      Discount: ₹
                                      {(
                                        getBookingOriginalTotal(
                                          selectedBooking
                                        ) -
                                        getBookingFinalTotalWithCoupon(
                                          selectedBooking
                                        )
                                      ).toFixed(2)}
                                    </div>
                                  </div>
                                  <button
                                    className="btn btn-outline-danger px-2 py-1"
                                    onClick={handleRemoveCouponFullView}
                                  >
                                    <i className="bi bi-x"></i>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {isCOSUnpaid && (
                          <button
                            className="btn btn-primary btn-lg px-4 py-2"
                            onClick={handlePayNow}
                          >
                            Pay Now
                          </button>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Cancel Section Overlay */}
              {showCancelSection && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: "rgba(255,255,255,0.95)",
                    zIndex: 10,
                    display: "flex",
                    alignItems: "start",
                    justifyContent: "center",
                    borderRadius: "1rem",
                  }}
                >
                  <div
                    className="border rounded-3 p-4 bg-white shadow"
                    style={{ minWidth: 350, maxWidth: 500 }}
                  >
                    <h6 className="text-danger">Cancel Booking</h6>
                    <form>
                      {cancelReasons.map((reason) => (
                        <div className="form-check" key={reason.ID}>
                          <input
                            className="form-check-input"
                            type="radio"
                            name="cancelReason"
                            id={`reason-${reason.ID}`}
                            value={reason.Reason}
                            checked={
                              selectedReason === reason.Reason && !otherChecked
                            }
                            onChange={() => {
                              setSelectedReason(reason.Reason);
                              setOtherChecked(false);
                            }}
                          />
                          <label
                            className="form-check-label"
                            htmlFor={`reason-${reason.ID}`}
                          >
                            {reason.Reason}
                          </label>
                        </div>
                      ))}
                      <div className="form-check mt-2">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="cancelReason"
                          id="reason-other"
                          checked={otherChecked}
                          onChange={() => {
                            setOtherChecked(true);
                            setSelectedReason("");
                          }}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="reason-other"
                        >
                          Other
                        </label>
                      </div>
                      {otherChecked && (
                        <textarea
                          className="form-control mt-2"
                          rows="3"
                          placeholder="Please specify your reason"
                          value={otherReason}
                          onChange={(e) => setOtherReason(e.target.value)}
                        />
                      )}
                    </form>
                    <div className="d-flex justify-content-end mt-3">
                      <button
                        type="button"
                        className="btn btn-secondary me-2 px-4 py-2"
                        onClick={() => setShowCancelSection(false)}
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger px-4 py-2"
                        onClick={submitCancellation}
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Review Section (only if not cancelling) */}
              {!showCancelSection &&
                selectedBooking.BookingStatus === "Completed" && (
                  <div className="review-card border rounded-3 p-4 mt-4">
                    <h6 className="text-primary">Rate Your Experience</h6>
                    {/* Service Quality */}
                    <div className="mb-3">
                      <label className="fw-bold">Service Quality</label>
                      <p className="small text-muted">
                        How satisfied were you with the overall service?
                      </p>
                      <StarRating
                        rating={serviceQuality}
                        onRatingChange={setServiceQuality}
                      />
                    </div>
                    {/* Technician Rating */}
                    <div className="mb-3">
                      <label className="fw-bold">Technician </label>
                      <p className="small text-muted">
                        How would you rate the professionalism and expertise?
                      </p>
                      <StarRating
                        rating={technicianRating}
                        onRatingChange={setTechnicianRating}
                      />
                    </div>
                    {/* Feedback */}
                    <div className="mb-3">
                      <label className="fw-bold">Your Feedback</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Share your thoughts to help us improve"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                      />
                    </div>
                    {feedbackExists ? (
                      ""
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={() =>
                          handleSubmitReview(selectedBooking.BookingID)
                        }
                      >
                        Submit Review
                      </button>
                    )}
                  </div>
                )}
            </>
          )}
        </div>
      )}

      {showPaymentModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              backgroundColor: "#fff",
              borderRadius: "12px",
              padding: "20px",
              width: "90%",
              maxWidth: "350px",
              textAlign: "center",
              boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
            }}
          >
            {paymentStatus === "processing" ? (
              <>
                <div
                  style={{
                    width: 50,
                    height: 50,
                    margin: "0 auto 20px",
                    border: "4px solid #1890ae",
                    borderTop: "4px solid transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <h4 style={{ marginBottom: 10 }}>Processing Payment</h4>
                <p style={{ color: "#666", marginBottom: 20 }}>
                  Please wait... your booking is being processed.
                </p>
              </>
            ) : (
              <>
                <img
                  src={
                    paymentStatus === "success"
                      ? "https://cdn-icons-png.flaticon.com/512/190/190411.png" 
                      : "https://cdn-icons-png.flaticon.com/512/463/463612.png" 
                  }
                  alt="Status Icon"
                  style={{ width: 50, height: 50, marginBottom: 20 }}
                />
                <h4 style={{ marginBottom: 10 }}>
                  {paymentStatus === "success" ? "Successful" : " Failed"}
                </h4>
                <p style={{ color: "#666", marginBottom: 20 }}>
                  {paymentMessage}
                </p>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setAppliedCoupon(null);
                    setCouponApplied(false);
                    handleBack();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{
                    backgroundColor:
                      paymentStatus === "success" ? "#28a745" : "#dc3545",
                    color: "#fff",
                    padding: "8px 20px",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  OK
                </button>
              </>
            )}

            {/* Spinner animation */}
            <style>
              {`
             @keyframes spin {
               0% { transform: rotate(0deg); }
               100% { transform: rotate(360deg); }
             }
           `}
            </style>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
