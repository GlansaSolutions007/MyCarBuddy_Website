import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CryptoJS from "crypto-js";
import "./MyInspection.css";
import {
    FaArrowLeft,
    FaExclamationCircle,
    FaMoneyBill,
    FaCreditCard,
    FaCalendarAlt,
    FaIdBadge,
    FaCheckCircle,
} from "react-icons/fa";

const BaseURL = process.env.REACT_APP_CARBUDDY_BASE_URL;
const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;

const MyInspection = () => {
    const navigate = useNavigate();

    const [payments, setPayments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const getDecryptedCustId = () => {
        try {
            const user = JSON.parse(localStorage.getItem("user"));
            if (!user?.id) return null;
            const bytes = CryptoJS.AES.decrypt(user.id, secretKey);
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch (error) {
            console.error("Error decrypting customer ID:", error);
            return null;
        }
    };

    // Fetch Inspection for logged-in customer
    useEffect(() => {
        const fetchInspectionPayments = async () => {
            const custId = getDecryptedCustId();
            if (!custId) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const res = await axios.get(
                    `${BaseURL}Leads/InspectionPayments?custId=${custId}`
                );
                const data = res.data;
                if (Array.isArray(data)) {
                    setPayments(data);
                } else {
                    setPayments([]);
                }
            } catch (error) {
                console.error("Error fetching Inspection:", error);
                setPayments([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInspectionPayments();
    }, []);

    if (isLoading) {
        return (
            <div className="me-section me-loading">
                <div className="me-spinner"></div>
                <p className="me-loading-text">Loading your Inspection...</p>
            </div>
        );
    }

    if (!payments || payments.length === 0) {
        return (
            <div className="me-section me-empty">
                <div className="me-empty-icon">
                    <FaExclamationCircle />
                </div>
                <h3 className="me-empty-title">No Inspection Found</h3>
                <p className="me-empty-text">
                    We couldn't find any Inspection associated with your account.
                </p>
                <button
                    className="me-btn me-btn-primary"
                    onClick={() => navigate(-1)}
                >
                    <FaArrowLeft /> Go Back
                </button>
            </div>
        );
    }

    return (
        <section className="me-section">
            <div className="me-header">
                <div>
                    <h2 className="me-title">My Inspections</h2>
                    <p className="me-subtitle">
                        View and track all your inspections and their current status.
                    </p>
                </div>
            </div>

            <div className="me-content">
                <div className="me-cards">
                    {payments.map((item, idx) => (
                        <div key={item.IPID || idx} className="me-card">
                            <div className="me-card-header">
                                <div className="me-card-header-left">
                                    <div className="me-card-lead">
                                        <span className="me-card-serial">#{idx + 1}</span>
                                        <FaIdBadge className="me-card-icon" />
                                        <span>Lead ID</span>
                                        <strong>{item.LeadId || "-"}</strong>
                                    </div>
                                    <div className="me-card-order" title={item.OrderID}>
                                        Order: <span>{item.OrderID}</span>
                                    </div>
                                </div>
                                <span
                                    className={`me-status me-status-${(item.PaymentStatus || "unknown")
                                        .toLowerCase()}`}
                                >
                                    {item.PaymentStatus || "Unknown"}
                                </span>
                            </div>
                            <div className="me-card-body">
                                <div className="me-card-row">
                                    <span className="me-card-label">
                                        <FaMoneyBill /> Amount
                                    </span>
                                    <span className="me-card-value">
                                        ₹{Number(item.Amount || 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="me-card-row">
                                    <span className="me-card-label">
                                        <FaCreditCard /> Method
                                    </span>
                                    <span className="me-card-value">
                                        {item.PaymentMethod || "-"}
                                    </span>
                                </div>
                                <div className="me-card-row">
                                    <span className="me-card-label">
                                        <FaCalendarAlt /> Created At
                                    </span>
                                    <span className="me-card-value me-card-date">
                                        {item.CreatedDate
                                            ? new Date(item.CreatedDate).toLocaleString("en-IN", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })
                                            : "-"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="me-end-text text-muted">
                        <FaCheckCircle className="me-end-icon" />
                        <span>You've reached the end of your Inspection</span>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default MyInspection;