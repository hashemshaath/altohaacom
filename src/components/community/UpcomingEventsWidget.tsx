import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, ArrowRight, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export const UpcomingEventsWidget = memo(function UpcomingEventsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: events = [] } = useQuery({
    queryKey: ["community-upcoming-events"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data } = await (supabase as any)
        .from("exhibitions")
        .select("id, title, title_ar, slug, start_date, end_date, city, country, cover_image_url, status")
        .eq("status", "active")
        .gte("start_date", now)
        .order("start_date", { ascending: true })
        .limit(3);
      return (data as any[]) || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  if (events.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <h3 className="px-4 pt-3 pb-2 text-base font-bold flex items-center gap-2">
        <Flame className="h-4 w-4 text-destructive" />
        {isAr ? "فعاليات قادمة" : "Upcoming Events"}
      </h3>
      <div className="divide-y divide-border">
        {events.map((event: any) => {
          const title = (isAr && event.title_ar) ? event.title_ar : event.title;
          const startDate = new Date(event.start_date);
          const timeUntil = formatDistanceToNow(startDate, { 
            addSuffix: false, 
            locale: isAr ? ar : enUS 
          });

          return (
            <Link
              key={event.id}
              to={`/exhibitions/${event.slug}`}
              className="block px-4 py-3 hover:bg-muted/30 transition-colors group"
            >
              <div className="flex gap-3">
                {/* Date badge */}
                <div className="flex flex-col items-center justify-center shrink-0 w-11 h-11 rounded-xl bg-primary/10 text-primary">
                  <span className="text-[10px] font-bold uppercase leading-none">
                    {startDate.toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short" })}
                  </span>
                  <span className="text-lg font-bold leading-none mt-0.5">
                    {startDate.getDate()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                    {title}
                  </p>
                  {event.city && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-2.5 w-2.5" />
                      {event.city}{event.country ? `, ${event.country}` : ""}
                    </p>
                  )}
                  <Badge variant="outline" className="mt-1 text-[9px] h-4 gap-1">
                    <CalendarDays className="h-2.5 w-2.5" />
                    {isAr ? `بعد ${timeUntil}` : `in ${timeUntil}`}
                  </Badge>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      <Link
        to="/exhibitions"
        className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-primary hover:bg-muted/30 transition-colors border-t border-border"
      >
        {isAr ? "عرض الكل" : "View all events"}
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
});
