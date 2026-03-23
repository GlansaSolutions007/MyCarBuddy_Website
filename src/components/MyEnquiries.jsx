import React, { useState, useEffect } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";
import {
  FaClipboardList,
  FaFilter,
  FaThLarge,
  FaBolt,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaArrowLeft,
  FaCalendarAlt,
  FaClock,
  FaChevronRight,
  FaPhone,
  FaMapMarkerAlt,
  FaTag,
  FaHashtag,
  FaInfoCircle,
  FaUser,
  FaEnvelope,
} from "react-icons/fa";
import "./MyEnquiries.css";

const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;
const BaseURL = process.env.REACT_APP_CARBUDDY_BASE_URL;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// LeadStatus from API can be null — derive display status
const getStatusMeta = (leadStatus, isAnswered) => {
  if (leadStatus === "Closed")
    return { label: "Closed", className: "eq-status-closed" };
  if (leadStatus === "Converted")
    return { label: "Converted", className: "eq-status-converted" };
  if (leadStatus === "Cancelled")
    return { label: "Cancelled", className: "eq-status-cancelled" };
  if (isAnswered)
    return { label: "Answered", className: "eq-status-converted" };
  return { label: "Open", className: "eq-status-open" };
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const EnquirySkeleton = () => (
  <div className="eq-skeleton-card">
    <div className="eq-skeleton-header" />
    <div className="eq-skeleton-body">
      <div className="eq-skeleton-line" />
      <div className="eq-skeleton-line eq-skeleton-line--short" />
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const MyEnquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const bytes = CryptoJS.AES.decrypt(user.id, secretKey);
  const decryptedCustId = bytes.toString(CryptoJS.enc.Utf8);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${BaseURL}Leads/GetFacebookLeads?custId=${decryptedCustId}`,
          {
            headers: {
              Authorization: `Bearer ${user?.token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = Array.isArray(response.data) ? response.data : [];
        const sorted = data.sort(
          (a, b) => new Date(b.CreatedDate) - new Date(a.CreatedDate)
        );
        setEnquiries(sorted);
      } catch (error) {
        if (error.response?.status === 404) {
          setEnquiries([]);
        } else {
          console.error("Failed to fetch enquiries:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchEnquiries();
  }, []);

  // ── Tab counts ─────────────────────────────────────────────────────────────
  const allCount = enquiries.length;
  const openCount = enquiries.filter(
    (e) => !e.LeadStatus || e.LeadStatus === "Open"
  ).length;
  const closedCount = enquiries.filter(
    (e) => e.LeadStatus === "Closed" || e.LeadStatus === "Converted"
  ).length;
  const cancelledCount = enquiries.filter(
    (e) => e.LeadStatus === "Cancelled"
  ).length;

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = enquiries.filter((e) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      e.Id?.toLowerCase().includes(q) ||
      e.FullName?.toLowerCase().includes(q) ||
      e.PhoneNumber?.toLowerCase().includes(q) ||
      e.City?.toLowerCase().includes(q);

    let matchesTab = true;
    if (activeTab === "Open")
      matchesTab = !e.LeadStatus || e.LeadStatus === "Open";
    else if (activeTab === "Closed")
      matchesTab = e.LeadStatus === "Closed" || e.LeadStatus === "Converted";
    else if (activeTab === "Cancelled")
      matchesTab = e.LeadStatus === "Cancelled";

    return matchesSearch && matchesTab;
  });

  // ── Detail View ────────────────────────────────────────────────────────────
  if (selectedEnquiry) {
    const st = getStatusMeta(
      selectedEnquiry.LeadStatus,
      selectedEnquiry.Is_Answered
    );
    return (
      <div className="eq-section">
        <div className="container py-4">
          <div className="eq-detail-card">
            {/* Detail Header */}
            <div className="eq-detail-header">
              <div className="eq-detail-header-top">
                <button
                  className="eq-detail-back-btn"
                  onClick={() => setSelectedEnquiry(null)}
                >
                  <FaArrowLeft /> Back
                </button>
                <span className={`eq-status-badge ${st.className}`}>
                  {st.label}
                </span>
              </div>

              <div className="eq-detail-id-row">
                <div className="eq-detail-id-icon">
                  <FaClipboardList />
                </div>
                <div>
                  <p className="eq-detail-id-label eq-detail-id-text">Enquiry ID</p>
                  <h3 className="eq-detail-id-value eq-detail-id-text">
                    #{selectedEnquiry.Id}
                  </h3>
                </div>
              </div>

              <div className="eq-detail-meta-pills">
                <span className="eq-pill">
                  <FaCalendarAlt />
                  {formatDate(selectedEnquiry.CreatedDate)}{" "}
                  {formatTime(selectedEnquiry.CreatedDate)}
                </span>
                <span className="eq-pill">
                  <FaTag /> {selectedEnquiry.Platform || "Organic"}
                </span>
              </div>
            </div>

            {/* Detail Body */}
            <div className="eq-detail-body">
              {/* Customer Info */}
              <div className="eq-info-card">
                <div className="eq-info-card-header">
                  <div className="eq-info-card-icon">
                    <FaUser />
                  </div>
                  <h6>Customer Details</h6>
                </div>
                <div className="eq-info-card-body">
                  <div className="eq-detail-grid">
                    <div className="eq-detail-row">
                      <span className="eq-detail-label">Name</span>
                      <span className="eq-detail-value">
                        {selectedEnquiry.FullName || "N/A"}
                      </span>
                    </div>
                    <div className="eq-detail-row">
                      <span className="eq-detail-label">Phone</span>
                      <span className="eq-detail-value">
                        <FaPhone style={{ fontSize: "0.75rem", marginRight: 4 }} />
                        {selectedEnquiry.PhoneNumber || "N/A"}
                      </span>
                    </div>
                    <div className="eq-detail-row">
                      <span className="eq-detail-label">Email</span>
                      <span className="eq-detail-value">
                        <FaEnvelope style={{ fontSize: "0.75rem", marginRight: 4 }} />
                        {selectedEnquiry.Email || "N/A"}
                      </span>
                    </div>
                    <div className="eq-detail-row">
                      <span className="eq-detail-label">City</span>
                      <span className="eq-detail-value">
                        <FaMapMarkerAlt style={{ fontSize: "0.75rem", marginRight: 4 }} />
                        {selectedEnquiry.City?.trim() || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enquiry Info */}
              <div className="eq-info-card">
                <div className="eq-info-card-header">
                  <div className="eq-info-card-icon">
                    <FaInfoCircle />
                  </div>
                  <h6>Enquiry Information</h6>
                </div>
                <div className="eq-info-card-body">
                  <div className="eq-detail-grid">
                    <div className="eq-detail-row">
                      <span className="eq-detail-label">Status</span>
                      <span className={`eq-status-badge ${st.className}`}>
                        {st.label}
                      </span>
                    </div>
                    <div className="eq-detail-row">
                      <span className="eq-detail-label">Source</span>
                      <span className="eq-detail-value">
                        {selectedEnquiry.Platform || "Organic"}
                      </span>
                    </div>
                    <div className="eq-detail-row">
                      <span className="eq-detail-label">Answered</span>
                      <span className="eq-detail-value">
                        {selectedEnquiry.Is_Answered ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="eq-detail-row">
                      <span className="eq-detail-label">Created</span>
                      <span className="eq-detail-value">
                        {formatDate(selectedEnquiry.CreatedDate)},{" "}
                        {formatTime(selectedEnquiry.CreatedDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── List View ──────────────────────────────────────────────────────────────
  return (
    <div className="eq-section">
      <div className="container py-4">
        {/* Header */}
        <div className="eq-header">
          <h2 className="eq-title">
            <span className="eq-title-icon">
              <FaClipboardList />
            </span>
            My Enquiries
          </h2>
          <button
            className="eq-filter-btn"
            onClick={() => setShowFilters((s) => !s)}
          >
            <FaFilter /> Filter
          </button>
        </div>

        {/* Filters & Tabs */}
        {showFilters && (
          <>
            <div className="eq-tabs">
              {[
                { key: "All", icon: <FaThLarge />, count: allCount },
                { key: "Open", icon: <FaBolt />, count: openCount },
                { key: "Closed", icon: <FaCheckCircle />, count: closedCount },
                { key: "Cancelled", icon: <FaTimesCircle />, count: cancelledCount },
              ].map(({ key, icon, count }) => (
                <button
                  key={key}
                  className={`eq-tab ${activeTab === key ? "active" : ""}`}
                  onClick={() => setActiveTab(key)}
                >
                  {icon} {key}
                  <span className="eq-tab-count">{count}</span>
                </button>
              ))}
            </div>

            <div className="eq-search-card">
              <input
                type="text"
                className="eq-search-input"
                placeholder="Search by ID, name, phone or city…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="eq-search-clear"
                  onClick={() => setSearchTerm("")}
                >
                  Clear
                </button>
              )}
            </div>
          </>
        )}

        {/* Cards */}
        <div className="eq-scroll-container">
          {isLoading ? (
            <>
              <EnquirySkeleton />
              <EnquirySkeleton />
              <EnquirySkeleton />
            </>
          ) : filtered.length === 0 ? (
            <div className="eq-empty-state">
              <FaClipboardList className="eq-empty-icon" />
              <h5>No enquiries found</h5>
              <p className="text-muted">
                {searchTerm || activeTab !== "All"
                  ? "Try adjusting your filters or search term."
                  : "You have no enquiries yet."}
              </p>
            </div>
          ) : (
            filtered.map((enq) => {
              const st = getStatusMeta(enq.LeadStatus, enq.Is_Answered);
              return (
                <div key={enq.Id} className="eq-card">
                  {/* Card Header */}
                  <div className="eq-card-header">
                    <div className="eq-card-id-block">
                      <div className="eq-card-icon">
                        <FaClipboardList />
                      </div>
                      <div>
                        <h4 className="eq-card-id">
                          <FaHashtag className="eq-hash" />
                          {enq.Id}
                        </h4>
                        <span className="eq-card-date">
                          <FaCalendarAlt />
                          {formatDate(enq.CreatedDate)} &nbsp;
                          <FaClock />
                          {formatTime(enq.CreatedDate)}
                        </span>
                      </div>
                    </div>

                    <div className="eq-card-badges">
                      <span className={`eq-status-badge ${st.className}`}>
                        {st.label}
                      </span>
                      {enq.Platform && (
                        <span className="eq-service-type-badge">
                          <FaTag /> {enq.Platform}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="eq-card-body">
                    <div className="eq-card-service">
                      <FaUser className="eq-card-service-icon" />
                      <span>{enq.FullName || "N/A"}</span>
                    </div>

                    <div className="eq-card-meta">
                      <span className="eq-meta-item">
                        <FaPhone />
                        {enq.PhoneNumber || "N/A"}
                      </span>
                      {enq.City && (
                        <span className="eq-meta-item">
                          <FaMapMarkerAlt />
                          {enq.City.trim()}
                        </span>
                      )}
                      {enq.Email && (
                        <span className="eq-meta-item">
                          <FaEnvelope />
                          {enq.Email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="eq-card-footer">
                    <button
                      className="eq-view-btn"
                      onClick={() => setSelectedEnquiry(enq)}
                    >
                      <FaEye /> View Details
                      <FaChevronRight className="eq-chevron" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default MyEnquiries;