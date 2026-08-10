import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/SupabaseClient";
import { saveUserProfile } from "../lib/profileManager";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ref to ensure profile upsert only runs once per user, not on every token refresh
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

  // Upsert a profile row so foreign key constraints on files/share_links are satisfied.
  // Uses a ref so it only runs once per unique user, never on token refresh.
  async function ensureProfile(currentUser) {
    if (!currentUser?.id) return;
    if (profileSyncedRef.current === currentUser.id) return; // already done
    profileSyncedRef.current = currentUser.id;

    const meta = currentUser.user_metadata || {};
    const username = meta.username || (currentUser.email ? currentUser.email.split("@")[0] : "User");

    try {
      const { error } = await supabase.from("profiles").upsert(
        {
          id: currentUser.id,
          email: currentUser.email,
          username,
          avatar_url: meta.avatar_url || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id", ignoreDuplicates: false }
      );
      if (error) console.warn("Profile upsert notice:", error.message);
    } catch (e) {
      console.warn("Profile upsert error:", e);
    }
  }

  useEffect(() => {
    let mounted = true;

    // Get existing session on mount (reads from localStorage — zero network call)
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s || null);
      setUser(s?.user || null);
      if (s?.user) {
        setProfile(buildProfileFromUser(s.user));
        ensureProfile(s.user); // create/update profile row — only fires once per user
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (!mounted) return;

      // TOKEN_REFRESHED: only update session silently, no state changes that cause re-renders
      if (event === "TOKEN_REFRESHED") {
        // We intentionally do NOT call setSession here.
        // The supabase client internally updates its token — that's enough.
        // Calling setSession would trigger a full re-render cascade.
        return;
      }

      // SIGNED_IN: new login
      if (event === "SIGNED_IN") {
        setSession(s);
        setUser(s?.user || null);
        if (s?.user) {
          setProfile(buildProfileFromUser(s.user));
          ensureProfile(s.user);
        }
        setLoading(false);
        return;
      }

      // SIGNED_OUT: clear everything
      if (event === "SIGNED_OUT") {
        profileSyncedRef.current = null;
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      // USER_UPDATED: refresh profile metadata
      if (event === "USER_UPDATED") {
        setSession(s);
        setUser(s?.user || null);
        if (s?.user) setProfile(buildProfileFromUser(s.user));
        return;
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  async function updateProfileData(newUsername, newAvatarUrl) {
    if (!user) return;
    const res = await saveUserProfile(user, newUsername, newAvatarUrl);
    const { data: { user: updatedUser } } = await supabase.auth.getUser();
    if (updatedUser) setProfile(buildProfileFromUser(updatedUser));
    return res;
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
