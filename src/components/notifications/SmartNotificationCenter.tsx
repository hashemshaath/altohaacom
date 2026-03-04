import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Bell, CheckCheck, Trash2, Filter, BellOff, Mail, Smartphone, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface Props {
  open: boolean;
  onClose: () => void;
}

const typeIcons: Record<string, string> = {
  follow: "👤", reaction: "❤️", comment: "💬", competition: "🏆",
  exhibition_update: "📢", booth_assignment: "🏗️", schedule: "📅",
  bio_milestone: "🎉", supplier_review: "⭐", live_session: "🎥",
  exhibition_review: "⭐", story_view: "👁️", link_milestone: "🔗",
  bio_subscriber: "📬", follow_request: "🔔", exhibition_reminder: "⏰",
  system: "⚙️",
};

export default function SmartNotificationCenter({ open, onClose }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["smart-notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && open,
    staleTime: 1000 * 60 * 2,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user?.id || !open) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["smart-notifications", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, open, queryClient]);

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read).map(n => n.id);
      if (!unread.length) return;
      const { error } = await supabase.from("notifications").update({ is_read: true }).in("id", unread);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smart-notifications"] });
      toast({ title: isAr ? "تم تحديد الكل كمقروء" : "All marked as read" });
    },
  });

  const markRead = useCallback(async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["smart-notifications"] });
  }, [queryClient]);

  const deleteNotif = useCallback(async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["smart-notifications"] });
  }, [queryClient]);

  const filtered = notifications.filter(n => {
    if (tab === "unread" && n.is_read) return false;
    if (typeFilter && n.type !== typeFilter) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const types = [...new Set(notifications.map(n => n.type).filter(Boolean))];

  // Group by date
  const grouped = groupByDate(filtered, isAr);

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md p-0" side={isAr ? "left" : "right"}>
        <SheetHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {isAr ? "الإشعارات" : "Notifications"}
              {unreadCount > 0 && <Badge variant="destructive" className="text-xs">{unreadCount}</Badge>}
            </SheetTitle>
            <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()} disabled={!unreadCount}>
              <CheckCheck className="h-4 w-4 me-1" />
              {isAr ? "قراءة الكل" : "Read all"}
            </Button>
          </div>
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <div className="px-4">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="all">{isAr ? "الكل" : "All"}</TabsTrigger>
              <TabsTrigger value="unread">{isAr ? "غير مقروء" : "Unread"} {unreadCount > 0 && `(${unreadCount})`}</TabsTrigger>
              <TabsTrigger value="filter"><Filter className="h-3.5 w-3.5 me-1" />{isAr ? "تصنيف" : "Filter"}</TabsTrigger>
            </TabsList>
          </div>

          {tab === "filter" && (
            <div className="px-4 py-2 flex flex-wrap gap-1.5">
              <Badge variant={!typeFilter ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => setTypeFilter(null)}>
                {isAr ? "الكل" : "All"}
              </Badge>
              {types.map(t => (
                <Badge key={t} variant={typeFilter === t ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => setTypeFilter(t)}>
                  {typeIcons[t || "system"] || "📌"} {t}
                </Badge>
              ))}
            </div>
          )}

          <ScrollArea className="h-[calc(100vh-160px)]">
            <div className="p-4 space-y-4">
              {!filtered.length ? (
                <div className="text-center py-16">
                  <BellOff className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">{isAr ? "لا توجد إشعارات" : "No notifications"}</p>
                </div>
              ) : Object.entries(grouped).map(([date, items]) => (
                <div key={date}>
                  <p className="text-xs font-medium text-muted-foreground mb-2 sticky top-0 bg-background z-10 py-1">{date}</p>
                  <div className="space-y-1">
                    {(items as any[]).map((n: any) => (
                      <div
                        key={n.id}
                        className={`group relative flex items-start gap-3 rounded-xl p-3 transition-colors cursor-pointer hover:bg-muted/50 ${!n.is_read ? "bg-primary/5 border-s-2 border-primary" : ""}`}
                        onClick={() => !n.is_read && markRead(n.id)}
                      >
                        <span className="text-lg shrink-0 mt-0.5">{typeIcons[n.type || "system"] || "📌"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">{isAr ? n.title_ar || n.title : n.title}</p>
                          {(n.body || n.body_ar) && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{isAr ? n.body_ar || n.body : n.body}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-1">
                            <Clock className="h-3 w-3 inline me-0.5" />
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: isAr ? ar : undefined })}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0" onClick={e => { e.stopPropagation(); deleteNotif(n.id); }}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function groupByDate(notifications: any[], isAr: boolean) {
  const groups: Record<string, any[]> = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  notifications.forEach(n => {
    const d = new Date(n.created_at).toDateString();
    const label = d === today ? (isAr ? "اليوم" : "Today") : d === yesterday ? (isAr ? "أمس" : "Yesterday") : new Date(n.created_at).toLocaleDateString(isAr ? "ar" : "en", { month: "short", day: "numeric" });
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  });
  return groups;
}
