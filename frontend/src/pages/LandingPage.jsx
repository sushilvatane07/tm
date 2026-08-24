import React, { useState } from "react";
import {
  ShieldIcon,
  LockIcon,
  LinkIcon,
} from "../components/Icons";
import Vault3DCanvas from "../components/common/Vault3DCanvas";
import "../styles/start.css";

const NAV_ITEMS = [
  {
    id: "features",
    label: "Features",
    title: "Core Trustme Features",
    desc: "Everything you need to store and share encrypted files with total privacy.",
    bullets: [
      "🔒 End-to-End Encryption: Files encrypted on your device using client-side Fernet AES-256 keys.",
      "⏳ Self-Destructing Links: Custom expiration timers (1 hour, 24 hours, 7 days, or single-use).",
      "📊 Live Audit Log: Track every upload, download, and share link generation in real-time.",
      "⚡ Zero Storage Overhead: Blazing fast S3 object storage integration via Supabase.",
    ],
  },
  {
    id: "security",
    label: "Security Model",
    title: "Zero-Knowledge Cryptographic Architecture",
    desc: "Your data privacy is mathematically guaranteed before it ever leaves your device.",
    bullets: [
      "🛡 Client-Side Encryption: Payload is encrypted before transmitting across the wire.",
      "🔑 Zero-Knowledge Server: We never possess unencrypted raw data or private decryption keys.",
      "📜 JWT Bearer Auth: Industry standard JSON Web Tokens protect all REST API endpoints.",
      "🛡 Row Level Security (RLS): Supabase PostgreSQL policies restrict data access per authenticated UID.",
    ],
  },
  {
    id: "architecture",
    label: "System Architecture",
    title: "Modern Full-Stack Tech Stack",
    desc: "Built on high-performance infrastructure designed for sub-second global delivery.",
    bullets: [
      "⚡ FastAPI Python Backend: Asynchronous REST service handling cryptographic payload streams.",
      "📦 Supabase Storage & Database: Scalable Postgres database and S3-backed storage bucket.",
      "🎨 React & Vanilla CSS UI: High-FPS responsive design system with zero framework bloat.",
    ],
  },
  {
    id: "pricing",
    label: "Pricing & Limits",
    title: "Simple, Transparent Vault Pricing",
    desc: "Privacy should be accessible to everyone. No hidden bandwidth fees.",
    bullets: [
      "🎁 Free Forever Tier: 250 MB Encrypted Storage, Unlimited Share Links, Full Security Audit Log.",
      "🚀 Pro Vault Tier: 1 TB Storage, Custom Branded Share Links, Priority FastAPI Encryption Engine.",
    ],
  },
  {
    id: "contact",
    label: "Contact & Support",
    title: "Direct Engineering Support",
    desc: "Have questions about our cryptographic implementation or deployment?",
    bullets: [
      "📧 Email Support: speedexe404@gmail.com",
      "💬 GitHub Repository: Open source verification and community issue tracker.",
      "⚡ SLA Guarantee: 99.99% Uptime with redundant multi-region object storage.",
    ],
  },
];

const FEATURES = [
  { icon: LockIcon, title: "End-to-End Encryption", text: "Files are encrypted on your device before they even reach our servers." },
  { icon: LinkIcon, title: "Expiring Links", text: "Set custom expiration times and download limits for your shared files." },
  { icon: ShieldIcon, title: "Zero Knowledge", text: "We cannot read your files. Only you and your recipients have the keys." },
];

