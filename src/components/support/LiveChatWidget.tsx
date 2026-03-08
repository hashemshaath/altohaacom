import { useState, useRef, useEffect, useCallback, memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MessageCircle, X, Send, Minimize2, Loader2, Bot, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface ChatMessage {
  id: string;
  message: string;
  sender_id: string;
  message_type: string | null;
  created_at: string;
}

export const LiveChatWidget = memo(function LiveChatWidget() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!user || !isOpen) return;
    const loadSession = async () => {
      const { data } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("user_id", user.id)
        .in("status", ["active", "waiting"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setSessionId(data.id);
    };
    loadSession();
  }, [user, isOpen]);

  useEffect(() => {
    if (!sessionId) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_session_messages")
        .select("id, message, sender_id, message_type, created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    const channel = supabase
      .channel(`chat-session-${sessionId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_session_messages",
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  const startSession = useCallback(async () => {
    if (!user) return;
    setStarting(true);
    try {
      const { data, error } = await supabase.from("chat_sessions").insert({
        user_id: user.id,
        status: "waiting",
        subject: isAr ? "دردشة مباشرة" : "Live Chat",
      }).select("id").single();
      if (error) throw error;
      setSessionId(data.id);
      await supabase.from("chat_session_messages").insert({
        session_id: data.id,
        sender_id: user.id,
        message: isAr ? "مرحباً، أحتاج مساعدة" : "Hello, I need help",
        message_type: "system",
      });
    } catch {
      // Silent fail
    } finally {
      setStarting(false);
    }
  }, [user, isAr]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !sessionId || !user) return;
    const msg = newMessage.trim();
    setNewMessage("");
    setSending(true);
    try {
      await supabase.from("chat_session_messages").insert({
        session_id: sessionId,
        sender_id: user.id,
        message: msg,
      });
    } catch {
      setNewMessage(msg);
    } finally {
      setSending(false);
    }
  }, [newMessage, sessionId, user]);

  if (!user) return null;

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-[6rem] md:bottom-6 end-4 md:end-6 z-40 flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation"
          aria-label={isAr ? "دردشة مباشرة" : "Live Chat"}
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-1 -end-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-chart-5 opacity-50" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-chart-5 ring-2 ring-primary" />
          </span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className={cn(
          "fixed bottom-0 end-0 z-50 flex flex-col bg-card border border-border/30 shadow-2xl transition-all duration-300",
          "w-full h-full sm:w-[400px] sm:h-[540px] sm:bottom-4 sm:end-4 sm:rounded-3xl overflow-hidden"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/20 px-4 py-3.5 bg-gradient-to-r from-primary/[0.06] to-transparent sm:rounded-t-3xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">{isAr ? "الدعم المباشر" : "Live Support"}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-chart-5 inline-block animate-pulse" />
                  {isAr ? "متاح الآن" : "Available now"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl sm:hidden" onClick={() => setIsOpen(false)}>
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {!sessionId ? (
              <div className="flex flex-col items-center justify-center h-full gap-5 py-8">
                <div className="h-18 w-18 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shadow-sm">
                  <Bot className="h-9 w-9 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-bold text-base">{isAr ? "مرحباً! كيف يمكننا مساعدتك؟" : "Hello! How can we help?"}</p>
                  <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed">
                    {isAr ? "ابدأ محادثة مع فريق الدعم وسنرد عليك في أقرب وقت" : "Start a conversation with our support team and we'll respond shortly"}
                  </p>
                </div>
                <Button onClick={startSession} disabled={starting} className="gap-2 rounded-xl h-10 px-5 shadow-sm">
                  {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                  {isAr ? "بدء المحادثة" : "Start Chat"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, i) => {
                  const isMine = msg.sender_id === user?.id;
                  const isSystem = msg.message_type === "system";
                  const showAvatar = !isMine && !isSystem && (i === 0 || messages[i - 1]?.sender_id !== msg.sender_id || messages[i - 1]?.message_type === "system");

                  return (
                    <div key={msg.id} className={cn("flex gap-2", isMine ? "justify-end" : "justify-start")}>
                      {isSystem ? (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground mx-auto rounded-xl px-3 py-1 border-border/20">{msg.message}</Badge>
                      ) : (
                        <>
                          {!isMine && (
                            <div className="w-7 shrink-0 self-end">
                              {showAvatar && (
                                <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
                                  <Bot className="h-3.5 w-3.5 text-primary" />
                                </div>
                              )}
                            </div>
                          )}
                          <div className={cn(
                            "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm transition-shadow",
                            isMine
                              ? "bg-primary text-primary-foreground rounded-br-md shadow-sm shadow-primary/10"
                              : "bg-muted/50 border border-border/20 rounded-bl-md shadow-sm"
                          )}>
                            <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.message}</p>
                            <p className={cn("text-[9px] mt-1 tabular-nums", isMine ? "text-primary-foreground/50 text-end" : "text-muted-foreground")}>
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: isAr ? ar : undefined })}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          {sessionId && (
            <form
              onSubmit={e => { e.preventDefault(); sendMessage(); }}
              className="flex items-center gap-2 border-t border-border/20 p-3 bg-card/80 backdrop-blur-sm"
            >
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder={isAr ? "اكتب رسالتك..." : "Type a message..."}
                className="flex-1 rounded-xl h-10 bg-muted/20 border-border/20 focus:bg-background transition-colors"
                disabled={sending}
              />
              <Button
                type="submit"
                size="icon"
                className="rounded-xl h-10 w-10 shrink-0 shadow-sm"
                disabled={!newMessage.trim() || sending}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
