import { memo, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gauge, TrendingUp, TrendingDown, Minus, Smartphone, Monitor, Wifi, Zap, AlertTriangle } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Legend, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  fcp: { good: 1800, poor: 3000 },
  ttfb: { good: 800, poor: 1800 },
  inp: { good: 200, poor: 500 },
  cls: { good: 0.1, poor: 0.25 },
};

function getScore(metric: string, value: number): number {
  const t = THRESHOLDS[metric as keyof typeof THRESHOLDS];
  if (!t) return 50;
  if (value <= t.good) return 100;
  if (value >= t.poor) return 0;
  return Math.round(100 * (1 - (value - t.good) / (t.poor - t.good)));
}

function getGrade(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: "A+", color: "text-green-500" };
  if (score >= 75) return { grade: "A", color: "text-green-500" };
  if (score >= 60) return { grade: "B", color: "text-amber-500" };
  if (score >= 40) return { grade: "C", color: "text-amber-500" };
  return { grade: "D", color: "text-destructive" };
}

export const SEOPageSpeedMonitor = memo(function SEOPageSpeedMonitor({ isAr }: { isAr: boolean }) {
  // Current period
  const { data: currentData, isLoading } = useQuery({
    queryKey: ["seo-speed-current"],
    queryFn: async () => {
      const from = startOfDay(subDays(new Date(), 14)).toISOString();
      const { data } = await supabase
        .from("seo_web_vitals")
        .select("path, lcp, fcp, ttfb, inp, cls, device_type, connection_type, created_at")
        .gte("created_at", from)
        .order("created_at", { ascending: false })
        .limit(1000);
      return data || [];
    },
  });

  // Previous period for comparison
  const { data: prevData } = useQuery({
    queryKey: ["seo-speed-prev"],
    queryFn: async () => {
      const from = startOfDay(subDays(new Date(), 28)).toISOString();
      const to = startOfDay(subDays(new Date(), 14)).toISOString();
      const { data } = await supabase
        .from("seo_web_vitals")
        .select("lcp, fcp, ttfb, inp, cls, device_type")
        .gte("created_at", from)
        .lt("created_at", to)
        .limit(1000);
      return data || [];
    },
  });

  const analysis = useMemo(() => {
    if (!currentData?.length) return null;

    const p75 = (arr: number[]) => {
      if (!arr.length) return null;
      const s = [...arr].sort((a, b) => a - b);
      return s[Math.ceil(s.length * 0.75) - 1];
    };

    const extract = (data: any[], metric: string) =>
      data.filter(d => d[metric] != null).map(d => Number(d[metric]));

    // Current P75s
    const current = {
      lcp: p75(extract(currentData, "lcp")),
      fcp: p75(extract(currentData, "fcp")),
      ttfb: p75(extract(currentData, "ttfb")),
      inp: p75(extract(currentData, "inp")),
      cls: p75(extract(currentData, "cls")),
    };

    // Previous P75s
    const prev = prevData?.length ? {
      lcp: p75(extract(prevData, "lcp")),
      fcp: p75(extract(prevData, "fcp")),
      ttfb: p75(extract(prevData, "ttfb")),
      inp: p75(extract(prevData, "inp")),
      cls: p75(extract(prevData, "cls")),
    } : null;

    // Overall speed score
    const scores: number[] = [];
    (["lcp", "fcp", "ttfb", "inp", "cls"] as const).forEach(m => {
      if (current[m] != null) scores.push(getScore(m, current[m]!));
    });
    const overallScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    // Per-page breakdown
    const byPage: Record<string, { lcp: number[]; fcp: number[]; ttfb: number[]; samples: number }> = {};
    currentData.forEach((v) => {
      if (!byPage[v.path]) byPage[v.path] = { lcp: [], fcp: [], ttfb: [], samples: 0 };
      byPage[v.path].samples++;
      if (v.lcp != null) byPage[v.path].lcp.push(Number(v.lcp));
      if (v.fcp != null) byPage[v.path].fcp.push(Number(v.fcp));
      if (v.ttfb != null) byPage[v.path].ttfb.push(Number(v.ttfb));
    });

    const pageBreakdown = Object.entries(byPage)
      .map(([path, d]) => {
        const lcpVal = p75(d.lcp);
        const fcpVal = p75(d.fcp);
        const ttfbVal = p75(d.ttfb);
        const pageScores: number[] = [];
        if (lcpVal != null) pageScores.push(getScore("lcp", lcpVal));
        if (fcpVal != null) pageScores.push(getScore("fcp", fcpVal));
        if (ttfbVal != null) pageScores.push(getScore("ttfb", ttfbVal));
        const score = pageScores.length ? Math.round(pageScores.reduce((a, b) => a + b, 0) / pageScores.length) : 0;
        return { path, lcp: lcpVal, fcp: fcpVal, ttfb: ttfbVal, samples: d.samples, score };
      })
      .sort((a, b) => a.score - b.score);

    // Daily trend
    const byDay: Record<string, { lcp: number[]; fcp: number[] }> = {};
    currentData.forEach((v) => {
      const day = format(new Date(v.created_at), "MM/dd");
      if (!byDay[day]) byDay[day] = { lcp: [], fcp: [] };
      if (v.lcp != null) byDay[day].lcp.push(Number(v.lcp));
      if (v.fcp != null) byDay[day].fcp.push(Number(v.fcp));
    });
    const trendData = Object.entries(byDay)
      .map(([day, d]) => ({ day, LCP: p75(d.lcp), FCP: p75(d.fcp) }))
      .sort((a, b) => a.day.localeCompare(b.day));

    // Mobile vs Desktop comparison
    const mobile = currentData.filter((v) => v.device_type === "mobile");
    const desktop = currentData.filter((v) => v.device_type === "desktop");
    const deviceComparison = {
      mobile: { lcp: p75(extract(mobile, "lcp")), fcp: p75(extract(mobile, "fcp")), ttfb: p75(extract(mobile, "ttfb")), count: mobile.length },
      desktop: { lcp: p75(extract(desktop, "lcp")), fcp: p75(extract(desktop, "fcp")), ttfb: p75(extract(desktop, "ttfb")), count: desktop.length },
    };

    // Radar data for device comparison
    const radarData = (["lcp", "fcp", "ttfb"] as const).map(m => ({
      metric: m.toUpperCase(),
      Mobile: deviceComparison.mobile[m] ? getScore(m, deviceComparison.mobile[m]!) : 0,
      Desktop: deviceComparison.desktop[m] ? getScore(m, deviceComparison.desktop[m]!) : 0,
    }));

    // Connection type impact
    const byConn: Record<string, number[]> = {};
    currentData.forEach((v) => {
      const ct = v.connection_type || "unknown";
      if (!byConn[ct]) byConn[ct] = [];
      if (v.lcp != null) byConn[ct].push(Number(v.lcp));
    });
    const connectionImpact = Object.entries(byConn)
      .map(([type, lcps]) => ({ type, lcp: p75(lcps) || 0, count: lcps.length }))
      .sort((a, b) => a.lcp - b.lcp);

    return { current, prev, overallScore, pageBreakdown, trendData, deviceComparison, radarData, connectionImpact, sampleCount: currentData.length };
  }, [currentData, prevData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          <Gauge className="h-10 w-10 mx-auto mb-3 opacity-30" />
          {isAr ? "لا توجد بيانات أداء بعد" : "No performance data collected yet"}
        </CardContent>
      </Card>
    );
  }

  const { grade, color } = getGrade(analysis.overallScore);

  const renderDelta = (current: number | null, prev: number | null, lowerIsBetter = true) => {
    if (current == null || prev == null) return null;
    const diff = current - prev;
    const pct = prev > 0 ? Math.round((diff / prev) * 100) : 0;
    const improved = lowerIsBetter ? diff < 0 : diff > 0;
    if (Math.abs(pct) < 2) return <Minus className="h-3 w-3 text-muted-foreground" />;
    return (
      <span className={`flex items-center gap-0.5 text-xs ${improved ? "text-green-500" : "text-destructive"}`}>
        {improved ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
        {Math.abs(pct)}%
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Overall score hero */}
      <Card className="bg-gradient-to-br from-card to-muted/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Gauge className="h-5 w-5 text-primary" />
                {isAr ? "نتيجة سرعة الموقع" : "Site Speed Score"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isAr ? `بناءً على ${analysis.sampleCount} عينة (آخر 14 يوم)` : `Based on ${analysis.sampleCount} samples (last 14 days)`}
              </p>
            </div>
            <div className="text-center">
              <p className={`text-5xl font-black ${color}`}>{grade}</p>
              <p className="text-sm font-semibold text-muted-foreground mt-1">{analysis.overallScore}/100</p>
            </div>
          </div>

          {/* Metric pills */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
            {(["lcp", "fcp", "ttfb", "inp", "cls"] as const).map(m => {
              const val = analysis.current[m];
              const prevVal = analysis.prev?.[m] ?? null;
              const score = val != null ? getScore(m, val) : null;
              const { grade: g, color: c } = score != null ? getGrade(score) : { grade: "-", color: "text-muted-foreground" };
              return (
                <div key={m} className="rounded-lg border border-border/50 bg-card p-3 text-center">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{m.toUpperCase()}</p>
                  <p className={`text-xl font-bold mt-1 ${c}`}>
                    {val != null ? (m === "cls" ? val.toFixed(3) : Math.round(val)) : "-"}
                    {val != null && m !== "cls" && <span className="text-xs font-normal text-muted-foreground">ms</span>}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Badge variant="outline" className="text-xs px-1">{g}</Badge>
                    {renderDelta(val, prevVal)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* LCP/FCP trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {isAr ? "اتجاه الأداء" : "Performance Trend"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={analysis.trendData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="day" fontSize={10} />
                <YAxis fontSize={10} unit="ms" />
                <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="LCP" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="FCP" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device radar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-primary" />
              {isAr ? "مقارنة الأجهزة" : "Device Comparison"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={analysis.radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" fontSize={11} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} fontSize={9} />
                <Radar name="Mobile" dataKey="Mobile" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.2} />
                <Radar name="Desktop" dataKey="Desktop" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.2} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Connection impact */}
      {analysis.connectionImpact.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wifi className="h-4 w-4 text-primary" />
              {isAr ? "تأثير نوع الاتصال على LCP" : "Connection Type Impact on LCP"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={analysis.connectionImpact}>
                <XAxis dataKey="type" fontSize={10} />
                <YAxis fontSize={10} unit="ms" />
                <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="lcp" radius={[4, 4, 0, 0]} name="LCP (P75)">
                  {analysis.connectionImpact.map((entry, i) => (
                    <Cell key={i} fill={entry.lcp <= 2500 ? "hsl(var(--chart-2))" : entry.lcp <= 4000 ? "hsl(var(--chart-4))" : "hsl(var(--destructive))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Per-page breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            {isAr ? "أداء كل صفحة" : "Per-Page Performance"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-[320px] overflow-y-auto">
            <div className="grid grid-cols-[1fr,70px,70px,70px,50px,50px] gap-2 text-xs font-semibold text-muted-foreground uppercase pb-1 border-b border-border sticky top-0 bg-card">
              <span>{isAr ? "الصفحة" : "Page"}</span>
              <span className="text-center">LCP</span>
              <span className="text-center">FCP</span>
              <span className="text-center">TTFB</span>
              <span className="text-center">{isAr ? "عينات" : "N"}</span>
              <span className="text-center">{isAr ? "الدرجة" : "Grade"}</span>
            </div>
            {analysis.pageBreakdown.map(p => {
              const { grade: g, color: c } = getGrade(p.score);
              return (
                <div key={p.path} className="grid grid-cols-[1fr,70px,70px,70px,50px,50px] gap-2 items-center py-1.5 text-xs border-b border-border/10">
                  <code className="truncate text-xs">{p.path}</code>
                  <span className="text-center tabular-nums">{p.lcp != null ? Math.round(p.lcp) : "-"}</span>
                  <span className="text-center tabular-nums">{p.fcp != null ? Math.round(p.fcp) : "-"}</span>
                  <span className="text-center tabular-nums">{p.ttfb != null ? Math.round(p.ttfb) : "-"}</span>
                  <span className="text-center tabular-nums text-muted-foreground">{p.samples}</span>
                  <div className="flex justify-center">
                    <Badge variant={p.score >= 75 ? "default" : p.score >= 50 ? "secondary" : "destructive"} className={`text-xs px-1.5 ${c}`}>
                      {g}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
