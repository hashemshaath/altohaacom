import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { RelatedPages } from "@/components/seo/RelatedPages";
import { useLanguage } from "@/i18n/LanguageContext";
import { useHomepageDataPrefetch } from "@/hooks/useHomepageDataPrefetch";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/config/routes";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { localizeLocation } from "@/lib/localizeLocation";
import { getDisplayName } from "@/lib/getDisplayName";
import { countryFlag } from "@/lib/countryFlag";
import { useAllCountries } from "@/hooks/useCountries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy, Building2, GraduationCap, Users, Star, Briefcase,
  Calendar, MapPin, ChefHat, Sparkles, ArrowLeft, Globe, Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ═══════════════ SECTION SKELETONS ═══════════════ */

function CardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl bg-[var(--bg-white)] overflow-hidden animate-pulse" style={{ boxShadow: "var(--shadow-card)" }}>
          <Skeleton className="h-[180px] w-full rounded-none" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-5 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChefsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-[var(--bg-white)] p-5 text-center animate-pulse" style={{ boxShadow: "var(--shadow-card)" }}>
          <Skeleton className="h-[72px] w-[72px] rounded-full mx-auto" />
          <Skeleton className="h-4 w-20 rounded mx-auto mt-3" />
          <Skeleton className="h-3 w-16 rounded mx-auto mt-1" />
        </div>
      ))}
    </div>
  );
}

/* ═══════════════ SECTION 1: HERO ═══════════════ */

