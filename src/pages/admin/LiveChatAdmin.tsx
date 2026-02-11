import { useState, useEffect, useRef } from "react";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  MessageCircle,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Headphones,
  Star,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export default function LiveChatAdmin() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch sessions
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["adminChatSessions", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("chat_sessions")
        .select("*")
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
    refetchInterval: 5000,
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
        .select("*")
        .eq("session_id", selectedSessionId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedSessionId,
    refetchInterval: 3000,
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

  // Join session (mark as active with agent)
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

  const waitingCount = sessions.filter(s => s.status === "waiting").length;
  const activeCount = sessions.filter(s => s.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Headphones className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold sm:text-2xl">
            {isAr ? "الدعم المباشر" : "Live Chat Support"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isAr ? "إدارة محادثات الدعم المباشر" : "Manage real-time support conversations"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-s-4 border-s-chart-4">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-full bg-chart-4/10 p-2.5">
              <Clock className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "في الانتظار" : "Waiting"}</p>
              <p className="text-2xl font-bold">{waitingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-4 border-s-primary">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-full bg-primary/10 p-2.5">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "نشطة" : "Active"}</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-4 border-s-muted-foreground">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-full bg-muted p-2.5">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "الإجمالي" : "Total"}</p>
              <p className="text-2xl font-bold">{sessions.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {["active", "all", "closed"].map(f => (
          <Button
            key={f}
            variant={statusFilter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(f)}
          >
            {f === "active" ? (isAr ? "نشطة" : "Active") :
             f === "all" ? (isAr ? "الكل" : "All") :
             (isAr ? "مغلقة" : "Closed")}
          </Button>
        ))}
      </div>

      {/* Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ height: 500 }}>
        {/* Sessions List */}
        <Card className="lg:col-span-1 overflow-hidden">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">{isAr ? "المحادثات" : "Conversations"}</CardTitle>
          </CardHeader>
          <ScrollArea className="h-[420px]">
            <div className="px-3 pb-3 space-y-1">
              {isLoading ? (
                [1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)
              ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">{isAr ? "لا توجد محادثات" : "No chats"}</p>
                </div>
              ) : (
                sessions.map(session => {
                  const profile = profileMap.get(session.user_id);
                  return (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSessionId(session.id)}
                      className={`w-full flex items-center gap-3 rounded-lg p-3 transition-colors text-start ${
                        selectedSessionId === session.id ? "bg-accent" : "hover:bg-accent/50"
                      }`}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-sm">
                          {(profile?.full_name || "U")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">
                            {profile?.full_name || profile?.username || "Unknown"}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] shrink-0 ${
                              session.status === "waiting"
                                ? "bg-chart-4/10 text-chart-4"
                                : session.status === "active"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {session.status === "waiting"
                              ? isAr ? "انتظار" : "Waiting"
                              : session.status === "active"
                              ? isAr ? "نشط" : "Active"
                              : isAr ? "مغلق" : "Closed"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{session.subject}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          {selectedSession ? (
            <>
              {/* Header */}
              <div className="border-b px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profileMap.get(selectedSession.user_id)?.avatar_url || undefined} />
                    <AvatarFallback>
                      {(profileMap.get(selectedSession.user_id)?.full_name || "U")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">
                      {profileMap.get(selectedSession.user_id)?.full_name || "Unknown"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {selectedSession.subject}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedSession.status === "waiting" && (
                    <Button size="sm" onClick={() => joinSession.mutate(selectedSession.id)} className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {isAr ? "انضمام" : "Join"}
                    </Button>
                  )}
                  {selectedSession.status !== "closed" && (
                    <Button variant="ghost" size="sm" onClick={() => closeSession.mutate(selectedSession.id)} className="gap-1">
                      <XCircle className="h-3 w-3" />
                      {isAr ? "إغلاق" : "Close"}
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map(msg => {
                    const isAgent = msg.sender_id !== selectedSession.user_id;
                    return (
                      <div key={msg.id} className={`flex ${isAgent ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                            isAgent
                              ? "bg-primary text-primary-foreground rounded-ee-sm"
                              : "bg-muted rounded-es-sm"
                          }`}
                        >
                          <p className="text-sm break-words">{msg.message}</p>
                          <span className={`block text-[9px] mt-0.5 ${isAgent ? "text-primary-foreground/50 text-end" : "text-muted-foreground"}`}>
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
                  className="border-t p-3 flex gap-2"
                >
                  <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder={isAr ? "اكتب رسالة..." : "Type a message..."}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!newMessage.trim()} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <Headphones className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">{isAr ? "اختر محادثة للبدء" : "Select a chat to begin"}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
