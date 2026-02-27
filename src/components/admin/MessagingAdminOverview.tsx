import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Ticket, Bell, TrendingUp, Users, Clock } from "lucide-react";

export function MessagingAdminOverview() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["messaging-admin-overview"],
    queryFn: async () => {
      // Chat stats
      const { count: totalChats } = await supabase
        .from("chat_sessions")
        .select("*", { count: "exact", head: true });

      const { count: activeChats } = await supabase
        .from("chat_sessions")
        .select("*", { count: "exact", head: true })
        .in("status", ["active", "waiting"]);

      // Group chats
      const { count: totalGroups } = await supabase
        .from("chat_groups")
        .select("*", { count: "exact", head: true });

      // Support tickets
      const { count: openTickets } = await supabase
        .from("support_tickets")
        .select("*", { count: "exact", head: true })
        .in("status", ["open", "in_progress"]);

      const { count: urgentTickets } = await supabase
        .from("support_tickets")
        .select("*", { count: "exact", head: true })
        .eq("priority", "urgent")
        .not("status", "in", '("resolved","closed")');

      // Notifications
      const { count: unreadNotifs } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);

      // Messages today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count: messagesToday } = await supabase
        .from("chat_session_messages")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart.toISOString());

      return {
        totalChats: totalChats || 0,
        activeChats: activeChats || 0,
        totalGroups: totalGroups || 0,
        openTickets: openTickets || 0,
        urgentTickets: urgentTickets || 0,
        unreadNotifs: unreadNotifs || 0,
        messagesToday: messagesToday || 0,
      };
    },
    staleTime: 30000,
    refetchInterval: 30000,
  });

  if (!data) return null;

  const cards = [
    { icon: MessageSquare, label: isAr ? "جلسات نشطة" : "Active Chats", value: data.activeChats, total: data.totalChats, color: "text-primary", bg: "bg-primary/10" },
    { icon: Users, label: isAr ? "المجموعات" : "Groups", value: data.totalGroups, color: "text-chart-3", bg: "bg-chart-3/10" },
    { icon: Ticket, label: isAr ? "تذاكر مفتوحة" : "Open Tickets", value: data.openTickets, color: "text-chart-4", bg: "bg-chart-4/10", alert: data.urgentTickets > 0 },
    { icon: Bell, label: isAr ? "إشعارات غير مقروءة" : "Unread Notifications", value: data.unreadNotifs, color: "text-chart-1", bg: "bg-chart-1/10" },
    { icon: TrendingUp, label: isAr ? "رسائل اليوم" : "Messages Today", value: data.messagesToday, color: "text-chart-2", bg: "bg-chart-2/10" },
    { icon: Clock, label: isAr ? "عاجل" : "Urgent Tickets", value: data.urgentTickets, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c, i) => (
        <Card key={i} className={c.alert ? "border-destructive/40" : ""}>
          <CardContent className="p-3 flex items-center gap-2.5">
            <div className={`rounded-lg p-2 ${c.bg}`}>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold leading-none">{c.value}</p>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{c.label}</p>
              {"total" in c && c.total ? (
                <p className="text-[9px] text-muted-foreground">/ {c.total} {isAr ? "إجمالي" : "total"}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
