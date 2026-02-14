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

    // Get points from earning rules
    const { data: referrerRule } = await supabase
      .from("points_earning_rules")
      .select("points")
      .eq("action_type", "referral_signup")
      .eq("is_active", true)
      .single();

    const referrerPoints = referrerRule?.points || 100;
    const inviteePoints = 25; // Welcome bonus for new user

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
        JSON.stringify({ error: convError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Award points to referrer
    await supabase.rpc("award_points", {
      p_user_id: refData.user_id,
      p_action_type: "referral_signup",
      p_points: referrerPoints,
      p_description: "Referral signup bonus",
      p_description_ar: "مكافأة تسجيل إحالة",
      p_reference_type: "referral",
      p_reference_id: refData.id,
    });

    // Award welcome points to invitee (wait for wallet to be created)
    // The auto_create_user_wallet trigger should have fired by now
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

    // Update referral code stats atomically
    await supabase
      .from("referral_codes")
      .update({
        total_conversions: (refData.total_conversions || 0) + 1,
        total_points_earned: (refData.total_points_earned || 0) + referrerPoints,
      })
      .eq("id", refData.id);

    // Update matched invitation status if exists
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
    });

    return new Response(
      JSON.stringify({
        converted: true,
        referrerPoints,
        inviteePoints,
        referrerId: refData.user_id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Process referral error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
