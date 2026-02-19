import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AwardPointsPayload {
  actionType: string;
  referenceType?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const payload: AwardPointsPayload = await req.json();
    const { actionType, referenceType, referenceId, metadata } = payload;

    if (!actionType) {
      return new Response(JSON.stringify({ error: "actionType is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the earning rule
    const { data: rule, error: ruleError } = await supabase
      .from("points_earning_rules")
      .select("*")
      .eq("action_type", actionType)
      .eq("is_active", true)
      .single();

    if (ruleError || !rule) {
      return new Response(
        JSON.stringify({ error: "No active earning rule for this action", awarded: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check daily limit
    if (rule.max_per_day) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("points_ledger")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("action_type", actionType)
        .gte("created_at", todayStart.toISOString());

      if ((count || 0) >= rule.max_per_day) {
        return new Response(
          JSON.stringify({ error: "Daily limit reached", awarded: false, limit: rule.max_per_day }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check lifetime max_per_user
    if (rule.max_per_user) {
      const { count } = await supabase
        .from("points_ledger")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("action_type", actionType);

      if ((count || 0) >= rule.max_per_user) {
        return new Response(
          JSON.stringify({ error: "Lifetime limit reached", awarded: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Prevent duplicate for one-time actions (no daily limit = likely one-time per reference)
    if (!rule.max_per_day && referenceId) {
      const { count } = await supabase
        .from("points_ledger")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("action_type", actionType)
        .eq("reference_id", referenceId);

      if ((count || 0) > 0) {
        return new Response(
          JSON.stringify({ error: "Points already awarded for this action", awarded: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Award points using the DB function
    const { data: newBalance, error: awardError } = await supabase.rpc("award_points", {
      p_user_id: userId,
      p_action_type: actionType,
      p_points: rule.points,
      p_description: rule.action_label,
      p_description_ar: rule.action_label_ar,
      p_reference_type: referenceType || null,
      p_reference_id: referenceId || null,
    });

    if (awardError) {
      console.error("Award points error:", awardError);
      return new Response(
        JSON.stringify({ error: "Failed to award points. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Points awarded:", { userId, actionType, points: rule.points, newBalance });

    return new Response(
      JSON.stringify({
        awarded: true,
        points: rule.points,
        newBalance,
        actionLabel: rule.action_label,
        actionLabelAr: rule.action_label_ar,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Award points error:", error);
    return new Response(
      JSON.stringify({ error: "Service temporarily unavailable" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
