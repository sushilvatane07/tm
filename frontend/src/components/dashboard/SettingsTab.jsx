import React, { useState } from "react";
import { CheckIcon } from "../Icons";

export default function SettingsTab({ user, showToast }) {
  const [defaultExpiration, setDefaultExpiration] = useState("24");
  const [autoRevokeExpired, setAutoRevokeExpired] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  function handleSaveSettings(e) {
    e.preventDefault();
    localStorage.setItem("ts_default_expiration", defaultExpiration);
    localStorage.setItem("ts_auto_revoke", autoRevokeExpired);
    showToast("Security settings saved successfully!", "success");
  }

  function handleClearCache() {
    localStorage.removeItem("ts_theme");
    showToast("Client cache cleared.", "info");
  }

  return (
    <div className="settings-tab grid-gap-24">
      <section className="files-card">
        <div className="files-card-header">
          <h2>Security & Cryptography Configuration</h2>
        </div>
        <form onSubmit={handleSaveSettings} className="settings-list">
          <div className="setting-item flex-between">
            <div>
              <strong>AES-256 Fernet Encryption</strong>
              <p className="setting-desc">Server-side Fernet key isolation applied per file payload before storage.</p>
            </div>
            <span className="status-badge active">Enforced</span>
          </div>

          <div className="setting-item flex-between">
            <div>
              <strong>JWT Token Verification</strong>
              <p className="setting-desc">Validates Bearer token headers for every backend endpoint request.</p>
            </div>
            <span className="status-badge active">Enforced</span>
          </div>

          <div className="setting-item flex-between">
            <div>
              <strong>Default Share Link Expiration</strong>
              <p className="setting-desc">Default validity timer preset when generating new share links.</p>
            </div>
            <select
              className="modal-select small"
              value={defaultExpiration}
              onChange={(e) => setDefaultExpiration(e.target.value)}
            >
              <option value="1">1 Hour</option>
              <option value="24">24 Hours (1 Day)</option>
              <option value="168">7 Days</option>
              <option value="never">Never (Manual Revoke)</option>
            </select>
          </div>

          <div className="setting-item flex-between">
            <div>
              <strong>Auto-Purge Expired Links</strong>
              <p className="setting-desc">Automatically block download requests as soon as expiry timestamp passes.</p>
            </div>
            <input
              type="checkbox"
              checked={autoRevokeExpired}
              onChange={(e) => setAutoRevokeExpired(e.target.checked)}
            />
          </div>

          <div className="form-actions" style={{ marginTop: "16px" }}>
            <button type="submit" className="btn-primary btn-sm">
              <CheckIcon size={16} /> Save Security Settings
            </button>
          </div>
        </form>
      </section>

      <section className="files-card">
        <div className="files-card-header">
          <h2>Active Session Details</h2>
        </div>
        <div className="user-meta-grid">
          <div className="user-meta-card">
            <span className="meta-label">User ID</span>
            <code className="meta-code">{user.id}</code>
          </div>
          <div className="user-meta-card">
            <span className="meta-label">Authenticated Email</span>
            <strong>{user.email}</strong>
          </div>
          <div className="user-meta-card">
            <span className="meta-label">Provider</span>
            <strong>Supabase Auth</strong>
          </div>
          <div className="user-meta-card">
            <span className="meta-label">Storage Engine</span>
            <strong>Supabase S3 Object Storage</strong>
          </div>
        </div>
        <div style={{ marginTop: "16px" }}>
          <button className="btn-outline btn-sm" onClick={handleClearCache}>
            Clear Local Browser Cache
          </button>
        </div>
      </section>
    </div>
  );
}
