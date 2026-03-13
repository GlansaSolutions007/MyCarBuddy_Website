import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { useAlert } from '../context/AlertContext';
import Swal from "sweetalert2";
import "./NewTicket.css";
import {
  FaTicketAlt, FaTimes, FaPaperclip, FaArrowRight,
  FaPaperPlane, FaArrowLeft, FaFileAlt
} from "react-icons/fa";

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
  const bookingRequiredCategories = ['Booking', 'Payment', 'Service'];

  const [previewFiles, setPreviewFiles] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Filter only image files
    const invalidFiles = files.filter(file => !file.type.startsWith("image/"));

    if (invalidFiles.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid File Type",
        text: "Only image files are allowed (JPG, PNG, etc.)",
        confirmButtonText: "OK",
        confirmButtonColor: "#136d6e"
      });
      e.target.value = ""; // Reset the input
      return;
    }

    // Combine existing + new files
    const totalFiles = [...previewFiles, ...files];

    // Restrict to 5 images max
    if (totalFiles.length > 5) {
      Swal.fire({
        icon: "error",
        title: "Too Many Images",
        text: "You can upload a maximum of 5 images only.",
        confirmButtonText: "OK",
        confirmButtonColor: "#136d6e"
      });
      e.target.value = ""; // reset input
      return;
    }

    // Generate previews
    const filePreviews = files.map((file) => ({
      file,
      type: file.type,
      preview: URL.createObjectURL(file)
    }));

    setPreviewFiles((prev) => [...prev, ...filePreviews]);
    e.target.value = "";
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
        setStep(1); // Start at step 1 for pre-selected booking (show it)
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 100);
        // Auto-advance to step 2 (reason selection) after showing the booking
        // shorten the delay so UX feels responsive but user still sees the booking
        setTimeout(() => {
          setStep(2);
        }, 800); // shorter delay than before
      }
    } else {
      setStep(1); // Normal flow starts at step 1
    }
  }, [selectedTicketBookingId, bookings]);

  // const handleReasonChange = (reason) => {
  //   setSelectedReasonType(reason);
  //   setSelectedSubReason('');
  //   if (selectedTicketBookingId) {
  //     if (reason === 'Others') {
  //       setStep(4);
  //     } else {
  //       setStep(3);
  //     }
  //   } else {
  //     setStep(2);
  //     setTimeout(() => {
  //       if (bookings.length === 0) {
  //         setStep(3);
  //       }
  //     }, 300);
  //   }
  //   setTimeout(() => {
  //     if (chatContainerRef.current) {
  //       chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  //     }
  //   }, 100);
  // };

  const handleReasonChange = (reason) => {
    setSelectedReasonType(reason);
    setSelectedSubReason('');

    // ✅ If Others → directly go to description step
    if (reason === 'Others') {
      setStep(4);
    } else if (selectedTicketBookingId) {
      // Pre-selected booking flow
      setStep(3);
    } else {
      // Normal flow
      setStep(2);

      // If no bookings → skip to sub reason
      setTimeout(() => {
        if (bookings.length === 0) {
          setStep(3);
        }
      }, 300);
    }

    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

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
    <div className="nt-card">
      {/* Header */}
      <div className="nt-header">
        <h3 className="nt-header-title">
          <span className="nt-header-icon">
            <FaTicketAlt />
          </span>
          New Ticket
        </h3>
        <button type="button" className="nt-close-btn" onClick={onClose}>
          <FaTimes />
        </button>
      </div>

      {/* Body */}
      <div className="nt-body">
        <form onSubmit={handleSubmit} className="nt-form">
          <div className="nt-chat-container" ref={chatContainerRef}>

            {/* Step 1: Pre-selected Booking (only when selectedTicketBookingId is provided) */}
            {selectedTicketBookingId && step >= 1 && (
              <div className="nt-bubble system">
                {(() => {
                  const booking = bookings.find(b => b.BookingID.toString() === selectedTicketBookingId.toString());
                  return booking ? (
                    <div className="nt-bubble-intro">
                      <input
                        type="radio"
                        name="preselectedBooking"
                        checked={true}
                        readOnly
                        style={{ marginRight: '8px', accentColor: '#0a6264' }}
                      />
                      Hi! I see you're raising a ticket for booking <strong>{booking.BookingTrackID}</strong>.
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {/* Step 1 (Normal) or Step 2 (Pre-selected): Select Reason */}
            {((step >= 1 && !selectedTicketBookingId) || (step >= 2 && selectedTicketBookingId)) && (
              <div className="nt-bubble system">
                <div className="nt-bubble-intro">
                  Hi! I'm here to help you create a support ticket. Let's start by choosing a category for your issue.
                </div>
                <div className="nt-bubble-title">Choose a category for your issue</div>
                <div className="nt-options">
                  {reasonTypesLoading ? (
                    <div className="nt-loading">
                      <div className="nt-loading-spinner"></div>
                      Loading categories...
                    </div>
                  ) : reasonTypes.length > 0 ? (
                    reasonTypes.map((reasonType) => (
                      <div
                        key={reasonType.value}
                        className={`nt-option ${selectedReasonType === reasonType.value ? 'selected' : ''} ${step > 2 ? 'disabled' : ''}`}
                        onClick={() => step <= 2 && handleReasonChange(reasonType.value)}
                      >
                        <input
                          type="radio"
                          name="reason"
                          id={`reason-${reasonType.value}`}
                          value={reasonType.value}
                          checked={selectedReasonType === reasonType.value}
                          onChange={() => { }}
                          disabled={step > 2}
                        />
                        <label className="nt-option-label" htmlFor={`reason-${reasonType.value}`}>
                          {reasonType.label}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="nt-no-data">No categories available.</p>
                  )}
                </div>
              </div>
            )}

            {/* User: Selected Reason */}
            {selectedReasonType && (
              <div className="nt-bubble user">
                <p className="nt-bubble-text">{selectedReasonType} Related</p>
              </div>
            )}

            {/* Step 2: Select Booking (only for normal flow, not pre-selected) */}
            {step >= 2 && !selectedTicketBookingId && (
              <div className="nt-bubble system">
                <div className="nt-bubble-intro">
                  Great! You selected <strong>{selectedReasonType} Related</strong>. Now let's select the booking you want to raise a ticket for.
                </div>
                <div className="nt-bubble-title">Select Booking</div>
                <div className="nt-options">
                  {isLoading ? (
                    <div className="nt-loading">
                      <div className="nt-loading-spinner"></div>
                      Loading bookings...
                    </div>
                  ) : bookings.length > 0 ? (
                    <>
                      {(showAllBookings ? bookings : bookings.slice(0, 5)).map((booking) => (
                        <div
                          key={booking.BookingTrackID}
                          className={`nt-option ${bookingId === booking.BookingID.toString() ? 'selected' : ''} ${step > 2 ? 'disabled' : ''}`}
                          onClick={() => {
                            if (step <= 2) {
                              handleBookingChange(booking.BookingID.toString());
                              setStep(3);
                            }
                          }}
                        >
                          <input
                            type="radio"
                            name="booking"
                            id={`booking-${booking.BookingID}`}
                            value={booking.BookingID}
                            checked={bookingId === booking.BookingID.toString()}
                            onChange={() => { }}
                            disabled={step > 2}
                          />
                          <label className="nt-option-label" htmlFor={`booking-${booking.BookingID}`}>
                            {booking.BookingTrackID} - {booking.ServiceType}
                            {" "} {new Date(booking.BookingDate).toLocaleDateString()}
                            {booking.Packages && booking.Packages.length > 0 && (() => {
                              const allPackages = booking.Packages.map(pkg => pkg.PackageName).join(", ");
                              const limitedText = allPackages.length > 25 ? allPackages.slice(0, 25) + "..." : allPackages;
                              return ` (${limitedText})`;
                            })()}
                          </label>
                        </div>
                      ))}
                      <div className="nt-chat-actions">
                        {bookings.length > 5 && (
                          <button
                            type="button"
                            className="nt-chat-btn"
                            onClick={() => setShowAllBookings(!showAllBookings)}
                            disabled={step > 2}
                          >
                            {showAllBookings ? "Show Less" : "See all bookings"}
                          </button>
                        )}
                        <button
                          type="button"
                          className="nt-chat-btn secondary"
                          onClick={() => {
                            setSkippedBooking(true);
                            setStep(3);
                            setTimeout(() => {
                              if (chatContainerRef.current) {
                                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                              }
                            }, 150);
                          }}
                          disabled={step > 2}
                        >
                          Skip selection
                        </button>
                      </div>
                    </>
                  ) : (
                    <div>
                      <p className="nt-no-data">No bookings found.</p>
                      <span className="nt-continue-link" onClick={() => setStep(3)}>
                        Continue <FaArrowRight />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* User: Skipped booking selection */}
            {skippedBooking && !bookingId && (
              <div className="nt-bubble user">
                <p className="nt-bubble-text">Skip booking selection</p>
              </div>
            )}

            {/* Step 3: Select Sub-Reason */}
            {step >= 3 && selectedReasonType && selectedReasonType !== 'Others' && (
              <div className="nt-bubble system">
                <div className="nt-bubble-intro">
                  {(() => {
                    const booking = bookings.find(b => b.BookingID.toString() === bookingId);
                    if (skippedBooking) {
                      return "No problem! Now please choose a specific reason.";
                    } else if (booking) {
                      return <>Great! You selected booking <strong>{booking.BookingTrackID}</strong>. Now please choose a specific reason.</>;
                    }
                    return null;
                  })()}
                </div>
                <div className="nt-bubble-title">Choose a specific reason</div>
                <div className="nt-options">
                  {reasonTypes.find(r => r.value === selectedReasonType)?.Reasons.map((subReason) => (
                    <div
                      key={subReason.id}
                      className={`nt-option ${selectedSubReasonId === subReason.id ? 'selected' : ''} ${step > 3 ? 'disabled' : ''}`}
                      onClick={() => step <= 3 && handleSubReasonChange(subReason)}
                    >
                      <input
                        type="radio"
                        name="subReason"
                        id={`subReason-${subReason.id}`}
                        value={subReason.id}
                        checked={selectedSubReasonId === subReason.id}
                        onChange={() => { }}
                        disabled={step > 3}
                      />
                      <label className="nt-option-label" htmlFor={`subReason-${subReason.id}`}>
                        {subReason.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User: Selected Sub-Reason */}
            {selectedSubReason && (
              <div className="nt-bubble user">
                <p className="nt-bubble-text">{selectedSubReason}</p>
              </div>
            )}

            {/* Step 4: Ask user to describe issue */}
            {step >= 4 && (
              <div className="nt-bubble system">
                <div className="nt-bubble-intro">
                  Great! You selected reason <strong>{selectedSubReason || selectedReasonType}</strong>.<br />
                  Now please describe your issue in detail. The more information you provide, the better we can assist you.
                </div>
              </div>
            )}
          </div>

          {/* Description Section */}
          {step >= 4 && (
            <div className="nt-description-section">
              <label className="nt-description-label" htmlFor="description">
                Description <span className="required">*</span>
              </label>

              <input
                id="fileUpload"
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={(e) => handleFileChange(e)}
              />

              <div className="nt-description-wrapper">
                <label htmlFor="fileUpload" className="nt-attach-btn" title="Attach images">
                  <FaPaperclip />
                </label>
                <textarea
                  className="nt-textarea"
                  id="description"
                  rows="2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your issue or request..."
                  required
                ></textarea>
              </div>

              {/* File Previews */}
              {previewFiles.length > 0 && (
                <div className="nt-file-previews">
                  {previewFiles.map((file, index) => (
                    <div key={index} className="nt-file-preview">
                      {file.type.startsWith("image/") ? (
                        <img src={file.preview} alt={`preview-${index}`} />
                      ) : (
                        <div className="nt-file-preview-icon">
                          <FaFileAlt />
                        </div>
                      )}
                      <button
                        type="button"
                        className="nt-file-remove"
                        onClick={() => removeFile(index)}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="nt-footer">
            {step > 1 && (
              <button
                type="button"
                className="nt-btn secondary"
                onClick={handleBack}
                disabled={loading}
              >
                <FaArrowLeft /> Back
              </button>
            )}
            <button
              type="submit"
              className="nt-btn primary"
              disabled={loading || (selectedReasonType !== 'Others' && step < 4)}
            >
              {loading ? (
                <>
                  <span className="nt-btn-spinner"></span>
                  Creating...
                </>
              ) : (
                <>
                  <FaPaperPlane /> Raise Ticket
                </>
              )}
            </button>
            <button
              type="button"
              className="nt-btn secondary"
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
