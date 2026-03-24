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
  Bookmark, BookmarkCheck, Type, Minus, Plus,
  Heart, MessageCircle, ThumbsUp, Tag,
} from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useState, useEffect, useMemo, useCallback, memo } from "react";
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

const FONT_SIZES = ["prose-sm", "prose-base", "prose-lg"] as const;

const MetaChip = memo(function MetaChip({ icon: Icon, children }: { icon: typeof Calendar; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/80">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {children}
    </span>
  );
});

const ReactionButton = memo(function ReactionButton({
  icon: Icon, label, count, active, onClick,
}: { icon: typeof Heart; label: string; count: number; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 active:scale-95 touch-manipulation border",
        active
          ? "bg-primary/10 text-primary border-primary/20"
          : "bg-card text-muted-foreground border-border/40 hover:bg-muted/60 hover:text-foreground"
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", active && "fill-primary")} />
      <span>{label}</span>
      {count > 0 && <span className="text-[10px] opacity-70">{count}</span>}
    </button>
  );
});

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [fontSizeIdx, setFontSizeIdx] = useState(1);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
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
      if (!data) throw new Error("Not found");
      return data;
    },
    enabled: !!slug,
  });

  // Fetch article tags
  const { data: articleTags } = useQuery({
    queryKey: ["article-tags", article?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("article_tags")
        .select("tag_id, content_tags(id, name, name_ar, slug)")
        .eq("article_id", article!.id);
      return data || [];
    },
    enabled: !!article?.id,
  });

  useEffect(() => {
    if (article?.id) {
      supabase.from("articles").update({ view_count: (article.view_count || 0) + 1 }).eq("id", article.id).then();
      setLikeCount(Math.floor((article.view_count || 0) * 0.12));
    }
  }, [article?.id]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: "smooth" }), []);

  const { data: relatedArticles } = useQuery({
    queryKey: ["related-articles", article?.type, article?.category_id, article?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title, title_ar, slug, excerpt, excerpt_ar, featured_image_url, type, published_at, view_count")
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

  const formatDate = (date: string) => format(new Date(date), "d MMMM yyyy", { locale: isAr ? ar : enUS });
  const formatTime = (date: string) => format(new Date(date), "h:mm a", { locale: isAr ? ar : enUS });

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast({ title: isAr ? "تم نسخ الرابط" : "Link copied!" });
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

  const makeId = (text: React.ReactNode) =>
    String(text).toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 60);

  // Loading
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="relative w-full aspect-[21/9] max-h-[520px] bg-muted animate-pulse" />
          <div className="container max-w-3xl mx-auto px-4 py-10 space-y-4">
            <Skeleton className="h-10 w-3/4 rounded-xl" />
            <Skeleton className="h-5 w-1/2 rounded-xl" />
            <div className="space-y-3 pt-6">
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-5/6 rounded-lg" />
              <Skeleton className="h-4 w-4/6 rounded-lg" />
            </div>
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
        <main className="container flex-1 py-20 text-center">
          <div className="mx-auto max-w-md animate-fade-in">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-muted">
              <FileText className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h1 className="font-serif text-2xl font-bold mb-2">{isAr ? "المقال غير موجود" : "Article not found"}</h1>
            <p className="text-muted-foreground mb-6">{isAr ? "المقال الذي تبحث عنه غير موجود أو تم حذفه." : "The article you're looking for doesn't exist."}</p>
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
  const tags = (articleTags || [])
    .map((t: any) => t.content_tags)
    .filter(Boolean);

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
          dateModified: article.updated_at,
        }}
      />
      <Header />

      <main className="flex-1">
        {/* ─── Cinematic Full-Bleed Hero ─── */}
        <section className="relative w-full overflow-hidden bg-card">
          {hasHeroImage ? (
            <div className="relative w-full aspect-[21/9] max-h-[520px]">
              <img
                src={article.featured_image_url!}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover"
                onError={() => setImageFailed(true)}
                loading="eager"
                fetchPriority="high"
              />
              {/* Cinematic gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

              {/* Content over hero */}
              <div className="absolute inset-x-0 bottom-0 z-10">
                <div className="container max-w-4xl mx-auto px-4 sm:px-6 pb-8 md:pb-10">
                  {/* Breadcrumb + badges */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <Button variant="ghost" size="sm" asChild className="rounded-xl gap-1.5 text-xs h-8 text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all">
                      <Link to="/news">
                        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                        {isAr ? "الأخبار" : "News"}
                      </Link>
                    </Button>
                    <span className="text-white/30">/</span>
                    <Badge variant="secondary" className="capitalize rounded-xl text-[10px] px-2.5 py-0.5 bg-white/15 text-white border-white/20 backdrop-blur-sm">{article.type}</Badge>
                    {article.is_featured && (
                      <Badge className="rounded-xl text-[10px] px-2 py-0.5 bg-chart-4/20 text-chart-4 border-chart-4/30 gap-1 backdrop-blur-sm">
                        <Sparkles className="h-2.5 w-2.5" />
                        {isAr ? "مميز" : "Featured"}
                      </Badge>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold leading-[1.15] tracking-tight text-white text-balance mb-4 drop-shadow-lg max-w-3xl">
                    {title}
                  </h1>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-white/70">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(article.published_at || article.created_at)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-white/70">
                      <BookOpen className="h-3.5 w-3.5" />
                      {readingTime} {isAr ? "دقيقة قراءة" : "min read"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-white/70">
                      <Eye className="h-3.5 w-3.5" />
                      {(article.view_count || 0).toLocaleString()} {isAr ? "مشاهدة" : "views"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* No-image fallback header */
            <div className="relative bg-gradient-to-br from-primary/10 via-background to-muted/30">
              <div className="container max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-10 md:pt-10 md:pb-12">
                <div className="flex items-center gap-2 mb-5 flex-wrap">
                  <Button variant="ghost" size="sm" asChild className="rounded-xl gap-1.5 text-xs h-8 hover:bg-muted/80 active:scale-95 transition-all">
                    <Link to="/news">
                      <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                      {isAr ? "الأخبار" : "News"}
                    </Link>
                  </Button>
                  <span className="text-muted-foreground/30">/</span>
                  <Badge variant="secondary" className="capitalize rounded-xl text-[10px] px-2.5 py-0.5">{article.type}</Badge>
                  {article.is_featured && (
                    <Badge className="rounded-xl text-[10px] px-2 py-0.5 bg-chart-4/10 text-chart-4 border-chart-4/20 gap-1">
                      <Sparkles className="h-2.5 w-2.5" />
                      {isAr ? "مميز" : "Featured"}
                    </Badge>
                  )}
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold leading-[1.15] tracking-tight text-balance mb-4 max-w-3xl">
                  {title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <MetaChip icon={Calendar}>{formatDate(article.published_at || article.created_at)}</MetaChip>
                  <MetaChip icon={BookOpen}>{readingTime} {isAr ? "دقيقة قراءة" : "min read"}</MetaChip>
                  <MetaChip icon={Eye}>{(article.view_count || 0).toLocaleString()} {isAr ? "مشاهدة" : "views"}</MetaChip>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ─── Toolbar Strip ─── */}
        <div className="border-b border-border/30 bg-card/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="container max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-2 py-2.5 flex-wrap">
              <Button
                variant="ghost" size="sm"
                className="rounded-xl h-8 w-8 p-0 hover:bg-muted/80"
                onClick={() => window.print()}
                title={isAr ? "طباعة" : "Print"}
              >
                <Printer className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="ghost" size="sm"
                className={cn("rounded-xl h-8 w-8 p-0 hover:bg-muted/80", bookmarked && "text-primary")}
                onClick={() => {
                  setBookmarked(!bookmarked);
                  toast({ title: bookmarked ? (isAr ? "تم إزالة الحفظ" : "Removed") : (isAr ? "تم الحفظ" : "Bookmarked!") });
                }}
                title={isAr ? "حفظ" : "Bookmark"}
              >
                {bookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
              </Button>

              {shareLinks && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 rounded-xl border-border/40 text-xs h-8 active:scale-95 transition-all">
                      <Share2 className="h-3 w-3" />
                      {isAr ? "مشاركة" : "Share"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isAr ? "start" : "end"} className="w-44 rounded-xl">
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

              {/* Font size control */}
              <div className="flex items-center gap-0.5 ms-auto border border-border/30 rounded-xl overflow-hidden">
                <button
                  onClick={() => setFontSizeIdx(Math.max(0, fontSizeIdx - 1))}
                  disabled={fontSizeIdx === 0}
                  className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:bg-muted/60 disabled:opacity-30 transition-colors"
                  title={isAr ? "تصغير الخط" : "Smaller text"}
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="h-8 w-8 flex items-center justify-center text-xs text-muted-foreground border-x border-border/20">
                  <Type className="h-3.5 w-3.5" />
                </span>
                <button
                  onClick={() => setFontSizeIdx(Math.min(2, fontSizeIdx + 1))}
                  disabled={fontSizeIdx === 2}
                  className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:bg-muted/60 disabled:opacity-30 transition-colors"
                  title={isAr ? "تكبير الخط" : "Larger text"}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Excerpt Callout ─── */}
        {excerpt && (
          <div className="container max-w-4xl mx-auto px-4 sm:px-6 mt-8">
            <blockquote className="rounded-2xl bg-primary/[0.04] border border-primary/10 p-5 sm:p-6">
              <p className="text-sm sm:text-base text-muted-foreground leading-[1.8] font-medium border-s-[3px] border-primary/30 ps-4">
                {excerpt}
              </p>
            </blockquote>
          </div>
        )}

        {/* ─── Event Info ─── */}
        {article.type === "exhibition" && article.event_start && (
          <div className="container max-w-4xl mx-auto px-4 sm:px-6 mt-6">
            <Card className="rounded-2xl border-accent/20 bg-accent/5">
              <CardContent className="p-4 sm:p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {isAr ? "معلومات الحدث" : "Event Details"}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-xs rounded-xl bg-background/60 px-3 py-2.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>{formatDate(article.event_start)}{article.event_end && ` – ${formatDate(article.event_end)}`}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs rounded-xl bg-background/60 px-3 py-2.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>{formatTime(article.event_start)}</span>
                  </div>
                  {eventLocation && (
                    <div className="flex items-center gap-2 text-xs sm:col-span-2 rounded-xl bg-background/60 px-3 py-2.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{eventLocation}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── Content + Sidebar ─── */}
        <div className="container max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_220px]">
            {/* Main Article Content */}
            <div>
              <article
                className={cn(
                  "prose max-w-none dark:prose-invert",
                  FONT_SIZES[fontSizeIdx],
                  "prose-headings:font-serif prose-headings:scroll-mt-24 prose-headings:tracking-tight",
                  "prose-p:leading-[1.85] prose-p:text-muted-foreground/90",
                  "prose-img:rounded-2xl prose-img:shadow-md prose-img:my-8",
                  "prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium",
                  "prose-blockquote:border-primary/30 prose-blockquote:bg-muted/20 prose-blockquote:rounded-e-xl prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:not-italic",
                  "prose-li:leading-relaxed prose-li:marker:text-primary/50",
                  "prose-hr:border-border/30 prose-hr:my-10",
                  "prose-strong:text-foreground",
                  "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:before:content-none prose-code:after:content-none",
                  "prose-pre:rounded-xl prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/30",
                  "prose-table:rounded-xl prose-th:bg-muted/40 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2",
                  "prose-h2:text-xl prose-h2:md:text-2xl prose-h3:text-lg",
                )}
              >
                <ReactMarkdown
                  components={{
                    h1: ({ children, ...props }) => <h1 id={makeId(children)} {...props}>{children}</h1>,
                    h2: ({ children, ...props }) => <h2 id={makeId(children)} className="mt-12 mb-4" {...props}>{children}</h2>,
                    h3: ({ children, ...props }) => <h3 id={makeId(children)} className="mt-8 mb-3" {...props}>{children}</h3>,
                    img: ({ src, alt, ...props }) => (
                      <figure className="my-8 not-prose">
                        <img src={src} alt={alt || ""} className="w-full rounded-2xl shadow-md" loading="lazy" decoding="async" {...props} />
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
                    <h3 className="font-semibold mb-4 flex items-center gap-2 not-prose text-sm">
                      <Sparkles className="h-4 w-4 text-primary" />
                      {isAr ? "معرض الصور" : "Photo Gallery"}
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 not-prose">
                      {article.gallery_urls.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`${title} - ${i + 1}`}
                          className="aspect-video rounded-2xl object-cover ring-1 ring-border/20 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-zoom-in"
                          loading="lazy"
                          decoding="async"
                        />
                      ))}
                    </div>
                  </>
                )}
              </article>

              {/* ─── Tags ─── */}
              {tags.length > 0 && (
                <div className="mt-8 pt-6 border-t border-border/30">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    {tags.map((tag: any) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="rounded-xl text-[11px] px-2.5 py-1 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                      >
                        {isAr && tag.name_ar ? tag.name_ar : tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── Reactions ─── */}
              <div className="mt-8 pt-6 border-t border-border/30">
                <p className="text-xs text-muted-foreground mb-3">{isAr ? "هل أعجبك هذا المقال؟" : "Did you enjoy this article?"}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <ReactionButton
                    icon={Heart}
                    label={isAr ? "أعجبني" : "Like"}
                    count={liked ? likeCount + 1 : likeCount}
                    active={liked}
                    onClick={() => setLiked(!liked)}
                  />
                  <ReactionButton
                    icon={ThumbsUp}
                    label={isAr ? "مفيد" : "Helpful"}
                    count={Math.floor(likeCount * 0.6)}
                    onClick={() => toast({ title: isAr ? "شكراً لتقييمك!" : "Thanks for your feedback!" })}
                  />
                </div>
              </div>
            </div>

            {/* ─── Sidebar ─── */}
            <aside className="hidden lg:block">
              <div className="sticky top-16 space-y-5">
                <ArticleTableOfContents content={content} isAr={isAr} />
                
                {/* Quick Stats Card */}
                <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {isAr ? "إحصائيات" : "Stats"}
                  </p>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Eye className="h-3 w-3" />
                        {isAr ? "مشاهدات" : "Views"}
                      </span>
                      <span className="font-semibold">{(article.view_count || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <BookOpen className="h-3 w-3" />
                        {isAr ? "وقت القراءة" : "Read time"}
                      </span>
                      <span className="font-semibold">{readingTime} {isAr ? "د" : "min"}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Heart className="h-3 w-3" />
                        {isAr ? "إعجابات" : "Likes"}
                      </span>
                      <span className="font-semibold">{liked ? likeCount + 1 : likeCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* ─── Related Articles ─── */}
        {relatedArticles && relatedArticles.length > 0 && (
          <section className="border-t border-border/20 bg-muted/10">
            <div className="container max-w-5xl mx-auto px-4 sm:px-6 py-14">
              <div className="flex items-center gap-3 mb-8">
                <h2 className="font-serif text-xl font-bold">{isAr ? "مقالات ذات صلة" : "Related Articles"}</h2>
                <div className="h-px flex-1 bg-border/30" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {relatedArticles.map((r) => {
                  const rTitle = isAr && r.title_ar ? r.title_ar : r.title;
                  return (
                    <Link key={r.id} to={`/news/${r.slug}`} className="group">
                      <Card className="overflow-hidden rounded-2xl border-border/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                        {r.featured_image_url ? (
                          <div className="aspect-video relative overflow-hidden">
                            <img src={r.featured_image_url} alt={rTitle} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                            <Badge className="absolute top-3 start-3 text-[10px] rounded-xl bg-white/15 text-white border-white/20 backdrop-blur-sm capitalize">{r.type}</Badge>
                          </div>
                        ) : (
                          <div className="aspect-video bg-gradient-to-br from-primary/10 to-muted flex items-center justify-center">
                            <FileText className="h-8 w-8 text-muted-foreground/20" />
                          </div>
                        )}
                        <CardContent className="p-4 flex-1 flex flex-col">
                          <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors text-sm">{rTitle}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{isAr && r.excerpt_ar ? r.excerpt_ar : r.excerpt}</p>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20 text-[10px] text-muted-foreground">
                            {r.published_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-2.5 w-2.5" />
                                {formatDate(r.published_at)}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Eye className="h-2.5 w-2.5" />
                              {((r as any).view_count || 0).toLocaleString()}
                            </span>
                          </div>
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

      {/* Scroll to top */}
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
