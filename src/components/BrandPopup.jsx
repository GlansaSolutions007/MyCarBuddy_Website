import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import "./BrandPopup.css";

const BrandPopup = ({ brands, selected, onSelect, onClose, loading }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="brand-popup-overlay" onClick={onClose}>
      <div
        className="brand-popup-box animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="brand-popup-close" onClick={onClose}>
          <FaTimes />
        </button>
        <h5 className="popup-title mb-3">Choose Your Brand</h5>
        <input
          type="text"
          placeholder="Search brands..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className=" mb-3 brand-search"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="brand-scroll-container">
          <div className="row d-flex justify-content-center">
            {filteredBrands.map((b) => (
              <div key={b.id} className="col-6 col-sm-3 col-md-2 mb-3">
                <div
                  className={`card brand-card ${
                    selected === b.id ? "selected" : ""
                  }`}
                  onClick={() => onSelect(b.id)}
                >
                  <img
                    src={b.logo}
                    alt={b.name}
                    className="brand-logo p-3"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandPopup;
