import React, { useState } from "react";
import { Bell, ShoppingCart, CheckCircle, Trophy, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotifications } from "@/hooks/useNotifications";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

type NotificationCategory = "all" | "approvals" | "orders" | "competitions" | "general";

function categorizeNotification(notification: { link?: string | null; title?: string; type?: string | null }): NotificationCategory {
  const link = notification.link || "";
  const title = (notification.title || "").toLowerCase();
  
  if (link.includes("/admin/") || title.includes("approv") || title.includes("review") || title.includes("verif") || title.includes("موافق") || title.includes("مراجع") || title.includes("توثيق")) {
    return "approvals";
  }
  if (link.includes("/order") || link.includes("/invoice") || title.includes("order") || title.includes("invoice") || title.includes("payment") || title.includes("طلب") || title.includes("فاتور") || title.includes("دفع")) {
    return "orders";
  }
  if (link.includes("/competition") || title.includes("competition") || title.includes("judge") || title.includes("score") || title.includes("مسابق") || title.includes("حكم") || title.includes("تقييم")) {
    return "competitions";
  }
  return "general";
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
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success": return "✓";
      case "warning": return "⚠";
      case "error": return "✕";
      default: return "ℹ";
    }
  };

  const categoryLabels: Record<NotificationCategory, { en: string; ar: string; icon: React.ReactNode }> = {
    all: { en: "All", ar: "الكل", icon: <Bell className="h-3 w-3" /> },
    approvals: { en: "Approvals", ar: "الموافقات", icon: <CheckCircle className="h-3 w-3" /> },
    orders: { en: "Orders", ar: "الطلبات", icon: <ShoppingCart className="h-3 w-3" /> },
    competitions: { en: "Events", ar: "الفعاليات", icon: <Trophy className="h-3 w-3" /> },
    general: { en: "General", ar: "عام", icon: <FileText className="h-3 w-3" /> },
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
      <DropdownMenuContent align="end" className="w-96">
        <div className="flex items-center justify-between px-4 py-2">
          <h3 className="font-semibold">{t("notifications")}</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-7">
              {t("markAllRead")}
            </Button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="px-2 pb-2">
          <div className="flex gap-1 flex-wrap">
            {(Object.keys(categoryLabels) as NotificationCategory[]).map((cat) => {
              const label = categoryLabels[cat];
              const count = cat === "all" ? notifications.length : notifications.filter(n => categorizeNotification(n) === cat).length;
              return (
                <Button
                  key={cat}
                  variant={category === cat ? "default" : "ghost"}
                  size="sm"
                  className={cn("h-7 text-[10px] gap-1 px-2", category === cat && "shadow-sm")}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCategory(cat); }}
                >
                  {label.icon}
                  {isAr ? label.ar : label.en}
                  {count > 0 && <span className="text-[9px] opacity-70">({count})</span>}
                </Button>
              );
            })}
          </div>
        </div>

        <DropdownMenuSeparator />
        <ScrollArea className="h-[320px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              {isAr ? "لا توجد إشعارات" : "No notifications"}
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex flex-col items-start gap-1 p-4 cursor-pointer transition-colors",
                  !notification.is_read && "bg-accent/50 border-s-2 border-s-primary"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex w-full items-start gap-2">
                  <span className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs",
                    notification.type === "success" && "bg-chart-3/10 text-chart-3",
                    notification.type === "warning" && "bg-chart-4/10 text-chart-4",
                    notification.type === "error" && "bg-destructive/10 text-destructive",
                    (!notification.type || notification.type === "info") && "bg-primary/10 text-primary",
                  )}>
                    {getNotificationIcon(notification.type || "info")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {isAr && notification.title_ar 
                        ? notification.title_ar 
                        : notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {isAr && notification.body_ar 
                        ? notification.body_ar 
                        : notification.body}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-muted-foreground/70">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: isAr ? ar : enUS,
                        })}
                      </p>
                      <Badge variant="outline" className="text-[8px] h-4 px-1.5">
                        {isAr ? categoryLabels[categorizeNotification(notification)].ar : categoryLabels[categorizeNotification(notification)].en}
                      </Badge>
                    </div>
                  </div>
                  {!notification.is_read && (
                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 animate-pulse" />
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="justify-center text-primary"
              onClick={() => navigate("/notifications")}
            >
              {t("viewAll")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
