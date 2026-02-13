import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Calendar, MapPin, Trophy } from "lucide-react";
import { format } from "date-fns";

const MIDDLE_EAST = ["SA", "AE", "KW", "BH", "QA", "OM", "JO", "LB", "IQ", "EG", "TN", "MA", "DZ", "LY", "SY", "PS", "YE"];

export function RegionalEvents() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: allComps = [] } = useQuery({
    queryKey: ["home-regional-comps"],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("id, title, title_ar, cover_image_url, status, competition_start, city, country, country_code, is_virtual")
        .in("status", ["registration_open", "upcoming", "in_progress"])
        .order("competition_start", { ascending: true })
        .limit(12);
      return data || [];
    },
  });

  const middleEast = allComps.filter((c: any) => c.country_code && MIDDLE_EAST.includes(c.country_code.toUpperCase()));
  const global = allComps.filter((c: any) => !c.country_code || !MIDDLE_EAST.includes(c.country_code.toUpperCase()));

  const renderComp = (item: any) => {
    const title = isAr && item.title_ar ? item.title_ar : item.title;
    return (
      <Link key={item.id} to={`/competitions/${item.id}`} className="group block">
        <Card className="h-full overflow-hidden border-border/50 transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-primary/20">
          <div className="relative aspect-[16/10] overflow-hidden bg-muted">
            {item.cover_image_url ? (
              <img src={item.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
            ) : (
              <div className="flex h-full items-center justify-center"><Trophy className="h-8 w-8 text-muted-foreground/20" /></div>
            )}
            <Badge className="absolute end-2 top-2 text-[10px]">
              {item.status === "registration_open" ? (isAr ? "مفتوح" : "Open") : (isAr ? "قادمة" : "Upcoming")}
            </Badge>
          </div>
          <CardContent className="p-3">
            <h3 className="mb-1 line-clamp-2 text-sm font-semibold group-hover:text-primary transition-colors">{title}</h3>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              {item.competition_start && (
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(item.competition_start), "MMM d")}</span>
              )}
              {item.city && (
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.city}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  if (allComps.length === 0) return null;

  return (
    <section className="bg-muted/30 py-12 md:py-16">
      <div className="container">
        <div className="mb-6 text-center">
          <h2 className="font-serif text-2xl font-bold sm:text-3xl">
            {isAr ? "الفعاليات حسب المنطقة" : "Events by Region"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAr ? "اكتشف الأحداث القريبة منك والعالمية" : "Discover events near you and worldwide"}
          </p>
        </div>

        <Tabs defaultValue="middle-east">
          <TabsList className="mx-auto mb-6 flex w-fit">
            <TabsTrigger value="middle-east">
              {isAr ? "🌍 الشرق الأوسط" : "🌍 Middle East"}
            </TabsTrigger>
            <TabsTrigger value="global">
              {isAr ? "🌐 دولية" : "🌐 Global"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="middle-east">
            {middleEast.length > 0 ? (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">{middleEast.map(renderComp)}</div>
            ) : (
              <div className="py-10 text-center text-muted-foreground">
                {isAr ? "لا توجد فعاليات في الشرق الأوسط حالياً" : "No Middle East events currently"}
              </div>
            )}
          </TabsContent>

          <TabsContent value="global">
            {global.length > 0 ? (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">{global.map(renderComp)}</div>
            ) : (
              <div className="py-10 text-center text-muted-foreground">
                {isAr ? "لا توجد فعاليات دولية حالياً" : "No global events currently"}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <Button variant="outline" size="sm" asChild>
            <Link to="/competitions">
              {isAr ? "استكشف جميع الفعاليات" : "Explore All Events"}
              <ArrowRight className="ms-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
