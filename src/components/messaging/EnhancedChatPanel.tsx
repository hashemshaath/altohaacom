import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Send, Search, Pin, Reply, Smile, Image, MoreVertical, Check, CheckCheck, ArrowLeft } from "lucide-react";
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

      // Mark as read
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

  return (
    <div className="flex h-[70vh] border rounded-xl overflow-hidden bg-background">
      {/* Sidebar */}
      <div className={cn("w-full md:w-80 border-e flex flex-col", activeChat && "hidden md:flex")}>
        <div className="p-3 border-b">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            {isAr ? "المحادثات" : "Messages"}
          </h3>
          <div className="relative">
            <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input className="ps-8 h-8 text-xs" placeholder={isAr ? "بحث..." : "Search..."} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">{isAr ? "لا توجد محادثات" : "No conversations"}</div>
          ) : (
            filtered.map(c => (
              <button key={c.id} onClick={() => setActiveChat(c.id)} className={cn("w-full flex items-center gap-3 p-3 hover:bg-muted/50 text-start transition-colors", activeChat === c.id && "bg-muted")}>
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={c.other_user.avatar_url || ""} />
                  <AvatarFallback>{(c.other_user.full_name || "?")[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{isAr ? c.other_user.full_name_ar || c.other_user.full_name : c.other_user.full_name}</p>
                    {c.last_message_at && <span className="text-[10px] text-muted-foreground">{format(new Date(c.last_message_at), "HH:mm")}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.last_message}</p>
                </div>
                {c.unread_count > 0 && <Badge className="h-5 min-w-5 text-[10px] rounded-full">{c.unread_count}</Badge>}
              </button>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={cn("flex-1 flex flex-col", !activeChat && "hidden md:flex")}>
        {activeChat && activeConvo ? (
          <>
            <div className="p-3 border-b flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setActiveChat(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarImage src={activeConvo.other_user.avatar_url || ""} />
                <AvatarFallback>{(activeConvo.other_user.full_name || "?")[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{isAr ? activeConvo.other_user.full_name_ar || activeConvo.other_user.full_name : activeConvo.other_user.full_name}</p>
                {activeConvo.other_user.username && <p className="text-[10px] text-muted-foreground">@{activeConvo.other_user.username}</p>}
              </div>
            </div>

            <ScrollArea className="flex-1 p-3">
              <div className="space-y-2">
                {messages.map((m: any) => {
                  const isMine = m.sender_id === user!.id;
                  const reply = m.metadata?.reply_to;
                  return (
                    <div key={m.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[75%] rounded-2xl px-3 py-2 text-sm", isMine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm")}>
                        {reply && (
                          <div className={cn("text-[10px] mb-1 px-2 py-0.5 rounded border-s-2", isMine ? "border-primary-foreground/50 opacity-70" : "border-primary/50 text-muted-foreground")}>
                            {reply.content}
                          </div>
                        )}
                        <p>{m.content}</p>
                        <div className={cn("flex items-center gap-1 mt-0.5", isMine ? "justify-end" : "justify-start")}>
                          <span className="text-[9px] opacity-60">{format(new Date(m.created_at), "HH:mm")}</span>
                          {isMine && (m.is_read ? <CheckCheck className="h-3 w-3 opacity-60" /> : <Check className="h-3 w-3 opacity-40" />)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Reply indicator */}
            {replyTo && (
              <div className="px-3 py-1 border-t bg-muted/50 flex items-center gap-2">
                <Reply className="h-3 w-3 text-primary" />
                <p className="text-xs text-muted-foreground truncate flex-1">{replyTo.content}</p>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setReplyTo(null)}>×</Button>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t flex gap-2">
              <Input
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={isAr ? "اكتب رسالة..." : "Type a message..."}
                className="flex-1"
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMutation.mutate(); } }}
              />
              <Button size="icon" onClick={() => sendMutation.mutate()} disabled={!message.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">{isAr ? "اختر محادثة للبدء" : "Select a conversation to start"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
