import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/SupabaseClient";
import { fetchWithTimeout } from "../../lib/apiClient";
import { CopyIcon, LinkIcon, TrashIcon, RefreshIcon, SearchIcon } from "../Icons";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0.00 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function SharedLinksTab({
  session,
  shareLinks = [],
  setShareLinks,
  showToast,
}) {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const fetchedForUserRef = useRef(null);

  async function fetchLinks() {
    if (!session?.user?.id) return;
    setLoading(true);

    const userId = session.user.id;

    // 1. Direct Supabase Query
    try {
      const { data, error } = await supabase
        .from("share_links")
        .select("*, files(id, filename, size_bytes)")
        .eq("created_by", userId)
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        const formatted = data.map((item) => ({
          ...item,
          filename: item.files?.filename || item.filename || "Shared Document",
          size_bytes: item.files?.size_bytes || item.size_bytes || 0,
        }));
        setShareLinks(formatted);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Direct Supabase query notice for share_links:", err);
    }

    // 2. Backup: FastAPI REST lookup if active
    const isLocalDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isLocalDev && session?.access_token) {
      try {
        const res = await fetchWithTimeout(`${API_URL}/share-links`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }, 2500);

        if (res?.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setShareLinks(data);
          }
        }
      } catch (err) {
        console.warn("FastAPI share-links lookup notice:", err);
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    if (!session?.user?.id) return;
    if (fetchedForUserRef.current === session.user.id) {
      setLoading(false);
      return;
    }
    fetchedForUserRef.current = session.user.id;
    fetchLinks();
  }, [session?.user?.id]);

  async function handleRevoke(link) {
    if (!confirm("Are you sure you want to revoke and delete this share link permanently from the database?")) return;

    const token = link.share_token || link.token;
    const linkId = link.id;

    try {
      if (linkId) {
        await supabase
          .from("share_links")
          .delete()
          .eq("id", linkId)
          .eq("created_by", session.user.id);
      }
      if (token) {
        await supabase
          .from("share_links")
          .delete()
          .eq("token", token)
          .eq("created_by", session.user.id);
      }

      setShareLinks((prev) => prev.filter((l) => (l.share_token || l.token || l.id) !== (token || linkId) && l.id !== linkId));

      if (session?.user?.id) {
        const actEntry = {
          actor_id: session.user.id,
          action: `You revoked share link for ${link.filename || "Shared File"}`,
          resource_type: "share_link",
          resource_id: String(linkId || token),
          severity: "warn",
          created_at: new Date().toISOString(),
        };
        try { await supabase.from("activity_logs").insert([actEntry]); } catch (e) {}
      }

      showToast("Share link permanently revoked!", "warn");
    } catch (err) {
      showToast(`Revoke failed: ${err.message}`, "error");
    }
  }

  function handleCopy(linkToken) {
    const fullUrl = `${window.location.origin}${window.location.pathname}?share=${linkToken}`;
    navigator.clipboard.writeText(fullUrl);
    showToast("Share link URL copied to clipboard!", "success");
  }

  const filteredLinks = shareLinks.filter((l) =>
    (l.filename || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.share_token || l.token || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="shared-links-tab">
      <section className="files-card">
        {/* Header Bar */}
        <div className="files-card-header flex-between flex-wrap" style={{ gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-hi)', margin: '0 0 4px' }}>
              Active Share Links ({loading ? "…" : filteredLinks.length})
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-lo)', margin: 0 }}>
              Manage temporary encrypted access URLs generated for external recipients.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div className="search-wrap">
              <SearchIcon size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Filter links…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <button
              className="ts-btn ts-btn-outline"
              onClick={fetchLinks}
              disabled={loading}
              title="Refresh Links"
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              <RefreshIcon size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Content Display - GRID ONLY VIEW & SKELETON LOADERS */}
        {loading ? (
          <div className="files-grid-wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', paddingTop: '16px' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  background: 'var(--panel-solid)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  minHeight: '170px'
                }}
              >
                <div className="flex-between">
                  <div className="skeleton-box" style={{ width: '60%', height: '18px' }} />
                  <div className="skeleton-box" style={{ width: '30%', height: '16px', borderRadius: '100px' }} />
                </div>
                <div className="skeleton-box" style={{ width: '40%', height: '14px' }} />
                <div className="flex-between" style={{ marginTop: 'auto', paddingTop: '10px' }}>
                  <div className="skeleton-box" style={{ width: '48%', height: '32px', borderRadius: '8px' }} />
                  <div className="skeleton-box" style={{ width: '48%', height: '32px', borderRadius: '8px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredLinks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-lo)' }}>
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>
              {searchQuery ? "No share links match your filter query." : "No active share links found. Generate a share link from your files to display it here."}
            </p>
          </div>
        ) : (
          <div className="files-grid-wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', paddingTop: '16px' }}>
            {filteredLinks.map((l) => {
              const token = l.share_token || l.token || l.id;
              const isExpired = l.expires_at && new Date(l.expires_at) < new Date();

              return (
                <div
                  key={l.id || token}
                  style={{
                    background: 'var(--panel-solid)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    boxShadow: 'var(--shadow-subtle)'
                  }}
                >
                  {/* Top Row: File Name + Expiration Badge */}
                  <div className="flex-between" style={{ alignItems: 'flex-start', gap: '12px' }}>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-hi)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      📄 {l.filename}
                    </h4>

                    {isExpired ? (
                      <span style={{ background: 'rgba(255, 59, 48, 0.12)', color: 'var(--primary-rose)', padding: '2px 8px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 700, border: '1px solid rgba(255, 59, 48, 0.25)', flexShrink: 0 }}>
                        Expired
                      </span>
                    ) : l.expires_at ? (
                      <span style={{ background: 'rgba(255, 149, 0, 0.12)', color: 'var(--primary-amber)', padding: '2px 8px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 700, border: '1px solid rgba(255, 149, 0, 0.25)', flexShrink: 0 }}>
                        {new Date(l.expires_at).toLocaleDateString()}
                      </span>
                    ) : (
                      <span style={{ background: 'rgba(52, 199, 89, 0.12)', color: 'var(--primary-emerald)', padding: '2px 8px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 700, border: '1px solid rgba(52, 199, 89, 0.25)', flexShrink: 0 }}>
                        Active
                      </span>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="file-grid-meta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-lo)' }}>
                    <span className="size-badge" style={{ fontWeight: 600, color: 'var(--primary-cyan)' }}>
                      📥 {l.download_count || l.downloads_count || 0} {l.max_downloads ? `/ ${l.max_downloads}` : ""} downloads
                    </span>
                    <span>{l.created_at ? new Date(l.created_at).toLocaleDateString() : "Today"}</span>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="file-grid-actions" style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--panel-border)' }}>
                    <button
                      className="btn-action share"
                      title="Copy Link URL"
                      onClick={() => handleCopy(token)}
                      style={{ flex: 1, minWidth: '100px', justifyContent: 'center' }}
                    >
                      <CopyIcon size={14} /> Copy Link
                    </button>
                    <button
                      className="btn-action delete"
                      title="Revoke Share Link"
                      onClick={() => handleRevoke(l)}
                      style={{ flex: 1, minWidth: '100px', justifyContent: 'center' }}
                    >
                      <TrashIcon size={14} /> Revoke
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
