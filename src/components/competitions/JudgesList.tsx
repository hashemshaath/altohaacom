import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Scale, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

interface JudgesListProps {
  competitionId: string;
}

export function JudgesList({ competitionId }: JudgesListProps) {
  const { language } = useLanguage();

  const { data: judges, isLoading } = useQuery({
    queryKey: ["competition-judges-list", competitionId],
    queryFn: async () => {
      // Get assigned judges
      const { data: assignments, error } = await supabase
        .from("competition_judges")
        .select("id, judge_id, assigned_at")
        .eq("competition_id", competitionId);

      if (error) throw error;
      if (!assignments || assignments.length === 0) return [];

      // Get judge profiles
      const judgeIds = assignments.map(a => a.judge_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, avatar_url, specialization, is_verified")
        .in("user_id", judgeIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return assignments.map(assignment => ({
        ...assignment,
        profile: profileMap.get(assignment.judge_id),
      }));
    },
    enabled: !!competitionId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-28" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-32" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!judges || judges.length === 0) {
    return null; // Don't show section if no judges
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          {language === "ar" ? "لجنة التحكيم" : "Judges Panel"}
          <Badge variant="secondary" className="ml-2">
            {judges.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {judges.map((judge) => (
            <Link
              key={judge.id}
              to={`/${judge.profile?.username || judge.judge_id}`}
              className="flex items-center gap-2 p-2 pr-4 rounded-full border hover:bg-accent/50 transition-colors"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={judge.profile?.avatar_url || undefined} />
                <AvatarFallback className="text-sm">
                  {(judge.profile?.full_name || "J")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">
                  {judge.profile?.full_name || "Judge"}
                </span>
                {judge.profile?.is_verified && (
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
