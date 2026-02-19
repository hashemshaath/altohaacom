import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function gatherPlatformSummary(supabase: any) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalUsers },
    { count: recentUsers },
    { count: totalComps },
    { count: recentComps },
    { count: totalMessages },
    { count: recentMessages },
    { count: totalCerts },
    { count: totalOrders },
    { data: countries },
    { data: roles },
    { count: totalPosts },
    { count: recentRegs },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    supabase.from("competitions").select("*", { count: "exact", head: true }),
    supabase.from("competitions").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    supabase.from("messages").select("*", { count: "exact", head: true }),
    supabase.from("messages").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    supabase.from("certificates").select("*", { count: "exact", head: true }),
    supabase.from("company_orders").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("country_code").not("country_code", "is", null).limit(1000),
    supabase.from("user_roles").select("role"),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("competition_registrations").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
  ]);

  const countryCounts: Record<string, number> = {};
  (countries || []).forEach((u: any) => {
    if (u.country_code) countryCounts[u.country_code] = (countryCounts[u.country_code] || 0) + 1;
  });
  const topCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const roleCounts: Record<string, number> = {};
  (roles || []).forEach((r: any) => { roleCounts[r.role] = (roleCounts[r.role] || 0) + 1; });

  return {
    totalUsers: totalUsers || 0,
    recentUsers: recentUsers || 0,
    totalCompetitions: totalComps || 0,
    recentCompetitions: recentComps || 0,
    totalMessages: totalMessages || 0,
    recentMessages: recentMessages || 0,
    totalCertificates: totalCerts || 0,
    totalOrders: totalOrders || 0,
    totalPosts: totalPosts || 0,
    recentRegistrations: recentRegs || 0,
    topCountries,
    roleCounts,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages = [], language = "en" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const summary = await gatherPlatformSummary(supabase);

    const systemPrompt = `You are an AI analytics assistant for the Altoha culinary community platform. You have access to the following real-time platform data:

PLATFORM SUMMARY:
- Total users: ${summary.totalUsers} (${summary.recentUsers} new in last 30 days)
- Total competitions: ${summary.totalCompetitions} (${summary.recentCompetitions} recent)
- Total messages: ${summary.totalMessages} (${summary.recentMessages} in last 30 days)
- Total certificates issued: ${summary.totalCertificates}
- Total orders: ${summary.totalOrders}
- Total community posts: ${summary.totalPosts}
- Recent competition registrations (30d): ${summary.recentRegistrations}
- Top countries: ${JSON.stringify(summary.topCountries)}
- User roles distribution: ${JSON.stringify(summary.roleCounts)}

Answer questions about the platform's performance, trends, and insights using this data. Be concise, use bullet points and numbers. ${language === "ar" ? "Respond in Arabic." : "Respond in English."} Use markdown formatting for clarity.`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${status}`);
    }

    const result = await response.json();
    const assistantMessage = result.choices?.[0]?.message?.content || "No response generated.";

    return new Response(
      JSON.stringify({ response: assistantMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI Analytics Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
