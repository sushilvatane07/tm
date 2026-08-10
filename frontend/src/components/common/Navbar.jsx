import React from "react";
import { useAuth } from "../../context/AuthContext";
import { ShieldIcon, LogOutIcon } from "../Icons";

export default function Navbar({ onTabChange, activeTab, onToggleMobileNav }) {
  const { user, profile, signOut } = useAuth();

  const handle = profile?.username || (user?.email ? user.email.split("@")[0] : "User");
  const initials = handle?.[0]?.toUpperCase() || "U";

  return (
    <header className="dash-header">
      {/* Left side: Hamburger menu + Premium TrustShare Logo */}
      <div className="dash-brand-wrap" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          className="mobile-menu-toggle"
          onClick={onToggleMobileNav}
          aria-label="Toggle Navigation Menu"
          style={{
            background: 'var(--panel-solid)',
            border: '1px solid var(--panel-border)',
            borderRadius: '10px',
            padding: '7px 9px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-hi)',
            flexShrink: 0
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        
        <div
          className="dash-brand"
          onClick={() => onTabChange("overview")}
          style={{ cursor: "pointer", display: 'flex', alignItems: 'center', gap: '10px', userSelect: 'none' }}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0066CC 0%, #004499 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0, 102, 204, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <ShieldIcon size={19} color="#ffffff" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-hi)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
            Trust<span className="dash-brand-accent" style={{ color: 'var(--primary-cyan)' }}>me</span>
          </span>
        </div>
      </div>

      {/* Right side: Profile Badge + Username + Sign Out Button */}
      <div className="dash-user" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          className="user-profile-badge"
          onClick={() => onTabChange("profile")}
          title="Manage Profile"
          style={{
            cursor: "pointer",
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            borderRadius: '100px',
            background: 'var(--panel-solid)',
            border: '1px solid var(--panel-border)',
            flexShrink: 0
          }}
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="dash-avatar-img" style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <span className="dash-avatar" style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--primary-cyan)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600 }}>
              {initials}
            </span>
          )}
          <span className="user-email-header" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-hi)', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {handle}
          </span>
        </div>

        <button
          className="ts-btn ts-btn-outline"
          onClick={signOut}
          title="Sign Out"
          style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
        >
          <LogOutIcon size={14} /> <span className="signout-text">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
