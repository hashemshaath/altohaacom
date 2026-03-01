import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Search, Reply, Check, CheckCheck, ArrowLeft, Smile, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Conversation {
  id: string;
  other_user: { user_id: string; full_name: string; full_name_ar?: string; avatar_url?: string; username?: string };
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

export function EnhancedChatPanel() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ["chat-conversations", user?.id],
    queryFn: async () => {
      const { data: sent } = await supabase
        .from("messages")
        .select("receiver_id, content, created_at")
        .eq("sender_id", user!.id)
        .order("created_at", { ascending: false });

      const { data: received } = await supabase
        .from("messages")
        .select("sender_id, content, created_at, is_read")
        .eq("receiver_id", user!.id)
        .order("created_at", { ascending: false });

      const userMap = new Map<string, { last_message: string; last_at: string; unread: number }>();
      
      sent?.forEach(m => {
        const uid = m.receiver_id;
        if (!userMap.has(uid) || m.created_at > userMap.get(uid)!.last_at) {
          userMap.set(uid, { last_message: m.content, last_at: m.created_at, unread: 0 });
        }
      });

      received?.forEach(m => {
        const uid = m.sender_id;
        const existing = userMap.get(uid);
        if (!existing || m.created_at > existing.last_at) {
          userMap.set(uid, { last_message: m.content, last_at: m.created_at, unread: (existing?.unread || 0) + (m.is_read ? 0 : 1) });
        } else if (!m.is_read) {
          existing.unread++;
        }
      });

      if (userMap.size === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, avatar_url, username")
        .in("user_id", Array.from(userMap.keys()));

      return Array.from(userMap.entries()).map(([uid, info]) => {
        const p = profiles?.find(pr => pr.user_id === uid);
        return {
          id: uid,
          other_user: p || { user_id: uid, full_name: "User" },
          last_message: info.last_message,
          last_message_at: info.last_at,
          unread_count: info.unread,
        } as Conversation;
      }).sort((a, b) => (b.last_message_at || "").localeCompare(a.last_message_at || ""));
    },
    enabled: !!user?.id,
  });

  // Fetch messages for active chat
  const { data: messages = [] } = useQuery({
    queryKey: ["chat-messages", activeChat, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${activeChat}),and(sender_id.eq.${activeChat},receiver_id.eq.${user!.id})`)
        .order("created_at", { ascending: true })
        .limit(100);

      if (data?.some(m => m.sender_id === activeChat && !m.is_read)) {
        await supabase.from("messages").update({ is_read: true }).eq("sender_id", activeChat!).eq("receiver_id", user!.id).eq("is_read", false);
      }

      return data || [];
    },
    enabled: !!activeChat && !!user?.id,
  });

  // Send message
  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!message.trim() || !activeChat) return;
      const metadata = replyTo ? { reply_to: { id: replyTo.id, content: replyTo.content?.slice(0, 100) } } : undefined;
      await supabase.from("messages").insert({
        sender_id: user!.id,
        receiver_id: activeChat,
        content: message.trim(),
        metadata: metadata as any,
      });
    },
    onSuccess: () => {
      setMessage("");
      setReplyTo(null);
      qc.invalidateQueries({ queryKey: ["chat-messages", activeChat] });
      qc.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
  });

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("chat-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["chat-messages"] });
        qc.invalidateQueries({ queryKey: ["chat-conversations"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, qc]);

  const activeConvo = conversations.find(c => c.id === activeChat);
  const filtered = searchTerm
    ? conversations.filter(c => c.other_user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.other_user.username?.toLowerCase().includes(searchTerm.toLowerCase()))
    : conversations;

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  return (
    <div className="flex h-[70vh] rounded-2xl border border-border/30 overflow-hidden bg-card shadow-sm">
      {/* Sidebar */}
      <div className={cn("w-full md:w-80 border-e border-border/20 flex flex-col bg-card", activeChat && "hidden md:flex")}>
        <div className="p-4 border-b border-border/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-bold text-sm">{isAr ? "المحادثات" : "Messages"}</h3>
            </div>
            {totalUnread > 0 && (
              <Badge className="h-6 min-w-6 rounded-lg text-[10px] font-bold">{totalUnread}</Badge>
            )}
          </div>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="ps-9 h-9 text-xs rounded-xl bg-muted/20 border-border/20 focus:bg-background transition-colors"
              placeholder={isAr ? "بحث في المحادثات..." : "Search conversations..."}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/30 mb-3">
                <MessageSquare className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">{isAr ? "لا توجد محادثات" : "No conversations"}</p>
            </div>
          ) : (
            <div className="p-1.5 space-y-0.5">
              {filtered.map(c => {
                const isActive = activeChat === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveChat(c.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl text-start transition-all duration-200",
                      isActive
                        ? "bg-primary/8 border border-primary/15 shadow-sm"
                        : "hover:bg-muted/30 border border-transparent"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10 shrink-0 ring-2 ring-background">
                        <AvatarImage src={c.other_user.avatar_url || ""} />
                        <AvatarFallback className="bg-muted text-xs font-bold">{(c.other_user.full_name || "?")[0]}</AvatarFallback>
                      </Avatar>
                      {/* Online indicator placeholder */}
                      <div className="absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full bg-chart-5 ring-2 ring-card" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("text-sm font-semibold truncate", isActive && "text-primary")}>
                          {isAr ? c.other_user.full_name_ar || c.other_user.full_name : c.other_user.full_name}
                        </p>
                        {c.last_message_at && (
                          <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                            {format(new Date(c.last_message_at), "HH:mm")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground truncate">{c.last_message}</p>
                        {c.unread_count > 0 && (
                          <Badge className="h-5 min-w-5 text-[9px] rounded-full shrink-0 font-bold">{c.unread_count}</Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={cn("flex-1 flex flex-col bg-muted/5", !activeChat && "hidden md:flex")}>
        {activeChat && activeConvo ? (
          <>
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-border/20 flex items-center gap-3 bg-card/80 backdrop-blur-sm">
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 rounded-lg" onClick={() => setActiveChat(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="relative">
                <Avatar className="h-9 w-9 ring-2 ring-background">
                  <AvatarImage src={activeConvo.other_user.avatar_url || ""} />
                  <AvatarFallback className="text-xs font-bold">{(activeConvo.other_user.full_name || "?")[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full bg-chart-5 ring-2 ring-card" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">{isAr ? activeConvo.other_user.full_name_ar || activeConvo.other_user.full_name : activeConvo.other_user.full_name}</p>
                {activeConvo.other_user.username && (
                  <p className="text-[10px] text-muted-foreground font-mono">@{activeConvo.other_user.username}</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-3">
              <div className="space-y-3">
                {messages.map((m: any, i: number) => {
                  const isMine = m.sender_id === user!.id;
                  const reply = m.metadata?.reply_to;
                  const showAvatar = !isMine && (i === 0 || messages[i - 1]?.sender_id !== m.sender_id);

                  return (
                    <div key={m.id} className={cn("flex gap-2 group", isMine ? "justify-end" : "justify-start")}>
                      {/* Other user avatar */}
                      {!isMine && (
                        <div className="w-7 shrink-0 self-end">
                          {showAvatar && (
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={activeConvo.other_user.avatar_url || ""} />
                              <AvatarFallback className="text-[9px]">{(activeConvo.other_user.full_name || "?")[0]}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )}

                      <div className={cn("max-w-[70%] relative")}>
                        {/* Reply context */}
                        {reply && (
                          <div className={cn(
                            "text-[10px] mb-1 px-2.5 py-1 rounded-lg border-s-2",
                            isMine
                              ? "bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground/70"
                              : "bg-muted/50 border-primary/30 text-muted-foreground"
                          )}>
                            <Reply className="h-2.5 w-2.5 inline me-1" />
                            {reply.content}
                          </div>
                        )}

                        <div className={cn(
                          "rounded-2xl px-3.5 py-2.5 text-sm transition-shadow",
                          isMine
                            ? "bg-primary text-primary-foreground rounded-br-md shadow-sm shadow-primary/10"
                            : "bg-card border border-border/30 rounded-bl-md shadow-sm"
                        )}>
                          <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
                          <div className={cn("flex items-center gap-1 mt-1", isMine ? "justify-end" : "justify-start")}>
                            <span className={cn("text-[9px] tabular-nums", isMine ? "text-primary-foreground/50" : "text-muted-foreground")}>
                              {format(new Date(m.created_at), "HH:mm")}
                            </span>
                            {isMine && (
                              m.is_read
                                ? <CheckCheck className="h-3 w-3 text-primary-foreground/60" />
                                : <Check className="h-3 w-3 text-primary-foreground/40" />
                            )}
                          </div>
                        </div>

                        {/* Reply button on hover */}
                        <button
                          onClick={() => setReplyTo(m)}
                          className={cn(
                            "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 rounded-lg bg-muted/80 backdrop-blur-sm flex items-center justify-center hover:bg-muted border border-border/30 shadow-sm",
                            isMine ? "-start-9" : "-end-9"
                          )}
                        >
                          <Reply className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Reply indicator */}
            {replyTo && (
              <div className="mx-4 mb-1 px-3 py-2 rounded-xl border border-border/20 bg-muted/20 flex items-center gap-2">
                <div className="h-full w-0.5 bg-primary rounded-full self-stretch" />
                <Reply className="h-3 w-3 text-primary shrink-0" />
                <p className="text-xs text-muted-foreground truncate flex-1">{replyTo.content}</p>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg shrink-0" onClick={() => setReplyTo(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-border/20 bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl shrink-0 text-muted-foreground hover:text-foreground">
                  <Smile className="h-4 w-4" />
                </Button>
                <Input
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={isAr ? "اكتب رسالة..." : "Type a message..."}
                  className="flex-1 rounded-xl h-9 bg-muted/20 border-border/20 focus:bg-background transition-colors text-sm"
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMutation.mutate(); } }}
                />
                <Button
                  size="icon"
                  className="h-9 w-9 rounded-xl shrink-0 shadow-sm"
                  onClick={() => sendMutation.mutate()}
                  disabled={!message.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30">
                <MessageSquare className="h-7 w-7 text-muted-foreground/30" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{isAr ? "اختر محادثة للبدء" : "Select a conversation"}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{isAr ? "أو ابدأ محادثة جديدة" : "Or start a new chat"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
