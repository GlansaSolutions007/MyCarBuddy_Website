import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { useAlert } from '../context/AlertContext';

const chatStyles = `
  .chat-container {
    min-height: 400px;
  }
  .chat-bubble {
    padding: 10px 15px;
    border-radius: 20px;
    margin-bottom: 10px;
    max-width: 80%;
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
    align-self: flex-end;
    text-align: right;
    margin-left: auto;
  }
  .left-column {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .right-column {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  .current-input {
    width: 100%;
  }
  .options {
    margin-left: 20px;
    margin-bottom: 15px;
  }
  .options .form-check {
    margin-bottom: 5px;
  }
`;

// Inject styles into the document head
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = chatStyles;
document.head.appendChild(styleSheet);

function NewTicket({ onClose, onTicketCreated }) {
  const [step, setStep] = useState(1);
  const [selectedReason, setSelectedReason] = useState('');
  const [selectedSubReason, setSelectedSubReason] = useState('');
  const [description, setDescription] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [showAllBookings, setShowAllBookings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reasonsLoading, setReasonsLoading] = useState(true);
  const [reasons, setReasons] = useState([]);
  const { showAlert } = useAlert();
  const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;
  const baseUrl = process.env.REACT_APP_CARBUDDY_BASE_URL;

  const bookingRequiredReasons = ['Booking Related', 'Payment Related', 'Service Related'];

  // Function to map ReasonType to display label
  const mapReasonType = (reasonType) => {
    const mapping = {
      'BookingRelated': 'Booking Related',
      'PaymentRelated': 'Payment Related',
      'ServiceRelated': 'Service Related',
      'AppRelated': 'App Related',
      'Other': 'Other'
    };
    return mapping[reasonType] || reasonType;
  };

  // Fetch reasons from API
  const fetchReasons = async () => {
    try {
      const response = await axios.get(`${baseUrl}AfterServiceLeads`, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("user"))?.token}`,
          "Content-Type": "application/json",
        },
      });
      const data = response.data.filter(item => item.IsActive);

      // Group by ReasonType
      const grouped = data.reduce((acc, item) => {
        const reasonType = mapReasonType(item.ReasonType);
        if (!acc[reasonType]) {
          acc[reasonType] = [];
        }
        acc[reasonType].push(item.Reason);
        return acc;
      }, {});

      // Convert to reasons array
      const reasonsArray = Object.keys(grouped).map(reasonType => ({
        value: reasonType,
        label: reasonType,
        subReasons: grouped[reasonType]
      }));

      // Filter to only allowed reasons
      const allowedReasons = ['Booking Related', 'Payment Related', 'Service Related', 'App Related', 'Other'];
      const filteredReasons = reasonsArray.filter(reason => allowedReasons.includes(reason.value));

      // Ensure 'Other' is included if not present
      if (!filteredReasons.find(r => r.value === 'Other')) {
        filteredReasons.push({
          value: 'Other',
          label: 'Other',
          subReasons: []
        });
      }

      setReasons(filteredReasons);
    } catch (error) {
      console.error("Error fetching reasons:", error);
      showAlert('Failed to load reasons. Please try again.', 'error');
      // Fallback to static reasons if API fails
      setReasons([
        {
          value: 'Booking Related',
          label: 'Booking Related',
          subReasons: [
            'Booking not showing in app/website',
            'Unable to create a booking',
            'Incorrect date/time of booking',
            'Wrong service type selected',
            'Booking confirmation not received',
            'Unable to reschedule booking',
            'Booking details incorrect (car info, location, etc.)',
            'App/website issue while cancelling'
          ]
        },
        {
          value: 'Payment Related',
          label: 'Payment Related',
          subReasons: [
            'Payment failed during booking',
            'Overcharged / wrong amount',
            'Refund not received / delayed',
            'Partial refund received',
            'Promo code / wallet not applied',
            'Error while applying promo code or payment',
            'Payment confirmation not received',
            'Refund not processed after cancellation',
            'Charges applied even after cancellation'
          ]
        },
        {
          value: 'Service Related',
          label: 'Service Related',
          subReasons: [
            'Service not completed as requested',
            'Parts/spares missing or wrongly replaced',
            'Vehicle damage during service',
            'Poor service quality / technician behavior',
            'Service delayed or took longer than expected'
          ]
        },
        {
          value: 'App Related',
          label: 'App Related',
          subReasons: [
            'App crashed / froze',
            'Login / signup issues',
            'Notifications not received',
            'Feature not working (booking, tracking, rescheduling)',
            'UI/UX glitches / confusing interface',
            'Booking/payment details not updated in app'
          ]
        },
        {
          value: 'Other',
          label: 'Other',
          subReasons: []
        }
      ]);
    } finally {
      setReasonsLoading(false);
    }
  };

  useEffect(() => {
    fetchReasons();
  }, []);

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

  useEffect(() => {
    if (step === 3 && bookingRequiredReasons.includes(selectedReason)) {
      fetchBookings();
    }
  }, [step, selectedReason]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      showAlert('Please enter a description for the ticket.', 'error');
      return;
    }

    if (bookingRequiredReasons.includes(selectedReason) && !bookingId.trim()) {
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
        CustId: custId,
        Reason: selectedReason,
        SubReason: selectedSubReason || "N/A",
        Description: description.trim(),
        ...(bookingId.trim() && { BookingTrackID: bookingId.trim() }) || null
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

  const handleReasonChange = (reason) => {
    setSelectedReason(reason);
    setSelectedSubReason('');
    if (reason === 'Other') {
      setStep(3);
    } else {
      setStep(2);
    }
  };

  const handleSubReasonChange = (subReason) => {
    setSelectedSubReason(subReason);
    if (bookingRequiredReasons.includes(selectedReason)) {
      setStep(3);
    } else {
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedReason('');
      setSelectedSubReason('');
      setBookingId('');
    } else if (step === 3) {
      setStep(2);
      setSelectedSubReason('');
      setBookingId('');
    } else if (step === 4) {
      if (bookingRequiredReasons.includes(selectedReason)) {
        setStep(3);
        setBookingId('');
      } else {
        setStep(2);
        setSelectedSubReason('');
        setBookingId('');
      }
    }
  };

  return (
    <div className="card mb-4">
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
        <form onSubmit={handleSubmit}>
          <div className="chat-container d-flex flex-column">
            {/* System: Select Reason */}
            <div className="mb-3">
              <div className="chat-bubble system mb-2">
                <h6>Select Reason</h6>
                <div className="options">
                  {reasons.map((reason) => (
                    <div key={reason.value} className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="reason"
                        id={`reason-${reason.value}`}
                        value={reason.value}
                        checked={selectedReason === reason.value}
                        onChange={(e) => handleReasonChange(e.target.value)}
                        disabled={step > 1}
                      />
                      <label className="form-check-label" htmlFor={`reason-${reason.value}`}>
                        {reason.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* User: Selected Reason */}
            {selectedReason && (
              <div className="mb-3 d-flex justify-content-end">
                <div className="chat-bubble user mb-2">{selectedReason}</div>
              </div>
            )}

            {/* System: Select Sub-Reason */}
            {selectedReason && selectedReason !== 'Other' && (
              <div className="mb-3">
                <div className="chat-bubble system mb-2">
                  <h6>Select One Option</h6>
                  <div className="options">
                    {reasons.find(r => r.value === selectedReason)?.subReasons.map((subReason) => (
                      <div key={subReason} className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="subReason"
                          id={`subReason-${subReason}`}
                          value={subReason}
                          checked={selectedSubReason === subReason}
                          onChange={(e) => handleSubReasonChange(e.target.value)}
                          disabled={step > 2}
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

            {/* System: Select Related Booking */}
            {selectedSubReason && bookingRequiredReasons.includes(selectedReason) && (
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
                            id={`booking-${booking.BookingTrackID}`}
                            value={booking.BookingTrackID}
                            checked={bookingId === booking.BookingTrackID}
                            onChange={(e) => setBookingId(e.target.value)}
                            disabled={step > 3}
                          />
                          <label className="form-check-label" htmlFor={`booking-${booking.BookingTrackID}`}>
                            {booking.BookingTrackID} - {booking.ServiceType} booked on {new Date(booking.BookingDate).toLocaleDateString()}
                          </label>
                        </div>
                      ))}
                      {bookings.length > 5 && (
                        <button
                          type="button"
                          className="btn btn-link p-0 mt-2"
                          onClick={() => setShowAllBookings(!showAllBookings)}
                        >
                          {showAllBookings ? 'Show Less' : `Show All Bookings`}
                        </button>
                      )}
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
          </div>

          {/* Always visible: Additional Details */}
          <div className="mb-3 mt-50" >
            <label htmlFor="description" className="form-label">Description<span className="text-danger">*</span></label>
            <textarea
              className="form-control"
              id="description"
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your issue or request..."
              required
            ></textarea>
          </div>
          <div className="d-flex gap-2 justify-content-center">
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
              disabled={loading || step < 3 || (step === 3 && bookingRequiredReasons.includes(selectedReason) && !bookingId)}
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
