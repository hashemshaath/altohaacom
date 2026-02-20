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

  const isAr = language === "ar";

  return (
    <div>
      {/* Section header - matches SectionTitle pattern */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/8">
          <Award className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-base font-bold">{isAr ? "الشارات" : "Badges"}</h2>
        {badges?.length ? (
          <Badge variant="secondary" className="text-[10px] h-5 rounded-lg">{badges.length}</Badge>
        ) : null}
        <div className="flex-1 h-px bg-border/25" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-2xl border-border/25">
              <CardContent className="flex flex-col items-center p-5">
                <Skeleton className="h-18 w-18 rounded-2xl mb-3" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
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
