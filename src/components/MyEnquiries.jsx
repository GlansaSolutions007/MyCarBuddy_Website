import React, { useState } from "react";
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
  FaCar,
  FaChevronRight,
  FaPhone,
  FaMapMarkerAlt,
  FaTag,
  FaClock,
  FaHashtag,
  FaWrench,
  FaInfoCircle,
  FaUser,
} from "react-icons/fa";
import "./MyEnquiries.css";

// ─── Static dummy data ────────────────────────────────────────────────────────
const DUMMY_ENQUIRIES = [
  {
    EnquiryID: "MCBI00034",
    CreatedDate: "2026-03-23T12:26:25.000",
    ServiceName: "Standard Car Plan - Hatchback • Sedan • Compact SUV",
    ServiceType: "ServiceAtHome",
    VehicleNumber: "TS10112",
    BrandName: "Honda",
    ModelName: "Amaze",
    FuelTypeName: "Petrol",
    CustomerName: "Vijay",
    PhoneNumber: "8790071223",
    City: "Madhapur",
    EnquiryStatus: "Closed",
    Platform: "Organic",
  },
  {
    EnquiryID: "MCBI00031",
    CreatedDate: "2026-03-20T09:14:00.000",
    ServiceName: "Full Car Detailing - Premium Package",
    ServiceType: "ServiceAtGarage",
    VehicleNumber: "TS09AB1234",
    BrandName: "Maruti Suzuki",
    ModelName: "Swift",
    FuelTypeName: "Petrol",
    CustomerName: "Ravi Kumar",
    PhoneNumber: "9876543210",
    City: "Gachibowli",
    EnquiryStatus: "Open",
    Platform: "Organic",
  },
  {
    EnquiryID: "MCBI00028",
    CreatedDate: "2026-03-17T15:45:10.000",
    ServiceName: "AC Service & Regas",
    ServiceType: "ServiceAtHome",
    VehicleNumber: "AP28CD5678",
    BrandName: "Hyundai",
    ModelName: "Creta",
    FuelTypeName: "Diesel",
    CustomerName: "Priya Sharma",
    PhoneNumber: "9123456789",
    City: "Banjara Hills",
    EnquiryStatus: "Converted",
    Platform: "Referral",
  },
  {
    EnquiryID: "MCBI00025",
    CreatedDate: "2026-03-12T11:00:00.000",
    ServiceName: "Wheel Alignment & Balancing",
    ServiceType: "ServiceAtGarage",
    VehicleNumber: "TS07EF9012",
    BrandName: "Tata",
    ModelName: "Nexon",
    FuelTypeName: "Electric",
    CustomerName: "Arjun Reddy",
    PhoneNumber: "9000112233",
    City: "Kukatpally",
    EnquiryStatus: "Cancelled",
    Platform: "Organic",
  },
  {
    EnquiryID: "MCBI00019",
    CreatedDate: "2026-03-05T08:30:45.000",
    ServiceName: "Battery Replacement",
    ServiceType: "ServiceAtHome",
    VehicleNumber: "TS14GH3456",
    BrandName: "Kia",
    ModelName: "Seltos",
    FuelTypeName: "Petrol",
    CustomerName: "Sneha Patel",
    PhoneNumber: "9988776655",
    City: "Jubilee Hills",
    EnquiryStatus: "Open",
    Platform: "Organic",
  },
];

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

const statusMeta = {
  Open: { label: "Open", className: "eq-status-open" },
  Closed: { label: "Closed", className: "eq-status-closed" },
  Converted: { label: "Converted", className: "eq-status-converted" },
  Cancelled: { label: "Cancelled", className: "eq-status-cancelled" },
};

