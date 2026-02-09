import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface CompetitionHistoryProps {
  userId: string;
}

export function CompetitionHistory({ userId }: CompetitionHistoryProps) {
  const { t, language } = useLanguage();

  const { data: registrations, isLoading } = useQuery({
    queryKey: ["user-competition-history", userId],
    queryFn: async () => {
      // Get all registrations for this user
      const { data: regs, error } = await supabase
        .from("competition_registrations")
        .select(`
          id,
          status,
          registered_at,
          competition_id,
          category_id
        `)
        .eq("participant_id", userId)
        .order("registered_at", { ascending: false });

      if (error) throw error;
      if (!regs || regs.length === 0) return [];

      // Get competition details
      const competitionIds = [...new Set(regs.map(r => r.competition_id))];
      const { data: competitions } = await supabase
        .from("competitions")
        .select("id, title, title_ar, status, competition_start, cover_image_url")
        .in("id", competitionIds);

      // Get scores for completed competitions
      const registrationIds = regs.map(r => r.id);
      const { data: scores } = await supabase
        .from("competition_scores")
        .select("registration_id, score, criteria_id")
        .in("registration_id", registrationIds);

      // Calculate rankings
      const competitionMap = new Map(competitions?.map(c => [c.id, c]) || []);
      
      return regs.map(reg => {
        const competition = competitionMap.get(reg.competition_id);
        const regScores = scores?.filter(s => s.registration_id === reg.id) || [];
        const totalScore = regScores.reduce((sum, s) => sum + Number(s.score), 0);
        
        return {
          ...reg,
          competition,
          totalScore: regScores.length > 0 ? totalScore : null,
          hasScores: regScores.length > 0,
        };
      }).filter(r => r.competition);
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!registrations || registrations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {language === "ar" ? "سجل المسابقات" : "Competition History"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            {language === "ar" ? "لا توجد مسابقات سابقة" : "No competition history yet"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-muted text-muted-foreground",
      approved: "bg-primary/20 text-primary",
      rejected: "bg-destructive/20 text-destructive",
      withdrawn: "bg-muted text-muted-foreground",
    };
    return colors[status] || colors.pending;
  };

  const getCompetitionStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: "bg-chart-5/20 text-chart-5",
      in_progress: "bg-chart-3/20 text-chart-3",
      judging: "bg-chart-4/20 text-chart-4",
      upcoming: "bg-accent/20 text-accent",
    };
    return colors[status] || "bg-muted text-muted-foreground";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          {language === "ar" ? "سجل المسابقات" : "Competition History"}
          <Badge variant="secondary" className="ml-2">
            {registrations.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {registrations.map((reg) => (
          <Link
            key={reg.id}
            to={`/competitions/${reg.competition_id}`}
            className="block"
          >
            <div className="flex gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
              {/* Competition Image */}
              <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                {reg.competition?.cover_image_url ? (
                  <img
                    src={reg.competition.cover_image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-primary/40" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">
                  {language === "ar" && reg.competition?.title_ar 
                    ? reg.competition.title_ar 
                    : reg.competition?.title}
                </h4>
                
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {reg.competition?.competition_start && 
                      format(new Date(reg.competition.competition_start), "MMM yyyy")}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge className={getCompetitionStatusBadge(reg.competition?.status || "")}>
                    {reg.competition?.status?.replace("_", " ")}
                  </Badge>
                  
                  {reg.status === "approved" && reg.competition?.status === "completed" && reg.hasScores && (
                    <Badge variant="outline" className="gap-1">
                      <Award className="h-3 w-3" />
                      {language === "ar" ? "النتيجة:" : "Score:"} {reg.totalScore?.toFixed(1)}
                    </Badge>
                  )}
                  
                  {reg.status !== "approved" && (
                    <Badge className={getStatusBadge(reg.status)}>
                      {reg.status}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
