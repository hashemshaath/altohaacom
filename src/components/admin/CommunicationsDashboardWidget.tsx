import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Bell, Mail, Ticket, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CommStats {
  unreadNotifications: number;
  openTickets: number;
  activeSessions: number;
  pendingMessages: number;
  recentTemplates: { id: string; name: string; type: string }[];
}

export function CommunicationsDashboardWidget() {
  const [stats, setStats] = useState<CommStats>({
    unreadNotifications: 0,
    openTickets: 0,
    activeSessions: 0,
    pendingMessages: 0,
    recentTemplates: [],
  });

  useEffect(() => {
    const fetch = async () => {
      const [notifRes, ticketRes, chatRes, templateRes] = await Promise.all([
        supabase.from("notifications").select("id", { count: "exact", head: true }).eq("is_read", false),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
        supabase.from("chat_sessions").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("communication_templates").select("id, name, channel").order("updated_at", { ascending: false }).limit(5),
      ]);

      setStats({
        unreadNotifications: notifRes.count || 0,
        openTickets: ticketRes.count || 0,
        activeSessions: chatRes.count || 0,
        pendingMessages: 0,
        recentTemplates: (templateRes.data || []).map((t: any) => ({ id: t.id, name: t.name, type: t.channel || "email" })),
      });
    };
    fetch();
  }, []);

  const kpis = [
    { icon: Bell, label: "Unread Notifications", value: stats.unreadNotifications, color: "text-amber-500" },
    { icon: Ticket, label: "Open Tickets", value: stats.openTickets, color: "text-red-500" },
    { icon: MessageSquare, label: "Active Chats", value: stats.activeSessions, color: "text-emerald-500" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Communications Hub
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="text-center p-2.5 rounded-lg bg-muted/50">
              <kpi.icon className={`h-4 w-4 mx-auto mb-1 ${kpi.color}`} />
              <p className="text-lg font-bold">{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{kpi.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="w-full h-8">
            <TabsTrigger value="templates" className="text-xs flex-1">Templates</TabsTrigger>
            <TabsTrigger value="insights" className="text-xs flex-1">Insights</TabsTrigger>
          </TabsList>
          <TabsContent value="templates" className="mt-2 space-y-1.5">
            {stats.recentTemplates.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No templates yet</p>
            ) : (
              stats.recentTemplates.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs truncate max-w-[180px]">{t.name}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{t.type}</Badge>
                </div>
              ))
            )}
          </TabsContent>
          <TabsContent value="insights" className="mt-2">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs font-medium">Response Performance</p>
                <p className="text-[10px] text-muted-foreground">
                  {stats.openTickets > 10 ? "⚠️ High ticket backlog" : "✅ Tickets under control"}
                  {" • "}
                  {stats.activeSessions > 5 ? "⚠️ Many active chats" : "✅ Chat load normal"}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
