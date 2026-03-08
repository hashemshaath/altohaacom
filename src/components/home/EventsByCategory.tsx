import { useState, memo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Globe, Coffee, Calendar, MapPin, Users, Flame, Zap } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { StaggeredList } from "@/components/ui/staggered-list";
import { CountdownBadge } from "@/components/ui/countdown-badge";
import { ShareButton } from "@/components/ui/share-button";
import { SectionHeader } from "./SectionHeader";
import { FilterChip } from "./FilterChip";
import { localizeLocation } from "@/lib/localizeLocation";

export const EventsByCategory = memo(function EventsByCategory() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState<"competitions" | "exhibitions" | "chefs-table">("competitions");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data: competitions = [] } = useQuery({
    queryKey: ["home-competitions-cat"],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("id, title, title_ar, cover_image_url, status, competition_start, city, country, country_code, is_virtual")
        .in("status", ["registration_open", "upcoming", "in_progress"])
        .order("competition_start", { ascending: true })
        .limit(8);
      return data || [];
    },
  });

  const { data: exhibitions = [] } = useQuery({
    queryKey: ["home-exhibitions-cat"],
    queryFn: async () => {
      const { data } = await supabase
        .from("exhibitions")
        .select("id, title, title_ar, cover_image_url, status, start_date, city, country, slug, venue, venue_ar, organizer_name, organizer_name_ar, logo_url")
        .in("status", ["upcoming", "active"])
        .order("start_date", { ascending: true })
        .limit(6);
      return data || [];
    },
  });

  const { data: chefsTableSessions = [] } = useQuery({
    queryKey: ["home-chefs-table-cat"],
    queryFn: async () => {
      const { data } = await supabase
        .from("chefs_table_sessions")
        .select("id, title, title_ar, status, session_date, venue, product_category, product_name, is_published")
        .eq("is_published", true)
        .in("status", ["scheduled", "in_progress"])
        .order("session_date", { ascending: true })
        .limit(6);
      return data || [];
    },
  });

  const tabConfig = {
    competitions: { items: competitions, table: "competitions", icon: Trophy },
    exhibitions: { items: exhibitions, table: "exhibitions", icon: Globe },
    "chefs-table": { items: chefsTableSessions, table: "chefs_table_sessions", icon: Coffee },
  };

  const current = tabConfig[activeTab];
  const filtered = statusFilter
    ? current.items.filter((i: any) => i.status === statusFilter)
    : current.items;

  const statuses = [...new Set(current.items.map((i: any) => i.status))];

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; labelAr: string; cls: string; icon?: any }> = {
      registration_open: { label: "Open", labelAr: "مفتوح", cls: "bg-chart-2/90 text-chart-2-foreground", icon: Users },
      in_progress: { label: "Live", labelAr: "جارية", cls: "bg-destructive/90 text-destructive-foreground animate-pulse", icon: Flame },
      upcoming: { label: "Upcoming", labelAr: "قادمة", cls: "bg-secondary text-secondary-foreground" },
      active: { label: "Active", labelAr: "نشط", cls: "bg-chart-2/90 text-chart-2-foreground", icon: Zap },
      scheduled: { label: "Scheduled", labelAr: "مجدولة", cls: "bg-secondary text-secondary-foreground" },
    };
    const s = map[status] || map.upcoming;
    const Icon = s.icon;
    return (
      <Badge className={cn("text-[10px] shadow-sm gap-1", s.cls)}>
        {Icon && <Icon className="h-2.5 w-2.5" />}
        {isAr ? s.labelAr : s.label}
      </Badge>
    );
  };

  const statusLabels: Record<string, { en: string; ar: string }> = {
    registration_open: { en: "Open", ar: "مفتوح" },
    in_progress: { en: "Live", ar: "جارية" },
    upcoming: { en: "Upcoming", ar: "قادمة" },
    active: { en: "Active", ar: "نشط" },
    scheduled: { en: "Scheduled", ar: "مجدولة" },
  };

  const viewAllHrefs: Record<string, string> = {
    competitions: "/competitions",
    exhibitions: "/exhibitions",
    "chefs-table": "/chefs-table",
  };

  return (
    <section className="container py-8 md:py-12" aria-labelledby="events-cat-heading" dir={isAr ? "rtl" : "ltr"}>
      <SectionHeader
        icon={Trophy}
        badge={isAr ? "الفعاليات" : "Events"}
        title={isAr ? "استكشف عالم الفعاليات" : "Explore the World of Events"}
        subtitle={isAr ? "مسابقات ومعارض وجلسات تذوق تنتظرك من كل أنحاء العالم" : "Competitions, exhibitions & tastings await you from around the globe"}
        dataSource={current.table}
        itemCount={filtered.length}
        viewAllHref={viewAllHrefs[activeTab]}
        viewAllLabel={isAr ? "عرض الكل" : "View All"}
        isAr={isAr}
        filters={
          <>
            {/* Category tabs */}
            <FilterChip
              label={isAr ? "المسابقات" : "Competitions"}
              active={activeTab === "competitions"}
              count={competitions.length}
              onClick={() => { setActiveTab("competitions"); setStatusFilter(null); }}
              icon={<Trophy className="h-3 w-3" />}
            />
            <FilterChip
              label={isAr ? "المعارض" : "Exhibitions"}
              active={activeTab === "exhibitions"}
              count={exhibitions.length}
              onClick={() => { setActiveTab("exhibitions"); setStatusFilter(null); }}
              icon={<Globe className="h-3 w-3" />}
            />
            <FilterChip
              label={isAr ? "طاولة الشيف" : "Chef's Table"}
              active={activeTab === "chefs-table"}
              count={chefsTableSessions.length}
              onClick={() => { setActiveTab("chefs-table"); setStatusFilter(null); }}
              icon={<Coffee className="h-3 w-3" />}
            />
            {/* Status sub-filters */}
            {statuses.length > 1 && (
              <>
                <span className="h-4 w-px bg-border/60 mx-1" />
                <FilterChip
                  label={isAr ? "الكل" : "All"}
                  active={statusFilter === null}
                  onClick={() => setStatusFilter(null)}
                />
                {statuses.map(s => (
                  <FilterChip
                    key={s}
                    label={isAr ? statusLabels[s]?.ar || s : statusLabels[s]?.en || s}
                    active={statusFilter === s}
                    count={current.items.filter((i: any) => i.status === s).length}
                    onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                  />
                ))}
              </>
            )}
          </>
        }
      />

      {filtered.length > 0 ? (
        <>
          {activeTab === "competitions" && filtered.length >= 3 ? (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              {renderFeaturedCompetition(filtered[0], isAr, statusBadge)}
              {filtered.slice(1).map((item: any) => renderCompetitionCard(item, isAr, statusBadge))}
            </div>
          ) : activeTab === "exhibitions" ? (
            <StaggeredList className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" stagger={60}>
              {filtered.map((item: any) => renderExhibitionCard(item, isAr, statusBadge))}
            </StaggeredList>
          ) : activeTab === "chefs-table" ? (
            <StaggeredList className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" stagger={60}>
              {filtered.map((item: any) => renderChefsTableCard(item, isAr))}
            </StaggeredList>
          ) : (
            <StaggeredList className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" stagger={60}>
              {filtered.map((item: any) => renderCompetitionCard(item, isAr, statusBadge))}
            </StaggeredList>
          )}
        </>
      ) : (
        <div className="py-10 text-center text-muted-foreground">
          {isAr ? "لا توجد فعاليات حالياً — ترقبوا الجديد!" : "No events yet — stay tuned for exciting updates!"}
        </div>
      )}
    </section>
  );
}

