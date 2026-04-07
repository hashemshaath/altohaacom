import { useState, useMemo, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Scale, Calendar, MapPin, Users, DollarSign, Globe, ArrowRight, X, Plus, Trophy, Building } from "lucide-react";
import { PageShell } from "@/components/PageShell";

type Exhibition = {
  id: string; title: string; title_ar: string | null; slug: string;
  start_date: string; end_date: string; city: string | null; country: string | null;
  cover_image_url: string | null; max_attendees: number | null;
  is_free: boolean | null; is_virtual: boolean | null; venue: string | null;
  venue_ar: string | null; edition_year: number | null; status: string | null;
  edition_stats: any; categories: any; targeted_sectors: any;
  includes_competitions: boolean | null; includes_seminars: boolean | null;
  includes_training: boolean | null; ticket_price: string | null;
};

const CompareExhibitions = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [selected, setSelected] = useState<string[]>([]);

  const { data: exhibitions = [] } = useQuery({
    queryKey: ["exhibitions-compare-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("exhibitions")
        .select("id, title, title_ar, slug, start_date, end_date, city, country, cover_image_url, max_attendees, is_free, is_virtual, venue, venue_ar, edition_year, status, edition_stats, categories, targeted_sectors, includes_competitions, includes_seminars, includes_training, ticket_price")
        .in("status", ["active", "upcoming"])
        .order("start_date", { ascending: true });
      return (data || []) as Exhibition[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const selectedExhibitions = useMemo(
    () => selected.map(id => exhibitions.find(e => e.id === id)).filter(Boolean) as Exhibition[],
    [selected, exhibitions]
  );

  const addExhibition = (id: string) => {
    if (selected.length < 3 && !selected.includes(id)) {
      setSelected([...selected, id]);
    }
  };

  const removeExhibition = (id: string) => setSelected(selected.filter(s => s !== id));

  const getTitle = (e: Exhibition) => {
    const base = isAr && e.title_ar ? e.title_ar : e.title;
    return e.edition_year && !base.includes(String(e.edition_year)) ? `${base} ${e.edition_year}` : base;
  };

  const rows: { label: string; labelAr: string; icon: any; render: (e: Exhibition) => React.ReactNode }[] = [
    {
      label: "Dates", labelAr: "التواريخ", icon: Calendar,
      render: (e) => `${format(new Date(e.start_date), "d MMM", { locale: isAr ? ar : undefined })} – ${format(new Date(e.end_date), "d MMM yyyy", { locale: isAr ? ar : undefined })}`,
    },
    {
      label: "Location", labelAr: "الموقع", icon: MapPin,
      render: (e) => e.is_virtual ? (isAr ? "افتراضي" : "Virtual") : [e.city, e.country].filter(Boolean).join(", ") || "—",
    },
    {
      label: "Venue", labelAr: "المكان", icon: Building,
      render: (e) => (isAr && e.venue_ar ? e.venue_ar : e.venue) || "—",
    },
    {
      label: "Capacity", labelAr: "السعة", icon: Users,
      render: (e) => e.max_attendees ? e.max_attendees.toLocaleString() : "—",
    },
    {
      label: "Entry", labelAr: "الدخول", icon: DollarSign,
      render: (e) => e.is_free ? (isAr ? "مجاني" : "Free") : (e.ticket_price || (isAr ? "مدفوع" : "Paid")),
    },
    {
      label: "Area", labelAr: "المساحة", icon: Globe,
      render: (e) => e.edition_stats?.area_sqm ? `${(e.edition_stats.area_sqm as number).toLocaleString()} sqm` : "—",
    },
    {
      label: "Competitions", labelAr: "مسابقات", icon: Trophy,
      render: (e) => (
        <Badge variant={e.includes_competitions ? "default" : "secondary"} className="text-[10px]">
          {e.includes_competitions ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No")}
        </Badge>
      ),
    },
    {
      label: "Seminars", labelAr: "ندوات", icon: Users,
      render: (e) => (
        <Badge variant={e.includes_seminars ? "default" : "secondary"} className="text-[10px]">
          {e.includes_seminars ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No")}
        </Badge>
      ),
    },
  ];

  return (
    <PageShell title={isAr ? "مقارنة المعارض" : "Compare Exhibitions"}>
      <SEOHead
        title={isAr ? "مقارنة المعارض — الطهاة" : "Compare Exhibitions — Altoha"}
        description={isAr ? "قارن بين المعارض جنبًا إلى جنب" : "Compare exhibitions side by side"}
      />
      <div className="container py-6 md:py-10" dir={isAr ? "rtl" : "ltr"}>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Scale className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold md:text-3xl">{isAr ? "مقارنة المعارض" : "Compare Exhibitions"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAr ? "اختر حتى 3 معارض لمقارنتها" : "Select up to 3 exhibitions to compare"}
          </p>
        </div>

        {/* Selectors */}
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((slot) => (
            <div key={slot}>
              {selected[slot] ? (
                <Card className="relative overflow-hidden border-primary/20">
                  {selectedExhibitions[slot]?.cover_image_url && (
                    <img src={selectedExhibitions[slot]!.cover_image_url!} alt="" loading="lazy" className="h-24 w-full object-cover" />
                  )}
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold line-clamp-2">{getTitle(selectedExhibitions[slot]!)}</p>
                      <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => removeExhibition(selected[slot])}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Select onValueChange={addExhibition}>
                  <SelectTrigger className="h-24 rounded-xl border-dashed">
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Plus className="h-5 w-5" />
                      <span className="text-xs">{isAr ? "اختر معرضًا" : "Select Exhibition"}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {exhibitions.filter(e => !selected.includes(e.id)).map(e => (
                      <SelectItem key={e.id} value={e.id}>{getTitle(e)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        {selectedExhibitions.length >= 2 && (
          <Card className="overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="p-3 text-start font-semibold text-muted-foreground w-36">{isAr ? "المعيار" : "Criteria"}</th>
                    {selectedExhibitions.map(e => (
                      <th key={e.id} className="p-3 text-center font-bold min-w-[180px]">
                        <Link to={`/exhibitions/${e.slug}`} className="hover:text-primary transition-colors">
                          {getTitle(e)}
                          <ArrowRight className="inline h-3 w-3 ms-1" />
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-border/30 even:bg-muted/10">
                      <td className="p-3 font-medium text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <row.icon className="h-3.5 w-3.5" />
                          {isAr ? row.labelAr : row.label}
                        </span>
                      </td>
                      {selectedExhibitions.map(e => (
                        <td key={e.id} className="p-3 text-center">{row.render(e)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {selectedExhibitions.length < 2 && (
          <p className="text-center text-sm text-muted-foreground mt-8">
            {isAr ? "اختر معرضين على الأقل للمقارنة" : "Select at least 2 exhibitions to compare"}
          </p>
        )}
      </div>
    </PageShell>
  );
};

export default CompareExhibitions;
