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
import { Search, Building2, Globe, MapPin, Users, ShieldCheck, Bell, BellOff, ExternalLink, Mail, Phone, Sparkles } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
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

      {/* Hero Banner */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute -top-32 start-1/4 h-64 w-64 rounded-full bg-primary/8 blur-[100px] animate-pulse pointer-events-none" />
        <div className="absolute -top-20 end-1/3 h-48 w-48 rounded-full bg-accent/10 blur-[80px] animate-pulse [animation-delay:1s] pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className="container relative py-10 md:py-14">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15 shadow-sm">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold md:text-3xl lg:text-4xl">
                {isAr ? "دليل الجهات والجمعيات الطهوية" : "Culinary Entities Directory"}
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground sm:text-base">
                {isAr
                  ? "اكتشف وتابع الجمعيات الطهوية والجهات الحكومية والخاصة المعنية بالطهي محلياً ودولياً"
                  : "Discover and follow culinary associations, government entities, and private organizations locally and internationally"}
              </p>
            </div>
          </div>

          {/* Quick stat pills */}
          {entities && entities.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs">
                <Building2 className="h-3 w-3" />
                {entities.length} {isAr ? "جهة" : "Entities"}
              </Badge>
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs">
                <ShieldCheck className="h-3 w-3" />
                {entities.filter(e => e.is_verified).length} {isAr ? "موثقة" : "Verified"}
              </Badge>
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs">
                <Globe className="h-3 w-3" />
                {new Set(entities.map(e => e.country).filter(Boolean)).size} {isAr ? "دولة" : "Countries"}
              </Badge>
            </div>
          )}
        </div>
      </section>

      <main className="container flex-1 py-6 md:py-8">

        {/* Search & Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
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
            <TabsTrigger value="all" className="text-xs sm:text-sm">{isAr ? "الكل" : "All"}</TabsTrigger>
            <TabsTrigger value="local" className="text-xs sm:text-sm">{isAr ? "محلي ووطني" : "Local & National"}</TabsTrigger>
            <TabsTrigger value="international" className="text-xs sm:text-sm">{isAr ? "إقليمي ودولي" : "Regional & International"}</TabsTrigger>
            <TabsTrigger value="government" className="text-xs sm:text-sm">{isAr ? "حكومي" : "Government"}</TabsTrigger>
            <TabsTrigger value="private" className="text-xs sm:text-sm">{isAr ? "خاص" : "Private & Associations"}</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <Skeleton className="h-32 w-full rounded-t-lg" />
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
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Building2 className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">{isAr ? "لم يتم العثور على جهات" : "No entities found"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground/60">{isAr ? "جرب تغيير عوامل التصفية" : "Try adjusting your filters"}</p>
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
                    <Card key={entity.id} className="group overflow-hidden border-border/50 transition-all hover:shadow-lg hover:-translate-y-1 hover:border-primary/20">
                      {/* Cover / Logo Header */}
                      <div className="relative h-32 bg-gradient-to-br from-primary/10 to-accent/10">
                        {entity.cover_image_url ? (
                          <img src={entity.cover_image_url} alt="" className="h-full w-full object-cover" />
                        ) : null}
                        <div className="absolute -bottom-6 left-4">
                          {entity.logo_url ? (
                            <img src={entity.logo_url} alt={name} className="h-14 w-14 rounded-lg border-2 border-background bg-background object-cover shadow" />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-background bg-background shadow">
                              <Building2 className="h-7 w-7 text-primary" />
                            </div>
                          )}
                        </div>
                        <div className="absolute right-3 top-3 flex gap-1.5">
                          <Badge variant="secondary">{isAr ? tLabel.ar : tLabel.en}</Badge>
                          {entity.is_verified && (
                            <Badge className="bg-chart-3/20 text-chart-3"><ShieldCheck className="mr-1 h-3 w-3" />{isAr ? "موثق" : "Verified"}</Badge>
                          )}
                        </div>
                      </div>

                      <CardHeader className="pt-8 pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{name}</CardTitle>
                            {entity.abbreviation && (
                              <p className="text-xs text-muted-foreground">({entity.abbreviation})</p>
                            )}
                          </div>
                          <Badge variant="outline">{isAr ? sLabel.ar : sLabel.en}</Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {description && <p className="line-clamp-2 text-sm text-foreground/70">{description}</p>}

                        <div className="space-y-1.5 text-sm text-muted-foreground">
                          {entity.city && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              <span>{entity.city}{entity.country ? `, ${entity.country}` : ""}</span>
                            </div>
                          )}
                          {entity.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <a href={`mailto:${entity.email}`} className="text-primary hover:underline truncate">{entity.email}</a>
                            </div>
                          )}
                          {entity.website && (
                            <div className="flex items-center gap-2">
                              <Globe className="h-3.5 w-3.5 shrink-0" />
                              <a href={entity.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{entity.website}</a>
                            </div>
                          )}
                        </div>

                        {entity.specializations && (entity.specializations as string[]).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {(entity.specializations as string[]).slice(0, 3).map(s => (
                              <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{followerCount} {isAr ? "متابع" : "followers"}</span>
                            {entity.member_count && (
                              <span className="ml-2">• {entity.member_count.toLocaleString()} {isAr ? "عضو" : "members"}</span>
                            )}
                          </div>
                          {entity.founded_year && (
                            <span className="text-xs text-muted-foreground">{isAr ? "تأسست" : "Est."} {entity.founded_year}</span>
                          )}
                        </div>

                        <div className="flex gap-2">
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

        {/* Stats */}
        {entities && entities.length > 0 && (
          <section className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: isAr ? "إجمالي الجهات" : "Total Entities", value: entities.length },
              { label: isAr ? "جمعيات" : "Associations", value: entities.filter(e => e.type === "culinary_association" || e.type === "private_association").length },
              { label: isAr ? "جهات حكومية" : "Government", value: entities.filter(e => e.type === "government_entity").length },
              { label: isAr ? "الدول" : "Countries", value: new Set(entities.map(e => e.country).filter(Boolean)).size },
            ].map((stat, i) => (
              <Card key={stat.label} className={`border-s-[3px] ${
                i === 0 ? "border-s-primary/30" : i === 1 ? "border-s-chart-3/30" : i === 2 ? "border-s-chart-4/30" : "border-s-accent/30"
              } transition-all hover:shadow-sm`}>
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
