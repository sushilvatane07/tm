import React, { useState } from "react";
import {
  LockIcon,
  FolderIcon,
  ShieldIcon,
  UploadIcon,
  LinkIcon,
  DownloadIcon,
  EyeIcon,
  TrashIcon,
} from "../Icons";

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0.00 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getActivityIcon(action = "") {
  const act = action.toLowerCase();
  if (act.includes("upload")) return { icon: <UploadIcon size={16} />, class: "icon-blue" };
  if (act.includes("share") || act.includes("link")) return { icon: <LinkIcon size={16} />, class: "icon-purple" };
  if (act.includes("download") || act.includes("read")) return { icon: <DownloadIcon size={16} />, class: "icon-green" };
  if (act.includes("delete") || act.includes("remove") || act.includes("revoke")) return { icon: <TrashIcon size={16} />, class: "icon-red" };
  return { icon: <UploadIcon size={16} />, class: "icon-blue" };
}

export default function OverviewTab({
  files = [],
  loadingFiles = false,
  shareLinks = [],
  activityLogs = [],
  totalStorageBytes = 0,
  onUploadFile,
  onShareClick,
  onPreviewFile,
  onDownloadFile,
  onTabChange,
  uploading,
  uploadError,
}) {
  const [showBanner, setShowBanner] = useState(true);

  // Dynamic Storage Calculation with 2-Decimal Precision
  const maxStorageBytes = 250 * 1024 * 1024; // 250 MB
  const actualBytes = files.reduce((acc, f) => acc + (f.size_bytes || 0), 0);
  const effectiveTotalBytes = totalStorageBytes > 0 ? totalStorageBytes : actualBytes;
  
  const rawPercent = (effectiveTotalBytes / maxStorageBytes) * 100;
  const usedPercent = parseFloat(Math.min(100, rawPercent).toFixed(2));
  const freeBytes = Math.max(0, maxStorageBytes - effectiveTotalBytes);
  const freePercent = parseFloat(Math.max(0, 100 - usedPercent).toFixed(2));

  const displayTotal = formatBytes(effectiveTotalBytes);
  const displayFree = formatBytes(freeBytes);

  return (
    <div className="overview-tab apple-share-layout">
      {/* Welcome Top Banner Header */}
      <div className="dash-welcome-row flex-between">
        <div>
          <h1 className="welcome-heading">Welcome back 👋</h1>
          <p className="welcome-subheading">Securely store and share encrypted files with anyone.</p>
        </div>
        <label className="ts-btn ts-btn-primary upload-btn-main">
          <input
            type="file"
            hidden
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadFile(file);
              e.target.value = "";
            }}
          />
          <UploadIcon size={18} />
          <span>{uploading ? "Uploading…" : "Upload Files"}</span>
        </label>
      </div>

      {/* Top 3 Cards Row */}
      <section className="top-cards-grid">
        {/* Card 1: Private. Secure. Trusted. */}
        <div className="top-card banner-blue-card">
          <div className="banner-card-body">
            <div className="banner-shield-icon">
              <ShieldIcon size={24} color="#FFFFFF" />
            </div>
            <div className="banner-content">
              <h3>Private. Secure. Trusted.</h3>
              <p>
                End-to-end encryption keeps your files safe and private. No tracking, zero knowledge.
              </p>
              <button className="card-link-blue" onClick={() => onTabChange("settings")}>
                Learn more about security &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Create Secure Link */}
        <div className="top-card create-link-card">
          <div className="create-link-icon-circle">
            <LinkIcon size={20} color="#0066CC" />
          </div>
          <h3>Create Secure Link</h3>
          <p>Share files via temporary expiring links with custom download limits.</p>
          <button className="btn-action btn-create-link" onClick={() => onTabChange("files")}>
            <LinkIcon size={14} /> Create Link
          </button>
        </div>

        {/* Card 3: Storage Overview */}
        <div className="top-card storage-overview-card">
          <div className="card-top-row flex-between" style={{ marginBottom: '12px' }}>
            <h3>Storage Overview</h3>
          </div>

          <div className="storage-bar-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="flex-between flex-wrap" style={{ fontSize: '0.84rem', color: 'var(--text-hi)', fontWeight: 600, gap: '6px' }}>
              <span>Occupied: <strong style={{ color: 'var(--primary-cyan)' }}>{displayTotal}</strong> ({usedPercent}%)</span>
              <span>Free: <strong style={{ color: 'var(--primary-emerald)' }}>{displayFree}</strong> ({freePercent}%)</span>
            </div>

            <div className="quota-bar" style={{ width: '100%', height: '10px', background: 'var(--bg-dark)', borderRadius: '100px', overflow: 'hidden', border: '1px solid var(--panel-border)' }}>
              <div
                className="quota-fill"
                style={{
                  width: `${Math.max(usedPercent > 0 ? 2 : 0, usedPercent)}%`,
                  height: '100%',
                  borderRadius: '100px',
                  background: usedPercent > 90 ? 'var(--danger)' : usedPercent > 75 ? 'var(--primary-amber)' : 'linear-gradient(90deg, #0066CC 0%, #38bdf8 100%)',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>

            <div className="flex-between" style={{ fontSize: '0.78rem', color: 'var(--text-lo)', marginTop: '2px' }}>
              <span>Total Capacity: <strong>250.00 MB</strong></span>
              <span>Usage: <strong>{usedPercent}%</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* Main 2-Column Section (Recent Files + Activity Feed) */}
      <div className="main-content-grid">
        {/* Left Column: Recent Files Section */}
        <section className="files-card recent-files-section">
          <div className="files-card-header flex-between">
            <h2>Recent Files</h2>
            <button className="card-manage-link" onClick={() => onTabChange("files")}>
              View All &rarr;
            </button>
          </div>

          {loadingFiles ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px 0' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-box" style={{ width: '100%', height: '56px', borderRadius: '12px' }} />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-lo)', fontSize: '0.9rem' }}>
              No encrypted files uploaded yet. Upload a file above!
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW (> 768px) */}
              <div className="table-responsive recent-files-desktop-table">
                <table className="files-table">
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Size</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.slice(0, 5).map((f) => {
                      return (
                        <tr key={f.id}>
                          <td className="filename-td">
                            <span className="file-name-text" title={f.filename} style={{ fontWeight: 600 }}>
                              {f.filename}
                            </span>
                          </td>
                          <td>
                            <div className="owner-cell flex-center" style={{ justifyContent: 'flex-start' }}>
                              <span className="owner-avatar">✓</span>
                              <span className="owner-name" style={{ fontSize: '0.8rem', color: 'var(--text-lo)' }}>Encrypted</span>
                            </div>
                          </td>
                          <td className="time-td">
                            {f.created_at ? new Date(f.created_at).toLocaleDateString() : "Today"}
                          </td>
                          <td className="size-td">{formatBytes(f.size_bytes)}</td>
                          <td style={{ textAlign: "right" }}>
                            <div className="action-buttons" style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button
                                className="btn-action preview"
                                onClick={() => onPreviewFile(f)}
                                title="Preview File"
                                style={{ width: '36px', height: '34px', minWidth: '36px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <EyeIcon size={15} />
                              </button>
                              <button
                                className="btn-action download"
                                onClick={() => onDownloadFile(f)}
                                title="Download File"
                                style={{ width: '36px', height: '34px', minWidth: '36px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <DownloadIcon size={15} />
                              </button>
                              <button
                                className="btn-action share"
                                onClick={() => onShareClick(f)}
                                title="Share Link"
                                style={{ width: '36px', height: '34px', minWidth: '36px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <LinkIcon size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARD VIEW (<= 768px) */}
              <div className="recent-files-mobile-list">
                {files.slice(0, 5).map((f) => {
                  return (
                    <div
                      key={f.id}
                      style={{
                        background: 'var(--bg-dark)',
                        border: '1px solid var(--panel-border)',
                        borderRadius: '14px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      {/* Top Header */}
                      <div className="flex-between" style={{ alignItems: 'flex-start', gap: '10px' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-hi)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {f.filename}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--primary-emerald)', background: 'rgba(52, 199, 89, 0.12)', padding: '2px 8px', borderRadius: '100px', border: '1px solid rgba(52, 199, 89, 0.25)', flexShrink: 0 }}>
                          ✓ Encrypted
                        </span>
                      </div>

                      {/* Meta Details */}
                      <div className="flex-between" style={{ fontSize: '0.78rem', color: 'var(--text-lo)' }}>
                        <span>Size: <strong>{formatBytes(f.size_bytes)}</strong></span>
                        <span>Date: <strong>{f.created_at ? new Date(f.created_at).toLocaleDateString() : "Today"}</strong></span>
                      </div>

                      {/* Mobile Icon-Only Actions Bar */}
                      <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--panel-border)', marginTop: '2px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn-action preview"
                          onClick={() => onPreviewFile(f)}
                          title="Preview File"
                          style={{ width: '40px', height: '34px', minWidth: '40px', padding: 0, justifyContent: 'center' }}
                        >
                          <EyeIcon size={15} />
                        </button>
                        <button
                          className="btn-action download"
                          onClick={() => onDownloadFile(f)}
                          title="Download File"
                          style={{ width: '40px', height: '34px', minWidth: '40px', padding: 0, justifyContent: 'center' }}
                        >
                          <DownloadIcon size={15} />
                        </button>
                        <button
                          className="btn-action share"
                          onClick={() => onShareClick(f)}
                          title="Share Link"
                          style={{ width: '40px', height: '34px', minWidth: '40px', padding: 0, justifyContent: 'center' }}
                        >
                          <LinkIcon size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* Right Column: Recent 5 Activity Feed */}
        <section className="files-card activity-feed-section">
          <div className="files-card-header flex-between">
            <h2>Recent Activity</h2>
            <button className="card-manage-link" onClick={() => onTabChange("activity")}>
              View All &rarr;
            </button>
          </div>

          <div className="activity-timeline-list">
            {loadingFiles ? (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="act-item flex-center" style={{ gap: '12px', padding: '10px 0' }}>
                  <div className="skeleton-box" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="skeleton-box" style={{ width: '70%', height: '14px' }} />
                    <div className="skeleton-box" style={{ width: '40%', height: '12px' }} />
                  </div>
                </div>
              ))
            ) : activityLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-lo)', fontSize: '0.88rem' }}>
                No security activity recorded yet.
              </div>
            ) : (
              activityLogs.slice(0, 5).map((log) => {
                const iconInfo = getActivityIcon(log.action || "");
                const formattedTime = log.created_at
                  ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : "Just now";

                return (
                  <div key={log.id || log.created_at} className="act-item">
                    <div className={`act-icon-wrap ${iconInfo.class}`}>
                      {iconInfo.icon}
                    </div>
                    <div className="act-content">
                      <p title={log.action}>{log.action}</p>
                      <span className="act-time">{formattedTime}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Page Footer */}
      <footer className="dash-page-footer flex-between">
        <div className="footer-left flex-center" style={{ gap: '8px' }}>
          <LockIcon size={14} color="var(--text-lo)" />
          <span>Trustme &bull; End-to-end encrypted file vault</span>
        </div>
        <div className="footer-right-links">
          <span>Privacy</span>
          <span>&bull;</span>
          <span>Terms</span>
          <span>&bull;</span>
          <span>Support</span>
        </div>
      </footer>
    </div>
  );
}
