import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import {
  Calendar, MapPin, Globe, ExternalLink, Bell, BellOff,
  Clock, Users, Tag, Building, Phone, Mail, ArrowLeft,
  Share2, Ticket, Trophy, Landmark, Timer, Flag,
  ChevronRight, ChevronDown, Star, Target, Award, Mic2, Pencil,
  CheckCircle2
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { format, isPast, isFuture, isWithinInterval, formatDistanceToNow, differenceInDays } from "date-fns";
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

/* ---------- Tier Config ---------- */
const TIER_CONFIG: Record<string, { icon: typeof Star; gradient: string; label: string; labelAr: string; order: number }> = {
  patron: { icon: Award, gradient: "from-chart-4/20 to-chart-4/5", label: "Patron", labelAr: "راعي رسمي", order: 0 },
  platinum: { icon: Star, gradient: "from-purple-500/20 to-purple-500/5", label: "Platinum", labelAr: "بلاتيني", order: 1 },
  gold: { icon: Star, gradient: "from-yellow-500/20 to-yellow-500/5", label: "Gold", labelAr: "ذهبي", order: 2 },
  partner: { icon: Building, gradient: "from-primary/20 to-primary/5", label: "Partner", labelAr: "شريك", order: 3 },
  silver: { icon: Star, gradient: "from-muted-foreground/20 to-muted-foreground/5", label: "Silver", labelAr: "فضي", order: 4 },
  bronze: { icon: Star, gradient: "from-amber-600/20 to-amber-600/5", label: "Bronze", labelAr: "برونزي", order: 5 },
};

/* ---------- Countdown ---------- */
function CountdownTimer({ targetDate, isAr }: { targetDate: Date; isAr: boolean }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (isPast(targetDate)) return null;

  const totalSeconds = Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const units = [
    { value: days, label: isAr ? "يوم" : "Days", max: 999 },
    { value: hours, label: isAr ? "ساعة" : "Hours", max: 23 },
    { value: minutes, label: isAr ? "دقيقة" : "Min", max: 59 },
    { value: seconds, label: isAr ? "ثانية" : "Sec", max: 59 },
  ];

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      {units.map((u, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/10 to-primary/5 shadow-sm sm:h-24 sm:w-24">
            <span className="font-mono text-3xl font-bold text-primary sm:text-4xl">
              {String(u.value).padStart(2, "0")}
            </span>
            <div className="absolute inset-x-0 top-1/2 h-px bg-primary/10" />
          </div>
          <span className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{u.label}</span>
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
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url, specialization, is_verified, location, bio")
        .in("user_id", allJudgeIds);

      const { data: judgeExtras } = await supabase
        .from("judge_profiles")
        .select("user_id, judge_title, judge_title_ar, judge_category, judge_level, nationality, profile_photo_url, current_position, current_employer")
        .in("user_id", allJudgeIds);

      const extrasMap = new Map(judgeExtras?.map(j => [j.user_id, j]) || []);
      return (profiles || []).map(p => ({
        ...p,
        judgeExtra: extrasMap.get(p.user_id) || null,
      }));
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

  // Sort sponsors by tier
  const sortedSponsors = [...sponsorsInfo].sort((a, b) => {
    const orderA = TIER_CONFIG[a.tier || ""]?.order ?? 99;
    const orderB = TIER_CONFIG[b.tier || ""]?.order ?? 99;
    return orderA - orderB;
  });

  // Group sponsors by tier
  const sponsorsByTier = sortedSponsors.reduce<Record<string, SponsorInfo[]>>((acc, s) => {
    const tier = s.tier || "other";
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(s);
    return acc;
  }, {});

  const organizerLogoUrl = (exhibition as any).organizer_logo_url || exhibition.logo_url;

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
          <img src={exhibition.cover_image_url} alt={title} className="h-72 w-full object-cover md:h-[22rem] lg:h-[28rem]" />
        ) : (
          <div className="h-72 w-full bg-gradient-to-br from-primary/20 via-accent/10 to-background md:h-[22rem] lg:h-[28rem]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 container pb-10">
          <Button variant="ghost" size="sm" className="-ms-2 mb-4 text-foreground/80 hover:text-foreground" asChild>
            <Link to="/exhibitions">
              <ArrowLeft className="me-1.5 h-4 w-4" />
              {isAr ? "العودة للفعاليات" : "Back to Events"}
            </Link>
          </Button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {isHappening && <Badge className="bg-chart-3/20 text-chart-3 border-chart-3/30 shadow-sm">{isAr ? "🔴 يحدث الآن" : "🔴 Happening Now"}</Badge>}
                {isUpcoming && <Badge className="bg-primary/20 text-primary border-primary/30 shadow-sm">{isAr ? "قادم" : "Upcoming"}</Badge>}
                {hasEnded && <Badge variant="secondary" className="shadow-sm">{isAr ? "انتهى" : "Ended"}</Badge>}
                <Badge variant="outline" className="gap-1 shadow-sm">
                  <span>{countryFlag}</span>
                  {exhibition.city}{exhibition.country && `, ${exhibition.country}`}
                </Badge>
              </div>

              <h1 className="font-serif text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">{title}</h1>

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

            {/* Organizer Logo + Name in hero */}
            {organizer && (
              <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/80 px-4 py-3 backdrop-blur-sm shadow-sm shrink-0">
                {organizerLogoUrl ? (
                  <img src={organizerLogoUrl} alt={organizer} className="h-12 w-12 rounded-lg object-contain bg-background p-1" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "المنظم" : "Organized by"}</p>
                  <p className="font-semibold text-sm">{organizer}</p>
                </div>
              </div>
            )}
          </div>

          {user && exhibition.created_by === user.id && (
            <Button variant="secondary" size="sm" className="mt-3" asChild>
              <Link to={`/exhibitions/${exhibition.slug}/edit`}>
                <Pencil className="me-1.5 h-3.5 w-3.5" />
                {isAr ? "تعديل" : "Edit"}
              </Link>
            </Button>
          )}
        </div>
      </div>

      <main className="container flex-1 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* ======== MAIN CONTENT ======== */}
          <div className="space-y-10 lg:col-span-2">

            {/* ── COUNTDOWN ── */}
            {(isUpcoming || isHappening) && (
              <Card className="overflow-hidden border-primary/20 shadow-md">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-4">
                  <h3 className="flex items-center gap-2.5 font-semibold">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 shadow-sm">
                      <Timer className="h-5 w-5 text-primary" />
                    </div>
                    {isHappening
                      ? (isAr ? "الحدث جارٍ الآن — ينتهي خلال" : "Event is Live — Ends in")
                      : (isAr ? "العد التنازلي للحدث" : "Event Countdown")}
                  </h3>
                </div>
                <CardContent className="py-8">
                  <CountdownTimer targetDate={isHappening ? end : start} isAr={isAr} />
                  <p className="mt-5 text-center text-sm text-muted-foreground">
                    {isHappening
                      ? (isAr ? `ينتهي في ${format(end, "d MMMM yyyy")}` : `Ends on ${format(end, "MMMM d, yyyy")}`)
                      : (isAr ? `يبدأ في ${format(start, "d MMMM yyyy")}` : `Starts on ${format(start, "MMMM d, yyyy")}`)}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* ── DESCRIPTION ── */}
            {description && (
              <section>
                <h2 className="mb-4 flex items-center gap-2.5 text-xl font-bold">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60">
                    <Landmark className="h-4.5 w-4.5 text-primary" />
                  </div>
                  {isAr ? "عن الحدث" : "About the Event"}
                </h2>
                <p className="leading-relaxed text-foreground/80 whitespace-pre-line text-[15px]">{description}</p>
              </section>
            )}

            {/* ── COMPETITIONS ── */}
            {linkedCompetitions && linkedCompetitions.length > 0 && (
              <section>
                <h2 className="mb-5 flex items-center gap-2.5 text-xl font-bold">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <Trophy className="h-4.5 w-4.5 text-primary" />
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
                      <Card key={comp.id} className="overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
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
                            </div>

                            <Link to={`/competitions/${comp.id}`} className="group">
                              <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{compTitle}</h3>
                            </Link>

                            {compDesc && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{compDesc}</p>}

                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(compStart, "MMM d")} – {format(compEnd, "MMM d, yyyy")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {regCount}{maxParts ? `/${maxParts}` : ""} {isAr ? "مسجل" : "registered"}
                              </span>
                            </div>

                            {categories.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {categories.slice(0, 5).map((cat: any) => (
                                  <Badge key={cat.id} variant="secondary" className="text-[10px]">
                                    {isAr && cat.name_ar ? cat.name_ar : cat.name}
                                  </Badge>
                                ))}
                                {categories.length > 5 && (
                                  <Badge variant="outline" className="text-[10px]">+{categories.length - 5}</Badge>
                                )}
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

            {/* ── SCHEDULE / TIMELINE (Collapsible) ── */}
            {schedule.length > 0 && (
              <section>
                <h2 className="mb-5 flex items-center gap-2.5 text-xl font-bold">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
                    <Calendar className="h-4.5 w-4.5 text-accent" />
                  </div>
                  {isAr ? "الجدول الزمني" : "Event Timeline"}
                  <Badge variant="secondary" className="ms-1">{schedule.length} {isAr ? "أيام" : "days"}</Badge>
                </h2>
                <div className="space-y-4">
                  {schedule.map((dayOrItem, i) => {
                    const dayEvents = dayOrItem.items || dayOrItem.events || [];
                    const dayLabel = isAr && dayOrItem.day_ar ? dayOrItem.day_ar : dayOrItem.day;
                    const dayTitle = isAr && dayOrItem.title_ar ? dayOrItem.title_ar : dayOrItem.title;

                    if (dayEvents.length > 0) {
                      return (
                        <CollapsibleDay
                          key={i}
                          index={i}
                          dayLabel={dayLabel}
                          dayTitle={dayTitle}
                          events={dayEvents}
                          isAr={isAr}
                          defaultOpen={i === 0}
                          coverImageUrl={exhibition.cover_image_url}
                        />
                      );
                    }

                    /* single flat event */
                    return (
                      <div key={i} className="flex gap-4 rounded-xl border bg-card p-4 shadow-sm">
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

            {/* ── JUDGING COMMITTEE ── */}
            {judgeProfiles && judgeProfiles.length > 0 && (
              <section>
                <h2 className="mb-5 flex items-center gap-2.5 text-xl font-bold">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-4/10">
                    <Award className="h-4.5 w-4.5 text-chart-4" />
                  </div>
                  {isAr ? "لجنة التحكيم" : "Judging Committee"}
                  <Badge variant="secondary" className="ms-1">{judgeProfiles.length}</Badge>
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {judgeProfiles.map((judge: any) => {
                    const judgeName = judge.full_name;
                    const jp = judge.judgeExtra;
                    const photo = jp?.profile_photo_url || judge.avatar_url;
                    const judgeTitle = isAr && jp?.judge_title_ar ? jp.judge_title_ar : jp?.judge_title;
                    const initials = (judgeName || "J").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                    const nationalityFlag = getCountryFlag(jp?.nationality || judge.location);

                    return (
                      <Link
                        key={judge.user_id}
                        to={`/${judge.username || judge.user_id}`}
                        className="group block rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5"
                      >
                        <div className="flex gap-4 p-5">
                          <Avatar className="h-16 w-16 rounded-xl shrink-0 ring-2 ring-background shadow-md">
                            <AvatarImage src={photo || undefined} alt={judgeName} className="object-cover" />
                            <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-lg font-bold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                                {judgeName || (isAr ? "حكم" : "Judge")}
                              </span>
                              {judge.is_verified && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                              )}
                              <span className="text-base leading-none ms-0.5">{nationalityFlag}</span>
                            </div>

                            {judgeTitle && (
                              <p className="text-xs text-primary/80 font-medium truncate">{judgeTitle}</p>
                            )}

                            {(jp?.current_position || jp?.current_employer) && (
                              <p className="text-[11px] text-muted-foreground truncate">
                                {jp.current_position}{jp.current_position && jp.current_employer ? " · " : ""}{jp.current_employer}
                              </p>
                            )}

                            {judge.specialization && (
                              <p className="text-[11px] text-muted-foreground truncate">{judge.specialization}</p>
                            )}
                          </div>
                        </div>

                        {/* Footer badges */}
                        <div className="border-t bg-muted/20 px-5 py-2.5 flex items-center gap-2 flex-wrap">
                          {jp?.judge_level && (
                            <Badge variant="outline" className="text-[9px] h-5 gap-0.5">
                              <Award className="h-2.5 w-2.5" />
                              {jp.judge_level}
                            </Badge>
                          )}
                          {jp?.judge_category && (
                            <Badge variant="secondary" className="text-[9px] h-5">{jp.judge_category}</Badge>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── SPEAKERS ── */}
            {speakers.length > 0 && (
              <section>
                <h2 className="mb-5 flex items-center gap-2.5 text-xl font-bold">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <Mic2 className="h-4.5 w-4.5 text-primary" />
                  </div>
                  {isAr ? "المتحدثون" : "Speakers"}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {speakers.map((speaker, i) => (
                    <Card key={i} className="overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
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

            {/* ── SPONSORS (Side-by-side logos) ── */}
            {sortedSponsors.length > 0 && (
              <section>
                <h2 className="mb-5 flex items-center gap-2.5 text-xl font-bold">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <Star className="h-4.5 w-4.5 text-primary" />
                  </div>
                  {isAr ? "الرعاة والشركاء" : "Sponsors & Partners"}
                </h2>
                <div className="space-y-6">
                  {Object.entries(sponsorsByTier).map(([tier, sponsors]) => {
                    const config = TIER_CONFIG[tier];
                    const tierLabel = config ? (isAr ? config.labelAr : config.label) : tier;
                    return (
                      <div key={tier}>
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {tierLabel}
                        </p>
                        <div className="flex flex-wrap items-start gap-6">
                          {sponsors.map((sponsor, i) => {
                            const sponsorName = isAr && sponsor.name_ar ? sponsor.name_ar : sponsor.name;
                            return (
                              <div key={i} className="flex flex-col items-center text-center w-28">
                                <div className={`flex h-20 w-20 items-center justify-center rounded-2xl border bg-gradient-to-b ${config?.gradient || 'from-muted/20 to-muted/5'} shadow-sm`}>
                                  {sponsor.logo_url ? (
                                    <img src={sponsor.logo_url} alt={sponsorName || ""} className="h-14 w-14 rounded-lg object-contain" />
                                  ) : (
                                    <Building className="h-8 w-8 text-muted-foreground/50" />
                                  )}
                                </div>
                                <p className="mt-2 text-xs font-semibold leading-tight line-clamp-2">{sponsorName}</p>
                                <p className="mt-0.5 text-[10px] text-muted-foreground">{tierLabel}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* TARGET AUDIENCE */}
            {targetAudience.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2.5 text-xl font-bold">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60">
                    <Target className="h-4.5 w-4.5 text-muted-foreground" />
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
                <h2 className="mb-4 text-xl font-bold">{isAr ? "معرض الصور" : "Gallery"}</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {exhibition.gallery_urls.map((url: string, i: number) => (
                    <img key={i} src={url} alt={`${title} ${i + 1}`} className="rounded-xl object-cover aspect-video shadow-sm" />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ======== SIDEBAR ======== */}
          <div className="space-y-4">
            {/* Actions */}
            <Card className="overflow-hidden shadow-md">
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
            <Card className="overflow-hidden">
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

            {/* Organizer Card */}
            {organizer && (
              <Card className="overflow-hidden">
                <div className="border-b bg-muted/30 px-4 py-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                      <Building className="h-3.5 w-3.5 text-primary" />
                    </div>
                    {isAr ? "المنظم" : "Organizer"}
                  </h3>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {organizerLogoUrl ? (
                      <img src={organizerLogoUrl} alt={organizer} className="h-14 w-14 rounded-xl object-contain bg-muted/30 p-1.5 border" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 border">
                        <Building className="h-7 w-7 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{organizer}</p>
                      {exhibition.organizer_email && (
                        <a href={`mailto:${exhibition.organizer_email}`} className="text-xs text-primary hover:underline">{exhibition.organizer_email}</a>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {exhibition.organizer_phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span className="font-mono text-xs">{exhibition.organizer_phone}</span>
                      </div>
                    )}
                    {exhibition.organizer_website && (
                      <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                        <a href={exhibition.organizer_website} target="_blank" rel="noopener noreferrer">
                          <Globe className="me-1.5 h-3.5 w-3.5" />
                          {isAr ? "موقع المنظم" : "Organizer Website"}
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <Card className="overflow-hidden">
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
            <Card className="overflow-hidden">
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

/* ---------- Collapsible Day Component ---------- */
function CollapsibleDay({
  index,
  dayLabel,
  dayTitle,
  events,
  isAr,
  defaultOpen,
  coverImageUrl,
}: {
  index: number;
  dayLabel?: string;
  dayTitle?: string;
  events: ScheduleItem[];
  isAr: boolean;
  defaultOpen: boolean;
  coverImageUrl?: string | null;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="overflow-hidden shadow-sm">
        {/* Day Header with cover-like gradient */}
        <CollapsibleTrigger asChild>
          <button className="w-full text-start">
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/5" />
              <div className="relative flex items-center gap-4 px-5 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-sm shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  {dayLabel && <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{dayLabel}</p>}
                  {dayTitle && <p className="font-semibold text-sm truncate">{dayTitle}</p>}
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {events.length} {isAr ? "فعالية" : "events"}
                  </p>
                </div>
                <ChevronDown className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
              </div>
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t">
            <div className="ms-10 border-s-2 border-primary/20 ps-6 py-4 pe-5 space-y-0">
              {events.map((item, j) => (
                <div key={j} className="relative pb-5 last:pb-0">
                  {/* Dot */}
                  <div className="absolute -start-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background shadow-sm" />
                  <div className="rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/30">
                    {item.time && (
                      <p className="mb-1.5 font-mono text-xs font-bold text-primary">{item.time}</p>
                    )}
                    <p className="font-semibold text-sm">{isAr && item.title_ar ? item.title_ar : item.title}</p>
                    {(item.description || item.description_ar) && (
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {isAr && item.description_ar ? item.description_ar : item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
