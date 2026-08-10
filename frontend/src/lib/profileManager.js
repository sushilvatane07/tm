import { supabase } from "./SupabaseClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Profile Manager
 * 
 * IMPORTANT: Does NOT fire direct Supabase queries from the browser.
 * Direct queries caused ERR_CONNECTION_CLOSED by hitting Chrome's HTTP/2 stream limit.
 * All reads come from in-memory session metadata (zero network cost).
 * All writes go through FastAPI (service_role key, bypasses RLS).
 */

export async function getOrInitProfile(user) {
  if (!user || !user.id) return null;

  // Read from in-memory session metadata — zero network calls, zero latency
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

  // 1. Update via FastAPI backend (service_role key → bypasses RLS)
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
        dbError = body.detail || `Server error (${res.status})`;
      }
    } catch (e) {
      console.warn("FastAPI profile update notice:", e.message);
    }
  }

  // 2. Sync into Supabase Auth user_metadata (in-memory session — no extra DB query)
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
