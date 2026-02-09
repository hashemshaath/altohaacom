import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Globe, Users, ExternalLink } from "lucide-react";
import { format, isPast, isFuture, isWithinInterval } from "date-fns";
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
  upcoming: { label: "Upcoming", labelAr: "قادم", className: "bg-primary/20 text-primary" },
  active: { label: "Happening Now", labelAr: "يحدث الآن", className: "bg-chart-3/20 text-chart-3" },
  completed: { label: "Completed", labelAr: "انتهى", className: "bg-chart-5/20 text-chart-5" },
  cancelled: { label: "Cancelled", labelAr: "ملغى", className: "bg-destructive/20 text-destructive" },
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
  const statusInfo = statusConfig[exhibition.status];
  const typeLabel = typeLabels[exhibition.type];

  const liveStatus = (() => {
    const now = new Date();
    const start = new Date(exhibition.start_date);
    const end = new Date(exhibition.end_date);
    if (isPast(end)) return statusConfig.completed;
    if (isWithinInterval(now, { start, end })) return statusConfig.active;
    if (isFuture(start)) return statusConfig.upcoming;
    return statusInfo;
  })();

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
        {exhibition.cover_image_url ? (
          <img
            src={exhibition.cover_image_url}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-5xl">🏛️</span>
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge className={liveStatus.className}>
            {isAr ? liveStatus.labelAr : liveStatus.label}
          </Badge>
          {exhibition.is_featured && (
            <Badge variant="default">⭐ {isAr ? "مميز" : "Featured"}</Badge>
          )}
        </div>
        <Badge variant="secondary" className="absolute right-3 top-3">
          {isAr ? typeLabel.ar : typeLabel.en}
        </Badge>
      </div>

      <CardHeader className="pb-2">
        <h3 className="line-clamp-2 text-lg font-semibold">{title}</h3>
        {organizer && (
          <p className="text-xs text-muted-foreground">{isAr ? "المنظم:" : "By:"} {organizer}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-2 text-sm text-muted-foreground">
        {description && (
          <p className="line-clamp-2 text-foreground/70">{description}</p>
        )}

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>
            {format(new Date(exhibition.start_date), "MMM d, yyyy")}
            {" – "}
            {format(new Date(exhibition.end_date), "MMM d, yyyy")}
          </span>
        </div>

        {exhibition.is_virtual ? (
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 shrink-0" />
            <span>{isAr ? "حدث افتراضي" : "Virtual Event"}</span>
          </div>
        ) : venue && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">
              {venue}{exhibition.city && `, ${exhibition.city}`}{exhibition.country && `, ${exhibition.country}`}
            </span>
          </div>
        )}

        {exhibition.is_free ? (
          <Badge variant="outline" className="text-chart-3">{isAr ? "مجاني" : "Free Entry"}</Badge>
        ) : exhibition.ticket_price && (
          <Badge variant="outline">{isAr && exhibition.ticket_price_ar ? exhibition.ticket_price_ar : exhibition.ticket_price}</Badge>
        )}

        {exhibition.tags && exhibition.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {exhibition.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        <Button variant="outline" className="flex-1" asChild>
          <Link to={`/exhibitions/${exhibition.slug}`}>
            {isAr ? "عرض التفاصيل" : "View Details"}
          </Link>
        </Button>
        {exhibition.registration_url && (
          <Button size="icon" variant="ghost" asChild>
            <a href={exhibition.registration_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
