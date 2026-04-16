import { useIsAr } from "@/hooks/useIsAr";
import { forwardRef, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Trophy, Globe, Landmark, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useCountUp } from "@/hooks/useCountUp";
import { CACHE } from "@/lib/queryConfig";

const COLORS = [
  { bg: "bg-card", text: "text-primary", icon: "bg-primary/10", ring: "ring-border/50" },
  { bg: "bg-card", text: "text-primary", icon: "bg-primary/10", ring: "ring-border/50" },
  { bg: "bg-card", text: "text-primary", icon: "bg-primary/10", ring: "ring-border/50" },
  { bg: "bg-card", text: "text-primary", icon: "bg-primary/10", ring: "ring-border/50" },
];

const StatCard = forwardRef<HTMLDivElement, { value: number; label: string; icon: LucideIcon; isVisible: boolean; delay: number; colorIdx: number }>(
  function StatCard({ value, label, icon: Icon, isVisible, delay, colorIdx }, ref) {
  const isAr = useIsAr();
    const count = useCountUp(value, isVisible);
    const color = COLORS[colorIdx % COLORS.length];

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center gap-3 rounded-2xl p-5 sm:p-6 transition-all duration-700 shadow-sm ring-1",
          color.bg, color.ring,
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        )}
        style={{ transitionDelay: `${delay}ms` }}
      >
        <div className={cn("flex items-center justify-center h-11 w-11 rounded-xl", color.icon)}>
          <Icon className={cn("h-5 w-5", color.text)} />
        </div>
        <p className="typo-stats-number text-3xl sm:text-4xl tabular-nums tracking-tight" dir="ltr">
          {count.toLocaleString()}+
        </p>
        <p className="typo-stats-label text-sm font-medium">{label}</p>
      </div>
    );
  }
);

const StatsBar = memo(forwardRef<HTMLElement>(function StatsBar(_props, _ref) {
  const isAr = useIsAr();
  const { ref, isVisible } = useScrollReveal({ threshold: 0.3 });

  const { data: stats } = useQuery({
    queryKey: ["home-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_platform_stats");
      if (error || !data) return { members: 0, competitions: 0, entities: 0, exhibitions: 0, organizers: 0 };
      const d = data as Record<string, number>;
      return { members: d.members ?? 0, competitions: d.competitions ?? 0, entities: d.entities ?? 0, exhibitions: d.exhibitions ?? 0, organizers: d.organizers ?? 0 };
    },
    staleTime: CACHE.long.staleTime,
  });

  const items = [
    { value: stats?.members ?? 0, label: isAr ? "عضو" : "Members", icon: Users },
    { value: stats?.exhibitions ?? 0, label: isAr ? "معرض" : "Exhibitions", icon: Globe },
    { value: stats?.competitions ?? 0, label: isAr ? "مسابقة" : "Competitions", icon: Trophy },
    { value: stats?.organizers ?? 0, label: isAr ? "منظم" : "Organizers", icon: Landmark },
  ];

  return (
    <section ref={ref} dir={isAr ? "rtl" : "ltr"} className="py-10 sm:py-14 md:py-20 bg-gradient-to-b from-background to-muted/30" aria-label={isAr ? "إحصائيات المنصة" : "Platform statistics"}>
      <div className="container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {!stats
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={cn("rounded-2xl p-6 animate-pulse bg-card shadow-sm ring-1", COLORS[i].ring)}>
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-muted/50" />
                    <div className="h-8 w-20 bg-muted/50 rounded-lg" />
                    <div className="h-4 w-16 bg-muted/50 rounded" />
                  </div>
                </div>
              ))
            : items.map((item, idx) => (
                <StatCard key={item.label} value={item.value} label={item.label} icon={item.icon} isVisible={isVisible} delay={idx * 100} colorIdx={idx} />
              ))}
        </div>
      </div>
    </section>
  );
}));

export default StatsBar;
