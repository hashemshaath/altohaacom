import React, { useState, useCallback, useRef } from "react";
import { Bell, BellOff, ShoppingCart, CheckCircle, Trophy, FileText, Users, Heart, MessageCircle, UserPlus, Radio, Eye, Flame, Settings, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNotifications, useNotificationPrefs } from "@/hooks/useNotifications";
import { useNotificationProfiles } from "@/hooks/useNotificationProfiles";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { toEnglishDigits } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cn } from "@/lib/utils";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

type NotificationCategory = "all" | "social" | "approvals" | "orders" | "competitions" | "general";

function categorizeNotification(notification: { link?: string | null; title?: string; type?: string | null }): NotificationCategory {
  const link = notification.link || "";
  const title = (notification.title || "").toLowerCase();
  const type = notification.type || "";
  if (["reaction", "follow", "follow_request", "story_view", "live_session", "comment", "mention"].includes(type)) return "social";
  if (link.includes("/community") || title.includes("follow") || title.includes("react") || title.includes("متابع") || title.includes("تفاعل")) return "social";
  if (link.includes("/admin/") || title.includes("approv") || title.includes("review") || title.includes("verif") || title.includes("موافق") || title.includes("مراجع") || title.includes("توثيق")) return "approvals";
  if (link.includes("/order") || link.includes("/invoice") || title.includes("order") || title.includes("invoice") || title.includes("payment") || title.includes("طلب") || title.includes("فاتور") || title.includes("دفع")) return "orders";
  if (link.includes("/competition") || title.includes("competition") || title.includes("judge") || title.includes("score") || title.includes("مسابق") || title.includes("حكم") || title.includes("تقييم")) return "competitions";
  return "general";
}

function formatRelativeTime(dateStr: string, isAr: boolean): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSecs < 60) return isAr ? "الآن" : "just now";
  if (diffMins < 60) return isAr ? `منذ ${toEnglishDigits(diffMins)} د` : `${toEnglishDigits(diffMins)}m ago`;
  if (diffHours < 24) return isAr ? `منذ ${toEnglishDigits(diffHours)} س` : `${toEnglishDigits(diffHours)}h ago`;
  if (diffDays < 7) return isAr ? `منذ ${toEnglishDigits(diffDays)} ي` : `${toEnglishDigits(diffDays)}d ago`;
  if (diffWeeks < 4) return isAr ? `منذ ${toEnglishDigits(diffWeeks)} أسبوع` : `${toEnglishDigits(diffWeeks)}w ago`;
  return toEnglishDigits(date.toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric" }));
}

/** Group similar notifications (same type within 1 hour) */
function groupNotifications(notifications: any[]) {
  const groups: { key: string; items: any[]; type: string | null }[] = [];
  const used = new Set<string>();

  for (const n of notifications) {
    if (used.has(n.id)) continue;
    const type = n.type || "info";
    const similar = notifications.filter(
      (other) =>
        !used.has(other.id) &&
        other.type === type &&
        other.id !== n.id &&
        Math.abs(new Date(other.created_at).getTime() - new Date(n.created_at).getTime()) < 3600000
    );

    if (similar.length >= 2) {
      // Group 3+ similar notifications
      const all = [n, ...similar];
      all.forEach((item) => used.add(item.id));
      groups.push({ key: `group-${n.id}`, items: all, type });
    } else {
      used.add(n.id);
      groups.push({ key: n.id, items: [n], type });
    }
  }

  return groups;
}

