import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  Star, 
  MessageSquare, 
  ClipboardCheck, 
  ChevronLeft, 
  CheckCircle2, 
  Send, 
  Sparkles,
  ShieldCheck
} from "lucide-react";
import Swal from "sweetalert2";
import "./Feedback.css";

const BASE_URL = process.env.REACT_APP_CARBUDDY_BASE_URL;

const FeedbackLayer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const bookingId = searchParams.get("bookingId");
  const custId = searchParams.get("custId");

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState(null);

  useEffect(() => {
    if (bookingId) {
      fetchExistingFeedback();
    }
  }, [bookingId]);

  const fetchExistingFeedback = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}Feedback/feedback?bookingId=${bookingId}`);
      if (res.data && res.data.length > 0) {
        const latest = res.data.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt))[0];
        setExistingFeedback(latest);
        setRating(Number(latest.ServiceRating));
        setReview(latest.ServiceReview);
      }
    } catch (error) {
      console.error("Error fetching feedback", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Rating Required',
        text: 'Please select a star rating before submitting.',
        confirmButtonColor: '#088178'
      });
      return;
    }

    setLoading(true);
    const payload = {
      bookingID: bookingId,
      custID: custId ? Number(custId) : null,
      serviceRating: String(rating),
      serviceReview: review || "",
      techID: 0,
      techRating: "0",
      techReview: "",
    };

    try {
      await axios.post(`${BASE_URL}Feedback`, payload);
      setIsSubmitted(true);
      Swal.fire({
        html: `
            <div class="mcb-swal-content">
              <div class="mcb-swal-emoji">😊</div>
              <h2 class="mcb-swal-title">Thank You!</h2>
              <p class="mcb-swal-text">We truly appreciate you taking the time to share your experience.</p>
              <p class="mcb-swal-sub">Your feedback helps us improve and serve you better.</p>
            </div>
        `,
        confirmButtonText: 'Done',
        confirmButtonColor: "#088178",
        position: 'center',              
        allowOutsideClick: false,
        allowEscapeKey: false,
        heightAuto: false,               
        backdrop: true
      });
    } catch (error) {
      Swal.fire("Error", "Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !existingFeedback && !isSubmitted) {
    return (
      <div className="mcb-fb-loader-container">
        <div className="mcb-fb-spinner"></div>
        <p>Preparing your experience...</p>
      </div>
    );
  }

  return (
    <main className="mcb-fb-page-container">
      <div className="mcb-fb-content-width">
        <div className="mcb-fb-main-card">
          
          {/* Welcome Header Strip */}
          <header className="mcb-fb-welcome-header">
             <div className="mcb-welcome-text">
                <Sparkles size={16} className="mcb-gold-icon" />
                <span>We value your experience, <strong>Let's make it better!</strong></span>
             </div>
             <div className="mcb-premium-badge">
                <ShieldCheck size={14} /> <span>Premium Partner</span>
             </div>
          </header>

          <section className="mcb-fb-card-body">
            {(existingFeedback || isSubmitted) ? (
              /* --- SUCCESS VIEW --- */
              <div className="mcb-fb-status-view">
                <div className="mcb-fb-check-icon">
                   <CheckCircle2 size={56} />
                </div>
                <h2>Thank You for Sharing!</h2>
                <p>Your review helps us maintain the highest service standards at My Car Buddy.</p>

                <div className="mcb-fb-result-box">
                   <div className="mcb-fb-static-stars">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={32} 
                          fill={i < rating ? "#FF9F43" : "none"} 
                          stroke={i < rating ? "#FF9F43" : "#D1D5DB"} 
                        />
                      ))}
                   </div>
                   <div className="mcb-fb-result-comment">
                      <span className="mcb-label-small">YOUR EXPERIENCE</span>
                      <p>"{review || "A wonderful service experience!"}"</p>
                   </div>
                </div>

                <button onClick={() => navigate("/")} className="mcb-fb-btn-back">
                  <ChevronLeft size={18} /> Back to Home
                </button>
              </div>
            ) : (
              /* --- FORM VIEW --- */
              <form onSubmit={handleSubmit} className="mcb-fb-form-layout">
                <div className="mcb-fb-form-intro">
                  <div className="mcb-fb-icon-square">
                    <ClipboardCheck size={26} />
                  </div>
                  <div className="mcb-fb-intro-text">
                    <h3>Service Review</h3>
                    <p>How was your overall service experience with us?</p>
                  </div>
                </div>

                <div className="mcb-fb-interactive-rating">
                  <div className="mcb-fb-star-group">
                    {[...Array(5)].map((_, index) => {
                      const val = index + 1;
                      return (
                        <Star
                          key={index}
                          className={`mcb-fb-star-item ${val <= (hover || rating) ? 'is-active' : ''}`}
                          onMouseEnter={() => setHover(val)}
                          onMouseLeave={() => setHover(0)}
                          onClick={() => setRating(val)}
                          fill={(hover || rating) >= val ? "#FF9F43" : "transparent"}
                          stroke={(hover || rating) >= val ? "#FF9F43" : "#D1D5DB"}
                        />
                      );
                    })}
                  </div>
                  {rating > 0 && (
                    <div className="mcb-fb-rating-label">
                       {rating === 5 && "Excellent! 😍"}
                       {rating === 4 && "Great Experience! 😊"}
                       {rating === 3 && "Good Service. 🙂"}
                       {rating === 2 && "Could be better. 😐"}
                       {rating === 1 && "Not satisfied. 😞"}
                    </div>
                  )}
                </div>

                <div className="mcb-fb-field-group">
                  <label htmlFor="review-text">
                    <MessageSquare size={16} className="mcb-teal-text" />
                    Share your detailed thoughts (Optional)
                  </label>
                  <textarea
                    className="textareainputfield"
                    id="review-text"
                    placeholder="Tell us what you loved or how we can improve our service for you..."
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    rows="4"
                  />
                </div>

                <footer className="mcb-fb-form-footer">
                  <button type="button" onClick={() => navigate("/")} className="mcb-fb-btn-ghost">
                    Skip
                  </button>
                  <button type="submit" className="mcb-fb-btn-primary" disabled={loading}>
                    {loading ? 'Submitting...' : (
                      <>Submit Feedback <Send size={16} /></>
                    )}
                  </button>
                </footer>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

export default FeedbackLayer;