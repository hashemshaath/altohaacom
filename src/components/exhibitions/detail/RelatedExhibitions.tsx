import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { isPast, isFuture, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  exhibitionId: string;
  country?: string | null;
  type?: string | null;
  seriesId?: string | null;
  isAr: boolean;
}

export function RelatedExhibitions({ exhibitionId, country, type, seriesId, isAr }: Props) {
  const { data: related = [] } = useQuery({
    queryKey: ["related-exhibitions", exhibitionId],
    queryFn: async () => {
      // Try series first, then same country/type
      let items: any[] = [];

      if (seriesId) {
        const { data } = await supabase
          .from("exhibitions")
          .select("id, title, title_ar, slug, start_date, end_date, city, country, cover_image_url, type, edition_year")
          .eq("series_id", seriesId)
          .neq("id", exhibitionId)
          .order("start_date", { ascending: false })
          .limit(6);
        items = data || [];
      }

      if (items.length < 3 && country) {
        const { data } = await supabase
          .from("exhibitions")
          .select("id, title, title_ar, slug, start_date, end_date, city, country, cover_image_url, type, edition_year")
          .eq("country", country)
          .neq("id", exhibitionId)
          .order("start_date", { ascending: false })
          .limit(6);
        const existingIds = new Set(items.map(i => i.id));
        items = [...items, ...(data || []).filter(d => !existingIds.has(d.id))].slice(0, 6);
      }

      if (items.length < 3 && type) {
        const { data } = await supabase
          .from("exhibitions")
          .select("id, title, title_ar, slug, start_date, end_date, city, country, cover_image_url, type, edition_year")
          .eq("type", type)
          .neq("id", exhibitionId)
          .order("start_date", { ascending: false })
          .limit(6);
        const existingIds = new Set(items.map(i => i.id));
        items = [...items, ...(data || []).filter(d => !existingIds.has(d.id))].slice(0, 6);
      }

      return items;
    },
    enabled: !!exhibitionId,
    staleTime: 1000 * 60 * 10,
  });

  if (related.length === 0) return null;

  return (
    <section className="mt-10 border-t border-border/30 pt-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold">{isAr ? "فعاليات ذات صلة" : "Related Events"}</h2>
        <Link to="/exhibitions" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
          {isAr ? "عرض الكل" : "View all"} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {related.slice(0, 3).map((ex: any) => {
          const title = isAr && ex.title_ar ? ex.title_ar : ex.title;
          const now = new Date();
          const start = new Date(ex.start_date);
          const end = new Date(ex.end_date);
          let status = "upcoming";
          try {
            if (isPast(end)) status = "ended";
            else if (isWithinInterval(now, { start, end })) status = "live";
          } catch {}

          return (
            <Link key={ex.id} to={`/exhibitions/${ex.slug}`}>
              <Card className="group overflow-hidden rounded-2xl border-border/30 transition-all hover:shadow-lg hover:-translate-y-0.5">
                <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                  {ex.cover_image_url ? (
                    <img src={ex.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Calendar className="h-8 w-8 text-muted-foreground/20" />
                    </div>
                  )}
                  <Badge
                    className={cn(
                      "absolute top-2 end-2 text-[10px]",
                      status === "live" && "bg-chart-3 text-white",
                      status === "ended" && "bg-muted text-muted-foreground",
                      status === "upcoming" && "bg-primary text-primary-foreground"
                    )}
                  >
                    {status === "live" ? (isAr ? "جاري" : "Live") : status === "ended" ? (isAr ? "انتهى" : "Ended") : (isAr ? "قادم" : "Upcoming")}
                  </Badge>
                </div>
                <CardContent className="p-3.5 space-y-1.5">
                  <h3 className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">{title}</h3>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(start, "MMM yyyy", { locale: isAr ? ar : undefined })}
                    </span>
                    {ex.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {ex.city}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}