import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Ticket,
  Headphones,
  Target,
  UserSearch,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  Activity,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export default function CRMDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  // Ticket stats
  const { data: ticketStats } = useQuery({
    queryKey: ["crmTicketStats"],
    queryFn: async () => {
      const { data: all } = await supabase.from("support_tickets").select("id, status, priority, created_at");
      const tickets = all || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return {
        total: tickets.length,
        open: tickets.filter(t => t.status === "open").length,
        inProgress: tickets.filter(t => t.status === "in_progress").length,
        resolved: tickets.filter(t => t.status === "resolved" || t.status === "closed").length,
        urgent: tickets.filter(t => t.priority === "urgent" && t.status !== "closed").length,
        today: tickets.filter(t => new Date(t.created_at) >= today).length,
      };
    },
  });

  // Chat stats
  const { data: chatStats } = useQuery({
    queryKey: ["crmChatStats"],
    queryFn: async () => {
      const { data } = await supabase.from("chat_sessions").select("id, status, rating");
      const sessions = data || [];
      const ratings = sessions.filter(s => s.rating).map(s => s.rating!);
      return {
        total: sessions.length,
        waiting: sessions.filter(s => s.status === "waiting").length,
        active: sessions.filter(s => s.status === "active").length,
        closed: sessions.filter(s => s.status === "closed").length,
        avgRating: ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "N/A",
      };
    },
  });

  // Segment stats
  const { data: segmentStats } = useQuery({
    queryKey: ["crmSegmentStats"],
    queryFn: async () => {
      const { data } = await supabase.from("audience_segments").select("id, estimated_reach, is_active");
      const segments = data || [];
      return {
        total: segments.length,
        active: segments.filter(s => s.is_active).length,
        totalReach: segments.reduce((sum, s) => sum + (s.estimated_reach || 0), 0),
      };
    },
  });

  // Recent tickets
  const { data: recentTickets = [] } = useQuery({
    queryKey: ["crmRecentTickets"],
    queryFn: async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      return data || [];
    },
  });

  // Profiles for recent tickets
  const ticketUserIds = [...new Set(recentTickets.map(t => t.user_id))];
  const { data: profiles = [] } = useQuery({
    queryKey: ["crmTicketProfiles", ticketUserIds.join(",")],
    queryFn: async () => {
      if (ticketUserIds.length === 0) return [];
      const { data } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", ticketUserIds);
      return data || [];
    },
    enabled: ticketUserIds.length > 0,
  });
  const profileMap = new Map(profiles.map(p => [p.user_id, p]));

  // Waiting chats
  const { data: waitingChats = [] } = useQuery({
    queryKey: ["crmWaitingChats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("chat_sessions")
        .select("*")
        .in("status", ["waiting", "active"])
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const chatUserIds = [...new Set(waitingChats.map(c => c.user_id))];
  const { data: chatProfiles = [] } = useQuery({
    queryKey: ["crmChatProfiles", chatUserIds.join(",")],
    queryFn: async () => {
      if (chatUserIds.length === 0) return [];
      const { data } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", chatUserIds);
      return data || [];
    },
    enabled: chatUserIds.length > 0,
  });
  const chatProfileMap = new Map(chatProfiles.map(p => [p.user_id, p]));

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      open: "bg-chart-4/10 text-chart-4",
      in_progress: "bg-primary/10 text-primary",
      waiting: "bg-chart-3/10 text-chart-3",
      resolved: "bg-chart-5/10 text-chart-5",
      closed: "bg-muted text-muted-foreground",
      active: "bg-primary/10 text-primary",
    };
    return map[status] || "bg-muted text-muted-foreground";
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, { en: string; ar: string }> = {
      open: { en: "Open", ar: "مفتوحة" },
      in_progress: { en: "In Progress", ar: "قيد المعالجة" },
      waiting: { en: "Waiting", ar: "في الانتظار" },
      resolved: { en: "Resolved", ar: "محلولة" },
      closed: { en: "Closed", ar: "مغلقة" },
      active: { en: "Active", ar: "نشطة" },
    };
    const s = map[status] || { en: status, ar: status };
    return isAr ? s.ar : s.en;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold sm:text-2xl">
            {isAr ? "لوحة إدارة العلاقات" : "CRM Overview"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isAr ? "نظرة شاملة على الدعم والتواصل والاستهداف" : "Unified view of support, communication & targeting"}
          </p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-s-4 border-s-chart-4">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-full bg-chart-4/10 p-2.5">
              <Ticket className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "تذاكر مفتوحة" : "Open Tickets"}</p>
              <p className="text-2xl font-bold">{ticketStats?.open ?? "—"}</p>
              {ticketStats?.urgent ? (
                <p className="text-[10px] text-destructive font-medium">
                  {ticketStats.urgent} {isAr ? "عاجلة" : "urgent"}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="border-s-4 border-s-primary">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-full bg-primary/10 p-2.5">
              <Headphones className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "محادثات نشطة" : "Active Chats"}</p>
              <p className="text-2xl font-bold">{(chatStats?.waiting ?? 0) + (chatStats?.active ?? 0)}</p>
              {chatStats?.waiting ? (
                <p className="text-[10px] text-chart-4 font-medium">
                  {chatStats.waiting} {isAr ? "في الانتظار" : "waiting"}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="border-s-4 border-s-chart-5">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-full bg-chart-5/10 p-2.5">
              <Target className="h-5 w-5 text-chart-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "شرائح الجمهور" : "Segments"}</p>
              <p className="text-2xl font-bold">{segmentStats?.total ?? "—"}</p>
              <p className="text-[10px] text-muted-foreground">
                {(segmentStats?.totalReach ?? 0).toLocaleString()} {isAr ? "مستخدم" : "reach"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-s-4 border-s-chart-3">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-full bg-chart-3/10 p-2.5">
              <CheckCircle2 className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "تم الحل" : "Resolved"}</p>
              <p className="text-2xl font-bold">{ticketStats?.resolved ?? "—"}</p>
              <p className="text-[10px] text-muted-foreground">
                {isAr ? "اليوم" : "today"}: {ticketStats?.today ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { to: "/admin/support-tickets", icon: Ticket, label: isAr ? "إدارة التذاكر" : "Manage Tickets", color: "text-chart-4" },
          { to: "/admin/live-chat", icon: Headphones, label: isAr ? "الدعم المباشر" : "Live Chat", color: "text-primary" },
          { to: "/admin/audience-segments", icon: Target, label: isAr ? "شرائح الجمهور" : "Segments", color: "text-chart-5" },
          { to: "/admin/leads", icon: UserSearch, label: isAr ? "العملاء المحتملين" : "Leads", color: "text-chart-3" },
        ].map(action => (
          <Button key={action.to} variant="outline" asChild className="h-auto py-3 flex-col gap-2">
            <Link to={action.to}>
              <action.icon className={`h-5 w-5 ${action.color}`} />
              <span className="text-xs">{action.label}</span>
            </Link>
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tickets */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Ticket className="h-4 w-4 text-chart-4" />
              {isAr ? "أحدث التذاكر" : "Recent Tickets"}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
              <Link to="/admin/support-tickets">
                {isAr ? "عرض الكل" : "View All"}
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[400px]">
              <div className="divide-y">
                {recentTickets.map(ticket => {
                  const profile = profileMap.get(ticket.user_id);
                  return (
                    <Link
                      key={ticket.id}
                      to="/admin/support-tickets"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {(profile?.full_name || "U")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ticket.subject}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                            {ticket.ticket_number}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(ticket.created_at), {
                              addSuffix: true,
                              locale: isAr ? ar : enUS,
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className={`text-[9px] ${getStatusColor(ticket.status)}`}>
                          {getStatusLabel(ticket.status)}
                        </Badge>
                        {ticket.priority === "urgent" && (
                          <Badge variant="destructive" className="text-[9px]">
                            {isAr ? "عاجل" : "Urgent"}
                          </Badge>
                        )}
                      </div>
                    </Link>
                  );
                })}
                {recentTickets.length === 0 && (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Ticket className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">{isAr ? "لا توجد تذاكر" : "No tickets yet"}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Active Chats */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Headphones className="h-4 w-4 text-primary" />
              {isAr ? "المحادثات النشطة" : "Active Chats"}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
              <Link to="/admin/live-chat">
                {isAr ? "عرض الكل" : "View All"}
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[400px]">
              <div className="divide-y">
                {waitingChats.map(chat => {
                  const profile = chatProfileMap.get(chat.user_id);
                  return (
                    <Link
                      key={chat.id}
                      to="/admin/live-chat"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
                    >
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {(profile?.full_name || "U")[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute bottom-0 end-0 h-2.5 w-2.5 rounded-full border-2 border-card ${
                          chat.status === "waiting" ? "bg-chart-4" : "bg-primary"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {profile?.full_name || "Unknown"}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {chat.subject}
                        </p>
                      </div>
                      <Badge variant="outline" className={`text-[9px] ${getStatusColor(chat.status)}`}>
                        {getStatusLabel(chat.status)}
                      </Badge>
                    </Link>
                  );
                })}
                {waitingChats.length === 0 && (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Headphones className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">{isAr ? "لا توجد محادثات نشطة" : "No active chats"}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            {isAr ? "ملخص الأداء" : "Performance Summary"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              {
                label: isAr ? "إجمالي التذاكر" : "Total Tickets",
                value: ticketStats?.total ?? "—",
                icon: Ticket,
                color: "text-chart-4",
              },
              {
                label: isAr ? "إجمالي المحادثات" : "Total Chats",
                value: chatStats?.total ?? "—",
                icon: MessageSquare,
                color: "text-primary",
              },
              {
                label: isAr ? "متوسط التقييم" : "Avg. Rating",
                value: chatStats?.avgRating ?? "—",
                icon: TrendingUp,
                color: "text-chart-5",
              },
              {
                label: isAr ? "الشرائح النشطة" : "Active Segments",
                value: segmentStats?.active ?? "—",
                icon: Target,
                color: "text-chart-3",
              },
              {
                label: isAr ? "الوصول الكلي" : "Total Reach",
                value: (segmentStats?.totalReach ?? 0).toLocaleString(),
                icon: Users,
                color: "text-chart-1",
              },
            ].map(item => (
              <div key={item.label} className="text-center rounded-lg border p-3">
                <item.icon className={`mx-auto h-5 w-5 ${item.color} mb-1`} />
                <p className="text-xl font-bold">{item.value}</p>
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
