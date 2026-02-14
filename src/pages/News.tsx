import { useState, useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { AdBanner } from "@/components/ads/AdBanner";
import { AdVertical } from "@/components/ads/AdVertical";
import { useAdTracking } from "@/hooks/useAdTracking";
import { Search, Calendar, Eye, Newspaper } from "lucide-react";
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

  const formatDate = (date: string) => {
    return format(new Date(date), "MMM dd, yyyy", {
      locale: isAr ? ar : enUS,
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead
        title="News & Articles"
        description="Stay updated with the latest culinary news, competition results, and chef stories from the Altohaa community."
      />
      <Header />
      <main className="flex-1">
        <div className="container py-8 md:py-14">
          {/* Hero Header - Premium */}
          <section className="relative mb-12 overflow-hidden rounded-[2.5rem] border border-border/40 bg-card/60 backdrop-blur-sm p-10 md:p-16 shadow-2xl shadow-primary/5">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 pointer-events-none" />
            <div className="absolute -end-32 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-[120px] animate-pulse pointer-events-none" />
            <div className="absolute -bottom-32 -start-32 h-80 w-80 rounded-full bg-accent/10 blur-[120px] animate-pulse [animation-delay:1.5s] pointer-events-none" />
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            
            <div className="relative flex flex-col items-center gap-10 text-center md:flex-row md:text-start animate-fade-in">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[2.2rem] bg-gradient-to-br from-primary to-primary-variant text-primary-foreground shadow-2xl shadow-primary/30 transition-all hover:scale-110 hover:rotate-3 duration-500">
                <Newspaper className="h-12 w-12" />
              </div>
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 ring-1 ring-primary/20 backdrop-blur-sm">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    {isAr ? "مركز الأخبار العالمي" : "Global News Center"}
                  </span>
                </div>
                <h1 className="font-serif text-4xl font-black tracking-tight md:text-6xl lg:text-7xl leading-[1.1]">
                  {isAr ? "الأخبار والمقالات" : "News & Articles"}
                </h1>
                <p className="max-w-xl text-lg text-muted-foreground font-medium md:text-xl leading-relaxed">
                  {isAr
                    ? "بوابتك لكل جديد في عالم فنون الطهي، أخبار المسابقات، وقصص النجاح الملهمة."
                    : "Your gateway to culinary trends, competition updates, and inspiring chef success stories."}
                </p>
              </div>
            </div>
          </section>

          {/* Filters Bar */}
          <div className="sticky top-[64px] z-40 -mx-4 mb-10 border-y border-border/40 bg-background/80 px-4 py-4 backdrop-blur-md md:rounded-2xl md:border md:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  placeholder={isAr ? "ابحث عن مقال أو خبر..." : "Search articles or news..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 border-border/40 bg-muted/20 ps-11 transition-all focus:bg-background focus:ring-primary/20 rounded-xl"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-11 w-full border-border/40 bg-muted/20 rounded-xl sm:w-48 focus:ring-primary/20">
                  <SelectValue placeholder={isAr ? "التصنيف" : "Category"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/40">
                  <SelectItem value="all" className="rounded-lg">{isAr ? "جميع التصنيفات" : "All Categories"}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="rounded-lg">
                      {isAr && cat.name_ar ? cat.name_ar : cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeType} onValueChange={setActiveType} className="space-y-6">
            <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto overflow-y-hidden whitespace-nowrap rounded-lg border border-border/50 bg-muted/30 p-1">
              <TabsTrigger value="all" className="gap-1.5 rounded-md text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">{isAr ? "الكل" : "All"}</TabsTrigger>
              <TabsTrigger value="news" className="gap-1.5 rounded-md text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">{isAr ? "أخبار" : "News"}</TabsTrigger>
              <TabsTrigger value="blog" className="gap-1.5 rounded-md text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">{isAr ? "مدونة" : "Blog"}</TabsTrigger>
              <TabsTrigger value="exhibition" className="gap-1.5 rounded-md text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">{isAr ? "معارض" : "Exhibitions"}</TabsTrigger>
            </TabsList>

            <TabsContent value={activeType} className="mt-6">
              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="overflow-hidden">
                      <Skeleton className="aspect-video w-full" />
                      <CardContent className="space-y-2.5 p-4">
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
                    <h3 className="mb-1 text-lg font-semibold">
                      {isAr ? "لا توجد مقالات" : "No articles found"}
                    </h3>
                    <p className="max-w-sm text-sm text-muted-foreground">
                      {searchQuery
                        ? (isAr ? "جرّب كلمات بحث مختلفة" : "Try different search terms")
                        : (isAr ? "لا توجد مقالات حالياً" : "No articles available yet")}
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
                  {/* Featured Articles */}
                  {featuredArticles.length > 0 && (
                    <div className="mb-10">
                      <div className="mb-4 flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                          {isAr ? "المميز" : "Featured"}
                        </Badge>
                        <div className="h-px flex-1 bg-border/50" />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        {featuredArticles.slice(0, 2).map((article) => {
                          const title = isAr && article.title_ar ? article.title_ar : article.title;
                          const excerpt = isAr && article.excerpt_ar ? article.excerpt_ar : article.excerpt;
                          return (
                            <Link key={article.id} to={`/news/${article.slug}`} className="group block">
                              <Card className="h-full overflow-hidden border-border/50 transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/20">
                                <div className="relative aspect-video overflow-hidden bg-muted">
                                  {article.featured_image_url ? (
                                    <img
                                      src={article.featured_image_url}
                                      alt={title}
                                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="flex h-full items-center justify-center">
                                      <Newspaper className="h-10 w-10 text-muted-foreground/20" />
                                    </div>
                                  )}
                                  <Badge className="absolute start-2.5 top-2.5 text-[10px]" variant="secondary">{article.type}</Badge>
                                </div>
                                <CardContent className="p-5">
                                  <h3 className="mb-1.5 text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">{title}</h3>
                                  {excerpt && <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{excerpt}</p>}
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Regular Articles */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {regularArticles.map((article) => {
                      const title = isAr && article.title_ar ? article.title_ar : article.title;
                      const excerpt = isAr && article.excerpt_ar ? article.excerpt_ar : article.excerpt;
                      return (
                        <Link key={article.id} to={`/news/${article.slug}`} className="group block">
                          <Card className="h-full overflow-hidden border-border/50 transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-primary/20 flex flex-col">
                            <div className="relative aspect-video overflow-hidden bg-muted">
                              {article.featured_image_url ? (
                                <img
                                  src={article.featured_image_url}
                                  alt={title}
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <Newspaper className="h-10 w-10 text-muted-foreground/20" />
                                </div>
                              )}
                              <Badge className="absolute start-2.5 top-2.5 text-[10px]" variant="secondary">{article.type}</Badge>
                            </div>
                            <CardContent className="flex flex-1 flex-col p-4">
                              <h3 className="mb-1.5 text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">{title}</h3>
                              {excerpt && <p className="mb-3 flex-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{excerpt}</p>}
                              {article.type === "exhibition" && article.event_start && (
                                <div className="mb-3 rounded-md bg-muted/50 p-2 text-xs">
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
                              <div className="flex items-center justify-between border-t pt-3 text-[11px] text-muted-foreground">
                                <span>{formatDate(article.published_at || article.created_at)}</span>
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" /> {article.view_count}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
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
