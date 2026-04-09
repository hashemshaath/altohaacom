import { memo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Flame, ArrowRight, MapPin } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { countryFlag } from "@/lib/countryFlag";
import { getDerivedStatus, type CompetitionWithRegs } from "./CompetitionCard";

interface Props {
  competitions: CompetitionWithRegs[];
  isAr: boolean;
}

export const TrendingCompetitions = memo(function TrendingCompetitions({ competitions, isAr }: Props) {
  // Top 8 by registrations, only non-ended
  const trending = competitions
    .filter((c) => {
      const d = getDerivedStatus(c);
      return d.status !== "ended";
    })
    .sort((a, b) => (b.competition_registrations?.length || 0) - (a.competition_registrations?.length || 0))
    .slice(0, 8);

  if (trending.length < 2) return null;

  return (
    <section className="space-y-3" aria-label={isAr ? "المسابقات الأكثر رواجاً" : "Trending Competitions"}>
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-chart-4/10 ring-1 ring-chart-4/20">
          <Flame className="h-3.5 w-3.5 text-chart-4" />
        </div>
        <h2 className="text-sm font-bold tracking-tight">
          {isAr ? "الأكثر رواجاً" : "Trending Now"}
        </h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
        {trending.map((comp) => {
          const title = isAr && comp.title_ar ? comp.title_ar : comp.title;
          const regs = comp.competition_registrations?.length || 0;
          const capacity = comp.max_participants || 0;
          const fillPercent = capacity > 0 ? Math.min(100, Math.round((regs / capacity) * 100)) : 0;
          const derived = getDerivedStatus(comp);

          return (
            <Link
              key={comp.id}
              to={`/competitions/${comp.id}`}
              className="shrink-0 w-[220px] group"
            >
              <Card className="overflow-hidden rounded-2xl border-border/20 h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/20">
                {/* Image */}
                <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                  {comp.cover_image_url ? (
                    <img
                      src={comp.cover_image_url}
                      alt={title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                      <Trophy className="h-8 w-8 text-primary/20" />
                    </div>
                  )}
                  {/* Status overlay */}
                  <div className="absolute top-2 start-2">
                    <Badge className={`text-[12px] font-black border-0 rounded-lg px-2 py-0.5 backdrop-blur-md ${derived.color}`}>
                      {isAr ? derived.labelAr : derived.label}
                    </Badge>
                  </div>
                  {/* Gradient overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                <CardContent className="p-3 space-y-2">
                  <h3 className="text-xs font-bold line-clamp-1 group-hover:text-primary transition-colors">
                    {title}
                  </h3>

                  <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    {comp.country_code && (
                      <span className="flex items-center gap-0.5">
                        {countryFlag(comp.country_code)}
                        {comp.city && <span className="truncate max-w-[60px]">{comp.city}</span>}
                      </span>
                    )}
                    <span className="flex items-center gap-0.5">
                      <Users className="h-2.5 w-2.5" />
                      {regs}
                    </span>
                  </div>

                  {/* Capacity bar */}
                  {capacity > 0 && (
                    <div className="space-y-1">
                      <Progress value={fillPercent} className="h-1.5 rounded-full" />
                      <div className="flex justify-between text-[12px] text-muted-foreground">
                        <span>{fillPercent}% {isAr ? "ممتلئ" : "filled"}</span>
                        <span>{regs}/{capacity}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
});
