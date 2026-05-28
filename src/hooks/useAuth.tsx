import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  adminChecked: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  adminChecked: false,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  const applySession = useCallback((nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);
    if (!nextSession?.user) {
      setIsAdmin(false);
      setAdminChecked(true);
    }
  }, []);

  const checkAdmin = useCallback(async (userId: string) => {
    try {
      const timeout = new Promise<{ data: null; error: Error }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error("admin role check timeout") }), 5000)
      );
      const roleQuery = supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "admin")
        .limit(1);
      const { data, error } = (await Promise.race([roleQuery, timeout])) as { data: { id: string }[] | null; error: unknown };
      if (error) console.error("[useAuth] admin role check error", error);
      setIsAdmin(Array.isArray(data) && data.length > 0);
    } catch (err) {
      console.error("[useAuth] checkAdmin failed", err);
      setIsAdmin(false);
    } finally {
      setAdminChecked(true);
    }
  }, []);

  const restoreSession = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const sessionTimeout = new Promise<{ data: { session: null } }>((resolve) =>
        setTimeout(() => resolve({ data: { session: null } }), 7000)
      );
      const { data: { session: storedSession } } = await Promise.race([
        supabase.auth.getSession(),
        sessionTimeout,
      ]);

      let activeSession = storedSession;
      const expiresAt = activeSession?.expires_at ? activeSession.expires_at * 1000 : 0;
      if (activeSession && expiresAt && expiresAt - Date.now() < 60000) {
        const refreshTimeout = new Promise<{ data: { session: Session | null }; error: Error }>((resolve) =>
          setTimeout(() => resolve({ data: { session: activeSession }, error: new Error("session refresh timeout") }), 7000)
        );
        const { data, error } = await Promise.race([supabase.auth.refreshSession(), refreshTimeout]);
        if (error) console.error("[useAuth] refreshSession error", error);
        activeSession = data.session ?? activeSession;
      }

      applySession(activeSession ?? null);
      if (activeSession?.user) {
        setAdminChecked(false);
        setTimeout(() => checkAdmin(activeSession.user.id), 0);
      }
    } catch (err) {
      console.error("[useAuth] restoreSession failed", err);
      applySession(null);
    } finally {
      setLoading(false);
    }
  }, [applySession, checkAdmin]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
      setLoading(false);

      if (session?.user) {
        setAdminChecked(false);
        setTimeout(() => {
          checkAdmin(session.user.id);
        }, 0);
      }
    });

    restoreSession(true);

    const handleResume = () => restoreSession(false);
    window.addEventListener("focus", handleResume);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") handleResume();
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("focus", handleResume);
    };
  }, [applySession, checkAdmin, restoreSession]);

  const signOut = async () => {
    try {
      const timeout = new Promise<void>((resolve) => setTimeout(resolve, 4000));
      await Promise.race([supabase.auth.signOut(), timeout]);
    } catch (err) {
      console.error("[useAuth] signOut error", err);
    }
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("sb-") || k.includes("supabase.auth")) localStorage.removeItem(k);
      });
    } catch {}
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setAdminChecked(true);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, adminChecked, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
