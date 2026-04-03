import { handleCors } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const supabase = getServiceClient();
    const now = new Date();

    const { data: cards, error } = await supabase
      .from("membership_cards").select("user_id, trial_ends_at, membership_number")
      .eq("is_trial", true).eq("card_status", "active").not("trial_ends_at", "is", null);
    if (error) throw error;

    let sent3Day = 0, sent1Day = 0;

    for (const card of cards || []) {
      const diffDays = Math.ceil((new Date(card.trial_ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays !== 3 && diffDays !== 1) continue;

      const notifType = diffDays === 3 ? "trial_expiry_3day" : "trial_expiry_1day";

      const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true })
        .eq("user_id", card.user_id).eq("type", notifType)
        .gte("created_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());
      if ((count || 0) > 0) continue;

      await supabase.from("notifications").insert({
        user_id: card.user_id,
        title: diffDays === 3 ? "⏰ Your trial expires in 3 days" : "🚨 Your trial expires tomorrow!",
        title_ar: diffDays === 3 ? "⏰ تنتهي فترتك التجريبية خلال 3 أيام" : "🚨 تنتهي فترتك التجريبية غداً!",
        body: diffDays === 3 ? "Upgrade now to keep all your membership benefits." : "Last chance to upgrade and keep your benefits.",
        body_ar: diffDays === 3 ? "قم بالترقية الآن للحفاظ على جميع مميزات عضويتك." : "فرصتك الأخيرة للترقية والحفاظ على مميزاتك.",
        type: notifType, link: "/profile?tab=membership",
        metadata: { trial_ends_at: card.trial_ends_at, days_remaining: diffDays },
      });
      if (diffDays === 3) sent3Day++; else sent1Day++;
    }

    return jsonResponse({ success: true, sent_3day: sent3Day, sent_1day: sent1Day, checked: cards?.length || 0 });
  } catch (err) {
    console.error("Trial expiry reminders error:", err);
    return errorResponse(err);
  }
});
