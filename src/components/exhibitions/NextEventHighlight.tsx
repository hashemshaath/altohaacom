import { memo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { toEnglishDigits } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { countryFlag } from "@/lib/countryFlag";
import type { Exhibition } from "./ExhibitionCard";

interface Props {
  exhibition: Exhibition;
  isAr: boolean;
}

export const NextEventHighlight = memo(function NextEventHighlight({ exhibition, isAr }: Props) {
  const title = isAr && exhibition.title_ar ? exhibition.title_ar : exhibition.title;
  const venue = isAr && exhibition.venue_ar ? exhibition.venue_ar : exhibition.venue;
  const start = new Date(exhibition.start_date);
  const now = new Date();
  const daysLeft = differenceInDays(start, now);
  const hoursLeft = differenceInHours(start, now) % 24;

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 sm:p-5 backdrop-blur-sm shadow-sm">
      <div className="flex items-start gap-1.5 mb-3">
        <Badge className="bg-primary/15 text-primary border-0 text-[9px] font-black uppercase tracking-wider">
          {isAr ? "الفعالية القادمة" : "Next Event"}
        </Badge>
      </div>

      <h3 className="text-sm sm:text-base font-bold line-clamp-1 mb-2">{title}</h3>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground mb-3">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3 text-primary/60" />
          {toEnglishDigits(format(start, "MMM d, yyyy"))}
        </span>
        {(venue || exhibition.city) && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-primary/60" />
            <span className="line-clamp-1">{venue}{exhibition.city && `, ${exhibition.city}`}</span>
          </span>
        )}
        {exhibition.country && (
          <span>{countryFlag(exhibition.country)}</span>
        )}
      </div>

      {/* Countdown */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-primary tabular-nums"><AnimatedCounter value={daysLeft} /></span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{isAr ? "يوم" : "days"}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-primary tabular-nums"><AnimatedCounter value={hoursLeft} /></span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{isAr ? "ساعة" : "hrs"}</span>
        </div>
      </div>

      <Button variant="outline" size="sm" className="rounded-xl text-xs" asChild>
        <Link to={`/exhibitions/${exhibition.slug}`}>
          {isAr ? "عرض التفاصيل" : "View Details"}
          <ArrowRight className="ms-1.5 h-3 w-3 rtl:rotate-180" />
        </Link>
      </Button>
    </div>
  );
});
