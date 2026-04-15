import { useIsAr } from "@/hooks/useIsAr";
import { useState, useMemo, useCallback, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Building2, Globe, MapPin, Users, ShieldCheck,
  GraduationCap, Briefcase, Landmark, Sparkles,
  TrendingUp, Filter, ArrowUpDown, LayoutGrid, List,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import entitiesHero from "@/assets/entities-hero.jpg";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";
import { EntityCard, typeLabels, scopeLabels } from "@/pages/entities/EntityCard";
import { CACHE } from "@/lib/queryConfig";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

type EntityType = Database["public"]["Enums"]["entity_type"];
type EntityScope = Database["public"]["Enums"]["entity_scope"];

const typeOptions: { value: EntityType | "all"; en: string; ar: string }[] = [
  { value: "all", en: "All Types", ar: "جميع الأنواع" },
  { value: "culinary_association", en: "Culinary Associations", ar: "جمعيات الطهي" },
  { value: "government_entity", en: "Government Entities", ar: "الجهات الحكومية" },
  { value: "private_association", en: "Private Associations", ar: "الجمعيات الخاصة" },
  { value: "culinary_academy", en: "Culinary Academies", ar: "أكاديميات الطهي" },
  { value: "industry_body", en: "Industry Bodies", ar: "الهيئات الصناعية" },
  { value: "university", en: "Universities", ar: "الجامعات" },
  { value: "college", en: "Colleges", ar: "الكليات" },
  { value: "training_center", en: "Training Centers", ar: "مراكز التدريب" },
];

const scopeOptions: { value: EntityScope | "all"; en: string; ar: string }[] = [
  { value: "all", en: "All Scopes", ar: "جميع النطاقات" },
  { value: "local", en: "Local", ar: "محلي" },
  { value: "national", en: "National", ar: "وطني" },
  { value: "regional", en: "Regional", ar: "إقليمي" },
  { value: "international", en: "International", ar: "دولي" },
];

type SortKey = "name" | "followers" | "newest";

const sortOptions: { value: SortKey; en: string; ar: string }[] = [
  { value: "name", en: "Name", ar: "الاسم" },
  { value: "followers", en: "Most Followed", ar: "الأكثر متابعة" },
  { value: "newest", en: "Newest", ar: "الأحدث" },
];

/* ─── Stat Card ─── */
const StatCard = memo(function StatCard({ value, label, icon: Icon, accent }: { value: number; label: string; icon: typeof Building2; accent: string }) {
  return (
    <div className={cn(
      "group/s relative flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-200",
      "bg-background/60 backdrop-blur-xl shadow-sm hover:shadow-md hover:-translate-y-0.5",
      "border-border/30 hover:border-primary/20"
    )}>
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover/s:scale-105", accent)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums leading-none tracking-tight">
          <AnimatedCounter value={value} />
        </p>
        <p className="text-[0.6875rem] text-muted-foreground mt-0.5 font-medium">{label}</p>
      </div>
    </div>
  );
});

/* ─── Featured Carousel ─── */
const FeaturedEntities = memo(function FeaturedEntities({
  entities, isAr, myFollows, onToggleFollow, canFollow,
}: {
  entities: any[]; isAr: boolean; myFollows: string[]; onToggleFollow: (id: string) => void; canFollow: boolean;
}) {
  if (entities.length === 0) return null;
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <ShieldCheck className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-sm font-bold">{isAr ? "الجهات المميزة والموثقة" : "Featured & Verified"}</h2>
        <div className="flex-1 h-px bg-border/20" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {entities.slice(0, 4).map(entity => (
          <EntityCard
            key={entity.id}
            entity={entity}
            isAr={isAr}
            isFollowing={myFollows.includes(entity.id)}
            onToggleFollow={onToggleFollow}
            canFollow={canFollow}
            featured
          />
        ))}
      </div>
    </section>
  );
});

