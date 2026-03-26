import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const in1Day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Find users with expiring memberships
    const { data: expiringProfiles, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, username, membership_tier, membership_expires_at")
      .not("membership_expires_at", "is", null)
      .neq("membership_tier", "basic")
      .lte("membership_expires_at", in14Days.toISOString())
      .gt("membership_expires_at", now.toISOString());

    if (error) throw error;

    // Find expired memberships (expired within last 24h to avoid re-notifying)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const { data: expiredProfiles, error: expiredError } = await supabase
      .from("profiles")
      .select("user_id, full_name, username, membership_tier, membership_expires_at")
      .not("membership_expires_at", "is", null)
      .neq("membership_tier", "basic")
      .lte("membership_expires_at", now.toISOString())
      .gte("membership_expires_at", yesterday.toISOString());

    if (expiredError) throw expiredError;

    let notificationsCreated = 0;

    // Process expiring memberships
    for (const profile of expiringProfiles || []) {
      const expiresAt = new Date(profile.membership_expires_at);
      const diffMs = expiresAt.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let notificationType: string;
      if (daysLeft <= 1) {
        notificationType = "membership_expiry_1d";
      } else if (daysLeft <= 3) {
        notificationType = "membership_expiry_3d";
      } else if (daysLeft <= 7) {
        notificationType = "membership_expiry_7d";
      } else {
        notificationType = "membership_expiry_14d";
      }

      // Check if we already sent this notification type today
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", profile.user_id)
        .eq("type", notificationType)
        .gte("created_at", todayStart.toISOString())
        .limit(1);

      if (existing && existing.length > 0) continue;

      const name = profile.full_name || profile.username || "Member";
      const tier = profile.membership_tier;

      await supabase.from("notifications").insert({
        user_id: profile.user_id,
        title: daysLeft <= 1
          ? `⚠️ Your ${tier} membership expires tomorrow!`
          : `⏰ Your ${tier} membership expires in ${daysLeft} days`,
        title_ar: daysLeft <= 1
          ? `⚠️ عضويتك ${tier} تنتهي غداً!`
          : `⏰ عضويتك ${tier} تنتهي خلال ${daysLeft} أيام`,
        body: `Renew now to keep your premium features.`,
        body_ar: `جدد الآن للحفاظ على ميزاتك المميزة.`,
        type: notificationType,
        link: "/membership",
        metadata: {
          membership_tier: tier,
          expires_at: profile.membership_expires_at,
          days_left: daysLeft,
        },
      });

      notificationsCreated++;
    }

    // Process expired memberships — auto-downgrade + notify
    let autoDowngraded = 0;
    for (const profile of expiredProfiles || []) {
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", profile.user_id)
        .eq("type", "membership_expired")
        .gte("created_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (existing && existing.length > 0) continue;

      const tierLabels: Record<string, string> = { professional: "احترافي", enterprise: "مؤسسي" };
      const tierLabelAr = tierLabels[profile.membership_tier] || profile.membership_tier;

      // Auto-downgrade to basic
      const { error: downgradeError } = await supabase
        .from("profiles")
        .update({
          membership_tier: "basic",
          membership_status: "expired",
        })
        .eq("user_id", profile.user_id);

      if (!downgradeError) {
        autoDowngraded++;

        // Log history
        await supabase.from("membership_history").insert({
          user_id: profile.user_id,
          previous_tier: profile.membership_tier,
          new_tier: "basic",
          reason: "Auto-expired: membership period ended",
        });

        // Deactivate membership card
        await supabase
          .from("membership_cards")
          .update({ card_status: "expired" })
          .eq("user_id", profile.user_id);

        // Create invoice record for the expired period
        await supabase.from("invoices").insert({
          invoice_number: `INV-EXP-${Date.now().toString(36).toUpperCase()}`,
          user_id: profile.user_id,
          amount: 0,
          currency: "SAR",
          status: "void",
          notes: `Membership expired: ${profile.membership_tier}`,
          notes_ar: `انتهاء العضوية: ${tierLabelAr}`,
        });
      }

      await supabase.from("notifications").insert({
        user_id: profile.user_id,
        title: `🔴 Your ${profile.membership_tier} membership has expired`,
        title_ar: `🔴 انتهت عضويتك ${tierLabelAr}`,
        body: `Your account has been moved to the Basic tier. Renew to restore premium access.`,
        body_ar: `تم نقل حسابك إلى المستوى الأساسي. جدد لاستعادة الوصول المميز.`,
        type: "membership_expired",
        link: "/membership",
        metadata: {
          membership_tier: profile.membership_tier,
          expired_at: profile.membership_expires_at,
          auto_downgraded: true,
        },
      });

      notificationsCreated++;
    }

    // Process trial expirations
    const { data: expiredTrials } = await supabase
      .from("profiles")
      .select("user_id, full_name, membership_tier, trial_ends_at, trial_tier")
      .not("trial_ends_at", "is", null)
      .eq("trial_expired", false)
      .lte("trial_ends_at", now.toISOString());

    let trialsExpired = 0;
    for (const trial of expiredTrials || []) {
      await supabase.from("profiles").update({
        membership_tier: "basic",
        trial_expired: true,
        membership_status: "active",
      }).eq("user_id", trial.user_id);

      await supabase.from("membership_history").insert({
        user_id: trial.user_id,
        previous_tier: trial.membership_tier,
        new_tier: "basic",
        reason: "Trial period ended",
      });

      await supabase.from("notifications").insert({
        user_id: trial.user_id,
        title: "⏳ Your free trial has ended",
        title_ar: "⏳ انتهت تجربتك المجانية",
        body: "Upgrade now to keep your premium features!",
        body_ar: "قم بالترقية الآن للحفاظ على ميزاتك المميزة!",
        type: "trial_expired",
        link: "/membership",
      });

      trialsExpired++;
      notificationsCreated++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        notifications_created: notificationsCreated,
        expiring_count: expiringProfiles?.length || 0,
        expired_count: expiredProfiles?.length || 0,
        auto_downgraded: autoDowngraded,
        trials_expired: trialsExpired,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Membership expiry check failed:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
