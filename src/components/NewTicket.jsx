import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { useAlert } from '../context/AlertContext';
import Swal from "sweetalert2";

const chatStyles = `
  .new-ticket-card {
    height: 550px;
  }
  .chat-container {
    height: 400px;
    overflow-y: auto;
  }
  .chat-bubble {
    padding: 3px 6px;
    border-radius: 10px;
    margin-bottom: 4px;
    max-width: 60%;
    word-wrap: break-word;
  }
  .chat-bubble.system {
    background-color: #f1f1f1;
    color: #333;
    align-self: flex-start;
    text-align: left;
  }
  .chat-bubble.user {
    background-color: #136d6e;
    color: white;
    min-width: 20%;
    align-self: flex-end;
    text-align: start;
    margin-left: auto;
  }
  .options {
    margin-left: 10px;
    margin-bottom: 5px;
    margin-top: 0;
  }
  .chat-bubble.system h6 {
    margin-left: 20px;
    margin-bottom: 2px;
    font-weight: bold;
  }

  .chat-bubble.system h5,
  .chat-bubble.system p {
    margin: 0 !important;
    padding: 0 !important;
    line-height: 1.2;
  }

  .chat-bubble.user p {
    margin: 0 !important;
    padding: 0 !important;
    line-height: 1.3;
  }

  .chat-bubble.system h6 {
  margin: 4px 0 0 0 !important; /* small top gap only */
  padding: 0 !important;
  line-height: 1.2;
}
  
  .options .form-check {
    margin-bottom: 1px;
  }
  .options .form-check-label {
    font-size: 0.8rem;
    line-height: 0.8;
    font-weight: normal;
  }
  .card-body-ticket {
    display: flex;
    flex-direction: column;
    height: 500px;
  }
  .description-section {
    flex-shrink: 0;
  }
  .buttons-section {
    flex-shrink: 0;
  }
`;

// Inject styles into the document head
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = chatStyles;
document.head.appendChild(styleSheet);

