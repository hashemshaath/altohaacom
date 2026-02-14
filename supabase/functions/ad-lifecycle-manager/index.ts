import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };

    const now = new Date().toISOString();
    const results = { paused_expired: 0, paused_budget: 0, notifications_sent: 0, errors: [] as string[] };

    // 1. Auto-pause expired campaigns
    const expiredRes = await fetch(
      `${supabaseUrl}/rest/v1/ad_campaigns?status=eq.active&end_date=lt.${now}&select=id,name,name_ar,company_id`,
      { headers }
    );
    const expiredCampaigns = await expiredRes.json();

    if (Array.isArray(expiredCampaigns)) {
      for (const campaign of expiredCampaigns) {
        const updateRes = await fetch(
          `${supabaseUrl}/rest/v1/ad_campaigns?id=eq.${campaign.id}`,
          {
            method: "PATCH",
            headers: { ...headers, Prefer: "return=minimal" },
            body: JSON.stringify({ status: "completed" }),
          }
        );
        if (updateRes.ok) {
          results.paused_expired++;
          // Send notification
          await fetch(`${supabaseUrl}/rest/v1/notifications`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              user_id: null,
              title: `Campaign "${campaign.name}" has ended`,
              title_ar: `انتهت الحملة "${campaign.name_ar || campaign.name}"`,
              body: `The campaign has reached its end date and was automatically completed.`,
              body_ar: `وصلت الحملة إلى تاريخ انتهائها وتم إكمالها تلقائياً.`,
              type: "ad_lifecycle",
              metadata: { campaign_id: campaign.id, action: "auto_completed" },
            }),
          });
          results.notifications_sent++;
        }
      }
    }

    // 2. Auto-pause over-budget campaigns
    const overBudgetRes = await fetch(
      `${supabaseUrl}/rest/v1/ad_campaigns?status=eq.active&select=id,name,name_ar,company_id,budget,spent`,
      { headers }
    );
    const activeCampaigns = await overBudgetRes.json();

    if (Array.isArray(activeCampaigns)) {
      for (const campaign of activeCampaigns) {
        if (campaign.budget && campaign.spent && campaign.spent >= campaign.budget) {
          const updateRes = await fetch(
            `${supabaseUrl}/rest/v1/ad_campaigns?id=eq.${campaign.id}`,
            {
              method: "PATCH",
              headers: { ...headers, Prefer: "return=minimal" },
              body: JSON.stringify({ status: "paused" }),
            }
          );
          if (updateRes.ok) {
            results.paused_budget++;
            await fetch(`${supabaseUrl}/rest/v1/notifications`, {
              method: "POST",
              headers,
              body: JSON.stringify({
                user_id: null,
                title: `Campaign "${campaign.name}" paused - Budget exhausted`,
                title_ar: `تم إيقاف الحملة "${campaign.name_ar || campaign.name}" - استنفاد الميزانية`,
                body: `Spending (${campaign.spent} SAR) has reached the budget limit (${campaign.budget} SAR).`,
                body_ar: `وصل الإنفاق (${campaign.spent} ر.س) إلى حد الميزانية (${campaign.budget} ر.س).`,
                type: "ad_lifecycle",
                metadata: { campaign_id: campaign.id, action: "budget_exhausted" },
              }),
            });
            results.notifications_sent++;
          }
        }

        // 3. Budget warning at 80%
        if (campaign.budget && campaign.spent && campaign.spent >= campaign.budget * 0.8 && campaign.spent < campaign.budget) {
          await fetch(`${supabaseUrl}/rest/v1/notifications`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              user_id: null,
              title: `Campaign "${campaign.name}" - 80% budget used`,
              title_ar: `الحملة "${campaign.name_ar || campaign.name}" - تم استخدام 80% من الميزانية`,
              body: `Spending is at ${Math.round((campaign.spent / campaign.budget) * 100)}% of budget. Consider increasing the budget.`,
              body_ar: `الإنفاق عند ${Math.round((campaign.spent / campaign.budget) * 100)}% من الميزانية. فكر في زيادة الميزانية.`,
              type: "ad_budget_warning",
              metadata: { campaign_id: campaign.id, action: "budget_warning", percent_used: Math.round((campaign.spent / campaign.budget) * 100) },
            }),
          });
          results.notifications_sent++;
        }
      }
    }

    // Log automation run
    await fetch(`${supabaseUrl}/rest/v1/automation_runs`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "ad_lifecycle_management",
        status: "completed",
        started_at: now,
        completed_at: new Date().toISOString(),
        results,
      }),
    });

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
