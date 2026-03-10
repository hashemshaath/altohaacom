import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, CheckCheck, BellOff, Clock, Settings, Trash2, Search, AlarmClock, MoreVertical, Pin, Archive } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { SwipeableNotificationCard } from "./SwipeableNotificationCard";
import { NotificationActionButtons } from "./NotificationActionButtons";
import { NotificationPriorityBadge, inferPriority } from "./NotificationPriorityBadge";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// Snooze helpers
const SNOOZE_KEY = "altoha_snoozed_notifications";

function getSnoozed(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(SNOOZE_KEY) || "{}"); } catch { return {}; }
}

function snoozeNotification(id: string, until: number) {
  const snoozed = getSnoozed();
  snoozed[id] = until;
  localStorage.setItem(SNOOZE_KEY, JSON.stringify(snoozed));
}

function unsnoozeExpired(): string[] {
  const snoozed = getSnoozed();
  const now = Date.now();
  const unsnoozed: string[] = [];
  const remaining: Record<string, number> = {};
  for (const [id, until] of Object.entries(snoozed)) {
    if (until <= now) unsnoozed.push(id);
    else remaining[id] = until;
  }
  localStorage.setItem(SNOOZE_KEY, JSON.stringify(remaining));
  return unsnoozed;
}

function isSnoozed(id: string): boolean {
  const snoozed = getSnoozed();
  return snoozed[id] ? snoozed[id] > Date.now() : false;
}

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
  system: "⚙️", mention: "📣", supplier_inquiry: "📩",
};

const categoryMap: Record<string, string> = {
  follow: "social", follow_request: "social", reaction: "social",
  comment: "social", mention: "social", story_view: "social", live_session: "social",
  exhibition_update: "events", exhibition_review: "events", exhibition_reminder: "events",
  booth_assignment: "events", schedule: "events",
  competition: "events", supplier_review: "events",
  bio_milestone: "system", bio_subscriber: "system", link_milestone: "system",
  supplier_inquiry: "system", supplier_milestone: "system",
  system: "system",
};

type CategoryFilter = "all" | "social" | "events" | "system";

