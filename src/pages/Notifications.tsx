import { useState } from "react";
import { Bell, Check, CheckCheck, Trash2, Filter } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotifications } from "@/hooks/useNotifications";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatDistanceToNow, format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "read") return n.is_read;
    return true;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "warning":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      case "error":
        return "bg-red-500/10 text-red-600 dark:text-red-400";
      default:
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      success: { en: "Success", ar: "نجاح" },
      warning: { en: "Warning", ar: "تحذير" },
      error: { en: "Error", ar: "خطأ" },
      info: { en: "Info", ar: "معلومات" },
    };
    return language === "ar" ? labels[type]?.ar || type : labels[type]?.en || type;
  };

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-serif font-bold">
                {t("notifications")}
              </h1>
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount} {language === "ar" ? "جديد" : "new"}</Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                {t("markAllRead")}
              </Button>
            )}
          </div>

          <Tabs value={filter} onValueChange={setFilter} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">
                {language === "ar" ? "الكل" : "All"} ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread">
                {language === "ar" ? "غير مقروء" : "Unread"} ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="read">
                {language === "ar" ? "مقروء" : "Read"} ({notifications.length - unreadCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  {filter === "unread"
                    ? (language === "ar" ? "لا توجد إشعارات غير مقروءة" : "No unread notifications")
                    : (language === "ar" ? "لا توجد إشعارات" : "No notifications")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-accent/50",
                    !notification.is_read && "border-primary/30 bg-primary/5"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn("p-2 rounded-lg", getTypeColor(notification.type || "info"))}>
                        <Bell className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-medium">
                              {language === "ar" && notification.title_ar
                                ? notification.title_ar
                                : notification.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {language === "ar" && notification.body_ar
                                ? notification.body_ar
                                : notification.body}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="outline" className="text-xs">
                              {getTypeLabel(notification.type || "info")}
                            </Badge>
                            {!notification.is_read && (
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: language === "ar" ? ar : enUS,
                            })}
                          </span>
                          {notification.is_read && notification.read_at && (
                            <span className="flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              {language === "ar" ? "تمت القراءة" : "Read"}{" "}
                              {format(new Date(notification.read_at), "MMM d", {
                                locale: language === "ar" ? ar : enUS,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
