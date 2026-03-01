import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, Heart, Users, Trophy, Star, MessageSquare, Megaphone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

const ICON_MAP: Record<string, any> = {
  follow: Users,
  follow_request: Users,
  reaction: Heart,
  competition: Trophy,
  exhibition_update: Megaphone,
  exhibition_review: Star,
  story_view: Star,
  bio_subscriber: Users,
  bio_milestone: Star,
  link_milestone: Star,
  supplier_review: Star,
  supplier_inquiry: MessageSquare,
  default: Bell,
};

export function FanNotificationsCenter() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["fan-notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("notifications")
        .select("id, title, title_ar, body, body_ar, type, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
    const unreadIds = notifications.filter((n: any) => !n.is_read).map((n: any) => n.id);
    await supabase.from("notifications").update({ is_read: true } as any).in("id", unreadIds);
    queryClient.invalidateQueries({ queryKey: ["fan-notifications"] });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
              <Bell className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "مركز الإشعارات" : "Notifications"}
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={markAllRead}>
              <Check className="h-3 w-3" />
              {isAr ? "قراءة الكل" : "Mark all read"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">{isAr ? "لا توجد إشعارات بعد" : "No notifications yet"}</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-1.5">
              {notifications.map((n: any) => {
                const Icon = ICON_MAP[n.type] || ICON_MAP.default;
                const timeAgo = formatDistanceToNow(new Date(n.created_at), {
                  addSuffix: true,
                  locale: isAr ? ar : enUS,
                });
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-2.5 rounded-xl p-2.5 transition-colors ${
                      n.is_read ? "opacity-60" : "bg-primary/5"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-tight line-clamp-2">
                        {isAr ? n.title_ar || n.title : n.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo}</p>
                    </div>
                    {!n.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
