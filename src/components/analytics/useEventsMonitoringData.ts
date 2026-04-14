import { useState, useMemo, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { downloadCSV, printableReport } from "@/lib/exportUtils";
import { toast } from "@/hooks/use-toast";
import { format, subDays, subHours, parseISO, getHours, getDay } from "date-fns";
import { type TimeRange, getDelta, type EcomMetrics } from "./eventsMonitoringTypes";

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

export function useEventsMonitoringData() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [searchQuery, setSearchQuery] = useState("");

  const since = useMemo(() => getTimeFilter(timeRange), [timeRange]);

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

  // ── Computed Metrics ──
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

    const sessionPages: Record<string, number> = {};
    pv.forEach(p => { if (p.session_id) sessionPages[p.session_id] = (sessionPages[p.session_id] || 0) + 1; });
    const pagesPerSession = uniqueSessions > 0 ? +(Object.values(sessionPages).reduce((a, b) => a + b, 0) / uniqueSessions).toFixed(1) : 0;
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
  const ecomMetrics: EcomMetrics = useMemo(() => {
    const bv = behaviorEvents || [];
    const carts = abandonedCarts || [];
    const orders = shopOrders || [];

    const addToCartEvents = bv.filter(e => e.event_type === "add_to_cart").length;
    const beginCheckoutEvents = bv.filter(e => e.event_type === "begin_checkout").length;
    const purchaseEvents = bv.filter(e => e.event_type === "purchase").length;
    const productViews = bv.filter(e => e.event_type === "view_item").length;
    const listViews = bv.filter(e => e.event_type === "view_item_list").length;
    const removeFromCartEvents = bv.filter(e => e.event_type === "remove_from_cart").length;

    const activeCarts = carts.filter(c => c.recovery_status === "active");
    const recoveredCarts = carts.filter(c => c.recovery_status === "recovered");
    const abandonedValue = activeCarts.reduce((s, c) => s + (c.total_amount || 0), 0);
    const recoveryRate = carts.length > 0 ? Math.round((recoveredCarts.length / carts.length) * 100) : 0;

    const completedOrders = orders.filter(o => o.payment_status === "paid" || o.payment_status === "completed");
    const totalRevenue = completedOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
    const avgOrderValue = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;

    const cartToCheckoutRate = addToCartEvents > 0 ? Math.round((beginCheckoutEvents / addToCartEvents) * 100) : 0;
    const checkoutToPayRate = beginCheckoutEvents > 0 ? Math.round((purchaseEvents / beginCheckoutEvents) * 100) : 0;
    const overallConversion = productViews > 0 ? +((purchaseEvents / productViews) * 100).toFixed(2) : 0;

    const funnel = [
      { stage: "Product Views", stageAr: "مشاهدة المنتج", value: productViews },
      { stage: "Add to Cart", stageAr: "إضافة للسلة", value: addToCartEvents },
      { stage: "Begin Checkout", stageAr: "بدء الدفع", value: beginCheckoutEvents },
      { stage: "Purchase", stageAr: "شراء", value: purchaseEvents },
    ];

    const cartStatus = [
      { name: "Active", nameAr: "نشطة", value: activeCarts.length },
      { name: "Recovered", nameAr: "مستردة", value: recoveredCarts.length },
    ].filter(c => c.value > 0);

    const revenueTimeline: Record<string, number> = {};
    orders.forEach(o => {
      const key = format(parseISO(o.created_at), "MM/dd");
      revenueTimeline[key] = (revenueTimeline[key] || 0) + (o.total_amount || 0);
    });
    const revenueData = Object.entries(revenueTimeline).map(([date, revenue]) => ({ date, revenue: Math.round(revenue) })).sort((a, b) => a.date.localeCompare(b.date));

    const membershipEvents = bv.filter(e => e.event_type.startsWith("membership_")).length;
    const competitionRegs = bv.filter(e => e.event_type === "competition_registration").length;
    const bookingEvents = bv.filter(e => e.event_type === "booking_created").length;

    return {
      addToCartEvents, beginCheckoutEvents, purchaseEvents, productViews, listViews, removeFromCartEvents,
      activeCarts: activeCarts.length, recoveredCarts: recoveredCarts.length, abandonedValue, recoveryRate,
      totalRevenue, avgOrderValue, completedOrders: completedOrders.length, totalOrders: orders.length,
      cartToCheckoutRate, checkoutToPayRate, overallConversion,
      funnel, cartStatus, revenueData, membershipEvents, competitionRegs, bookingEvents,
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

  // ── Hourly Heatmap ──
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

  // ── Session Explorer ──
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

  // ── Engagement Scatter ──
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

  // ── Export Handlers ──
  const exportEventsCSV = useCallback(() => {
    const data = eventFeed.map(ev => ({
      timestamp: ev.time, event_type: ev.type, label: ev.label, device: ev.device || "", country: ev.country || "",
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
      order_number: o.order_number, amount: o.total_amount, currency: o.currency, payment_status: o.payment_status, date: o.created_at,
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
      page: p.path, views: p.views, unique_visitors: p.uniqueVisitors, avg_duration_s: p.avgDuration, bounce_rate: `${p.bounceRate}%`, engagement: p.engagementScore,
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
      id: c.id, total_amount: c.total_amount, currency: c.currency, status: c.recovery_status, items: JSON.stringify(c.items), created_at: c.created_at, updated_at: c.updated_at,
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

  return {
    isAr, timeRange, setTimeRange, searchQuery, setSearchQuery,
    metrics, ecomMetrics, timelineData, eventTypeData, topPages,
    deviceData, countryData, referrerData, browserData, categoryData,
    hourlyHeatmap, sessionData, engagementScatter, entryExitPages, eventFeed, pageViews,
    exportEventsCSV, exportEcommerceCSV, exportTopPagesCSV, exportAbandonedCartsCSV, handlePrintReport,
  };
}
