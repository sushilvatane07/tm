import React from "react";
import {
  FolderIcon,
  LinkIcon,
  ActivityIcon,
  SettingsIcon,
  UserIcon,
  ShieldIcon,
  LogOutIcon,
} from "../Icons";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: ShieldIcon },
  { key: "files", label: "My Files", icon: FolderIcon },
  { key: "shared", label: "Shared Links", icon: LinkIcon },
  { key: "activity", label: "Activity Log", icon: ActivityIcon },
  { key: "settings", label: "Settings", icon: SettingsIcon },
  { key: "profile", label: "Profile", icon: UserIcon },
];

export default function MobileNav({ activeTab, onTabChange, isOpen, onClose }) {
  const { signOut } = useAuth();
  if (!isOpen) return null;

  return (
    <div className="mobile-nav-overlay" onClick={onClose}>
      <div className="mobile-nav-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-nav-header flex-between">
          <span className="mobile-brand">TrustShare Menu</span>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <nav className="mobile-nav-links">
          {NAV_ITEMS.map((item) => {
            const IconComp = item.icon;
            return (
              <button
                key={item.key}
                className={"mobile-nav-link" + (activeTab === item.key ? " active" : "")}
                onClick={() => {
                  onTabChange(item.key);
                  onClose();
                }}
              >
                <IconComp size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mobile-nav-footer">
          <button
            className="btn-outline btn-block"
            onClick={() => {
              signOut();
              onClose();
            }}
          >
            <LogOutIcon size={16} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
