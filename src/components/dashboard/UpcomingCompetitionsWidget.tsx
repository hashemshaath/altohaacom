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
    <Card className="relative overflow-hidden transition-shadow hover:shadow-md border-border/50">
      <div className="pointer-events-none absolute -top-16 -end-16 h-40 w-40 rounded-full bg-primary/5 blur-[50px]" />
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <Trophy className="h-3.5 w-3.5 text-primary" />
          </div>
          {t("upcomingCompetitions")}
        </h3>
        <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" asChild>
          <Link to="/competitions">
            {isAr ? "عرض الكل" : "View All"}
            <ArrowRight className="h-3 w-3" />
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
                  className="group flex items-start gap-3 py-3 first:pt-0 last:pb-0 transition-all hover:bg-muted/30 -mx-1 px-1 rounded-lg hover:shadow-sm"
                >
                  {/* Thumbnail */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted ring-1 ring-border/30 transition-transform duration-200 group-hover:scale-105">
                    {competition.cover_image_url ? (
                      <img src={competition.cover_image_url} alt={title} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <Trophy className="h-5 w-5 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium line-clamp-1">{title}</h4>
                      <Badge
                        variant={competition.status === "registration_open" ? "default" : "secondary"}
                        className="shrink-0 text-[10px]"
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
