import { ROUTES } from "@/config/routes";
import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Landmark, Calendar, MapPin, Globe, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format, isFuture } from "date-fns";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

export const UpcomingExhibitionsWidget = memo(function UpcomingExhibitionsWidget() {
  const isAr = useIsAr();

  const { data: exhibitions, isLoading } = useQuery({
    queryKey: ["upcoming-exhibitions-widget"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibitions")
        .select("id, title, title_ar, slug, start_date, end_date, venue, venue_ar, city, country, is_virtual, cover_image_url, type, is_featured")
        .in("status", ["upcoming", "active"])
        .order("start_date", { ascending: true })
        .limit(3);

      if (error) throw handleSupabaseError(error);
      return data?.filter((e) => isFuture(new Date(e.end_date))) || [];
    },
  });

  const typeLabels: Record<string, { en: string; ar: string }> = {
    exhibition: { en: "Exhibition", ar: "معرض" },
    conference: { en: "Conference", ar: "مؤتمر" },
    summit: { en: "Summit", ar: "قمة" },
    workshop: { en: "Workshop", ar: "ورشة" },
    food_festival: { en: "Festival", ar: "مهرجان" },
    trade_show: { en: "Trade Show", ar: "معرض تجاري" },
    competition_event: { en: "Event", ar: "حدث" },
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/30 px-4 py-3">
          <Skeleton className="h-5 w-44" />
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
      <div className="pointer-events-none absolute -top-20 -end-20 h-48 w-48 rounded-full bg-chart-3/5 blur-[60px] transition-all duration-500 group-hover:bg-chart-3/10" />
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/20 px-5 py-4">
        <h3 className="flex items-center gap-2.5 text-sm font-bold tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-3/10 shadow-inner group-hover:scale-110 transition-transform duration-300">
            <Landmark className="h-4 w-4 text-chart-3" />
          </div>
          {isAr ? "الفعاليات القادمة" : "Upcoming Events"}
        </h3>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8 font-semibold hover:bg-chart-3/5 hover:text-chart-3 transition-all rounded-xl" asChild>
          <Link to={ROUTES.exhibitions}>
            {isAr ? "عرض الكل" : "View All"}
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        </Button>
      </div>
      <CardContent className="p-4">
        {exhibitions && exhibitions.length > 0 ? (
          <div className="divide-y">
            {exhibitions.map((exhibition) => {
              const title = isAr && exhibition.title_ar ? exhibition.title_ar : exhibition.title;
              const venue = isAr && exhibition.venue_ar ? exhibition.venue_ar : exhibition.venue;
              const tLabel = typeLabels[exhibition.type];

              return (
                <Link
                  key={exhibition.id}
                  to={`/exhibitions/${exhibition.slug}`}
                  className="group/item flex items-start gap-4 py-4 first:pt-0 last:pb-0 transition-all hover:bg-chart-3/5 -mx-2 px-2 rounded-xl"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted ring-1 ring-border/20 shadow-sm transition-all duration-300 group-hover/item:scale-110 group-hover/item:shadow-md group-hover/item:rotate-2">
                    {exhibition.cover_image_url ? (
                      <img src={exhibition.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover/item:scale-110" loading="lazy" />
                    ) : (
                      <Landmark className="h-6 w-6 text-chart-3/20" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold tracking-tight line-clamp-1 group-hover/item:text-chart-3 transition-colors">{title}</h4>
                      {tLabel && (
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          {isAr ? tLabel.ar : tLabel.en}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(exhibition.start_date), "MMM d, yyyy")}
                      </span>
                      {exhibition.is_virtual ? (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {isAr ? "افتراضي" : "Virtual"}
                        </span>
                      ) : (exhibition.city || venue) ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {venue || exhibition.city}{exhibition.country ? `, ${exhibition.country}` : ""}
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
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Landmark className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isAr ? "لا توجد فعاليات قادمة" : "No upcoming events"}
            </p>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <Link to={ROUTES.exhibitions}>
                {isAr ? "استكشف الفعاليات" : "Explore Events"}
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
