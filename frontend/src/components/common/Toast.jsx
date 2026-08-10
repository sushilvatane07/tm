import React from "react";
import "../../styles/dashboard.css";

export default function Toast({ message, type = "info", onClose }) {
  if (!message) return null;

  return (
    <div className={`dash-toast toast-${type}`}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="toast-close-btn">
          &times;
        </button>
      )}
    </div>
  );
}
