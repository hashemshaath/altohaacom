import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Calendar, MapPin, Globe, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export function UpcomingCompetitionsWidget() {
  const { language, t } = useLanguage();
  const isAr = language === "ar";

  const { data: competitions, isLoading } = useQuery({
    queryKey: ["upcoming-competitions-widget"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("id, title, title_ar, competition_start, venue, venue_ar, is_virtual, status, city, country, cover_image_url")
        .in("status", ["upcoming", "registration_open"])
        .order("competition_start", { ascending: true })
        .limit(3);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/30 px-4 py-3">
          <Skeleton className="h-5 w-48" />
        </div>
        <CardContent className="p-4 space-y-4">
          <Skeleton className="h-16 w-full rounded-md" />
          <Skeleton className="h-16 w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group relative overflow-hidden transition-all duration-500 hover:shadow-xl border-border/40 bg-card/50 backdrop-blur-sm">
      <div className="pointer-events-none absolute -top-20 -end-20 h-48 w-48 rounded-full bg-primary/5 blur-[60px] transition-all duration-500 group-hover:bg-primary/10" />
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/20 px-5 py-4">
        <h3 className="flex items-center gap-2.5 text-sm font-bold tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 shadow-inner group-hover:scale-110 transition-transform duration-300">
            <Trophy className="h-4 w-4 text-primary" />
          </div>
          {t("upcomingCompetitions")}
        </h3>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8 font-semibold hover:bg-primary/5 hover:text-primary transition-all rounded-xl" asChild>
          <Link to="/competitions">
            {isAr ? "عرض الكل" : "View All"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
      <CardContent className="p-4">
        {competitions && competitions.length > 0 ? (
          <div className="divide-y">
            {competitions.map((competition) => {
              const title = isAr && competition.title_ar ? competition.title_ar : competition.title;
              return (
                <Link
                  key={competition.id}
                  to={`/competitions/${competition.id}`}
                  className="group/item flex items-start gap-4 py-4 first:pt-0 last:pb-0 transition-all hover:bg-primary/5 -mx-2 px-2 rounded-xl"
                >
                  {/* Thumbnail */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted ring-1 ring-border/20 shadow-sm transition-all duration-300 group-hover/item:scale-110 group-hover/item:shadow-md group-hover/item:rotate-2">
                    {competition.cover_image_url ? (
                      <img src={competition.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover/item:scale-110" loading="lazy" />
                    ) : (
                      <Trophy className="h-6 w-6 text-primary/20" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold tracking-tight line-clamp-1 group-hover/item:text-primary transition-colors">{title}</h4>
                      <Badge
                        variant={competition.status === "registration_open" ? "default" : "secondary"}
                        className={`shrink-0 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 shadow-sm ${
                          competition.status === "registration_open" ? "animate-pulse" : ""
                        }`}
                      >
                        {competition.status === "registration_open" ? t("registrationOpen") : t("upcoming")}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(competition.competition_start), "MMM d, yyyy")}
                      </span>
                      {competition.is_virtual ? (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {t("virtual")}
                        </span>
                      ) : competition.city ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {competition.city}{competition.country ? `, ${competition.country}` : ""}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Trophy className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">{t("noCompetitionsFound")}</p>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <Link to="/competitions">
                {isAr ? "استكشف المسابقات" : "Explore Competitions"}
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
