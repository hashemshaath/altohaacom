import { X_AXIS_PROPS } from "@/lib/chartConfig";
import { memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ComposedChart, Area, Line,
  ScatterChart, Scatter, ZAxis,
} from "recharts";
import {
  CHART_COLORS, TOOLTIP_STYLE, X_AXIS_PROPS, Y_AXIS_PROPS,
  GRID_PROPS, LEGEND_STYLE, BAR_RADIUS, H_BAR_RADIUS, CHART_HEIGHT, getNoDataText,
} from "@/lib/chartConfig";
import {
  Activity, Eye, MousePointerClick, Globe, Monitor, Smartphone,
  Tablet, Search, Zap, TrendingUp, BarChart3, Users,
  FileText, Layers, Timer, MapPin, Chrome, Clock, ArrowRight,
  Crosshair, Fingerprint, Route, Flame,
  Target, LayoutGrid, Hash, Download, Printer,
  ShoppingCart,
  ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";
import { format, parseISO } from "date-fns";

import { useEventsMonitoringData } from "./useEventsMonitoringData";
import { EcommerceTab } from "./EcommerceTab";
import { type TimeRange, EXTRA_COLORS, formatDuration, getDelta } from "./eventsMonitoringTypes";

const DeltaBadge = ({ delta }: { delta: ReturnType<typeof getDelta> }) => {
  if (delta.direction === "flat") return <Minus className="h-3 w-3 text-muted-foreground" />;
  const Icon = delta.direction === "up" ? ArrowUpRight : ArrowDownRight;
  const color = delta.direction === "up" ? "text-chart-2" : "text-destructive";
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3" />{delta.value}%
    </span>
  );
};

const NoData = ({ isAr }: { isAr: boolean }) => (
  <p className="py-12 text-center text-muted-foreground text-sm">{getNoDataText(isAr)}</p>
);

const deviceIcon = (d: string | null) => {
  if (d === "mobile") return <Smartphone className="h-3 w-3" />;
  if (d === "tablet") return <Tablet className="h-3 w-3" />;
  return <Monitor className="h-3 w-3" />;
};

