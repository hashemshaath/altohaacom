import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, CheckCircle, Clock, Star, AlertTriangle, BarChart3 } from "lucide-react";

interface JudgeDashboardProps {
  onSelectCompetition?: (competitionId: string) => void;
}

export function JudgeDashboard({ onSelectCompetition }: JudgeDashboardProps) {
  const { user } = useAuth();
  const { language } = useLanguage();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["judge-dashboard", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get all judge assignments
      const { data: assignments } = await supabase
        .from("competition_judges")
        .select("competition_id")
        .eq("judge_id", user.id);

      if (!assignments?.length) return { competitions: [], stats: { total: 0, scored: 0, pending: 0, flagged: 0 } };

      const compIds = assignments.map(a => a.competition_id);

      // Get competitions
      const { data: competitions } = await supabase
        .from("competitions")
        .select("*")
        .in("id", compIds)
        .order("competition_start", { ascending: false });

      // Get all registrations for these competitions
      const { data: registrations } = await supabase
        .from("competition_registrations")
        .select("id, competition_id")
        .in("competition_id", compIds)
        .eq("status", "approved");

      // Get all scores by this judge
      const { data: scores } = await supabase
        .from("competition_scores")
        .select("registration_id, flag_status")
        .eq("judge_id", user.id);

      // Get criteria counts per competition
      const { data: criteria } = await supabase
        .from("judging_criteria")
        .select("id, competition_id")
        .in("competition_id", compIds);

      // Calculate per-competition progress
      const compProgress = (competitions || []).map(comp => {
        const compRegs = registrations?.filter(r => r.competition_id === comp.id) || [];
        const compCriteria = criteria?.filter(c => c.competition_id === comp.id) || [];
        const totalScoresNeeded = compRegs.length * compCriteria.length;
        
        const scoredRegistrationIds = new Set<string>();
        const regScoreCounts: Record<string, number> = {};
        
        scores?.forEach(s => {
          if (compRegs.some(r => r.id === s.registration_id)) {
            scoredRegistrationIds.add(s.registration_id);
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
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!dashboardData) return null;

  const { stats, competitions } = dashboardData;

  const statCards = [
    { icon: Trophy, label: language === "ar" ? "إجمالي المشاركين" : "Total Entries", value: stats.total },
    { icon: CheckCircle, label: language === "ar" ? "تم التقييم" : "Scored", value: stats.scored },
    { icon: Clock, label: language === "ar" ? "بانتظار التقييم" : "Pending", value: stats.pending },
    { icon: AlertTriangle, label: language === "ar" ? "مُعلّم" : "Flagged", value: stats.flagged },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {statCards.map((stat, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Competitions Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            {language === "ar" ? "تقدم التقييم" : "Scoring Progress"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {competitions.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">
              {language === "ar" ? "لا توجد مسابقات مسندة إليك" : "No competitions assigned to you"}
            </p>
          ) : (
            competitions.map(comp => (
              <button
                key={comp.id}
                onClick={() => onSelectCompetition?.(comp.id)}
                className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">
                    {language === "ar" && comp.title_ar ? comp.title_ar : comp.title}
                  </h4>
                  <Badge variant={comp.status === "judging" ? "default" : "outline"}>
                    {comp.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  <span>{comp.scoredParticipants} / {comp.totalParticipants} {language === "ar" ? "مشارك" : "scored"}</span>
                </div>
                <Progress value={comp.progress} className="h-2" />
              </button>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
