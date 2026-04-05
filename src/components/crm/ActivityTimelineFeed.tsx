import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Rss, Ticket, MessageSquare, UserSearch, Bell, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface TimelineItem {
  id: string;
  type: "ticket" | "chat" | "lead" | "notification" | "broadcast";
  title: string;
  subtitle: string;
  timestamp: string;
  status?: string;
}

export const ActivityTimelineFeed = memo(function ActivityTimelineFeed() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: timeline = [] } = useQuery({
    queryKey: ["crmActivityTimeline"],
    queryFn: async () => {
      const items: TimelineItem[] = [];

      const [ticketRes, chatRes, leadRes, notifRes] = await Promise.all([
        supabase.from("support_tickets").select("id, subject, subject_ar, status, created_at, ticket_number").order("created_at", { ascending: false }).limit(10),
        supabase.from("chat_sessions").select("id, subject, subject_ar, status, created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("leads").select("id, contact_name, status, type, created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("notifications").select("id, title, title_ar, type, created_at, channel").order("created_at", { ascending: false }).limit(10),
      ]);

      (ticketRes.data || []).forEach(t => items.push({
        id: `ticket-${t.id}`,
        type: "ticket",
        title: (isAr ? t.subject_ar : t.subject) || t.subject || "Ticket",
        subtitle: t.ticket_number || "",
        timestamp: t.created_at,
        status: t.status,
      }));

      (chatRes.data || []).forEach(c => items.push({
        id: `chat-${c.id}`,
        type: "chat",
        title: (isAr ? c.subject_ar : c.subject) || c.subject || (isAr ? "محادثة" : "Chat Session"),
        subtitle: isAr ? "محادثة مباشرة" : "Live Chat",
        timestamp: c.created_at,
        status: c.status,
      }));

      (leadRes.data || []).forEach(l => items.push({
        id: `lead-${l.id}`,
        type: "lead",
        title: l.contact_name || (isAr ? "عميل محتمل" : "Lead"),
        subtitle: l.type || "",
        timestamp: l.created_at,
        status: l.status,
      }));

      (notifRes.data || []).forEach(n => items.push({
        id: `notif-${n.id}`,
        type: n.channel === "email" ? "broadcast" : "notification",
        title: (isAr ? n.title_ar : n.title) || n.title || "",
        subtitle: n.type || "",
        timestamp: n.created_at,
      }));

      return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 25);
    },
    staleTime: 30000,
  });

  const typeConfig: Record<string, { icon: typeof Ticket; color: string; bg: string; label: string; labelAr: string }> = {
    ticket: { icon: Ticket, color: "text-chart-4", bg: "bg-chart-4/10", label: "Ticket", labelAr: "تذكرة" },
    chat: { icon: MessageSquare, color: "text-primary", bg: "bg-primary/10", label: "Chat", labelAr: "محادثة" },
    lead: { icon: UserSearch, color: "text-chart-5", bg: "bg-chart-5/10", label: "Lead", labelAr: "عميل محتمل" },
    notification: { icon: Bell, color: "text-chart-3", bg: "bg-chart-3/10", label: "Notification", labelAr: "إشعار" },
    broadcast: { icon: Send, color: "text-chart-1", bg: "bg-chart-1/10", label: "Broadcast", labelAr: "بث" },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Rss className="h-4 w-4 text-primary" />
          {isAr ? "آخر النشاطات" : "Activity Timeline"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          <div className="relative ps-8 pe-4 pb-4">
            {/* Timeline line */}
            <div className="absolute start-[18px] top-0 bottom-0 w-px bg-border" />

            {timeline.map((item, i) => {
              const config = typeConfig[item.type] || typeConfig.notification;
              const Icon = config.icon;
              return (
                <div key={item.id} className="relative pb-4 last:pb-0">
                  {/* Dot */}
                  <div className={`absolute start-[-22px] top-1 flex h-6 w-6 items-center justify-center rounded-full ${config.bg} ring-2 ring-background`}>
                    <Icon className={`h-3 w-3 ${config.color}`} />
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className={`text-[8px] px-1 py-0 ${config.bg} ${config.color}`}>
                          {isAr ? config.labelAr : config.label}
                        </Badge>
                        {item.subtitle && (
                          <span className="text-[10px] text-muted-foreground truncate">{item.subtitle}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(item.timestamp), {
                        addSuffix: true,
                        locale: isAr ? ar : enUS,
                      })}
                    </span>
                  </div>
                </div>
              );
            })}

            {timeline.length === 0 && (
              <div className="text-center py-8">
                <Rss className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">{isAr ? "لا توجد نشاطات" : "No recent activity"}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});
