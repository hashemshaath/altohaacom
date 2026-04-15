import { useState, memo, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  ArrowRight, Route, Map, TrendingDown, Users, Clock, Footprints,
  BarChart3, Layers, AlertTriangle, ArrowDown, ChevronRight, Eye
} from "lucide-react";
import {
  Sankey, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import { MS_PER_DAY } from "@/lib/constants";
import { CACHE } from "@/lib/queryConfig";

// Friendly page labels
const PAGE_LABELS: Record<string, { en: string; ar: string }> = {
  "/": { en: "Home", ar: "الرئيسية" },
  "/competitions": { en: "Competitions", ar: "المسابقات" },
  "/community": { en: "Community", ar: "المجتمع" },
  "/shop": { en: "Shop", ar: "المتجر" },
  "/masterclasses": { en: "Masterclasses", ar: "الدورات" },
  "/exhibitions": { en: "Exhibitions", ar: "المعارض" },
  "/news": { en: "News", ar: "الأخبار" },
  "/recipes": { en: "Recipes", ar: "الوصفات" },
  "/rankings": { en: "Rankings", ar: "التصنيفات" },
  "/profile": { en: "Profile", ar: "الملف" },
  "/auth/signin": { en: "Sign In", ar: "تسجيل الدخول" },
  "/auth/signup": { en: "Sign Up", ar: "التسجيل" },
  "/knowledge": { en: "Knowledge", ar: "المعرفة" },
  "/about": { en: "About", ar: "عنّا" },
  "/contact": { en: "Contact", ar: "تواصل" },
  "/establishments": { en: "Establishments", ar: "المنشآت" },
  "/jobs": { en: "Jobs", ar: "الوظائف" },
  "/events-calendar": { en: "Events", ar: "الفعاليات" },
  "/mentorship": { en: "Mentorship", ar: "الإرشاد" },
};

function getPageLabel(path: string, isAr: boolean): string {
  // Normalize: strip trailing slashes and get base path
  const base = "/" + (path.split("/").filter(Boolean)[0] || "");
  const full = path === "/" ? "/" : base;
  const labels = PAGE_LABELS[full];
  if (labels) return isAr ? labels.ar : labels.en;
  // For detail pages like /competitions/xyz
  const parentLabels = PAGE_LABELS[base];
  if (parentLabels) return (isAr ? parentLabels.ar : parentLabels.en) + " ›";
  return path.length > 20 ? path.slice(0, 20) + "…" : path;
}

interface FlowEdge {
  from: string;
  to: string;
  count: number;
}

interface JourneyPath {
  steps: string[];
  count: number;
  avgDuration: number;
}

interface DropOffPoint {
  page: string;
  exitCount: number;
  totalVisits: number;
  exitRate: number;
}

const FLOW_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export const UserJourneyMapping = memo(function UserJourneyMapping() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [period, setPeriod] = useState("7d");
  const [tab, setTab] = useState("flows");

  const { data, isLoading } = useQuery({
    queryKey: ["user-journey-mapping", period],
    queryFn: async () => {
      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const since = new Date(Date.now() - days * MS_PER_DAY).toISOString();

      const { data: views, error } = await supabase
        .from("seo_page_views")
        .select("path, session_id, duration_seconds, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: true })
        .limit(5000);

      if (error) throw error;
      return views || [];
    },
    staleTime: CACHE.medium.staleTime,
  });

  const analysis = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Group by session
    const sessions: Record<string, Array<{ path: string; session_id: string; duration_seconds: number; created_at: string }>> = {};
    for (const view of data) {
      if (!view.session_id) continue;
      if (!sessions[view.session_id]) sessions[view.session_id] = [];
      sessions[view.session_id].push(view);
    }

    const sessionKeys = Object.keys(sessions);
    if (sessionKeys.length === 0) return null;

    // Build flow edges
    const edgeCounts: Record<string, number> = {};
    const journeyMap: Record<string, { count: number; totalDuration: number }> = {};
    const pageExits: Record<string, number> = {};
    const pageVisits: Record<string, number> = {};
    const entryPageCounts: Record<string, number> = {};

    for (const sid of sessionKeys) {
      const views = sessions[sid];
      if (views.length < 1) continue;

      const entryPage = views[0].path;
      entryPageCounts[entryPage] = (entryPageCounts[entryPage] || 0) + 1;

      const journeySteps = views.slice(0, 5).map(v => v.path);
      const journeyKey = journeySteps.join(" → ");
      const totalDuration = views.reduce((s, v) => s + (v.duration_seconds || 0), 0);
      if (!journeyMap[journeyKey]) journeyMap[journeyKey] = { count: 0, totalDuration: 0 };
      journeyMap[journeyKey].count += 1;
      journeyMap[journeyKey].totalDuration += totalDuration;

      for (let i = 0; i < views.length; i++) {
        const path = views[i].path;
        pageVisits[path] = (pageVisits[path] || 0) + 1;

        if (i < views.length - 1) {
          const edgeKey = `${path}|||${views[i + 1].path}`;
          edgeCounts[edgeKey] = (edgeCounts[edgeKey] || 0) + 1;
        } else {
          pageExits[path] = (pageExits[path] || 0) + 1;
        }
      }
    }

    const flowEdges: FlowEdge[] = Object.entries(edgeCounts)
      .map(([key, count]) => {
        const [from, to] = key.split("|||");
        return { from, to, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    const topJourneys: JourneyPath[] = Object.entries(journeyMap)
      .map(([key, val]) => ({
        steps: key.split(" → "),
        count: val.count,
        avgDuration: Math.round(val.totalDuration / val.count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const dropOffs: DropOffPoint[] = Object.entries(pageVisits)
      .map(([page, visits]) => ({
        page,
        exitCount: pageExits[page] || 0,
        totalVisits: visits,
        exitRate: Math.round(((pageExits[page] || 0) / visits) * 100),
      }))
      .filter(d => d.totalVisits >= 3)
      .sort((a, b) => b.exitRate - a.exitRate)
      .slice(0, 10);

    const topEntries = Object.entries(entryPageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return {
      totalSessions: sessionKeys.length,
      avgPagesPerSession: Math.round((data.length / sessionKeys.length) * 10) / 10,
      flowEdges,
      topJourneys,
      dropOffs,
      topEntries,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Footprints className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>{isAr ? "لا توجد بيانات كافية لتحليل الرحلات" : "Not enough data to analyze journeys"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            {isAr ? "خريطة رحلة المستخدم" : "User Journey Mapping"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isAr ? "تتبع المسارات الفعلية للمستخدمين عبر المنصة" : "Track actual user paths across the platform"}
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">{isAr ? "٧ أيام" : "7 days"}</SelectItem>
            <SelectItem value="30d">{isAr ? "٣٠ يوم" : "30 days"}</SelectItem>
            <SelectItem value="90d">{isAr ? "٩٠ يوم" : "90 days"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
            <AnimatedCounter value={analysis.totalSessions} className="text-2xl font-bold block" />
            <p className="text-xs text-muted-foreground">{isAr ? "جلسات" : "Sessions"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Footprints className="h-5 w-5 mx-auto mb-1 text-chart-2" />
            <span className="text-2xl font-bold block">{analysis.avgPagesPerSession}</span>
            <p className="text-xs text-muted-foreground">{isAr ? "صفحات/جلسة" : "Pages/Session"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Layers className="h-5 w-5 mx-auto mb-1 text-chart-3" />
            <AnimatedCounter value={analysis.flowEdges.length} className="text-2xl font-bold block" />
            <p className="text-xs text-muted-foreground">{isAr ? "مسار تنقل" : "Flow Paths"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-chart-4" />
            <AnimatedCounter value={analysis.dropOffs.filter(d => d.exitRate > 70).length} className="text-2xl font-bold block" />
            <p className="text-xs text-muted-foreground">{isAr ? "نقاط خروج عالية" : "High Exit Points"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-card border border-border p-1 rounded-lg">
          <TabsTrigger value="flows" className="gap-1.5 rounded-md text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Map className="h-3.5 w-3.5" />{isAr ? "التدفقات" : "Flows"}
          </TabsTrigger>
          <TabsTrigger value="journeys" className="gap-1.5 rounded-md text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Route className="h-3.5 w-3.5" />{isAr ? "الرحلات" : "Journeys"}
          </TabsTrigger>
          <TabsTrigger value="dropoffs" className="gap-1.5 rounded-md text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <TrendingDown className="h-3.5 w-3.5" />{isAr ? "نقاط الخروج" : "Drop-offs"}
          </TabsTrigger>
          <TabsTrigger value="entries" className="gap-1.5 rounded-md text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Eye className="h-3.5 w-3.5" />{isAr ? "صفحات الدخول" : "Entry Pages"}
          </TabsTrigger>
        </TabsList>

        {/* === FLOWS TAB === */}
        <TabsContent value="flows" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{isAr ? "أكثر التنقلات شيوعاً" : "Most Common Page Transitions"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analysis.flowEdges.map((edge, i) => {
                const maxCount = analysis.flowEdges[0]?.count || 1;
                const pct = Math.max((edge.count / maxCount) * 100, 8);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-28 md:w-40 text-xs font-medium truncate text-end" title={edge.from}>
                      {getPageLabel(edge.from, isAr)}
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="w-28 md:w-40 text-xs font-medium truncate" title={edge.to}>
                      {getPageLabel(edge.to, isAr)}
                    </div>
                    <div className="flex-1 relative">
                      <div
                        className="h-6 rounded-lg flex items-center px-2 transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: FLOW_COLORS[i % FLOW_COLORS.length],
                          opacity: 0.8,
                        }}
                      >
                        <span className="text-[12px] font-bold text-primary-foreground">{edge.count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === JOURNEYS TAB === */}
        <TabsContent value="journeys" className="mt-4 space-y-3">
          {analysis.topJourneys.map((journey, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-[12px]">
                    #{i + 1} · {journey.count} {isAr ? "جلسة" : "sessions"}
                  </Badge>
                  <span className="text-[12px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {journey.avgDuration}s {isAr ? "متوسط" : "avg"}
                  </span>
                </div>
                <div className="flex items-center flex-wrap gap-1">
                  {journey.steps.map((step, j) => (
                    <span key={j} className="flex items-center gap-1">
                      <Badge
                        className={cn(
                          "text-[12px] font-medium px-2 py-0.5",
                          j === 0 ? "bg-primary text-primary-foreground" :
                          j === journey.steps.length - 1 ? "bg-chart-4 text-primary-foreground" :
                          "bg-muted text-foreground"
                        )}
                      >
                        {getPageLabel(step, isAr)}
                      </Badge>
                      {j < journey.steps.length - 1 && (
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      )}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* === DROP-OFFS TAB === */}
        <TabsContent value="dropoffs" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                {isAr ? "أعلى معدلات الخروج" : "Highest Exit Rates"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.dropOffs.map((drop, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{getPageLabel(drop.page, isAr)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {drop.exitCount}/{drop.totalVisits} {isAr ? "خروج" : "exits"}
                        </span>
                        <Badge variant={drop.exitRate > 70 ? "destructive" : drop.exitRate > 50 ? "secondary" : "outline"} className="text-[12px]">
                          {drop.exitRate}%
                        </Badge>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          drop.exitRate > 70 ? "bg-destructive" : drop.exitRate > 50 ? "bg-chart-4" : "bg-chart-2"
                        )}
                        style={{ width: `${drop.exitRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === ENTRY PAGES TAB === */}
        <TabsContent value="entries" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{isAr ? "أكثر صفحات الدخول" : "Top Entry Pages"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analysis.topEntries.map(([page, count]) => ({
                  page: getPageLabel(page, isAr),
                  count,
                }))} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="page" type="category" tick={{ fontSize: 11 }} width={100} />
                  <RechartsTooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {analysis.topEntries.map((_, i) => (
                      <Cell key={i} fill={FLOW_COLORS[i % FLOW_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});
