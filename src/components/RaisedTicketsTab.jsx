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
  const [showCancelForm, setShowCancelForm] = useState({});
  const [cancelReason, setCancelReason] = useState({});
  const { showAlert } = useAlert();
  const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;
  const baseUrl = process.env.REACT_APP_CARBUDDY_BASE_URL;
  const imgUrl = process.env.REACT_APP_CARBUDDY_IMAGE_URL;
  const [showReopenForm, setShowReopenForm] = useState({});
  const [reopenReason, setReopenReason] = useState({});
  const [updateText, setUpdateText] = useState({});
  const [updateFiles, setUpdateFiles] = useState({});

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
        // setTickets(response.data);
        const sortedTickets = [...response.data].reverse();
        setTickets(sortedTickets);
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
    setShowCancelForm({});
  };



  const confirmReopenTicket = async (ticketId) => {
    const reason = reopenReason[ticketId] || "";
    if (!reason.trim()) {
      showAlert("Please enter a reopen reason.", "warning");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const ticket = tickets.find(
        (t) => (t.Id || t.id || t.TicketTrackId) === ticketId
      );

      if (!ticket?.TicketTrackId) {
        showAlert("Unable to find ticket track ID.", "error");
        return;
      }

      const formData = new FormData();
      formData.append("TicketTrackId", ticket.TicketTrackId);
      formData.append("Status", 6); // use your reopen status ID
      formData.append("Description", reason);

      const response = await axios.put(`${baseUrl}Tickets`, formData, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        showAlert("Ticket reopened successfully.", "success");
        setShowReopenForm((prev) => ({ ...prev, [ticketId]: false }));
        setReopenReason((prev) => ({ ...prev, [ticketId]: "" }));
        fetchTickets(); // refresh list
      } else {
        showAlert("Failed to reopen ticket. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error reopening ticket:", error);
      showAlert("Failed to reopen ticket. Please try again.", "error");
    }
  };

  const handleCancelTicket = (ticketId) => {
    setShowCancelForm((prev) => ({
      ...prev,
      [ticketId]: !prev[ticketId],
    }));
    setTimelineExpanded({});
  };

  const handleReopenToggle = (ticketId) => {
    setShowReopenForm((prev) => ({
      ...prev,
      [ticketId]: !prev[ticketId],
    }));
    setShowCancelForm({}); // hide cancel form if open
  };

  const handleReopenTicket = async (ticketId) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const ticket = tickets.find(
        (t) => (t.Id || t.id || t.TicketTrackId) === ticketId
      );

      if (!ticket?.TicketTrackId) {
        showAlert("Unable to find ticket track ID.", "error");
        return;
      }

      const formData = new FormData();
      formData.append("TicketTrackId", ticket.TicketTrackId);
      formData.append("Status", 6); // ✅ use 1 or your API's reopen status ID
      formData.append("Description", "Ticket reopened by user.");

      const response = await axios.put(`${baseUrl}Tickets`, formData, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        showAlert("Ticket reopened successfully.", "success");
        fetchTickets();
      } else {
        showAlert("Failed to reopen ticket. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error reopening ticket:", error);
      showAlert("Failed to reopen ticket. Please try again.", "error");
    }
  };


  const confirmCancelTicket = async (ticketId) => {
    const reason = cancelReason[ticketId] || "";
    if (!reason.trim()) {
      showAlert("Please enter a cancellation reason.", "warning");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const ticket = tickets.find(
        (t) => (t.Id || t.id || t.TicketTrackId) === ticketId
      );

      if (!ticket?.TicketTrackId) {
        showAlert("Unable to find ticket track ID.", "error");
        return;
      }

      // Prepare payload as per your API
      // ✅ Create FormData object
      const formData = new FormData();
      formData.append("TicketTrackId", ticket.TicketTrackId);
      formData.append("Status", 5);
      formData.append("Description", reason);

      // If your API expects more fields (CustID, UpdatedBy, etc.), append them here
      // formData.append("CustID", custId);

      const response = await axios.put(`${baseUrl}Tickets`, formData, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "multipart/form-data", // 👈 important
        },
      });


      if (response.status === 200) {
        showAlert("Ticket cancelled successfully.", "success");
        setShowCancelForm((prev) => ({ ...prev, [ticketId]: false }));
        setCancelReason((prev) => ({ ...prev, [ticketId]: "" }));
        fetchTickets(); // refresh list
      } else {
        showAlert("Failed to cancel ticket. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error cancelling ticket:", error);
      showAlert("Failed to cancel ticket. Please try again.", "error");
    }
  };

  const handleSendUpdate = async (ticketId) => {
    const message = updateText[ticketId] || "";
    const files = updateFiles[ticketId] || [];

    if (!message.trim() && files.length === 0) {
      showAlert("Please add a message or attach a file.", "warning");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const ticket = tickets.find(
        (t) => (t.Id || t.id || t.TicketTrackId) === ticketId
      );

      if (!ticket?.TicketTrackId) {
        showAlert("Unable to find ticket track ID.", "error");
        return;
      }

      const formData = new FormData();
      formData.append("TicketTrackId", ticket.TicketTrackId);
      formData.append("Status", 8); // status for User update
      formData.append("Description", message);
      formData.append("UserResponse", true);

      // ✅ Append all files properly
      files.forEach((file, index) => {
        formData.append("Files", file, file.name); // important: use plural key if backend expects multiple
      });

      // ✅ Debug check: log what’s being sent
      for (const pair of formData.entries()) {
        console.log(`${pair[0]}:`, pair[1]);
      }

      const response = await axios.put(`${baseUrl}Tickets`, formData, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        showAlert("Update sent successfully!", "success");
        setUpdateText((prev) => ({ ...prev, [ticketId]: "" }));
        setUpdateFiles((prev) => ({ ...prev, [ticketId]: [] }));
        fetchTickets(); // refresh timeline
      } else {
        showAlert("Failed to send update. Try again.", "error");
      }
    } catch (error) {
      console.error("Error sending update:", error);
      showAlert("Error sending update. Please try again.", "error");
    }
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
      // switch (statusLower) {
      //   case "open":
      //     return "🔓";
      //   case "in progress":
      //   case "inprogress":
      //     return "⚙️";
      //   case "resolved":
      //   case "closed":
      //     return "✅";
      //   case "pending":
      //     return "⏳";
      //   default:
      // return "❓";
      // }
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
        <h5 className="mb-0">🎫 Ticket List</h5>
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
                  className={`accordion-button ${expandedTicket === (ticket.Id || ticket.id || index)
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
                className={`accordion-collapse collapse ${expandedTicket === (ticket.Id || ticket.id || index)
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
                          <h6 className="badge1 fw-bold text-primary">
                            Booking ID: <span style={{ color: "black" }}>{ticket.BookingTrackID}</span>
                          </h6>
                        </p>
                      )}
                      <p className="mb-3">
                        <h6 className="text-primary">
                          Reason:
                          <span className="badge1 fw-bold" style={{ color: "black" }} >
                            {" "}
                            {ticket.Reason}
                          </span>{" "}
                        </h6>
                      </p>
                      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                        <h6 className="text-primary mb-0 me-2">Description:</h6>
                        <span className="badge1">
                          {ticket.Description || "No description provided."}
                        </span>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <h6 className="text-primary">Ticket Details</h6>
                      <div className="mb-2">
                        <strong>Status:</strong>{" "}
                        {(() => {
                          let currentStatus = ticket.TrackingHistory?.[0]?.StatusName || "Created";
                          currentStatus = currentStatus.toLowerCase();

                          // Hide or replace unwanted statuses
                          if (currentStatus === "forward" || currentStatus === "pending") {
                            currentStatus = "Created";
                          }
                          return getStatusDisplay(currentStatus);
                        })()}
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
                        onClick={() =>
                          toggleTimeline(ticket.Id || ticket.id || index)
                        }
                      >
                        <strong>View Ticket Progress</strong>
                        <span style={{ float: "right", fontSize: "12px" }}>
                          {timelineExpanded[ticket.Id || ticket.id || index]
                            ? "▼"
                            : "▶"}
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
                                height: "calc(100% - 120px)",
                                backgroundColor: "#198754",
                                borderRadius: "2px",
                                zIndex: 0,
                              }}
                            ></div>

                            {(() => {
                              // ✅ Combine only non-Pending statuses + one Created step
                              const combinedSteps = [
                                ...(ticket.TrackingHistory?.filter(
                                  (step) =>
                                    step.StatusName?.toLowerCase() !== "pending" &&
                                    step.StatusName?.toLowerCase() !== "forward"
                                ) || []),
                                {
                                  StatusName: "Created",
                                  StatusDescription: ticket.Description || "Ticket created.",
                                  StatusDate: ticket.CreatedDate,
                                  FilePath: ticket.FilePath,
                                },
                              ].reverse(); // latest on top

                              return combinedSteps.length > 0 ? (
                                combinedSteps.map((step, i) => (
                                  <div
                                    key={i}
                                    className="timeline-item mb-3"
                                    style={{
                                      position: "relative",
                                      display: "flex",
                                      alignItems: "flex-start",
                                      zIndex: 1,
                                    }}
                                  >
                                    {/* dot */}
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
                                        className="timeline-dot"
                                        style={{
                                          width: "12px",
                                          height: "12px",
                                          borderRadius: "50%",
                                          backgroundColor: "#198754",
                                          border: "2px solid white",
                                          boxShadow: "0 0 0 2px #dee2e6",
                                          zIndex: 2,
                                          position: "relative",
                                          left: "9px",
                                        }}
                                      ></div>
                                    </div>

                                    {/* details */}
                                    <div
                                      className="timeline-content"
                                      style={{
                                        flexGrow: 1,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        gap: "12px",
                                      }}
                                    >
                                      {/* ✅ Left side — status details */}
                                      <div style={{ flex: 1 }}>
                                        <h6 className="mb-1" style={{ fontSize: "14px", fontWeight: "600" }}>
                                          {step.StatusName === "Pending" ? "Created" : step.StatusName}
                                        </h6>
                                        <p className="mb-1 text-muted" style={{ fontSize: "12px" }}>
                                          {step.StatusDescription || "No description provided."}
                                        </p>
                                        <small className="text-muted d-block mb-2" style={{ fontSize: "11px" }}>
                                          {formatDate(step.StatusDate)}
                                        </small>
                                      </div>

                                      {/* ✅ Right side — images and documents */}
                                      {step.FilePath && (
                                        <div
                                          className="d-flex flex-row flex-wrap justify-content-end"
                                          style={{
                                            gap: "10px",
                                            maxWidth: "320px",
                                          }}
                                        >
                                          {step.FilePath.split(",").map((file, idx) => {
                                            const trimmed = file.trim();
                                            const fileUrl = `${imgUrl}TicketDocuments/${trimmed}`;
                                            const fileName = trimmed.split("_").slice(1).join("_") || trimmed;

                                            // Detect file type
                                            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(trimmed);
                                            const isPdf = /\.pdf$/i.test(trimmed);
                                            const isDoc = /\.(doc|docx)$/i.test(trimmed);
                                            const isExcel = /\.(xls|xlsx)$/i.test(trimmed);
                                            const isText = /\.(txt|csv)$/i.test(trimmed);
                                            const isPpt = /\.(ppt|pptx)$/i.test(trimmed);

                                            // Decide icon for docs
                                            let iconClass = "bi bi-file-earmark";
                                            if (isPdf) iconClass = "bi bi-file-earmark-pdf text-danger";
                                            else if (isDoc) iconClass = "bi bi-file-earmark-word text-primary";
                                            else if (isExcel) iconClass = "bi bi-file-earmark-excel text-success";
                                            else if (isText) iconClass = "bi bi-file-earmark-text text-secondary";
                                            else if (isPpt) iconClass = "bi bi-file-earmark-ppt text-warning";

                                            return (
                                              <div
                                                key={idx}
                                                style={{
                                                  width: "55px",
                                                  textAlign: "center",
                                                }}
                                              >
                                                {isImage ? (
                                                  // 🖼️ Image preview
                                                  <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                                    <img
                                                      src={fileUrl}
                                                      alt={fileName}
                                                      style={{
                                                        width: "50px",
                                                        height: "50px",
                                                        objectFit: "cover",
                                                        borderRadius: "8px",
                                                        border: "1px solid #dee2e6",
                                                      }}
                                                    />
                                                  </a>
                                                ) : (
                                                  // 📄 Document box (square preview with icon)
                                                  <a
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="d-flex flex-column align-items-center justify-content-center"
                                                    style={{
                                                      width: "60px",
                                                      height: "60px",
                                                      borderRadius: "8px",
                                                      border: "1px solid #dee2e6",
                                                      backgroundColor: "#f8f9fa",
                                                      textDecoration: "none",
                                                    }}
                                                  >
                                                    <i className={iconClass} style={{ fontSize: "24px" }}></i>
                                                  </a>
                                                )}

                                                {/* File name below */}
                                                <small
                                                  className="text-muted d-block mt-1"
                                                  style={{
                                                    fontSize: "10px",
                                                    wordBreak: "break-word",
                                                    maxWidth: "60px",
                                                    lineHeight: "1.1",
                                                  }}
                                                >
                                                  {fileName.length > 10 ? fileName.slice(0, 10) + "…" : fileName}
                                                </small>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                    </div>

                                  </div>
                                ))
                              ) : (
                                <div className="text-muted small mt-2">
                                  No tracking history available
                                </div>
                              );
                            })()}

                          </div>
                        )}
                        {timelineExpanded[ticket.Id || ticket.id || index] && (() => {
                          const latestStatus =
                            ticket?.TrackingHistory?.[0]?.StatusName?.toLowerCase() || "";

                          // Only show input field if status is "awaiting"
                          if (latestStatus !== "awaiting") return null;

                          return (
                            <div onClick={(e) => e.stopPropagation()}>
                              <div
                                style={{
                                  marginTop: "12px",
                                  borderTop: "1px solid #ddd",
                                  paddingTop: "10px",
                                  display: "flex",
                                  alignItems: "center", // ✅ keeps all elements vertically centered
                                  gap: "10px",
                                  flexWrap: "wrap",
                                }}
                              >
                                {/* Hidden File Input */}
                                <input
                                  type="file"
                                  id={`updateFile-${ticket.Id || ticket.id || index}`}
                                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                                  multiple
                                  style={{ display: "none" }}
                                  onChange={(e) => {
                                    const files = Array.from(e.target.files);
                                    if (files.length > 3) {
                                      alert("You can upload a maximum of 3 files per update.");
                                      e.target.value = "";
                                      return;
                                    }
                                    setUpdateFiles((prev) => ({
                                      ...prev,
                                      [ticket.Id || ticket.id || index]: files,
                                    }));
                                  }}
                                />

                                {/* 📎 Upload Button */}
                                <label
                                  htmlFor={`updateFile-${ticket.Id || ticket.id || index}`}
                                  style={{
                                    cursor: "pointer",
                                    color: "#0d6efd",
                                    fontSize: "20px",
                                    display: "flex", // ✅ make label a flex container
                                    alignItems: "center", // ✅ vertically center icon
                                    justifyContent: "center", // horizontally center it
                                    height: "36px", // same as input height
                                    width: "36px",
                                    borderRadius: "50%",
                                    backgroundColor: "#f5f5f5", // subtle background
                                    marginBottom: "-6px",
                                  }}
                                  title="Attach files"
                                >
                                  <i className="bi bi-paperclip"></i>
                                </label>

                                {/* 📝 Input */}
                                <input
                                  type="text"
                                  placeholder="Add an update..."
                                  style={{
                                    flex: 1,
                                    border: "1px solid #ccc",
                                    borderRadius: "20px",
                                    padding: "8px 14px",
                                    fontSize: "14px",
                                    outline: "none",
                                  }}
                                  value={updateText[ticket.Id || ticket.id || index] || ""}
                                  onChange={(e) =>
                                    setUpdateText((prev) => ({
                                      ...prev,
                                      [ticket.Id || ticket.id || index]: e.target.value,
                                    }))
                                  }
                                />

                                {/* 🚀 Send */}
                                <button
                                  className="btn btn-primary"
                                  style={{
                                    borderRadius: "20px",
                                    padding: "6px 14px",
                                    fontSize: "14px",
                                  }}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleSendUpdate(ticket.Id || ticket.id || index);
                                  }}
                                >
                                  Send
                                </button>
                              </div>

                              {/* ✅ Show Image Previews */}
                              {updateFiles[ticket.Id || ticket.id || index]?.length > 0 && (
                                <div
                                  style={{
                                    marginTop: "10px",
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "5px",
                                  }}
                                >
                                  {updateFiles[ticket.Id || ticket.id || index].map((file, idx) => {
                                    const isImage = file.type.startsWith("image/");
                                    const fileURL = URL.createObjectURL(file);

                                    return (
                                      <div
                                        key={idx}
                                        style={{
                                          position: "relative",
                                          width: "50px",
                                          height: "50px",
                                          borderRadius: "8px",
                                          overflow: "hidden",
                                          border: "1px solid #ddd",
                                        }}
                                      >
                                        {isImage ? (
                                          <img
                                            src={fileURL}
                                            alt={`preview-${idx}`}
                                            style={{
                                              width: "100%",
                                              height: "100%",
                                              objectFit: "cover",
                                            }}
                                          />
                                        ) : (
                                          <div
                                            style={{
                                              width: "100%",
                                              height: "100%",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              fontSize: "24px",
                                              color: "#6c757d",
                                              background: "#f8f9fa",
                                            }}
                                          >
                                            <i className="bi bi-file-earmark"></i>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Cancel Ticket */}
                    {/* ✅ Conditional button logic */}
                    {(() => {
                      const latestStatus =
                        ticket?.TrackingHistory?.[0]?.StatusName?.toLowerCase() || "open";

                      if (latestStatus === "cancelled") {
                        // ❌ Don’t show any button
                        return null;
                      }

                      if (latestStatus === "closed" || latestStatus === "resolved") {
                        // 🔁 Show Reopen Ticket button
                        return (
                          <div
                            style={{
                              minWidth: "120px",
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            <button
                              className="btn btn-success w-100 mt-2"
                              style={{ height: "100%", padding: "10px 10px" }}
                              onClick={() => handleReopenToggle(ticket.Id || ticket.id || index)}
                            >
                              Reopen Ticket
                            </button>
                          </div>
                        );
                      }

                      // 🛑 Default — show Cancel Ticket
                      return (
                        <div
                          style={{
                            minWidth: "120px",
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <button
                            className="btn btn-danger w-100 mt-2"
                            style={{ height: "100%", padding: "10px 10px" }}
                            onClick={() => handleCancelTicket(ticket.Id || ticket.id || index)}
                          >
                            Cancel Ticket
                          </button>
                        </div>
                      );
                    })()}

                  </div>

                  {showCancelForm[ticket.Id || ticket.id || index] && (
                    <div className="mt-2 p-3 border rounded bg-light">
                      <h6 className="text-danger mb-3">
                        Please enter cancellation reason
                      </h6>
                      <textarea
                        className="form-control mb-3"
                        rows="2"
                        placeholder="Enter reason for cancellation..."
                        value={
                          cancelReason[ticket.Id || ticket.id || index] || ""
                        }
                        onChange={(e) =>
                          setCancelReason((prev) => ({
                            ...prev,
                            [ticket.Id || ticket.id || index]: e.target.value,
                          }))
                        }
                      />
                      <div className="text-center mt-2">
                        <button
                          className="btn btn-danger"
                          style={{ padding: "12px 15px", fontSize: "14px" }}
                          onClick={() =>
                            confirmCancelTicket(ticket.Id || ticket.id || index)
                          }
                        >
                          Confirm Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  {/* 🟢 Reopen Form */}
                  {
                    showReopenForm[ticket.Id || ticket.id || index] && (
                      <div className="mt-2 p-3 border rounded bg-light">
                        <h6 className="text-success mb-3">Please enter reopen reason</h6>
                        <textarea
                          className="form-control mb-3"
                          rows="2"
                          placeholder="Enter reason for reopening..."
                          value={reopenReason[ticket.Id || ticket.id || index] || ""}
                          onChange={(e) =>
                            setReopenReason((prev) => ({
                              ...prev,
                              [ticket.Id || ticket.id || index]: e.target.value,
                            }))
                          }
                        />
                        <div className="text-center mt-2">
                          <button
                            className="btn btn-success"
                            style={{ padding: "12px 15px", fontSize: "14px" }}
                            onClick={() =>
                              confirmReopenTicket(ticket.Id || ticket.id || index)
                            }
                          >
                            Confirm Reopen
                          </button>
                        </div>
                      </div>
                    )
                  }
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
      )
      }
    </div >
  );
};

export default RaisedTicketsTab;
