import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Clock, Newspaper } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

const TYPE_MAP: Record<string, { en: string; ar: string }> = {
  news: { en: "News", ar: "أخبار" },
  article: { en: "Article", ar: "مقال" },
  blog: { en: "Blog", ar: "مدونة" },
  interview: { en: "Interview", ar: "مقابلة" },
  event: { en: "Event", ar: "فعالية" },
};

export default function ArticlesSection() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: articles = [] } = useQuery({
    queryKey: ["home-articles-minimal"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title, title_ar, excerpt, excerpt_ar, featured_image_url, slug, published_at, type")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(6);
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  if (articles.length === 0) return null;

  const featured = articles[0];
  const rest = articles.slice(1, 5);

  return (
    <section className="py-16 sm:py-24" dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-3 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
            {isAr ? "أخبار ومقالات" : "News & Articles"}
          </Badge>
          <h2 className={cn("text-2xl font-bold sm:text-3xl lg:text-4xl text-foreground tracking-tight", !isAr && "font-serif")}>
            {isAr ? "أحدث المقالات" : "Latest from the Kitchen"}
          </h2>
          <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
            {isAr ? "آخر الأخبار والمقالات من عالم الطهي" : "Stay updated with the latest culinary news and stories"}
          </p>
        </div>

        {/* Layout: Featured + List */}
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Featured Article */}
          <Link to={`/articles/${featured.slug}`} className="group lg:col-span-3">
            <Card className="overflow-hidden border-border/30 h-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 rounded-2xl">
              <div className="relative aspect-[16/9] overflow-hidden">
                {featured.featured_image_url ? (
                  <img src={featured.featured_image_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="h-full w-full bg-muted flex items-center justify-center">
                    <Newspaper className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
                {featured.type && TYPE_MAP[featured.type] && (
                  <Badge variant="secondary" className="absolute top-3 start-3 text-[10px]">
                    {isAr ? TYPE_MAP[featured.type].ar : TYPE_MAP[featured.type].en}
                  </Badge>
                )}
              </div>
              <CardContent className="p-5">
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {isAr ? featured.title_ar || featured.title : featured.title}
                </h3>
                {(featured.excerpt || featured.excerpt_ar) && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {isAr ? featured.excerpt_ar || featured.excerpt : featured.excerpt}
                  </p>
                )}
                {featured.published_at && (
                  <p className="mt-3 text-xs text-muted-foreground/60 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(featured.published_at), { addSuffix: true, locale: isAr ? ar : undefined })}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>

          {/* Side List */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {rest.map((article: any) => (
              <Link key={article.id} to={`/articles/${article.slug}`} className="group">
                <Card className="flex overflow-hidden border-border/30 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 rounded-2xl">
                  <div className="w-24 sm:w-28 shrink-0 overflow-hidden">
                    {article.featured_image_url ? (
                      <img src={article.featured_image_url} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        <Newspaper className="h-5 w-5 text-muted-foreground/20" />
                      </div>
                    )}
                  </div>
                  <CardContent className="flex flex-col justify-center p-3 min-h-[5rem]">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {isAr ? article.title_ar || article.title : article.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      {article.type && TYPE_MAP[article.type] && (
                        <span className="text-[10px] text-muted-foreground/60">
                          {isAr ? TYPE_MAP[article.type].ar : TYPE_MAP[article.type].en}
                        </span>
                      )}
                      {article.published_at && (
                        <span className="text-[10px] text-muted-foreground/40">
                          {formatDistanceToNow(new Date(article.published_at), { addSuffix: true, locale: isAr ? ar : undefined })}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* View All */}
        <div className="mt-10 text-center">
          <Button variant="outline" className="rounded-xl" asChild>
            <Link to="/articles">
              {isAr ? "عرض جميع المقالات" : "View All Articles"}
              <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
