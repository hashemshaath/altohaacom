import { useState, useEffect } from "react";
import { Search, Calendar, User, Eye, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      locale: language === "ar" ? ar : enUS,
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-primary/10 to-background py-12">
          <div className="container mx-auto px-4">
            <h1 className="font-serif text-4xl font-bold text-center mb-4">
              {language === "ar" ? "الأخبار والمقالات" : "News & Articles"}
            </h1>
            <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
              {language === "ar"
                ? "ابق على اطلاع بأحدث أخبار المسابقات والفعاليات الطهوية"
                : "Stay updated with the latest competition news and culinary events"}
            </p>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-3xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === "ar" ? "ابحث..." : "Search..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder={language === "ar" ? "التصنيف" : "Category"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "ar" ? "جميع التصنيفات" : "All Categories"}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {language === "ar" && cat.name_ar ? cat.name_ar : cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          {/* Tabs */}
          <Tabs value={activeType} onValueChange={setActiveType} className="mb-8">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="all">{language === "ar" ? "الكل" : "All"}</TabsTrigger>
              <TabsTrigger value="news">{language === "ar" ? "أخبار" : "News"}</TabsTrigger>
              <TabsTrigger value="blog">{language === "ar" ? "مدونة" : "Blog"}</TabsTrigger>
              <TabsTrigger value="exhibition">{language === "ar" ? "معارض" : "Exhibitions"}</TabsTrigger>
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              {language === "ar" ? "لا توجد مقالات" : "No articles found"}
            </div>
          ) : (
            <>
              {/* Featured Articles */}
              {featuredArticles.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-serif font-bold mb-6">
                    {language === "ar" ? "المميز" : "Featured"}
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {featuredArticles.slice(0, 2).map((article) => (
                      <Link key={article.id} to={`/news/${article.slug}`}>
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                          {article.featured_image_url && (
                            <div className="aspect-video relative">
                              <img
                                src={article.featured_image_url}
                                alt={language === "ar" && article.title_ar ? article.title_ar : article.title}
                                className="object-cover w-full h-full"
                              />
                              <Badge className="absolute top-4 left-4">{article.type}</Badge>
                            </div>
                          )}
                          <CardContent className="p-6">
                            <h3 className="text-xl font-semibold mb-2 line-clamp-2">
                              {language === "ar" && article.title_ar ? article.title_ar : article.title}
                            </h3>
                            <p className="text-muted-foreground line-clamp-2 mb-4">
                              {language === "ar" && article.excerpt_ar
                                ? article.excerpt_ar
                                : article.excerpt}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(article.published_at || article.created_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {article.view_count}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Articles Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularArticles.map((article) => (
                  <Link key={article.id} to={`/news/${article.slug}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                      {article.featured_image_url ? (
                        <div className="aspect-video relative">
                          <img
                            src={article.featured_image_url}
                            alt={language === "ar" && article.title_ar ? article.title_ar : article.title}
                            className="object-cover w-full h-full"
                          />
                          <Badge className="absolute top-3 left-3 text-xs">{article.type}</Badge>
                        </div>
                      ) : (
                        <div className="aspect-video bg-muted flex items-center justify-center">
                          <Badge>{article.type}</Badge>
                        </div>
                      )}
                      <CardContent className="p-4 flex-1 flex flex-col">
                        <h3 className="font-semibold mb-2 line-clamp-2">
                          {language === "ar" && article.title_ar ? article.title_ar : article.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                          {language === "ar" && article.excerpt_ar
                            ? article.excerpt_ar
                            : article.excerpt}
                        </p>
                        {article.type === "exhibition" && article.event_start && (
                          <div className="mt-3 p-2 bg-accent rounded text-sm">
                            <p className="font-medium">
                              {formatDate(article.event_start)}
                              {article.event_end && ` - ${formatDate(article.event_end)}`}
                            </p>
                            {article.event_location && (
                              <p className="text-muted-foreground">
                                {language === "ar" && article.event_location_ar
                                  ? article.event_location_ar
                                  : article.event_location}
                              </p>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t text-xs text-muted-foreground">
                          <span>{formatDate(article.published_at || article.created_at)}</span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {article.view_count}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
