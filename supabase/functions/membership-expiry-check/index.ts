import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GRACE_PERIOD_DAYS = 7;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const graceCutoff = new Date(now.getTime() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

    // 1. Suspend memberships past grace period
    const { data: toSuspend, error: suspendErr } = await supabase
      .from("profiles")
      .select("user_id, full_name, membership_tier, membership_expires_at")
      .eq("membership_status", "expired")
      .lt("membership_expires_at", graceCutoff.toISOString())
      .neq("membership_tier", "basic");

    if (suspendErr) throw suspendErr;

    let suspendedCount = 0;
    for (const profile of toSuspend || []) {
      await supabase
        .from("profiles")
        .update({ membership_status: "suspended", membership_tier: "basic" })
        .eq("user_id", profile.user_id);

      // Deactivate membership card
      await supabase
        .from("membership_cards")
        .update({ status: "suspended" })
        .eq("user_id", profile.user_id);

      // Log in history
      await supabase.from("membership_history").insert({
        user_id: profile.user_id,
        action: "suspended",
        from_tier: profile.membership_tier,
        to_tier: "basic",
        reason: "Auto-suspended after grace period expired",
      });

      // Notify user
      await supabase.from("notifications").insert({
        user_id: profile.user_id,
        title: "Membership suspended",
        title_ar: "تم تعليق العضوية",
        body: "Your " + profile.membership_tier + " membership has been suspended due to non-renewal. Renew to restore access.",
        body_ar: "تم تعليق عضويتك " + profile.membership_tier + " بسبب عدم التجديد. جدد لاستعادة الوصول.",
        type: "membership",
        link: "/membership/checkout?renew=true",
      });

      suspendedCount++;
    }

    // 2. Mark newly expired memberships (still in grace period)
    const { data: toExpire, error: expireErr } = await supabase
      .from("profiles")
      .select("user_id, full_name, membership_tier, membership_expires_at")
      .eq("membership_status", "active")
      .lt("membership_expires_at", now.toISOString())
      .neq("membership_tier", "basic");

    if (expireErr) throw expireErr;

    let expiredCount = 0;
    for (const profile of toExpire || []) {
      await supabase
        .from("profiles")
        .update({ membership_status: "expired" })
        .eq("user_id", profile.user_id);

      await supabase.from("membership_history").insert({
        user_id: profile.user_id,
        action: "expired",
        from_tier: profile.membership_tier,
        to_tier: profile.membership_tier,
        reason: "Membership expired - " + GRACE_PERIOD_DAYS + " day grace period started",
      });

      await supabase.from("notifications").insert({
        user_id: profile.user_id,
        title: "⚠️ Membership expired",
        title_ar: "⚠️ انتهت صلاحية العضوية",
        body: "Your membership has expired. Renew within " + GRACE_PERIOD_DAYS + " days to keep your benefits.",
        body_ar: "انتهت صلاحية عضويتك. جدد خلال " + GRACE_PERIOD_DAYS + " أيام للاحتفاظ بمميزاتك.",
        type: "membership",
        link: "/membership/checkout?renew=true",
      });

      expiredCount++;
    }

    // 3. Send reminder notifications for memberships expiring in 3 days
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const { data: expiringSoon } = await supabase
      .from("profiles")
      .select("user_id, membership_tier, membership_expires_at")
      .eq("membership_status", "active")
      .gt("membership_expires_at", now.toISOString())
      .lte("membership_expires_at", threeDaysFromNow.toISOString())
      .neq("membership_tier", "basic");

    let reminderCount = 0;
    for (const profile of expiringSoon || []) {
      // Check if we already sent a reminder today
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", profile.user_id)
        .eq("type", "membership_reminder")
        .gte("created_at", new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString())
        .limit(1);

      if (!existing?.length) {
        await supabase.from("notifications").insert({
          user_id: profile.user_id,
          title: "🔔 Membership expiring soon",
          title_ar: "🔔 العضوية تنتهي قريباً",
          body: "Your " + profile.membership_tier + " membership expires in less than 3 days. Renew now!",
          body_ar: "عضويتك " + profile.membership_tier + " تنتهي خلال أقل من 3 أيام. جدد الآن!",
          type: "membership_reminder",
          link: "/membership/checkout?renew=true",
        });
        reminderCount++;
      }
    }

    console.log(`Expiry check complete: ${expiredCount} expired, ${suspendedCount} suspended, ${reminderCount} reminders sent`);

    return new Response(
      JSON.stringify({
        success: true,
        expired: expiredCount,
        suspended: suspendedCount,
        reminders: reminderCount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Membership expiry check error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
