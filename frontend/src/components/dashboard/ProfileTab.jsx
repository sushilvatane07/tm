import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/SupabaseClient";
import { CheckIcon, ShieldCheckIcon } from "../Icons";

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

export default function ProfileTab({ filesCount = 0, storageUsed = "0.00 Bytes", showToast }) {
  const { user, profile, updateProfileData } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [usernameInput, setUsernameInput] = useState(profile?.username || "");
  const [avatarUrlInput, setAvatarUrlInput] = useState(profile?.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsernameInput(profile.username || "");
      setAvatarUrlInput(profile.avatar_url || "");
    }
  }, [profile?.username, profile?.avatar_url]);

  async function handleSaveProfile(e) {
    if (e) e.preventDefault();
    if (!usernameInput.trim()) {
      if (showToast) showToast("Username cannot be empty.", "warn");
      return;
    }

    setSaving(true);
    try {
      await updateProfileData(usernameInput.trim(), avatarUrlInput);
      if (showToast) showToast("Profile changes saved successfully!", "success");
      setIsEditing(false);
    } catch (err) {
      if (showToast) showToast(`Profile save error: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarFileSelect(file) {
    if (!file || !user?.id) return;
    setUploadingAvatar(true);

    compressImageFile(file, 256, 256, async (compressedBlob) => {
      try {
        const ext = file.name.split(".").pop() || "jpeg";
        const storagePath = `avatars/${user.id}_${Date.now()}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("trustshare-files")
          .upload(storagePath, compressedBlob, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage
          .from("trustshare-files")
          .getPublicUrl(storagePath);

        const publicUrl = urlData?.publicUrl || "";
        if (publicUrl) {
          setAvatarUrlInput(publicUrl);
          await updateProfileData(usernameInput, publicUrl);
          if (showToast) showToast("Profile photo uploaded and saved!", "success");
        }
      } catch (err) {
        if (showToast) showToast(`Avatar upload: ${err.message}`, "warn");
      } finally {
        setUploadingAvatar(false);
      }
    });
  }

  const handle = profile?.username || usernameInput || (user?.email ? user.email.split("@")[0] : "User");
  const initials = handle?.[0]?.toUpperCase() || "U";
  const lastSignIn = user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "Recently";

  return (
    <div className="profile-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Profile Card Header */}
      <section className="files-card">
        <div className="flex-between flex-wrap" style={{ gap: '20px', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {/* Avatar Circle with Hover Edit Trigger */}
            <div className="avatar-picker-wrap" style={{ position: 'relative', width: '88px', height: '88px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--panel-border)', boxShadow: 'var(--shadow-subtle)', background: 'var(--bg-dark)' }}>
              {avatarUrlInput ? (
                <img src={avatarUrlInput} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0066CC 0%, #38bdf8 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 700 }}>
                  {initials}
                </div>
              )}

              {/* Upload photo overlay active during edit mode */}
              <label style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: isEditing ? 1 : 0, cursor: 'pointer', transition: 'opacity 0.2s ease', gap: '2px' }}>
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
                <span>📷</span>
                <span>{uploadingAvatar ? "Uploading…" : "Change Photo"}</span>
              </label>
            </div>

            {/* Profile Info */}
            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-hi)', margin: 0 }}>
                  {handle}
                </h1>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(52, 199, 89, 0.12)', color: 'var(--primary-emerald)', border: '1px solid rgba(52, 199, 89, 0.25)', padding: '2px 8px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 600 }}>
                  <ShieldCheckIcon size={12} />
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-lo)', margin: 0 }}>
                {user?.email}
              </p>
            </div>
          </div>

          {/* Edit Profile Button Toggle */}
          <div>
            {!isEditing ? (
              <button
                className="ts-btn ts-btn-outline"
                onClick={() => setIsEditing(true)}
                style={{ padding: '10px 18px', fontSize: '0.88rem', minWidth: '130px', justifyContent: 'center' }}
              >
                ✏️ Edit Profile
              </button>
            ) : (
              <button
                className="ts-btn ts-btn-outline"
                onClick={() => {
                  setIsEditing(false);
                  setUsernameInput(profile?.username || "");
                  setAvatarUrlInput(profile?.avatar_url || "");
                }}
                style={{ padding: '10px 18px', fontSize: '0.88rem', minWidth: '110px', justifyContent: 'center', color: 'var(--text-lo)' }}
              >
                ✕ Cancel
              </button>
            )}
          </div>
        </div>

        {/* Profile Edit Form Section */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--panel-border)', background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-hi)', margin: 0 }}>
              Edit Account Information
            </h3>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-hi)' }}>Display Name / Username</label>
              <input
                type="text"
                required
                placeholder="Enter username"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--panel-border)', background: 'var(--bg-dark)', color: 'var(--text-hi)', fontSize: '0.92rem', outline: 'none' }}
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-lo)' }}>This handle will be updated in your database profile record and shown across shared links.</span>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-hi)' }}>Profile Photo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label className="ts-btn ts-btn-outline" style={{ cursor: 'pointer', padding: '8px 14px', fontSize: '0.84rem' }}>
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
                  📁 Select New Photo
                </label>
                {uploadingAvatar && <span style={{ fontSize: '0.8rem', color: 'var(--primary-cyan)' }}>Uploading photo to storage…</span>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="submit" className="ts-btn ts-btn-primary" disabled={saving || uploadingAvatar} style={{ padding: '10px 22px', fontSize: '0.88rem' }}>
                {saving ? "Saving Changes…" : <><CheckIcon size={16} /> Save Profile Changes</>}
              </button>
              <button
                type="button"
                className="ts-btn ts-btn-outline"
                onClick={() => {
                  setIsEditing(false);
                  setUsernameInput(profile?.username || "");
                  setAvatarUrlInput(profile?.avatar_url || "");
                }}
                style={{ padding: '10px 18px', fontSize: '0.88rem' }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Account Details Metadata */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--panel-border)' }}>
          <div style={{ padding: '14px', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-lo)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Authenticated Email</span>
            <strong style={{ fontSize: '0.88rem', color: 'var(--text-hi)' }}>{user?.email}</strong>
          </div>

          <div style={{ padding: '14px', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-lo)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Last Sign In</span>
            <strong style={{ fontSize: '0.88rem', color: 'var(--text-hi)' }}>{lastSignIn}</strong>
          </div>

          <div style={{ padding: '14px', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-lo)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Vault Storage Usage</span>
            <strong style={{ fontSize: '0.88rem', color: 'var(--text-hi)' }}>{filesCount} Files ({storageUsed})</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
