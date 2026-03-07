import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Search, Building2, Globe, MapPin, Users, ShieldCheck, Bell, BellOff, ExternalLink, Mail, Phone, Sparkles, Landmark, GraduationCap, Briefcase } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { toEnglishDigits } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import entitiesHero from "@/assets/entities-hero.jpg";
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

const typeLabels: Record<EntityType, { en: string; ar: string }> = {
  culinary_association: { en: "Culinary Association", ar: "جمعية طهي" },
  government_entity: { en: "Government Entity", ar: "جهة حكومية" },
  private_association: { en: "Private Association", ar: "جمعية خاصة" },
  culinary_academy: { en: "Culinary Academy", ar: "أكاديمية طهي" },
  industry_body: { en: "Industry Body", ar: "هيئة صناعية" },
  university: { en: "University", ar: "جامعة" },
  college: { en: "College", ar: "كلية" },
  training_center: { en: "Training Center", ar: "مركز تدريب" },
};

const scopeLabels: Record<EntityScope, { en: string; ar: string }> = {
  local: { en: "Local", ar: "محلي" },
  national: { en: "National", ar: "وطني" },
  regional: { en: "Regional", ar: "إقليمي" },
  international: { en: "International", ar: "دولي" },
};

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

  const filtered = entities?.filter(e => {
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
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead title="Culinary Entities Directory" description="Discover culinary associations, government entities, and academies worldwide." />
      <Header />

      {/* Hero Banner - Premium */}
      <section className="relative overflow-hidden border-b border-border/40">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img src={entitiesHero} alt="" className="h-full w-full object-cover scale-105 blur-[2px] opacity-20 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
        </div>

        {/* Animated orbs */}
        <div className="absolute -top-40 start-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[120px] animate-pulse pointer-events-none" />
        <div className="absolute -bottom-20 end-1/3 h-72 w-72 rounded-full bg-accent/15 blur-[100px] animate-pulse [animation-delay:1.5s] pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div className="container relative py-16 md:py-24">
          <div className="max-w-3xl space-y-8 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[2rem] bg-primary/10 ring-4 ring-primary/5 shadow-2xl backdrop-blur-md transition-transform hover:scale-110">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <Badge variant="secondary" className="backdrop-blur-md bg-background/80 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border-0 shadow-lg">
                {isAr ? "الدليل المهني الرسمي" : "Official Professional Directory"}
              </Badge>
            </div>
            
            <div className="space-y-4">
              <h1 className="font-serif text-4xl font-black tracking-tight md:text-6xl lg:text-7xl leading-[1.05]">
                {isAr ? (
                  <>دليل <span className="text-primary italic relative">جهات<span className="absolute -bottom-2 inset-x-0 h-3 bg-primary/10 -rotate-2 -z-10" /></span> وجمعيات الطهي</>
                ) : (
                  <>Culinary <span className="text-primary italic relative">Entities<span className="absolute -bottom-2 inset-x-0 h-4 bg-primary/10 -rotate-1 -z-10" /></span> Directory</>
                )}
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground font-medium md:text-xl leading-relaxed">
                {isAr
                  ? "اكتشف وتابع جمعيات الطهي والجهات الحكومية والخاصة المعنية بالطهي محلياً ودولياً."
                  : "Discover and follow culinary associations, government entities, and private organizations globally."}
              </p>
            </div>

            {/* Quick stat pills */}
            {entities && entities.length > 0 && (
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="gap-2 px-5 py-2 text-xs font-bold border-primary/20 bg-primary/5 text-primary rounded-full backdrop-blur-md">
                  <Building2 className="h-3.5 w-3.5" />
                  {entities.length} {isAr ? "جهة" : "Entities"}
                </Badge>
                <Badge variant="outline" className="gap-2 px-5 py-2 text-xs font-bold border-chart-3/20 bg-chart-3/5 text-chart-3 rounded-full backdrop-blur-md">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {entities.filter(e => e.is_verified).length} {isAr ? "موثقة" : "Verified"}
                </Badge>
                <Badge variant="outline" className="gap-2 px-5 py-2 text-xs font-bold border-chart-1/20 bg-chart-1/5 text-chart-1 rounded-full backdrop-blur-md">
                  <Globe className="h-3.5 w-3.5" />
                  {new Set(entities.map(e => e.country).filter(Boolean)).size} {isAr ? "دولة" : "Countries"}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="container flex-1 py-6 md:py-8">

        {/* Search & Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isAr ? "ابحث عن جهة أو جمعية..." : "Search entities..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="ps-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {typeOptions.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={scopeFilter} onValueChange={setScopeFilter}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {scopeOptions.map(s => <SelectItem key={s.value} value={s.value}>{isAr ? s.ar : s.en}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex-wrap bg-muted/50 p-1 gap-0.5">
            <TabsTrigger value="all" className="gap-1.5 text-xs sm:text-sm">
              <Building2 className="h-3.5 w-3.5 hidden sm:inline" />
              {isAr ? "الكل" : "All"}
            </TabsTrigger>
            <TabsTrigger value="education" className="gap-1.5 text-xs sm:text-sm">
              <GraduationCap className="h-3.5 w-3.5 hidden sm:inline" />
              {isAr ? "تعليمي" : "Education"}
            </TabsTrigger>
            <TabsTrigger value="local" className="gap-1.5 text-xs sm:text-sm">
              <MapPin className="h-3.5 w-3.5 hidden sm:inline" />
              {isAr ? "محلي ووطني" : "Local & National"}
            </TabsTrigger>
            <TabsTrigger value="international" className="gap-1.5 text-xs sm:text-sm">
              <Globe className="h-3.5 w-3.5 hidden sm:inline" />
              {isAr ? "إقليمي ودولي" : "Regional & International"}
            </TabsTrigger>
            <TabsTrigger value="government" className="gap-1.5 text-xs sm:text-sm">
              <Landmark className="h-3.5 w-3.5 hidden sm:inline" />
              {isAr ? "حكومي" : "Government"}
            </TabsTrigger>
            <TabsTrigger value="private" className="gap-1.5 text-xs sm:text-sm">
              <Briefcase className="h-3.5 w-3.5 hidden sm:inline" />
              {isAr ? "خاص" : "Private & Associations"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <Skeleton className="h-36 w-full rounded-t-lg" />
                    <CardContent className="pt-8 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-12 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filtered?.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <Building2 className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">{isAr ? "لم يتم العثور على جهات" : "No entities found"}</p>
                <p className="mt-1 text-xs text-muted-foreground/60">{isAr ? "جرب تغيير عوامل التصفية" : "Try adjusting your filters"}</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered?.map(entity => {
                  const name = isAr && entity.name_ar ? entity.name_ar : entity.name;
                  const description = isAr && entity.description_ar ? entity.description_ar : entity.description;
                  const tLabel = typeLabels[entity.type as EntityType];
                  const sLabel = scopeLabels[entity.scope as EntityScope];
                  const isFollowing = myFollows?.includes(entity.id);
                  const followerCount = (entity as any).entity_followers?.length || 0;

                  return (
                    <Card key={entity.id} className="group overflow-hidden border-border/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20">
                      {/* Cover / Logo Header */}
                      <div className="relative h-36 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5">
                        {entity.cover_image_url ? (
                          <img src={entity.cover_image_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Building2 className="h-12 w-12 text-primary/15" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                        
                        {/* Logo positioned at bottom-start */}
                        <div className="absolute -bottom-6 start-4">
                          {entity.logo_url ? (
                            <img src={entity.logo_url} alt={name} className="h-14 w-14 rounded-xl border-2 border-background bg-background object-cover shadow-lg ring-1 ring-border/10" loading="lazy" />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-background bg-background shadow-lg ring-1 ring-border/10">
                              <Building2 className="h-7 w-7 text-primary" />
                            </div>
                          )}
                        </div>

                        {/* Badges at top-end */}
                        <div className="absolute end-3 top-3 flex gap-1.5">
                          <Badge variant="secondary" className="text-[10px] backdrop-blur-sm bg-secondary/80">{isAr ? tLabel.ar : tLabel.en}</Badge>
                          {entity.is_verified && (
                            <Badge className="bg-chart-3/20 text-chart-3 backdrop-blur-sm text-[10px]">
                              <ShieldCheck className="me-1 h-3 w-3" />{isAr ? "موثق" : "Verified"}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <CardHeader className="pt-8 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <CardTitle className="text-base leading-tight truncate">{name}</CardTitle>
                            {entity.abbreviation && (
                              <p className="text-xs text-muted-foreground mt-0.5">({entity.abbreviation})</p>
                            )}
                          </div>
                          <Badge variant="outline" className="shrink-0 text-[10px]">{isAr ? sLabel.ar : sLabel.en}</Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {description && <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed">{description}</p>}

                        <div className="space-y-1.5 text-sm text-muted-foreground">
                          {entity.city && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                              <span className="truncate">{entity.city}{entity.country ? `, ${entity.country}` : ""}</span>
                            </div>
                          )}
                          {entity.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                              <a href={`mailto:${entity.email}`} className="text-primary hover:underline truncate">{entity.email}</a>
                            </div>
                          )}
                          {entity.website && (
                            <div className="flex items-center gap-2">
                              <Globe className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                              <a href={entity.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{entity.website}</a>
                            </div>
                          )}
                        </div>

                        {entity.specializations && (entity.specializations as string[]).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {(entity.specializations as string[]).slice(0, 3).map(s => (
                              <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span><AnimatedCounter value={followerCount} className="inline" /> {isAr ? "متابع" : "followers"}</span>
                            {entity.member_count && (
                              <span className="ms-2">• <AnimatedCounter value={entity.member_count} className="inline" format /> {isAr ? "عضو" : "members"}</span>
                            )}
                          </div>
                          {entity.founded_year && (
                            <span className="text-[10px] text-muted-foreground/70">{isAr ? "تأسست" : "Est."} {entity.founded_year}</span>
                          )}
                        </div>

                        <div className="flex gap-2 pt-1">
                          <Button variant="outline" size="sm" className="flex-1" asChild>
                            <Link to={`/entities/${entity.slug}`}>{isAr ? "التفاصيل" : "View Details"}</Link>
                          </Button>
                          {user && (
                            <Button
                              variant={isFollowing ? "ghost" : "secondary"}
                              size="sm"
                              onClick={() => toggleFollow.mutate(entity.id)}
                              disabled={toggleFollow.isPending}
                            >
                              {isFollowing ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Results count */}
        {filtered && filtered.length > 0 && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            {isAr ? `عرض ${filtered.length} من ${entities?.length ?? 0} جهة` : `Showing ${filtered.length} of ${entities?.length ?? 0} entities`}
          </p>
        )}

        {/* Stats */}
        {entities && entities.length > 0 && (
          <section className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: isAr ? "إجمالي الجهات" : "Total Entities", value: entities.length, accent: "border-s-primary/40" },
              { label: isAr ? "جمعيات" : "Associations", value: entities.filter(e => e.type === "culinary_association" || e.type === "private_association").length, accent: "border-s-chart-3/40" },
              { label: isAr ? "جهات حكومية" : "Government", value: entities.filter(e => e.type === "government_entity").length, accent: "border-s-chart-4/40" },
              { label: isAr ? "الدول" : "Countries", value: new Set(entities.map(e => e.country).filter(Boolean)).size, accent: "border-s-accent/40" },
            ].map((stat) => (
              <Card key={stat.label} className={`border-s-[3px] ${stat.accent} transition-all hover:shadow-sm`}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold sm:text-3xl">{stat.value}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
