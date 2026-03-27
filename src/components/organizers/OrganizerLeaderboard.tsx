import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Landmark, Star, Eye, Trophy, Medal, Award } from "lucide-react";

type LeaderboardMetric = "events" | "rating" | "views";

interface Props {
  organizers: any[];
  isAr: boolean;
}

const MEDAL_COLORS = ["text-amber-500", "text-zinc-400", "text-amber-700"];
const MEDAL_ICONS = [Trophy, Medal, Award];

export const OrganizerLeaderboard = memo(function OrganizerLeaderboard({ organizers, isAr }: Props) {
  const [metric, setMetric] = useState<LeaderboardMetric>("events");

  const sorted = [...organizers]
    .sort((a, b) => {
      if (metric === "events") return (b.total_exhibitions || 0) - (a.total_exhibitions || 0);
      if (metric === "rating") return (b.average_rating || 0) - (a.average_rating || 0);
      return (b.total_views || 0) - (a.total_views || 0);
    })
    .slice(0, 5);

  if (sorted.length < 2) return null;

  const metricTabs: { key: LeaderboardMetric; label: string; labelAr: string; icon: typeof Landmark }[] = [
    { key: "events", label: "Most Events", labelAr: "الأكثر فعاليات", icon: Landmark },
    { key: "rating", label: "Top Rated", labelAr: "الأعلى تقييماً", icon: Star },
    { key: "views", label: "Most Viewed", labelAr: "الأكثر مشاهدة", icon: Eye },
  ];

  const getValue = (org: any) => {
    if (metric === "events") return org.total_exhibitions || 0;
    if (metric === "rating") return org.average_rating ? org.average_rating.toFixed(1) : "0";
    return (org.total_views || 0).toLocaleString();
  };

  const getLabel = () => {
    if (metric === "events") return isAr ? "فعالية" : "events";
    if (metric === "rating") return isAr ? "تقييم" : "rating";
    return isAr ? "مشاهدة" : "views";
  };

  return (
    <section className="rounded-2xl border border-border/40 bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          {isAr ? "المنظمون الرائدون" : "Top Organizers"}
        </h2>
        <div className="flex gap-1">
          {metricTabs.map(tab => (
            <Button
              key={tab.key}
              variant={metric === tab.key ? "default" : "ghost"}
              size="sm"
              className="h-7 text-[10px] gap-1 rounded-lg px-2"
              onClick={() => setMetric(tab.key)}
            >
              <tab.icon className="h-3 w-3" />
              <span className="hidden sm:inline">{isAr ? tab.labelAr : tab.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {sorted.map((org, idx) => {
          const name = isAr && org.name_ar ? org.name_ar : org.name;
          const MedalIcon = idx < 3 ? MEDAL_ICONS[idx] : null;
          const medalColor = idx < 3 ? MEDAL_COLORS[idx] : "";

          return (
            <Link
              key={org.id}
              to={`/organizers/${org.slug}`}
              className="flex items-center gap-3 w-full rounded-xl p-2.5 text-start hover:bg-muted/50 transition-colors group"
            >
              <span className="flex h-7 w-7 items-center justify-center shrink-0">
                {MedalIcon ? (
                  <MedalIcon className={`h-5 w-5 ${medalColor}`} />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">{idx + 1}</span>
                )}
              </span>

              <Avatar className="h-10 w-10 rounded-xl border border-border/30 shrink-0">
                {org.logo_url && <AvatarImage src={org.logo_url} />}
                <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-sm font-bold">{org.name?.charAt(0)}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">{name}</span>
                  {org.is_verified && <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />}
                </div>
                {org.city && (
                  <p className="text-[10px] text-muted-foreground truncate">{org.city}{org.country ? `, ${org.country}` : ""}</p>
                )}
              </div>

              <div className="text-end shrink-0">
                <p className="text-sm font-bold text-foreground">{getValue(org)}</p>
                <p className="text-[9px] text-muted-foreground">{getLabel()}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
});
