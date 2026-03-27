import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import CryptoJS from "crypto-js";
import "./ConfirmBookingsLayer.css";
import { FaTools, FaCheck, FaCog, FaBoxOpen, FaArrowLeft, FaExclamationCircle } from "react-icons/fa";

const BaseURL = process.env.REACT_APP_CARBUDDY_BASE_URL;
const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;

const ConfirmBookingsLayer = ({ custId: custIdProp, bookingId, booking }) => {
    const navigate = useNavigate();

    const [services, setServices] = useState([]);
    const [confirmedAddons, setConfirmedAddons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingDetails, setBookingDetails] = useState(null);
    const [openIncludes, setOpenIncludes] = useState(null);
    const [isChecked, setIsChecked] = useState(false);
    const [selectedServiceIds, setSelectedServiceIds] = useState([]);
    const [isRejectMode, setIsRejectMode] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [checkboxError, setCheckboxError] = useState(false);

    const user = JSON.parse(localStorage.getItem("user"));

    // Resolve custId: prop first, then decrypted from user
    const custId = useMemo(() => {
        if (custIdProp) return custIdProp;
        if (user?.id && secretKey) {
            try {
                const bytes = CryptoJS.AES.decrypt(user.id, secretKey);
                return bytes.toString(CryptoJS.enc.Utf8) || null;
            } catch {
                return null;
            }
        }
        return null;
    }, [custIdProp, user?.id]);

    // 2. Fetch Data
    useEffect(() => {
        const fetchBookings = async () => {
            // Check for bookingId from props
            if (!custId || !bookingId) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                // We still fetch by CustID to get the list (assuming you don't have a GetBookingById endpoint)
                const res = await axios.get(`${BaseURL}Bookings/${custId}`, {
                    headers: {
                        Authorization: `Bearer ${user?.token}`,
                        "Content-Type": "application/json",
                    },
                });

                const data = res.data;

                if (Array.isArray(data) && data.length > 0) {
                    // Filter by BookingID from props
                    const matchedBooking = data.find(
                        (b) => String(b.BookingID) === String(bookingId)
                    );

                        if (matchedBooking) {
                            setBookingDetails(matchedBooking);
                            const tempAddons = matchedBooking.BookingsTempAddons || [];
                            setServices(tempAddons);
                            setConfirmedAddons(matchedBooking.BookingAddOns || []);
                            setSelectedServiceIds(tempAddons.map((a) => a.Id));
                        }
                }
            } catch (error) {
                console.error("Error fetching bookings:", error);
                Swal.fire("Error", "Failed to fetch booking details.", "error");
            } finally {
                setIsLoading(false);
            }
        };

        fetchBookings();
    }, [custId, bookingId, user?.token]);

    // Calculate Totals for temp addons (pending confirmation)
    const tempTotals = useMemo(() => {
        return services.reduce(
            (acc, srv) => {
                const qty = Number(srv.Quantity || 1);
                const price = Number(srv.ServicePrice || srv.BasePrice || 0);
                const gst = Number(srv.GSTPrice || srv.GSTAmount || 0);
                const labourCharge = Number(srv.LabourCharges || 0);
                const totalLineItem = price + labourCharge + gst;

                return {
                    price: acc.price + (price * qty),
                    gstAmount: acc.gstAmount + (gst * qty),
                    totalAmount: acc.totalAmount + totalLineItem,
                    quantity: acc.quantity + qty,
                    labourCharge: (acc.labourCharge || 0) + (labourCharge * qty)
                };
            },
            { price: 0, gstAmount: 0, totalAmount: 0, quantity: 0, labourCharge: 0 }
        );
    }, [services]);

    // Calculate Totals for confirmed addons
    const confirmedTotals = useMemo(() => {
        return confirmedAddons.reduce(
            (acc, srv) => {
                const qty = Number(srv.Quantity || 1);
                const price = Number(srv.ServicePrice || 0);
                const totalLineItem = Number(srv.TotalPrice || 0);
                const labourCharge = Number(srv.LabourCharges || 0);
                const gstAmount = Number(srv.GSTPrice || srv.GSTAmount || 0);

                return {
                    price: acc.price + (price * qty),
                    gstAmount: acc.gstAmount + (gstAmount * qty),
                    totalAmount: acc.totalAmount + totalLineItem,
                    quantity: acc.quantity + qty,
                    labourCharge: acc.labourCharge + (labourCharge * qty)
                };
            },
            { price: 0, gstAmount: 0, totalAmount: 0, quantity: 0, labourCharge: 0 }
        );
    }, [confirmedAddons]);

    // Combined totals
    const totals = useMemo(() => {
        return {
            price: tempTotals.price + confirmedTotals.price,
            gstAmount: tempTotals.gstAmount + confirmedTotals.gstAmount,
            totalAmount: tempTotals.totalAmount + confirmedTotals.totalAmount,
            quantity: tempTotals.quantity + confirmedTotals.quantity,
            labourCharge: tempTotals.labourCharge + confirmedTotals.labourCharge
        };
    }, [tempTotals, confirmedTotals]);

    const toggleServiceSelection = (id) => {
        setSelectedServiceIds((prev) =>
            prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
        );
    };

    // ---------------------------------------------------------
    //  HANDLE SUBMIT
    // ---------------------------------------------------------
    const handleSubmit = async (action = "approve") => {
        if (!bookingDetails) return;

        // For approve, validate checkbox
        if (action === "approve" && services.length > 0 && !isChecked) {
            setCheckboxError(true);
            // Scroll to checkbox section
            const el = document.getElementById("confirm-checkbox-section");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }

        // For reject, validate reason
        if (action === "reject" && !rejectionReason.trim()) {
            Swal.fire("Error", "Please provide a reason for rejection.", "error");
            return;
        }

        const custIdToSend = custId ?? bookingDetails?.CustID;
        if (!custIdToSend) {
            Swal.fire("Error", "Customer ID is required. Please ensure you are logged in.", "error");
            return;
        }

        const effectiveSelectedIds =
            selectedServiceIds && selectedServiceIds.length > 0
                ? selectedServiceIds
                : [];

        if (services.length > 0 && effectiveSelectedIds.length === 0) {
            Swal.fire(
                "No Services Selected",
                "Please select at least one service to proceed.",
                "warning"
            );
            return;
        }

        const addOnIds = effectiveSelectedIds.join(",");

        try {
            setIsSubmitting(true);

            const requestBody = {
                status: action === "approve" ? "Confirmed" : "Reject",
                reason: action === "reject" ? rejectionReason : ""
            };

            const response = await axios.post(
                `${BaseURL}Supervisor/MoveSupervisorBookings?addOnIds=${addOnIds}&custId=${custIdToSend}`,
                requestBody,
                {
                    headers: {
                        Authorization: `Bearer ${user?.token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status === 200 || response.status === 201) {
                const title = action === "approve" ? "Booking Confirmed!" : "Booking Rejected!";
                const message = action === "approve"
                    ? `Services have been successfully confirmed for Booking #${bookingDetails.BookingTrackID}.`
                    : `Booking #${bookingDetails.BookingTrackID} has been rejected.`;
                const icon = action === "approve" ? "success" : "warning";

                // Swal.fire({
                //     title: title,
                //     text: message,
                //     icon: icon,
                //     confirmButtonColor: "#0a6264",
                // }).then(() => {
                //     navigate("/", { replace: true });
                // });
                Swal.fire({
                title: title,
                text: message,
                icon: icon,
                confirmButtonColor: "#0a6264",
                }).then(() => {

                    // 🔥 MAIN CONDITION
                    if (services.length === 0) {
                        navigate("/", { replace: true });
                    } else {
                        window.location.reload();
                    }

                });
            } else {
                throw new Error("Unexpected response code");
            }

        } catch (error) {
            console.error("Error processing booking:", error);
            const actionText = action === "approve" ? "confirm" : "reject";
            Swal.fire(
                "Submission Failed",
                `Could not ${actionText} services. Please try again.`,
                "error"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="aos-section d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!bookingDetails) {
        return (
            <div className="aos-section text-center py-5">
                <FaExclamationCircle className="text-danger mb-3" size={40} />
                <h3>Booking Not Found</h3>
                <p>We couldn't find the booking with ID: {bookingId}</p>
                <div style={{ display: "flex", justifyContent: "center" }}>
                    <button className="aos-btn aos-btn-primary mt-3" onClick={() => navigate(-1)} style={{ minWidth: "180px" }}>
                        <FaArrowLeft /> Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="aos-section">
            <div className="aos-header">
                <h2 className="aos-title">
                    <span className="aos-title-icon">
                        <FaTools />
                    </span>

                    <span className="aos-title-text">
                        <span className="aos-main-title">
                            Confirm Booking: #{bookingDetails.BookingTrackID} (Vehicle Number: {bookingDetails?.Leads?.Vehicle?.RegistrationNumber})
                        </span>
                        <span className="aos-subtitle">
                            Review the services and final charges, then confirm your booking to start the service.
                        </span>
                    </span>
                </h2>

                {(services.length > 0 || confirmedAddons.length > 0) && (
                    <span className="aos-count">
                        {services.length + confirmedAddons.length} Service{(services.length + confirmedAddons.length) !== 1 ? "s" : ""}
                    </span>
                )}
            </div>

            {services.length === 0 && confirmedAddons.length === 0 ? (
                <div className="aos-empty">
                    <div className="aos-empty-icon"><FaTools /></div>
                    <h4>No Additional Services</h4>
                    <p>There are no Add On Bookings found for this booking.</p>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <button
                            className="aos-btn aos-btn-primary mt-3"
                            onClick={() => navigate("/profile?tab=mybookings")}
                            style={{ minWidth: "200px" }}
                        >
                            Go to My Bookings
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Confirmed Booking AddOns Section */}
                    {confirmedAddons.length > 0 && (
                        <div className="mb-4">
                            <h3 className="mb-3" style={{ fontSize: "1.25rem", fontWeight: "600", color: "#0a6264" }}>
                                <FaCheck className="me-2" style={{ color: "#28a745" }} />
                                Confirmed Services
                            </h3>
                            {/* Mobile Cards View - Confirmed */}
                            <div className="aos-grid">
                                {confirmedAddons.map((srv, index) => {
                                    const price = Number(srv.ServicePrice || 0);
                                    const total = Number(srv.TotalPrice || 0);
                                    const labourCharge = Number(srv.LabourCharges || 0);
                                    const gstAmount = Number(srv.GSTPrice || srv.GSTAmount || 0);
                                    const gstPercent = srv.GSTPercent || 0;
                                    return (
                                        <div key={`confirmed-${index}`} className="aos-card" style={{ borderLeft: "4px solid #28a745" }}>
                                            <div className="aos-card-header">
                                                <div className="aos-card-info">
                                                    <h4 className="aos-card-name">{srv.ServiceName}</h4>
                                                    <span className="aos-card-type services">
                                                        <FaCog />
                                                        {srv.IsInspection ? "Inspection" : "Service"}
                                                    </span>
                                                </div>
                                                <div className="aos-card-qty">
                                                    <span className="aos-card-qty-label">Qty</span>
                                                    <span className="aos-card-qty-value">{srv.Quantity || 1}</span>
                                                </div>
                                            </div>
                                            <div className="aos-card-body">
                                                {srv.Description && <p className="aos-card-desc">{srv.Description}</p>}
                                                <div className="aos-card-pricing">
                                                    <div className="aos-price-item">
                                                        <div className="aos-price-label">Price</div>
                                                        <div className="aos-price-value">₹{price.toFixed(2)}</div>
                                                    </div>
                                                    {labourCharge > 0 && (
                                                        <div className="aos-price-item">
                                                            <div className="aos-price-label">Service Charges</div>
                                                            <div className="aos-price-value">₹{labourCharge.toFixed(2)}</div>
                                                        </div>
                                                    )}
                                                    {gstPercent > 0 && (
                                                        <div className="aos-price-item">
                                                            <div className="aos-price-label">SGST ({gstPercent / 2}%)</div>
                                                            <div className="aos-price-value">₹{(gstAmount / 2).toFixed(2)}</div>
                                                        </div>
                                                    )}
                                                    {gstPercent > 0 && (
                                                        <div className="aos-price-item">
                                                            <div className="aos-price-label">CGST ({gstPercent / 2}%)</div>
                                                            <div className="aos-price-value">₹{(gstAmount / 2).toFixed(2)}</div>
                                                        </div>
                                                    )}
                                                    {Array.isArray(srv.Includes) && srv.Includes.length > 0 && (
                                                        <div className="aos-includes">
                                                            <div className="aos-include-label">Includes</div>
                                                            {/* HEADER */}
                                                            <div
                                                                className="aos-includes-header"
                                                                onClick={() =>
                                                                    setOpenIncludes(openIncludes === index ? null : index)
                                                                }
                                                            >
                                                                <span className="aos-includes-title">
                                                                    Includes ({srv.Includes.length})
                                                                </span>
                                                                <span className={`aos-includes-arrow ${openIncludes === index ? "open" : ""}`}>
                                                                    ▾
                                                                </span>
                                                            </div>

                                                            {/* DROPDOWN CONTENT */}
                                                            {openIncludes === index && (
                                                                <ul className="aos-includes-list">
                                                                    {srv.Includes.map((inc) => (
                                                                        <li key={inc.IncludeID} className="aos-include-item">
                                                                            {inc.IncludeName}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="aos-card-footer">
                                                <div className="aos-total-row">
                                                    <span className="aos-total-label">Total Amount</span>
                                                    <span className="aos-total-value">₹{total.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop Table View - Confirmed */}
                            <div className="aos-table-wrapper mb-4">
                                <table className="aos-table">
                                    <thead>
                                        <tr>
                                            <th>S.No</th>
                                            <th>Service Name & Includes</th>
                                            <th>Type</th>
                                            <th>Description</th>
                                            <th>Qty</th>
                                            <th>Part Price ₹</th>
                                            <th>Service Charges ₹</th>
                                            {/* <th>GST %</th> */}
                                            <th>SGST ₹</th>
                                            <th>CGST ₹</th>
                                            <th>Total ₹</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {confirmedAddons.map((srv, idx) => {
                                            const price = Number(srv.ServicePrice || 0);
                                            const total = Number(srv.TotalPrice || 0);
                                            const labourCharge = Number(srv.LabourCharges || 0);
                                            const gstAmount = Number(srv.GSTPrice || srv.GSTAmount || 0);
                                            const gstPercent = srv.GSTPercent || 0;
                                            return (
                                                <tr key={`confirmed-${idx}`} style={{ backgroundColor: "#f0f9f0" }}>
                                                    <td>{idx + 1}</td>
                                                    <td>
                                                        <span className="aos-table-name" title={srv.ServiceName}>
                                                            {srv.ServiceName}
                                                        </span>
                                                        {srv.Includes?.length > 0 && (
                                                            <details className="aos-includes-dropdown">
                                                                <summary className="aos-table-includes-inline">
                                                                    Includes ({srv.Includes.length})
                                                                    <span className="aos-arrow">▾</span>
                                                                </summary>

                                                                <div className="aos-includes-list">
                                                                    {srv.Includes.map((i) => (
                                                                        <div key={i.IncludeID} className="aos-include-item">
                                                                            {i.IncludeName}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </details>
                                                        )}
                                                    </td>
                                                    <td><span className="aos-table-type services">{srv.IsInspection ? "Inspection" : "Service"}</span></td>
                                                    <td><span className="aos-table-desc" title={srv.Description}>{srv.Description || "-"}</span></td>
                                                    <td>{srv.Quantity || 1}</td>
                                                    <td className="aos-table-price">₹{price.toFixed(2)}</td>
                                                    <td className="aos-table-price">₹{(srv.LabourCharges || 0).toFixed(2)}</td>
                                                    {/* <td>{gstPercent}%</td> */}
                                                    <td>₹{(gstAmount / 2).toFixed(2)} ({gstPercent / 2}%)</td>
                                                    <td>₹{(gstAmount / 2).toFixed(2)} ({gstPercent / 2}%)</td>
                                                    <td className="aos-table-total">₹{total.toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Pending Confirmation Temp Addons Section */}
                    {services.length > 0 && (
                        <div className="mb-4">
                            <h3 className="mb-3" style={{ fontSize: "1.25rem", fontWeight: "600", color: "#0a6264" }}>
                                <FaExclamationCircle className="me-2" style={{ color: "#ffc107" }} />
                                Added Services (Pending Approve)
                            </h3>
                            {/* Mobile Cards View - Temp Addons */}
                            <div className="aos-grid">
                                {services.map((srv, index) => {
                                    const price = Number(srv.Price || srv.BasePrice || 0);
                                    const gst = Number(srv.GSTAmount || 0);
                                    const labourCharge = Number(srv.LabourCharges || 0);
                                    const total = price + gst + labourCharge;
                                    const isSelected = selectedServiceIds.includes(srv.Id);
                                    return (
                                        <div key={`temp-${index}`} className="aos-card" style={{ borderLeft: "4px solid #ffc107" }}>
                                            <div className="aos-card-header-approve">
                                                <div className="aos-card-select">
                                                    <button
                                                        type="button"
                                                        className={`aos-select-toggle ${isSelected ? "selected" : ""}`}
                                                        onClick={() => toggleServiceSelection(srv.Id)}
                                                        disabled={isSubmitting}
                                                    >
                                                        {isSelected ? "✓" : ""}
                                                    </button>
                                                </div>
                                                <div className="aos-card-info">
                                                    <h4 className="aos-card-name">{srv.ServiceName}</h4>
                                                    <span className={`aos-card-type ${srv.ServiceType?.toLowerCase().includes("part") ? "bodyparts" : "services"}`}>
                                                        {srv.ServiceType?.toLowerCase().includes("part") ? <FaBoxOpen /> : <FaCog />}
                                                        {srv.ServiceType}
                                                    </span>
                                                </div>
                                                <div className="aos-card-qty">
                                                    <span className="aos-card-qty-label">Qty</span>
                                                    <span className="aos-card-qty-value">{srv.Quantity || 1}</span>
                                                </div>
                                            </div>
                                            <div className="aos-card-body">
                                                {srv.Description && <p className="aos-card-desc">{srv.Description}</p>}
                                                <div className="aos-card-pricing">
                                                    <div className="aos-price-item">
                                                        <div className="aos-price-label">Parts Price</div>
                                                        <div className="aos-price-value">₹{price.toFixed(2)}</div>
                                                    </div>
                                                    {labourCharge > 0 && (
                                                        <div className="aos-price-item">
                                                            <div className="aos-price-label">Service Charges</div>
                                                            <div className="aos-price-value">₹{labourCharge.toFixed(2)}</div>
                                                        </div>
                                                    )}
                                                    {srv.GSTPercent > 0 && (
                                                        <div className="aos-price-item">
                                                            <div className="aos-price-label">SGST ({srv.GSTPercent / 2}%)</div>
                                                            <div className="aos-price-value">₹{gst.toFixed(2) / 2}</div>
                                                        </div>
                                                    )}
                                                    {srv.GSTPercent > 0 && (
                                                        <div className="aos-price-item">
                                                            <div className="aos-price-label">CGST ({srv.GSTPercent / 2}%)</div>
                                                            <div className="aos-price-value">₹{gst.toFixed(2) / 2}</div>
                                                        </div>
                                                    )}
                                                    {Array.isArray(srv.Includes) && srv.Includes.length > 0 && (
                                                        <div className="aos-includes">
                                                            <div className="aos-include-label">Includes</div>
                                                            {/* HEADER */}
                                                            <div
                                                                className="aos-includes-header"
                                                                onClick={() =>
                                                                    setOpenIncludes(openIncludes === index ? null : index)
                                                                }
                                                            >
                                                                <span className="aos-includes-title">
                                                                    Includes ({srv.Includes.length})
                                                                </span>
                                                                <span className={`aos-includes-arrow ${openIncludes === index ? "open" : ""}`}>
                                                                    ▾
                                                                </span>
                                                            </div>

                                                            {/* DROPDOWN CONTENT */}
                                                            {openIncludes === index && (
                                                                <ul className="aos-includes-list">
                                                                    {srv.Includes.map((inc) => (
                                                                        <div key={inc.IncludeID} className="aos-include-item">
                                                                            {inc.IncludeName}
                                                                        </div>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="aos-card-footer">
                                                <div className="aos-total-row">
                                                    <span className="aos-total-label">Total Amount</span>
                                                    <span className="aos-total-value">₹{total.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop Table View - Temp Addons */}
                            <div className="aos-table-wrapper">
                                <table className="aos-table">
                                    <thead>
                                        <tr>
                                            <th className="aos-select-col">Select</th>
                                            <th>S.No</th>
                                            <th>Service Name & Includes</th>
                                            <th>Type</th>
                                            <th>Description</th>
                                            <th>Qty</th>
                                            <th>Part Price ₹</th>
                                            <th>Service Charges ₹</th>
                                            {/* <th>GST %</th> */}
                                            <th>SGST ₹</th>
                                            <th>CGST ₹</th>
                                            <th>Total ₹</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {services.map((srv, idx) => {
                                            const price = Number(srv.Price || srv.BasePrice || 0);
                                            const gst = Number(srv.GSTAmount || 0);
                                            const labourCharge = Number(srv.LabourCharges || 0);
                                            const total = price + gst + labourCharge;
                                            const isSelected = selectedServiceIds.includes(srv.Id);
                                            return (
                                                <tr key={`temp-${idx}`} style={{ backgroundColor: "#fffbf0" }}>
                                                    <td className="aos-select-col">
                                                        <button
                                                            type="button"
                                                            className={`aos-select-toggle ${isSelected ? "selected" : ""}`}
                                                            onClick={() => toggleServiceSelection(srv.Id)}
                                                            disabled={isSubmitting}
                                                        >
                                                            {isSelected ? "✓" : ""}
                                                        </button>
                                                    </td>
                                                    <td>{idx + 1}</td>
                                                    <td>
                                                        <span className="aos-table-name" title={srv.ServiceName}>
                                                        {/* <span className={`aos-table-name ${
                                                            srv.Includes?.length > 0 ? "text-left" : "text-center"
                                                        }`} title={srv.ServiceName}> */}
                                                            {srv.ServiceName}
                                                        </span>
                                                        {srv.Includes?.length > 0 && (
                                                            <details className="aos-includes-dropdown">
                                                                <summary className="aos-table-includes-inline">
                                                                    Includes ({srv.Includes.length})
                                                                    <span className="aos-arrow">▾</span>
                                                                </summary>

                                                                <div className="aos-includes-list">
                                                                    {srv.Includes.map((i) => (
                                                                        <div key={i.IncludeID} className="aos-include-item">
                                                                            {i.IncludeName}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </details>
                                                        )}
                                                    </td>
                                                    <td><span className={`aos-table-type ${srv.ServiceType?.toLowerCase().includes("part") ? "bodyparts" : "services"}`}>{srv.ServiceType}</span></td>
                                                    <td><span className="aos-table-desc" title={srv.Description}>{srv.Description || "-"}</span></td>
                                                    <td>{srv.Quantity || 1}</td>
                                                    <td className="aos-table-price">₹{price.toFixed(2)}</td>
                                                    <td className="aos-table-price">₹{(srv.LabourCharges || 0).toFixed(2)}</td>
                                                    {/* <td>{srv.GSTPercent || 0}%</td> */}
                                                    <td>₹{gst.toFixed(2) / 2} ({srv.GSTPercent / 2 || 0}%)</td>
                                                    <td>₹{gst.toFixed(2) / 2} ({srv.GSTPercent / 2 || 0}%)</td>
                                                    <td className="aos-table-total">₹{total.toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Summary Section */}
                    <div className="aos-summary">
                        <div className="aos-summary-title">Order Summary</div>
                        <div className="aos-summary-grid">
                            <div className="aos-summary-item d-none">
                                <div className="aos-summary-label">Total Items</div>
                                <div className="aos-summary-value">{totals.quantity}</div>
                            </div>
                            <div className="aos-summary-item">
                                <div className="aos-summary-label">Parts Subtotal</div>
                                <div className="aos-summary-value">₹{totals.price.toFixed(2)}</div>
                            </div>
                            <div className="aos-summary-item">
                                <div className="aos-summary-label">Service Charges</div>
                                <div className="aos-summary-value">₹{totals.labourCharge.toFixed(2)}</div>
                            </div>
                            <div className="aos-summary-item">
                                <div className="aos-summary-label">SGST</div>
                                <div className="aos-summary-value">₹{totals.gstAmount.toFixed(2) / 2}</div>
                            </div>
                            <div className="aos-summary-item">
                                <div className="aos-summary-label">CGST</div>
                                <div className="aos-summary-value">₹{totals.gstAmount.toFixed(2) / 2}</div>
                            </div>
                            <div className="aos-summary-item bg-warning text-dark">
                                <div className="aos-summary-label">Grand Total</div>
                                <div className="aos-summary-value">₹{totals.totalAmount.toFixed(2)}</div>
                            </div>
                        </div>
                        {services.length > 0 && (
                            <div className="mt-3 p-3" style={{ backgroundColor: "#fffbf0", borderRadius: "8px", border: "1px solid #ffc107" }}>
                                <small style={{ color: "#856404" }}>
                                    <FaExclamationCircle className="me-1" />
                                    <strong>Note:</strong> {services.length} extra service{services.length !== 1 ? "s" : ""} {services.length !== 1 ? "are" : "is"} pending approve. Please review and confirm to proceed.
                                </small>
                            </div>
                        )}
                    </div>

                    {/* Rejection Reason Textarea - Hidden until reject mode */}
                    {isRejectMode && (
                        <div className="mb-3 p-3" style={{ backgroundColor: "#ffe6e6", borderRadius: "8px", border: "1px solid #ff6b6b" }}>
                            <label className="form-label" style={{ fontWeight: "600", color: "#c92a2a", marginBottom: "10px" }}>
                                Reason for Rejection <span style={{ color: "#ff0000" }}>*</span>
                            </label>
                            <textarea
                                className="form-control"
                                placeholder="Please provide a detailed reason for rejecting this booking..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                disabled={isSubmitting}
                                rows="4"
                                style={{ borderColor: "#ff6b6b" }}
                            />
                            <small style={{ color: "#c92a2a" }}>
                                Required field - Please be specific about the reason for rejection.
                            </small>
                        </div>
                    )}

                    {!isRejectMode && services.length > 0 && (
                        <div
                            id="confirm-checkbox-section"
                            className={`form-check-a mb-3${checkboxError ? " form-check-a--error" : ""}`}
                        >
                            <button
                                type="button"
                                className={`aos-select-toggle ${isChecked ? "selected" : ""}${checkboxError ? " aos-select-toggle--error" : ""}`}
                                onClick={() => {
                                    setIsChecked((prev) => !prev);
                                    setCheckboxError(false);
                                }}
                                disabled={isSubmitting}
                            >
                                {isChecked ? "✓" : ""}
                            </button>
                            <div className="form-check-label-wrap">
                                <span className="form-check-label">
                                    I have carefully checked and verified all booking added services and agree to proceed with the confirmation.
                                </span>
                                {checkboxError && (
                                    <span className="form-check-error-msg">
                                        <FaExclamationCircle className="me-1" />
                                        Please check this box before approving services.
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="aos-footer">
                        {services.length === 0 && confirmedAddons.length > 0 ? (
                            // All services already approved — no pending temp addons
                            <div
                                className="w-100 p-3 d-flex align-items-center gap-2"
                                style={{
                                    backgroundColor: "#f0f9f0",
                                    borderRadius: "8px",
                                    border: "1px solid #28a745",
                                }}
                            >
                                <FaCheck style={{ color: "#28a745", flexShrink: 0 }} />
                                <span style={{ color: "#1a6e2e", fontWeight: "500" }}>
                                    {confirmedAddons.length === 1
                                        ? "The service for this booking has already been approved."
                                        : `All ${confirmedAddons.length} services for this booking have already been approved.`}
                                </span>
                            </div>
                        ) : !isRejectMode ? (
                            <>
                                <button
                                    className="aos-btn aos-btn-secondary me-3"
                                    onClick={() => navigate(-1)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="aos-btn aos-btn-primary me-3"
                                    onClick={() => handleSubmit("approve")}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                aria-hidden="true"
                                            ></span>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <FaCheck /> Approve Services
                                        </>
                                    )}
                                </button>
                                <button
                                    className="aos-btn aos-btn-danger"
                                    onClick={() => setIsRejectMode(true)}
                                    disabled={isSubmitting}
                                >
                                    Reject
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    className="aos-btn aos-btn-secondary me-3"
                                    onClick={() => setIsRejectMode(false)}
                                    disabled={isSubmitting}
                                >
                                    Back
                                </button>
                                <button
                                    className="aos-btn aos-btn-danger"
                                    onClick={() => handleSubmit("reject")}
                                    disabled={isSubmitting || !rejectionReason.trim()}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                aria-hidden="true"
                                            ></span>
                                            Processing...
                                        </>
                                    ) : (
                                        <>Confirm Rejection</>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ConfirmBookingsLayer;