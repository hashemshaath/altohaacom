import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { language = "en" } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Gather platform data for AI analysis
    const [
      { count: totalUsers },
      { count: totalCompetitions },
      { count: totalCertificates },
      { count: totalCompanies },
      { count: totalOrders },
      { data: recentUsers },
      { data: recentCompetitions },
      { data: roles },
      { data: scores },
      { data: registrations },
      { data: sponsors },
      { data: transactions },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("competitions").select("*", { count: "exact", head: true }),
      supabase.from("certificates").select("*", { count: "exact", head: true }),
      supabase.from("companies").select("*", { count: "exact", head: true }),
      supabase.from("company_orders").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("created_at, country_code, account_status").order("created_at", { ascending: false }).limit(500),
      supabase.from("competitions").select("title, status, competition_start, country_code, created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("user_roles").select("role"),
      supabase.from("competition_scores").select("score, created_at").limit(500),
      supabase.from("competition_registrations").select("status, created_at").limit(500),
      supabase.from("competition_sponsors").select("tier, status, amount_paid"),
      supabase.from("company_transactions").select("amount, type, created_at").limit(200),
    ]);

    // Build monthly signup data
    const monthlySignups: Record<string, number> = {};
    (recentUsers || []).forEach((u: any) => {
      const month = u.created_at?.substring(0, 7);
      if (month) monthlySignups[month] = (monthlySignups[month] || 0) + 1;
    });

    // Role distribution
    const roleCounts: Record<string, number> = {};
    (roles || []).forEach((r: any) => {
      roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
    });

    // Competition status distribution
    const statusCounts: Record<string, number> = {};
    (recentCompetitions || []).forEach((c: any) => {
      statusCounts[c.status || "unknown"] = (statusCounts[c.status || "unknown"] || 0) + 1;
    });

    // Average score
    const allScores = (scores || []).map((s: any) => Number(s.score)).filter(s => !isNaN(s));
    const avgScore = allScores.length > 0 ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1) : "N/A";

    // Registration approval rate
    const totalRegs = (registrations || []).length;
    const approvedRegs = (registrations || []).filter((r: any) => r.status === "approved").length;
    const approvalRate = totalRegs > 0 ? ((approvedRegs / totalRegs) * 100).toFixed(1) : "N/A";

    // Sponsorship totals
    const totalSponsorship = (sponsors || []).filter((s: any) => s.status === "active").reduce((sum, s: any) => sum + (Number(s.amount_paid) || 0), 0);

    // Country distribution
    const countryCounts: Record<string, number> = {};
    (recentUsers || []).forEach((u: any) => {
      if (u.country_code) countryCounts[u.country_code] = (countryCounts[u.country_code] || 0) + 1;
    });
    const topCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const platformSummary = `
Platform Data Snapshot:
- Total Users: ${totalUsers || 0}
- Total Competitions: ${totalCompetitions || 0}  
- Total Certificates Issued: ${totalCertificates || 0}
- Total Companies: ${totalCompanies || 0}
- Total Orders: ${totalOrders || 0}

Monthly User Signups (recent): ${JSON.stringify(monthlySignups)}
Role Distribution: ${JSON.stringify(roleCounts)}
Competition Status: ${JSON.stringify(statusCounts)}
Average Competition Score: ${avgScore}
Registration Approval Rate: ${approvalRate}%
Total Sponsorship Revenue: ${totalSponsorship} SAR
Top Countries by Users: ${topCountries.map(([c, n]) => `${c}: ${n}`).join(", ")}
Transaction Volume: ${(transactions || []).length} transactions totaling ${(transactions || []).reduce((s, t: any) => s + (Number(t.amount) || 0), 0)} SAR
`;

    const systemPrompt = language === "ar"
      ? `أنت محلل بيانات خبير لمنصة التُهاء للمسابقات الطهوية. قم بتحليل البيانات التالية وقدم:

1. **ملخص تنفيذي** (3-4 جمل)
2. **أبرز الاتجاهات** (3-5 نقاط مع أيقونات مناسبة)
3. **تنبؤات وتوقعات** (3-4 نقاط حول ما نتوقعه)
4. **توصيات عملية** (3-5 خطوات لتحسين المنصة)
5. **تحذيرات ومخاطر** (1-3 نقاط تحتاج اهتمام)

استخدم Markdown مع emoji. أجب باللغة العربية. كن محدداً وقدم أرقاماً.

${platformSummary}`
      : `You are an expert data analyst for Altohaa, a culinary competition platform. Analyze the following data and provide:

1. **Executive Summary** (3-4 sentences)
2. **Key Trends** (3-5 bullet points with relevant emoji)
3. **Predictions & Forecasts** (3-4 data-driven predictions)
4. **Actionable Recommendations** (3-5 specific steps to grow the platform)
5. **Risk Alerts** (1-3 items needing attention)

Use Markdown with emoji. Be specific and data-driven with numbers.

${platformSummary}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Analyze this platform data and provide comprehensive insights." },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI Analytics error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
