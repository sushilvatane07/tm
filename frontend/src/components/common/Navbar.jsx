import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { ShieldIcon, SunIcon, MoonIcon, LogOutIcon } from "../Icons";

export default function Navbar({ onTabChange, activeTab, onToggleMobileNav }) {
  const { user, profile, signOut } = useAuth();
  const { themeMode, toggleTheme } = useTheme();

  const handle = profile?.username || (user?.email ? user.email.split("@")[0] : "User");
  const initials = handle?.[0]?.toUpperCase() || "U";

  return (
    <header className="dash-header">
      <div className="dash-brand-wrap">
        <button
          className="mobile-menu-toggle"
          onClick={onToggleMobileNav}
          aria-label="Toggle Navigation Menu"
        >
          ☰
        </button>
        <div className="dash-brand" onClick={() => onTabChange("overview")} style={{ cursor: "pointer" }}>
          <span className="ts-brand-icon">
            <ShieldIcon size={22} color="#ffffff" />
          </span>
          <span>
            Trust<span className="dash-brand-accent">Share</span>
          </span>
        </div>
      </div>

      <div className="dash-user">
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${themeMode === "dark" ? "Light" : "Dark"} Mode`}
        >
          {themeMode === "dark" ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          <span className="theme-label">{themeMode === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>

        <div
          className="user-profile-badge"
          onClick={() => onTabChange("profile")}
          title="Manage Profile"
          style={{ cursor: "pointer" }}
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="dash-avatar-img" />
          ) : (
            <span className="dash-avatar">{initials}</span>
          )}
          <span className="user-email-header">{handle}</span>
        </div>

        <button className="btn-outline btn-sm" onClick={signOut} title="Sign Out">
          <LogOutIcon size={16} /> Sign Out
        </button>
      </div>
    </header>
  );
}
