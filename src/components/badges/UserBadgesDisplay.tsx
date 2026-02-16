import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { BadgeCard } from "./BadgeCard";
import { Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface UserBadgesDisplayProps {
  userId: string;
  limit?: number;
}

export function UserBadgesDisplay({ userId, limit }: UserBadgesDisplayProps) {
  const { language } = useLanguage();

  const { data: badges, isLoading } = useQuery({
    queryKey: ["user-badges", userId],
    staleTime: 1000 * 60 * 5,
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

  if (!isLoading && !badges?.length) return null;

  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <Award className="h-5 w-5 text-primary" />
        {language === "ar" ? "الشارات" : "Badges"}
        {badges?.length ? (
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{badges.length}</Badge>
        ) : null}
      </h3>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex flex-col items-center p-5">
                <Skeleton className="h-18 w-18 rounded-2xl mb-3" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
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
      )}
    </div>
  );
}
