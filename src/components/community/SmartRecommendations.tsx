import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, ChefHat, BookOpen, Users, Lightbulb, ArrowRight, Landmark, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

interface RecommendationData {
  competitions: any[];
  recipes: any[];
  articles: any[];
  chefs: any[];
  exhibitions: any[];
  tip: string;
  tip_ar: string;
}

export function SmartRecommendations() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading, error } = useQuery({
    queryKey: ["smart-recommendations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("smart-recommendations");
      if (error) throw error;
      return data as RecommendationData;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  if (!user || error) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {isAr ? "مقترح لك بالذكاء الاصطناعي" : "AI Recommendations"}
          </CardTitle>
          <Link to="/for-you">
            <Button variant="ghost" size="sm" className="text-[10px] h-6 gap-1">
              {isAr ? "عرض الكل" : "View All"}
              <ArrowRight className="h-2.5 w-2.5 rtl:rotate-180" />
            </Button>
          </Link>
        </div>
        {data?.tip && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
            <Lightbulb className="h-3 w-3 text-amber-500 shrink-0" />
            {isAr ? data.tip_ar : data.tip}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : (
          <Tabs defaultValue="competitions" className="w-full">
            <TabsList className="w-full h-8 p-0.5 grid grid-cols-5">
              <TabsTrigger value="competitions" className="text-[10px] gap-1 px-1">
                <Trophy className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="exhibitions" className="text-[10px] gap-1 px-1">
                <Landmark className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="recipes" className="text-[10px] gap-1 px-1">
                <ChefHat className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="articles" className="text-[10px] gap-1 px-1">
                <BookOpen className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="chefs" className="text-[10px] gap-1 px-1">
                <Users className="h-3 w-3" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="competitions" className="mt-2 space-y-1.5">
              {data?.competitions?.length ? data.competitions.map((c: any) => (
                <Link key={c.id} to={`/competitions/${c.slug}`} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                  {c.image_url && <img src={c.image_url} alt="" className="h-8 w-8 rounded object-cover shrink-0" loading="lazy" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{isAr ? c.title_ar || c.title : c.title}</p>
                    <p className="text-[10px] text-muted-foreground">{c.category} • {c.country_code}</p>
                    {c._reason && <p className="text-[9px] text-primary/70 flex items-center gap-0.5"><Sparkles className="h-2 w-2" />{c._reason}</p>}
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 rtl:rotate-180" />
                </Link>
              )) : <p className="text-xs text-muted-foreground text-center py-3">{isAr ? "لا توجد مسابقات" : "No competitions"}</p>}
            </TabsContent>

            <TabsContent value="exhibitions" className="mt-2 space-y-1.5">
              {data?.exhibitions?.length ? data.exhibitions.map((e: any) => (
                <Link key={e.id} to={`/exhibitions/${e.slug}`} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                  {e.image_url && <img src={e.image_url} alt="" className="h-8 w-8 rounded object-cover shrink-0" loading="lazy" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{isAr ? e.title_ar || e.title : e.title}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />{e.city || e.country_code}
                    </p>
                    {e._reason && <p className="text-[9px] text-chart-5/70 flex items-center gap-0.5"><Sparkles className="h-2 w-2" />{e._reason}</p>}
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 rtl:rotate-180" />
                </Link>
              )) : <p className="text-xs text-muted-foreground text-center py-3">{isAr ? "لا توجد معارض" : "No exhibitions"}</p>}
            </TabsContent>

            <TabsContent value="recipes" className="mt-2 space-y-1.5">
              {data?.recipes?.length ? data.recipes.map((r: any) => (
                <Link key={r.id} to={`/recipes/${r.slug}`} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                  {r.image_url && <img src={r.image_url} alt="" className="h-8 w-8 rounded object-cover shrink-0" loading="lazy" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{isAr ? r.title_ar || r.title : r.title}</p>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">{r.difficulty || "easy"}</Badge>
                      {r.cuisine_type && <span className="text-[10px] text-muted-foreground">{r.cuisine_type}</span>}
                    </div>
                    {r._reason && <p className="text-[9px] text-chart-4/70 flex items-center gap-0.5"><Sparkles className="h-2 w-2" />{r._reason}</p>}
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 rtl:rotate-180" />
                </Link>
              )) : <p className="text-xs text-muted-foreground text-center py-3">{isAr ? "لا توجد وصفات" : "No recipes"}</p>}
            </TabsContent>

            <TabsContent value="articles" className="mt-2 space-y-1.5">
              {data?.articles?.length ? data.articles.map((a: any) => (
                <Link key={a.id} to={`/news/${a.slug}`} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                  {a.featured_image_url && <img src={a.featured_image_url} alt="" className="h-8 w-8 rounded object-cover shrink-0" loading="lazy" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{isAr ? a.title_ar || a.title : a.title}</p>
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">{a.type}</Badge>
                    {a._reason && <p className="text-[9px] text-chart-2/70 flex items-center gap-0.5"><Sparkles className="h-2 w-2" />{a._reason}</p>}
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 rtl:rotate-180" />
                </Link>
              )) : <p className="text-xs text-muted-foreground text-center py-3">{isAr ? "لا توجد مقالات" : "No articles"}</p>}
            </TabsContent>

            <TabsContent value="chefs" className="mt-2 space-y-1.5">
              {data?.chefs?.length ? data.chefs.map((c: any) => (
                <Link key={c.user_id} to={`/chef/${c.username || c.user_id}`} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={c.avatar_url || ""} />
                    <AvatarFallback className="text-xs">{(c.full_name || "U")[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{isAr ? c.full_name_ar || c.full_name : c.full_name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.specialization || (isAr ? "طاهي" : "Chef")}</p>
                    {c._reason && <p className="text-[9px] text-chart-3/70 flex items-center gap-0.5"><Sparkles className="h-2 w-2" />{c._reason}</p>}
                  </div>
                  {c.is_verified && <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">✓</Badge>}
                </Link>
              )) : <p className="text-xs text-muted-foreground text-center py-3">{isAr ? "لا يوجد طهاة" : "No chefs"}</p>}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
