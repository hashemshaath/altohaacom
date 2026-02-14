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
        "flex flex-col items-center gap-2 px-2 transition-all duration-700",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/8 ring-1 ring-primary/10 transition-transform duration-500 hover:scale-110">
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className="text-2xl font-bold sm:text-3xl md:text-4xl tracking-tight tabular-nums">
        {count}+
      </p>
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
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
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("competitions").select("id", { count: "exact", head: true }),
        supabase.from("culinary_entities").select("id", { count: "exact", head: true }),
        supabase.from("exhibitions").select("id", { count: "exact", head: true }),
      ]);
      return {
        members: profiles.count || 0,
        competitions: comps.count || 0,
        entities: ents.count || 0,
        exhibitions: exhs.count || 0,
      };
    },
  });

  const items = [
    { value: stats?.members || 0, label: isAr ? "عضو مسجل" : "Members", icon: Users, color: "text-chart-1" },
    { value: stats?.competitions || 0, label: isAr ? "مسابقة" : "Competitions", icon: Trophy, color: "text-chart-2" },
    { value: stats?.entities || 0, label: isAr ? "جهة معتمدة" : "Entities", icon: Building2, color: "text-chart-3" },
    { value: stats?.exhibitions || 0, label: isAr ? "معرض" : "Exhibitions", icon: Globe, color: "text-chart-4" },
  ];

  return (
    <section ref={ref} className="border-y bg-card/60 backdrop-blur-sm">
      <div className="container grid grid-cols-2 sm:grid-cols-4 gap-4 py-8 sm:py-10">
        {items.map((stat, i) => (
          <StatItem key={stat.label} {...stat} isVisible={isVisible} delay={i * 120} />
        ))}
      </div>
    </section>
  );
}
