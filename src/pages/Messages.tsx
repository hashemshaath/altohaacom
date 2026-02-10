import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { usePresence } from "@/hooks/usePresence";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Send,
  Search,
  Check,
  CheckCheck,
  ArrowLeft,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface ConversationPartner {
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

export default function Messages() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialUserId = searchParams.get("user");

  const [selectedPartner, setSelectedPartner] = useState<ConversationPartner | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  const { partnerTyping, sendTypingIndicator } = useRealtimeMessages(selectedPartner?.user_id || null);
  const { isOnline } = usePresence();

  // Fetch conversations
  const { data: conversations, isLoading: loadingConversations } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: messages } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!messages) return [];

      const partnerMap = new Map<string, { messages: Message[]; unread: number }>();

      messages.forEach((msg) => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const existing = partnerMap.get(partnerId) || { messages: [], unread: 0 };
        existing.messages.push(msg);
        if (!msg.is_read && msg.receiver_id === user.id) existing.unread++;
        partnerMap.set(partnerId, existing);
      });

      const partnerIds = Array.from(partnerMap.keys());
      if (partnerIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, avatar_url")
        .in("user_id", partnerIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return partnerIds
        .map((partnerId) => {
          const data = partnerMap.get(partnerId)!;
          const profile = profileMap.get(partnerId);
          const lastMsg = data.messages[0];

          return {
            user_id: partnerId,
            username: profile?.username,
            full_name: profile?.full_name,
            avatar_url: profile?.avatar_url,
            last_message: lastMsg?.content,
            last_message_at: lastMsg?.created_at,
            unread_count: data.unread,
          } as ConversationPartner;
        })
        .sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime());
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ["messages", user?.id, selectedPartner?.user_id],
    queryFn: async () => {
      if (!user || !selectedPartner) return [];

      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${selectedPartner.user_id}),and(sender_id.eq.${selectedPartner.user_id},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (data && data.length > 0) {
        const unreadIds = data.filter((m) => m.receiver_id === user.id && !m.is_read).map((m) => m.id);

        if (unreadIds.length > 0) {
          await supabase
            .from("messages")
            .update({ is_read: true, read_at: new Date().toISOString() })
            .in("id", unreadIds);

          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      }

      return data || [];
    },
    enabled: !!user && !!selectedPartner,
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !selectedPartner) throw new Error("Not ready");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          receiver_id: selectedPartner.user_id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: language === "ar" ? "فشل الإرسال" : "Failed to send",
        description: error.message,
      });
    },
  });

  // Handle initial user from URL
  useEffect(() => {
    if (initialUserId && conversations && !selectedPartner) {
      const existing = conversations.find((c) => c.user_id === initialUserId);
      if (existing) {
        setSelectedPartner(existing);
      } else {
        supabase
          .from("profiles")
          .select("user_id, username, full_name, avatar_url")
          .eq("user_id", initialUserId)
          .single()
          .then(({ data }) => {
            if (data) {
              setSelectedPartner({ ...data, unread_count: 0 });
            }
          });
      }
    }
  }, [initialUserId, conversations, selectedPartner]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage.mutate(newMessage.trim());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    typingDebounceRef.current = setTimeout(() => {
      sendTypingIndicator();
    }, 300);
  };

  const formatMessageDate = (date: string) => {
    const d = new Date(date);
    const locale = language === "ar" ? ar : enUS;

    if (isToday(d)) return format(d, "h:mm a", { locale });
    if (isYesterday(d)) return `${language === "ar" ? "أمس" : "Yesterday"} ${format(d, "h:mm a", { locale })}`;
    return format(d, "MMM d, h:mm a", { locale });
  };

  const formatConvTime = (date?: string) => {
    if (!date) return "";
    const d = new Date(date);
    if (isToday(d)) return format(d, "h:mm a");
    if (isYesterday(d)) return language === "ar" ? "أمس" : "Yesterday";
    return format(d, "MMM d");
  };

  const filteredConversations = conversations?.filter(
    (c) =>
      !searchQuery ||
      c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="container flex-1 py-4 md:py-6">
        <Card className="mx-auto max-w-5xl overflow-hidden border-border/50 shadow-lg shadow-primary/5" style={{ height: "calc(100vh - 160px)", minHeight: 500 }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className={`w-full border-e md:w-80 flex flex-col ${selectedPartner ? "hidden md:flex" : ""}`}>
              <div className="border-b p-4 space-y-3">
                <h2 className="flex items-center gap-2 font-semibold">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  {language === "ar" ? "الرسائل" : "Messages"}
                </h2>
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={language === "ar" ? "بحث..." : "Search..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-9 h-9 text-sm"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                {loadingConversations ? (
                  <div className="p-3 space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                ) : !filteredConversations?.length ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {language === "ar" ? "لا توجد محادثات" : "No conversations yet"}
                    </p>
                  </div>
                ) : (
                  <div className="p-2 space-y-0.5">
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.user_id}
                        onClick={() => setSelectedPartner(conv)}
                        className={`w-full flex items-center gap-3 rounded-lg p-3 transition-colors text-start ${
                          selectedPartner?.user_id === conv.user_id
                            ? "bg-accent"
                            : "hover:bg-accent/50"
                        }`}
                      >
                        <div className="relative shrink-0">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conv.avatar_url || undefined} />
                            <AvatarFallback className="text-sm">
                              {(conv.full_name || "U")[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {isOnline(conv.user_id) && (
                            <div className="absolute bottom-0 end-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium truncate">
                              {conv.full_name || conv.username || "Unknown"}
                            </p>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {formatConvTime(conv.last_message_at)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <p className="text-xs text-muted-foreground truncate">
                              {conv.last_message}
                            </p>
                            {conv.unread_count > 0 && (
                              <Badge className="h-5 min-w-5 justify-center text-[10px] px-1.5 shrink-0">
                                {conv.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col ${!selectedPartner ? "hidden md:flex" : ""}`}>
              {selectedPartner ? (
                <>
                  {/* Chat Header */}
                  <div className="border-b p-3 flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden h-8 w-8"
                      onClick={() => setSelectedPartner(null)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="relative">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={selectedPartner.avatar_url || undefined} />
                        <AvatarFallback className="text-sm">
                          {(selectedPartner.full_name || "U")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline(selectedPartner.user_id) && (
                        <div className="absolute bottom-0 end-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {selectedPartner.full_name || selectedPartner.username || "Unknown"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {partnerTyping
                          ? language === "ar"
                            ? "يكتب..."
                            : "typing..."
                          : isOnline(selectedPartner.user_id)
                          ? language === "ar"
                            ? "متصل"
                            : "online"
                          : selectedPartner.username
                          ? `@${selectedPartner.username}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {loadingMessages ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-12 w-2/3" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages?.map((msg) => {
                          const isMine = msg.sender_id === user?.id;
                          return (
                            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} animate-fade-in`}>
                              <div
                                className={`max-w-[75%] rounded-2xl px-3.5 py-2 transition-all duration-200 hover:shadow-md ${
                                  isMine
                                    ? "bg-primary text-primary-foreground rounded-ee-md"
                                    : "bg-muted rounded-es-md"
                                }`}
                              >
                                <p className="text-sm break-words">{msg.content}</p>
                                <div
                                  className={`flex items-center gap-1 mt-1 text-[10px] ${
                                    isMine ? "text-primary-foreground/60 justify-end" : "text-muted-foreground"
                                  }`}
                                >
                                  <span>{formatMessageDate(msg.created_at)}</span>
                                  {isMine &&
                                    (msg.is_read ? (
                                      <CheckCheck className="h-3 w-3 text-primary-foreground/80" />
                                    ) : (
                                      <Check className="h-3 w-3" />
                                    ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Message Input */}
                  <form onSubmit={handleSend} className="border-t p-3">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={handleInputChange}
                        placeholder={language === "ar" ? "اكتب رسالة..." : "Type a message..."}
                        className="flex-1 h-9 text-sm"
                      />
                      <Button type="submit" size="sm" disabled={!newMessage.trim() || sendMessage.isPending}>
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div>
                    <MessageSquare className="mx-auto h-14 w-14 text-muted-foreground/20 mb-4" />
                    <h3 className="font-semibold">
                      {language === "ar" ? "اختر محادثة" : "Select a conversation"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {language === "ar"
                        ? "اختر محادثة من القائمة لبدء المراسلة"
                        : "Choose a conversation from the list to start messaging"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
