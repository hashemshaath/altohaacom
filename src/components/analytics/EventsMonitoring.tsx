import { memo, useState, useMemo, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { downloadCSV, printableReport } from "@/lib/exportUtils";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend, LineChart, Line, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter,
  ZAxis, ComposedChart, Treemap,
} from "recharts";
import {
  CHART_COLORS, TOOLTIP_STYLE, X_AXIS_PROPS, Y_AXIS_PROPS,
  GRID_PROPS, LEGEND_STYLE, BAR_RADIUS, H_BAR_RADIUS, CHART_HEIGHT, getNoDataText,
} from "@/lib/chartConfig";
import {
  Activity, Eye, MousePointerClick, Globe, Monitor, Smartphone,
  Tablet, Search, Zap, TrendingUp, BarChart3, Users,
  FileText, Layers, Timer, MapPin, Chrome, Clock, ArrowRight,
  Gauge, Crosshair, Fingerprint, Route, AlertTriangle, Flame,
  Target, PieChart as PieChartIcon, Radar as RadarIcon, LayoutGrid,
  Hash, Percent, ArrowUpRight, ArrowDownRight, Minus,
  ShoppingCart, DollarSign, PackageX, CreditCard, Download, Printer,
} from "lucide-react";
import { format, subDays, subHours, parseISO, differenceInMinutes, getHours, getDay } from "date-fns";

const EXTRA_COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--primary))",
  "hsl(var(--accent))", "hsl(var(--destructive))",
];

type TimeRange = "1h" | "24h" | "7d" | "30d" | "90d";

