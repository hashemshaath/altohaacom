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

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify admin
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) throw new Error("Unauthorized");

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "supervisor");
      if (!roles?.length) throw new Error("Admin access required");
    } else {
      throw new Error("No auth token");
    }

    const { reportType = "weekly", language: lang = "en" } = await req.json();

    // Gather metrics
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const periodStart = reportType === "monthly" ? monthAgo : weekAgo;

    const [
      { count: totalUsers },
      { count: newUsers },
      { count: totalComps },
      { count: newOrders },
      { count: newTickets },
      { count: newPosts },
      { count: newCerts },
      { count: totalRecipes },
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
      totalUsers: totalUsers || 0,
      newUsers: newUsers || 0,
      totalCompetitions: totalComps || 0,
      newOrders: newOrders || 0,
      newTickets: newTickets || 0,
      newPosts: newPosts || 0,
      newCertificates: newCerts || 0,
      totalRecipes: totalRecipes || 0,
      period: reportType,
      generatedAt: now.toISOString(),
    };

    // Generate report content via AI
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a professional analytics report writer." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) throw new Error("AI generation failed");

    const result = await aiResponse.json();
    const content = result.choices?.[0]?.message?.content || "Report generation failed.";

    // Save to database
    await supabase.from("ai_analytics_reports").insert({
      report_type: reportType,
      language: lang,
      content,
      data_snapshot: metrics as any,
      generated_at: now.toISOString(),
    });

    return new Response(
      JSON.stringify({ success: true, content, metrics }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("PDF report error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
