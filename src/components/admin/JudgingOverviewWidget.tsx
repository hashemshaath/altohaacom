import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/i18n/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Gavel, Users, CheckCircle, Clock, Trophy, Star } from "lucide-react";

export const JudgingOverviewWidget = memo(function JudgingOverviewWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-judging-overview"],
    queryFn: async () => {
      const [judgesRes, regsRes, competitionsRes, roundsRes] = await Promise.all([
        supabase.from("competition_roles").select("id, competition_id, user_id, role, status").eq("role", "judge"),
        supabase.from("competition_registrations").select("id, competition_id, status"),
        supabase.from("competitions").select("id, title, title_ar, status, max_participants").in("status", ["judging", "in_progress"]),
        supabase.from("competition_rounds").select("id, competition_id, round_number, name, name_ar, status"),
      ]);

      const judges = judgesRes.data || [];
      const regs = regsRes.data || [];
      const activeComps = competitionsRes.data || [];
      const rounds = roundsRes.data || [];

      // Per-competition judging stats
      const compStats = activeComps.map(comp => {
        const compJudges = judges.filter(j => j.competition_id === comp.id && j.status === "active");
        const compRegs = regs.filter(r => r.competition_id === comp.id && r.status === "approved");
        const compRounds = rounds.filter(r => r.competition_id === comp.id);
        const maxP = comp.max_participants || compRegs.length || 0;
        const scored = compRegs.length;
        const progress = maxP > 0 ? Math.round((scored / maxP) * 100) : 0;

        return {
          id: comp.id,
          title: isAr ? comp.title_ar || comp.title : comp.title,
          status: comp.status,
          judgeCount: compJudges.length,
          scoredCount: scored,
          maxParticipants: maxP,
          progress: Math.min(progress, 100),
          roundCount: compRounds.length,
          activeRound: compRounds.find(r => r.status === "active"),
        };
      });

      return {
        totalJudges: new Set(judges.filter(j => j.status === "active").map(j => j.user_id)).size,
        totalScores: regs.filter(r => r.status === "approved").length,
        activeCompetitions: activeComps.length,
        compStats,
      };
    },
    staleTime: 1000 * 60 * 3,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Gavel className="h-4 w-4 text-chart-4" />
          {isAr ? "نظرة عامة على التحكيم" : "Judging Overview"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-xl bg-muted/50">
            <Users className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">{data?.totalJudges || 0}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "محكمين نشطين" : "Active Judges"}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-muted/50">
            <Star className="h-4 w-4 mx-auto text-chart-4 mb-1" />
            <p className="text-lg font-bold">{data?.totalScores || 0}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "تقييمات" : "Scores Given"}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-muted/50">
            <Trophy className="h-4 w-4 mx-auto text-chart-3 mb-1" />
            <p className="text-lg font-bold">{data?.activeCompetitions || 0}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "مسابقات نشطة" : "Active Comps"}</p>
          </div>
        </div>

        {/* Per-competition progress */}
        {data?.compStats && data.compStats.length > 0 ? (
          <div className="space-y-3">
            {data.compStats.slice(0, 5).map(comp => (
              <div key={comp.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium truncate max-w-[60%]">{comp.title}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {comp.judgeCount} {isAr ? "محكم" : "judges"}
                    </Badge>
                    {comp.activeRound && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-chart-3/10 text-chart-3">
                        <Clock className="h-2.5 w-2.5 me-0.5" />
                        {isAr ? comp.activeRound.name_ar || comp.activeRound.name : comp.activeRound.name}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={comp.progress} className="h-1.5 flex-1" />
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {comp.scoredCount}/{comp.maxParticipants}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">
            {isAr ? "لا توجد مسابقات نشطة في مرحلة التحكيم" : "No active competitions in judging phase"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
