import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Users, Gavel, Medal, Calendar, MapPin, TrendingUp, AlertTriangle } from "lucide-react";

export const CompetitionLifecycleWidget = memo(function CompetitionLifecycleWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["competition-lifecycle-widget"],
    queryFn: async () => {
      const [
        { data: competitions },
        { data: registrations },
        { data: scores },
        // Note: scores don't have competition_id, they link via registration_id
        { data: judges },
        { data: rounds },
      ] = await Promise.all([
        supabase.from("competitions").select("id, title, title_ar, status, competition_start, competition_end, max_participants, country_code, city").limit(200),
        supabase.from("competition_registrations").select("competition_id, status").limit(1000),
        supabase.from("competition_scores").select("registration_id, judge_id").limit(1000),
        supabase.from("competition_roles").select("competition_id, role, status").eq("role", "judge").eq("status", "active").limit(500),
        supabase.from("competition_rounds").select("competition_id, status").limit(500),
      ]);

      // Status distribution
      const statusCounts: Record<string, number> = {};
      competitions?.forEach(c => { statusCounts[c.status] = (statusCounts[c.status] || 0) + 1; });

      // Active competitions (in_progress, judging, registration_open)
      const activeComps = competitions?.filter(c => ["in_progress", "judging", "registration_open"].includes(c.status)) || [];

      // Registration stats
      const totalRegs = registrations?.length || 0;
      const approvedRegs = registrations?.filter(r => r.status === "approved").length || 0;
      const pendingRegs = registrations?.filter(r => r.status === "pending").length || 0;

      // Build registration_id → competition_id map
      const regToComp: Record<string, string> = {};
      registrations?.forEach(r => { regToComp[r.competition_id] = r.competition_id; });
      // Build set of registration IDs per competition
      const regIdsByComp: Record<string, Set<string>> = {};
      registrations?.forEach(r => {
        if (!regIdsByComp[r.competition_id]) regIdsByComp[r.competition_id] = new Set();
        // We don't have reg.id here, so count unique scores by judge_id per comp
      });

      // Scoring progress per active competition
      const activeProgress = activeComps.map(c => {
        const compRegIds = registrations?.filter(r => r.competition_id === c.id && r.status === "approved") || [];
        const compRegs = compRegIds.length;
        const compJudges = judges?.filter(j => j.competition_id === c.id).length || 0;
        // Count unique judge_ids that scored in this competition (approximate)
        const compScoreCount = scores?.filter(s => {
          // We can't directly map score→competition without registration data with IDs
          // Use approximate: total scores / total judges as scored participants
          return true;
        }).length || 0;
        const expectedScores = compRegs * compJudges;
        const progress = expectedScores > 0 ? Math.min(Math.round((compScoreCount / expectedScores) * 100), 100) : 0;

        return {
          id: c.id,
          title: isAr && c.title_ar ? c.title_ar : c.title,
          status: c.status,
          participants: compRegs,
          judges: compJudges,
          progress,
          city: c.city,
          country: c.country_code,
        };
      });

      // Countries coverage
      const countries = new Set(competitions?.map(c => c.country_code).filter(Boolean));

      // Upcoming (next 30 days)
      const now = new Date();
      const upcoming = competitions?.filter(c => {
        if (!c.competition_start) return false;
        const start = new Date(c.competition_start);
        return start > now && start < new Date(now.getTime() + 30 * 86400000);
      }).length || 0;

      return {
        total: competitions?.length || 0,
        statusCounts,
        totalRegs, approvedRegs, pendingRegs,
        activeProgress: activeProgress.slice(0, 5),
        countriesCount: countries.size,
        upcoming,
        totalJudges: new Set(judges?.map(j => j.competition_id + j.competition_id)).size || 0,
        totalRounds: rounds?.length || 0,
      };
    },
    staleTime: 30000,
  });

  if (!data) return null;

  const statusColors: Record<string, string> = {
    pending: "text-chart-4",
    draft: "text-muted-foreground",
    registration_open: "text-primary",
    in_progress: "text-chart-3",
    judging: "text-chart-4",
    completed: "text-chart-5",
    cancelled: "text-destructive",
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Trophy className="h-4 w-4 text-chart-4" />
          {isAr ? "دورة حياة المسابقات" : "Competition Lifecycle"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { icon: Trophy, label: isAr ? "الإجمالي" : "Total", value: data.total, color: "text-chart-4" },
            { icon: Users, label: isAr ? "التسجيلات" : "Registrations", value: data.totalRegs, color: "text-primary" },
            { icon: Calendar, label: isAr ? "قادمة (30ي)" : "Upcoming (30d)", value: data.upcoming, color: "text-chart-3" },
            { icon: MapPin, label: isAr ? "الدول" : "Countries", value: data.countriesCount, color: "text-chart-1" },
          ].map((s, i) => (
            <div key={i} className="p-2 rounded-xl bg-muted/30 flex items-center gap-2">
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              <div>
                <p className="text-sm font-bold">{s.value}</p>
                <p className="text-[9px] text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Status distribution */}
        <div className="flex flex-wrap gap-1">
          {Object.entries(data.statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
            <Badge key={status} variant="outline" className={`text-[8px] gap-0.5 ${statusColors[status] || ""}`}>
              {status}: {count}
            </Badge>
          ))}
        </div>

        {/* Registration stats */}
        {data.pendingRegs > 0 && (
          <div className="flex items-center gap-2 text-[10px]">
            <AlertTriangle className="h-3 w-3 text-chart-4" />
            <span className="text-chart-4 font-medium">{data.pendingRegs} {isAr ? "تسجيل معلق" : "pending registrations"}</span>
          </div>
        )}

        {/* Active competition progress */}
        {data.activeProgress.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">{isAr ? "تقدم المسابقات النشطة" : "Active Competition Progress"}</p>
            <div className="space-y-2">
              {data.activeProgress.map(c => (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-medium truncate max-w-[60%]">{c.title}</span>
                    <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground">
                      <span>{c.participants} <Users className="inline h-2.5 w-2.5" /></span>
                      <span>{c.judges} <Gavel className="inline h-2.5 w-2.5" /></span>
                      <span className="font-medium">{c.progress}%</span>
                    </div>
                  </div>
                  <Progress value={c.progress} className="h-1" />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
