import { useState } from "react";
import { supabase } from "../lib/SupabaseClient";
import { ShieldIcon, ShieldCheckIcon, EyeIcon, EyeOffIcon } from "../components/Icons";

export default function AuthPage({ onBackToLanding, initialMode = "signin" }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const isSignUp = mode === "signup";

  function getPasswordStrength(pass) {
    if (!pass) return { score: 0, label: "", color: "" };
    if (pass.length < 6) return { score: 1, label: "Weak", color: "#ef4444" };
    if (pass.length >= 6 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) {
      return { score: 3, label: "Strong", color: "#10b981" };
    }
    return { score: 2, label: "Medium", color: "#f59e0b" };
  }

  const strength = getPasswordStrength(password);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({
          type: "success",
          text: "Account created successfully! Please check your email inbox to confirm your account.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Authentication failed." });
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    if (!email) {
      setMessage({ type: "error", text: "Please enter your email address first." });
      return;
    }

    setMessage(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Magic OTP link sent! Check your email inbox." });
    }
  }

  return (
    <div className="auth-page-container">
      <div className="auth-orb orb-cyan" />
      <div className="auth-orb orb-violet" />

      <div className="auth-split-wrapper">
        {/* Left Side: Product Security Showcase */}
        <div className="auth-showcase-panel">
          <div className="showcase-brand">
            <span className="auth-shield-logo">
              <ShieldIcon size={24} color="#ffffff" />
            </span>
            <span className="auth-brand-name">
              Trust<span className="brand-accent">Share</span>
            </span>
          </div>

          <div className="showcase-content">
            <span className="showcase-pill">
              <ShieldCheckIcon size={14} /> ZERO-KNOWLEDGE ENCRYPTION
            </span>
            <h2>Encrypted File Sharing Built For Reliability</h2>
            <p>
              Join thousands of professionals exchanging confidential files with server-side AES-256 Fernet key isolation and expiring link protection.
            </p>

            <div className="showcase-features">
              <div className="showcase-feat-item">
                <span className="feat-check">✓</span> Per-file encryption key generation
              </div>
              <div className="showcase-feat-item">
                <span className="feat-check">✓</span> Self-destructing temporary access links
              </div>
              <div className="showcase-feat-item">
                <span className="feat-check">✓</span> Real-time audit activity timeline
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form Shell */}
        <div className="auth-shell">
          {onBackToLanding && (
            <button type="button" className="auth-back-btn" onClick={onBackToLanding}>
              ← Back to Overview
            </button>
          )}

          <div className="auth-card">
            <div className="card-eyebrow">SUPABASE AUTH</div>
            <h1 className="card-title">{isSignUp ? "Create Account" : "Welcome Back"}</h1>
            <p className="card-subtitle">
              {isSignUp
                ? "Enter your credentials to create an encrypted storage workspace."
                : "Sign in to access your encrypted file vault."}
            </p>

            <form onSubmit={handleSubmit} className="form">
              <label className="field">
                <span>Email Address</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="auth-input"
                />
              </label>

              <label className="field">
                <span>Password</span>
                <div className="input-icon-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="auth-input"
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
              </label>

              {/* Password Strength Meter */}
              {isSignUp && password.length > 0 && (
                <div className="strength-meter-wrap">
                  <div className="strength-meter-bar">
                    <div
                      className="strength-meter-fill"
                      style={{
                        width: `${(strength.score / 3) * 100}%`,
                        backgroundColor: strength.color,
                      }}
                    />
                  </div>
                  <span className="strength-label" style={{ color: strength.color }}>
                    Strength: {strength.label}
                  </span>
                </div>
              )}

              {message && (
                <div className={`alert alert-${message.type}`} role="status">
                  {message.text}
                </div>
              )}

              <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
                {loading ? "Authenticating…" : isSignUp ? "Create Account" : "Sign In to Vault"}
              </button>

              <button
                type="button"
                className="btn-ghost magic-link-btn"
                onClick={handleMagicLink}
                disabled={loading}
              >
                ✨ Send Magic OTP Link
              </button>
            </form>

            <div className="card-footer">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                className="link-btn toggle-mode-btn"
                onClick={() => {
                  setMode(isSignUp ? "signin" : "signup");
                  setMessage(null);
                }}
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