export const NotificationBell = React.forwardRef<HTMLButtonElement, Record<string, never>>(function NotificationBell(_props, _ref) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const { getProfile } = useNotificationProfiles(notifications);
  const { soundEnabled, setSoundEnabled, dndMode, setDndMode } = useNotificationPrefs();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isAr = language === "ar";
  const [category, setCategory] = useState<NotificationCategory>("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Keyboard shortcut: press 'n' to toggle notification panel
  useKeyboardShortcuts([
    { key: "n", handler: () => setMenuOpen(prev => !prev) },
  ]);

  const filteredNotifications = category === "all"
    ? notifications
    : notifications.filter(n => categorizeNotification(n) === category);

  const grouped = groupNotifications(filteredNotifications.slice(0, 30));

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    await markAsRead(notification.id);
    if (notification.link) navigate(notification.link);
  };

  const getNotificationIcon = (type: string | null) => {
    switch (type) {
      case "reaction": return <Flame className="h-3.5 w-3.5" />;
      case "follow": case "follow_request": return <UserPlus className="h-3.5 w-3.5" />;
      case "comment": case "mention": return <MessageCircle className="h-3.5 w-3.5" />;
      case "story_view": return <Eye className="h-3.5 w-3.5" />;
      case "live_session": return <Radio className="h-3.5 w-3.5" />;
      case "success": return <CheckCircle className="h-3.5 w-3.5" />;
      case "warning": return <Trophy className="h-3.5 w-3.5" />;
      case "error": return <Bell className="h-3.5 w-3.5" />;
      default: return <Bell className="h-3.5 w-3.5" />;
    }
  };

  const getNotificationIconColor = (type: string | null) => {
    switch (type) {
      case "reaction": return "bg-destructive/10 text-destructive";
      case "follow": case "follow_request": return "bg-primary/10 text-primary";
      case "comment": case "mention": return "bg-chart-3/10 text-chart-3";
      case "story_view": return "bg-chart-4/10 text-chart-4";
      case "live_session": return "bg-destructive/10 text-destructive";
      case "success": return "bg-chart-3/10 text-chart-3";
      case "warning": return "bg-chart-4/10 text-chart-4";
      case "error": return "bg-destructive/10 text-destructive";
      default: return "bg-primary/10 text-primary";
    }
  };

  const categoryLabels: Record<NotificationCategory, { en: string; ar: string; icon: React.ReactNode }> = {
    all: { en: "All", ar: "الكل", icon: <Bell className="h-3 w-3" /> },
    social: { en: "Social", ar: "اجتماعي", icon: <Heart className="h-3 w-3" /> },
    approvals: { en: "Approvals", ar: "الموافقات", icon: <CheckCircle className="h-3 w-3" /> },
    orders: { en: "Orders", ar: "الطلبات", icon: <ShoppingCart className="h-3 w-3" /> },
    competitions: { en: "Events", ar: "الفعاليات", icon: <Trophy className="h-3 w-3" /> },
    general: { en: "General", ar: "عام", icon: <FileText className="h-3 w-3" /> },
  };

  const getTitle = (n: typeof notifications[0]) => {
    if (isAr && n.title_ar) return n.title_ar;
    if (!isAr && n.title) return n.title;
    return isAr ? (n.title_ar || n.title) : (n.title || n.title_ar);
  };

  const getBody = (n: typeof notifications[0]) => {
    if (isAr && n.body_ar) return n.body_ar;
    if (!isAr && n.body) return n.body;
    return isAr ? (n.body_ar || n.body) : (n.body || n.body_ar);
  };

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button ref={triggerRef} variant="ghost" size="icon" className="relative group" title={`${isAr ? "الإشعارات" : "Notifications"} (N)`}>
          {dndMode ? (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Bell className="h-5 w-5 transition-transform group-hover:rotate-12" />
          )}
          {unreadCount > 0 && !dndMode && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -end-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-scale-in"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px] rounded-xl border-border/50 shadow-xl shadow-primary/5">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary/5 to-transparent rounded-t-xl">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base">{isAr ? "الإشعارات" : "Notifications"}</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5">{unreadCount} {isAr ? "جديد" : "new"}</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-7 text-primary hover:text-primary">
                {isAr ? "قراءة الكل" : "Mark all read"}
              </Button>
            )}
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              onClick={(e) => { e.preventDefault(); setSoundEnabled(!soundEnabled); }}
              title={soundEnabled ? "Mute" : "Unmute"}
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-muted-foreground" /> : <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />}
            </Button>
            <Button
              variant="ghost" size="icon" className={cn("h-7 w-7", dndMode && "text-destructive")}
              onClick={(e) => { e.preventDefault(); setDndMode(!dndMode); }}
              title={dndMode ? "Disable DND" : "Enable DND"}
            >
              {dndMode ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5 text-muted-foreground" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.preventDefault(); navigate("/notification-preferences"); }}>
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Category chips */}
        <div className="px-3 py-2 flex gap-1 flex-wrap border-b border-border/50">
          {(Object.keys(categoryLabels) as NotificationCategory[]).map((cat) => {
            const label = categoryLabels[cat];
            const count = cat === "all" ? notifications.length : notifications.filter(n => categorizeNotification(n) === cat).length;
            if (cat !== "all" && count === 0) return null;
            return (
              <Button
                key={cat}
                variant={category === cat ? "default" : "secondary"}
                size="sm"
                className={cn("h-7 text-[10px] gap-1 px-2.5 rounded-full", category === cat && "shadow-sm")}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCategory(cat); }}
              >
                {label.icon}
                {isAr ? label.ar : label.en}
                {count > 0 && <span className="opacity-70">(<AnimatedCounter value={count} className="inline" />)</span>}
              </Button>
            );
          })}
        </div>

        <ScrollArea className="h-[380px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : grouped.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-muted/60 to-muted/20">
                <Bell className="h-8 w-8 text-muted-foreground/20" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{isAr ? "لا توجد إشعارات" : "All caught up!"}</p>
                <p className="text-xs text-muted-foreground/50 mt-1">{isAr ? "ستظهر الإشعارات الجديدة هنا" : "New notifications will appear here"}</p>
              </div>
            </div>
          ) : (
            grouped.map((group) => {
              if (group.items.length > 1) {
                // Grouped notification
                const first = group.items[0];
                const count = group.items.length;
                const anyUnread = group.items.some((i) => !i.is_read);
                const typeLabel = first.type === "reaction"
                  ? (isAr ? "تفاعل" : "reactions")
                  : first.type === "follow"
                  ? (isAr ? "متابعة" : "follows")
                  : first.type === "story_view"
                  ? (isAr ? "مشاهدة" : "story views")
                  : (isAr ? "إشعار" : "notifications");

                return (
                  <DropdownMenuItem
                    key={group.key}
                    className={cn(
                      "flex items-start gap-3 p-3 cursor-pointer transition-colors focus:bg-muted/50",
                      anyUnread && "bg-primary/5"
                    )}
                    onClick={() => navigate("/notifications")}
                  >
                    {/* Stacked avatars */}
                    <div className="relative shrink-0 w-9 h-9 mt-0.5">
                      <div className={cn("flex h-9 w-9 items-center justify-center rounded-full", getNotificationIconColor(first.type))}>
                        {getNotificationIcon(first.type)}
                      </div>
                      <Badge className="absolute -bottom-1 -end-1 h-4 min-w-4 text-[9px] px-1 justify-center">
                        {count}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm leading-snug", anyUnread && "font-semibold")}>
                        <AnimatedCounter value={count} className="inline" /> {typeLabel}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {getTitle(first)} {isAr ? "و أخرى" : "and more"}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {formatRelativeTime(first.created_at, isAr)}
                      </p>
                    </div>
                    {anyUnread && <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2 animate-pulse" />}
                  </DropdownMenuItem>
                );
              }

              // Single notification with avatar
              const notification = group.items[0];
              const profile = getProfile(notification.metadata as Record<string, any> | null);

              return (
                <DropdownMenuItem
                  key={group.key}
                  className={cn(
                    "flex items-start gap-3 p-3 cursor-pointer transition-colors focus:bg-muted/50",
                    !notification.is_read && "bg-primary/5"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Avatar or icon */}
                  {profile ? (
                    <div className="relative shrink-0 mt-0.5">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">{(profile.full_name || "U")[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className={cn(
                        "absolute -bottom-0.5 -end-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-card",
                        getNotificationIconColor(notification.type)
                      )}>
                        {React.cloneElement(getNotificationIcon(notification.type) as React.ReactElement, { className: "h-2.5 w-2.5" })}
                      </span>
                    </div>
                  ) : (
                    <span className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full mt-0.5",
                      getNotificationIconColor(notification.type)
                    )}>
                      {getNotificationIcon(notification.type)}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm leading-snug", !notification.is_read && "font-semibold")}>
                      {getTitle(notification)}
                    </p>
                    {getBody(notification) && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {getBody(notification)}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {formatRelativeTime(notification.created_at, isAr)}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2 animate-pulse" />
                  )}
                </DropdownMenuItem>
              );
            })
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center py-2.5 text-primary font-medium text-sm"
              onClick={() => navigate("/notifications")}
            >
              {isAr ? "عرض جميع الإشعارات" : "View all notifications"}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
