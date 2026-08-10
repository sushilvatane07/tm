import React from "react";
import {
  FolderIcon,
  LinkIcon,
  ActivityIcon,
  SettingsIcon,
  UserIcon,
  ShieldIcon,
  LockIcon,
} from "../Icons";

const NAV_ITEMS = [
  { key: "overview", label: "Dashboard", icon: ShieldIcon },
  { key: "files", label: "My Files", icon: FolderIcon },
  { key: "shared", label: "Shared Links", icon: LinkIcon },
  { key: "activity", label: "Activity Log", icon: ActivityIcon },
  { key: "settings", label: "Settings", icon: SettingsIcon },
  { key: "profile", label: "Profile", icon: UserIcon },
];

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function Sidebar({ activeTab, onTabChange, totalStorageBytes = 0 }) {
  const maxStorageBytes = 5 * 1024 * 1024 * 1024; // 5 GB
  const percentage = Math.min(100, (totalStorageBytes / maxStorageBytes) * 100);
  const displayUsed = formatBytes(totalStorageBytes);

  return (
    <aside className="dash-sidebar">
      {/* Navigation List */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const IconComp = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              className={`sidebar-link ${isActive ? "active" : ""}`}
              onClick={() => onTabChange(item.key)}
            >
              <span className="sidebar-icon">
                <IconComp size={18} />
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom-cards">
        {/* Security Info Card */}
        <div className="sidebar-security-card">
          <div className="sec-icon-circle">
            <LockIcon size={16} color="#0066CC" />
          </div>
          <h4>Security First</h4>
          <p>End-to-end encrypted storage. Zero knowledge server access.</p>
          <button className="sec-learn-link" onClick={() => onTabChange("settings")}>
            Security settings &rarr;
          </button>
        </div>

        {/* Dynamic Storage Quota Box */}
        <div className="sidebar-quota-box">
          <div className="quota-title-row flex-between">
            <span className="quota-text">{displayUsed} of 5 GB used</span>
          </div>
          <div className="quota-bar">
            <div
              className="quota-fill"
              style={{
                width: `${percentage}%`,
                backgroundColor: percentage > 90 ? "var(--danger)" : percentage > 75 ? "var(--primary-amber)" : "var(--primary-cyan)"
              }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
