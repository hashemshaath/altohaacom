import { useIsAr } from "@/hooks/useIsAr";
import { useState, useMemo, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Trophy, TrendingUp, TrendingDown, Minus, Search, ChefHat, Crown, Medal, Flame, Globe, Users, Star, Sparkles } from "lucide-react";
import { countryFlag } from "@/lib/countryFlag";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CACHE } from "@/lib/queryConfig";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

const medalBg = (rank: number) =>
  rank === 1 ? "from-yellow-500/20 via-yellow-400/10 to-yellow-500/5 ring-yellow-500/30"
  : rank === 2 ? "from-slate-400/20 via-slate-300/10 to-slate-400/5 ring-slate-400/30"
  : "from-amber-600/20 via-amber-500/10 to-amber-600/5 ring-amber-600/30";

const rankCircle = (rank: number) =>
  rank === 1 ? "bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-yellow-500/30"
  : rank === 2 ? "bg-gradient-to-br from-slate-400 to-slate-500 shadow-slate-400/30"
  : "bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/30";

export default function Rankings() {
  const isAr = useIsAr();
  const [period, setPeriod] = useState("all_time");
  const [countryFilter, setCountryFilter] = useState("all");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: rankings, isLoading } = useQuery({
    queryKey: ["global-rankings", period, countryFilter, specialtyFilter],
    queryFn: async () => {
      let query = supabase
        .from("chef_rankings")
        .select("id, user_id, rank, previous_rank, rank_change, total_points, average_score, country_code, specialty, ranking_period, competitions_entered, competitions_won, gold_medals, silver_medals, bronze_medals")
        .eq("ranking_period", period)
        .order("rank", { ascending: true })
        .limit(100);

      if (countryFilter !== "all") query = query.eq("country_code", countryFilter);
      if (specialtyFilter !== "all") query = query.eq("specialty", specialtyFilter);

      const { data, error } = await query;
      if (error) throw handleSupabaseError(error);

      if (!data?.length) return [];
      const userIds = data.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url, country_code")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      return data.map(r => ({ ...r, profile: profileMap.get(r.user_id) }));
    },
    staleTime: CACHE.long.staleTime,
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
    staleTime: CACHE.long.staleTime,
  });

  const filteredRankings = useMemo(() => rankings?.filter(r => {
    if (!searchQuery) return true;
    const name = r.profile?.full_name?.toLowerCase() || "";
    const username = r.profile?.username?.toLowerCase() || "";
    return name.includes(searchQuery.toLowerCase()) || username.includes(searchQuery.toLowerCase());
  }), [rankings, searchQuery]);

  const topThree = useMemo(() => filteredRankings?.slice(0, 3) || [], [filteredRankings]);
  const rest = useMemo(() => filteredRankings?.slice(3) || [], [filteredRankings]);
  const podiumOrder = useMemo(() => topThree.length === 3 ? [topThree[1], topThree[0], topThree[2]] : topThree, [topThree]);

  // Aggregate stats
  const totalChefs = filteredRankings?.length || 0;
  const totalCountries = new Set(filteredRankings?.map(r => r.country_code).filter(Boolean)).size;
  const totalMedals = filteredRankings?.reduce((s, r) => s + (r.gold_medals || 0) + (r.silver_medals || 0) + (r.bronze_medals || 0), 0) || 0;

  return (
    <PageShell
      title={isAr ? "التصنيف العالمي للطهاة" : "Global Chef Rankings"}
      description={isAr ? "اكتشف أفضل الطهاة حول العالم مرتبين حسب الأداء والإنجازات" : "Discover the top-ranked chefs worldwide based on performance and achievements"}
      seoProps={{ keywords: isAr ? "تصنيف الطهاة, أفضل الطهاة, ترتيب عالمي, طهاة محترفون, ميداليات طهي" : "chef rankings, top chefs, global leaderboard, professional chefs, culinary medals" }}
      container={false}
      padding="none"
    >
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="absolute bottom-0 start-0 end-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="container relative py-6 md:py-10">
          <div className="mb-3">
            <Breadcrumbs items={[{ label: isAr ? "التصنيفات" : "Rankings" }]} />
          </div>
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 ring-1 ring-primary/15">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
                  {isAr ? "التصنيف العالمي" : "Global Leaderboard"}
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight md:text-4xl">
                {isAr ? "تصنيف الطهاة" : "Chef Rankings"}
              </h1>
              <p className="hidden sm:block text-muted-foreground text-sm leading-relaxed max-w-lg">
                {isAr ? "أفضل الطهاة حول العالم مرتبين حسب الأداء والميداليات والإنجازات" : "Top chefs worldwide ranked by performance, medals, and achievements"}
              </p>

              {/* Stats chips */}
              <div className="flex items-center gap-2 sm:gap-3 pt-1">
                {[
                  { value: totalChefs, label: isAr ? "طاهٍ" : "Chefs", icon: <Users className="h-3 w-3" />, color: "text-primary" },
                  { value: totalCountries, label: isAr ? "دول" : "Countries", icon: <Globe className="h-3 w-3" />, color: "text-chart-4" },
                  { value: totalMedals, label: isAr ? "ميدالية" : "Medals", icon: <Medal className="h-3 w-3" />, color: "text-chart-3" },
                ].map((stat, i) => (
                  <div key={i} className="group flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 ring-1 ring-border/40 shadow-sm transition-all hover:shadow-md hover:ring-primary/20">
                    <span className={stat.color}>{stat.icon}</span>
                    <AnimatedCounter value={stat.value} className="text-sm font-bold tabular-nums" />
                    <span className="text-xs text-muted-foreground font-medium hidden sm:inline">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="sticky top-12 z-30 -mx-4 px-4 py-2.5 bg-background/90 backdrop-blur-xl border-b border-border/20 md:container md:rounded-2xl md:border md:border-border/20 md:mx-auto md:px-4 md:bg-card/60 md:mt-4 md:mb-2">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input placeholder={isAr ? "ابحث عن طاهٍ..." : "Search chefs..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="ps-9 h-9 rounded-xl border-border/20 bg-muted/10 text-sm" />
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-9 w-auto min-w-[120px] rounded-xl border-border/20 bg-muted/10 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all_time">{isAr ? "كل الأوقات" : "All Time"}</SelectItem>
              <SelectItem value="yearly">{isAr ? "سنوي" : "Yearly"}</SelectItem>
              <SelectItem value="monthly">{isAr ? "شهري" : "Monthly"}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="h-9 w-auto min-w-[120px] rounded-xl border-border/20 bg-muted/10 text-xs">
              <SelectValue placeholder={isAr ? "الدولة" : "Country"} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">{isAr ? "جميع الدول" : "All Countries"}</SelectItem>
              {countries?.map(c => (
                <SelectItem key={c} value={c}>{countryFlag(c)} {c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="container py-6 md:py-8 space-y-8">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex justify-center gap-4 items-end py-8">
              <Skeleton className="h-36 w-24 rounded-xl" />
              <Skeleton className="h-44 w-28 rounded-xl" />
              <Skeleton className="h-32 w-24 rounded-xl" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : !filteredRankings?.length ? (
          <Card className="border-border/20">
            <CardContent className="flex flex-col items-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <Trophy className="h-8 w-8 text-primary/40" />
              </div>
              <p className="font-bold text-lg">{isAr ? "لا توجد تصنيفات بعد" : "No rankings yet"}</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {isAr ? "ستظهر التصنيفات بعد انتهاء المسابقات. انضم إلى مسابقة لتبدأ رحلتك!" : "Rankings will appear after competitions conclude. Join a competition to start your journey!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Podium - Top 3 */}
            {topThree.length >= 3 && (
              <section className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/3 to-transparent rounded-3xl -m-4 p-4" />
                <div className="relative flex items-end justify-center gap-3 sm:gap-5 pt-8 pb-4">
                  {podiumOrder.map((chef, idx) => {
                    const actualRank = chef.rank || (idx === 0 ? 2 : idx === 1 ? 1 : 3);
                    const isFirst = actualRank === 1;
                    const podiumH = { 1: "h-36 sm:h-44", 2: "h-28 sm:h-32", 3: "h-24 sm:h-28" };
                    const avatarSize = isFirst ? "h-20 w-20 sm:h-24 sm:w-24" : "h-16 w-16 sm:h-18 sm:w-18";
                    
                    return (
                      <div key={chef.id} className="flex flex-col items-center gap-2 group" style={{ animation: `heroFadeUp 0.5s cubic-bezier(0.16,1,0.3,1) ${idx * 0.1}s both` }}>
                        {/* Avatar */}
                        <div className="relative">
                          {isFirst && (
                            <div className="absolute -top-6 start-1/2 -translate-x-1/2 z-10">
                              <Crown className="h-7 w-7 text-yellow-500 drop-shadow-lg" style={{ animation: "pulse 2s infinite" }} />
                            </div>
                          )}
                          <div className={cn(
                            avatarSize,
                            "rounded-full overflow-hidden ring-4 shadow-xl transition-transform duration-300 group-hover:scale-105",
                            isFirst ? "ring-yellow-500/40 shadow-yellow-500/20" : actualRank === 2 ? "ring-slate-400/40 shadow-slate-400/20" : "ring-amber-500/40 shadow-amber-500/20"
                          )}>
                            {chef.profile?.avatar_url ? (
                              <img src={chef.profile.avatar_url} alt={chef.profile.full_name || "Chef"} className="h-full w-full object-cover" loading="lazy" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-muted">
                                <ChefHat className={cn("text-muted-foreground/30", isFirst ? "h-8 w-8" : "h-6 w-6")} />
                              </div>
                            )}
                          </div>
                          <div className={cn(
                            "absolute -bottom-2 start-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-primary-foreground shadow-lg",
                            rankCircle(actualRank)
                          )}>
                            {actualRank}
                          </div>
                        </div>

                        {/* Name & Points */}
                        <Link to={chef.profile?.username ? `/${chef.profile.username}` : "#"} className="text-center hover:text-primary transition-colors mt-1">
                          <p className={cn("font-bold truncate max-w-[110px]", isFirst ? "text-sm sm:text-base" : "text-xs sm:text-sm")}>{chef.profile?.full_name || "—"}</p>
                        </Link>
                        {chef.country_code && <span className="text-sm">{countryFlag(chef.country_code)}</span>}
                        <Badge className={cn(
                          "font-bold border-0 shadow-sm",
                          isFirst ? "bg-yellow-500/10 text-yellow-600 text-xs px-3" : "bg-muted text-muted-foreground text-[0.6875rem] px-2"
                        )}>
                          <Sparkles className="h-3 w-3 me-1" />
                          {chef.total_points} pts
                        </Badge>

                        {/* Podium bar */}
                        <div className={cn(
                          podiumH[actualRank as 1 | 2 | 3],
                          "w-24 sm:w-32 rounded-t-2xl bg-gradient-to-t ring-1 ring-inset flex flex-col items-center justify-center gap-1.5 transition-all",
                          medalBg(actualRank)
                        )}>
                          <div className="flex gap-1">
                            {chef.gold_medals > 0 && <span className="text-xs bg-background/60 rounded-full px-1.5 py-0.5">🥇{chef.gold_medals}</span>}
                            {chef.silver_medals > 0 && <span className="text-xs bg-background/60 rounded-full px-1.5 py-0.5">🥈{chef.silver_medals}</span>}
                            {chef.bronze_medals > 0 && <span className="text-xs bg-background/60 rounded-full px-1.5 py-0.5">🥉{chef.bronze_medals}</span>}
                          </div>
                          <p className="text-[0.6875rem] text-muted-foreground font-medium">
                            {chef.competitions_entered} {isAr ? "مسابقة" : "comp."}
                          </p>
                          {chef.competitions_won > 0 && (
                            <p className="text-[0.6875rem] font-bold text-primary flex items-center gap-0.5">
                              <Trophy className="h-3 w-3" />{chef.competitions_won} {isAr ? "فوز" : "wins"}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Rankings List */}
            <Card className="border-border/20 overflow-hidden rounded-2xl">
              <CardContent className="p-0">
                <div className="divide-y divide-border/30">
                  {(topThree.length < 3 ? filteredRankings : rest)?.map((chef, idx) => (
                    <div key={chef.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-all group" style={{ animation: `heroFadeUp 0.3s cubic-bezier(0.16,1,0.3,1) ${Math.min(idx * 0.03, 0.5)}s both` }}>
                      {/* Rank */}
                      <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold shrink-0 transition-colors",
                        chef.rank && chef.rank <= 10 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        {chef.rank || "—"}
                      </div>

                      {/* Avatar + Info */}
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-xl overflow-hidden bg-muted shrink-0 ring-1 ring-border/30 group-hover:ring-primary/20 transition-all">
                          {chef.profile?.avatar_url ? (
                            <img src={chef.profile.avatar_url} alt={chef.profile.full_name || "Chef"} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center"><ChefHat className="h-4 w-4 text-muted-foreground/30" /></div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link to={chef.profile?.username ? `/${chef.profile.username}` : "#"} className="text-sm font-semibold hover:text-primary transition-colors truncate block">
                            {chef.profile?.full_name || "—"}
                          </Link>
                          <div className="flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
                            {chef.country_code && <span>{countryFlag(chef.country_code)}</span>}
                            {chef.specialty && <span className="truncate">{chef.specialty}</span>}
                            <span className="hidden sm:inline">• {chef.competitions_entered} {isAr ? "مسابقة" : "comp."}</span>
                          </div>
                        </div>
                      </div>

                      {/* Medals & Stats */}
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <div className="hidden sm:flex gap-1">
                          {chef.gold_medals > 0 && <span className="text-xs bg-yellow-500/10 rounded-full px-1.5 py-0.5">🥇{chef.gold_medals}</span>}
                          {chef.silver_medals > 0 && <span className="text-xs bg-slate-400/10 rounded-full px-1.5 py-0.5">🥈{chef.silver_medals}</span>}
                          {chef.bronze_medals > 0 && <span className="text-xs bg-amber-500/10 rounded-full px-1.5 py-0.5">🥉{chef.bronze_medals}</span>}
                        </div>
                        {chef.average_score > 0 && (
                          <div className="hidden md:flex items-center gap-1 text-[0.6875rem] text-muted-foreground">
                            <Star className="h-3 w-3 text-chart-4" />
                            <span className="tabular-nums font-medium">{Number(chef.average_score).toFixed(1)}</span>
                          </div>
                        )}
                        <Badge variant="secondary" className="text-xs font-bold tabular-nums rounded-lg px-2">
                          {chef.total_points}
                        </Badge>
                        {/* Rank change */}
                        <div className="w-8 flex justify-center">
                          {chef.rank_change && chef.rank_change > 0 ? (
                            <div className="flex items-center gap-0.5 text-chart-2">
                              <TrendingUp className="h-3.5 w-3.5" />
                              <span className="text-[0.6875rem] font-bold">+{chef.rank_change}</span>
                            </div>
                          ) : chef.rank_change && chef.rank_change < 0 ? (
                            <div className="flex items-center gap-0.5 text-destructive">
                              <TrendingDown className="h-3.5 w-3.5" />
                              <span className="text-[0.6875rem] font-bold">{chef.rank_change}</span>
                            </div>
                          ) : (
                            <Minus className="h-3.5 w-3.5 text-muted-foreground/40" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Overview Footer */}
            {filteredRankings && filteredRankings.length > 0 && (
              <section className="border-t border-border/10 pt-8">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 text-center">
                  {isAr ? "نظرة عامة" : "Overview"}
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: isAr ? "إجمالي الطهاة" : "Total Chefs", value: totalChefs, icon: Users, color: "text-primary", bg: "bg-primary/10" },
                    { label: isAr ? "الدول المشاركة" : "Countries", value: totalCountries, icon: Globe, color: "text-chart-4", bg: "bg-chart-4/10" },
                    { label: isAr ? "الميداليات" : "Total Medals", value: totalMedals, icon: Medal, color: "text-chart-3", bg: "bg-chart-3/10" },
                    { label: isAr ? "أعلى نقاط" : "Top Points", value: filteredRankings[0]?.total_points || 0, icon: Trophy, color: "text-chart-5", bg: "bg-chart-5/10" },
                  ].map((stat) => (
                    <Card key={stat.label} className="border-border/10 bg-card/50 rounded-2xl group hover:shadow-md hover:border-primary/10 transition-all duration-200">
                      <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-border/10 transition-transform group-hover:scale-110", stat.bg)}>
                          <stat.icon className={cn("h-5 w-5", stat.color)} />
                        </div>
                        <AnimatedCounter value={stat.value} className="text-xl font-extrabold text-foreground sm:text-2xl tabular-nums" />
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{stat.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
