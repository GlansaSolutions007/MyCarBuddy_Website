import React, { useState, useEffect } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";
import { useAlert } from "../context/AlertContext";
import NewTicket from "./NewTicket";
import TicketDrawer from "./TicketDrawer";
import Swal from "sweetalert2";
import "./RaisedTicketsTab.css";
import { 
  FaTicketAlt, FaPlus, FaCalendarAlt, FaChevronDown, 
  FaHistory, FaPaperclip, FaPaperPlane, FaTimes, 
  FaRedo, FaCheckCircle, FaInfoCircle, FaFileAlt,
  FaFilePdf, FaFileWord, FaFileExcel, FaFileImage
} from "react-icons/fa";

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
    const statusText = statusName || status || "Unknown";
    const statusLower = (statusText || "").toLowerCase().replace(/\s+/g, '');

    return (
      <span className={`rt-status-badge ${statusLower}`}>
        {statusText}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="rt-loading">
        <div className="rt-spinner"></div>
        <span className="rt-loading-text">Loading your tickets...</span>
      </div>
    );
  }

  return (
    <div className="rt-section">
      {/* Header */}
      <div className="rt-header">
        <h2 className="rt-title">
          <span className="rt-title-icon">
            <FaTicketAlt />
          </span>
          Ticket List
        </h2>
        <button className="rt-new-btn" onClick={() => setShowNewTicket(true)}>
          <FaPlus /> New Ticket
        </button>
      </div>

      {showNewTicket && (
        <TicketDrawer
          onClose={() => setShowNewTicket(false)}
          title="Raise a Ticket"
        >
          <NewTicket
            onClose={() => setShowNewTicket(false)}
            onTicketCreated={() => {
              setShowNewTicket(false);
              fetchTickets();
            }}
          />
        </TicketDrawer>
      )}

      {tickets.length === 0 ? (
        <div className="rt-empty">
          <img
            src="/assets/img/no-tickets.png"
            alt="No Tickets"
            className="rt-empty-img"
          />
          <h4>No tickets found</h4>
          <p>You haven't raised any support tickets yet.</p>
        </div>
      ) : (
        <div className="rt-tickets-list">
          {tickets.map((ticket, index) => {
            const ticketKey = ticket.Id || ticket.id || index;
            const isExpanded = expandedTicket === ticketKey;
            
            // Get current status
            let currentStatus = ticket.TrackingHistory?.[0]?.StatusName || "Created";
            if (currentStatus.toLowerCase() === "forward" || currentStatus.toLowerCase() === "pending") {
              currentStatus = "Created";
            }

            return (
              <div
                key={ticketKey}
                className={`rt-ticket-card ${isExpanded ? "expanded" : ""}`}
              >
                {/* Ticket Header */}
                <div
                  className="rt-ticket-header"
                  onClick={() => toggleTicket(ticketKey)}
                >
                  <div className="rt-ticket-info">
                    <div className="rt-ticket-icon">
                      <FaTicketAlt />
                    </div>
                    <span className="rt-ticket-id">
                      Ticket #{ticket.TicketTrackId || ticket.Id || `T-${index + 1}`}
                    </span>
                  </div>
                  <div className="rt-ticket-meta">
                    <span className="rt-ticket-date">
                      <FaCalendarAlt /> {formatDate(ticket.CreatedDate)}
                    </span>
                    <div className="rt-ticket-arrow">
                      <FaChevronDown />
                    </div>
                  </div>
                </div>

                {/* Ticket Body (Expanded) */}
                {isExpanded && (
                  <div className="rt-ticket-body">
                    <div className="rt-ticket-content">
                      {/* Left Column - Details */}
                      <div className="rt-ticket-details">
                        {ticket.BookingTrackID && (
                          <div className="rt-detail-item">
                            <div className="rt-detail-label">Booking ID: <span className="rt-detail-value">{ticket.BookingTrackID}</span></div>
                            {/* <div className="rt-detail-value">{ticket.BookingTrackID}</div> */}
                          </div>
                        )}
                        <div className="rt-detail-item">
                          <div className="rt-detail-label">Reason: <span className="rt-detail-value">{ticket.Reason}</span></div>
                          {/* <div className="rt-detail-value">{ticket.Reason}</div> */}
                        </div>
                        <div className="rt-detail-item">
                          <div className="rt-detail-label">Description: <span className="rt-detail-value">{ticket.Description || "No description provided."}</span></div>
                          {/* <div className="rt-detail-value">
                            {ticket.Description || "No description provided."}
                          </div> */}
                        </div>
                      </div>

                      {/* Right Column - Status */}
                      {/* <div className="rt-ticket-status-section">
                        <div className="rt-status-label">Current Status</div>
                        {getStatusDisplay(currentStatus)}
                      </div> */}
                    </div>

                    {/* Timeline Section */}
                    <div className="rt-timeline-section">
                      <div className="rt-timeline-header-row">
                        <div
                          className={`rt-timeline-toggle ${timelineExpanded[ticketKey] ? "expanded" : ""}`}
                          onClick={() => toggleTimeline(ticketKey)}
                        >
                          <span className="rt-timeline-toggle-text">
                            <FaHistory /> View Ticket Progress
                          </span>
                          <span className="rt-timeline-toggle-arrow">
                            <FaChevronDown />
                          </span>
                        </div>

                        {/* Action Buttons - beside View Ticket Progress */}
                        <div className="rt-actions-inline">
                          {(() => {
                            const latestStatus =
                              ticket?.TrackingHistory?.[0]?.StatusName?.toLowerCase() || "open";

                            if (latestStatus === "cancelled") return null;

                            if (latestStatus === "closed" || latestStatus === "resolved") {
                              return (
                                <button
                                  className="rt-action-btn-inline reopen"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReopenToggle(ticketKey);
                                  }}
                                >
                                  <FaRedo /> Reopen
                                </button>
                              );
                            }

                            return (
                              <button
                                className="rt-action-btn-inline cancel"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelTicket(ticketKey);
                                }}
                              >
                                <FaTimes /> Cancel
                              </button>
                            );
                          })()}
                        </div>
                      </div>

                      {timelineExpanded[ticketKey] && (
                        <div className="rt-timeline">
                          {(() => {
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
                            ].reverse();

                            return combinedSteps.length > 0 ? (
                              combinedSteps.map((step, i) => {
                                const isImage = (file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file);
                                const isPdf = (file) => /\.pdf$/i.test(file);
                                const isDoc = (file) => /\.(doc|docx)$/i.test(file);
                                const isExcel = (file) => /\.(xls|xlsx)$/i.test(file);

                                const getFileIcon = (file) => {
                                  if (isPdf(file)) return <FaFilePdf style={{ color: '#dc3545' }} />;
                                  if (isDoc(file)) return <FaFileWord style={{ color: '#0d6efd' }} />;
                                  if (isExcel(file)) return <FaFileExcel style={{ color: '#198754' }} />;
                                  return <FaFileAlt style={{ color: '#6c757d' }} />;
                                };

                                return (
                                  <div key={i} className="rt-timeline-item">
                                    <div className="rt-timeline-dot"></div>
                                    <div className="rt-timeline-content">
                                      <div className="rt-timeline-info">
                                        <div className="rt-timeline-status">
                                          {step.StatusName === "Pending" ? "Created" : step.StatusName}
                                        </div>
                                        <div className="rt-timeline-desc">
                                          {step.StatusDescription || "No description provided."}
                                        </div>
                                        <div className="rt-timeline-date">
                                          {formatDate(step.StatusDate)}
                                        </div>
                                      </div>

                                      {step.FilePath && (
                                        <div className="rt-timeline-files">
                                          {step.FilePath.split(",").map((file, idx) => {
                                            const trimmed = file.trim();
                                            const fileUrl = `${imgUrl}TicketDocuments/${trimmed}`;

                                            return (
                                              <a
                                                key={idx}
                                                href={fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="rt-timeline-file"
                                              >
                                                {isImage(trimmed) ? (
                                                  <img src={fileUrl} alt="attachment" />
                                                ) : (
                                                  <div className="rt-timeline-file-icon">
                                                    {getFileIcon(trimmed)}
                                                  </div>
                                                )}
                                              </a>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="rt-timeline-empty">
                                No tracking history available
                              </div>
                            );
                          })()}
                          {/* Update Input Section */}
                          {(() => {
                            const latestStatus =
                              ticket?.TrackingHistory?.[0]?.StatusName?.toLowerCase() || "";

                            if (latestStatus !== "awaiting") return null;

                            return (
                              <div className="rt-update-section" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="file"
                                  id={`updateFile-${ticketKey}`}
                                  accept="image/*"
                                  multiple
                                  style={{ display: "none" }}
                                  onChange={(e) => {
                                    const newFiles = Array.from(e.target.files);
                                    const existingFiles = updateFiles[ticketKey] || [];
                                    const combinedFiles = [...existingFiles, ...newFiles];

                                    if (combinedFiles.length > 3) {
                                      Swal.fire({
                                        icon: "warning",
                                        title: "Too many files",
                                        text: "You can upload a maximum of 3 images per update.",
                                      });
                                      e.target.value = "";
                                      return;
                                    }

                                    const nonImageFiles = combinedFiles.filter(
                                      (file) => !file.type.startsWith("image/")
                                    );

                                    if (nonImageFiles.length > 0) {
                                      Swal.fire({
                                        icon: "error",
                                        title: "Invalid file type",
                                        text: "Only image files are allowed (JPG, PNG, GIF, etc.).",
                                      });
                                      e.target.value = "";
                                      return;
                                    }

                                    setUpdateFiles((prev) => ({
                                      ...prev,
                                      [ticketKey]: combinedFiles,
                                    }));
                                    e.target.value = "";
                                  }}
                                />

                                <div className="rt-update-form">
                                  <label htmlFor={`updateFile-${ticketKey}`} className="rt-attach-btn">
                                    <FaPaperclip />
                                  </label>
                                  <input
                                    type="text"
                                    className="rt-update-input"
                                    placeholder="Add an update..."
                                    value={updateText[ticketKey] || ""}
                                    onChange={(e) =>
                                      setUpdateText((prev) => ({
                                        ...prev,
                                        [ticketKey]: e.target.value,
                                      }))
                                    }
                                  />
                                  <button
                                    className="rt-send-btn"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleSendUpdate(ticketKey);
                                    }}
                                  >
                                    <FaPaperPlane /> Send
                                  </button>
                                </div>

                                {updateFiles[ticketKey]?.length > 0 && (
                                  <div className="rt-file-previews">
                                    {updateFiles[ticketKey].map((file, idx) => {
                                      const isImageFile = file.type.startsWith("image/");
                                      const fileURL = URL.createObjectURL(file);

                                      return (
                                        <div key={idx} className="rt-file-preview">
                                          {isImageFile ? (
                                            <img src={fileURL} alt={`preview-${idx}`} />
                                          ) : (
                                            <div className="rt-file-preview-icon">
                                              <FaFileAlt />
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
                      )}
                    </div>

                    {/* Cancel Form */}
                    {showCancelForm[ticketKey] && (
                      <div className="rt-form-section">
                        <div className="rt-form-title cancel">
                          <FaTimes /> Please enter cancellation reason
                        </div>
                        <textarea
                          className="rt-form-textarea"
                          rows="2"
                          placeholder="Enter reason for cancellation..."
                          value={cancelReason[ticketKey] || ""}
                          onChange={(e) =>
                            setCancelReason((prev) => ({
                              ...prev,
                              [ticketKey]: e.target.value,
                            }))
                          }
                        />
                        <div className="rt-form-actions">
                          <button
                            className="rt-form-submit cancel"
                            onClick={() => confirmCancelTicket(ticketKey)}
                          >
                            Confirm Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Reopen Form */}
                    {showReopenForm[ticketKey] && (
                      <div className="rt-form-section">
                        <div className="rt-form-title reopen">
                          <FaRedo /> Please enter reopen reason
                        </div>
                        <textarea
                          className="rt-form-textarea"
                          rows="2"
                          placeholder="Enter reason for reopening..."
                          value={reopenReason[ticketKey] || ""}
                          onChange={(e) =>
                            setReopenReason((prev) => ({
                              ...prev,
                              [ticketKey]: e.target.value,
                            }))
                          }
                        />
                        <div className="rt-form-actions">
                          <button
                            className="rt-form-submit reopen"
                            onClick={() => confirmReopenTicket(ticketKey)}
                          >
                            Confirm Reopen
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Response Section */}
                    {ticket.response && (
                      <div className="rt-response">
                        <div className="rt-response-title">
                          <FaCheckCircle /> Response from Support
                        </div>
                        <p className="rt-response-text">{ticket.response}</p>
                        {ticket.responseDate && (
                          <div className="rt-response-date">
                            Response Date: {formatDate(ticket.responseDate)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RaisedTicketsTab;