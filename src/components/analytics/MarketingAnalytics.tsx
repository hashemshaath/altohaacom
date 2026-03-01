import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toEnglishDigits } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  Megaphone, ShoppingCart, UserPlus, MousePointerClick, Eye,
  TrendingUp, ArrowDownToLine, Zap, Target, BarChart3, CalendarClock,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--destructive))"];

export function MarketingAnalytics() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: conversionData, isLoading: convLoading } = useQuery({
    queryKey: ["marketing-conversions-v2"],
    queryFn: async () => {
      const { data } = await supabase
        .from("conversion_events")
        .select("event_name, event_value, event_category, source, medium, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      const events = data || [];

      const eventCounts = new Map<string, number>();
      const eventValues = new Map<string, number>();
      events.forEach(e => {
        eventCounts.set(e.event_name, (eventCounts.get(e.event_name) || 0) + 1);
        eventValues.set(e.event_name, (eventValues.get(e.event_name) || 0) + (Number(e.event_value) || 0));
      });

      const sourceCounts = new Map<string, number>();
      events.forEach(e => {
        const src = e.source || e.medium || "direct";
        sourceCounts.set(src, (sourceCounts.get(src) || 0) + 1);
      });

      // Daily conversion trend (last 30 days)
      const dailyMap: Record<string, number> = {};
      events.forEach(e => {
        const day = e.created_at?.substring(0, 10);
        if (day) dailyMap[day] = (dailyMap[day] || 0) + 1;
      });
      const dailyTrend = Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-30)
        .map(([date, count]) => ({ date: date.slice(5), count }));

      // Source distribution for pie
      const sourcePie = [...sourceCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, value]) => ({ name, value }));

      const signups = eventCounts.get("sign_up") || 0;
      const purchases = eventCounts.get("purchase") || 0;
      const addToCarts = eventCounts.get("add_to_cart") || 0;
      const pageViews = eventCounts.get("page_view") || 0;
      const totalRevenue = eventValues.get("purchase") || 0;

      const cartRate = pageViews > 0 ? Math.round((addToCarts / pageViews) * 100) : 0;
      const purchaseRate = addToCarts > 0 ? Math.round((purchases / addToCarts) * 100) : 0;
      const overallRate = pageViews > 0 ? Math.round((purchases / pageViews) * 100) : 0;

      return {
        total: events.length, signups, purchases, addToCarts, pageViews, totalRevenue,
        cartRate, purchaseRate, overallRate,
        topEvents: [...eventCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
        topSources: [...sourceCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
        dailyTrend, sourcePie,
      };
    },
    staleTime: 30000,
  });

  const { data: cartData } = useQuery({
    queryKey: ["marketing-abandoned-carts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("abandoned_carts")
        .select("id, total_amount, recovery_status, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      const carts = data || [];
      const abandoned = carts.filter(c => c.recovery_status === "abandoned");
      const recovered = carts.filter(c => c.recovery_status === "recovered");
      const lostRevenue = abandoned.reduce((s, c) => s + (Number(c.total_amount) || 0), 0);
      const recoveredRevenue = recovered.reduce((s, c) => s + (Number(c.total_amount) || 0), 0);
      const recoveryRate = carts.length > 0 ? Math.round((recovered.length / carts.length) * 100) : 0;
      return { total: carts.length, abandoned: abandoned.length, recovered: recovered.length, lostRevenue, recoveredRevenue, recoveryRate };
    },
    staleTime: 30000,
  });

  const { data: campaignData } = useQuery({
    queryKey: ["marketing-campaigns-analytics"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ad_campaigns")
        .select("id, name, status, budget, spent, total_impressions, total_clicks, total_views, billing_model")
        .order("created_at", { ascending: false })
        .limit(20);
      const campaigns = data || [];
      const activeCampaigns = campaigns.filter(c => c.status === "active").length;
      const totalBudget = campaigns.reduce((s, c) => s + (Number(c.budget) || 0), 0);
      const totalSpent = campaigns.reduce((s, c) => s + (Number(c.spent) || 0), 0);
      const totalClicks = campaigns.reduce((s, c) => s + (c.total_clicks || 0), 0);
      const totalImpressions = campaigns.reduce((s, c) => s + (c.total_impressions || 0), 0);
      const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0";
      const roi = totalSpent > 0 ? (((Number(conversionData?.totalRevenue || 0) - totalSpent) / totalSpent) * 100).toFixed(1) : "0";
      return { campaigns, activeCampaigns, totalBudget, totalSpent, totalClicks, totalImpressions, avgCTR, roi };
    },
    staleTime: 30000,
    enabled: conversionData !== undefined,
  });

  const { data: trackingConfigs = [] } = useQuery({
    queryKey: ["marketing-tracking-configs"],
    queryFn: async () => {
      const { data } = await supabase.from("marketing_tracking_config").select("*").order("created_at");
      return data || [];
    },
    staleTime: 60000,
  });

  const eventLabels: Record<string, { en: string; ar: string }> = {
    sign_up: { en: "Sign Up", ar: "تسجيل" },
    purchase: { en: "Purchase", ar: "شراء" },
    add_to_cart: { en: "Add to Cart", ar: "إضافة للسلة" },
    page_view: { en: "Page View", ar: "مشاهدة صفحة" },
    competition_registration: { en: "Competition Reg.", ar: "تسجيل مسابقة" },
  };

  const EmptyState = ({ text }: { text: string }) => (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Megaphone className="h-10 w-10 text-muted-foreground/20 mb-2" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );

  return (
    <div className="space-y-4 mt-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { icon: Megaphone, label: isAr ? "إجمالي التحويلات" : "Total Conversions", value: conversionData?.total ?? 0, color: "primary" },
          { icon: TrendingUp, label: isAr ? "إيرادات التحويلات" : "Conv. Revenue", value: `${(conversionData?.totalRevenue ?? 0).toLocaleString()} SAR`, color: "chart-5" },
          { icon: UserPlus, label: isAr ? "تسجيلات جديدة" : "Sign Ups", value: conversionData?.signups ?? 0, color: "chart-4" },
          { icon: ShoppingCart, label: isAr ? "سلال مهجورة" : "Abandoned Carts", value: cartData?.abandoned ?? 0, sub: `${(cartData?.lostRevenue ?? 0).toLocaleString()} SAR`, color: "chart-3" },
          { icon: CalendarClock, label: isAr ? "حملات نشطة" : "Active Campaigns", value: campaignData?.activeCampaigns ?? 0, color: "chart-2" },
        ].map(k => (
          <Card key={k.label} className={`border-s-4 border-s-${k.color}`}>
            <CardContent className="flex items-center gap-3 py-4">
              <div className={`rounded-full bg-${k.color}/10 p-2.5`}>
                <k.icon className={`h-5 w-5 text-${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                {convLoading ? <Skeleton className="h-7 w-16 mt-1" /> : (
                  <AnimatedCounter value={typeof k.value === "number" ? k.value : Number(k.value) || 0} className="text-xl font-bold" />
                )}
                {"sub" in k && k.sub && <p className="text-[10px] text-muted-foreground">{toEnglishDigits(k.sub)} {isAr ? "مفقود" : "lost"}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conversion Trend Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {isAr ? "اتجاه التحويلات اليومي" : "Daily Conversion Trend"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(conversionData?.dailyTrend?.length ?? 0) < 2 ? (
            <EmptyState text={isAr ? "لا توجد بيانات تحويلات كافية" : "Not enough conversion data yet"} />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={conversionData?.dailyTrend || []}>
                  <defs>
                    <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#convGrad)" strokeWidth={2} name={isAr ? "تحويلات" : "Conversions"} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowDownToLine className="h-4 w-4 text-primary" />
            {isAr ? "قمع التحويل" : "Conversion Funnel"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: isAr ? "مشاهدات" : "Page Views", value: conversionData?.pageViews ?? 0, icon: Eye, pct: 100 },
              { label: isAr ? "إضافة للسلة" : "Add to Cart", value: conversionData?.addToCarts ?? 0, icon: ShoppingCart, pct: conversionData?.cartRate ?? 0 },
              { label: isAr ? "شراء" : "Purchase", value: conversionData?.purchases ?? 0, icon: MousePointerClick, pct: conversionData?.overallRate ?? 0 },
              { label: isAr ? "تسجيل" : "Sign Up", value: conversionData?.signups ?? 0, icon: UserPlus, pct: conversionData?.signups && conversionData?.pageViews ? Math.round((conversionData.signups / conversionData.pageViews) * 100) : 0 },
            ].map((step, i) => (
              <div key={i} className="text-center rounded-xl border p-4 space-y-2">
                <step.icon className="h-5 w-5 mx-auto text-primary" />
                <AnimatedCounter value={typeof step.value === "number" ? step.value : 0} className="text-xl font-bold" />
                <p className="text-xs text-muted-foreground">{step.label}</p>
                <Badge variant="secondary" className="text-[10px]">{toEnglishDigits(`${step.pct}`)}%</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Campaign Performance + Cart Recovery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              {isAr ? "أداء الحملات" : "Campaign Performance"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!campaignData?.campaigns?.length ? (
              <EmptyState text={isAr ? "لا توجد حملات بعد" : "No campaigns yet"} />
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl border p-3 text-center">
                    <p className="text-xs text-muted-foreground">{isAr ? "متوسط CTR" : "Avg CTR"}</p>
                    <p className="text-lg font-bold"><AnimatedCounter value={Number(campaignData.avgCTR) || 0} suffix="%" /></p>
                  </div>
                  <div className="rounded-xl border p-3 text-center">
                    <p className="text-xs text-muted-foreground">ROI</p>
                    <p className={`text-lg font-bold ${Number(campaignData.roi) >= 0 ? "text-chart-2" : "text-destructive"}`}><AnimatedCounter value={Number(campaignData.roi) || 0} suffix="%" /></p>
                  </div>
                </div>
                <ScrollArea className="h-[180px]">
                  <div className="space-y-2">
                    {campaignData.campaigns.slice(0, 8).map((c: any) => {
                      const spendPct = c.budget > 0 ? Math.round(((c.spent || 0) / c.budget) * 100) : 0;
                      return (
                        <div key={c.id} className="rounded-xl border p-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium truncate max-w-[70%]">{c.name}</span>
                            <Badge variant={c.status === "active" ? "default" : "secondary"} className="text-[10px]">{c.status}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{(c.total_clicks || 0).toLocaleString()} {isAr ? "نقرة" : "clicks"}</span>
                            <span>•</span>
                            <span>{(c.total_impressions || 0).toLocaleString()} {isAr ? "ظهور" : "impressions"}</span>
                          </div>
                          <Progress value={spendPct} className="h-1" />
                          <p className="text-[10px] text-muted-foreground">{toEnglishDigits(`${spendPct}`)}% {isAr ? "من الميزانية" : "of budget spent"}</p>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-chart-5" />
              {isAr ? "استرداد السلال المهجورة" : "Cart Recovery"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!cartData?.total ? (
              <EmptyState text={isAr ? "لا توجد سلال مهجورة" : "No abandoned carts"} />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border p-3 text-center">
                    <p className="text-xs text-muted-foreground">{isAr ? "مهجورة" : "Abandoned"}</p>
                    <p className="text-lg font-bold text-chart-5"><AnimatedCounter value={cartData.abandoned} /></p>
                  </div>
                  <div className="rounded-xl border p-3 text-center">
                    <p className="text-xs text-muted-foreground">{isAr ? "مسترجعة" : "Recovered"}</p>
                    <p className="text-lg font-bold text-chart-2"><AnimatedCounter value={cartData.recovered} /></p>
                  </div>
                  <div className="rounded-xl border p-3 text-center">
                    <p className="text-xs text-muted-foreground">{isAr ? "معدل الاسترداد" : "Recovery Rate"}</p>
                    <p className="text-lg font-bold"><AnimatedCounter value={cartData.recoveryRate} suffix="%" /></p>
                  </div>
                </div>
                <div className="rounded-xl border p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{isAr ? "إيرادات مفقودة" : "Lost Revenue"}</span>
                    <span className="font-bold text-chart-5">{toEnglishDigits(cartData.lostRevenue.toLocaleString())} SAR</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{isAr ? "إيرادات مسترجعة" : "Recovered Revenue"}</span>
                    <span className="font-bold text-chart-2">{toEnglishDigits(cartData.recoveredRevenue.toLocaleString())} SAR</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Events */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              {isAr ? "أبرز الأحداث" : "Top Events"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[220px]">
              <div className="space-y-3">
                {(conversionData?.topEvents || []).map(([name, count]: [string, number], i: number) => {
                  const max = conversionData?.topEvents[0]?.[1] || 1;
                  const pct = Math.round((count / max) * 100);
                  const label = eventLabels[name] || { en: name, ar: name };
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{isAr ? label.ar : label.en}</span>
                        <span className="text-muted-foreground">{toEnglishDigits(`${count}`)}</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })}
                {(conversionData?.topEvents || []).length === 0 && (
                  <EmptyState text={isAr ? "لا توجد أحداث" : "No events yet"} />
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Traffic Sources Pie */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              {isAr ? "مصادر الزيارات" : "Traffic Sources"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(conversionData?.sourcePie?.length ?? 0) === 0 ? (
              <EmptyState text={isAr ? "لا توجد بيانات" : "No data yet"} />
            ) : (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={conversionData?.sourcePie || []} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                      {(conversionData?.sourcePie || []).map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Google Tracking Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            {isAr ? "حالة تكاملات Google" : "Google Integrations Status"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trackingConfigs.length === 0 ? (
            <EmptyState text={isAr ? "لم يتم تكوين أي تكامل بعد" : "No integrations configured yet"} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {trackingConfigs.map((cfg: any) => {
                const platformLabels: Record<string, { en: string; ar: string }> = {
                  google_analytics_4: { en: "Google Analytics 4", ar: "Google Analytics 4" },
                  google_tag_manager: { en: "Google Tag Manager", ar: "Google Tag Manager" },
                  google_ads: { en: "Google Ads", ar: "Google Ads" },
                };
                const label = platformLabels[cfg.platform] || { en: cfg.platform, ar: cfg.platform };
                return (
                  <div key={cfg.id} className="rounded-xl border p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium">{isAr ? label.ar : label.en}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{cfg.tracking_id}</p>
                    </div>
                    <Badge variant={cfg.is_active ? "default" : "secondary"} className="text-[10px]">
                      {cfg.is_active ? (isAr ? "نشط" : "Active") : (isAr ? "معطل" : "Inactive")}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
