import { useState } from "react";
import { supabase } from "../../lib/SupabaseClient";
import { LinkIcon, CopyIcon, CheckIcon } from "../Icons";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function generateRandomToken() {
  return (
    Math.random().toString(36).substring(2, 12) +
    Math.random().toString(36).substring(2, 12)
  );
}

export default function ShareModal({ file, session, onClose, onLinkCreated }) {
  const [expirationHours, setExpirationHours] = useState("24");
  const [maxDownloads, setMaxDownloads] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  async function handleCreateLink(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const tokenStr = generateRandomToken();
    let expiresAt = null;
    if (expirationHours && expirationHours !== "never") {
      const dt = new Date();
      dt.setHours(dt.getHours() + parseInt(expirationHours, 10));
      expiresAt = dt.toISOString();
    }
    const maxDl = maxDownloads ? parseInt(maxDownloads, 10) : null;

    // 1. Primary: Try FastAPI backend endpoint
    try {
      const payload = {
        file_id: file.id,
        expiration_hours: expirationHours === "never" ? null : parseInt(expirationHours, 10),
        max_downloads: maxDl,
      };

      const res = await fetch(`${API_URL}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        const token = data.share_token || data.token || tokenStr;
        const fullUrl = `${window.location.origin}${window.location.pathname}?share=${token}`;
        setGeneratedLink(fullUrl);
        if (onLinkCreated) onLinkCreated();
        setLoading(false);
        return;
      }
    } catch (fetchErr) {
      console.log("FastAPI backend notice, using direct Supabase share_links fallback...", fetchErr);
    }

    // 2. Fallback: Direct Supabase share_links or shared_links table insert
    try {
      const shareRecord = {
        file_id: file.id,
        token: tokenStr,
        created_by: session.user.id,
        permission: "view",
        max_downloads: maxDl,
        download_count: 0,
        expires_at: expiresAt,
        revoked: false,
      };

      let sbError = null;
      const { error: err1 } = await supabase.from("share_links").insert([shareRecord]);
      if (err1) {
        const { error: err2 } = await supabase.from("shared_links").insert([shareRecord]);
        sbError = err2;
      }

      if (sbError) {
        throw new Error(sbError.message || "Database rejected share link insertion.");
      }

      const fullUrl = `${window.location.origin}${window.location.pathname}?share=${tokenStr}`;
      setGeneratedLink(fullUrl);
      if (onLinkCreated) onLinkCreated();
    } catch (err) {
      setError(err.message || "Failed to generate share link");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content share-modal-styled" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header flex-between">
          <div className="modal-title-box">
            <span className="modal-icon-badge">
              <LinkIcon size={20} />
            </span>
            <div>
              <h3>Share File Safely</h3>
              <p className="modal-subtitle">
                Configure access permissions for <strong>{file.filename}</strong> ({formatBytes(file.size_bytes)})
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        {!generatedLink ? (
          <form onSubmit={handleCreateLink} className="modal-form">
            <div className="form-group">
              <label className="form-label">⏳ Link Expiration Duration</label>
              <select
                value={expirationHours}
                onChange={(e) => setExpirationHours(e.target.value)}
                className="modal-select"
              >
                <option value="1">1 Hour</option>
                <option value="24">24 Hours (1 Day)</option>
                <option value="168">7 Days</option>
                <option value="never">Never (Permanent until revoked)</option>
              </select>
              <span className="field-hint">The link will automatically deactivate after this period.</span>
            </div>

            <div className="form-group">
              <label className="form-label">⬇️ Download Limit (Optional)</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 5 (Leave empty for unlimited downloads)"
                value={maxDownloads}
                onChange={(e) => setMaxDownloads(e.target.value)}
                className="modal-input"
              />
              <span className="field-hint">Maximum number of times this file can be downloaded.</span>
            </div>

            {error && (
              <div className="modal-error">
                <strong>Notice:</strong>
                <p style={{ margin: "4px 0 0 0", fontSize: "12.5px" }}>{error}</p>
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Generating Link…" : "🔗 Create Share Link"}
              </button>
            </div>
          </form>
        ) : (
          <div className="modal-success-box">
            <div className="success-badge">✅ Encrypted Share Link Generated</div>
            <p className="link-note">Anyone with this link can view and stream the decrypted file during its validity period.</p>

            <div className="copy-input-group">
              <input type="text" readOnly value={generatedLink} className="modal-input copy-url-input" />
              <button onClick={handleCopy} className="btn-primary copy-btn">
                {copied ? <><CheckIcon size={16} /> Copied!</> : <><CopyIcon size={16} /> Copy Link</>}
              </button>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
