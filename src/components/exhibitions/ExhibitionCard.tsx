import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Globe, ExternalLink, Clock, ArrowRight } from "lucide-react";
import { format, isPast, isFuture, isWithinInterval, differenceInDays } from "date-fns";
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
      <Card className={`flex h-full flex-col overflow-hidden border-border/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 ${exhibition.is_featured ? "ring-1 ring-primary/10" : ""}`}>
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
          {exhibition.cover_image_url ? (
            <img
              src={exhibition.cover_image_url}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-5xl opacity-40">🏛️</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />

          {/* Badges */}
          <div className="absolute start-2.5 top-2.5 flex flex-wrap gap-1.5">
            <Badge className={`${liveStatus.className} shadow-sm`}>
              {isAr ? liveStatus.labelAr : liveStatus.label}
            </Badge>
            {exhibition.is_featured && (
              <Badge className="bg-primary/90 text-primary-foreground shadow-sm">⭐ {isAr ? "مميز" : "Featured"}</Badge>
            )}
          </div>

          <div className="absolute end-2.5 top-2.5 flex flex-col gap-1.5">
            <Badge variant="secondary" className="text-[10px] shadow-sm">
              {isAr ? typeLabel.ar : typeLabel.en}
            </Badge>
            {daysLeft !== null && daysLeft > 0 && daysLeft <= 30 && (
              <Badge variant="secondary" className="gap-1 text-[10px] shadow-sm">
                <Clock className="h-2.5 w-2.5" />
                {isAr ? `${daysLeft} يوم` : `${daysLeft}d`}
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <CardContent className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug group-hover:text-primary transition-colors">{title}</h3>
          {organizer && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{isAr ? "المنظم:" : "By:"} {organizer}</p>
          )}

          {description && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
          )}

          <div className="mt-auto space-y-1.5 pt-3 text-[13px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-primary/60" />
              <span>
                {format(new Date(exhibition.start_date), "MMM d, yyyy")}
                {" – "}
                {format(new Date(exhibition.end_date), "MMM d, yyyy")}
              </span>
            </div>

            {exhibition.is_virtual ? (
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                <span>{isAr ? "حدث افتراضي" : "Virtual Event"}</span>
              </div>
            ) : venue && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                <span className="line-clamp-1">
                  {venue}{exhibition.city && `, ${exhibition.city}`}{exhibition.country && `, ${exhibition.country}`}
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {exhibition.is_free ? (
                <Badge variant="outline" className="text-[10px] text-chart-3 border-chart-3/30">{isAr ? "مجاني" : "Free Entry"}</Badge>
              ) : exhibition.ticket_price && (
                <Badge variant="outline" className="text-[10px]">{isAr && exhibition.ticket_price_ar ? exhibition.ticket_price_ar : exhibition.ticket_price}</Badge>
              )}
              {exhibition.tags && exhibition.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
              ))}
            </div>
          </div>
        </CardContent>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <span className="inline-flex items-center text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            {isAr ? "عرض التفاصيل" : "View Details"}
            <ArrowRight className="ms-1 h-3 w-3" />
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" tabIndex={-1}>
              {isAr ? "عرض التفاصيل" : "View Details"}
            </Button>
            {exhibition.registration_url && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(exhibition.registration_url!, "_blank", "noopener,noreferrer");
                }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}