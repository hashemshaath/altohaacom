import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Users, Trophy, Building2, Globe } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

const StatItem = forwardRef<HTMLDivElement, {
  value: number; label: string; icon: any; color: string; bgColor: string; isVisible: boolean; delay: number;
}>(function StatItem({ value, label, icon: Icon, color, bgColor, isVisible, delay }, ref) {
  const count = useCountUp(value, isVisible);

  return (
    <div
      ref={ref}
      className={cn(
        "group flex flex-col items-center gap-2.5 py-4 sm:py-6 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={cn(
        "flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg",
        bgColor
      )}>
        <Icon className={cn("h-5 w-5", color)} />
      </div>
      <div className="text-center">
        <p className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums text-foreground">
          <AnimatedCounter value={count} className="inline" />+
        </p>
        <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">{label}</p>
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
    { value: stats?.members || 0, label: isAr ? "عضو مسجل" : "Members", icon: Users, color: "text-chart-1", bgColor: "bg-chart-1/10" },
    { value: stats?.competitions || 0, label: isAr ? "مسابقة" : "Competitions", icon: Trophy, color: "text-chart-2", bgColor: "bg-chart-2/10" },
    { value: stats?.entities || 0, label: isAr ? "جهة معتمدة" : "Entities", icon: Building2, color: "text-chart-3", bgColor: "bg-chart-3/10" },
    { value: stats?.exhibitions || 0, label: isAr ? "معرض" : "Exhibitions", icon: Globe, color: "text-chart-4", bgColor: "bg-chart-4/10" },
  ];

  return (
    <section ref={ref} className="relative border-y border-border/20 bg-card/40 backdrop-blur-sm overflow-hidden" aria-label={isAr ? "إحصائيات المنصة" : "Platform statistics"}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.04),transparent_70%)]" />
      <div className="container relative grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/20 rtl:divide-x-reverse" dir={isAr ? "rtl" : "ltr"}>
        {items.map((stat, i) => (
          <StatItem key={stat.label} {...stat} isVisible={isVisible} delay={i * 120} />
        ))}
      </div>
    </section>
  );
}
