import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { referralCode, newUserId } = await req.json();

    if (!referralCode || !newUserId) {
      return new Response(
        JSON.stringify({ error: "referralCode and newUserId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look up the referral code
    const { data: refData, error: refError } = await supabase
      .from("referral_codes")
      .select("id, user_id, total_conversions, total_points_earned")
      .eq("code", referralCode.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (refError || !refData) {
      return new Response(
        JSON.stringify({ error: "Invalid or inactive referral code", converted: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent self-referral
    if (refData.user_id === newUserId) {
      return new Response(
        JSON.stringify({ error: "Cannot refer yourself", converted: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already converted
    const { count: existingConversions } = await supabase
      .from("referral_conversions")
      .select("id", { count: "exact", head: true })
      .eq("referred_user_id", newUserId);

    if ((existingConversions || 0) > 0) {
      return new Response(
        JSON.stringify({ error: "User already converted via referral", converted: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get base points from earning rules
    const { data: referrerRule } = await supabase
      .from("points_earning_rules")
      .select("points")
      .eq("action_type", "referral_signup")
      .eq("is_active", true)
      .single();

    let referrerPoints = referrerRule?.points || 100;
    const inviteePoints = 25; // Welcome bonus for new user

    // ── Tiered referral bonuses ──
    const currentConversions = refData.total_conversions || 0;
    const { data: tierBonus } = await supabase
      .from("referral_tier_bonuses")
      .select("bonus_points, label")
      .lte("min_referrals", currentConversions + 1)
      .or(`max_referrals.gte.${currentConversions + 1},max_referrals.is.null`)
      .order("min_referrals", { ascending: false })
      .limit(1)
      .maybeSingle();

    const tierBonusPoints = tierBonus?.bonus_points || 0;
    referrerPoints += tierBonusPoints;

    // ── Check for active bonus campaigns ──
    const { data: activeCampaigns } = await supabase
      .from("bonus_campaigns")
      .select("multiplier, bonus_points, target_actions, campaign_type")
      .eq("is_active", true)
      .lte("starts_at", new Date().toISOString())
      .gte("ends_at", new Date().toISOString());

    let campaignMultiplier = 1;
    let campaignBonusFlat = 0;

    if (activeCampaigns && activeCampaigns.length > 0) {
      for (const camp of activeCampaigns) {
        const actions = camp.target_actions as string[] | null;
        const appliesToReferral = !actions || actions.length === 0 || actions.includes("referral_signup");
        if (appliesToReferral) {
          if (camp.campaign_type === "multiplier" && camp.multiplier) {
            campaignMultiplier = Math.max(campaignMultiplier, Number(camp.multiplier));
          }
          if (camp.bonus_points) {
            campaignBonusFlat += camp.bonus_points;
          }
        }
      }
    }

    referrerPoints = Math.floor(referrerPoints * campaignMultiplier) + campaignBonusFlat;

    // Record conversion
    const { error: convError } = await supabase.from("referral_conversions").insert({
      referral_code_id: refData.id,
      referrer_id: refData.user_id,
      referred_user_id: newUserId,
      points_awarded_referrer: referrerPoints,
      points_awarded_referred: inviteePoints,
    });

    if (convError) {
      console.error("Conversion insert error:", convError);
      return new Response(
        JSON.stringify({ error: "Failed to process referral. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Award points to referrer
    const tierLabel = tierBonusPoints > 0 ? ` (+${tierBonusPoints} tier bonus)` : "";
    const campLabel = campaignMultiplier > 1 ? ` (${campaignMultiplier}x campaign)` : "";

    await supabase.rpc("award_points", {
      p_user_id: refData.user_id,
      p_action_type: "referral_signup",
      p_points: referrerPoints,
      p_description: `Referral signup bonus${tierLabel}${campLabel}`,
      p_description_ar: `مكافأة تسجيل إحالة${tierBonusPoints > 0 ? ` (+${tierBonusPoints} مكافأة مستوى)` : ""}${campaignMultiplier > 1 ? ` (${campaignMultiplier}x حملة)` : ""}`,
      p_reference_type: "referral",
      p_reference_id: refData.id,
    });

    // Award welcome points to invitee
    const { data: inviteeWallet } = await supabase
      .from("user_wallets")
      .select("id")
      .eq("user_id", newUserId)
      .maybeSingle();

    if (inviteeWallet) {
      await supabase.rpc("award_points", {
        p_user_id: newUserId,
        p_action_type: "referral_welcome",
        p_points: inviteePoints,
        p_description: "Welcome bonus from referral",
        p_description_ar: "مكافأة ترحيبية من الإحالة",
        p_reference_type: "referral",
        p_reference_id: refData.id,
      });
    }

    // Update referral code stats
    await supabase
      .from("referral_codes")
      .update({
        total_conversions: currentConversions + 1,
        total_points_earned: (refData.total_points_earned || 0) + referrerPoints,
      })
      .eq("id", refData.id);

    // Update matched invitation status
    await supabase
      .from("referral_invitations")
      .update({ status: "converted" })
      .eq("referral_code_id", refData.id)
      .eq("status", "sent");

    console.log("Referral conversion processed:", {
      referrerId: refData.user_id,
      newUserId,
      referrerPoints,
      inviteePoints,
      tierBonus: tierBonusPoints,
      campaignMultiplier,
    });

    return new Response(
      JSON.stringify({
        converted: true,
        referrerPoints,
        inviteePoints,
        tierBonus: tierBonusPoints,
        campaignMultiplier,
        referrerId: refData.user_id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Process referral error:", error);
    return new Response(
      JSON.stringify({ error: "Service temporarily unavailable" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
