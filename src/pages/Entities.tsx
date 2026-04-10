import { useState, useMemo, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
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
import { toast } from "@/hooks/use-toast";
import {
  Search, Building2, Globe, MapPin, Users, ShieldCheck, Bell, BellOff,
  ExternalLink, Mail, GraduationCap, Briefcase, Landmark, Sparkles,
  TrendingUp, ArrowRight, Filter,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import entitiesHero from "@/assets/entities-hero.jpg";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

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

const typeLabels: Record<EntityType, { en: string; ar: string; icon: typeof Building2 }> = {
  culinary_association: { en: "Culinary Association", ar: "جمعية طهي", icon: Users },
  government_entity: { en: "Government Entity", ar: "جهة حكومية", icon: Landmark },
  private_association: { en: "Private Association", ar: "جمعية خاصة", icon: Briefcase },
  culinary_academy: { en: "Culinary Academy", ar: "أكاديمية طهي", icon: GraduationCap },
  industry_body: { en: "Industry Body", ar: "هيئة صناعية", icon: Building2 },
  university: { en: "University", ar: "جامعة", icon: GraduationCap },
  college: { en: "College", ar: "كلية", icon: GraduationCap },
  training_center: { en: "Training Center", ar: "مركز تدريب", icon: GraduationCap },
};

const scopeLabels: Record<EntityScope, { en: string; ar: string }> = {
  local: { en: "Local", ar: "محلي" },
  national: { en: "National", ar: "وطني" },
  regional: { en: "Regional", ar: "إقليمي" },
  international: { en: "International", ar: "دولي" },
};

/* ─── Stat Card ─── */
const StatCard = memo(function StatCard({ value, label, icon: Icon, accent }: { value: number; label: string; icon: typeof Building2; accent: string }) {
  return (
    <div className={cn(
      "group relative flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-200",
      "bg-background/60 backdrop-blur-xl shadow-sm hover:shadow-md hover:-translate-y-0.5",
      "border-border/30 hover:border-primary/20"
    )}>
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105", accent)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums leading-none tracking-tight">
          <AnimatedCounter value={value} />
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{label}</p>
      </div>
    </div>
  );
});

/* ─── Entity Card ─── */
const EntityCard = memo(function EntityCard({
  entity, isAr, isFollowing, onToggleFollow, canFollow,
}: {
  entity: any; isAr: boolean; isFollowing: boolean;
  onToggleFollow: (id: string) => void; canFollow: boolean;
}) {
  const name = isAr && entity.name_ar ? entity.name_ar : entity.name;
  const description = isAr && entity.description_ar ? entity.description_ar : entity.description;
  const tLabel = typeLabels[entity.type as EntityType];
  const sLabel = scopeLabels[entity.scope as EntityScope];
  const TypeIcon = tLabel?.icon || Building2;
  const followerCount = (entity as any).entity_followers?.length || 0;

  return (
    <Card className={cn(
      "group overflow-hidden border-border/30 transition-all duration-300",
      "hover:shadow-xl hover:-translate-y-1 hover:border-primary/20",
      "rounded-2xl"
    )}>
      {/* Cover */}
      <div className="relative h-32 bg-gradient-to-br from-primary/8 via-accent/4 to-primary/4 overflow-hidden">
        {entity.cover_image_url ? (
          <img
            src={entity.cover_image_url}
            alt={entity.name || "Entity"}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <TypeIcon className="h-10 w-10 text-primary/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />

        {/* Logo */}
        <div className="absolute -bottom-5 start-4">
          {entity.logo_url ? (
            <img
              src={entity.logo_url}
              alt={name}
              loading="lazy"
              decoding="async"
              className="h-12 w-12 rounded-xl border-2 border-background bg-background object-cover shadow-lg ring-1 ring-border/10"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-background bg-background shadow-lg ring-1 ring-border/10">
              <TypeIcon className="h-6 w-6 text-primary" />
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="absolute end-2.5 top-2.5 flex gap-1.5">
          <Badge variant="secondary" className="text-[10px] backdrop-blur-md bg-background/70 border-0 font-bold px-2 py-0.5 rounded-lg shadow-sm">
            {isAr ? tLabel?.ar : tLabel?.en}
          </Badge>
          {entity.is_verified && (
            <Badge className="bg-chart-3/20 text-chart-3 backdrop-blur-md border-0 text-[10px] px-1.5 py-0.5 rounded-lg shadow-sm">
              <ShieldCheck className="h-2.5 w-2.5" />
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="pt-7 pb-4 px-4 space-y-3">
        {/* Name + scope */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-bold leading-tight truncate group-hover:text-primary transition-colors">{name}</h3>
            {entity.abbreviation && (
              <p className="text-[11px] text-muted-foreground/60 mt-0.5 font-medium">({entity.abbreviation})</p>
            )}
          </div>
          {sLabel && (
            <Badge variant="outline" className="shrink-0 text-[10px] rounded-lg border-border/30 font-bold px-2 py-0.5">
              {isAr ? sLabel.ar : sLabel.en}
            </Badge>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">{description}</p>
        )}

        {/* Meta info */}
        <div className="space-y-1">
          {entity.city && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0 text-primary/50" />
              <span className="truncate">{entity.city}{entity.country ? `, ${entity.country}` : ""}</span>
            </div>
          )}
          {entity.email && (
            <div className="flex items-center gap-2 text-xs">
              <Mail className="h-3 w-3 shrink-0 text-primary/50" />
              <a href={`mailto:${entity.email}`} className="text-primary hover:underline truncate text-[11px]">{entity.email}</a>
            </div>
          )}
          {entity.website && (
            <div className="flex items-center gap-2 text-xs">
              <Globe className="h-3 w-3 shrink-0 text-primary/50" />
              <a href={entity.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate text-[11px]">
                {entity.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
        </div>

        {/* Specializations */}
        {entity.specializations && (entity.specializations as string[]).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(entity.specializations as string[]).slice(0, 3).map(s => (
              <Badge key={s} variant="secondary" className="text-[10px] rounded-md px-1.5 py-0 font-medium">{s}</Badge>
            ))}
            {(entity.specializations as string[]).length > 3 && (
              <Badge variant="secondary" className="text-[10px] rounded-md px-1.5 py-0">
                +{(entity.specializations as string[]).length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/15">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Users className="h-3 w-3" />
            <span className="font-medium tabular-nums">{followerCount}</span>
            <span>{isAr ? "متابع" : "followers"}</span>
            {entity.member_count != null && entity.member_count > 0 && (
              <>
                <span className="text-border">•</span>
                <span className="font-medium tabular-nums">{entity.member_count}</span>
                <span>{isAr ? "عضو" : "members"}</span>
              </>
            )}
          </div>
          {entity.founded_year && (
            <span className="text-[10px] text-muted-foreground/50 font-medium tabular-nums">
              {isAr ? "تأسست" : "Est."} {entity.founded_year}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-9 rounded-xl text-xs font-bold gap-1.5 hover:bg-primary/5 hover:text-primary hover:border-primary/30 active:scale-[0.98] transition-all"
            asChild
          >
            <Link to={`/entities/${entity.slug}`}>
              {isAr ? "عرض التفاصيل" : "View Details"}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
          {canFollow && (
            <Button
              variant={isFollowing ? "ghost" : "secondary"}
              size="icon"
              className={cn(
                "h-9 w-9 rounded-xl shrink-0 active:scale-[0.95] transition-all",
                isFollowing && "text-primary"
              )}
              onClick={() => onToggleFollow(entity.id)}
            >
              {isFollowing ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

/* ─── Main Page ─── */
export default function Entities() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");

  const { data: entities, isLoading } = useQuery({
    queryKey: ["public-entities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("culinary_entities")
        .select("*, entity_followers(id)")
        .eq("status", "active")
        .eq("is_visible", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
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
    staleTime: 1000 * 60 * 3,
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

  const filtered = useMemo(() => entities?.filter(e => {
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
  }), [entities, search, typeFilter, scopeFilter, activeTab, isAr]);

  const entityStats = useMemo(() => {
    if (!entities) return { verified: 0, countries: 0, associations: 0, government: 0 };
    return {
      verified: entities.filter(e => e.is_verified).length,
      countries: new Set(entities.map(e => e.country).filter(Boolean)).size,
      associations: entities.filter(e => e.type === "culinary_association" || e.type === "private_association").length,
      government: entities.filter(e => e.type === "government_entity").length,
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

        <div className="container relative py-12 md:py-20">
          <div className="max-w-3xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/15 shadow-xl backdrop-blur-sm">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <Badge variant="secondary" className="backdrop-blur-xl bg-background/60 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] border-0 shadow-sm">
                <Sparkles className="h-2.5 w-2.5 me-1.5 text-primary" />
                {isAr ? "الدليل المهني الرسمي" : "Official Professional Directory"}
              </Badge>
            </div>

            <div className="space-y-3">
              <h1 className="font-serif text-3xl font-black tracking-tight md:text-5xl lg:text-6xl leading-[1.1]">
                {isAr ? (
                  <>دليل <span className="text-primary">جهات</span> وجمعيات الطهي</>
                ) : (
                  <>Culinary <span className="text-primary">Entities</span> Directory</>
                )}
              </h1>
              <p className="max-w-xl text-base text-muted-foreground font-medium md:text-lg leading-relaxed">
                {isAr
                  ? "اكتشف وتابع جمعيات الطهي والجهات الحكومية والخاصة المعنية بالطهي محلياً ودولياً."
                  : "Discover and follow culinary associations, government entities, and private organizations globally."}
              </p>
            </div>

            {/* Stats row */}
            {entities && entities.length > 0 && (
              <div className="grid grid-cols-2 sm:flex items-center gap-2.5 pt-2">
                <StatCard icon={Building2} value={entities.length} label={isAr ? "إجمالي الجهات" : "Total Entities"} accent="bg-primary/10 text-primary" />
                <StatCard icon={ShieldCheck} value={entityStats.verified} label={isAr ? "جهات موثقة" : "Verified"} accent="bg-chart-3/10 text-chart-3" />
                <StatCard icon={Globe} value={entityStats.countries} label={isAr ? "دولة" : "Countries"} accent="bg-chart-1/10 text-chart-1" />
                <StatCard icon={TrendingUp} value={entityStats.associations} label={isAr ? "جمعيات" : "Associations"} accent="bg-chart-5/10 text-chart-5" />
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="container flex-1 py-6 md:py-8 space-y-6">
        {/* ─── Search & Filters ─── */}
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
            <div className="flex items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-auto min-w-[130px] h-11 bg-muted/30 border-0 rounded-xl text-xs">
                  <Building2 className="h-3.5 w-3.5 me-1.5 text-muted-foreground/50" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={scopeFilter} onValueChange={setScopeFilter}>
                <SelectTrigger className="w-auto min-w-[110px] h-11 bg-muted/30 border-0 rounded-xl text-xs">
                  <Globe className="h-3.5 w-3.5 me-1.5 text-muted-foreground/50" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scopeOptions.map(s => <SelectItem key={s.value} value={s.value}>{isAr ? s.ar : s.en}</SelectItem>)}
                </SelectContent>
              </Select>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                className="gap-1.5 text-xs sm:text-xs rounded-lg data-[state=active]:shadow-sm px-3 py-2"
              >
                <tab.icon className="h-3.5 w-3.5 hidden sm:inline" />
                {isAr ? tab.ar : tab.en}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="rounded-2xl overflow-hidden">
                    <Skeleton className="h-32 w-full rounded-none" />
                    <CardContent className="pt-8 space-y-3">
                      <Skeleton className="h-4 w-3/4 rounded-lg" />
                      <Skeleton className="h-3 w-1/2 rounded-lg" />
                      <Skeleton className="h-10 w-full rounded-xl" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filtered?.length === 0 ? (
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
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered?.map(entity => (
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
          <p className="text-center text-[11px] text-muted-foreground/50 font-medium">
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
