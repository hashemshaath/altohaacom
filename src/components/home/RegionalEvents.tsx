import { useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Calendar, MapPin, Trophy, Globe, Flame, Users } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { SectionReveal } from "@/components/ui/section-reveal";
import regionalCover from "@/assets/regional-events-cover.jpg";

const MIDDLE_EAST = ["SA", "AE", "KW", "BH", "QA", "OM", "JO", "LB", "IQ", "EG", "TN", "MA", "DZ", "LY", "SY", "PS", "YE"];

type FilterTab = "saudi" | "middle-east" | "global";

const TABS: { value: FilterTab; label: string; labelAr: string; icon: React.ReactNode }[] = [
  { value: "saudi", icon: <span className="text-sm">🇸🇦</span>, label: "Saudi Arabia", labelAr: "السعودية" },
  { value: "middle-east", icon: <span className="text-sm">🌍</span>, label: "Middle East", labelAr: "الشرق الأوسط" },
  { value: "global", icon: <Globe className="h-3.5 w-3.5" />, label: "Global", labelAr: "عالمية" },
];

export function RegionalEvents() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState<FilterTab>("middle-east");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: allComps = [] } = useQuery({
    queryKey: ["home-regional-comps"],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("id, title, title_ar, cover_image_url, status, competition_start, city, country, country_code, is_virtual")
        .in("status", ["registration_open", "upcoming", "in_progress"])
        .order("competition_start", { ascending: true })
        .limit(20);
      return data || [];
    },
  });

  const filteredComps = useMemo(() => {
    switch (activeTab) {
      case "saudi": return allComps.filter((c: any) => c.country_code?.toUpperCase() === "SA");
      case "middle-east": return allComps.filter((c: any) => c.country_code && MIDDLE_EAST.includes(c.country_code.toUpperCase()));
      case "global": return allComps.filter((c: any) => !c.country_code || !MIDDLE_EAST.includes(c.country_code.toUpperCase()));
      default: return allComps;
    }
  }, [allComps, activeTab]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "right" ? 280 : -280, behavior: "smooth" });
  };

  if (allComps.length === 0) return null;

  return (
    <section className="relative overflow-hidden" aria-labelledby="regional-heading" dir={isAr ? "rtl" : "ltr"}>
      <div className="relative h-[160px] sm:h-[200px] md:h-[220px] overflow-hidden">
        <img src={regionalCover} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/50 to-background" />
      </div>

      <div className="relative -mt-4 z-10">
        <div className="container">
          <SectionReveal>
            <div className="text-center mb-3">
              <h2 id="regional-heading" className={cn("text-lg font-bold sm:text-xl md:text-2xl text-foreground", !isAr && "font-serif")}>
                {isAr ? "فعاليات حسب المنطقة" : "Events by Region"}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {isAr ? "اكتشف الأحداث القريبة منك والفعاليات العالمية المميزة" : "Discover events near you and standout global gatherings"}
              </p>
            </div>
          </SectionReveal>

          <div className="mb-3 flex items-center justify-center">
            <div className="flex gap-1.5 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 p-1 shadow-sm">
              {TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    activeTab === tab.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  {tab.icon}
                  {isAr ? tab.labelAr : tab.label}
                  {filteredComps.length > 0 && activeTab === tab.value && (
                    <span className="ms-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary-foreground/20 px-1 text-[9px] font-bold tabular-nums">
                      {filteredComps.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {filteredComps.length > 0 ? (
            <div className="relative group/scroll">
              <button onClick={() => scroll("left")} className="absolute -start-2 top-1/2 z-10 -translate-y-1/2 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-background/90 border border-border shadow-sm opacity-0 group-hover/scroll:opacity-100 transition-opacity" aria-label="Scroll left">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button onClick={() => scroll("right")} className="absolute -end-2 top-1/2 z-10 -translate-y-1/2 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-background/90 border border-border shadow-sm opacity-0 group-hover/scroll:opacity-100 transition-opacity" aria-label="Scroll right">
                <ArrowRight className="h-4 w-4" />
              </button>

              <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar" style={{ scrollbarWidth: "none" }} dir={isAr ? "rtl" : "ltr"}>
                {filteredComps.map((item: any) => (
                  <EventCard key={item.id} item={item} isAr={isAr} />
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {isAr ? "لا توجد فعاليات حالياً — ترقبوا القادم!" : "No events currently — exciting ones are coming soon!"}
            </div>
          )}

          <div className="mt-3 pb-6 text-center">
            <Button variant="outline" size="sm" asChild>
              <Link to="/competitions">
                {isAr ? "عرض جميع الفعاليات" : "View All Events"}
                <ArrowRight className="ms-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function EventCard({ item, isAr }: { item: any; isAr: boolean }) {
  const title = isAr && item.title_ar ? item.title_ar : item.title;

  const statusMap: Record<string, { label: string; labelAr: string; icon?: any; cls: string }> = {
    registration_open: { label: "Open", labelAr: "مفتوح", icon: Users, cls: "bg-chart-2/90 text-chart-2-foreground" },
    in_progress: { label: "Live", labelAr: "جارية", icon: Flame, cls: "bg-destructive/90 text-destructive-foreground animate-pulse" },
    upcoming: { label: "Upcoming", labelAr: "قادمة", cls: "bg-secondary text-secondary-foreground" },
  };
  const s = statusMap[item.status] || statusMap.upcoming;
  const StatusIcon = s.icon;

  return (
    <Link to={`/competitions/${item.id}`} className="group block w-[200px] sm:w-[220px] flex-shrink-0 snap-start">
      <Card interactive className="h-full overflow-hidden border-border/50">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {item.cover_image_url ? (
            <img src={item.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Trophy className="h-8 w-8 text-primary/30" />
            </div>
          )}
          <Badge className={cn("absolute end-2 top-2 text-[10px] gap-1 shadow-sm", s.cls)}>
            {StatusIcon && <StatusIcon className="h-2.5 w-2.5" />}
            {isAr ? s.labelAr : s.label}
          </Badge>
        </div>
        <CardContent className="p-3">
          <h3 className="mb-1 line-clamp-2 text-sm font-semibold group-hover:text-primary transition-colors">{title}</h3>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            {item.competition_start && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(item.competition_start), "d MMM", { locale: isAr ? ar : undefined })}
              </span>
            )}
            {item.city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {item.city}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
