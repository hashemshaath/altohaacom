import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Newspaper } from "lucide-react";
import { format } from "date-fns";
import { SectionReveal } from "@/components/ui/section-reveal";
import { StaggeredList } from "@/components/ui/staggered-list";

export function HomeArticles() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: articles = [] } = useQuery({
    queryKey: ["home-articles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title, title_ar, excerpt, excerpt_ar, featured_image_url, slug, published_at, type")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(4);
      return data || [];
    },
  });

  if (articles.length === 0) return null;

  return (
    <section className="container py-10 md:py-16" aria-labelledby="articles-heading">
      <SectionReveal>
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary" className="mb-2">
              <Newspaper className="me-1 h-3 w-3" />
              {isAr ? "أحدث المقالات" : "Latest Articles"}
            </Badge>
            <h2 id="articles-heading" className="font-serif text-xl font-bold sm:text-2xl">
              {isAr ? "قصص ملهمة من عالم الطهي" : "Inspiring Culinary Stories"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAr ? "أخبار الطهاة والشركات والجمعيات مع نصائح ملهمة" : "Chef stories, company news, and association updates"}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/news">
              {isAr ? "عرض الكل" : "View All"}
              <ArrowRight className="ms-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </SectionReveal>
      <StaggeredList className="grid gap-2.5 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4" stagger={80}>
        {articles.map((article: any) => {
          const title = isAr && article.title_ar ? article.title_ar : article.title;
          const excerpt = isAr && article.excerpt_ar ? article.excerpt_ar : article.excerpt;
          return (
            <Link key={article.id} to={`/news/${article.slug}`} className="group block">
              <Card interactive className="h-full overflow-hidden border-border/50">
                <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                  {article.featured_image_url ? (
                    <img src={article.featured_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <Newspaper className="h-8 w-8 text-primary/20" />
                    </div>
                  )}
                  <Badge className="absolute start-2 top-2" variant="secondary">{article.type}</Badge>
                </div>
                <CardContent className="p-3.5">
                  <h3 className="mb-1 line-clamp-2 text-sm font-semibold group-hover:text-primary transition-colors">{title}</h3>
                  {excerpt && <p className="mb-1.5 line-clamp-2 text-xs text-muted-foreground">{excerpt}</p>}
                  {article.published_at && <p className="text-[10px] text-muted-foreground">{format(new Date(article.published_at), "MMM d, yyyy")}</p>}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </StaggeredList>
    </section>
  );
}
