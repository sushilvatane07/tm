import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../lib/SupabaseClient";
import { fetchWithTimeout } from "../lib/apiClient";

import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";
import MobileNav from "../components/common/MobileNav";
import Toast from "../components/common/Toast";
import ShareModal from "../components/common/ShareModal";
import FilePreviewModal from "../components/common/FilePreviewModal";

import OverviewTab from "../components/dashboard/OverviewTab";
import MyFilesTab from "../components/dashboard/MyFilesTab";
import SharedLinksTab from "../components/dashboard/SharedLinksTab";
import ActivityLogsTab from "../components/dashboard/ActivityLogsTab";
import SettingsTab from "../components/dashboard/SettingsTab";
import ProfileTab from "../components/dashboard/ProfileTab";

import "../styles/dashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function DashboardPage({ activeTab = "files", onTabChange }) {
  const { session, user } = useAuth();
  const { themeMode } = useTheme();

  const [files, setFiles] = useState([]);
  const [shareLinks, setShareLinks] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [sharingFile, setSharingFile] = useState(null);
  const [previewingFile, setPreviewingFile] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  function showToast(text, type = "info") {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  }

  // Fetch files — runs once per userId (stable string dep, not object)
  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;
    let cancelled = false;

    async function fetchUserFiles() {
      // On production (GitHub Pages), FastAPI is not running — go direct to Supabase
      const isLocalDev = window.location.hostname === "localhost";

      if (isLocalDev) {
        try {
          const res = await fetchWithTimeout(`${API_URL}/files`, {
            headers: { Authorization: `Bearer ${session?.access_token}` },
          }, 3000);
          if (res?.ok && !cancelled) {
            const data = await res.json();
            if (Array.isArray(data)) { setFiles(data); return; }
          }
        } catch (err) {
          console.warn("FastAPI /files unavailable, using Supabase directly");
        }
      }

      // Direct Supabase query — works on GitHub Pages
      try {
        const { data, error } = await supabase
          .from("files")
          .select("*")
          .eq("owner_id", userId)
          .order("created_at", { ascending: false });

        if (!error && !cancelled) {
          setFiles((data || []).filter((f) => !f.is_deleted));
        } else if (error) {
          console.error("Files fetch error:", error.message);
        }
      } catch (err) {
        console.error("Supabase files fetch error:", err);
      }
    }

    fetchUserFiles();
    return () => { cancelled = true; };
  }, [user?.id]); // user?.id is a stable string — safe dep

  // File Upload Handler
  async function handleUpload(selectedFile) {
    if (!selectedFile || !user?.id) return;
    setUploading(true);
    setUploadError(null);

    const isLocalDev = window.location.hostname === "localhost";

    // Only try FastAPI when running locally
    if (isLocalDev) {
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const response = await fetchWithTimeout(`${API_URL}/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${session?.access_token}` },
          body: formData,
        }, 5000);
        if (response?.ok) {
          const result = await response.json();
          setFiles((prev) => [{ id: result.file_id, filename: selectedFile.name, size_bytes: selectedFile.size, created_at: new Date().toISOString() }, ...prev]);
          showToast(`"${selectedFile.name}" encrypted and uploaded!`, "success");
          setUploading(false);
          return;
        }
      } catch (err) {
        console.warn("FastAPI upload unavailable, using Supabase storage directly");
      }
    }

    // Direct Supabase Storage upload (works on GitHub Pages)
    try {
      const storagePath = `${user.id}/${Date.now()}_${selectedFile.name}`;

      const { error: storageErr } = await supabase.storage
        .from("trustshare-files")
        .upload(storagePath, selectedFile, { upsert: true });

      if (storageErr) throw storageErr;

      const { data: dbData, error: dbErr } = await supabase
        .from("files")
        .insert([{
          owner_id: user.id,
          filename: selectedFile.name,
          size_bytes: selectedFile.size,
          storage_path: storagePath,
          encryption_key: "AES256_CLIENT",
          is_deleted: false,
        }])
        .select();

      if (dbErr) throw dbErr;

      const inserted = dbData?.[0] || { filename: selectedFile.name, size_bytes: selectedFile.size, created_at: new Date().toISOString() };
      setFiles((prev) => [inserted, ...prev]);
      showToast(`"${selectedFile.name}" uploaded to vault!`, "success");
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Upload failed.");
      showToast(`Upload error: ${err.message}`, "error");
    } finally {
      setUploading(false);
    }
  }

  // File Download Handler
  async function handleDownload(file) {
    try {
      setDownloadingId(file.id);

      // 1. Try FastAPI stream endpoint first
      const res = await fetchWithTimeout(`${API_URL}/download/${file.id}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      }, 5000);

      if (res && res.ok) {
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = file.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
        showToast(`Downloaded decrypted "${file.filename}"`, "info");
        setDownloadingId(null);
        return;
      }

      // 2. Direct Supabase Storage Download Fallback
      if (file.storage_path) {
        const { data: fileBlob, error: dlErr } = await supabase.storage
          .from("trustshare-files")
          .download(file.storage_path);

        if (dlErr) throw dlErr;

        const blobUrl = window.URL.createObjectURL(fileBlob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = file.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
        showToast(`Downloaded "${file.filename}" from vault`, "info");
      } else {
        throw new Error("File storage path unavailable");
      }
    } catch (err) {
      showToast(`Download error: ${err.message}`, "error");
    } finally {
      setDownloadingId(null);
    }
  }

  // Single File Delete Handler
  async function handleDelete(file) {
    if (!confirm(`Are you sure you want to delete "${file.filename}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(file.id);

      // 1. Try FastAPI delete
      const res = await fetchWithTimeout(`${API_URL}/files/${file.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.access_token}` },
      }, 3000);

      // 2. Direct Supabase Delete Fallback
      if (file.storage_path) {
        await supabase.storage.from("trustshare-files").remove([file.storage_path]).catch(() => null);
      }
      await supabase.from("share_links").delete().eq("file_id", file.id).catch(() => null);
      await supabase.from("files").delete().eq("id", file.id).catch(() => null);

      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      showToast(`Deleted "${file.filename}"`, "warn");
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, "error");
    } finally {
      setDeletingId(null);
    }
  }

  // Batch Delete Handler
  async function handleBatchDelete(fileIds = []) {
    if (!confirm(`Are you sure you want to delete ${fileIds.length} selected files?`)) {
      return;
    }

    for (const id of fileIds) {
      const file = files.find((f) => f.id === id);
      if (file?.storage_path) {
        await supabase.storage.from("trustshare-files").remove([file.storage_path]).catch(() => null);
      }
      await supabase.from("share_links").delete().eq("file_id", id).catch(() => null);
      await supabase.from("files").delete().eq("id", id).catch(() => null);
    }

    setFiles((prev) => prev.filter((f) => !fileIds.includes(f.id)));
    showToast(`Deleted ${fileIds.length} selected files`, "warn");
  }

  const totalStorageBytes = files.reduce((acc, f) => acc + (f.size_bytes || 0), 0);

  return (
    <div className={`dash ${themeMode}-mode`}>
      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage.text}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={onTabChange}
        onToggleMobileNav={() => setMobileNavOpen(true)}
      />

      {/* Mobile Drawer Overlay */}
      <MobileNav
        activeTab={activeTab}
        onTabChange={onTabChange}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      <div className="dash-body">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          totalStorageBytes={totalStorageBytes}
          filesCount={files.length}
        />

        {/* Main Content Workspace */}
        <main className="dash-main">
          {activeTab === "overview" && (
            <OverviewTab
              files={files}
              shareLinks={shareLinks}
              totalStorageBytes={totalStorageBytes}
              onUploadFile={handleUpload}
              onShareClick={(f) => setSharingFile(f)}
              onPreviewFile={(f) => setPreviewingFile(f)}
              onDownloadFile={handleDownload}
              onTabChange={onTabChange}
              uploading={uploading}
              uploadError={uploadError}
            />
          )}

          {activeTab === "files" && (
            <MyFilesTab
              files={files}
              onUploadFile={handleUpload}
              onShareClick={(f) => setSharingFile(f)}
              onPreviewFile={(f) => setPreviewingFile(f)}
              onDownloadFile={handleDownload}
              onDeleteFile={handleDelete}
              onBatchDeleteFiles={handleBatchDelete}
              uploading={uploading}
              uploadError={uploadError}
              downloadingId={downloadingId}
              deletingId={deletingId}
            />
          )}

          {activeTab === "shared" && (
            <SharedLinksTab
              session={session}
              shareLinks={shareLinks}
              setShareLinks={setShareLinks}
              showToast={showToast}
            />
          )}

          {activeTab === "activity" && (
            <ActivityLogsTab
              session={session}
              activityLogs={activityLogs}
              setActivityLogs={setActivityLogs}
            />
          )}

          {activeTab === "settings" && <SettingsTab user={user} showToast={showToast} />}

          {activeTab === "profile" && (
            <ProfileTab
              filesCount={files.length}
              storageUsed={formatBytes(totalStorageBytes)}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Share Link Modal */}
      {sharingFile && (
        <ShareModal
          file={sharingFile}
          session={session}
          onClose={() => setSharingFile(null)}
          onLinkCreated={() => showToast("Share link generated successfully!", "success")}
        />
      )}

      {/* File Preview Modal */}
      {previewingFile && (
        <FilePreviewModal
          file={previewingFile}
          session={session}
          onClose={() => setPreviewingFile(null)}
          onDownload={(f) => {
            setPreviewingFile(null);
            handleDownload(f);
          }}
        />
      )}
    </div>
  );
}
