import { handleCors } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const supabase = getServiceClient();
    const now = new Date().toISOString();
    const results = { paused_expired: 0, paused_budget: 0, notifications_sent: 0, errors: [] as string[] };

    // 1. Auto-complete expired campaigns
    const { data: expiredCampaigns } = await supabase
      .from("ad_campaigns")
      .select("id, name, name_ar, company_id")
      .eq("status", "active")
      .lt("end_date", now);

    for (const campaign of expiredCampaigns || []) {
      const { error } = await supabase
        .from("ad_campaigns")
        .update({ status: "completed" })
        .eq("id", campaign.id);

      if (!error) {
        results.paused_expired++;
        await supabase.from("notifications").insert({
          user_id: null,
          title: `Campaign "${campaign.name}" has ended`,
          title_ar: `انتهت الحملة "${campaign.name_ar || campaign.name}"`,
          body: `The campaign has reached its end date and was automatically completed.`,
          body_ar: `وصلت الحملة إلى تاريخ انتهائها وتم إكمالها تلقائياً.`,
          type: "ad_lifecycle",
          metadata: { campaign_id: campaign.id, action: "auto_completed" },
        });
        results.notifications_sent++;
      }
    }

    // 2. Auto-pause over-budget campaigns + 80% warnings
    const { data: activeCampaigns } = await supabase
      .from("ad_campaigns")
      .select("id, name, name_ar, company_id, budget, spent")
      .eq("status", "active");

    for (const campaign of activeCampaigns || []) {
      if (!campaign.budget || !campaign.spent) continue;

      if (campaign.spent >= campaign.budget) {
        const { error } = await supabase
          .from("ad_campaigns")
          .update({ status: "paused" })
          .eq("id", campaign.id);

        if (!error) {
          results.paused_budget++;
          await supabase.from("notifications").insert({
            user_id: null,
            title: `Campaign "${campaign.name}" paused - Budget exhausted`,
            title_ar: `تم إيقاف الحملة "${campaign.name_ar || campaign.name}" - استنفاد الميزانية`,
            body: `Spending (${campaign.spent} SAR) has reached the budget limit (${campaign.budget} SAR).`,
            body_ar: `وصل الإنفاق (${campaign.spent} ر.س) إلى حد الميزانية (${campaign.budget} ر.س).`,
            type: "ad_lifecycle",
            metadata: { campaign_id: campaign.id, action: "budget_exhausted" },
          });
          results.notifications_sent++;
        }
      } else if (campaign.spent >= campaign.budget * 0.8) {
        const pct = Math.round((campaign.spent / campaign.budget) * 100);
        await supabase.from("notifications").insert({
          user_id: null,
          title: `Campaign "${campaign.name}" - 80% budget used`,
          title_ar: `الحملة "${campaign.name_ar || campaign.name}" - تم استخدام 80% من الميزانية`,
          body: `Spending is at ${pct}% of budget. Consider increasing the budget.`,
          body_ar: `الإنفاق عند ${pct}% من الميزانية. فكر في زيادة الميزانية.`,
          type: "ad_budget_warning",
          metadata: { campaign_id: campaign.id, action: "budget_warning", percent_used: pct },
        });
        results.notifications_sent++;
      }
    }

    // Log automation run
    await supabase.from("automation_runs").insert({
      action: "ad_lifecycle_management",
      status: "completed",
      started_at: now,
      completed_at: new Date().toISOString(),
      results,
    });

    return jsonResponse(results);
  } catch (error) {
    console.error("Ad lifecycle error:", error);
    return errorResponse(error);
  }
});
