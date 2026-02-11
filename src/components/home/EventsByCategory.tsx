import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Globe, Utensils, Coffee, ArrowRight, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";

export function EventsByCategory() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: competitions = [] } = useQuery({
    queryKey: ["home-competitions-cat"],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("id, title, title_ar, cover_image_url, status, competition_start, city, country, is_virtual, competition_type")
        .in("status", ["registration_open", "upcoming", "in_progress"])
        .order("competition_start", { ascending: true })
        .limit(8);
      return data || [];
    },
  });

  const { data: exhibitions = [] } = useQuery({
    queryKey: ["home-exhibitions-cat"],
    queryFn: async () => {
      const { data } = await supabase
        .from("exhibitions")
        .select("id, title, title_ar, cover_image_url, status, start_date, city, country, slug")
        .in("status", ["upcoming", "active"])
        .order("start_date", { ascending: true })
        .limit(6);
      return data || [];
    },
  });

  const { data: tastings = [] } = useQuery({
    queryKey: ["home-tastings-cat"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasting_sessions")
        .select("id, title, title_ar, status, session_date, venue, evaluation_category")
        .in("status", ["draft", "open", "in_progress"])
        .order("session_date", { ascending: true })
        .limit(6);
      return data || [];
    },
  });

  const tabs = [
    {
      key: "competitions",
      icon: Trophy,
      labelEn: "Competitions",
      labelAr: "المسابقات",
      items: competitions,
      renderItem: (item: any) => {
        const title = isAr && item.title_ar ? item.title_ar : item.title;
        return (
          <Link key={item.id} to={`/competitions/${item.id}`} className="group block">
            <Card className="h-full overflow-hidden border-border/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20">
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                {item.cover_image_url ? (
                  <img src={item.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center"><Trophy className="h-8 w-8 text-muted-foreground/20" /></div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background/60 to-transparent" />
                <Badge className="absolute end-2 top-2 text-[10px]">
                  {item.status === "registration_open" ? (isAr ? "مفتوح" : "Open") : item.status === "in_progress" ? (isAr ? "جارية" : "Live") : (isAr ? "قادمة" : "Upcoming")}
                </Badge>
              </div>
              <CardContent className="p-3">
                <h3 className="mb-1.5 line-clamp-2 text-sm font-semibold group-hover:text-primary transition-colors">{title}</h3>
                <div className="space-y-1 text-[11px] text-muted-foreground">
                  {item.competition_start && (
                    <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3 shrink-0" /><span>{format(new Date(item.competition_start), "MMM d, yyyy")}</span></div>
                  )}
                  {item.is_virtual ? (
                    <div className="flex items-center gap-1.5"><Globe className="h-3 w-3 shrink-0" /><span>{isAr ? "افتراضي" : "Virtual"}</span></div>
                  ) : item.city ? (
                    <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 shrink-0" /><span>{item.city}{item.country ? `, ${item.country}` : ""}</span></div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      },
      viewAllHref: "/competitions",
    },
    {
      key: "exhibitions",
      icon: Globe,
      labelEn: "Exhibitions",
      labelAr: "المعارض",
      items: exhibitions,
      renderItem: (item: any) => {
        const title = isAr && item.title_ar ? item.title_ar : item.title;
        return (
          <Link key={item.id} to={`/exhibitions/${item.slug || item.id}`} className="group block">
            <Card className="h-full overflow-hidden border-border/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20">
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                {item.cover_image_url ? (
                  <img src={item.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center"><Globe className="h-8 w-8 text-muted-foreground/20" /></div>
                )}
                <Badge className="absolute end-2 top-2 text-[10px]">{item.status === "open" ? (isAr ? "نشط" : "Active") : (isAr ? "قادم" : "Upcoming")}</Badge>
              </div>
              <CardContent className="p-3">
                <h3 className="mb-1.5 line-clamp-2 text-sm font-semibold group-hover:text-primary transition-colors">{title}</h3>
                <div className="space-y-1 text-[11px] text-muted-foreground">
                  {item.start_date && (
                    <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3 shrink-0" /><span>{format(new Date(item.start_date), "MMM d, yyyy")}</span></div>
                  )}
                  {item.city && (
                    <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 shrink-0" /><span>{item.city}{item.country ? `, ${item.country}` : ""}</span></div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      },
      viewAllHref: "/exhibitions",
    },
    {
      key: "tastings",
      icon: Coffee,
      labelEn: "Tastings & Beverages",
      labelAr: "التذوق والمشروبات",
      items: tastings,
      renderItem: (item: any) => {
        const title = isAr && item.title_ar ? item.title_ar : item.title;
        return (
          <Link key={item.id} to={`/tastings/${item.id}`} className="group block">
            <Card className="h-full border-border/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20">
              <CardContent className="p-4">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Coffee className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-1.5 line-clamp-2 text-sm font-semibold group-hover:text-primary transition-colors">{title}</h3>
                <div className="space-y-1 text-[11px] text-muted-foreground">
                  {item.evaluation_category && (
                    <Badge variant="secondary" className="text-[10px]">{item.evaluation_category}</Badge>
                  )}
                  {item.session_date && (
                    <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3 shrink-0" /><span>{format(new Date(item.session_date), "MMM d, yyyy")}</span></div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      },
      viewAllHref: "/tastings",
    },
  ];

  return (
    <section className="container py-12 md:py-16">
      <div className="mb-6 text-center">
        <h2 className="font-serif text-2xl font-bold sm:text-3xl">
          {isAr ? "استكشف الفعاليات" : "Explore Events"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isAr ? "مسابقات ومعارض وجلسات تذوق من جميع أنحاء العالم" : "Competitions, exhibitions, and tastings from around the world"}
        </p>
      </div>

      <Tabs defaultValue="competitions" className="w-full">
        <TabsList className="mx-auto mb-6 flex w-fit">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key} className="gap-1.5">
              <tab.icon className="h-3.5 w-3.5" />
              {isAr ? tab.labelAr : tab.labelEn}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.key} value={tab.key}>
            {tab.items.length > 0 ? (
              <>
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                  {tab.items.map(tab.renderItem)}
                </div>
                <div className="mt-6 text-center">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={tab.viewAllHref}>
                      {isAr ? "عرض الكل" : "View All"}
                      <ArrowRight className="ms-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                {isAr ? "لا توجد فعاليات حالياً" : "No events available yet"}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
