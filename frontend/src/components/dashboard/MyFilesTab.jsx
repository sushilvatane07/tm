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

function getFileEmoji(filename) {
  const cat = getFileCategory(filename);
  if (cat === "documents") return "📄";
  if (cat === "images") return "🖼️";
  if (cat === "code") return "💻";
  if (cat === "archives") return "📦";
  return "📁";
}

export default function MyFilesTab({
  files = [],
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
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'grid'
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

  function toggleSelectAll() {
    if (selectedIds.length === sortedFiles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedFiles.map((f) => f.id));
    }
  }

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
      {/* Upload Header Zone */}
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
          <span className="upload-icon"><UploadIcon size={28} /></span>
          <p className="upload-text">
            {uploading ? "Encrypting and uploading file…" : "Click or drop file here to encrypt & store"}
          </p>
          <span className="btn-primary btn-sm">
            {uploading ? "Encrypting…" : "Upload File"}
          </span>
        </label>
        {uploadError && <p className="upload-error-msg">{uploadError}</p>}
      </section>

      {/* Controls & Toolbar */}
      <section className="files-card">
        <div className="files-card-header flex-between">
          <h2>My Encrypted Files ({sortedFiles.length})</h2>
          <div className="files-controls flex-wrap">
            {/* View Mode Toggle */}
            <div className="view-mode-toggle">
              <button
                className={`view-btn ${viewMode === "table" ? "active" : ""}`}
                onClick={() => setViewMode("table")}
                title="Table View"
              >
                📋 List
              </button>
              <button
                className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Grid View"
              >
                🔲 Grid
              </button>
            </div>

            {/* Sort Select */}
            <select
              className="modal-select small sort-select"
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
              <SearchIcon size={16} className="search-icon" />
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

        {/* Category Pills */}
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

          {/* Batch Actions Toolbar */}
          {selectedIds.length > 0 && (
            <div className="batch-actions-toolbar">
              <span className="batch-count">{selectedIds.length} Selected</span>
              <button className="btn-action delete" onClick={handleBatchDelete}>
                <TrashIcon size={14} /> Delete Selected
              </button>
            </div>
          )}
        </div>

        {/* Content Display */}
        {sortedFiles.length === 0 ? (
          <div className="files-empty-box">
            <p className="files-empty">
              {searchQuery ? "No files match your search criteria." : "No files uploaded yet. Upload a file above to get started!"}
            </p>
          </div>
        ) : viewMode === "table" ? (
          /* Table View */
          <div className="files-table-wrap">
            <table className="files-table">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === sortedFiles.length && sortedFiles.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>File Name</th>
                  <th>Size</th>
                  <th>Uploaded Date</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedFiles.map((f) => (
                  <tr key={f.id} className={selectedIds.includes(f.id) ? "row-selected" : ""}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(f.id)}
                        onChange={() => toggleSelectFile(f.id)}
                      />
                    </td>
                    <td>
                      <div className="file-name-cell">
                        <span className="file-type-emoji">{getFileEmoji(f.filename)}</span>
                        <span className="file-name-text" title={f.filename}>{f.filename}</span>
                      </div>
                    </td>
                    <td><span className="size-badge">{formatBytes(f.size_bytes)}</span></td>
                    <td>{new Date(f.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: "right" }}>
                      <div className="action-buttons">
                        <button
                          className="btn-action preview"
                          title="Preview File"
                          onClick={() => onPreviewFile(f)}
                        >
                          <EyeIcon size={14} /> Preview
                        </button>
                        <button
                          className="btn-action download"
                          title="Download Decrypted File"
                          disabled={downloadingId === f.id}
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
                        <button
                          className="btn-action delete"
                          title="Delete File"
                          disabled={deletingId === f.id}
                          onClick={() => onDeleteFile(f)}
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid View */
          <div className="files-grid-wrap">
            {sortedFiles.map((f) => (
              <div key={f.id} className={`file-card-grid ${selectedIds.includes(f.id) ? "card-selected" : ""}`}>
                <div className="card-grid-header flex-between">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(f.id)}
                    onChange={() => toggleSelectFile(f.id)}
                  />
                  <span className="file-grid-emoji">{getFileEmoji(f.filename)}</span>
                </div>

                <div className="file-grid-body">
                  <h4 className="file-grid-name" title={f.filename}>{f.filename}</h4>
                  <div className="file-grid-meta flex-between">
                    <span className="size-badge">{formatBytes(f.size_bytes)}</span>
                    <span className="date-text">{new Date(f.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="file-grid-actions flex-between">
                  <button className="btn-action btn-sm" onClick={() => onPreviewFile(f)}>
                    <EyeIcon size={14} /> Preview
                  </button>
                  <button className="btn-action btn-sm download" onClick={() => onDownloadFile(f)}>
                    <DownloadIcon size={14} />
                  </button>
                  <button className="btn-action btn-sm share" onClick={() => onShareClick(f)}>
                    <LinkIcon size={14} />
                  </button>
                  <button className="btn-action btn-sm delete" onClick={() => onDeleteFile(f)}>
                    <TrashIcon size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
