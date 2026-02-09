import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Send, 
  Search,
  Check,
  CheckCheck,
  ArrowLeft
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

  // Fetch conversations
  const { data: conversations, isLoading: loadingConversations } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get all messages involving this user
      const { data: messages } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!messages) return [];

      // Group by conversation partner
      const partnerMap = new Map<string, {
        messages: Message[];
        unread: number;
      }>();

      messages.forEach(msg => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const existing = partnerMap.get(partnerId) || { messages: [], unread: 0 };
        existing.messages.push(msg);
        if (!msg.is_read && msg.receiver_id === user.id) {
          existing.unread++;
        }
        partnerMap.set(partnerId, existing);
      });

      // Fetch partner profiles
      const partnerIds = Array.from(partnerMap.keys());
      if (partnerIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, avatar_url")
        .in("user_id", partnerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return partnerIds.map(partnerId => {
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
      }).sort((a, b) => 
        new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
      );
    },
    enabled: !!user,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ["messages", user?.id, selectedPartner?.user_id],
    queryFn: async () => {
      if (!user || !selectedPartner) return [];

      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedPartner.user_id}),and(sender_id.eq.${selectedPartner.user_id},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      // Mark messages as read
      if (data && data.length > 0) {
        const unreadIds = data
          .filter(m => m.receiver_id === user.id && !m.is_read)
          .map(m => m.id);
        
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
    refetchInterval: 3000,
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
      const existing = conversations.find(c => c.user_id === initialUserId);
      if (existing) {
        setSelectedPartner(existing);
      } else {
        // Fetch user profile for new conversation
        supabase
          .from("profiles")
          .select("user_id, username, full_name, avatar_url")
          .eq("user_id", initialUserId)
          .single()
          .then(({ data }) => {
            if (data) {
              setSelectedPartner({
                ...data,
                unread_count: 0,
              });
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

  const formatMessageDate = (date: string) => {
    const d = new Date(date);
    const locale = language === "ar" ? ar : enUS;
    
    if (isToday(d)) {
      return format(d, "h:mm a", { locale });
    }
    if (isYesterday(d)) {
      return `${language === "ar" ? "أمس" : "Yesterday"} ${format(d, "h:mm a", { locale })}`;
    }
    return format(d, "MMM d, h:mm a", { locale });
  };

  const filteredConversations = conversations?.filter(c =>
    !searchQuery ||
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="container flex-1 py-4 md:py-8">
        <Card className="mx-auto max-w-5xl h-[calc(100vh-200px)] min-h-[500px]">
          <div className="flex h-full">
            {/* Conversations List */}
            <div className={`w-full border-r md:w-80 ${selectedPartner ? "hidden md:block" : ""}`}>
              <CardHeader className="border-b p-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  {language === "ar" ? "الرسائل" : "Messages"}
                </CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={language === "ar" ? "بحث..." : "Search..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              
              <ScrollArea className="h-[calc(100%-120px)]">
                {loadingConversations ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : !filteredConversations?.length ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <MessageSquare className="mx-auto h-10 w-10 mb-2 opacity-50" />
                    <p>{language === "ar" ? "لا توجد محادثات" : "No conversations yet"}</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.user_id}
                        onClick={() => setSelectedPartner(conv)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                          selectedPartner?.user_id === conv.user_id
                            ? "bg-accent"
                            : "hover:bg-accent/50"
                        }`}
                      >
                        <Avatar>
                          <AvatarImage src={conv.avatar_url || undefined} />
                          <AvatarFallback>
                            {(conv.full_name || "U")[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">
                              {conv.full_name || conv.username || "Unknown"}
                            </p>
                            {conv.unread_count > 0 && (
                              <Badge variant="default" className="ml-2">
                                {conv.unread_count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.last_message}
                          </p>
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
                  <div className="border-b p-4 flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => setSelectedPartner(null)}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Avatar>
                      <AvatarImage src={selectedPartner.avatar_url || undefined} />
                      <AvatarFallback>
                        {(selectedPartner.full_name || "U")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">
                        {selectedPartner.full_name || selectedPartner.username || "Unknown"}
                      </p>
                      {selectedPartner.username && (
                        <p className="text-sm text-muted-foreground">@{selectedPartner.username}</p>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {loadingMessages ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                          <Skeleton key={i} className="h-12 w-2/3" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages?.map((msg) => {
                          const isMine = msg.sender_id === user?.id;
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[75%] rounded-lg px-4 py-2 ${
                                  isMine
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                              >
                                <p className="break-words">{msg.content}</p>
                                <div className={`flex items-center gap-1 mt-1 text-xs ${
                                  isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                                }`}>
                                  <span>{formatMessageDate(msg.created_at)}</span>
                                  {isMine && (
                                    msg.is_read 
                                      ? <CheckCheck className="h-3 w-3" />
                                      : <Check className="h-3 w-3" />
                                  )}
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
                  <form onSubmit={handleSend} className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={language === "ar" ? "اكتب رسالة..." : "Type a message..."}
                        className="flex-1"
                      />
                      <Button type="submit" disabled={!newMessage.trim() || sendMessage.isPending}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div>
                    <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h3 className="font-semibold text-lg">
                      {language === "ar" ? "اختر محادثة" : "Select a conversation"}
                    </h3>
                    <p className="text-muted-foreground">
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