const SmartNotificationCenter = memo(function SmartNotificationCenter({ open, onClose }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [snoozedIds, setSnoozedIds] = useState<Set<string>>(() => new Set(Object.keys(getSnoozed()).filter(id => getSnoozed()[id] > Date.now())));

  // Unsnooze expired notifications periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const expired = unsnoozeExpired();
      if (expired.length > 0) {
        setSnoozedIds(prev => {
          const next = new Set(prev);
          expired.forEach(id => next.delete(id));
          return next;
        });
        toast({ title: isAr ? `${expired.length} إشعار عاد من التأجيل` : `${expired.length} snoozed notification${expired.length > 1 ? "s" : ""} returned` });
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isAr]);

  const handleSnooze = useCallback((id: string, durationMs: number) => {
    const until = Date.now() + durationMs;
    snoozeNotification(id, until);
    setSnoozedIds(prev => new Set(prev).add(id));
    const label = durationMs <= 3600000 ? (isAr ? "ساعة" : "1 hour") :
                  durationMs <= 14400000 ? (isAr ? "٤ ساعات" : "4 hours") :
                  (isAr ? "غداً" : "tomorrow");
    toast({ title: isAr ? `تم تأجيل الإشعار لمدة ${label}` : `Snoozed for ${label}` });
  }, [isAr]);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["smart-notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, user_id, title, title_ar, body, body_ar, type, link, is_read, read_at, priority, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && open,
    staleTime: 1000 * 60 * 2,
  });

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
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({ title: isAr ? "تم تحديد الكل كمقروء" : "All marked as read" });
    },
  });

  const markRead = useCallback(async (id: string) => {
    await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["smart-notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }, [queryClient]);

  const deleteNotif = useCallback(async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["smart-notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }, [queryClient]);

  const clearAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notifications").delete().eq("user_id", user!.id).eq("is_read", true);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smart-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({ title: isAr ? "تم حذف الإشعارات المقروءة" : "Read notifications cleared" });
    },
  });

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return notifications.filter(n => {
      const notifSnoozed = snoozedIds.has(n.id);
      if (tab === "snoozed") return notifSnoozed;
      if (notifSnoozed) return false; // Hide snoozed from other tabs
      if (tab === "unread" && n.is_read) return false;
      if (categoryFilter !== "all") {
        const cat = categoryMap[n.type || "system"] || "system";
        if (cat !== categoryFilter) return false;
      }
      if (q) {
        const text = `${n.title || ""} ${n.title_ar || ""} ${n.body || ""} ${n.body_ar || ""}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [notifications, tab, categoryFilter, searchQuery, snoozedIds]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read && !snoozedIds.has(n.id)).length, [notifications, snoozedIds]);
  const readCount = useMemo(() => notifications.filter(n => n.is_read).length, [notifications]);
  const snoozedCount = snoozedIds.size;
  const grouped = useMemo(() => groupByDate(filtered, isAr), [filtered, isAr]);

  const categoryLabels: Record<CategoryFilter, { en: string; ar: string }> = {
    all: { en: "All", ar: "الكل" },
    social: { en: "Social", ar: "اجتماعي" },
    events: { en: "Events", ar: "فعاليات" },
    system: { en: "System", ar: "النظام" },
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md p-0" side={isAr ? "left" : "right"}>
        <SheetHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <div className="relative">
                <Bell className="h-5 w-5 text-primary" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -end-1 h-2.5 w-2.5 rounded-full bg-destructive">
                    <span className="absolute inset-0 rounded-full bg-destructive animate-ping opacity-75" />
                  </span>
                )}
              </div>
              {isAr ? "الإشعارات" : "Notifications"}
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 min-w-[20px] justify-center animate-scale-in">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </SheetTitle>
            <div className="flex items-center gap-1">
              {readCount > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => clearAllRead.mutate()}>
                  <Trash2 className="h-3 w-3 me-1" />
                  {isAr ? "حذف المقروء" : "Clear read"}
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markAllRead.mutate()} disabled={!unreadCount}>
                <CheckCheck className="h-3.5 w-3.5 me-1" />
                {isAr ? "قراءة الكل" : "Read all"}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { onClose(); navigate("/notification-preferences"); }}>
                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          </div>
          {/* Quick stats bar */}
          {notifications.length > 0 && (
            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
              <span>{notifications.length} {isAr ? "إجمالي" : "total"}</span>
              <span className="text-border">|</span>
              <span className="text-primary font-medium">{unreadCount} {isAr ? "جديد" : "new"}</span>
              <span className="text-border">|</span>
              <span>{readCount} {isAr ? "مقروء" : "read"}</span>
            </div>
          )}
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <div className="px-4">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="all">{isAr ? "الكل" : "All"}</TabsTrigger>
              <TabsTrigger value="unread">{isAr ? "غير مقروء" : "Unread"} {unreadCount > 0 && `(${unreadCount})`}</TabsTrigger>
              <TabsTrigger value="snoozed" className="gap-1">
                <AlarmClock className="h-3 w-3" />
                {isAr ? "مؤجل" : "Snoozed"} {snoozedCount > 0 && `(${snoozedCount})`}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Search & category filter */}
          <div className="px-4 pt-2">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={isAr ? "بحث في الإشعارات..." : "Search notifications..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-xs ps-8 rounded-xl"
              />
            </div>
          </div>
          <div className="px-4 py-2 flex gap-1.5 flex-wrap">
            {(Object.keys(categoryLabels) as CategoryFilter[]).map(cat => (
              <Badge
                key={cat}
                variant={categoryFilter === cat ? "default" : "outline"}
                className="cursor-pointer text-xs transition-all active:scale-95"
                onClick={() => setCategoryFilter(cat)}
              >
                {isAr ? categoryLabels[cat].ar : categoryLabels[cat].en}
              </Badge>
            ))}
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="p-4 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : !filtered.length ? (
                <div className="text-center py-16">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-muted/60 to-muted/20 mb-3">
                    <BellOff className="h-8 w-8 text-muted-foreground/20" />
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">{isAr ? "لا توجد إشعارات" : "All caught up!"}</p>
                  <p className="text-xs text-muted-foreground/50 mt-1">{isAr ? "ستظهر الإشعارات الجديدة هنا" : "New notifications will appear here"}</p>
                </div>
              ) : Object.entries(grouped).map(([date, items], gIdx) => (
                <div key={date} className="animate-in fade-in-50 slide-in-from-bottom-1 duration-200" style={{ animationDelay: `${gIdx * 60}ms`, animationFillMode: 'both' }}>
                  <p className="text-xs font-medium text-muted-foreground mb-2 sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-1.5 flex items-center gap-2">
                    {date}
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-lg font-normal tabular-nums">
                      {(items as any[]).length}
                    </Badge>
                  </p>
                  <div className="space-y-1">
                    {(items as any[]).map((n: any) => {
                      const priority = inferPriority(n);
                      return (
                        <SwipeableNotificationCard
                          key={n.id}
                          onMarkRead={() => markRead(n.id)}
                          onDelete={() => deleteNotif(n.id)}
                          isRead={n.is_read}
                        >
                          <div
                            className={cn(
                              "group relative flex items-start gap-3 rounded-xl p-3 transition-colors cursor-pointer hover:bg-muted/50",
                              !n.is_read && "bg-primary/5 border-s-2 border-primary"
                            )}
                            onClick={() => {
                              if (!n.is_read) markRead(n.id);
                              if (n.link) { onClose(); navigate(n.link); }
                            }}
                          >
                            <span className="text-lg shrink-0 mt-0.5">{typeIcons[n.type || "system"] || "📌"}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className={cn("text-sm leading-tight flex-1", !n.is_read && "font-semibold")}>
                                  {isAr ? n.title_ar || n.title : n.title}
                                </p>
                                <NotificationPriorityBadge priority={priority} isAr={isAr} />
                              </div>
                              {(n.body || n.body_ar) && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{isAr ? n.body_ar || n.body : n.body}</p>
                              )}
                              <NotificationActionButtons notification={n} onMarkRead={markRead} />
                              <p className="text-[10px] text-muted-foreground mt-1">
                                <Clock className="h-3 w-3 inline me-0.5" />
                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: isAr ? ar : undefined })}
                              </p>
                            </div>
                            {!n.is_read && (
                              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2 animate-pulse" />
                            )}
                          </div>
                        </SwipeableNotificationCard>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
});

export default SmartNotificationCenter;

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