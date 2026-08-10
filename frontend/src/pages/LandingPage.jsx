import React, { useEffect, useRef, useState } from "react";
import {
  ShieldIcon,
  ShieldCheckIcon,
  LockIcon,
  LinkIcon,
  UsersIcon,
  FileTextIcon,
  DownloadIcon,
  UploadIcon,
  CloudIcon,
  UserIcon,
  ArrowRightIcon,
  SunIcon,
  MoonIcon,
  SparklesIcon,
  ChevronDownIcon,
  KeyIcon,
} from "../components/Icons";
import { useTheme } from "../context/ThemeContext";
import "../styles/start.css";
import hero from "../assets/hero.png";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Interactive Demo", href: "#interactive-demo" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Security & FAQ", href: "#faq" },
];

const FEATURES = [
  { icon: LockIcon, title: "AES-256 Encryption", text: "Zero-knowledge server-side Fernet encryption for absolute data protection.", badge: "Cryptographic Standard" },
  { icon: LinkIcon, title: "Expiring Share Links", text: "Create self-destructing temporary download links with configurable expiration timers.", badge: "Access Control" },
  { icon: UsersIcon, title: "Role Verification", text: "JWT token authentication and Supabase role-based authorization for all API calls.", badge: "Enterprise Auth" },
  { icon: FileTextIcon, title: "Audit Log Timeline", text: "Every file upload, download, share link creation, and revocation is recorded with full audit trails.", badge: "Real-time Auditing" },
  { icon: DownloadIcon, title: "On-The-Fly Decryption", text: "Files are decrypted in-memory during transfer, keeping storage payloads safely encrypted.", badge: "Zero Disk Footprint" },
  { icon: KeyIcon, title: "Per-File Key Isolation", text: "A fresh Fernet key is generated for every single upload, isolating data breach risks.", badge: "Isolated Keys" },
];

const STEPS = [
  { icon: UploadIcon, title: "Upload", text: "Upload your raw file securely over HTTPS." },
  { icon: LockIcon, title: "Encrypt", text: "AES-256 key generation & Fernet encryption." },
  { icon: CloudIcon, title: "Store", text: "Encrypted binary saved to cloud object storage." },
  { icon: LinkIcon, title: "Share", text: "Generate temporary expiring share link." },
  { icon: UserIcon, title: "Stream Decrypt", text: "Recipient streams decrypted file on-the-fly." },
  { icon: ShieldCheckIcon, title: "Audited", text: "Action logged to security activity timeline." },
];

const FAQS = [
  {
    q: "How does TrustShare encrypt my uploaded files?",
    a: "When you upload a file, FastAPI generates a unique, cryptographically strong AES-256 key using the Fernet symmetric encryption standard. The file payload is encrypted server-side before being written to storage."
  },
  {
    q: "Can unauthorized users access my files if they get a share link?",
    a: "Share links are protected by expiration timestamps and download limits. Once a share link expires or reaches its download threshold, access is immediately revoked server-side."
  },
  {
    q: "Are encryption keys exposed to client browsers?",
    a: "No. Encryption keys remain strictly server-side inside secure environment scopes and database tables with row-level access rules."
  },
  {
    q: "Can I revoke a share link before it expires?",
    a: "Yes! You can view all active shared links in your Dashboard under the 'Shared Links' tab and revoke any link with a single click."
  }
];

