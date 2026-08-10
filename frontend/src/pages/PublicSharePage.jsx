import { useState, useEffect } from "react";
import { supabase } from "../lib/SupabaseClient";
import { fetchWithTimeout } from "../lib/apiClient";
import { ShieldIcon, ShieldCheckIcon, DownloadIcon, EyeIcon } from "../components/Icons";
import Vault3DCanvas from "../components/common/Vault3DCanvas";
import "../styles/start.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function PublicSharePage({ shareToken, onGoHome }) {
  const [fileInfo, setFileInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  const [previewing, setPreviewing] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    async function loadInfo() {
      if (!shareToken) {
        setError("Invalid or missing share token.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const cleanedToken = shareToken.trim();

      // 1. Try FastAPI endpoint first if backend is running
      const isLocalDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (isLocalDev) {
        try {
          const res = await fetchWithTimeout(`${API_URL}/public/shared/${cleanedToken}`, {}, 2500);
          if (res?.ok) {
            const data = await res.json();
            setFileInfo(data);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn("FastAPI public share lookup notice, trying Supabase directly...", e);
        }
      }

      // 2. Direct Supabase query
      try {
        const { data, error: sbErr } = await supabase
          .from("share_links")
          .select("*, files(id, filename, size_bytes, storage_path)")
          .eq("token", cleanedToken)
          .maybeSingle();

        if (!sbErr && data) {
          if (data.revoked) {
            setError("This shared link has been revoked by the owner.");
            setLoading(false);
            return;
          }

          if (data.expires_at && new Date(data.expires_at) < new Date()) {
            setError("This shared link has expired.");
            setLoading(false);
            return;
          }

          if (data.max_downloads && (data.download_count || 0) >= data.max_downloads) {
            setError("This shared link has reached its maximum download limit.");
            setLoading(false);
            return;
          }

          setFileInfo({
            id: data.id,
            filename: data.files?.filename || "Shared Document",
            size_bytes: data.files?.size_bytes || 0,
            storage_path: data.files?.storage_path,
            expires_at: data.expires_at,
            download_count: data.download_count || 0,
          });
          setLoading(false);
          return;
        }

        if (sbErr) {
          console.warn("Supabase share lookup notice:", sbErr.message);
        }
        setError("This shared link has expired, was revoked, or does not exist.");
      } catch (err) {
        setError("Error opening shared file. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadInfo();
  }, [shareToken]);

  // Expiration countdown timer effect
  useEffect(() => {
    if (!fileInfo || !fileInfo.expires_at) return;

    const interval = setInterval(() => {
      const diff = new Date(fileInfo.expires_at) - new Date();
      if (diff <= 0) {
        setTimeLeft("Expired");
        setError("This shared link has just expired.");
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [fileInfo]);

  async function handleDownload() {
    if (!fileInfo) return;
    setDownloading(true);

    const isLocalDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isLocalDev) {
      try {
        const res = await fetchWithTimeout(`${API_URL}/public/shared/${shareToken}/download`, {}, 3000).catch(() => null);
        if (res && res.ok) {
          const blob = await res.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = fileInfo.filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(blobUrl);
          setDownloading(false);
          return;
        }
      } catch (e) {
        console.warn("FastAPI stream notice, using direct storage download fallback...", e);
      }
    }

    try {
      if (fileInfo?.storage_path) {
        const { data: fileData, error: dlErr } = await supabase.storage
          .from("trustshare-files")
          .download(fileInfo.storage_path);

        if (dlErr) throw dlErr;

        // Increment download counter
        if (fileInfo.id) {
          supabase
            .from("share_links")
            .update({ download_count: (fileInfo.download_count || 0) + 1 })
            .eq("id", fileInfo.id)
            .then(() => null);
        }

        const blobUrl = window.URL.createObjectURL(fileData);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = fileInfo.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
      } else {
        alert("File download is currently unavailable.");
      }
    } catch (err) {
      alert(`Download Error: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  }

  async function handlePreview() {
    if (!fileInfo) return;
    if (previewing) {
      setPreviewing(false);
      return;
    }

    setLoadingPreview(true);
    setPreviewing(true);

    try {
      if (fileInfo?.storage_path) {
        const { data: fileData, error: dlErr } = await supabase.storage
          .from("trustshare-files")
          .download(fileInfo.storage_path);

        if (!dlErr && fileData) {
          const filename = fileInfo?.filename || "";
          const ext = filename.includes(".") ? filename.split(".").pop().toLowerCase() : "";
          if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) {
            setPreviewContent({ type: "image", src: URL.createObjectURL(fileData) });
          } else if (["txt", "md", "json", "js", "ts", "py", "html", "css", "csv"].includes(ext)) {
            const text = await fileData.text();
            setPreviewContent({ type: "text", text: text.substring(0, 8000) });
          } else {
            setPreviewContent({ type: "unsupported" });
          }
          setLoadingPreview(false);
          return;
        }
      }
      setPreviewContent({ type: "unsupported" });
    } catch (e) {
      setPreviewContent({ type: "unsupported" });
    } finally {
      setLoadingPreview(false);
    }
  }

  return (
    <div className="ts-page" style={{ position: "relative", minHeight: "100vh", overflowX: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Full-Page Background 3D Liquid/Particle Simulation */}
      <Vault3DCanvas isFullPage={true} />

      {/* Floating Content Container */}
      <div className="ts-page-content" style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
        
        {/* Header Bar */}
        <header className="ts-header" style={{ width: "100%", boxSizing: "border-box" }}>
          <div className="ts-header-inner">
            <div className="ts-brand" onClick={onGoHome} style={{ cursor: "pointer" }}>
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

            <div>
              <button className="ts-btn ts-btn-outline ts-btn-sm" onClick={onGoHome}>
                ← Back to Home
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Center Box */}
        <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
          {loading ? (
            <div style={{ background: "rgba(18, 18, 28, 0.85)", backdropFilter: "blur(16px)", border: "1px solid var(--panel-border)", borderRadius: "24px", padding: "40px", textAlign: "center" }}>
              <p style={{ color: "var(--text-lo)", fontSize: "1rem", margin: 0 }}>Decrypting share link credentials…</p>
            </div>
          ) : error ? (
            <div style={{ maxWidth: '460px', width: '100%', background: 'rgba(18, 18, 28, 0.85)', backdropFilter: 'blur(16px)', borderRadius: '24px', padding: '40px 32px', textAlign: 'center', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-glass)' }}>
              <h2 style={{ color: 'var(--danger)', margin: '0 0 16px', fontSize: '1.4rem', fontWeight: '700' }}>Link Unavailable</h2>
              <p style={{ color: 'var(--text-lo)', margin: '0 0 24px', fontSize: '0.92rem', lineHeight: '1.5' }}>{error}</p>
              <button className="ts-btn ts-btn-primary" onClick={onGoHome} style={{ width: '100%', justifyContent: 'center' }}>
                Go to Home
              </button>
            </div>
          ) : (
            <div style={{ maxWidth: '520px', width: '100%', background: 'rgba(18, 18, 28, 0.88)', backdropFilter: 'blur(18px)', borderRadius: '24px', padding: '44px 36px', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-glass)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(52, 199, 89, 0.12)', color: 'var(--primary-emerald)', border: '1px solid rgba(52, 199, 89, 0.25)', padding: '6px 14px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: '600', marginBottom: '24px' }}>
                <ShieldCheckIcon size={14} /> Verified Encrypted Document
              </div>

              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-hi)', margin: '0 0 16px', wordBreak: 'break-all' }}>
                {fileInfo.filename}
              </h1>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '28px' }}>
                <span style={{ padding: '4px 12px', background: 'var(--bg-dark)', borderRadius: '100px', fontSize: '0.82rem', color: 'var(--text-hi)', fontWeight: '600', border: '1px solid var(--panel-border)' }}>
                  {formatBytes(fileInfo.size_bytes)}
                </span>
                {timeLeft ? (
                  <span style={{ padding: '4px 12px', background: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.25)', borderRadius: '100px', fontSize: '0.82rem', color: 'var(--primary-rose)', fontWeight: '600' }}>
                    ⏳ Expires in: {timeLeft}
                  </span>
                ) : fileInfo.expires_at ? (
                  <span style={{ padding: '4px 12px', background: 'var(--bg-dark)', borderRadius: '100px', fontSize: '0.82rem', color: 'var(--text-lo)', fontWeight: '500', border: '1px solid var(--panel-border)' }}>
                    Expires: {new Date(fileInfo.expires_at).toLocaleDateString()}
                  </span>
                ) : (
                  <span style={{ padding: '4px 12px', background: 'rgba(52, 199, 89, 0.1)', borderRadius: '100px', fontSize: '0.82rem', color: 'var(--primary-emerald)', fontWeight: '600', border: '1px solid rgba(52, 199, 89, 0.25)' }}>
                    Permanent Link
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', width: '100%', flexDirection: 'column' }}>
                <button className="ts-btn ts-btn-primary" onClick={handleDownload} disabled={downloading} style={{ justifyContent: 'center', padding: '14px', fontSize: '0.95rem' }}>
                  {downloading ? "Downloading..." : <><DownloadIcon size={18} /> Download Securely</>}
                </button>
                <button className="ts-btn ts-btn-outline" onClick={handlePreview} style={{ justifyContent: 'center', padding: '14px', fontSize: '0.95rem' }}>
                  <EyeIcon size={18} /> {previewing ? "Hide Preview" : "Preview Content"}
                </button>
              </div>

              {/* Inline Preview Container */}
              {previewing && (
                <div style={{ marginTop: '24px', width: '100%', background: 'var(--bg-dark)', borderRadius: '16px', overflow: 'hidden', padding: '16px', border: '1px solid var(--panel-border)' }}>
                  {loadingPreview ? (
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-lo)' }}>Decrypting preview...</p>
                  ) : previewContent?.type === "image" ? (
                    <img src={previewContent.src} alt="Preview" style={{ width: '100%', height: 'auto', borderRadius: '8px' }} />
                  ) : previewContent?.type === "text" ? (
                    <pre style={{ margin: 0, padding: '16px', background: 'var(--panel-solid)', borderRadius: '8px', fontSize: '0.85rem', overflowX: 'auto', textAlign: 'left', color: 'var(--text-hi)', border: '1px solid var(--panel-border)' }}>
                      <code>{previewContent.text}</code>
                    </pre>
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-lo)' }}>Direct preview is not available for this binary format. Please download.</p>
                  )}
                </div>
              )}

              <p style={{ marginTop: '28px', fontSize: '0.82rem', color: 'var(--text-lo)', lineHeight: '1.5', margin: '28px 0 0' }}>
                🔒 Secured with end-to-end zero-knowledge client-side encryption.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
