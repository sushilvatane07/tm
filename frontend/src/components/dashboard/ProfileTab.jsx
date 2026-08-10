import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/SupabaseClient";
import { CheckIcon } from "../Icons";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function compressImageFile(file, maxWidth, maxHeight, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round(width * (maxHeight / height));
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        callback(blob);
      }, "image/jpeg", 0.85);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

export default function ProfileTab({ filesCount = 0, storageUsed = "0 Bytes", showToast }) {
  const { user, profile, updateProfileData } = useAuth();
  const [usernameInput, setUsernameInput] = useState(profile?.username || "");
  const [avatarUrlInput, setAvatarUrlInput] = useState(profile?.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsernameInput(profile.username || "");
      setAvatarUrlInput(profile.avatar_url || "");
    }
  }, [profile]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);

    try {
      await updateProfileData(usernameInput, avatarUrlInput);
      showToast("Profile saved successfully!", "success");
    } catch (err) {
      showToast(`Profile save error: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarFileSelect(file) {
    if (!file) return;
    setUploadingAvatar(true);

    // Compress image to 256x256
    compressImageFile(file, 256, 256, async (compressedBlob) => {
      try {
        const ext = file.name.split(".").pop() || "jpeg";
        const storagePath = `avatars/${user.id}_${Date.now()}.${ext}`;

        // 1. Upload to Supabase Storage bucket
        const { data, error } = await supabase.storage
          .from("trustshare-files")
          .upload(storagePath, compressedBlob, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (error) {
          console.warn("Direct storage upload notice, trying backend avatar endpoint...", error);
          // Fallback to FastAPI backend endpoint
          const formData = new FormData();
          formData.append("file", file);

          const res = await fetch(`${API_URL}/profile/avatar`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
            body: formData,
          });

          if (res.ok) {
            const apiRes = await res.json();
            if (apiRes.avatar_url) {
              setAvatarUrlInput(apiRes.avatar_url);
              await updateProfileData(usernameInput, apiRes.avatar_url);
              showToast("Avatar updated successfully via server storage!", "success");
              setUploadingAvatar(false);
              return;
            }
          }
          throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("trustshare-files")
          .getPublicUrl(storagePath);

        const publicUrl = urlData?.publicUrl || "";
        if (publicUrl) {
          setAvatarUrlInput(publicUrl);
          await updateProfileData(usernameInput, publicUrl);
          showToast("Avatar image uploaded & profile saved!", "success");
        }
      } catch (err) {
        showToast(`Avatar upload notice: ${err.message}`, "warn");
      } finally {
        setUploadingAvatar(false);
      }
    });
  }

  const lastSignIn = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString()
    : "—";

  return (
    <div className="profile-container">
      <section className="files-card profile-card-styled">
        <div className="profile-header-banner">
          <div className="avatar-picker-wrap">
            {avatarUrlInput ? (
              <img src={avatarUrlInput} alt="Avatar" className="profile-avatar-large-img" />
            ) : (
              <div className="profile-avatar-large">
                {(usernameInput || user?.email)?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <label className="avatar-upload-overlay" title="Upload Profile Photo">
              <input
                type="file"
                accept="image/*"
                hidden
                disabled={uploadingAvatar}
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) handleAvatarFileSelect(selected);
                  e.target.value = "";
                }}
              />
              <span>{uploadingAvatar ? "Uploading…" : "📷 Change"}</span>
            </label>
          </div>

          <div className="profile-header-text">
            <h1 className="dash-title">{usernameInput || user?.email}</h1>
            <span className="dash-eyebrow">USER PROFILE & CREDENTIALS</span>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSaveProfile} className="profile-edit-form">
          <div className="form-group">
            <label className="form-label">Username (Stored in `profiles.username`)</label>
            <input
              type="text"
              required
              placeholder="e.g. sushil_vatane"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="modal-input"
            />
            <span className="field-hint">Your handle displayed on shared links and audit trails.</span>
          </div>

          <div className="form-group">
            <label className="form-label">Avatar Image URL (Stored in `profiles.avatar_url`)</label>
            <input
              type="text"
              placeholder="https://example.com/photo.png or click camera above"
              value={avatarUrlInput}
              onChange={(e) => setAvatarUrlInput(e.target.value)}
              className="modal-input"
            />
            <span className="field-hint">Stored directly in Supabase Storage and `profiles` table.</span>
          </div>

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving Changes…" : <><CheckIcon size={16} /> Save Profile Changes</>}
          </button>
        </form>

        <div className="user-meta-grid" style={{ marginTop: "24px" }}>
          <div className="user-meta-card">
            <span className="meta-label">User ID</span>
            <code className="meta-code">{user?.id}</code>
          </div>
          <div className="user-meta-card">
            <span className="meta-label">Email Address</span>
            <strong>{user?.email}</strong>
          </div>
          <div className="user-meta-card">
            <span className="meta-label">Last Sign In</span>
            <strong>{lastSignIn}</strong>
          </div>
          <div className="user-meta-card">
            <span className="meta-label">Encrypted Files</span>
            <strong>{filesCount} Files ({storageUsed})</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
