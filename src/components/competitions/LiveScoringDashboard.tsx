import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Radio, Users, Trophy, Activity, RefreshCw, TrendingUp,
  Timer, BarChart3, Download, Medal, Award,
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

  useEffect(() => {
    if (!isLive) return;
    const channel = supabase
      .channel(`live-scoring-${competitionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "competition_scores" }, () => {
        refetch();
        setLastUpdate(new Date());
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [competitionId, isLive, refetch]);

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

  const medalIcons = [
    { icon: Trophy, bg: "bg-chart-4/10 text-chart-4 ring-chart-4/20" },
    { icon: Medal, bg: "bg-muted/60 text-muted-foreground ring-border/30" },
    { icon: Award, bg: "bg-chart-3/10 text-chart-3 ring-chart-3/20" },
  ];

  return (
    <div className="space-y-5">
      {/* Live Status Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${isLive ? "bg-destructive/10 text-destructive ring-1 ring-destructive/20" : "bg-muted text-muted-foreground ring-1 ring-border/30"}`}>
            <Radio className={`h-3 w-3 ${isLive ? "animate-pulse" : ""}`} />
            {isLive ? (isAr ? "بث مباشر" : "LIVE") : (isAr ? "متوقف" : "PAUSED")}
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">
            {isAr ? "آخر تحديث:" : "Updated:"} {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isOrganizer && (
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-xl font-semibold" onClick={handleExport}>
              <Download className="me-1.5 h-3 w-3" /> {isAr ? "تصدير" : "Export"}
            </Button>
          )}
          <Button
            size="sm"
            variant={isLive ? "destructive" : "default"}
            className="h-8 text-xs rounded-xl font-semibold"
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? (
              <><Timer className="me-1.5 h-3 w-3" /> {isAr ? "إيقاف" : "Pause"}</>
            ) : (
              <><RefreshCw className="me-1.5 h-3 w-3" /> {isAr ? "استئناف" : "Resume"}</>
            )}
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { icon: Users, value: totalParticipants, label: isAr ? "المشاركين" : "Participants", color: "text-primary", bg: "bg-primary/8" },
          { icon: BarChart3, value: judges?.length || 0, label: isAr ? "الحكام" : "Judges", color: "text-chart-1", bg: "bg-chart-1/8" },
          { icon: Activity, value: fullyScoredCount, label: isAr ? "مكتمل" : "Scored", color: "text-chart-5", bg: "bg-chart-5/8" },
          { icon: TrendingUp, value: `${progressPct}%`, label: isAr ? "التقدم" : "Progress", color: "text-chart-4", bg: "bg-chart-4/8" },
        ].map(({ icon: Icon, value, label, color, bg }) => (
          <div key={label} className={`rounded-xl ${bg} p-3 sm:p-4 text-center transition-all hover:scale-[1.02]`}>
            <Icon className={`mx-auto mb-1.5 h-4 w-4 ${color}`} />
            <p className="text-xl sm:text-2xl font-bold tabular-nums">{value}</p>
            <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <Progress value={progressPct} className="h-2.5 rounded-full" />
        <p className="text-[10px] text-muted-foreground font-medium">
          {fullyScoredCount}/{totalParticipants} {isAr ? "مشارك تم تقييمه بالكامل" : "participants fully scored"}
        </p>
      </div>

      {/* Leaderboard */}
      {!leaderboard.length ? (
        <div className="rounded-2xl border border-border/30 bg-muted/10 py-14 text-center">
          <Trophy className="mx-auto mb-3 h-14 w-14 text-muted-foreground/15" />
          <p className="font-semibold text-muted-foreground">{isAr ? "لا توجد نتائج بعد" : "No scores yet"}</p>
          <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs mx-auto">
            {isAr ? "ستظهر النتائج هنا فور بدء الحكام بالتقييم" : "Scores will appear here once judges begin evaluating"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map(entry => {
            const scorePct = entry.maxPossible > 0 ? Math.round((entry.totalScore / (entry.maxPossible * entry.totalJudges)) * 100) : 0;
            const isTopThree = entry.rank <= 3;
            const medal = isTopThree ? medalIcons[entry.rank - 1] : null;

            return (
              <div
                key={entry.participantId}
                className={`flex items-center gap-3 rounded-xl border p-3 sm:p-4 transition-all ${
                  isTopThree ? "border-primary/15 bg-primary/[0.02]" : "border-border/30 bg-card"
                }`}
              >
                {/* Rank */}
                <div className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm ${
                  medal ? `${medal.bg} ring-1` : "bg-muted/60 text-muted-foreground"
                }`}>
                  {medal ? <medal.icon className="h-4 w-4" /> : entry.rank}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{entry.participantName}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                    <span className="truncate">{entry.categoryName}</span>
                    <span className="shrink-0">·</span>
                    <span className="shrink-0">{entry.judgesScored}/{entry.totalJudges} {isAr ? "حكم" : "judges"}</span>
                  </div>
                </div>

                {/* Score */}
                <div className="text-end shrink-0">
                  <p className={`text-lg sm:text-xl font-bold tabular-nums ${isTopThree ? "text-primary" : ""}`}>{entry.totalScore}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{scorePct}%</p>
                </div>

                {entry.judgesScored >= entry.totalJudges && (
                  <Badge variant="outline" className="text-[9px] h-5 border-chart-5/30 text-chart-5 shrink-0 rounded-xl hidden sm:flex">
                    ✓ {isAr ? "مكتمل" : "Done"}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
