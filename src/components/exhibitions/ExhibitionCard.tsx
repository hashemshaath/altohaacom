import { forwardRef, memo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Globe, ExternalLink, Clock, ArrowRight, Building, Eye } from "lucide-react";
import { format, isPast, isFuture, isWithinInterval, differenceInDays } from "date-fns";
import { toEnglishDigits } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";
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
  edition_year?: number | null;
  series_id?: string | null;
}

export interface ExhibitionSponsor {
  id: string;
  label: string | null;
  label_ar: string | null;
  logo_url: string | null;
  companies: { name: string; name_ar: string | null; logo_url: string | null } | null;
}

const statusConfig: Record<ExhibitionStatus, { label: string; labelAr: string; className: string }> = {
  pending: { label: "Pending Approval", labelAr: "بانتظار الموافقة", className: "bg-chart-4/15 text-chart-4 border-chart-4/20" },
  draft: { label: "Draft", labelAr: "مسودة", className: "bg-muted text-muted-foreground" },
  upcoming: { label: "Upcoming", labelAr: "قادم", className: "bg-primary/15 text-primary border-primary/20" },
  active: { label: "Happening Now", labelAr: "يحدث الآن", className: "bg-chart-3/15 text-chart-3 border-chart-3/20" },
  completed: { label: "Completed", labelAr: "انتهى", className: "bg-chart-5/15 text-chart-5 border-chart-5/20" },
  cancelled: { label: "Cancelled", labelAr: "ملغى", className: "bg-destructive/15 text-destructive border-destructive/20" },
};

export const typeLabels: Record<ExhibitionType, { en: string; ar: string }> = {
  exhibition: { en: "Exhibition", ar: "معرض" },
  conference: { en: "Conference", ar: "مؤتمر" },
  summit: { en: "Summit", ar: "قمة" },
  workshop: { en: "Workshop", ar: "ورشة عمل" },
  food_festival: { en: "Food Festival", ar: "مهرجان طعام" },
  trade_show: { en: "Trade Show", ar: "معرض تجاري" },
  competition_event: { en: "Competition Event", ar: "حدث تنافسي" },
};

/** Derive a live status from dates rather than relying solely on the DB status field */
export function getLiveStatus(exhibition: Exhibition) {
  const now = new Date();
  const start = new Date(exhibition.start_date);
  const end = new Date(exhibition.end_date);
  if (isPast(end)) return statusConfig.completed;
  if (isWithinInterval(now, { start, end })) return statusConfig.active;
  if (isFuture(start)) return statusConfig.upcoming;
  return statusConfig[exhibition.status];
}

interface ExhibitionCardProps {
  exhibition: Exhibition;
  language: string;
  variant?: "default" | "featured";
  /** Pre-fetched sponsors to avoid N+1 queries */
  sponsors?: ExhibitionSponsor[];
}

