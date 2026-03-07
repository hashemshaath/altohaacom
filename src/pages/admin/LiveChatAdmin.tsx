import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {
  MessageCircle,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Headphones,
  Star,
  Search,
  ArrowRightLeft,
  BarChart3,
  ArrowLeft,
} from "lucide-react";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function LiveChatAdmin() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch sessions
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["adminChatSessions", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("chat_sessions")
        .select("id, user_id, agent_id, status, subject, subject_ar, rating, feedback, started_at, ended_at, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (statusFilter === "active") {
        query = query.in("status", ["waiting", "active"]);
      } else if (statusFilter === "closed") {
        query = query.eq("status", "closed");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Fetch user profiles
  const userIds = [...new Set(sessions.map(s => s.user_id))];
  const { data: profiles = [] } = useQuery({
    queryKey: ["chatProfiles", userIds.join(",")],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url")
        .in("user_id", userIds);
      return data || [];
    },
    enabled: userIds.length > 0,
  });

  const profileMap = new Map(profiles.map(p => [p.user_id, p]));
  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  // Fetch messages for selected session
  const { data: messages = [] } = useQuery({
    queryKey: ["adminChatMessages", selectedSessionId],
    queryFn: async () => {
      if (!selectedSessionId) return [];
      const { data, error } = await supabase
        .from("chat_session_messages")
        .select("id, session_id, sender_id, message, message_type, created_at")
        .eq("session_id", selectedSessionId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedSessionId,
    staleTime: 1000 * 60,
  });

  // Realtime
  useEffect(() => {
    if (!selectedSessionId) return;
    const channel = supabase
      .channel(`admin-chat-${selectedSessionId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_session_messages",
        filter: `session_id=eq.${selectedSessionId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["adminChatMessages", selectedSessionId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedSessionId, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Join session
  const joinSession = useMutation({
    mutationFn: async (sessionId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("chat_sessions")
        .update({ agent_id: user.id, status: "active" })
        .eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminChatSessions"] });
      toast({ title: isAr ? "تم الانضمام للمحادثة" : "Joined chat" });
    },
  });

  // Close session
  const closeSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from("chat_sessions")
        .update({ status: "closed", ended_at: new Date().toISOString() })
        .eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminChatSessions"] });
      setSelectedSessionId(null);
      toast({ title: isAr ? "تم إغلاق المحادثة" : "Chat closed" });
    },
  });

  // Transfer session
  const transferSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from("chat_sessions")
        .update({ agent_id: null, status: "waiting" })
        .eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminChatSessions"] });
      toast({ title: isAr ? "تم تحويل المحادثة" : "Chat transferred to queue" });
    },
  });

  // Send message
  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!user || !selectedSessionId) throw new Error("Not ready");
      const { error } = await supabase.from("chat_session_messages").insert({
        session_id: selectedSessionId,
        sender_id: user.id,
        message: newMessage,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["adminChatMessages"] });
    },
  });

  const { waitingCount, activeCount, avgWaitMins } = useMemo(() => {
    const wc = sessions.filter(s => s.status === "waiting").length;
    const ac = sessions.filter(s => s.status === "active").length;
    const waiting = sessions.filter(s => s.status === "waiting");
    const avg = waiting.length === 0 ? 0 : Math.round(
      waiting.reduce((sum, s) => sum + differenceInMinutes(new Date(), new Date(s.created_at)), 0) / waiting.length
    );
    return { waitingCount: wc, activeCount: ac, avgWaitMins: avg };
  }, [sessions]);

  const filteredSessions = useMemo(() => sessions.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const profile = profileMap.get(s.user_id);
    return (
      profile?.full_name?.toLowerCase().includes(q) ||
      profile?.username?.toLowerCase().includes(q) ||
      s.subject?.toLowerCase().includes(q)
    );
  }), [sessions, searchQuery, profileMap]);

  // On mobile, show either sessions list or chat area
  const showChatOnMobile = !!selectedSessionId;

  return (
    <div className="space-y-4 sm:space-y-6">
      <AdminPageHeader
        icon={Headphones}
        title={isAr ? "الدعم المباشر" : "Live Chat"}
        description={isAr ? "إدارة محادثات الدعم" : "Real-time support"}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: isAr ? "انتظار" : "Waiting", value: waitingCount, icon: Clock, color: "chart-4", pulse: waitingCount > 0 },
          { label: isAr ? "نشط" : "Active", value: activeCount, icon: MessageCircle, color: "primary" },
          { label: isAr ? "متوسط الانتظار" : "Avg Wait", value: `${avgWaitMins}m`, icon: BarChart3, color: "chart-3" },
          { label: isAr ? "إجمالي" : "Total", value: sessions.length, icon: Users, color: "muted-foreground" },
        ].map(({ label, value, icon: Icon, color, pulse }) => (
          <Card key={label} className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <CardContent className="flex items-center gap-3 p-3 sm:p-4">
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
                `bg-${color}/10`
              )}>
                <Icon className={cn("h-4.5 w-4.5", `text-${color}`, pulse && "animate-pulse")} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">{label}</p>
                <p className="text-lg sm:text-2xl font-bold leading-tight tabular-nums">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {["active", "all", "closed"].map(f => (
          <Button
            key={f}
            variant={statusFilter === f ? "default" : "outline"}
            size="sm"
            className={cn(
              "rounded-xl transition-all duration-200 active:scale-95",
              statusFilter === f && "shadow-sm shadow-primary/20"
            )}
            onClick={() => setStatusFilter(f)}
          >
            {f === "active" ? (isAr ? "نشطة" : "Active") :
             f === "all" ? (isAr ? "الكل" : "All") :
             (isAr ? "مغلقة" : "Closed")}
          </Button>
        ))}
      </div>

      {/* Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: "calc(100vh - 360px)", minHeight: 400 }}>
        {/* Sessions List */}
        <Card className={cn(
          "lg:col-span-1 overflow-hidden flex flex-col rounded-2xl border-border/50",
          showChatOnMobile ? "hidden lg:flex" : "flex"
        )}>
          <CardHeader className="py-3 px-3 space-y-2 border-b border-border/30">
            <CardTitle className="text-sm font-semibold">{isAr ? "المحادثات" : "Conversations"}</CardTitle>
            <div className="relative">
              <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={isAr ? "بحث..." : "Search..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="ps-8 h-8 text-xs rounded-xl bg-muted/30 border-border/40"
              />
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {isLoading ? (
                [1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
              ) : filteredSessions.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50 mb-3">
                    <MessageCircle className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                  <p className="text-xs text-muted-foreground">{isAr ? "لا توجد محادثات" : "No chats"}</p>
                </div>
              ) : (
                filteredSessions.map(session => {
                  const profile = profileMap.get(session.user_id);
                  const waitMins = session.status === "waiting" ? differenceInMinutes(new Date(), new Date(session.created_at)) : null;
                  const isActive = selectedSessionId === session.id;
                  return (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSessionId(session.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 rounded-xl p-2.5 transition-all duration-200 text-start active:scale-[0.98]",
                        isActive
                          ? "bg-primary/10 border border-primary/20 shadow-sm"
                          : "hover:bg-accent/50 border border-transparent"
                      )}
                    >
                      <div className="relative">
                        <Avatar className="h-9 w-9 rounded-xl">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs rounded-xl">
                            {(profile?.full_name || "U")[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full border-2 border-card",
                          session.status === "waiting" ? "bg-chart-4" : session.status === "active" ? "bg-chart-5" : "bg-muted-foreground"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold truncate">
                            {profile?.full_name || profile?.username || "Unknown"}
                          </p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] shrink-0 px-1.5 rounded-md",
                              session.status === "waiting"
                                ? "bg-chart-4/10 text-chart-4 border-chart-4/30"
                                : session.status === "active"
                                ? "bg-primary/10 text-primary border-primary/30"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {session.status === "waiting"
                              ? isAr ? "انتظار" : "Wait"
                              : session.status === "active"
                              ? isAr ? "نشط" : "Active"
                              : isAr ? "مغلق" : "Closed"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{session.subject}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {waitMins !== null && waitMins > 5 && (
                            <span className="text-[9px] text-chart-4 font-semibold tabular-nums">{waitMins}m</span>
                          )}
                          {session.rating && (
                            <div className="flex items-center gap-0.5">
                              <Star className="h-2.5 w-2.5 text-chart-5 fill-chart-5" />
                              <span className="text-[9px] text-chart-5 font-medium">{session.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className={cn(
          "lg:col-span-2 flex flex-col overflow-hidden rounded-2xl border-border/50",
          showChatOnMobile ? "flex" : "hidden lg:flex"
        )}>
          {selectedSession ? (
            <>
              {/* Header */}
              <div className="border-b border-border/30 bg-card/60 backdrop-blur-sm px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden h-7 w-7 shrink-0 rounded-xl"
                    onClick={() => setSelectedSessionId(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-8 w-8 shrink-0 rounded-xl">
                    <AvatarImage src={profileMap.get(selectedSession.user_id)?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs rounded-xl">
                      {(profileMap.get(selectedSession.user_id)?.full_name || "U")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {profileMap.get(selectedSession.user_id)?.full_name || "Unknown"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {selectedSession.subject}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {selectedSession.status === "waiting" && (
                    <Button size="sm" onClick={() => joinSession.mutate(selectedSession.id)} className="gap-1.5 rounded-xl h-8 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{isAr ? "انضمام" : "Join"}</span>
                    </Button>
                  )}
                  {selectedSession.status === "active" && (
                    <Button variant="outline" size="sm" onClick={() => transferSession.mutate(selectedSession.id)} className="gap-1.5 rounded-xl h-8 text-xs">
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{isAr ? "تحويل" : "Transfer"}</span>
                    </Button>
                  )}
                  {selectedSession.status !== "closed" && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => closeSession.mutate(selectedSession.id)}>
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-3 sm:p-4">
                <div className="space-y-2.5">
                  {messages.map(msg => {
                    const isAgent = msg.sender_id !== selectedSession.user_id;
                    return (
                      <div key={msg.id} className={cn("flex", isAgent ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[80%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 shadow-sm",
                            isAgent
                              ? "bg-primary text-primary-foreground rounded-ee-md"
                              : "bg-muted/70 rounded-es-md border border-border/30"
                          )}
                        >
                          <p className="text-xs sm:text-sm break-words leading-relaxed">{msg.message}</p>
                          <span className={cn(
                            "block text-[9px] mt-1 tabular-nums",
                            isAgent ? "text-primary-foreground/50 text-end" : "text-muted-foreground"
                          )}>
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: isAr ? ar : enUS })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              {selectedSession.status !== "closed" && (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    if (newMessage.trim()) sendMessage.mutate();
                  }}
                  className="border-t border-border/30 bg-card/60 backdrop-blur-sm p-2.5 sm:p-3 flex gap-2"
                >
                  <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder={isAr ? "اكتب رسالة..." : "Type a message..."}
                    className="flex-1 h-9 text-sm rounded-xl bg-muted/30 border-border/40"
                  />
                  <Button type="submit" disabled={!newMessage.trim()} size="icon" className="h-9 w-9 shrink-0 rounded-xl">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 mb-3">
                <Headphones className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">{isAr ? "اختر محادثة للبدء" : "Select a chat to begin"}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">{isAr ? "المحادثات النشطة ستظهر هنا" : "Active conversations will appear here"}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
