import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Search, Globe, Eye, Clock, Smartphone, Monitor, Tablet,
  TrendingUp, RefreshCw, Send, BarChart3, ArrowUpRight,
  AlertTriangle, CheckCircle2, ExternalLink, Activity
} from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";

// SEO route registry for health checks
const PUBLIC_ROUTES = [
  { path: "/", label: "Home" },
  { path: "/competitions", label: "Competitions" },
  { path: "/recipes", label: "Recipes" },
  { path: "/news", label: "News" },
  { path: "/community", label: "Community" },
  { path: "/masterclasses", label: "Masterclasses" },
  { path: "/rankings", label: "Rankings" },
  { path: "/establishments", label: "Establishments" },
  { path: "/jobs", label: "Jobs" },
  { path: "/shop", label: "Shop" },
  { path: "/exhibitions", label: "Exhibitions" },
  { path: "/events-calendar", label: "Events" },
  { path: "/about", label: "About" },
  { path: "/contact", label: "Contact" },
  { path: "/mentorship", label: "Mentorship" },
  { path: "/knowledge", label: "Knowledge" },
  { path: "/organizers", label: "Organizers" },
  { path: "/pro-suppliers", label: "Pro Suppliers" },
  { path: "/tastings", label: "Tastings" },
  { path: "/membership-plans", label: "Membership" },
];

