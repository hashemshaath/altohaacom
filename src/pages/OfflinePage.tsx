import { useState, useEffect } from "react";
import { useOnlineStatus } from "@/hooks/usePWA";
import { useLanguage } from "@/i18n/LanguageContext";
import { getCachedItems, getCacheStats } from "@/lib/offlineCache";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WifiOff, RefreshCw, Home, Database, Trophy, BookOpen, ChefHat, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface CachedCompetition {
  id: string;
  title: string;
  title_ar?: string;
  venue?: string;
  venue_ar?: string;
  competition_start?: string;
  cover_image_url?: string;
}

interface CachedArticle {
  id: string;
  title: string;
  title_ar?: string;
  slug: string;
  excerpt?: string;
  excerpt_ar?: string;
  featured_image_url?: string;
  type: string;
}

interface CachedRecipe {
  id: string;
  title: string;
  title_ar?: string;
  slug?: string;
  description?: string;
  description_ar?: string;
  image_url?: string;
  difficulty?: string;
}

type Tab = "competitions" | "articles" | "recipes";

export default function OfflinePage() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const isOnline = useOnlineStatus();
  const [tab, setTab] = useState<Tab>("competitions");
  const [competitions, setCompetitions] = useState<CachedCompetition[]>([]);
  const [articles, setArticles] = useState<CachedArticle[]>([]);
  const [recipes, setRecipes] = useState<CachedRecipe[]>([]);
  const [stats, setStats] = useState<{ competitions: number; articles: number; recipes: number; lastSync: number | null }>({
    competitions: 0, articles: 0, recipes: 0, lastSync: null,
  });

  useEffect(() => {
    const load = async () => {
      const [c, a, r, s] = await Promise.all([
        getCachedItems<CachedCompetition>("competitions"),
        getCachedItems<CachedArticle>("articles"),
        getCachedItems<CachedRecipe>("recipes"),
        getCacheStats(),
      ]);
      setCompetitions(c);
      setArticles(a);
      setRecipes(r);
      setStats(s);
    };
    load();
  }, []);

  const hasContent = competitions.length > 0 || articles.length > 0 || recipes.length > 0;

  // If back online, show simplified message
  if (isOnline) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-bold mb-2">{isAr ? "أنت متصل الآن!" : "You're back online!"}</h1>
        <p className="text-muted-foreground mb-6 text-sm">{isAr ? "تم استعادة الاتصال بالإنترنت" : "Internet connection restored"}</p>
        <Button onClick={() => window.location.href = "/"} className="gap-2">
          <Home className="h-4 w-4" />
          {isAr ? "العودة للرئيسية" : "Go Home"}
        </Button>
      </div>
    );
  }

  const tabs: { key: Tab; icon: typeof Trophy; labelEn: string; labelAr: string; count: number }[] = [
    { key: "competitions", icon: Trophy, labelEn: "Competitions", labelAr: "المسابقات", count: stats.competitions },
    { key: "articles", icon: BookOpen, labelEn: "Articles", labelAr: "المقالات", count: stats.articles },
    { key: "recipes", icon: ChefHat, labelEn: "Recipes", labelAr: "الوصفات", count: stats.recipes },
  ];

  return (
    <div className="flex min-h-[80vh] flex-col px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mx-auto mb-4">
          <WifiOff className="h-8 w-8 text-muted-foreground/60" />
        </div>
        <h1 className="text-xl font-bold mb-1">{isAr ? "وضع عدم الاتصال" : "Offline Mode"}</h1>
        <p className="text-muted-foreground text-sm">
          {isAr ? "تصفح المحتوى المخزن مسبقاً" : "Browse previously cached content"}
        </p>
        {stats.lastSync && (
          <p className="text-xs text-muted-foreground/70 mt-1 flex items-center justify-center gap-1">
            <Clock className="h-3 w-3" />
            {isAr ? "آخر مزامنة: " : "Last synced: "}
            {formatDistanceToNow(stats.lastSync, { addSuffix: true, locale: isAr ? ar : undefined })}
          </p>
        )}
      </div>

      {!hasContent ? (
        <div className="text-center py-12">
          <Database className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            {isAr
              ? "لا يوجد محتوى مخزن. سيتم تخزين المحتوى تلقائياً عند اتصالك بالإنترنت."
              : "No cached content available. Content will be automatically cached when you're online."}
          </p>
          <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {isAr ? "إعادة المحاولة" : "Retry"}
          </Button>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
            {tabs.map(({ key, icon: Icon, labelEn, labelAr: labelArVal, count }) => (
              <Button
                key={key}
                variant={tab === key ? "default" : "outline"}
                size="sm"
                className="gap-1.5 shrink-0 text-xs h-8 rounded-xl"
                onClick={() => setTab(key)}
              >
                <Icon className="h-3.5 w-3.5" />
                {isAr ? labelArVal : labelEn}
                {count > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ms-0.5">
                    {count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Content */}
          <div className="space-y-2">
            {tab === "competitions" && competitions.map((c) => (
              <Card key={c.id} className="overflow-hidden">
                <CardContent className="p-3 flex items-center gap-3">
                  {c.cover_image_url && (
                    <img src={c.cover_image_url} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{isAr ? (c.title_ar || c.title) : c.title}</p>
                    {(c.venue || c.venue_ar) && (
                      <p className="text-xs text-muted-foreground truncate">{isAr ? (c.venue_ar || c.venue) : c.venue}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {tab === "articles" && articles.map((a) => (
              <Card key={a.id} className="overflow-hidden">
                <CardContent className="p-3 flex items-center gap-3">
                  {a.featured_image_url && (
                    <img src={a.featured_image_url} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{isAr ? (a.title_ar || a.title) : a.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {isAr ? (a.excerpt_ar || a.excerpt) : a.excerpt}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{a.type}</Badge>
                </CardContent>
              </Card>
            ))}

            {tab === "recipes" && recipes.map((r) => (
              <Card key={r.id} className="overflow-hidden">
                <CardContent className="p-3 flex items-center gap-3">
                  {r.image_url && (
                    <img src={r.image_url} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{isAr ? (r.title_ar || r.title) : r.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {isAr ? (r.description_ar || r.description) : r.description}
                    </p>
                  </div>
                  {r.difficulty && (
                    <Badge variant="secondary" className="text-[10px] shrink-0">{r.difficulty}</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Bottom actions */}
      <div className="mt-8 flex flex-col gap-2 items-center">
        <Button variant="outline" onClick={() => window.location.reload()} className="gap-2 w-full max-w-xs">
          <RefreshCw className="h-4 w-4" />
          {isAr ? "إعادة المحاولة" : "Try Again"}
        </Button>
      </div>
    </div>
  );
}
