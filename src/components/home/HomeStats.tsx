import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, Building2, Globe, Database } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const StatItem = forwardRef<HTMLDivElement, {
  value: number; label: string; icon: any; color: string; bgColor: string; isVisible: boolean; delay: number; source: string;
}>(function StatItem({ value, label, icon: Icon, color, bgColor, isVisible, delay, source }, ref) {
  const count = useCountUp(value, isVisible);

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-3 sm:flex-col sm:items-center sm:gap-2 px-3 py-2 sm:py-0 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-primary/10", bgColor)}>
        <Icon className={cn("h-4.5 w-4.5 sm:h-5 sm:w-5", color)} />
      </div>
      <div className="sm:text-center">
        <p className="text-xl font-bold sm:text-2xl tracking-tight tabular-nums text-foreground">
          {count.toLocaleString()}+
        </p>
        <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
        <Badge variant="outline" className="mt-1 hidden sm:inline-flex gap-0.5 text-[8px] font-normal text-muted-foreground/60 border-dashed px-1 py-0">
          <Database className="h-2 w-2" />
          {source}
        </Badge>
      </div>
    </div>
  );
});

export function HomeStats() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { ref, isVisible } = useScrollReveal({ threshold: 0.3 });

  const { data: stats } = useQuery({
    queryKey: ["home-stats"],
    queryFn: async () => {
      const [profiles, comps, ents, exhs] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("competitions").select("*", { count: "exact", head: true }),
        supabase.from("culinary_entities").select("*", { count: "exact", head: true }),
        supabase.from("exhibitions").select("*", { count: "exact", head: true }),
      ]);
      return {
        members: profiles.count || 0,
        competitions: comps.count || 0,
        entities: ents.count || 0,
        exhibitions: exhs.count || 0,
      };
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  const items = [
    { value: stats?.members || 0, label: isAr ? "عضو مسجل" : "Members", icon: Users, color: "text-chart-1", bgColor: "bg-chart-1/10", source: "profiles" },
    { value: stats?.competitions || 0, label: isAr ? "مسابقة" : "Competitions", icon: Trophy, color: "text-chart-2", bgColor: "bg-chart-2/10", source: "competitions" },
    { value: stats?.entities || 0, label: isAr ? "جهة معتمدة" : "Entities", icon: Building2, color: "text-chart-3", bgColor: "bg-chart-3/10", source: "culinary_entities" },
    { value: stats?.exhibitions || 0, label: isAr ? "معرض" : "Exhibitions", icon: Globe, color: "text-chart-4", bgColor: "bg-chart-4/10", source: "exhibitions" },
  ];

  return (
    <section ref={ref} className="border-y border-border/30 bg-card/50 backdrop-blur-sm" aria-label={isAr ? "إحصائيات المنصة" : "Platform statistics"}>
      <div className="container grid grid-cols-2 sm:grid-cols-4 gap-2 py-6 sm:py-8" dir={isAr ? "rtl" : "ltr"}>
        {items.map((stat, i) => (
          <StatItem key={stat.label} {...stat} isVisible={isVisible} delay={i * 100} />
        ))}
      </div>
    </section>
  );
}
