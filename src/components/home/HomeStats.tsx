import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Users, Trophy, Building2, Globe } from "lucide-react";

export function HomeStats() {
  const { language } = useLanguage();
  const isAr = language === "ar";

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
    { value: stats?.members || 0, label: isAr ? "عضو مسجل" : "Members", icon: Users },
    { value: stats?.competitions || 0, label: isAr ? "مسابقة" : "Competitions", icon: Trophy },
    { value: stats?.entities || 0, label: isAr ? "جهة معتمدة" : "Entities", icon: Building2 },
    { value: stats?.exhibitions || 0, label: isAr ? "معرض" : "Exhibitions", icon: Globe },
  ];

  return (
    <section className="border-y bg-card/80 backdrop-blur-sm">
      <div className="container grid grid-cols-4 py-6 sm:py-8">
        {items.map((stat, i) => (
          <div key={stat.label} className={`flex flex-col items-center gap-1 px-1 ${i > 0 ? "border-s border-border/50" : ""}`}>
            <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 sm:h-10 sm:w-10">
              <stat.icon className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
            </div>
            <p className="text-xl font-bold sm:text-2xl md:text-3xl">{stat.value}+</p>
            <p className="text-[10px] text-muted-foreground sm:text-xs">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
