import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, Trophy, Award, Newspaper } from "lucide-react";
import { format } from "date-fns";

interface Props {
  entityId: string;
  entityName: string;
}

export function EntityNotificationsCard({ entityId, entityName }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: recentActivity } = useQuery({
    queryKey: ["entity-recent-activity", entityId],
    queryFn: async () => {
      // Get recent events, competitions, and programs as "activity"
      const [eventsRes, compsRes, progsRes] = await Promise.all([
        supabase
          .from("entity_events")
          .select("id, title, title_ar, start_date, event_type")
          .eq("entity_id", entityId)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("entity_competition_participations")
          .select("id, competition_id, role, created_at, competitions:competition_id(title, title_ar)")
          .eq("entity_id", entityId)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("entity_programs")
          .select("id, name, name_ar, start_date, created_at")
          .eq("entity_id", entityId)
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      const activities: { type: string; title: string; date: string; icon: typeof Bell }[] = [];

      (eventsRes.data || []).forEach(e => {
        activities.push({
          type: isAr ? "فعالية" : "Event",
          title: isAr && e.title_ar ? e.title_ar : e.title,
          date: e.start_date || "",
          icon: Calendar,
        });
      });

      (compsRes.data || []).forEach((c: any) => {
        const comp = c.competitions;
        activities.push({
          type: isAr ? "مسابقة" : "Competition",
          title: comp ? (isAr && comp.title_ar ? comp.title_ar : comp.title) : "Competition",
          date: c.created_at,
          icon: Trophy,
        });
      });

      (progsRes.data || []).forEach(p => {
        activities.push({
          type: isAr ? "برنامج" : "Program",
          title: isAr && p.name_ar ? p.name_ar : p.name,
          date: p.start_date || p.created_at,
          icon: Award,
        });
      });

      // Sort by date descending
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return activities.slice(0, 5);
    },
    staleTime: 1000 * 60 * 5,
  });

  if (!recentActivity?.length) return null;

  return (
    <Card className="overflow-hidden">
      <div className="border-b bg-muted/30 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-chart-4/10">
            <Bell className="h-3.5 w-3.5 text-chart-4" />
          </div>
          {isAr ? "آخر الأنشطة" : "Recent Activity"}
          <Badge variant="secondary" className="ms-auto text-[9px] h-4">{recentActivity.length}</Badge>
        </h3>
      </div>
      <CardContent className="p-0">
        {recentActivity.map((activity, i) => {
          const Icon = activity.icon;
          return (
            <div
              key={i}
              className="flex items-start gap-3 border-b last:border-0 px-4 py-3 transition-colors hover:bg-muted/20"
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-muted/50">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{activity.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[9px] h-4">{activity.type}</Badge>
                  {activity.date && (
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(activity.date), "MMM d, yyyy")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
