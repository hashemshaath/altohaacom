import React from "react";
import { Bell } from "lucide-react";
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
import { useNotifications } from "@/hooks/useNotifications";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export const NotificationBell = React.forwardRef<HTMLButtonElement, Record<string, never>>(function NotificationBell(_props, _ref) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    await markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return "✓";
      case "warning":
        return "⚠";
      case "error":
        return "✕";
      default:
        return "ℹ";
    }
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
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2">
          <h3 className="font-semibold">{t("notifications")}</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              {t("markAllRead")}
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {t("noNotifications")}
            </div>
          ) : (
            notifications.map((notification) => (
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
                      {language === "ar" && notification.title_ar 
                        ? notification.title_ar 
                        : notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {language === "ar" && notification.body_ar 
                        ? notification.body_ar 
                        : notification.body}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: language === "ar" ? ar : enUS,
                      })}
                    </p>
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
