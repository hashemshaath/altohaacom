import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { MessageSquare, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const RecentChatsWidget = memo(function RecentChatsWidget() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";

  const { data: chats } = useQuery({
    queryKey: ["recent-chats-widget", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Get recent conversations
      const { data: messages } = await supabase
        .from("messages")
        .select("id, content, sender_id, receiver_id, is_read, created_at")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!messages || messages.length === 0) return [];

      // Group by partner and get latest message
      const partnerMap = new Map<string, typeof messages[0]>();
      messages.forEach(m => {
        const partnerId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        if (!partnerMap.has(partnerId)) {
          partnerMap.set(partnerId, m);
        }
      });

      const partnerIds = [...partnerMap.keys()].slice(0, 4);
      
      // Get partner profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, username, avatar_url")
        .in("user_id", partnerIds);

      return partnerIds.map(pid => {
        const msg = partnerMap.get(pid)!;
        const profile = profiles?.find(p => p.user_id === pid);
        const isUnread = msg.receiver_id === user.id && !msg.is_read;
        return { ...msg, partner: profile, isUnread };
      });
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  if (!chats || chats.length === 0) return null;

  const unreadCount = chats.filter(c => c.isUnread).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          {isAr ? "المحادثات الأخيرة" : "Recent Chats"}
          {unreadCount > 0 && (
            <Badge className="ms-auto text-[12px] h-4 px-1.5 bg-primary">{unreadCount}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {chats.map((chat) => {
          const name = isAr && chat.partner?.full_name_ar ? chat.partner.full_name_ar : (chat.partner?.full_name || chat.partner?.username || "User");
          const initials = name.slice(0, 2).toUpperCase();

          return (
            <Link key={chat.id} to="/messages" className="block">
              <div className={`flex items-center gap-2.5 rounded-xl p-2 transition-all hover:bg-muted/50 active:scale-[0.98] ${chat.isUnread ? "bg-primary/5 border border-primary/10" : ""}`}>
                <div className="relative">
                  <Avatar className="h-9 w-9 ring-1 ring-border/30">
                    <AvatarImage src={chat.partner?.avatar_url || undefined} />
                    <AvatarFallback className="text-[12px] bg-muted">{initials}</AvatarFallback>
                  </Avatar>
                  {chat.isUnread && (
                    <div className="absolute -top-0.5 -end-0.5 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background">
                      <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-40" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-xs truncate ${chat.isUnread ? "font-bold text-foreground" : "font-medium"}`}>{name}</span>
                    <span className={`text-[12px] shrink-0 ${chat.isUnread ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                      {formatDistanceToNow(new Date(chat.created_at), { addSuffix: false })}
                    </span>
                  </div>
                  <p className={`text-[12px] truncate ${chat.isUnread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {chat.sender_id === user!.id && <span className="text-muted-foreground">{isAr ? "أنت: " : "You: "}</span>}
                    {chat.content || (isAr ? "مرفق 📎" : "Attachment 📎")}
                  </p>
                </div>
                {chat.isUnread && (
                  <div className="shrink-0 h-2 w-2 rounded-full bg-primary" />
                )}
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
});
