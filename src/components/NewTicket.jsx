import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { useAlert } from '../context/AlertContext';

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
    max-width: 70%;
    word-wrap: break-word;
  }
  .chat-bubble.system {
    background-color: #f1f1f1;
    color: #333;
    align-self: flex-start;
    text-align: left;
  }
  .chat-bubble.user {
    background-color: #007bff;
    color: white;
    min-width: 15%;
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
  }
  .options .form-check {
    margin-bottom: 1px;
  }
  .options .form-check-label {
    font-size: 0.8rem;
    line-height: 0.8;
    font-weight: bold;
  }
  .card-body {
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

function NewTicket({ onClose, onTicketCreated }) {
  const [step, setStep] = useState(1);
  const [selectedReasonType, setSelectedReasonType] = useState('');
  const [selectedSubReason, setSelectedSubReason] = useState('');
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
        // Group by ReasonType to deduplicate and combine Reasons
        const grouped = response.data.reduce((acc, item) => {
          const reasonType = item.ReasonType;
          if (!acc[reasonType]) {
            acc[reasonType] = { Reasons: [] };
          }
          acc[reasonType].Reasons.push(item.Reason);
          return acc;
        }, {});

        // Convert to array and filter to only include Booking, Payment, Service, App
        const allowedTypes = ['Booking', 'Payment', 'Service', 'App'];
        const formattedReasonTypes = Object.keys(grouped)
          .filter(reasonType => allowedTypes.some(type => reasonType.includes(type)))
          .map(reasonType => ({
            value: reasonType,
            label: reasonType,
            Reasons: [...new Set(grouped[reasonType].Reasons)] // Remove duplicates in Reasons
          }));

        // Add "Others" manually as it's not in the API
        formattedReasonTypes.push({
          value: 'Others',
          label: 'Others',
          Reasons: []
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

  const getReasonId = (reason) => {
    const reasonMap = {
      'Booking': 1,
      'Payment': 2,
      'Service': 3,
      'App': 4,
      'Others': 5
    };
    return reasonMap[reason] || 5; // Default to Others if not found
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      showAlert('Please enter a description for the ticket.', 'error');
      return;
    }

    if (bookingRequiredCategories.includes(selectedReasonType) && !bookingId.trim()) {
      showAlert('Please select a related booking for this ticket type.', 'error');
      return;
    }

    const custId = getDecryptedCustId();
    if (!custId) {
      showAlert('Unable to identify user. Please log in again.', 'error');
      return;
    }

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const ticketData = {
        custID: custId,
        bookingID: bookingId,
        reasonId: getReasonId(selectedReasonType),
        // SubReason: selectedSubReason || "N/A",
        description: description.trim(),
      };

      const response = await axios.post(
        `${baseUrl}Tickets`,
        ticketData,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        showAlert('Ticket created successfully!', 'success');
        onTicketCreated(); // Refresh tickets
        onClose(); // Close the form
      } else {
        showAlert('Failed to create ticket. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      showAlert('Failed to create ticket. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingChange = (booking) => {
    setBookingId(booking);
    setStep(2);
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
    setSelectedSubReason(subReason);
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
    <div className="card mb-4 new-ticket-card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h6 className="mb-0">🎫 New Ticket</h6>
        <button
          type="button"
          className="btn-close"
          onClick={onClose}
          aria-label="Close"
        ></button>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit} className="d-flex flex-column h-100">
          <div className="chat-container d-flex flex-column" ref={chatContainerRef}>
            {/* Step 1: System: Select Booking */}
            {step >= 1 && (
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
                              onChange={(e) => handleBookingChange(e.target.value)}
                              disabled={step > 1}
                            />
                            <label className="form-check-label" htmlFor={`booking-${booking.BookingID}`}>
                              {booking.BookingTrackID} - {booking.ServiceType} booked on {new Date(booking.BookingDate).toLocaleDateString()}
                            </label>
                          </div>
                        ))}
                        {bookings.length > 5 && (
                          <button
                            type="button"
                            className="p-0 mt-2 border-0 ms-5"
                            style={{ fontSize: '12px' }}
                            onClick={() => setShowAllBookings(!showAllBookings)}
                            disabled={step > 1}
                          >
                            {showAllBookings ? 'Show Less' : ` See all bookings`}
                          </button>
                        )}
                        <button
                          type="button"
                          className="p-0 mt-2 ms-4 border-0"
                          style={{ fontSize: '12px' }}
                          onClick={() => {
                            setSkippedBooking(true);
                            setStep(2);
                          }}
                          disabled={step > 1}
                        >
                          Skip selection
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-muted">No bookings found.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* User: Selected Booking */}
            {bookingId && (
              <div className="mb-3 d-flex justify-content-end">
                <div className="chat-bubble user mb-2">Booking ID: {bookingId}</div>
              </div>
            )}

            {/* Step 2: System: Select Reason */}
            {step >= 2 && (
              <div className="mb-3">
                <div className="chat-bubble system mb-2">
                  <h6>Select Reason</h6>
                  <div className="options">
                    {reasonTypesLoading ? (
                      <div className="text-center">
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Loading Reason...
                      </div>
                    ) : reasonTypes.length > 0 ? (
                      reasonTypes.filter(reasonType => skippedBooking ? ['App', 'Others'].includes(reasonType.value) : true).map((reasonType) => (
                        <div key={reasonType.value} className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="reason"
                            id={`reason-${reasonType.value}`}
                            value={reasonType.value}
                            checked={selectedReasonType === reasonType.value}
                            onChange={(e) => handleReasonChange(e.target.value)}
                            disabled={step > 2}
                          />
                          <label className="form-check-label" htmlFor={`reason-${reasonType.value}`}>
                            {reasonType.label}
                          </label>
                        </div>
                      ))
                    ) : (
                      <div>
                        <p className="text-muted">No Reason available.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* User: Selected Reason */}
            {selectedReasonType && (
              <div className="mb-3 d-flex justify-content-end">
                <div className="chat-bubble user mb-2">{selectedReasonType}</div>
              </div>
            )}
            {/* Step 3: System: Select Sub-Reason */}
            {step >= 3 && selectedReasonType && selectedReasonType !== 'Others' && (
              <div className="mb-3">
                <div className="chat-bubble system mb-2">
                  <h6>Select One Option</h6>
                  <div className="options">
                    {reasonTypes.find(r => r.value === selectedReasonType)?.Reasons.map((subReason) => (
                      <div key={subReason} className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="subReason"
                          id={`subReason-${subReason}`}
                          value={subReason}
                          checked={selectedSubReason === subReason}
                          onChange={(e) => handleSubReasonChange(e.target.value)}
                          disabled={step > 3}
                        />
                        <label className="form-check-label" htmlFor={`subReason-${subReason}`}>
                          {subReason}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* User: Selected Sub-Reason */}
            {selectedSubReason && (
              <div className="mb-3 d-flex justify-content-end">
                <div className="chat-bubble user mb-2">{selectedSubReason}</div>
              </div>
            )}
          </div>

          {/* Always visible: Additional Details */}
          <div className="description-section mb-3 mt-20" >
            <label htmlFor="description" className="form-label">Description<span className="text-danger">*</span></label>
            <textarea
              className="form-control"
              style={{ minHeight: "100px" }}
              id="description"
              rows="2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your issue or request..."
              required
            ></textarea>
          </div>
          <div className="buttons-section d-flex gap-2 justify-content-center">
            {step > 1 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleBack}
                disabled={loading}
              >
                Back
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={loading || (selectedReasonType !== 'Others' && step < 4) || (bookingRequiredCategories.includes(selectedReasonType) && !bookingId && !skippedBooking)}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating...
                </>
              ) : (
                'Create Ticket'
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
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
