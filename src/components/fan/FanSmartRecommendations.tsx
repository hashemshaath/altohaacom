import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Lightbulb, UtensilsCrossed, Trophy, Users } from "lucide-react";
import { Link } from "react-router-dom";

export function FanSmartRecommendations() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["fan-smart-recs", user?.id],
    queryFn: async () => {
      if (!user) return { chefs: [], recipes: [], competitions: [] };

      // Get user interests & cuisines
      const { data: profile } = await supabase
        .from("profiles")
        .select("interests, favorite_cuisines")
        .eq("user_id", user.id)
        .single();

      const interests: string[] = (profile as any)?.interests || [];
      const cuisines: string[] = (profile as any)?.favorite_cuisines || [];

      // Get already followed IDs to exclude
      const { data: follows } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", user.id);
      const followedIds = new Set(follows?.map(f => f.following_id) || []);

      // Recommend chefs by matching specialization to interests/cuisines
      const searchTerms = [...interests, ...cuisines].slice(0, 5);
      let chefs: any[] = [];
      if (searchTerms.length > 0) {
        const { data: chefData } = await supabase
          .from("profiles")
          .select("user_id, full_name, username, avatar_url, specialization, account_type")
          .eq("account_type", "professional")
          .limit(20);

        chefs = (chefData || [])
          .filter(c => !followedIds.has(c.user_id) && c.user_id !== user.id)
          .filter(c => {
            const spec = (c.specialization || "").toLowerCase();
            return searchTerms.some(t => spec.includes(t.toLowerCase()));
          })
          .slice(0, 5);
      }

      // If no match-based results, fall back to popular chefs
      if (chefs.length === 0) {
        const { data: fallback } = await supabase
          .from("profiles")
          .select("user_id, full_name, username, avatar_url, specialization, account_type")
          .eq("account_type", "professional")
          .limit(10);
        chefs = (fallback || [])
          .filter(c => !followedIds.has(c.user_id) && c.user_id !== user.id)
          .slice(0, 5);
      }

      // Recommend competitions
      const { data: comps } = await supabase
        .from("competitions")
        .select("id, title, title_ar, slug, start_date, country_code")
        .gte("start_date", new Date().toISOString())
        .order("start_date", { ascending: true })
        .limit(3);

      return { chefs, recipes: [], competitions: comps || [] };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) return <div className="h-48 rounded-xl bg-muted/50 animate-pulse" />;
  if (!data) return null;

  const hasContent = data.chefs.length > 0 || data.competitions.length > 0;
  if (!hasContent) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-chart-3/10">
            <Lightbulb className="h-3.5 w-3.5 text-chart-3" />
          </div>
          {isAr ? "مقترحات لك" : "Recommended for You"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Recommended Chefs */}
        {data.chefs.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
              <Users className="h-3 w-3" />
              {isAr ? "طهاة قد تعجبك" : "Chefs you may like"}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {data.chefs.map((chef: any) => (
                <Link
                  key={chef.user_id}
                  to={`/u/${chef.username}`}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-border/30 hover:bg-muted/40 transition-colors shrink-0 w-20"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={chef.avatar_url} />
                    <AvatarFallback className="text-[10px]">{(chef.full_name || "?")[0]}</AvatarFallback>
                  </Avatar>
                  <p className="text-[10px] font-semibold text-center truncate w-full">{chef.full_name || chef.username}</p>
                  {chef.specialization && (
                    <Badge variant="secondary" className="text-[8px] h-3.5 px-1">{chef.specialization}</Badge>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Competitions */}
        {data.competitions.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              {isAr ? "مسابقات قادمة" : "Upcoming competitions"}
            </p>
            <div className="space-y-1.5">
              {data.competitions.map((comp: any) => (
                <Link
                  key={comp.id}
                  to={`/competitions/${comp.slug}`}
                  className="flex items-center gap-2.5 rounded-xl p-2 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Trophy className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{isAr ? comp.title_ar || comp.title : comp.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {comp.start_date && new Date(comp.start_date).toLocaleDateString(isAr ? "ar" : "en", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