export const EventsMonitoring = memo(function EventsMonitoring() {
  const data = useEventsMonitoringData();
  const {
    isAr, timeRange, setTimeRange, searchQuery, setSearchQuery,
    metrics, ecomMetrics, timelineData, eventTypeData, topPages,
    deviceData, countryData, referrerData, browserData, categoryData,
    hourlyHeatmap, sessionData, engagementScatter, entryExitPages, eventFeed, pageViews,
    exportEventsCSV, exportEcommerceCSV, exportTopPagesCSV, exportAbandonedCartsCSV, handlePrintReport,
  } = data;

  const [subTab, setSubTab] = useState("overview");

  const kpis = [
    { label: isAr ? "مشاهدات الصفحات" : "Page Views", value: metrics.totalPageViews, icon: Eye, color: "text-primary", delta: metrics.deltas.pageViews },
    { label: isAr ? "جلسات فريدة" : "Unique Sessions", value: metrics.uniqueSessions, icon: Users, color: "text-chart-3", delta: metrics.deltas.sessions },
    { label: isAr ? "أحداث سلوكية" : "Events", value: metrics.totalEvents, icon: Zap, color: "text-chart-2" },
    { label: isAr ? "نقرات" : "Clicks", value: metrics.totalClicks, icon: MousePointerClick, color: "text-chart-4" },
    { label: isAr ? "ظهور" : "Impressions", value: metrics.totalImpressions, icon: Layers, color: "text-chart-5" },
    { label: isAr ? "صفحات/جلسة" : "Pages/Session", value: metrics.pagesPerSession, icon: LayoutGrid, color: "text-chart-1", isDecimal: true },
    { label: isAr ? "معدل الارتداد" : "Bounce Rate", value: metrics.bounceRate, icon: TrendingUp, color: "text-destructive", suffix: "%", delta: metrics.deltas.bounceRate, invertDelta: true },
    { label: isAr ? "متوسط المدة" : "Avg Duration", value: metrics.avgDuration, icon: Timer, color: "text-chart-1", suffix: "s", delta: metrics.deltas.avgDuration },
    { label: isAr ? "CTR" : "CTR", value: metrics.ctr, icon: Target, color: "text-primary", suffix: "%", isDecimal: true },
  ];

  return (
    <div className="space-y-5" id="events-monitoring-content">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">{isAr ? "آخر ساعة" : "Last 1 hour"}</SelectItem>
            <SelectItem value="24h">{isAr ? "آخر 24 ساعة" : "Last 24 hours"}</SelectItem>
            <SelectItem value="7d">{isAr ? "آخر 7 أيام" : "Last 7 days"}</SelectItem>
            <SelectItem value="30d">{isAr ? "آخر 30 يوم" : "Last 30 days"}</SelectItem>
            <SelectItem value="90d">{isAr ? "آخر 90 يوم" : "Last 90 days"}</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder={isAr ? "بحث في الأحداث..." : "Search events..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="ps-8 h-8 text-xs" />
        </div>
        <Badge variant="outline" className="gap-1 text-xs">
          <Activity className="h-3 w-3 text-chart-2 animate-pulse" />
          {isAr ? "مباشر" : "Live"}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Download className="h-3.5 w-3.5" />
              {isAr ? "تصدير" : "Export"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={exportEventsCSV} className="text-xs gap-2">
              <FileText className="h-3.5 w-3.5" />
              {isAr ? "تصدير الأحداث (CSV)" : "Export Events (CSV)"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportTopPagesCSV} className="text-xs gap-2">
              <BarChart3 className="h-3.5 w-3.5" />
              {isAr ? "تصدير الصفحات (CSV)" : "Export Top Pages (CSV)"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={exportEcommerceCSV} className="text-xs gap-2">
              <ShoppingCart className="h-3.5 w-3.5" />
              {isAr ? "تصدير الطلبات (CSV)" : "Export Orders (CSV)"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportAbandonedCartsCSV} className="text-xs gap-2">
              <FileText className="h-3.5 w-3.5" />
              {isAr ? "تصدير السلات المتروكة (CSV)" : "Export Abandoned Carts (CSV)"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handlePrintReport} className="text-xs gap-2">
              <Printer className="h-3.5 w-3.5" />
              {isAr ? "طباعة التقرير" : "Print Report"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
        {kpis.map((kpi, i) => (
          <Card key={i} className="group hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <CardContent className="p-2.5 text-center">
              <kpi.icon className={`h-3.5 w-3.5 mx-auto mb-0.5 ${kpi.color} transition-transform duration-300 group-hover:scale-110`} />
              <div className="text-base font-bold leading-tight">
                {kpi.isDecimal ? kpi.value : <AnimatedCounter value={kpi.value} />}
                {kpi.suffix && <span className="text-xs text-muted-foreground ms-0.5">{kpi.suffix}</span>}
              </div>
              {kpi.delta && <DeltaBadge delta={kpi.invertDelta ? { ...kpi.delta, direction: kpi.delta.direction === "up" ? "down" : kpi.delta.direction === "down" ? "up" : "flat" } : kpi.delta} />}
              <div className="text-xs text-muted-foreground leading-tight mt-0.5">{kpi.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sub-tabs */}
      <Tabs value={subTab} onValueChange={setSubTab}>
        <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
          <TabsList className="inline-flex w-auto bg-card border border-border p-0.5 h-auto rounded-lg gap-0.5">
            {[
              { value: "overview", icon: BarChart3, label: isAr ? "نظرة عامة" : "Overview" },
              { value: "pages", icon: FileText, label: isAr ? "الصفحات" : "Pages" },
              { value: "audience", icon: Globe, label: isAr ? "الجمهور" : "Audience" },
              { value: "sessions", icon: Route, label: isAr ? "الجلسات" : "Sessions" },
              { value: "engagement", icon: Flame, label: isAr ? "التفاعل" : "Engagement" },
              { value: "heatmap", icon: LayoutGrid, label: isAr ? "خريطة حرارية" : "Heatmap" },
              { value: "ecommerce", icon: ShoppingCart, label: isAr ? "التجارة" : "E-Commerce" },
              { value: "feed", icon: Activity, label: isAr ? "البث المباشر" : "Live Feed" },
            ].map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1 text-xs px-2.5 py-1.5 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-w-max">
                <tab.icon className="h-3 w-3" /><span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                {isAr ? "نشاط الأحداث بمرور الوقت" : "Event Activity Over Time"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={CHART_HEIGHT.lg}>
                  <ComposedChart data={timelineData}>
                    <CartesianGrid {...GRID_PROPS} />
                    <XAxis dataKey="date" {...X_AXIS_PROPS} />
                    <YAxis {...Y_AXIS_PROPS} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={LEGEND_STYLE} />
                    <Area type="monotone" dataKey="pageViews" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.12} strokeWidth={2} name={isAr ? "مشاهدات" : "Page Views"} />
                    <Line type="monotone" dataKey="events" stroke={CHART_COLORS[2]} strokeWidth={2} dot={false} name={isAr ? "أحداث" : "Events"} />
                    <Bar dataKey="clicks" fill={CHART_COLORS[3]} radius={BAR_RADIUS} opacity={0.7} name={isAr ? "نقرات" : "Clicks"} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <NoData isAr={isAr} />}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-chart-2" />
                  {isAr ? "أنواع الأحداث" : "Event Types"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={CHART_HEIGHT.md}>
                    <BarChart data={eventTypeData} layout="vertical">
                      <CartesianGrid {...GRID_PROPS} />
                      <XAxis type="number" allowDecimals={false} tick={X_AXIS_PROPS.tick} axisLine={X_AXIS_PROPS.axisLine} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={90} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="value" radius={H_BAR_RADIUS} name={isAr ? "العدد" : "Count"}>
                        {eventTypeData.map((_, i) => <Cell key={i} fill={EXTRA_COLORS[i % EXTRA_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <NoData isAr={isAr} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-chart-3" />
                  {isAr ? "الأجهزة والمتصفحات" : "Devices & Browsers"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-2">{isAr ? "الأجهزة" : "Devices"}</p>
                    {deviceData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={deviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3} strokeWidth={0}>
                            {deviceData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={TOOLTIP_STYLE} />
                          <Legend wrapperStyle={{ ...LEGEND_STYLE, fontSize: 9 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <NoData isAr={isAr} />}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-2">{isAr ? "المتصفحات" : "Browsers"}</p>
                    {browserData.length > 0 ? (
                      <div className="space-y-1.5">
                        {browserData.slice(0, 6).map((b, i) => {
                          const total = browserData.reduce((s, x) => s + x.value, 0);
                          const pct = total > 0 ? Math.round((b.value / total) * 100) : 0;
                          return (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <span className="w-16 truncate text-muted-foreground">{b.name}</span>
                              <Progress value={pct} className="h-1.5 flex-1" />
                              <span className="w-8 text-end font-medium">{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : <NoData isAr={isAr} />}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {categoryData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Hash className="h-4 w-4 text-chart-4" />
                  {isAr ? "فئات المحتوى" : "Content Categories"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={CHART_HEIGHT.sm}>
                  <BarChart data={categoryData}>
                    <CartesianGrid {...GRID_PROPS} />
                    <XAxis dataKey="name" {...X_AXIS_PROPS} />
                    <YAxis {...Y_AXIS_PROPS} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={LEGEND_STYLE} />
                    <Bar dataKey="views" fill={CHART_COLORS[0]} radius={BAR_RADIUS} name={isAr ? "مشاهدات" : "Views"} />
                    <Bar dataKey="avgDuration" fill={CHART_COLORS[2]} radius={BAR_RADIUS} name={isAr ? "متوسط المدة (ث)" : "Avg Duration (s)"} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Pages ── */}
        <TabsContent value="pages" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                {isAr ? "أفضل الصفحات" : "Top Pages"}
                <Badge variant="secondary" className="ms-auto text-xs">{topPages.length} {isAr ? "صفحة" : "pages"}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topPages.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-start py-2 px-2 font-medium">{isAr ? "الصفحة" : "Page"}</th>
                        <th className="text-center py-2 px-2 font-medium">{isAr ? "المشاهدات" : "Views"}</th>
                        <th className="text-center py-2 px-2 font-medium">{isAr ? "زوار" : "Visitors"}</th>
                        <th className="text-center py-2 px-2 font-medium">{isAr ? "المدة" : "Duration"}</th>
                        <th className="text-center py-2 px-2 font-medium">{isAr ? "الارتداد" : "Bounce"}</th>
                        <th className="text-center py-2 px-2 font-medium">{isAr ? "التفاعل" : "Engagement"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPages.map((page, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                          <td className="py-2 px-2 font-mono text-foreground max-w-[250px] truncate text-xs">{page.path}</td>
                          <td className="py-2 px-2 text-center"><Badge variant="secondary" className="text-xs">{page.views}</Badge></td>
                          <td className="py-2 px-2 text-center text-muted-foreground">{page.uniqueVisitors}</td>
                          <td className="py-2 px-2 text-center text-muted-foreground">{formatDuration(page.avgDuration)}</td>
                          <td className="py-2 px-2 text-center">
                            <span className={page.bounceRate > 70 ? "text-destructive font-medium" : page.bounceRate < 30 ? "text-chart-2 font-medium" : "text-muted-foreground"}>
                              {page.bounceRate}%
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <div className="flex items-center gap-1.5 justify-center">
                              <Progress value={page.engagementScore} className="h-1.5 w-12" />
                              <span className="text-xs text-muted-foreground">{page.engagementScore}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <NoData isAr={isAr} />}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-chart-2" />
                  {isAr ? "صفحات الدخول" : "Entry Pages"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {entryExitPages.entries.length > 0 ? (
                  <ResponsiveContainer width="100%" height={CHART_HEIGHT.sm}>
                    <BarChart data={entryExitPages.entries} layout="vertical">
                      <CartesianGrid {...GRID_PROPS} />
                      <XAxis type="number" allowDecimals={false} tick={X_AXIS_PROPS.tick} axisLine={X_AXIS_PROPS.axisLine} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="value" fill={CHART_COLORS[1]} radius={H_BAR_RADIUS} name={isAr ? "دخول" : "Entries"} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <NoData isAr={isAr} />}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Crosshair className="h-4 w-4 text-destructive" />
                  {isAr ? "صفحات الخروج" : "Exit Pages"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {entryExitPages.exits.length > 0 ? (
                  <ResponsiveContainer width="100%" height={CHART_HEIGHT.sm}>
                    <BarChart data={entryExitPages.exits} layout="vertical">
                      <CartesianGrid {...GRID_PROPS} />
                      <XAxis type="number" allowDecimals={false} tick={X_AXIS_PROPS.tick} axisLine={X_AXIS_PROPS.axisLine} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="value" fill="hsl(var(--destructive))" radius={H_BAR_RADIUS} name={isAr ? "خروج" : "Exits"} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <NoData isAr={isAr} />}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Audience ── */}
        <TabsContent value="audience" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-chart-4" />
                  {isAr ? "أبرز الدول" : "Top Countries"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {countryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={CHART_HEIGHT.md}>
                    <BarChart data={countryData} layout="vertical">
                      <CartesianGrid {...GRID_PROPS} />
                      <XAxis type="number" allowDecimals={false} tick={X_AXIS_PROPS.tick} axisLine={X_AXIS_PROPS.axisLine} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={50} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="value" radius={H_BAR_RADIUS} fill={CHART_COLORS[3]} name={isAr ? "الزيارات" : "Visits"} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <NoData isAr={isAr} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Chrome className="h-4 w-4 text-chart-1" />
                  {isAr ? "مصادر الزيارات" : "Traffic Sources"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {referrerData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={CHART_HEIGHT.md}>
                    <PieChart>
                      <Pie data={referrerData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={2} strokeWidth={0}>
                        {referrerData.map((_, i) => <Cell key={i} fill={EXTRA_COLORS[i % EXTRA_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend wrapperStyle={LEGEND_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <NoData isAr={isAr} />}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Sessions ── */}
        <TabsContent value="sessions" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Route className="h-4 w-4 text-chart-3" />
                {isAr ? "مستكشف الجلسات" : "Session Explorer"}
                <Badge variant="secondary" className="ms-auto text-xs">{sessionData.length} {isAr ? "جلسة" : "sessions"}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessionData.length > 0 ? (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {sessionData.map((session, i) => (
                    <div key={i} className="border border-border/50 rounded-lg p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Fingerprint className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">{session.id.slice(0, 12)}...</span>
                        <Separator orientation="vertical" className="h-3" />
                        {deviceIcon(session.device)}
                        {session.country && <Badge variant="outline" className="text-xs px-1 py-0">{session.country}</Badge>}
                        <span className="text-xs text-muted-foreground ms-auto flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />{format(parseISO(session.startTime), "HH:mm")}
                        </span>
                        <Badge variant={session.bounced ? "destructive" : "secondary"} className="text-xs px-1 py-0">
                          {session.bounced ? (isAr ? "ارتداد" : "Bounced") : `${formatDuration(session.duration)}`}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {session.pages.map((page, j) => (
                          <span key={j} className="flex items-center gap-0.5">
                            {j > 0 && <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/50" />}
                            <Badge variant="outline" className="text-xs px-1.5 py-0 font-mono">{page}</Badge>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <NoData isAr={isAr} />}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Engagement ── */}
        <TabsContent value="engagement" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Flame className="h-4 w-4 text-chart-4" />
                {isAr ? "مصفوفة التفاعل (صفحات × مدة)" : "Engagement Matrix (Pages vs Duration)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {engagementScatter.length > 0 ? (
                <ResponsiveContainer width="100%" height={CHART_HEIGHT.lg}>
                  <ScatterChart>
                    <CartesianGrid {...GRID_PROPS} />
                    <XAxis type="number" dataKey="pages" name={isAr ? "صفحات" : "Pages"} {...X_AXIS_PROPS} />
                    <YAxis type="number" dataKey="duration" name={isAr ? "المدة (دقائق)" : "Duration (min)"} {...Y_AXIS_PROPS} unit="m" />
                    <ZAxis type="number" dataKey="z" range={[30, 30]} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ strokeDasharray: "3 3" }} />
                    <Scatter data={engagementScatter} fill={CHART_COLORS[0]} fillOpacity={0.6} />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : <NoData isAr={isAr} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Timer className="h-4 w-4 text-chart-2" />
                {isAr ? "توزيع مدة الزيارة" : "Visit Duration Distribution"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const ranges = [
                  { label: "0-10s", min: 0, max: 10 },
                  { label: "10-30s", min: 10, max: 30 },
                  { label: "30-60s", min: 30, max: 60 },
                  { label: "1-3m", min: 60, max: 180 },
                  { label: "3-10m", min: 180, max: 600 },
                  { label: "10m+", min: 600, max: Infinity },
                ];
                const durationData = ranges.map(r => ({
                  range: r.label,
                  count: (pageViews || []).filter(p => (p.duration_seconds || 0) >= r.min && (p.duration_seconds || 0) < r.max).length,
                }));
                return durationData.some(d => d.count > 0) ? (
                  <ResponsiveContainer width="100%" height={CHART_HEIGHT.sm}>
                    <BarChart data={durationData}>
                      <CartesianGrid {...GRID_PROPS} />
                      <XAxis dataKey="range" {...X_AXIS_PROPS} />
                      <YAxis {...Y_AXIS_PROPS} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="count" fill={CHART_COLORS[1]} radius={BAR_RADIUS} name={isAr ? "الزيارات" : "Visits"} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <NoData isAr={isAr} />;
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Heatmap ── */}
        <TabsContent value="heatmap" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-chart-4" />
                {isAr ? "خريطة حرارية (يوم × ساعة)" : "Traffic Heatmap (Day × Hour)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                  <div className="flex items-center gap-0">
                    <div className="w-14" />
                    {Array.from({ length: 24 }, (_, h) => (
                      <div key={h} className="flex-1 text-center text-xs text-muted-foreground">{h}</div>
                    ))}
                  </div>
                  {hourlyHeatmap.grid.map((row, dayIdx) => (
                    <div key={dayIdx} className="flex items-center gap-0">
                      <div className="w-14 text-xs text-muted-foreground text-end pe-2 shrink-0">{hourlyHeatmap.days[dayIdx]}</div>
                      {row.map((val, hourIdx) => {
                        const intensity = hourlyHeatmap.maxVal > 0 ? val / hourlyHeatmap.maxVal : 0;
                        return (
                          <div
                            key={hourIdx}
                            className="flex-1 aspect-square rounded-sm m-px transition-transform hover:scale-125 cursor-default"
                            style={{ backgroundColor: `hsl(var(--primary) / ${Math.max(0.05, intensity)})` }}
                            title={`${hourlyHeatmap.days[dayIdx]} ${hourIdx}:00 — ${val} ${isAr ? "مشاهدة" : "views"}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                  <div className="flex items-center justify-end gap-1 mt-2">
                    <span className="text-xs text-muted-foreground">{isAr ? "أقل" : "Less"}</span>
                    {[0.1, 0.3, 0.5, 0.7, 0.9].map((o, i) => (
                      <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `hsl(var(--primary) / ${o})` }} />
                    ))}
                    <span className="text-xs text-muted-foreground">{isAr ? "أكثر" : "More"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── E-Commerce ── */}
        <TabsContent value="ecommerce" className="mt-4">
          <EcommerceTab isAr={isAr} ecomMetrics={ecomMetrics} />
        </TabsContent>

        {/* ── Live Feed ── */}
        <TabsContent value="feed" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-chart-2" />
                {isAr ? "بث الأحداث المباشر" : "Live Event Stream"}
                <Badge variant="outline" className="text-xs ms-auto">{eventFeed.length} {isAr ? "حدث" : "events"}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventFeed.length > 0 ? (
                <div className="space-y-0.5 max-h-[600px] overflow-y-auto">
                  {eventFeed.map((ev, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors text-xs group">
                      <span className="text-muted-foreground w-16 shrink-0 text-xs font-mono">
                        {format(parseISO(ev.time), "HH:mm:ss")}
                      </span>
                      {deviceIcon(ev.device)}
                      {ev.country && <span className="text-xs text-muted-foreground w-6">{ev.country}</span>}
                      <Badge
                        variant={ev.type === "page_view" ? "secondary" : ev.type === "ad_click" ? "destructive" : "outline"}
                        className="text-xs px-1.5 py-0 min-w-[60px] text-center"
                      >
                        {ev.type}
                      </Badge>
                      <span className="text-muted-foreground truncate max-w-[350px] font-mono text-xs group-hover:text-foreground transition-colors">{ev.label}</span>
                    </div>
                  ))}
                </div>
              ) : <NoData isAr={isAr} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});
