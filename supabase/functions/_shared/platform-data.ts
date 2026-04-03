/**
 * Shared platform data gathering for analytics functions.
 * Used by ai-analytics and ai-analytics-chat to avoid duplication.
 */

export interface PlatformSnapshot {
  totalUsers: number;
  totalCompetitions: number;
  totalCertificates: number;
  totalCompanies: number;
  totalOrders: number;
  totalExhibitions: number;
  totalEntities: number;
  totalMasterclasses: number;
  totalArticles: number;
  totalShopProducts: number;
  totalShopOrders: number;
  totalPosts: number;
  shopRevenue: number;
  txnTotal: number;
  totalSponsorship: number;
}

export interface PlatformData {
  snapshot: PlatformSnapshot;
  summary: string;
  growth: {
    userGrowth: number;
    regGrowth: number;
    msgGrowth: number;
    recentUsers: number;
    recentRegs: number;
    recentMessages: number;
    recentCerts: number;
  };
  distributions: {
    roleCounts: Record<string, number>;
    competitionStatus: Record<string, number>;
    exhibitionStatus: Record<string, number>;
    entityTypes: Record<string, number>;
    topCountries: [string, number][];
  };
}

const calcGrowth = (cur: number, prev: number) =>
  prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);

/**
 * Gather comprehensive platform data. Used by both analytics report and chat functions.
 * @param supabase - Service-role Supabase client
 * @param periodDays - Number of days for the reporting period
 */
