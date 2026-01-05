import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "./QuickBookingsLayer.css";
import { FaTools, FaCheck, FaCog, FaBoxOpen, FaArrowLeft, FaExclamationCircle } from "react-icons/fa";

const BaseURL = process.env.REACT_APP_CARBUDDY_BASE_URL;

const QuickBookingsLayer = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // 1. Get IDs from URL (Updated to get bookingId)
    const custIdFromUrl = searchParams.get("custId");
    const bookingIdFromUrl = searchParams.get("bookingId");

    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingDetails, setBookingDetails] = useState(null);
    // const qty = Number(srv.Quantity || 1);

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

    // Calculate Totals
    const totals = useMemo(() => {
        return services.reduce(
            (acc, srv) => {
                const qty = Number(srv.Quantity || 1);
                const price = Number(srv.Price || 0);
                const gst = Number(srv.GSTAmount || 0);
                const labourCharge = Number(srv.LabourCharges || 0);

                return {
                    price: acc.price + price ,
                    gstAmount: acc.gstAmount + gst,
                    labourCharge: acc.labourCharge + labourCharge,
                    totalAmount: acc.totalAmount + (price + gst + labourCharge),
                    quantity: acc.quantity + qty,
                };
            },
            { price: 0, gstAmount: 0, totalAmount: 0, quantity: 0, labourCharge: 0 }
        );
    }, [services]);


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

                {services.length > 0 && (
                    <span className="aos-count">
                        {services.length} Service{services.length !== 1 ? "s" : ""}
                    </span>
                )}
            </div>

            {services.length === 0 ? (
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
                    {/* Mobile Cards View */}
                    <div className="aos-grid">
                        {services.map((srv, index) => {
                            const price = Number(srv.Price || 0);
                            const gst = Number(srv.GSTAmount || 0);
                            const labourCharge = Number(srv.LabourCharges || 0);
                            const qty = Number(srv.Quantity || 1);
                            const total = (price + gst + labourCharge) * qty;
                            return (
                                <div key={index} className="aos-card">
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
                                            <span className="aos-card-qty-value"> {srv.Quantity || 1}</span>
                                        </div>
                                    </div>
                                    <div className="aos-card-body">
                                        {srv.Description && <p className="aos-card-desc">{srv.Description}</p>}
                                        <div className="aos-card-pricing">
                                            <div className="aos-price-item">
                                                <div className="aos-price-label">Price</div>
                                                <div className="aos-price-value">₹{price.toFixed(2)}</div>
                                            </div>
                                            <div className="aos-price-item">
                                                <div className="aos-price-label">Labour Charges</div>
                                                <div className="aos-price-value">₹{labourCharge.toFixed(2)}</div>
                                            </div>
                                            <div className="aos-price-item">
                                                <div className="aos-price-label">GST ({srv.GSTPercent}%)</div>
                                                <div className="aos-price-value">₹{gst.toFixed(2)}</div>
                                            </div>
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

                    {/* Desktop Table View */}
                    <div className="aos-table-wrapper">
                        <table className="aos-table">
                            <thead>
                                <tr>
                                    <th>S.No</th>
                                    <th>Service Name</th>
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>Qty</th>
                                    <th>Price</th>
                                    <th>Labour Charges ₹</th>
                                    <th>GST %</th>
                                    <th>GST ₹</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {services.map((srv, idx) => {
                                    const price = Number(srv.Price || 0);
                                    const gst = Number(srv.GSTAmount || 0);
                                    const total = price + gst + (Number(srv.LabourCharges) || 0);
                                    return (
                                        <tr key={idx}>
                                            <td>{idx + 1}</td>
                                            <td><span className="aos-table-name" title={srv.ServiceName}>{srv.ServiceName}</span></td>
                                            <td><span className={`aos-table-type ${srv.ServiceType?.toLowerCase().includes("part") ? "bodyparts" : "services"}`}>{srv.ServiceType}</span></td>
                                            <td><span className="aos-table-desc" title={srv.Description}>{srv.Description || "-"}</span></td>
                                            <td>{srv.Quantity || 1}</td>
                                            <td className="aos-table-price">₹{price.toFixed(2)}</td>
                                            <td className="aos-table-price">₹{srv.LabourCharges?.toFixed(2) || "0.00"}</td>
                                            <td>{srv.GSTPercent}%</td>
                                            <td>₹{gst.toFixed(2)}</td>
                                            <td className="aos-table-total">₹{total.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Section */}
                    <div className="aos-summary">
                        <div className="aos-summary-title">Order Summary</div>
                        <div className="aos-summary-grid">
                            {/* <div className="aos-summary-item">
                                <div className="aos-summary-label">Total Quantity</div>
                                <div className="aos-summary-value">{totals.quantity}</div>
                            </div> */}
                            <div className="aos-summary-item">
                                <div className="aos-summary-label">Subtotal</div>
                                <div className="aos-summary-value">₹{totals.price.toFixed(2)}</div>
                            </div>
                            <div className="aos-summary-item">
                                <div className="aos-summary-label">Labour Charges</div>
                                <div className="aos-summary-value">₹{totals.labourCharge.toFixed(2)}</div>
                            </div>
                            <div className="aos-summary-item">
                                <div className="aos-summary-label">GST</div>
                                <div className="aos-summary-value">₹{totals.gstAmount.toFixed(2)}</div>
                            </div>
                            <div className="aos-summary-item">
                                <div className="aos-summary-label">Grand Total</div>
                                <div className="aos-summary-value">₹{totals.totalAmount.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="aos-footer">
                        <button className="aos-btn aos-btn-secondary me-3" onClick={() => navigate(-1)} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button className="aos-btn aos-btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                                    Processing...
                                </>
                            ) : (
                                <><FaCheck /> Confirm Services</>
                            )}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default QuickBookingsLayer;