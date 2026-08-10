import React, { useState, useEffect } from "react";
import { DownloadIcon, ShieldIcon } from "../Icons";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function FilePreviewModal({ file, session, onClose, onDownload }) {
  const [loading, setLoading] = useState(true);
  const [previewContent, setPreviewContent] = useState(null);
  const [fileType, setFileType] = useState("other");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!file) return;

    const ext = file.filename.split(".").pop().toLowerCase();

    if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) {
      setFileType("image");
    } else if (["txt", "md", "json", "js", "jsx", "ts", "tsx", "css", "html", "py", "c", "cpp", "java", "csv"].includes(ext)) {
      setFileType("text");
    } else if (ext === "pdf") {
      setFileType("pdf");
    } else {
      setFileType("other");
    }

    async function loadPreviewData() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_URL}/download/${file.id}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Could not decrypt file for preview");
        }

        const blob = await res.blob();
        if (["txt", "md", "json", "js", "jsx", "ts", "tsx", "css", "html", "py", "c", "cpp", "java", "csv"].includes(ext)) {
          const text = await blob.text();
          setPreviewContent(text.substring(0, 10000));
        } else if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) {
          const imageUrl = URL.createObjectURL(blob);
          setPreviewContent(imageUrl);
        } else if (ext === "pdf") {
          const pdfUrl = URL.createObjectURL(blob);
          setPreviewContent(pdfUrl);
        }
      } catch (err) {
        setError(err.message || "Failed to load file preview");
      } finally {
        setLoading(false);
      }
    }

    loadPreviewData();

    return () => {
      if (previewContent && typeof previewContent === "string" && previewContent.startsWith("blob:")) {
        URL.revokeObjectURL(previewContent);
      }
    };
  }, [file, session.access_token]);

  if (!file) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content file-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header flex-between">
          <div className="preview-title-wrap">
            <span className="modal-icon-badge">📄</span>
            <div>
              <h3>{file.filename}</h3>
              <span className="preview-subtitle">
                {formatBytes(file.size_bytes)} &bull; Encrypted AES-256 Fernet Stream
              </span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="preview-body">
          {loading ? (
            <div className="preview-loader-box">
              <div className="loader" />
              <p>Decrypting payload in-memory for secure preview…</p>
            </div>
          ) : error ? (
            <div className="preview-error-box">
              <p>⚠️ Preview Unavailable: {error}</p>
              <span className="preview-hint">You can still download the decrypted file directly.</span>
            </div>
          ) : fileType === "image" && previewContent ? (
            <div className="preview-image-wrap">
              <img src={previewContent} alt={file.filename} className="preview-img" />
            </div>
          ) : fileType === "text" && previewContent ? (
            <pre className="preview-code-block">
              <code>{previewContent}</code>
            </pre>
          ) : fileType === "pdf" && previewContent ? (
            <iframe src={previewContent} title="PDF Preview" className="preview-pdf-frame" />
          ) : (
            <div className="preview-unsupported-box">
              <span className="unsupported-icon">📦</span>
              <h4>Binary / Non-Text File Format</h4>
              <p>Direct preview is disabled for this file type. Click download below to view file.</p>
            </div>
          )}
        </div>

        <div className="modal-actions flex-between">
          <span className="security-notice">
            <ShieldIcon size={16} /> Decrypted temporarily in browser memory
          </span>
          <div className="action-buttons">
            <button className="btn-secondary" onClick={onClose}>
              Close Preview
            </button>
            <button className="btn-primary" onClick={() => onDownload(file)}>
              <DownloadIcon size={16} /> Download File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
