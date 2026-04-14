// src/components/ModelPopup.js
import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import "./BrandPopup.css"; 

const ModelPopup = ({ models, selected, onSelect, onClose, loading }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredModels = models.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="brand-popup-overlay" onClick={onClose}>
      <div className="brand-popup-box animate-in" onClick={(e) => e.stopPropagation()}>
        <button className="brand-popup-close" onClick={onClose}>
          <FaTimes />
        </button>
        <h5 className="popup-title mb-3">Choose Your Model</h5>
        <input
          type="text"
          placeholder="Search models..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="brand-search mb-3"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="brand-scroll-container">
          <div className="row d-flex justify-content-center">
            {loading ? (
              // Show skeleton loaders
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="col-6 col-sm-4 col-md-2 mb-3">
                  <div className="card brand-card">
                    <div
                      className="skeleton-loader"
                      style={{
                        width: "100%",
                        height: 80,
                        backgroundColor: "#e0e0e0",
                        borderRadius: "4px",
                        animation: "pulse 1.5s ease-in-out infinite",
                      }}
                    ></div>
                    <div className="card-body text-center p-2">
                      <div
                        className="skeleton-loader"
                        style={{
                          width: "60%",
                          height: 16,
                          backgroundColor: "#e0e0e0",
                          borderRadius: "4px",
                          animation: "pulse 1.5s ease-in-out infinite",
                          margin: "0 auto",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              filteredModels.map((m) => (
                <div key={m.id} className="col-6 col-sm-4 col-md-2 mb-3">
                  <div
                    className={`card brand-card ${selected === m.name ? "selected" : ""}`}
                    onClick={() => onSelect(m.id)}
                  >
                    <img
                      src={m.logo}
                      alt={m.name}
                      loading="lazy"
                      className="brand-logo p-3"
                    />
                    <div className="card-body text-center p-2">
                      <h6 className="card-title mb-0">{m.name}</h6>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelPopup;
