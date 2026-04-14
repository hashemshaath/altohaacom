/**
 * Data hook for SEO Dashboard — queries, computed metrics, and handlers.
 */
import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subDays, startOfDay } from "date-fns";
import { getDeviceType } from "@/lib/deviceType";
import { useSearchParams } from "react-router-dom";
import { PUBLIC_ROUTES, DEFAULT_ROBOTS_TXT, NAV_GROUPS, type SectionKey, resolveSectionParam } from "./seoDashboardTypes";

export function useSEODashboardData(isAr: boolean) {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSectionState] = useState<SectionKey>(() => resolveSectionParam(searchParams.get("section")));
  const [pinging, setPinging] = useState(false);
  const [collectingVitals, setCollectingVitals] = useState(false);
  const [range, setRange] = useState(7);

  const fromDate = startOfDay(subDays(new Date(), range)).toISOString();
  const prevFromDate = startOfDay(subDays(new Date(), range * 2)).toISOString();
  const sectionFromQuery = resolveSectionParam(searchParams.get("section"));

  const setActiveSection = useCallback((section: SectionKey) => {
    setActiveSectionState(section);
    const nextParams = new URLSearchParams(searchParams);
    if (section === "overview") nextParams.delete("section");
    else nextParams.set("section", section);
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (sectionFromQuery !== activeSection) setActiveSectionState(sectionFromQuery);
  }, [sectionFromQuery, activeSection]);

  // ── Queries ──
  const { data: pageViews, isLoading: loadingViews, error: pageViewsError } = useQuery({
    queryKey: ["seo-page-views", range],
    queryFn: async () => {
      const { data, error } = await supabase.from("seo_page_views").select("path, device_type, is_bounce, duration_seconds, created_at, session_id").gte("created_at", fromDate).order("created_at", { ascending: false }).limit(1000);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: prevPageViews } = useQuery({
    queryKey: ["seo-page-views-prev", range],
    queryFn: async () => {
      const { data, error } = await supabase.from("seo_page_views").select("path, device_type, is_bounce, duration_seconds, session_id").gte("created_at", prevFromDate).lt("created_at", fromDate).limit(1000);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: vitalsData, isLoading: loadingVitals, error: vitalsDataError } = useQuery({
    queryKey: ["seo-web-vitals", range],
    queryFn: async () => {
      const { data, error } = await supabase.from("seo_web_vitals").select("path, lcp, inp, cls, fcp, ttfb, device_type, connection_type, created_at").gte("created_at", fromDate).order("created_at", { ascending: false }).limit(1000);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: crawlLog, error: crawlLogError } = useQuery({
    queryKey: ["seo-crawl-log"],
    queryFn: async () => {
      const { data, error } = await supabase.from("seo_crawl_log").select("*").order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: crawlerVisits, error: crawlerVisitsError } = useQuery({
    queryKey: ["seo-crawler-visits", range],
    queryFn: async () => {
      const { data, error } = await supabase.from("seo_crawler_visits").select("path, crawler_name, crawler_type, created_at").gte("created_at", fromDate).order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: trackedKeywords, refetch: refetchKeywords, error: trackedKeywordsError } = useQuery({
    queryKey: ["seo-tracked-keywords"],
    queryFn: async () => {
      const { data, error } = await supabase.from("seo_tracked_keywords").select("*").order("created_at", { ascending: false }).limit(5000);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: indexingStatus, refetch: refetchIndexing, error: indexingStatusError } = useQuery({
    queryKey: ["seo-indexing-status"],
    queryFn: async () => {
      const { data, error } = await supabase.from("seo_indexing_status").select("*").order("updated_at", { ascending: false }).limit(5000);
      if (error) throw error;
      return data || [];
    },
  });

  const firstQueryError = pageViewsError || vitalsDataError || crawlLogError || crawlerVisitsError || trackedKeywordsError || indexingStatusError;
  useEffect(() => {
    if (firstQueryError) {
      toast.error((firstQueryError instanceof Error ? firstQueryError.message : "") || (isAr ? "تعذر تحميل بيانات SEO" : "Failed to load SEO data"));
    }
  }, [firstQueryError, isAr]);

  // ── SEO Settings ──
  const { data: seoSettings, refetch: refetchSeoSettings } = useQuery({
    queryKey: ["seo-site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("value").eq("key", "seo").maybeSingle();
      if (error) throw error;
      return (data?.value as Record<string, unknown>) || {};
    },
  });

  const [sitemapToggles, setSitemapToggles] = useState<Record<string, boolean>>({});
  const [robotsTxtDraft, setRobotsTxtDraft] = useState("");
  const [savingSeo, setSavingSeo] = useState(false);

  useEffect(() => {
    if (seoSettings) {
      setSitemapToggles((seoSettings as Record<string, unknown>).sitemapSections as Record<string, boolean> || {
        competitions: true, exhibitions: true, blog: true, chefs: true,
        masterclasses: true, recipes: true, establishments: true,
        mentorship: true, jobs: true, entities: true,
      });
      setRobotsTxtDraft((seoSettings as Record<string, unknown>).robotsTxt as string || DEFAULT_ROBOTS_TXT);
    }
  }, [seoSettings]);

  const saveSeoField = async (patch: Record<string, unknown>) => {
    setSavingSeo(true);
    try {
      const merged = { ...(seoSettings || {}), ...patch };
      const { error } = await supabase.from("site_settings").update({ value: merged as never, updated_at: new Date().toISOString() }).eq("key", "seo");
      if (error) throw error;
      await refetchSeoSettings();
      toast.success(isAr ? "تم الحفظ بنجاح" : "Saved successfully");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : String(e)); } finally { setSavingSeo(false); }
  };

  // ── Keyword Handlers ──
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
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : String(e)); } finally { setAddingKeyword(false); }
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

  // ── GSC ──
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
    } catch (e: unknown) { toast.error((e instanceof Error ? e.message : "") || "GSC sync failed"); } finally { setGscSyncing(null); }
  };

  const handleGSCInspectUrls = async () => {
    if (!indexingStatus?.length) { toast.error("Seed pages first"); return; }
    setGscSyncing("inspect");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const urls = indexingStatus.slice(0, 20).map((s) => s.url);
      const { data, error } = await supabase.functions.invoke("gsc-sync", { body: { action: "inspect_urls", siteUrl: GSC_SITE_URL, urls } });
      if (error) throw error;
      toast.success(isAr ? `تم فحص ${data.inspections?.filter((i: Record<string, unknown>) => !i.error).length || 0} صفحة` : `Inspected ${data.inspections?.filter((i: Record<string, unknown>) => !i.error).length || 0} URLs`);
      refetchIndexing();
    } catch (e: unknown) { toast.error((e instanceof Error ? e.message : "") || "Inspection failed"); } finally { setGscSyncing(null); }
  };

  const handleGSCSubmitUrls = async (urls?: string[]) => {
    const targetUrls = urls || indexingStatus?.filter((s) => s.status !== "indexed").map((s) => s.url) || [];
    if (!targetUrls.length) { toast.info(isAr ? "لا صفحات لإرسالها" : "No pages to submit"); return; }
    setGscSyncing("submit");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const { data, error } = await supabase.functions.invoke("gsc-sync", { body: { action: "submit_indexing", urls: targetUrls.slice(0, 10) } });
      if (error) throw error;
      toast.success(isAr ? `تم إرسال ${data.submissions?.filter((s: Record<string, unknown>) => s.success).length || 0} صفحة` : `Submitted ${data.submissions?.filter((s: Record<string, unknown>) => s.success).length || 0} URLs`);
      refetchIndexing();
    } catch (e: unknown) { toast.error((e instanceof Error ? e.message : "") || "Submission failed"); } finally { setGscSyncing(null); }
  };

  const handlePingSitemap = async () => {
    setPinging(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("seo-sitemap-ping", { headers: { Authorization: `Bearer ${session?.access_token}` } });
      if (error) throw error;
      const results = data?.results || [];
      const sitemapOk = results.some((r: Record<string, unknown>) => r.engine === "Sitemap" && r.status === "success");
      const allOk = results.every((r: Record<string, unknown>) => ["success", "info"].includes(r.status as string));
      const desc = results.map((r: Record<string, string>) => {
        const icon = r.status === "success" ? "✓" : r.status === "info" ? "ℹ" : "✗";
        const msg = r.message ? ` (${r.message})` : "";
        return `${r.engine}: ${icon}${msg}`;
      }).join("\n");
      if (sitemapOk || allOk) toast.success(isAr ? "خريطة الموقع متاحة ومسجلة" : "Sitemap is accessible & registered", { description: desc });
      else toast.error(isAr ? "فشل التحقق من خريطة الموقع" : "Sitemap verification failed", { description: desc });
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : String(e)); } finally { setPinging(false); }
  };

  const handleCollectVitals = async () => {
    if (collectingVitals) return;
    setCollectingVitals(true);
    try {
      const path = window.location.pathname;
      const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
      const ttfb = navEntries[0] ? Math.round(navEntries[0].responseStart - navEntries[0].requestStart) : null;
      const paintEntries = performance.getEntriesByType("paint");
      const fcpEntry = paintEntries.find(e => e.name === "first-contentful-paint");
      const fcp = fcpEntry ? Math.round(fcpEntry.startTime) : null;
      let lcp: number | null = null;
      try { const lcpEntries = performance.getEntriesByType("largest-contentful-paint") as PerformanceEntry[]; if (lcpEntries.length) lcp = Math.round(lcpEntries[lcpEntries.length - 1].startTime); } catch { /* ignore */ }
      let cls: number | null = null;
      try {
        const layoutShiftEntries = performance.getEntriesByType("layout-shift") as (PerformanceEntry & { hadRecentInput?: boolean; value?: number })[];
        if (layoutShiftEntries.length) cls = Math.round(layoutShiftEntries.reduce((sum, e) => sum + (e.hadRecentInput ? 0 : (e.value || 0)), 0) * 1000) / 1000;
      } catch { /* ignore */ }
      const nav = navigator as unknown as { connection?: { effectiveType?: string }; userAgent: string };
      const payload = { path, lcp, inp: null, cls, fcp, ttfb, device_type: getDeviceType(), connection_type: nav?.connection?.effectiveType || null, session_id: "manual-collect-" + Date.now().toString(36), user_agent: navigator.userAgent.slice(0, 200) };
      const { error } = await supabase.from("seo_web_vitals").insert(payload);
      if (error) throw error;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["seo-web-vitals"] }),
        queryClient.invalidateQueries({ queryKey: ["seo-speed-current"] }),
        queryClient.invalidateQueries({ queryKey: ["seo-speed-prev"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-web-vitals-summary"] }),
      ]);
      toast.success(isAr ? "تم جمع بيانات الأداء" : "Performance data collected successfully");
    } catch (e: unknown) { toast.error((e instanceof Error ? e.message : "") || "Failed to collect vitals"); } finally { setCollectingVitals(false); }
  };

  // ── Computed Metrics ──
  const totalViews = pageViews?.length || 0;
  const uniqueSessions = new Set(pageViews?.map((v) => v.session_id) || []).size;
  const bounceCount = pageViews?.filter((v) => v.is_bounce)?.length || 0;
  const bounceRate = totalViews > 0 ? Math.round((bounceCount / totalViews) * 100) : 0;
  const avgDuration = totalViews > 0 ? Math.round((pageViews?.reduce((s, v) => s + (v.duration_seconds || 0), 0) || 0) / totalViews) : 0;

  const prevTotalViews = prevPageViews?.length || 0;
  const prevUniqueSessions = new Set(prevPageViews?.map((v) => v.session_id) || []).size;
  const prevBounceCount = prevPageViews?.filter((v) => v.is_bounce)?.length || 0;
  const prevBounceRate = prevTotalViews > 0 ? Math.round((prevBounceCount / prevTotalViews) * 100) : 0;
  const prevAvgDuration = prevTotalViews > 0 ? Math.round((prevPageViews?.reduce((s, v) => s + (v.duration_seconds || 0), 0) || 0) / prevTotalViews) : 0;

  const devices = { mobile: 0, tablet: 0, desktop: 0 };
  pageViews?.forEach((v) => {
    if (v.device_type === "mobile") devices.mobile++;
    else if (v.device_type === "tablet") devices.tablet++;
    else devices.desktop++;
  });

  const pageCounts: Record<string, number> = {};
  pageViews?.forEach((v) => { pageCounts[v.path] = (pageCounts[v.path] || 0) + 1; });
  const topPages = Object.entries(pageCounts).sort(([, a], [, b]) => b - a).slice(0, 15);

  const p75 = (arr: number[]) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.ceil(s.length * 0.75) - 1]; };

  const vitalsAgg = useMemo(() => {
    if (!vitalsData?.length) return null;
    const metrics = { lcp: [] as number[], inp: [] as number[], cls: [] as number[], fcp: [] as number[], ttfb: [] as number[] };
    vitalsData.forEach((v) => {
      if (v.lcp != null) metrics.lcp.push(Number(v.lcp));
      if (v.inp != null) metrics.inp.push(Number(v.inp));
      if (v.cls != null) metrics.cls.push(Number(v.cls));
      if (v.fcp != null) metrics.fcp.push(Number(v.fcp));
      if (v.ttfb != null) metrics.ttfb.push(Number(v.ttfb));
    });
    return {
      lcp: p75(metrics.lcp), inp: p75(metrics.inp), cls: p75(metrics.cls), fcp: p75(metrics.fcp), ttfb: p75(metrics.ttfb),
      sampleCount: vitalsData.length,
      mobileCount: vitalsData.filter((v) => v.device_type === "mobile").length,
      desktopCount: vitalsData.filter((v) => v.device_type === "desktop").length,
    };
  }, [vitalsData]);

  const pageVitals = useMemo(() => {
    if (!vitalsData?.length) return [];
    const byPath: Record<string, { lcp: number[]; cls: number[]; inp: number[] }> = {};
    vitalsData.forEach((v) => {
      if (!byPath[v.path]) byPath[v.path] = { lcp: [], cls: [], inp: [] };
      if (v.lcp != null) byPath[v.path].lcp.push(Number(v.lcp));
      if (v.cls != null) byPath[v.path].cls.push(Number(v.cls));
      if (v.inp != null) byPath[v.path].inp.push(Number(v.inp));
    });
    return Object.entries(byPath)
      .map(([path, data]) => ({ path, lcp: p75(data.lcp), cls: p75(data.cls), inp: p75(data.inp), samples: data.lcp.length + data.cls.length + data.inp.length }))
      .sort((a, b) => (b.lcp || 0) - (a.lcp || 0));
  }, [vitalsData]);

  const trendData = useMemo(() => {
    if (!vitalsData?.length) return [];
    const byDay: Record<string, { lcp: number[]; inp: number[]; cls: number[]; fcp: number[]; ttfb: number[] }> = {};
    vitalsData.forEach((v) => {
      const day = format(new Date(v.created_at), "MM/dd");
      if (!byDay[day]) byDay[day] = { lcp: [], inp: [], cls: [], fcp: [], ttfb: [] };
      if (v.lcp != null) byDay[day].lcp.push(Number(v.lcp));
      if (v.inp != null) byDay[day].inp.push(Number(v.inp));
      if (v.cls != null) byDay[day].cls.push(Number(v.cls));
      if (v.fcp != null) byDay[day].fcp.push(Number(v.fcp));
      if (v.ttfb != null) byDay[day].ttfb.push(Number(v.ttfb));
    });
    return Object.entries(byDay).map(([day, m]) => ({ day, lcp: p75(m.lcp), inp: p75(m.inp), cls: p75(m.cls), fcp: p75(m.fcp), ttfb: p75(m.ttfb) })).sort((a, b) => a.day.localeCompare(b.day));
  }, [vitalsData]);

  const connectionDistribution = useMemo(() => {
    if (!vitalsData?.length) return [];
    const counts: Record<string, number> = {};
    vitalsData.forEach((v) => { const ct = v.connection_type || "unknown"; counts[ct] = (counts[ct] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [vitalsData]);

  const deviceVitalsComparison = useMemo(() => {
    if (!vitalsData?.length) return [];
    const byDevice: Record<string, { lcp: number[]; fcp: number[]; ttfb: number[] }> = {};
    vitalsData.forEach((v) => {
      const dt = v.device_type || "unknown";
      if (!byDevice[dt]) byDevice[dt] = { lcp: [], fcp: [], ttfb: [] };
      if (v.lcp != null) byDevice[dt].lcp.push(Number(v.lcp));
      if (v.fcp != null) byDevice[dt].fcp.push(Number(v.fcp));
      if (v.ttfb != null) byDevice[dt].ttfb.push(Number(v.ttfb));
    });
    const p75round = (arr: number[]) => { if (!arr.length) return 0; const s = [...arr].sort((a, b) => a - b); return Math.round(s[Math.ceil(s.length * 0.75) - 1]); };
    return Object.entries(byDevice).map(([device, m]) => ({ device: device.charAt(0).toUpperCase() + device.slice(1), LCP: p75round(m.lcp), FCP: p75round(m.fcp), TTFB: p75round(m.ttfb) }));
  }, [vitalsData]);

  const activeSectionInfo = useMemo(() => {
    for (const group of NAV_GROUPS) {
      const item = group.items.find((i) => i.key === activeSection);
      if (item) return { ...item, groupLabel: group.label, groupLabelAr: group.labelAr };
    }
    return null;
  }, [activeSection]);

  return {
    activeSection, setActiveSection, range, setRange,
    pinging, collectingVitals, loadingViews, loadingVitals,
    pageViews, vitalsData, crawlLog, crawlerVisits, trackedKeywords, indexingStatus,
    totalViews, uniqueSessions, bounceRate, avgDuration,
    prevTotalViews, prevUniqueSessions, prevBounceRate, prevAvgDuration,
    devices, topPages, pageCounts,
    vitalsAgg, pageVitals, trendData, connectionDistribution, deviceVitalsComparison,
    activeSectionInfo,
    newKeyword, setNewKeyword, newKeywordPage, setNewKeywordPage, addingKeyword,
    handleAddKeyword, handleDeleteKeyword, handleSeedIndexing,
    gscSyncing, handleGSCSyncPerformance, handleGSCInspectUrls, handleGSCSubmitUrls,
    handlePingSitemap, handleCollectVitals,
    seoSettings, sitemapToggles, setSitemapToggles, robotsTxtDraft, setRobotsTxtDraft,
    savingSeo, saveSeoField,
  };
}
