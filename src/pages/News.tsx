import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAdTracking } from "@/hooks/useAdTracking";
import { Search, Calendar, Eye, Newspaper, Building2, ChefHat, Award, TrendingUp, Sparkles, Filter, ArrowDown } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { toEnglishDigits } from "@/lib/formatNumber";
import { cn } from "@/lib/utils";

import { NewsHeroCard } from "@/components/news/NewsHeroCard";
import { NewsArticleCard, type NewsArticle } from "@/components/news/NewsArticleCard";
import { NewsTrendingSidebar } from "@/components/news/NewsTrendingSidebar";
import { NewsletterCTA } from "@/components/news/NewsletterCTA";

interface Category {
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
  useAdTracking();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(ARTICLES_PER_PAGE);

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
      const { data } = await supabase.from("content_categories").select("id, name, name_ar, slug");
      return (data || []) as Category[];
    },
    staleTime: 1000 * 60 * 10,
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
      return matchesSearch && matchesType && matchesCategory;
    });

    // Sort
    if (sortBy === "oldest") {
      result = [...result].sort((a, b) => new Date(a.published_at || a.created_at).getTime() - new Date(b.published_at || b.created_at).getTime());
    } else if (sortBy === "popular") {
      result = [...result].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
    }
    // "newest" is default from query

    return result;
  }, [articles, searchQuery, activeType, selectedCategory, sortBy]);

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

  // Unique types from articles
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

  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: isAr ? "أخبار ومقالات الطهاة" : "Culinary News & Articles",
    description: isAr
      ? "أحدث أخبار الطهاة والشركات والجمعيات في عالم فنون الطهي"
      : "Latest news about chefs, companies, and associations in the culinary world",
    url: `${window.location.origin}/news`,
  }), [isAr]);

  const totalViews = useMemo(() => articles.reduce((sum, a) => sum + (a.view_count || 0), 0), [articles]);
  const resultCount = filteredArticles.length;

  const handleLoadMore = () => setVisibleCount((prev) => prev + ARTICLES_PER_PAGE);

  // Reset pagination when filters change
  const handleTypeChange = (v: string) => { setActiveType(v); setVisibleCount(ARTICLES_PER_PAGE); };
  const handleCategoryChange = (v: string) => { setSelectedCategory(v); setVisibleCount(ARTICLES_PER_PAGE); };
  const handleSortChange = (v: string) => { setSortBy(v); setVisibleCount(ARTICLES_PER_PAGE); };

  return (
    <PageShell
      title={isAr ? "أخبار ومقالات الطهاة" : "Culinary News & Articles"}
      description={isAr ? "أحدث أخبار الطهاة والشركات والجمعيات ومقالات ملهمة من عالم فنون الطهي" : "Latest culinary news about chefs, companies, associations, and inspiring articles from the food industry"}
      seoProps={{ jsonLd, keywords: isAr ? "أخبار الطهاة, مقالات طهي, أخبار المطاعم, صناعة الأغذية" : "culinary news, chef articles, food industry news, restaurant news, cooking blog" }}
      container={false}
      padding="none"
    >
      <main className="flex-1">
        {/* ─── Hero ─── */}
        <section className="relative overflow-hidden border-b border-border/30 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-background" aria-labelledby="news-heading">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_70%)]" />
          <div className="container relative py-10 md:py-14">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 ring-1 ring-primary/20 backdrop-blur-sm">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    {isAr ? "مركز الأخبار" : "News Center"}
                  </span>
                </div>
                <h1 id="news-heading" className="font-serif text-3xl font-bold tracking-tight md:text-5xl">
                  {isAr ? "أخبار ومقالات عالم الطهي" : "Culinary News & Insights"}
                </h1>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-xl">
                  {isAr
                    ? "اكتشف آخر أخبار الطهاة، الشركات، والجمعيات المهنية مع مقالات ملهمة وقصص نجاح من مختلف أنحاء العالم."
                    : "Discover the latest about chefs, companies, and culinary associations — with inspiring articles and success stories from around the globe."}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-3">
                {[
                  { icon: Newspaper, value: articles.length, label: isAr ? "مقال" : "Articles" },
                  { icon: Eye, value: totalViews.toLocaleString(), label: isAr ? "مشاهدة" : "Views" },
                  { icon: Sparkles, value: featuredArticles.length, label: isAr ? "مميز" : "Featured" },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col items-center rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm px-4 py-3 min-w-[80px]">
                    <stat.icon className="h-4 w-4 text-primary/60 mb-1" />
                    <span className="text-lg font-bold">{stat.value}</span>
                    <span className="text-[9px] text-muted-foreground">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Topic pills */}
            <div className="flex flex-wrap gap-2 mt-6">
              {[
                { icon: ChefHat, en: "Chefs", ar: "الطهاة" },
                { icon: Building2, en: "Companies", ar: "الشركات" },
                { icon: Award, en: "Associations", ar: "الجمعيات" },
              ].map((topic) => (
                <Badge key={topic.en} variant="outline" className="gap-1.5 px-3 py-1.5 text-xs rounded-xl border-border/40 bg-background/60 backdrop-blur-sm cursor-default hover:bg-primary/5 transition-colors">
                  <topic.icon className="h-3 w-3" />
                  {isAr ? topic.ar : topic.en}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        <div className="container py-6 md:py-8">
          {/* ─── Sticky Filters ─── */}
          <div className="sticky top-12 z-40 -mx-4 mb-8 border-y border-border/30 bg-background/70 px-4 py-3 backdrop-blur-xl md:rounded-2xl md:border md:px-5 md:shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  placeholder={isAr ? "ابحث في الأخبار والمقالات..." : "Search news & articles..."}
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(ARTICLES_PER_PAGE); }}
                  className="h-10 border-border/40 bg-muted/20 ps-10 rounded-xl focus:ring-primary/20"
                  aria-label={isAr ? "البحث" : "Search"}
                />
              </div>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="h-10 w-full border-border/40 bg-muted/20 rounded-xl sm:w-44" aria-label={isAr ? "التصنيف" : "Category"}>
                  <SelectValue placeholder={isAr ? "التصنيف" : "Category"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">{isAr ? "جميع التصنيفات" : "All Categories"}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {isAr && cat.name_ar ? cat.name_ar : cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="h-10 w-full border-border/40 bg-muted/20 rounded-xl sm:w-40" aria-label={isAr ? "ترتيب" : "Sort"}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {isAr ? opt.ar : opt.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ─── Tabs ─── */}
          <Tabs value={activeType} onValueChange={handleTypeChange} className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <TabsList className="h-auto w-auto justify-start gap-1 overflow-x-auto overflow-y-hidden whitespace-nowrap rounded-2xl border border-border/40 bg-muted/30 p-1.5" aria-label={isAr ? "فلترة حسب النوع" : "Filter by type"}>
                {typeTabItems.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm sm:text-sm"
                  >
                    {isAr ? tab.ar : tab.en}
                  </TabsTrigger>
                ))}
              </TabsList>
              {/* Result count */}
              {!isLoading && (
                <span className="hidden sm:inline text-xs text-muted-foreground shrink-0">
                  {resultCount} {isAr ? "نتيجة" : "results"}
                </span>
              )}
            </div>

            <TabsContent value={activeType} className="mt-6">
              {isLoading ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="overflow-hidden rounded-2xl" aria-hidden>
                      <Skeleton className="aspect-video w-full" />
                      <CardContent className="space-y-2 p-5">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-1/3" />
                      </CardContent>
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
                      {searchQuery
                        ? (isAr ? "جرّب كلمات بحث مختلفة" : "Try different search terms")
                        : (isAr ? "لا توجد مقالات منشورة حالياً" : "No published articles yet")}
                    </p>
                    {searchQuery && (
                      <Button variant="outline" size="sm" className="mt-4 rounded-xl" onClick={() => setSearchQuery("")}>
                        {isAr ? "مسح البحث" : "Clear search"}
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
                    {/* Articles Grid */}
                    <div>
                      <div className="grid gap-5 sm:grid-cols-2" role="list">
                        {visibleArticles.map((article) => (
                          <NewsArticleCard key={article.id} article={article} isAr={isAr} formatDate={formatDate} typeBadgeLabel={typeBadgeLabel} />
                        ))}
                      </div>

                      {/* Load More */}
                      {hasMore && (
                        <div className="mt-8 flex justify-center">
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={handleLoadMore}
                            className="rounded-2xl gap-2 px-8 border-border/40 hover:bg-primary/5"
                          >
                            <ArrowDown className="h-4 w-4" />
                            {isAr ? `عرض المزيد (${regularArticles.length - visibleCount} متبقي)` : `Load More (${regularArticles.length - visibleCount} remaining)`}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Sidebar */}
                    <aside className="hidden lg:block space-y-6">
                      <NewsTrendingSidebar articles={articles} isAr={isAr} />
                      <NewsletterCTA isAr={isAr} />

                      {/* Category Quick Links */}
                      {categories.length > 0 && (
                        <Card className="rounded-2xl border-border/40">
                          <CardContent className="p-5">
                            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                              <Filter className="h-4 w-4 text-muted-foreground" />
                              {isAr ? "التصنيفات" : "Categories"}
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                              {categories.map((cat) => (
                                <Badge
                                  key={cat.id}
                                  variant={selectedCategory === cat.id ? "default" : "outline"}
                                  className={cn(
                                    "cursor-pointer rounded-lg text-[10px] transition-colors",
                                    selectedCategory === cat.id
                                      ? "bg-primary text-primary-foreground"
                                      : "border-border/40 hover:bg-primary/5"
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