function renderFeaturedCompetition(item: any, isAr: boolean, statusBadge: (s: string) => JSX.Element) {
  const title = isAr && item.title_ar ? item.title_ar : item.title;
  return (
    <Link key={item.id} to={`/competitions/${item.id}`} className="group block col-span-2 row-span-2">
      <Card interactive className="h-full overflow-hidden border-border/40">
        <div className="relative aspect-[16/10] sm:aspect-[16/9] overflow-hidden bg-muted">
          {item.cover_image_url ? (
            <img src={item.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Trophy className="h-12 w-12 text-primary/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
          <div className="absolute end-3 top-3 flex flex-col items-end gap-1.5">
            {statusBadge(item.status)}
            {item.competition_start && <CountdownBadge targetDate={new Date(item.competition_start)} isAr={isAr} />}
          </div>
          <ShareButton title={title} url={`/competitions/${item.id}`} isAr={isAr} className="absolute start-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5">
            <Badge variant="outline" className="mb-2 bg-background/60 backdrop-blur-sm text-[10px]">
              <Trophy className="me-1 h-2.5 w-2.5" />
              {isAr ? "مميز" : "Featured"}
            </Badge>
            <h3 className="line-clamp-2 text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
              {title}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {item.competition_start && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-primary/60" />
                  {format(new Date(item.competition_start), "d MMM yyyy", { locale: isAr ? ar : undefined })}
                </span>
              )}
              {item.is_virtual ? (
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3 text-primary/60" />
                  {isAr ? "افتراضي" : "Virtual"}
                </span>
              ) : item.city ? (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-primary/60" />
                   {localizeLocation({ city: item.city, country: item.country, countryCode: item.country_code }, isAr)}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function renderCompetitionCard(item: any, isAr: boolean, statusBadge: (s: string) => JSX.Element) {
  const title = isAr && item.title_ar ? item.title_ar : item.title;
  return (
    <Link key={item.id} to={`/competitions/${item.id}`} className="group block">
      <Card interactive className="h-full overflow-hidden border-border/40">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {item.cover_image_url ? (
            <img src={item.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Trophy className="h-8 w-8 text-primary/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute end-2 top-2 flex flex-col items-end gap-1">
            {statusBadge(item.status)}
            {item.competition_start && <CountdownBadge targetDate={new Date(item.competition_start)} isAr={isAr} />}
          </div>
          <ShareButton title={title} url={`/competitions/${item.id}`} isAr={isAr} className="absolute start-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <CardContent className="p-3">
          <h3 className="mb-1.5 line-clamp-2 text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug">{title}</h3>
          <div className="space-y-1 text-[11px] text-muted-foreground">
            {item.competition_start && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 shrink-0 text-primary/50" />
                <span>{format(new Date(item.competition_start), "d MMM yyyy", { locale: isAr ? ar : undefined })}</span>
              </div>
            )}
            {item.is_virtual ? (
              <div className="flex items-center gap-1.5">
                <Globe className="h-3 w-3 shrink-0 text-primary/50" />
                <span>{isAr ? "افتراضي" : "Virtual"}</span>
              </div>
            ) : item.city ? (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 shrink-0 text-primary/50" />
                <span className="truncate">{localizeLocation({ city: item.city, country: item.country, countryCode: item.country_code }, isAr)}</span>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function renderExhibitionCard(item: any, isAr: boolean, statusBadge: (s: string) => JSX.Element) {
  const title = isAr && item.title_ar ? item.title_ar : item.title;
  const venue = isAr && item.venue_ar ? item.venue_ar : item.venue;
  const organizerName = isAr && item.organizer_name_ar ? item.organizer_name_ar : item.organizer_name;
  return (
    <Link key={item.id} to={`/exhibitions/${item.slug || item.id}`} className="group block">
      <Card interactive className="h-full overflow-hidden border-border/40">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {item.cover_image_url ? (
            <img src={item.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Globe className="h-8 w-8 text-primary/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute end-2 top-2 flex flex-col items-end gap-1">
            {statusBadge(item.status)}
            {item.start_date && <CountdownBadge targetDate={new Date(item.start_date)} isAr={isAr} />}
          </div>
          <ShareButton title={title} url={`/exhibitions/${item.slug || item.id}`} isAr={isAr} className="absolute start-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <CardContent className="p-3">
          <h3 className="mb-1 line-clamp-2 text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug">{title}</h3>
          {organizerName && (
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {item.logo_url ? (
                <img src={item.logo_url} alt={organizerName} className="h-4 w-4 rounded object-contain shrink-0" />
              ) : (
                <Globe className="h-3 w-3 shrink-0 text-primary/50" />
              )}
              <span className="truncate">{organizerName}</span>
            </div>
          )}
          <div className="space-y-1 text-[11px] text-muted-foreground">
            {item.start_date && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 shrink-0 text-primary/50" />
                <span>{format(new Date(item.start_date), "d MMM yyyy", { locale: isAr ? ar : undefined })}</span>
              </div>
            )}
            {(venue || item.city) && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 shrink-0 text-primary/50" />
                <span className="truncate">{localizeLocation({ city: item.city, country: item.country, countryCode: item.country_code }, isAr)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function renderChefsTableCard(item: any, isAr: boolean) {
  const title = isAr && item.title_ar ? item.title_ar : item.title;
  return (
    <Link key={item.id} to={`/chefs-table/${item.id}`} className="group block">
      <Card interactive className="h-full border-border/40">
        <CardContent className="p-4">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/15">
            <Coffee className="h-5 w-5 text-primary" />
          </div>
          <h3 className="mb-1.5 line-clamp-2 text-sm font-bold text-foreground group-hover:text-primary transition-colors">{title}</h3>
          <div className="space-y-1.5 text-[11px] text-muted-foreground">
            {item.product_category && (
              <Badge variant="secondary" className="text-[10px]">{item.product_category}</Badge>
            )}
            {item.session_date && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 shrink-0 text-primary/50" />
                <span>{format(new Date(item.session_date), "d MMM yyyy", { locale: isAr ? ar : undefined })}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});
