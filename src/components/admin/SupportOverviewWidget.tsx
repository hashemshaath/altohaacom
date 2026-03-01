import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Ticket, Clock, CheckCircle, AlertTriangle, MessageSquare, ThumbsUp, Timer } from "lucide-react";

export function SupportOverviewWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["support-overview-widget"],
    queryFn: async () => {
      const [{ data: tickets }, { data: sessions }] = await Promise.all([
        supabase.from("support_tickets").select("status, priority, created_at, resolved_at").limit(500),
        supabase.from("chat_sessions").select("status, rating, created_at").limit(500),
      ]);

      const total = tickets?.length || 0;
      const open = tickets?.filter(t => t.status === "open" || t.status === "in_progress").length || 0;
      const resolved = tickets?.filter(t => t.status === "resolved" || t.status === "closed").length || 0;
      const urgent = tickets?.filter(t => t.priority === "urgent" || t.priority === "high").length || 0;

      // Avg resolution time (hours)
      const resolvedTickets = tickets?.filter(t => t.resolved_at && t.created_at) || [];
      const avgResolutionHrs = resolvedTickets.length > 0
        ? Math.round(resolvedTickets.reduce((s, t) => s + (new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime()), 0) / resolvedTickets.length / 3600000)
        : 0;

      const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

      // Chat sessions
      const totalSessions = sessions?.length || 0;
      const avgRating = sessions?.filter(s => s.rating).reduce((s, sess) => s + (sess.rating || 0), 0);
      const ratedCount = sessions?.filter(s => s.rating).length || 0;
      const satisfaction = ratedCount > 0 ? (avgRating! / ratedCount).toFixed(1) : "—";

      return {
        total, open, resolved, urgent, avgResolutionHrs, resolutionRate,
        totalSessions, satisfaction, ratedCount,
      };
    },
    staleTime: 60000,
  });

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Ticket className="h-4 w-4 text-chart-3" />
            {isAr ? "نظرة عامة على الدعم" : "Support Overview"}
          </CardTitle>
          {data.urgent > 0 && (
            <Badge variant="destructive" className="text-[9px]">{data.urgent} {isAr ? "عاجل" : "urgent"}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { icon: Ticket, label: isAr ? "التذاكر" : "Tickets", value: data.total, sub: `${data.open} ${isAr ? "مفتوحة" : "open"}`, color: "text-chart-1" },
            { icon: CheckCircle, label: isAr ? "محلولة" : "Resolved", value: data.resolved, color: "text-chart-2" },
            { icon: Timer, label: isAr ? "متوسط الحل" : "Avg Resolution", value: `${data.avgResolutionHrs}h`, color: "text-chart-4" },
            { icon: ThumbsUp, label: isAr ? "الرضا" : "Satisfaction", value: data.satisfaction, sub: `${data.ratedCount} ${isAr ? "تقييم" : "ratings"}`, color: "text-primary" },
          ].map((m, i) => (
            <div key={i} className="p-2 rounded-xl bg-muted/30 border border-border/40 group transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
              <div className="flex items-center gap-1.5 mb-1">
                <m.icon className={`h-3 w-3 ${m.color} transition-transform duration-300 group-hover:scale-110`} />
                <span className="text-[9px] text-muted-foreground">{m.label}</span>
              </div>
              <p className="text-sm font-bold">{m.value}</p>
              {m.sub && <p className="text-[8px] text-muted-foreground">{m.sub}</p>}
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">{isAr ? "معدل الحل" : "Resolution Rate"}</span>
            <span className="text-[10px] font-medium">{data.resolutionRate}%</span>
          </div>
          <Progress value={data.resolutionRate} className="h-1.5" />
        </div>

        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className="flex items-center gap-1 text-chart-3"><MessageSquare className="h-3 w-3" /> {data.totalSessions} {isAr ? "محادثة" : "chat sessions"}</span>
          {data.urgent > 0 && (
            <span className="flex items-center gap-1 text-destructive"><AlertTriangle className="h-3 w-3" /> {data.urgent} {isAr ? "عاجل/مرتفع" : "urgent/high"}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
