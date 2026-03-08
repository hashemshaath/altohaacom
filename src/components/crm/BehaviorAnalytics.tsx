import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  ShoppingCart, Eye, TrendingUp, Users, Activity, Clock,
  Zap, AlertTriangle, Target, BarChart3, ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export const BehaviorAnalytics = memo(function BehaviorAnalytics() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  // Abandoned carts stats
  const { data: cartStats } = useQuery({
    queryKey: ["crm-abandoned-carts"],
    queryFn: async () => {
      const { data: carts } = await supabase
        .from("abandoned_carts")
        .select("id, total_amount, recovery_status, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      const all = carts || [];
      const abandoned = all.filter(c => c.recovery_status === "abandoned");
      const recovered = all.filter(c => c.recovery_status === "recovered");
      const totalValue = abandoned.reduce((s, c) => s + (Number(c.total_amount) || 0), 0);
      const recoveredValue = recovered.reduce((s, c) => s + (Number(c.total_amount) || 0), 0);
      return {
        total: all.length,
        abandoned: abandoned.length,
        recovered: recovered.length,
        recoveryRate: all.length > 0 ? Math.round((recovered.length / all.length) * 100) : 0,
        totalValue,
        recoveredValue,
      };
    },
    staleTime: 30000,
  });

  // User behavior stats (top pages, engagement)
  const { data: behaviorStats } = useQuery({
    queryKey: ["crm-behavior-stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ad_user_behaviors")
        .select("event_type, page_category, device_type, duration_seconds")
        .order("created_at", { ascending: false })
        .limit(1000);
      const events = data || [];
      const pageViews = events.filter(e => e.event_type === "page_view");
      const engagements = events.filter(e => e.event_type === "engagement");

      // Top categories
      const catCounts = new Map<string, number>();
      pageViews.forEach(pv => {
        const cat = pv.page_category || "other";
        catCounts.set(cat, (catCounts.get(cat) || 0) + 1);
      });
      const topCategories = [...catCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

      // Device distribution
      const deviceCounts = new Map<string, number>();
      events.forEach(e => {
        const d = e.device_type || "unknown";
        deviceCounts.set(d, (deviceCounts.get(d) || 0) + 1);
      });

      // Avg engagement duration
      const durations = engagements.filter(e => e.duration_seconds).map(e => e.duration_seconds!);
      const avgDuration = durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

      return {
        totalPageViews: pageViews.length,
        totalEngagements: engagements.length,
        avgDuration,
        topCategories,
        deviceDistribution: Object.fromEntries(deviceCounts),
      };
    },
    staleTime: 30000,
  });

  // Conversion events stats
  const { data: conversionStats } = useQuery({
    queryKey: ["crm-conversion-stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("conversion_events")
        .select("event_name, event_value, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      const events = data || [];
      const signups = events.filter(e => e.event_name === "sign_up").length;
      const purchases = events.filter(e => e.event_name === "purchase");
      const totalRevenue = purchases.reduce((s, p) => s + (Number(p.event_value) || 0), 0);
      return {
        total: events.length,
        signups,
        purchases: purchases.length,
        totalRevenue,
        topEvents: [...new Map<string, number>()].slice(0, 5),
      };
    },
    staleTime: 30000,
  });

  // Top interests
  const { data: interests = [] } = useQuery({
    queryKey: ["crm-user-interests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ad_user_interests")
        .select("interest_category, score, interaction_count")
        .order("score", { ascending: false })
        .limit(10);
      return data || [];
    },
    staleTime: 60000,
  });

  const categoryLabels: Record<string, { en: string; ar: string }> = {
    competitions: { en: "Competitions", ar: "المسابقات" },
    exhibitions: { en: "Exhibitions", ar: "المعارض" },
    shop: { en: "Shop", ar: "المتجر" },
    recipes: { en: "Recipes", ar: "الوصفات" },
    community: { en: "Community", ar: "المجتمع" },
    articles: { en: "Articles", ar: "المقالات" },
    masterclasses: { en: "Masterclasses", ar: "الماستركلاس" },
    home: { en: "Home", ar: "الرئيسية" },
    knowledge: { en: "Knowledge", ar: "المعرفة" },
    mentorship: { en: "Mentorship", ar: "الإرشاد" },
    "chefs-table": { en: "Chef's Table", ar: "طاولة الشيف" },
    other: { en: "Other", ar: "أخرى" },
  };

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-s-4 border-s-chart-4">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-full bg-chart-4/10 p-2.5">
              <ShoppingCart className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "سلال مهجورة" : "Abandoned Carts"}</p>
              <p className="text-2xl font-bold"><AnimatedCounter value={cartStats?.abandoned ?? 0} /></p>
              <p className="text-[10px] text-muted-foreground">
                <AnimatedCounter value={cartStats?.totalValue ?? 0} /> SAR
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-s-4 border-s-chart-5">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-full bg-chart-5/10 p-2.5">
              <TrendingUp className="h-5 w-5 text-chart-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "معدل الاسترداد" : "Recovery Rate"}</p>
              <p className="text-2xl font-bold"><AnimatedCounter value={cartStats?.recoveryRate ?? 0} suffix="%" /></p>
              <p className="text-[10px] text-muted-foreground">
                <AnimatedCounter value={cartStats?.recovered ?? 0} className="inline" /> {isAr ? "مسترد" : "recovered"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-s-4 border-s-primary">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-full bg-primary/10 p-2.5">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "مشاهدات الصفحات" : "Page Views"}</p>
              <p className="text-2xl font-bold"><AnimatedCounter value={behaviorStats?.totalPageViews ?? 0} /></p>
              <p className="text-[10px] text-muted-foreground">
                <AnimatedCounter value={behaviorStats?.avgDuration ?? 0} className="inline" />s {isAr ? "متوسط" : "avg"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-s-4 border-s-chart-3">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-full bg-chart-3/10 p-2.5">
              <Zap className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "تحويلات" : "Conversions"}</p>
              <p className="text-2xl font-bold"><AnimatedCounter value={conversionStats?.total ?? 0} /></p>
              <p className="text-[10px] text-muted-foreground">
                <AnimatedCounter value={conversionStats?.totalRevenue ?? 0} /> SAR
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Interests */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              {isAr ? "أبرز الاهتمامات" : "Top User Interests"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[220px]">
              <div className="space-y-3">
                {interests.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {isAr ? "لا توجد بيانات بعد" : "No data yet"}
                  </p>
                ) : (
                  interests.map((interest: any, i: number) => {
                    const maxScore = interests[0]?.score || 1;
                    const pct = Math.round(((interest.score || 0) / maxScore) * 100);
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium capitalize">{interest.interest_category}</span>
                          <span className="text-muted-foreground">
                            <AnimatedCounter value={interest.interaction_count || 0} className="inline" /> {isAr ? "تفاعل" : "interactions"}
                          </span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              {isAr ? "أكثر الصفحات زيارة" : "Most Visited Pages"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[220px]">
              <div className="space-y-3">
                {(behaviorStats?.topCategories || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {isAr ? "لا توجد بيانات بعد" : "No data yet"}
                  </p>
                ) : (
                  behaviorStats?.topCategories.map(([cat, count]: [string, number], i: number) => {
                    const maxCount = behaviorStats.topCategories[0]?.[1] || 1;
                    const pct = Math.round((count / maxCount) * 100);
                    const label = categoryLabels[cat] || { en: cat, ar: cat };
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">{isAr ? label.ar : label.en}</span>
                          <span className="text-muted-foreground">
                            <AnimatedCounter value={count} className="inline" /> {isAr ? "مشاهدة" : "views"}
                          </span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Device Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              {isAr ? "توزيع الأجهزة" : "Device Distribution"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(behaviorStats?.deviceDistribution || {}).map(([device, count]: [string, any]) => {
                const total = Object.values(behaviorStats?.deviceDistribution || {}).reduce((s: number, v: any) => s + v, 0) as number;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const deviceLabels: Record<string, { en: string; ar: string }> = {
                  mobile: { en: "Mobile", ar: "موبايل" },
                  tablet: { en: "Tablet", ar: "تابلت" },
                  desktop: { en: "Desktop", ar: "سطح المكتب" },
                };
                const label = deviceLabels[device] || { en: device, ar: device };
                return (
                  <div key={device} className="flex items-center justify-between">
                    <span className="text-sm">{isAr ? label.ar : label.en}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={pct} className="h-2 w-24" />
                      <Badge variant="secondary" className="text-[10px]"><AnimatedCounter value={pct} className="inline" />%</Badge>
                    </div>
                  </div>
                );
              })}
              {Object.keys(behaviorStats?.deviceDistribution || {}).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">{isAr ? "لا توجد بيانات" : "No data"}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lifecycle Triggers */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              {isAr ? "محفزات الأتمتة" : "Lifecycle Triggers"}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
              <Link to="/admin/communications">
                {isAr ? "إدارة" : "Manage"}
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <LifecycleTriggersList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

function LifecycleTriggersList() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: triggers = [] } = useQuery({
    queryKey: ["crm-lifecycle-triggers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("lifecycle_triggers")
        .select("id, name, name_ar, trigger_event, channels, delay_minutes, is_active, created_at")
        .order("created_at", { ascending: true })
        .limit(10);
      return data || [];
    },
  });

  return (
    <ScrollArea className="h-[180px]">
      <div className="space-y-2">
        {triggers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{isAr ? "لا توجد محفزات" : "No triggers"}</p>
        ) : (
          triggers.map((t: any) => (
            <div key={t.id} className="flex items-center justify-between rounded-xl border p-2.5">
              <div>
                <p className="text-xs font-medium">{isAr ? t.name_ar || t.name : t.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {t.channels?.join(", ")} · <AnimatedCounter value={t.delay_minutes || 0} className="inline" /> {isAr ? "دقيقة تأخير" : "min delay"}
                </p>
              </div>
              <Badge variant={t.is_active ? "default" : "secondary"} className="text-[10px]">
                {t.is_active ? (isAr ? "نشط" : "Active") : (isAr ? "معطل" : "Inactive")}
              </Badge>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
});
