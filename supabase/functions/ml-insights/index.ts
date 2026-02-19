import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function gatherMLData(supabase: any) {
  const now = new Date();
  const months: { month: string; users: number; competitions: number; orders: number; registrations: number; revenue: number }[] = [];

  // Gather 12 months of data for trend analysis
  for (let i = 11; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const startISO = start.toISOString();
    const endISO = end.toISOString();
    const label = start.toLocaleDateString("en", { year: "numeric", month: "short" });

    const [
      { count: users },
      { count: competitions },
      { count: orders },
      { count: registrations },
      { data: orderData },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", startISO).lte("created_at", endISO),
      supabase.from("competitions").select("*", { count: "exact", head: true }).gte("created_at", startISO).lte("created_at", endISO),
      supabase.from("company_orders").select("*", { count: "exact", head: true }).gte("created_at", startISO).lte("created_at", endISO),
      supabase.from("competition_registrations").select("*", { count: "exact", head: true }).gte("registered_at", startISO).lte("registered_at", endISO),
      supabase.from("company_orders").select("total_amount").gte("created_at", startISO).lte("created_at", endISO).in("status", ["completed", "approved"]),
    ]);

    months.push({
      month: label,
      users: users || 0,
      competitions: competitions || 0,
      orders: orders || 0,
      registrations: registrations || 0,
      revenue: (orderData || []).reduce((s: number, o: any) => s + (Number(o.total_amount) || 0), 0),
    });
  }

  // User engagement data
  const [
    { count: totalUsers },
    { count: activePosters },
    { count: inactiveUsers },
    { data: topCountries },
    { count: totalCerts },
    { count: totalExhibitions },
    { count: totalMasterclasses },
    { data: roleData },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("author_id", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("account_status", "suspended"),
    supabase.from("profiles").select("country_code").not("country_code", "is", null).limit(1000),
    supabase.from("certificates").select("*", { count: "exact", head: true }),
    supabase.from("exhibitions").select("*", { count: "exact", head: true }),
    supabase.from("masterclasses").select("*", { count: "exact", head: true }),
    supabase.from("user_roles").select("role"),
  ]);

  const countryCounts: Record<string, number> = {};
  (topCountries || []).forEach((u: any) => {
    if (u.country_code) countryCounts[u.country_code] = (countryCounts[u.country_code] || 0) + 1;
  });

  const roleCounts: Record<string, number> = {};
  (roleData || []).forEach((r: any) => {
    roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
  });

  return {
    monthlyData: months,
    totals: { totalUsers: totalUsers || 0, activePosters: activePosters || 0, inactiveUsers: inactiveUsers || 0, totalCerts: totalCerts || 0, totalExhibitions: totalExhibitions || 0, totalMasterclasses: totalMasterclasses || 0 },
    topCountries: Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 10),
    roleCounts,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate user and verify admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Verify admin role
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: isAdmin } = await supabase.rpc("is_admin", { p_user_id: userId });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { language = "en" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    const data = await gatherMLData(supabase);

    const prompt = `You are an ML analytics engine for Altoha culinary platform. Analyze this data and return structured predictions.

MONTHLY DATA (last 12 months):
${JSON.stringify(data.monthlyData, null, 1)}

TOTALS: ${JSON.stringify(data.totals)}
TOP COUNTRIES: ${JSON.stringify(data.topCountries)}
ROLES: ${JSON.stringify(data.roleCounts)}

Based on the trends, provide forecasts, risk analysis, and recommendations. ${language === "ar" ? "Respond in Arabic." : "Respond in English."}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a data science engine. Return structured predictions via the provided tool." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "ml_insights",
            description: "Return ML-powered analytics insights",
            parameters: {
              type: "object",
              properties: {
                forecasts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      metric: { type: "string", description: "e.g. users, revenue, competitions" },
                      current_value: { type: "number" },
                      forecast_3m: { type: "number" },
                      forecast_6m: { type: "number" },
                      forecast_12m: { type: "number" },
                      trend: { type: "string", enum: ["up", "down", "stable"] },
                      confidence: { type: "number", description: "0-100 confidence score" },
                    },
                    required: ["metric", "current_value", "forecast_3m", "forecast_6m", "forecast_12m", "trend", "confidence"],
                    additionalProperties: false,
                  },
                },
                churn_risks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      segment: { type: "string" },
                      risk_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
                      affected_users_estimate: { type: "number" },
                      reason: { type: "string" },
                      mitigation: { type: "string" },
                    },
                    required: ["segment", "risk_level", "affected_users_estimate", "reason", "mitigation"],
                    additionalProperties: false,
                  },
                },
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      impact: { type: "string", enum: ["low", "medium", "high"] },
                      effort: { type: "string", enum: ["low", "medium", "high"] },
                      category: { type: "string", enum: ["growth", "engagement", "revenue", "retention"] },
                      estimated_roi: { type: "string" },
                    },
                    required: ["title", "description", "impact", "effort", "category", "estimated_roi"],
                    additionalProperties: false,
                  },
                },
                health_score: {
                  type: "object",
                  properties: {
                    overall: { type: "number", description: "0-100 platform health score" },
                    growth: { type: "number" },
                    engagement: { type: "number" },
                    revenue: { type: "number" },
                    retention: { type: "number" },
                  },
                  required: ["overall", "growth", "engagement", "revenue", "retention"],
                  additionalProperties: false,
                },
                anomalies: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      metric: { type: "string" },
                      description: { type: "string" },
                      severity: { type: "string", enum: ["info", "warning", "critical"] },
                    },
                    required: ["metric", "description", "severity"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["forecasts", "churn_risks", "recommendations", "health_score", "anomalies"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "ml_insights" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    let insights;
    if (toolCall?.function?.arguments) {
      insights = JSON.parse(toolCall.function.arguments);
    } else {
      throw new Error("No structured response from AI");
    }

    // Add raw monthly data for charts
    insights.monthlyData = data.monthlyData;

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ML Insights error:", error);
    return new Response(
      JSON.stringify({ error: "Service temporarily unavailable" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
