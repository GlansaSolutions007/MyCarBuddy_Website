import React from "react";

const InspectionModal = ({ isOpen, onYes, onNo, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: "15px",
        animation: "fadeIn 0.3s ease-in-out",
      }}
    >
      <style>
        {`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `}
      </style>
      <div
        style={{
          background: "#ffffff",
          padding: "25px",
          width: "100%",
          maxWidth: "400px",
          borderRadius: "20px",
          boxShadow: "0px 10px 40px rgba(0,0,0,0.2)",
          animation: "slideUp 0.3s ease-out",
          textAlign: "center",
        }}
      >
        <h5 style={{ color: "#0a6264", fontWeight: 800, fontSize: "20px", marginBottom: "20px" }}>
          Inspection required?
        </h5>
        <p style={{ fontSize: "16px", color: "#374151", marginBottom: "30px" }}>
          Inspection charges: ₹499
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button
            onClick={onYes}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              background: "#0a6264",
              color: "#fff",
              fontWeight: "bold",
            }}
          >
            YES
          </button>
          <button
            onClick={onNo}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              background: "#fff",
              color: "#374151",
              fontWeight: "bold",
            }}
          >
            NO
          </button>
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: "20px",
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            background: "#fff",
            color: "#6b7280",
            fontSize: "12px",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default InspectionModal;
