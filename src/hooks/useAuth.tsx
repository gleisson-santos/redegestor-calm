/**
 * Auth context: gerencia sessão Supabase, perfil (UR) e role (admin/user).
 * Use o hook `useAuth()` em qualquer componente abaixo de <AuthProvider>.
 */
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "user";

export interface AuthProfile {
  id: string;
  nome: string;
  ur: string;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  role: AppRole | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfileAndRole = async (userId: string) => {
    const [{ data: prof }, { data: roles }] = await Promise.all([
      supabase.from("profiles" as never).select("id, nome, ur").eq("id", userId).maybeSingle(),
      supabase.from("user_roles" as never).select("role").eq("user_id", userId),
    ]);
    setProfile((prof as AuthProfile | null) ?? null);
    const list = (roles as { role: AppRole }[] | null) ?? [];
    setRole(list.some(r => r.role === "admin") ? "admin" : list[0]?.role ?? "user");
  };

  useEffect(() => {
    // 1. Set listener BEFORE getSession (best practice)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        // Defer to avoid deadlock with auth client
        setTimeout(() => { void loadProfileAndRole(sess.user.id); }, 0);
      } else {
        setProfile(null);
        setRole(null);
      }
    });

    // 2. Initial session check
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      if (sess?.user) {
        void loadProfileAndRole(sess.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
  };

  const refreshProfile = async () => {
    if (session?.user) await loadProfileAndRole(session.user.id);
  };

  return (
    <AuthCtx.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        role,
        isAdmin: role === "admin",
        loading,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
