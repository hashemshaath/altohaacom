import { memo, useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight, MapPin, Trophy } from "lucide-react";
import { countryFlag } from "@/lib/countryFlag";
import { getDerivedStatus, type CompetitionWithRegs } from "./CompetitionCard";

interface Props {
  competitions: CompetitionWithRegs[];
  isAr: boolean;
}

function useCountdown(targetDate: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const diff = new Date(targetDate).getTime() - now;
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

export const NextCompetitionCountdown = memo(function NextCompetitionCountdown({ competitions, isAr }: Props) {
  const nextComp = useMemo(() => {
    const now = Date.now();
    return competitions
      .filter((c) => new Date(c.competition_start).getTime() > now)
      .sort((a, b) => new Date(a.competition_start).getTime() - new Date(b.competition_start).getTime())[0];
  }, [competitions]);

  const countdown = useCountdown(nextComp?.competition_start || "");

  if (!nextComp || !countdown) return null;

  const title = isAr && nextComp.title_ar ? nextComp.title_ar : nextComp.title;

  const units = [
    { value: countdown.days, label: isAr ? "يوم" : "Days", labelShort: isAr ? "يوم" : "d" },
    { value: countdown.hours, label: isAr ? "ساعة" : "Hours", labelShort: isAr ? "سا" : "h" },
    { value: countdown.minutes, label: isAr ? "دقيقة" : "Min", labelShort: isAr ? "دق" : "m" },
    { value: countdown.seconds, label: isAr ? "ثانية" : "Sec", labelShort: isAr ? "ثا" : "s" },
  ];

  return (
    <Link to={`/competitions/${nextComp.id}`} className="block group">
      <Card className="overflow-hidden rounded-2xl border-primary/20 bg-gradient-to-r from-primary/5 via-card to-chart-3/5 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
          {/* Image */}
          <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-xl overflow-hidden bg-primary/5 ring-1 ring-primary/20">
            {nextComp.cover_image_url ? (
              <img src={nextComp.cover_image_url} alt={title} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Trophy className="h-8 w-8 text-primary/20" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-center sm:text-start">
            <Badge className="mb-1.5 text-xs font-black uppercase tracking-widest bg-primary/10 text-primary border-0 rounded-lg">
              <Clock className="h-2.5 w-2.5 me-1" />
              {isAr ? "المسابقة القادمة" : "Next Competition"}
            </Badge>
            <h3 className="text-sm font-bold truncate group-hover:text-primary transition-colors">{title}</h3>
            {(nextComp.city || nextComp.country_code) && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center sm:justify-start mt-0.5">
                <MapPin className="h-2.5 w-2.5" />
                {nextComp.country_code && countryFlag(nextComp.country_code)} {nextComp.city}
              </p>
            )}
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {units.map((u, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-card ring-1 ring-border/30 shadow-sm">
                  <span className="text-base sm:text-lg font-black tabular-nums text-foreground">
                    {String(u.value).padStart(2, "0")}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground font-bold uppercase mt-1">{u.labelShort}</span>
              </div>
            ))}
          </div>

          {/* Arrow */}
          <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground shrink-0">
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});
