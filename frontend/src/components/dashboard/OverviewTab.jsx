import React, { useState } from "react";
import {
  LockIcon,
  FolderIcon,
  ShieldIcon,
  UploadIcon,
  LinkIcon,
  DownloadIcon,
  EyeIcon,
} from "../Icons";

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getFileCategory(filename) {
  if (!filename) return "other";
  const ext = filename.split(".").pop().toLowerCase();
  if (["pdf", "doc", "docx", "txt", "rtf", "md", "csv", "xlsx", "pptx"].includes(ext)) return "documents";
  if (["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"].includes(ext)) return "images";
  if (["js", "jsx", "ts", "tsx", "py", "html", "css", "json", "c", "cpp", "java"].includes(ext)) return "code";
  if (["zip", "tar", "gz", "7z", "rar"].includes(ext)) return "archives";
  return "other";
}

export default function OverviewTab({
  files = [],
  shareLinks = [],
  totalStorageBytes = 0,
  onUploadFile,
  onShareClick,
  onPreviewFile,
  onDownloadFile,
  onTabChange,
  uploading,
  uploadError,
}) {
  const [dragOver, setDragOver] = useState(false);

  // Calculate storage distribution by category
  const categories = {
    documents: { label: "Documents", bytes: 0, color: "#6366f1" },
    images: { label: "Images & Media", bytes: 0, color: "#10b981" },
    code: { label: "Code & Text", bytes: 0, color: "#f59e0b" },
    archives: { label: "Archives", bytes: 0, color: "#ec4899" },
    other: { label: "Other Files", bytes: 0, color: "#8b5cf6" },
  };

  files.forEach((file) => {
    const cat = getFileCategory(file.filename);
    if (categories[cat]) {
      categories[cat].bytes += file.size_bytes || 0;
    } else {
      categories.other.bytes += file.size_bytes || 0;
    }
  });

  const recentFiles = files.slice(0, 5);

  return (
    <div className="overview-tab">
      {/* Top Metrics Cards */}
      <section className="dash-stats">
        <div className="stat-card">
          <span className="stat-icon"><LockIcon size={24} /></span>
          <div className="stat-value">{files.length}</div>
          <div className="stat-label">Files Stored</div>
        </div>

        <div className="stat-card">
          <span className="stat-icon"><FolderIcon size={24} /></span>
          <div className="stat-value">{formatBytes(totalStorageBytes)}</div>
          <div className="stat-label">Encrypted Storage Used</div>
        </div>

        <div className="stat-card">
          <span className="stat-icon"><LinkIcon size={24} /></span>
          <div className="stat-value">{shareLinks.length}</div>
          <div className="stat-label">Active Share Links</div>
        </div>

        <div className="stat-card">
          <span className="stat-icon"><ShieldIcon size={24} /></span>
          <div className="stat-value">AES-256</div>
          <div className="stat-label">Server-Side Encryption</div>
        </div>
      </section>

      {/* Quick Drag & Drop Upload Zone */}
      <section className="upload-card">
        <label
          className={`upload-zone ${uploading ? "uploading" : ""} ${dragOver ? "drag-over" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) onUploadFile(dropped);
          }}
        >
          <input
            type="file"
            hidden
            disabled={uploading}
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) onUploadFile(selected);
              e.target.value = "";
            }}
          />
          <span className="upload-icon"><UploadIcon size={36} /></span>
          <p className="upload-text">
            {uploading ? "Encrypting and uploading file…" : "Drag & drop your file here, or click to browse"}
          </p>
          <span className="btn-primary">
            {uploading ? "Encrypting…" : "Upload & Encrypt File"}
          </span>
        </label>
        {uploadError && <p className="upload-error-msg">{uploadError}</p>}
      </section>

      {/* Storage Category Analytics Breakdown */}
      <section className="files-card category-breakdown-card">
        <div className="files-card-header flex-between">
          <h2>Storage Breakdown by Category</h2>
          <span className="meta-pill">{formatBytes(totalStorageBytes)} Total</span>
        </div>

        <div className="category-progress-multi">
          {Object.entries(categories).map(([key, cat]) => {
            const pct = totalStorageBytes > 0 ? (cat.bytes / totalStorageBytes) * 100 : 0;
            if (pct <= 0) return null;
            return (
              <div
                key={key}
                className="progress-segment"
                style={{ width: `${pct}%`, backgroundColor: cat.color }}
                title={`${cat.label}: ${formatBytes(cat.bytes)} (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>

        <div className="category-legend-grid">
          {Object.entries(categories).map(([key, cat]) => {
            const pct = totalStorageBytes > 0 ? ((cat.bytes / totalStorageBytes) * 100).toFixed(1) : "0.0";
            return (
              <div key={key} className="legend-item flex-between">
                <div className="legend-label-wrap">
                  <span className="legend-color-dot" style={{ backgroundColor: cat.color }} />
                  <span>{cat.label}</span>
                </div>
                <div className="legend-values">
                  <strong>{formatBytes(cat.bytes)}</strong>
                  <span className="legend-pct">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Files Quick Action Table */}
      <section className="files-card">
        <div className="files-card-header flex-between">
          <h2>Recent Uploads</h2>
          <button className="btn-outline btn-sm" onClick={() => onTabChange("files")}>
            View All Files ({files.length})
          </button>
        </div>

        {recentFiles.length === 0 ? (
          <div className="files-empty-box">
            <p className="files-empty">No files uploaded yet. Drag & drop a file above to get started!</p>
          </div>
        ) : (
          <div className="files-table-wrap">
            <table className="files-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Size</th>
                  <th>Uploaded Date</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentFiles.map((f) => (
                  <tr key={f.id}>
                    <td><strong>{f.filename}</strong></td>
                    <td><span className="size-badge">{formatBytes(f.size_bytes)}</span></td>
                    <td>{new Date(f.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: "right" }}>
                      <div className="action-buttons">
                        <button
                          className="btn-action download"
                          title="Preview File"
                          onClick={() => onPreviewFile(f)}
                        >
                          <EyeIcon size={14} /> Preview
                        </button>
                        <button
                          className="btn-action download"
                          title="Download Decrypted File"
                          onClick={() => onDownloadFile(f)}
                        >
                          <DownloadIcon size={14} /> Download
                        </button>
                        <button
                          className="btn-action share"
                          title="Create Share Link"
                          onClick={() => onShareClick(f)}
                        >
                          <LinkIcon size={14} /> Share
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
