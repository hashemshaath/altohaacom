import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useAdTracking } from "@/hooks/useAdTracking";
import { Search, Calendar, Eye, Newspaper, Building2, ChefHat, Award, TrendingUp, Sparkles, Filter, ArrowDown, SlidersHorizontal, Home } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { toEnglishDigits } from "@/lib/formatNumber";
import { cn } from "@/lib/utils";

import { NewsHeroCard } from "@/components/news/NewsHeroCard";
import { NewsArticleCard, type NewsArticle } from "@/components/news/NewsArticleCard";
import { NewsListCard } from "@/components/news/NewsListCard";
import { NewsTrendingSidebar } from "@/components/news/NewsTrendingSidebar";
import { NewsletterCTA } from "@/components/news/NewsletterCTA";
import { NewsTagsFilter } from "@/components/news/NewsTagsFilter";
import { NewsDateRangeFilter } from "@/components/news/NewsDateRangeFilter";
import { NewsViewToggle, type ViewMode } from "@/components/news/NewsViewToggle";
import { NewsMobileFilters } from "@/components/news/NewsMobileFilters";
import { NewsActiveFilters } from "@/components/news/NewsActiveFilters";
import { NewsArchiveWidget } from "@/components/news/NewsArchiveWidget";
import { NewsReadingProgress } from "@/components/news/NewsReadingProgress";
import { NewsBreakingTicker } from "@/components/news/NewsBreakingTicker";
import { NewsReadingStats } from "@/components/news/NewsReadingStats";
import { NewsWeeklyDigest } from "@/components/news/NewsWeeklyDigest";

interface Category {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
}

interface ContentTag {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
}

const ARTICLES_PER_PAGE = 12;

const SORT_OPTIONS = [
  { value: "newest", en: "Newest First", ar: "الأحدث أولاً" },
  { value: "oldest", en: "Oldest First", ar: "الأقدم أولاً" },
  { value: "popular", en: "Most Popular", ar: "الأكثر شعبية" },
];

