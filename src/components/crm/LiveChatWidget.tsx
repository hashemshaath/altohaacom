import { useState, useEffect, useRef, forwardRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Maximize2,
  Bot,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export const LiveChatWidget = forwardRef<HTMLDivElement>(function LiveChatWidget(_props, _ref) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Find or create active session
  const { data: activeSession } = useQuery({
    queryKey: ["activeChatSession", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["waiting", "active"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (data) setActiveSessionId(data.id);
      return data;
    },
    enabled: !!user && isOpen,
  });

  // Fetch messages
  const { data: messages = [] } = useQuery({
    queryKey: ["chatSessionMessages", activeSessionId],
    queryFn: async () => {
      if (!activeSessionId) return [];
      const { data, error } = await supabase
        .from("chat_session_messages")
        .select("*")
        .eq("session_id", activeSessionId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!activeSessionId,
    refetchInterval: 3000,
  });

  // Realtime subscription for messages
  useEffect(() => {
    if (!activeSessionId) return;
    const channel = supabase
      .channel(`chat-session-${activeSessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_session_messages",
          filter: `session_id=eq.${activeSessionId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chatSessionMessages", activeSessionId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSessionId, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Start session
  const startSession = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: user.id,
          status: "waiting",
          subject: isAr ? "محادثة دعم مباشر" : "Live Support Chat",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setActiveSessionId(data.id);
      queryClient.invalidateQueries({ queryKey: ["activeChatSession"] });
    },
  });

  // Send message
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !activeSessionId) throw new Error("Not ready");
      const { error } = await supabase.from("chat_session_messages").insert({
        session_id: activeSessionId,
        sender_id: user.id,
        message: content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["chatSessionMessages"] });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (!activeSessionId) {
      startSession.mutate(undefined, {
        onSuccess: () => {
          sendMessage.mutate(message.trim());
        },
      });
    } else {
      sendMessage.mutate(message.trim());
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 end-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={cn(
            "fixed bottom-6 end-6 z-50 flex flex-col rounded-2xl border bg-card shadow-2xl transition-all duration-300",
            isMinimized ? "h-14 w-72" : "h-[480px] w-[360px]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">
                  {isAr ? "الدعم المباشر" : "Live Support"}
                </p>
                {!isMinimized && (
                  <p className="text-[10px] opacity-80">
                    {activeSession?.status === "active"
                      ? isAr ? "متصل مع وكيل" : "Connected to agent"
                      : isAr ? "في الانتظار..." : "Waiting..."}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="rounded-xl p-1 hover:bg-primary-foreground/10 transition"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-1 hover:bg-primary-foreground/10 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-3">
                {!activeSessionId ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Bot className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1">
                      {isAr ? "مرحباً! كيف يمكننا مساعدتك؟" : "Hello! How can we help?"}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-[220px]">
                      {isAr
                        ? "اكتب رسالتك وسنكون معك في أقرب وقت"
                        : "Type your message and we'll be with you shortly"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isMine = msg.sender_id === user.id;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={cn(
                              "max-w-[80%] rounded-2xl px-3 py-2",
                              isMine
                                ? "bg-primary text-primary-foreground rounded-ee-sm"
                                : "bg-muted rounded-es-sm"
                            )}
                          >
                            <p className="text-sm break-words">{msg.message}</p>
                            <span
                              className={cn(
                                "block text-[9px] mt-0.5",
                                isMine ? "text-primary-foreground/50 text-end" : "text-muted-foreground"
                              )}
                            >
                              {formatDistanceToNow(new Date(msg.created_at), {
                                addSuffix: true,
                                locale: isAr ? ar : enUS,
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <form onSubmit={handleSend} className="border-t p-3">
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={isAr ? "اكتب رسالة..." : "Type a message..."}
                    className="flex-1 h-9 text-sm"
                  />
                  <Button type="submit" size="icon" className="h-9 w-9" disabled={!message.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
});
