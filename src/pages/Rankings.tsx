import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, TrendingUp, TrendingDown, Minus, Search, Globe, ChefHat, Crown, Award } from "lucide-react";
import { countryFlag } from "@/lib/countryFlag";
import { Link } from "react-router-dom";

export default function Rankings() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [period, setPeriod] = useState("all_time");
  const [countryFilter, setCountryFilter] = useState("all");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: rankings, isLoading } = useQuery({
    queryKey: ["global-rankings", period, countryFilter, specialtyFilter],
    queryFn: async () => {
      let query = supabase
        .from("chef_rankings")
        .select("*")
        .eq("ranking_period", period)
        .order("rank", { ascending: true })
        .limit(100);

      if (countryFilter !== "all") query = query.eq("country_code", countryFilter);
      if (specialtyFilter !== "all") query = query.eq("specialty", specialtyFilter);

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles for these users
      if (!data?.length) return [];
      const userIds = data.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url, country_code")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      return data.map(r => ({ ...r, profile: profileMap.get(r.user_id) }));
    },
  });

  const { data: countries } = useQuery({
    queryKey: ["ranking-countries"],
    queryFn: async () => {
      const { data } = await supabase
        .from("chef_rankings")
        .select("country_code")
        .not("country_code", "is", null);
      const unique = [...new Set(data?.map(d => d.country_code).filter(Boolean))];
      return unique as string[];
    },
  });

  const filteredRankings = rankings?.filter(r => {
    if (!searchQuery) return true;
    const name = r.profile?.full_name?.toLowerCase() || "";
    const username = r.profile?.username?.toLowerCase() || "";
    return name.includes(searchQuery.toLowerCase()) || username.includes(searchQuery.toLowerCase());
  });

  const topThree = filteredRankings?.slice(0, 3) || [];
  const rest = filteredRankings?.slice(3) || [];

  const medalColors = ["text-yellow-500", "text-gray-400", "text-amber-700"];
  const podiumOrder = topThree.length === 3 ? [topThree[1], topThree[0], topThree[2]] : topThree;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead title={isAr ? "التصنيف العالمي للطهاة" : "Global Chef Rankings"} description="Discover the top-ranked chefs worldwide" />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border/40 bg-gradient-to-b from-primary/5 to-background">
          <div className="container py-10 sm:py-14">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{isAr ? "التصنيف العالمي للطهاة" : "Global Chef Rankings"}</h1>
                <p className="text-sm text-muted-foreground">{isAr ? "اكتشف أفضل الطهاة حول العالم" : "Discover the top-ranked chefs worldwide"}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <div className="sticky top-[64px] z-30 border-b border-border/40 bg-background/90 backdrop-blur-xl">
          <div className="container py-3 flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isAr ? "ابحث عن طاهٍ..." : "Search chefs..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9"
              />
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_time">{isAr ? "كل الأوقات" : "All Time"}</SelectItem>
                <SelectItem value="yearly">{isAr ? "سنوي" : "Yearly"}</SelectItem>
                <SelectItem value="monthly">{isAr ? "شهري" : "Monthly"}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={isAr ? "الدولة" : "Country"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "جميع الدول" : "All Countries"}</SelectItem>
                {countries?.map(c => (
                  <SelectItem key={c} value={c}>{countryFlag(c)} {c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="container py-8">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : !filteredRankings?.length ? (
            <Card>
              <CardContent className="flex flex-col items-center py-16 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground/20 mb-4" />
                <p className="font-semibold">{isAr ? "لا توجد تصنيفات بعد" : "No rankings yet"}</p>
                <p className="text-sm text-muted-foreground">{isAr ? "ستظهر التصنيفات بعد انتهاء المسابقات" : "Rankings will appear after competitions conclude"}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Podium - Top 3 */}
              {topThree.length >= 3 && (
                <div className="mb-10 flex items-end justify-center gap-3 sm:gap-6">
                  {podiumOrder.map((chef, idx) => {
                    const actualRank = chef.rank || (idx === 0 ? 2 : idx === 1 ? 1 : 3);
                    const isFirst = actualRank === 1;
                    const heights = { 1: "h-40 sm:h-48", 2: "h-32 sm:h-36", 3: "h-28 sm:h-32" };
                    return (
                      <div key={chef.id} className="flex flex-col items-center gap-2">
                        <div className="relative">
                          {isFirst && <Crown className="absolute -top-5 start-1/2 -translate-x-1/2 h-6 w-6 text-yellow-500" />}
                          <div className={`${isFirst ? "h-20 w-20 ring-4 ring-yellow-500/30" : "h-16 w-16 ring-2 ring-border"} rounded-full overflow-hidden bg-muted`}>
                            {chef.profile?.avatar_url ? (
                              <img src={chef.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <ChefHat className="h-6 w-6 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div className={`absolute -bottom-2 start-1/2 -translate-x-1/2 flex h-7 w-7 items-center justify-center rounded-full ${actualRank === 1 ? "bg-chart-4" : actualRank === 2 ? "bg-muted-foreground" : "bg-chart-3"} text-primary-foreground text-xs font-bold shadow-lg`}>
                            {actualRank}
                          </div>
                        </div>
                        <Link to={chef.profile?.username ? `/${chef.profile.username}` : "#"} className="text-center hover:text-primary transition-colors">
                          <p className="text-xs sm:text-sm font-bold truncate max-w-[100px]">{chef.profile?.full_name || "—"}</p>
                        </Link>
                        <Badge variant="outline" className="text-[10px]">{chef.total_points} pts</Badge>
                        <div className={`${heights[actualRank as 1 | 2 | 3]} w-20 sm:w-28 rounded-t-xl ${actualRank === 1 ? "bg-gradient-to-t from-yellow-500/20 to-yellow-500/5" : "bg-muted/60"} flex flex-col items-center justify-center gap-1`}>
                          <div className="flex gap-0.5">
                            {chef.gold_medals > 0 && <Badge variant="secondary" className="text-[9px] px-1">🥇{chef.gold_medals}</Badge>}
                            {chef.silver_medals > 0 && <Badge variant="secondary" className="text-[9px] px-1">🥈{chef.silver_medals}</Badge>}
                            {chef.bronze_medals > 0 && <Badge variant="secondary" className="text-[9px] px-1">🥉{chef.bronze_medals}</Badge>}
                          </div>
                          <p className="text-[10px] text-muted-foreground">{chef.competitions_entered} {isAr ? "مسابقة" : "comp."}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Rankings Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {(topThree.length < 3 ? filteredRankings : rest).map((chef) => (
                      <div key={chef.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold shrink-0">
                          {chef.rank || "—"}
                        </div>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="h-9 w-9 rounded-full overflow-hidden bg-muted shrink-0">
                            {chef.profile?.avatar_url ? (
                              <img src={chef.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center"><ChefHat className="h-4 w-4 text-muted-foreground/30" /></div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link to={chef.profile?.username ? `/${chef.profile.username}` : "#"} className="text-sm font-semibold hover:text-primary transition-colors truncate block">
                              {chef.profile?.full_name || "—"}
                            </Link>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              {chef.country_code && <span>{countryFlag(chef.country_code)}</span>}
                              {chef.specialty && <span>{chef.specialty}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex gap-0.5">
                            {chef.gold_medals > 0 && <span className="text-xs">🥇{chef.gold_medals}</span>}
                            {chef.silver_medals > 0 && <span className="text-xs">🥈{chef.silver_medals}</span>}
                            {chef.bronze_medals > 0 && <span className="text-xs">🥉{chef.bronze_medals}</span>}
                          </div>
                          <Badge variant="secondary" className="text-xs font-bold">{chef.total_points} pts</Badge>
                          <div className="w-6 flex justify-center">
                            {chef.rank_change && chef.rank_change > 0 ? (
                              <TrendingUp className="h-4 w-4 text-chart-5" />
                            ) : chef.rank_change && chef.rank_change < 0 ? (
                              <TrendingDown className="h-4 w-4 text-destructive" />
                            ) : (
                              <Minus className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
