import { memo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Building, Clock, ArrowRight, Eye, Globe } from "lucide-react";
import { format, isFuture, differenceInDays } from "date-fns";
import { toEnglishDigits } from "@/lib/formatNumber";
import { countryFlag } from "@/lib/countryFlag";
import { getLiveStatus, typeLabels, type Exhibition, type ExhibitionSponsor } from "./ExhibitionCard";

interface Props {
  exhibition: Exhibition;
  language: string;
  sponsors?: ExhibitionSponsor[];
}

export const ExhibitionListItem = memo(({ exhibition, language, sponsors = [] }: Props) => {
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

  return (
    <Link to={`/exhibitions/${exhibition.slug}`} className="group block">
      <div className="flex gap-4 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-3 sm:p-4 transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:bg-card">
        {/* Image */}
        <div className="hidden sm:block shrink-0 w-32 h-24 md:w-40 md:h-28 rounded-xl overflow-hidden bg-muted">
          {exhibition.cover_image_url ? (
            <img src={exhibition.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/8 via-accent/5 to-muted">
              <span className="text-3xl opacity-60">🏛️</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-sm font-bold leading-snug group-hover:text-primary transition-colors line-clamp-1">
                {title}
              </h3>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge className={`${liveStatus.className} text-[8px] font-black uppercase tracking-wider py-0.5 px-2 border-0`}>
                  {isAr ? liveStatus.labelAr : liveStatus.label}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground mb-1.5">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-primary/50" />
                {toEnglishDigits(format(new Date(exhibition.start_date), "MMM d"))} – {toEnglishDigits(format(new Date(exhibition.end_date), "d, yyyy"))}
              </span>
              {exhibition.country && (
                <span className="flex items-center gap-1">
                  <span>{countryFlag(exhibition.country)}</span>
                  {exhibition.city || exhibition.country}
                </span>
              )}
              {exhibition.is_virtual && (
                <span className="flex items-center gap-1 text-chart-1">
                  <Globe className="h-3 w-3" /> {isAr ? "افتراضي" : "Virtual"}
                </span>
              )}
              {organizer && (
                <span className="flex items-center gap-1">
                  <Building className="h-3 w-3 text-primary/40" />
                  {organizer}
                </span>
              )}
            </div>

            {description && (
              <p className="text-[11px] text-muted-foreground/70 line-clamp-1 leading-relaxed">{description}</p>
            )}
          </div>

          {/* Bottom row */}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-[8px] font-bold uppercase tracking-wider py-0.5 px-2">
              {isAr ? typeLabel.ar : typeLabel.en}
            </Badge>
            {exhibition.is_free && (
              <Badge variant="outline" className="text-[8px] text-chart-3 border-chart-3/30 bg-chart-3/5 py-0.5 px-2">
                {isAr ? "مجاني" : "Free"}
              </Badge>
            )}
            {daysLeft !== null && daysLeft > 0 && daysLeft <= 30 && (
              <Badge className="gap-0.5 text-[8px] bg-chart-4/90 text-chart-4-foreground border-0 py-0.5 px-2">
                <Clock className="h-2.5 w-2.5" />
                {isAr ? `${toEnglishDigits(daysLeft)} يوم` : `${daysLeft}d`}
              </Badge>
            )}
            {sponsors.slice(0, 2).map((s) => (
              <Badge key={s.id} variant="outline" className="text-[8px] bg-chart-4/5 text-chart-4 border-chart-4/20 py-0.5 px-2">
                {isAr ? (s.label_ar || s.companies?.name_ar || s.companies?.name) : (s.label || s.companies?.name) || (isAr ? "راعي" : "Sponsor")}
              </Badge>
            ))}
            <div className="flex-1" />
            {(exhibition.view_count ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Eye className="h-3 w-3" />
                {toEnglishDigits(exhibition.view_count!)}
              </span>
            )}
            <span className="flex items-center gap-1 text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              {isAr ? "التفاصيل" : "Details"}
              <ArrowRight className="h-3 w-3 rtl:rotate-180" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
});

ExhibitionListItem.displayName = "ExhibitionListItem";
