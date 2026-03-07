import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, CheckCircle, Clock, AlertTriangle, BarChart3, Scale, ArrowRight } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface JudgeDashboardProps {
  onSelectCompetition?: (competitionId: string) => void;
}

export function JudgeDashboard({ onSelectCompetition }: JudgeDashboardProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["judge-dashboard", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: assignments } = await supabase
        .from("competition_judges")
        .select("competition_id")
        .eq("judge_id", user.id);

      if (!assignments?.length) return { competitions: [], stats: { total: 0, scored: 0, pending: 0, flagged: 0 } };

      const compIds = assignments.map(a => a.competition_id);

      const { data: competitions } = await supabase
        .from("competitions")
        .select("id, title, title_ar, status, competition_start, venue, cover_image_url")
        .in("id", compIds)
        .order("competition_start", { ascending: false });

      const { data: registrations } = await supabase
        .from("competition_registrations")
        .select("id, competition_id")
        .in("competition_id", compIds)
        .eq("status", "approved");

      const { data: scores } = await supabase
        .from("competition_scores")
        .select("registration_id, flag_status")
        .eq("judge_id", user.id);

      const { data: criteria } = await supabase
        .from("judging_criteria")
        .select("id, competition_id")
        .in("competition_id", compIds);

      const compProgress = (competitions || []).map(comp => {
        const compRegs = registrations?.filter(r => r.competition_id === comp.id) || [];
        const compCriteria = criteria?.filter(c => c.competition_id === comp.id) || [];
        const totalScoresNeeded = compRegs.length * compCriteria.length;
        
        const regScoreCounts: Record<string, number> = {};
        
        scores?.forEach(s => {
          if (compRegs.some(r => r.id === s.registration_id)) {
            regScoreCounts[s.registration_id] = (regScoreCounts[s.registration_id] || 0) + 1;
          }
        });

        const fullyScored = Object.values(regScoreCounts).filter(c => c >= compCriteria.length).length;
        const progress = totalScoresNeeded > 0 
          ? Math.round((Object.values(regScoreCounts).reduce((s, c) => s + c, 0) / totalScoresNeeded) * 100) 
          : 0;

        return {
          ...comp,
          totalParticipants: compRegs.length,
          scoredParticipants: fullyScored,
          progress,
        };
      });

      const totalRegs = registrations?.length || 0;
      const scoredRegIds = new Set(scores?.map(s => s.registration_id) || []);
      const flaggedCount = scores?.filter(s => s.flag_status)?.length || 0;

      return {
        competitions: compProgress,
        stats: {
          total: totalRegs,
          scored: scoredRegIds.size,
          pending: totalRegs - scoredRegIds.size,
          flagged: flaggedCount,
        },
      };
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="flex items-center gap-3.5 p-4">
                <Skeleton className="h-11 w-11 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-10" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!dashboardData) return null;

  const { stats, competitions } = dashboardData;

  const statCards = [
    { icon: Trophy, label: isAr ? "إجمالي المشاركين" : "Total Entries", value: stats.total, bg: "bg-primary/10", color: "text-primary", accent: "border-primary/30" },
    { icon: CheckCircle, label: isAr ? "تم التقييم" : "Scored", value: stats.scored, bg: "bg-chart-5/10", color: "text-chart-5", accent: "border-chart-5/30" },
    { icon: Clock, label: isAr ? "بانتظار التقييم" : "Pending", value: stats.pending, bg: "bg-chart-4/10", color: "text-chart-4", accent: "border-chart-4/30" },
    { icon: AlertTriangle, label: isAr ? "مُعلّم" : "Flagged", value: stats.flagged, bg: "bg-destructive/10", color: "text-destructive", accent: "border-destructive/30" },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <Card key={i} className={`border-s-[3px] ${stat.accent} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
            <CardContent className="flex items-center gap-3.5 p-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.bg} transition-transform group-hover:scale-110`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none tracking-tight"><AnimatedCounter value={stat.value} /></p>
                <p className="mt-1.5 text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall Progress Summary */}
      {competitions.length > 0 && (
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-chart-5/10">
              <Scale className="h-5 w-5 text-chart-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium">{isAr ? "التقدم الإجمالي" : "Overall Progress"}</span>
                <span className="text-sm font-bold text-primary">
                  {stats.total > 0 ? Math.round((stats.scored / stats.total) * 100) : 0}%
                </span>
              </div>
              <Progress value={stats.total > 0 ? (stats.scored / stats.total) * 100 : 0} className="h-2.5" />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {stats.scored}/{stats.total} {isAr ? "تم تقييمهم" : "entries scored"} · {competitions.length} {isAr ? "مسابقة" : "competitions"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competitions Progress */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "تقدم التقييم" : "Scoring Progress"}
          </h3>
          <Badge variant="secondary" className="text-[10px]">
            {competitions.length} {isAr ? "مسابقة" : "competitions"}
          </Badge>
        </div>
        <CardContent className="p-4">
          {competitions.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Scale className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">
                {isAr ? "لا توجد مسابقات مسندة إليك" : "No competitions assigned to you"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {competitions.map(comp => {
                const statusColors: Record<string, string> = {
                  judging: "bg-chart-4/10 text-chart-4",
                  in_progress: "bg-primary/10 text-primary",
                  completed: "bg-chart-5/10 text-chart-5",
                };
                const statusClass = statusColors[comp.status] || "bg-muted text-muted-foreground";

                return (
                  <button
                    key={comp.id}
                    onClick={() => onSelectCompetition?.(comp.id)}
                    className="group w-full rounded-xl border bg-card p-4 text-start transition-all hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                        {isAr && comp.title_ar ? comp.title_ar : comp.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] border-0 ${statusClass}`}>
                          {comp.status.replace("_", " ")}
                        </Badge>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <Progress value={comp.progress} className="h-2 flex-1" />
                      <span className="text-xs font-medium text-muted-foreground shrink-0 min-w-[3rem] text-end">
                        {comp.progress}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-chart-5" />
                      <span>{comp.scoredParticipants} / {comp.totalParticipants} {isAr ? "مشارك تم تقييمه" : "participants scored"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
