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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  Calendar, MapPin, Globe, ExternalLink, Bell, BellOff,
  Clock, Users, Tag, Building, Phone, Mail, ArrowLeft,
  Share2, Ticket, Trophy, Landmark, Timer, Flag,
  ChevronRight, Star, Target, Award, Mic2, Pencil
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, isPast, isFuture, isWithinInterval, formatDistanceToNow, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from "date-fns";
import { useState, useEffect, useMemo } from "react";

/* ---------- types ---------- */
interface ScheduleDay {
  day?: string;
  day_ar?: string;
  title?: string;
  title_ar?: string;
  items?: ScheduleItem[];
  events?: ScheduleItem[];
  time?: string;
  description?: string;
  description_ar?: string;
}

interface ScheduleItem {
  time?: string;
  title?: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
}

interface Speaker {
  name?: string;
  name_ar?: string;
  title?: string;
  title_ar?: string;
  role?: string;
  role_ar?: string;
  topic?: string;
  topic_ar?: string;
  image_url?: string;
  country?: string;
}

interface SponsorInfo {
  name?: string;
  name_ar?: string;
  tier?: string;
  logo_url?: string;
}

interface Section {
  name?: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
}

/* ---------- country flag helper ---------- */
const COUNTRY_FLAGS: Record<string, string> = {
  tunisia: "🇹🇳", "تونس": "🇹🇳",
  uae: "🇦🇪", "الإمارات": "🇦🇪",
  france: "🇫🇷", "فرنسا": "🇫🇷",
  italy: "🇮🇹", "إيطاليا": "🇮🇹",
  morocco: "🇲🇦", "المغرب": "🇲🇦",
  algeria: "🇩🇿", "الجزائر": "🇩🇿",
  egypt: "🇪🇬", "مصر": "🇪🇬",
  lebanon: "🇱🇧", "لبنان": "🇱🇧",
  jordan: "🇯🇴", "الأردن": "🇯🇴",
  "saudi arabia": "🇸🇦", "السعودية": "🇸🇦",
  qatar: "🇶🇦", "قطر": "🇶🇦",
  bahrain: "🇧🇭", "البحرين": "🇧🇭",
  kuwait: "🇰🇼", "الكويت": "🇰🇼",
  oman: "🇴🇲", "عُمان": "🇴🇲",
  turkey: "🇹🇷", "تركيا": "🇹🇷",
  spain: "🇪🇸", "إسبانيا": "🇪🇸",
  usa: "🇺🇸", "أمريكا": "🇺🇸",
  uk: "🇬🇧", "بريطانيا": "🇬🇧",
  germany: "🇩🇪", "ألمانيا": "🇩🇪",
  japan: "🇯🇵", "اليابان": "🇯🇵",
  china: "🇨🇳", "الصين": "🇨🇳",
  india: "🇮🇳", "الهند": "🇮🇳",
  libya: "🇱🇾", "ليبيا": "🇱🇾",
  sudan: "🇸🇩", "السودان": "🇸🇩",
  iraq: "🇮🇶", "العراق": "🇮🇶",
  syria: "🇸🇾", "سوريا": "🇸🇾",
  palestine: "🇵🇸", "فلسطين": "🇵🇸",
  yemen: "🇾🇪", "اليمن": "🇾🇪",
};

function getCountryFlag(country?: string): string {
  if (!country) return "🏳️";
  return COUNTRY_FLAGS[country.toLowerCase()] || "🏳️";
}

