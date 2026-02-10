import { useNotifications } from "@/hooks/useNotifications";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, ArrowRight, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, React.ElementType> = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

const typeColors: Record<string, string> = {
  success: "text-primary",
  warning: "text-chart-4",
  error: "text-destructive",
  info: "text-accent-foreground",
};

export function NotificationsSummaryWidget() {
  const { notifications, unreadCount, markAsRead, loading } = useNotifications();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isAr = language === "ar";

  const recentUnread = notifications.filter((n) => !n.is_read).slice(0, 4);

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/30 px-4 py-3">
          <Skeleton className="h-5 w-32" />
        </div>
        <CardContent className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-4/10">
            <Bell className="h-3.5 w-3.5 text-chart-4" />
          </div>
          {isAr ? "الإشعارات" : "Notifications"}
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ms-1 h-5 min-w-5 justify-center px-1.5 text-[10px]">
              {unreadCount}
            </Badge>
          )}
        </h3>
        <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" asChild>
          <Link to="/notifications">
            {isAr ? "عرض الكل" : "View All"}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>
      <CardContent className="p-4">
        {recentUnread.length > 0 ? (
          <div className="divide-y">
            {recentUnread.map((notification) => {
              const Icon = typeIcons[notification.type || "info"] || Info;
              const color = typeColors[notification.type || "info"] || "text-muted-foreground";

              return (
                <button
                  key={notification.id}
                  onClick={async () => {
                    await markAsRead(notification.id);
                    if (notification.link) navigate(notification.link);
                  }}
                  className="flex w-full items-start gap-2.5 py-3 text-start first:pt-0 last:pb-0 transition-colors hover:bg-muted/30 -mx-1 px-1 rounded-md"
                >
                  <div className="mt-0.5 shrink-0">
                    <Icon className={cn("h-3.5 w-3.5", color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1 leading-snug">
                      {isAr && notification.title_ar ? notification.title_ar : notification.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">
                      {isAr && notification.body_ar ? notification.body_ar : notification.body}
                    </p>
                    <span className="mt-1 block text-[10px] text-muted-foreground/60">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: isAr ? ar : enUS,
                      })}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Bell className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isAr ? "لا توجد إشعارات جديدة" : "No new notifications"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