export default function News() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [searchParams, setSearchParams] = useSearchParams();
  useAdTracking();

  // URL-synced state
  const searchQuery = searchParams.get("q") || "";
  const activeType = searchParams.get("type") || "all";
  const selectedCategory = searchParams.get("cat") || "all";
  const sortBy = searchParams.get("sort") || "newest";
  const selectedTags = useMemo(() => {
    const t = searchParams.get("tags");
    return t ? t.split(",").filter(Boolean) : [];
  }, [searchParams]);
  const dateFrom = searchParams.get("from") || "";
  const dateTo = searchParams.get("to") || "";

  const [visibleCount, setVisibleCount] = useState(ARTICLES_PER_PAGE);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // URL setter helper
  const setParam = useCallback((key: string, value: string, defaultVal = "") => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === defaultVal) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const resetPagination = () => setVisibleCount(ARTICLES_PER_PAGE);

  const setSearchQueryParam = useCallback((v: string) => { setParam("q", v); resetPagination(); }, [setParam]);
  const handleTypeChange = useCallback((v: string) => { setParam("type", v, "all"); resetPagination(); }, [setParam]);
  const handleCategoryChange = useCallback((v: string) => { setParam("cat", v, "all"); resetPagination(); }, [setParam]);
  const handleSortChange = useCallback((v: string) => { setParam("sort", v, "newest"); resetPagination(); }, [setParam]);
  const handleToggleTag = useCallback((tagId: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const current = (next.get("tags") || "").split(",").filter(Boolean);
      const updated = current.includes(tagId) ? current.filter((t) => t !== tagId) : [...current, tagId];
      if (updated.length === 0) next.delete("tags"); else next.set("tags", updated.join(","));
      return next;
    }, { replace: true });
    resetPagination();
  }, [setSearchParams]);

  const handleDateFromChange = useCallback((v: string) => { setParam("from", v); resetPagination(); }, [setParam]);
  const handleDateToChange = useCallback((v: string) => { setParam("to", v); resetPagination(); }, [setParam]);
  const handleDateClear = useCallback(() => {
    setSearchParams((prev) => { const n = new URLSearchParams(prev); n.delete("from"); n.delete("to"); return n; }, { replace: true });
    resetPagination();
  }, [setSearchParams]);

  const handleClearAll = useCallback(() => {
    setSearchParams({}, { replace: true });
    resetPagination();
  }, [setSearchParams]);

  const handleArchiveMonthClick = useCallback((from: string, to: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("from", from);
      next.set("to", to);
      return next;
    }, { replace: true });
    setShowAdvancedFilters(true);
    resetPagination();
  }, [setSearchParams]);

  // Auto-show advanced filters if URL has them
  useEffect(() => {
    if (selectedTags.length > 0 || dateFrom || dateTo) setShowAdvancedFilters(true);
  }, [selectedTags.length, dateFrom, dateTo]);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["news-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, title_ar, slug, type, excerpt, excerpt_ar, featured_image_url, published_at, category_id, is_featured, status, view_count, author_id, created_at, event_start, event_end, event_location, event_location_ar")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data || []) as NewsArticle[];
    },
    staleTime: 1000 * 60 * 3,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["news-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("content_categories").select("id, name, name_ar, slug").limit(500);
      return (data || []) as Category[];
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["news-tags"],
    queryFn: async () => {
      const { data } = await supabase.from("content_tags").select("id, name, name_ar, slug").order("name");
      return (data || []) as ContentTag[];
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: articleTagMap = {} } = useQuery({
    queryKey: ["article-tag-map"],
    queryFn: async () => {
      const { data } = await supabase.from("article_tags").select("article_id, tag_id").limit(5000);
      const map: Record<string, string[]> = {};
      (data || []).forEach((row) => {
        if (!map[row.article_id]) map[row.article_id] = [];
        map[row.article_id].push(row.tag_id);
      });
      return map;
    },
    staleTime: 1000 * 60 * 5,
  });

  const filteredArticles = useMemo(() => {
    let result = articles.filter((article) => {
      const matchesSearch =
        searchQuery === "" ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (article.title_ar && article.title_ar.includes(searchQuery)) ||
        (article.excerpt && article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = activeType === "all" || article.type === activeType;
      const matchesCategory = selectedCategory === "all" || article.category_id === selectedCategory;
      const matchesTags = selectedTags.length === 0 ||
        (articleTagMap[article.id] && selectedTags.some((t) => articleTagMap[article.id].includes(t)));
      const pubDate = article.published_at || article.created_at;
      const matchesDateFrom = !dateFrom || pubDate >= dateFrom;
      const matchesDateTo = !dateTo || pubDate <= dateTo + "T23:59:59";
      return matchesSearch && matchesType && matchesCategory && matchesTags && matchesDateFrom && matchesDateTo;
    });

    if (sortBy === "oldest") {
      result = [...result].sort((a, b) => new Date(a.published_at || a.created_at).getTime() - new Date(b.published_at || b.created_at).getTime());
    } else if (sortBy === "popular") {
      result = [...result].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
    }
    return result;
  }, [articles, searchQuery, activeType, selectedCategory, sortBy, selectedTags, articleTagMap, dateFrom, dateTo]);

  const featuredArticles = useMemo(() => filteredArticles.filter((a) => a.is_featured), [filteredArticles]);
  const regularArticles = useMemo(() => filteredArticles.filter((a) => !a.is_featured), [filteredArticles]);
  const visibleArticles = useMemo(() => regularArticles.slice(0, visibleCount), [regularArticles, visibleCount]);
  const hasMore = visibleCount < regularArticles.length;

  const formatDate = useCallback((date: string) =>
    toEnglishDigits(format(new Date(date), "MMM dd, yyyy", { locale: isAr ? ar : enUS })),
  [isAr]);

  const typeBadgeLabel = useCallback((type: string) => {
    const map: Record<string, { en: string; ar: string }> = {
      news: { en: "News", ar: "خبر" },
      blog: { en: "Blog", ar: "مدونة" },
      exhibition: { en: "Exhibition", ar: "معرض" },
      article: { en: "Article", ar: "مقال" },
      interview: { en: "Interview", ar: "مقابلة" },
    };
    return isAr ? map[type]?.ar || type : map[type]?.en || type;
  }, [isAr]);

  const articleTypes = useMemo(() => {
    const types = new Set(articles.map((a) => a.type));
    return Array.from(types);
  }, [articles]);

  const typeTabItems = useMemo(() => {
    const base = [{ value: "all", en: "All", ar: "الكل" }];
    const typeMap: Record<string, { en: string; ar: string }> = {
      news: { en: "News", ar: "أخبار" },
      blog: { en: "Blog", ar: "مدونة" },
      exhibition: { en: "Exhibitions", ar: "معارض" },
      article: { en: "Articles", ar: "مقالات" },
      interview: { en: "Interviews", ar: "مقابلات" },
      event: { en: "Events", ar: "فعاليات" },
    };
    articleTypes.forEach((t) => {
      if (typeMap[t]) base.push({ value: t, ...typeMap[t] });
    });
    return base;
  }, [articleTypes]);

  // Type counts for badge display
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: articles.length };
    articles.forEach((a) => { counts[a.type] = (counts[a.type] || 0) + 1; });
    return counts;
  }, [articles]);

  const totalViews = useMemo(() => articles.reduce((sum, a) => sum + (a.view_count || 0), 0), [articles]);
  const resultCount = filteredArticles.length;
  const activeFilterCount = selectedTags.length + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0) + (selectedCategory !== "all" ? 1 : 0);

  // Enhanced JSON-LD
  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: isAr ? "أخبار ومقالات الطهاة" : "Culinary News & Articles",
    description: isAr
      ? "أحدث أخبار الطهاة والشركات والجمعيات في عالم فنون الطهي"
      : "Latest news about chefs, companies, and associations in the culinary world",
    url: `${window.location.origin}/news`,
    numberOfItems: articles.length,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: articles.length,
      itemListElement: articles.slice(0, 10).map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${window.location.origin}/news/${a.slug}`,
        name: a.title,
      })),
    },
  }), [isAr, articles]);

  const breadcrumbItems = useMemo(() => [
    { label: "Home", labelAr: "الرئيسية", href: "/" },
    { label: "News & Articles", labelAr: "الأخبار والمقالات" },
  ], []);

  return (
    <PageShell
      title={isAr ? "أخبار ومقالات الطهاة" : "Culinary News & Articles"}
      description={isAr ? "أحدث أخبار الطهاة والشركات والجمعيات ومقالات ملهمة من عالم فنون الطهي" : "Latest culinary news about chefs, companies, associations, and inspiring articles from the food industry"}
      seoProps={{ jsonLd, keywords: isAr ? "أخبار الطهاة, مقالات طهي, أخبار المطاعم, صناعة الأغذية" : "culinary news, chef articles, food industry news, restaurant news, cooking blog" }}
      container={false}
      padding="none"
    >
      <main className="flex-1">
        <NewsReadingProgress />
        <section className="relative overflow-hidden border-b border-border/10 bg-gradient-to-b from-primary/4 via-transparent to-background" aria-labelledby="news-heading">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.06),transparent_60%)]" />
          <div className="container relative py-7 md:py-9">
            <Breadcrumbs items={breadcrumbItems} className="mb-3" />

            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-2.5 py-1 ring-1 ring-primary/15">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-primary">
                    {isAr ? "مركز الأخبار" : "News Center"}
                  </span>
                </div>
                <h1 id="news-heading" className="font-serif text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
                  {isAr ? "أخبار ومقالات عالم الطهي" : "Culinary News & Insights"}
                </h1>
                <p className="text-muted-foreground/70 text-sm leading-relaxed max-w-xl">
                  {isAr
                    ? "اكتشف آخر أخبار الطهاة، الشركات، والجمعيات المهنية."
                    : "Discover the latest about chefs, companies, and culinary associations."}
                </p>
              </div>

              <div className="flex gap-1.5">
                {[
                  { icon: Newspaper, value: articles.length, label: isAr ? "مقال" : "Articles", color: "text-primary", bg: "bg-primary/8" },
                  { icon: Eye, value: totalViews.toLocaleString(), label: isAr ? "مشاهدة" : "Views", color: "text-chart-2", bg: "bg-chart-2/8" },
                  { icon: Sparkles, value: featuredArticles.length, label: isAr ? "مميز" : "Featured", color: "text-chart-4", bg: "bg-chart-4/8" },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col items-center rounded-xl bg-card/50 px-3 py-2 min-w-[64px] border border-border/10">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${stat.bg} mb-0.5`}>
                      <stat.icon className={`h-3 w-3 ${stat.color}`} />
                    </div>
                    <span className="text-sm font-bold leading-none tabular-nums">{stat.value}</span>
                    <span className="text-[10px] text-muted-foreground/50 mt-0.5">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mt-4">
              {[
                { icon: ChefHat, en: "Chefs", ar: "الطهاة" },
                { icon: Building2, en: "Companies", ar: "الشركات" },
                { icon: Award, en: "Associations", ar: "الجمعيات" },
              ].map((topic) => (
                <Badge key={topic.en} variant="outline" className="gap-1 px-2 py-0.5 text-[11px] rounded-md border-border/15 bg-card/30 cursor-default">
                  <topic.icon className="h-2.5 w-2.5 text-primary/40" />
                  {isAr ? topic.ar : topic.en}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Breaking News Ticker */}
        <NewsBreakingTicker isAr={isAr} />

        <div className="container py-5 md:py-6">
          {/* ─── Sticky Filters ─── */}
          <div className="sticky top-12 z-40 -mx-4 mb-5 border-b border-border/10 bg-background/90 px-4 py-2 backdrop-blur-xl md:rounded-xl md:border md:border-border/10 md:px-3.5 md:shadow-sm">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
                <Input
                  placeholder={isAr ? "ابحث في الأخبار..." : "Search articles..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQueryParam(e.target.value)}
                  className="h-9 border-border/20 bg-muted/15 ps-9 rounded-lg text-sm focus:ring-primary/15"
                  aria-label={isAr ? "البحث" : "Search"}
                />
              </div>

              {/* Desktop-only dropdowns */}
              <div className="hidden lg:contents">
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="h-9 w-full border-border/20 bg-muted/15 rounded-lg sm:w-40 text-sm" aria-label={isAr ? "التصنيف" : "Category"}>
                    <SelectValue placeholder={isAr ? "التصنيف" : "Category"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="all">{isAr ? "جميع التصنيفات" : "All Categories"}</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {isAr && cat.name_ar ? cat.name_ar : cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="h-9 w-full border-border/20 bg-muted/15 rounded-lg sm:w-36 text-sm" aria-label={isAr ? "ترتيب" : "Sort"}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {isAr ? opt.ar : opt.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant={showAdvancedFilters ? "default" : "ghost"}
                  size="sm"
                  className="rounded-lg gap-1.5 h-9 shrink-0 relative text-sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {isAr ? "فلاتر" : "Filters"}
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </div>

              {/* Mobile filter sheet */}
              <NewsMobileFilters
                isAr={isAr}
                activeFilterCount={activeFilterCount}
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
                sortBy={sortBy}
                onSortChange={handleSortChange}
                sortOptions={SORT_OPTIONS}
                tags={tags}
                selectedTags={selectedTags}
                onToggleTag={handleToggleTag}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={handleDateFromChange}
                onDateToChange={handleDateToChange}
                onDateClear={handleDateClear}
                onClearAll={handleClearAll}
              />

              {/* View Toggle */}
              <NewsViewToggle mode={viewMode} onChange={setViewMode} />
            </div>

            {/* Desktop Advanced Filters Panel */}
            {showAdvancedFilters && (
              <div className="hidden lg:block mt-2.5 pt-2.5 border-t border-border/10 space-y-2.5">
                {tags.length > 0 && (
                  <NewsTagsFilter tags={tags} selectedTags={selectedTags} onToggleTag={handleToggleTag} isAr={isAr} />
                )}
                <div className="flex flex-wrap items-center gap-3">
                  <NewsDateRangeFilter
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    onDateFromChange={handleDateFromChange}
                    onDateToChange={handleDateToChange}
                    onClear={handleDateClear}
                    isAr={isAr}
                  />
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" className="rounded-lg text-xs text-muted-foreground hover:text-destructive" onClick={handleClearAll}>
                      {isAr ? "مسح الفلاتر" : "Clear all"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ─── Active Filter Chips ─── */}
          <NewsActiveFilters
            isAr={isAr}
            searchQuery={searchQuery}
            onClearSearch={() => setParam("q", "")}
            selectedCategory={selectedCategory}
            categories={categories}
            onClearCategory={() => handleCategoryChange("all")}
            selectedTags={selectedTags}
            tags={tags}
            onRemoveTag={handleToggleTag}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onClearDates={handleDateClear}
            onClearAll={handleClearAll}
          />

          {/* ─── Tabs ─── */}
          <Tabs value={activeType} onValueChange={handleTypeChange} className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <TabsList className="h-auto w-auto justify-start gap-0.5 overflow-x-auto overflow-y-hidden whitespace-nowrap rounded-xl border border-border/15 bg-muted/20 p-1" aria-label={isAr ? "فلترة حسب النوع" : "Filter by type"}>
                {typeTabItems.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-lg px-3 py-1.5 text-[12px] font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm sm:text-[13px] gap-1"
                  >
                    {isAr ? tab.ar : tab.en}
                    {typeCounts[tab.value] != null && (
                      <span className="text-[10px] opacity-50 tabular-nums">({typeCounts[tab.value]})</span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
              {!isLoading && (
                <span className="hidden sm:inline text-xs text-muted-foreground shrink-0">
                  {resultCount} {isAr ? "نتيجة" : "results"}
                </span>
              )}
            </div>

            <TabsContent value={activeType} className="mt-6">
              {isLoading ? (
                <div className={cn(
                  viewMode === "grid"
                    ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                    : "space-y-4"
                )}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="overflow-hidden rounded-2xl" aria-hidden>
                      {viewMode === "grid" ? (
                        <>
                          <Skeleton className="aspect-video w-full" />
                          <CardContent className="space-y-2 p-5">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-1/3" />
                          </CardContent>
                        </>
                      ) : (
                        <div className="flex gap-4 p-4">
                          <Skeleton className="h-28 w-44 rounded-xl shrink-0 hidden sm:block" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-1/3" />
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : filteredArticles.length === 0 ? (
                <Card className="border-border/40 rounded-2xl">
                  <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                      <Newspaper className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <h3 className="mb-1 text-lg font-semibold">{isAr ? "لا توجد مقالات" : "No articles found"}</h3>
                    <p className="max-w-sm text-sm text-muted-foreground">
                      {searchQuery || selectedTags.length > 0 || dateFrom || dateTo
                        ? (isAr ? "جرّب تعديل الفلاتر أو كلمات البحث" : "Try adjusting your filters or search terms")
                        : (isAr ? "لا توجد مقالات منشورة حالياً" : "No published articles yet")}
                    </p>
                    {activeFilterCount > 0 && (
                      <Button variant="outline" size="sm" className="mt-4 rounded-xl" onClick={handleClearAll}>
                        {isAr ? "مسح جميع الفلاتر" : "Clear all filters"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* ─── Featured Hero ─── */}
                  {featuredArticles.length > 0 && activeType === "all" && sortBy === "newest" && (
                    <section className="mb-10" aria-label={isAr ? "مقالات مميزة" : "Featured articles"}>
                      <div className="mb-5 flex items-center gap-3">
                        <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-bold uppercase tracking-wider text-primary">
                            {isAr ? "المميز" : "Featured"}
                          </span>
                        </div>
                        <div className="h-px flex-1 bg-border/40" aria-hidden />
                      </div>
                      <div className="grid gap-5 md:grid-cols-5">
                        <div className="md:col-span-3">
                          <NewsHeroCard article={featuredArticles[0]} isAr={isAr} formatDate={formatDate} typeBadgeLabel={typeBadgeLabel} />
                        </div>
                        {featuredArticles.length > 1 && (
                          <div className="md:col-span-2 flex flex-col gap-4">
                            {featuredArticles.slice(1, 4).map((article) => (
                              <NewsArticleCard key={article.id} article={article} isAr={isAr} formatDate={formatDate} typeBadgeLabel={typeBadgeLabel} compact />
                            ))}
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {/* ─── Main Content + Sidebar ─── */}
                  <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
                    {/* Articles */}
                    <div>
                      <div className={cn(
                        viewMode === "grid"
                          ? "grid gap-5 sm:grid-cols-2"
                          : "space-y-4"
                      )} role="list">
                        {visibleArticles.map((article) =>
                          viewMode === "grid" ? (
                            <NewsArticleCard key={article.id} article={article} isAr={isAr} formatDate={formatDate} typeBadgeLabel={typeBadgeLabel} />
                          ) : (
                            <NewsListCard key={article.id} article={article} isAr={isAr} formatDate={formatDate} typeBadgeLabel={typeBadgeLabel} />
                          )
                        )}
                      </div>

                      {/* Load More */}
                      {hasMore && (
                        <div className="mt-8 flex justify-center">
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => setVisibleCount((prev) => prev + ARTICLES_PER_PAGE)}
                            className="rounded-2xl gap-2 px-8 border-border/40 hover:bg-primary/5"
                          >
                            <ArrowDown className="h-4 w-4" />
                            {isAr ? `عرض المزيد (${regularArticles.length - visibleCount} متبقي)` : `Load More (${regularArticles.length - visibleCount} remaining)`}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Sidebar */}
                    <aside className="hidden lg:block space-y-4">
                      <NewsReadingStats isAr={isAr} />
                      <NewsWeeklyDigest articles={articles} isAr={isAr} />
                      <NewsTrendingSidebar articles={articles} isAr={isAr} />
                      <NewsArchiveWidget articles={articles} isAr={isAr} onMonthClick={handleArchiveMonthClick} />
                      <NewsletterCTA isAr={isAr} />

                      {/* Category Quick Links */}
                      {categories.length > 0 && (
                        <Card className="rounded-xl border-border/15">
                          <CardContent className="p-4">
                            <h3 className="text-[13px] font-semibold mb-2.5 flex items-center gap-1.5">
                              <Filter className="h-3.5 w-3.5 text-muted-foreground/50" />
                              {isAr ? "التصنيفات" : "Categories"}
                            </h3>
                            <div className="flex flex-wrap gap-1">
                              {categories.map((cat) => (
                                <Badge
                                  key={cat.id}
                                  variant={selectedCategory === cat.id ? "default" : "outline"}
                                  className={cn(
                                    "cursor-pointer rounded-md text-[11px] transition-colors",
                                    selectedCategory === cat.id
                                      ? "bg-primary text-primary-foreground"
                                      : "border-border/15 hover:bg-primary/5"
                                  )}
                                  onClick={() => handleCategoryChange(selectedCategory === cat.id ? "all" : cat.id)}
                                >
                                  {isAr && cat.name_ar ? cat.name_ar : cat.name}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Sidebar Tags */}
                      {tags.length > 0 && (
                        <Card className="rounded-xl border-border/15">
                          <CardContent className="p-4">
                            <h3 className="text-[13px] font-semibold mb-2.5 flex items-center gap-1.5">
                              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground/50" />
                              {isAr ? "الوسوم" : "Tags"}
                            </h3>
                            <div className="flex flex-wrap gap-1">
                              {tags.slice(0, 15).map((tag) => (
                                <Badge
                                  key={tag.id}
                                  variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                                  className={cn(
                                    "cursor-pointer rounded-md text-[11px] transition-colors",
                                    selectedTags.includes(tag.id)
                                      ? "bg-primary text-primary-foreground"
                                      : "border-border/15 hover:bg-primary/5"
                                  )}
                                  onClick={() => handleToggleTag(tag.id)}
                                >
                                  {isAr && tag.name_ar ? tag.name_ar : tag.name}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </aside>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </PageShell>
  );
}
