import React, { useState, useEffect, useRef } from "react";
import { fetchWithTimeout } from "../../lib/apiClient";
import { supabase } from "../../lib/SupabaseClient";
import { CopyIcon, TrashIcon, RefreshIcon } from "../Icons";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function SharedLinksTab({
  session,
  shareLinks = [],
  setShareLinks,
  showToast,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchedForUserRef = useRef(null);

  async function fetchLinks() {
    if (!session?.user?.id) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    const isLocalDev = window.location.hostname === "localhost";

    // Only hit FastAPI when running locally
    if (isLocalDev) {
      try {
        const res = await fetchWithTimeout(
          `${API_URL}/share-links`,
          { headers: { Authorization: `Bearer ${session.access_token}` } },
          3000
        );
        if (res?.ok) {
          const data = await res.json();
          if (Array.isArray(data)) { setShareLinks(data); setLoading(false); return; }
        }
      } catch (err) {
        console.warn("FastAPI share-links unavailable, using Supabase directly");
      }
    }

    // Direct Supabase query — works on GitHub Pages
    try {
      const { data, error: sbErr } = await supabase
        .from("share_links")
        .select("*, files(filename, size_bytes)")
        .eq("created_by", session.user.id)
        .eq("revoked", false)
        .order("created_at", { ascending: false });

      if (!sbErr && data) {
        // Flatten nested files join
        const mapped = data.map((l) => ({
          ...l,
          share_token: l.token || l.share_token,
          filename: l.files?.filename || "Shared File",
          size_bytes: l.files?.size_bytes || 0,
          downloads_count: l.download_count || 0,
        }));
        setShareLinks(mapped);
      } else if (sbErr) {
        setError(`Database error: ${sbErr.message}`);
      }
    } catch (err) {
      setError("Failed to load share links: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!session?.user?.id) return;
    if (fetchedForUserRef.current === session.user.id) return;
    fetchedForUserRef.current = session.user.id;
    fetchLinks();
  }, [session?.user?.id]);

  async function handleRevoke(link) {
    if (!confirm("Are you sure you want to revoke this share link? Recipient access will be blocked immediately.")) return;

    const token = link.share_token || link.token;

    try {
      const res = await fetchWithTimeout(
        `${API_URL}/share-links/${token}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
        5000
      );

      if (res && res.ok) {
        setShareLinks((prev) => prev.filter((l) => (l.share_token || l.token) !== token));
        showToast("Share link revoked successfully", "warn");
      } else {
        showToast("Failed to revoke link — try again", "error");
      }
    } catch (err) {
      showToast(`Revoke failed: ${err.message}`, "error");
    }
  }

  function handleCopy(linkToken) {
    const fullUrl = `${window.location.origin}${window.location.pathname}?share=${linkToken}`;
    navigator.clipboard.writeText(fullUrl);
    showToast("Share link URL copied to clipboard!", "success");
  }

  function handleRefresh() {
    fetchedForUserRef.current = null;
    fetchLinks();
  }

  return (
    <section className="files-card">
      <div className="files-card-header flex-between">
        <div className="card-header-title-box">
          <h2>Active Shared Links</h2>
          <p className="card-header-desc">Manage self-destructing links and recipient permissions.</p>
        </div>
        <div className="header-actions">
          <span className="badge-count">{shareLinks.length} Active Links</span>
          <button className="btn-outline btn-sm" onClick={handleRefresh} title="Refresh Links">
            <RefreshIcon size={14} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="files-empty-box">
          <div className="loader" />
          <p className="files-empty" style={{ marginTop: "1rem" }}>Loading shared links…</p>
        </div>
      ) : error ? (
        <div className="files-empty-box">
          <p className="files-empty" style={{ color: "var(--color-danger, #ef4444)" }}>⚠️ {error}</p>
          <button className="btn-outline btn-sm" style={{ marginTop: "1rem" }} onClick={handleRefresh}>Retry</button>
        </div>
      ) : shareLinks.length === 0 ? (
        <div className="files-empty-box">
          <p className="files-empty">
            No active share links found. Click "Share" on any file in "My Files" to create one.
          </p>
        </div>
      ) : (
        <div className="files-table-wrap">
          <table className="files-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Share Token</th>
                <th>Created</th>
                <th>Expiry Status</th>
                <th>Downloads Used</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shareLinks.map((l) => {
                const token = l.share_token || l.token;
                const isExpired = l.expires_at && new Date() > new Date(l.expires_at);

                return (
                  <tr key={token || l.id} className={isExpired ? "row-expired" : ""}>
                    <td>
                      <div className="file-name-cell">
                        <span className="file-type-emoji">🔗</span>
                        <strong>{l.filename || "Shared File"}</strong>
                      </div>
                    </td>
                    <td><code>{token?.substring(0, 14)}…</code></td>
                    <td>{l.created_at ? new Date(l.created_at).toLocaleDateString() : "—"}</td>
                    <td>
                      {isExpired ? (
                        <span className="meta-pill expired-pill">Expired</span>
                      ) : l.expires_at ? (
                        <span className="meta-pill expiry">Expires: {new Date(l.expires_at).toLocaleDateString()}</span>
                      ) : (
                        <span className="meta-pill permanent-pill">Permanent</span>
                      )}
                    </td>
                    <td>
                      <span className="size-badge">
                        {l.download_count || l.downloads_count || 0}{" "}
                        {l.max_downloads ? `/ ${l.max_downloads}` : ""}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="action-buttons">
                        <button className="btn-action share" title="Copy Link URL" onClick={() => handleCopy(token)}>
                          <CopyIcon size={14} /> Copy Link
                        </button>
                        <button className="btn-action delete" title="Revoke Share Link" onClick={() => handleRevoke(l)}>
                          <TrashIcon size={14} /> Revoke
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
