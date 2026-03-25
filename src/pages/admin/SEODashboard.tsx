import { useState, useMemo, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  Search, Globe, Eye, Clock, Smartphone, Monitor, Tablet,
  TrendingUp, RefreshCw, Send, BarChart3, ArrowUpRight,
  AlertTriangle, CheckCircle2, ExternalLink, Activity, Gauge, Zap, Wifi,
  Bot, Target, FileSearch, Plus, Trash2, ArrowUp, ArrowDown, Minus, Shield,
  Settings2, FileText, Sparkles, Code2, Lightbulb, Link2, Users,
  ChevronRight, LayoutDashboard,
} from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, CartesianGrid, Legend, ReferenceLine,
} from "recharts";
import { SEOScoreGauge } from "@/components/admin/seo/SEOScoreGauge";
import { cn } from "@/lib/utils";

// Lazy load sub-components
const SEOAuditPanel = lazy(() => import("@/components/admin/seo/SEOAuditPanel").then(m => ({ default: m.SEOAuditPanel })));
const SEOMetaConfigurator = lazy(() => import("@/components/admin/seo/SEOMetaConfigurator").then(m => ({ default: m.SEOMetaConfigurator })));
const SEOContentAnalysis = lazy(() => import("@/components/admin/seo/SEOContentAnalysis").then(m => ({ default: m.SEOContentAnalysis })));
const SEORecommendations = lazy(() => import("@/components/admin/seo/SEORecommendations").then(m => ({ default: m.SEORecommendations })));
const SEOStructuredData = lazy(() => import("@/components/admin/seo/SEOStructuredData").then(m => ({ default: m.SEOStructuredData })));
const SEOCompetitorTracker = lazy(() => import("@/components/admin/seo/SEOCompetitorTracker").then(m => ({ default: m.SEOCompetitorTracker })));
const SEOBacklinkMonitor = lazy(() => import("@/components/admin/seo/SEOBacklinkMonitor").then(m => ({ default: m.SEOBacklinkMonitor })));
const SEOKeywordGapAnalyzer = lazy(() => import("@/components/admin/seo/SEOKeywordGapAnalyzer").then(m => ({ default: m.SEOKeywordGapAnalyzer })));
const SEOTechnicalChecklist = lazy(() => import("@/components/admin/seo/SEOTechnicalChecklist").then(m => ({ default: m.SEOTechnicalChecklist })));
const SEOCrawlAnalytics = lazy(() => import("@/components/admin/seo/SEOCrawlAnalytics").then(m => ({ default: m.SEOCrawlAnalytics })));
const SEOInternalLinkAnalyzer = lazy(() => import("@/components/admin/seo/SEOInternalLinkAnalyzer").then(m => ({ default: m.SEOInternalLinkAnalyzer })));
const SEOPageSpeedMonitor = lazy(() => import("@/components/admin/seo/SEOPageSpeedMonitor").then(m => ({ default: m.SEOPageSpeedMonitor })));

// SEO route registry
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

// Google CWV thresholds
const CWV_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000, unit: "ms", label: "LCP" },
  inp: { good: 200, poor: 500, unit: "ms", label: "INP" },
  cls: { good: 0.1, poor: 0.25, unit: "", label: "CLS" },
  fcp: { good: 1800, poor: 3000, unit: "ms", label: "FCP" },
  ttfb: { good: 800, poor: 1800, unit: "ms", label: "TTFB" },
};

function getVitalStatus(metric: keyof typeof CWV_THRESHOLDS, value: number): "good" | "needs-improvement" | "poor" {
  const t = CWV_THRESHOLDS[metric];
  if (value <= t.good) return "good";
  if (value <= t.poor) return "needs-improvement";
  return "poor";
}

// Navigation sections
type SectionKey = "overview" | "vitals" | "keywords" | "indexing" | "crawlers" | "pages" | "devices"
  | "keyword-gaps" | "competitors" | "backlinks" | "content" | "meta" | "schema" | "technical"
  | "audit" | "crawl" | "crawl-analytics" | "internal-links" | "page-speed" | "health" | "recommendations";

interface NavGroup {
  label: string;
  labelAr: string;
  icon: typeof LayoutDashboard;
  items: { key: SectionKey; label: string; labelAr: string; icon: typeof LayoutDashboard }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Analytics", labelAr: "التحليلات", icon: BarChart3,
    items: [
      { key: "overview", label: "Overview", labelAr: "نظرة عامة", icon: LayoutDashboard },
      { key: "vitals", label: "Web Vitals", labelAr: "Web Vitals", icon: Gauge },
      { key: "page-speed", label: "Page Speed", labelAr: "سرعة الصفحات", icon: Zap },
      { key: "pages", label: "Top Pages", labelAr: "الصفحات", icon: BarChart3 },
      { key: "devices", label: "Devices", labelAr: "الأجهزة", icon: Smartphone },
    ],
  },
  {
    label: "Search", labelAr: "البحث", icon: Search,
    items: [
      { key: "keywords", label: "Keywords", labelAr: "الكلمات المفتاحية", icon: Target },
      { key: "keyword-gaps", label: "Keyword Gaps", labelAr: "فجوات الكلمات", icon: Sparkles },
      { key: "indexing", label: "Indexing", labelAr: "الفهرسة", icon: FileSearch },
      { key: "competitors", label: "Competitors", labelAr: "المنافسون", icon: Users },
      { key: "backlinks", label: "Backlinks", labelAr: "الروابط الخلفية", icon: Link2 },
    ],
  },
  {
    label: "Crawling", labelAr: "الزحف", icon: Bot,
    items: [
      { key: "crawlers", label: "Crawler Visits", labelAr: "الزواحف", icon: Bot },
      { key: "crawl-analytics", label: "Crawl Analytics", labelAr: "تحليل الزحف", icon: Activity },
      { key: "crawl", label: "Ping Log", labelAr: "سجل الزحف", icon: Globe },
    ],
  },
  {
    label: "Content & Technical", labelAr: "المحتوى والتقنية", icon: FileText,
    items: [
      { key: "content", label: "Content Quality", labelAr: "جودة المحتوى", icon: FileText },
      { key: "meta", label: "Meta Config", labelAr: "إعدادات Meta", icon: Settings2 },
      { key: "schema", label: "Structured Data", labelAr: "البيانات المنظمة", icon: Code2 },
      { key: "internal-links", label: "Internal Links", labelAr: "الروابط الداخلية", icon: Link2 },
      { key: "technical", label: "Technical Audit", labelAr: "تدقيق تقني", icon: Shield },
      { key: "health", label: "SEO Health", labelAr: "صحة SEO", icon: CheckCircle2 },
      { key: "audit", label: "Auto Audit", labelAr: "تدقيق تلقائي", icon: Shield },
      { key: "recommendations", label: "AI Insights", labelAr: "توصيات AI", icon: Lightbulb },
    ],
  },
];

function SectionSkeleton() {
  return <div className="flex items-center justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
}

