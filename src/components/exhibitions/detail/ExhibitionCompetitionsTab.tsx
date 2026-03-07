import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Trophy, ChevronRight, Flag, CheckCircle2 } from "lucide-react";
import { format, isPast, isFuture, isWithinInterval } from "date-fns";

interface Props {
  competitions: any[];
  isAr: boolean;
}

export function ExhibitionCompetitionsTab({ competitions, isAr }: Props) {
  const { liveCompetitions, upcomingCompetitions, pastCompetitions } = useMemo(() => {
    const now = new Date();
    return {
      liveCompetitions: competitions.filter((c) =>
        isWithinInterval(now, { start: new Date(c.competition_start), end: new Date(c.competition_end) })
      ),
      upcomingCompetitions: competitions.filter((c) => isFuture(new Date(c.competition_start))),
      pastCompetitions: competitions.filter((c) => isPast(new Date(c.competition_end))),
    };
  }, [competitions]);

  return (
    <div className="space-y-6">
      {liveCompetitions.length > 0 && (
        <CompetitionSection
          title={isAr ? "مسابقات جارية" : "Live Competitions"}
          icon={<div className="h-2 w-2 rounded-full bg-chart-3 animate-pulse" />}
          competitions={liveCompetitions}
          isAr={isAr}
          now={now}
        />
      )}
      {upcomingCompetitions.length > 0 && (
        <CompetitionSection
          title={isAr ? "مسابقات قادمة" : "Upcoming Competitions"}
          icon={
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
              <Flag className="h-3 w-3 text-primary" />
            </div>
          }
          competitions={upcomingCompetitions}
          isAr={isAr}
          now={now}
        />
      )}
      {pastCompetitions.length > 0 && (
        <CompetitionSection
          title={isAr ? "مسابقات منتهية" : "Past Competitions"}
          icon={
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-muted">
              <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
            </div>
          }
          competitions={pastCompetitions}
          isAr={isAr}
          now={now}
        />
      )}
    </div>
  );
}

function CompetitionSection({
  title,
  icon,
  competitions,
  isAr,
  now,
}: {
  title: string;
  icon: React.ReactNode;
  competitions: any[];
  isAr: boolean;
  now: Date;
}) {
  return (
    <section>
      <h3 className="flex items-center gap-2 mb-3 font-semibold text-sm">
        {icon}
        {title}
        <Badge variant="secondary" className="text-[9px]">
          {competitions.length}
        </Badge>
      </h3>
      <div className="space-y-3">
        {competitions.map((comp) => (
          <CompetitionClassifiedCard key={comp.id} comp={comp} isAr={isAr} now={now} />
        ))}
      </div>
    </section>
  );
}

function CompetitionClassifiedCard({ comp, isAr, now }: { comp: any; isAr: boolean; now: Date }) {
  const compTitle = isAr && comp.title_ar ? comp.title_ar : comp.title;
  const compDesc = isAr && comp.description_ar ? comp.description_ar : comp.description;
  const compStart = new Date(comp.competition_start);
  const compEnd = new Date(comp.competition_end);
  const compIsLive = isWithinInterval(now, { start: compStart, end: compEnd });
  const compIsPast = isPast(compEnd);
  const categories = comp.competition_categories || [];
  const regCount = comp.competition_registrations?.length || 0;
  const regEnd = comp.registration_end ? new Date(comp.registration_end) : null;
  const regStart = comp.registration_start ? new Date(comp.registration_start) : null;
  const regOpen = regStart && regEnd && !isPast(regEnd) && isPast(regStart);
  const maxParts = comp.max_participants;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="flex flex-col sm:flex-row">
        {comp.cover_image_url && (
          <div className="sm:w-48 shrink-0">
            <img src={comp.cover_image_url} alt={compTitle} className="h-40 w-full object-cover sm:h-full" />
          </div>
        )}
        <div className="flex-1 p-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant={compIsLive ? "default" : compIsPast ? "secondary" : "outline"} className="text-[10px]">
              {compIsLive
                ? isAr ? "🔴 جارية" : "🔴 Live"
                : compIsPast
                ? isAr ? "انتهت" : "Ended"
                : isAr ? "قادمة" : "Upcoming"}
            </Badge>
            {regOpen && (
              <Badge className="bg-chart-3/20 text-chart-3 border-chart-3/30 text-[10px]">
                {isAr ? "التسجيل مفتوح" : "Registration Open"}
              </Badge>
            )}
          </div>

          <Link to={`/competitions/${comp.id}`} className="group">
            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{compTitle}</h3>
          </Link>

          {compDesc && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{compDesc}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(compStart, "MMM d")} – {format(compEnd, "MMM d, yyyy")}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {regCount}
              {maxParts ? `/${maxParts}` : ""} {isAr ? "مسجل" : "registered"}
            </span>
          </div>

          {categories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {categories.slice(0, 5).map((cat: any) => (
                <Badge key={cat.id} variant="secondary" className="text-[10px]">
                  {isAr && cat.name_ar ? cat.name_ar : cat.name}
                </Badge>
              ))}
              {categories.length > 5 && (
                <Badge variant="outline" className="text-[10px]">
                  +{categories.length - 5}
                </Badge>
              )}
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <Link
              to={`/competitions/${comp.id}`}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              {isAr ? "عرض التفاصيل" : "View Details"}
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