export const ExhibitionCard = memo(
  forwardRef<HTMLDivElement, ExhibitionCardProps>(
    ({ exhibition, language, variant = "default", sponsors = [] }, ref) => {
      const isAr = language === "ar";
      const baseTitle = isAr && exhibition.title_ar ? exhibition.title_ar : exhibition.title;
      const title = exhibition.edition_year ? `${baseTitle} ${exhibition.edition_year}` : baseTitle;
      const description = isAr && exhibition.description_ar ? exhibition.description_ar : exhibition.description;
      const venue = isAr && exhibition.venue_ar ? exhibition.venue_ar : exhibition.venue;
      const organizer = isAr && exhibition.organizer_name_ar ? exhibition.organizer_name_ar : exhibition.organizer_name;
      const typeLabel = typeLabels[exhibition.type];
      const liveStatus = getLiveStatus(exhibition);

      const daysLeft = isFuture(new Date(exhibition.start_date))
        ? differenceInDays(new Date(exhibition.start_date), new Date())
        : null;

      const isFeaturedVariant = variant === "featured";

      return (
        <Link to={`/exhibitions/${exhibition.slug}`} className="group block">
          <Card
            ref={ref}
            className={`group flex h-full flex-col overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-1.5 hover:border-primary/30 hover:bg-card ${exhibition.is_featured ? "ring-1 ring-primary/20 shadow-lg shadow-primary/5" : ""}`}
          >
            {/* Image */}
            <div className={`relative shrink-0 overflow-hidden bg-muted ${isFeaturedVariant ? "aspect-[16/9]" : "aspect-[16/10]"}`}>
              {exhibition.cover_image_url ? (
                <img
                  src={exhibition.cover_image_url}
                  alt={title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/8 via-accent/5 to-muted">
                  <span className="text-5xl opacity-60 transition-transform duration-500 group-hover:scale-110">🏛️</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />

              {/* Top-left: Status + Featured */}
              <div className="absolute top-3 start-3 z-10 flex flex-col gap-1.5">
                <Badge className={`${liveStatus.className} shadow-lg backdrop-blur-md border-0 text-[9px] font-black uppercase tracking-wider py-1 px-2.5`}>
                  {liveStatus.className.includes("chart-3") && (
                    <span className="relative me-1.5 flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
                    </span>
                  )}
                  {isAr ? liveStatus.labelAr : liveStatus.label}
                </Badge>
                {exhibition.is_featured && (
                  <Badge className="bg-primary text-primary-foreground shadow-lg shadow-primary/20 text-[9px] font-black uppercase tracking-wider py-1 px-2.5">
                    ⭐ {isAr ? "مميز" : "Featured"}
                  </Badge>
                )}
              </div>

              {/* Top-right: Type + countdown */}
              <div className="absolute top-3 end-3 z-10 flex flex-col items-end gap-1.5">
                <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-wider bg-background/80 backdrop-blur-md shadow-lg border-0 py-1 px-2.5">
                  {isAr ? typeLabel.ar : typeLabel.en}
                </Badge>
                {daysLeft !== null && daysLeft > 0 && daysLeft <= 30 && (
                  <Badge className="gap-1 text-[9px] font-black uppercase tracking-wider bg-chart-4/90 text-chart-4-foreground shadow-lg border-0 py-1 px-2.5">
                    <Clock className="h-2.5 w-2.5" />
                    {isAr ? `باقي ${daysLeft} يوم` : `${daysLeft}d left`}
                  </Badge>
                )}
              </div>

              {/* Bottom: Country + Date overlay */}
              <div className="absolute bottom-3 inset-x-3 z-10 flex items-end justify-between">
                {exhibition.country && (
                  <div className="flex items-center gap-1.5 rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-medium backdrop-blur-md ring-1 ring-border/20">
                    <span>{countryFlag(exhibition.country)}</span>
                    <span className="text-foreground/90">{exhibition.country}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-medium backdrop-blur-md ring-1 ring-border/20">
                  <Calendar className="h-3 w-3 text-primary" />
                  <span className="text-foreground/90">
                    {toEnglishDigits(format(new Date(exhibition.start_date), "MMM d"))} – {toEnglishDigits(format(new Date(exhibition.end_date), "d, yyyy"))}
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <CardContent className="flex flex-1 flex-col p-4 sm:p-5">
              <div className="flex-1 space-y-2.5">
                <h3 className="line-clamp-2 text-base font-bold leading-snug group-hover:text-primary transition-colors duration-300">
                  {title}
                  <span className="text-primary/50 font-serif italic ms-1 text-sm">
                    {toEnglishDigits(new Date(exhibition.start_date).getFullYear())}
                  </span>
                </h3>

                {organizer && (
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <Building className="h-3 w-3 text-primary/40" />
                    <span className="text-foreground/70">{organizer}</span>
                  </p>
                )}

                {description && (
                  <p className="line-clamp-2 text-[12px] text-muted-foreground/80 leading-relaxed">
                    {description}
                  </p>
                )}

                {exhibition.is_virtual ? (
                  <div className="flex items-center gap-2 text-[11px]">
                    <Globe className="h-3 w-3 text-chart-1" />
                    <span className="text-chart-1 font-medium">{isAr ? "حدث افتراضي" : "Virtual Event"}</span>
                  </div>
                ) : venue && (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <MapPin className="h-3 w-3 text-primary/50" />
                    <span className="line-clamp-1 font-medium">
                      {venue}{exhibition.city && `, ${exhibition.city}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Tags row */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {sponsors.map((s) => {
                  const logo = s.logo_url || s.companies?.logo_url;
                  const name = isAr ? (s.label_ar || s.companies?.name_ar || s.companies?.name) : (s.label || s.companies?.name);
                  return (
                    <Badge key={s.id} variant="outline" className="gap-1 text-[9px] font-bold uppercase tracking-wider bg-chart-4/5 text-chart-4 border-chart-4/20 py-0.5 px-2">
                      {logo ? (
                        <img src={logo} alt={name || ""} className="h-3 w-3 rounded-sm object-contain" loading="lazy" />
                      ) : (
                        <Building className="h-2.5 w-2.5" />
                      )}
                      {name || (isAr ? "راعي" : "Sponsor")}
                    </Badge>
                  );
                })}
                {exhibition.is_free ? (
                  <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider text-chart-3 border-chart-3/30 bg-chart-3/5 py-0.5 px-2">
                    {isAr ? "مجاني" : "Free"}
                  </Badge>
                ) : exhibition.ticket_price && (
                  <Badge variant="outline" className="text-[9px] font-bold border-primary/20 bg-primary/5 py-0.5 px-2">
                    {isAr && exhibition.ticket_price_ar ? exhibition.ticket_price_ar : exhibition.ticket_price}
                  </Badge>
                )}
                {exhibition.tags && exhibition.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[9px] bg-muted/50 py-0.5 px-2">#{tag}</Badge>
                ))}
              </div>
            </CardContent>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border/30 bg-muted/15 px-4 sm:px-5 py-2.5 transition-colors group-hover:bg-muted/30">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                {isAr ? "عرض التفاصيل" : "View Details"}
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 rtl:rotate-180" />
              </span>
              <div className="flex items-center gap-2">
                {(exhibition.view_count ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    <AnimatedCounter value={exhibition.view_count!} className="inline" />
                  </span>
                )}
                {exhibition.registration_url && (
                  <button
                    className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(exhibition.registration_url!, "_blank", "noopener,noreferrer");
                    }}
                    title={isAr ? "التسجيل" : "Register"}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </Card>
        </Link>
      );
    }
  )
);

ExhibitionCard.displayName = "ExhibitionCard";