/* ---------- Countdown ---------- */
function CountdownTimer({ targetDate, isAr }: { targetDate: Date; isAr: boolean }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const isPastTarget = isPast(targetDate);
  if (isPastTarget) return null;

  const totalSeconds = Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const units = [
    { value: days, label: isAr ? "يوم" : "Days" },
    { value: hours, label: isAr ? "ساعة" : "Hours" },
    { value: minutes, label: isAr ? "دقيقة" : "Min" },
    { value: seconds, label: isAr ? "ثانية" : "Sec" },
  ];

  return (
    <div className="flex items-center justify-center gap-3">
      {units.map((u, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 font-mono text-2xl font-bold text-primary sm:h-20 sm:w-20 sm:text-3xl">
            {String(u.value).padStart(2, "0")}
          </div>
          <span className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{u.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- main ---------- */
export default function ExhibitionDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const { data: exhibition, isLoading } = useQuery({
    queryKey: ["exhibition", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibitions")
        .select("*")
        .eq("slug", slug!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: isFollowing } = useQuery({
    queryKey: ["exhibition-follow", exhibition?.id, user?.id],
    queryFn: async () => {
      if (!user || !exhibition) return false;
      const { data } = await supabase
        .from("exhibition_followers")
        .select("id")
        .eq("exhibition_id", exhibition.id)
        .eq("user_id", user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!exhibition,
  });

  const { data: followerCount } = useQuery({
    queryKey: ["exhibition-followers-count", exhibition?.id],
    queryFn: async () => {
      if (!exhibition) return 0;
      const { count } = await supabase
        .from("exhibition_followers")
        .select("id", { count: "exact", head: true })
        .eq("exhibition_id", exhibition.id);
      return count || 0;
    },
    enabled: !!exhibition,
  });

  const { data: linkedCompetitions } = useQuery({
    queryKey: ["exhibition-competitions", exhibition?.id],
    queryFn: async () => {
      if (!exhibition) return [];
      const { data, error } = await supabase
        .from("competitions")
        .select(`
          id, title, title_ar, status, competition_start, competition_end, 
          cover_image_url, city, country, is_virtual, registration_start, registration_end,
          max_participants, description, description_ar,
          competition_categories(id, name, name_ar, max_participants),
          competition_registrations(id),
          competition_judges(
            id, judge_id
          )
        `)
        .eq("exhibition_id", exhibition.id)
        .order("competition_start", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!exhibition,
  });

  /* fetch judge profiles for linked competitions */
  const allJudgeIds = useMemo(() => {
    if (!linkedCompetitions) return [];
    const ids = new Set<string>();
    linkedCompetitions.forEach((c: any) => {
      c.competition_judges?.forEach((j: any) => ids.add(j.judge_id));
    });
    return Array.from(ids);
  }, [linkedCompetitions]);

  const { data: judgeProfiles } = useQuery({
    queryKey: ["exhibition-judge-profiles", allJudgeIds],
    queryFn: async () => {
      if (allJudgeIds.length === 0) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, username, avatar_url, specialization, is_verified, country")
        .in("user_id", allJudgeIds);
      return data || [];
    },
    enabled: allJudgeIds.length > 0,
  });

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!user || !exhibition) throw new Error("Not authenticated");
      if (isFollowing) {
        await supabase.from("exhibition_followers").delete().eq("exhibition_id", exhibition.id).eq("user_id", user.id);
      } else {
        await supabase.from("exhibition_followers").insert({ exhibition_id: exhibition.id, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-follow"] });
      queryClient.invalidateQueries({ queryKey: ["exhibition-followers-count"] });
      toast({
        title: isFollowing ? (isAr ? "تم إلغاء المتابعة" : "Unfollowed") : (isAr ? "تم المتابعة" : "Following"),
        description: isFollowing
          ? (isAr ? "لن تتلقى إشعارات بعد الآن" : "You won't receive updates anymore")
          : (isAr ? "ستتلقى إشعارات حول هذا الحدث" : "You'll receive updates about this event"),
      });
    },
  });

  /* ---------- loading / not found ---------- */
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container flex-1 py-8">
          <Skeleton className="mb-4 h-8 w-32 rounded-md" />
          <Skeleton className="mb-8 h-64 w-full rounded-xl md:h-80" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Skeleton className="h-9 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="mt-4 h-32 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-44 w-full rounded-xl" />
              <Skeleton className="h-56 w-full rounded-xl" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!exhibition) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container flex-1 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/60">
            <Landmark className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-lg font-semibold">{isAr ? "الحدث غير موجود" : "Event not found"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAr ? "قد يكون قد تم حذفه أو نقله" : "It may have been removed or moved"}
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/exhibitions">
              <ArrowLeft className="me-2 h-4 w-4" />
              {isAr ? "العودة للفعاليات" : "Back to Events"}
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  /* ---------- derived data ---------- */
  const title = isAr && exhibition.title_ar ? exhibition.title_ar : exhibition.title;
  const description = isAr && exhibition.description_ar ? exhibition.description_ar : exhibition.description;
  const venue = isAr && exhibition.venue_ar ? exhibition.venue_ar : exhibition.venue;
  const organizer = isAr && exhibition.organizer_name_ar ? exhibition.organizer_name_ar : exhibition.organizer_name;

  const now = new Date();
  const start = new Date(exhibition.start_date);
  const end = new Date(exhibition.end_date);
  const isHappening = isWithinInterval(now, { start, end });
  const isUpcoming = isFuture(start);
  const hasEnded = isPast(end);

  const schedule = (exhibition.schedule as ScheduleDay[]) || [];
  const speakers = (exhibition.speakers as Speaker[]) || [];
  const sections = (exhibition.sections as Section[]) || [];
  const sponsorsInfo = (exhibition.sponsors_info as SponsorInfo[]) || [];
  const targetAudience = (exhibition.target_audience as string[]) || [];
  const tags = (exhibition.tags as string[]) || [];

  const totalDays = differenceInDays(end, start) + 1;
  const countryFlag = getCountryFlag(exhibition.country || undefined);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead
        title={title}
        description={description || `${title} - Event on Altohaa`}
        ogImage={exhibition.cover_image_url || undefined}
        ogType="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Event",
          name: title,
          description: description || undefined,
          startDate: exhibition.start_date,
          endDate: exhibition.end_date,
          location: exhibition.is_virtual
            ? { "@type": "VirtualLocation" }
            : { "@type": "Place", name: venue || undefined, address: { "@type": "PostalAddress", addressLocality: exhibition.city, addressCountry: exhibition.country } },
          image: exhibition.cover_image_url || undefined,
          organizer: organizer ? { "@type": "Organization", name: organizer } : undefined,
        }}
      />
      <Header />

      {/* ======== HERO ======== */}
      <div className="relative overflow-hidden">
        {exhibition.cover_image_url ? (
          <img src={exhibition.cover_image_url} alt={title} className="h-64 w-full object-cover md:h-80 lg:h-96" />
        ) : (
          <div className="h-64 w-full bg-gradient-to-br from-primary/20 via-accent/10 to-background md:h-80 lg:h-96" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 container pb-8">
          <Button variant="ghost" size="sm" className="-ms-2 mb-3 text-foreground/80 hover:text-foreground" asChild>
            <Link to="/exhibitions">
              <ArrowLeft className="me-1.5 h-4 w-4" />
              {isAr ? "العودة للفعاليات" : "Back to Events"}
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {isHappening && <Badge className="bg-chart-3/20 text-chart-3 border-chart-3/30">{isAr ? "🔴 يحدث الآن" : "🔴 Happening Now"}</Badge>}
            {isUpcoming && <Badge className="bg-primary/20 text-primary border-primary/30">{isAr ? "قادم" : "Upcoming"}</Badge>}
            {hasEnded && <Badge variant="secondary">{isAr ? "انتهى" : "Ended"}</Badge>}
            <Badge variant="outline" className="gap-1">
              <span>{countryFlag}</span>
              {exhibition.city}{exhibition.country && `, ${exhibition.country}`}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-3xl font-bold md:text-4xl lg:text-5xl">{title}</h1>
            {user && exhibition.created_by === user.id && (
              <Button variant="secondary" size="sm" asChild>
                <Link to={`/exhibitions/${exhibition.slug}/edit`}>
                  <Pencil className="me-1.5 h-3.5 w-3.5" />
                  {isAr ? "تعديل" : "Edit"}
                </Link>
              </Button>
            )}
          </div>
          {organizer && (
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              {isAr ? "المنظم:" : "Organized by"} <span className="font-medium text-foreground">{organizer}</span>
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {format(start, "MMM d")} – {format(end, "MMM d, yyyy")}
              <Badge variant="secondary" className="ms-1 text-[10px]">{totalDays} {isAr ? "أيام" : "days"}</Badge>
            </span>
            {!exhibition.is_virtual && venue && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {venue}
              </span>
            )}
            {exhibition.is_virtual && (
              <span className="flex items-center gap-1.5">
                <Globe className="h-4 w-4" />
                {isAr ? "حدث افتراضي" : "Virtual Event"}
              </span>
            )}
          </div>
        </div>
      </div>

      <main className="container flex-1 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* ======== MAIN CONTENT ======== */}
          <div className="space-y-10 lg:col-span-2">

            {/* COUNTDOWN */}
            {(isUpcoming || isHappening) && (
              <Card className="overflow-hidden border-primary/20">
                <div className="border-b bg-primary/5 px-5 py-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                      <Timer className="h-4 w-4 text-primary" />
                    </div>
                    {isHappening
                      ? (isAr ? "⏱️ الحدث جارٍ الآن — ينتهي خلال" : "⏱️ Event is Live — Ends in")
                      : (isAr ? "⏳ العد التنازلي للحدث" : "⏳ Event Countdown")}
                  </h3>
                </div>
                <CardContent className="py-6">
                  <CountdownTimer targetDate={isHappening ? end : start} isAr={isAr} />
                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    {isHappening
                      ? (isAr ? `ينتهي في ${format(end, "d MMMM yyyy")}` : `Ends on ${format(end, "MMMM d, yyyy")}`)
                      : (isAr ? `يبدأ في ${format(start, "d MMMM yyyy")}` : `Starts on ${format(start, "MMMM d, yyyy")}`)}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* DESCRIPTION */}
            {description && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60">
                    <Landmark className="h-4 w-4 text-primary" />
                  </div>
                  {isAr ? "عن الحدث" : "About the Event"}
                </h2>
                <p className="leading-relaxed text-foreground/80 whitespace-pre-line">{description}</p>
              </section>
            )}

            {/* COMPETITIONS */}
            {linkedCompetitions && linkedCompetitions.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Trophy className="h-4 w-4 text-primary" />
                  </div>
                  {isAr ? "المسابقات" : "Competitions"}
                  <Badge variant="secondary" className="ms-1">{linkedCompetitions.length}</Badge>
                </h2>
                <div className="space-y-4">
                  {linkedCompetitions.map((comp: any) => {
                    const compTitle = isAr && comp.title_ar ? comp.title_ar : comp.title;
                    const compDesc = isAr && comp.description_ar ? comp.description_ar : comp.description;
                    const compStart = new Date(comp.competition_start);
                    const compEnd = new Date(comp.competition_end);
                    const compIsLive = isWithinInterval(now, { start: compStart, end: compEnd });
                    const compIsPast = isPast(compEnd);
                    const categories = comp.competition_categories || [];
                    const regCount = comp.competition_registrations?.length || 0;
                    const regEnd = comp.registration_end ? new Date(comp.registration_end) : null;
                    const regStart = comp.registration_start ? new Date(comp.registration_start) : null;
                    const regOpen = regStart && regEnd && !isPast(regEnd) && isPast(regStart);
                    const regClosed = regEnd && isPast(regEnd);
                    const maxParts = comp.max_participants;

                    return (
                      <Card key={comp.id} className="overflow-hidden border-border/60 transition-all hover:shadow-md hover:-translate-y-0.5">
                        <div className="flex flex-col sm:flex-row">
                          {comp.cover_image_url && (
                            <div className="sm:w-48 shrink-0">
                              <img src={comp.cover_image_url} alt={compTitle} className="h-40 w-full object-cover sm:h-full" />
                            </div>
                          )}
                          <div className="flex-1 p-5">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge variant={compIsLive ? "default" : compIsPast ? "secondary" : "outline"} className="text-[10px]">
                                {compIsLive ? (isAr ? "🔴 جارية" : "🔴 Live") : compIsPast ? (isAr ? "انتهت" : "Ended") : (isAr ? "قادمة" : "Upcoming")}
                              </Badge>
                              {regOpen && <Badge className="bg-chart-3/20 text-chart-3 border-chart-3/30 text-[10px]">{isAr ? "التسجيل مفتوح" : "Registration Open"}</Badge>}
                              {regClosed && <Badge variant="secondary" className="text-[10px]">{isAr ? "التسجيل مغلق" : "Registration Closed"}</Badge>}
                              {comp.is_virtual && <Badge variant="outline" className="text-[10px]"><Globe className="me-1 h-3 w-3" />{isAr ? "افتراضي" : "Virtual"}</Badge>}
                            </div>

                            <Link to={`/competitions/${comp.id}`} className="group">
                              <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{compTitle}</h3>
                            </Link>

                            {compDesc && (
                              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{compDesc}</p>
                            )}

                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(compStart, "MMM d")} – {format(compEnd, "MMM d, yyyy")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {regCount}{maxParts ? `/${maxParts}` : ""} {isAr ? "مسجل" : "registered"}
                              </span>
                              {comp.city && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {getCountryFlag(comp.country)} {comp.city}
                                </span>
                              )}
                            </div>

                            {/* Registration dates */}
                            {(regStart || regEnd) && (
                              <div className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 ${regOpen ? 'bg-chart-3/5 border border-chart-3/10' : 'bg-muted/30 border border-border/40'}`}>
                                <Clock className={`h-3.5 w-3.5 shrink-0 ${regOpen ? 'text-chart-3' : 'text-muted-foreground'}`} />
                                <span className={`text-xs font-medium ${regOpen ? 'text-chart-3' : 'text-muted-foreground'}`}>
                                  {regClosed
                                    ? (isAr ? "انتهى التسجيل" : "Registration Closed")
                                    : regOpen
                                      ? (isAr ? `آخر موعد للتسجيل: ${format(regEnd!, "d MMM yyyy")}` : `Register by: ${format(regEnd!, "MMM d, yyyy")}`)
                                      : regStart
                                        ? (isAr ? `التسجيل يبدأ: ${format(regStart, "d MMM yyyy")}` : `Registration opens: ${format(regStart, "MMM d, yyyy")}`)
                                        : null}
                                </span>
                                {regEnd && regOpen && (
                                  <Badge variant="outline" className="ms-auto text-[10px]">
                                    {formatDistanceToNow(regEnd, { addSuffix: false })} {isAr ? "متبقي" : "left"}
                                  </Badge>
                                )}
                              </div>
                            )}

                            {/* Categories */}
                            {categories.length > 0 && (
                              <div className="mt-3">
                                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                                  {isAr ? "الفئات" : "Categories"} ({categories.length})
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {categories.map((cat: any) => (
                                    <Badge key={cat.id} variant="secondary" className="text-[10px] gap-1">
                                      {isAr && cat.name_ar ? cat.name_ar : cat.name}
                                      {cat.max_participants && (
                                        <span className="text-muted-foreground">({cat.max_participants})</span>
                                      )}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="mt-4 flex flex-wrap gap-2">
                              {regOpen && (
                                <Button size="sm" asChild>
                                  <Link to={`/competitions/${comp.id}`}>
                                    <Trophy className="me-1.5 h-3.5 w-3.5" />
                                    {isAr ? "سجّل الآن" : "Register Now"}
                                  </Link>
                                </Button>
                              )}
                              <Button size="sm" variant="outline" asChild>
                                <Link to={`/competitions/${comp.id}`}>
                                  {isAr ? "عرض التفاصيل" : "View Details"}
                                  <ChevronRight className="ms-1 h-3 w-3" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            {/* SCHEDULE / TIMELINE */}
            {schedule.length > 0 && (
              <section>
                <h2 className="mb-5 flex items-center gap-2 text-xl font-semibold">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                    <Calendar className="h-4 w-4 text-accent" />
                  </div>
                  {isAr ? "الجدول الزمني" : "Event Timeline"}
                </h2>
                <div className="space-y-8">
                  {schedule.map((dayOrItem, i) => {
                    const dayEvents = dayOrItem.items || dayOrItem.events || [];
                    const dayLabel = isAr && dayOrItem.day_ar ? dayOrItem.day_ar : dayOrItem.day;
                    const dayTitle = isAr && dayOrItem.title_ar ? dayOrItem.title_ar : dayOrItem.title;

                    if (dayEvents.length > 0) {
                      return (
                        <div key={i}>
                          {/* Day header */}
                          <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">
                              {i + 1}
                            </div>
                            <div>
                              {dayLabel && <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">{dayLabel}</p>}
                              {dayTitle && <p className="font-semibold">{dayTitle}</p>}
                            </div>
                          </div>

                          {/* Timeline events */}
                          <div className="ms-5 border-s-2 border-border ps-6 space-y-0">
                            {dayEvents.map((item, j) => (
                              <div key={j} className="relative pb-6 last:pb-0">
                                {/* Dot */}
                                <div className="absolute -start-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background" />
                                <div className="rounded-lg border border-border/60 bg-card p-4 transition-colors hover:border-primary/30">
                                  {item.time && (
                                    <p className="mb-1 font-mono text-xs font-semibold text-primary">{item.time}</p>
                                  )}
                                  <p className="font-medium">{isAr && item.title_ar ? item.title_ar : item.title}</p>
                                  {(item.description || item.description_ar) && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {isAr && item.description_ar ? item.description_ar : item.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    /* single flat event */
                    return (
                      <div key={i} className="flex gap-4 rounded-lg border border-border/60 bg-card p-4">
                        <div className="shrink-0 font-mono text-sm font-semibold text-primary">{dayOrItem.time || dayLabel}</div>
                        <div>
                          <p className="font-medium">{isAr && dayOrItem.title_ar ? dayOrItem.title_ar : dayOrItem.title}</p>
                          {(dayOrItem.description || dayOrItem.description_ar) && (
                            <p className="text-sm text-muted-foreground">
                              {isAr && dayOrItem.description_ar ? dayOrItem.description_ar : dayOrItem.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* JUDGING COMMITTEE */}
            {judgeProfiles && judgeProfiles.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                    <Award className="h-4 w-4 text-accent" />
                  </div>
                  {isAr ? "لجنة التحكيم" : "Judging Committee"}
                  <Badge variant="secondary" className="ms-1">{judgeProfiles.length}</Badge>
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {judgeProfiles.map((judge: any) => {
                    const judgeName = isAr && judge.full_name_ar ? judge.full_name_ar : judge.full_name;
                    const judgeFlag = getCountryFlag(judge.country);
                    return (
                      <Link key={judge.user_id} to={`/${judge.username || judge.user_id}`} className="block">
                        <Card className="overflow-hidden border-border/60 transition-all hover:shadow-md hover:-translate-y-0.5 group">
                          <CardContent className="flex flex-col items-center p-5 text-center">
                            <Avatar className="h-16 w-16 mb-3 ring-2 ring-border group-hover:ring-primary/30 transition-all">
                              <AvatarImage src={judge.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                                {(judgeName || "J")[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-1.5">
                              <span className="text-lg">{judgeFlag}</span>
                              <p className="font-semibold">{judgeName || (isAr ? "حكم" : "Judge")}</p>
                              {judge.is_verified && <Star className="h-3.5 w-3.5 text-primary fill-primary" />}
                            </div>
                            {judge.specialization && (
                              <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{judge.specialization}</p>
                            )}
                            {judge.country && (
                              <Badge variant="outline" className="mt-2 text-[10px]">
                                {judgeFlag} {judge.country}
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* SPEAKERS */}
            {speakers.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Mic2 className="h-4 w-4 text-primary" />
                  </div>
                  {isAr ? "المتحدثون" : "Speakers"}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {speakers.map((speaker, i) => (
                    <Card key={i} className="overflow-hidden border-border/60">
                      <CardContent className="flex flex-col items-center p-5 text-center">
                        {speaker.image_url ? (
                          <img src={speaker.image_url} alt={speaker.name} className="mb-3 h-16 w-16 rounded-full object-cover ring-2 ring-border" />
                        ) : (
                          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 ring-2 ring-border">
                            <Mic2 className="h-7 w-7 text-accent/60" />
                          </div>
                        )}
                        <p className="font-semibold">{isAr && speaker.name_ar ? speaker.name_ar : speaker.name}</p>
                        {(speaker.title || speaker.title_ar || speaker.role || speaker.role_ar) && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {isAr && (speaker.title_ar || speaker.role_ar) ? (speaker.title_ar || speaker.role_ar) : (speaker.title || speaker.role)}
                          </p>
                        )}
                        {(speaker.topic || speaker.topic_ar) && (
                          <Badge variant="outline" className="mt-2 text-[10px]">
                            {isAr && speaker.topic_ar ? speaker.topic_ar : speaker.topic}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* SPONSORS */}
            {sponsorsInfo.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Star className="h-4 w-4 text-primary" />
                  </div>
                  {isAr ? "الرعاة والشركاء" : "Sponsors & Partners"}
                </h2>
                <div className="space-y-3">
                  {sponsorsInfo.map((sponsor, i) => {
                    const sponsorName = isAr && sponsor.name_ar ? sponsor.name_ar : sponsor.name;
                    const tierLabels: Record<string, { en: string; ar: string }> = {
                      patron: { en: "Patron", ar: "راعي" },
                      partner: { en: "Partner", ar: "شريك" },
                      gold: { en: "Gold", ar: "ذهبي" },
                      silver: { en: "Silver", ar: "فضي" },
                      bronze: { en: "Bronze", ar: "برونزي" },
                    };
                    const tier = sponsor.tier ? tierLabels[sponsor.tier] : null;
                    return (
                      <div key={i} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 shrink-0">
                          <Building className="h-5 w-5 text-primary/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{sponsorName}</p>
                        </div>
                        {tier && (
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {isAr ? tier.ar : tier.en}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* TARGET AUDIENCE */}
            {targetAudience.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60">
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {isAr ? "الفئة المستهدفة" : "Target Audience"}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {targetAudience.map((audience) => (
                    <Badge key={audience} variant="outline" className="py-1.5 capitalize">{audience.replace(/_/g, " ")}</Badge>
                  ))}
                </div>
              </section>
            )}

            {/* GALLERY */}
            {exhibition.gallery_urls && exhibition.gallery_urls.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-semibold">{isAr ? "معرض الصور" : "Gallery"}</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {exhibition.gallery_urls.map((url, i) => (
                    <img key={i} src={url} alt={`${title} ${i + 1}`} className="rounded-lg object-cover aspect-video" />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ======== SIDEBAR ======== */}
          <div className="space-y-4">
            {/* Actions */}
            <Card className="overflow-hidden border-border/60">
              <div className="border-b bg-muted/30 px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                    <Ticket className="h-3.5 w-3.5 text-primary" />
                  </div>
                  {isAr ? "إجراءات" : "Actions"}
                </h3>
              </div>
              <CardContent className="space-y-3 p-4">
                {exhibition.registration_url && !hasEnded && (
                  <Button className="w-full" asChild>
                    <a href={exhibition.registration_url} target="_blank" rel="noopener noreferrer">
                      <Ticket className="me-2 h-4 w-4" />
                      {isAr ? "سجل الآن" : "Register Now"}
                    </a>
                  </Button>
                )}
                {user && (
                  <Button
                    variant={isFollowing ? "outline" : "secondary"}
                    className="w-full"
                    onClick={() => toggleFollow.mutate()}
                    disabled={toggleFollow.isPending}
                  >
                    {isFollowing ? (
                      <><BellOff className="me-2 h-4 w-4" />{isAr ? "إلغاء المتابعة" : "Unfollow"}</>
                    ) : (
                      <><Bell className="me-2 h-4 w-4" />{isAr ? "تابع للإشعارات" : "Follow for Updates"}</>
                    )}
                  </Button>
                )}
                {exhibition.website_url && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={exhibition.website_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="me-2 h-4 w-4" />
                      {isAr ? "الموقع الرسمي" : "Official Website"}
                    </a>
                  </Button>
                )}
                <p className="text-center text-xs text-muted-foreground">
                  <Users className="mb-0.5 me-1 inline h-3 w-3" />
                  {followerCount} {isAr ? "متابع" : "followers"}
                </p>
              </CardContent>
            </Card>

            {/* Event Details */}
            <Card className="overflow-hidden border-border/60">
              <div className="border-b bg-muted/30 px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10">
                    <Calendar className="h-3.5 w-3.5 text-accent" />
                  </div>
                  {isAr ? "تفاصيل الحدث" : "Event Details"}
                </h3>
              </div>
              <CardContent className="space-y-4 p-4 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "التاريخ" : "Date"}</p>
                    <p className="font-medium">{format(start, "MMM d, yyyy")} – {format(end, "MMM d, yyyy")}</p>
                  </div>
                </div>

                {exhibition.registration_deadline && (
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "آخر موعد للتسجيل" : "Registration Deadline"}</p>
                      <p className="font-medium">{format(new Date(exhibition.registration_deadline), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                )}

                {exhibition.is_virtual ? (
                  <div className="flex items-start gap-3">
                    <Globe className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "حدث افتراضي" : "Virtual Event"}</p>
                      {exhibition.virtual_link && !hasEnded && (
                        <a href={exhibition.virtual_link} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                          {isAr ? "رابط الدخول" : "Join Link"}
                        </a>
                      )}
                    </div>
                  </div>
                ) : venue && (
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "الموقع" : "Location"}</p>
                      <p className="font-medium">
                        {countryFlag} {venue}
                        {exhibition.city && <><br />{exhibition.city}</>}
                        {exhibition.country && `, ${exhibition.country}`}
                      </p>
                      {exhibition.map_url && (
                        <a href={exhibition.map_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                          {isAr ? "عرض الخريطة" : "View Map"}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "التذاكر" : "Tickets"}</p>
                    <p className="font-medium">
                      {exhibition.is_free
                        ? (isAr ? "دخول مجاني" : "Free Entry")
                        : (isAr && exhibition.ticket_price_ar ? exhibition.ticket_price_ar : exhibition.ticket_price || (isAr ? "راجع الموقع" : "See website"))}
                    </p>
                  </div>
                </div>

                {exhibition.max_attendees && (
                  <div className="flex items-start gap-3">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "السعة" : "Capacity"}</p>
                      <p className="font-medium">{exhibition.max_attendees.toLocaleString()} {isAr ? "مقعد" : "attendees"}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Organizer */}
            {organizer && (
              <Card className="overflow-hidden border-border/60">
                <div className="border-b bg-muted/30 px-4 py-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                      <Building className="h-3.5 w-3.5 text-primary" />
                    </div>
                    {isAr ? "المنظم" : "Organizer"}
                  </h3>
                </div>
                <CardContent className="space-y-2.5 p-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{organizer}</span>
                  </div>
                  {exhibition.organizer_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${exhibition.organizer_email}`} className="text-primary underline">{exhibition.organizer_email}</a>
                    </div>
                  )}
                  {exhibition.organizer_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-xs">{exhibition.organizer_phone}</span>
                    </div>
                  )}
                  {exhibition.organizer_website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={exhibition.organizer_website} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        {isAr ? "الموقع" : "Website"}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <Card className="overflow-hidden border-border/60">
                <div className="border-b bg-muted/30 px-4 py-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10">
                      <Tag className="h-3.5 w-3.5 text-accent" />
                    </div>
                    {isAr ? "الوسوم" : "Tags"}
                  </h3>
                </div>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Share */}
            <Card className="overflow-hidden border-border/60">
              <div className="border-b bg-muted/30 px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                    <Share2 className="h-3.5 w-3.5 text-primary" />
                  </div>
                  {isAr ? "مشاركة" : "Share"}
                </h3>
              </div>
              <CardContent className="p-4">
                <Button size="sm" variant="outline" className="w-full" onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({ title: isAr ? "تم نسخ الرابط" : "Link copied!" });
                }}>
                  <Share2 className="me-1.5 h-3.5 w-3.5" />
                  {isAr ? "نسخ الرابط" : "Copy Link"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
