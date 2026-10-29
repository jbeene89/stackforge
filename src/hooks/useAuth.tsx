import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { isNativeApp } from "@/lib/native-navigation";
import { toast } from "sonner";
import { welcomeRequest } from "@/lib/welcomeEmail";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let authEventReceived = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      authEventReceived = true;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

    });

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        // A newer auth event takes precedence over the initial session lookup.
        if (!active || authEventReceived) return;
        if (error) console.error("Session restore failed", error.message);
        setSession(error ? null : session);
        setUser(error ? null : session?.user ?? null);
      })
      .catch((error: unknown) => {
        console.error("Session restore failed", error instanceof Error ? error.message : "Unknown error");
        if (active && !authEventReceived) {
          setSession(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    const request = welcomeRequest(session.user);
    if (!request) return;
    const key = `welcome_sent_${session.user.id}`;
    try { if (localStorage.getItem(key)) return; } catch { /* Server still deduplicates. */ }
    // Run outside the auth callback to avoid locking session hydration.
    supabase.functions.invoke("send-transactional-email", { body: request })
      .then(({ data, error }) => {
        if (error || data?.error) throw error || new Error(data.error);
        if (data?.success || data?.reason === "email_suppressed") {
          try { localStorage.setItem(key, "1"); } catch { /* Storage may be unavailable. */ }
        }
      })
      .catch(() => console.error("Welcome email was not queued; it will retry on the next session."));
  }, [session]);

  const signUp = async (email: string, password: string, name?: string) => {
    const native = isNativeApp();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name || email },
        // The Android shell's localhost origin is not an email destination.
        emailRedirectTo: native ? "https://www.soupylab.com/" : window.location.origin,
      },
    });
    if (error) throw error;
    toast.success(native
      ? "Check your email and confirm your account in your browser, then return to this app to sign in."
      : "Account created! Check your email to confirm.");
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    if (isNativeApp()) {
      throw new Error("Google sign-in is not configured for this Android app yet. Use email and password.");
    }
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result?.error) throw result.error;
  };

  const signInWithApple = async () => {
    if (isNativeApp()) {
      throw new Error("Apple sign-in is not configured for this Android app yet. Use email and password.");
    }
    const result = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    if (result?.error) throw result.error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${isNativeApp() ? "https://www.soupylab.com" : window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithGoogle, signInWithApple, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
