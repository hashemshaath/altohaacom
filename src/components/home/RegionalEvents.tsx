import { useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Calendar, MapPin, Trophy, Globe, Flag } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SectionReveal } from "@/components/ui/section-reveal";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const MIDDLE_EAST = ["SA", "AE", "KW", "BH", "QA", "OM", "JO", "LB", "IQ", "EG", "TN", "MA", "DZ", "LY", "SY", "PS", "YE"];

const COUNTRY_LABELS: Record<string, { en: string; ar: string }> = {
  SA: { en: "Saudi Arabia", ar: "السعودية" },
  AE: { en: "UAE", ar: "الإمارات" },
  KW: { en: "Kuwait", ar: "الكويت" },
  BH: { en: "Bahrain", ar: "البحرين" },
  QA: { en: "Qatar", ar: "قطر" },
  OM: { en: "Oman", ar: "عُمان" },
  EG: { en: "Egypt", ar: "مصر" },
  JO: { en: "Jordan", ar: "الأردن" },
  LB: { en: "Lebanon", ar: "لبنان" },
  MA: { en: "Morocco", ar: "المغرب" },
  TR: { en: "Turkey", ar: "تركيا" },
  FR: { en: "France", ar: "فرنسا" },
  US: { en: "USA", ar: "أمريكا" },
  GB: { en: "UK", ar: "بريطانيا" },
  IQ: { en: "Iraq", ar: "العراق" },
};

type FilterTab = "country" | "middle-east" | "global";

export function RegionalEvents() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState<FilterTab>("middle-east");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
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

  // Derive available countries from data
  const availableCountries = useMemo(() => {
    const codes = new Set<string>();
    allComps.forEach((c: any) => {
      if (c.country_code) codes.add(c.country_code.toUpperCase());
    });
    return Array.from(codes).sort();
  }, [allComps]);

  const filteredComps = useMemo(() => {
    if (activeTab === "middle-east") {
      return allComps.filter((c: any) => c.country_code && MIDDLE_EAST.includes(c.country_code.toUpperCase()));
    }
    if (activeTab === "global") {
      return allComps.filter((c: any) => !c.country_code || !MIDDLE_EAST.includes(c.country_code.toUpperCase()));
    }
    // country tab — filter by selected country
    if (selectedCountry) {
      return allComps.filter((c: any) => c.country_code?.toUpperCase() === selectedCountry);
    }
    return allComps;
  }, [allComps, activeTab, selectedCountry]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 280;
    scrollRef.current.scrollBy({ left: direction === "right" ? amount : -amount, behavior: "smooth" });
  };

  const renderComp = (item: any) => {
    const title = isAr && item.title_ar ? item.title_ar : item.title;
    return (
      <Link key={item.id} to={`/competitions/${item.id}`} className="group block w-[200px] sm:w-[220px] flex-shrink-0 snap-start">
        <Card interactive className="h-full overflow-hidden border-border/50">
          <div className="relative aspect-[16/10] overflow-hidden bg-muted">
            {item.cover_image_url ? (
              <img src={item.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <Trophy className="h-8 w-8 text-primary/30" />
              </div>
            )}
            <Badge className="absolute end-2 top-2 text-[10px]">
              {item.status === "registration_open" ? (isAr ? "مفتوح" : "Open") : (isAr ? "قادمة" : "Upcoming")}
            </Badge>
          </div>
          <CardContent className="p-3">
            <h3 className="mb-1 line-clamp-2 text-sm font-semibold group-hover:text-primary transition-colors">{title}</h3>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              {item.competition_start && (
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(item.competition_start), "MMM d")}</span>
              )}
              {item.city && (
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.city}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  if (allComps.length === 0) return null;

  const tabs: { value: FilterTab; icon: React.ReactNode; label: string }[] = [
    { value: "country", icon: <Flag className="h-3.5 w-3.5" />, label: isAr ? "حسب الدولة" : "By Country" },
    { value: "middle-east", icon: <span className="text-sm">🌍</span>, label: isAr ? "الشرق الأوسط" : "Middle East" },
    { value: "global", icon: <Globe className="h-3.5 w-3.5" />, label: isAr ? "عالمية" : "Global" },
  ];

  return (
    <section className="relative overflow-hidden" aria-labelledby="regional-heading">
      {/* Cover image — 40% height, overlapping header content */}
      <div className="relative h-[200px] sm:h-[240px] md:h-[280px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-muted" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBvcGFjaXR5PSIuMDUiPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjIiIGZpbGw9ImN1cnJlbnRDb2xvciIvPjwvZz48L3N2Zz4=')] opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

        {/* Header content overlapping the cover */}
        <div className="container relative flex h-full flex-col items-center justify-end pb-0">
          <SectionReveal>
            <div className="text-center pb-4">
              <h2 id="regional-heading" className={cn("text-xl font-bold sm:text-2xl md:text-3xl text-foreground drop-shadow-sm", !isAr && "font-serif")}>
                {isAr ? "فعاليات حسب المنطقة" : "Events by Region"}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {isAr ? "اكتشف الأحداث القريبة منك والفعاليات العالمية المميزة" : "Discover events near you and standout global gatherings"}
              </p>
            </div>
          </SectionReveal>
        </div>
      </div>

      {/* Content area — overlaps the cover by pulling up */}
      <div className="relative -mt-10 z-10">
        <div className="container">
          {/* Filter tabs */}
          <div className="mb-4 flex items-center justify-center">
            <div className="flex gap-1.5 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 p-1 shadow-sm overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => { setActiveTab(tab.value); if (tab.value !== "country") setSelectedCountry(null); }}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    activeTab === tab.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Country sub-filters — shown when "By Country" is active */}
          {activeTab === "country" && availableCountries.length > 0 && (
            <div className="mb-4">
              <ScrollArea className="w-full" dir={isAr ? "rtl" : "ltr"}>
                <div className="flex gap-1.5 pb-2 px-1 justify-center flex-wrap">
                  <button
                    onClick={() => setSelectedCountry(null)}
                    className={cn(
                      "whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-medium transition-all",
                      !selectedCountry
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {isAr ? "الكل" : "All"}
                  </button>
                  {availableCountries.map((code) => {
                    const label = COUNTRY_LABELS[code];
                    return (
                      <button
                        key={code}
                        onClick={() => setSelectedCountry(code)}
                        className={cn(
                          "whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-medium transition-all",
                          selectedCountry === code
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        )}
                      >
                        {label ? (isAr ? label.ar : label.en) : code}
                      </button>
                    );
                  })}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}

          {/* Horizontally swipeable events row */}
          {filteredComps.length > 0 ? (
            <div className="relative group/scroll">
              <button
                onClick={() => scroll("left")}
                className="absolute -start-2 top-1/2 z-10 -translate-y-1/2 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-background/90 border border-border shadow-sm opacity-0 group-hover/scroll:opacity-100 transition-opacity"
                aria-label="Scroll left"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="absolute -end-2 top-1/2 z-10 -translate-y-1/2 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-background/90 border border-border shadow-sm opacity-0 group-hover/scroll:opacity-100 transition-opacity"
                aria-label="Scroll right"
              >
                <ArrowRight className="h-4 w-4" />
              </button>

              <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory no-scrollbar"
                style={{ scrollbarWidth: "none" }}
              >
                {filteredComps.map(renderComp)}
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              {isAr ? "لا توجد فعاليات حالياً — ترقبوا القادم!" : "No events currently — exciting ones are coming soon!"}
            </div>
          )}

          {/* View all */}
          <div className="mt-5 pb-10 text-center">
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