const NewTicket = ({ onClose, onTicketCreated, selectedTicketBookingId }) => {
  const [step, setStep] = useState(1);
  const [selectedReasonType, setSelectedReasonType] = useState('');
  const [selectedSubReason, setSelectedSubReason] = useState('');
  const [selectedSubReasonId, setSelectedSubReasonId] = useState('');
  const [description, setDescription] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [showAllBookings, setShowAllBookings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reasonTypes, setReasonTypes] = useState([]);
  const [reasonTypesLoading, setReasonTypesLoading] = useState(true);
  const [skippedBooking, setSkippedBooking] = useState(false);
  const { showAlert } = useAlert();
  const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;
  const baseUrl = process.env.REACT_APP_CARBUDDY_BASE_URL;
  const chatContainerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const bookingRequiredCategories = ['Booking', 'Payment', 'Service'];

  const [previewFiles, setPreviewFiles] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    const filePreviews = files.map((file) => ({
      file,
      type: file.type,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    }));

    setPreviewFiles((prev) => [...prev, ...filePreviews]);
  };

  const removeFile = (index) => {
    setPreviewFiles((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

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

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${baseUrl}Bookings/${getDecryptedCustId()}`, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("user"))?.token}`,
          "Content-Type": "application/json",
        },
      });

      const data = res.data;
      if (Array.isArray(data) && data.length > 0) {
        setBookings(data);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReasonTypes = async () => {
    try {
      setReasonTypesLoading(true);
      const response = await axios.get(`${baseUrl}AfterServiceLeads`, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("user"))?.token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data && Array.isArray(response.data)) {
        // Group by ReasonType and keep reason + ID
        const grouped = response.data.reduce((acc, item) => {
          const reasonType = item.ReasonType || "Others";   // handle null or empty
          if (!acc[reasonType]) {
            acc[reasonType] = { Reasons: [] };
          }
          acc[reasonType].Reasons.push({
            id: item.ID,
            label: item.Reason
          });
          return acc;
        }, {});

        const allowedTypes = ['Booking', 'Payment', 'Service', 'App'];

        const formattedReasonTypes = Object.keys(grouped)
          .filter(reasonType => allowedTypes.some(type => reasonType?.includes(type)))
          .map(reasonType => ({
            value: reasonType,
            label: reasonType,
            Reasons: grouped[reasonType].Reasons
          }));

        // Add Others separately (or all null/"" will already go in from default above)
        formattedReasonTypes.push({
          value: 'Others',
          label: 'Others',
          Reasons: grouped['Others']?.Reasons || []
        });

        setReasonTypes(formattedReasonTypes);
      } else {
        setReasonTypes([]);
      }
    } catch (error) {
      console.error("Error fetching reason types:", error);
      setReasonTypes([]);
    } finally {
      setReasonTypesLoading(false);
    }
  };

  useEffect(() => {
    fetchReasonTypes();
    fetchBookings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-select booking if selectedTicketBookingId is provided
  useEffect(() => {
    if (selectedTicketBookingId && bookings.length > 0) {
      const booking = bookings.find(b => b.BookingID.toString() === selectedTicketBookingId.toString());
      if (booking) {
        setBookingId(booking.BookingID.toString());
        setStep(2);
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 100);
      }
    }
  }, [selectedTicketBookingId, bookings]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      showAlert("Please enter a description for the ticket.", "error");
      return;
    }

    const custId = getDecryptedCustId();
    if (!custId) {
      showAlert("Unable to identify user. Please log in again.", "error");
      return;
    }

    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const formData = new FormData();

      // 🔹 These keys must match your Swagger names exactly
      formData.append("CustID", parseInt(custId));
      formData.append("BookingID", bookingId ? parseInt(bookingId) : 0);
      formData.append("Description", description.trim());

      // ✅ Dynamic ReasonId logic
      let reasonIdToSend = 0;

      if (selectedReasonType === "Others") {
        const othersGroup = reasonTypes.find(r => r.value === "Others");
        reasonIdToSend = othersGroup?.Reasons?.[0]?.id || 5;
      } else {
        reasonIdToSend = selectedSubReasonId || 0;
      }

      formData.append("ReasonId", reasonIdToSend);

      // 🔹 Append each file as "Files"
      previewFiles.forEach((fileObj) => {
        formData.append("Files", fileObj.file);
      });

      // ✅ Post as multipart/form-data
      const response = await axios.post(`${baseUrl}Tickets`, formData, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200 || response.status === 201) {
        await Swal.fire({
          title: "Created",
          text: "Ticket created successfully!",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });

        onTicketCreated();
        onClose();
      } else {
        showAlert("Failed to create ticket. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      showAlert("Failed to create ticket. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBookingChange = (booking) => {
    setBookingId(booking);
    setStep(3);
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleReasonChange = (reason) => {
    setSelectedReasonType(reason);
    setSelectedSubReason('');
    if (reason === 'Others') {
      setStep(4);
    } else {
      setStep(3);
    }
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSubReasonChange = (subReason) => {
    setSelectedSubReasonId(subReason.id);
    setSelectedSubReason(subReason.label);
    setStep(4);
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);

  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedReasonType('');
      setSelectedSubReason('');
      setBookingId('');
      setSkippedBooking(false);
    } else if (step === 3) {
      setStep(2);
      setSelectedSubReason('');
    } else if (step === 4) {
      if (selectedReasonType === 'Others') {
        setStep(2);
        setSelectedSubReason('');
      } else {
        setStep(3);
        setSelectedSubReason('');
      }
    }
  };

  return (
    <div className="card mb-4 new-ticket-card p-2 ">
      <div className="card-header d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">New Ticket</h6>
        <button
          type="button"
          className="btn-close"
          onClick={onClose}
          aria-label="Close"
        ></button>
      </div>

      <div className="card-body-ticket">
        <form onSubmit={handleSubmit} className="d-flex flex-column h-100">
          <div className="chat-container d-flex flex-column" ref={chatContainerRef}>

            {/* Step 1: Select Reason */}
            {step >= 1 && (
              <div className="mb-3">
                <div className="chat-bubble system mb-2">
                  <h5>Hi! I'm here to help you create a support ticket.</h5>
                  <p>Let's start by choosing a category for your issue.</p>
                  <h6>Choose a category for your issue</h6>
                  <div className="options">
                    {reasonTypesLoading ? (
                      <div className="text-center">
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Loading Issue...
                      </div>
                    ) : reasonTypes.length > 0 ? (
                      reasonTypes.map((reasonType) => (
                        <div key={reasonType.value} className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="reason"
                            id={`reason-${reasonType.value}`}
                            value={reasonType.value}
                            checked={selectedReasonType === reasonType.value}
                            onChange={async (e) => {
                              const value = e.target.value;
                              handleReasonChange(value);
                              setStep(2); // Always go to booking step

                              // ⏳ Wait a moment to ensure bookings are loaded
                              setTimeout(() => {
                                if (bookings.length === 0) {
                                  setStep(3); // If no bookings → skip to sub-reason
                                }
                              }, 300);
                            }}
                            disabled={step > 1}
                          />
                          <label className="form-check-label" htmlFor={`reason-${reasonType.value}`}>
                            {reasonType.label}
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted">No Issue available.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* User: Selected Reason */}
            {selectedReasonType && (
              <div className="mb-3 d-flex justify-content-end me-2">
                <div className="chat-bubble user mb-2" style={{ textAlign: "center" }}>{selectedReasonType} Related</div>
              </div>
            )}

            {/* Step 2: Select Booking (only when "Booking" reason is chosen) */}
            {step >= 2 && (
              <div className="mb-3">
                <div className="chat-bubble system mb-2">
                  <h6>Select Booking</h6>
                  <div className="options">
                    {isLoading ? (
                      <div className="text-center">
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Loading bookings...
                      </div>
                    ) : bookings.length > 0 ? (
                      <div>
                        {(showAllBookings ? bookings : bookings.slice(0, 5)).map((booking) => (
                          <div key={booking.BookingTrackID} className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="booking"
                              id={`booking-${booking.BookingID}`}
                              value={booking.BookingID}
                              checked={bookingId === booking.BookingID.toString()}
                              onChange={(e) => {
                                handleBookingChange(e.target.value);
                                setStep(3); // go to sub-reason after selecting booking
                              }}
                              disabled={step > 2}
                            />
                            <label className="form-check-label" htmlFor={`booking-${booking.BookingID}`}>
                              {booking.BookingTrackID} - {booking.ServiceType}
                              {" "}booked on {new Date(booking.BookingDate).toLocaleDateString()} -
                              {booking.Packages && booking.Packages.length > 0 && (() => {
                                // Join all package names with commas
                                const allPackages = booking.Packages.map(pkg => pkg.PackageName).join(", ");
                                // Trim to max 25 characters
                                const limitedText = allPackages.length > 25 ? allPackages.slice(0, 25) + "..." : allPackages;

                                return (
                                  <>
                                    {" ("}
                                    {limitedText}
                                    {")"}
                                  </>
                                );
                              })()}
                            </label>
                          </div>
                        ))}
                        {bookings.length > 5 && (
                          <button
                            type="button"
                            className="btn btn-outline-primary mt-2 ms-5"
                            style={{
                              fontSize: "11px",
                              padding: "1px 6px", // reduced height
                              borderRadius: "6px",
                              lineHeight: "1.2",
                            }}
                            onClick={() => setShowAllBookings(!showAllBookings)}
                            disabled={step > 2}
                          >
                            {showAllBookings ? "Show Less" : "See all bookings"}
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-outline-secondary mt-2 ms-2"
                          style={{
                            fontSize: "11px",
                            padding: "1px 6px", // reduced height
                            borderRadius: "6px",
                            lineHeight: "1.2",
                          }}
                          onClick={() => {
                            setSkippedBooking(true);
                            setStep(3);
                          }}
                          disabled={step > 2}
                        >
                          Skip selection
                        </button>
                      </div>
                    ) : (
                      // No bookings available → move directly to sub-reason
                      <div>
                        <p className="text-muted">No bookings found.</p>
                        <button
                          type="button"
                          className="btn btn-link p-0 mt-1"
                          style={{ fontSize: '12px' }}
                          onClick={() => setStep(3)}
                        >
                          Continue →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* User: Selected Booking */}
            {bookingId && (
              <>
                {/* User bubble */}
                <div className="mb-3 d-flex justify-content-end me-2">
                  <div className="chat-bubble user mb-2" style={{ textAlign: "center" }}>
                    {(() => {
                      const booking = bookings.find(b => b.BookingID.toString() === bookingId);
                      return booking ? (
                        <p style={{ color: "white" }}>
                          Great! You selected booking <strong>{booking.BookingTrackID}</strong>. <br />
                          Now please choose a specific reason:
                        </p>
                      ) : null;
                    })()}
                  </div>
                </div>
              </>
            )}


            {/* Step 3: Select Sub-Reason */}
            {step >= 3 && selectedReasonType && selectedReasonType !== 'Others' && (
              <div className="mb-3">
                <div className="chat-bubble system mb-2">
                  <h6>Choose a specific reason</h6>
                  <div className="options">
                    {reasonTypes.find(r => r.value === selectedReasonType)?.Reasons.map((subReason) => (
                      <div key={subReason.id} className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="subReason"
                          id={`subReason-${subReason.id}`}
                          value={subReason.id}
                          checked={selectedSubReasonId === subReason.id}
                          onChange={() => handleSubReasonChange(subReason)}
                          disabled={step > 3}
                        />
                        <label className="form-check-label" htmlFor={`subReason-${subReason.id}`}>
                          {subReason.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* User: Selected Sub-Reason */}
            {selectedSubReason && (
              <div className="mb-3 d-flex justify-content-end me-2">
                <div className="chat-bubble user mb-2" style={{ textAlign: "center" }}>{selectedSubReason}</div>
              </div>
            )}

            {/* Step 4: Ask user to describe issue */}
            {step >= 4 && (
              <div className="mb-3">
                <div className="chat-bubble system mb-2">
                  <p>
                    <strong>Perfect!</strong> Now please describe your issue in detail. <br />
                    The more information you provide, the better we can assist you.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Always visible: Description */}
          {step >= 4 && (
            <div className="description-section mb-3 mt-20">
              <label htmlFor="description" className="form-label fw-bold">
                Description<span className="text-danger">*</span>
              </label>

              {/* Single hidden input for both images and docs */}
              <input
                id="fileUpload"
                type="file"
                accept="image/*,.pdf,.doc,.docx, .xls,.xlsx,.ppt,.pptx,.txt"
                multiple
                style={{ display: "none" }}
                onChange={(e) => handleFileChange(e)}
              />

              {/* Wrapper for textarea + plus button */}
              <div style={{ position: "relative" }}>
                {/* One "+" button — fixed inside textarea */}
                <label
                  htmlFor="fileUpload"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  style={{
                    position: "absolute",
                    left: "10px",
                    bottom: "12px",
                    cursor: "pointer",
                    fontSize: "25px",
                    color: isHovered ? "#0d6efd" : "#929292ff", // blue on hover
                    fontWeight: "bold",
                    zIndex: 10,
                    transition: "color 0.2s ease", // smooth transition
                  }}
                  title="Upload image or document"
                >
                  <i class="bi bi-paperclip"></i>
                </label>

                {/* Textarea */}
                <textarea
                  className="form-control"
                  style={{
                    minHeight: "75px",
                    paddingLeft: "45px",
                    resize: "none",
                  }}
                  id="description"
                  rows="2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your issue or request..."
                  required
                ></textarea>
              </div>

              {/* Preview Section */}
              {previewFiles.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginTop: "8px",
                  }}
                >
                  {previewFiles.map((file, index) => (
                    <div
                      key={index}
                      style={{
                        position: "relative",
                        width: "55px",
                        height: "55px",
                      }}
                    >
                      {file.type.startsWith("image/") ? (
                        <img
                          src={file.preview}
                          alt={`preview-${index}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "6px",
                            objectFit: "cover",
                            border: "1px solid #ddd",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "6px",
                            border: "1px solid #ddd",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "30px",
                            backgroundColor: "#f8f9fa",
                          }}
                        >
                          <i class="bi bi-file-earmark-text-fill"></i>
                        </div>
                      )}

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        style={{
                          position: "absolute",
                          top: "-6px",
                          right: "-6px",
                          background: "red",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: "18px",
                          height: "18px",
                          cursor: "pointer",
                          fontSize: "10px",
                          lineHeight: "15px",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="buttons-section d-flex gap-2 justify-content-center mb-25">
            {step > 1 && (
              <button
                type="button"
                className="btn btn-secondary px-4 py-3 text-decoration-none"
                onClick={handleBack}
                disabled={loading}
              >
                Back
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary px-4 py-3 text-decoration-none"
              disabled={loading || (selectedReasonType !== 'Others' && step < 3)}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2 text-decoration-none"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Creating...
                </>
              ) : (
                'Raised Ticket'
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary px-4 py-3 text-decoration-none"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewTicket;
