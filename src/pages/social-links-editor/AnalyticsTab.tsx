import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3, MousePointerClick, TrendingUp, Eye, Clock,
  Download, Bell, Smartphone, FileDown,
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import type { LinkItem, VisitorStats, ClickAnalytics, BioNotification } from "./types";
import { MS_PER_DAY } from "@/lib/constants";

interface Props {
  items: LinkItem[];
  isAr: boolean;
  visitorStats: VisitorStats | null | undefined;
  clickAnalytics: ClickAnalytics | null | undefined;
  bioNotifications: BioNotification[] | undefined;
  pageId: string | undefined;
}

export const AnalyticsTab = memo(function AnalyticsTab({ items, isAr, visitorStats, clickAnalytics, bioNotifications, pageId }: Props) {
  const totalClicks = items.reduce((sum, item) => sum + (item.click_count || 0), 0);

  return (
    <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Link Performance */}
      <Card className="overflow-hidden border-border/40">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "أداء الروابط" : "Link Performance"}
          </CardTitle>
          <p className="text-[12px] text-muted-foreground">{isAr ? "تحليل النقرات على كل رابط" : "Click analysis for each link"}</p>
        </CardHeader>
        <CardContent className="pt-3">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">{isAr ? "أضف روابط لرؤية التحليلات" : "Add links to see analytics"}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {items.slice().sort((a, b) => (b.click_count || 0) - (a.click_count || 0)).map(item => {
                const clicks = item.click_count || 0;
                const maxClicks = Math.max(...items.map(i => i.click_count || 0), 1);
                const pct = Math.round((clicks / maxClicks) * 100);
                return (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium truncate flex-1">{item.icon && <span className="me-1">{item.icon}</span>}{item.title}</span>
                      <span className="text-xs font-bold tabular-nums ms-2">{clicks}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                      <div className="h-full rounded-full bg-primary/60 transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <Separator className="my-3" />
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold tabular-nums">{totalClicks}</p>
                  <p className="text-[12px] text-muted-foreground">{isAr ? "إجمالي النقرات" : "Total Clicks"}</p>
                </div>
                <div>
                  <p className="text-lg font-bold tabular-nums">{items.length > 0 ? Math.round(totalClicks / items.length) : 0}</p>
                  <p className="text-[12px] text-muted-foreground">{isAr ? "متوسط/رابط" : "Avg per Link"}</p>
                </div>
                <div>
                  <p className="text-lg font-bold tabular-nums">{items.filter(i => (i.click_count || 0) > 0).length}/{items.length}</p>
                  <p className="text-[12px] text-muted-foreground">{isAr ? "روابط نشطة" : "Active Links"}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Performing */}
      {items.length > 0 && totalClicks > 0 && (
        <Card className="overflow-hidden border-border/40">
          <CardHeader className="pb-3 bg-muted/30">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="h-7 w-7 rounded-xl bg-chart-1/10 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-chart-1" />
              </div>
              {isAr ? "الأفضل أداءً" : "Top Performing"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="space-y-2">
              {items.slice().sort((a, b) => (b.click_count || 0) - (a.click_count || 0)).slice(0, 3).map((item, i) => (
                <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-border/30">
                  <div className={`h-7 w-7 rounded-xl flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-chart-2/10 text-chart-2" : i === 1 ? "bg-chart-3/10 text-chart-3" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.icon && <span className="me-1">{item.icon}</span>}{item.title}</p>
                    <p className="text-[12px] text-muted-foreground">{totalClicks > 0 ? Math.round(((item.click_count || 0) / totalClicks) * 100) : 0}% {isAr ? "من النقرات" : "of clicks"}</p>
                  </div>
                  <span className="text-sm font-bold tabular-nums">{item.click_count || 0}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Click Heatmap */}
      {items.length > 0 && (
        <Card className="overflow-hidden border-border/40">
          <CardHeader className="pb-3 bg-muted/30">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="h-7 w-7 rounded-xl bg-destructive/10 flex items-center justify-center">
                <BarChart3 className="h-3.5 w-3.5 text-destructive" />
              </div>
              {isAr ? "خريطة حرارية للنقرات" : "Click Heatmap"}
              {visitorStats && <Badge variant="secondary" className="text-[12px] ms-auto">CTR: {visitorStats.total > 0 ? ((totalClicks / visitorStats.total) * 100).toFixed(1) : "0"}%</Badge>}
            </CardTitle>
            <p className="text-[12px] text-muted-foreground">{isAr ? "كثافة النقرات لكل رابط مقارنة بالمجموع" : "Click intensity per link relative to total"}</p>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="space-y-1.5">
              {items.slice().sort((a, b) => (b.click_count || 0) - (a.click_count || 0)).map((item) => {
                const clicks = item.click_count || 0;
                const maxClicks = Math.max(...items.map(i => i.click_count || 0), 1);
                const pct = maxClicks > 0 ? (clicks / maxClicks) * 100 : 0;
                const sharePct = totalClicks > 0 ? ((clicks / totalClicks) * 100).toFixed(1) : "0";
                const heat = pct > 66 ? "bg-destructive/70" : pct > 33 ? "bg-chart-2/70" : pct > 0 ? "bg-chart-4/50" : "bg-muted/30";
                return (
                  <div key={item.id} className="group relative">
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-muted/30 transition-colors">
                      <span className="text-xs w-5 shrink-0">{item.icon || "🔗"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[12px] font-medium truncate max-w-[60%]">{item.title}</span>
                          <span className="text-[12px] text-muted-foreground tabular-nums">{clicks} <span className="text-[12px]">({sharePct}%)</span></span>
                        </div>
                        <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${heat}`} style={{ width: `${Math.max(pct, 2)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {visitorStats && visitorStats.total > 0 && (
              <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between text-[12px] text-muted-foreground">
                <span>{isAr ? "إجمالي الزيارات" : "Total Visits"}: <strong className="text-foreground">{visitorStats.total}</strong></span>
                <span>{isAr ? "إجمالي النقرات" : "Total Clicks"}: <strong className="text-foreground">{totalClicks}</strong></span>
                <span>CTR: <strong className="text-foreground">{((totalClicks / visitorStats.total) * 100).toFixed(1)}%</strong></span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Best Click Times */}
      {clickAnalytics && clickAnalytics.total > 0 && (
        <Card className="overflow-hidden border-border/40">
          <CardHeader className="pb-3 bg-muted/30">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="h-7 w-7 rounded-xl bg-chart-2/10 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5 text-chart-2" />
              </div>
              {isAr ? "أفضل أوقات النقر" : "Best Click Times"}
              <Badge variant="secondary" className="text-[12px] ms-auto">{clickAnalytics.total} {isAr ? "نقرة" : "clicks"}</Badge>
            </CardTitle>
            <p className="text-[12px] text-muted-foreground">
              {isAr
                ? `أفضل وقت: ${["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"][clickAnalytics.bestDay]} الساعة ${clickAnalytics.bestHour}:00`
                : `Peak: ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][clickAnalytics.bestDay]} at ${clickAnalytics.bestHour}:00`}
            </p>
          </CardHeader>
          <CardContent className="pt-3 space-y-4">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{isAr ? "النقرات حسب الساعة" : "Clicks by Hour"}</p>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clickAnalytics.hourlyAgg.map((v: number, h: number) => ({ hour: `${h}`, clicks: v }))} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <XAxis dataKey="hour" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} interval={2} />
                    <YAxis tick={{ fontSize: 8 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <RechartsTooltip />
                    <Bar dataKey="clicks" radius={[3, 3, 0, 0]}>
                      {clickAnalytics.hourlyAgg.map((_: number, i: number) => (
                        <Cell key={i} fill={i === clickAnalytics.bestHour ? "hsl(var(--chart-2))" : "hsl(var(--primary) / 0.4)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly Heatmap */}
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{isAr ? "خريطة الحرارة الأسبوعية" : "Weekly Heatmap"}</p>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-[auto_repeat(24,1fr)] gap-[2px] min-w-[400px]">
                  <div className="text-[7px] text-muted-foreground" />
                  {Array.from({ length: 24 }, (_, h) => (
                    <div key={h} className="text-[7px] text-center text-muted-foreground">{h % 4 === 0 ? h : ""}</div>
                  ))}
                  {(isAr ? ["أحد","إثن","ثلا","أرب","خمي","جمع","سبت"] : ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]).map((day, d) => (
                    <div key={d} className="contents">
                      <div className="text-[12px] text-muted-foreground pe-1 flex items-center">{day}</div>
                      {clickAnalytics.heatmap[d].map((val: number, h: number) => {
                        const maxH = Math.max(...clickAnalytics.heatmap.flat(), 1);
                        const intensity = val / maxH;
                        return (
                          <div key={`${d}-${h}`} className="aspect-square rounded-[2px] transition-colors"
                            style={{ backgroundColor: intensity > 0 ? `hsl(var(--chart-2) / ${0.15 + intensity * 0.85})` : "hsl(var(--muted) / 0.3)" }}
                            title={`${day} ${h}:00 — ${val} ${isAr ? "نقرة" : "clicks"}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Daily Clicks Chart */}
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{isAr ? "النقرات اليومية (14 يوم)" : "Daily Clicks (14 days)"}</p>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={clickAnalytics.dailyClicks} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="clicks" stroke="hsl(var(--chart-2))" fill="url(#clickGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Link Performance Comparison */}
      {clickAnalytics && clickAnalytics.total > 0 && items.length > 1 && (
        <Card className="overflow-hidden border-border/40">
          <CardHeader className="pb-3 bg-muted/30">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="h-7 w-7 rounded-xl bg-chart-4/10 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-chart-4" />
              </div>
              {isAr ? "مقارنة أداء الروابط" : "Link Performance Comparison"}
            </CardTitle>
            <p className="text-[12px] text-muted-foreground">{isAr ? "النقرات اليومية لكل رابط" : "Daily clicks per link"}</p>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="space-y-3">
              {items.slice().sort((a, b) => (b.click_count || 0) - (a.click_count || 0)).slice(0, 5).map((item, idx) => {
                const linkDays = clickAnalytics.linkDaily?.[item.id] || {};
                const now = Date.now();
                const sparkData = Array.from({ length: 7 }, (_, i) => {
                  const key = new Date(now - (6 - i) * MS_PER_DAY).toISOString().slice(0, 10);
                  return linkDays[key] || 0;
                });
                const max = Math.max(...sparkData, 1);
                const chartColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="text-xs w-5 shrink-0">{item.icon || "🔗"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium truncate">{item.title}</p>
                    </div>
                    <div className="flex items-end gap-[2px] h-4 shrink-0">
                      {sparkData.map((v, i) => (
                        <div key={i} className="w-1.5 rounded-t-sm transition-all"
                          style={{ height: `${Math.max((v / max) * 100, 8)}%`, backgroundColor: chartColors[idx % chartColors.length], opacity: 0.4 + (v / max) * 0.6 }}
                        />
                      ))}
                    </div>
                    <span className="text-[12px] font-bold tabular-nums w-8 text-end">{item.click_count || 0}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visitor Analytics */}
      {visitorStats && visitorStats.total > 0 && (
        <Card className="overflow-hidden border-border/40">
          <CardHeader className="pb-3 bg-muted/30">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="h-7 w-7 rounded-xl bg-chart-3/10 flex items-center justify-center">
                <Eye className="h-3.5 w-3.5 text-chart-3" />
              </div>
              {isAr ? "إحصائيات الزوار" : "Visitor Analytics"}
              <Badge variant="secondary" className="text-[12px] ms-auto">{visitorStats.total} {isAr ? "زيارة" : "visits"}</Badge>
            </CardTitle>
            <p className="text-[12px] text-muted-foreground">
              {isAr ? `${visitorStats.recent7d} زيارة في آخر 7 أيام` : `${visitorStats.recent7d} visits in the last 7 days`}
            </p>
          </CardHeader>
          <CardContent className="pt-3 space-y-4">
            {visitorStats.dailyVisits?.length > 0 && (
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{isAr ? "الزيارات اليومية (14 يوم)" : "Daily Visits (14 days)"}</p>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={visitorStats.dailyVisits} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <RechartsTooltip />
                      <Area type="monotone" dataKey="visits" stroke="hsl(var(--primary))" fill="url(#visitGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            {Object.keys(visitorStats.devices).length > 0 && (
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{isAr ? "الأجهزة" : "Devices"}</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(visitorStats.devices).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([device, count]) => (
                    <Badge key={device} variant="outline" className="text-[12px] gap-1">
                      <Smartphone className="h-2.5 w-2.5" />{device} <span className="font-bold">{count}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {Object.keys(visitorStats.countries).length > 0 && (
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{isAr ? "الدول" : "Countries"}</p>
                <div className="space-y-1">
                  {Object.entries(visitorStats.countries).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 5).map(([country, count]) => {
                    const pct = Math.round(((count as number) / visitorStats.total) * 100);
                    return (
                      <div key={country} className="flex items-center gap-2">
                        <span className="text-xs w-16 truncate">{country}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                          <div className="h-full rounded-full bg-chart-1/60" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[12px] font-bold tabular-nums w-6 text-end">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Traffic Sources */}
            {Object.keys(visitorStats.referrers).length > 0 && (() => {
              const categorize = (host: string): string => {
                if (host === "direct") return "direct";
                if (/instagram|facebook|twitter|x\.com|tiktok|snapchat|linkedin|youtube|reddit|pinterest|threads/i.test(host)) return "social";
                if (/google|bing|yahoo|duckduckgo|baidu|yandex/i.test(host)) return "search";
                if (/t\.co|lnkd\.in|bit\.ly|linktr\.ee/i.test(host)) return "shortlink";
                return "other";
              };
              const cats: Record<string, { count: number; sources: Record<string, number> }> = {};
              Object.entries(visitorStats.referrers).forEach(([ref, count]) => {
                const cat = categorize(ref);
                if (!cats[cat]) cats[cat] = { count: 0, sources: {} };
                cats[cat].count += count as number;
                cats[cat].sources[ref] = count as number;
              });
              const catLabels: Record<string, { en: string; ar: string; emoji: string; color: string }> = {
                direct: { en: "Direct", ar: "مباشر", emoji: "🔗", color: "bg-chart-1/60" },
                social: { en: "Social Media", ar: "سوشال ميديا", emoji: "📱", color: "bg-chart-2/60" },
                search: { en: "Search Engines", ar: "محركات بحث", emoji: "🔍", color: "bg-chart-3/60" },
                shortlink: { en: "Short Links", ar: "روابط مختصرة", emoji: "🔗", color: "bg-chart-4/60" },
                other: { en: "Other", ar: "أخرى", emoji: "🌐", color: "bg-chart-5/60" },
              };
              const sorted = Object.entries(cats).sort((a, b) => b[1].count - a[1].count);
              const maxCat = sorted[0]?.[1].count || 1;
              return (
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{isAr ? "مصادر الزيارات" : "Traffic Sources"}</p>
                  <div className="space-y-2">
                    {sorted.map(([cat, { count, sources }]) => {
                      const info = catLabels[cat] || catLabels.other;
                      const pct = Math.round((count / visitorStats.total) * 100);
                      const barW = Math.round((count / maxCat) * 100);
                      return (
                        <div key={cat}>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs">{info.emoji}</span>
                            <span className="text-[12px] font-medium flex-1">{isAr ? info.ar : info.en}</span>
                            <span className="text-[12px] font-bold tabular-nums">{count} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
                          </div>
                          <div className="h-2 rounded-full bg-muted/40 overflow-hidden mb-1">
                            <div className={`h-full rounded-full transition-all duration-500 ${info.color}`} style={{ width: `${Math.max(barW, 3)}%` }} />
                          </div>
                          {Object.keys(sources).length > 1 && (
                            <div className="ps-5 space-y-0.5">
                              {Object.entries(sources).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 4).map(([src, cnt]) => (
                                <div key={src} className="flex items-center justify-between text-[12px] text-muted-foreground">
                                  <span className="truncate max-w-[70%]">{src}</span>
                                  <span className="tabular-nums font-medium">{cnt}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Export Data */}
      <Card className="overflow-hidden border-border/40">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileDown className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "تصدير البيانات" : "Export Data"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={async () => {
              if (!pageId) return;
              const { data } = await supabase.from("social_link_visits").select("country, device_type, browser, referrer, created_at").eq("page_id", pageId).order("created_at", { ascending: false }).limit(1000);
              if (!data?.length) return;
              const csv = "Date,Country,Device,Browser,Referrer\n" + data.map(r => `${r.created_at},${r.country || ""},${r.device_type || ""},${r.browser || ""},${r.referrer || ""}`).join("\n");
              const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = `visitors_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
            }}>
              <Eye className="h-3 w-3" />{isAr ? "الزوار" : "Visitors"}
            </Button>
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => {
              if (!items?.length) return;
              const csv = "Title,URL,Clicks,Type\n" + items.map(i => `"${i.title}","${i.url}",${i.click_count || 0},${i.link_type || ""}`).join("\n");
              const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = `links_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
            }}>
              <MousePointerClick className="h-3 w-3" />{isAr ? "النقرات" : "Clicks"}
            </Button>
            <Button variant="outline" size="sm" className="text-xs gap-1.5 col-span-2" onClick={async () => {
              if (!pageId) return;
              const { data } = await supabase.from("bio_subscribers").select("email, name, subscribed_at").eq("page_id", pageId).order("subscribed_at", { ascending: false }).limit(5000);
              if (!data?.length) return;
              const csv = "Email,Name,Subscribed At\n" + data.map(r => `${r.email},"${r.name || ""}",${r.subscribed_at}`).join("\n");
              const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = `subscribers_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
            }}>
              <Download className="h-3 w-3" />{isAr ? "المشتركين" : "Subscribers"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="overflow-hidden border-border/40">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-chart-4/10 flex items-center justify-center">
              <Bell className="h-3.5 w-3.5 text-chart-4" />
            </div>
            {isAr ? "الإشعارات" : "Notifications"}
            {bioNotifications && bioNotifications.filter(n => !n.is_read).length > 0 && (
              <Badge variant="destructive" className="text-[12px] h-4 px-1.5 ms-auto">{bioNotifications.filter(n => !n.is_read).length}</Badge>
            )}
          </CardTitle>
          <p className="text-[12px] text-muted-foreground">{isAr ? "مشتركون جدد وإنجازات" : "New subscribers & milestones"}</p>
        </CardHeader>
        <CardContent className="pt-3">
          {!bioNotifications || bioNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">{isAr ? "لا توجد إشعارات بعد" : "No notifications yet"}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {bioNotifications.map(n => {
                const timeAgo = (() => {
                  const diff = Date.now() - new Date(n.created_at).getTime();
                  const mins = Math.floor(diff / 60000);
                  if (mins < 1) return isAr ? "الآن" : "now";
                  if (mins < 60) return `${mins}${isAr ? "د" : "m"}`;
                  const hrs = Math.floor(mins / 60);
                  if (hrs < 24) return `${hrs}${isAr ? "س" : "h"}`;
                  const days = Math.floor(hrs / 24);
                  return `${days}${isAr ? "ي" : "d"}`;
                })();
                const icon = n.type === "bio_subscriber" ? "📬" : n.type === "bio_milestone" ? "🎉" : "🔥";
                return (
                  <div key={n.id} className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-colors ${!n.is_read ? "border-primary/20 bg-primary/5" : "border-border/30 bg-transparent"}`}>
                    <span className="text-base mt-0.5 shrink-0">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-snug">{isAr ? n.title_ar : n.title}</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{isAr ? n.body_ar : n.body}</p>
                    </div>
                    <span className="text-[12px] text-muted-foreground shrink-0 tabular-nums">{timeAgo}</span>
                  </div>
                );
              })}
            </div>
          )}
          {bioNotifications && bioNotifications.filter(n => !n.is_read).length > 0 && (
            <Button variant="ghost" size="sm" className="w-full mt-3 text-xs text-muted-foreground" onClick={async () => {
              const unreadIds = bioNotifications.filter(n => !n.is_read).map(n => n.id);
              if (unreadIds.length === 0) return;
              await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
            }}>
              {isAr ? "تحديد الكل كمقروء" : "Mark all as read"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
