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
  { key: "overview", label: "Dashboard", icon: ShieldIcon },
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
    <div
      className="mobile-nav-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex'
      }}
    >
      <div
        className="mobile-nav-drawer"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '280px',
          maxWidth: '80%',
          background: 'var(--panel-solid)',
          height: '100%',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-hover)',
          borderRight: '1px solid var(--panel-border)'
        }}
      >
        <div className="mobile-nav-header flex-between" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--text-hi)', color: 'var(--bg-dark)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldIcon size={16} />
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-hi)' }}>
              Trustme
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: 'var(--text-lo)',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            &times;
          </button>
        </div>

        <nav className="mobile-nav-links" style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const IconComp = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                className={`mobile-nav-link ${isActive ? "active" : ""}`}
                onClick={() => {
                  onTabChange(item.key);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive ? 'rgba(0, 102, 204, 0.08)' : 'transparent',
                  color: isActive ? 'var(--primary-cyan)' : 'var(--text-hi)',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%'
                }}
              >
                <IconComp size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mobile-nav-footer" style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--panel-border)' }}>
          <button
            className="ts-btn ts-btn-outline"
            onClick={() => {
              signOut();
              onClose();
            }}
            style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
          >
            <LogOutIcon size={16} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
