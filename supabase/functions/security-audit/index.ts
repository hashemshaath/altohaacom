import { handleCors } from "../_shared/cors.ts";
import { authenticateRequest, getServiceClient } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const authHeader = req.headers.get("Authorization");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const token = authHeader?.replace("Bearer ", "") || "";
    const isServiceCall = token === serviceKey;

    let callerId: string | null = null;
    if (!isServiceCall) {
      const { userId } = await authenticateRequest(req);
      callerId = userId;
    }

    const supabase = getServiceClient();
    const { action, ...body } = await req.json();

    switch (action) {
      case "log_event": {
        const { user_id, event_type, severity, description, description_ar, metadata, ip_address, user_agent } = body;
        const { data, error } = await supabase
          .from("security_events")
          .insert({
            user_id: user_id || callerId,
            event_type, severity: severity || "info",
            description, description_ar,
            ip_address, user_agent, metadata: metadata || {},
          })
          .select("id").single();
        if (error) throw error;
        return jsonResponse({ success: true, id: data.id });
      }

      case "get_dashboard": {
        if (!isServiceCall && callerId) {
          const { data: isAdmin } = await supabase.rpc("is_admin", { p_user_id: callerId });
          if (!isAdmin) throw new Error("Forbidden");
        }

        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [eventsRes, criticalRes, sessionsRes, blockedRes, { data: recentEvents }, { data: typeBreakdown }] = await Promise.all([
          supabase.from("security_events").select("id", { count: "exact", head: true }).gte("created_at", last24h),
          supabase.from("security_events").select("id", { count: "exact", head: true }).eq("severity", "critical").gte("created_at", last7d),
          supabase.from("user_sessions").select("id", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("ip_blocklist").select("id", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("security_events").select("id, event_type, severity, user_id, ip_address, details, created_at").order("created_at", { ascending: false }).limit(50),
          supabase.from("security_events").select("event_type").gte("created_at", last7d),
        ]);

        const typeCounts: Record<string, number> = {};
        (typeBreakdown || []).forEach((e: any) => { typeCounts[e.event_type] = (typeCounts[e.event_type] || 0) + 1; });

        return jsonResponse({
          success: true,
          stats: {
            events_24h: eventsRes.count || 0, critical_7d: criticalRes.count || 0,
            active_sessions: sessionsRes.count || 0, blocked_ips: blockedRes.count || 0,
          },
          recent_events: recentEvents || [],
          type_breakdown: typeCounts,
        });
      }

      case "block_ip": {
        if (!isServiceCall && callerId) {
          const { data: isAdmin } = await supabase.rpc("is_admin", { p_user_id: callerId });
          if (!isAdmin) throw new Error("Forbidden");
        }
        const { ip_address, reason, expires_hours } = body;
        const expiresAt = expires_hours ? new Date(Date.now() + expires_hours * 60 * 60 * 1000).toISOString() : null;
        const { error } = await supabase.from("ip_blocklist").upsert(
          { ip_address, reason, blocked_by: callerId, expires_at: expiresAt, is_active: true },
          { onConflict: "ip_address" }
        );
        if (error) throw error;
        await supabase.from("security_events").insert({
          user_id: callerId, event_type: "ip_blocked", severity: "warning",
          description: `IP ${ip_address} blocked: ${reason}`, metadata: { ip_address, reason, expires_hours },
        });
        return jsonResponse({ success: true });
      }

      case "revoke_session": {
        const { session_id, target_user_id } = body;
        if (callerId && callerId !== target_user_id) {
          const { data: isAdmin } = await supabase.rpc("is_admin", { p_user_id: callerId });
          if (!isAdmin) throw new Error("Forbidden");
        }
        const { error } = await supabase.from("user_sessions")
          .update({ is_active: false, revoked_at: new Date().toISOString() }).eq("id", session_id);
        if (error) throw error;
        await supabase.from("security_events").insert({
          user_id: target_user_id, event_type: "session_revoked", severity: "warning",
          description: "Session revoked by " + (callerId === target_user_id ? "user" : "admin"),
          metadata: { session_id, revoked_by: callerId },
        });
        return jsonResponse({ success: true });
      }

      default:
        return jsonResponse({ error: "Unknown action" }, 400);
    }
  } catch (error) {
    console.error("Security audit error:", error);
    return errorResponse(error);
  }
});