function getTimeFilter(range: TimeRange): string {
  const now = new Date();
  switch (range) {
    case "1h": return subHours(now, 1).toISOString();
    case "24h": return subHours(now, 24).toISOString();
    case "7d": return subDays(now, 7).toISOString();
    case "30d": return subDays(now, 30).toISOString();
    case "90d": return subDays(now, 90).toISOString();
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function getDelta(current: number, previous: number): { value: number; direction: "up" | "down" | "flat" } {
  if (previous === 0) return { value: 0, direction: "flat" };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { value: Math.abs(pct), direction: pct > 0 ? "up" : pct < 0 ? "down" : "flat" };
}

const DeltaBadge = ({ delta }: { delta: ReturnType<typeof getDelta> }) => {
  if (delta.direction === "flat") return <Minus className="h-3 w-3 text-muted-foreground" />;
  const Icon = delta.direction === "up" ? ArrowUpRight : ArrowDownRight;
  const color = delta.direction === "up" ? "text-chart-2" : "text-destructive";
  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-medium ${color}`}>
      <Icon className="h-3 w-3" />{delta.value}%
    </span>
  );
};

export const EventsMonitoring = memo(function EventsMonitoring() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [searchQuery, setSearchQuery] = useState("");
  const [subTab, setSubTab] = useState("overview");

  const since = useMemo(() => getTimeFilter(timeRange), [timeRange]);

  // Previous period for comparison
  const previousSince = useMemo(() => {
    const now = new Date();
    switch (timeRange) {
      case "1h": return subHours(now, 2).toISOString();
      case "24h": return subHours(now, 48).toISOString();
      case "7d": return subDays(now, 14).toISOString();
      case "30d": return subDays(now, 60).toISOString();
      case "90d": return subDays(now, 180).toISOString();
    }
  }, [timeRange]);

  // ── Data Fetches ──
  const { data: pageViews } = useQuery({
    queryKey: ["events-pageviews", timeRange],
    queryFn: async () => {
      const { data } = await supabase
        .from("seo_page_views")
        .select("path, device_type, is_bounce, duration_seconds, created_at, session_id, country, referrer, title")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000);
      return data || [];
    },
    staleTime: 30_000,
  });

  const { data: prevPageViews } = useQuery({
    queryKey: ["events-pageviews-prev", timeRange],
    queryFn: async () => {
      const { data } = await supabase
        .from("seo_page_views")
        .select("path, is_bounce, duration_seconds, session_id")
        .gte("created_at", previousSince)
        .lt("created_at", since)
        .limit(1000);
      return data || [];
    },
    staleTime: 60_000,
  });

  const { data: behaviorEvents } = useQuery({
    queryKey: ["events-behaviors", timeRange],
    queryFn: async () => {
      const { data } = await supabase
        .from("ad_user_behaviors")
        .select("event_type, page_url, page_category, device_type, browser, country, duration_seconds, created_at, session_id, entity_type")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000);
      return data || [];
    },
    staleTime: 30_000,
  });

  const { data: adClicks } = useQuery({
    queryKey: ["events-adclicks", timeRange],
    queryFn: async () => {
      const { data } = await supabase
        .from("ad_clicks")
        .select("id, device_type, browser, country, created_at, page_url")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500);
      return data || [];
    },
    staleTime: 30_000,
  });

  const { data: adImpressions } = useQuery({
    queryKey: ["events-adimpressions", timeRange],
    queryFn: async () => {
      const { data } = await supabase
        .from("ad_impressions")
        .select("id, device_type, browser, country, created_at, page_url")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500);
      return data || [];
    },
    staleTime: 30_000,
  });

  // ── Abandoned Carts ──
  const { data: abandonedCarts } = useQuery({
    queryKey: ["events-abandoned-carts", timeRange],
    queryFn: async () => {
      const { data } = await supabase
        .from("abandoned_carts")
        .select("id, total_amount, currency, recovery_status, items, created_at, updated_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500);
      return data || [];
    },
    staleTime: 30_000,
  });

  // ── Shop Orders ──
  const { data: shopOrders } = useQuery({
    queryKey: ["events-shop-orders", timeRange],
    queryFn: async () => {
      const { data } = await supabase
        .from("shop_orders")
        .select("id, total_amount, currency, payment_status, created_at, order_number")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500);
      return data || [];
    },
    staleTime: 30_000,
  });

  // ── Computed Metrics with Period Comparison ──
  const metrics = useMemo(() => {
    const pv = pageViews || [];
    const ppv = prevPageViews || [];
    const bv = behaviorEvents || [];
    const clicks = adClicks || [];
    const impressions = adImpressions || [];

    const totalPageViews = pv.length;
    const prevTotal = ppv.length;
    const totalEvents = bv.length;
    const totalClicks = clicks.length;
    const totalImpressions = impressions.length;
    const uniqueSessions = new Set([...pv.map(p => p.session_id), ...bv.map(b => b.session_id)].filter(Boolean)).size;
    const prevSessions = new Set(ppv.map(p => p.session_id).filter(Boolean)).size;
    const bounceCount = pv.filter(p => p.is_bounce).length;
    const bounceRate = totalPageViews > 0 ? Math.round((bounceCount / totalPageViews) * 100) : 0;
    const prevBounceRate = prevTotal > 0 ? Math.round((ppv.filter(p => p.is_bounce).length / prevTotal) * 100) : 0;
    const avgDuration = pv.length > 0
      ? Math.round(pv.reduce((s, p) => s + (p.duration_seconds || 0), 0) / pv.length) : 0;
    const prevAvgDuration = ppv.length > 0
      ? Math.round(ppv.reduce((s, p) => s + (p.duration_seconds || 0), 0) / ppv.length) : 0;

    // Pages per session
    const sessionPages: Record<string, number> = {};
    pv.forEach(p => { if (p.session_id) sessionPages[p.session_id] = (sessionPages[p.session_id] || 0) + 1; });
    const pagesPerSession = uniqueSessions > 0 ? +(Object.values(sessionPages).reduce((a, b) => a + b, 0) / uniqueSessions).toFixed(1) : 0;

    // CTR (clicks / impressions)
    const ctr = totalImpressions > 0 ? +((totalClicks / totalImpressions) * 100).toFixed(2) : 0;

    return {
      totalPageViews, totalEvents, totalClicks, totalImpressions, uniqueSessions, bounceRate, avgDuration,
      pagesPerSession, ctr,
      deltas: {
        pageViews: getDelta(totalPageViews, prevTotal),
        sessions: getDelta(uniqueSessions, prevSessions),
        bounceRate: getDelta(bounceRate, prevBounceRate),
        avgDuration: getDelta(avgDuration, prevAvgDuration),
      },
    };
  }, [pageViews, prevPageViews, behaviorEvents, adClicks, adImpressions]);

  // ── E-Commerce Metrics ──
  const ecomMetrics = useMemo(() => {
    const bv = behaviorEvents || [];
    const carts = abandonedCarts || [];
    const orders = shopOrders || [];

    // Funnel events
    const addToCartEvents = bv.filter(e => e.event_type === "add_to_cart").length;
    const beginCheckoutEvents = bv.filter(e => e.event_type === "begin_checkout").length;
    const purchaseEvents = bv.filter(e => e.event_type === "purchase").length;
    const productViews = bv.filter(e => e.event_type === "view_item").length;
    const listViews = bv.filter(e => e.event_type === "view_item_list").length;
    const removeFromCartEvents = bv.filter(e => e.event_type === "remove_from_cart").length;

    // Abandoned carts
    const activeCarts = carts.filter(c => c.recovery_status === "active");
    const recoveredCarts = carts.filter(c => c.recovery_status === "recovered");
    const abandonedValue = activeCarts.reduce((s, c) => s + (c.total_amount || 0), 0);
    const recoveryRate = carts.length > 0 ? Math.round((recoveredCarts.length / carts.length) * 100) : 0;

    // Orders
    const completedOrders = orders.filter(o => o.payment_status === "paid" || o.payment_status === "completed");
    const totalRevenue = completedOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
    const avgOrderValue = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;

    // Conversion rates
    const cartToCheckoutRate = addToCartEvents > 0 ? Math.round((beginCheckoutEvents / addToCartEvents) * 100) : 0;
    const checkoutToPayRate = beginCheckoutEvents > 0 ? Math.round((purchaseEvents / beginCheckoutEvents) * 100) : 0;
    const overallConversion = productViews > 0 ? +((purchaseEvents / productViews) * 100).toFixed(2) : 0;

    // Funnel data for chart
    const funnel = [
      { stage: "Product Views", stageAr: "مشاهدة المنتج", value: productViews },
      { stage: "Add to Cart", stageAr: "إضافة للسلة", value: addToCartEvents },
      { stage: "Begin Checkout", stageAr: "بدء الدفع", value: beginCheckoutEvents },
      { stage: "Purchase", stageAr: "شراء", value: purchaseEvents },
    ];

    // Cart status breakdown
    const cartStatus = [
      { name: "Active", nameAr: "نشطة", value: activeCarts.length },
      { name: "Recovered", nameAr: "مستردة", value: recoveredCarts.length },
    ].filter(c => c.value > 0);

    // Revenue over time
    const revenueTimeline: Record<string, number> = {};
    orders.forEach(o => {
      const key = format(parseISO(o.created_at), "MM/dd");
      revenueTimeline[key] = (revenueTimeline[key] || 0) + (o.total_amount || 0);
    });
    const revenueData = Object.entries(revenueTimeline).map(([date, revenue]) => ({ date, revenue: Math.round(revenue) })).sort((a, b) => a.date.localeCompare(b.date));

    // Membership events
    const membershipEvents = bv.filter(e => e.event_type.startsWith("membership_"));
    const competitionRegs = bv.filter(e => e.event_type === "competition_registration").length;
    const bookingEvents = bv.filter(e => e.event_type === "booking_created").length;

    return {
      addToCartEvents, beginCheckoutEvents, purchaseEvents, productViews, listViews, removeFromCartEvents,
      activeCarts: activeCarts.length, recoveredCarts: recoveredCarts.length, abandonedValue, recoveryRate,
      totalRevenue, avgOrderValue, completedOrders: completedOrders.length, totalOrders: orders.length,
      cartToCheckoutRate, checkoutToPayRate, overallConversion,
      funnel, cartStatus, revenueData, membershipEvents: membershipEvents.length, competitionRegs, bookingEvents,
    };
  }, [behaviorEvents, abandonedCarts, shopOrders]);

  // ── Timeline ──
  const timelineData = useMemo(() => {
    const pv = pageViews || [];
    const bv = behaviorEvents || [];
    const clicks = adClicks || [];
    const buckets: Record<string, { date: string; pageViews: number; events: number; clicks: number }> = {};
    const fmt = timeRange === "1h" ? "HH:mm" : timeRange === "24h" ? "HH:00" : "MM/dd";

    pv.forEach(p => {
      const key = format(parseISO(p.created_at), fmt);
      if (!buckets[key]) buckets[key] = { date: key, pageViews: 0, events: 0, clicks: 0 };
      buckets[key].pageViews++;
    });
    bv.forEach(b => {
      const key = format(parseISO(b.created_at), fmt);
      if (!buckets[key]) buckets[key] = { date: key, pageViews: 0, events: 0, clicks: 0 };
      buckets[key].events++;
    });
    clicks.forEach(c => {
      const key = format(parseISO(c.created_at), fmt);
      if (!buckets[key]) buckets[key] = { date: key, pageViews: 0, events: 0, clicks: 0 };
      buckets[key].clicks++;
    });

    return Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date));
  }, [pageViews, behaviorEvents, adClicks, timeRange]);

  // ── Event type distribution ──
  const eventTypeData = useMemo(() => {
    const map: Record<string, number> = {};
    (behaviorEvents || []).forEach(e => { map[e.event_type] = (map[e.event_type] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [behaviorEvents]);

  // ── Top pages ──
  const topPages = useMemo(() => {
    const map: Record<string, { path: string; views: number; totalDuration: number; bounces: number; sessions: Set<string> }> = {};
    (pageViews || []).forEach(p => {
      if (!map[p.path]) map[p.path] = { path: p.path, views: 0, totalDuration: 0, bounces: 0, sessions: new Set() };
      map[p.path].views++;
      map[p.path].totalDuration += p.duration_seconds || 0;
      if (p.is_bounce) map[p.path].bounces++;
      if (p.session_id) map[p.path].sessions.add(p.session_id);
    });
    return Object.values(map)
      .map(p => ({
        path: p.path, views: p.views,
        avgDuration: p.views > 0 ? Math.round(p.totalDuration / p.views) : 0,
        bounceRate: p.views > 0 ? Math.round((p.bounces / p.views) * 100) : 0,
        uniqueVisitors: p.sessions.size,
        engagementScore: Math.min(100, Math.round(
          (p.views > 0 ? Math.min(p.totalDuration / p.views / 60, 1) * 40 : 0) +
          (1 - (p.views > 0 ? p.bounces / p.views : 1)) * 40 +
          Math.min(p.sessions.size / 10, 1) * 20
        )),
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 20);
  }, [pageViews]);

  // ── Device breakdown ──
  const deviceData = useMemo(() => {
    const map: Record<string, number> = {};
    (pageViews || []).forEach(p => { map[p.device_type || "unknown"] = (map[p.device_type || "unknown"] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [pageViews]);

  // ── Country breakdown ──
  const countryData = useMemo(() => {
    const map: Record<string, number> = {};
    (pageViews || []).forEach(p => { if (p.country) map[p.country] = (map[p.country] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [pageViews]);

  // ── Referrer breakdown ──
  const referrerData = useMemo(() => {
    const map: Record<string, number> = {};
    (pageViews || []).forEach(p => {
      let ref = "direct";
      try { if (p.referrer) ref = new URL(p.referrer, "https://x.com").hostname.replace("www.", ""); } catch {}
      map[ref] = (map[ref] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [pageViews]);

  // ── Browser breakdown ──
  const browserData = useMemo(() => {
    const map: Record<string, number> = {};
    (behaviorEvents || []).forEach(b => { if (b.browser) map[b.browser] = (map[b.browser] || 0) + 1; });
    (adClicks || []).forEach(c => { if (c.browser) map[c.browser] = (map[c.browser] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [behaviorEvents, adClicks]);

  // ── Page Category breakdown ──
  const categoryData = useMemo(() => {
    const map: Record<string, { views: number; duration: number }> = {};
    (behaviorEvents || []).forEach(b => {
      const cat = b.page_category || "uncategorized";
      if (!map[cat]) map[cat] = { views: 0, duration: 0 };
      map[cat].views++;
      map[cat].duration += b.duration_seconds || 0;
    });
    return Object.entries(map).map(([name, v]) => ({
      name, views: v.views, avgDuration: v.views > 0 ? Math.round(v.duration / v.views) : 0,
    })).sort((a, b) => b.views - a.views).slice(0, 10);
  }, [behaviorEvents]);

  // ── Hourly Heatmap (hour × day) ──
  const hourlyHeatmap = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    (pageViews || []).forEach(p => {
      const d = parseISO(p.created_at);
      grid[getDay(d)][getHours(d)]++;
    });
    const days = isAr
      ? ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const maxVal = Math.max(1, ...grid.flat());
    return { grid, days, maxVal };
  }, [pageViews, isAr]);

  // ── Session Explorer data ──
  const sessionData = useMemo(() => {
    const sessions: Record<string, { id: string; pages: string[]; duration: number; startTime: string; device: string | null; country: string | null; bounced: boolean }> = {};
    (pageViews || []).forEach(p => {
      if (!p.session_id) return;
      if (!sessions[p.session_id]) {
        sessions[p.session_id] = { id: p.session_id, pages: [], duration: 0, startTime: p.created_at, device: p.device_type, country: p.country, bounced: false };
      }
      sessions[p.session_id].pages.push(p.path);
      sessions[p.session_id].duration += p.duration_seconds || 0;
      if (p.is_bounce) sessions[p.session_id].bounced = true;
    });
    return Object.values(sessions)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 30);
  }, [pageViews]);

  // ── Engagement Scatter (duration vs pages per session) ──
  const engagementScatter = useMemo(() => {
    const sessionMap: Record<string, { pages: number; duration: number }> = {};
    (pageViews || []).forEach(p => {
      if (!p.session_id) return;
      if (!sessionMap[p.session_id]) sessionMap[p.session_id] = { pages: 0, duration: 0 };
      sessionMap[p.session_id].pages++;
      sessionMap[p.session_id].duration += p.duration_seconds || 0;
    });
    return Object.values(sessionMap).map(s => ({ pages: s.pages, duration: Math.round(s.duration / 60), z: 1 }));
  }, [pageViews]);

  // ── Entry/Exit pages ──
  const entryExitPages = useMemo(() => {
    const sessionFirstLast: Record<string, { first: string; last: string; firstTime: number; lastTime: number }> = {};
    (pageViews || []).forEach(p => {
      if (!p.session_id) return;
      const t = new Date(p.created_at).getTime();
      if (!sessionFirstLast[p.session_id]) {
        sessionFirstLast[p.session_id] = { first: p.path, last: p.path, firstTime: t, lastTime: t };
      } else {
        if (t < sessionFirstLast[p.session_id].firstTime) {
          sessionFirstLast[p.session_id].first = p.path;
          sessionFirstLast[p.session_id].firstTime = t;
        }
        if (t > sessionFirstLast[p.session_id].lastTime) {
          sessionFirstLast[p.session_id].last = p.path;
          sessionFirstLast[p.session_id].lastTime = t;
        }
      }
    });
    const entryMap: Record<string, number> = {};
    const exitMap: Record<string, number> = {};
    Object.values(sessionFirstLast).forEach(s => {
      entryMap[s.first] = (entryMap[s.first] || 0) + 1;
      exitMap[s.last] = (exitMap[s.last] || 0) + 1;
    });
    const entries = Object.entries(entryMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
    const exits = Object.entries(exitMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
    return { entries, exits };
  }, [pageViews]);

  // ── Live event feed ──
  const eventFeed = useMemo(() => {
    const all = [
      ...(pageViews || []).map(p => ({ type: "page_view", label: p.path, time: p.created_at, device: p.device_type, country: p.country })),
      ...(behaviorEvents || []).map(b => ({ type: b.event_type, label: b.page_url || b.entity_type || "", time: b.created_at, device: b.device_type, country: b.country })),
      ...(adClicks || []).map(c => ({ type: "ad_click", label: c.page_url || "", time: c.created_at, device: c.device_type, country: c.country })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return all.filter(e => e.type.toLowerCase().includes(q) || e.label.toLowerCase().includes(q));
    }
    return all.slice(0, 80);
  }, [pageViews, behaviorEvents, adClicks, searchQuery]);

  const deviceIcon = (d: string | null) => {
    if (d === "mobile") return <Smartphone className="h-3 w-3" />;
    if (d === "tablet") return <Tablet className="h-3 w-3" />;
    return <Monitor className="h-3 w-3" />;
  };

  const NoData = () => <p className="py-12 text-center text-muted-foreground text-sm">{getNoDataText(isAr)}</p>;

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

  // ── Export Handlers ──
  const exportEventsCSV = useCallback(() => {
    const data = eventFeed.map(ev => ({
      timestamp: ev.time,
      event_type: ev.type,
      label: ev.label,
      device: ev.device || "",
      country: ev.country || "",
    }));
    downloadCSV(data, `events_${timeRange}_${format(new Date(), "yyyyMMdd")}`, [
      { key: "timestamp", label: isAr ? "الوقت" : "Timestamp" },
      { key: "event_type", label: isAr ? "نوع الحدث" : "Event Type" },
      { key: "label", label: isAr ? "التفاصيل" : "Details" },
      { key: "device", label: isAr ? "الجهاز" : "Device" },
      { key: "country", label: isAr ? "البلد" : "Country" },
    ]);
    toast({ title: isAr ? "تم تصدير الأحداث" : "Events exported", description: `${data.length} ${isAr ? "حدث" : "events"}` });
  }, [eventFeed, timeRange, isAr]);

  const exportEcommerceCSV = useCallback(() => {
    const orders = shopOrders || [];
    const data = orders.map(o => ({
      order_number: o.order_number,
      amount: o.total_amount,
      currency: o.currency,
      payment_status: o.payment_status,
      date: o.created_at,
    }));
    downloadCSV(data, `ecommerce_orders_${timeRange}_${format(new Date(), "yyyyMMdd")}`, [
      { key: "order_number", label: isAr ? "رقم الطلب" : "Order Number" },
      { key: "amount", label: isAr ? "المبلغ" : "Amount" },
      { key: "currency", label: isAr ? "العملة" : "Currency" },
      { key: "payment_status", label: isAr ? "حالة الدفع" : "Payment Status" },
      { key: "date", label: isAr ? "التاريخ" : "Date" },
    ]);
    toast({ title: isAr ? "تم تصدير الطلبات" : "Orders exported", description: `${data.length} ${isAr ? "طلب" : "orders"}` });
  }, [shopOrders, timeRange, isAr]);

  const exportTopPagesCSV = useCallback(() => {
    downloadCSV(topPages.map(p => ({
      page: p.path,
      views: p.views,
      unique_visitors: p.uniqueVisitors,
      avg_duration_s: p.avgDuration,
      bounce_rate: `${p.bounceRate}%`,
      engagement: p.engagementScore,
    })), `top_pages_${timeRange}_${format(new Date(), "yyyyMMdd")}`, [
      { key: "page", label: isAr ? "الصفحة" : "Page" },
      { key: "views", label: isAr ? "المشاهدات" : "Views" },
      { key: "unique_visitors", label: isAr ? "الزوار" : "Unique Visitors" },
      { key: "avg_duration_s", label: isAr ? "المدة (ثانية)" : "Avg Duration (s)" },
      { key: "bounce_rate", label: isAr ? "الارتداد" : "Bounce Rate" },
      { key: "engagement", label: isAr ? "التفاعل" : "Engagement" },
    ]);
    toast({ title: isAr ? "تم تصدير الصفحات" : "Pages exported" });
  }, [topPages, timeRange, isAr]);

  const exportAbandonedCartsCSV = useCallback(() => {
    const carts = abandonedCarts || [];
    const data = carts.map(c => ({
      id: c.id,
      total_amount: c.total_amount,
      currency: c.currency,
      status: c.recovery_status,
      items: JSON.stringify(c.items),
      created_at: c.created_at,
      updated_at: c.updated_at,
    }));
    downloadCSV(data, `abandoned_carts_${timeRange}_${format(new Date(), "yyyyMMdd")}`, [
      { key: "id", label: "ID" },
      { key: "total_amount", label: isAr ? "المبلغ" : "Amount" },
      { key: "currency", label: isAr ? "العملة" : "Currency" },
      { key: "status", label: isAr ? "الحالة" : "Status" },
      { key: "items", label: isAr ? "المنتجات" : "Items" },
      { key: "created_at", label: isAr ? "التاريخ" : "Created" },
    ]);
    toast({ title: isAr ? "تم تصدير السلات المتروكة" : "Abandoned carts exported", description: `${data.length} ${isAr ? "سلة" : "carts"}` });
  }, [abandonedCarts, timeRange, isAr]);

  const handlePrintReport = useCallback(() => {
    printableReport("events-monitoring-content", isAr ? "تقرير مراقبة الأحداث" : "Events Monitoring Report", {
      subtitle: `${isAr ? "الفترة" : "Period"}: ${timeRange} | ${format(new Date(), "yyyy-MM-dd HH:mm")}`,
      orientation: "landscape",
    });
  }, [timeRange, isAr]);

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
        <Badge variant="outline" className="gap-1 text-[10px]">
          <Activity className="h-3 w-3 text-chart-2 animate-pulse" />
          {isAr ? "مباشر" : "Live"}
        </Badge>
      </div>

      {/* KPI Grid with Deltas */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
        {kpis.map((kpi, i) => (
          <Card key={i} className="group hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <CardContent className="p-2.5 text-center">
              <kpi.icon className={`h-3.5 w-3.5 mx-auto mb-0.5 ${kpi.color} transition-transform duration-300 group-hover:scale-110`} />
              <div className="text-base font-bold leading-tight">
                {kpi.isDecimal ? kpi.value : <AnimatedCounter value={kpi.value} />}
                {kpi.suffix && <span className="text-[10px] text-muted-foreground ms-0.5">{kpi.suffix}</span>}
              </div>
              {kpi.delta && <DeltaBadge delta={kpi.invertDelta ? { ...kpi.delta, direction: kpi.delta.direction === "up" ? "down" : kpi.delta.direction === "down" ? "up" : "flat" } : kpi.delta} />}
              <div className="text-[9px] text-muted-foreground leading-tight mt-0.5">{kpi.label}</div>
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
              ) : <NoData />}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Event Types */}
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
                ) : <NoData />}
              </CardContent>
            </Card>

            {/* Device + Browser */}
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
                    <p className="text-[10px] text-muted-foreground font-medium mb-2">{isAr ? "الأجهزة" : "Devices"}</p>
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
                    ) : <NoData />}
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium mb-2">{isAr ? "المتصفحات" : "Browsers"}</p>
                    {browserData.length > 0 ? (
                      <div className="space-y-1.5">
                        {browserData.slice(0, 6).map((b, i) => {
                          const total = browserData.reduce((s, x) => s + x.value, 0);
                          const pct = total > 0 ? Math.round((b.value / total) * 100) : 0;
                          return (
                            <div key={i} className="flex items-center gap-2 text-[10px]">
                              <span className="w-16 truncate text-muted-foreground">{b.name}</span>
                              <Progress value={pct} className="h-1.5 flex-1" />
                              <span className="w-8 text-end font-medium">{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : <NoData />}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Page Categories */}
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
                <Badge variant="secondary" className="ms-auto text-[10px]">{topPages.length} {isAr ? "صفحة" : "pages"}</Badge>
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
                          <td className="py-2 px-2 font-mono text-foreground max-w-[250px] truncate text-[10px]">{page.path}</td>
                          <td className="py-2 px-2 text-center"><Badge variant="secondary" className="text-[10px]">{page.views}</Badge></td>
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
                              <span className="text-[10px] text-muted-foreground">{page.engagementScore}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <NoData />}
            </CardContent>
          </Card>

          {/* Entry/Exit pages */}
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
                ) : <NoData />}
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
                ) : <NoData />}
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
                ) : <NoData />}
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
                ) : <NoData />}
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
                <Badge variant="secondary" className="ms-auto text-[10px]">{sessionData.length} {isAr ? "جلسة" : "sessions"}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessionData.length > 0 ? (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {sessionData.map((session, i) => (
                    <div key={i} className="border border-border/50 rounded-lg p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Fingerprint className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[120px]">{session.id.slice(0, 12)}...</span>
                        <Separator orientation="vertical" className="h-3" />
                        {deviceIcon(session.device)}
                        {session.country && <Badge variant="outline" className="text-[9px] px-1 py-0">{session.country}</Badge>}
                        <span className="text-[10px] text-muted-foreground ms-auto flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />{format(parseISO(session.startTime), "HH:mm")}
                        </span>
                        <Badge variant={session.bounced ? "destructive" : "secondary"} className="text-[9px] px-1 py-0">
                          {session.bounced ? (isAr ? "ارتداد" : "Bounced") : `${formatDuration(session.duration)}`}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {session.pages.map((page, j) => (
                          <span key={j} className="flex items-center gap-0.5">
                            {j > 0 && <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/50" />}
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono">{page}</Badge>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <NoData />}
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
              ) : <NoData />}
            </CardContent>
          </Card>

          {/* Duration Distribution */}
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
                const data = ranges.map(r => ({
                  range: r.label,
                  count: (pageViews || []).filter(p => (p.duration_seconds || 0) >= r.min && (p.duration_seconds || 0) < r.max).length,
                }));
                return data.some(d => d.count > 0) ? (
                  <ResponsiveContainer width="100%" height={CHART_HEIGHT.sm}>
                    <BarChart data={data}>
                      <CartesianGrid {...GRID_PROPS} />
                      <XAxis dataKey="range" {...X_AXIS_PROPS} />
                      <YAxis {...Y_AXIS_PROPS} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="count" fill={CHART_COLORS[1]} radius={BAR_RADIUS} name={isAr ? "الزيارات" : "Visits"} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <NoData />;
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
                  {/* Hour labels */}
                  <div className="flex items-center gap-0">
                    <div className="w-14" />
                    {Array.from({ length: 24 }, (_, h) => (
                      <div key={h} className="flex-1 text-center text-[8px] text-muted-foreground">{h}</div>
                    ))}
                  </div>
                  {/* Grid */}
                  {hourlyHeatmap.grid.map((row, dayIdx) => (
                    <div key={dayIdx} className="flex items-center gap-0">
                      <div className="w-14 text-[10px] text-muted-foreground text-end pe-2 shrink-0">{hourlyHeatmap.days[dayIdx]}</div>
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
                  {/* Legend */}
                  <div className="flex items-center justify-end gap-1 mt-2">
                    <span className="text-[9px] text-muted-foreground">{isAr ? "أقل" : "Less"}</span>
                    {[0.1, 0.3, 0.5, 0.7, 0.9].map((o, i) => (
                      <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `hsl(var(--primary) / ${o})` }} />
                    ))}
                    <span className="text-[9px] text-muted-foreground">{isAr ? "أكثر" : "More"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── E-Commerce ── */}
        <TabsContent value="ecommerce" className="space-y-4 mt-4">
          {/* E-Commerce KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              { label: isAr ? "مشاهدات المنتج" : "Product Views", value: ecomMetrics.productViews, icon: Eye, color: "text-chart-1" },
              { label: isAr ? "إضافة للسلة" : "Add to Cart", value: ecomMetrics.addToCartEvents, icon: ShoppingCart, color: "text-chart-2" },
              { label: isAr ? "بدء الدفع" : "Checkout Started", value: ecomMetrics.beginCheckoutEvents, icon: CreditCard, color: "text-chart-3" },
              { label: isAr ? "عمليات شراء" : "Purchases", value: ecomMetrics.purchaseEvents, icon: DollarSign, color: "text-chart-4" },
              { label: isAr ? "سلات متروكة" : "Abandoned Carts", value: ecomMetrics.activeCarts, icon: PackageX, color: "text-destructive" },
              { label: isAr ? "معدل الاسترداد" : "Recovery Rate", value: ecomMetrics.recoveryRate, icon: Target, color: "text-chart-2", suffix: "%" },
              { label: isAr ? "إجمالي الإيرادات" : "Revenue", value: Math.round(ecomMetrics.totalRevenue), icon: DollarSign, color: "text-primary", prefix: "SAR " },
              { label: isAr ? "متوسط الطلب" : "AOV", value: ecomMetrics.avgOrderValue, icon: Gauge, color: "text-chart-5", prefix: "SAR " },
            ].map((kpi, i) => (
              <Card key={i} className="group hover:shadow-md transition-all duration-300">
                <CardContent className="p-2.5 text-center">
                  <kpi.icon className={`h-3.5 w-3.5 mx-auto mb-0.5 ${kpi.color}`} />
                  <div className="text-sm font-bold leading-tight">
                    {kpi.prefix && <span className="text-[9px] text-muted-foreground">{kpi.prefix}</span>}
                    <AnimatedCounter value={kpi.value} />
                    {kpi.suffix && <span className="text-[9px] text-muted-foreground ms-0.5">{kpi.suffix}</span>}
                  </div>
                  <div className="text-[8px] text-muted-foreground leading-tight mt-0.5">{kpi.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Conversion Funnel */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  {isAr ? "قمع التحويل" : "Conversion Funnel"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ecomMetrics.funnel.some(f => f.value > 0) ? (
                  <div className="space-y-3">
                    {ecomMetrics.funnel.map((stage, i) => {
                      const maxVal = Math.max(1, ecomMetrics.funnel[0].value);
                      const pct = maxVal > 0 ? Math.round((stage.value / maxVal) * 100) : 0;
                      const dropOff = i > 0 && ecomMetrics.funnel[i - 1].value > 0
                        ? Math.round(((ecomMetrics.funnel[i - 1].value - stage.value) / ecomMetrics.funnel[i - 1].value) * 100)
                        : 0;
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-medium">{isAr ? stage.stageAr : stage.stage}</span>
                            <span className="text-muted-foreground">{stage.value} <span className="text-[9px]">({pct}%)</span></span>
                          </div>
                          <div className="relative h-7 bg-muted rounded-lg overflow-hidden">
                            <div
                              className="absolute inset-y-0 start-0 rounded-lg transition-all duration-700"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: EXTRA_COLORS[i % EXTRA_COLORS.length],
                                opacity: 0.85,
                              }}
                            />
                          </div>
                          {i > 0 && dropOff > 0 && (
                            <div className="flex items-center gap-1 mt-0.5 text-[9px] text-destructive/70">
                              <ArrowDownRight className="h-2.5 w-2.5" />
                              {dropOff}% {isAr ? "انخفاض" : "drop-off"}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <Separator />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{isAr ? "معدل التحويل الإجمالي" : "Overall Conversion"}: <strong className="text-foreground">{ecomMetrics.overallConversion}%</strong></span>
                      <span>{isAr ? "سلة → دفع" : "Cart → Pay"}: <strong className="text-foreground">{ecomMetrics.checkoutToPayRate}%</strong></span>
                    </div>
                  </div>
                ) : <NoData />}
              </CardContent>
            </Card>

            {/* Revenue Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-chart-2" />
                  {isAr ? "الإيرادات بمرور الوقت" : "Revenue Over Time"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ecomMetrics.revenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={CHART_HEIGHT.md}>
                    <AreaChart data={ecomMetrics.revenueData}>
                      <CartesianGrid {...GRID_PROPS} />
                      <XAxis dataKey="date" {...X_AXIS_PROPS} />
                      <YAxis {...Y_AXIS_PROPS} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`SAR ${v}`, isAr ? "الإيرادات" : "Revenue"]} />
                      <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} fillOpacity={0.15} strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <NoData />}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Abandoned Cart Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <PackageX className="h-4 w-4 text-destructive" />
                  {isAr ? "السلات المتروكة" : "Abandoned Carts"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ecomMetrics.cartStatus.length > 0 ? (
                  <div className="space-y-3">
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={ecomMetrics.cartStatus.map(c => ({ name: isAr ? c.nameAr : c.name, value: c.value }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={35} paddingAngle={3} strokeWidth={0}>
                          <Cell fill="hsl(var(--destructive))" />
                          <Cell fill="hsl(var(--chart-2))" />
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ ...LEGEND_STYLE, fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="text-center text-xs text-muted-foreground">
                      {isAr ? "قيمة متروكة" : "Abandoned Value"}: <strong className="text-destructive">SAR {Math.round(ecomMetrics.abandonedValue)}</strong>
                    </div>
                  </div>
                ) : <NoData />}
              </CardContent>
            </Card>

            {/* Conversion Rates */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Percent className="h-4 w-4 text-chart-4" />
                  {isAr ? "معدلات التحويل" : "Conversion Rates"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: isAr ? "مشاهدة → سلة" : "View → Cart", value: ecomMetrics.productViews > 0 ? Math.round((ecomMetrics.addToCartEvents / ecomMetrics.productViews) * 100) : 0 },
                  { label: isAr ? "سلة → دفع" : "Cart → Checkout", value: ecomMetrics.cartToCheckoutRate },
                  { label: isAr ? "دفع → شراء" : "Checkout → Purchase", value: ecomMetrics.checkoutToPayRate },
                  { label: isAr ? "إجمالي التحويل" : "Overall", value: ecomMetrics.overallConversion },
                ].map((r, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-muted-foreground">{r.label}</span>
                      <span className="font-bold">{r.value}%</span>
                    </div>
                    <Progress value={r.value} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Other Conversions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-chart-3" />
                  {isAr ? "تحويلات أخرى" : "Other Conversions"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: isAr ? "تسجيل مسابقات" : "Competition Registrations", value: ecomMetrics.competitionRegs, icon: "🏆" },
                  { label: isAr ? "أحداث العضوية" : "Membership Events", value: ecomMetrics.membershipEvents, icon: "👑" },
                  { label: isAr ? "حجوزات" : "Bookings", value: ecomMetrics.bookingEvents, icon: "📅" },
                  { label: isAr ? "إزالة من السلة" : "Cart Removals", value: ecomMetrics.removeFromCartEvents, icon: "🗑️" },
                  { label: isAr ? "قوائم المنتجات" : "List Views", value: ecomMetrics.listViews, icon: "📋" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                    <span className="flex items-center gap-1.5">
                      <span>{item.icon}</span>
                      <span className="text-muted-foreground">{item.label}</span>
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-bold">{item.value}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Live Feed ── */}
        <TabsContent value="feed" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-chart-2" />
                {isAr ? "بث الأحداث المباشر" : "Live Event Stream"}
                <Badge variant="outline" className="text-[10px] ms-auto">{eventFeed.length} {isAr ? "حدث" : "events"}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventFeed.length > 0 ? (
                <div className="space-y-0.5 max-h-[600px] overflow-y-auto">
                  {eventFeed.map((ev, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors text-xs group">
                      <span className="text-muted-foreground w-16 shrink-0 text-[10px] font-mono">
                        {format(parseISO(ev.time), "HH:mm:ss")}
                      </span>
                      {deviceIcon(ev.device)}
                      {ev.country && <span className="text-[9px] text-muted-foreground w-6">{ev.country}</span>}
                      <Badge
                        variant={ev.type === "page_view" ? "secondary" : ev.type === "ad_click" ? "destructive" : "outline"}
                        className="text-[9px] px-1.5 py-0 min-w-[60px] text-center"
                      >
                        {ev.type}
                      </Badge>
                      <span className="text-muted-foreground truncate max-w-[350px] font-mono text-[10px] group-hover:text-foreground transition-colors">{ev.label}</span>
                    </div>
                  ))}
                </div>
              ) : <NoData />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});
