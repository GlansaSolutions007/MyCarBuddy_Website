import React, { useState } from "react";
import Swal from "sweetalert2";
import "./AddOnServicesLayer.css";
import { FaTools, FaCheck, FaCog, FaBoxOpen } from "react-icons/fa";

const AddOnServicesLayer = () => {
    // Static sample data
    const [services, setServices] = useState([
        {
            id: 1,
            name: "Engine Oil Replacement",
            type: "BodyParts",
            price: 800,
            gstPercent: 18,
            gstAmount: 144,
            totalAmount: 944,
            description: "Oil Client provided",
            quentity: 3,
        },
        {
            id: 2,
            name: "Wheel Alignment",
            type: "Services",
            price: 500,
            gstPercent: 18,
            gstAmount: 90,
            totalAmount: 590,
            description: "Wheel Alignment Important - Professional alignment service for optimal tire performance",
            quentity: 1,
        },
        {
            id: 3,
            name: "AC Gas Topup",
            type: "BodyParts",
            price: 1200,
            gstPercent: 18,
            gstAmount: 216,
            totalAmount: 1416,
            description: "AC Gas Included - Premium refrigerant for maximum cooling",
            quentity: 7,
        },
    ]);

    // Calculate totals
    const totals = services.reduce(
        (acc, srv) => ({
            price: acc.price + srv.price * srv.quentity,
            gstAmount: acc.gstAmount + srv.gstAmount * srv.quentity,
            totalAmount: acc.totalAmount + srv.totalAmount * srv.quentity,
            quantity: acc.quantity + srv.quentity,
        }),
        { price: 0, gstAmount: 0, totalAmount: 0, quantity: 0 }
    );

    // SweetAlert confirmation
    const handleSubmit = () => {
        Swal.fire({
            title: "Services Confirmed!",
            text: "Your Add-on Services have been successfully submitted.",
            icon: "success",
            confirmButtonText: "OK",
            confirmButtonColor: "#0a6264",
        });
    };

    return (
        <div className="aos-section">
            {/* Header */}
            <div className="aos-header">
                <h2 className="aos-title">
                    <span className="aos-title-icon">
                        <FaTools />
                    </span>
                    Add-On Booking's
                </h2>
                {services.length > 0 && (
                    <span className="aos-count">
                        {services.length} Service{services.length !== 1 ? "s" : ""}
                    </span>
                )}
            </div>

            {services.length === 0 ? (
                <div className="aos-empty">
                    <div className="aos-empty-icon">
                        <FaTools />
                    </div>
                    <h4>No Add-On Services</h4>
                    <p>There are no additional services added to this booking.</p>
                </div>
            ) : (
                <>
                    {/* Mobile Cards View */}
                    <div className="aos-grid">
                        {services.map((srv) => (
                            <div key={srv.id} className="aos-card">
                                <div className="aos-card-header">
                                    <div className="aos-card-info">
                                        <h4 className="aos-card-name">{srv.name}</h4>
                                        <span className={`aos-card-type ${srv.type.toLowerCase()}`}>
                                            {srv.type === "BodyParts" ? (
                                                <FaBoxOpen />
                                            ) : (
                                                <FaCog />
                                            )}
                                            {srv.type}
                                        </span>
                                    </div>
                                    <div className="aos-card-qty">
                                        <span className="aos-card-qty-label">Qty</span>
                                        <span className="aos-card-qty-value">{srv.quentity}</span>
                                    </div>
                                </div>

                                <div className="aos-card-body">
                                    {srv.description && (
                                        <p className="aos-card-desc">{srv.description}</p>
                                    )}

                                    <div className="aos-card-pricing">
                                        <div className="aos-price-item">
                                            <div className="aos-price-label">Price</div>
                                            <div className="aos-price-value">₹{srv.price}</div>
                                        </div>
                                        <div className="aos-price-item">
                                            <div className="aos-price-label">GST ({srv.gstPercent}%)</div>
                                            <div className="aos-price-value">₹{srv.gstAmount}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="aos-card-footer">
                                    <div className="aos-total-row">
                                        <span className="aos-total-label">Total Amount</span>
                                        <span className="aos-total-value">₹{srv.totalAmount * srv.quentity}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="aos-table-wrapper">
                        <table className="aos-table">
                            <thead>
                                <tr>
                                    <th>S.No</th>
                                    <th>Service Name</th>
                                    <th>Description</th>
                                    <th>Type</th>
                                    <th>Qty</th>
                                    <th>Price</th>
                                    <th>GST %</th>
                                    <th>GST ₹</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {services.map((srv, idx) => (
                                    <tr key={srv.id}>
                                        <td>{idx + 1}</td>
                                        <td>
                                            <span className="aos-table-name" title={srv.name}>
                                                {srv.name}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="aos-table-desc" title={srv.description}>
                                                {srv.description || "-"}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`aos-table-type ${srv.type.toLowerCase()}`}>
                                                {srv.type}
                                            </span>
                                        </td>
                                        <td>{srv.quentity}</td>
                                        <td className="aos-table-price">₹{srv.price}</td>
                                        <td>{srv.gstPercent}%</td>
                                        <td>₹{srv.gstAmount}</td>
                                        <td className="aos-table-total">₹{srv.totalAmount * srv.quentity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Section */}
                    <div className="aos-summary">
                        <div className="aos-summary-title">Order Summary</div>
                        <div className="aos-summary-grid">
                            <div className="aos-summary-item">
                                <div className="aos-summary-label">Total Items</div>
                                <div className="aos-summary-value">{totals.quantity}</div>
                            </div>
                            <div className="aos-summary-item">
                                <div className="aos-summary-label">Subtotal</div>
                                <div className="aos-summary-value">₹{totals.price}</div>
                            </div>
                            <div className="aos-summary-item">
                                <div className="aos-summary-label">GST</div>
                                <div className="aos-summary-value">₹{totals.gstAmount}</div>
                            </div>
                            <div className="aos-summary-item">
                                <div className="aos-summary-label">Grand Total</div>
                                <div className="aos-summary-value">₹{totals.totalAmount}</div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="aos-footer">
                        <button className="aos-btn aos-btn-primary" onClick={handleSubmit}>
                            <FaCheck /> Confirm Services
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default AddOnServicesLayer;
