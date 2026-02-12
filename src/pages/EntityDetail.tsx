import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  Building2, MapPin, Globe, Mail, Phone, Users, ShieldCheck,
  Bell, BellOff, ArrowLeft, ExternalLink, Share2, Calendar, Award, Target,
  GraduationCap, BookOpen, Trophy, ArrowRight, Crown
} from "lucide-react";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { useEntityQRCode } from "@/hooks/useQRCode";
import { EntityProgramsTab } from "@/components/entities/EntityProgramsTab";
import { EntityMembersTab } from "@/components/entities/EntityMembersTab";
import { EntityLeadershipSection } from "@/components/entities/EntityLeadershipSection";
import { EntityDegreesTab } from "@/components/entities/EntityDegreesTab";
import { EntityEventsTab } from "@/components/entities/EntityEventsTab";
import { EntityCompetitionsTab } from "@/components/entities/EntityCompetitionsTab";
import entitiesHero from "@/assets/entities-hero.jpg";
import type { Database } from "@/integrations/supabase/types";

type EntityType = Database["public"]["Enums"]["entity_type"];
type EntityScope = Database["public"]["Enums"]["entity_scope"];

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

export default function EntityDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const { data: entity, isLoading } = useQuery({
    queryKey: ["entity", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("culinary_entities")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Entity not found");
      return data;
    },
    enabled: !!slug,
  });

  const { data: isFollowing } = useQuery({
    queryKey: ["entity-follow", entity?.id, user?.id],
    queryFn: async () => {
      if (!user || !entity) return false;
      const { data } = await supabase
        .from("entity_followers")
        .select("id")
        .eq("entity_id", entity.id)
        .eq("user_id", user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!entity,
  });

  const { data: followerCount } = useQuery({
    queryKey: ["entity-followers-count", entity?.id],
    queryFn: async () => {
      if (!entity) return 0;
      const { count } = await supabase
        .from("entity_followers")
        .select("id", { count: "exact", head: true })
        .eq("entity_id", entity.id);
      return count || 0;
    },
    enabled: !!entity,
  });

  const { data: qrCode } = useEntityQRCode("company", entity?.id, "company");

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!user || !entity) throw new Error("Not authenticated");
      if (isFollowing) {
        await supabase.from("entity_followers").delete().eq("entity_id", entity.id).eq("user_id", user.id);
      } else {
        await supabase.from("entity_followers").insert({ entity_id: entity.id, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-follow"] });
      queryClient.invalidateQueries({ queryKey: ["entity-followers-count"] });
      toast({
        title: isFollowing ? (isAr ? "تم إلغاء المتابعة" : "Unfollowed") : (isAr ? "تم المتابعة" : "Following"),
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <Skeleton className="h-64 w-full md:h-80" />
        <main className="container flex-1 py-6 md:py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-start gap-5">
                <Skeleton className="h-20 w-20 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-7 w-3/4" />
                </div>
              </div>
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
            <div className="hidden lg:block space-y-4">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container flex-1 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Building2 className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground mb-1">{isAr ? "الجهة غير موجودة" : "Entity not found"}</p>
          <p className="text-xs text-muted-foreground/60 mb-5">{isAr ? "تحقق من الرابط وحاول مرة أخرى" : "Check the link and try again"}</p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/entities">
              {isAr ? <ArrowRight className="me-1.5 h-4 w-4" /> : <ArrowLeft className="me-1.5 h-4 w-4" />}
              {isAr ? "العودة للدليل" : "Back to Directory"}
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const name = isAr && entity.name_ar ? entity.name_ar : entity.name;
  const description = isAr && entity.description_ar ? entity.description_ar : entity.description;
  const mission = isAr && entity.mission_ar ? entity.mission_ar : entity.mission;
  const address = isAr && entity.address_ar ? entity.address_ar : entity.address;
  const presidentName = isAr && entity.president_name_ar ? entity.president_name_ar : entity.president_name;
  const secretaryName = isAr && entity.secretary_name_ar ? entity.secretary_name_ar : entity.secretary_name;
  const tLabel = typeLabels[entity.type as EntityType];
  const sLabel = scopeLabels[entity.scope as EntityScope];
  const services = (entity.services as string[]) || [];
  const specializations = (entity.specializations as string[]) || [];
  const affiliates = (entity.affiliated_organizations as string[]) || [];
  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      {/* Hero Cover Banner */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {entity.cover_image_url ? (
            <img src={entity.cover_image_url} alt={name} className="h-full w-full object-cover" />
          ) : (
            <img src={entitiesHero} alt="" className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/50 to-transparent" />
        </div>

        {/* Animated orbs */}
        <div className="absolute -top-20 start-1/4 h-48 w-48 rounded-full bg-primary/10 blur-[80px] animate-pulse pointer-events-none" />
        <div className="absolute -top-16 end-1/3 h-40 w-40 rounded-full bg-accent/10 blur-[60px] animate-pulse [animation-delay:1s] pointer-events-none" />

        <div className="container relative py-12 md:py-16">
          {/* Back button */}
          <Button variant="ghost" size="sm" className="mb-6 -ms-2 backdrop-blur-sm bg-background/30 hover:bg-background/50" asChild>
            <Link to="/entities">
              <BackIcon className="me-1.5 h-4 w-4" />
              {isAr ? "العودة للدليل" : "Back to Directory"}
            </Link>
          </Button>

          <div className="flex items-start gap-5">
            {/* Logo */}
            {entity.logo_url ? (
              <img src={entity.logo_url} alt={name} className="h-20 w-20 rounded-2xl border-2 border-background/50 object-cover shadow-xl ring-1 ring-border/10 backdrop-blur-sm md:h-24 md:w-24" />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-background/50 bg-background/80 shadow-xl ring-1 ring-border/10 backdrop-blur-sm md:h-24 md:w-24">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="backdrop-blur-sm bg-secondary/80">{isAr ? tLabel.ar : tLabel.en}</Badge>
                <Badge variant="outline" className="backdrop-blur-sm bg-background/50">{isAr ? sLabel.ar : sLabel.en}</Badge>
                {entity.is_verified && (
                  <Badge className="bg-chart-3/20 text-chart-3 backdrop-blur-sm">
                    <ShieldCheck className="me-1 h-3 w-3" />{isAr ? "موثق" : "Verified"}
                  </Badge>
                )}
              </div>
              <h1 className="font-serif text-2xl font-bold md:text-3xl lg:text-4xl">{name}</h1>
              {entity.abbreviation && (
                <p className="text-muted-foreground mt-0.5">({entity.abbreviation})</p>
              )}
              <p className="mt-1 text-sm text-muted-foreground/70 font-mono">#{entity.entity_number}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="container flex-1 py-6 md:py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Description */}
            {description && (
              <div className="prose prose-sm max-w-none text-foreground/80 dark:prose-invert">
                <p className="whitespace-pre-line leading-relaxed">{description}</p>
              </div>
            )}

            {/* Mission */}
            {mission && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  {isAr ? "الرسالة" : "Mission"}
                </h2>
                <Card><CardContent className="pt-4 text-sm text-foreground/80 leading-relaxed">{mission}</CardContent></Card>
              </section>
            )}

            {/* Services */}
            {services.length > 0 && (
              <section>
                <h2 className="mb-3 text-xl font-semibold">{isAr ? "الخدمات" : "Services"}</h2>
                <div className="flex flex-wrap gap-2">
                  {services.map(s => <Badge key={s} variant="outline" className="py-1.5">{s}</Badge>)}
                </div>
              </section>
            )}

            {/* Specializations */}
            {specializations.length > 0 && (
              <section>
                <h2 className="mb-3 text-xl font-semibold">{isAr ? "التخصصات" : "Specializations"}</h2>
                <div className="flex flex-wrap gap-2">
                  {specializations.map(s => <Badge key={s} variant="secondary" className="py-1.5">{s}</Badge>)}
                </div>
              </section>
            )}

            {/* Leadership - Dynamic from entity_positions */}
            <EntityLeadershipSection
              entityId={entity.id}
              presidentName={presidentName}
              secretaryName={secretaryName}
            />

            {/* Affiliated */}
            {affiliates.length > 0 && (
              <section>
                <h2 className="mb-3 text-xl font-semibold">{isAr ? "المنظمات التابعة" : "Affiliated Organizations"}</h2>
                <div className="flex flex-wrap gap-2">
                  {affiliates.map(a => <Badge key={a} variant="outline">{a}</Badge>)}
                </div>
              </section>
            )}

            {/* Gallery */}
            {entity.gallery_urls && entity.gallery_urls.length > 0 && (
              <section>
                <h2 className="mb-3 text-xl font-semibold">{isAr ? "معرض الصور" : "Gallery"}</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {entity.gallery_urls.map((url, i) => (
                    <img key={i} src={url} alt={`${name} ${i + 1}`} className="rounded-xl object-cover aspect-video shadow-sm" />
                  ))}
                </div>
              </section>
            )}

            {/* Entity Sub-sections Tabs */}
            <Tabs defaultValue="programs" className="mt-8">
              <TabsList className="flex-wrap bg-muted/50 p-1 gap-0.5">
                <TabsTrigger value="programs" className="gap-1.5 text-xs sm:text-sm">
                  <BookOpen className="h-3.5 w-3.5" />{isAr ? "البرامج" : "Programs"}
                </TabsTrigger>
                <TabsTrigger value="members" className="gap-1.5 text-xs sm:text-sm">
                  <Users className="h-3.5 w-3.5" />{isAr ? "الأعضاء" : "Members"}
                </TabsTrigger>
                <TabsTrigger value="degrees" className="gap-1.5 text-xs sm:text-sm">
                  <GraduationCap className="h-3.5 w-3.5" />{isAr ? "الشهادات" : "Degrees"}
                </TabsTrigger>
                <TabsTrigger value="events" className="gap-1.5 text-xs sm:text-sm">
                  <Calendar className="h-3.5 w-3.5" />{isAr ? "الفعاليات" : "Events"}
                </TabsTrigger>
                <TabsTrigger value="competitions" className="gap-1.5 text-xs sm:text-sm">
                  <Trophy className="h-3.5 w-3.5" />{isAr ? "المسابقات" : "Competitions"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="programs" className="mt-4">
                <EntityProgramsTab entityId={entity.id} />
              </TabsContent>
              <TabsContent value="members" className="mt-4">
                <EntityMembersTab entityId={entity.id} />
              </TabsContent>
              <TabsContent value="degrees" className="mt-4">
                <EntityDegreesTab entityId={entity.id} />
              </TabsContent>
              <TabsContent value="events" className="mt-4">
                <EntityEventsTab entityId={entity.id} />
              </TabsContent>
              <TabsContent value="competitions" className="mt-4">
                <EntityCompetitionsTab entityId={entity.id} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Actions */}
            <Card className="overflow-hidden">
              <div className="border-b bg-muted/30 px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                  </div>
                  {isAr ? "إجراءات" : "Actions"}
                </h3>
              </div>
              <CardContent className="space-y-3 p-4">
                {user && (
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    className="w-full"
                    onClick={() => toggleFollow.mutate()}
                    disabled={toggleFollow.isPending}
                  >
                    {isFollowing ? <><BellOff className="me-2 h-4 w-4" />{isAr ? "إلغاء المتابعة" : "Unfollow"}</>
                      : <><Bell className="me-2 h-4 w-4" />{isAr ? "تابع للتحديثات" : "Follow for Updates"}</>}
                  </Button>
                )}
                {entity.website && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={entity.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="me-2 h-4 w-4" />{isAr ? "الموقع الرسمي" : "Visit Website"}
                    </a>
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="w-full" onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({ title: isAr ? "تم نسخ الرابط" : "Link copied!" });
                }}>
                  <Share2 className="me-2 h-4 w-4" />{isAr ? "مشاركة" : "Share"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  <Users className="mb-0.5 me-1 inline h-3 w-3" />
                  {followerCount} {isAr ? "متابع" : "followers"}
                </p>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="overflow-hidden">
              <div className="border-b bg-muted/30 px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10">
                    <Mail className="h-3.5 w-3.5 text-accent-foreground" />
                  </div>
                  {isAr ? "معلومات الاتصال" : "Contact Information"}
                </h3>
              </div>
              <CardContent className="space-y-3 p-4 text-sm">
                {entity.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 shrink-0 text-primary" />
                    <a href={`mailto:${entity.email}`} className="text-primary hover:underline truncate">{entity.email}</a>
                  </div>
                )}
                {entity.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 shrink-0 text-primary" />
                    <span>{entity.phone}</span>
                  </div>
                )}
                {entity.fax && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{isAr ? "فاكس:" : "Fax:"} {entity.fax}</span>
                  </div>
                )}
                {(entity.city || entity.country) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      {address && <p>{address}</p>}
                      <p className="text-muted-foreground">
                        {entity.city}{entity.country ? `, ${entity.country}` : ""}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* QR Code */}
            {qrCode && (
              <QRCodeDisplay
                code={qrCode.code}
                label={isAr ? "رمز QR للجهة" : "Entity QR Code"}
                size={140}
                compact={false}
              />
            )}

            {/* Quick Facts */}
            <Card className="overflow-hidden">
              <div className="border-b bg-muted/30 px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-chart-1/10">
                    <Calendar className="h-3.5 w-3.5 text-chart-1" />
                  </div>
                  {isAr ? "معلومات سريعة" : "Quick Facts"}
                </h3>
              </div>
              <CardContent className="p-0 text-sm">
                {entity.founded_year && (
                  <div className="flex items-center justify-between px-4 py-2.5 border-b last:border-0">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "تأسست" : "Founded"}</span>
                    <span className="font-medium">{entity.founded_year}</span>
                  </div>
                )}
                {entity.member_count && (
                  <div className="flex items-center justify-between px-4 py-2.5 border-b last:border-0">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "الأعضاء" : "Members"}</span>
                    <span className="font-medium">{entity.member_count.toLocaleString()}</span>
                  </div>
                )}
                {entity.registration_number && (
                  <div className="flex items-center justify-between px-4 py-2.5 border-b last:border-0">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "رقم التسجيل" : "Reg. #"}</span>
                    <span className="font-mono text-xs">{entity.registration_number}</span>
                  </div>
                )}
                {entity.license_number && (
                  <div className="flex items-center justify-between px-4 py-2.5 border-b last:border-0">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "الترخيص" : "License #"}</span>
                    <span className="font-mono text-xs">{entity.license_number}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
