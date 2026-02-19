import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin role
    const adminClient = createClient(supabaseUrl, supabaseKey);
    const userId = claimsData.claims.sub as string;
    const { data: isAdmin } = await adminClient.rpc("is_admin", { p_user_id: userId });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch ad performance data
    const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" };

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

    // Device breakdown
    const deviceBreakdown: Record<string, number> = {};
    if (Array.isArray(impressions)) {
      impressions.forEach((i: any) => {
        deviceBreakdown[i.device_type || "unknown"] = (deviceBreakdown[i.device_type || "unknown"] || 0) + 1;
      });
    }

    // Page category engagement
    const categoryEngagement: Record<string, number> = {};
    if (Array.isArray(behaviors)) {
      behaviors.forEach((b: any) => {
        if (b.page_category) categoryEngagement[b.page_category] = (categoryEngagement[b.page_category] || 0) + 1;
      });
    }

    // Peak hours
    const hourCounts = new Array(24).fill(0);
    if (Array.isArray(behaviors)) {
      behaviors.forEach((b: any) => {
        if (b.created_at) hourCounts[new Date(b.created_at).getHours()]++;
      });
    }
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

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

Provide actionable AI insights for this advertising platform. Include:
1. Performance summary (2-3 sentences)
2. Top 3 optimization recommendations
3. Audience targeting suggestions based on behavior data
4. Budget allocation advice
5. Best times and placements for ads
6. Retargeting opportunities

Format as JSON with keys: summary, recommendations (array), targeting (array), budget_advice, timing, retargeting
`;

    if (!lovableKey) {
      // Return basic insights without AI
      return new Response(JSON.stringify({
        summary: `Platform has ${totalImpressions} impressions and ${totalClicks} clicks with ${overallCTR}% CTR across ${activeCampaigns} active campaigns.`,
        recommendations: [
          "Increase ad placements on high-traffic pages",
          "Optimize creatives for mobile devices",
          "Test different CTA variations",
        ],
        targeting: ["Focus on competition and exhibition enthusiasts", "Target mobile users preferentially"],
        budget_advice: `${totalSpent} of ${totalBudget} SAR spent. Consider reallocating budget to top-performing placements.`,
        timing: `Peak activity at ${peakHour}:00. Schedule important ad displays around this time.`,
        retargeting: "Create segments for users who viewed competitions but didn't register.",
        raw_stats: { totalImpressions, totalClicks, overallCTR, activeCampaigns, totalBudget, totalSpent, deviceBreakdown, categoryEngagement, peakHour },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Call AI for deeper insights
    let insights;
    try {
      const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are an advertising analytics AI. Analyze ad performance data and provide actionable insights in JSON format. Be specific and data-driven. Return ONLY valid JSON, no markdown." },
            { role: "user", content: dataPrompt },
          ],
          temperature: 0.3,
        }),
      });

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || "";
      // Strip markdown code fences if present
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      insights = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: cleaned };
    } catch (aiErr) {
      insights = {
        summary: `Platform has ${totalImpressions} impressions and ${totalClicks} clicks with ${overallCTR}% CTR.`,
        recommendations: ["Review campaign targeting", "Optimize ad creatives", "Adjust budget allocation"],
        targeting: ["Focus on high-engagement categories"],
        budget_advice: `${totalSpent} of ${totalBudget} SAR spent.`,
        timing: `Peak activity at ${peakHour}:00.`,
        retargeting: "Create segments for engaged but unconverted users.",
      };
    }

    return new Response(JSON.stringify({
      ...insights,
      raw_stats: { totalImpressions, totalClicks, overallCTR, activeCampaigns, totalBudget, totalSpent, deviceBreakdown, categoryEngagement, peakHour },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
