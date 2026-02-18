import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Users, Trophy, Building2, Globe } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";

function StatItem({ value, label, icon: Icon, color, isVisible, delay }: {
  value: number; label: string; icon: any; color: string; isVisible: boolean; delay: number;
}) {
  const count = useCountUp(value, isVisible);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2.5 px-2 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-95"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 ring-1 ring-primary/10 transition-all duration-500 hover:scale-110 hover:ring-primary/20 hover:bg-primary/10">
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <p className="text-xl font-bold sm:text-3xl md:text-4xl tracking-tight tabular-nums">
        {count}+
      </p>
      <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
    </div>
  );
}

export function HomeStats() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { ref, isVisible } = useScrollReveal({ threshold: 0.3 });

  const { data: stats } = useQuery({
    queryKey: ["home-stats"],
    queryFn: async () => {
      const [profiles, comps, ents, exhs] = await Promise.all([
        supabase.from("profiles").select("id"),
        supabase.from("competitions").select("id"),
        supabase.from("culinary_entities").select("id"),
        supabase.from("exhibitions").select("id"),
      ]);
      return {
        members: profiles.data?.length || 0,
        competitions: comps.data?.length || 0,
        entities: ents.data?.length || 0,
        exhibitions: exhs.data?.length || 0,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  const items = [
    { value: stats?.members || 0, label: isAr ? "عضو مسجل" : "Members", icon: Users, color: "text-chart-1" },
    { value: stats?.competitions || 0, label: isAr ? "مسابقة" : "Competitions", icon: Trophy, color: "text-chart-2" },
    { value: stats?.entities || 0, label: isAr ? "جهة معتمدة" : "Entities", icon: Building2, color: "text-chart-3" },
    { value: stats?.exhibitions || 0, label: isAr ? "معرض" : "Exhibitions", icon: Globe, color: "text-chart-4" },
  ];

  return (
    <section ref={ref} className="border-y border-border/40 bg-card/60 backdrop-blur-sm" aria-label={isAr ? "إحصائيات المنصة" : "Platform statistics"}>
      <div className="container grid grid-cols-2 sm:grid-cols-4 gap-6 py-10 sm:py-12">
        {items.map((stat, i) => (
          <StatItem key={stat.label} {...stat} isVisible={isVisible} delay={i * 120} />
        ))}
      </div>
    </section>
  );
}
