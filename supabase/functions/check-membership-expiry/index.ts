import { handleCors } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const supabase = getServiceClient();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const now = new Date();
    const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Parallel fetch: expiring + expired + trials
    const [
      { data: expiringProfiles, error: expError },
      { data: expiredProfiles, error: expiredError },
      { data: expiredTrials },
    ] = await Promise.all([
      supabase.from("profiles")
        .select("user_id, full_name, username, membership_tier, membership_expires_at")
        .not("membership_expires_at", "is", null).neq("membership_tier", "basic")
        .lte("membership_expires_at", in14Days.toISOString()).gt("membership_expires_at", now.toISOString()),
      supabase.from("profiles")
        .select("user_id, full_name, username, membership_tier, membership_expires_at")
        .not("membership_expires_at", "is", null).neq("membership_tier", "basic")
        .lte("membership_expires_at", now.toISOString()).gte("membership_expires_at", yesterday.toISOString()),
      supabase.from("profiles")
        .select("user_id, full_name, membership_tier, trial_ends_at, trial_tier")
        .not("trial_ends_at", "is", null).eq("trial_expired", false)
        .lte("trial_ends_at", now.toISOString()),
    ]);

    if (expError) throw expError;
    if (expiredError) throw expiredError;

    let notificationsCreated = 0;
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);

    const alreadySent = async (userId: string, type: string) => {
      const { data } = await supabase.from("notifications").select("id")
        .eq("user_id", userId).eq("type", type).gte("created_at", todayStart.toISOString()).limit(1);
      return (data?.length || 0) > 0;
    };

    const sendEmail = async (type: string, user_id: string, data?: any) => {
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-membership-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
          body: JSON.stringify({ type, user_id, data }),
        });
      } catch (e) { console.error("Email failed:", e); }
    };

    // Process expiring memberships
    for (const profile of expiringProfiles || []) {
      const daysLeft = Math.ceil((new Date(profile.membership_expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const notificationType = daysLeft <= 1 ? "membership_expiry_1d" : daysLeft <= 3 ? "membership_expiry_3d" : daysLeft <= 7 ? "membership_expiry_7d" : "membership_expiry_14d";
      if (await alreadySent(profile.user_id, notificationType)) continue;

      const tier = profile.membership_tier;
      await supabase.from("notifications").insert({
        user_id: profile.user_id,
        title: daysLeft <= 1 ? `⚠️ Your ${tier} membership expires tomorrow!` : `⏰ Your ${tier} membership expires in ${daysLeft} days`,
        title_ar: daysLeft <= 1 ? `⚠️ عضويتك ${tier} تنتهي غداً!` : `⏰ عضويتك ${tier} تنتهي خلال ${daysLeft} أيام`,
        body: `Renew now to keep your premium features.`,
        body_ar: `جدد الآن للحفاظ على ميزاتك المميزة.`,
        type: notificationType, link: "/membership",
        metadata: { membership_tier: tier, expires_at: profile.membership_expires_at, days_left: daysLeft },
      });
      await sendEmail("expiry_warning", profile.user_id, { tier, days_left: daysLeft });
      notificationsCreated++;
    }

    // Process expired memberships
    let autoDowngraded = 0;
    for (const profile of expiredProfiles || []) {
      if (await alreadySent(profile.user_id, "membership_expired")) continue;
      const tierLabels: Record<string, string> = { professional: "احترافي", enterprise: "مؤسسي" };
      const tierLabelAr = tierLabels[profile.membership_tier] || profile.membership_tier;

      const { error: downgradeError } = await supabase.from("profiles")
        .update({ membership_tier: "basic", membership_status: "expired" }).eq("user_id", profile.user_id);

      if (!downgradeError) {
        autoDowngraded++;
        await Promise.all([
          supabase.from("membership_history").insert({ user_id: profile.user_id, previous_tier: profile.membership_tier, new_tier: "basic", reason: "Auto-expired: membership period ended" }),
          supabase.from("membership_cards").update({ card_status: "expired" }).eq("user_id", profile.user_id),
          supabase.from("invoices").insert({ invoice_number: `INV-EXP-${Date.now().toString(36).toUpperCase()}`, user_id: profile.user_id, amount: 0, currency: "SAR", status: "void", notes: `Membership expired: ${profile.membership_tier}`, notes_ar: `انتهاء العضوية: ${tierLabelAr}` }),
        ]);
      }

      await supabase.from("notifications").insert({
        user_id: profile.user_id,
        title: `🔴 Your ${profile.membership_tier} membership has expired`,
        title_ar: `🔴 انتهت عضويتك ${tierLabelAr}`,
        body: `Your account has been moved to the Basic tier. Renew to restore premium access.`,
        body_ar: `تم نقل حسابك إلى المستوى الأساسي. جدد لاستعادة الوصول المميز.`,
        type: "membership_expired", link: "/membership",
        metadata: { membership_tier: profile.membership_tier, expired_at: profile.membership_expires_at, auto_downgraded: true },
      });
      await sendEmail("expired", profile.user_id, { tier: profile.membership_tier });
      notificationsCreated++;
    }

    // Process trial expirations
    let trialsExpired = 0;
    for (const trial of expiredTrials || []) {
      await supabase.from("profiles").update({ membership_tier: "basic", trial_expired: true, membership_status: "active" }).eq("user_id", trial.user_id);
      await supabase.from("membership_history").insert({ user_id: trial.user_id, previous_tier: trial.membership_tier, new_tier: "basic", reason: "Trial period ended" });
      await supabase.from("notifications").insert({
        user_id: trial.user_id,
        title: "⏳ Your free trial has ended", title_ar: "⏳ انتهت تجربتك المجانية",
        body: "Upgrade now to keep your premium features!", body_ar: "قم بالترقية الآن للحفاظ على ميزاتك المميزة!",
        type: "trial_expired", link: "/membership",
      });
      await sendEmail("trial_expired", trial.user_id, { tier: trial.membership_tier });
      trialsExpired++; notificationsCreated++;
    }

    return jsonResponse({
      success: true, notifications_created: notificationsCreated,
      expiring_count: expiringProfiles?.length || 0, expired_count: expiredProfiles?.length || 0,
      auto_downgraded: autoDowngraded, trials_expired: trialsExpired,
    });
  } catch (err) {
    console.error("Membership expiry check failed:", err);
    return errorResponse(err);
  }
});
