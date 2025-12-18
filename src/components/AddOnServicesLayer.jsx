import React, { useState } from "react";
import Swal from "sweetalert2";

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
            description: "Wheel Alignment Importaint Wheel Alignment Importaint",
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
            description: "AC Gas Inluded",
            quentity: 7,
        },
    ]);

    // SweetAlert confirmation
    const handleSubmit = () => {
        Swal.fire({
            title: "Services Confirmed!",
            text: "Your Add-on Services have been successfully submitted.",
            icon: "success",
            confirmButtonText: "OK",
            confirmButtonColor: "#3085d6",
        });
    };

    // Function to limit description
    const limitText = (text, limit) => {
        if (!text) return "";
        return text.length > limit ? text.substring(0, limit) + "..." : text;
    };

    return (
        <div className="card p-3 shadow-sm" style={{ borderRadius: "12px" }}>
            {/* Table Wrapper */}
            <div
                style={{
                    maxHeight: "420px",
                    overflowY: "auto",
                    border: "1px solid #e1e5ea",
                    borderRadius: "10px",
                    marginTop: "10px",
                    background: "#fff",
                }}
            >
                <table className="table table-hover table-bordered mb-0 text-center"
                    style={{ fontSize: "14px" }}
                >
                    <thead
                        style={{
                            position: "sticky",
                            top: 0,
                            background: "#f8f9fb",
                            zIndex: 5,
                            fontSize: "14px",
                            color: "#333",
                        }}
                    >
                        <tr>
                            <th className="py-2 px-3">S.N</th>
                            <th className="py-2 px-3">Service Name</th>
                            <th className="py-2 px-3">Description</th>
                            <th className="py-2 px-3">Type</th>
                            <th className="py-2 px-3">Qty.</th>
                            <th className="py-2 px-3">Price</th>
                            <th className="py-2 px-3">GST%</th>
                            <th className="py-2 px-3">GST ₹</th>
                            <th className="py-2 px-3">Total Amount</th>
                        </tr>
                    </thead>

                    <tbody>
                        {services.length > 0 ? (
                            services.map((srv, idx) => (
                                <tr key={srv.id}>
                                    <td className="py-2 px-3">{idx + 1}</td>

                                    <td
                                        className="py-2 px-3"
                                        style={{
                                            maxWidth: "180px",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            fontWeight: 500,
                                            color: "#212529",
                                        }}
                                        title={srv.name}
                                    >
                                        {srv.name}
                                    </td>

                                    {/* Description with character limit + tooltip */}
                                    <td
                                        className="py-2 px-3"
                                        style={{
                                            maxWidth: "240px",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            color: "#555",
                                        }}
                                        title={srv.description}
                                    >
                                        {limitText(srv.description, 45)}
                                    </td>

                                    <td className="py-2 px-3 text-secondary">{srv.type}</td>
                                    <td className="py-2 px-3 text-secondary">{srv.quentity}</td>
                                    <td className="py-2 px-3 fw-semibold">₹{srv.price}</td>
                                    <td className="py-2 px-3">{srv.gstPercent}%</td>
                                    <td className="py-2 px-3">₹{srv.gstAmount}</td>
                                    <td className="py-2 px-3 fw-semibold text-primary">₹{srv.totalAmount}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td className="text-center py-3" colSpan="8">
                                    <span className="text-muted">No Add-on Services Found</span>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Submit Button */}
            <div className="d-flex justify-content-end align-items-center mt-3 gap-3">
                <button
                    className="btn btn-primary fw-semibold d-flex justify-content-center align-items-center"
                    style={{ width: "100px", height: "35px", fontSize: "15px" }}
                    onClick={handleSubmit}
                >
                    Confirm
                </button>
            </div>
        </div>
    );
};

export default AddOnServicesLayer;
