import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4 text-primary" />
          {t("upcomingCompetitions")}
        </CardTitle>
        <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
          <Link to="/competitions">
            {isAr ? "عرض الكل" : "View All"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {competitions && competitions.length > 0 ? (
          <div className="divide-y">
            {competitions.map((competition) => {
              const title = isAr && competition.title_ar ? competition.title_ar : competition.title;
              return (
                <Link
                  key={competition.id}
                  to={`/competitions/${competition.id}`}
                  className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0 transition-colors hover:bg-muted/30 -mx-1 px-1 rounded-md"
                >
                  {/* Thumbnail */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
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
          <div className="py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60">
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
