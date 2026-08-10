import { useState, useEffect } from "react";
import { supabase } from "../lib/SupabaseClient";
import { ShieldCheckIcon, DownloadIcon, EyeIcon } from "../components/Icons";
import "../styles/dashboard.css";

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

      // FastAPI backend — uses service_role key, bypasses RLS, correct table name
      try {
        const res = await fetch(`${API_URL}/public/shared/${cleanedToken}`);
        if (res.ok) {
          const data = await res.json();
          setFileInfo(data);
          setLoading(false);
          return;
        }
        // Handle known error codes gracefully
        if (res.status === 404) {
          setError("This shared link has expired, was revoked, or does not exist.");
        } else if (res.status === 410) {
          const body = await res.json().catch(() => ({}));
          setError(body.detail || "This shared link is no longer accessible.");
        } else {
          const body = await res.json().catch(() => ({}));
          setError(body.detail || `Error loading shared file (${res.status}).`);
        }
      } catch (e) {
        setError("Unable to reach server. Make sure the backend is running.");
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

    // 1. Try FastAPI stream download (performs server-side AES-256 decryption)
    try {
      const res = await fetch(`${API_URL}/public/shared/${shareToken}/download`).catch(() => null);
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
      console.log("FastAPI stream notice, using direct storage download fallback...", e);
    }

    // 2. Direct Supabase storage download fallback
    try {
      if (fileInfo?.storage_path) {
        const { data: fileData, error: dlErr } = await supabase.storage
          .from("trustshare-files")
          .download(fileInfo.storage_path);

        if (dlErr) throw dlErr;

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
      const res = await fetch(`${API_URL}/public/shared/${shareToken}/download`).catch(() => null);
      if (res && res.ok) {
        const blob = await res.blob();
        const filename = fileInfo?.filename || "";
        const ext = filename.includes(".") ? filename.split(".").pop().toLowerCase() : "";
        if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) {
          setPreviewContent({ type: "image", src: URL.createObjectURL(blob) });
        } else if (["txt", "md", "json", "js", "ts", "py", "html", "css", "csv"].includes(ext)) {
          const text = await blob.text();
          setPreviewContent({ type: "text", text: text.substring(0, 8000) });
        } else {
          setPreviewContent({ type: "unsupported" });
        }
      } else {
        setPreviewContent({ type: "unsupported" });
      }
    } catch (e) {
      setPreviewContent({ type: "unsupported" });
    } finally {
      setLoadingPreview(false);
    }
  }

  if (loading) {
    return (
      <div className="public-share-page">
        <div className="public-share-container">
          <div className="loader" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-share-page">
        <div className="public-share-container">
          <div className="public-share-card">
            <h2 style={{ color: "#ef4444" }}>Unavailable Share Link</h2>
            <p style={{ color: "#94a3b8", margin: "16px 0 24px", fontSize: "15px" }}>{error}</p>
            <button className="btn-primary" onClick={onGoHome}>Go to Home</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-share-page">
      <div className="public-share-container">
        <div className="public-share-card">
          <div className="share-security-badge">
            <ShieldCheckIcon size={18} /> Verified Encrypted Document
          </div>

          <div className="file-icon-large">📄</div>
          <h1 className="shared-filename">{fileInfo.filename}</h1>

          <div className="file-meta-row flex-center flex-wrap">
            <span className="meta-pill">{formatBytes(fileInfo.size_bytes)}</span>
            {timeLeft ? (
              <span className="meta-pill expiry">⏳ Expires in: {timeLeft}</span>
            ) : fileInfo.expires_at ? (
              <span className="meta-pill expiry">Expires: {new Date(fileInfo.expires_at).toLocaleDateString()}</span>
            ) : (
              <span className="meta-pill permanent-pill">Permanent Link</span>
            )}
          </div>

          <div className="share-actions-row flex-center">
            <button className="btn-outline preview-btn" onClick={handlePreview}>
              <EyeIcon size={18} /> {previewing ? "Hide Preview" : "Preview Content"}
            </button>
            <button className="btn-primary download-btn" onClick={handleDownload} disabled={downloading}>
              {downloading ? "Downloading File…" : <><DownloadIcon size={18} /> Download Decrypted File</>}
            </button>
          </div>

          {/* Inline Preview Container */}
          {previewing && (
            <div className="inline-preview-box">
              {loadingPreview ? (
                <div className="preview-loader-box">
                  <div className="loader" />
                  <p>Decrypting stream for preview…</p>
                </div>
              ) : previewContent?.type === "image" ? (
                <img src={previewContent.src} alt="Preview" className="preview-img-inline" />
              ) : previewContent?.type === "text" ? (
                <pre className="preview-code-block"><code>{previewContent.text}</code></pre>
              ) : (
                <p className="preview-unsupported">Direct preview is not available for this binary format. Click Download Decrypted File.</p>
              )}
            </div>
          )}

          <p className="decrypt-info">
            🔒 Secured with server-side Fernet AES-256 encryption. Payload is decrypted in-memory during stream transfer.
          </p>

          <div style={{ marginTop: "16px" }}>
            <button className="ts-inline-link" onClick={onGoHome}>
              ← Return to TrustShare Overview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
