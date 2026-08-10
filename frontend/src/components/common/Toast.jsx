import React from "react";
import "../../styles/dashboard.css";

export default function Toast({ message, type = "info", onClose }) {
  if (!message) return null;

  const iconMap = {
    success: "✓",
    warn: "⚠️",
    error: "✕",
    info: "ℹ",
  };

  return (
    <div className={`dash-toast toast-${type}`}>
      <span className="toast-icon-badge">{iconMap[type] || "ℹ"}</span>
      <span className="toast-msg-text">{message}</span>
      {onClose && (
        <button onClick={onClose} className="toast-close-btn" aria-label="Close Toast">
          &times;
        </button>
      )}
    </div>
  );
}
