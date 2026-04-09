import { handleCors } from "../_shared/cors.ts";
import { authenticateRequest, getServiceClient } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    // Allow service role or authenticated user
    const authHeader = req.headers.get("Authorization");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const token = authHeader?.replace("Bearer ", "") || "";

    if (token !== serviceKey) {
      await authenticateRequest(req);
    }

    const supabase = getServiceClient();
    const { referralCode, newUserId } = await req.json();

    if (!referralCode || !newUserId) {
      return jsonResponse({ error: "referralCode and newUserId are required" }, 400);
    }

    // Look up referral code
    const { data: refData, error: refError } = await supabase
      .from("referral_codes")
      .select("id, user_id, total_conversions, total_points_earned")
      .eq("code", referralCode.toUpperCase()).eq("is_active", true).maybeSingle();

    if (refError || !refData) {
      return jsonResponse({ error: "Invalid or inactive referral code", converted: false });
    }

    if (refData.user_id === newUserId) {
      return jsonResponse({ error: "Cannot refer yourself", converted: false });
    }

    // Check already converted
    const { count: existingConversions } = await supabase
      .from("referral_conversions").select("id", { count: "exact", head: true }).eq("referred_user_id", newUserId);

    if ((existingConversions || 0) > 0) {
      return jsonResponse({ error: "User already converted via referral", converted: false });
    }

    // Get points rules + tier bonuses + campaigns in parallel
    const currentConversions = refData.total_conversions || 0;
    const [{ data: referrerRule }, { data: tierBonus }, { data: activeCampaigns }] = await Promise.all([
      supabase.from("points_earning_rules").select("points").eq("action_type", "referral_signup").eq("is_active", true).single(),
      supabase.from("referral_tier_bonuses").select("bonus_points, label")
        .lte("min_referrals", currentConversions + 1)
        .or(`max_referrals.gte.${currentConversions + 1},max_referrals.is.null`)
        .order("min_referrals", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("bonus_campaigns").select("multiplier, bonus_points, target_actions, campaign_type")
        .eq("is_active", true).lte("starts_at", new Date().toISOString()).gte("ends_at", new Date().toISOString()),
    ]);

    let referrerPoints = referrerRule?.points || 100;
    const inviteePoints = 25;
    const tierBonusPoints = tierBonus?.bonus_points || 0;
    referrerPoints += tierBonusPoints;

    // Apply campaign multipliers
    let campaignMultiplier = 1;
    let campaignBonusFlat = 0;
    for (const camp of activeCampaigns || []) {
      const actions = camp.target_actions as string[] | null;
      if (!actions || actions.length === 0 || actions.includes("referral_signup")) {
        if (camp.campaign_type === "multiplier" && camp.multiplier) campaignMultiplier = Math.max(campaignMultiplier, Number(camp.multiplier));
        if (camp.bonus_points) campaignBonusFlat += camp.bonus_points;
      }
    }
    referrerPoints = Math.floor(referrerPoints * campaignMultiplier) + campaignBonusFlat;

    // Record conversion
    const { error: convError } = await supabase.from("referral_conversions").insert({
      referral_code_id: refData.id, referrer_id: refData.user_id, referred_user_id: newUserId,
      points_awarded_referrer: referrerPoints, points_awarded_referred: inviteePoints,
    });
    if (convError) {
      console.error("Conversion insert error:", convError);
      return jsonResponse({ error: "Failed to process referral. Please try again." }, 500);
    }

    // Award points to referrer
    const tierLabel = tierBonusPoints > 0 ? ` (+${tierBonusPoints} tier bonus)` : "";
    const campLabel = campaignMultiplier > 1 ? ` (${campaignMultiplier}x campaign)` : "";

    await supabase.rpc("award_points", {
      p_user_id: refData.user_id, p_action_type: "referral_signup", p_points: referrerPoints,
      p_description: `Referral signup bonus${tierLabel}${campLabel}`,
      p_description_ar: `مكافأة تسجيل إحالة${tierBonusPoints > 0 ? ` (+${tierBonusPoints} مكافأة مستوى)` : ""}${campaignMultiplier > 1 ? ` (${campaignMultiplier}x حملة)` : ""}`,
      p_reference_type: "referral", p_reference_id: refData.id,
    });

    // Award welcome points to invitee
    const { data: inviteeWallet } = await supabase.from("user_wallets").select("id").eq("user_id", newUserId).maybeSingle();
    if (inviteeWallet) {
      await supabase.rpc("award_points", {
        p_user_id: newUserId, p_action_type: "referral_welcome", p_points: inviteePoints,
        p_description: "Welcome bonus from referral", p_description_ar: "مكافأة ترحيبية من الإحالة",
        p_reference_type: "referral", p_reference_id: refData.id,
      });
    }

    // Update stats
    await Promise.all([
      supabase.from("referral_codes").update({ total_conversions: currentConversions + 1, total_points_earned: (refData.total_points_earned || 0) + referrerPoints }).eq("id", refData.id),
      supabase.from("referral_invitations").update({ status: "converted" }).eq("referral_code_id", refData.id).eq("status", "sent"),
    ]);

    console.log("Referral conversion processed:", { referrerId: refData.user_id, newUserId, referrerPoints, inviteePoints, tierBonus: tierBonusPoints, campaignMultiplier });

    return jsonResponse({ converted: true, referrerPoints, inviteePoints, tierBonus: tierBonusPoints, campaignMultiplier, referrerId: refData.user_id });
  } catch (error: unknown) {
    console.error("Process referral error:", error);
    return errorResponse(error);
  }
});
