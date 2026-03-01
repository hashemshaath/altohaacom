import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Activity, Trophy, Clock, Users, ArrowRight, Flame } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface LiveCompetition {
  id: string;
  title: string;
  title_ar: string | null;
  status: string;
  competition_start: string | null;
  competition_end: string | null;
  max_participants: number | null;
  registration_count: number;
  user_registered: boolean;
}

export function LiveCompetitionsWidget() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";

  const { data: competitions = [], isLoading } = useQuery({
    queryKey: ["live-competitions-widget", user?.id],
    queryFn: async () => {
      // Get active/upcoming competitions
      const { data: comps, error } = await supabase
        .from("competitions")
        .select("id, title, title_ar, status, competition_start, competition_end, max_participants")
        .in("status", ["upcoming", "registration_open", "in_progress", "judging"])
        .order("competition_start", { ascending: true })
        .limit(5);

      if (error) throw error;
      if (!comps?.length) return [];

      // Get registration counts
      const compIds = comps.map(c => c.id);
      const { data: regCounts } = await supabase
        .from("competition_registrations")
        .select("competition_id")
        .in("competition_id", compIds);

      // Check user registrations
      let userRegs: string[] = [];
      if (user) {
        const { data: ur } = await supabase
          .from("competition_registrations")
          .select("competition_id")
          .eq("participant_id", user.id)
          .in("competition_id", compIds);
        userRegs = (ur || []).map(r => r.competition_id);
      }

      const countMap: Record<string, number> = {};
      (regCounts || []).forEach(r => {
        countMap[r.competition_id] = (countMap[r.competition_id] || 0) + 1;
      });

      return comps.map(c => ({
        ...c,
        registration_count: countMap[c.id] || 0,
        user_registered: userRegs.includes(c.id),
      })) as LiveCompetition[];
    },
    staleTime: 60000,
  });

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; labelAr: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      registration_open: { label: "Open", labelAr: "مفتوح", variant: "default" },
      published: { label: "Upcoming", labelAr: "قريباً", variant: "secondary" },
      active: { label: "Live", labelAr: "مباشر", variant: "destructive" },
      judging: { label: "Judging", labelAr: "تحكيم", variant: "outline" },
    };
    const s = map[status] || { label: status, labelAr: status, variant: "secondary" as const };
    return (
      <Badge variant={s.variant} className="text-[9px] px-1.5 py-0">
        {status === "active" && <Flame className="h-2.5 w-2.5 me-0.5" />}
        {isAr ? s.labelAr : s.label}
      </Badge>
    );
  };

  if (isLoading || competitions.length === 0) return null;

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          {isAr ? "المسابقات النشطة" : "Live Competitions"}
          <Badge variant="secondary" className="text-[9px] px-1.5 ms-auto">
            {competitions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {competitions.map(comp => {
          const title = isAr ? (comp.title_ar || comp.title) : comp.title;
          const fillPercent = comp.max_participants
            ? Math.min(Math.round((comp.registration_count / comp.max_participants) * 100), 100)
            : 0;
          const timeStr = comp.competition_start
            ? formatDistanceToNow(new Date(comp.competition_start), { addSuffix: true, locale: isAr ? ar : enUS })
            : "";

          return (
            <div key={comp.id} className="group rounded-xl border border-border/30 p-3 transition-colors hover:bg-muted/30">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{title}</p>
                  {timeStr && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {timeStr}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {comp.user_registered && (
                    <Badge variant="outline" className="text-[8px] px-1 py-0 border-primary/30 text-primary">
                      {isAr ? "مسجل" : "Joined"}
                    </Badge>
                  )}
                  {getStatusBadge(comp.status)}
                </div>
              </div>

              {comp.max_participants && comp.max_participants > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-2.5 w-2.5" />
                      {comp.registration_count}/{comp.max_participants}
                    </span>
                    <span>{fillPercent}%</span>
                  </div>
                  <Progress value={fillPercent} className="h-1" />
                </div>
              )}

              <Button variant="ghost" size="sm" className="w-full mt-2 h-7 text-[10px] gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                <Link to={`/competitions/${comp.id}`}>
                  {isAr ? "عرض التفاصيل" : "View Details"}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
