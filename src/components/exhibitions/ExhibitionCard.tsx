import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Globe, ExternalLink, Clock, ArrowRight, Building } from "lucide-react";
import { format, isPast, isFuture, isWithinInterval, differenceInDays } from "date-fns";
import { countryFlag } from "@/lib/countryFlag";
import type { Database } from "@/integrations/supabase/types";

type ExhibitionStatus = Database["public"]["Enums"]["exhibition_status"];
type ExhibitionType = Database["public"]["Enums"]["exhibition_type"];

export interface Exhibition {
  id: string;
  title: string;
  title_ar: string | null;
  slug: string;
  description: string | null;
  description_ar: string | null;
  type: ExhibitionType;
  status: ExhibitionStatus;
  start_date: string;
  end_date: string;
  registration_deadline: string | null;
  venue: string | null;
  venue_ar: string | null;
  city: string | null;
  country: string | null;
  is_virtual: boolean | null;
  cover_image_url: string | null;
  logo_url: string | null;
  organizer_name: string | null;
  organizer_name_ar: string | null;
  is_free: boolean | null;
  ticket_price: string | null;
  ticket_price_ar: string | null;
  max_attendees: number | null;
  is_featured: boolean | null;
  tags: string[] | null;
  target_audience: string[] | null;
  website_url: string | null;
  registration_url: string | null;
  view_count: number | null;
}

const statusConfig: Record<ExhibitionStatus, { label: string; labelAr: string; className: string }> = {
  draft: { label: "Draft", labelAr: "مسودة", className: "bg-muted text-muted-foreground" },
  upcoming: { label: "Upcoming", labelAr: "قادم", className: "bg-primary/15 text-primary border-primary/20" },
  active: { label: "Happening Now", labelAr: "يحدث الآن", className: "bg-chart-3/15 text-chart-3 border-chart-3/20" },
  completed: { label: "Completed", labelAr: "انتهى", className: "bg-chart-5/15 text-chart-5 border-chart-5/20" },
  cancelled: { label: "Cancelled", labelAr: "ملغى", className: "bg-destructive/15 text-destructive border-destructive/20" },
};

const typeLabels: Record<ExhibitionType, { en: string; ar: string }> = {
  exhibition: { en: "Exhibition", ar: "معرض" },
  conference: { en: "Conference", ar: "مؤتمر" },
  summit: { en: "Summit", ar: "قمة" },
  workshop: { en: "Workshop", ar: "ورشة عمل" },
  food_festival: { en: "Food Festival", ar: "مهرجان طعام" },
  trade_show: { en: "Trade Show", ar: "معرض تجاري" },
  competition_event: { en: "Competition Event", ar: "حدث تنافسي" },
};

interface ExhibitionCardProps {
  exhibition: Exhibition;
  language: string;
}

