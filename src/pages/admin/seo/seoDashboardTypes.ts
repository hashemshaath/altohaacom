/**
 * Shared types, constants, and navigation config for SEO Dashboard.
 */
import {
  LayoutDashboard, BarChart3, Search, Bot, FileText,
  TrendingUp, Gauge, Zap, Smartphone, Target, Sparkles,
  FileSearch, Users, Link2, Activity, Globe, Settings2,
  Code2, Shield, CheckCircle2, Lightbulb, Route, Map, FileCode,
} from "lucide-react";

export const DEFAULT_ROBOTS_TXT = `User-agent: *
Disallow: /admin/
Disallow: /dashboard/
Disallow: /profile/settings
Allow: /competitions/
Allow: /exhibitions/
Allow: /blog/
Allow: /masterclasses/
Allow: /recipes/
Allow: /entities/
Allow: /mentorship/
Allow: /jobs/
Allow: /pro-suppliers/
Allow: /establishments/
Allow: /organizers/
Sitemap: https://altoha.com/sitemap.xml`;

export const PUBLIC_ROUTES = [
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

export const CWV_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000, unit: "ms", label: "LCP" },
  inp: { good: 200, poor: 500, unit: "ms", label: "INP" },
  cls: { good: 0.1, poor: 0.25, unit: "", label: "CLS" },
  fcp: { good: 1800, poor: 3000, unit: "ms", label: "FCP" },
  ttfb: { good: 800, poor: 1800, unit: "ms", label: "TTFB" },
} as const;

export function getVitalStatus(metric: keyof typeof CWV_THRESHOLDS, value: number): "good" | "needs-improvement" | "poor" {
  const t = CWV_THRESHOLDS[metric];
  if (value <= t.good) return "good";
  if (value <= t.poor) return "needs-improvement";
  return "poor";
}

export type SectionKey = "overview" | "vitals" | "keywords" | "indexing" | "crawlers" | "pages" | "devices"
  | "keyword-gaps" | "competitors" | "backlinks" | "content" | "meta" | "schema" | "technical"
  | "audit" | "crawl" | "crawl-analytics" | "internal-links" | "page-speed" | "health" | "recommendations"
  | "url-health" | "sitemap-config" | "robots-txt" | "gsc-performance" | "content-gaps";

export interface NavGroup {
  label: string;
  labelAr: string;
  icon: typeof LayoutDashboard;
  items: { key: SectionKey; label: string; labelAr: string; icon: typeof LayoutDashboard }[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Analytics", labelAr: "التحليلات", icon: BarChart3,
    items: [
      { key: "overview", label: "Overview", labelAr: "نظرة عامة", icon: LayoutDashboard },
      { key: "gsc-performance", label: "GSC Performance", labelAr: "أداء البحث", icon: TrendingUp },
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
      { key: "content-gaps", label: "Content Gaps", labelAr: "فجوات المحتوى", icon: Sparkles },
      { key: "meta", label: "Meta Config", labelAr: "إعدادات Meta", icon: Settings2 },
      { key: "schema", label: "Structured Data", labelAr: "البيانات المنظمة", icon: Code2 },
      { key: "internal-links", label: "Internal Links", labelAr: "الروابط الداخلية", icon: Link2 },
      { key: "url-health", label: "URL Health", labelAr: "صحة الروابط", icon: Route },
      { key: "sitemap-config", label: "Sitemap Config", labelAr: "إعدادات الخريطة", icon: Map },
      { key: "robots-txt", label: "robots.txt", labelAr: "robots.txt", icon: FileCode },
      { key: "technical", label: "Technical Audit", labelAr: "تدقيق تقني", icon: Shield },
      { key: "health", label: "SEO Health", labelAr: "صحة SEO", icon: CheckCircle2 },
      { key: "audit", label: "Auto Audit", labelAr: "تدقيق تلقائي", icon: Shield },
      { key: "recommendations", label: "AI Insights", labelAr: "توصيات AI", icon: Lightbulb },
    ],
  },
];

export const SECTION_KEYS = new Set<SectionKey>(NAV_GROUPS.flatMap((group) => group.items.map((item) => item.key)));

export function resolveSectionParam(value: string | null): SectionKey {
  if (value && SECTION_KEYS.has(value as SectionKey)) return value as SectionKey;
  return "overview";
}

export const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
