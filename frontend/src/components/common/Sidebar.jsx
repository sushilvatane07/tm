import React from "react";
import {
  FolderIcon,
  LinkIcon,
  ActivityIcon,
  SettingsIcon,
  UserIcon,
  ShieldIcon,
} from "../Icons";

const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: ShieldIcon },
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

export default function Sidebar({ activeTab, onTabChange, totalStorageBytes = 0, filesCount = 0 }) {
  const maxStorage = 5 * 1024 * 1024 * 1024; // 5 GB Quota placeholder
  const percentage = Math.min(100, Math.round((totalStorageBytes / maxStorage) * 100)) || 1;

  return (
    <aside className="dash-sidebar">
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const IconComp = item.icon;
          return (
            <button
              key={item.key}
              className={"sidebar-link" + (activeTab === item.key ? " active" : "")}
              aria-current={activeTab === item.key ? "page" : undefined}
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

      {/* Storage Quota Widget */}
      <div className="sidebar-quota-box">
        <div className="quota-header flex-between">
          <span>Storage Used</span>
          <span>{percentage}%</span>
        </div>
        <div className="quota-bar">
          <div className="quota-fill" style={{ width: `${percentage}%` }} />
        </div>
        <div className="quota-subtext">
          {formatBytes(totalStorageBytes)} of 5 GB used ({filesCount} files)
        </div>
      </div>
    </aside>
  );
}
