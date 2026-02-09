import { useState, useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
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
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="News & Articles"
        description="Stay updated with the latest culinary news, competition results, and chef stories from the Altohaa community."
      />
      <Header />
      <main className="flex-1">
        {/* Header */}
        <div className="container py-8 md:py-12">
          <div className="mb-8">
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Newspaper className="h-4 w-4 text-primary" />
              </div>
              <h1 className="font-serif text-2xl font-bold md:text-3xl">
                {isAr ? "الأخبار والمقالات" : "News & Articles"}
              </h1>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground md:text-base">
              {isAr
                ? "ابق على اطلاع بأحدث أخبار المسابقات والفعاليات الطهوية"
                : "Stay updated with the latest competition news and culinary events"}
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={isAr ? "ابحث..." : "Search..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder={isAr ? "التصنيف" : "Category"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "جميع التصنيفات" : "All Categories"}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {isAr && cat.name_ar ? cat.name_ar : cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs value={activeType} onValueChange={setActiveType} className="space-y-6">
            <TabsList className="h-auto w-full justify-start overflow-x-auto bg-muted/50">
              <TabsTrigger value="all" className="text-xs sm:text-sm">{isAr ? "الكل" : "All"}</TabsTrigger>
              <TabsTrigger value="news" className="text-xs sm:text-sm">{isAr ? "أخبار" : "News"}</TabsTrigger>
              <TabsTrigger value="blog" className="text-xs sm:text-sm">{isAr ? "مدونة" : "Blog"}</TabsTrigger>
              <TabsTrigger value="exhibition" className="text-xs sm:text-sm">{isAr ? "معارض" : "Exhibitions"}</TabsTrigger>
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
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mb-4 rounded-2xl bg-muted/60 p-5">
                    <Newspaper className="h-10 w-10 text-muted-foreground/40" />
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
                </div>
              ) : (
                <>
                  {/* Featured Articles */}
                  {featuredArticles.length > 0 && (
                    <div className="mb-10">
                      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        {isAr ? "المميز" : "Featured"}
                      </h2>
                      <div className="grid gap-4 md:grid-cols-2">
                        {featuredArticles.slice(0, 2).map((article) => {
                          const title = isAr && article.title_ar ? article.title_ar : article.title;
                          const excerpt = isAr && article.excerpt_ar ? article.excerpt_ar : article.excerpt;
                          return (
                            <Link key={article.id} to={`/news/${article.slug}`} className="group block">
                              <Card className="h-full overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
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
                          <Card className="h-full overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col">
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
