import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/SupabaseClient";
import { RefreshIcon, SearchIcon, DownloadIcon, UploadIcon, LinkIcon, TrashIcon } from "../Icons";

function getActivityIcon(action = "") {
  const act = action.toLowerCase();
  if (act.includes("upload")) return { icon: <UploadIcon size={16} />, class: "icon-blue" };
  if (act.includes("share") || act.includes("link")) return { icon: <LinkIcon size={16} />, class: "icon-purple" };
  if (act.includes("download") || act.includes("read")) return { icon: <DownloadIcon size={16} />, class: "icon-green" };
  if (act.includes("delete") || act.includes("remove") || act.includes("revoke")) return { icon: <TrashIcon size={16} />, class: "icon-red" };
  return { icon: <UploadIcon size={16} />, class: "icon-blue" };
}

export default function ActivityLogsTab({
  session,
  activityLogs = [],
  setActivityLogs,
}) {
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const fetchedForUserRef = useRef(null);

  async function fetchActivityLogs() {
    if (!session?.user?.id) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("actor_id", session.user.id)
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        setActivityLogs(data);
      }
    } catch (err) {
      console.warn("Direct Supabase activity_logs notice:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!session?.user?.id) return;
    if (fetchedForUserRef.current === session.user.id) {
      setLoading(false);
      return;
    }
    fetchedForUserRef.current = session.user.id;
    fetchActivityLogs();
  }, [session?.user?.id]);

  const filteredLogs = activityLogs.filter((log) => {
    const act = (log.action || "").toLowerCase();
    const matchesSearch = act.includes(searchQuery.toLowerCase());
    if (severityFilter === "all") return matchesSearch;
    return matchesSearch && log.severity === severityFilter;
  });

  return (
    <div className="activity-logs-tab">
      <section className="files-card">
        {/* Header Row */}
        <div className="files-card-header flex-between flex-wrap" style={{ gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-hi)', margin: '0 0 4px' }}>
              Security Audit Activity Log ({loading ? "…" : filteredLogs.length})
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-lo)', margin: 0 }}>
              Immutable timeline record of all file uploads, downloads, share links, and deletions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div className="search-wrap">
              <SearchIcon size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Search audit trail…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <button
              className="ts-btn ts-btn-outline"
              onClick={fetchActivityLogs}
              disabled={loading}
              title="Refresh Activity Log"
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              <RefreshIcon size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Severity Filter Pills */}
        <div className="category-pills flex-between" style={{ marginTop: '12px' }}>
          <div className="pills-group">
            {["all", "info", "warn", "error"].map((sev) => (
              <button
                key={sev}
                className={`pill-btn ${severityFilter === sev ? "active" : ""}`}
                onClick={() => setSeverityFilter(sev)}
              >
                {sev === "all" ? "All Severities" : sev.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Content List - SKELETON LOADING & DATA VIEW */}
        <div className="activity-timeline-container" style={{ paddingTop: '16px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-center" style={{ gap: '14px', padding: '12px 16px', background: 'var(--panel-solid)', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
                  <div className="skeleton-box" style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="skeleton-box" style={{ width: '65%', height: '16px' }} />
                    <div className="skeleton-box" style={{ width: '35%', height: '12px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-lo)' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>
                {searchQuery ? "No audit logs match your search term." : "No activity logs recorded yet."}
              </p>
            </div>
          ) : (
            <div className="activity-timeline-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredLogs.map((log) => {
                const iconInfo = getActivityIcon(log.action || "");
                const formattedDate = log.created_at
                  ? new Date(log.created_at).toLocaleString()
                  : "Recently";

                return (
                  <div
                    key={log.id || log.created_at}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px 18px',
                      background: 'var(--panel-solid)',
                      borderRadius: '14px',
                      border: '1px solid var(--panel-border)',
                      boxShadow: 'var(--shadow-subtle)'
                    }}
                  >
                    <div className={`act-icon-wrap ${iconInfo.class}`} style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {iconInfo.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 2px', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-hi)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.action}
                      </p>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-lo)' }}>
                        {formattedDate} &bull; Severity: <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{log.severity || "info"}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
