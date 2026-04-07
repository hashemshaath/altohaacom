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
          "flex flex-col items-center gap-1 bg-[var(--bg-purple-wash)] p-6 text-center transition-[transform,opacity] duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        )}
        style={{ transitionDelay: `${delay}ms` }}
      >
        <p className="text-[clamp(32px,5vw,52px)] font-extrabold tracking-tight tabular-nums text-[var(--color-primary)]" dir="ltr">
          <AnimatedCounter value={count} className="inline" />+
        </p>
        <p className="text-[14px] text-[var(--color-muted)] mt-1">{label}</p>
      </div>
    );
  }
);

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
  ];

  return (
    <section
      ref={ref}
      dir={isAr ? "rtl" : "ltr"}
      className="section-purple"
      style={{ padding: "56px 0" }}
      aria-label={isAr ? "إحصائيات المنصة" : "Platform statistics"}
    >
      <div className="mx-auto max-w-[var(--container-max)] px-[var(--container-px-mobile)] lg:px-[var(--container-px)]">
        {/* Grid with 1px gap acting as dividers */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 bg-[var(--color-border)]"
          style={{ gap: "1px" }}
          role="list"
        >
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} role="listitem" className="bg-[var(--bg-purple-wash)] p-6 animate-pulse">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-20 bg-[var(--color-primary-light)] rounded" />
                  <div className="h-4 w-16 bg-[var(--color-primary-light)] rounded" />
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
