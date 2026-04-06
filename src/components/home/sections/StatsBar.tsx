import { forwardRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Users, Trophy, Building2, Globe, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useCountUp } from "@/hooks/useCountUp";

const StatItem = forwardRef<HTMLDivElement, { value: number; label: string; icon: any; isVisible: boolean; delay: number }>(
  function StatItem({ value, label, icon: Icon, isVisible, delay }, ref) {
  const count = useCountUp(value, isVisible);

  return (
    <div
      ref={ref}
      className={cn(
        "group relative flex flex-col items-center gap-1 sm:gap-2 rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm p-2 sm:p-3 transition-[transform,opacity] duration-700 hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/15">
        <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
      </div>
      <p className="text-base sm:text-xl font-black tracking-tight tabular-nums text-foreground">
        <AnimatedCounter value={count} className="inline" />+
      </p>
      <p className="text-[8px] sm:text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
    </div>
  );
});

export default function StatsBar() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { ref, isVisible } = useScrollReveal({ threshold: 0.3 });

  const { data: stats } = useQuery({
    queryKey: ["home-stats"],
    queryFn: async () => {
      const results = await Promise.allSettled([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("competitions").select("id", { count: "exact", head: true }),
        supabase.from("culinary_entities").select("id", { count: "exact", head: true }),
        supabase.from("exhibitions").select("id", { count: "exact", head: true }),
        supabase.from("organizers").select("id", { count: "exact", head: true }),
      ]);
      const getCount = (r: PromiseSettledResult<any>) =>
        r.status === "fulfilled" ? (r.value.count ?? 0) : 0;
      return {
        members: getCount(results[0]),
        competitions: getCount(results[1]),
        entities: getCount(results[2]),
        exhibitions: getCount(results[3]),
        organizers: getCount(results[4]),
      };
    },
    staleTime: 1000 * 60 * 10,
  });

  const isLoading = !stats;

  const items = [
    { value: stats?.members ?? 0, label: isAr ? "عضو" : "Members", icon: Users },
    { value: stats?.exhibitions ?? 0, label: isAr ? "معرض" : "Exhibitions", icon: Globe },
    { value: stats?.competitions ?? 0, label: isAr ? "مسابقة" : "Competitions", icon: Trophy },
    { value: stats?.organizers ?? 0, label: isAr ? "منظم" : "Organizers", icon: Landmark },
    { value: stats?.entities ?? 0, label: isAr ? "جهة" : "Organizations", icon: Building2 },
  ];

  return (
    <section ref={ref} dir={isAr ? "rtl" : "ltr"}>
      <div className="container px-5 sm:px-6">
        <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/30 bg-card/50 p-2 sm:p-3 animate-pulse">
                <div className="flex flex-col items-center gap-1 sm:gap-2">
                  <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg bg-muted" />
                  <div className="h-4 w-10 bg-muted rounded" />
                  <div className="h-2 w-8 bg-muted rounded" />
                </div>
              </div>
            ))
          ) : items.map((item, idx) => (
            <StatItem
              key={item.label}
              value={item.value}
              label={item.label}
              icon={item.icon}
              isVisible={isVisible}
              delay={idx * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
