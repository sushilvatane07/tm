import React, { useState } from "react";
import { CheckIcon, ShieldCheckIcon } from "../Icons";

export default function SettingsTab({ user, showToast }) {
  const [isEditing, setIsEditing] = useState(false);

  const [defaultExpiration, setDefaultExpiration] = useState(
    localStorage.getItem("ts_default_expiration") || "24"
  );
  const [autoRevokeExpired, setAutoRevokeExpired] = useState(
    localStorage.getItem("ts_auto_revoke") !== "false"
  );
  const [enforceEncryptionKey, setEnforceEncryptionKey] = useState(
    localStorage.getItem("ts_enforce_key") !== "false"
  );

  function handleSaveSettings(e) {
    e.preventDefault();
    localStorage.setItem("ts_default_expiration", defaultExpiration);
    localStorage.setItem("ts_auto_revoke", autoRevokeExpired);
    localStorage.setItem("ts_enforce_key", enforceEncryptionKey);
    
    if (showToast) showToast("Security & vault settings saved successfully!", "success");
    setIsEditing(false);
  }

  function handleCancel() {
    setDefaultExpiration(localStorage.getItem("ts_default_expiration") || "24");
    setAutoRevokeExpired(localStorage.getItem("ts_auto_revoke") !== "false");
    setEnforceEncryptionKey(localStorage.getItem("ts_enforce_key") !== "false");
    setIsEditing(false);
  }

  function handleClearCache() {
    localStorage.clear();
    if (showToast) showToast("Local browser cache cleared.", "info");
  }

  const expirationLabels = {
    "1": "1Hr",
    "24": "24Hr",
    "168": "7Days",
    "never": "Never",
  };

  return (
    <div className="settings-tab" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Security Configuration Card */}
      <section className="files-card">
        <div className="files-card-header flex-between flex-wrap" style={{ gap: '16px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-hi)', margin: '0 0 4px' }}>
              Security & Vault Settings
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-lo)', margin: 0 }}>
              Configure client-side preferences, link expiration rules, and encryption policies.
            </p>
          </div>

          <div>
            {!isEditing ? (
              <button
                className="ts-btn ts-btn-outline"
                onClick={() => setIsEditing(true)}
                style={{ padding: '10px 18px', fontSize: '0.88rem', minWidth: '130px', justifyContent: 'center' }}
              >
                ✏️ Edit Settings
              </button>
            ) : (
              <button
                className="ts-btn ts-btn-outline"
                onClick={handleCancel}
                style={{ padding: '10px 18px', fontSize: '0.88rem', minWidth: '110px', justifyContent: 'center', color: 'var(--text-lo)' }}
              >
                ✕ Cancel
              </button>
            )}
          </div>
        </div>

        {!isEditing ? (
          /* READ-ONLY VIEW */
          <div className="settings-read-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Item 1 */}
            <div className="setting-item flex-between" style={{ padding: '16px', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-hi)' }}>AES-256 Fernet Encryption</strong>
                <p className="setting-desc" style={{ fontSize: '0.82rem', color: 'var(--text-lo)', margin: '4px 0 0' }}>
                  Server-side Fernet key isolation applied per file payload before object storage.
                </p>
              </div>
              <span style={{ padding: '4px 10px', borderRadius: '100px', background: 'rgba(52, 199, 89, 0.12)', color: 'var(--primary-emerald)', border: '1px solid rgba(52, 199, 89, 0.25)', fontSize: '0.78rem', fontWeight: 600 }}>
                Enforced
              </span>
            </div>

            {/* Item 2 */}
            <div className="setting-item flex-between" style={{ padding: '16px', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-hi)' }}>JWT Token Authentication</strong>
                <p className="setting-desc" style={{ fontSize: '0.82rem', color: 'var(--text-lo)', margin: '4px 0 0' }}>
                  Validates Bearer token headers for every backend endpoint request.
                </p>
              </div>
              <span style={{ padding: '4px 10px', borderRadius: '100px', background: 'rgba(52, 199, 89, 0.12)', color: 'var(--primary-emerald)', border: '1px solid rgba(52, 199, 89, 0.25)', fontSize: '0.78rem', fontWeight: 600 }}>
                Enforced
              </span>
            </div>

            {/* Item 3 */}
            <div className="setting-item flex-between" style={{ padding: '16px', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-hi)' }}>Default Expiration Preset</strong>
                <p className="setting-desc" style={{ fontSize: '0.82rem', color: 'var(--text-lo)', margin: '4px 0 0' }}>
                  Default validity timer preset applied when generating new share links.
                </p>
              </div>
              <span style={{ padding: '6px 14px', borderRadius: '10px', background: 'var(--panel-solid)', color: 'var(--primary-cyan)', border: '1px solid var(--panel-border)', fontSize: '0.85rem', fontWeight: 600 }}>
                 {expirationLabels[defaultExpiration] || "24Hr"}
              </span>
            </div>

            {/* Item 4 */}
            <div className="setting-item flex-between" style={{ padding: '16px', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-hi)' }}>Auto-Purge Expired Links</strong>
                <p className="setting-desc" style={{ fontSize: '0.82rem', color: 'var(--text-lo)', margin: '4px 0 0' }}>
                  Automatically block download requests as soon as expiry timestamp passes.
                </p>
              </div>
              <span style={{ padding: '4px 12px', borderRadius: '100px', background: autoRevokeExpired ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 59, 48, 0.12)', color: autoRevokeExpired ? 'var(--primary-emerald)' : 'var(--primary-rose)', border: autoRevokeExpired ? '1px solid rgba(52, 199, 89, 0.25)' : '1px solid rgba(255, 59, 48, 0.25)', fontSize: '0.8rem', fontWeight: 600 }}>
                {autoRevokeExpired ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
        ) : (
          /* INTERACTIVE EDITING FORM */
          <form onSubmit={handleSaveSettings} className="settings-edit-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '16px', border: '1px solid var(--panel-border)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-hi)', margin: 0 }}>
              Edit Vault Security Rules
            </h3>

            {/* Editable Expiration */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-hi)' }}>
                ⏳ Default Link Expiration Preset
              </label>
              <select
                className="modal-select"
                value={defaultExpiration}
                onChange={(e) => setDefaultExpiration(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--panel-border)',
                  background: 'var(--bg-dark)',
                  color: 'var(--text-hi)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              >
                <option value="1">1 Hour</option>
                <option value="24">24Hr</option>
                <option value="168">7Days</option>
                <option value="never">Never</option>
              </select>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-lo)' }}>Default selection pre-filled whenever you open the share link modal.</span>
            </div>

            {/* Editable Auto Purge Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-hi)' }}>Auto-Purge Expired Links</strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-lo)', margin: '2px 0 0' }}>Block download access immediately upon expiration.</p>
              </div>
              <input
                type="checkbox"
                checked={autoRevokeExpired}
                onChange={(e) => setAutoRevokeExpired(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-cyan)' }}
              />
            </div>

            {/* Editable Key Enforcement Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-hi)' }}>Client Decryption Verification</strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-lo)', margin: '2px 0 0' }}>Enforce client-side cryptographic key checks before downloading payload.</p>
              </div>
              <input
                type="checkbox"
                checked={enforceEncryptionKey}
                onChange={(e) => setEnforceEncryptionKey(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-cyan)' }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="submit" className="ts-btn ts-btn-primary" style={{ padding: '10px 22px', fontSize: '0.88rem' }}>
                <CheckIcon size={16} /> Save Security Settings
              </button>
              <button
                type="button"
                className="ts-btn ts-btn-outline"
                onClick={handleCancel}
                style={{ padding: '10px 18px', fontSize: '0.88rem' }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Active Session Card */}
      <section className="files-card">
        <div className="files-card-header" style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-hi)' }}>
            Active Session & Authentication
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-lo)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Email Address
            </span>
            <strong style={{ fontSize: '0.9rem', color: 'var(--text-hi)' }}>
              {user?.email}
            </strong>
          </div>

          <div style={{ padding: '16px', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-lo)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Identity Provider
            </span>
            <strong style={{ fontSize: '0.9rem', color: 'var(--text-hi)' }}>
              Supabase Auth (JWT)
            </strong>
          </div>

          <div style={{ padding: '16px', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-lo)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Storage System
            </span>
            <strong style={{ fontSize: '0.9rem', color: 'var(--text-hi)' }}>
              Supabase S3 Object Storage
            </strong>
          </div>
        </div>

        <div style={{ marginTop: "20px" }}>
          <button className="ts-btn ts-btn-outline" onClick={handleClearCache} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            Clear Local Browser Cache
          </button>
        </div>
      </section>
    </div>
  );
}
