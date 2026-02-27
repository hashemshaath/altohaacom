import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();

    // Get active trial cards expiring in 1 or 3 days
    const { data: cards, error } = await supabase
      .from("membership_cards")
      .select("user_id, trial_ends_at, membership_number")
      .eq("is_trial", true)
      .eq("card_status", "active")
      .not("trial_ends_at", "is", null);

    if (error) throw error;

    let sent3Day = 0;
    let sent1Day = 0;

    for (const card of cards || []) {
      const expiresAt = new Date(card.trial_ends_at);
      const diffMs = expiresAt.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let notifType: string | null = null;
      let titleEn = "";
      let titleAr = "";
      let bodyEn = "";
      let bodyAr = "";

      if (diffDays === 3) {
        notifType = "trial_expiry_3day";
        titleEn = "⏰ Your trial expires in 3 days";
        titleAr = "⏰ تنتهي فترتك التجريبية خلال 3 أيام";
        bodyEn = "Upgrade now to keep all your membership benefits.";
        bodyAr = "قم بالترقية الآن للحفاظ على جميع مميزات عضويتك.";
      } else if (diffDays === 1) {
        notifType = "trial_expiry_1day";
        titleEn = "🚨 Your trial expires tomorrow!";
        titleAr = "🚨 تنتهي فترتك التجريبية غداً!";
        bodyEn = "Last chance to upgrade and keep your benefits.";
        bodyAr = "فرصتك الأخيرة للترقية والحفاظ على مميزاتك.";
      }

      if (!notifType) continue;

      // Check if already notified (prevent duplicates)
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", card.user_id)
        .eq("type", notifType)
        .gte("created_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

      if ((count || 0) > 0) continue;

      await supabase.from("notifications").insert({
        user_id: card.user_id,
        title: titleEn,
        title_ar: titleAr,
        body: bodyEn,
        body_ar: bodyAr,
        type: notifType,
        link: "/profile?tab=membership",
        metadata: {
          trial_ends_at: card.trial_ends_at,
          days_remaining: diffDays,
        },
      });

      if (diffDays === 3) sent3Day++;
      else sent1Day++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent_3day: sent3Day,
        sent_1day: sent1Day,
        checked: cards?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