export async function gatherPlatformData(supabase: any, periodDays = 30): Promise<PlatformData> {
  const now = new Date();
  const periodAgo = new Date(now.getTime() - periodDays * 86400000).toISOString();
  const prevPeriodAgo = new Date(now.getTime() - periodDays * 2 * 86400000).toISOString();

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
    { count: totalPosts },
    { count: recentUsers },
    { count: prevUsers },
    { data: userSample },
    { data: roles },
    { data: competitions },
    { data: exhibitions },
    { data: entities },
    { data: sponsors },
    { data: transactions },
    { data: shopOrders },
    { data: recentRegs },
    { data: prevRegs },
    { count: recentMessages },
    { count: prevMessages },
    { count: recentCerts },
    { data: scores },
    { data: registrations },
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
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", periodAgo),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", prevPeriodAgo).lt("created_at", periodAgo),
    supabase.from("profiles").select("country_code").not("country_code", "is", null).limit(1000),
    supabase.from("user_roles").select("role"),
    supabase.from("competitions").select("status").limit(500),
    supabase.from("exhibitions").select("status").limit(200),
    supabase.from("entities").select("type").limit(500),
    supabase.from("competition_sponsors").select("tier, status, amount_paid"),
    supabase.from("company_transactions").select("amount, type, created_at, currency").limit(300),
    supabase.from("shop_orders").select("total_amount, status").limit(200),
    supabase.from("competition_registrations").select("created_at").gte("created_at", periodAgo),
    supabase.from("competition_registrations").select("created_at").gte("created_at", prevPeriodAgo).lt("created_at", periodAgo),
    supabase.from("messages").select("*", { count: "exact", head: true }).gte("created_at", periodAgo),
    supabase.from("messages").select("*", { count: "exact", head: true }).gte("created_at", prevPeriodAgo).lt("created_at", periodAgo),
    supabase.from("certificates").select("*", { count: "exact", head: true }).gte("created_at", periodAgo),
    supabase.from("competition_scores").select("score").limit(500),
    supabase.from("competition_registrations").select("status").limit(500),
  ]);

  // Distributions
  const roleCounts: Record<string, number> = {};
  for (const r of roles || []) roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;

  const competitionStatus: Record<string, number> = {};
  for (const c of competitions || []) competitionStatus[c.status || "unknown"] = (competitionStatus[c.status || "unknown"] || 0) + 1;

  const exhibitionStatus: Record<string, number> = {};
  for (const e of exhibitions || []) exhibitionStatus[e.status || "unknown"] = (exhibitionStatus[e.status || "unknown"] || 0) + 1;

  const entityTypes: Record<string, number> = {};
  for (const e of entities || []) entityTypes[e.type || "unknown"] = (entityTypes[e.type || "unknown"] || 0) + 1;

  const countryCounts: Record<string, number> = {};
  for (const u of userSample || []) {
    if (u.country_code) countryCounts[u.country_code] = (countryCounts[u.country_code] || 0) + 1;
  }
  const topCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 10) as [string, number][];

  // Financial
  const shopRevenue = (shopOrders || [])
    .filter((o: any) => o.status === "completed" || o.status === "delivered")
    .reduce((s: number, o: any) => s + (Number(o.total_amount) || 0), 0);
  const txnTotal = (transactions || []).reduce((s: number, t: any) => s + (Number(t.amount) || 0), 0);
  const totalSponsorship = (sponsors || [])
    .filter((s: any) => s.status === "active")
    .reduce((s: number, sp: any) => s + (Number(sp.amount_paid) || 0), 0);

  // Performance
  const allScores = (scores || []).map((s: any) => Number(s.score)).filter((s: number) => !isNaN(s));
  const avgScore = allScores.length > 0 ? (allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length).toFixed(1) : "N/A";
  const totalRegs = (registrations || []).length;
  const approvedRegs = (registrations || []).filter((r: any) => r.status === "approved").length;
  const approvalRate = totalRegs > 0 ? ((approvedRegs / totalRegs) * 100).toFixed(1) : "N/A";

  // Growth
  const userGrowth = calcGrowth(recentUsers || 0, prevUsers || 0);
  const regGrowth = calcGrowth((recentRegs || []).length, (prevRegs || []).length);
  const msgGrowth = calcGrowth(recentMessages || 0, prevMessages || 0);

  const snapshot: PlatformSnapshot = {
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
    totalPosts: totalPosts || 0,
    shopRevenue, txnTotal, totalSponsorship,
  };

  const summary = `PLATFORM DATA SNAPSHOT (${new Date().toISOString().substring(0, 10)}):

═══ TOTALS ═══
• Users: ${snapshot.totalUsers} | Competitions: ${snapshot.totalCompetitions} | Exhibitions: ${snapshot.totalExhibitions}
• Certificates: ${snapshot.totalCertificates} | Companies: ${snapshot.totalCompanies} | Entities: ${snapshot.totalEntities}
• Masterclasses: ${snapshot.totalMasterclasses} | Articles: ${snapshot.totalArticles} | Posts: ${snapshot.totalPosts}
• Shop Products: ${snapshot.totalShopProducts} | Shop Orders: ${snapshot.totalShopOrders}

═══ ${periodDays}-DAY GROWTH ═══
• User signups: ${recentUsers || 0} (${userGrowth >= 0 ? '+' : ''}${userGrowth}% vs previous period)
• Competition registrations: ${(recentRegs || []).length} (${regGrowth >= 0 ? '+' : ''}${regGrowth}%)
• Messages sent: ${recentMessages || 0} (${msgGrowth >= 0 ? '+' : ''}${msgGrowth}%)
• Certificates issued: ${recentCerts || 0}

═══ DISTRIBUTION ═══
Roles: ${JSON.stringify(roleCounts)}
Competition Status: ${JSON.stringify(competitionStatus)}
Exhibition Status: ${JSON.stringify(exhibitionStatus)}
Entity Types: ${JSON.stringify(entityTypes)}

═══ PERFORMANCE ═══
• Avg Competition Score: ${avgScore}
• Registration Approval Rate: ${approvalRate}%
• Active Sponsorship Revenue: ${totalSponsorship} SAR
• Shop Revenue (completed): ${shopRevenue} SAR
• Transaction Volume: ${(transactions || []).length} txns totaling ${txnTotal} SAR

═══ GEOGRAPHY ═══
Top Countries: ${topCountries.map(([c, n]) => `${c}: ${n}`).join(", ") || "No data"}`;

  return {
    snapshot,
    summary,
    growth: {
      userGrowth, regGrowth, msgGrowth,
      recentUsers: recentUsers || 0,
      recentRegs: (recentRegs || []).length,
      recentMessages: recentMessages || 0,
      recentCerts: recentCerts || 0,
    },
    distributions: {
      roleCounts, competitionStatus, exhibitionStatus, entityTypes, topCountries,
    },
  };
}
