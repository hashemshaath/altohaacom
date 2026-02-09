import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Scale, CheckCircle2, Star, ClipboardList, User } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface JudgesListProps {
  competitionId: string;
}

export function JudgesList({ competitionId }: JudgesListProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: judges, isLoading } = useQuery({
    queryKey: ["competition-judges-list", competitionId],
    queryFn: async () => {
      const { data: assignments, error } = await supabase
        .from("competition_judges")
        .select("id, judge_id, assigned_at")
        .eq("competition_id", competitionId);

      if (error) throw error;
      if (!assignments || assignments.length === 0) return [];

      const judgeIds = assignments.map((a) => a.judge_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, avatar_url, specialization, is_verified")
        .in("user_id", judgeIds);

      // Get score counts per judge
      const { data: regIds } = await supabase
        .from("competition_registrations")
        .select("id")
        .eq("competition_id", competitionId)
        .eq("status", "approved");

      let scoreCounts = new Map<string, number>();
      if (regIds && regIds.length > 0) {
        const { data: scores } = await supabase
          .from("competition_scores")
          .select("judge_id")
          .in("registration_id", regIds.map((r) => r.id));

        scores?.forEach((s) => {
          scoreCounts.set(s.judge_id, (scoreCounts.get(s.judge_id) || 0) + 1);
        });
      }

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return assignments.map((assignment) => ({
        ...assignment,
        profile: profileMap.get(assignment.judge_id),
        scoresGiven: scoreCounts.get(assignment.judge_id) || 0,
      }));
    },
    enabled: !!competitionId,
  });

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/30 px-4 py-3">
          <Skeleton className="h-5 w-28" />
        </div>
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!judges || judges.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b bg-muted/30 px-4 py-3">
        <h3 className="flex items-center gap-2 font-semibold text-sm">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-4/10">
            <Scale className="h-3.5 w-3.5 text-chart-4" />
          </div>
          {isAr ? "لجنة التحكيم" : "Judges Panel"}
          <Badge variant="secondary" className="ms-1">{judges.length}</Badge>
        </h3>
      </div>
      <CardContent className="p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {judges.map((judge) => (
            <Link
              key={judge.id}
              to={`/${judge.profile?.username || judge.judge_id}`}
              className="group flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/30 transition-colors"
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={judge.profile?.avatar_url || undefined} />
                <AvatarFallback className="text-sm">
                  {(judge.profile?.full_name || "J")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium truncate group-hover:underline">
                    {judge.profile?.full_name || "Judge"}
                  </span>
                  {judge.profile?.is_verified && (
                    <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                  )}
                </div>
                {judge.profile?.specialization && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {judge.profile.specialization}
                  </p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  {judge.profile?.username && (
                    <span className="text-[10px] text-muted-foreground">@{judge.profile.username}</span>
                  )}
                  {judge.scoresGiven > 0 && (
                    <Badge variant="outline" className="text-[9px] h-4 px-1 gap-0.5">
                      <ClipboardList className="h-2.5 w-2.5" />
                      {judge.scoresGiven} {isAr ? "تقييم" : "scores"}
                    </Badge>
                  )}
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] h-5 shrink-0 gap-0.5">
                <Scale className="h-2.5 w-2.5" />
                {isAr ? "حكم" : "Judge"}
              </Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
