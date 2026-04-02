import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SESSION_EXPIRY_DAYS = 30;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("cf-connecting-ip")
    || "unknown";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const body = await req.json();
    const { action } = body;

    const authHeader = req.headers.get("Authorization");
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });
    const serviceClient = createClient(supabaseUrl, serviceKey);

    // Authenticate user
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    switch (action) {
      // ─── CREATE SESSION ───────────────────────────────────────
      case "create_session": {
        if (!user) return json({ error: "Unauthorized" }, 401);

        const {
          device_fingerprint,
          device_name,
          device_os,
          login_method = "email",
        } = body;

        const ip = getClientIP(req);
        const userAgent = req.headers.get("user-agent") || "unknown";
        const now = new Date();
        const expiresAt = new Date(now.getTime() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        const loginHour = now.getUTCHours();

        // Check for suspicious activity
        const { data: suspiciousCheck } = await serviceClient.rpc("check_suspicious_login", {
          p_user_id: user.id,
          p_device_fingerprint: device_fingerprint || null,
          p_ip_address: ip,
          p_login_hour: loginHour,
        });

        const flags: string[] = suspiciousCheck?.flags || [];

        // Log security events for flags
        for (const flag of flags) {
          const severityMap: Record<string, string> = {
            new_device: "warning",
            unusual_time: "info",
            country_change: "high",
          };
          const descMap: Record<string, [string, string]> = {
            new_device: ["Login from new device: " + (device_name || "unknown"), "تسجيل دخول من جهاز جديد: " + (device_name || "غير معروف")],
            unusual_time: ["Login at unusual hour: " + loginHour + ":00 UTC", "تسجيل دخول في وقت غير معتاد: " + loginHour + ":00 UTC"],
            country_change: ["Login from different country", "تسجيل دخول من بلد مختلف"],
          };
          const [desc, descAr] = descMap[flag] || [flag, flag];

          await serviceClient.from("security_events").insert({
            user_id: user.id,
            event_type: "suspicious_login_" + flag,
            severity: severityMap[flag] || "info",
            description: desc,
            description_ar: descAr,
            ip_address: ip,
            user_agent: userAgent,
            metadata: { device_fingerprint, device_name, login_method },
          });
        }

        // Deactivate previous sessions from same device (optional: keep multi-device)
        if (device_fingerprint) {
          await serviceClient
            .from("user_sessions")
            .update({ is_active: false, revoked_at: now.toISOString() })
            .eq("user_id", user.id)
            .eq("device_fingerprint", device_fingerprint)
            .eq("is_active", true);
        }

        // Create session record
        const { data: session, error: insertErr } = await serviceClient
          .from("user_sessions")
          .insert({
            user_id: user.id,
            device_fingerprint,
            device_name: device_name || "Unknown Device",
            device_os: device_os || null,
            ip_address: ip,
            user_agent: userAgent,
            login_method,
            is_active: true,
            last_active_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
          })
          .select("id")
          .single();

        if (insertErr) throw insertErr;

        // Log audit
        await serviceClient.from("auth_audit_log").insert({
          user_id: user.id,
          action_type: "session_created",
          ip_address: ip,
          user_agent: userAgent,
          metadata: {
            session_id: session.id,
            device_name,
            login_method,
            suspicious_flags: flags,
          },
        });

        return json({
          session_id: session.id,
          expires_at: expiresAt.toISOString(),
          suspicious_flags: flags,
          is_known_device: suspiciousCheck?.is_known_device ?? true,
        });
      }

      // ─── LIST SESSIONS ────────────────────────────────────────
      case "list_sessions": {
        if (!user) return json({ error: "Unauthorized" }, 401);

        // Clean expired first
        await serviceClient.rpc("cleanup_expired_sessions");

        const { data: sessions, error } = await serviceClient
          .from("user_sessions")
          .select("id, device_name, device_os, device_fingerprint, ip_address, login_method, is_active, last_active_at, created_at, expires_at")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("last_active_at", { ascending: false })
          .limit(20);

        if (error) throw error;

        return json({ sessions: sessions || [] });
      }

      // ─── REVOKE SESSION ───────────────────────────────────────
      case "revoke_session": {
        if (!user) return json({ error: "Unauthorized" }, 401);
        const { session_id } = body;
        if (!session_id) return json({ error: "session_id required" }, 400);

        const { error } = await serviceClient
          .from("user_sessions")
          .update({ is_active: false, revoked_at: new Date().toISOString() })
          .eq("id", session_id)
          .eq("user_id", user.id);

        if (error) throw error;

        await serviceClient.from("auth_audit_log").insert({
          user_id: user.id,
          action_type: "session_revoked",
          ip_address: getClientIP(req),
          user_agent: req.headers.get("user-agent") || "unknown",
          metadata: { session_id, revoked_by: "user" },
        });

        await serviceClient.from("security_events").insert({
          user_id: user.id,
          event_type: "session_revoked",
          severity: "info",
          description: "User revoked a session",
          description_ar: "المستخدم أنهى جلسة",
          metadata: { session_id },
        });

        return json({ success: true });
      }

      // ─── REVOKE ALL SESSIONS ──────────────────────────────────
      case "revoke_all_sessions": {
        if (!user) return json({ error: "Unauthorized" }, 401);
        const { except_session_id } = body;

        let query = serviceClient
          .from("user_sessions")
          .update({ is_active: false, revoked_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("is_active", true);

        if (except_session_id) {
          query = query.neq("id", except_session_id);
        }

        const { error } = await query;
        if (error) throw error;

        await serviceClient.from("auth_audit_log").insert({
          user_id: user.id,
          action_type: "all_sessions_revoked",
          ip_address: getClientIP(req),
          user_agent: req.headers.get("user-agent") || "unknown",
          metadata: { except_session_id },
        });

        await serviceClient.from("security_events").insert({
          user_id: user.id,
          event_type: "all_sessions_revoked",
          severity: "warning",
          description: "User revoked all sessions",
          description_ar: "المستخدم أنهى جميع الجلسات",
          metadata: { except_session_id },
        });

        return json({ success: true });
      }

      // ─── HEARTBEAT ────────────────────────────────────────────
      case "heartbeat": {
        if (!user) return json({ error: "Unauthorized" }, 401);
        const { session_id } = body;
        if (!session_id) return json({ error: "session_id required" }, 400);

        const { error } = await serviceClient
          .from("user_sessions")
          .update({ last_active_at: new Date().toISOString() })
          .eq("id", session_id)
          .eq("user_id", user.id)
          .eq("is_active", true);

        if (error) throw error;
        return json({ success: true });
      }

      // ─── CLEANUP ──────────────────────────────────────────────
      case "cleanup": {
        const { data: count } = await serviceClient.rpc("cleanup_expired_sessions");
        return json({ cleaned: count || 0 });
      }

      default:
        return json({ error: "Unknown action: " + action }, 400);
    }
  } catch (err: any) {
    console.error("session-manager error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
