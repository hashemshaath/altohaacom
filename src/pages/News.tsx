import { useState, useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { AdBanner } from "@/components/ads/AdBanner";
import { useAdTracking } from "@/hooks/useAdTracking";
import { Search, Calendar, Eye, Newspaper, Building2, ChefHat, Award, TrendingUp } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [articlesRes, categoriesRes] = await Promise.all([
        supabase
          .from("articles")
          .select("*")
          .eq("status", "published")
          .order("published_at", { ascending: false }),
        supabase.from("content_categories").select("*"),
      ]);
      if (articlesRes.data) setArticles(articlesRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead
        title={isAr ? "أخبار ومقالات الطهاة | Altoha" : "Culinary News & Articles | Altoha"}
        description={isAr ? "أحدث أخبار الطهاة والشركات والجمعيات ومقالات ملهمة من عالم فنون الطهي" : "Latest culinary news about chefs, companies, associations, and inspiring articles from the food industry"}
        jsonLd={jsonLd}
      />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border/40 bg-gradient-to-b from-primary/5 to-background" aria-labelledby="news-heading">
          <div className="container py-8 md:py-12">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 ring-1 ring-primary/20">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    {isAr ? "مركز الأخبار" : "News Center"}
                  </span>
                </div>
                <h1 id="news-heading" className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
                  {isAr ? "أخبار ومقالات عالم الطهي" : "Culinary News & Insights"}
                </h1>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  {isAr
                    ? "اكتشف آخر أخبار الطهاة، الشركات، والجمعيات المهنية مع مقالات ملهمة وقصص نجاح من مختلف أنحاء العالم."
                    : "Discover the latest about chefs, companies, and culinary associations — with inspiring articles and success stories from around the globe."}
                </p>
              </div>
              {/* Quick topic pills */}
              <div className="flex flex-wrap gap-2 self-start md:self-auto">
                {[
                  { icon: ChefHat, en: "Chefs", ar: "الطهاة" },
                  { icon: Building2, en: "Companies", ar: "الشركات" },
                  { icon: Award, en: "Associations", ar: "الجمعيات" },
                ].map((topic) => (
                  <Badge key={topic.en} variant="outline" className="gap-1.5 px-3 py-1.5 text-xs cursor-default">
                    <topic.icon className="h-3 w-3" />
                    {isAr ? topic.ar : topic.en}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="container py-4 md:py-6">
          {/* Sticky Filters */}
          <div className="sticky top-12 z-40 -mx-4 mb-8 border-y border-border/40 bg-background/80 px-4 py-3 backdrop-blur-md md:rounded-2xl md:border md:px-5">
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
            <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto overflow-y-hidden whitespace-nowrap rounded-xl border border-border/40 bg-muted/30 p-1" aria-label={isAr ? "فلترة حسب النوع" : "Filter by type"}>
              {[
                { value: "all", en: "All", ar: "الكل" },
                { value: "news", en: "News", ar: "أخبار" },
                { value: "blog", en: "Blog", ar: "مدونة" },
                { value: "exhibition", en: "Exhibitions", ar: "معارض" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm sm:text-sm"
                >
                  {isAr ? tab.ar : tab.en}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeType} className="mt-6">
              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="overflow-hidden" aria-hidden>
                      <Skeleton className="aspect-video w-full" />
                      <CardContent className="space-y-2 p-4">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-1/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredArticles.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                      <Newspaper className="h-7 w-7 text-muted-foreground/40" />
                    </div>
                    <h3 className="mb-1 text-lg font-semibold">{isAr ? "لا توجد مقالات" : "No articles found"}</h3>
                    <p className="max-w-sm text-sm text-muted-foreground">
                      {searchQuery
                        ? (isAr ? "جرّب كلمات بحث مختلفة" : "Try different search terms")
                        : (isAr ? "لا توجد مقالات منشورة حالياً" : "No published articles yet")}
                    </p>
                    {searchQuery && (
                      <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearchQuery("")}>
                        {isAr ? "مسح البحث" : "Clear search"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Featured */}
                  {featuredArticles.length > 0 && (
                    <section className="mb-10" aria-label={isAr ? "مقالات مميزة" : "Featured articles"}>
                      <div className="mb-4 flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                          {isAr ? "المميز" : "Featured"}
                        </Badge>
                        <div className="h-px flex-1 bg-border/50" aria-hidden />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        {featuredArticles.slice(0, 2).map((article) => (
                          <ArticleCard key={article.id} article={article} isAr={isAr} formatDate={formatDate} featured typeBadgeLabel={typeBadgeLabel} />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Regular grid */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
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
      <Footer />
    </div>
  );
}

/* ─── Article Card ─────────────────────────────────────────── */
function ArticleCard({
  article,
  isAr,
  formatDate,
  featured,
  typeBadgeLabel,
}: {
  article: Article;
  isAr: boolean;
  formatDate: (d: string) => string;
  featured?: boolean;
  typeBadgeLabel: (t: string) => string;
}) {
  const title = isAr && article.title_ar ? article.title_ar : article.title;
  const excerpt = isAr && article.excerpt_ar ? article.excerpt_ar : article.excerpt;
  const TypeIcon = TYPE_ICONS[article.type] || Newspaper;

  return (
    <Link to={`/news/${article.slug}`} className="group block" role="listitem">
      <article>
        <Card className="h-full overflow-hidden border-border/50 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/20 flex flex-col">
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
            <Badge className="absolute start-2.5 top-2.5 gap-1 text-[10px]" variant="secondary">
              <TypeIcon className="h-2.5 w-2.5" />
              {typeBadgeLabel(article.type)}
            </Badge>
          </div>
          <CardContent className={`flex flex-1 flex-col ${featured ? "p-5" : "p-4"}`}>
            <h3 className={`mb-1.5 font-semibold line-clamp-2 group-hover:text-primary transition-colors ${featured ? "text-lg" : "text-sm"}`}>
              {title}
            </h3>
            {excerpt && (
              <p className="mb-3 flex-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{excerpt}</p>
            )}
            {article.type === "exhibition" && article.event_start && (
              <div className="mb-3 rounded-lg bg-muted/50 p-2 text-xs">
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
            <div className="flex items-center justify-between border-t pt-3 text-[11px] text-muted-foreground mt-auto">
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
