import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, serviceKey);

    // Gather platform metrics for the past week
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

    // Generate AI report for both languages
    for (const lang of ["en", "ar"]) {
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

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a professional analytics report writer for a culinary community platform." },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        console.error(`AI report generation failed for ${lang}:`, response.status);
        continue;
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || "";

      if (content) {
        await supabase.from("ai_analytics_reports").insert({
          report_type: "weekly",
          language: lang,
          content,
          data_snapshot: snapshot as any,
          generated_at: now.toISOString(),
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Weekly digest error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});