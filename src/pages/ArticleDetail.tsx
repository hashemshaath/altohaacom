import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
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
  ArrowLeft, Calendar, Eye, MapPin, Clock,
  Share2, Twitter, Facebook, Linkedin, Link2, Check,
  FileText, Sparkles, BookOpen, ChevronUp, Printer,
} from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ArticleReadingProgress } from "@/components/articles/ArticleReadingProgress";
import { ArticleTableOfContents } from "@/components/articles/ArticleTableOfContents";

function calculateReadingTime(text: string): number {
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).filter(Boolean).length / 200));
}

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const isAr = language === "ar";

  const { data: article, isLoading } = useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, title_ar, slug, content, content_ar, excerpt, excerpt_ar, featured_image_url, gallery_urls, author_id, category_id, type, status, published_at, view_count, is_featured, event_start, event_end, event_location, event_location_ar, metadata, created_at, updated_at")
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
      supabase.from("articles").update({ view_count: (article.view_count || 0) + 1 }).eq("id", article.id).then();
    }
  }, [article?.id]);

  // Scroll-to-top visibility
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: "smooth" }), []);

  // Related articles
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

  const title = article ? (isAr && article.title_ar ? article.title_ar : article.title) : "";
  const content = article ? (isAr && article.content_ar ? article.content_ar : article.content) : "";
  const excerpt = article ? (isAr && article.excerpt_ar ? article.excerpt_ar : article.excerpt) : "";
  const eventLocation = article ? (isAr && article.event_location_ar ? article.event_location_ar : article.event_location) : "";
  const readingTime = useMemo(() => calculateReadingTime(content), [content]);

  const formatDate = (date: string) => format(new Date(date), "MMMM d, yyyy", { locale: isAr ? ar : enUS });
  const formatTime = (date: string) => format(new Date(date), "h:mm a", { locale: isAr ? ar : enUS });

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast({ title: isAr ? "تم النسخ!" : "Link copied!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: "destructive", title: isAr ? "فشل النسخ" : "Copy failed" });
    }
  };

  const shareLinks = article ? {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(currentUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
  } : null;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <Skeleton className="h-[420px] w-full" />
          <div className="container max-w-4xl mx-auto -mt-24 relative z-10 space-y-4 px-4 md:px-6">
            <Skeleton className="h-64 w-full rounded-3xl" />
            <div className="space-y-3 pt-6">
              <Skeleton className="h-4 w-full rounded-xl" />
              <Skeleton className="h-4 w-5/6 rounded-xl" />
              <Skeleton className="h-4 w-4/6 rounded-xl" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Not found
  if (!article) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-20 text-center">
          <div className="mx-auto max-w-md animate-fade-in">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-muted">
              <FileText className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h1 className="font-serif text-2xl font-bold mb-2">{isAr ? "المقال غير موجود" : "Article not found"}</h1>
            <p className="text-muted-foreground mb-6">{isAr ? "المقال الذي تبحث عنه غير موجود أو تم حذفه." : "The article you're looking for doesn't exist or has been removed."}</p>
            <Button asChild className="rounded-xl">
              <Link to="/news">{isAr ? "العودة للأخبار" : "Back to News"}</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const hasHeroImage = article.featured_image_url && !imageFailed;

  return (
    <div className="flex min-h-screen flex-col" dir={isAr ? "rtl" : "ltr"}>
      <ArticleReadingProgress />
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
        {/* Hero Cover */}
        <div className="relative overflow-hidden">
          {hasHeroImage ? (
            <div className="relative h-[340px] md:h-[520px] lg:h-[580px]">
              <img
                src={article.featured_image_url!}
                alt={title}
                className="h-full w-full object-cover animate-[scale-in_1.2s_ease-out] will-change-transform"
                onError={() => setImageFailed(true)}
                loading="eager"
              />
              {/* Multi-layer gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-black/20" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
            </div>
          ) : (
            <div className="h-48 md:h-64 bg-gradient-to-br from-primary/20 via-accent/10 to-background" />
          )}

          {/* Floating header card */}
          <div className={cn(
            "container relative px-4 md:px-6",
            hasHeroImage ? "-mt-40 md:-mt-56 lg:-mt-64 pb-8" : "-mt-12 pb-6"
          )}>
            <div className="mx-auto max-w-4xl">
              <Card className="border-border/20 bg-card/95 backdrop-blur-2xl shadow-2xl shadow-black/8 rounded-3xl overflow-hidden animate-fade-in">
                <CardContent className="p-5 md:p-8 lg:p-10">
                  {/* Breadcrumb & Badge */}
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <Button variant="ghost" size="sm" asChild className="rounded-xl gap-2 text-xs hover:bg-primary/5 active:scale-95 transition-all">
                      <Link to="/news">
                        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                        {isAr ? "العودة للأخبار" : "Back to News"}
                      </Link>
                    </Button>
                    <div className="flex items-center gap-2">
                      {article.is_featured && (
                        <Badge className="rounded-xl text-[10px] px-2 bg-chart-4/10 text-chart-4 border-chart-4/20 gap-1">
                          <Sparkles className="h-2.5 w-2.5" />
                          {isAr ? "مميز" : "Featured"}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="capitalize rounded-xl text-[10px] px-2.5">{article.type}</Badge>
                    </div>
                  </div>

                  {/* Title */}
                  <h1 className="font-serif text-2xl md:text-4xl lg:text-5xl font-bold leading-[1.15] mb-5 text-balance tracking-tight">
                    {title}
                  </h1>

                  {/* Meta chips */}
                  <div className="flex flex-wrap items-center gap-2 mb-6">
                    <div className="flex items-center gap-1.5 rounded-xl bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(article.published_at || article.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
                      <BookOpen className="h-3 w-3" />
                      <span>{readingTime} {isAr ? "دقيقة قراءة" : "min read"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      <span>{(article.view_count || 0).toLocaleString()} {isAr ? "مشاهدة" : "views"}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 ms-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl h-8 w-8 p-0"
                        onClick={() => window.print()}
                        title={isAr ? "طباعة" : "Print"}
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </Button>

                      {shareLinks && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl border-border/40 text-xs h-8 active:scale-95 transition-all">
                              <Share2 className="h-3 w-3" />
                              {isAr ? "مشاركة" : "Share"}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-xl">
                            <DropdownMenuItem onClick={() => window.open(shareLinks.twitter, "_blank")} className="cursor-pointer gap-2 rounded-lg text-xs">
                              <Twitter className="h-3.5 w-3.5" /> Twitter / X
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(shareLinks.facebook, "_blank")} className="cursor-pointer gap-2 rounded-lg text-xs">
                              <Facebook className="h-3.5 w-3.5" /> Facebook
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(shareLinks.linkedin, "_blank")} className="cursor-pointer gap-2 rounded-lg text-xs">
                              <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                            </DropdownMenuItem>
                            <Separator className="my-1" />
                            <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer gap-2 rounded-lg text-xs">
                              {copied ? <Check className="h-3.5 w-3.5 text-chart-2" /> : <Link2 className="h-3.5 w-3.5" />}
                              {isAr ? "نسخ الرابط" : "Copy Link"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>

                  {/* Excerpt */}
                  {excerpt && (
                    <div className="rounded-2xl bg-primary/[0.03] border border-primary/10 p-4 md:p-5">
                      <p className="text-base md:text-lg text-muted-foreground/90 leading-relaxed font-medium italic border-s-[3px] border-primary/30 ps-4">
                        {excerpt}
                      </p>
                    </div>
                  )}

                  {/* Event Info */}
                  {article.type === "exhibition" && article.event_start && (
                    <div className="mt-5 rounded-2xl bg-accent/20 border border-accent/15 p-4 md:p-5">
                      <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-primary" />
                        {isAr ? "معلومات الحدث" : "Event Details"}
                      </h3>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="flex items-center gap-2 text-xs rounded-xl bg-background/60 px-3 py-2">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{formatDate(article.event_start)}{article.event_end && ` – ${formatDate(article.event_end)}`}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs rounded-xl bg-background/60 px-3 py-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{formatTime(article.event_start)}</span>
                        </div>
                        {eventLocation && (
                          <div className="flex items-center gap-2 text-xs sm:col-span-2 rounded-xl bg-background/60 px-3 py-2">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{eventLocation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Content Area with TOC sidebar */}
        <div className="container px-4 md:px-6 pb-16">
          <div className="mx-auto max-w-5xl grid gap-8 lg:grid-cols-[1fr_220px]">
            {/* Main Content */}
            <article
              className={cn(
                "prose prose-base md:prose-lg max-w-none dark:prose-invert",
                "prose-headings:font-serif prose-headings:scroll-mt-24 prose-headings:tracking-tight",
                "prose-p:leading-[1.85] prose-p:text-muted-foreground/90",
                "prose-img:rounded-2xl prose-img:shadow-lg prose-img:my-8",
                "prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium",
                "prose-blockquote:border-primary/30 prose-blockquote:bg-muted/20 prose-blockquote:rounded-e-2xl prose-blockquote:py-2 prose-blockquote:px-5 prose-blockquote:not-italic",
                "prose-li:leading-relaxed prose-li:marker:text-primary/50",
                "prose-hr:border-border/30 prose-hr:my-10",
                "prose-strong:text-foreground",
                "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-lg prose-code:text-sm prose-code:font-normal prose-code:before:content-none prose-code:after:content-none",
                "prose-pre:rounded-2xl prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/30",
                "prose-table:rounded-xl prose-th:bg-muted/40 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2",
              )}
            >
              <ReactMarkdown
                components={{
                  h1: ({ children, ...props }) => {
                    const text = String(children).toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 60);
                    return <h1 id={text} {...props}>{children}</h1>;
                  },
                  h2: ({ children, ...props }) => {
                    const text = String(children).toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 60);
                    return <h2 id={text} className="mt-12 mb-4" {...props}>{children}</h2>;
                  },
                  h3: ({ children, ...props }) => {
                    const text = String(children).toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 60);
                    return <h3 id={text} className="mt-8 mb-3" {...props}>{children}</h3>;
                  },
                  img: ({ src, alt, ...props }) => (
                    <figure className="my-8 not-prose">
                      <img
                        src={src}
                        alt={alt || ""}
                        className="w-full rounded-2xl shadow-lg"
                        loading="lazy"
                        decoding="async"
                        {...props}
                      />
                      {alt && alt !== "image" && (
                        <figcaption className="text-center text-xs text-muted-foreground mt-3 italic">{alt}</figcaption>
                      )}
                    </figure>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>

              {/* Gallery */}
              {article.gallery_urls && article.gallery_urls.length > 0 && (
                <>
                  <Separator className="my-10" />
                  <h3 className="font-semibold mb-5 flex items-center gap-2 not-prose">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {isAr ? "معرض الصور" : "Photo Gallery"}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 not-prose">
                    {article.gallery_urls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`${title} - ${index + 1}`}
                        className="aspect-video rounded-2xl object-cover ring-1 ring-border/20 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                        loading="lazy"
                        decoding="async"
                      />
                    ))}
                  </div>
                </>
              )}
            </article>

            {/* Sidebar: TOC */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                <ArticleTableOfContents content={content} isAr={isAr} />
              </div>
            </aside>
          </div>
        </div>

        {/* Related Articles */}
        {relatedArticles && relatedArticles.length > 0 && (
          <section className="border-t border-border/20 bg-muted/10">
            <div className="container px-4 md:px-6 py-14">
              <div className="flex items-center gap-3 mb-8">
                <h2 className="font-serif text-2xl font-bold">{isAr ? "مقالات ذات صلة" : "Related Articles"}</h2>
                <div className="h-px flex-1 bg-border/30" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {relatedArticles.map((related) => {
                  const relTitle = isAr && related.title_ar ? related.title_ar : related.title;
                  return (
                    <Link key={related.id} to={`/news/${related.slug}`} className="group">
                      <Card className="overflow-hidden rounded-2xl border-border/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                        {related.featured_image_url ? (
                          <div className="aspect-video relative overflow-hidden">
                            <img
                              src={related.featured_image_url}
                              alt={relTitle}
                              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                              decoding="async"
                            />
                            <Badge className="absolute top-3 start-3 text-[10px] rounded-xl">{related.type}</Badge>
                          </div>
                        ) : (
                          <div className="aspect-video bg-gradient-to-br from-primary/10 to-muted flex items-center justify-center">
                            <FileText className="h-10 w-10 text-muted-foreground/20" />
                          </div>
                        )}
                        <CardContent className="p-4 md:p-5">
                          <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors text-sm">{relTitle}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {isAr && related.excerpt_ar ? related.excerpt_ar : related.excerpt}
                          </p>
                          {related.published_at && (
                            <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1">
                              <Calendar className="h-2.5 w-2.5" />
                              {formatDate(related.published_at)}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />

      {/* Scroll to top FAB */}
      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-6 end-6 z-50 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 active:scale-90 touch-manipulation",
          showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
        aria-label="Scroll to top"
      >
        <ChevronUp className="h-5 w-5" />
      </button>
    </div>
  );
}
