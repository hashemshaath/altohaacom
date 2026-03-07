import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVisibleRefetchInterval } from "@/hooks/useVisibleRefetchInterval";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gavel, Users, CheckCircle, Clock, AlertCircle } from "lucide-react";

export const CompetitionJudgingTracker = memo(function CompetitionJudgingTracker() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["competition-judging-tracker"],
    queryFn: async () => {
      // Active competitions in judging phase
      const { data: judgingComps } = await supabase
        .from("competitions")
        .select("id, title, title_ar, status, max_participants")
        .in("status", ["judging", "in_progress"])
        .limit(10);

      if (!judgingComps || judgingComps.length === 0) return { competitions: [] };

      const compIds = judgingComps.map(c => c.id);

      // Get registration counts
      const { data: regs } = await supabase
        .from("competition_registrations")
        .select("id, competition_id, status")
        .in("competition_id", compIds)
        .eq("status", "approved");

      // Build registration-to-competition map
      const regToComp: Record<string, string> = {};
      regs?.forEach(r => { regToComp[r.id] = r.competition_id; });

      const regIds = regs?.map(r => r.id) || [];

      // Get scores via registration_id (no competition_id on scores table)
      let scoreCounts: Record<string, Set<string>> = {};
      if (regIds.length > 0) {
        const { data: scores } = await supabase
          .from("competition_scores")
          .select("judge_id, registration_id")
          .in("registration_id", regIds.slice(0, 500));

        scores?.forEach((s: any) => {
          const compId = regToComp[s.registration_id];
          if (!compId) return;
          if (!scoreCounts[compId]) scoreCounts[compId] = new Set();
          scoreCounts[compId].add(`${s.judge_id}-${s.registration_id}`);
        });
      }

      // Get judges
      const { data: roles } = await supabase
        .from("competition_roles")
        .select("competition_id, user_id")
        .in("competition_id", compIds)
        .eq("role", "judge")
        .eq("status", "active");

      const regCounts: Record<string, number> = {};
      regs?.forEach(r => { regCounts[r.competition_id] = (regCounts[r.competition_id] || 0) + 1; });

      const judgeCounts: Record<string, number> = {};
      roles?.forEach(r => { judgeCounts[r.competition_id] = (judgeCounts[r.competition_id] || 0) + 1; });

      const competitions = judgingComps.map(c => {
        const participants = regCounts[c.id] || 0;
        const judges = judgeCounts[c.id] || 0;
        const totalExpected = participants * judges;
        const scored = scoreCounts[c.id]?.size || 0;
        const progress = totalExpected > 0 ? Math.round((scored / totalExpected) * 100) : 0;

        return {
          id: c.id,
          title: isAr ? c.title_ar || c.title : c.title,
          status: c.status,
          participants,
          judges,
          scored,
          totalExpected,
          progress,
        };
      });

      return { competitions };
    },
    staleTime: 60000,
    refetchInterval: useVisibleRefetchInterval(60000),
  });

  if (!data || data.competitions.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Gavel className="h-4 w-4 text-chart-4" />
          {isAr ? "تقدم التحكيم المباشر" : "Live Judging Progress"}
          <Badge variant="secondary" className="text-[9px]">{data.competitions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        {data.competitions.map(c => (
          <div key={c.id} className="space-y-1.5 p-2.5 rounded-xl bg-muted/30 border border-border/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium truncate max-w-[200px]">{c.title}</span>
              <Badge variant={c.status === "judging" ? "default" : "outline"} className="text-[9px]">
                {c.status === "judging" ? (isAr ? "تحكيم" : "Judging") : (isAr ? "جارية" : "Active")}
              </Badge>
            </div>
            <Progress value={c.progress} className="h-1.5" />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> {c.participants}
                </span>
                <span className="flex items-center gap-1">
                  <Gavel className="h-3 w-3" /> {c.judges}
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> {c.scored}/{c.totalExpected}
                </span>
              </div>
              <span className={`font-bold ${c.progress >= 100 ? "text-chart-2" : c.progress >= 50 ? "text-chart-4" : "text-destructive"}`}>
                {c.progress}%
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
});
