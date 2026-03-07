import { lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, ChefHat, BookOpen, Users, Lightbulb, ArrowRight, MapPin, Calendar, Landmark, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface RecommendationData {
  competitions: any[];
  recipes: any[];
  articles: any[];
  chefs: any[];
  exhibitions: any[];
  tip: string;
  tip_ar: string;
}

export default function ForYou() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["smart-recommendations-full", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("smart-recommendations");
      if (error) throw error;
      return data as RecommendationData;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 15,
    retry: 1,
  });

  const sections = [
    {
      key: "competitions",
      title: isAr ? "مسابقات مقترحة" : "Recommended Competitions",
      icon: Trophy,
      color: "text-primary",
      bg: "bg-primary/10",
      items: data?.competitions || [],
      renderItem: (c: any) => (
        <Link key={c.id} to={`/competitions/${c.slug}`} className="group">
          <Card className="overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 border-border/40">
            <CardContent className="p-0">
              {c.image_url && (
                <div className="h-32 overflow-hidden">
                  <img src={c.image_url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </div>
              )}
              <div className="p-3 space-y-1.5">
                <p className="text-sm font-semibold line-clamp-2">{isAr ? c.title_ar || c.title : c.title}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  {c.category && <Badge variant="outline" className="text-[9px]">{c.category}</Badge>}
                  {c.country_code && <span>{c.country_code}</span>}
                </div>
                {c._reason && (
                  <p className="text-[10px] text-primary/80 flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" /> {c._reason}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ),
    },
    {
      key: "exhibitions",
      title: isAr ? "معارض مقترحة" : "Recommended Exhibitions",
      icon: Landmark,
      color: "text-chart-5",
      bg: "bg-chart-5/10",
      items: data?.exhibitions || [],
      renderItem: (e: any) => (
        <Link key={e.id} to={`/exhibitions/${e.slug}`} className="group">
          <Card className="overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 border-border/40">
            <CardContent className="p-0">
              {e.image_url && (
                <div className="h-32 overflow-hidden">
                  <img src={e.image_url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </div>
              )}
              <div className="p-3 space-y-1.5">
                <p className="text-sm font-semibold line-clamp-2">{isAr ? e.title_ar || e.title : e.title}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  {e.city && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{e.city}</span>}
                  {e.start_date && <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{format(new Date(e.start_date), "MMM d")}</span>}
                </div>
                {e._reason && (
                  <p className="text-[10px] text-chart-5/80 flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" /> {e._reason}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ),
    },
    {
      key: "recipes",
      title: isAr ? "وصفات مقترحة" : "Recommended Recipes",
      icon: ChefHat,
      color: "text-chart-4",
      bg: "bg-chart-4/10",
      items: data?.recipes || [],
      renderItem: (r: any) => (
        <Link key={r.id} to={`/recipes/${r.slug}`} className="group">
          <Card className="overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 border-border/40">
            <CardContent className="p-0">
              {r.image_url && (
                <div className="h-32 overflow-hidden">
                  <img src={r.image_url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </div>
              )}
              <div className="p-3 space-y-1.5">
                <p className="text-sm font-semibold line-clamp-2">{isAr ? r.title_ar || r.title : r.title}</p>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[9px]">{r.difficulty || "easy"}</Badge>
                  {r.cuisine_type && <span className="text-[10px] text-muted-foreground">{r.cuisine_type}</span>}
                </div>
                {r._reason && (
                  <p className="text-[10px] text-chart-4/80 flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" /> {r._reason}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ),
    },
    {
      key: "articles",
      title: isAr ? "مقالات مقترحة" : "Recommended Articles",
      icon: BookOpen,
      color: "text-chart-2",
      bg: "bg-chart-2/10",
      items: data?.articles || [],
      renderItem: (a: any) => (
        <Link key={a.id} to={`/news/${a.slug}`} className="group">
          <Card className="overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 border-border/40">
            <CardContent className="p-0">
              {a.featured_image_url && (
                <div className="h-32 overflow-hidden">
                  <img src={a.featured_image_url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </div>
              )}
              <div className="p-3 space-y-1.5">
                <p className="text-sm font-semibold line-clamp-2">{isAr ? a.title_ar || a.title : a.title}</p>
                <Badge variant="secondary" className="text-[9px]">{a.type}</Badge>
                {a._reason && (
                  <p className="text-[10px] text-chart-2/80 flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" /> {a._reason}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ),
    },
    {
      key: "chefs",
      title: isAr ? "طهاة يناسبونك" : "Chefs You May Like",
      icon: Users,
      color: "text-chart-3",
      bg: "bg-chart-3/10",
      items: data?.chefs || [],
      renderItem: (c: any) => (
        <Link key={c.user_id} to={`/chef/${c.username || c.user_id}`} className="group">
          <Card className="transition-all hover:shadow-md hover:-translate-y-0.5 border-border/40">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <Avatar className="h-14 w-14 ring-2 ring-border/20">
                <AvatarImage src={c.avatar_url || ""} />
                <AvatarFallback>{(c.full_name || "U")[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{isAr ? c.full_name_ar || c.full_name : c.full_name}</p>
                <p className="text-[10px] text-muted-foreground">{c.specialization || (isAr ? "طاهي" : "Chef")}</p>
              </div>
              {c.is_verified && <Badge variant="secondary" className="text-[9px]">✓ {isAr ? "موثق" : "Verified"}</Badge>}
              {c._reason && (
                <p className="text-[10px] text-chart-3/80 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" /> {c._reason}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      ),
    },
  ];

  return (
    <PageShell title={isAr ? "مقترح لك" : "For You"} description="AI-powered personalized recommendations">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{isAr ? "مقترح لك" : "For You"}</h1>
            <p className="text-xs text-muted-foreground">{isAr ? "توصيات مخصصة بالذكاء الاصطناعي" : "AI-powered personalized recommendations"}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1.5">
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          {isAr ? "تحديث" : "Refresh"}
        </Button>
      </div>

      {/* AI Tip */}
      {data?.tip && (
        <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
              <Lightbulb className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-semibold mb-0.5">{isAr ? "نصيحة مخصصة" : "Personalized Tip"}</p>
              <p className="text-sm text-muted-foreground">{isAr ? data.tip_ar : data.tip}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(j => <Skeleton key={j} className="h-48 rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sections */}
      {!isLoading && (
        <div className="space-y-8">
          {sections.map((section) => {
            if (!section.items.length) return null;
            const Icon = section.icon;
            return (
              <div key={section.key}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-xl ${section.bg}`}>
                    <Icon className={`h-3.5 w-3.5 ${section.color}`} />
                  </div>
                  <h2 className="text-base font-bold">{section.title}</h2>
                  <Badge variant="secondary" className="text-[10px]">{section.items.length}</Badge>
                </div>
                <div className={`grid gap-3 ${section.key === "chefs" ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"}`}>
                  {section.items.map(section.renderItem)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !data && (
        <Card className="text-center py-12">
          <CardContent>
            <Sparkles className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">{isAr ? "لم نتمكن من تحميل التوصيات. حاول مرة أخرى." : "Couldn't load recommendations. Try again."}</p>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
              {isAr ? "إعادة المحاولة" : "Retry"}
            </Button>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
