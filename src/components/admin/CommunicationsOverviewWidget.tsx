import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, Bell, Ticket, Mail, Send, CheckCircle, AlertCircle, Clock, Zap, Users } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export const CommunicationsOverviewWidget = memo(function CommunicationsOverviewWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["communications-overview-widget"],
    queryFn: async () => {
      const dayAgo = new Date(Date.now() - 86400000).toISOString();
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

      const [
        { count: totalNotifs },
        { count: unreadNotifs },
        { count: notifsToday },
        { count: totalTickets },
        { count: openTickets },
        { count: urgentTickets },
        { count: ticketsThisWeek },
        { data: queueStats },
        { count: totalMessages },
        { count: messagesToday },
        { count: activeSessions },
        { count: totalTemplates },
      ] = await Promise.all([
        supabase.from("notifications").select("*", { count: "exact", head: true }),
        supabase.from("notifications").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("notifications").select("*", { count: "exact", head: true }).gte("created_at", dayAgo),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("priority", "urgent"),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("notification_queue").select("status").limit(500),
        supabase.from("messages").select("*", { count: "exact", head: true }),
        supabase.from("messages").select("*", { count: "exact", head: true }).gte("created_at", dayAgo),
        supabase.from("chat_sessions").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("communication_templates").select("*", { count: "exact", head: true }).eq("is_active", true),
      ]);

      // Queue distribution
      const queuePending = queueStats?.filter(q => q.status === "pending").length || 0;
      const queueSent = queueStats?.filter(q => q.status === "sent").length || 0;
      const queueFailed = queueStats?.filter(q => q.status === "failed").length || 0;
      const deliveryRate = (queueSent + queueFailed) > 0 ? Math.round((queueSent / (queueSent + queueFailed)) * 100) : 100;

      return {
        totalNotifs: totalNotifs || 0,
        unreadNotifs: unreadNotifs || 0,
        notifsToday: notifsToday || 0,
        totalTickets: totalTickets || 0,
        openTickets: openTickets || 0,
        urgentTickets: urgentTickets || 0,
        ticketsThisWeek: ticketsThisWeek || 0,
        queuePending, queueSent, queueFailed,
        deliveryRate,
        totalMessages: totalMessages || 0,
        messagesToday: messagesToday || 0,
        activeSessions: activeSessions || 0,
        totalTemplates: totalTemplates || 0,
      };
    },
    staleTime: 30000,
  });

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-chart-3" />
          {isAr ? "نظرة عامة على التواصل" : "Communications Overview"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        {/* Main stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { icon: Bell, label: isAr ? "الإشعارات" : "Notifications", value: data.totalNotifs, sub: `${data.notifsToday} ${isAr ? "اليوم" : "today"}`, color: "text-chart-4" },
            { icon: Ticket, label: isAr ? "التذاكر" : "Tickets", value: data.totalTickets, sub: `${data.openTickets} ${isAr ? "مفتوح" : "open"}`, color: "text-chart-3" },
            { icon: Mail, label: isAr ? "الرسائل" : "Messages", value: data.totalMessages, sub: `${data.messagesToday} ${isAr ? "اليوم" : "today"}`, color: "text-primary" },
            { icon: Zap, label: isAr ? "القوالب" : "Templates", value: data.totalTemplates, sub: `${data.activeSessions} ${isAr ? "جلسة نشطة" : "active chats"}`, color: "text-chart-1" },
          ].map((m, i) => (
            <div key={i} className="p-2 rounded-xl bg-muted/30 border border-border/40">
              <div className="flex items-center gap-1.5 mb-1">
                <m.icon className={`h-3 w-3 ${m.color}`} />
                <span className="text-[9px] text-muted-foreground">{m.label}</span>
              </div>
              <p className="text-sm font-bold"><AnimatedCounter value={m.value} /></p>
              <p className="text-[8px] text-muted-foreground">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Delivery rate */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">{isAr ? "معدل التوصيل" : "Delivery Rate"}</span>
            <span className="text-[10px] font-medium">{data.deliveryRate}%</span>
          </div>
          <Progress value={data.deliveryRate} className="h-1.5" />
        </div>

        {/* Status indicators */}
        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className="flex items-center gap-1 text-chart-4"><Clock className="h-3 w-3" /> {data.unreadNotifs} {isAr ? "غير مقروء" : "unread"}</span>
          <span className="flex items-center gap-1 text-chart-2"><CheckCircle className="h-3 w-3" /> {data.queueSent} {isAr ? "مُرسل" : "sent"}</span>
          {data.queueFailed > 0 && (
            <span className="flex items-center gap-1 text-destructive"><AlertCircle className="h-3 w-3" /> {data.queueFailed} {isAr ? "فشل" : "failed"}</span>
          )}
          {data.urgentTickets > 0 && (
            <span className="flex items-center gap-1 text-destructive font-medium"><AlertCircle className="h-3 w-3" /> {data.urgentTickets} {isAr ? "عاجل" : "urgent"}</span>
          )}
          <span className="flex items-center gap-1 text-chart-3"><Send className="h-3 w-3" /> {data.queuePending} {isAr ? "قيد الانتظار" : "queued"}</span>
        </div>
      </CardContent>
    </Card>
  );
});
