import { handleCors } from "../_shared/cors.ts";
import { authenticateAdmin, getServiceClient } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";
import { callAI } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    await authenticateAdmin(req);
    const supabase = getServiceClient();

    const { reportType = "weekly", language: lang = "en" } = await req.json();

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const periodStart = reportType === "monthly" ? monthAgo : weekAgo;

    const [
      { count: totalUsers }, { count: newUsers }, { count: totalComps },
      { count: newOrders }, { count: newTickets }, { count: newPosts },
      { count: newCerts }, { count: totalRecipes },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", periodStart),
      supabase.from("competitions").select("*", { count: "exact", head: true }),
      supabase.from("company_orders").select("*", { count: "exact", head: true }).gte("created_at", periodStart),
      supabase.from("support_tickets").select("*", { count: "exact", head: true }).gte("created_at", periodStart),
      supabase.from("posts").select("*", { count: "exact", head: true }).gte("created_at", periodStart),
      supabase.from("certificates").select("*", { count: "exact", head: true }).gte("created_at", periodStart),
      supabase.from("recipes").select("*", { count: "exact", head: true }),
    ]);

    const metrics = {
      totalUsers: totalUsers || 0, newUsers: newUsers || 0, totalCompetitions: totalComps || 0,
      newOrders: newOrders || 0, newTickets: newTickets || 0, newPosts: newPosts || 0,
      newCertificates: newCerts || 0, totalRecipes: totalRecipes || 0,
      period: reportType, generatedAt: now.toISOString(),
    };

    const prompt = `Generate a professional ${reportType} platform analytics report for the Altoha culinary platform.

METRICS (${new Date(periodStart).toLocaleDateString()} - ${now.toLocaleDateString()}):
- Total users: ${metrics.totalUsers}
- New users: ${metrics.newUsers}
- Total competitions: ${metrics.totalCompetitions}
- New orders: ${metrics.newOrders}
- Support tickets: ${metrics.newTickets}
- Community posts: ${metrics.newPosts}
- Certificates issued: ${metrics.newCertificates}
- Total recipes: ${metrics.totalRecipes}

Format as a structured report with:
1. Executive Summary (2-3 sentences)
2. Key Metrics Table (markdown table)
3. Growth Analysis
4. Notable Trends
5. Recommendations

${lang === "ar" ? "Write entirely in Arabic." : "Write in English."}`;

    const response = await callAI({
      messages: [
        { role: "system", content: "You are a professional analytics report writer." },
        { role: "user", content: prompt },
      ],
    });

    const content = response.content || "Report generation failed.";

    await supabase.from("ai_analytics_reports").insert({
      report_type: reportType, language: lang, content,
      data_snapshot: metrics as any, generated_at: now.toISOString(),
    });

    return jsonResponse({ success: true, content, metrics });
  } catch (error) {
    console.error("PDF report error:", error);
    return errorResponse(error);
  }
});
