import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const listenerFired = useRef(false);

  useEffect(() => {
    // 1. Set up the auth state listener FIRST — this is the single source of truth.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        listenerFired.current = true;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      }
    );

    // 2. Bootstrap with getSession ONLY if the listener hasn't fired yet.
    //    This prevents a stale cached session from overwriting a fresh one.
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!listenerFired.current) {
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
