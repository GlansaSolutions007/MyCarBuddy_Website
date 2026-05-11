import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import "./TicketDrawer.css";

const TicketDrawer = ({ onClose, title = "Raise a Ticket", children }) => {
  const drawerRef = useRef(null);

  /* Lock body scroll while open */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* Close on Escape key */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* Close when clicking the backdrop (but not the drawer itself) */
  const handleBackdropClick = (e) => {
    if (drawerRef.current && !drawerRef.current.contains(e.target)) {
      onClose();
    }
  };

  return ReactDOM.createPortal(
    <div className="td-overlay" onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className="td-drawer" ref={drawerRef}>
        {/* Drag handle – visible on mobile only */}
        <div className="td-handle" />

        {/* Header */}
        <div className="td-header">
          <div className="td-header-left">
            <span className="td-header-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                <path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
              </svg>
            </span>
            <span className="td-header-title">{title}</span>
          </div>
          <button
            className="td-close-btn"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable content – NewTicket mounts here */}
        <div className="td-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TicketDrawer;
