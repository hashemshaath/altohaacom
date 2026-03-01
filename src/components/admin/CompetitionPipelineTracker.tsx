import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/i18n/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Users, Gavel, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function CompetitionPipelineTracker() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["competition-pipeline"],
    queryFn: async () => {
      const [comps, regs] = await Promise.all([
        supabase.from("competitions").select("id, status, title, title_ar, competition_start, max_participants"),
        supabase.from("competition_registrations").select("competition_id, status"),
      ]);

      const competitions = comps.data || [];
      const registrations = regs.data || [];

      const pipeline = {
        pending: competitions.filter(c => c.status === "pending").length,
        registration: competitions.filter(c => c.status === "registration_open").length,
        inProgress: competitions.filter(c => c.status === "in_progress").length,
        judging: competitions.filter(c => c.status === "judging").length,
        completed: competitions.filter(c => c.status === "completed").length,
        totalRegistrations: registrations.length,
        approvedRegistrations: registrations.filter(r => r.status === "approved").length,
        pendingRegistrations: registrations.filter(r => r.status === "pending").length,
        totalScores: 0,
      };

      // Top 5 competitions by registration
      const regCounts: Record<string, number> = {};
      registrations.forEach(r => {
        regCounts[r.competition_id] = (regCounts[r.competition_id] || 0) + 1;
      });

      const topComps = competitions
        .map(c => ({ ...c, regCount: regCounts[c.id] || 0 }))
        .sort((a, b) => b.regCount - a.regCount)
        .slice(0, 5);

      return { pipeline, topComps };
    },
    staleTime: 1000 * 60 * 3,
  });

  const stages = [
    { label: isAr ? "معلقة" : "Pending", value: data?.pipeline.pending || 0, color: "bg-chart-4" },
    { label: isAr ? "التسجيل" : "Registration", value: data?.pipeline.registration || 0, color: "bg-primary" },
    { label: isAr ? "جارية" : "In Progress", value: data?.pipeline.inProgress || 0, color: "bg-chart-3" },
    { label: isAr ? "التحكيم" : "Judging", value: data?.pipeline.judging || 0, color: "bg-chart-5" },
    { label: isAr ? "مكتملة" : "Completed", value: data?.pipeline.completed || 0, color: "bg-chart-2" },
  ];

  const total = stages.reduce((s, st) => s + st.value, 0);

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          {isAr ? "خط سير المسابقات" : "Competition Pipeline"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pipeline bar */}
        <div className="flex h-3 rounded-full overflow-hidden bg-muted">
          {stages.map((stage) => (
            stage.value > 0 && (
              <div
                key={stage.label}
                className={cn("h-full transition-all", stage.color)}
                style={{ width: `${(stage.value / Math.max(total, 1)) * 100}%` }}
                title={`${stage.label}: ${stage.value}`}
              />
            )
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {stages.map((stage) => (
            <div key={stage.label} className="flex items-center gap-1.5 text-xs">
              <span className={cn("w-2 h-2 rounded-full", stage.color)} />
              <span className="text-muted-foreground">{stage.label}</span>
              <span className="font-bold">{stage.value}</span>
            </div>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-xl bg-muted/50">
            <Users className="h-3.5 w-3.5 mx-auto mb-0.5 text-primary" />
            <p className="text-sm font-bold">{data?.pipeline.totalRegistrations || 0}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "تسجيلات" : "Registrations"}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-muted/50">
            <CheckCircle className="h-3.5 w-3.5 mx-auto mb-0.5 text-chart-2" />
            <p className="text-sm font-bold">{data?.pipeline.approvedRegistrations || 0}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "معتمدة" : "Approved"}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-muted/50">
            <Gavel className="h-3.5 w-3.5 mx-auto mb-0.5 text-chart-5" />
            <p className="text-sm font-bold">{data?.pipeline.totalScores || 0}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "تقييمات" : "Scores"}</p>
          </div>
        </div>

        {/* Top competitions */}
        {data?.topComps && data.topComps.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              {isAr ? "الأكثر تسجيلاً" : "Most Registered"}
            </p>
            {data.topComps.map((comp) => (
              <div key={comp.id} className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                <span className="text-xs truncate max-w-[200px]">
                  {isAr && comp.title_ar ? comp.title_ar : comp.title}
                </span>
                <div className="flex items-center gap-2">
                  <Progress
                    value={comp.max_participants ? (comp.regCount / comp.max_participants) * 100 : 50}
                    className="w-16 h-1.5"
                  />
                  <Badge variant="outline" className="text-[10px]">
                    {comp.regCount}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
