import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MessageCircle, Send, Circle, Search, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function LiveChatWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch conversations (latest message per conversation partner)
  const { data: conversations = [] } = useQuery({
    queryKey: ["chat-conversations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, sender:sender_id(full_name, full_name_ar, avatar_url, username), receiver:receiver_id(full_name, full_name_ar, avatar_url, username)")
        .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) return [];

      // Group by partner
      const partnersMap = new Map<string, any>();
      (data || []).forEach((msg: any) => {
        const partnerId = msg.sender_id === user!.id ? msg.receiver_id : msg.sender_id;
        if (!partnersMap.has(partnerId)) {
          const partner = msg.sender_id === user!.id ? msg.receiver : msg.sender;
          partnersMap.set(partnerId, {
            partnerId,
            partner,
            lastMessage: msg,
            unread: msg.receiver_id === user!.id && !msg.is_read ? 1 : 0,
          });
        } else if (msg.receiver_id === user!.id && !msg.is_read) {
          partnersMap.get(partnerId)!.unread++;
        }
      });
      return Array.from(partnersMap.values());
    },
    enabled: !!user?.id && open,
    refetchInterval: 10000,
  });

  // Fetch messages for active chat
  const { data: messages = [] } = useQuery({
    queryKey: ["chat-messages", activeChat, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${activeChat}),and(sender_id.eq.${activeChat},receiver_id.eq.${user!.id})`)
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) return [];
      return data || [];
    },
    enabled: !!activeChat && !!user?.id,
    refetchInterval: 3000,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user?.id || !open) return;
    const channel = supabase
      .channel("live-chat-" + user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
        queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, open, queryClient]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Send message
  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!user || !activeChat || !message.trim()) return;
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: activeChat,
        content: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
  });

  const totalUnread = conversations.reduce((s: number, c: any) => s + (c.unread || 0), 0);
  const activePartner = conversations.find((c: any) => c.partnerId === activeChat)?.partner;

  const filtered = conversations.filter((c: any) => {
    if (!search) return true;
    const name = c.partner?.full_name || c.partner?.username || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <MessageCircle className="h-5 w-5" />
          {totalUnread > 0 && (
            <Badge className="absolute -top-1 -end-1 h-5 min-w-5 rounded-full px-1 text-[10px]">{totalUnread}</Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col" side={isAr ? "left" : "right"}>
        {!activeChat ? (
          <>
            <SheetHeader className="p-4 pb-2">
              <SheetTitle>{isAr ? "الدردشة المباشرة" : "Messages"}</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-2">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={isAr ? "بحث..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} className="ps-9 h-9" />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="px-2 space-y-0.5">
                {!filtered.length ? (
                  <p className="text-sm text-muted-foreground text-center py-12">{isAr ? "لا توجد محادثات" : "No conversations yet"}</p>
                ) : filtered.map((c: any) => (
                  <button
                    key={c.partnerId}
                    onClick={() => setActiveChat(c.partnerId)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-start"
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={c.partner?.avatar_url || ""} />
                        <AvatarFallback>{(c.partner?.full_name || "?")[0]}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">
                          {isAr && c.partner?.full_name_ar ? c.partner.full_name_ar : c.partner?.full_name || c.partner?.username || "—"}
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(c.lastMessage.created_at), { addSuffix: true, locale: isAr ? ar : undefined })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{c.lastMessage.content}</p>
                    </div>
                    {c.unread > 0 && <Badge className="h-5 min-w-5 rounded-full px-1 text-[10px]">{c.unread}</Badge>}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-4 border-b">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveChat(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarImage src={activePartner?.avatar_url || ""} />
                <AvatarFallback>{(activePartner?.full_name || "?")[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{isAr && activePartner?.full_name_ar ? activePartner.full_name_ar : activePartner?.full_name || "—"}</p>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((m: any) => {
                const isMine = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[75%] rounded-2xl px-3.5 py-2 text-sm", isMine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm")}>
                      <p>{m.content}</p>
                      <p className={cn("text-[10px] mt-0.5", isMine ? "text-primary-foreground/60" : "text-muted-foreground")}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div className="p-3 border-t flex gap-2">
              <Input
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage.mutate()}
                placeholder={isAr ? "اكتب رسالة..." : "Type a message..."}
                className="flex-1"
              />
              <Button size="icon" onClick={() => sendMessage.mutate()} disabled={!message.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