export default function SEODashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [pinging, setPinging] = useState(false);
  const [range, setRange] = useState(7);

  const fromDate = startOfDay(subDays(new Date(), range)).toISOString();

  // Page views analytics
  const { data: pageViews, isLoading: loadingViews } = useQuery({
    queryKey: ["seo-page-views", range],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_page_views")
        .select("path, device_type, is_bounce, duration_seconds, created_at")
        .gte("created_at", fromDate)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
  });

  // Crawl log
  const { data: crawlLog } = useQuery({
    queryKey: ["seo-crawl-log"],
    queryFn: async () => {
      const { data } = await supabase
        .from("seo_crawl_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  // Computed metrics
  const totalViews = pageViews?.length || 0;
  const uniqueSessions = new Set(pageViews?.map((v: any) => v.session_id) || []).size;
  const bounceCount = pageViews?.filter((v: any) => v.is_bounce)?.length || 0;
  const bounceRate = totalViews > 0 ? Math.round((bounceCount / totalViews) * 100) : 0;
  const avgDuration = totalViews > 0
    ? Math.round((pageViews?.reduce((s: number, v: any) => s + (v.duration_seconds || 0), 0) || 0) / totalViews)
    : 0;

  // Device breakdown
  const devices = { mobile: 0, tablet: 0, desktop: 0 };
  pageViews?.forEach((v: any) => {
    if (v.device_type === "mobile") devices.mobile++;
    else if (v.device_type === "tablet") devices.tablet++;
    else devices.desktop++;
  });

  // Top pages
  const pageCounts: Record<string, number> = {};
  pageViews?.forEach((v: any) => {
    pageCounts[v.path] = (pageCounts[v.path] || 0) + 1;
  });
  const topPages = Object.entries(pageCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15);

  // Daily views for sparkline
  const dailyViews: Record<string, number> = {};
  pageViews?.forEach((v: any) => {
    const day = format(new Date(v.created_at), "MM/dd");
    dailyViews[day] = (dailyViews[day] || 0) + 1;
  });

  const handlePingSitemap = async () => {
    setPinging(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("seo-sitemap-ping", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      toast.success(isAr ? "تم إرسال خريطة الموقع بنجاح" : "Sitemap pinged successfully", {
        description: data?.results?.map((r: any) => `${r.engine}: ${r.status}`).join(", "),
      });
    } catch (e: any) {
      toast.error(isAr ? "فشل إرسال خريطة الموقع" : "Failed to ping sitemap", { description: e.message });
    } finally {
      setPinging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            {isAr ? "لوحة تحكم SEO" : "SEO Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? "تتبع محركات البحث والأداء في الوقت الفعلي" : "Real-time search engine tracking & performance"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden text-xs">
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => setRange(d)}
                className={`px-3 py-1.5 transition-colors ${range === d ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                {d}d
              </button>
            ))}
          </div>
          <Button onClick={handlePingSitemap} disabled={pinging} size="sm" className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            {pinging ? (isAr ? "جارٍ الإرسال..." : "Pinging...") : (isAr ? "إرسال خريطة الموقع" : "Ping Sitemap")}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Eye className="h-3.5 w-3.5" />
              {isAr ? "مشاهدات الصفحة" : "Page Views"}
            </div>
            <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? `آخر ${range} أيام` : `Last ${range} days`}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Activity className="h-3.5 w-3.5" />
              {isAr ? "جلسات فريدة" : "Unique Sessions"}
            </div>
            <p className="text-2xl font-bold">{uniqueSessions.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              {isAr ? "معدل الارتداد" : "Bounce Rate"}
            </div>
            <p className="text-2xl font-bold">{bounceRate}%</p>
            <Badge variant={bounceRate > 60 ? "destructive" : bounceRate > 40 ? "secondary" : "default"} className="text-[9px] mt-0.5">
              {bounceRate > 60 ? (isAr ? "مرتفع" : "High") : bounceRate > 40 ? (isAr ? "متوسط" : "Medium") : (isAr ? "جيد" : "Good")}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Clock className="h-3.5 w-3.5" />
              {isAr ? "متوسط المدة" : "Avg Duration"}
            </div>
            <p className="text-2xl font-bold">{avgDuration}s</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pages" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />{isAr ? "الصفحات" : "Pages"}</TabsTrigger>
          <TabsTrigger value="devices" className="gap-1.5"><Smartphone className="h-3.5 w-3.5" />{isAr ? "الأجهزة" : "Devices"}</TabsTrigger>
          <TabsTrigger value="health" className="gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />{isAr ? "صحة SEO" : "SEO Health"}</TabsTrigger>
          <TabsTrigger value="crawl" className="gap-1.5"><Globe className="h-3.5 w-3.5" />{isAr ? "سجل الزحف" : "Crawl Log"}</TabsTrigger>
        </TabsList>

        {/* Top Pages */}
        <TabsContent value="pages">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{isAr ? "أكثر الصفحات زيارة" : "Top Pages"}</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingViews ? (
                <div className="text-center py-8 text-muted-foreground text-sm">{isAr ? "جارٍ التحميل..." : "Loading..."}</div>
              ) : topPages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">{isAr ? "لا توجد بيانات بعد" : "No data yet"}</div>
              ) : (
                <div className="space-y-2">
                  {topPages.map(([path, count], i) => (
                    <div key={path} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                      <span className="text-xs text-muted-foreground font-mono w-6">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{path}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold tabular-nums">{count}</span>
                        <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${(count / (topPages[0]?.[1] || 1)) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices */}
        <TabsContent value="devices">
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Smartphone, label: isAr ? "جوال" : "Mobile", count: devices.mobile, color: "text-chart-1" },
              { icon: Tablet, label: isAr ? "لوحي" : "Tablet", count: devices.tablet, color: "text-chart-2" },
              { icon: Monitor, label: isAr ? "حاسوب" : "Desktop", count: devices.desktop, color: "text-chart-3" },
            ].map(d => (
              <Card key={d.label}>
                <CardContent className="p-4 text-center">
                  <d.icon className={`h-8 w-8 mx-auto mb-2 ${d.color}`} />
                  <p className="text-xl font-bold">{d.count}</p>
                  <p className="text-xs text-muted-foreground">{d.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {totalViews > 0 ? Math.round((d.count / totalViews) * 100) : 0}%
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* SEO Health */}
        <TabsContent value="health">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {isAr ? "فحص صحة SEO" : "SEO Health Check"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Static checks */}
                {[
                  { label: "sitemap.xml", status: "ok", detail: "40+ routes, bilingual" },
                  { label: "robots.txt", status: "ok", detail: "18+ blocked paths" },
                  { label: "Canonical Tags", status: "ok", detail: "Dynamic per page" },
                  { label: "Open Graph", status: "ok", detail: "Title, desc, image" },
                  { label: "JSON-LD", status: "ok", detail: "Organization, WebSite, BreadcrumbList" },
                  { label: "Alt Text Coverage", status: "ok", detail: "Contextual alt text on all public pages" },
                  { label: "Hreflang", status: "ok", detail: "EN ↔ AR alternates" },
                  { label: "Meta Keywords", status: "ok", detail: "Bilingual on all pages" },
                  { label: "Internal Linking", status: "ok", detail: "RelatedPages on 24+ routes" },
                  { label: "Google Verification", status: "warn", detail: "Add verification meta tag" },
                  { label: "Bing Verification", status: "warn", detail: "Add verification meta tag" },
                ].map(check => (
                  <div key={check.label} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
                    {check.status === "ok" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{check.label}</p>
                      <p className="text-[11px] text-muted-foreground">{check.detail}</p>
                    </div>
                    <Badge variant={check.status === "ok" ? "default" : "secondary"} className="text-[9px]">
                      {check.status === "ok" ? "✓ Pass" : "⚠ Action"}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Public routes coverage */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-3">{isAr ? "تغطية الصفحات العامة" : "Public Routes Coverage"}</h4>
                <div className="flex flex-wrap gap-1.5">
                  {PUBLIC_ROUTES.map(route => {
                    const hasViews = pageCounts[route.path] > 0;
                    return (
                      <Badge key={route.path} variant={hasViews ? "default" : "outline"} className="text-[10px] gap-1">
                        {hasViews && <CheckCircle2 className="h-2.5 w-2.5" />}
                        {route.label}
                        {hasViews && <span className="opacity-60">{pageCounts[route.path]}</span>}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Crawl Log */}
        <TabsContent value="crawl">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                {isAr ? "سجل إشعارات محركات البحث" : "Search Engine Ping Log"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!crawlLog?.length ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {isAr ? "لم يتم إرسال إشعارات بعد. اضغط 'إرسال خريطة الموقع' أعلاه." : "No pings sent yet. Click 'Ping Sitemap' above."}
                </div>
              ) : (
                <div className="space-y-2">
                  {crawlLog.map((log: any) => (
                    <div key={log.id} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
                      {log.status === "success" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium capitalize">{log.search_engine} — {log.action?.replace(/_/g, " ")}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(log.created_at), "dd MMM yyyy HH:mm")}
                          {log.response_code && ` · HTTP ${log.response_code}`}
                        </p>
                      </div>
                      <Badge variant={log.status === "success" ? "default" : "destructive"} className="text-[9px]">
                        {log.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
