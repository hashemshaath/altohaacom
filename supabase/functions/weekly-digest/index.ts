import { handleCors } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";
import { callAI } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const supabase = getServiceClient();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: newUsersThisWeek },
      { count: newUsersPrevWeek },
      { count: newComps },
      { count: newOrders },
      { count: newMessages },
      { count: newCerts },
      { count: newPosts },
      { count: newRegs },
      { count: totalUsers },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", twoWeeksAgo).lt("created_at", weekAgo),
      supabase.from("competitions").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
      supabase.from("company_orders").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
      supabase.from("messages").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
      supabase.from("certificates").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
      supabase.from("posts").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
      supabase.from("competition_registrations").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]);

    const snapshot = {
      totalUsers: totalUsers || 0,
      newUsersThisWeek: newUsersThisWeek || 0,
      newUsersPrevWeek: newUsersPrevWeek || 0,
      newCompetitions: newComps || 0,
      newOrders: newOrders || 0,
      newMessages: newMessages || 0,
      newCertificates: newCerts || 0,
      newPosts: newPosts || 0,
      newRegistrations: newRegs || 0,
    };

    const userGrowthPct = (snapshot.newUsersPrevWeek || 1) > 0
      ? (((snapshot.newUsersThisWeek - snapshot.newUsersPrevWeek) / Math.max(snapshot.newUsersPrevWeek, 1)) * 100).toFixed(1)
      : "N/A";

    for (const lang of ["en", "ar"] as const) {
      const prompt = `Generate a professional weekly analytics digest report for the Altoha culinary community platform.

WEEKLY METRICS (${new Date(weekAgo).toLocaleDateString()} - ${now.toLocaleDateString()}):
- New users: ${snapshot.newUsersThisWeek} (${userGrowthPct}% change vs previous week)
- Total users: ${snapshot.totalUsers}
- New competitions: ${snapshot.newCompetitions}
- New orders: ${snapshot.newOrders}
- Messages sent: ${snapshot.newMessages}
- Certificates issued: ${snapshot.newCertificates}
- Community posts: ${snapshot.newPosts}
- Competition registrations: ${snapshot.newRegistrations}

Format: Use markdown headers (##) for sections. Include:
1. Executive Summary (2-3 sentences)
2. Key Metrics (table format)
3. Growth Analysis
4. Notable Trends
5. Recommendations for next week

${lang === "ar" ? "Write entirely in Arabic." : "Write in English."}`;

      try {
        const response = await callAI({
          messages: [
            { role: "system", content: "You are a professional analytics report writer for a culinary community platform." },
            { role: "user", content: prompt },
          ],
        });

        if (response.content) {
          await supabase.from("ai_analytics_reports").insert({
            report_type: "weekly",
            language: lang,
            content: response.content,
            data_snapshot: snapshot as any,
            generated_at: now.toISOString(),
          });
        }
      } catch (aiErr) {
        console.error(`AI report generation failed for ${lang}:`, aiErr);
      }
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Weekly digest error:", error);
    return errorResponse(error);
  }
});
