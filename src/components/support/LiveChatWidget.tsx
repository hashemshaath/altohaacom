import { useState, useRef, useEffect, useCallback } from "react";
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

export function LiveChatWidget() {
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

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Load active session
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
      if (data) {
        setSessionId(data.id);
      }
    };
    loadSession();
  }, [user, isOpen]);

  // Load messages & subscribe to realtime
  useEffect(() => {
    if (!sessionId) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_session_messages")
        .select("*")
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
      // Send welcome message
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
          className="fixed bottom-6 end-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 touch-manipulation"
          aria-label={isAr ? "دردشة مباشرة" : "Live Chat"}
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-1 -end-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-chart-5 opacity-50" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-chart-5" />
          </span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className={cn(
          "fixed bottom-0 end-0 z-50 flex flex-col bg-card border border-border shadow-2xl transition-all duration-300",
          "w-full h-full sm:w-[380px] sm:h-[520px] sm:bottom-4 sm:end-4 sm:rounded-2xl"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3 bg-primary/5 sm:rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{isAr ? "الدعم المباشر" : "Live Support"}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-chart-5 inline-block" />
                  {isAr ? "متاح الآن" : "Available now"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden" onClick={() => setIsOpen(false)}>
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {!sessionId ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-semibold">{isAr ? "مرحباً! كيف يمكننا مساعدتك؟" : "Hello! How can we help?"}</p>
                  <p className="text-xs text-muted-foreground max-w-[240px]">
                    {isAr ? "ابدأ محادثة مع فريق الدعم" : "Start a conversation with our support team"}
                  </p>
                </div>
                <Button onClick={startSession} disabled={starting} className="gap-2">
                  {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                  {isAr ? "بدء المحادثة" : "Start Chat"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map(msg => {
                  const isMine = msg.sender_id === user?.id;
                  const isSystem = msg.message_type === "system";
                  return (
                    <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                      {isSystem ? (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground mx-auto">{msg.message}</Badge>
                      ) : (
                        <div className={cn(
                          "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm",
                          isMine
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted rounded-bl-sm"
                        )}>
                          <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                          <p className={cn("text-[9px] mt-1", isMine ? "text-primary-foreground/60" : "text-muted-foreground")}>
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: isAr ? ar : undefined })}
                          </p>
                        </div>
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
              className="flex items-center gap-2 border-t p-3"
            >
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder={isAr ? "اكتب رسالتك..." : "Type a message..."}
                className="flex-1 rounded-full"
                disabled={sending}
              />
              <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!newMessage.trim() || sending}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
