import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Calendar, MapPin, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";

interface RecommendedEvent {
  id: string;
  title: string;
  title_ar: string | null;
  slug: string;
  start_date: string;
  city: string | null;
  country: string | null;
  cover_image_url: string | null;
  type: "exhibition" | "competition";
  score: number;
}

export const SmartEventRecommendations = memo(function SmartEventRecommendations({
  currentEventId,
  currentEventCountry,
  currentEventCategories,
  limit = 4,
}: {
  currentEventId?: string;
  currentEventCountry?: string | null;
  currentEventCategories?: string[];
  limit?: number;
}) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: recommendations = [] } = useQuery<RecommendedEvent[]>({
    queryKey: ["smart-recommendations", currentEventId, user?.id],
    queryFn: async () => {
      // Fetch user's browsing history for personalization
      let viewedCategories: string[] = currentEventCategories || [];
      let viewedCountries: string[] = currentEventCountry ? [currentEventCountry] : [];

      if (user?.id) {
        const { data: behaviors } = await supabase
          .from("ad_user_behaviors")
          .select("page_url, page_category")
          .eq("user_id", user.id)
          .eq("event_type", "page_view")
          .order("created_at", { ascending: false })
          .limit(20);

        if (behaviors) {
          const exhibitionViews = behaviors.filter(b => b.page_url?.includes("/exhibitions/"));
          if (exhibitionViews.length > 0) {
            // Extract slugs to find related exhibitions
            const slugs = exhibitionViews
              .map(b => b.page_url?.split("/exhibitions/")[1])
              .filter(Boolean);
            
            if (slugs.length > 0) {
              const { data: viewedExhibitions } = await supabase
                .from("exhibitions")
                .select("country, categories")
                .in("slug", slugs.slice(0, 5));
              
              if (viewedExhibitions) {
                viewedCountries = [...new Set([
                  ...viewedCountries,
                  ...viewedExhibitions.map(e => e.country).filter(Boolean) as string[],
                ])];
                viewedExhibitions.forEach(e => {
                  if (Array.isArray(e.categories)) viewedCategories.push(...(e.categories as string[]));
                });
              }
            }
          }
        }
      }

      // Fetch upcoming exhibitions
      const { data: exhibitions } = await supabase
        .from("exhibitions")
        .select("id, title, title_ar, slug, start_date, city, country, cover_image_url, categories")
        .in("status", ["active", "upcoming"])
        .gte("start_date", new Date().toISOString())
        .neq("id", currentEventId || "")
        .order("start_date", { ascending: true })
        .limit(20);

      // Fetch upcoming competitions
      const { data: competitions } = await supabase
        .from("competitions")
        .select("id, title, title_ar, cover_image_url, competition_start, city, country")
        .in("status", ["registration_open", "upcoming"])
        .gte("competition_start", new Date().toISOString())
        .order("competition_start", { ascending: true })
        .limit(10);

      // Score and rank results
      const scored: RecommendedEvent[] = [];

      (exhibitions || []).forEach(e => {
        let score = 0;
        if (viewedCountries.includes(e.country || "")) score += 3;
        if (Array.isArray(e.categories)) {
          const overlap = (e.categories as string[]).filter(c => viewedCategories.includes(c)).length;
          score += overlap * 2;
        }
        // Temporal proximity bonus
        const daysAway = Math.abs((new Date(e.start_date).getTime() - Date.now()) / 86400000);
        if (daysAway < 30) score += 2;
        else if (daysAway < 90) score += 1;

        scored.push({
          id: e.id, title: e.title, title_ar: e.title_ar, slug: e.slug,
          start_date: e.start_date, city: e.city, country: e.country,
          cover_image_url: e.cover_image_url, type: "exhibition", score,
        });
      });

      (competitions || []).forEach(c => {
        let score = 0;
        if (viewedCountries.includes(c.country || "")) score += 3;
        const daysAway = Math.abs((new Date(c.competition_start).getTime() - Date.now()) / 86400000);
        if (daysAway < 30) score += 2;

        scored.push({
          id: c.id, title: c.title, title_ar: c.title_ar, slug: c.id,
          start_date: c.competition_start, city: c.city, country: c.country,
          cover_image_url: c.cover_image_url, type: "competition", score,
        });
      });

      return scored.sort((a, b) => b.score - a.score).slice(0, limit);
    },
    staleTime: 1000 * 60 * 10,
  });

  if (recommendations.length === 0) return null;

  return (
    <section className="space-y-3" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-chart-4/10 ring-1 ring-chart-4/20">
          <Sparkles className="h-3.5 w-3.5 text-chart-4" />
        </div>
        <h3 className="text-sm font-bold">{isAr ? "مُقترحات لك" : "Recommended for You"}</h3>
        {user && (
          <Badge variant="secondary" className="text-[12px]">
            <Sparkles className="h-2.5 w-2.5 me-0.5" />
            {isAr ? "مخصصة" : "Personalized"}
          </Badge>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {recommendations.map((event) => (
          <Link
            key={event.id}
            to={event.type === "exhibition" ? `/exhibitions/${event.slug}` : `/competitions/${event.slug}`}
            className="group"
          >
            <Card className="overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] rounded-xl">
              <div className="flex gap-3 p-3">
                {event.cover_image_url && (
                  <img
                    src={event.cover_image_url}
                    alt={event.title}
                    className="h-16 w-20 shrink-0 rounded-lg object-cover"
                    loading="lazy"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Badge variant="outline" className="text-[12px] px-1.5 py-0">
                      {event.type === "exhibition" ? (isAr ? "معرض" : "Exhibition") : (isAr ? "مسابقة" : "Competition")}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold line-clamp-2 group-hover:text-primary transition-colors">
                    {isAr && event.title_ar ? event.title_ar : event.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[12px] text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Calendar className="h-2.5 w-2.5" />
                      {format(new Date(event.start_date), "d MMM yyyy", { locale: isAr ? arLocale : undefined })}
                    </span>
                    {event.city && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        {event.city}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 self-center text-muted-foreground/40 group-hover:text-primary transition-colors rtl:rotate-180" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
});
