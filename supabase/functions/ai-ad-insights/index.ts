import { handleCors } from "../_shared/cors.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";
import { authenticateAdmin, getServiceClient } from "../_shared/auth.ts";
import { callAI, parseAIJson } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { adminClient } = await authenticateAdmin(req);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    };

    // Fetch ad performance data in parallel
    const [impressionsRes, clicksRes, campaignsRes, behaviorsRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/ad_impressions?select=id,created_at,device_type,page_url&order=created_at.desc&limit=500`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/ad_clicks?select=id,created_at,device_type,page_url&order=created_at.desc&limit=500`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/ad_campaigns?select=id,name,status,billing_model,budget,spent,total_impressions,total_clicks`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/ad_user_behaviors?select=event_type,page_category,device_type,duration_seconds,created_at&order=created_at.desc&limit=500`, { headers }),
    ]);

    const [impressions, clicks, campaigns, behaviors] = await Promise.all([
      impressionsRes.json(),
      clicksRes.json(),
      campaignsRes.json(),
      behaviorsRes.json(),
    ]);

    // Aggregate stats
    const totalImpressions = Array.isArray(impressions) ? impressions.length : 0;
    const totalClicks = Array.isArray(clicks) ? clicks.length : 0;
    const overallCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0";
    const activeCampaigns = Array.isArray(campaigns) ? campaigns.filter((c: any) => c.status === "active").length : 0;
    const totalBudget = Array.isArray(campaigns) ? campaigns.reduce((s: number, c: any) => s + (c.budget || 0), 0) : 0;
    const totalSpent = Array.isArray(campaigns) ? campaigns.reduce((s: number, c: any) => s + (c.spent || 0), 0) : 0;

    const deviceBreakdown: Record<string, number> = {};
    if (Array.isArray(impressions)) {
      for (const i of impressions) {
        const key = i.device_type || "unknown";
        deviceBreakdown[key] = (deviceBreakdown[key] || 0) + 1;
      }
    }

    const categoryEngagement: Record<string, number> = {};
    const hourCounts = new Array(24).fill(0);
    if (Array.isArray(behaviors)) {
      for (const b of behaviors) {
        if (b.page_category) categoryEngagement[b.page_category] = (categoryEngagement[b.page_category] || 0) + 1;
        if (b.created_at) hourCounts[new Date(b.created_at).getHours()]++;
      }
    }
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

    const rawStats = { totalImpressions, totalClicks, overallCTR, activeCampaigns, totalBudget, totalSpent, deviceBreakdown, categoryEngagement, peakHour };

    const fallbackInsights = {
      summary: `Platform has ${totalImpressions} impressions and ${totalClicks} clicks with ${overallCTR}% CTR across ${activeCampaigns} active campaigns.`,
      recommendations: ["Increase ad placements on high-traffic pages", "Optimize creatives for mobile devices", "Test different CTA variations"],
      targeting: ["Focus on competition and exhibition enthusiasts", "Target mobile users preferentially"],
      budget_advice: `${totalSpent} of ${totalBudget} SAR spent. Consider reallocating budget to top-performing placements.`,
      timing: `Peak activity at ${peakHour}:00. Schedule important ad displays around this time.`,
      retargeting: "Create segments for users who viewed competitions but didn't register.",
    };

    // Try AI insights
    try {
      const dataPrompt = `
Ad Platform Analytics Summary:
- Total Impressions: ${totalImpressions}
- Total Clicks: ${totalClicks}
- Overall CTR: ${overallCTR}%
- Active Campaigns: ${activeCampaigns}
- Total Budget: ${totalBudget} SAR
- Total Spent: ${totalSpent} SAR
- Device Breakdown: ${JSON.stringify(deviceBreakdown)}
- Top Categories: ${JSON.stringify(categoryEngagement)}
- Peak Activity Hour: ${peakHour}:00
- Total Behavior Events: ${Array.isArray(behaviors) ? behaviors.length : 0}

Provide actionable AI insights. Include:
1. Performance summary (2-3 sentences)
2. Top 3 optimization recommendations
3. Audience targeting suggestions
4. Budget allocation advice
5. Best times and placements
6. Retargeting opportunities

Format as JSON with keys: summary, recommendations (array), targeting (array), budget_advice, timing, retargeting`;

      const response = await callAI({
        messages: [
          { role: "system", content: "You are an advertising analytics AI. Analyze ad performance data and provide actionable insights in JSON format. Be specific and data-driven. Return ONLY valid JSON, no markdown." },
          { role: "user", content: dataPrompt },
        ],
        temperature: 0.3,
      });

      const insights = parseAIJson(response.content) || fallbackInsights;
      return jsonResponse({ ...insights, raw_stats: rawStats });
    } catch {
      return jsonResponse({ ...fallbackInsights, raw_stats: rawStats });
    }
  } catch (error: unknown) {
    console.error("ai-ad-insights error:", error);
    return errorResponse(error);
  }
});
