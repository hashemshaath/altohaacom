import { handleCors } from "../_shared/cors.ts";
import { authenticateAdmin } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";
import { callAI, parseToolCallArgs } from "../_shared/ai.ts";

async function gatherMLData(supabase: any) {
  const now = new Date();
  const months: { month: string; users: number; competitions: number; orders: number; registrations: number; revenue: number }[] = [];

  // Gather 12 months of data — batch all months together to reduce sequential queries
  const monthPromises = [];
  for (let i = 11; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const startISO = start.toISOString();
    const endISO = end.toISOString();
    const label = start.toLocaleDateString("en", { year: "numeric", month: "short" });

    monthPromises.push(
      Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", startISO).lte("created_at", endISO),
        supabase.from("competitions").select("*", { count: "exact", head: true }).gte("created_at", startISO).lte("created_at", endISO),
        supabase.from("company_orders").select("*", { count: "exact", head: true }).gte("created_at", startISO).lte("created_at", endISO),
        supabase.from("competition_registrations").select("*", { count: "exact", head: true }).gte("registered_at", startISO).lte("registered_at", endISO),
        supabase.from("company_orders").select("total_amount").gte("created_at", startISO).lte("created_at", endISO).in("status", ["completed", "approved"]),
      ]).then(([{ count: users }, { count: competitions }, { count: orders }, { count: registrations }, { data: orderData }]) => ({
        month: label,
        users: users || 0,
        competitions: competitions || 0,
        orders: orders || 0,
        registrations: registrations || 0,
        revenue: (orderData || []).reduce((s: number, o: any) => s + (Number(o.total_amount) || 0), 0),
      }))
    );
  }

  const monthlyData = await Promise.all(monthPromises);

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
  for (const u of topCountries || []) {
    if (u.country_code) countryCounts[u.country_code] = (countryCounts[u.country_code] || 0) + 1;
  }

  const roleCounts: Record<string, number> = {};
  for (const r of roleData || []) {
    roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
  }

  return {
    monthlyData,
    totals: { totalUsers: totalUsers || 0, activePosters: activePosters || 0, inactiveUsers: inactiveUsers || 0, totalCerts: totalCerts || 0, totalExhibitions: totalExhibitions || 0, totalMasterclasses: totalMasterclasses || 0 },
    topCountries: Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 10),
    roleCounts,
  };
}

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { adminClient } = await authenticateAdmin(req);

    const { language = "en" } = await req.json();
    const data = await gatherMLData(adminClient);

    const response = await callAI({
      messages: [
        { role: "system", content: "You are a data science engine. Return structured predictions via the provided tool." },
        { role: "user", content: `Analyze this Altoha culinary platform data and provide forecasts, risk analysis, and recommendations.

MONTHLY DATA (last 12 months):
${JSON.stringify(data.monthlyData, null, 1)}

TOTALS: ${JSON.stringify(data.totals)}
TOP COUNTRIES: ${JSON.stringify(data.topCountries)}
ROLES: ${JSON.stringify(data.roleCounts)}

${language === "ar" ? "Respond in Arabic." : "Respond in English."}` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "ml_insights",
          description: "Return ML-powered analytics insights",
          parameters: {
            type: "object",
            properties: {
              forecasts: { type: "array", items: { type: "object", properties: { metric: { type: "string" }, current_value: { type: "number" }, forecast_3m: { type: "number" }, forecast_6m: { type: "number" }, forecast_12m: { type: "number" }, trend: { type: "string", enum: ["up", "down", "stable"] }, confidence: { type: "number" } }, required: ["metric", "current_value", "forecast_3m", "forecast_6m", "forecast_12m", "trend", "confidence"], additionalProperties: false } },
              churn_risks: { type: "array", items: { type: "object", properties: { segment: { type: "string" }, risk_level: { type: "string", enum: ["low", "medium", "high", "critical"] }, affected_users_estimate: { type: "number" }, reason: { type: "string" }, mitigation: { type: "string" } }, required: ["segment", "risk_level", "affected_users_estimate", "reason", "mitigation"], additionalProperties: false } },
              recommendations: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, impact: { type: "string", enum: ["low", "medium", "high"] }, effort: { type: "string", enum: ["low", "medium", "high"] }, category: { type: "string", enum: ["growth", "engagement", "revenue", "retention"] }, estimated_roi: { type: "string" } }, required: ["title", "description", "impact", "effort", "category", "estimated_roi"], additionalProperties: false } },
              health_score: { type: "object", properties: { overall: { type: "number" }, growth: { type: "number" }, engagement: { type: "number" }, revenue: { type: "number" }, retention: { type: "number" } }, required: ["overall", "growth", "engagement", "revenue", "retention"], additionalProperties: false },
              anomalies: { type: "array", items: { type: "object", properties: { metric: { type: "string" }, description: { type: "string" }, severity: { type: "string", enum: ["info", "warning", "critical"] } }, required: ["metric", "description", "severity"], additionalProperties: false } },
            },
            required: ["forecasts", "churn_risks", "recommendations", "health_score", "anomalies"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "ml_insights" } },
    });

    const insights = parseToolCallArgs(response);
    if (!insights) throw new Error("No structured response from AI");

    return jsonResponse({ ...(insights as Record<string, unknown>), monthlyData: data.monthlyData });
  } catch (error) {
    console.error("ML Insights error:", error);
    return errorResponse(error);
  }
});
