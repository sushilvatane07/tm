import React, { useState, useEffect, useRef } from "react";
import { fetchWithTimeout } from "../../lib/apiClient";
import { supabase } from "../../lib/SupabaseClient";
import { RefreshIcon, SearchIcon, DownloadIcon } from "../Icons";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function ActivityLogsTab({
  session,
  activityLogs = [],
  setActivityLogs,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const fetchedForUserRef = useRef(null);

  async function fetchActivity() {
    if (!session?.user?.id) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    const isLocalDev = window.location.hostname === "localhost";

    // Only hit FastAPI when running locally
    if (isLocalDev) {
      try {
        const res = await fetchWithTimeout(
          `${API_URL}/activity`,
          { headers: { Authorization: `Bearer ${session.access_token}` } },
          3000
        );
        if (res?.ok) {
          const data = await res.json();
          if (Array.isArray(data)) { setActivityLogs(data); setLoading(false); return; }
        }
      } catch (err) {
        console.warn("FastAPI activity unavailable, using Supabase directly");
      }
    }

    // Direct Supabase query — works on GitHub Pages
    try {
      const { data, error: sbErr } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("actor_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!sbErr && data) {
        setActivityLogs(data);
      } else if (sbErr) {
        setError(`Database error: ${sbErr.message}`);
      }
    } catch (err) {
      setError("Failed to load activity logs: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!session?.user?.id) return;
    if (fetchedForUserRef.current === session.user.id) return;
    fetchedForUserRef.current = session.user.id;
    fetchActivity();
  }, [session?.user?.id]);

  const filteredLogs = activityLogs.filter((log) => {
    const matchesSev = severityFilter === "all" || (log.severity || "info") === severityFilter;
    const matchesSearch =
      (log.action || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.resource_type || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.resource_id || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesSearch;
  });

  function handleExportCSV() {
    if (filteredLogs.length === 0) return;
    const headers = ["ID", "Action", "Resource Type", "Resource ID", "Severity", "Timestamp"];
    const rows = filteredLogs.map((l) => [
      l.id || "",
      `"${l.action || ""}"`,
      `"${l.resource_type || ""}"`,
      `"${l.resource_id || ""}"`,
      l.severity || "info",
      `"${l.created_at || ""}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trustshare_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleRefresh() {
    fetchedForUserRef.current = null;
    fetchActivity();
  }

  return (
    <section className="files-card">
      <div className="files-card-header flex-between">
        <div>
          <h2>Security & Activity Audit Log</h2>
          <p className="card-header-desc">Real-time cryptographic audit trail of file access & system events.</p>
        </div>
        <div className="header-actions">
          <button className="btn-outline btn-sm" onClick={handleExportCSV} disabled={filteredLogs.length === 0}>
            <DownloadIcon size={14} /> Export CSV
          </button>
          <button className="btn-outline btn-sm" onClick={handleRefresh}>
            <RefreshIcon size={14} /> Refresh Log
          </button>
        </div>
      </div>

      {/* Filter controls */}
      <div className="category-pills flex-between">
        <div className="pills-group">
          {["all", "info", "warn", "alert"].map((sev) => (
            <button
              key={sev}
              className={`pill-btn ${severityFilter === sev ? "active" : ""}`}
              onClick={() => setSeverityFilter(sev)}
            >
              {sev === "all" ? "All Severity" : sev.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="search-wrap">
          <SearchIcon size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Filter actions…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="files-empty-box">
          <div className="loader" />
          <p className="files-empty" style={{ marginTop: "1rem" }}>Loading audit logs…</p>
        </div>
      ) : error ? (
        <div className="files-empty-box">
          <p className="files-empty" style={{ color: "var(--color-danger, #ef4444)" }}>⚠️ {error}</p>
          <button className="btn-outline btn-sm" style={{ marginTop: "1rem" }} onClick={handleRefresh}>Retry</button>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="files-empty-box">
          <p className="files-empty">No activity logs found. Upload or download a file to generate events.</p>
        </div>
      ) : (
        <div className="files-table-wrap">
          <table className="files-table">
            <thead>
              <tr>
                <th>Action Event</th>
                <th>Resource Type</th>
                <th>Resource Identifier</th>
                <th>Severity</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, idx) => (
                <tr key={log.id || idx}>
                  <td><strong>{log.action}</strong></td>
                  <td><code>{log.resource_type || "system"}</code></td>
                  <td><code className="meta-code">{log.resource_id ? log.resource_id.substring(0, 16) : "N/A"}</code></td>
                  <td>
                    <span className={`severity-badge severity-${log.severity || "info"}`}>
                      {log.severity || "info"}
                    </span>
                  </td>
                  <td>{log.created_at ? new Date(log.created_at).toLocaleString() : "Recently"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
