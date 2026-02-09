import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { BadgeCard } from "./BadgeCard";
import { Award } from "lucide-react";

interface UserBadgesDisplayProps {
  userId: string;
  limit?: number;
}

export function UserBadgesDisplay({ userId, limit }: UserBadgesDisplayProps) {
  const { language } = useLanguage();

  const { data: badges } = useQuery({
    queryKey: ["user-badges", userId],
    queryFn: async () => {
      let query = supabase
        .from("user_badges")
        .select("*, digital_badges(*), competitions(title, title_ar)")
        .eq("user_id", userId)
        .eq("is_public", true)
        .order("earned_at", { ascending: false });

      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  if (!badges?.length) return null;

  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <Award className="h-5 w-5 text-primary" />
        {language === "ar" ? "الشارات" : "Badges"}
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {badges.map((ub: any) => {
          const compTitle = language === "ar" && ub.competitions?.title_ar
            ? ub.competitions.title_ar
            : ub.competitions?.title;

          return (
            <BadgeCard
              key={ub.id}
              badge={ub.digital_badges}
              competitionTitle={compTitle}
              earnedAt={ub.earned_at}
              shareToken={ub.share_token}
              showShare
            />
          );
        })}
      </div>
    </div>
  );
}
