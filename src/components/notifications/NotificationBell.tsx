import React, { useState } from "react";
import { Bell, ShoppingCart, CheckCircle, Trophy, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { toEnglishDigits } from "@/lib/formatNumber";
import { cn } from "@/lib/utils";

type NotificationCategory = "all" | "approvals" | "orders" | "competitions" | "general";

function categorizeNotification(notification: { link?: string | null; title?: string; type?: string | null }): NotificationCategory {
  const link = notification.link || "";
  const title = (notification.title || "").toLowerCase();
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

export const NotificationBell = React.forwardRef<HTMLButtonElement, Record<string, never>>(function NotificationBell(_props, _ref) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const isAr = language === "ar";
  const [category, setCategory] = useState<NotificationCategory>("all");

  const filteredNotifications = category === "all"
    ? notifications
    : notifications.filter(n => categorizeNotification(n) === category);

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    await markAsRead(notification.id);
    if (notification.link) navigate(notification.link);
  };

  const getNotificationIcon = (type: string | null) => {
    switch (type) {
      case "success": return <CheckCircle className="h-4 w-4" />;
      case "warning": return <Trophy className="h-4 w-4" />;
      case "error": return <Bell className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const categoryLabels: Record<NotificationCategory, { en: string; ar: string; icon: React.ReactNode }> = {
    all: { en: "All", ar: "الكل", icon: <Bell className="h-3 w-3" /> },
    approvals: { en: "Approvals", ar: "الموافقات", icon: <CheckCircle className="h-3 w-3" /> },
    orders: { en: "Orders", ar: "الطلبات", icon: <ShoppingCart className="h-3 w-3" /> },
    competitions: { en: "Events", ar: "الفعاليات", icon: <Trophy className="h-3 w-3" /> },
    general: { en: "General", ar: "عام", icon: <FileText className="h-3 w-3" /> },
  };

  // Get the correct title/body based on language
  const getTitle = (n: typeof notifications[0]) => {
    if (isAr && n.title_ar) return n.title_ar;
    if (!isAr && n.title) return n.title;
    // Fallback: prefer Arabic for Arabic locale, English otherwise
    return isAr ? (n.title_ar || n.title) : (n.title || n.title_ar);
  };

  const getBody = (n: typeof notifications[0]) => {
    if (isAr && n.body_ar) return n.body_ar;
    if (!isAr && n.body) return n.body;
    return isAr ? (n.body_ar || n.body) : (n.body || n.body_ar);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative group">
          <Bell className="h-5 w-5 transition-transform group-hover:rotate-12" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-scale-in"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={cn("w-[380px]", isAr && "text-right")}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-bold text-base">{isAr ? "الإشعارات" : "Notifications"}</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-7 text-primary">
              {isAr ? "قراءة الكل" : "Mark all read"}
            </Button>
          )}
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
                {count > 0 && <span className="opacity-70">({toEnglishDigits(count.toString())})</span>}
              </Button>
            );
          })}
        </div>

        <ScrollArea className="h-[340px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">{isAr ? "لا توجد إشعارات" : "No notifications"}</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 p-3 cursor-pointer transition-colors focus:bg-muted/50",
                  !notification.is_read && "bg-primary/5"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <span className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-0.5",
                  notification.type === "success" && "bg-chart-3/10 text-chart-3",
                  notification.type === "warning" && "bg-chart-4/10 text-chart-4",
                  notification.type === "error" && "bg-destructive/10 text-destructive",
                  (!notification.type || notification.type === "info") && "bg-primary/10 text-primary",
                )}>
                  {getNotificationIcon(notification.type)}
                </span>
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
            ))
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
