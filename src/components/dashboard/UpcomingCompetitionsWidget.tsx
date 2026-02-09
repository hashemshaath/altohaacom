import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Calendar, MapPin, Globe, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export function UpcomingCompetitionsWidget() {
  const { language, t } = useLanguage();

  const { data: competitions, isLoading } = useQuery({
    queryKey: ["upcoming-competitions-widget"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("id, title, title_ar, competition_start, venue, venue_ar, is_virtual, status, city, country")
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          {t("upcomingCompetitions")}
        </CardTitle>
        <Link to="/competitions">
          <Button variant="ghost" size="sm" className="gap-1">
            {language === "ar" ? "عرض الكل" : "View All"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {competitions && competitions.length > 0 ? (
          <div className="space-y-4">
            {competitions.map((competition) => (
              <Link
                key={competition.id}
                to={`/competitions/${competition.id}`}
                className="block"
              >
                <div className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">
                        {language === "ar" && competition.title_ar
                          ? competition.title_ar
                          : competition.title}
                      </h4>
                      <Badge
                        variant={competition.status === "registration_open" ? "default" : "secondary"}
                      >
                        {competition.status === "registration_open"
                          ? t("registrationOpen")
                          : t("upcoming")}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(competition.competition_start), "MMM d, yyyy")}
                      </span>
                      {competition.is_virtual ? (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3.5 w-3.5" />
                          {t("virtual")}
                        </span>
                      ) : (
                        competition.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {competition.city}
                            {competition.country && `, ${competition.country}`}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Trophy className="mx-auto mb-2 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {t("noCompetitionsFound")}
            </p>
            <Link to="/competitions">
              <Button variant="outline" className="mt-4">
                {language === "ar" ? "استكشف المسابقات" : "Explore Competitions"}
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
