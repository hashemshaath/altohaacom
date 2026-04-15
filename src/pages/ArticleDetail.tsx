import { useIsAr } from "@/hooks/useIsAr";
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
  Heart, ThumbsUp, Tag, ArrowUpRight, Quote,
  BarChart3, Users, TrendingUp,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ArticleReadingProgress } from "@/components/articles/ArticleReadingProgress";
import { ArticleTableOfContents } from "@/components/articles/ArticleTableOfContents";
import { ArticleTextToSpeech } from "@/components/articles/ArticleTextToSpeech";
import { ArticleImageLightbox, ZoomIn } from "@/components/articles/ArticleImageLightbox";
import { ArticleHighlightShare } from "@/components/articles/ArticleHighlightShare";
import { ArticleEstimatedTimeLeft } from "@/components/articles/ArticleEstimatedTimeLeft";
import { ArticleAnnotations } from "@/components/articles/ArticleAnnotations";
import { ArticleCopyProtect } from "@/components/articles/ArticleCopyProtect";
import { trackArticleRead } from "@/components/news/NewsReadingStats";
import { ArticleAISummary } from "@/components/articles/ArticleAISummary";
import { NewsRelatedTopics } from "@/components/articles/ArticleRelatedTopics";
import { ArticleEngagementHeatmap } from "@/components/articles/ArticleEngagementHeatmap";
import { ArticleLiveReaders } from "@/components/articles/ArticleLiveReaders";
import { ArticleMoodReactions } from "@/components/articles/ArticleMoodReactions";
import { ArticleSmartRecommendations } from "@/components/articles/ArticleSmartRecommendations";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

function calculateReadingTime(text: string): number {
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).filter(Boolean).length / 200));
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const FONT_SIZES = ["prose-sm", "prose-base", "prose-lg"] as const;
const FONT_LABELS = ["S", "M", "L"] as const;

