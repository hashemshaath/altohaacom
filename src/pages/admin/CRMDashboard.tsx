import { useState, useMemo } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { CRMLiveStatsWidget } from "@/components/admin/CRMLiveStatsWidget";
import { useQuery } from "@tanstack/react-query";
import { BehaviorAnalytics } from "@/components/crm/BehaviorAnalytics";
import { CustomerHealthScores } from "@/components/crm/CustomerHealthScores";
import { PipelineFunnelView } from "@/components/crm/PipelineFunnelView";
import { TeamPerformanceMetrics } from "@/components/crm/TeamPerformanceMetrics";
import { ActivityTimelineFeed } from "@/components/crm/ActivityTimelineFeed";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toEnglishDigits } from "@/lib/formatNumber";
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
  TrendingDown,
  Users,
  Activity,
  BarChart3,
  ArrowUpRight,
  Star,
  Mail,
  Phone,
  Zap,
  PieChart,
  Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow, subDays, isAfter } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export default function CRMDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [dateRange, setDateRange] = useState("7d");

  const dateRangeStart = useMemo(() => {
    const days = dateRange === "1d" ? 1 : dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    return subDays(new Date(), days);
  }, [dateRange]);

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

  // Lead stats
  const { data: leadStats } = useQuery({
    queryKey: ["crmLeadStats"],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("id, status, type");
      const leads = data || [];
      return {
        total: leads.length,
        new: leads.filter(l => l.status === "new").length,
        qualified: leads.filter(l => l.status === "qualified").length,
        won: leads.filter(l => l.status === "won").length,
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
        .limit(6);
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

  // Recent leads
  const { data: recentLeads = [] } = useQuery({
    queryKey: ["crmRecentLeads"],
    queryFn: async () => {
      const { data } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      open: "bg-chart-4/10 text-chart-4",
      in_progress: "bg-primary/10 text-primary",
      waiting: "bg-chart-3/10 text-chart-3",
      resolved: "bg-chart-5/10 text-chart-5",
      closed: "bg-muted text-muted-foreground",
      active: "bg-primary/10 text-primary",
      new: "bg-primary/10 text-primary",
      contacted: "bg-chart-4/10 text-chart-4",
      qualified: "bg-chart-5/10 text-chart-5",
      won: "bg-chart-5/10 text-chart-5",
      lost: "bg-destructive/10 text-destructive",
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
      new: { en: "New", ar: "جديد" },
      contacted: { en: "Contacted", ar: "تم التواصل" },
      qualified: { en: "Qualified", ar: "مؤهل" },
      won: { en: "Won", ar: "ناجح" },
      lost: { en: "Lost", ar: "خسارة" },
    };
    const s = map[status] || { en: status, ar: status };
    return isAr ? s.ar : s.en;
  };

  const totalOpen = (ticketStats?.open ?? 0) + (ticketStats?.inProgress ?? 0);
  const totalResolved = ticketStats?.resolved ?? 0;
  const resolutionRate = (ticketStats?.total ?? 0) > 0
    ? Math.round((totalResolved / (ticketStats?.total ?? 1)) * 100)
    : 0;

  // Fetch all tickets for trend
  const { data: allTicketsForTrend } = useQuery({
    queryKey: ["crmAllTickets"],
    queryFn: async () => {
      const { data } = await supabase.from("support_tickets").select("id, created_at, status");
      return data || [];
    },
  });

  // Trend calculations
  const ticketTrend = useMemo(() => {
    if (!allTicketsForTrend?.length) return { current: 0, direction: "stable" as const };
    const recentCount = allTicketsForTrend.filter((t: any) => isAfter(new Date(t.created_at), dateRangeStart)).length;
    return { current: recentCount, direction: recentCount > (allTicketsForTrend.length / 2) ? "up" as const : "down" as const };
  }, [allTicketsForTrend, dateRangeStart]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Activity}
        title={isAr ? "مركز إدارة العلاقات" : "CRM Command Center"}
        description={isAr ? "نظرة شاملة على الدعم والتواصل والاستهداف" : "Unified view of support, communication & targeting"}
        actions={
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[120px] gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">{isAr ? "اليوم" : "Today"}</SelectItem>
              <SelectItem value="7d">{isAr ? "7 أيام" : "7 Days"}</SelectItem>
              <SelectItem value="30d">{isAr ? "30 يوم" : "30 Days"}</SelectItem>
              <SelectItem value="90d">{isAr ? "90 يوم" : "90 Days"}</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* CRM Live Stats */}
      <CRMLiveStatsWidget />

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/40 border-s-4 border-s-chart-4 group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-xl bg-chart-4/10 p-2.5 transition-transform duration-300 group-hover:scale-110">
              <Ticket className="h-5 w-5 text-chart-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{isAr ? "تذاكر مفتوحة" : "Open Tickets"}</p>
              <p className="text-2xl font-bold">{ticketStats?.open ?? "—"}</p>
              {ticketStats?.urgent ? (
                <p className="text-[10px] text-destructive font-medium">
                  {ticketStats.urgent} {isAr ? "عاجلة" : "urgent"}
                </p>
              ) : null}
            </div>
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link to="/admin/support-tickets"><ArrowUpRight className="h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/40 border-s-4 border-s-primary group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-xl bg-primary/10 p-2.5 transition-transform duration-300 group-hover:scale-110">
              <Headphones className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{isAr ? "محادثات نشطة" : "Active Chats"}</p>
              <p className="text-2xl font-bold">{(chatStats?.waiting ?? 0) + (chatStats?.active ?? 0)}</p>
              {chatStats?.waiting ? (
                <p className="text-[10px] text-chart-4 font-medium">
                  {chatStats.waiting} {isAr ? "في الانتظار" : "waiting"}
                </p>
              ) : null}
            </div>
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link to="/admin/live-chat"><ArrowUpRight className="h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/40 border-s-4 border-s-chart-5 group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-xl bg-chart-5/10 p-2.5 transition-transform duration-300 group-hover:scale-110">
              <UserSearch className="h-5 w-5 text-chart-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{isAr ? "عملاء محتملين" : "Active Leads"}</p>
              <p className="text-2xl font-bold">{leadStats?.total ?? "—"}</p>
              <p className="text-[10px] text-muted-foreground">
                {leadStats?.new ?? 0} {isAr ? "جديد" : "new"}
              </p>
            </div>
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link to="/admin/leads"><ArrowUpRight className="h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/40 border-s-4 border-s-chart-3 group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-xl bg-chart-3/10 p-2.5 transition-transform duration-300 group-hover:scale-110">
              <Target className="h-5 w-5 text-chart-3" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{isAr ? "شرائح الجمهور" : "Segments"}</p>
              <p className="text-2xl font-bold">{segmentStats?.total ?? "—"}</p>
              <p className="text-[10px] text-muted-foreground">
                {toEnglishDigits((segmentStats?.totalReach ?? 0).toLocaleString())} {isAr ? "مستخدم" : "reach"}
              </p>
            </div>
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link to="/admin/audience-segments"><ArrowUpRight className="h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Resolution Rate + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" />
              {isAr ? "معدل الحل" : "Resolution Rate"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">{resolutionRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalResolved} / {ticketStats?.total ?? 0} {isAr ? "تذكرة" : "tickets"}
              </p>
            </div>
            <Progress value={resolutionRate} className="h-2" />
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl border p-2">
                <p className="text-lg font-bold text-chart-5">{chatStats?.avgRating ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                  <Star className="h-3 w-3" /> {isAr ? "متوسط التقييم" : "Avg. Rating"}
                </p>
              </div>
              <div className="rounded-xl border p-2">
                <p className="text-lg font-bold">{ticketStats?.today ?? 0}</p>
                <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                  <Zap className="h-3 w-3" /> {isAr ? "تذاكر اليوم" : "Today"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              {isAr ? "إجراءات سريعة" : "Quick Actions"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { to: "/admin/support-tickets", icon: Ticket, label: isAr ? "إدارة التذاكر" : "Manage Tickets", color: "text-chart-4", desc: isAr ? `${ticketStats?.open ?? 0} مفتوحة` : `${ticketStats?.open ?? 0} open` },
                { to: "/admin/live-chat", icon: Headphones, label: isAr ? "الدعم المباشر" : "Live Chat", color: "text-primary", desc: isAr ? `${chatStats?.waiting ?? 0} في الانتظار` : `${chatStats?.waiting ?? 0} waiting` },
                { to: "/admin/audience-segments", icon: Target, label: isAr ? "شرائح الجمهور" : "Segments", color: "text-chart-5", desc: isAr ? `${segmentStats?.active ?? 0} نشطة` : `${segmentStats?.active ?? 0} active` },
                { to: "/admin/leads", icon: UserSearch, label: isAr ? "العملاء المحتملين" : "Leads", color: "text-chart-3", desc: isAr ? `${leadStats?.new ?? 0} جديد` : `${leadStats?.new ?? 0} new` },
              ].map(action => (
                <Button key={action.to} variant="outline" asChild className="h-auto py-4 flex-col gap-1.5 hover:-translate-y-0.5 transition-all">
                  <Link to={action.to}>
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                    <span className="text-xs font-medium">{action.label}</span>
                    <span className="text-[10px] text-muted-foreground">{action.desc}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Insights Row: Health + Funnel + Team */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CustomerHealthScores />
        <PipelineFunnelView />
        <TeamPerformanceMetrics />
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="timeline" className="gap-2 text-xs">
            <Activity className="h-3.5 w-3.5" />
            {isAr ? "النشاط" : "Timeline"}
          </TabsTrigger>
          <TabsTrigger value="tickets" className="gap-2 text-xs">
            <Ticket className="h-3.5 w-3.5" />
            {isAr ? "التذاكر" : "Tickets"}
            {(ticketStats?.open ?? 0) > 0 && (
              <Badge variant="secondary" className="h-5 min-w-5 px-1 text-[10px]">{ticketStats?.open}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="chats" className="gap-2 text-xs">
            <Headphones className="h-3.5 w-3.5" />
            {isAr ? "المحادثات" : "Chats"}
            {(chatStats?.waiting ?? 0) > 0 && (
              <Badge variant="secondary" className="h-5 min-w-5 px-1 text-[10px]">{chatStats?.waiting}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="leads" className="gap-2 text-xs">
            <UserSearch className="h-3.5 w-3.5" />
            {isAr ? "العملاء المحتملين" : "Leads"}
            {(leadStats?.new ?? 0) > 0 && (
              <Badge variant="secondary" className="h-5 min-w-5 px-1 text-[10px]">{leadStats?.new}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="behavior" className="gap-2 text-xs">
            <Activity className="h-3.5 w-3.5" />
            {isAr ? "السلوك" : "Behavior"}
          </TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <ActivityTimelineFeed />
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets">
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
        </TabsContent>

        {/* Chats Tab */}
        <TabsContent value="chats">
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
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads">
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserSearch className="h-4 w-4 text-chart-5" />
                {isAr ? "أحدث العملاء المحتملين" : "Recent Leads"}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
                <Link to="/admin/leads">
                  {isAr ? "عرض الكل" : "View All"}
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[400px]">
                <div className="divide-y">
                  {recentLeads.map((lead: any) => (
                    <Link
                      key={lead.id}
                      to="/admin/leads"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-chart-5/10">
                        <Users className="h-4 w-4 text-chart-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{lead.contact_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {lead.company_name && (
                            <span className="text-[10px] text-muted-foreground truncate">{lead.company_name}</span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(lead.created_at), {
                              addSuffix: true,
                              locale: isAr ? ar : enUS,
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[9px] ${getStatusColor(lead.status || "new")}`}>
                          {getStatusLabel(lead.status || "new")}
                        </Badge>
                        <div className="flex gap-1">
                          {lead.email && <Mail className="h-3 w-3 text-muted-foreground" />}
                          {lead.phone && <Phone className="h-3 w-3 text-muted-foreground" />}
                        </div>
                      </div>
                    </Link>
                  ))}
                  {recentLeads.length === 0 && (
                    <div className="flex flex-col items-center py-8 text-center">
                      <UserSearch className="h-8 w-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">{isAr ? "لا توجد عملاء محتملين" : "No leads yet"}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Behavior Tab */}
        <TabsContent value="behavior">
          <BehaviorAnalytics />
        </TabsContent>
      </Tabs>

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
                icon: Star,
                color: "text-chart-5",
              },
              {
                label: isAr ? "العملاء المحتملين" : "Total Leads",
                value: leadStats?.total ?? "—",
                icon: UserSearch,
                color: "text-chart-3",
              },
              {
                label: isAr ? "الوصول الكلي" : "Total Reach",
                value: toEnglishDigits((segmentStats?.totalReach ?? 0).toLocaleString()),
                icon: Users,
                color: "text-chart-1",
              },
            ].map(item => (
              <div key={item.label} className="text-center rounded-xl border p-3 hover:shadow-sm transition-shadow">
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