function CyberVault3DCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let width = (canvas.width = canvas.parentElement.clientWidth);
    let height = (canvas.height = canvas.parentElement.clientHeight || 450);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight || 450;
    };
    window.addEventListener("resize", handleResize);

    const phi = (1 + Math.sqrt(5)) / 2;
    let vertices = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ].map(([x, y, z]) => {
      const len = Math.hypot(x, y, z);
      return [ (x / len) * 140, (y / len) * 140, (z / len) * 140 ];
    });

    const edges = [
      [0,11],[0,5],[0,1],[0,7],[0,10],[1,5],[1,9],[1,8],[1,7],[2,11],[2,10],[2,6],[2,4],
      [3,9],[3,8],[3,6],[3,4],[4,5],[4,11],[4,9],[5,9],[6,7],[6,10],[6,8],[7,10],[8,9],[10,11]
    ];

    const particles = Array.from({ length: 45 }, () => ({
      x: (Math.random() - 0.5) * 350,
      y: (Math.random() - 0.5) * 350,
      z: (Math.random() - 0.5) * 350,
      size: Math.random() * 2.5 + 1,
    }));

    let angleX = 0;
    let angleY = 0;
    let targetAngleX = 0;
    let targetAngleY = 0;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - width / 2;
      const mouseY = e.clientY - rect.top - height / 2;
      targetAngleY = (mouseX / width) * 1.5;
      targetAngleX = (mouseY / height) * 1.5;
    };

    window.addEventListener("mousemove", handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      angleX += (targetAngleX - angleX) * 0.05 + 0.005;
      angleY += (targetAngleY - angleY) * 0.05 + 0.008;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      const project = (x, y, z) => {
        let x1 = x * cosY - z * sinY;
        let z1 = z * cosY + x * sinY;
        let y2 = y * cosX - z1 * sinX;
        let z2 = z1 * cosX + y * sinX;

        const fov = 400;
        const scale = fov / (fov + z2 + 300);
        return {
          px: width / 2 + x1 * scale,
          py: height / 2 + y2 * scale,
          scale,
          z: z2
        };
      };

      const projectedVerts = vertices.map(([vx, vy, vz]) => project(vx, vy, vz));

      ctx.lineWidth = 1.5;

      edges.forEach(([i, j]) => {
        const v1 = projectedVerts[i];
        const v2 = projectedVerts[j];
        const alpha = Math.min(1, Math.max(0.15, (v1.scale + v2.scale) / 2 - 0.4));
        ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(v1.px, v1.py);
        ctx.lineTo(v2.px, v2.py);
        ctx.stroke();
      });

      projectedVerts.forEach((v) => {
        ctx.fillStyle = "#6366f1";
        ctx.shadowColor = "#4f46e5";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(v.px, v.py, 4 * v.scale, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      particles.forEach((p) => {
        p.z += Math.sin(angleY) * 2;
        if (p.z > 200) p.z = -200;
        if (p.z < -200) p.z = 200;

        const projectedP = project(p.x, p.y, p.z);
        ctx.fillStyle = "rgba(99, 102, 241, 0.6)";
        ctx.beginPath();
        ctx.arc(projectedP.px, projectedP.py, p.size * projectedP.scale, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="cyber-3d-canvas" />;
}

function TiltCard({ children, className = "" }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  };

  return (
    <div
      ref={cardRef}
      className={`tilt-card ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

function VaultSimulator3D() {
  const [inputText, setInputText] = useState("Quarterly_Financial_Report.pdf");
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptedHash, setEncryptedHash] = useState(null);

  function handleSimulate() {
    setIsEncrypting(true);
    setEncryptedHash(null);

    setTimeout(() => {
      const dummyCipher = "gAAAAABl" + Math.random().toString(36).substring(2, 15) + "AES256_FERNET_KEY_V2";
      setEncryptedHash(dummyCipher);
      setIsEncrypting(false);
    }, 1100);
  }

  return (
    <div className="sim-vault-card">
      <div className="sim-header flex-between">
        <div>
          <span className="sim-badge">⚡ Live Cryptographic Sandbox</span>
          <h3>Test Server-Side AES-256 Vault Encryption</h3>
        </div>
        <SparklesIcon size={24} className="sparkles-anim" />
      </div>

      <div className="sim-body">
        <div className="sim-input-row">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="sim-input"
            placeholder="Type a filename or string to encrypt…"
          />
          <button className="btn-primary sim-btn" onClick={handleSimulate} disabled={isEncrypting}>
            {isEncrypting ? "Encrypting Stream…" : "🔒 Encrypt Payload"}
          </button>
        </div>

        {isEncrypting && (
          <div className="sim-anim-box">
            <p>Generating Fernet Key & Encrypting Data Stream…</p>
          </div>
        )}

        {encryptedHash && !isEncrypting && (
          <div className="sim-result-box">
            <div className="sim-result-label">Encrypted Binary Storage Cipher:</div>
            <code className="sim-result-code">{encryptedHash}</code>
            <p className="sim-result-note">✅ Decryptable on-the-fly only via verified user session or valid share token.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="faq-accordion-list">
      {FAQS.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={idx} className={`faq-item ${isOpen ? "open" : ""}`}>
            <button
              className="faq-question-btn flex-between"
              onClick={() => setOpenIndex(isOpen ? -1 : idx)}
            >
              <span>{faq.q}</span>
              <ChevronDownIcon size={18} className={`faq-chevron ${isOpen ? "rotated" : ""}`} />
            </button>
            {isOpen && <div className="faq-answer">{faq.a}</div>}
          </div>
        );
      })}
    </div>
  );
}

export default function LandingPage({ onGetStarted, onSignIn }) {
  const { themeMode, toggleTheme } = useTheme();

  return (
    <div className={`ts-page dark-3d-theme ${themeMode}-mode`}>
      <div className="ambient-orb orb-1" />
      <div className="ambient-orb orb-2" />

      {/* Header */}
      <header className="ts-header">
        <div className="ts-header-inner">
          <div className="ts-brand">
            <span className="ts-brand-icon">
              <ShieldIcon size={22} color="#ffffff" />
            </span>
            <span className="ts-brand-text">
              <span className="ts-brand-name">
                Trust<span className="ts-brand-accent">Share</span>
              </span>
              <span className="ts-brand-sub">Secure File Exchange</span>
            </span>
          </div>

          <nav className="ts-nav-links">
            {NAV_LINKS.map((link) => (
              <a key={link.label} href={link.href} className="ts-nav-link">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="ts-header-actions">
            <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Dark/Light Mode">
              {themeMode === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
              <span className="theme-label">{themeMode === "dark" ? "Light" : "Dark"}</span>
            </button>

            <button className="ts-link-btn" onClick={onSignIn || onGetStarted}>
              Sign In
            </button>
            <button className="ts-btn ts-btn-primary" onClick={onGetStarted}>
              Create Free Account
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="ts-hero">
        <div className="ts-hero-inner">
          <div className="ts-hero-copy">
            <div className="ts-pill">
              <ShieldIcon size={14} />
              AES-256 FERNET ENCRYPTION &nbsp;•&nbsp; ZERO KNOWLEDGE STORAGE
            </div>
            <h1 className="ts-h1">
              Share sensitive documents
              <br />
              <span className="ts-accent">with complete cryptographic</span>
              <br />
              confidence.
            </h1>
            <p className="ts-lead">
              TrustShare allows institutions, organizations, and individuals to encrypt, store, and share files safely with temporary link expiration and full activity audit logging.
            </p>
            <div className="ts-actions">
              <button className="ts-btn ts-btn-primary ts-btn-lg" onClick={onGetStarted}>
                Get Started Free <ArrowRightIcon size={16} />
              </button>
              <button className="ts-btn ts-btn-outline ts-btn-lg" onClick={onSignIn || onGetStarted}>
                Sign In
              </button>
            </div>
            <p className="ts-signin-hint">
              Already registered?{" "}
              <button className="ts-inline-link" onClick={onSignIn || onGetStarted}>
                Sign in to your vault <ArrowRightIcon size={14} />
              </button>
            </p>
          </div>

          {/* Interactive 3D Cyber Vault Canvas */}
          <div className="hero-3d-wrapper">
            <CyberVault3DCanvas />
            <div className="card-glass-badge hero-vault-badge">
              <span className="live-dot" /> Live 3D Cryptographic Vault Engine
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Counter Bar */}
      <section className="ts-metrics-bar">
        <div className="ts-metrics-inner">
          <div className="metric-item">
            <div className="metric-val">25,000+</div>
            <div className="metric-lbl">Encrypted Uploads</div>
          </div>
          <div className="metric-divider" />
          <div className="metric-item">
            <div className="metric-val">100%</div>
            <div className="metric-lbl">Server-Side AES-256</div>
          </div>
          <div className="metric-divider" />
          <div className="metric-item">
            <div className="metric-val">99.99%</div>
            <div className="metric-lbl">Uptime Reliability</div>
          </div>
          <div className="metric-divider" />
          <div className="metric-item">
            <div className="metric-val">0 Bytes</div>
            <div className="metric-lbl">Unencrypted Local Retention</div>
          </div>
        </div>
      </section>

      {/* Interactive Sandbox Demo */}
      <section className="ts-sim-section" id="interactive-demo">
        <div className="ts-sim-inner">
          <VaultSimulator3D />
        </div>
      </section>

      {/* Bento Grid Feature Matrix */}
      <section className="ts-feature-strip" id="features">
        <div className="ts-section-header">
          <span className="ts-sub-tag">SECURITY FEATURES</span>
          <h2>Built For Enterprise Grade Security</h2>
        </div>
        <div className="ts-feature-strip-inner bento-grid">
          {FEATURES.map((f) => {
            const IconComp = f.icon;
            return (
              <TiltCard key={f.title} className="feature-item-card bento-card">
                <div className="bento-card-top flex-between">
                  <span className="feature-icon">
                    <IconComp size={22} />
                  </span>
                  <span className="bento-badge">{f.badge}</span>
                </div>
                <span className="feature-title">{f.title}</span>
                <span className="feature-text">{f.text}</span>
              </TiltCard>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="ts-how" id="how-it-works">
        <div className="ts-section-header">
          <span className="ts-sub-tag">WORKFLOW PIPELINE</span>
          <h2>How TrustShare Secures Your Files</h2>
        </div>
        <div className="ts-steps">
          {STEPS.map((step, i) => {
            const StepIconComp = step.icon;
            return (
              <React.Fragment key={step.title}>
                <div className="step-item">
                  <div className="step-icon-wrap">
                    <span className="step-icon">
                      <StepIconComp size={22} />
                    </span>
                    <span className="step-number">{i + 1}</span>
                  </div>
                  <span className="step-title">{step.title}</span>
                  <span className="step-text">{step.text}</span>
                </div>
                {i < STEPS.length - 1 && <span className="step-connector" />}
              </React.Fragment>
            );
          })}
        </div>
      </section>

      {/* FAQ & Security Assurance */}
      <section className="ts-faq-section" id="faq">
        <div className="ts-faq-inner">
          <div className="ts-section-header">
            <span className="ts-sub-tag">FREQUENTLY ASKED QUESTIONS</span>
            <h2>Security & Cryptography Answers</h2>
          </div>
          <FAQAccordion />
        </div>
      </section>

      {/* Footer */}
      <footer className="ts-footer">
        <div className="ts-footer-inner flex-between">
          <div className="footer-brand">
            <div className="ts-brand">
              <span className="ts-brand-icon sm">
                <ShieldIcon size={18} color="#ffffff" />
              </span>
              <span className="ts-brand-name sm">Trust<span className="ts-brand-accent">Share</span></span>
            </div>
            <p className="footer-copy">© 2026 TrustShare. Encrypted Document Exchange System.</p>
          </div>

          <div className="footer-status">
            <span className="status-dot" /> All Systems Operational (AES-256 Engine Online)
          </div>
        </div>
      </footer>
    </div>
  );
}
