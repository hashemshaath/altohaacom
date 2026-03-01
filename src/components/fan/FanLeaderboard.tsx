import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Medal, Trophy, Flame } from "lucide-react";

const RANK_ICONS = [Crown, Medal, Trophy];
const RANK_COLORS = ["text-chart-4", "text-muted-foreground", "text-chart-5"];

export function FanLeaderboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();

  const { data: leaders = [], isLoading } = useQuery({
    queryKey: ["fan-leaderboard"],
    queryFn: async () => {
      const { data } = await supabase
        .from("fan_leaderboard" as any)
        .select("*")
        .limit(10);
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-chart-4/10">
            <Flame className="h-3.5 w-3.5 text-chart-4" />
          </div>
          {isAr ? "لوحة المتصدرين" : "Fan Leaderboard"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-10 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : leaders.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            {isAr ? "لا توجد بيانات بعد" : "No data yet"}
          </p>
        ) : (
          <div className="space-y-1">
            {leaders.map((fan: any, idx: number) => {
              const isMe = fan.user_id === user?.id;
              const RankIcon = idx < 3 ? RANK_ICONS[idx] : null;
              const rankColor = idx < 3 ? RANK_COLORS[idx] : "text-muted-foreground";

              return (
                <div
                  key={fan.user_id}
                  className={`flex items-center gap-3 rounded-xl p-2 transition-colors ${
                    isMe ? "bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted/40"
                  }`}
                >
                  {/* Rank */}
                  <div className="w-6 text-center shrink-0">
                    {RankIcon ? (
                      <RankIcon className={`h-4 w-4 mx-auto ${rankColor}`} />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">{idx + 1}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={fan.avatar_url} />
                    <AvatarFallback className="text-[10px]">
                      {(fan.full_name || fan.username || "?")[0]}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">
                      {fan.full_name || fan.username || (isAr ? "مستخدم" : "User")}
                      {isMe && (
                        <Badge variant="secondary" className="ms-1.5 text-[9px] h-4 px-1">
                          {isAr ? "أنت" : "You"}
                        </Badge>
                      )}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{fan.following_count} {isAr ? "متابَع" : "following"}</span>
                      <span>·</span>
                      <span>{fan.reviews_count} {isAr ? "تقييم" : "reviews"}</span>
                    </div>
                  </div>

                  {/* Score */}
                  <Badge variant="outline" className="text-[10px] shrink-0 tabular-nums">
                    {fan.engagement_score} {isAr ? "نقطة" : "pts"}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
