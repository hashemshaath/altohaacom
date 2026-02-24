import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const token = authHeader.replace("Bearer ", "");

    // Validate caller
    const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    let callerId: string | null = null;
    let isServiceCall = token === serviceKey;

    if (!isServiceCall) {
      const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      callerId = claimsData.claims.sub as string;
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "log_event": {
        const { user_id, event_type, severity, description, description_ar, metadata, ip_address, user_agent } = body;
        const { data, error } = await supabase
          .from("security_events")
          .insert({
            user_id: user_id || callerId,
            event_type,
            severity: severity || "info",
            description,
            description_ar,
            ip_address,
            user_agent,
            metadata: metadata || {},
          })
          .select("id")
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, id: data.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_dashboard": {
        // Verify admin
        if (!isServiceCall && callerId) {
          const { data: isAdmin } = await supabase.rpc("is_admin", { p_user_id: callerId });
          if (!isAdmin) {
            return new Response(JSON.stringify({ error: "Admin access required" }), {
              status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }

        // Get stats
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [eventsRes, criticalRes, sessionsRes, blockedRes] = await Promise.all([
          supabase.from("security_events").select("id", { count: "exact", head: true }).gte("created_at", last24h),
          supabase.from("security_events").select("id", { count: "exact", head: true }).eq("severity", "critical").gte("created_at", last7d),
          supabase.from("user_sessions").select("id", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("ip_blocklist").select("id", { count: "exact", head: true }).eq("is_active", true),
        ]);

        // Recent events
        const { data: recentEvents } = await supabase
          .from("security_events")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        // Event type breakdown
        const { data: typeBreakdown } = await supabase
          .from("security_events")
          .select("event_type")
          .gte("created_at", last7d);

        const typeCounts: Record<string, number> = {};
        (typeBreakdown || []).forEach((e: any) => {
          typeCounts[e.event_type] = (typeCounts[e.event_type] || 0) + 1;
        });

        return new Response(JSON.stringify({
          success: true,
          stats: {
            events_24h: eventsRes.count || 0,
            critical_7d: criticalRes.count || 0,
            active_sessions: sessionsRes.count || 0,
            blocked_ips: blockedRes.count || 0,
          },
          recent_events: recentEvents || [],
          type_breakdown: typeCounts,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "block_ip": {
        if (!isServiceCall && callerId) {
          const { data: isAdmin } = await supabase.rpc("is_admin", { p_user_id: callerId });
          if (!isAdmin) {
            return new Response(JSON.stringify({ error: "Admin access required" }), {
              status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }

        const { ip_address, reason, expires_hours } = body;
        const expiresAt = expires_hours
          ? new Date(Date.now() + expires_hours * 60 * 60 * 1000).toISOString()
          : null;

        const { error } = await supabase
          .from("ip_blocklist")
          .upsert({
            ip_address,
            reason,
            blocked_by: callerId,
            expires_at: expiresAt,
            is_active: true,
          }, { onConflict: "ip_address" });

        if (error) throw error;

        await supabase.from("security_events").insert({
          user_id: callerId,
          event_type: "ip_blocked",
          severity: "warning",
          description: `IP ${ip_address} blocked: ${reason}`,
          metadata: { ip_address, reason, expires_hours },
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "revoke_session": {
        const { session_id, target_user_id } = body;

        // Admin can revoke any, users can revoke own
        if (callerId && callerId !== target_user_id) {
          const { data: isAdmin } = await supabase.rpc("is_admin", { p_user_id: callerId });
          if (!isAdmin) {
            return new Response(JSON.stringify({ error: "Cannot revoke other users' sessions" }), {
              status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }

        const { error } = await supabase
          .from("user_sessions")
          .update({ is_active: false, revoked_at: new Date().toISOString() })
          .eq("id", session_id);

        if (error) throw error;

        await supabase.from("security_events").insert({
          user_id: target_user_id,
          event_type: "session_revoked",
          severity: "warning",
          description: "Session revoked by " + (callerId === target_user_id ? "user" : "admin"),
          metadata: { session_id, revoked_by: callerId },
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: any) {
    console.error("Security audit error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
