import { useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
} from "recharts";
import { TrendingUp, MousePointer, Eye, Globe, Smartphone, Monitor, Tablet } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function AdAnalyticsDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  // Fetch impressions with timestamps
  const { data: impressions = [], isLoading: loadingImpressions } = useQuery({
    queryKey: ["ad-analytics-impressions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ad_impressions")
        .select("id, created_at, device_type, placement_id, campaign_id, page_url")
        .order("created_at", { ascending: true })
        .limit(1000);
      return data || [];
    },
  });

  const { data: clicks = [], isLoading: loadingClicks } = useQuery({
    queryKey: ["ad-analytics-clicks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ad_clicks")
        .select("id, created_at, device_type, placement_id, campaign_id, page_url, destination_url")
        .order("created_at", { ascending: true })
        .limit(1000);
      return data || [];
    },
  });

  const { data: placements = [] } = useQuery({
    queryKey: ["ad-analytics-placements"],
    queryFn: async () => {
      const { data } = await supabase.from("ad_placements").select("id, name, name_ar, slug");
      return data || [];
    },
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["ad-analytics-campaigns"],
    queryFn: async () => {
      const { data } = await supabase.from("ad_campaigns").select("id, name, name_ar, companies(name, name_ar)");
      return data || [];
    },
  });

  // Impressions & clicks over time (daily)
  const timeSeriesData = useMemo(() => {
    const byDay: Record<string, { date: string; impressions: number; clicks: number }> = {};
    impressions.forEach((imp: any) => {
      const day = imp.created_at?.slice(0, 10) || "";
      if (!byDay[day]) byDay[day] = { date: day, impressions: 0, clicks: 0 };
      byDay[day].impressions++;
    });
    clicks.forEach((cl: any) => {
      const day = cl.created_at?.slice(0, 10) || "";
      if (!byDay[day]) byDay[day] = { date: day, impressions: 0, clicks: 0 };
      byDay[day].clicks++;
    });
    return Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  }, [impressions, clicks]);

  // Device breakdown
  const deviceData = useMemo(() => {
    const counts: Record<string, number> = {};
    impressions.forEach((imp: any) => {
      const d = imp.device_type || "unknown";
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [impressions]);

  // Performance by placement
  const placementPerformance = useMemo(() => {
    const impByPlacement: Record<string, number> = {};
    const clickByPlacement: Record<string, number> = {};
    impressions.forEach((imp: any) => {
      impByPlacement[imp.placement_id] = (impByPlacement[imp.placement_id] || 0) + 1;
    });
    clicks.forEach((cl: any) => {
      clickByPlacement[cl.placement_id] = (clickByPlacement[cl.placement_id] || 0) + 1;
    });
    return placements.map((p: any) => ({
      name: isAr ? p.name_ar || p.name : p.name,
      impressions: impByPlacement[p.id] || 0,
      clicks: clickByPlacement[p.id] || 0,
      ctr: impByPlacement[p.id] ? (((clickByPlacement[p.id] || 0) / impByPlacement[p.id]) * 100).toFixed(2) : "0.00",
    })).filter(p => p.impressions > 0 || p.clicks > 0);
  }, [impressions, clicks, placements, isAr]);

  // Top pages
  const topPages = useMemo(() => {
    const counts: Record<string, { impressions: number; clicks: number }> = {};
    impressions.forEach((imp: any) => {
      const page = imp.page_url || "/";
      if (!counts[page]) counts[page] = { impressions: 0, clicks: 0 };
      counts[page].impressions++;
    });
    clicks.forEach((cl: any) => {
      const page = cl.page_url || "/";
      if (!counts[page]) counts[page] = { impressions: 0, clicks: 0 };
      counts[page].clicks++;
    });
    return Object.entries(counts)
      .map(([page, data]) => ({ page, ...data, ctr: data.impressions ? ((data.clicks / data.impressions) * 100).toFixed(2) : "0" }))
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 8);
  }, [impressions, clicks]);

  // Campaign performance
  const campaignPerformance = useMemo(() => {
    const impByCampaign: Record<string, number> = {};
    const clickByCampaign: Record<string, number> = {};
    impressions.forEach((imp: any) => {
      impByCampaign[imp.campaign_id] = (impByCampaign[imp.campaign_id] || 0) + 1;
    });
    clicks.forEach((cl: any) => {
      clickByCampaign[cl.campaign_id] = (clickByCampaign[cl.campaign_id] || 0) + 1;
    });
    return campaigns.map((c: any) => ({
      name: isAr ? c.name_ar || c.name : c.name,
      company: isAr ? c.companies?.name_ar || c.companies?.name : c.companies?.name,
      impressions: impByCampaign[c.id] || 0,
      clicks: clickByCampaign[c.id] || 0,
      ctr: impByCampaign[c.id] ? (((clickByCampaign[c.id] || 0) / impByCampaign[c.id]) * 100).toFixed(2) : "0.00",
    })).filter(c => c.impressions > 0).sort((a, b) => b.impressions - a.impressions);
  }, [impressions, clicks, campaigns, isAr]);

  const isLoading = loadingImpressions || loadingClicks;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-[200px]" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const deviceIcons: Record<string, any> = { mobile: Smartphone, tablet: Tablet, desktop: Monitor };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Impressions & Clicks Over Time */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            {isAr ? "المشاهدات والنقرات بمرور الوقت" : "Impressions & Clicks Over Time"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeSeriesData.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">{isAr ? "لا توجد بيانات بعد" : "No data yet"}</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend />
                <Area type="monotone" dataKey="impressions" name={isAr ? "المشاهدات" : "Impressions"} stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.15} />
                <Area type="monotone" dataKey="clicks" name={isAr ? "النقرات" : "Clicks"} stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Device Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-4 w-4" />
            {isAr ? "توزيع الأجهزة" : "Device Breakdown"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deviceData.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">{isAr ? "لا توجد بيانات" : "No data"}</p>
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={deviceData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {deviceData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2">
                {deviceData.map((d, i) => {
                  const Icon = deviceIcons[d.name] || Globe;
                  return (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <Icon className="h-3.5 w-3.5" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span>{d.name}: {d.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Placement Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="h-4 w-4" />
            {isAr ? "أداء المواقع الإعلانية" : "Placement Performance"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {placementPerformance.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">{isAr ? "لا توجد بيانات" : "No data"}</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={placementPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="impressions" name={isAr ? "مشاهدات" : "Imp."} fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
                <Bar dataKey="clicks" name={isAr ? "نقرات" : "Clicks"} fill={CHART_COLORS[1]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Pages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            {isAr ? "أعلى الصفحات أداءً" : "Top Performing Pages"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topPages.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">{isAr ? "لا توجد بيانات" : "No data"}</p>
          ) : (
            <div className="space-y-2">
              {topPages.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{p.page}</p>
                    <p className="text-[10px] text-muted-foreground">{p.impressions} {isAr ? "مشاهدة" : "imp."}</p>
                  </div>
                  <div className="text-end shrink-0 ms-3">
                    <Badge variant="secondary" className="text-[10px]">{p.ctr}% CTR</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MousePointer className="h-4 w-4" />
            {isAr ? "أداء الحملات" : "Campaign Performance"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {campaignPerformance.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">{isAr ? "لا توجد حملات بأداء" : "No campaign data"}</p>
          ) : (
            <div className="space-y-2">
              {campaignPerformance.slice(0, 6).map((c, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50">
                  <div>
                    <p className="text-xs font-medium">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.company}</p>
                  </div>
                  <div className="text-end">
                    <p className="text-xs font-semibold">{c.ctr}% CTR</p>
                    <p className="text-[10px] text-muted-foreground"><AnimatedCounter value={c.impressions} className="inline" /> {isAr ? "مشاهدة" : "imp."} · <AnimatedCounter value={c.clicks} className="inline" /> {isAr ? "نقرة" : "clicks"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
