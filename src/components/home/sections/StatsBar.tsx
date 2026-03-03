import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Users, Trophy, Building2, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useCountUp } from "@/hooks/useCountUp";
import { forwardRef } from "react";

const StatItem = forwardRef<HTMLDivElement, {
  value: number; label: string; icon: any; isVisible: boolean; delay: number;
}>(function StatItem({ value, label, icon: Icon, isVisible, delay }, ref) {
  const count = useCountUp(value, isVisible);

  return (
    <div
      ref={ref}
      className={cn(
        "group relative flex flex-col items-center gap-2 rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm p-5 transition-all duration-700 hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/15">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <p className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums text-foreground">
        <AnimatedCounter value={count} className="inline" />+
      </p>
      <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
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
      ]);
      const getCount = (r: PromiseSettledResult<any>) => 
        r.status === "fulfilled" ? (r.value.count ?? 0) : 0;
      return {
        members: getCount(results[0]),
        competitions: getCount(results[1]),
        entities: getCount(results[2]),
        exhibitions: getCount(results[3]),
      };
    },
    staleTime: 1000 * 60 * 10,
  });

  if (!stats || (stats.members === 0 && stats.competitions === 0)) return null;

  const items = [
    { value: stats.members, label: isAr ? "عضو" : "Members", icon: Users },
    { value: stats.competitions, label: isAr ? "مسابقة" : "Competitions", icon: Trophy },
    { value: stats.entities, label: isAr ? "جهة" : "Organizations", icon: Building2 },
    { value: stats.exhibitions, label: isAr ? "معرض" : "Exhibitions", icon: Globe },
  ];

  return (
    <section ref={ref} dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {items.map((item, idx) => (
            <StatItem
              key={item.label}
              value={item.value}
              label={item.label}
              icon={item.icon}
              isVisible={isVisible}
              delay={idx * 120}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
