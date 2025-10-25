import React, { useState, useEffect } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";
import { useAlert } from "../context/AlertContext";
import NewTicket from "./NewTicket";

const RaisedTicketsTab = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const { showAlert } = useAlert();
  const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;
  const baseUrl = process.env.REACT_APP_CARBUDDY_BASE_URL;

  // Get decrypted customer ID
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

  // Fetch tickets from API
  const fetchTickets = async () => {
    const custId = getDecryptedCustId();
    if (!custId) {
      setLoading(false);
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const response = await axios.get(
        `${baseUrl}Tickets?CustId=${custId}`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      if (response.data && Array.isArray(response.data)) {
        setTickets(response.data);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      // showAlert("Failed to fetch tickets. Please try again.", "error");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const toggleTicket = (ticketId) => {
    setExpandedTicket(expandedTicket === ticketId ? null : ticketId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getStatusDisplay = (status, statusName) => {
    // Use StatusName if available, otherwise fallback to status
    const statusText = statusName || status;
    const statusLower = (statusText || "").toLowerCase();
    
    const getStatusColor = () => {
      switch (statusLower) {
        case "open":
          return "#ffc107"; // yellow
        case "in progress":
        case "inprogress":
          return "#0dcaf0"; // cyan
        case "resolved":
        case "closed":
          return "#198754"; // green
        case "pending":
          return "#6c757d"; // gray
        default:
          return "#6c757d"; // default gray
      }
    };

    const getStatusIcon = () => {
      switch (statusLower) {
        case "open":
          return "🔓";
        case "in progress":
        case "inprogress":
          return "⚙️";
        case "resolved":
        case "closed":
          return "✅";
        case "pending":
          return "⏳";
        default:
          return "❓";
      }
    };

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '20px',
        backgroundColor: getStatusColor() + '20',
        border: `1px solid ${getStatusColor()}`,
        fontSize: '12px',
        fontWeight: '500',
        color: getStatusColor()
      }}>
        <span>{getStatusIcon()}</span>
        <span>{statusText || "Unknown"}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 text-muted">Loading your tickets...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">🎫 Raised Tickets</h5>
        {/* <button
          className="btn btn-primary "
          onClick={fetchTickets}
          disabled={loading}
        >
          <i className="fas fa-sync-alt me-1"></i>
          Refresh
        </button> */}
        <button className="btn btn-outline-primary px-3 py-2" onClick={() => setShowNewTicket(true)}>New Ticket</button>
      </div>

      {showNewTicket ? (
        <NewTicket onClose={() => setShowNewTicket(false)} onTicketCreated={fetchTickets} />
      ) : tickets.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-3">
            <i className="fas fa-ticket-alt text-muted" style={{ fontSize: "3rem" }}></i>
          </div>
          <h6 className="text-muted">No tickets found</h6>
          <p className="text-muted">You haven't raised any support tickets yet.</p>
        </div>
      ) : (
        <div className="accordion" id="ticketsAccordion">
          {tickets.map((ticket, index) => (
            <div key={ticket.Id || ticket.id || index} className="accordion-item">
              <h2 className="accordion-header" id={`heading${index}`}>
                <button
                  className={`accordion-button ${expandedTicket === (ticket.Id || ticket.id || index) ? "" : "collapsed"}`}
                  type="button"
                  onClick={() => toggleTicket(ticket.Id || ticket.id || index)}
                  aria-expanded={expandedTicket === (ticket.Id || ticket.id || index)}
                  aria-controls={`collapse${index}`}
                >
                  <div className="d-flex justify-content-between align-items-center w-100 me-3">
                    <div className="d-flex flex-column align-items-start">
                      <span className="fw-bold">
                        Ticket #{ticket.TicketTrackId || ticket.Id || `T-${index + 1}`}
                      </span>
                      {/* <small className="text-muted">
                        {ticket.CustomerName || "Support Request"}
                      </small> */}
                    </div>
                      <div className="d-flex flex-column align-items-end">
                    
                        <small className="text-muted mt-1">
                          {formatDate(ticket.CreatedDate)}
                        </small>
                      </div>
                  </div>
                </button>
              </h2>
              <div
                id={`collapse${index}`}
                className={`accordion-collapse collapse ${expandedTicket === (ticket.Id || ticket.id || index) ? "show" : ""}`}
                aria-labelledby={`heading${index}`}
                data-bs-parent="#ticketsAccordion"
              >
                <div className="accordion-body">
                  <div className="row">
                    <div className="col-md-8">
                      {ticket.BookingTrackID && (
                        <>
                          <p className="mb-3">
                            <span className="badge1 fw-bold">Booking ID: {ticket.BookingTrackID}</span>
                          </p>
                        </>
                      )}
                      <h6 className="text-primary">Description</h6>
                      <p className="mb-3">{ticket.Description || "No description provided."}</p>
                    </div>
                    <div className="col-md-4">
                      <h6 className="text-primary">Ticket Details</h6>
                      <div className="mb-2">
                        <strong>Status:</strong> {getStatusDisplay(ticket.Status, ticket.StatusName)}
                      </div>
                      <div className="mb-2">
                        <strong>Customer:</strong> {ticket.CustomerName}
                      </div>
                      <div className="mb-2">
                        <strong>Phone:</strong> {ticket.CustomerPhone}
                      </div>
                      <div className="mb-2">
                        <strong>Email:</strong> {ticket.CustomerEmail}
                      </div>
                      <div className="mb-2">
                        <strong>Created:</strong> {formatDate(ticket.CreatedDate)}
                      </div>
                      {ticket.StatusDate && (
                        <div className="mb-2">
                          <strong>Status Updated:</strong> {formatDate(ticket.StatusDate)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {ticket.response && (
                    <div className="mt-3 p-3 bg-light rounded">
                      <h6 className="text-success">Response from Support</h6>
                      <p className="mb-0">{ticket.response}</p>
                      {ticket.responseDate && (
                        <small className="text-muted">
                          Response Date: {formatDate(ticket.responseDate)}
                        </small>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RaisedTicketsTab;
