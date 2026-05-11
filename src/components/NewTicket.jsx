import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { useAlert } from '../context/AlertContext';
import Swal from 'sweetalert2';
import './NewTicket.css';
import {
  FaTicketAlt, FaTimes, FaPaperclip, FaPaperPlane,
  FaArrowLeft, FaFileAlt, FaCheck, FaChevronRight
} from 'react-icons/fa';

/* ─── Step definitions ─────────────────────────────────────────────
   The wizard has up to 4 steps. When opened from a booking the
   booking step is skipped (pre-filled) so only 3 steps are shown.
──────────────────────────────────────────────────────────────────── */
const STEPS = {
  CATEGORY: 1,   // Pick Booking / Payment / Service / App / Others
  BOOKING: 2,   // Pick which booking (skipped when pre-selected)
  REASON: 3,   // Pick specific sub-reason
  DESCRIBE: 4,   // Write description + attach images
};

const NewTicket = ({ onClose, onTicketCreated, selectedTicketBookingId }) => {
  /* ── state ── */
  const [step, setStep] = useState(STEPS.CATEGORY);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubReason, setSelectedSubReason] = useState('');
  const [selectedSubReasonId, setSelectedSubReasonId] = useState('');
  const [description, setDescription] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [showAllBookings, setShowAllBookings] = useState(false);
  const [reasonTypes, setReasonTypes] = useState([]);
  const [reasonTypesLoading, setReasonTypesLoading] = useState(true);
  const [previewFiles, setPreviewFiles] = useState([]);

  const { showAlert } = useAlert();
  const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;
  const baseUrl = process.env.REACT_APP_CARBUDDY_BASE_URL;

  /* ── helpers ── */
  const getUser = () => JSON.parse(localStorage.getItem('user'));
  const getAuthHeader = () => ({ Authorization: `Bearer ${getUser()?.token}` });

  const getDecryptedCustId = () => {
    try {
      const user = getUser();
      if (!user?.id) return null;
      const bytes = CryptoJS.AES.decrypt(user.id, secretKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
      return null;
    }
  };

  /* ── whether the booking step is skippable ── */
  const hasPreselectedBooking = Boolean(selectedTicketBookingId);

  /* ── total visible steps ── */
  const totalSteps = hasPreselectedBooking ? 3 : 4;

  /* Map internal step number → display step index (1-based) */
  const displayStep = (s) => {
    if (hasPreselectedBooking) {
      // CATEGORY=1, REASON=2(shown as step 2), DESCRIBE=3
      if (s === STEPS.CATEGORY) return 1;
      if (s === STEPS.REASON) return 2;
      if (s === STEPS.DESCRIBE) return 3;
    }
    return s;
  };

  /* Step labels for the progress bar */
  const stepLabels = hasPreselectedBooking
    ? ['Category', 'Reason', 'Describe']
    : ['Category', 'Booking', 'Reason', 'Describe'];

  /* ── fetch data ── */
  const fetchBookings = async () => {
    try {
      setBookingsLoading(true);
      const res = await axios.get(
        `${baseUrl}Bookings/${getDecryptedCustId()}`,
        { headers: getAuthHeader() }
      );
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch {
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  const fetchReasonTypes = async () => {
    try {
      setReasonTypesLoading(true);
      const res = await axios.get(`${baseUrl}AfterServiceLeads`, {
        headers: getAuthHeader(),
      });

      if (!Array.isArray(res.data)) { setReasonTypes([]); return; }

      const grouped = res.data.reduce((acc, item) => {
        const key = item.ReasonType || 'Others';
        if (!acc[key]) acc[key] = { Reasons: [] };
        acc[key].Reasons.push({ id: item.ID, label: item.Reason });
        return acc;
      }, {});

      const allowed = ['Booking', 'Payment', 'Service', 'App'];
      const formatted = Object.keys(grouped)
        .filter(k => allowed.some(a => k.includes(a)))
        .map(k => ({ value: k, label: k, Reasons: grouped[k].Reasons }));

      formatted.push({
        value: 'Others',
        label: 'Others',
        Reasons: grouped['Others']?.Reasons || [],
      });

      setReasonTypes(formatted);
    } catch {
      setReasonTypes([]);
    } finally {
      setReasonTypesLoading(false);
    }
  };

  useEffect(() => {
    fetchReasonTypes();
    fetchBookings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Pre-select booking when prop is supplied */
  useEffect(() => {
    if (selectedTicketBookingId) {
      setBookingId(selectedTicketBookingId.toString());
    }
  }, [selectedTicketBookingId]);

  /* ── category icons ── */
  const categoryMeta = {
    Booking: { icon: '📋', desc: 'Issues with your booking details or scheduling' },
    Payment: { icon: '💳', desc: 'Payment failures, refunds or billing questions' },
    Service: { icon: '🔧', desc: 'Service quality, technician or parts concerns' },
    App: { icon: '📱', desc: 'Problems with the app or website experience' },
    Others: { icon: '💬', desc: 'Anything that doesn\'t fit the above categories' },
  };

  /* ── navigation ── */
  const goNext = (targetStep) => setStep(targetStep);

  const goBack = () => {
    if (step === STEPS.CATEGORY) { onClose(); return; }

    if (step === STEPS.BOOKING) {
      setSelectedCategory('');
      setStep(STEPS.CATEGORY);
      return;
    }

    if (step === STEPS.REASON) {
      setSelectedSubReason('');
      setSelectedSubReasonId('');
      if (hasPreselectedBooking) {
        setSelectedCategory('');
        setStep(STEPS.CATEGORY);
      } else {
        setStep(STEPS.BOOKING);
      }
      return;
    }

    if (step === STEPS.DESCRIBE) {
      if (selectedCategory === 'Others') {
        setSelectedCategory('');
        setStep(STEPS.CATEGORY);
      } else {
        setSelectedSubReason('');
        setSelectedSubReasonId('');
        setStep(STEPS.REASON);
      }
    }
  };

  /* ── handlers ── */
  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setSelectedSubReason('');
    setSelectedSubReasonId('');

    if (cat === 'Others') {
      // Skip booking + reason, go straight to description
      goNext(STEPS.DESCRIBE);
    } else if (hasPreselectedBooking) {
      goNext(STEPS.REASON);
    } else {
      goNext(STEPS.BOOKING);
    }
  };

  const handleBookingSelect = (bId) => {
    setBookingId(bId.toString());
    goNext(STEPS.REASON);
  };

  const handleReasonSelect = (reason) => {
    setSelectedSubReasonId(reason.id);
    setSelectedSubReason(reason.label);
    goNext(STEPS.DESCRIBE);
  };

  /* ── file handling ── */
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const invalid = files.filter(f => !f.type.startsWith('image/'));
    if (invalid.length) {
      Swal.fire({ icon: 'warning', title: 'Images only', text: 'Only image files are allowed (JPG, PNG, etc.)', confirmButtonColor: '#136d6e' });
      e.target.value = '';
      return;
    }
    const total = [...previewFiles, ...files];
    if (total.length > 5) {
      Swal.fire({ icon: 'error', title: 'Too many images', text: 'Maximum 5 images allowed.', confirmButtonColor: '#136d6e' });
      e.target.value = '';
      return;
    }
    setPreviewFiles(prev => [
      ...prev,
      ...files.map(f => ({ file: f, type: f.type, preview: URL.createObjectURL(f) })),
    ]);
    e.target.value = '';
  };

  const removeFile = (i) => setPreviewFiles(prev => prev.filter((_, idx) => idx !== i));

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      showAlert('Please enter a description.', 'error');
      return;
    }
    const custId = getDecryptedCustId();
    if (!custId) {
      showAlert('Unable to identify user. Please log in again.', 'error');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('CustID', parseInt(custId));
      formData.append('BookingID', bookingId ? parseInt(bookingId) : 0);
      formData.append('Description', description.trim());

      let reasonId = 0;
      if (selectedCategory === 'Others') {
        const othersGroup = reasonTypes.find(r => r.value === 'Others');
        reasonId = othersGroup?.Reasons?.[0]?.id || 5;
      } else {
        reasonId = selectedSubReasonId || 0;
      }
      formData.append('ReasonId', reasonId);
      previewFiles.forEach(f => formData.append('Files', f.file));

      const response = await axios.post(`${baseUrl}Tickets`, formData, {
        headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 200 || response.status === 201) {
        await Swal.fire({
          title: 'Ticket raised!',
          text: 'Your support ticket has been created successfully.',
          icon: 'success',
          timer: 1800,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        });
        onTicketCreated();
        onClose();
      } else {
        showAlert('Failed to create ticket. Please try again.', 'error');
      }
    } catch {
      showAlert('Failed to create ticket. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ── currently selected booking object (for display) ── */
  const selectedBookingObj = bookings.find(
    b => b.BookingID.toString() === bookingId.toString()
  );

  const isTicketBookingVisible = (booking) => {
    if (!booking || booking.BookingStatus === "Cancelled") return false;

    const tickets = booking.Tickets;

    if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
      return true;
    }

    const latestTicket = [...tickets].sort(
      (a, b) => new Date(b.CreatedDate) - new Date(a.CreatedDate)
    )[0];

    return (
      typeof latestTicket.StatusName === "string" &&
      latestTicket.StatusName.toLowerCase() === "closed" || latestTicket.StatusName.toLowerCase() === "cancelled"
    );
  };

  const visibleTicketBookings = bookings.filter(isTicketBookingVisible);

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  return (
    <div className="nt-card">
      {/* ── Progress stepper ── */}
      <div className="nt-stepper">
        {stepLabels.map((label, i) => {
          const stepNum = i + 1;
          const current = displayStep(step);
          const isDone = stepNum < current;
          const isActive = stepNum === current;
          return (
            <React.Fragment key={label}>
              <div className={`nt-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                <div className="nt-step-circle">
                  {isDone ? <FaCheck size={10} /> : stepNum}
                </div>
                <span className="nt-step-label">{label}</span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`nt-step-line ${isDone ? 'done' : ''}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Form body ── */}
      <form className="nt-form" onSubmit={handleSubmit}>

        {/* ════ STEP 1 — CATEGORY ════ */}
        {step === STEPS.CATEGORY && (
          <div className="nt-step-content" key="category">
            <div className="nt-step-header">
              <h4 className="nt-step-title">What's your issue about?</h4>
              <p className="nt-step-subtitle">Choose the category that best describes your problem.</p>
            </div>

            {reasonTypesLoading ? (
              <div className="nt-loading-row">
                <span className="nt-spinner" /> Loading categories…
              </div>
            ) : (
              <div className="nt-category-grid">
                {reasonTypes.map(rt => {
                  const meta = categoryMeta[rt.value] || { icon: '❓', desc: '' };
                  return (
                    <button
                      key={rt.value}
                      type="button"
                      className={`nt-category-card ${selectedCategory === rt.value ? 'selected' : ''}`}
                      onClick={() => handleCategorySelect(rt.value)}
                    >
                      <span className="nt-cat-icon">{meta.icon}</span>
                      <span className="nt-cat-name">{rt.label}</span>
                      <span className="nt-cat-desc">{meta.desc}</span>
                      <span className="nt-cat-arrow"><FaChevronRight size={11} /></span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════ STEP 2 — BOOKING (only when no pre-selected booking) ════ */}
        {step === STEPS.BOOKING && !hasPreselectedBooking && (
          <div className="nt-step-content" key="booking">
            <div className="nt-step-header">
              <div className="nt-back-row">
                <button type="button" className="nt-back-link" onClick={goBack}>
                  <FaArrowLeft size={12} /> Back
                </button>
                <span className="nt-selected-cat-pill">{selectedCategory}</span>
              </div>
              <h4 className="nt-step-title">Which booking is this about?</h4>
              <p className="nt-step-subtitle">Select the booking related to your issue, or skip if it's a general query.</p>
            </div>

            {bookingsLoading ? (
              <div className="nt-loading-row"><span className="nt-spinner" /> Loading bookings…</div>
            ) : visibleTicketBookings.length === 0 ? (
              <div className="nt-empty-state">
                <p>No eligible bookings were found for creating a ticket right now.</p>
                <button type="button" className="nt-btn-outline" onClick={() => goNext(STEPS.REASON)}>
                  Continue without a booking
                </button>
              </div>
            ) : (
              <>
                <div className="nt-booking-list">
                  {(showAllBookings ? visibleTicketBookings : visibleTicketBookings.slice(0, 5)).map(b => (
                    <button
                      key={b.BookingID}
                      type="button"
                      className={`nt-booking-row ${bookingId === b.BookingID.toString() ? 'selected' : ''}`}
                      onClick={() => handleBookingSelect(b.BookingID)}
                    >
                      <div className="nt-booking-row-left">
                        <span className="nt-booking-track">{b.BookingTrackID}</span>
                        <span className="nt-booking-meta">
                          {b.ServiceType} &nbsp;·&nbsp; {new Date(b.BookingDate).toLocaleDateString()}
                          {b.Packages?.length > 0 && (
                            <> &nbsp;·&nbsp; {b.Packages.map(p => p.PackageName).join(', ').slice(0, 30)}{b.Packages.map(p => p.PackageName).join(', ').length > 30 ? '…' : ''}</>
                          )}
                        </span>
                      </div>
                      <span className={`nt-booking-status ${b.BookingStatus?.toLowerCase()}`}>
                        {b.BookingStatus}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="nt-booking-actions">
                  {visibleTicketBookings.length > 5 && (
                    <button type="button" className="nt-btn-text" onClick={() => setShowAllBookings(v => !v)}>
                      {showAllBookings ? 'Show fewer' : `Show all ${visibleTicketBookings.length} bookings`}
                    </button>
                  )}
                  <button type="button" className="nt-btn-outline" onClick={() => goNext(STEPS.REASON)}>
                    Skip — not related to a booking
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ════ STEP 3 — REASON ════ */}
        {step === STEPS.REASON && (
          <div className="nt-step-content" key="reason">
            <div className="nt-step-header">
              <div className="nt-back-row">
                <button type="button" className="nt-back-link" onClick={goBack}>
                  <FaArrowLeft size={12} /> Back
                </button>
                <span className="nt-selected-cat-pill">{selectedCategory}</span>
                {selectedBookingObj && (
                  <span className="nt-selected-cat-pill booking">
                    #{selectedBookingObj.BookingTrackID}
                  </span>
                )}
              </div>
              <h4 className="nt-step-title">What specifically happened?</h4>
              <p className="nt-step-subtitle">Pick the reason that best describes your issue.</p>
            </div>

            <div className="nt-reason-list">
              {(reasonTypes.find(r => r.value === selectedCategory)?.Reasons || []).map(reason => (
                <button
                  key={reason.id}
                  type="button"
                  className={`nt-reason-row ${selectedSubReasonId === reason.id ? 'selected' : ''}`}
                  onClick={() => handleReasonSelect(reason)}
                >
                  <span className="nt-reason-label">{reason.label}</span>
                  <FaChevronRight size={11} className="nt-reason-arrow" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ════ STEP 4 — DESCRIBE ════ */}
        {step === STEPS.DESCRIBE && (
          <div className="nt-step-content" key="describe">
            <div className="nt-step-header">
              <div className="nt-back-row">
                <button type="button" className="nt-back-link" onClick={goBack}>
                  <FaArrowLeft size={12} /> Back
                </button>
                <span className="nt-selected-cat-pill">{selectedCategory}</span>
                {selectedSubReason && (
                  <span className="nt-selected-cat-pill reason">{selectedSubReason}</span>
                )}
                {selectedBookingObj && (
                  <span className="nt-selected-cat-pill booking">
                    #{selectedBookingObj.BookingTrackID}
                  </span>
                )}
              </div>
              <h4 className="nt-step-title">Describe your issue</h4>
              <p className="nt-step-subtitle">
                The more detail you provide, the faster we can help. You can also attach screenshots.
              </p>
            </div>

            {/* Context summary card */}
            <div className="nt-context-card">
              <div className="nt-context-row">
                <span className="nt-context-label">Category</span>
                <span className="nt-context-value">{selectedCategory}</span>
              </div>
              {selectedSubReason && (
                <div className="nt-context-row">
                  <span className="nt-context-label">Reason</span>
                  <span className="nt-context-value">{selectedSubReason}</span>
                </div>
              )}
              {selectedBookingObj && (
                <div className="nt-context-row">
                  <span className="nt-context-label">Booking</span>
                  <span className="nt-context-value">#{selectedBookingObj.BookingTrackID} — {selectedBookingObj.ServiceType}</span>
                </div>
              )}
            </div>

            {/* Description textarea */}
            <div className="nt-field">
              <label className="nt-label" htmlFor="nt-description">
                Description <span className="nt-required">*</span>
              </label>
              <textarea
                id="nt-description"
                className="nt-textarea"
                rows={5}
                placeholder="Explain your issue in detail…"
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
              <span className="nt-char-count">{description.length} chars</span>
            </div>

            {/* File attachment */}
            <div className="nt-field">
              <label className="nt-label">
                Attachments
                <span className="nt-label-hint"> (images only, max 5)</span>
              </label>

              <input
                id="nt-file-input"
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <label htmlFor="nt-file-input" className="nt-attach-zone">
                <FaPaperclip size={14} />
                <span>Click to attach images</span>
              </label>

              {previewFiles.length > 0 && (
                <div className="nt-file-previews">
                  {previewFiles.map((f, i) => (
                    <div key={i} className="nt-file-preview">
                      {f.type.startsWith('image/') ? (
                        <img src={f.preview} alt={`preview-${i}`} />
                      ) : (
                        <div className="nt-file-icon"><FaFileAlt /></div>
                      )}
                      <button
                        type="button"
                        className="nt-file-remove"
                        onClick={() => removeFile(i)}
                        aria-label="Remove file"
                      >
                        <FaTimes size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="nt-submit-btn"
              disabled={loading || !description.trim()}
            >
              {loading ? (
                <><span className="nt-spinner" /> Submitting…</>
              ) : (
                <><FaPaperPlane size={13} /> Raise Ticket</>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default NewTicket;