export default function LandingPage({ onGetStarted, onSignIn }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModalItem, setActiveModalItem] = useState(null);

  return (
    <div className="ts-page" style={{ position: "relative", minHeight: "100vh", overflowX: "hidden" }}>
      {/* Full-Page Background 3D Liquid Glass Simulation */}
      <Vault3DCanvas isFullPage={true} />

      {/* Floating Interactive Page Content Overlay */}
      <div className="ts-page-content" style={{ position: "relative", zIndex: 10, pointerEvents: "none" }}>
        {/* Header Navbar */}
        <header className="ts-header" style={{ pointerEvents: "auto" }}>
          <div className="ts-header-inner">
            {/* Logo */}
            <div className="ts-brand">
              <span
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0066CC 0%, #004499 100%)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,102,204,0.3)',
                }}
              >
                <ShieldIcon size={18} color="#ffffff" />
              </span>
              <span className="ts-brand-name">Trust<span className="ts-accent">me</span></span>
            </div>

            {/* Desktop Nav Links */}
            <nav className="ts-nav-links desktop-only">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveModalItem(item)}
                  className="ts-nav-link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', pointerEvents: "auto" }}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Header Actions */}
            <div className="ts-header-actions">
              <button className="ts-link-btn desktop-only" onClick={onSignIn || onGetStarted} style={{ pointerEvents: "auto" }}>
                Sign In
              </button>
              <button className="ts-btn ts-btn-primary desktop-only" onClick={onGetStarted} style={{ pointerEvents: "auto" }}>
                Get Started
              </button>

              <button
                className="mobile-menu-toggle mobile-only"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  background: 'var(--panel-solid)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: 'var(--text-hi)',
                  pointerEvents: "auto"
                }}
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Nav Overlay Drawer */}
        {mobileMenuOpen && (
          <div
            className="mobile-nav-overlay"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(12px)',
              zIndex: 9999,
              display: 'flex',
              justifyContent: 'flex-end',
              pointerEvents: "auto"
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
                boxShadow: 'var(--shadow-hover)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--primary-cyan)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldIcon size={16} />
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-hi)' }}>
                    Trustme
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: '24px', color: 'var(--text-lo)', cursor: 'pointer' }}
                >
                  &times;
                </button>
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setActiveModalItem(item);
                    }}
                    style={{
                      fontSize: '1rem',
                      fontWeight: '500',
                      color: 'var(--text-hi)',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      padding: '8px 0',
                      cursor: 'pointer'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '20px', borderTop: '1px solid var(--panel-border)' }}>
                <button
                  className="ts-btn ts-btn-primary"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onGetStarted();
                  }}
                  style={{ justifyContent: 'center', padding: '12px' }}
                >
                  Get Started
                </button>
                <button
                  className="ts-btn ts-btn-outline"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    (onSignIn || onGetStarted)();
                  }}
                  style={{ justifyContent: 'center', padding: '12px' }}
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Showcase Modal when clicking Nav Items */}
        {activeModalItem && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(14px)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              pointerEvents: "auto"
            }}
            onClick={() => setActiveModalItem(null)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '540px',
                background: 'var(--panel-solid)',
                border: '1px solid var(--panel-border)',
                borderRadius: '24px',
                padding: '32px',
                boxShadow: 'var(--shadow-hover)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Trustme Info Showcase
                  </span>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-hi)', margin: '4px 0 0' }}>
                    {activeModalItem.title}
                  </h2>
                </div>
                <button
                  onClick={() => setActiveModalItem(null)}
                  style={{ background: 'none', border: 'none', fontSize: '24px', color: 'var(--text-lo)', cursor: 'pointer' }}
                >
                  &times;
                </button>
              </div>

              <p style={{ fontSize: '0.92rem', color: 'var(--text-lo)', margin: 0, lineHeight: 1.5 }}>
                {activeModalItem.desc}
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeModalItem.bullets.map((b, idx) => (
                  <li key={idx} style={{ fontSize: '0.88rem', color: 'var(--text-hi)', lineHeight: 1.4, padding: '10px 14px', background: 'var(--bg-dark)', borderRadius: '10px', border: '1px solid var(--panel-border)' }}>
                    {b}
                  </li>
                ))}
              </ul>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  className="ts-btn ts-btn-outline"
                  onClick={() => setActiveModalItem(null)}
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  Close
                </button>
                <button
                  className="ts-btn ts-btn-primary"
                  onClick={() => {
                    setActiveModalItem(null);
                    onGetStarted();
                  }}
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  Try Vault Free
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="ts-hero" style={{ padding: "100px 20px 60px" }}>
          <div className="ts-pill" style={{ pointerEvents: "auto" }}>
            <LockIcon size={14} />
            Private. Secure. Trusted.
          </div>
          <h1 className="ts-h1" style={{ textShadow: "0 4px 24px rgba(0,0,0,0.8)" }}>
            Securely store and share files with
            <br />
            <span className="ts-accent">zero-knowledge encryption.</span>
          </h1>
          <p className="ts-lead" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
            Trustme uses end-to-end client-side Fernet AES-256 encryption to keep your files private. No tracking, zero knowledge.
          </p>
          <div className="ts-actions">
            <button className="ts-btn ts-btn-primary ts-btn-lg" onClick={onGetStarted} style={{ pointerEvents: "auto" }}>
              Create Free Vault Account
            </button>
            <button className="ts-btn ts-btn-outline ts-btn-lg" onClick={onSignIn || onGetStarted} style={{ pointerEvents: "auto" }}>
              Sign In to Dashboard
            </button>
          </div>
        </section>

        {/* Metrics Bar */}
        <section className="ts-metrics-bar" style={{ background: "rgba(10, 10, 20, 0.4)", backdropFilter: "blur(10px)" }}>
          <div className="ts-metrics-inner">
            <div className="metric-item">
              <div className="metric-val">100%</div>
              <div className="metric-lbl">AES-256 Encrypted</div>
            </div>
            <div className="metric-item">
              <div className="metric-val">0 Bytes</div>
              <div className="metric-lbl">Data Logged or Sold</div>
            </div>
            <div className="metric-item">
              <div className="metric-val">250 MB</div>
              <div className="metric-lbl">Free Vault Storage</div>
            </div>
          </div>
        </section>

        {/* Features Bento */}
        <section className="ts-feature-strip" id="features" style={{ background: "transparent" }}>
          <div className="ts-section-header">
            <h2>Cryptographic Security Built In.</h2>
          </div>
          <div className="bento-grid">
            {FEATURES.map((f) => {
              const IconComp = f.icon;
              return (
                <div key={f.title} className="bento-card" style={{ background: "rgba(18, 18, 28, 0.75)", backdropFilter: "blur(12px)", pointerEvents: "auto" }}>
                  <div className="feature-icon">
                    <IconComp size={24} />
                  </div>
                  <span className="feature-title">{f.title}</span>
                  <span className="feature-text">{f.text}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="ts-footer" style={{ background: "rgba(10, 10, 20, 0.6)", backdropFilter: "blur(10px)" }}>
          <p className="footer-copy">© 2026 Trustme. End-to-end cryptographic privacy. All data is encrypted.</p>
        </footer>
      </div>
    </div>
  );
}