const TYPE_LABELS: Record<string, { en: string; ar: string; color: string }> = {
  news: { en: "News", ar: "أخبار", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  blog: { en: "Blog", ar: "مدونة", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  article: { en: "Article", ar: "مقال", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20" },
  exhibition: { en: "Exhibition", ar: "معرض", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  interview: { en: "Interview", ar: "مقابلة", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
};

const MetaChip = memo(function MetaChip({ icon: Icon, children, className }: { icon: typeof Calendar; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground/80", className)}>
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
        "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-medium transition-all duration-200 active:scale-95 touch-manipulation border",
        active
          ? "bg-primary/10 text-primary border-primary/20 shadow-sm shadow-primary/10"
          : "bg-card text-muted-foreground border-border/40 hover:bg-muted/60 hover:text-foreground"
      )}
    >
      <Icon className={cn("h-4 w-4", active && "fill-primary")} />
      <span>{label}</span>
      {count > 0 && <span className="text-xs opacity-60 tabular-nums">{count}</span>}
    </button>
  );
});

const StatRow = memo(function StatRow({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-xs py-2">
      <span className="text-muted-foreground flex items-center gap-2">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
});

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const isAr = useIsAr();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [fontSizeIdx, setFontSizeIdx] = useState(1);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [helpful, setHelpful] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const { data: article, isLoading } = useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, title_ar, slug, content, content_ar, excerpt, excerpt_ar, featured_image_url, gallery_urls, author_id, category_id, type, status, published_at, view_count, is_featured, event_start, event_end, event_location, event_location_ar, metadata, created_at, updated_at")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw handleSupabaseError(error);
      if (!data) throw new Error("Not found");
      return data;
    },
    enabled: !!slug,
  });

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

  // Increment view count in DB (real tracking)
  useEffect(() => {
    if (article?.id) {
      supabase.from("articles").update({ view_count: (article.view_count || 0) + 1 }).eq("id", article.id).then(null, () => {});
    }
  }, [article?.id]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 600);
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
        .limit(4);
      return data || [];
    },
    enabled: !!article?.id,
  });

  const title = article ? (isAr && article.title_ar ? article.title_ar : article.title) : "";
  const content = article ? (isAr && article.content_ar ? article.content_ar : article.content) : "";
  const excerpt = article ? (isAr && article.excerpt_ar ? article.excerpt_ar : article.excerpt) : "";
  const eventLocation = article ? (isAr && article.event_location_ar ? article.event_location_ar : article.event_location) : "";
  const readingTime = useMemo(() => calculateReadingTime(content), [content]);
  const wordCount = useMemo(() => countWords(content), [content]);

  // Track reading stats after 60% scroll
  useEffect(() => {
    if (!article?.id) return;
    let tracked = false;
    const handleScroll = () => {
      if (tracked) return;
      const scrollPct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollPct > 0.6) {
        tracked = true;
        trackArticleRead(article.type, readingTime, wordCount);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [article?.id, article?.type, readingTime, wordCount]);

  const formatDate = (date: string) => format(new Date(date), "d MMMM yyyy", { locale: isAr ? ar : enUS });
  const formatTime = (date: string) => format(new Date(date), "h:mm a", { locale: isAr ? ar : enUS });
  const relativeDate = (date: string) => formatDistanceToNow(new Date(date), { addSuffix: true, locale: isAr ? ar : enUS });

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

  const typeMeta = article ? (TYPE_LABELS[article.type] || TYPE_LABELS.news) : TYPE_LABELS.news;

  // ─── Loading skeleton ───
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="relative w-full aspect-[2.2/1] max-h-[600px] bg-muted animate-pulse" />
          <div className="container max-w-4xl mx-auto px-4 py-12 space-y-5">
            <Skeleton className="h-10 w-3/4 rounded-xl" />
            <Skeleton className="h-5 w-1/2 rounded-xl" />
            <div className="space-y-3 pt-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 rounded-lg" style={{ width: `${90 - i * 8}%` }} />
              ))}
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
              <Link to="/blog">{isAr ? "العودة للمقالات" : "Back to Articles"}</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const hasHeroImage = article.featured_image_url && !imageFailed;
  const tags = (articleTags || []).map((t) => t.content_tags).filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col" dir={isAr ? "rtl" : "ltr"}>
      <ArticleReadingProgress />
      <ArticleHighlightShare articleUrl={currentUrl} isAr={isAr} />
      <ArticleCopyProtect articleTitle={title} articleUrl={currentUrl} isAr={isAr} />
      {lightboxIdx !== null && article?.gallery_urls && (
        <ArticleImageLightbox
          images={article.gallery_urls}
          currentIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNavigate={setLightboxIdx}
          title={title}
        />
      )}
      <SEOHead
        title={`${title} | ${isAr ? "الطهاة" : "AlToha"}`}
        description={(excerpt || `${title}`).slice(0, 155)}
        ogImage={article.featured_image_url || undefined}
        ogType="article"
        canonical={`https://altoha.com/articles/${article.slug}`}
        lang={language}
        publishedTime={article.published_at || article.created_at}
        modifiedTime={article.updated_at}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: title,
          description: excerpt || undefined,
          image: article.featured_image_url || undefined,
          datePublished: article.published_at || article.created_at,
          dateModified: article.updated_at,
          wordCount,
          author: { "@type": "Organization", name: "AlToha" },
          publisher: {
            "@type": "Organization",
            name: "AlToha",
            url: "https://altoha.com",
            logo: { "@type": "ImageObject", url: "https://altoha.com/pwa-512x512.png" },
          },
          mainEntityOfPage: `https://altoha.com/articles/${article.slug}`,
        }}
      />
      <Header />

      <main className="flex-1">
        {/* ─── Immersive Full-Bleed Hero ─── */}
        <section className="relative w-full overflow-hidden bg-card">
          {hasHeroImage ? (
            <div className="relative w-full aspect-[2/1] sm:aspect-[2.4/1] max-h-[600px]">
              <img src={article.featured_image_url!}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover will-change-transform"
                onError={() => setImageFailed(true)}
                loading="eager"
                fetchPriority="high"
              />
              {/* 4-layer cinematic gradient for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute inset-0 bg-black/10" />

              {/* Hero content overlay */}
              <div className="absolute inset-x-0 bottom-0 z-10">
                <div className="container max-w-5xl mx-auto px-5 sm:px-8 pb-10 md:pb-14">
                  {/* Breadcrumb trail */}
                  <nav className="flex items-center gap-2 mb-5 flex-wrap" aria-label="Breadcrumb">
                    <Button variant="ghost" size="sm" asChild className="rounded-xl gap-1.5 text-xs h-8 text-white/80 hover:text-primary-foreground hover:bg-white/10 active:scale-95 transition-all backdrop-blur-sm">
                      <Link to="/blog">
                        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                        {isAr ? "المقالات" : "Articles"}
                      </Link>
                    </Button>
                    <span className="text-white/25 text-sm">/</span>
                    <Badge className={cn("capitalize rounded-xl text-xs px-2.5 py-0.5 border backdrop-blur-sm", typeMeta.color)}>
                      {isAr ? typeMeta.ar : typeMeta.en}
                    </Badge>
                    {article.is_featured && (
                      <Badge className="rounded-xl text-xs px-2.5 py-0.5 bg-chart-4/20 text-chart-4 border-chart-4/30 gap-1 backdrop-blur-sm">
                        <Sparkles className="h-2.5 w-2.5" />
                        {isAr ? "مميز" : "Featured"}
                      </Badge>
                    )}
                    {(article.view_count || 0) >= 100 && (
                      <Badge className="rounded-xl text-xs px-2.5 py-0.5 bg-orange-500/20 text-orange-300 border-orange-500/30 gap-1 backdrop-blur-sm">
                        🔥 {isAr ? "رائج" : "Trending"}
                      </Badge>
                    )}
                  </nav>

                  {/* Title */}
                  <h1 className="font-serif text-3xl sm:text-4xl md:text-[2.75rem] lg:text-5xl font-extrabold leading-[1.1] tracking-tight text-primary-foreground text-balance mb-5 max-w-4xl drop-shadow-2xl">
                    {title}
                  </h1>

                  {/* Subtitle / excerpt on hero */}
                  {excerpt && (
                    <p className="text-sm sm:text-base text-white/70 font-light max-w-2xl mb-6 line-clamp-2 leading-relaxed">
                      {excerpt}
                    </p>
                  )}

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    <span className="inline-flex items-center gap-1.5 text-[0.8125rem] text-white/75">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(article.published_at || article.created_at)}
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1.5 text-[0.8125rem] text-white/60" title={formatDate(article.published_at || article.created_at)}>
                      ({relativeDate(article.published_at || article.created_at)})
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/25 hidden sm:block" />
                    <span className="inline-flex items-center gap-1.5 text-[0.8125rem] text-white/75">
                      <BookOpen className="h-3.5 w-3.5" />
                      {readingTime} {isAr ? "دقيقة قراءة" : "min read"}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/25 hidden sm:block" />
                    <span className="inline-flex items-center gap-1.5 text-[0.8125rem] text-white/75">
                      <Eye className="h-3.5 w-3.5" />
                      {(article.view_count || 0).toLocaleString()} {isAr ? "مشاهدة" : "views"}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/25 hidden sm:block" />
                    <ArticleLiveReaders articleId={article.id} isAr={isAr} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* No-image fallback header */
            <div className="relative bg-gradient-to-br from-primary/10 via-background to-muted/30 border-b border-border/20">
              <div className="container max-w-5xl mx-auto px-5 sm:px-8 pt-8 pb-10 md:pt-10 md:pb-14">
                <nav className="flex items-center gap-2 mb-5 flex-wrap" aria-label="Breadcrumb">
                  <Button variant="ghost" size="sm" asChild className="rounded-xl gap-1.5 text-xs h-8 hover:bg-muted/80 active:scale-95 transition-all">
                    <Link to="/blog">
                      <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                      {isAr ? "المقالات" : "Articles"}
                    </Link>
                  </Button>
                  <span className="text-muted-foreground/30 text-sm">/</span>
                  <Badge className={cn("capitalize rounded-xl text-xs px-2.5 py-0.5 border", typeMeta.color)}>
                    {isAr ? typeMeta.ar : typeMeta.en}
                  </Badge>
                  {article.is_featured && (
                    <Badge className="rounded-xl text-xs px-2.5 py-0.5 bg-chart-4/10 text-chart-4 border-chart-4/20 gap-1">
                      <Sparkles className="h-2.5 w-2.5" />
                      {isAr ? "مميز" : "Featured"}
                    </Badge>
                  )}
                </nav>
                <h1 className="font-serif text-3xl sm:text-4xl md:text-[2.75rem] lg:text-5xl font-extrabold leading-[1.1] tracking-tight text-balance mb-5 max-w-4xl">
                  {title}
                </h1>
                {excerpt && (
                  <p className="text-sm sm:text-base text-muted-foreground font-light max-w-2xl mb-6 leading-relaxed">
                    {excerpt}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <MetaChip icon={Calendar}>{formatDate(article.published_at || article.created_at)}</MetaChip>
                  <MetaChip icon={BookOpen}>{readingTime} {isAr ? "دقيقة قراءة" : "min read"}</MetaChip>
                  <MetaChip icon={Eye}>{(article.view_count || 0).toLocaleString()} {isAr ? "مشاهدة" : "views"}</MetaChip>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ─── Sticky Toolbar ─── */}
        <div className="border-b border-border/30 bg-background/80 backdrop-blur-xl sticky top-0 z-30 shadow-[0_1px_3px_rgb(0_0_0/0.04)]">
          <div className="container max-w-5xl mx-auto px-5 sm:px-8">
            <div className="flex items-center gap-1.5 sm:gap-2 py-2 overflow-x-auto scrollbar-hide">
              {/* Print */}
              <Button
                variant="ghost" size="sm"
                className="rounded-xl h-8 w-8 p-0 hover:bg-muted/80 shrink-0"
                onClick={() => window.print()}
                title={isAr ? "طباعة" : "Print"}
              >
                <Printer className="h-3.5 w-3.5" />
              </Button>

              {/* Bookmark */}
              <Button
                variant="ghost" size="sm"
                className={cn("rounded-xl h-8 w-8 p-0 hover:bg-muted/80 shrink-0", bookmarked && "text-primary bg-primary/5")}
                onClick={() => {
                  setBookmarked(!bookmarked);
                  toast({ title: bookmarked ? (isAr ? "تم إزالة الحفظ" : "Removed") : (isAr ? "تم الحفظ" : "Bookmarked!") });
                }}
                title={isAr ? "حفظ" : "Bookmark"}
              >
                {bookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
              </Button>

              {/* Like inline */}
              <Button
                variant="ghost" size="sm"
                className={cn("rounded-xl h-8 px-2.5 gap-1 text-xs shrink-0", liked && "text-primary bg-primary/5")}
                onClick={() => setLiked(!liked)}
              >
                <Heart className={cn("h-3.5 w-3.5", liked && "fill-primary")} />
                <span className="tabular-nums">{liked ? likeCount + 1 : likeCount}</span>
               </Button>

              <Separator orientation="vertical" className="h-5 mx-1 hidden sm:block" />

              {/* Text to Speech */}
              <ArticleTextToSpeech text={content} isAr={isAr} />

              {/* Share */}
              {shareLinks && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 rounded-xl border-border/40 text-xs h-8 active:scale-95 transition-all shrink-0">
                      <Share2 className="h-3 w-3" />
                      <span className="hidden sm:inline">{isAr ? "مشاركة" : "Share"}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isAr ? "start" : "end"} className="w-44 rounded-xl">
                    <DropdownMenuItem onClick={() => window.open(shareLinks.twitter, "_blank", "noopener,noreferrer")} className="cursor-pointer gap-2 rounded-lg text-xs">
                      <Twitter className="h-3.5 w-3.5" /> Twitter / X
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(shareLinks.facebook, "_blank", "noopener,noreferrer")} className="cursor-pointer gap-2 rounded-lg text-xs">
                      <Facebook className="h-3.5 w-3.5" /> Facebook
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(shareLinks.linkedin, "_blank", "noopener,noreferrer")} className="cursor-pointer gap-2 rounded-lg text-xs">
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

              {/* Estimated time left */}
              <ArticleEstimatedTimeLeft totalReadingTime={readingTime} isAr={isAr} />

              <Separator orientation="vertical" className="h-5 mx-0.5 hidden sm:block" />

              {/* Annotations */}
              <ArticleAnnotations articleId={article.id} isAr={isAr} />

              {/* Font size control — pushed to end */}
              <div className="flex items-center gap-0.5 ms-auto border border-border/30 rounded-xl overflow-hidden shrink-0">
                {FONT_LABELS.map((label, idx) => (
                  <button
                    key={label}
                    onClick={() => setFontSizeIdx(idx)}
                    className={cn(
                      "h-8 w-8 flex items-center justify-center text-xs font-medium transition-colors",
                      idx === fontSizeIdx
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/60"
                    )}
                    title={`${isAr ? "حجم الخط" : "Font size"}: ${label}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Event Info Banner ─── */}
        {article.type === "exhibition" && article.event_start && (
          <div className="container max-w-5xl mx-auto px-5 sm:px-8 mt-8">
            <Card className="rounded-2xl border-accent/20 bg-accent/5 overflow-hidden">
              <CardContent className="p-5 sm:p-6">
                <h3 className="font-semibold mb-3.5 flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {isAr ? "معلومات الحدث" : "Event Details"}
                </h3>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div className="flex items-center gap-2.5 text-xs rounded-xl bg-background/60 px-4 py-3">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{formatDate(article.event_start)}{article.event_end && ` – ${formatDate(article.event_end)}`}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs rounded-xl bg-background/60 px-4 py-3">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{formatTime(article.event_start)}</span>
                  </div>
                  {eventLocation && (
                    <div className="flex items-center gap-2.5 text-xs sm:col-span-2 rounded-xl bg-background/60 px-4 py-3">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{eventLocation}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── Content + Sidebar ─── */}
        <div className="container max-w-5xl mx-auto px-5 sm:px-8 pt-10 pb-14">
          <div className="grid gap-12 lg:grid-cols-[1fr_240px]">
            {/* ─── Main Article ─── */}
            <div className="min-w-0">
              {/* AI Summary */}
              <div className="mb-8">
                <ArticleAISummary content={content} title={title} isAr={isAr} />
              </div>

              <article
                className={cn(
                  "prose max-w-none dark:prose-invert",
                  FONT_SIZES[fontSizeIdx],
                  "prose-headings:font-serif prose-headings:scroll-mt-24 prose-headings:tracking-tight",
                  "prose-p:leading-[1.9] prose-p:text-muted-foreground/90",
                  "prose-img:rounded-2xl prose-img:shadow-md prose-img:my-8",
                  "prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium",
                  "prose-blockquote:border-primary/30 prose-blockquote:bg-muted/20 prose-blockquote:rounded-e-2xl prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:not-italic prose-blockquote:my-8",
                  "prose-li:leading-relaxed prose-li:marker:text-primary/50",
                  "prose-hr:border-border/30 prose-hr:my-12",
                  "prose-strong:text-foreground",
                  "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:before:content-none prose-code:after:content-none",
                  "prose-pre:rounded-2xl prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/30",
                  "prose-table:rounded-xl prose-th:bg-muted/40 prose-th:px-4 prose-th:py-2.5 prose-td:px-4 prose-td:py-2.5",
                  "prose-h2:text-xl prose-h2:md:text-2xl prose-h2:mt-14 prose-h2:mb-5",
                  "prose-h3:text-lg prose-h3:mt-10 prose-h3:mb-4",
                )}
              >
                <ReactMarkdown
                  components={{
                    h1: ({ children, ...props }) => <h1 id={makeId(children)} {...props}>{children}</h1>,
                    h2: ({ children, ...props }) => <h2 id={makeId(children)} {...props}>{children}</h2>,
                    h3: ({ children, ...props }) => <h3 id={makeId(children)} {...props}>{children}</h3>,
                    img: ({ src, alt, ...props }) => (
                      <figure className="my-10 not-prose">
                        <img src={src} alt={alt || ""} className="w-full rounded-2xl shadow-lg" loading="lazy" decoding="async" {...props} />
                        {alt && alt !== "image" && (
                          <figcaption className="text-center text-xs text-muted-foreground mt-3 italic">{alt}</figcaption>
                        )}
                      </figure>
                    ),
                    blockquote: ({ children, ...props }) => (
                      <blockquote className="relative" {...props}>
                        <Quote className="absolute -top-2 -start-1 h-6 w-6 text-primary/15" />
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>

                {/* Gallery */}
                {article.gallery_urls && article.gallery_urls.length > 0 && (
                  <>
                    <Separator className="my-12" />
                    <h3 className="font-semibold mb-5 flex items-center gap-2 not-prose text-sm">
                      <Sparkles className="h-4 w-4 text-primary" />
                      {isAr ? "معرض الصور" : "Photo Gallery"}
                      <span className="text-xs text-muted-foreground ms-1">({article.gallery_urls.length})</span>
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 not-prose">
                      {article.gallery_urls.map((url, i) => (
                        <button
                          key={i}
                          onClick={() => setLightboxIdx(i)}
                          className="group relative aspect-video rounded-2xl overflow-hidden ring-1 ring-border/20 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-zoom-in"
                        >
                          <img loading="lazy" src={url}
                            alt={`${title} - ${i + 1}`}
                            className="w-full h-full object-cover"
                           
                            decoding="async"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <ZoomIn className="h-6 w-6 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </article>

              {/* ─── Tags ─── */}
              {tags.length > 0 && (
                <div className="mt-10 pt-6 border-t border-border/30">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    {tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="rounded-xl text-xs px-3 py-1.5 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                      >
                        {isAr && tag.name_ar ? tag.name_ar : tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── Related Topics ─── */}
              {tags.length > 0 && (
                <NewsRelatedTopics
                  currentArticleId={article.id}
                  articleTags={tags}
                  isAr={isAr}
                />
              )}

              {/* ─── Mood Reactions ─── */}
              <div className="mt-10 pt-8 border-t border-border/30">
                <ArticleMoodReactions articleId={article.id} isAr={isAr} />
              </div>

              {/* ─── Smart Recommendations ─── */}
              <ArticleSmartRecommendations
                currentArticleId={article.id}
                articleType={article.type}
                categoryId={article.category_id}
                tags={tags}
                isAr={isAr}
              />

              {/* ─── Newsletter CTA ─── */}
              <div className="mt-8 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/15 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-start">
                  <div className="h-14 w-14 rounded-3xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif font-bold text-base mb-1">{isAr ? "لا تفوّت المقالات الجديدة" : "Don't miss new articles"}</h3>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      {isAr ? "تابعنا للحصول على أحدث المقالات والأخبار في عالم الطهي" : "Stay updated with the latest articles and culinary news"}
                    </p>
                  </div>
                  <Button asChild size="sm" className="rounded-xl shadow-md shadow-primary/15 gap-1.5 shrink-0">
                    <Link to="/blog">
                      {isAr ? "تصفح المزيد" : "Browse More"}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* ─── Sidebar ─── */}
            <aside className="hidden lg:block">
              <div className="sticky top-14 space-y-5 pt-1">
                <ArticleEngagementHeatmap content={content} isAr={isAr} />
                <ArticleTableOfContents content={content} isAr={isAr} />

                {/* Article Stats */}
                <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1">
                    <BarChart3 className="h-3 w-3" />
                    {isAr ? "إحصائيات المقال" : "Article Stats"}
                  </p>
                  <Separator className="my-3" />
                  <div className="divide-y divide-border/20">
                    <StatRow icon={Eye} label={isAr ? "مشاهدات" : "Views"} value={(article.view_count || 0).toLocaleString()} />
                    <StatRow icon={BookOpen} label={isAr ? "وقت القراءة" : "Read time"} value={`${readingTime} ${isAr ? "د" : "min"}`} />
                    <StatRow icon={FileText} label={isAr ? "عدد الكلمات" : "Words"} value={wordCount.toLocaleString()} />
                    <StatRow icon={Heart} label={isAr ? "إعجابات" : "Likes"} value={liked ? likeCount + 1 : likeCount} />
                    <StatRow icon={Calendar} label={isAr ? "نُشر" : "Published"} value={relativeDate(article.published_at || article.created_at)} />
                  </div>
                </div>

                {/* Quick Share */}
                {shareLinks && (
                  <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      {isAr ? "شارك المقال" : "Share Article"}
                    </p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => window.open(shareLinks.twitter, "_blank", "noopener,noreferrer")} className="h-9 w-9 rounded-xl bg-muted/60 hover:bg-muted flex items-center justify-center transition-colors active:scale-95" title="Twitter">
                        <Twitter className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => window.open(shareLinks.facebook, "_blank", "noopener,noreferrer")} className="h-9 w-9 rounded-xl bg-muted/60 hover:bg-muted flex items-center justify-center transition-colors active:scale-95" title="Facebook">
                        <Facebook className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => window.open(shareLinks.linkedin, "_blank", "noopener,noreferrer")} className="h-9 w-9 rounded-xl bg-muted/60 hover:bg-muted flex items-center justify-center transition-colors active:scale-95" title="LinkedIn">
                        <Linkedin className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={handleCopyLink} className="h-9 w-9 rounded-xl bg-muted/60 hover:bg-muted flex items-center justify-center transition-colors active:scale-95" title={isAr ? "نسخ" : "Copy"}>
                        {copied ? <Check className="h-3.5 w-3.5 text-chart-2" /> : <Link2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>

        {/* ─── Related Articles ─── */}
        {relatedArticles && relatedArticles.length > 0 && (
          <section className="border-t border-border/20 bg-muted/10">
            <div className="container max-w-5xl mx-auto px-5 sm:px-8 py-16">
              <div className="flex items-center gap-3 mb-10">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <h2 className="font-serif text-xl font-bold">{isAr ? "مقالات ذات صلة" : "Related Articles"}</h2>
                <div className="h-px flex-1 bg-border/30" />
                <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs gap-1 text-muted-foreground hover:text-primary">
                  <Link to="/blog">
                    {isAr ? "عرض الكل" : "View All"}
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
                {relatedArticles.slice(0, 4).map((r) => {
                  const rTitle = isAr && r.title_ar ? r.title_ar : r.title;
                  const rExcerpt = isAr && r.excerpt_ar ? r.excerpt_ar : r.excerpt;
                  return (
                    <Link key={r.id} to={`/blog/${r.slug}`} className="group">
                      <Card className="overflow-hidden rounded-2xl border-border/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 h-full flex flex-row">
                        {r.featured_image_url ? (
                          <div className="w-36 sm:w-44 relative overflow-hidden shrink-0">
                            <img src={r.featured_image_url} alt={rTitle} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/10" />
                          </div>
                        ) : (
                          <div className="w-36 sm:w-44 bg-gradient-to-br from-primary/10 to-muted flex items-center justify-center shrink-0">
                            <FileText className="h-8 w-8 text-muted-foreground/20" />
                          </div>
                        )}
                        <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <Badge className={cn("text-xs rounded-lg px-2 py-0.5 mb-2.5 capitalize border", TYPE_LABELS[r.type]?.color || typeMeta.color)}>
                              {isAr ? (TYPE_LABELS[r.type]?.ar || r.type) : (TYPE_LABELS[r.type]?.en || r.type)}
                            </Badge>
                            <h3 className="font-semibold line-clamp-2 mb-1.5 group-hover:text-primary transition-colors text-sm">{rTitle}</h3>
                            {rExcerpt && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{rExcerpt}</p>}
                          </div>
                          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/20 text-xs text-muted-foreground">
                            {r.published_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-2.5 w-2.5" />
                                {formatDate(r.published_at)}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Eye className="h-2.5 w-2.5" />
                              {((r as unknown as Record<string, number>).view_count || 0).toLocaleString()}
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
          "fixed bottom-6 end-6 z-50 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 active:scale-90 touch-manipulation",
          showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
        aria-label="Scroll to top"
      >
        <ChevronUp className="h-5 w-5" />
      </button>
    </div>
  );
}
