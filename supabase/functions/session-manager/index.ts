import { handleCors } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SESSION_EXPIRY_DAYS = 30;

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "unknown";
}

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const body = await req.json();
    const { action } = body;

    const authHeader = req.headers.get("Authorization");
    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader || "" } } });
    const serviceClient = getServiceClient();

    const { data: { user } } = await authClient.auth.getUser();

    switch (action) {
      case "create_session": {
        if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
        const { device_fingerprint, device_name, device_os, login_method = "email" } = body;
        const ip = getClientIP(req);
        const userAgent = req.headers.get("user-agent") || "unknown";
        const now = new Date();
        const expiresAt = new Date(now.getTime() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

        const { data: suspiciousCheck } = await serviceClient.rpc("check_suspicious_login", { p_user_id: user.id, p_device_fingerprint: device_fingerprint || null, p_ip_address: ip, p_login_hour: now.getUTCHours() });
        const flags: string[] = suspiciousCheck?.flags || [];

        for (const flag of flags) {
          const severityMap: Record<string, string> = { new_device: "warning", unusual_time: "info", country_change: "high" };
          const descMap: Record<string, [string, string]> = {
            new_device: ["Login from new device: " + (device_name || "unknown"), "تسجيل دخول من جهاز جديد"],
            unusual_time: ["Login at unusual hour", "تسجيل دخول في وقت غير معتاد"],
            country_change: ["Login from different country", "تسجيل دخول من بلد مختلف"],
          };
          const [desc, descAr] = descMap[flag] || [flag, flag];
          await serviceClient.from("security_events").insert({ user_id: user.id, event_type: "suspicious_login_" + flag, severity: severityMap[flag] || "info", description: desc, description_ar: descAr, ip_address: ip, user_agent: userAgent, metadata: { device_fingerprint, device_name, login_method } });
        }

        if (device_fingerprint) {
          await serviceClient.from("user_sessions").update({ is_active: false, revoked_at: now.toISOString() }).eq("user_id", user.id).eq("device_fingerprint", device_fingerprint).eq("is_active", true);
        }

        const { data: session, error: insertErr } = await serviceClient.from("user_sessions").insert({ user_id: user.id, device_fingerprint, device_name: device_name || "Unknown Device", device_os: device_os || null, ip_address: ip, user_agent: userAgent, login_method, is_active: true, last_active_at: now.toISOString(), expires_at: expiresAt.toISOString() }).select("id").single();
        if (insertErr) throw insertErr;

        await serviceClient.from("auth_audit_log").insert({ user_id: user.id, action_type: "session_created", ip_address: ip, user_agent: userAgent, metadata: { session_id: session.id, device_name, login_method, suspicious_flags: flags } });

        return jsonResponse({ session_id: session.id, expires_at: expiresAt.toISOString(), suspicious_flags: flags, is_known_device: suspiciousCheck?.is_known_device ?? true });
      }

      case "list_sessions": {
        if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
        await serviceClient.rpc("cleanup_expired_sessions");
        const { data: sessions, error } = await serviceClient.from("user_sessions").select("id, device_name, device_os, device_fingerprint, ip_address, login_method, is_active, last_active_at, created_at, expires_at").eq("user_id", user.id).eq("is_active", true).order("last_active_at", { ascending: false }).limit(20);
        if (error) throw error;
        return jsonResponse({ sessions: sessions || [] });
      }

      case "revoke_session": {
        if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
        const { session_id } = body;
        if (!session_id) return jsonResponse({ error: "session_id required" }, 400);
        await serviceClient.from("user_sessions").update({ is_active: false, revoked_at: new Date().toISOString() }).eq("id", session_id).eq("user_id", user.id);
        await serviceClient.from("auth_audit_log").insert({ user_id: user.id, action_type: "session_revoked", ip_address: getClientIP(req), user_agent: req.headers.get("user-agent") || "unknown", metadata: { session_id, revoked_by: "user" } });
        return jsonResponse({ success: true });
      }

      case "revoke_all_sessions": {
        if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
        const { except_session_id } = body;
        let query = serviceClient.from("user_sessions").update({ is_active: false, revoked_at: new Date().toISOString() }).eq("user_id", user.id).eq("is_active", true);
        if (except_session_id) query = query.neq("id", except_session_id);
        await query;
        await serviceClient.from("auth_audit_log").insert({ user_id: user.id, action_type: "all_sessions_revoked", ip_address: getClientIP(req), user_agent: req.headers.get("user-agent") || "unknown", metadata: { except_session_id } });
        return jsonResponse({ success: true });
      }

      case "heartbeat": {
        if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
        const { session_id } = body;
        if (!session_id) return jsonResponse({ error: "session_id required" }, 400);
        await serviceClient.from("user_sessions").update({ last_active_at: new Date().toISOString() }).eq("id", session_id).eq("user_id", user.id).eq("is_active", true);
        return jsonResponse({ success: true });
      }

      case "cleanup": {
        const { data: count } = await serviceClient.rpc("cleanup_expired_sessions");
        return jsonResponse({ cleaned: count || 0 });
      }

      default: return jsonResponse({ error: "Unknown action: " + action }, 400);
    }
  } catch (err: any) {
    console.error("session-manager error:", err);
    return errorResponse(err);
  }
});
