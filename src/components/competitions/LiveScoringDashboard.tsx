import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Radio, Users, Trophy, Activity, RefreshCw, TrendingUp,
  Timer, BarChart3, Download,
} from "lucide-react";
import { downloadCSV } from "@/lib/exportUtils";

interface Props {
  competitionId: string;
  isOrganizer?: boolean;
}

interface LiveScore {
  participantId: string;
  participantName: string;
  totalScore: number;
  maxPossible: number;
  judgesScored: number;
  totalJudges: number;
  rank: number;
  categoryName: string;
}

export function LiveScoringDashboard({ competitionId, isOrganizer }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch scoring data
  const { data: scores, refetch } = useQuery({
    queryKey: ["live-scores", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_scores")
        .select(`
          id, total_score, judge_id, status,
          competition_registrations!inner(
            id, user_id,
            profiles:user_id(full_name, username),
            competition_categories!inner(id, name, name_ar, max_score)
          )
        `)
        .eq("competition_registrations.competition_id", competitionId);
      if (error) throw error;
      return data as any[];
    },
    refetchInterval: isLive ? 5000 : false,
  });

  const { data: judges } = useQuery({
    queryKey: ["live-judges", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_roles")
        .select("id, user_id")
        .eq("competition_id", competitionId)
        .eq("role", "judge")
        .eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!isLive) return;
    const channel = supabase
      .channel(`live-scoring-${competitionId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "competition_scores",
      }, () => {
        refetch();
        setLastUpdate(new Date());
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [competitionId, isLive, refetch]);

  // Process scores into leaderboard
  const leaderboard = useMemo<LiveScore[]>(() => {
    if (!scores?.length) return [];
    const map = new Map<string, LiveScore>();
    const totalJudges = judges?.length || 1;

    scores.forEach(score => {
      const reg = score.competition_registrations;
      const profile = reg?.profiles;
      const cat = reg?.competition_categories;
      const key = reg?.id;
      if (!key) return;

      if (!map.has(key)) {
        map.set(key, {
          participantId: key,
          participantName: profile?.full_name || profile?.username || "—",
          totalScore: 0,
          maxPossible: cat?.max_score || 100,
          judgesScored: 0,
          totalJudges,
          rank: 0,
          categoryName: isAr ? (cat?.name_ar || cat?.name || "") : (cat?.name || ""),
        });
      }
      const entry = map.get(key)!;
      if (score.status === "submitted") {
        entry.totalScore += Number(score.total_score) || 0;
        entry.judgesScored++;
      }
    });

    const sorted = Array.from(map.values()).sort((a, b) => b.totalScore - a.totalScore);
    sorted.forEach((entry, i) => { entry.rank = i + 1; });
    return sorted;
  }, [scores, judges, isAr]);

  const totalParticipants = leaderboard.length;
  const fullyScoredCount = leaderboard.filter(l => l.judgesScored >= l.totalJudges).length;
  const progressPct = totalParticipants > 0 ? Math.round((fullyScoredCount / totalParticipants) * 100) : 0;

  const handleExport = () => {
    downloadCSV(
      leaderboard.map(l => ({
        rank: l.rank,
        participant: l.participantName,
        category: l.categoryName,
        score: l.totalScore,
        judges_scored: `${l.judgesScored}/${l.totalJudges}`,
      })),
      `live-scores-${competitionId}`,
      [
        { key: "rank", label: isAr ? "المرتبة" : "Rank" },
        { key: "participant", label: isAr ? "المشارك" : "Participant" },
        { key: "category", label: isAr ? "الفئة" : "Category" },
        { key: "score", label: isAr ? "النتيجة" : "Score" },
        { key: "judges_scored", label: isAr ? "الحكام" : "Judges" },
      ]
    );
  };

  return (
    <div className="space-y-4">
      {/* Live Status Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${isLive ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
            <Radio className={`h-3 w-3 ${isLive ? "animate-pulse" : ""}`} />
            {isLive ? (isAr ? "بث مباشر" : "LIVE") : (isAr ? "متوقف" : "PAUSED")}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {isAr ? "آخر تحديث:" : "Last update:"} {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isOrganizer && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleExport}>
              <Download className="me-1 h-3 w-3" /> {isAr ? "تصدير" : "Export"}
            </Button>
          )}
          <Button
            size="sm"
            variant={isLive ? "destructive" : "default"}
            className="h-7 text-xs"
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? (
              <><Timer className="me-1 h-3 w-3" /> {isAr ? "إيقاف" : "Pause"}</>
            ) : (
              <><RefreshCw className="me-1 h-3 w-3" /> {isAr ? "استئناف" : "Resume"}</>
            )}
          </Button>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <Users className="mx-auto mb-1 h-4 w-4 text-primary" />
            <p className="text-lg font-bold">{totalParticipants}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "المشاركين" : "Participants"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <BarChart3 className="mx-auto mb-1 h-4 w-4 text-chart-1" />
            <p className="text-lg font-bold">{judges?.length || 0}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "الحكام" : "Judges"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <Activity className="mx-auto mb-1 h-4 w-4 text-chart-5" />
            <p className="text-lg font-bold">{fullyScoredCount}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "مكتمل التقييم" : "Fully Scored"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <TrendingUp className="mx-auto mb-1 h-4 w-4 text-chart-4" />
            <p className="text-lg font-bold">{progressPct}%</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "التقدم" : "Progress"}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <Progress value={progressPct} className="h-2" />
        <p className="text-[10px] text-muted-foreground mt-1">
          {fullyScoredCount}/{totalParticipants} {isAr ? "مشارك تم تقييمه بالكامل" : "participants fully scored"}
        </p>
      </div>

      {/* Leaderboard */}
      {!leaderboard.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">{isAr ? "لا توجد نتائج بعد" : "No scores yet"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr ? "ستظهر النتائج هنا فور بدء الحكام بالتقييم" : "Scores will appear here once judges begin evaluating"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {leaderboard.map(entry => {
            const scorePct = entry.maxPossible > 0 ? Math.round((entry.totalScore / (entry.maxPossible * entry.totalJudges)) * 100) : 0;
            const medalColor = entry.rank === 1 ? "text-chart-4" : entry.rank === 2 ? "text-muted-foreground" : entry.rank === 3 ? "text-chart-3" : "";
            return (
              <Card key={entry.participantId} className="border-border/40">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-sm ${entry.rank <= 3 ? "bg-chart-4/10" : "bg-muted"} ${medalColor}`}>
                    {entry.rank <= 3 ? (
                      <Trophy className="h-4 w-4" />
                    ) : (
                      entry.rank
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{entry.participantName}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{entry.categoryName}</span>
                      <span>·</span>
                      <span>{entry.judgesScored}/{entry.totalJudges} {isAr ? "حكم" : "judges"}</span>
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="text-lg font-bold">{entry.totalScore}</p>
                    <p className="text-[10px] text-muted-foreground">{scorePct}%</p>
                  </div>
                  {entry.judgesScored >= entry.totalJudges && (
                    <Badge variant="outline" className="text-[9px] h-4 border-chart-5/40 text-chart-5 shrink-0">
                      ✓ {isAr ? "مكتمل" : "Complete"}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
