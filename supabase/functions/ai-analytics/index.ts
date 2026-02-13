import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function gatherPlatformData(supabase: any) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalUsers },
    { count: totalCompetitions },
    { count: totalCertificates },
    { count: totalCompanies },
    { count: totalOrders },
    { count: totalExhibitions },
    { count: totalEntities },
    { count: totalMasterclasses },
    { count: totalArticles },
    { count: totalShopProducts },
    { count: totalShopOrders },
    { count: recentUsers30 },
    { count: prevUsers30 },
    { data: recentUsers },
    { data: recentCompetitions },
    { data: roles },
    { data: scores },
    { data: registrations },
    { data: sponsors },
    { data: transactions },
    { data: recentRegs30 },
    { data: prevRegs30 },
    { count: recentMessages30 },
    { count: prevMessages30 },
    { count: recentCerts30 },
    { data: exhibitions },
    { data: entities },
    { data: shopOrders },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("competitions").select("*", { count: "exact", head: true }),
    supabase.from("certificates").select("*", { count: "exact", head: true }),
    supabase.from("companies").select("*", { count: "exact", head: true }),
    supabase.from("company_orders").select("*", { count: "exact", head: true }),
    supabase.from("exhibitions").select("*", { count: "exact", head: true }),
    supabase.from("entities").select("*", { count: "exact", head: true }),
    supabase.from("masterclasses").select("*", { count: "exact", head: true }),
    supabase.from("articles").select("*", { count: "exact", head: true }),
    supabase.from("shop_products").select("*", { count: "exact", head: true }),
    supabase.from("shop_orders").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo),
    supabase.from("profiles").select("created_at, country_code, account_status").order("created_at", { ascending: false }).limit(500),
    supabase.from("competitions").select("title, status, competition_start, country_code, created_at, edition_year").order("created_at", { ascending: false }).limit(200),
    supabase.from("user_roles").select("role"),
    supabase.from("competition_scores").select("score, created_at").limit(500),
    supabase.from("competition_registrations").select("status, created_at, category_id").limit(500),
    supabase.from("competition_sponsors").select("tier, status, amount_paid"),
    supabase.from("company_transactions").select("amount, type, created_at, currency").limit(300),
    supabase.from("competition_registrations").select("created_at").gte("created_at", thirtyDaysAgo),
    supabase.from("competition_registrations").select("created_at").gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo),
    supabase.from("messages").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    supabase.from("messages").select("*", { count: "exact", head: true }).gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo),
    supabase.from("certificates").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    supabase.from("exhibitions").select("title, status, start_date, country_code").limit(100),
    supabase.from("entities").select("name, type, status, country_code").limit(200),
    supabase.from("shop_orders").select("total_amount, status, created_at").limit(200),
  ]);

  // Monthly signup data
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
  const allScores = (scores || []).map((s: any) => Number(s.score)).filter((s: number) => !isNaN(s));
  const avgScore = allScores.length > 0 ? (allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length).toFixed(1) : "N/A";

  // Registration approval rate
  const totalRegs = (registrations || []).length;
  const approvedRegs = (registrations || []).filter((r: any) => r.status === "approved").length;
  const approvalRate = totalRegs > 0 ? ((approvedRegs / totalRegs) * 100).toFixed(1) : "N/A";

  // Sponsorship totals
  const totalSponsorship = (sponsors || []).filter((s: any) => s.status === "active").reduce((sum: number, s: any) => sum + (Number(s.amount_paid) || 0), 0);

  // Country distribution
  const countryCounts: Record<string, number> = {};
  (recentUsers || []).forEach((u: any) => {
    if (u.country_code) countryCounts[u.country_code] = (countryCounts[u.country_code] || 0) + 1;
  });
  const topCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // 30-day growth rates
  const calcGrowth = (cur: number, prev: number) => prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);
  const userGrowth = calcGrowth(recentUsers30 || 0, prevUsers30 || 0);
  const regGrowth = calcGrowth((recentRegs30 || []).length, (prevRegs30 || []).length);
  const msgGrowth = calcGrowth(recentMessages30 || 0, prevMessages30 || 0);

  // Exhibition stats
  const exhibitionStatusCounts: Record<string, number> = {};
  (exhibitions || []).forEach((e: any) => {
    exhibitionStatusCounts[e.status || "unknown"] = (exhibitionStatusCounts[e.status || "unknown"] || 0) + 1;
  });

  // Entity stats
  const entityTypeCounts: Record<string, number> = {};
  (entities || []).forEach((e: any) => {
    entityTypeCounts[e.type || "unknown"] = (entityTypeCounts[e.type || "unknown"] || 0) + 1;
  });

  // Shop revenue
  const shopRevenue = (shopOrders || [])
    .filter((o: any) => o.status === "completed" || o.status === "delivered")
    .reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0);

  // Transaction volume
  const txnTotal = (transactions || []).reduce((s: number, t: any) => s + (Number(t.amount) || 0), 0);

  return {
    snapshot: {
      totalUsers: totalUsers || 0,
      totalCompetitions: totalCompetitions || 0,
      totalCertificates: totalCertificates || 0,
      totalCompanies: totalCompanies || 0,
      totalOrders: totalOrders || 0,
      totalExhibitions: totalExhibitions || 0,
      totalEntities: totalEntities || 0,
      totalMasterclasses: totalMasterclasses || 0,
      totalArticles: totalArticles || 0,
      totalShopProducts: totalShopProducts || 0,
      totalShopOrders: totalShopOrders || 0,
      shopRevenue,
      txnTotal,
      totalSponsorship,
    },
    summary: `
PLATFORM DATA SNAPSHOT (${new Date().toISOString().substring(0, 10)}):

═══ TOTALS ═══
• Users: ${totalUsers || 0} | Competitions: ${totalCompetitions || 0} | Exhibitions: ${totalExhibitions || 0}
• Certificates: ${totalCertificates || 0} | Companies: ${totalCompanies || 0} | Entities: ${totalEntities || 0}
• Masterclasses: ${totalMasterclasses || 0} | Articles: ${totalArticles || 0}
• Shop Products: ${totalShopProducts || 0} | Shop Orders: ${totalShopOrders || 0}
• Company Orders: ${totalOrders || 0}

═══ 30-DAY GROWTH ═══
• User signups: ${recentUsers30 || 0} (${userGrowth >= 0 ? '+' : ''}${userGrowth}% vs previous 30d)
• Competition registrations: ${(recentRegs30 || []).length} (${regGrowth >= 0 ? '+' : ''}${regGrowth}%)
• Messages sent: ${recentMessages30 || 0} (${msgGrowth >= 0 ? '+' : ''}${msgGrowth}%)
• Certificates issued: ${recentCerts30 || 0}

═══ DISTRIBUTION ═══
Monthly Signups: ${JSON.stringify(monthlySignups)}
Roles: ${JSON.stringify(roleCounts)}
Competition Status: ${JSON.stringify(statusCounts)}
Exhibition Status: ${JSON.stringify(exhibitionStatusCounts)}
Entity Types: ${JSON.stringify(entityTypeCounts)}

═══ PERFORMANCE ═══
• Avg Competition Score: ${avgScore}
• Registration Approval Rate: ${approvalRate}%
• Active Sponsorship Revenue: ${totalSponsorship} SAR
• Shop Revenue (completed): ${shopRevenue} SAR
• Transaction Volume: ${(transactions || []).length} txns totaling ${txnTotal} SAR

═══ GEOGRAPHY ═══
Top Countries: ${topCountries.map(([c, n]) => `${c}: ${n}`).join(", ") || "No data"}
`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { language = "en", saveReport = false } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { summary, snapshot } = await gatherPlatformData(supabase);

    const systemPrompt = language === "ar"
      ? `أنت محلل بيانات خبير لمنصة التُهاء للمسابقات الطهوية. قم بتحليل البيانات التالية وقدم تقريراً شاملاً:

1. **📊 ملخص تنفيذي** (4-5 جمل تلخص الوضع العام)
2. **📈 اتجاهات النمو** (4-6 نقاط مع أرقام دقيقة ونسب مئوية)
3. **🔮 تنبؤات وتوقعات** (4-5 توقعات مبنية على البيانات مع أرقام تقديرية)
4. **💡 توصيات عملية** (5-7 خطوات محددة وقابلة للتنفيذ مرتبة حسب الأولوية)
5. **⚠️ تحذيرات ومخاطر** (2-4 نقاط تحتاج اهتمام فوري)
6. **🏆 فرص النمو** (3-4 فرص استراتيجية)

استخدم Markdown مع emoji. أجب باللغة العربية. كن محدداً وقدم أرقاماً. قارن بين الفترات الزمنية.

${summary}`
      : `You are an expert data analyst for Altohaa, a culinary competition & community platform. Analyze the following data and provide a comprehensive report:

1. **📊 Executive Summary** (4-5 sentences summarizing overall health)
2. **📈 Growth Trends** (4-6 bullet points with precise numbers and percentages)
3. **🔮 Predictions & Forecasts** (4-5 data-driven predictions with estimated numbers)
4. **💡 Actionable Recommendations** (5-7 specific, prioritized steps to grow the platform)
5. **⚠️ Risk Alerts** (2-4 items needing immediate attention)
6. **🏆 Growth Opportunities** (3-4 strategic opportunities)

Use Markdown with emoji. Be very specific and data-driven. Compare time periods. Provide estimated ROI where applicable.

${summary}`;

    if (saveReport) {
      // Non-streaming mode for scheduled reports
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
            { role: "user", content: "Analyze this platform data and provide a comprehensive weekly report." },
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        return new Response(
          JSON.stringify({ error: "Failed to generate report" }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const aiResult = await response.json();
      const reportContent = aiResult.choices?.[0]?.message?.content || "No content generated";

      // Save to database
      const { error: insertError } = await supabase.from("ai_analytics_reports").insert({
        report_type: "weekly",
        language,
        content: reportContent,
        data_snapshot: snapshot,
      });

      if (insertError) console.error("Failed to save report:", insertError);

      return new Response(
        JSON.stringify({ success: true, content: reportContent }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Streaming mode for interactive use
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
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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