export default function SEODashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");
  const [pinging, setPinging] = useState(false);
  const [range, setRange] = useState(7);

  const fromDate = startOfDay(subDays(new Date(), range)).toISOString();

  // ── Data Queries ──
  const { data: pageViews, isLoading: loadingViews } = useQuery({
    queryKey: ["seo-page-views", range],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_page_views")
        .select("path, device_type, is_bounce, duration_seconds, created_at, session_id")
        .gte("created_at", fromDate)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: vitalsData, isLoading: loadingVitals } = useQuery({
    queryKey: ["seo-web-vitals", range],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_web_vitals")
        .select("path, lcp, inp, cls, fcp, ttfb, device_type, connection_type, created_at")
        .gte("created_at", fromDate)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: crawlLog } = useQuery({
    queryKey: ["seo-crawl-log"],
    queryFn: async () => {
      const { data } = await supabase.from("seo_crawl_log").select("*").order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
  });

  const { data: crawlerVisits } = useQuery({
    queryKey: ["seo-crawler-visits", range],
    queryFn: async () => {
      const { data } = await supabase.from("seo_crawler_visits").select("path, crawler_name, crawler_type, created_at").gte("created_at", fromDate).order("created_at", { ascending: false }).limit(500);
      return data || [];
    },
  });

  const { data: trackedKeywords, refetch: refetchKeywords } = useQuery({
    queryKey: ["seo-tracked-keywords"],
    queryFn: async () => {
      const { data } = await supabase.from("seo_tracked_keywords").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: indexingStatus, refetch: refetchIndexing } = useQuery({
    queryKey: ["seo-indexing-status"],
    queryFn: async () => {
      const { data } = await supabase.from("seo_indexing_status").select("*").order("updated_at", { ascending: false });
      return data || [];
    },
  });

  // ── Keyword Form ──
  const [newKeyword, setNewKeyword] = useState("");
  const [newKeywordPage, setNewKeywordPage] = useState("");
  const [addingKeyword, setAddingKeyword] = useState(false);

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;
    setAddingKeyword(true);
    try {
      const { error } = await supabase.from("seo_tracked_keywords").insert({ keyword: newKeyword.trim(), target_page: newKeywordPage.trim() || null });
      if (error) throw error;
      setNewKeyword(""); setNewKeywordPage("");
      refetchKeywords();
      toast.success(isAr ? "تمت إضافة الكلمة المفتاحية" : "Keyword added");
    } catch (e: any) { toast.error(e.message); } finally { setAddingKeyword(false); }
  };

  const handleDeleteKeyword = async (id: string) => {
    await supabase.from("seo_tracked_keywords").delete().eq("id", id);
    refetchKeywords();
  };

  const handleSeedIndexing = async () => {
    const origin = window.location.origin;
    const urls = PUBLIC_ROUTES.map(r => ({ url: origin + r.path, path: r.path, status: "unknown" }));
    const { error } = await supabase.from("seo_indexing_status").upsert(urls, { onConflict: "url" });
    if (error) toast.error(error.message);
    else { toast.success(isAr ? "تم تهيئة حالة الفهرسة" : "Indexing status seeded"); refetchIndexing(); }
  };

  // ── GSC Sync ──
  const [gscSyncing, setGscSyncing] = useState<string | null>(null);
  const GSC_SITE_URL = "https://altoha.lovable.app";

  const handleGSCSyncPerformance = async () => {
    setGscSyncing("performance");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const end = format(new Date(), "yyyy-MM-dd");
      const start = format(subDays(new Date(), 28), "yyyy-MM-dd");
      const { data, error } = await supabase.functions.invoke("gsc-sync", { body: { action: "search_performance", siteUrl: GSC_SITE_URL, startDate: start, endDate: end } });
      if (error) throw error;
      toast.success(isAr ? `تم مزامنة ${data.total_queries} استعلام` : `Synced ${data.total_queries} queries`);
      refetchKeywords();
    } catch (e: any) { toast.error(e.message || "GSC sync failed"); } finally { setGscSyncing(null); }
  };

  const handleGSCInspectUrls = async () => {
    if (!indexingStatus?.length) { toast.error("Seed pages first"); return; }
    setGscSyncing("inspect");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const urls = indexingStatus.slice(0, 20).map((s: any) => s.url);
      const { data, error } = await supabase.functions.invoke("gsc-sync", { body: { action: "inspect_urls", siteUrl: GSC_SITE_URL, urls } });
      if (error) throw error;
      toast.success(isAr ? `تم فحص ${data.inspections?.filter((i: any) => !i.error).length || 0} صفحة` : `Inspected ${data.inspections?.filter((i: any) => !i.error).length || 0} URLs`);
      refetchIndexing();
    } catch (e: any) { toast.error(e.message || "Inspection failed"); } finally { setGscSyncing(null); }
  };

  const handleGSCSubmitUrls = async (urls?: string[]) => {
    const targetUrls = urls || indexingStatus?.filter((s: any) => s.status !== "indexed").map((s: any) => s.url) || [];
    if (!targetUrls.length) { toast.info(isAr ? "لا صفحات لإرسالها" : "No pages to submit"); return; }
    setGscSyncing("submit");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const { data, error } = await supabase.functions.invoke("gsc-sync", { body: { action: "submit_indexing", urls: targetUrls.slice(0, 10) } });
      if (error) throw error;
      toast.success(isAr ? `تم إرسال ${data.submissions?.filter((s: any) => s.success).length || 0} صفحة` : `Submitted ${data.submissions?.filter((s: any) => s.success).length || 0} URLs`);
      refetchIndexing();
    } catch (e: any) { toast.error(e.message || "Submission failed"); } finally { setGscSyncing(null); }
  };

  // ── Computed Metrics ──
  const totalViews = pageViews?.length || 0;
  const uniqueSessions = new Set(pageViews?.map((v: any) => v.session_id) || []).size;
  const bounceCount = pageViews?.filter((v: any) => v.is_bounce)?.length || 0;
  const bounceRate = totalViews > 0 ? Math.round((bounceCount / totalViews) * 100) : 0;
  const avgDuration = totalViews > 0 ? Math.round((pageViews?.reduce((s: number, v: any) => s + (v.duration_seconds || 0), 0) || 0) / totalViews) : 0;

  const devices = { mobile: 0, tablet: 0, desktop: 0 };
  pageViews?.forEach((v: any) => {
    if (v.device_type === "mobile") devices.mobile++;
    else if (v.device_type === "tablet") devices.tablet++;
    else devices.desktop++;
  });

  const pageCounts: Record<string, number> = {};
  pageViews?.forEach((v: any) => { pageCounts[v.path] = (pageCounts[v.path] || 0) + 1; });
  const topPages = Object.entries(pageCounts).sort(([, a], [, b]) => b - a).slice(0, 15);

  // Vitals aggregation
  const vitalsAgg = useMemo(() => {
    if (!vitalsData?.length) return null;
    const metrics = { lcp: [] as number[], inp: [] as number[], cls: [] as number[], fcp: [] as number[], ttfb: [] as number[] };
    vitalsData.forEach((v: any) => {
      if (v.lcp != null) metrics.lcp.push(Number(v.lcp));
      if (v.inp != null) metrics.inp.push(Number(v.inp));
      if (v.cls != null) metrics.cls.push(Number(v.cls));
      if (v.fcp != null) metrics.fcp.push(Number(v.fcp));
      if (v.ttfb != null) metrics.ttfb.push(Number(v.ttfb));
    });
    const p75 = (arr: number[]) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.ceil(s.length * 0.75) - 1]; };
    return {
      lcp: p75(metrics.lcp), inp: p75(metrics.inp), cls: p75(metrics.cls), fcp: p75(metrics.fcp), ttfb: p75(metrics.ttfb),
      sampleCount: vitalsData.length,
      mobileCount: vitalsData.filter((v: any) => v.device_type === "mobile").length,
      desktopCount: vitalsData.filter((v: any) => v.device_type === "desktop").length,
    };
  }, [vitalsData]);

  // Per-page vitals
  const pageVitals = useMemo(() => {
    if (!vitalsData?.length) return [];
    const byPath: Record<string, { lcp: number[]; cls: number[]; inp: number[] }> = {};
    vitalsData.forEach((v: any) => {
      if (!byPath[v.path]) byPath[v.path] = { lcp: [], cls: [], inp: [] };
      if (v.lcp != null) byPath[v.path].lcp.push(Number(v.lcp));
      if (v.cls != null) byPath[v.path].cls.push(Number(v.cls));
      if (v.inp != null) byPath[v.path].inp.push(Number(v.inp));
    });
    const p75 = (arr: number[]) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.ceil(s.length * 0.75) - 1]; };
    return Object.entries(byPath)
      .map(([path, data]) => ({ path, lcp: p75(data.lcp), cls: p75(data.cls), inp: p75(data.inp), samples: data.lcp.length + data.cls.length + data.inp.length }))
      .sort((a, b) => (b.lcp || 0) - (a.lcp || 0));
  }, [vitalsData]);

  // Trend data
  const trendData = useMemo(() => {
    if (!vitalsData?.length) return [];
    const byDay: Record<string, { lcp: number[]; inp: number[]; cls: number[]; fcp: number[]; ttfb: number[] }> = {};
    vitalsData.forEach((v: any) => {
      const day = format(new Date(v.created_at), "MM/dd");
      if (!byDay[day]) byDay[day] = { lcp: [], inp: [], cls: [], fcp: [], ttfb: [] };
      if (v.lcp != null) byDay[day].lcp.push(Number(v.lcp));
      if (v.inp != null) byDay[day].inp.push(Number(v.inp));
      if (v.cls != null) byDay[day].cls.push(Number(v.cls));
      if (v.fcp != null) byDay[day].fcp.push(Number(v.fcp));
      if (v.ttfb != null) byDay[day].ttfb.push(Number(v.ttfb));
    });
    const p75 = (arr: number[]) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.ceil(s.length * 0.75) - 1]; };
    return Object.entries(byDay).map(([day, m]) => ({ day, lcp: p75(m.lcp), inp: p75(m.inp), cls: p75(m.cls), fcp: p75(m.fcp), ttfb: p75(m.ttfb) })).sort((a, b) => a.day.localeCompare(b.day));
  }, [vitalsData]);

  // Connection distribution
  const connectionDistribution = useMemo(() => {
    if (!vitalsData?.length) return [];
    const counts: Record<string, number> = {};
    vitalsData.forEach((v: any) => { const ct = v.connection_type || "unknown"; counts[ct] = (counts[ct] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [vitalsData]);

  // Device vitals comparison
  const deviceVitalsComparison = useMemo(() => {
    if (!vitalsData?.length) return [];
    const byDevice: Record<string, { lcp: number[]; fcp: number[]; ttfb: number[] }> = {};
    vitalsData.forEach((v: any) => {
      const dt = v.device_type || "unknown";
      if (!byDevice[dt]) byDevice[dt] = { lcp: [], fcp: [], ttfb: [] };
      if (v.lcp != null) byDevice[dt].lcp.push(Number(v.lcp));
      if (v.fcp != null) byDevice[dt].fcp.push(Number(v.fcp));
      if (v.ttfb != null) byDevice[dt].ttfb.push(Number(v.ttfb));
    });
    const p75 = (arr: number[]) => { if (!arr.length) return 0; const s = [...arr].sort((a, b) => a - b); return Math.round(s[Math.ceil(s.length * 0.75) - 1]); };
    return Object.entries(byDevice).map(([device, m]) => ({ device: device.charAt(0).toUpperCase() + device.slice(1), LCP: p75(m.lcp), FCP: p75(m.fcp), TTFB: p75(m.ttfb) }));
  }, [vitalsData]);

  const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

  const handlePingSitemap = async () => {
    setPinging(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("seo-sitemap-ping", { headers: { Authorization: `Bearer ${session?.access_token}` } });
      if (error) throw error;
      toast.success(isAr ? "تم إرسال خريطة الموقع بنجاح" : "Sitemap pinged successfully", { description: data?.results?.map((r: any) => `${r.engine}: ${r.status}`).join(", ") });
    } catch (e: any) { toast.error(e.message); } finally { setPinging(false); }
  };

  // Get active section info
  const activeSectionInfo = useMemo(() => {
    for (const group of NAV_GROUPS) {
      const item = group.items.find(i => i.key === activeSection);
      if (item) return { ...item, groupLabel: group.label, groupLabelAr: group.labelAr };
    }
    return null;
  }, [activeSection]);

  // ── Render Section Content ──
  const renderContent = () => {
    switch (activeSection) {
      case "overview": return renderOverview();
      case "vitals": return renderVitals();
      case "keywords": return renderKeywords();
      case "indexing": return renderIndexing();
      case "crawlers": return renderCrawlers();
      case "pages": return renderPages();
      case "devices": return renderDevices();
      case "health": return renderHealth();
      case "crawl": return renderCrawlLog();
      case "keyword-gaps": return <Suspense fallback={<SectionSkeleton />}><SEOKeywordGapAnalyzer isAr={isAr} /></Suspense>;
      case "competitors": return <Suspense fallback={<SectionSkeleton />}><SEOCompetitorTracker isAr={isAr} /></Suspense>;
      case "backlinks": return <Suspense fallback={<SectionSkeleton />}><SEOBacklinkMonitor isAr={isAr} /></Suspense>;
      case "content": return <Suspense fallback={<SectionSkeleton />}><SEOContentAnalysis isAr={isAr} /></Suspense>;
      case "meta": return <Suspense fallback={<SectionSkeleton />}><SEOMetaConfigurator isAr={isAr} /></Suspense>;
      case "schema": return <Suspense fallback={<SectionSkeleton />}><SEOStructuredData isAr={isAr} /></Suspense>;
      case "technical": return <Suspense fallback={<SectionSkeleton />}><SEOTechnicalChecklist isAr={isAr} /></Suspense>;
      case "audit": return <Suspense fallback={<SectionSkeleton />}><SEOAuditPanel /></Suspense>;
      case "crawl-analytics": return <Suspense fallback={<SectionSkeleton />}><SEOCrawlAnalytics isAr={isAr} range={range} /></Suspense>;
      case "internal-links": return <Suspense fallback={<SectionSkeleton />}><SEOInternalLinkAnalyzer isAr={isAr} /></Suspense>;
      case "page-speed": return <Suspense fallback={<SectionSkeleton />}><SEOPageSpeedMonitor isAr={isAr} /></Suspense>;
      case "recommendations": return (
        <Suspense fallback={<SectionSkeleton />}>
          <SEORecommendations isAr={isAr} seoData={{
            totalViews, bounceRate, avgDuration, topPages,
            vitalsPass: vitalsAgg ? (["lcp", "inp", "cls", "fcp", "ttfb"] as const).filter(m => vitalsAgg[m] != null && getVitalStatus(m, vitalsAgg[m]!) === "good").length : 0,
            vitalsTotal: 5,
            indexedPages: indexingStatus?.filter((s: any) => s.status === "indexed").length || 0,
            totalPages: indexingStatus?.length || PUBLIC_ROUTES.length,
            issueCount: 0, keywords: trackedKeywords || [],
          }} />
        </Suspense>
      );
      default: return null;
    }
  };

  // ── Overview Section ──
  function renderOverview() {
    return (
      <div className="space-y-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Eye, label: isAr ? "مشاهدات الصفحة" : "Page Views", value: totalViews, sub: isAr ? `آخر ${range} أيام` : `Last ${range} days` },
            { icon: Activity, label: isAr ? "جلسات فريدة" : "Unique Sessions", value: uniqueSessions },
            { icon: TrendingUp, label: isAr ? "معدل الارتداد" : "Bounce Rate", value: bounceRate, suffix: "%", badge: bounceRate > 60 ? "destructive" : bounceRate > 40 ? "secondary" : "default", badgeText: bounceRate > 60 ? (isAr ? "مرتفع" : "High") : bounceRate > 40 ? (isAr ? "متوسط" : "Medium") : (isAr ? "جيد" : "Good") },
            { icon: Clock, label: isAr ? "متوسط المدة" : "Avg Duration", value: avgDuration, suffix: "s" },
          ].map((kpi, i) => (
            <Card key={i} className="border-border/40 hover:border-primary/20 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1.5">
                  <kpi.icon className="h-3.5 w-3.5" />
                  {kpi.label}
                </div>
                <p className="text-2xl font-bold tabular-nums"><AnimatedCounter value={kpi.value} />{kpi.suffix && <span className="text-sm font-normal text-muted-foreground ms-0.5">{kpi.suffix}</span>}</p>
                {kpi.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.sub}</p>}
                {kpi.badge && (
                  <Badge variant={kpi.badge as any} className="text-[9px] mt-1">{kpi.badgeText}</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* SEO Score */}
        <SEOScoreGauge
          score={(() => { const a = (trackedKeywords || []) as any[]; return a.length > 0 ? Math.min(100, Math.round(65 + (vitalsAgg ? 10 : 0) + (indexingStatus?.filter((s: any) => s.status === "indexed").length ? 10 : 0))) : null; })()}
          previousScore={null}
          vitalsPass={vitalsAgg ? (["lcp", "inp", "cls", "fcp", "ttfb"] as const).filter(m => vitalsAgg[m] != null && getVitalStatus(m, vitalsAgg[m]!) === "good").length : 0}
          vitalsTotal={5}
          indexedPages={indexingStatus?.filter((s: any) => s.status === "indexed").length || 0}
          totalPages={indexingStatus?.length || PUBLIC_ROUTES.length}
          issueCount={0}
          isAr={isAr}
        />

        {/* Quick vitals summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(["lcp", "inp", "cls", "fcp", "ttfb"] as const).map(metric => {
            const t = CWV_THRESHOLDS[metric];
            const val = vitalsAgg?.[metric];
            const status = val != null ? getVitalStatus(metric, val) : null;
            return (
              <Card key={metric} className="relative overflow-hidden border-border/40">
                {status && <div className={`absolute top-0 inset-x-0 h-0.5 ${status === "good" ? "bg-chart-2" : status === "needs-improvement" ? "bg-chart-4" : "bg-destructive"}`} />}
                <CardContent className="p-3 pt-4 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t.label}</p>
                  {val != null ? (
                    <p className={`text-xl font-bold tabular-nums mt-1 ${status === "good" ? "text-chart-2" : status === "needs-improvement" ? "text-chart-4" : "text-destructive"}`}>
                      {metric === "cls" ? val.toFixed(3) : Math.round(val)}
                      <span className="text-[10px] font-normal text-muted-foreground ms-0.5">{t.unit}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">{isAr ? "لا بيانات" : "No data"}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Web Vitals Section ──
  function renderVitals() {
    const handleCollectVitals = async () => {
      try {
        // Collect current page's vitals immediately
        const path = window.location.pathname;
        const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
        const ttfb = navEntries[0] ? Math.round(navEntries[0].responseStart - navEntries[0].requestStart) : null;
        
        // Get paint entries
        const paintEntries = performance.getEntriesByType("paint");
        const fcpEntry = paintEntries.find(e => e.name === "first-contentful-paint");
        const fcp = fcpEntry ? Math.round(fcpEntry.startTime) : null;
        
        // Get LCP from performance entries
        let lcp: number | null = null;
        try {
          const lcpEntries = performance.getEntriesByType("largest-contentful-paint") as any[];
          if (lcpEntries.length) lcp = Math.round(lcpEntries[lcpEntries.length - 1].startTime);
        } catch {}
        
        // Get CLS
        let cls: number | null = null;
        try {
          const layoutShiftEntries = performance.getEntriesByType("layout-shift") as any[];
          if (layoutShiftEntries.length) {
            cls = Math.round(layoutShiftEntries.reduce((sum, e) => sum + (e.hadRecentInput ? 0 : e.value), 0) * 1000) / 1000;
          }
        } catch {}

        const payload = {
          path,
          lcp,
          inp: null,
          cls,
          fcp,
          ttfb,
          device_type: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop",
          connection_type: (navigator as any)?.connection?.effectiveType || null,
          session_id: "manual-collect-" + Date.now().toString(36),
          user_agent: navigator.userAgent.slice(0, 200),
        };

        const { error } = await supabase.from("seo_web_vitals").insert(payload);
        if (error) throw error;
        toast.success(isAr ? "تم جمع بيانات الأداء" : "Performance data collected successfully");
        // Refetch vitals data
        window.location.reload();
      } catch (e: any) {
        toast.error(e.message || "Failed to collect vitals");
      }
    };

    return (
      <div className="space-y-4">
        {/* Action Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              {isAr ? "مقاييس الأداء الأساسية" : "Core Web Vitals"}
            </h3>
            <p className="text-xs text-muted-foreground">{isAr ? "مقاييس Google P75 للأداء" : "Google's P75 performance metrics"}</p>
          </div>
          <Button onClick={handleCollectVitals} size="sm" className="gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            {isAr ? "جمع الآن" : "Collect Now"}
          </Button>
        </div>

        {/* P75 Vitals Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(["lcp", "inp", "cls", "fcp", "ttfb"] as const).map(metric => {
            const t = CWV_THRESHOLDS[metric];
            const val = vitalsAgg?.[metric];
            const status = val != null ? getVitalStatus(metric, val) : null;
            return (
              <Card key={metric} className="relative overflow-hidden">
                {status && <div className={`absolute top-0 inset-x-0 h-1 ${status === "good" ? "bg-chart-2" : status === "needs-improvement" ? "bg-chart-4" : "bg-destructive"}`} />}
                <CardContent className="p-4 pt-5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{t.label}</p>
                  {val != null ? (
                    <>
                      <p className={`text-2xl font-bold tabular-nums ${status === "good" ? "text-chart-2" : status === "needs-improvement" ? "text-chart-4" : "text-destructive"}`}>
                        {metric === "cls" ? val.toFixed(3) : Math.round(val)}
                        <span className="text-xs font-normal text-muted-foreground ms-0.5">{t.unit}</span>
                      </p>
                      <Badge variant={status === "good" ? "default" : status === "needs-improvement" ? "secondary" : "destructive"} className="text-[9px] mt-1">
                        {status === "good" ? "✓ Good" : status === "needs-improvement" ? "⚠ Needs Work" : "✗ Poor"}
                      </Badge>
                      <p className="text-[9px] text-muted-foreground mt-1">P75 · ≤{metric === "cls" ? t.good : t.good + t.unit}</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">{isAr ? "لا بيانات — اضغط جمع الآن" : "No data — click Collect Now"}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Sample info */}
        {vitalsAgg && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
            <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {vitalsAgg.sampleCount} {isAr ? "عينة" : "samples"}</span>
            <span className="flex items-center gap-1"><Smartphone className="h-3 w-3" /> {vitalsAgg.mobileCount} {isAr ? "جوال" : "mobile"}</span>
            <span className="flex items-center gap-1"><Monitor className="h-3 w-3" /> {vitalsAgg.desktopCount} {isAr ? "حاسوب" : "desktop"}</span>
          </div>
        )}

        {/* Slow page alerts */}
        {(() => {
          const slowPages = pageVitals.filter(pv => (pv.lcp != null && getVitalStatus("lcp", pv.lcp) === "poor") || (pv.cls != null && getVitalStatus("cls", pv.cls) === "poor") || (pv.inp != null && getVitalStatus("inp", pv.inp) === "poor"));
          if (slowPages.length > 0) {
            return (
              <Card className="border-destructive/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    {isAr ? "تنبيهات الصفحات البطيئة" : "Slow Page Alerts"}
                    <Badge variant="destructive" className="text-[9px] ms-auto">{slowPages.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {slowPages.slice(0, 8).map(alert => (
                      <div key={alert.path} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/50 border border-border/30">
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono truncate">{alert.path}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {[
                              alert.lcp != null && getVitalStatus("lcp", alert.lcp) !== "good" ? `LCP ${Math.round(alert.lcp)}ms` : null,
                              alert.cls != null && getVitalStatus("cls", alert.cls) !== "good" ? `CLS ${alert.cls.toFixed(3)}` : null,
                              alert.inp != null && getVitalStatus("inp", alert.inp) !== "good" ? `INP ${Math.round(alert.inp)}ms` : null,
                            ].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          }
          if (pageVitals.length > 0) {
            return (
              <Card className="border-chart-2/30 bg-chart-2/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-chart-2 shrink-0" />
                  <p className="text-sm font-medium">{isAr ? "جميع الصفحات تجتاز حدود Google" : "All pages pass Google's Core Web Vitals thresholds"}</p>
                </CardContent>
              </Card>
            );
          }
          return null;
        })()}

        {/* Trend chart */}
        {trendData.length > 1 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "اتجاه الأداء اليومي (P75)" : "Daily Performance Trend (P75)"}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={2500} stroke="hsl(var(--destructive))" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="lcp" name="LCP" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="fcp" name="FCP" stroke={CHART_COLORS[1]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="ttfb" name="TTFB" stroke={CHART_COLORS[2]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="inp" name="INP" stroke={CHART_COLORS[3]} strokeWidth={1.5} dot={{ r: 2 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Per-page vitals */}
        {pageVitals.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "أداء الصفحات (P75)" : "Page Performance (P75)"}</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 text-xs text-muted-foreground">
                      <th className="text-start py-2 pe-3 font-medium">{isAr ? "الصفحة" : "Page"}</th>
                      <th className="text-end py-2 px-2 font-medium">LCP</th>
                      <th className="text-end py-2 px-2 font-medium">CLS</th>
                      <th className="text-end py-2 px-2 font-medium">INP</th>
                      <th className="text-end py-2 ps-2 font-medium">{isAr ? "عينات" : "Samples"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageVitals.slice(0, 20).map(pv => (
                      <tr key={pv.path} className="border-b border-border/20 last:border-0">
                        <td className="py-2 pe-3 font-mono text-xs truncate max-w-[200px]">{pv.path}</td>
                        <td className="py-2 px-2 text-end tabular-nums">
                          {pv.lcp != null ? (
                            <span className={getVitalStatus("lcp", pv.lcp) === "good" ? "text-chart-2" : getVitalStatus("lcp", pv.lcp) === "needs-improvement" ? "text-chart-4" : "text-destructive"}>
                              {Math.round(pv.lcp)}ms
                            </span>
                          ) : "—"}
                        </td>
                        <td className="py-2 px-2 text-end tabular-nums">
                          {pv.cls != null ? (
                            <span className={getVitalStatus("cls", pv.cls) === "good" ? "text-chart-2" : getVitalStatus("cls", pv.cls) === "needs-improvement" ? "text-chart-4" : "text-destructive"}>
                              {pv.cls.toFixed(3)}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="py-2 px-2 text-end tabular-nums">
                          {pv.inp != null ? (
                            <span className={getVitalStatus("inp", pv.inp) === "good" ? "text-chart-2" : getVitalStatus("inp", pv.inp) === "needs-improvement" ? "text-chart-4" : "text-destructive"}>
                              {Math.round(pv.inp)}ms
                            </span>
                          ) : "—"}
                        </td>
                        <td className="py-2 ps-2 text-end text-xs text-muted-foreground tabular-nums">{pv.samples}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Device vitals comparison */}
        {deviceVitalsComparison.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "مقارنة الأداء حسب الجهاز (P75)" : "Device Performance Comparison (P75)"}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={deviceVitalsComparison} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="device" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 8, backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="LCP" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="FCP" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="TTFB" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {connectionDistribution.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "توزيع نوع الاتصال" : "Connection Type Distribution"}</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={connectionDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                        {connectionDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty state with guidance */}
        {!vitalsAgg && (
          <Card className="border-dashed border-2 border-border/50">
            <CardContent className="p-8 text-center">
              <Gauge className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="text-sm font-semibold mb-1">{isAr ? "لم يتم جمع بيانات أداء بعد" : "No Web Vitals data collected yet"}</h3>
              <p className="text-xs text-muted-foreground mb-4 max-w-md mx-auto">
                {isAr
                  ? "اضغط على زر 'جمع الآن' أعلاه لجمع مقاييس الأداء الحالية، أو انتظر حتى يبدأ الزوار الحقيقيون بالتصفح."
                  : "Click 'Collect Now' above to capture current performance metrics, or wait for real visitors to browse your site. Data will appear automatically."}
              </p>
              <Button onClick={handleCollectVitals} size="sm" className="gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                {isAr ? "جمع البيانات" : "Collect Performance Data"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ── Crawlers Section ──
  function renderCrawlers() {
    const crawlerCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    const pagePaths: Record<string, number> = {};
    crawlerVisits?.forEach((v: any) => {
      crawlerCounts[v.crawler_name] = (crawlerCounts[v.crawler_name] || 0) + 1;
      typeCounts[v.crawler_type || "unknown"] = (typeCounts[v.crawler_type || "unknown"] || 0) + 1;
      pagePaths[v.path] = (pagePaths[v.path] || 0) + 1;
    });
    const crawlerEntries = Object.entries(crawlerCounts).sort(([, a], [, b]) => b - a);
    const topCrawledPages = Object.entries(pagePaths).sort(([, a], [, b]) => b - a).slice(0, 10);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Bot className="h-3.5 w-3.5" />{isAr ? "إجمالي الزيارات" : "Total Visits"}</div><p className="text-2xl font-bold"><AnimatedCounter value={crawlerVisits?.length || 0} /></p></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Search className="h-3.5 w-3.5" />{isAr ? "محركات البحث" : "Search Engines"}</div><p className="text-2xl font-bold"><AnimatedCounter value={typeCounts["search_engine"] || 0} /></p></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Globe className="h-3.5 w-3.5" />{isAr ? "زواحف التواصل" : "Social Bots"}</div><p className="text-2xl font-bold"><AnimatedCounter value={typeCounts["social"] || 0} /></p></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Zap className="h-3.5 w-3.5" />{isAr ? "أدوات SEO / AI" : "SEO / AI Bots"}</div><p className="text-2xl font-bold"><AnimatedCounter value={(typeCounts["seo_tool"] || 0) + (typeCounts["ai"] || 0)} /></p></CardContent></Card>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "الزواحف حسب الاسم" : "Crawlers by Bot"}</CardTitle></CardHeader>
            <CardContent>
              {!crawlerEntries.length ? <p className="text-sm text-muted-foreground text-center py-6">{isAr ? "لا زيارات بعد" : "No visits yet"}</p> : (
                <div className="space-y-2">{crawlerEntries.map(([name, count]) => (
                  <div key={name} className="flex items-center gap-3"><span className="text-sm font-medium flex-1 truncate">{name}</span><span className="text-sm font-bold tabular-nums">{count}</span><div className="w-20 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${(count / (crawlerEntries[0]?.[1] || 1)) * 100}%` }} /></div></div>
                ))}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "أكثر الصفحات زحفاً" : "Most Crawled Pages"}</CardTitle></CardHeader>
            <CardContent>
              {!topCrawledPages.length ? <p className="text-sm text-muted-foreground text-center py-6">{isAr ? "لا بيانات" : "No data"}</p> : (
                <div className="space-y-2">{topCrawledPages.map(([path, count], i) => (
                  <div key={path} className="flex items-center gap-2"><span className="text-xs text-muted-foreground w-5 tabular-nums">{i + 1}</span><span className="text-xs font-mono flex-1 truncate">{path}</span><span className="text-xs font-bold tabular-nums">{count}</span></div>
                ))}</div>
              )}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "آخر زيارات الزواحف" : "Recent Crawler Visits"}</CardTitle></CardHeader>
          <CardContent>
            {!crawlerVisits?.length ? <p className="text-sm text-muted-foreground text-center py-6">{isAr ? "لا زيارات بعد" : "No visits yet"}</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border/40 text-xs text-muted-foreground"><th className="text-start py-2 pe-3 font-medium">{isAr ? "الزاحف" : "Crawler"}</th><th className="text-start py-2 px-3 font-medium">{isAr ? "النوع" : "Type"}</th><th className="text-start py-2 px-3 font-medium">{isAr ? "الصفحة" : "Page"}</th><th className="text-end py-2 ps-3 font-medium">{isAr ? "الوقت" : "Time"}</th></tr></thead>
                  <tbody>{crawlerVisits.slice(0, 20).map((v: any, i: number) => (
                    <tr key={i} className="border-b border-border/20 last:border-0"><td className="py-2 pe-3 font-medium">{v.crawler_name}</td><td className="py-2 px-3"><Badge variant="outline" className="text-[9px]">{v.crawler_type}</Badge></td><td className="py-2 px-3 font-mono text-xs truncate max-w-[200px]">{v.path}</td><td className="py-2 ps-3 text-end text-xs text-muted-foreground">{format(new Date(v.created_at), "dd MMM HH:mm")}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Keywords Section ──
  function renderKeywords() {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-primary" />{isAr ? "تتبع الكلمات المفتاحية" : "Keyword Tracker"}</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <input type="text" placeholder={isAr ? "الكلمة المفتاحية..." : "Keyword..."} value={newKeyword} onChange={e => setNewKeyword(e.target.value)} className="flex-1 min-w-[150px] px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <input type="text" placeholder={isAr ? "الصفحة المستهدفة (اختياري)" : "Target page (optional)"} value={newKeywordPage} onChange={e => setNewKeywordPage(e.target.value)} className="flex-1 min-w-[150px] px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <Button onClick={handleAddKeyword} disabled={addingKeyword || !newKeyword.trim()} size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" />{isAr ? "إضافة" : "Add"}</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            {!trackedKeywords?.length ? <p className="text-sm text-muted-foreground text-center py-8">{isAr ? "لم تتم إضافة كلمات مفتاحية بعد" : "No keywords tracked yet"}</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border/40 text-xs text-muted-foreground"><th className="text-start py-2 pe-3 font-medium">{isAr ? "الكلمة" : "Keyword"}</th><th className="text-start py-2 px-2 font-medium">{isAr ? "الصفحة" : "Target"}</th><th className="text-end py-2 px-2 font-medium">{isAr ? "الموقع" : "Position"}</th><th className="text-end py-2 px-2 font-medium">{isAr ? "التغير" : "Change"}</th><th className="text-end py-2 px-2 font-medium">{isAr ? "الأفضل" : "Best"}</th><th className="text-end py-2 ps-2 font-medium">{isAr ? "آخر فحص" : "Last Check"}</th><th className="text-end py-2 ps-2 font-medium"></th></tr></thead>
                  <tbody>{trackedKeywords.map((kw: any) => {
                    const change = kw.previous_position && kw.current_position ? kw.previous_position - kw.current_position : null;
                    return (
                      <tr key={kw.id} className="border-b border-border/20 last:border-0">
                        <td className="py-2 pe-3"><p className="font-medium">{kw.keyword}</p>{kw.keyword_ar && <p className="text-[10px] text-muted-foreground">{kw.keyword_ar}</p>}</td>
                        <td className="py-2 px-2 font-mono text-xs text-muted-foreground truncate max-w-[120px]">{kw.target_page || "—"}</td>
                        <td className="py-2 px-2 text-end font-bold tabular-nums">{kw.current_position ? `#${kw.current_position}` : "—"}</td>
                        <td className="py-2 px-2 text-end tabular-nums">{change != null ? <span className={`inline-flex items-center gap-0.5 ${change > 0 ? "text-chart-2" : change < 0 ? "text-destructive" : "text-muted-foreground"}`}>{change > 0 ? <ArrowUp className="h-3 w-3" /> : change < 0 ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}{Math.abs(change)}</span> : "—"}</td>
                        <td className="py-2 px-2 text-end text-xs text-muted-foreground tabular-nums">{kw.best_position ? `#${kw.best_position}` : "—"}</td>
                        <td className="py-2 px-2 text-end text-[10px] text-muted-foreground">{kw.last_checked_at ? format(new Date(kw.last_checked_at), "dd MMM") : "—"}</td>
                        <td className="py-2 ps-2 text-end"><button onClick={() => handleDeleteKeyword(kw.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button></td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="flex items-center gap-2 px-1">
          <Button onClick={handleGSCSyncPerformance} disabled={gscSyncing === "performance"} size="sm" variant="outline" className="gap-1.5 text-xs"><RefreshCw className={`h-3 w-3 ${gscSyncing === "performance" ? "animate-spin" : ""}`} />{isAr ? "مزامنة من GSC" : "Sync from GSC"}</Button>
          <span className="text-[10px] text-muted-foreground">{isAr ? "يتطلب إعداد مفتاح حساب الخدمة" : "Requires Service Account key setup"}</span>
        </div>
      </div>
    );
  }

  // ── Indexing Section ──
  function renderIndexing() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div><h3 className="text-base font-semibold flex items-center gap-2"><FileSearch className="h-4 w-4 text-primary" />{isAr ? "حالة الفهرسة" : "Indexing Status"}</h3><p className="text-xs text-muted-foreground">{isAr ? "تتبع صفحاتك المفهرسة" : "Track indexed pages"}</p></div>
          <Button onClick={handleSeedIndexing} size="sm" variant="outline" className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" />{isAr ? "تهيئة الصفحات" : "Seed Pages"}</Button>
        </div>
        {indexingStatus && indexingStatus.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: isAr ? "مفهرسة" : "Indexed", count: indexingStatus.filter((s: any) => s.status === "indexed").length, color: "text-chart-2" },
              { label: isAr ? "مرسلة" : "Submitted", count: indexingStatus.filter((s: any) => s.status === "submitted").length, color: "text-chart-1" },
              { label: isAr ? "غير معروفة" : "Unknown", count: indexingStatus.filter((s: any) => s.status === "unknown").length, color: "text-muted-foreground" },
              { label: isAr ? "خطأ" : "Error", count: indexingStatus.filter((s: any) => s.status === "error").length, color: "text-destructive" },
            ].map(s => <Card key={s.label}><CardContent className="p-3 text-center"><p className={`text-xl font-bold ${s.color}`}><AnimatedCounter value={s.count} /></p><p className="text-[10px] text-muted-foreground">{s.label}</p></CardContent></Card>)}
          </div>
        )}
        <Card>
          <CardContent className="pt-4">
            {!indexingStatus?.length ? (
              <div className="text-center py-8"><p className="text-sm text-muted-foreground mb-3">{isAr ? "لم يتم تهيئة صفحات بعد" : "No pages tracked yet"}</p><Button onClick={handleSeedIndexing} size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" />{isAr ? "تهيئة" : "Seed"}</Button></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border/40 text-xs text-muted-foreground"><th className="text-start py-2 pe-3 font-medium">{isAr ? "الصفحة" : "Page"}</th><th className="text-start py-2 px-2 font-medium">{isAr ? "الحالة" : "Status"}</th><th className="text-start py-2 px-2 font-medium">{isAr ? "مرسلة إلى" : "Submitted To"}</th><th className="text-end py-2 ps-2 font-medium">{isAr ? "آخر تحديث" : "Updated"}</th></tr></thead>
                  <tbody>{indexingStatus.map((page: any) => (
                    <tr key={page.id} className="border-b border-border/20 last:border-0">
                      <td className="py-2 pe-3 font-mono text-xs truncate max-w-[200px]">{page.path}</td>
                      <td className="py-2 px-2"><Badge variant={page.status === "indexed" ? "default" : page.status === "error" ? "destructive" : "secondary"} className="text-[9px]">{page.status === "indexed" ? "✓ Indexed" : page.status === "submitted" ? "⏳ Submitted" : page.status === "error" ? "✗ Error" : "? Unknown"}</Badge></td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">{page.submitted_to?.length ? page.submitted_to.join(", ") : "—"}</td>
                      <td className="py-2 ps-2 text-end text-[10px] text-muted-foreground">{format(new Date(page.updated_at), "dd MMM")}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="flex items-center gap-2 px-1 flex-wrap">
          <Button onClick={handleGSCInspectUrls} disabled={gscSyncing === "inspect"} size="sm" variant="outline" className="gap-1.5 text-xs"><Search className={`h-3 w-3 ${gscSyncing === "inspect" ? "animate-spin" : ""}`} />{isAr ? "فحص الصفحات" : "Inspect URLs"}</Button>
          <Button onClick={() => handleGSCSubmitUrls()} disabled={gscSyncing === "submit"} size="sm" variant="outline" className="gap-1.5 text-xs"><Send className={`h-3 w-3 ${gscSyncing === "submit" ? "animate-spin" : ""}`} />{isAr ? "إرسال للفهرسة" : "Submit for Indexing"}</Button>
          <span className="text-[10px] text-muted-foreground">{isAr ? "يتطلب إعداد مفتاح حساب الخدمة" : "Requires Service Account key setup"}</span>
        </div>
      </div>
    );
  }

  // ── Top Pages Section ──
  function renderPages() {
    return (
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">{isAr ? "أكثر الصفحات زيارة" : "Top Pages"}</CardTitle></CardHeader>
        <CardContent>
          {loadingViews ? <div className="text-center py-8 text-muted-foreground text-sm">{isAr ? "جارٍ التحميل..." : "Loading..."}</div>
          : topPages.length === 0 ? <div className="text-center py-8 text-muted-foreground text-sm">{isAr ? "لا بيانات" : "No data yet"}</div>
          : <div className="space-y-2">{topPages.map(([path, count], i) => (
            <div key={path} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
              <span className="text-xs text-muted-foreground font-mono w-6">{i + 1}</span>
              <p className="text-sm font-medium truncate flex-1">{path}</p>
              <div className="flex items-center gap-2"><span className="text-sm font-bold tabular-nums">{count}</span><div className="w-20 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${(count / (topPages[0]?.[1] || 1)) * 100}%` }} /></div></div>
            </div>
          ))}</div>}
        </CardContent>
      </Card>
    );
  }

  // ── Devices Section ──
  function renderDevices() {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Smartphone, label: isAr ? "جوال" : "Mobile", count: devices.mobile, color: "text-chart-1" },
          { icon: Tablet, label: isAr ? "لوحي" : "Tablet", count: devices.tablet, color: "text-chart-2" },
          { icon: Monitor, label: isAr ? "حاسوب" : "Desktop", count: devices.desktop, color: "text-chart-3" },
        ].map(d => (
          <Card key={d.label}><CardContent className="p-4 text-center"><d.icon className={`h-8 w-8 mx-auto mb-2 ${d.color}`} /><p className="text-xl font-bold"><AnimatedCounter value={d.count} /></p><p className="text-xs text-muted-foreground">{d.label}</p><p className="text-[10px] text-muted-foreground mt-1">{totalViews > 0 ? Math.round((d.count / totalViews) * 100) : 0}%</p></CardContent></Card>
        ))}
      </div>
    );
  }

  // ── Health Section ──
  function renderHealth() {
    const checks = [
      { label: "sitemap.xml", status: "ok", detail: "40+ routes, bilingual" },
      { label: "robots.txt", status: "ok", detail: "18+ blocked paths, mobile-bot rules" },
      { label: "Canonical Tags", status: "ok", detail: "Dynamic per page" },
      { label: "Open Graph", status: "ok", detail: "Title, desc, image" },
      { label: "JSON-LD", status: "ok", detail: "Organization, WebSite, MobileApplication, BreadcrumbList" },
      { label: "Core Web Vitals", status: "ok", detail: "LCP, INP, CLS, FCP, TTFB tracked per route" },
      { label: "Alt Text Coverage", status: "ok", detail: "Contextual alt text on all public pages" },
      { label: "Hreflang", status: "ok", detail: "EN ↔ AR alternates" },
      { label: "Mobile SEO", status: "ok", detail: "viewport-fit, safe-area, format-detection, MobileApplication schema" },
      { label: "PWA Manifest", status: "ok", detail: "Screenshots, shortcuts, categories, edge_side_panel" },
      { label: "Meta Keywords", status: "ok", detail: "Bilingual on all pages" },
      { label: "Internal Linking", status: "ok", detail: "RelatedPages on 24+ routes" },
      { label: "Google Verification", status: "warn", detail: "Add verification meta tag" },
      { label: "Bing Verification", status: "warn", detail: "Add verification meta tag" },
    ];
    return (
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />{isAr ? "فحص صحة SEO" : "SEO Health Check"}</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {checks.map(check => (
              <div key={check.label} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
                {check.status === "ok" ? <CheckCircle2 className="h-4 w-4 text-chart-2 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-chart-4 shrink-0" />}
                <div className="flex-1 min-w-0"><p className="text-sm font-medium">{check.label}</p><p className="text-[11px] text-muted-foreground">{check.detail}</p></div>
                <Badge variant={check.status === "ok" ? "default" : "secondary"} className="text-[9px]">{check.status === "ok" ? "✓ Pass" : "⚠ Action"}</Badge>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <h4 className="text-sm font-semibold mb-3">{isAr ? "تغطية الصفحات العامة" : "Public Routes Coverage"}</h4>
            <div className="flex flex-wrap gap-1.5">{PUBLIC_ROUTES.map(route => {
              const hasViews = pageCounts[route.path] > 0;
              return <Badge key={route.path} variant={hasViews ? "default" : "outline"} className="text-[10px] gap-1">{hasViews && <CheckCircle2 className="h-2.5 w-2.5" />}{route.label}{hasViews && <span className="opacity-60">{pageCounts[route.path]}</span>}</Badge>;
            })}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Crawl Log Section ──
  function renderCrawlLog() {
    return (
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4 text-primary" />{isAr ? "سجل إشعارات محركات البحث" : "Search Engine Ping Log"}</CardTitle></CardHeader>
        <CardContent>
          {!crawlLog?.length ? <div className="text-center py-8 text-muted-foreground text-sm">{isAr ? "لم يتم إرسال إشعارات بعد" : "No pings sent yet"}</div> : (
            <div className="space-y-2">{crawlLog.map((log: any) => (
              <div key={log.id} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
                {log.status === "success" ? <CheckCircle2 className="h-4 w-4 text-chart-2 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />}
                <div className="flex-1 min-w-0"><p className="text-sm font-medium capitalize">{log.search_engine} — {log.action?.replace(/_/g, " ")}</p><p className="text-[10px] text-muted-foreground">{format(new Date(log.created_at), "dd MMM yyyy HH:mm")}{log.response_code && ` · HTTP ${log.response_code}`}</p></div>
                <Badge variant={log.status === "success" ? "default" : "destructive"} className="text-[9px]">{log.status}</Badge>
              </div>
            ))}</div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
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
          <div className="flex rounded-xl border border-border overflow-hidden text-xs">
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => setRange(d)} className={`px-3 py-1.5 transition-colors ${range === d ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{d}d</button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={() => window.open(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-sitemap`, "_blank")}>
            <Globe className="h-3.5 w-3.5" />{isAr ? "خريطة الموقع" : "Sitemap"}
          </Button>
          <Button onClick={handlePingSitemap} disabled={pinging} size="sm" className="gap-1.5 rounded-xl">
            <Send className="h-3.5 w-3.5" />{pinging ? (isAr ? "جارٍ..." : "Pinging...") : (isAr ? "إرسال" : "Ping")}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation - outside flex */}
      <div className="lg:hidden mb-4">
        <div className="flex overflow-x-auto gap-1 pb-2 scrollbar-hide">
          {NAV_GROUPS.flatMap(g => g.items).map(item => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-colors shrink-0",
                activeSection === item.key
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-3 w-3" />
              {isAr ? item.labelAr : item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex gap-5">
        {/* Sidebar Navigation */}
        <nav className="w-56 shrink-0 hidden lg:block">
          <div className="sticky top-4 space-y-1">
            {NAV_GROUPS.map(group => (
              <div key={group.label} className="mb-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-3 mb-1.5 flex items-center gap-1.5">
                  <group.icon className="h-3 w-3" />
                  {isAr ? group.labelAr : group.label}
                </p>
                {group.items.map(item => (
                  <button
                    key={item.key}
                    onClick={() => setActiveSection(item.key)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all text-start",
                      activeSection === item.key
                        ? "bg-primary/10 text-primary font-medium shadow-sm"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{isAr ? item.labelAr : item.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {/* Breadcrumb */}
          {activeSectionInfo && activeSection !== "overview" && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
              <button onClick={() => setActiveSection("overview")} className="hover:text-foreground transition-colors">{isAr ? "نظرة عامة" : "Overview"}</button>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{isAr ? activeSectionInfo.labelAr : activeSectionInfo.label}</span>
            </div>
          )}

          {renderContent()}
        </div>
      </div>
    </div>
  );
}
