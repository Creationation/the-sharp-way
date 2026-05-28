import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        setAdminChecked(false);
        setTimeout(() => {
          checkAdmin(session.user.id);
        }, 0);
      } else {
        setIsAdmin(false);
        setAdminChecked(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        checkAdmin(session.user.id);
      } else {
        setAdminChecked(true);
      }
    }).catch((err) => {
      console.error("[useAuth] getSession failed", err);
      setLoading(false);
      setAdminChecked(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdmin = async (userId: string) => {
    try {
      const timeout = new Promise<{ data: null; error: Error }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error("has_role timeout") }), 8000)
      );
      const rpcCall = supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
      const { data, error } = (await Promise.race([rpcCall, timeout])) as { data: boolean | null; error: unknown };
      if (error) console.error("[useAuth] has_role error", error);
      setIsAdmin(!!data);
    } catch (err) {
      console.error("[useAuth] checkAdmin failed", err);
      setIsAdmin(false);
    } finally {
      setAdminChecked(true);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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