export function ExhibitionCard({ exhibition, language }: ExhibitionCardProps) {
  const isAr = language === "ar";
  const title = isAr && exhibition.title_ar ? exhibition.title_ar : exhibition.title;
  const description = isAr && exhibition.description_ar ? exhibition.description_ar : exhibition.description;
  const venue = isAr && exhibition.venue_ar ? exhibition.venue_ar : exhibition.venue;
  const organizer = isAr && exhibition.organizer_name_ar ? exhibition.organizer_name_ar : exhibition.organizer_name;
  const typeLabel = typeLabels[exhibition.type];

  const liveStatus = (() => {
    const now = new Date();
    const start = new Date(exhibition.start_date);
    const end = new Date(exhibition.end_date);
    if (isPast(end)) return statusConfig.completed;
    if (isWithinInterval(now, { start, end })) return statusConfig.active;
    if (isFuture(start)) return statusConfig.upcoming;
    return statusConfig[exhibition.status];
  })();

  const daysLeft = isFuture(new Date(exhibition.start_date))
    ? differenceInDays(new Date(exhibition.start_date), new Date())
    : null;

  return (
    <Link to={`/exhibitions/${exhibition.slug}`} className="group block">
      <Card className={`group flex h-full flex-col overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-primary/30 ${exhibition.is_featured ? "ring-1 ring-primary/20 shadow-md shadow-primary/5" : ""}`}>
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
          {exhibition.cover_image_url ? (
            <img
              src={exhibition.cover_image_url}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-5xl opacity-40 grayscale group-hover:grayscale-0 transition-all duration-500">🏛️</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-60 transition-opacity group-hover:opacity-80" />

          {/* Badges */}
          <div className="absolute start-3 top-3 flex flex-wrap gap-2 z-10">
            <Badge className={`${liveStatus.className} shadow-lg backdrop-blur-md`}>
              {isAr ? liveStatus.labelAr : liveStatus.label}
            </Badge>
            {exhibition.is_featured && (
              <Badge className="bg-primary text-primary-foreground shadow-lg shadow-primary/20">⭐ {isAr ? "مميز" : "Featured"}</Badge>
            )}
          </div>

          <div className="absolute end-3 top-3 flex flex-col gap-2 z-10">
            <Badge variant="secondary" className="text-[10px] shadow-lg backdrop-blur-md bg-background/80">
              {isAr ? typeLabel.ar : typeLabel.en}
            </Badge>
            {daysLeft !== null && daysLeft > 0 && daysLeft <= 30 && (
              <Badge variant="secondary" className="gap-1 text-[10px] shadow-lg backdrop-blur-md bg-background/80 text-chart-4 border-chart-4/20">
                <Clock className="h-2.5 w-2.5 animate-pulse" />
                {isAr ? `باقي ${daysLeft} يوم` : `${daysLeft}d left`}
              </Badge>
            )}
          </div>
          
          {/* Country Overlay */}
          {exhibition.country && (
            <div className="absolute bottom-3 start-3 z-10">
              <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-2 py-1 text-[10px] text-white backdrop-blur-md ring-1 ring-white/20">
                <span>{countryFlag(exhibition.country)}</span>
                <span className="font-medium">{exhibition.country}</span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="flex flex-1 flex-col p-5 relative">
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="line-clamp-2 text-base font-bold leading-tight group-hover:text-primary transition-colors duration-300">
                {title} <span className="text-primary/60 font-serif italic ms-1">{new Date(exhibition.start_date).getFullYear()}</span>
              </h3>
              {organizer && (
                <p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <Building className="h-3 w-3 text-primary/50" />
                  {isAr ? "تنظيم:" : "By:"} <span className="text-foreground/80">{organizer}</span>
                </p>
              )}
            </div>

            {description && (
              <p className="line-clamp-2 text-[13px] text-muted-foreground/90 leading-relaxed">
                {description}
              </p>
            )}

            <div className="space-y-2 pt-1 text-[12px] text-muted-foreground">
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/5">
                  <Calendar className="h-3 w-3 text-primary" />
                </div>
                <span className="font-medium">
                  {format(new Date(exhibition.start_date), "MMM d")} – {format(new Date(exhibition.end_date), "MMM d, yyyy")}
                </span>
              </div>

              {exhibition.is_virtual ? (
                <div className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-chart-1/5">
                    <Globe className="h-3 w-3 text-chart-1" />
                  </div>
                  <span className="text-chart-1 font-medium">{isAr ? "حدث افتراضي" : "Virtual Event"}</span>
                </div>
              ) : venue && (
                <div className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/5">
                    <MapPin className="h-3 w-3 text-primary" />
                  </div>
                  <span className="line-clamp-1 font-medium">
                    {venue}{exhibition.city && `, ${exhibition.city}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {exhibition.is_free ? (
              <Badge variant="outline" className="h-6 text-[10px] font-bold uppercase tracking-wider text-chart-3 border-chart-3/30 bg-chart-3/5">
                {isAr ? "دخول مجاني" : "Free Entry"}
              </Badge>
            ) : exhibition.ticket_price && (
              <Badge variant="outline" className="h-6 text-[10px] font-bold border-primary/20 bg-primary/5">
                {isAr && exhibition.ticket_price_ar ? exhibition.ticket_price_ar : exhibition.ticket_price}
              </Badge>
            )}
            {exhibition.tags && exhibition.tags.slice(0, 1).map((tag) => (
              <Badge key={tag} variant="secondary" className="h-6 text-[10px] bg-muted/60">#{tag}</Badge>
            ))}
          </div>
        </CardContent>

        {/* Action Area */}
        <div className="flex items-center justify-between border-t border-border/40 bg-muted/20 px-5 py-3 transition-colors group-hover:bg-muted/40">
          <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-primary">
            {isAr ? "عرض التفاصيل" : "View Details"}
            <ArrowRight className="ms-1 h-3 w-3 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </div>
          <div className="flex items-center gap-2">
            {exhibition.registration_url && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(exhibition.registration_url!, "_blank", "noopener,noreferrer");
                }}
                title={isAr ? "التسجيل" : "Register"}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}