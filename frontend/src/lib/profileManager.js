import { supabase } from "./SupabaseClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Profile Manager
 * Handles reading user profile metadata and persisting updates to Supabase database.
 */

export async function getOrInitProfile(user) {
  if (!user || !user.id) return null;

  // Read from in-memory session metadata
  const meta = user.user_metadata || {};
  const defaultHandle = user.email ? user.email.split("@")[0] : "User";

  return {
    id: user.id,
    email: user.email,
    username: meta.username || defaultHandle,
    avatar_url: meta.avatar_url || null,
  };
}

export async function saveUserProfile(user, newUsername, newAvatarUrl) {
  if (!user || !user.id) throw new Error("Invalid user session");

  const sessionRes = await supabase.auth.getSession();
  const token = sessionRes?.data?.session?.access_token;

  let dbError = null;

  // 1. Direct Supabase database update (persists to 'profiles' table)
  try {
    const { error: sbErr } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email,
        username: newUsername,
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    if (sbErr) console.warn("Supabase profiles table notice:", sbErr.message);
  } catch (e) {
    console.warn("Direct profiles table notice:", e);
  }

  // 2. Update via FastAPI backend if active
  if (token) {
    try {
      const res = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUsername,
          avatar_url: newAvatarUrl,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        dbError = body.detail || `Server notice (${res.status})`;
      }
    } catch (e) {
      // FastAPI dev server notice
    }
  }

  // 3. Sync into Supabase Auth user_metadata (session state)
  try {
    await supabase.auth.updateUser({
      data: { username: newUsername, avatar_url: newAvatarUrl },
    });
  } catch (authErr) {
    console.warn("Auth metadata sync notice:", authErr.message);
  }

  return {
    id: user.id,
    email: user.email,
    username: newUsername,
    avatar_url: newAvatarUrl,
    dbError,
  };
}
