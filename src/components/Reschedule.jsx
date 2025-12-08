import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAlert } from "../context/AlertContext";
import Swal from "sweetalert2";
import {
  FaCalendarAlt,
  FaClock,
  FaArrowLeft,
  FaArrowRight,
  FaSun,
  FaCloudSun,
  FaMoon,
  FaCheck,
  FaPhone,
  FaEdit
} from "react-icons/fa";
import "./Reschedule.css";

const Reschedule = () => {
  const [bookingId, setBookingId] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [reason, setReason] = useState("");
  const [showReschedule, setShowReschedule] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;
  const API_BASE = process.env.REACT_APP_CARBUDDY_BASE_URL;

  const [resumeMorningSlots, setResumeMorningSlots] = useState([]);
  const [resumeAfternoonSlots, setResumeAfternoonSlots] = useState([]);
  const [resumeEveningSlots, setResumeEveningSlots] = useState([]);
  const [selectedResumeTimes, setSelectedResumeTimes] = useState([]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get("bookingId");
    if (id) {
      setBookingId(id);
      fetchBookingDetails(id);
    }
  }, [location.search]);

  useEffect(() => {
    if (bookingData) {
      const dateToUse = newDate || bookingData.BookingDate;
      if (dateToUse) {
        fetchResumeTimeSlots(dateToUse);
      }
    }
  }, [bookingData, newDate]);

  const fetchBookingDetails = async (id) => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_BASE}Bookings/BookingId?Id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data) {
        setBookingData(res.data[0]);
      }
    } catch (error) {
      console.error("Error fetching booking details:", error);
      showAlert("Failed to load booking details.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResumeTimeSlots = async (dateStr) => {
    try {
      const res = await axios.get(`${API_BASE}TimeSlot`, {
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
      const isToday = dateStr && new Date(dateStr).toDateString() === now.toDateString();

      sorted.forEach(({ StartTime, EndTime }) => {
        const [sh, sm] = StartTime.split(":").map(Number);
        const [eh, em] = EndTime.split(":").map(Number);

        const startDate = new Date(dateStr);
        startDate.setHours(sh, sm, 0, 0);
        const endDate = new Date(dateStr);
        endDate.setHours(eh, em, 0, 0);

        const isExpired = isToday && startDate <= twoHoursLater;

        const fmt = (d) =>
          d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
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

  const handleReschedule = async () => {
    if (!newDate) {
      showAlert("Please select a new date.");
      return;
    }
    if (selectedResumeTimes.length === 0) {
      showAlert("Please select at least one time slot.");
      return;
    }

    const timeSlotsText = selectedResumeTimes.join(", ");

    const result = await Swal.fire({
      title: 'Confirm Reschedule',
      text: `Reschedule to ${new Date(newDate).toLocaleDateString('en-GB')} at ${timeSlotsText}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0a6264',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Reschedule',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      setIsSubmitting(true);
      await axios.post(`${API_BASE}Reschedules`, {
        bookingID: bookingId,
        reason: reason,
        oldSchedule: bookingData.BookingDate,
        newSchedule: newDate,
        timeSlot: selectedResumeTimes.join(", "),
        requestedBy: 1,
        Status: ''
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      showAlert("success", "Booking rescheduled successfully!", 3000, "success");
      setShowReschedule(false);
      setNewDate("");
      setSelectedResumeTimes([]);
      setReason("");
      navigate("/profile?tab=mybookings");
    } catch (error) {
      showAlert("Failed to reschedule booking.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSlotToggle = (label) => {
    setSelectedResumeTimes((prev) =>
      prev.includes(label)
        ? prev.filter((x) => x !== label)
        : [...prev, label]
    );
  };

  const renderSlotCategory = (title, icon, slots) => (
    <div className="rs-slot-category">
      <div className="rs-slot-title">
        {icon}
        {title}
      </div>
      {slots.length === 0 ? (
        <div className="rs-no-slots">No slots available</div>
      ) : (
        <div className="rs-slot-list">
          {slots.map((s) => (
            <div className="rs-slot-item" key={s.label}>
              <input
                type="checkbox"
                className="rs-slot-checkbox"
                id={`slot-${s.label}`}
                disabled={s.disabled}
                checked={selectedResumeTimes.includes(s.label)}
                onChange={() => handleSlotToggle(s.label)}
              />
              <label className="rs-slot-label" htmlFor={`slot-${s.label}`}>
                <span className="rs-slot-check">
                  {selectedResumeTimes.includes(s.label) && <FaCheck />}
                </span>
                {s.label} 
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="rs-section">
        <div className="container">
          <div className="rs-loading">
            <div className="rs-spinner"></div>
            <div className="rs-loading-text">Loading booking details...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rs-section">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-9">
            {bookingData && showReschedule && (
              <div className="rs-card">
                {/* Header */}
                <div className="rs-header">
                  <div className="rs-header-content">
                    <div className="rs-title-wrap">
                      <div className="rs-icon-wrap">
                        <FaEdit />
                      </div>
                      <div>
                        <h1 className="rs-title">Reschedule Booking</h1>
                        <p className="rs-subtitle">
                          Choose a new date and time for your service
                        </p>
                      </div>
                    </div>
                    <button
                      className="rs-back-btn"
                      onClick={() => navigate("/profile?tab=mybookings")}
                    >
                      <FaArrowLeft /> Back to Bookings
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="rs-body">
                  {/* Current Booking Info */}
                  <div className="rs-current-info">
                    <div className="rs-info-card">
                      <div className="rs-info-label">
                        <FaCalendarAlt /> Current Date
                      </div>
                      <div className="rs-info-value">
                        {new Date(bookingData.BookingDate).toLocaleDateString('en-GB', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    <div className="rs-info-card">
                      <div className="rs-info-label">
                        <FaClock /> Current Time Slot
                      </div>
                      <div className="rs-info-value">
                        {bookingData.TimeSlot || "Not specified"}
                      </div>
                    </div>
                  </div>

                  {/* New Date Selection */}
                  <div className="rs-form-section">
                    <div className="rs-form-label">
                      <span className="rs-form-label-icon">
                        <FaCalendarAlt />
                      </span>
                      Select New Date
                    </div>
                    <input
                      type="date"
                      className="rs-date-input"
                      value={newDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => {
                        setNewDate(e.target.value);
                        setSelectedResumeTimes([]);
                      }}
                    />
                  </div>

                  {/* Time Slots */}
                  <div className="rs-form-section">
                    <div className="rs-form-label">
                      <span className="rs-form-label-icon">
                        <FaClock />
                      </span>
                      Select Time Slots
                    </div>
                    <div className="rs-slots-grid">
                      {renderSlotCategory("Morning", <FaSun />, resumeMorningSlots)}
                      {renderSlotCategory("Afternoon", <FaCloudSun />, resumeAfternoonSlots)}
                      {renderSlotCategory("Evening", <FaMoon />, resumeEveningSlots)}
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="rs-form-section">
                    <div className="rs-form-label">
                      <span className="rs-form-label-icon">
                        <FaEdit />
                      </span>
                      Reason for Reschedule (Optional)
                    </div>
                    <textarea
                      className="rs-textarea"
                      placeholder="Tell us why you need to reschedule..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>

                  {/* Actions */}
                  <div className="rs-actions">
                    <button
                      className="rs-btn rs-btn-primary"
                      onClick={handleReschedule}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="rs-spinner" style={{ width: 20, height: 20, borderWidth: 2, margin: 0 }}></span>
                          Rescheduling...
                        </>
                      ) : (
                        <>
                          Confirm Reschedule
                          <FaArrowRight className="rs-btn-arrow" />
                        </>
                      )}
                    </button>
                    <a
                      href="tel:7075243939"
                      className="rs-btn rs-btn-secondary"
                    >
                      <FaPhone /> Contact Support
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reschedule;
