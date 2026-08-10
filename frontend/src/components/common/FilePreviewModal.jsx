import React, { useState, useEffect } from "react";
import { DownloadIcon, ShieldIcon } from "../Icons";
import { supabase } from "../../lib/SupabaseClient";
import { fetchWithTimeout } from "../../lib/apiClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0.00 Bytes";
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

    const filename = file.filename || "";
    const ext = filename.includes(".") ? filename.split(".").pop().toLowerCase() : "";

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

      let fetchedBlob = null;

      // 1. Direct Supabase Storage Download (High speed < 150ms)
      if (file.storage_path) {
        try {
          const { data: blobData, error: dlErr } = await supabase.storage
            .from("trustshare-files")
            .download(file.storage_path);
          if (!dlErr && blobData) {
            fetchedBlob = blobData;
          }
        } catch (e) {
          console.warn("Supabase storage preview error:", e);
        }
      }

      // 2. Backup: Try FastAPI download endpoint if storage path is unavailable
      if (!fetchedBlob && session?.access_token) {
        try {
          const res = await fetchWithTimeout(`${API_URL}/download/${file.id}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }, 1500);
          if (res?.ok) {
            fetchedBlob = await res.blob();
          }
        } catch (e) {
          console.warn("FastAPI preview fallback notice:", e);
        }
      }

      if (!fetchedBlob) {
        setError("Could not retrieve file payload for preview.");
        setLoading(false);
        return;
      }

      try {
        if (["txt", "md", "json", "js", "jsx", "ts", "tsx", "css", "html", "py", "c", "cpp", "java", "csv"].includes(ext)) {
          const text = await fetchedBlob.text();
          setPreviewContent(text.substring(0, 10000));
        } else if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) {
          const imageUrl = URL.createObjectURL(fetchedBlob);
          setPreviewContent(imageUrl);
        } else if (ext === "pdf") {
          const pdfUrl = URL.createObjectURL(fetchedBlob);
          setPreviewContent(pdfUrl);
        } else {
          setPreviewContent(null);
        }
      } catch (err) {
        setError(`Failed to parse preview: ${err.message}`);
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
  }, [file]);

  if (!file) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content preview-modal-styled"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '720px', width: '90%' }}
      >
        {/* Header */}
        <div className="modal-header flex-between">
          <div className="modal-title-box">
            <span className="modal-icon-badge">
              <ShieldIcon size={20} />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Encrypted File Preview</h3>
              <p className="modal-subtitle" style={{ margin: 0 }}>
                <strong>{file.filename}</strong> ({formatBytes(file.size_bytes)})
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Modal Body */}
        <div className="preview-modal-body" style={{ padding: '20px 0', minHeight: '280px', maxHeight: '60vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div className="skeleton-box" style={{ width: '80%', height: '180px', margin: '0 auto 16px', borderRadius: '12px' }} />
              <p style={{ color: 'var(--text-lo)', margin: 0, fontSize: '0.9rem' }}>Decrypting preview payload…</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--danger)' }}>
              <p style={{ margin: '0 0 16px', fontSize: '0.95rem' }}>{error}</p>
            </div>
          ) : fileType === "image" && previewContent ? (
            <div style={{ textAlign: 'center' }}>
              <img
                src={previewContent}
                alt="File Preview"
                style={{ maxWidth: '100%', maxHeight: '50vh', borderRadius: '12px', border: '1px solid var(--panel-border)', objectFit: 'contain' }}
              />
            </div>
          ) : fileType === "text" && previewContent !== null ? (
            <pre style={{ background: 'var(--bg-dark)', padding: '16px', borderRadius: '12px', border: '1px solid var(--panel-border)', color: 'var(--text-hi)', fontSize: '0.85rem', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '45vh' }}>
              <code>{previewContent}</code>
            </pre>
          ) : fileType === "pdf" && previewContent ? (
            <iframe
              src={previewContent}
              title="PDF Preview"
              style={{ width: '100%', height: '50vh', border: 'none', borderRadius: '12px' }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-lo)' }}>
              <p style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 600, color: 'var(--text-hi)' }}>
                Direct preview unavailable for binary files
              </p>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>
                Click below to download and open this file safely on your computer.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="modal-actions flex-between" style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '16px', marginTop: '10px' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              if (onDownload) onDownload(file);
              onClose();
            }}
          >
            <DownloadIcon size={16} /> Download Decrypted File
          </button>
        </div>
      </div>
    </div>
  );
}
