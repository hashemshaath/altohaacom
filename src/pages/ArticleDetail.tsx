import { useParams, Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Calendar, 
  Eye, 
  MapPin, 
  Clock,
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Link2,
  Check,
  FileText,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const isAr = language === "ar";

  const { data: article, isLoading } = useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error("Article not found");
      return data;
    },
    enabled: !!slug,
  });

  // Increment view count
  useEffect(() => {
    if (article?.id) {
      supabase
        .from("articles")
        .update({ view_count: (article.view_count || 0) + 1 })
        .eq("id", article.id)
        .then();
    }
  }, [article?.id]);

  // Fetch related articles
  const { data: relatedArticles } = useQuery({
    queryKey: ["related-articles", article?.type, article?.category_id, article?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title, title_ar, slug, excerpt, excerpt_ar, featured_image_url, type, published_at")
        .eq("status", "published")
        .neq("id", article!.id)
        .or(`type.eq.${article!.type}${article!.category_id ? `,category_id.eq.${article!.category_id}` : ""}`)
        .order("published_at", { ascending: false })
        .limit(3);
      
      return data || [];
    },
    enabled: !!article?.id,
  });

  const formatDate = (date: string) => {
    return format(new Date(date), "MMMM d, yyyy", {
      locale: isAr ? ar : enUS,
    });
  };

  const formatTime = (date: string) => {
    return format(new Date(date), "h:mm a", {
      locale: isAr ? ar : enUS,
    });
  };

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast({
        title: isAr ? "تم النسخ!" : "Link copied!",
        description: isAr ? "تم نسخ الرابط إلى الحافظة" : "Link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        variant: "destructive",
        title: isAr ? "فشل النسخ" : "Copy failed",
      });
    }
  };

  const shareLinks = article ? {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(currentUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
  } : null;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-8 max-w-4xl mx-auto">
          <Skeleton className="mb-4 h-8 w-48 rounded-xl" />
          <Skeleton className="mb-6 h-12 w-3/4 rounded-xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-full rounded-xl" />
            <Skeleton className="h-4 w-5/6 rounded-xl" />
            <Skeleton className="h-4 w-4/6 rounded-xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-16 text-center">
          <div className="mx-auto max-w-md">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
              <FileText className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h1 className="font-serif text-2xl font-bold mb-2">
              {isAr ? "المقال غير موجود" : "Article not found"}
            </h1>
            <p className="text-muted-foreground mb-6">
              {isAr ? "المقال الذي تبحث عنه غير موجود أو تم حذفه." : "The article you're looking for doesn't exist or has been removed."}
            </p>
            <Button asChild className="rounded-xl">
              <Link to="/news">{isAr ? "العودة للأخبار" : "Back to News"}</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const title = isAr && article.title_ar ? article.title_ar : article.title;
  const content = isAr && article.content_ar ? article.content_ar : article.content;
  const excerpt = isAr && article.excerpt_ar ? article.excerpt_ar : article.excerpt;
  const eventLocation = isAr && article.event_location_ar ? article.event_location_ar : article.event_location;

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title={title}
        description={excerpt || `${title} - Altoha`}
        ogImage={article.featured_image_url || undefined}
        ogType="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: title,
          description: excerpt || undefined,
          image: article.featured_image_url || undefined,
          datePublished: article.published_at || article.created_at,
        }}
      />
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative">
          {article.featured_image_url ? (
            <div className="relative h-72 md:h-[500px]">
              <img
                src={article.featured_image_url}
                alt={title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              <div className="absolute inset-0 bg-black/10" />
            </div>
          ) : (
            <div className="h-48 bg-gradient-to-br from-primary/15 via-accent/10 to-background" />
          )}
          
          <div className="container relative -mt-36 md:-mt-52 pb-12">
            <Card className="mx-auto max-w-4xl border-border/30 bg-card/90 backdrop-blur-xl shadow-2xl shadow-black/5 rounded-3xl overflow-hidden">
              <CardContent className="p-6 md:p-10 lg:p-12">
                {/* Back Button & Type Badge */}
                <div className="mb-6 flex items-center justify-between">
                  <Button variant="ghost" size="sm" asChild className="rounded-xl gap-2 hover:bg-primary/5">
                    <Link to="/news">
                      <ArrowLeft className="h-4 w-4" />
                      {isAr ? "العودة للأخبار" : "Back to News"}
                    </Link>
                  </Button>
                  <Badge variant="secondary" className="capitalize rounded-xl text-xs px-3">
                    {article.type}
                  </Badge>
                </div>

                {/* Title */}
                <h1 className="font-serif text-3xl font-bold leading-tight md:text-5xl mb-6 text-balance">{title}</h1>

                {/* Excerpt */}
                {excerpt && (
                  <div className="mb-8 rounded-2xl bg-primary/[0.03] border border-primary/10 p-5">
                    <p className="text-lg text-muted-foreground/90 leading-relaxed font-medium italic border-s-[3px] border-primary/30 ps-5">{excerpt}</p>
                  </div>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-3 mb-8">
                  <div className="flex items-center gap-1.5 rounded-xl bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(article.published_at || article.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-xl bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    <span>{article.view_count} {isAr ? "مشاهدة" : "views"}</span>
                  </div>
                  {/* Share Button */}
                  {shareLinks && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/40">
                          <Share2 className="h-3.5 w-3.5" />
                          {isAr ? "مشاركة" : "Share"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl">
                        <DropdownMenuItem 
                          onClick={() => window.open(shareLinks.twitter, "_blank")} 
                          className="cursor-pointer gap-2 rounded-xl"
                        >
                          <Twitter className="h-4 w-4" />
                          Twitter / X
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => window.open(shareLinks.facebook, "_blank")} 
                          className="cursor-pointer gap-2 rounded-xl"
                        >
                          <Facebook className="h-4 w-4" />
                          Facebook
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => window.open(shareLinks.linkedin, "_blank")} 
                          className="cursor-pointer gap-2 rounded-xl"
                        >
                          <Linkedin className="h-4 w-4" />
                          LinkedIn
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer gap-2 rounded-xl">
                          {copied ? <Check className="h-4 w-4 text-primary" /> : <Link2 className="h-4 w-4" />}
                          {isAr ? "نسخ الرابط" : "Copy Link"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Exhibition Event Info */}
                {article.type === "exhibition" && article.event_start && (
                  <div className="mb-8 rounded-2xl bg-accent/30 border border-accent/20 p-5">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      {isAr ? "معلومات الحدث" : "Event Details"}
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-sm rounded-xl bg-background/60 px-3 py-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {formatDate(article.event_start)}
                          {article.event_end && ` - ${formatDate(article.event_end)}`}
                        </span>
                      </div>
                      {article.event_start && (
                        <div className="flex items-center gap-2 text-sm rounded-xl bg-background/60 px-3 py-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{formatTime(article.event_start)}</span>
                        </div>
                      )}
                      {eventLocation && (
                        <div className="flex items-center gap-2 text-sm sm:col-span-2 rounded-xl bg-background/60 px-3 py-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{eventLocation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Separator className="mb-8" />

                {/* Article Content */}
                <article className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-serif prose-p:leading-loose prose-p:text-muted-foreground/90">
                  <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
                </article>

                {/* Gallery */}
                {article.gallery_urls && article.gallery_urls.length > 0 && (
                  <>
                    <Separator className="my-8" />
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      {isAr ? "معرض الصور" : "Photo Gallery"}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {article.gallery_urls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`${title} - ${index + 1}`}
                          className="aspect-video rounded-2xl object-cover ring-1 ring-border/30 hover:shadow-lg transition-shadow"
                        />
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related Articles */}
        {relatedArticles && relatedArticles.length > 0 && (
          <section className="container py-12">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="font-serif text-2xl font-bold">
                {isAr ? "مقالات ذات صلة" : "Related Articles"}
              </h2>
              <div className="h-px flex-1 bg-border/40" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedArticles.map((related) => {
                const relTitle = isAr && related.title_ar ? related.title_ar : related.title;
                return (
                  <Link key={related.id} to={`/news/${related.slug}`} className="group">
                    <Card className="overflow-hidden rounded-2xl border-border/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 h-full">
                      {related.featured_image_url ? (
                        <div className="aspect-video relative overflow-hidden">
                          <img
                            src={related.featured_image_url}
                            alt={relTitle}
                            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                          />
                          <Badge className="absolute top-3 start-3 text-xs rounded-lg">{related.type}</Badge>
                        </div>
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-primary/10 to-muted flex items-center justify-center">
                          <FileText className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                      )}
                      <CardContent className="p-5">
                        <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                          {relTitle}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {isAr && related.excerpt_ar ? related.excerpt_ar : related.excerpt}
                        </p>
                        {related.published_at && (
                          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(related.published_at)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
