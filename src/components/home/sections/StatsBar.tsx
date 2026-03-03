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
        "flex flex-col items-center gap-1.5 transition-all duration-700",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <Icon className="h-5 w-5 text-primary/70" />
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
  });

  if (!stats) return null;

  const items = [
    { value: stats.members, label: isAr ? "عضو" : "Members", icon: Users },
    { value: stats.competitions, label: isAr ? "مسابقة" : "Competitions", icon: Trophy },
    { value: stats.entities, label: isAr ? "جهة" : "Organizations", icon: Building2 },
    { value: stats.exhibitions, label: isAr ? "معرض" : "Exhibitions", icon: Globe },
  ];

  return (
    <section ref={ref} className="border-y border-border/40 bg-muted/20 py-8" dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {items.map((item, idx) => (
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
