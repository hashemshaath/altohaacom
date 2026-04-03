import { handleCors } from "../_shared/cors.ts";
import { authenticateRequest, getServiceClient } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { userId } = await authenticateRequest(req);

    const { actionType, referenceType, referenceId, metadata } = await req.json();
    if (!actionType) {
      return jsonResponse({ error: "actionType is required" }, 400);
    }

    const supabase = getServiceClient();

    // Fetch the earning rule
    const { data: rule, error: ruleError } = await supabase
      .from("points_earning_rules")
      .select("id, action_type, action_label, action_label_ar, points, max_per_day, max_per_user, is_active, description")
      .eq("action_type", actionType)
      .eq("is_active", true)
      .single();

    if (ruleError || !rule) {
      return jsonResponse({ error: "No active earning rule for this action", awarded: false });
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
        return jsonResponse({ error: "Daily limit reached", awarded: false, limit: rule.max_per_day });
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
        return jsonResponse({ error: "Lifetime limit reached", awarded: false });
      }
    }

    // Prevent duplicate for one-time actions
    if (!rule.max_per_day && referenceId) {
      const { count } = await supabase
        .from("points_ledger")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("action_type", actionType)
        .eq("reference_id", referenceId);

      if ((count || 0) > 0) {
        return jsonResponse({ error: "Points already awarded for this action", awarded: false });
      }
    }

    // Award points
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
      return jsonResponse({ error: "Failed to award points. Please try again." }, 500);
    }

    console.log("Points awarded:", { userId, actionType, points: rule.points, newBalance });

    return jsonResponse({
      awarded: true,
      points: rule.points,
      newBalance,
      actionLabel: rule.action_label,
      actionLabelAr: rule.action_label_ar,
    });
  } catch (error) {
    console.error("Award points error:", error);
    return errorResponse(error);
  }
});