function HeroSectionNew({ isAr }: { isAr: boolean }) {
  const { data: stats } = useQuery({
    queryKey: ["home-stats"],
    queryFn: async () => {
      const results = await Promise.allSettled([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("competitions").select("id", { count: "exact", head: true }),
        supabase.from("exhibitions").select("id", { count: "exact", head: true }),
      ]);
      const gc = (r: PromiseSettledResult<any>) => r.status === "fulfilled" ? (r.value.count ?? 0) : 0;
      return { members: gc(results[0]), competitions: gc(results[1]), exhibitions: gc(results[2]) };
    },
    staleTime: 1000 * 60 * 10,
  });

  return (
    <section className="bg-[var(--bg-white)]" dir={isAr ? "rtl" : "ltr"}>
      <div className="section-container">
        <div className="py-[60px] md:py-[100px] flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-16">
          {/* Text column */}
          <div className="flex-1 space-y-6 text-center lg:text-start">
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-light)] text-[var(--primary)] px-4 py-2 text-[13px] font-semibold">
              <Sparkles className="h-4 w-4" />
              {isAr ? "مجتمع الطهاة العالمي #1" : "#1 Global Chef Community"}
            </span>
            <h1 className="text-hero">
              {isAr ? "اكتشف عالم الطهاة المحترفين" : "Discover the World of Professional Chefs"}
            </h1>
            <p className="text-[18px] leading-[1.7] text-[var(--text-muted)] max-w-[560px] mx-auto lg:mx-0">
              {isAr
                ? "انضم لأكبر مجتمع طهاة في الشرق الأوسط — مسابقات، معارض، أكاديميات، وشبكة احترافية تربطك بأفضل الطهاة حول العالم"
                : "Join the largest chef community in the Middle East — competitions, exhibitions, academies, and a professional network connecting you with the best chefs worldwide"}
            </p>
            <div className="hero-buttons flex flex-wrap gap-3 justify-center lg:justify-start">
              <Link to="/register" className="btn-primary">{isAr ? "انضم الآن مجاناً" : "Join Now for Free"}</Link>
              <Link to="/competitions" className="btn-secondary">{isAr ? "استكشف المسابقات" : "Explore Competitions"}</Link>
            </div>
            <p className="text-[13px] text-[var(--text-muted)] flex flex-wrap gap-3 justify-center lg:justify-start">
              <span><span dir="ltr" className="font-bold">+{stats?.members?.toLocaleString() || "30,000"}</span> {isAr ? "طاهٍ" : "Chefs"}</span>
              <span className="text-[var(--border-color)]">·</span>
              <span><span dir="ltr" className="font-bold">+50</span> {isAr ? "دولة" : "Countries"}</span>
              <span className="text-[var(--border-color)]">·</span>
              <span><span dir="ltr" className="font-bold">+{stats?.competitions || "500"}</span> {isAr ? "مسابقة" : "Competitions"}</span>
            </p>
          </div>
          {/* Visual column */}
          <div className="flex-1 w-full max-w-md lg:max-w-none">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Trophy, value: `+${stats?.competitions || 500}`, label: isAr ? "مسابقة طهي" : "Competitions" },
                { icon: Globe, value: "+50", label: isAr ? "دولة" : "Countries" },
                { icon: Users, value: `+${stats?.members?.toLocaleString() || "30K"}`, label: isAr ? "طاهٍ" : "Chefs" },
                { icon: Building2, value: `+${stats?.exhibitions || 200}`, label: isAr ? "معرض" : "Exhibitions" },
              ].map((s, i) => (
                <div key={i} className="rounded-xl bg-[var(--bg-page)] p-5 text-center space-y-2 border border-[var(--border-color)]">
                  <s.icon className="h-6 w-6 text-[var(--primary)] mx-auto" />
                  <p className="text-2xl font-extrabold text-[var(--primary)]" dir="ltr">{s.value}</p>
                  <p className="text-[13px] text-[var(--text-muted)]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ SECTION 2: PARTNERS MARQUEE ═══════════════ */

function PartnersBar({ isAr }: { isAr: boolean }) {
  const { data: logos = [] } = useQuery({
    queryKey: ["section-logos", "sponsors", 24],
    queryFn: async () => {
      const { data } = await supabase
        .from("partner_logos")
        .select("id, name, name_ar, logo_url, website_url, category, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order")
        .limit(24);
      return (data || []).map((p: any) => ({
        id: p.id,
        name: isAr ? p.name_ar || p.name : p.name,
        logo_url: p.logo_url,
        website_url: p.website_url,
      }));
    },
    staleTime: 1000 * 60 * 10,
  });

  const allLogos = useMemo(() => [...logos, ...logos, ...logos, ...logos], [logos]);

  if (logos.length === 0) return null;

  return (
    <section
      className="bg-[var(--bg-page)] border-t border-b border-[var(--border-color)]"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="py-10">
        <p className="text-center text-[14px] text-[var(--text-muted)] mb-6">
          {isAr ? "يثق بنا طهاة من أبرز المؤسسات والفنادق العالمية" : "Trusted by chefs from the world's leading institutions and hotels"}
        </p>
        <div className="relative w-full overflow-hidden group/marquee">
          <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-20 sm:w-32 bg-gradient-to-r from-[var(--bg-page)] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-20 sm:w-32 bg-gradient-to-l from-[var(--bg-page)] to-transparent" />
          <div
            className={cn(
              "flex items-center w-max group-hover/marquee:[animation-play-state:paused]",
              isAr ? "animate-marquee-rtl" : "animate-marquee"
            )}
            style={{ animationDuration: "60s", gap: "100px" }}
          >
            {allLogos.map((item: any, i: number) => (
              <div key={`${item.id}-${i}`} className="shrink-0 flex items-center justify-center" title={item.name}>
                <img
                  src={item.logo_url}
                  alt={item.name}
                  className="h-12 w-auto max-w-[120px] object-contain grayscale opacity-[0.55] transition-all duration-500 hover:grayscale-0 hover:opacity-100"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ SECTION 3: STATS BANNER ═══════════════ */

function StatsBanner({ isAr }: { isAr: boolean }) {
  const { data: stats } = useQuery({
    queryKey: ["home-stats"],
    queryFn: async () => {
      const results = await Promise.allSettled([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("competitions").select("id", { count: "exact", head: true }),
        supabase.from("exhibitions").select("id", { count: "exact", head: true }),
        supabase.from("organizers").select("id", { count: "exact", head: true }),
      ]);
      const gc = (r: PromiseSettledResult<any>) => r.status === "fulfilled" ? (r.value.count ?? 0) : 0;
      return { members: gc(results[0]), competitions: gc(results[1]), exhibitions: gc(results[2]), organizers: gc(results[3]) };
    },
    staleTime: 1000 * 60 * 10,
  });

  const items = [
    { value: `+${stats?.members?.toLocaleString() || "30,000"}`, label: isAr ? "طاهٍ مسجّل" : "Registered Chefs" },
    { value: `+${stats?.competitions || "500"}`, label: isAr ? "مسابقة طهي" : "Cooking Competitions" },
    { value: `+${stats?.exhibitions || "200"}`, label: isAr ? "معرض دولي" : "International Exhibitions" },
    { value: "+50", label: isAr ? "دولة مشاركة" : "Participating Countries" },
  ];

  return (
    <section className="bg-[var(--primary-light)]" dir={isAr ? "rtl" : "ltr"}>
      <div className="section-container py-[60px]">
        <div className="stats-grid grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {items.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-[48px] font-extrabold text-[var(--primary)] leading-none" dir="ltr">{s.value}</p>
              <p className="text-[15px] text-[var(--text-muted)] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ SECTION 4: FEATURES ═══════════════ */

function FeaturesSection({ isAr }: { isAr: boolean }) {
  const features = [
    { icon: Trophy, title: isAr ? "مسابقات الطهي" : "Cooking Competitions", desc: isAr ? "شارك في أبرز المسابقات الطهية محلياً ودولياً" : "Participate in top local and international culinary competitions", link: "/competitions" },
    { icon: Building2, title: isAr ? "المعارض الدولية" : "International Exhibitions", desc: isAr ? "اكتشف معارض الطعام والمشروبات حول العالم" : "Discover food & beverage exhibitions worldwide", link: "/exhibitions" },
    { icon: GraduationCap, title: isAr ? "الأكاديميات والتعليم" : "Academies & Education", desc: isAr ? "تطور مهاراتك مع أفضل أكاديميات الطهي" : "Develop your skills with the best culinary academies", link: "/academies" },
    { icon: Users, title: isAr ? "شبكة الطهاة" : "Chef Network", desc: isAr ? "تواصل مع آلاف الطهاة المحترفين" : "Connect with thousands of professional chefs", link: "/community" },
    { icon: Star, title: isAr ? "التقييمات والجوائز" : "Ratings & Awards", desc: isAr ? "سجّل إنجازاتك وابنِ سمعتك المهنية" : "Record your achievements and build your reputation", link: "/leaderboard" },
    { icon: Briefcase, title: isAr ? "فرص العمل" : "Job Opportunities", desc: isAr ? "ابحث عن الفرصة المناسبة لمستواك" : "Find the right opportunity for your skill level", link: "/jobs" },
  ];

  return (
    <section className="bg-[var(--bg-white)]" dir={isAr ? "rtl" : "ltr"}>
      <div className="section-container section-padding">
        <div className="text-center mb-12">
          <p className="text-[14px] font-semibold text-[var(--primary)] mb-2">{isAr ? "ما يميز الطهاة" : "What Sets Us Apart"}</p>
          <h2 className="text-section-title">{isAr ? "كل ما يحتاجه الطاهي المحترف في مكان واحد" : "Everything a Professional Chef Needs in One Place"}</h2>
          <p className="text-[var(--text-muted)] mt-3 max-w-[600px] mx-auto text-[15px]">
            {isAr ? "منصة شاملة لكل ما يحتاجه الطاهي المحترف" : "A comprehensive platform for everything a professional chef needs"}
          </p>
        </div>
        <div className="features-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-[var(--bg-page)] rounded-xl p-7 transition-all duration-250 hover:shadow-[var(--shadow-hover)] hover:-translate-y-0.5 group">
              <div className="h-12 w-12 rounded-full bg-[var(--primary-light)] flex items-center justify-center mb-4">
                <f.icon className="h-6 w-6 text-[var(--primary)]" />
              </div>
              <h3 className="text-card-title mb-2">{f.title}</h3>
              <p className="text-[14px] text-[var(--text-muted)] leading-[1.7] mb-3">{f.desc}</p>
              <Link to={f.link} className="text-[13px] font-semibold text-[var(--primary)] inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                {isAr ? "اعرف المزيد" : "Learn more"} <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ SECTION 5: COMPETITIONS ═══════════════ */

const STATUS_COLORS: Record<string, { label_ar: string; label_en: string; cls: string }> = {
  registration_open: { label_ar: "مفتوح", label_en: "Open", cls: "bg-emerald-500 text-white" },
  upcoming: { label_ar: "قريباً", label_en: "Upcoming", cls: "bg-amber-500 text-white" },
  in_progress: { label_ar: "مباشر", label_en: "Live", cls: "bg-red-500 text-white" },
  completed: { label_ar: "منتهي", label_en: "Completed", cls: "bg-gray-400 text-white" },
};

function CompetitionsShowcase({ isAr }: { isAr: boolean }) {
  const { data: competitions = [], isLoading } = useQuery({
    queryKey: ["home-competitions-minimal", 6],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("id, title, title_ar, cover_image_url, status, competition_start, city, country, country_code, is_virtual")
        .in("status", ["registration_open", "upcoming", "in_progress"])
        .order("competition_start", { ascending: true })
        .limit(6);
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const visibleComps = competitions.slice(0, 3);

  return (
    <section className="bg-[var(--bg-page)]" dir={isAr ? "rtl" : "ltr"}>
      <div className="section-container section-padding">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-section-title">{isAr ? "أبرز المسابقات الطهية" : "Featured Culinary Competitions"}</h2>
          <Link to="/competitions" className="text-[var(--primary)] text-[14px] font-semibold hidden sm:flex items-center gap-1">
            {isAr ? "عرض الكل" : "View All"} <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
        {isLoading ? <CardsSkeleton /> : (
          <div className="cards-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleComps.map((comp: any) => {
              const st = STATUS_COLORS[comp.status] || STATUS_COLORS.upcoming;
              return (
                <Link key={comp.id} to={ROUTES.competition(comp.id)} className="group block">
                  <div className="bg-[var(--bg-white)] rounded-xl overflow-hidden transition-all duration-250 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]" style={{ boxShadow: "var(--shadow-card)" }}>
                    <div className="relative h-[180px] overflow-hidden">
                      {comp.cover_image_url ? (
                        <img src={comp.cover_image_url} alt={comp.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" decoding="async" width={400} height={180} />
                      ) : (
                        <div className="h-full w-full bg-[var(--bg-page)] flex items-center justify-center"><Trophy className="h-10 w-10 text-[var(--text-muted)] opacity-30" /></div>
                      )}
                      <span className={cn("absolute top-3 end-3 px-2.5 py-1 rounded-md text-[11px] font-bold", st.cls)}>
                        {isAr ? st.label_ar : st.label_en}
                      </span>
                    </div>
                    <div className="p-4">
                      <span className="inline-block bg-[var(--primary-light)] text-[var(--primary)] text-[11px] font-semibold px-2.5 py-0.5 rounded-full mb-2">
                        {isAr ? "مسابقة" : "Competition"}
                      </span>
                      <h3 className="text-card-title line-clamp-2 mb-2 group-hover:text-[var(--primary)] transition-colors">
                        {isAr ? comp.title_ar || comp.title : comp.title}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-[13px] text-[var(--text-muted)]">
                        {comp.competition_start && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(comp.competition_start), "d MMM yyyy", { locale: isAr ? ar : undefined })}
                          </span>
                        )}
                        {(comp.city || comp.country) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {localizeLocation({ city: comp.city, country: comp.country }, isAr)}
                          </span>
                        )}
                      </div>
                      <div className="mt-4">
                        <span className="btn-primary w-full justify-center text-[14px] py-2.5">{isAr ? "تفاصيل المسابقة" : "Competition Details"}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        <Link to="/competitions" className="btn-secondary mt-6 w-full justify-center sm:hidden">{isAr ? "عرض جميع المسابقات" : "View All Competitions"}</Link>
      </div>
    </section>
  );
}

/* ═══════════════ SECTION 6: EXHIBITIONS ═══════════════ */

function ExhibitionsShowcase({ isAr }: { isAr: boolean }) {
  const { data: exhibitions = [], isLoading } = useQuery({
    queryKey: ["home-exhibitions-minimal"],
    queryFn: async () => {
      const { data } = await supabase
        .from("exhibitions")
        .select("id, title, title_ar, cover_image_url, status, start_date, city, country, slug, venue, venue_ar")
        .in("status", ["upcoming", "active", "completed"])
        .order("start_date", { ascending: true })
        .limit(20);
      const active = (data || []).filter((e: any) => e.status !== "completed");
      const completed = (data || []).filter((e: any) => e.status === "completed").reverse().slice(0, 4);
      return [...active, ...completed].slice(0, 6);
    },
    staleTime: 1000 * 60 * 5,
  });

  const visibleExhibitions = exhibitions.slice(0, 3);

  return (
    <section className="bg-[var(--bg-white)]" dir={isAr ? "rtl" : "ltr"}>
      <div className="section-container section-padding">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-section-title">{isAr ? "أبرز المعارض الدولية" : "Featured International Exhibitions"}</h2>
          <Link to="/exhibitions" className="text-[var(--primary)] text-[14px] font-semibold hidden sm:flex items-center gap-1">
            {isAr ? "عرض الكل" : "View All"} <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
        {isLoading ? <CardsSkeleton /> : (
          <div className="cards-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleExhibitions.map((exh: any) => {
              const st = STATUS_COLORS[exh.status] || STATUS_COLORS.upcoming;
              return (
                <Link key={exh.id} to={ROUTES.exhibition(exh.slug || exh.id)} className="group block">
                  <div className="bg-[var(--bg-white)] rounded-xl overflow-hidden transition-all duration-250 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)] border border-[var(--border-color)]" style={{ boxShadow: "var(--shadow-card)" }}>
                    <div className="relative h-[180px] overflow-hidden">
                      {exh.cover_image_url ? (
                        <img src={exh.cover_image_url} alt={exh.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" decoding="async" width={400} height={180} />
                      ) : (
                        <div className="h-full w-full bg-[var(--bg-page)] flex items-center justify-center"><Building2 className="h-10 w-10 text-[var(--text-muted)] opacity-30" /></div>
                      )}
                      <span className={cn("absolute top-3 end-3 px-2.5 py-1 rounded-md text-[11px] font-bold", st.cls)}>
                        {isAr ? st.label_ar : st.label_en}
                      </span>
                    </div>
                    <div className="p-4">
                      <span className="inline-block bg-[var(--primary-light)] text-[var(--primary)] text-[11px] font-semibold px-2.5 py-0.5 rounded-full mb-2">
                        {isAr ? "معرض" : "Exhibition"}
                      </span>
                      <h3 className="text-card-title line-clamp-2 mb-2 group-hover:text-[var(--primary)] transition-colors">
                        {isAr ? exh.title_ar || exh.title : exh.title}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-[13px] text-[var(--text-muted)]">
                        {exh.start_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(exh.start_date), "d MMM yyyy", { locale: isAr ? ar : undefined })}
                          </span>
                        )}
                        {(exh.city || exh.country) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {localizeLocation({ city: exh.city, country: exh.country }, isAr)}
                          </span>
                        )}
                      </div>
                      <div className="mt-4">
                        <span className="btn-primary w-full justify-center text-[14px] py-2.5">{isAr ? "تفاصيل المعرض" : "Exhibition Details"}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        <Link to="/exhibitions" className="btn-secondary mt-6 w-full justify-center sm:hidden">{isAr ? "عرض جميع المعارض" : "View All Exhibitions"}</Link>
      </div>
    </section>
  );
}

/* ═══════════════ SECTION 7: CHEFS LEADERBOARD ═══════════════ */

function ChefsLeaderboard({ isAr }: { isAr: boolean }) {
  const { data: allCountries = [] } = useAllCountries();
  const { data: chefs = [], isLoading } = useQuery({
    queryKey: ["featured-chefs-home", 8],
    queryFn: async () => {
      const { data: ranked } = await supabase
        .from("chef_rankings")
        .select("user_id, total_points, gold_medals, silver_medals, bronze_medals, rank")
        .eq("ranking_period", "all_time")
        .order("total_points", { ascending: false })
        .limit(6);
      if (ranked && ranked.length > 0) {
        const userIds = ranked.map((r: any) => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, full_name, full_name_ar, display_name, display_name_ar, avatar_url, country_code, specialization, specialization_ar, is_verified, nationality, show_nationality")
          .in("user_id", userIds);
        const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
        return ranked.map((r: any) => ({ ...r, ...(profileMap.get(r.user_id) || {}) }));
      }
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, full_name_ar, display_name, display_name_ar, avatar_url, country_code, specialization, specialization_ar, is_verified, loyalty_points, nationality, show_nationality, account_type")
        .in("account_type", ["professional"])
        .order("is_verified", { ascending: false })
        .order("loyalty_points", { ascending: false, nullsFirst: false })
        .limit(6);
      return (profiles || []).map((p: any) => ({ ...p, total_points: p.loyalty_points || 0, gold_medals: 0, silver_medals: 0, bronze_medals: 0 }));
    },
    staleTime: 1000 * 60 * 10,
  });

  const visibleChefs = chefs.slice(0, 6);

  return (
    <section className="bg-[var(--bg-page)]" dir={isAr ? "rtl" : "ltr"}>
      <div className="section-container section-padding">
        <div className="text-center mb-10">
          <h2 className="text-section-title">{isAr ? "نجوم مجتمع الطهاة" : "Community Stars"}</h2>
          <p className="text-[var(--text-muted)] mt-2 text-[15px]">
            {isAr ? "أكثر الطهاة تفاعلاً ومساهمةً في مجتمعنا هذا الشهر" : "Most active and contributing chefs in our community this month"}
          </p>
        </div>
        {isLoading ? <ChefsSkeleton /> : (
          <div className="chefs-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {visibleChefs.map((chef: any, idx: number) => {
              const name = getDisplayName(chef, isAr);
              const spec = isAr && chef.specialization_ar ? chef.specialization_ar : chef.specialization;
              const initials = name ? name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() : "?";
              return (
                <Link
                  key={chef.user_id || idx}
                  to={chef.username ? `/${chef.username}` : `/profile/${chef.user_id}`}
                  className="group block"
                >
                  <div className="relative bg-[var(--bg-white)] rounded-xl p-5 text-center transition-all duration-250 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]" style={{ boxShadow: "var(--shadow-card)" }}>
                    <div className="absolute top-2 end-2 h-6 w-6 rounded-full bg-[var(--primary)] text-white text-[11px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </div>
                    <Avatar className="h-[72px] w-[72px] mx-auto ring-[3px] ring-[var(--primary-light)]">
                      <AvatarImage src={chef.avatar_url} alt={name} loading="lazy" />
                      <AvatarFallback className="bg-[var(--primary-light)] text-[var(--primary)] font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    <h3 className="mt-3 text-[15px] font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors truncate">{name || (isAr ? "طاهٍ" : "Chef")}</h3>
                    {spec && <p className="mt-1 text-[13px] text-[var(--text-muted)] truncate">{spec}</p>}
                    {(chef.total_points > 0) && (
                      <span className="mt-2 inline-block bg-[var(--primary-light)] text-[var(--primary)] text-[12px] font-semibold px-3 py-1 rounded-full">
                        <span dir="ltr">{chef.total_points}</span> {isAr ? "نقطة" : "pts"}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

/* ═══════════════ SECTION 8: TESTIMONIALS ═══════════════ */

function TestimonialsSection({ isAr }: { isAr: boolean }) {
  const { data: testimonials = [] } = useQuery({
    queryKey: ["home-testimonials", 10],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("testimonials")
        .select("id, name, name_ar, role, role_ar, quote, quote_ar, avatar_url, rating, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(6);
      return (data as any[]) || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const mockTestimonials = [
    { id: "m1", name: "أحمد الشيخ", name_ar: "أحمد الشيخ", role: "Executive Chef", role_ar: "شيف تنفيذي", quote: "The platform transformed my career", quote_ar: "منصة الطهاة غيرت مسيرتي المهنية بالكامل — تعرفت على طهاة من 30 دولة وشاركت في مسابقات لم أكن أحلم بها", avatar_url: "", rating: 5 },
    { id: "m2", name: "سارة المنصور", name_ar: "سارة المنصور", role: "Pastry Chef", role_ar: "شيف حلويات", quote: "Best chef community worldwide", quote_ar: "أفضل مجتمع طهاة عربي — المحتوى التعليمي والمسابقات جعلتني أحترف الحلويات الفرنسية", avatar_url: "", rating: 5 },
    { id: "m3", name: "خالد العمري", name_ar: "خالد العمري", role: "Sous Chef", role_ar: "سو شيف", quote: "Connected me with global opportunities", quote_ar: "ربطتني المنصة بفرص عمل في أفضل الفنادق العالمية — أنصح كل طاهٍ طموح بالانضمام", avatar_url: "", rating: 5 },
  ];

  const displayTestimonials = testimonials.length > 0 ? testimonials.slice(0, 3) : mockTestimonials;

  return (
    <section className="bg-[var(--bg-white)]" dir={isAr ? "rtl" : "ltr"}>
      <div className="section-container section-padding">
        <h2 className="text-section-title text-center mb-10">{isAr ? "ماذا يقول مجتمع الطهاة" : "What Our Community Says"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayTestimonials.map((t: any) => (
            <div key={t.id} className="bg-[var(--bg-page)] rounded-xl p-6 flex flex-col">
              <Quote className="h-8 w-8 text-[var(--primary-light)] mb-3 shrink-0" />
              <p className="text-[15px] text-[var(--text-body)] leading-[1.7] italic flex-1">
                {isAr ? t.quote_ar || t.quote : t.quote}
              </p>
              <div className="h-px bg-[var(--border-color)] my-4" />
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={t.avatar_url} alt={isAr ? t.name_ar : t.name} />
                  <AvatarFallback className="bg-[var(--primary-light)] text-[var(--primary)] text-sm font-bold">
                    {(isAr ? t.name_ar : t.name)?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-[14px] font-bold text-[var(--text-primary)]">{isAr ? t.name_ar || t.name : t.name}</p>
                  <p className="text-[12px] text-[var(--text-muted)]">{isAr ? t.role_ar || t.role : t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ SECTION 9: CTA BANNER ═══════════════ */

function CTABanner({ isAr }: { isAr: boolean }) {
  return (
    <section className="bg-[var(--dark-navy)]" dir={isAr ? "rtl" : "ltr"}>
      <div className="section-container section-padding text-center">
        <span className="inline-block bg-[rgba(123,40,200,0.3)] text-[#C084FC] text-[13px] font-semibold px-4 py-1.5 rounded-full mb-5">
          {isAr ? "عضوية بريميوم" : "Premium Membership"}
        </span>
        <h2 className="text-section-title !text-white mb-4">{isAr ? "ارتقِ بمسيرتك المهنية مع عضوية الطهاة" : "Elevate Your Career with Chef Membership"}</h2>
        <p className="text-[#9CA3AF] max-w-[500px] mx-auto text-[15px] leading-[1.7] mb-8">
          {isAr
            ? "وصول حصري للمسابقات الكبرى، شبكة طهاة عالمية، وشارات احترافية معتمدة"
            : "Exclusive access to major competitions, a global chef network, and certified professional badges"}
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/membership" className="btn-primary">{isAr ? "استكشف العضوية" : "Explore Membership"}</Link>
          <Link to="/register" className="btn-secondary !border-white !text-white hover:!bg-white/10">{isAr ? "انضم مجاناً" : "Join for Free"}</Link>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ SECTION 10: BLOG / NEWS ═══════════════ */

function BlogSection({ isAr }: { isAr: boolean }) {
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["home-articles-minimal", 8],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title, title_ar, excerpt, excerpt_ar, featured_image_url, slug, published_at, type")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(6);
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const visibleArticles = articles.slice(0, 3);

  return (
    <section className="bg-[var(--bg-page)]" dir={isAr ? "rtl" : "ltr"}>
      <div className="section-container section-padding">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-section-title">{isAr ? "آخر أخبار عالم الطهي" : "Latest Culinary News"}</h2>
          <Link to="/articles" className="text-[var(--primary)] text-[14px] font-semibold hidden sm:flex items-center gap-1">
            {isAr ? "المزيد من المقالات" : "More Articles"} <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
        {isLoading ? <CardsSkeleton /> : (
          <div className="cards-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleArticles.map((article: any) => (
              <Link key={article.id} to={ROUTES.article(article.slug)} className="group block">
                <div className="bg-[var(--bg-white)] rounded-xl overflow-hidden transition-all duration-250 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]" style={{ boxShadow: "var(--shadow-card)" }}>
                  <div className="relative h-[160px] overflow-hidden">
                    {article.featured_image_url ? (
                      <img src={article.featured_image_url} alt={isAr ? article.title_ar || article.title : article.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" decoding="async" width={400} height={160} />
                    ) : (
                      <div className="h-full w-full bg-[var(--bg-page)] flex items-center justify-center"><ChefHat className="h-10 w-10 text-[var(--text-muted)] opacity-30" /></div>
                    )}
                  </div>
                  <div className="p-4">
                    {article.type && (
                      <span className="inline-block bg-[var(--primary-light)] text-[var(--primary)] text-[11px] font-semibold px-2.5 py-0.5 rounded-full mb-2">
                        {isAr
                          ? article.type === "news" ? "أخبار" : article.type === "article" ? "مقال" : "مدونة"
                          : article.type.charAt(0).toUpperCase() + article.type.slice(1)}
                      </span>
                    )}
                    <h3 className="text-card-title line-clamp-2 mb-2 group-hover:text-[var(--primary)] transition-colors">
                      {isAr ? article.title_ar || article.title : article.title}
                    </h3>
                    {article.published_at && (
                      <p className="text-[12px] text-[var(--text-muted)]">
                        {format(new Date(article.published_at), "d MMM yyyy", { locale: isAr ? ar : undefined })}
                      </p>
                    )}
                    <p className="mt-3 text-[13px] font-semibold text-[var(--primary)] inline-flex items-center gap-1">
                      {isAr ? "اقرأ المزيد" : "Read More"} <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ═══════════════ MAIN INDEX COMPONENT ═══════════════ */

const Index = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  useHomepageDataPrefetch();

  const seo = useMemo(() => {
    const title = isAr
      ? "الطهاة | مجتمع الطهاة العالمي — مسابقات ومعارض وأكاديميات الطهي"
      : "AlToha | Global Chef Community — Culinary Competitions, Exhibitions & Academies";
    const description = isAr
      ? "منصة الطهاة العالمية — اكتشف معارض الطعام والمشروبات، مسابقات الطهي، الجمعيات والأكاديميات الطهية حول العالم. انضم لمجتمع الطهاة المحترفين."
      : "Join the world's leading chef community. Discover global food & beverage exhibitions, cooking competitions, culinary academies, and chef associations. Connect with professional chefs worldwide.";
    const keywords = isAr
      ? "طهاة, مجتمع الطهي, معارض الطعام, مسابقات الطهي, أكاديميات الطهي, جمعيات الطهاة, فعاليات الطهي, الطاهي المحترف, طبخ, فنون الطهي"
      : "chefs, culinary community, food exhibitions, cooking competitions, culinary academies, chef associations, culinary events, professional chef, gastronomy";
    return { title, description, keywords };
  }, [isAr]);

  return (
    <div className="flex min-h-screen flex-col">
      <OfflineIndicator />
      <SEOHead
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        ogImage="https://altoha.com/og-image.png"
        canonical="https://altoha.com/"
        lang={language}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "AlToha",
            alternateName: "الطهاة",
            url: "https://altoha.com",
            logo: { "@type": "ImageObject", url: "https://altoha.com/og-image.png", width: 1200, height: 630 },
            description: seo.description,
            contactPoint: { "@type": "ContactPoint", contactType: "customer support", url: "https://altoha.com/contact", availableLanguage: ["English", "Arabic"] },
            sameAs: ["https://www.instagram.com/altohaglobal", "https://www.facebook.com/altohaglobal", "https://x.com/altohaglobal", "https://www.linkedin.com/company/altoha", "https://www.youtube.com/@altohaglobal", "https://www.tiktok.com/@altohaglobal"],
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: isAr ? "الطهاة" : "AlToha",
            alternateName: isAr ? "AlToha" : "الطهاة",
            url: "https://altoha.com",
            inLanguage: ["en", "ar"],
            description: seo.description,
            potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: "https://altoha.com/search?q={search_term_string}" }, "query-input": "required name=search_term_string" },
          },
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: isAr ? "الصفحة الرئيسية — الطهاة" : "Homepage — AlToha",
            description: seo.description,
            url: "https://altoha.com/",
            isPartOf: { "@type": "WebSite", url: "https://altoha.com" },
            breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: isAr ? "الرئيسية" : "Home", item: "https://altoha.com/" }] },
          },
        ]}
      />

      <Header />

      <main className="flex-1" role="main" aria-label={isAr ? "المحتوى الرئيسي" : "Homepage content"}>
        <ErrorBoundary fallback={<div className="section-container py-20 text-center text-[var(--text-muted)]">{isAr ? "حدث خطأ في تحميل الصفحة" : "Error loading page"}</div>}>
          <HeroSectionNew isAr={isAr} />
          <PartnersBar isAr={isAr} />
          <StatsBanner isAr={isAr} />
          <FeaturesSection isAr={isAr} />
          <CompetitionsShowcase isAr={isAr} />
          <ExhibitionsShowcase isAr={isAr} />
          <ChefsLeaderboard isAr={isAr} />
          <TestimonialsSection isAr={isAr} />
          <CTABanner isAr={isAr} />
          <BlogSection isAr={isAr} />
        </ErrorBoundary>

        <nav className="section-container pb-12 pt-4" aria-label={isAr ? "صفحات ذات صلة" : "Related pages"}>
          <RelatedPages currentPath="/" />
        </nav>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
