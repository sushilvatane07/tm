import React, { useState } from "react";
import {
  SearchIcon,
  DownloadIcon,
  LinkIcon,
  TrashIcon,
  EyeIcon,
  UploadIcon,
} from "../Icons";

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0.00 Bytes";
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

function getFileExtensionBadge(filename) {
  if (!filename) return { label: "FILE", color: "badge-blue" };
  const ext = filename.split(".").pop().toUpperCase();
  if (["PDF"].includes(ext)) return { label: "PDF", color: "badge-red" };
  if (["ZIP", "RAR", "7Z", "TAR", "GZ"].includes(ext)) return { label: "ZIP", color: "badge-purple" };
  if (["JPG", "JPEG", "PNG", "GIF", "WEBP", "SVG"].includes(ext)) return { label: "IMG", color: "badge-green" };
  if (["DOC", "DOCX", "TXT", "RTF", "MD"].includes(ext)) return { label: "DOCX", color: "badge-blue" };
  return { label: ext.substring(0, 4), color: "badge-gray" };
}

export default function MyFilesTab({
  files = [],
  loadingFiles = false,
  onUploadFile,
  onShareClick,
  onPreviewFile,
  onDownloadFile,
  onDeleteFile,
  onBatchDeleteFiles,
  uploading,
  uploadError,
  downloadingId,
  deletingId,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [selectedIds, setSelectedIds] = useState([]);

  // Filtering
  const filteredFiles = files.filter((f) => {
    const fn = (f.filename || "").toLowerCase();
    const matchesSearch = fn.includes(searchQuery.toLowerCase());
    if (filterCategory === "all") return matchesSearch;
    return matchesSearch && getFileCategory(f.filename) === filterCategory;
  });

  // Sorting
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortBy === "date-desc") return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === "date-asc") return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy === "size-desc") return (b.size_bytes || 0) - (a.size_bytes || 0);
    if (sortBy === "size-asc") return (a.size_bytes || 0) - (b.size_bytes || 0);
    if (sortBy === "name-asc") return a.filename.localeCompare(b.filename);
    return 0;
  });

  function toggleSelectFile(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function handleBatchDelete() {
    if (selectedIds.length === 0) return;
    onBatchDeleteFiles(selectedIds);
    setSelectedIds([]);
  }

  return (
    <div className="my-files-tab">
      {/* Upload Header Drag & Drop Zone */}
      <section className="upload-card">
        <label className={`upload-zone ${uploading ? "uploading" : ""}`}>
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
          <div className="upload-icon">
            <UploadIcon size={32} />
          </div>
          <p className="upload-text">
            {uploading ? "Encrypting and uploading file to vault…" : "Click or drop files here to encrypt & store"}
          </p>
          <span className="ts-btn ts-btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
            {uploading ? "Encrypting…" : "Upload File"}
          </span>
        </label>
        {uploadError && <p className="upload-error-msg">{uploadError}</p>}
      </section>

      {/* Controls & Toolbar Card */}
      <section className="files-card">
        <div className="files-card-header flex-between flex-wrap" style={{ gap: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-hi)', margin: 0 }}>
            My Encrypted Files ({loadingFiles ? "…" : sortedFiles.length})
          </h2>

          <div className="files-controls" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Sort Select */}
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="size-desc">Largest Size</option>
              <option value="size-asc">Smallest Size</option>
              <option value="name-asc">Name (A-Z)</option>
            </select>

            {/* Search Box */}
            <div className="search-wrap">
              <SearchIcon size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Search files…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        </div>

        {/* Category Pills & Batch Actions */}
        <div className="category-pills flex-between">
          <div className="pills-group">
            {["all", "documents", "images", "code", "archives"].map((cat) => (
              <button
                key={cat}
                className={`pill-btn ${filterCategory === cat ? "active" : ""}`}
                onClick={() => setFilterCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Batch Delete Toolbar */}
          {selectedIds.length > 0 && (
            <div className="batch-actions-toolbar">
              <span className="batch-count">{selectedIds.length} Selected</span>
              <button className="btn-action delete" onClick={handleBatchDelete}>
                <TrashIcon size={14} /> Delete Selected
              </button>
            </div>
          )}
        </div>

        {/* Content Display - GRID SKELETON LOADING & DATA VIEW */}
        {loadingFiles ? (
          <div className="files-grid-wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '16px', paddingTop: '12px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  background: 'var(--panel-solid)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: '16px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  minHeight: '160px'
                }}
              >
                <div className="flex-between">
                  <div className="skeleton-box" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
                  <div className="skeleton-box" style={{ width: '48px', height: '20px', borderRadius: '100px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="skeleton-box" style={{ width: '80%', height: '18px' }} />
                  <div className="skeleton-box" style={{ width: '40%', height: '14px' }} />
                </div>
                <div className="flex-between" style={{ marginTop: 'auto', paddingTop: '10px' }}>
                  <div className="skeleton-box" style={{ width: '100%', height: '32px', borderRadius: '8px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : sortedFiles.length === 0 ? (
          <div className="files-empty-box" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-lo)' }}>
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>
              {searchQuery ? "No files match your search criteria." : "No encrypted files uploaded yet. Upload a file above to get started!"}
            </p>
          </div>
        ) : (
          <div className="files-grid-wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '16px', paddingTop: '12px' }}>
            {sortedFiles.map((f) => {
              const badge = getFileExtensionBadge(f.filename);
              const isSelected = selectedIds.includes(f.id);

              return (
                <div
                  key={f.id}
                  className={`file-card-grid ${isSelected ? "card-selected" : ""}`}
                  style={{
                    background: 'var(--panel-solid)',
                    border: isSelected ? '1px solid var(--primary-cyan)' : '1px solid var(--panel-border)',
                    borderRadius: '16px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    boxShadow: 'var(--shadow-subtle)'
                  }}
                >
                  {/* Top Header: Checkbox + Badge */}
                  <div className="flex-between" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectFile(f.id)}
                      style={{ cursor: 'pointer', accentColor: 'var(--primary-cyan)' }}
                    />
                    <span className={`file-ext-badge ${badge.color}`}>{badge.label}</span>
                  </div>

                  {/* Body: Title & Meta */}
                  <div>
                    <h4 className="file-grid-name" title={f.filename} style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-hi)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.filename}
                    </h4>
                    <span className="file-subtext" style={{ fontSize: '0.75rem', color: 'var(--text-lo)', display: 'block', marginBottom: '8px' }}>
                      AES-256 Encrypted
                    </span>
                    <div className="file-grid-meta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-lo)' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-hi)' }}>{formatBytes(f.size_bytes)}</span>
                      <span>{f.created_at ? new Date(f.created_at).toLocaleDateString() : "Today"}</span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="file-grid-actions" style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--panel-border)', flexWrap: 'wrap' }}>
                    <button
                      className="btn-action preview"
                      title="Preview File"
                      onClick={() => onPreviewFile(f)}
                      style={{ flex: 1, minWidth: '100px', justifyContent: 'center' }}
                    >
                      <EyeIcon size={14} />
                    </button>
                    <button
                      className="btn-action download"
                      title="Download Decrypted File"
                      disabled={downloadingId === f.id}
                      onClick={() => onDownloadFile(f)}
                      style={{ flex: 1, minWidth: '36px', justifyContent: 'center' }}
                    >
                      <DownloadIcon size={14} />
                    </button>
                    <button
                      className="btn-action share"
                      title="Create Share Link"
                      onClick={() => onShareClick(f)}
                      style={{ flex: 1, minWidth: '36px', justifyContent: 'center' }}
                    >
                      <LinkIcon size={14} />
                    </button>
                    <button
                      className="btn-action delete"
                      title="Delete File"
                      disabled={deletingId === f.id}
                      onClick={() => onDeleteFile(f)}
                      style={{ flex: 1, minWidth: '36px', justifyContent: 'center' }}
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