/* ─── Main Page ─── */
export default function Entities() {
  const { user } = useAuth();
  const isAr = useIsAr();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: entities, isLoading } = useQuery({
    queryKey: ["public-entities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("culinary_entities")
        .select("*, entity_followers(id)")
        .eq("status", "active")
        .eq("is_visible", true)
        .order("name");
      if (error) throw handleSupabaseError(error);
      return data;
    },
    staleTime: CACHE.medium.staleTime,
    gcTime: 1000 * 60 * 30,
  });

  const { data: myFollows } = useQuery({
    queryKey: ["my-entity-follows", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("entity_followers")
        .select("entity_id")
        .eq("user_id", user.id);
      return data?.map(f => f.entity_id) || [];
    },
    enabled: !!user,
    staleTime: CACHE.default.staleTime,
  });

  const toggleFollow = useMutation({
    mutationFn: async (entityId: string) => {
      if (!user) throw new Error("Not authenticated");
      const isFollowing = myFollows?.includes(entityId);
      if (isFollowing) {
        await supabase.from("entity_followers").delete().eq("entity_id", entityId).eq("user_id", user.id);
      } else {
        await supabase.from("entity_followers").insert({ entity_id: entityId, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-entity-follows"] });
      queryClient.invalidateQueries({ queryKey: ["public-entities"] });
    },
  });

  const handleToggleFollow = useCallback((id: string) => toggleFollow.mutate(id), [toggleFollow]);

  // Featured entities (verified + has followers)
  const featuredEntities = useMemo(() => {
    if (!entities) return [];
    return entities
      .filter(e => e.is_verified)
      .sort((a, b) => (b.entity_followers?.length || 0) - (a.entity_followers?.length || 0))
      .slice(0, 4);
  }, [entities]);

  const filtered = useMemo(() => {
    let result = entities?.filter(e => {
      const name = isAr && e.name_ar ? e.name_ar : e.name;
      const matchesSearch = (name + (e.abbreviation || "")).toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || e.type === typeFilter;
      const matchesScope = scopeFilter === "all" || e.scope === scopeFilter;

      let matchesTab = true;
      if (activeTab === "education") matchesTab = e.type === "university" || e.type === "college" || e.type === "training_center" || e.type === "culinary_academy";
      if (activeTab === "local") matchesTab = e.scope === "local" || e.scope === "national";
      if (activeTab === "international") matchesTab = e.scope === "regional" || e.scope === "international";
      if (activeTab === "government") matchesTab = e.type === "government_entity";
      if (activeTab === "private") matchesTab = e.type === "private_association" || e.type === "culinary_association";

      return matchesSearch && matchesType && matchesScope && matchesTab;
    }) || [];

    // Sort
    if (sortBy === "followers") {
      result = [...result].sort((a, b) => (b.entity_followers?.length || 0) - (a.entity_followers?.length || 0));
    } else if (sortBy === "newest") {
      result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    // "name" is default from DB order

    return result;
  }, [entities, search, typeFilter, scopeFilter, activeTab, isAr, sortBy]);

  const entityStats = useMemo(() => {
    if (!entities) return { verified: 0, countries: 0, associations: 0, education: 0 };
    return {
      verified: entities.filter(e => e.is_verified).length,
      countries: new Set(entities.map(e => e.country).filter(Boolean)).size,
      associations: entities.filter(e => e.type === "culinary_association" || e.type === "private_association").length,
      education: entities.filter(e => e.type === "university" || e.type === "college" || e.type === "culinary_academy" || e.type === "training_center").length,
    };
  }, [entities]);

  const activeFiltersCount = (typeFilter !== "all" ? 1 : 0) + (scopeFilter !== "all" ? 1 : 0) + (search ? 1 : 0);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead
        title={isAr ? "دليل الجهات والمؤسسات" : "Culinary Organizations Directory"}
        description={isAr ? "اكتشف الجمعيات المهنية والجهات الحكومية والأكاديميات في عالم الطهي" : "Discover culinary associations, government entities, and academies worldwide"}
        keywords={isAr ? "جمعيات طهي, أكاديميات طبخ, جهات حكومية, مؤسسات أغذية" : "culinary associations, cooking academies, food authorities, culinary institutions"}
      />
      <Header />

      {/* ─── Premium Hero ─── */}
      <section className="relative overflow-hidden border-b border-border/20">
        <div className="absolute inset-0">
          <img
            src={entitiesHero}
            alt=""
            loading="eager"
            className="h-full w-full object-cover scale-105 opacity-15 pointer-events-none"
            style={{ filter: "blur(2px) saturate(0.7)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_20%,hsl(var(--primary)/0.08),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,hsl(var(--chart-3)/0.05),transparent)]" />
        </div>

        <div className="container relative py-12 md:py-16">
          <div className="max-w-3xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/15 shadow-xl backdrop-blur-sm">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <Badge variant="secondary" className="backdrop-blur-xl bg-background/60 px-3.5 py-1 text-[0.625rem] font-black uppercase tracking-[0.15em] border-0 shadow-sm">
                <Sparkles className="h-2.5 w-2.5 me-1.5 text-primary" />
                {isAr ? "الدليل المهني الرسمي" : "Official Professional Directory"}
              </Badge>
            </div>

            <div className="space-y-3">
              <h1 className="font-serif text-3xl font-black tracking-tight md:text-5xl leading-[1.1]">
                {isAr ? (
                  <>دليل <span className="text-primary">جهات</span> وجمعيات الطهي</>
                ) : (
                  <>Culinary <span className="text-primary">Entities</span> Directory</>
                )}
              </h1>
              <p className="max-w-xl text-base text-muted-foreground font-medium leading-relaxed">
                {isAr
                  ? "اكتشف وتابع جمعيات الطهي والجهات الحكومية والخاصة المعنية بالطهي محلياً ودولياً."
                  : "Discover and follow culinary associations, government entities, and private organizations globally."}
              </p>
            </div>

            {/* Stats */}
            {entities && entities.length > 0 && (
              <div className="grid grid-cols-2 sm:flex items-center gap-2.5 pt-1">
                <StatCard icon={Building2} value={entities.length} label={isAr ? "إجمالي الجهات" : "Total Entities"} accent="bg-primary/10 text-primary" />
                <StatCard icon={ShieldCheck} value={entityStats.verified} label={isAr ? "جهات موثقة" : "Verified"} accent="bg-chart-3/10 text-chart-3" />
                <StatCard icon={Globe} value={entityStats.countries} label={isAr ? "دولة" : "Countries"} accent="bg-chart-1/10 text-chart-1" />
                <StatCard icon={GraduationCap} value={entityStats.education} label={isAr ? "تعليمية" : "Education"} accent="bg-chart-5/10 text-chart-5" />
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="container flex-1 py-6 md:py-8 space-y-6">
        {/* ─── Featured Section ─── */}
        {!isLoading && featuredEntities.length > 0 && activeTab === "all" && !search && (
          <FeaturedEntities
            entities={featuredEntities}
            isAr={isAr}
            myFollows={myFollows || []}
            onToggleFollow={handleToggleFollow}
            canFollow={!!user}
          />
        )}

        {/* ─── Search, Filters & Sort ─── */}
        <div className="rounded-2xl border border-border/20 bg-background/60 backdrop-blur-xl p-3 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
              <Input
                placeholder={isAr ? "ابحث عن جهة أو جمعية..." : "Search entities..."}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="ps-10 h-11 bg-muted/30 border-0 rounded-xl focus-visible:ring-primary/20 text-sm"
              />
              {search && (
                <Button variant="ghost" size="icon" className="absolute end-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg" onClick={() => setSearch("")}>
                  <span className="sr-only">Clear</span>✕
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-auto min-w-[130px] h-10 bg-muted/30 border-0 rounded-xl text-xs">
                  <Building2 className="h-3.5 w-3.5 me-1.5 text-muted-foreground/50" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={scopeFilter} onValueChange={setScopeFilter}>
                <SelectTrigger className="w-auto min-w-[110px] h-10 bg-muted/30 border-0 rounded-xl text-xs">
                  <Globe className="h-3.5 w-3.5 me-1.5 text-muted-foreground/50" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scopeOptions.map(s => <SelectItem key={s.value} value={s.value}>{isAr ? s.ar : s.en}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={v => setSortBy(v as SortKey)}>
                <SelectTrigger className="w-auto min-w-[120px] h-10 bg-muted/30 border-0 rounded-xl text-xs">
                  <ArrowUpDown className="h-3.5 w-3.5 me-1.5 text-muted-foreground/50" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(s => <SelectItem key={s.value} value={s.value}>{isAr ? s.ar : s.en}</SelectItem>)}
                </SelectContent>
              </Select>

              {/* View toggle */}
              <div className="flex rounded-xl bg-muted/30 p-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-9 w-9 rounded-lg", viewMode === "grid" && "bg-background shadow-sm")}
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-9 w-9 rounded-lg", viewMode === "list" && "bg-background shadow-sm")}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
              </div>

              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-xs text-destructive hover:text-destructive rounded-xl"
                  onClick={() => { setSearch(""); setTypeFilter("all"); setScopeFilter("all"); }}
                >
                  {isAr ? "مسح" : "Clear"}
                  <Badge variant="destructive" className="h-4 min-w-4 p-0 justify-center text-[9px] rounded-full ms-1">
                    {activeFiltersCount}
                  </Badge>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ─── Tabs ─── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <TabsList className="flex-wrap bg-muted/30 p-1 gap-0.5 rounded-xl h-auto">
            {[
              { value: "all", icon: Building2, en: "All", ar: "الكل" },
              { value: "education", icon: GraduationCap, en: "Education", ar: "تعليمي" },
              { value: "local", icon: MapPin, en: "Local & National", ar: "محلي ووطني" },
              { value: "international", icon: Globe, en: "International", ar: "إقليمي ودولي" },
              { value: "government", icon: Landmark, en: "Government", ar: "حكومي" },
              { value: "private", icon: Briefcase, en: "Private", ar: "خاص" },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="gap-1.5 text-xs rounded-lg data-[state=active]:shadow-sm px-3 py-2"
              >
                <tab.icon className="h-3.5 w-3.5 hidden sm:inline" />
                {isAr ? tab.ar : tab.en}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className={cn(
                viewMode === "grid"
                  ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "space-y-3"
              )}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="rounded-2xl overflow-hidden">
                    <Skeleton className="h-28 w-full rounded-none" />
                    <CardContent className="pt-8 space-y-3">
                      <Skeleton className="h-4 w-3/4 rounded-lg" />
                      <Skeleton className="h-3 w-1/2 rounded-lg" />
                      <Skeleton className="h-10 w-full rounded-xl" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                  <Building2 className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-bold text-muted-foreground">{isAr ? "لم يتم العثور على جهات" : "No entities found"}</p>
                <p className="mt-1 text-xs text-muted-foreground/50">{isAr ? "جرب تغيير عوامل التصفية" : "Try adjusting your filters"}</p>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 rounded-xl"
                    onClick={() => { setSearch(""); setTypeFilter("all"); setScopeFilter("all"); setActiveTab("all"); }}
                  >
                    {isAr ? "إعادة تعيين الفلاتر" : "Reset filters"}
                  </Button>
                )}
              </div>
            ) : (
              <div className={cn(
                viewMode === "grid"
                  ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid gap-3 grid-cols-1 sm:grid-cols-2"
              )}>
                {filtered.map(entity => (
                  <EntityCard
                    key={entity.id}
                    entity={entity}
                    isAr={isAr}
                    isFollowing={myFollows?.includes(entity.id) || false}
                    onToggleFollow={handleToggleFollow}
                    canFollow={!!user}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Results count */}
        {filtered && filtered.length > 0 && (
          <p className="text-center text-[0.6875rem] text-muted-foreground/50 font-medium">
            {isAr
              ? `عرض ${filtered.length} من ${entities?.length ?? 0} جهة`
              : `Showing ${filtered.length} of ${entities?.length ?? 0} entities`}
          </p>
        )}
      </main>

      <Footer />
    </div>
  );
}
