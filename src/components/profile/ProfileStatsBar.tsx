import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Award, GraduationCap, Star } from "lucide-react";

interface ProfileStatsBarProps {
  userId: string;
}

export function ProfileStatsBar({ userId }: ProfileStatsBarProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: stats } = useQuery({
    queryKey: ["profile-stats", userId],
    queryFn: async () => {
      const [compsRes, certsRes, badgesRes, mcRes] = await Promise.all([
        supabase.from("competition_registrations").select("id").eq("participant_id", userId),
        supabase.from("certificates").select("id").eq("recipient_id", userId),
        supabase.from("user_badges").select("id").eq("user_id", userId),
        supabase.from("masterclass_enrollments").select("id").eq("user_id", userId),
      ]);

      return [
        { label: isAr ? "المسابقات" : "Competitions", value: compsRes.data?.length || 0, icon: Trophy },
        { label: isAr ? "الشهادات" : "Certificates", value: certsRes.data?.length || 0, icon: Award },
        { label: isAr ? "الشارات" : "Badges", value: badgesRes.data?.length || 0, icon: Star },
        { label: isAr ? "الدورات" : "Courses", value: mcRes.data?.length || 0, icon: GraduationCap },
      ];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  if (!stats) return null;

  return (
    <Card className="overflow-hidden border-border/50">
      <CardContent className="p-0">
        <div className="grid grid-cols-4 divide-x rtl:divide-x-reverse">
          {stats.map((stat) => (
            <div key={stat.label} className="group flex flex-col items-center gap-1 py-4 px-2 transition-colors duration-200 hover:bg-accent/30">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 transition-transform duration-200 group-hover:scale-110">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-lg font-bold leading-none">{stat.value}</span>
              <span className="text-[10px] text-muted-foreground text-center leading-tight">{stat.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
