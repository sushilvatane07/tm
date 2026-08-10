import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/SupabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const profileSyncedRef = useRef(null);

  function buildProfileFromUser(currentUser) {
    if (!currentUser) return null;
    const meta = currentUser.user_metadata || {};
    const defaultHandle = currentUser.email ? currentUser.email.split("@")[0] : "User";
    return {
      id: currentUser.id,
      email: currentUser.email,
      username: meta.username || defaultHandle,
      avatar_url: meta.avatar_url || null,
    };
  }

  // Load profile from Supabase database table (Single Source of Truth)
  async function fetchProfileFromDb(currentUser) {
    if (!currentUser?.id) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (data && !error) {
        setProfile({
          id: currentUser.id,
          email: currentUser.email,
          username: data.username || (currentUser.email ? currentUser.email.split("@")[0] : "User"),
          avatar_url: data.avatar_url || currentUser.user_metadata?.avatar_url || null,
        });
        return;
      }
    } catch (e) {
      console.warn("DB profile lookup notice:", e);
    }

    // Fallback if profile row is not created yet
    setProfile(buildProfileFromUser(currentUser));
  }

  // Ensure profile row exists in database
  async function ensureProfileRow(currentUser) {
    if (!currentUser?.id) return;
    if (profileSyncedRef.current === currentUser.id) return;
    profileSyncedRef.current = currentUser.id;

    const meta = currentUser.user_metadata || {};
    const username = meta.username || (currentUser.email ? currentUser.email.split("@")[0] : "User");

    try {
      await supabase.from("profiles").upsert(
        {
          id: currentUser.id,
          email: currentUser.email,
          username,
          avatar_url: meta.avatar_url || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } catch (e) {
      console.warn("Ensure profile row notice:", e);
    }
  }

  useEffect(() => {
    let mounted = true;

    // Read session on mount
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s || null);
      setUser(s?.user || null);
      if (s?.user) {
        setProfile(buildProfileFromUser(s.user));
        ensureProfileRow(s.user);
        fetchProfileFromDb(s.user);
      }
      setLoading(false);
    });

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (!mounted) return;

      if (event === "TOKEN_REFRESHED") {
        return; // Silent token refresh, preserve current profile state
      }

      if (event === "SIGNED_IN") {
        setSession(s);
        setUser(s?.user || null);
        if (s?.user) {
          ensureProfileRow(s.user);
          fetchProfileFromDb(s.user);
        }
        setLoading(false);
        return;
      }

      if (event === "SIGNED_OUT") {
        profileSyncedRef.current = null;
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (event === "USER_UPDATED") {
        setSession(s);
        setUser(s?.user || null);
        if (s?.user) fetchProfileFromDb(s.user);
        return;
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  async function updateProfileData(newUsername, newAvatarUrl) {
    if (!user?.id) return;

    // 1. Save directly to Supabase PostgreSQL 'profiles' table
    try {
      await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email,
          username: newUsername,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } catch (dbErr) {
      console.warn("Profiles DB upsert notice:", dbErr);
    }

    // 2. Save to Supabase Auth metadata
    try {
      await supabase.auth.updateUser({
        data: { username: newUsername, avatar_url: newAvatarUrl },
      });
    } catch (authErr) {
      console.warn("Auth updateUser notice:", authErr);
    }

    // 3. Immediately update React state so UI stays permanently updated
    const updatedProf = {
      id: user.id,
      email: user.email,
      username: newUsername,
      avatar_url: newAvatarUrl,
    };

    setProfile(updatedProf);
    setUser((prev) =>
      prev
        ? {
            ...prev,
            user_metadata: {
              ...prev.user_metadata,
              username: newUsername,
              avatar_url: newAvatarUrl,
            },
          }
        : prev
    );

    return updatedProf;
  }

  async function signOut() {
    profileSyncedRef.current = null;
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{ session, user, profile, loading, setProfile, updateProfileData, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
