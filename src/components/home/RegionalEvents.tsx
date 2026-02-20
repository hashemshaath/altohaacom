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
    // country tab
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
    { value: "country", icon: <Flag className="h-3.5 w-3.5" />, label: isAr ? "حسب الدولة" : "Country" },
    { value: "middle-east", icon: <span className="text-sm">🌍</span>, label: isAr ? "الشرق الأوسط" : "Middle East" },
    { value: "global", icon: <Globe className="h-3.5 w-3.5" />, label: isAr ? "عالمية" : "Global" },
  ];

  return (
    <section className="relative overflow-hidden py-10 md:py-16" aria-labelledby="regional-heading">
      {/* Section cover background */}
      <div className="absolute inset-0 bg-muted/30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--primary)/0.06),transparent_60%)]" />
      <div className="absolute top-0 start-0 end-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="container relative">
        <SectionReveal>
          <div className="mb-6 text-center">
            <h2 id="regional-heading" className={cn("text-xl font-bold sm:text-2xl md:text-3xl", !isAr && "font-serif")}>
              {isAr ? "فعاليات حسب المنطقة" : "Events by Region"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isAr ? "اكتشف الأحداث القريبة منك والفعاليات العالمية المميزة" : "Discover events near you and standout global gatherings"}
            </p>
          </div>
        </SectionReveal>

        {/* Filter tabs in a single scrollable row */}
        <div className="mb-4 flex items-center justify-center">
          <div className="flex gap-1.5 rounded-lg bg-muted/60 p-1 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setActiveTab(tab.value); if (tab.value !== "country") setSelectedCountry(null); }}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  activeTab === tab.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Country sub-filters */}
        {activeTab === "country" && availableCountries.length > 0 && (
          <div className="mb-4">
            <ScrollArea className="w-full" dir={isAr ? "rtl" : "ltr"}>
              <div className="flex gap-1.5 pb-2 px-1">
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
            {/* Scroll arrows - desktop only */}
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

        {/* View all button */}
        <div className="mt-5 text-center">
          <Button variant="outline" size="sm" asChild>
            <Link to="/competitions">
              {isAr ? "عرض جميع الفعاليات" : "View All Events"}
              <ArrowRight className="ms-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
