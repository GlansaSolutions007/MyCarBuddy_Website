import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "./ConfirmBookingsLayer.css";
import { FaTools, FaCheck, FaCog, FaBoxOpen, FaArrowLeft, FaExclamationCircle } from "react-icons/fa";

const BaseURL = process.env.REACT_APP_CARBUDDY_BASE_URL;

const ConfirmBookingsLayer = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // 1. Get IDs from URL (Updated to get bookingId)
    const custIdFromUrl = searchParams.get("custId");
    const bookingIdFromUrl = searchParams.get("bookingId");

    const [services, setServices] = useState([]);
    const [confirmedAddons, setConfirmedAddons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingDetails, setBookingDetails] = useState(null);
    const [openIncludes, setOpenIncludes] = useState(null);
    const [isChecked, setIsChecked] = useState(false);

    const user = JSON.parse(localStorage.getItem("user"));

    // 2. Fetch Data
    useEffect(() => {
        const fetchBookings = async () => {
            // Check for bookingId instead of trackId
            if (!custIdFromUrl || !bookingIdFromUrl) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                // We still fetch by CustID to get the list (assuming you don't have a GetBookingById endpoint)
                const res = await axios.get(`${BaseURL}Bookings/${custIdFromUrl}`, {
                    headers: {
                        Authorization: `Bearer ${user?.token}`,
                        "Content-Type": "application/json",
                    },
                });

                const data = res.data;

                if (Array.isArray(data) && data.length > 0) {
                    // UPDATED: Filter by BookingID now
                    const matchedBooking = data.find(
                        (b) => String(b.BookingID) === String(bookingIdFromUrl)
                    );

                    if (matchedBooking) {
                        setBookingDetails(matchedBooking);
                        setServices(matchedBooking.BookingsTempAddons || []);
                        setConfirmedAddons(matchedBooking.BookingAddOns || []);
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
    }, [custIdFromUrl, bookingIdFromUrl, user?.token]);

    // Calculate Totals for temp addons (pending confirmation)
    const tempTotals = useMemo(() => {
        return services.reduce(
            (acc, srv) => {
                const qty = Number(srv.Quantity || 1);
                const price = Number(srv.Price || srv.BasePrice || 0);
                const gst = Number(srv.GSTAmount || 0);
                const totalLineItem = (price + gst);
                const labourCharge = Number(srv.LabourCharges || 0);

                return {
                    price: acc.price + (price),
                    gstAmount: acc.gstAmount + (gst),
                    totalAmount: acc.totalAmount + totalLineItem,
                    quantity: acc.quantity + qty,
                    labourCharge: (acc.labourCharge || 0) + labourCharge
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
                const price = Number(srv.ServicePrice || srv.TotalPrice || srv.BasePrice || 0);
                const gst = Number(srv.GSTPrice || srv.GSTAmount || 0);
                const totalLineItem = (price + gst);
                const labourCharge = Number(srv.LabourCharges || 0);

                return {
                    price: acc.price + (price),
                    gstAmount: acc.gstAmount + (gst),
                    totalAmount: acc.totalAmount + totalLineItem,
                    quantity: acc.quantity + qty,
                    labourCharge: (acc.labourCharge || 0) + labourCharge
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
            totalAmount: tempTotals.totalAmount + confirmedTotals.totalAmount + tempTotals.labourCharge + confirmedTotals.labourCharge,
            quantity: tempTotals.quantity + confirmedTotals.quantity,
            labourCharge: tempTotals.labourCharge + confirmedTotals.labourCharge
        };
    }, [tempTotals, confirmedTotals]);

    // ---------------------------------------------------------
    //  HANDLE SUBMIT
    // ---------------------------------------------------------
    const handleSubmit = async () => {
        if (!bookingDetails) return;

        try {
            setIsSubmitting(true);

            // UPDATED: Sending empty object {} as body because no payload is required
            const response = await axios.post(
                `${BaseURL}Supervisor/MoveSupervisorBookings?bookingId=${bookingIdFromUrl}`,
                {}, // <--- Empty body here
                {
                    headers: {
                        Authorization: `Bearer ${user?.token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status === 200 || response.status === 201) {
                Swal.fire({
                    title: "Booking Confirmed!",
                    text: `Services have been successfully confirmed for Booking #${bookingDetails.BookingTrackID}.`,
                    icon: "success",
                    // confirmButtonText: "Go to My Bookings",
                    confirmButtonColor: "#0a6264",
                }).then(() => {
                    navigate("/", { replace: true });
                });
            } else {
                throw new Error("Unexpected response code");
            }

        } catch (error) {
            console.error("Error confirming booking:", error);
            Swal.fire(
                "Submission Failed",
                "Could not confirm services. Please try again.",
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
                <p>We couldn't find the booking with ID: {bookingIdFromUrl}</p>
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
                            Confirm Booking: #{bookingDetails.BookingTrackID}
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
                                    const price = Number(srv.ServicePrice || srv.TotalPrice || srv.BasePrice || 0);
                                    const gst = Number(srv.GSTPrice || srv.GSTAmount || 0);
                                    const total = price + gst + Number(srv.LabourCharges || 0);
                                    const labourCharge = Number(srv.LabourCharges || 0);
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
                                                            <div className="aos-price-value">₹{gst.toFixed(2) / 2}</div>
                                                        </div>
                                                    )}
                                                    {gstPercent > 0 && (
                                                        <div className="aos-price-item">
                                                            <div className="aos-price-label">CGST ({gstPercent / 2}%)</div>
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
                                            <th>Price ₹</th>
                                            <th>Service Charges ₹</th>
                                            {/* <th>GST %</th> */}
                                            <th>SGST ₹</th>
                                            <th>CGST ₹</th>
                                            <th>Total ₹</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {confirmedAddons.map((srv, idx) => {
                                            const price = Number(srv.ServicePrice || srv.TotalPrice || srv.BasePrice || 0);
                                            const gst = Number(srv.GSTPrice || srv.GSTAmount || 0);
                                            const labourCharge = Number(srv.LabourCharges || 0);
                                            const total = price + gst + labourCharge;
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
                                                    <td>₹{gst.toFixed(2) / 2} ({gstPercent / 2}%)</td>
                                                    <td>₹{gst.toFixed(2) / 2} ({gstPercent / 2}%)</td>
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
                                    return (
                                        <div key={`temp-${index}`} className="aos-card" style={{ borderLeft: "4px solid #ffc107" }}>
                                            <div className="aos-card-header">
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
                                                        <div className="aos-price-label">Price</div>
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
                                            <th>S.No</th>
                                            <th>Service Name & Includes</th>
                                            <th>Type</th>
                                            <th>Description</th>
                                            <th>Qty</th>
                                            <th>Price ₹</th>
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
                                            return (
                                                <tr key={`temp-${idx}`} style={{ backgroundColor: "#fffbf0" }}>
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
                                <div className="aos-summary-label">Subtotal</div>
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
                            <div className="aos-summary-item">
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

                    <div className="form-check-a mb-3">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id="approveCheck"
                            checked={isChecked}
                            onChange={(e) => setIsChecked(e.target.checked)}
                            disabled={isSubmitting}
                        />
                        <label className="form-check-label" htmlFor="approveCheck">
                            I have carefully checked and verified all booking added services and agree to proceed with the confirmation.
                        </label>
                    </div>

                    {/* Footer Actions */}
                    <div className="aos-footer">
                        <button className="aos-btn aos-btn-secondary me-3" onClick={() => navigate(-1)} disabled={isSubmitting}>
                            Disapprove & Go Back
                        </button>
                        <button className="aos-btn aos-btn-primary" onClick={handleSubmit} disabled={isSubmitting || !isChecked}>
                            {isSubmitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                                    Processing...
                                </>
                            ) : (
                                <><FaCheck /> Approve Services</>
                            )}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ConfirmBookingsLayer;