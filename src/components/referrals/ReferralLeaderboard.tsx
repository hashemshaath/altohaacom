import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { getDisplayName, getDisplayInitial } from "@/lib/getDisplayName";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useReferralLeaderboard } from "@/hooks/useReferralExtras";
import { Trophy, Medal, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const ReferralLeaderboard = memo(function ReferralLeaderboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const { data: leaderboard, isLoading } = useReferralLeaderboard();

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  const rankIcons = [
    <Crown key="1" className="h-5 w-5 text-chart-4" />,
    <Medal key="2" className="h-5 w-5 text-muted-foreground" />,
    <Medal key="3" className="h-5 w-5 text-chart-1" />,
  ];

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-chart-4/5 via-background to-primary/5">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-4/10">
            <Trophy className="h-4 w-4 text-chart-4" />
          </div>
          {isAr ? "أفضل المُحيلين" : "Top Referrers"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {!leaderboard?.length ? (
          <div className="text-center py-10">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {isAr ? "كن أول من يتصدر القائمة!" : "Be the first to top the leaderboard!"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {leaderboard.map((entry) => {
              const isCurrentUser = entry.userId === user?.id;
              const name = getDisplayName(entry.profile, isAr);
              const initials = getDisplayInitial(entry.profile, isAr);

              return (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${isCurrentUser ? "bg-primary/5" : "hover:bg-muted/30"}`}
                >
                  {/* Rank */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                    {entry.rank <= 3 ? (
                      rankIcons[entry.rank - 1]
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">{entry.rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={entry.profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {name}
                      {isCurrentUser && (
                        <Badge variant="outline" className="ms-2 text-[9px] py-0">
                          {isAr ? "أنت" : "You"}
                        </Badge>
                      )}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="text-end shrink-0">
                    <p className="text-sm font-bold">{entry.conversions}</p>
                    <p className="text-[9px] text-muted-foreground">{isAr ? "إحالة" : "referrals"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
