import { supabase } from "@/integrations/supabase/client";

export type SecurityEventType =
  | "login_success"
  | "login_failed"
  | "password_changed"
  | "role_changed"
  | "permission_override"
  | "suspicious_activity"
  | "account_locked"
  | "session_revoked"
  | "ip_blocked";

export type SecuritySeverity = "info" | "warning" | "critical";

export async function logSecurityEvent(params: {
  event_type: SecurityEventType;
  severity?: SecuritySeverity;
  description?: string;
  description_ar?: string;
  metadata?: Record<string, any>;
  user_id?: string;
}) {
  try {
    await supabase.functions.invoke("security-audit", {
      body: {
        action: "log_event",
        ...params,
        severity: params.severity || "info",
      },
    });
  } catch (err) {
    console.error("[Security] Failed to log event:", err);
  }
}

export async function blockIP(params: {
  ip_address: string;
  reason: string;
  expires_hours?: number;
}) {
  const { data, error } = await supabase.functions.invoke("security-audit", {
    body: { action: "block_ip", ...params },
  });
  if (error) throw error;
  return data;
}

export async function revokeSession(sessionId: string, targetUserId: string) {
  const { data, error } = await supabase.functions.invoke("security-audit", {
    body: { action: "revoke_session", session_id: sessionId, target_user_id: targetUserId },
  });
  if (error) throw error;
  return data;
}