const serviceTypeMeta = {
  ServiceAtHome: { label: "At Home", icon: "🏠" },
  ServiceAtGarage: { label: "At Garage", icon: "🔧" },
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
  const [activeTab, setActiveTab] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  // Tab counts
  const allCount = DUMMY_ENQUIRIES.length;
  const openCount = DUMMY_ENQUIRIES.filter((e) => e.EnquiryStatus === "Open").length;
  const closedCount = DUMMY_ENQUIRIES.filter(
    (e) => e.EnquiryStatus === "Closed" || e.EnquiryStatus === "Converted"
  ).length;
  const cancelledCount = DUMMY_ENQUIRIES.filter(
    (e) => e.EnquiryStatus === "Cancelled"
  ).length;

  // Filter
  const filtered = DUMMY_ENQUIRIES.filter((e) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      e.EnquiryID.toLowerCase().includes(q) ||
      e.ServiceName.toLowerCase().includes(q) ||
      e.VehicleNumber?.toLowerCase().includes(q);
    let matchesTab = true;
    if (activeTab === "Open") matchesTab = e.EnquiryStatus === "Open";
    else if (activeTab === "Closed")
      matchesTab =
        e.EnquiryStatus === "Closed" || e.EnquiryStatus === "Converted";
    else if (activeTab === "Cancelled")
      matchesTab = e.EnquiryStatus === "Cancelled";
    return matchesSearch && matchesTab;
  });

  // ── Detail View ──────────────────────────────────────────────────────────
  if (selectedEnquiry) {
    const st = statusMeta[selectedEnquiry.EnquiryStatus] || {};
    const svc = serviceTypeMeta[selectedEnquiry.ServiceType] || {};
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
                  <p className="eq-detail-id-label">Enquiry ID</p>
                  <h3 className="eq-detail-id-value">
                    #{selectedEnquiry.EnquiryID}
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
                  {svc.icon} {svc.label || selectedEnquiry.ServiceType}
                </span>
                <span className="eq-pill">
                  <FaTag /> {selectedEnquiry.Platform}
                </span>
              </div>
            </div>

            {/* Detail Body */}
            <div className="eq-detail-body">
              {/* Service Info */}
              <div className="eq-info-card">
                <div className="eq-info-card-header">
                  <div className="eq-info-card-icon">
                    <FaWrench />
                  </div>
                  <h6>Service</h6>
                </div>
                <div className="eq-info-card-body">
                  <p className="eq-service-name">{selectedEnquiry.ServiceName}</p>
                  <div className="eq-detail-row">
                    <span className="eq-detail-label">Type</span>
                    <span className="eq-detail-value">
                      {svc.icon} {svc.label || selectedEnquiry.ServiceType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="eq-info-card">
                <div className="eq-info-card-header">
                  <div className="eq-info-card-icon">
                    <FaCar />
                  </div>
                  <h6>Vehicle</h6>
                </div>
                <div className="eq-info-card-body">
                  <div className="eq-detail-grid">
                    <div className="eq-detail-row">
                      <span className="eq-detail-label">Number</span>
                      <span className="eq-detail-value">
                        {selectedEnquiry.VehicleNumber || "N/A"}
                      </span>
                    </div>
                    <div className="eq-detail-row">
                      <span className="eq-detail-label">Brand</span>
                      <span className="eq-detail-value">
                        {selectedEnquiry.BrandName || "N/A"}
                      </span>
                    </div>
                    <div className="eq-detail-row">
                      <span className="eq-detail-label">Model</span>
                      <span className="eq-detail-value">
                        {selectedEnquiry.ModelName || "N/A"}
                      </span>
                    </div>
                    <div className="eq-detail-row">
                      <span className="eq-detail-label">Fuel</span>
                      <span className="eq-detail-value">
                        {selectedEnquiry.FuelTypeName || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="eq-info-card">
                <div className="eq-info-card-header">
                  <div className="eq-info-card-icon">
                    <FaUser />
                  </div>
                  <h6>Customer</h6>
                </div>
                <div className="eq-info-card-body">
                  <div className="eq-detail-grid">
                    <div className="eq-detail-row">
                      <span className="eq-detail-label">Name</span>
                      <span className="eq-detail-value">
                        {selectedEnquiry.CustomerName || "N/A"}
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
                      <span className="eq-detail-label">City</span>
                      <span className="eq-detail-value">
                        <FaMapMarkerAlt
                          style={{ fontSize: "0.75rem", marginRight: 4 }}
                        />
                        {selectedEnquiry.City || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enquiry Status Info */}
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
                        {selectedEnquiry.Platform}
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

  // ── List View ────────────────────────────────────────────────────────────
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
                {
                  key: "Cancelled",
                  icon: <FaTimesCircle />,
                  count: cancelledCount,
                },
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
                placeholder="Search by Enquiry ID, service or vehicle number…"
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
          {filtered.length === 0 ? (
            <div className="eq-empty-state">
              <FaClipboardList className="eq-empty-icon" />
              <h5>No enquiries found</h5>
              <p className="text-muted">
                Try adjusting your filters or search term.
              </p>
            </div>
          ) : (
            filtered.map((enq) => {
              const st = statusMeta[enq.EnquiryStatus] || {};
              const svc = serviceTypeMeta[enq.ServiceType] || {};
              return (
                <div key={enq.EnquiryID} className="eq-card">
                  {/* Card Header */}
                  <div className="eq-card-header">
                    <div className="eq-card-id-block">
                      <div className="eq-card-icon">
                        <FaClipboardList />
                      </div>
                      <div>
                        <h4 className="eq-card-id">
                          <FaHashtag className="eq-hash" />
                          {enq.EnquiryID}
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
                      <span className="eq-service-type-badge">
                        {svc.icon} {svc.label || enq.ServiceType}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="eq-card-body">
                    <div className="eq-card-service">
                      <FaWrench className="eq-card-service-icon" />
                      <span>{enq.ServiceName}</span>
                    </div>

                    <div className="eq-card-meta">
                      <span className="eq-meta-item">
                        <FaCar />
                        {enq.BrandName} {enq.ModelName}
                        {enq.VehicleNumber ? ` · ${enq.VehicleNumber}` : ""}
                      </span>
                      <span className="eq-meta-item">
                        <FaMapMarkerAlt />
                        {enq.City}
                      </span>
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
