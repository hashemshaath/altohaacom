import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getDeviceFingerprint, getDeviceName } from "@/lib/deviceFingerprint";

interface ActiveSession {
  id: string;
  device_name: string;
  device_os: string | null;
  device_fingerprint: string | null;
  ip_address: string | null;
  login_method: string;
  is_active: boolean;
  last_active_at: string;
  created_at: string;
  expires_at: string;
}

const SESSION_ID_KEY = "tabaq_session_id";
const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes

function getDeviceOS(): string {
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS/i.test(ua)) return "macOS";
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad/i.test(ua)) return "iOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Unknown";
}

export function useSessionManager() {
  const { user, session } = useAuth();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    () => sessionStorage.getItem(SESSION_ID_KEY)
  );
  const heartbeatRef = useRef<ReturnType<typeof setInterval>>();

  const invoke = useCallback(async (action: string, extra: Record<string, unknown> = {}) => {
    if (!session?.access_token) return null;
    const { data, error } = await supabase.functions.invoke("session-manager", {
      body: { action, ...extra },
    });
    if (error) {
      console.error(`session-manager/${action} error:`, error);
      return null;
    }
    return data;
  }, [session?.access_token]);

  // Create session on login
  const createSession = useCallback(async (loginMethod = "email") => {
    if (!user) return;
    const fingerprint = await getDeviceFingerprint();
    const deviceName = getDeviceName();
    const deviceOs = getDeviceOS();

    const result = await invoke("create_session", {
      device_fingerprint: fingerprint,
      device_name: deviceName,
      device_os: deviceOs,
      login_method: loginMethod,
    });

    if (result?.session_id) {
      setCurrentSessionId(result.session_id);
      sessionStorage.setItem(SESSION_ID_KEY, result.session_id);
    }

    return result;
  }, [user, invoke]);

  // List sessions
  const listSessions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await invoke("list_sessions");
      if (result?.sessions) {
        setSessions(result.sessions);
      }
    } finally {
      setLoading(false);
    }
  }, [invoke]);

  // Revoke a session
  const revokeSession = useCallback(async (sessionId: string) => {
    const result = await invoke("revoke_session", { session_id: sessionId });
    if (result?.success) {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    }
    return result?.success ?? false;
  }, [invoke]);

  // Revoke all sessions except current
  const revokeAllSessions = useCallback(async () => {
    const result = await invoke("revoke_all_sessions", {
      except_session_id: currentSessionId,
    });
    if (result?.success) {
      setSessions(prev => prev.filter(s => s.id === currentSessionId));
    }
    return result?.success ?? false;
  }, [invoke, currentSessionId]);

  // Heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (!currentSessionId) return;
    await invoke("heartbeat", { session_id: currentSessionId });
  }, [invoke, currentSessionId]);

  // Start heartbeat interval (single effect handles both start & cleanup)
  useEffect(() => {
    if (!user || !currentSessionId) return;

    sendHeartbeat(); // immediate
    heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [user, currentSessionId, sendHeartbeat]);

  return {
    sessions,
    loading,
    currentSessionId,
    createSession,
    listSessions,
    revokeSession,
    revokeAllSessions,
    sendHeartbeat,
  };
}
