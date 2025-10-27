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
  const [timelineExpanded, setTimelineExpanded] = useState({});
  const { showAlert } = useAlert();
  const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;
  const baseUrl = process.env.REACT_APP_CARBUDDY_BASE_URL;

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

  const fetchTickets = async () => {
    const custId = getDecryptedCustId();
    if (!custId) {
      setLoading(false);
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const response = await axios.get(`${baseUrl}Tickets?CustId=${custId}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      if (response.data && Array.isArray(response.data)) {
        setTickets(response.data);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
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

  const toggleTimeline = (ticketId) => {
    setTimelineExpanded((prev) => ({
      ...prev,
      [ticketId]: !prev[ticketId],
    }));
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
    const statusText = statusName || status;
    const statusLower = (statusText || "").toLowerCase();

    const getStatusColor = () => {
      switch (statusLower) {
        case "open":
          return "#ffc107";
        case "in progress":
        case "inprogress":
          return "#0dcaf0";
        case "resolved":
        case "closed":
          return "#198754";
        case "pending":
          return "#6c757d";
        default:
          return "#6c757d";
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 12px",
          borderRadius: "20px",
          backgroundColor: getStatusColor() + "20",
          border: `1px solid ${getStatusColor()}`,
          fontSize: "12px",
          fontWeight: "500",
          color: getStatusColor(),
        }}
      >
        <span>{getStatusIcon()}</span>
        <span>{statusText || "Unknown"}</span>
      </div>
    );
  };

  const getTicketTimeline = (ticket) => {
    return [
      {
        id: 1,
        status: "Created",
        description: "Ticket created and submitted",
        timestamp: ticket.CreatedDate || new Date().toISOString(),
        isCompleted: true,
      },
      {
        id: 2,
        status: "Under Review",
        description: "Ticket is being reviewed by our support team",
        timestamp: ticket.StatusDate || new Date().toISOString(),
        isCompleted:
          ticket.StatusName === "Under Review" ||
          ticket.StatusName === "Resolved",
      },
      {
        id: 3,
        status: "In Progress",
        description: "Our team is working on resolving your issue",
        timestamp: null,
        isCompleted: false,
      },
      {
        id: 4,
        status: "Awaiting User Response",
        description: "Our team is waiting for your confirmation",
        timestamp: null,
        isCompleted: false,
      },
      {
        id: 5,
        status: "Resolved",
        description: "Issue has been resolved",
        timestamp: null,
        isCompleted: ticket.StatusName === "Resolved",
      },
    ];
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
        <button
          className="btn btn-outline-primary px-3 py-2"
          onClick={() => setShowNewTicket(true)}
        >
          New Ticket
        </button>
      </div>

      {showNewTicket ? (
        <NewTicket
          onClose={() => setShowNewTicket(false)}
          onTicketCreated={fetchTickets}
        />
      ) : tickets.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-3">
            <i
              className="fas fa-ticket-alt text-muted"
              style={{ fontSize: "3rem" }}
            ></i>
          </div>
          <h6 className="text-muted">No tickets found</h6>
          <p className="text-muted">
            You haven't raised any support tickets yet.
          </p>
        </div>
      ) : (
        <div className="accordion" id="ticketsAccordion">
          {tickets.map((ticket, index) => (
            <div
              key={ticket.Id || ticket.id || index}
              className="accordion-item"
            >
              <h2 className="accordion-header" id={`heading${index}`}>
                <button
                  className={`accordion-button ${
                    expandedTicket === (ticket.Id || ticket.id || index)
                      ? ""
                      : "collapsed"
                  }`}
                  type="button"
                  onClick={() => toggleTicket(ticket.Id || ticket.id || index)}
                  aria-expanded={
                    expandedTicket === (ticket.Id || ticket.id || index)
                  }
                  aria-controls={`collapse${index}`}
                >
                  <div className="d-flex justify-content-between align-items-center w-100 me-3">
                    <div className="d-flex flex-column align-items-start">
                      <span className="fw-bold">
                        Ticket #
                        {ticket.TicketTrackId || ticket.Id || `T-${index + 1}`}
                      </span>
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
                className={`accordion-collapse collapse ${
                  expandedTicket === (ticket.Id || ticket.id || index)
                    ? "show"
                    : ""
                }`}
                aria-labelledby={`heading${index}`}
                data-bs-parent="#ticketsAccordion"
              >
                <div className="accordion-body">
                  <div className="row">
                    <div className="col-md-8">
                      {ticket.BookingTrackID && (
                        <p className="mb-3">
                          <span className="badge1 fw-bold">
                            Booking ID: {ticket.BookingTrackID}
                          </span>
                        </p>
                      )}
                      <h6 className="text-primary">Description</h6>
                      <p className="mb-3">
                        {ticket.Description || "No description provided."}
                      </p>
                    </div>

                    <div className="col-md-4">
                      <h6 className="text-primary">Ticket Details</h6>
                      <div className="mb-2">
                        <strong>Status:</strong>{" "}
                        {getStatusDisplay(ticket.Status, ticket.StatusName)}
                      </div>
                    </div>
                  </div>

                  {/* ✅ Updated Timeline Structure */}
                <div className="d-flex justify-content-between align-items-start gap-3 mt-3">
                  {/* View Ticket Progress (left, grows) */}
                  <div className="flex-grow-1">
                    <div
                      className="mt-2 mb-2"
                      style={{
                        border: "1px solid #dee2e6",
                        borderRadius: "8px",
                        padding: "5px 10px",
                        backgroundColor: "rgba(25, 135, 84, 0.125)",
                        cursor: "pointer",
                      }}
                      onClick={() => toggleTimeline(ticket.Id || ticket.id || index)}
                    >
                      <strong>View Ticket Progress</strong>
                      <span style={{ float: "right", fontSize: "12px" }}>
                        {timelineExpanded[ticket.Id || ticket.id || index] ? "▼" : "▶"}
                      </span>

                      {timelineExpanded[ticket.Id || ticket.id || index] && (
                        <div
                          className="timeline"
                          style={{
                            padding: "8px",
                            position: "relative",
                          }}
                        >
                          {/* timeline connector */}
                          <div
                            className="timeline-connector"
                            style={{
                              position: "absolute",
                              left: "31px",
                              top: "20px",
                              width: "2px",
                              height: "calc(100% - 80px)",
                              background: `linear-gradient(
                                to bottom,
                                #198754 ${Math.min(
                                  (getTicketTimeline(ticket).filter((s) => s.isCompleted).length /
                                    getTicketTimeline(ticket).length) *
                                    100,
                                  100
                                )}%,
                                #dee2e6 ${Math.min(
                                  (getTicketTimeline(ticket).filter((s) => s.isCompleted).length /
                                    getTicketTimeline(ticket).length) *
                                    100,
                                  100
                                )}%
                              )`,
                              borderRadius: "2px",
                              zIndex: 0,
                            }}
                          ></div>

                          {getTicketTimeline(ticket).map((step) => (
                            <div
                              key={step.id}
                              className="timeline-item mb-3"
                              style={{
                                position: "relative",
                                display: "flex",
                                alignItems: "flex-start",
                                zIndex: 1,
                              }}
                            >
                              <div
                                className="timeline-marker"
                                style={{
                                  position: "relative",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  marginRight: "10px",
                                  width: "30px",
                                }}
                              >
                                <div
                                  className={`timeline-dot ${
                                    step.isCompleted ? "completed" : "pending"
                                  }`}
                                  style={{
                                    width: "12px",
                                    height: "12px",
                                    borderRadius: "50%",
                                    backgroundColor: step.isCompleted ? "#198754" : "#dee2e6",
                                    border: "2px solid white",
                                    boxShadow: "0 0 0 2px #dee2e6",
                                    zIndex: 2,
                                    position: "relative",
                                    left: "9px",
                                  }}
                                ></div>
                              </div>

                              <div className="timeline-content">
                                <h6 className="mb-1" style={{ fontSize: "14px", fontWeight: "600" }}>
                                  {step.status}
                                </h6>
                                <p className="mb-1 text-muted" style={{ fontSize: "12px" }}>
                                  {step.description}
                                </p>
                                {step.timestamp && (
                                  <small className="text-muted" style={{ fontSize: "11px" }}>
                                    {formatDate(step.timestamp)}
                                  </small>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cancel Ticket */}
                <div style={{ minWidth: "120px", display: "flex" }}>
                  <button className="btn btn-danger w-100 mt-2" style={{height: "100%", padding: "10px 10px"}}>
                    Cancel Ticket
                  </button>
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