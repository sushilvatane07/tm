import React, { useState } from "react";
import { ShieldIcon, ArrowRightIcon, EyeIcon, EyeOffIcon } from "../components/Icons";
import { supabase } from "../lib/SupabaseClient";
import "../styles/index.css"; // Ensure it gets base tokens

export default function AuthPage({ onBackToLanding, initialMode = "signin" }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const isSignUp = mode === "signup";

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

  return (
    <div className="auth-page-container ts-page" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '24px'
    }}>
      <div className="auth-shell" style={{ 
        maxWidth: '440px', 
        width: '100%',
        position: 'relative'
      }}>
        {onBackToLanding && (
          <button className="ts-link-btn" onClick={onBackToLanding} style={{ 
            position: 'absolute', 
            top: '-48px', 
            left: '0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <ArrowRightIcon size={14} style={{ transform: 'rotate(180deg)' }} /> Back to site
          </button>
        )}

        <div className="auth-card glass-panel" style={{ 
          padding: '48px 40px',
          borderRadius: '24px',
          background: 'var(--panel-solid)',
          border: '1px solid var(--panel-border)',
          boxShadow: 'var(--shadow-glass)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div className="auth-shield-logo" style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              marginBottom: '20px', 
              background: 'var(--text-hi)', 
              color: 'var(--bg-dark)' 
            }}>
              <ShieldIcon size={24} />
            </div>
            <h2 className="ts-h1" style={{ fontSize: '1.75rem', marginBottom: '8px' }}>
              {isSignUp ? "Create account" : "Welcome back"}
            </h2>
            <p className="ts-lead" style={{ margin: 0, fontSize: '0.95rem' }}>
              {isSignUp ? "Get started with secure file sharing" : "Sign in to access your secure vault"}
            </p>
          </div>

          {message && (
            <div className={`alert alert-${message.type}`} style={{ 
              marginBottom: '24px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
              color: message.type === 'error' ? '#ef4444' : '#15803d',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              {message.text}
            </div>
          )}

          <form className="form" onSubmit={handleSubmit}>
            <div className="field" style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '0.9rem', 
                fontWeight: '500', 
                color: 'var(--text-hi)' 
              }}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--panel-border)',
                  background: 'var(--bg-dark)',
                  color: 'var(--text-hi)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>
            
            <div className="field" style={{ marginBottom: '28px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '0.9rem', 
                fontWeight: '500', 
                color: 'var(--text-hi)' 
              }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--panel-border)',
                    background: 'var(--bg-dark)',
                    color: 'var(--text-hi)',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-lo)',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="ts-btn ts-btn-primary" disabled={loading} style={{ 
              width: '100%', 
              padding: '14px',
              justifyContent: 'center',
              fontSize: '1rem'
            }}>
              {loading ? "Authenticating..." : (isSignUp ? "Create Account" : "Sign In")}
            </button>
          </form>

          <div style={{ 
            marginTop: '32px', 
            textAlign: 'center',
            paddingTop: '24px',
            borderTop: '1px solid var(--panel-border)'
          }}>
            <p style={{ margin: 0, color: 'var(--text-lo)', fontSize: '0.95rem' }}>
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              <button 
                type="button" 
                className="ts-inline-link" 
                onClick={() => {
                  setMode(isSignUp ? "signin" : "signup");
                  setMessage(null);
                }}
                style={{ marginLeft: '6px' }}
              >
                {isSignUp ? "Log in" : "Sign up"} <ArrowRightIcon size={12} />
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
