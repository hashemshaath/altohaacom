import { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { getDeviceFingerprint, getDeviceName } from "@/lib/deviceFingerprint";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_CREATED_KEY = "tabaq_session_created";

async function createLoginSession(loginMethod = "email") {
  try {
    const fingerprint = await getDeviceFingerprint();
    const deviceName = getDeviceName();
    const ua = navigator.userAgent;
    let deviceOs = "Unknown";
    if (/Windows/i.test(ua)) deviceOs = "Windows";
    else if (/Mac OS/i.test(ua)) deviceOs = "macOS";
    else if (/Android/i.test(ua)) deviceOs = "Android";
    else if (/iPhone|iPad/i.test(ua)) deviceOs = "iOS";
    else if (/Linux/i.test(ua)) deviceOs = "Linux";

    const { data } = await supabase.functions.invoke("session-manager", {
      body: {
        action: "create_session",
        device_fingerprint: fingerprint,
        device_name: deviceName,
        device_os: deviceOs,
        login_method: loginMethod,
      },
    });

    if (data?.session_id) {
      sessionStorage.setItem("tabaq_session_id", data.session_id);
      sessionStorage.setItem(SESSION_CREATED_KEY, "true");
    }
  } catch (e) {
    console.warn("Session creation failed:", e);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const listenerFired = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        listenerFired.current = true;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);

        // Create session record on sign-in (not on token refresh or initial load)
        if (event === "SIGNED_IN" && newSession?.user) {
          const alreadyCreated = sessionStorage.getItem(SESSION_CREATED_KEY);
          if (!alreadyCreated) {
            // Determine login method from user metadata
            const provider = newSession.user.app_metadata?.provider || "email";
            setTimeout(() => createLoginSession(provider), 0);
          }
        }

        // Clear session tracking on sign-out
        if (event === "SIGNED_OUT") {
          sessionStorage.removeItem("tabaq_session_id");
          sessionStorage.removeItem(SESSION_CREATED_KEY);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!listenerFired.current) {
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const contextValue = useMemo(
    () => ({ user, session, loading, signOut }),
    [user, session, loading, signOut]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
