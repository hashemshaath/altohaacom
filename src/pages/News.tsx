import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SEOHead } from "@/components/SEOHead";
import { useAdTracking } from "@/hooks/useAdTracking";
import { Search, Calendar, Eye, Newspaper, Building2, ChefHat, Award, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
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
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { toEnglishDigits } from "@/lib/formatNumber";
import { cn } from "@/lib/utils";

interface Article {
  id: string;
  title: string;
  title_ar: string | null;
  slug: string;
  excerpt: string | null;
  excerpt_ar: string | null;
  type: string;
  featured_image_url: string | null;
  is_featured: boolean;
  view_count: number;
  published_at: string | null;
  created_at: string;
  category_id: string | null;
  author_id: string | null;
  event_start: string | null;
  event_end: string | null;
  event_location: string | null;
  event_location_ar: string | null;
}

interface Category {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
  type: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  news: Newspaper,
  blog: TrendingUp,
  exhibition: Award,
};

export default function News() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  useAdTracking();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["news-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Article[];
    },
    staleTime: 1000 * 60 * 3,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["news-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("content_categories").select("*");
      return (data || []) as Category[];
    },
    staleTime: 1000 * 60 * 10,
  });

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      searchQuery === "" ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.title_ar && article.title_ar.includes(searchQuery)) ||
      (article.excerpt && article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = activeType === "all" || article.type === activeType;
    const matchesCategory = selectedCategory === "all" || article.category_id === selectedCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const featuredArticles = filteredArticles.filter((a) => a.is_featured);
  const regularArticles = filteredArticles.filter((a) => !a.is_featured);

  const formatDate = (date: string) =>
    toEnglishDigits(format(new Date(date), "MMM dd, yyyy", { locale: isAr ? ar : enUS }));

  const typeBadgeLabel = (type: string) => {
    const map: Record<string, { en: string; ar: string }> = {
      news: { en: "News", ar: "خبر" },
      blog: { en: "Blog", ar: "مدونة" },
      exhibition: { en: "Exhibition", ar: "معرض" },
    };
    return isAr ? map[type]?.ar || type : map[type]?.en || type;
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: isAr ? "أخبار ومقالات الطهاة" : "Culinary News & Articles",
    description: isAr
      ? "أحدث أخبار الطهاة والشركات والجمعيات في عالم فنون الطهي"
      : "Latest news about chefs, companies, and associations in the culinary world",
    url: `${window.location.origin}/news`,
  };

  // Stats
  const totalViews = articles.reduce((sum, a) => sum + (a.view_count || 0), 0);

  return (
    <PageShell
      title={isAr ? "أخبار ومقالات الطهاة" : "Culinary News & Articles"}
      description={isAr ? "أحدث أخبار الطهاة والشركات والجمعيات ومقالات ملهمة من عالم فنون الطهي" : "Latest culinary news about chefs, companies, associations, and inspiring articles from the food industry"}
      seoProps={{ jsonLd }}
      container={false}
      padding="none"
    >

      <main className="flex-1">
        {/* Hero */}
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
          {/* Sticky Filters */}
          <div className="sticky top-12 z-40 -mx-4 mb-8 border-y border-border/30 bg-background/70 px-4 py-3 backdrop-blur-xl md:rounded-2xl md:border md:px-5 md:shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  placeholder={isAr ? "ابحث في الأخبار والمقالات..." : "Search news & articles..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 border-border/40 bg-muted/20 ps-10 rounded-xl focus:ring-primary/20"
                  aria-label={isAr ? "البحث" : "Search"}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeType} onValueChange={setActiveType} className="space-y-6">
            <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto overflow-y-hidden whitespace-nowrap rounded-2xl border border-border/40 bg-muted/30 p-1.5" aria-label={isAr ? "فلترة حسب النوع" : "Filter by type"}>
              {[
                { value: "all", en: "All", ar: "الكل" },
                { value: "news", en: "News", ar: "أخبار" },
                { value: "blog", en: "Blog", ar: "مدونة" },
                { value: "exhibition", en: "Exhibitions", ar: "معارض" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm sm:text-sm"
                >
                  {isAr ? tab.ar : tab.en}
                </TabsTrigger>
              ))}
            </TabsList>

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
                  {/* Featured Hero */}
                  {featuredArticles.length > 0 && (
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

                      {/* Featured: first large, rest in sidebar */}
                      <div className="grid gap-5 md:grid-cols-5">
                        {/* Main featured */}
                        <div className="md:col-span-3">
                          <FeaturedHeroCard article={featuredArticles[0]} isAr={isAr} formatDate={formatDate} typeBadgeLabel={typeBadgeLabel} />
                        </div>
                        {/* Side stack */}
                        {featuredArticles.length > 1 && (
                          <div className="md:col-span-2 flex flex-col gap-4">
                            {featuredArticles.slice(1, 4).map((article) => (
                              <ArticleCard key={article.id} article={article} isAr={isAr} formatDate={formatDate} typeBadgeLabel={typeBadgeLabel} compact />
                            ))}
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Regular grid */}
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="list">
                    {regularArticles.map((article) => (
                      <ArticleCard key={article.id} article={article} isAr={isAr} formatDate={formatDate} typeBadgeLabel={typeBadgeLabel} />
                    ))}
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

/* ─── Featured Hero Card ─────────────────────────────────────── */
function FeaturedHeroCard({
  article,
  isAr,
  formatDate,
  typeBadgeLabel,
}: {
  article: Article;
  isAr: boolean;
  formatDate: (d: string) => string;
  typeBadgeLabel: (t: string) => string;
}) {
  const title = isAr && article.title_ar ? article.title_ar : article.title;
  const excerpt = isAr && article.excerpt_ar ? article.excerpt_ar : article.excerpt;
  const TypeIcon = TYPE_ICONS[article.type] || Newspaper;

  return (
    <Link to={`/news/${article.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden rounded-2xl border-border/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 relative">
        <div className="relative aspect-[16/10] overflow-hidden">
          {article.featured_image_url ? (
            <img
              src={article.featured_image_url}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5">
              <TypeIcon className="h-16 w-16 text-primary/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
          <Badge className="absolute start-4 top-4 gap-1.5 text-[10px] rounded-xl" variant="secondary">
            <TypeIcon className="h-3 w-3" />
            {typeBadgeLabel(article.type)}
          </Badge>
        </div>
        <div className="absolute bottom-0 inset-x-0 p-5 md:p-6">
          <h3 className="text-xl md:text-2xl font-bold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          {excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{excerpt}</p>
          )}
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(article.published_at || article.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {article.view_count}
            </span>
            <span className="ms-auto flex items-center gap-1 text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              {isAr ? "اقرأ المزيد" : "Read more"}
              <ArrowRight className="h-3 w-3 rtl:rotate-180" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

/* ─── Article Card ─────────────────────────────────────────── */
function ArticleCard({
  article,
  isAr,
  formatDate,
  typeBadgeLabel,
  compact,
}: {
  article: Article;
  isAr: boolean;
  formatDate: (d: string) => string;
  typeBadgeLabel: (t: string) => string;
  compact?: boolean;
}) {
  const title = isAr && article.title_ar ? article.title_ar : article.title;
  const excerpt = isAr && article.excerpt_ar ? article.excerpt_ar : article.excerpt;
  const TypeIcon = TYPE_ICONS[article.type] || Newspaper;

  if (compact) {
    return (
      <Link to={`/news/${article.slug}`} className="group block" role="listitem">
        <article>
          <Card className="h-full overflow-hidden rounded-2xl border-border/40 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/20">
            <div className="flex gap-3 p-3">
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
                {article.featured_image_url ? (
                  <img src={article.featured_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <TypeIcon className="h-6 w-6 text-primary/20" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between min-w-0">
                <div>
                  <Badge variant="secondary" className="text-[8px] rounded-md gap-1 mb-1.5 px-1.5 py-0">
                    <TypeIcon className="h-2 w-2" />
                    {typeBadgeLabel(article.type)}
                  </Badge>
                  <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">{title}</h3>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" />
                    {formatDate(article.published_at || article.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-2.5 w-2.5" />
                    {article.view_count}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </article>
      </Link>
    );
  }

  return (
    <Link to={`/news/${article.slug}`} className="group block" role="listitem">
      <article>
        <Card className="h-full overflow-hidden rounded-2xl border-border/40 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 flex flex-col">
          <div className="relative aspect-video overflow-hidden bg-muted">
            {article.featured_image_url ? (
              <img
                src={article.featured_image_url}
                alt={title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <TypeIcon className="h-10 w-10 text-primary/20" />
              </div>
            )}
            <Badge className="absolute start-3 top-3 gap-1 text-[10px] rounded-xl" variant="secondary">
              <TypeIcon className="h-2.5 w-2.5" />
              {typeBadgeLabel(article.type)}
            </Badge>
          </div>
          <CardContent className="flex flex-1 flex-col p-5">
            <h3 className="mb-2 text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
            {excerpt && (
              <p className="mb-3 flex-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{excerpt}</p>
            )}
            {article.type === "exhibition" && article.event_start && (
              <div className="mb-3 rounded-xl bg-muted/50 p-2.5 text-xs">
                <p className="font-medium">
                  {formatDate(article.event_start)}
                  {article.event_end && ` – ${formatDate(article.event_end)}`}
                </p>
                {article.event_location && (
                  <p className="text-muted-foreground">
                    {isAr && article.event_location_ar ? article.event_location_ar : article.event_location}
                  </p>
                )}
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border/40 pt-3 text-[11px] text-muted-foreground mt-auto">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(article.published_at || article.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {article.view_count}
              </span>
            </div>
          </CardContent>
        </Card>
      </article>
    </Link>
  );
}
