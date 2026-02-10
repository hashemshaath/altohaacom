import { useState } from "react";
import { Bell, Check, CheckCheck, Trash2, X, Filter, Info, AlertTriangle, CircleCheck, CircleX } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNotifications } from "@/hooks/useNotifications";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAllRead, loading } = useNotifications();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredNotifications = notifications.filter((n) => {
    const matchesRead = filter === "all" || (filter === "unread" ? !n.is_read : n.is_read);
    const matchesType = typeFilter === "all" || n.type === typeFilter;
    return matchesRead && matchesType;
  });

  // Group by date
  const grouped = filteredNotifications.reduce<Record<string, typeof filteredNotifications>>((acc, n) => {
    const date = new Date(n.created_at);
    let key: string;
    if (isToday(date)) key = language === "ar" ? "اليوم" : "Today";
    else if (isYesterday(date)) key = language === "ar" ? "أمس" : "Yesterday";
    else key = format(date, "MMM d, yyyy", { locale: language === "ar" ? ar : enUS });
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success": return <CircleCheck className="h-4 w-4" />;
      case "warning": return <AlertTriangle className="h-4 w-4" />;
      case "error": return <CircleX className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success": return "bg-emerald-500/10 text-emerald-600";
      case "warning": return "bg-amber-500/10 text-amber-600";
      case "error": return "bg-destructive/10 text-destructive";
      default: return "bg-primary/10 text-primary";
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
      <main className="container flex-1 py-6 md:py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {language === "ar" ? "الإشعارات" : "Notifications"}
                </h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {language === "ar" ? `${unreadCount} إشعار غير مقروء` : `${unreadCount} unread`}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <CheckCheck className="mr-2 h-4 w-4" />
                  {language === "ar" ? "قراءة الكل" : "Mark All Read"}
                </Button>
              )}
              {notifications.length - unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={clearAllRead}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {language === "ar" ? "مسح المقروءة" : "Clear Read"}
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-s-[3px] border-s-primary">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">{language === "ar" ? "الإجمالي" : "Total"}</p>
                <p className="text-xl font-bold">{notifications.length}</p>
              </CardContent>
            </Card>
            <Card className="border-s-[3px] border-s-amber-500">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">{language === "ar" ? "غير مقروء" : "Unread"}</p>
                <p className="text-xl font-bold">{unreadCount}</p>
              </CardContent>
            </Card>
            <Card className="border-s-[3px] border-s-emerald-500">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">{language === "ar" ? "مقروء" : "Read"}</p>
                <p className="text-xl font-bold">{notifications.length - unreadCount}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList>
                <TabsTrigger value="all">{language === "ar" ? "الكل" : "All"}</TabsTrigger>
                <TabsTrigger value="unread">{language === "ar" ? "غير مقروء" : "Unread"}</TabsTrigger>
                <TabsTrigger value="read">{language === "ar" ? "مقروء" : "Read"}</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px]">
                <Filter className="mr-2 h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "ar" ? "كل الأنواع" : "All Types"}</SelectItem>
                <SelectItem value="info">{language === "ar" ? "معلومات" : "Info"}</SelectItem>
                <SelectItem value="success">{language === "ar" ? "نجاح" : "Success"}</SelectItem>
                <SelectItem value="warning">{language === "ar" ? "تحذير" : "Warning"}</SelectItem>
                <SelectItem value="error">{language === "ar" ? "خطأ" : "Error"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
                  <Bell className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  {filter === "unread"
                    ? (language === "ar" ? "لا توجد إشعارات غير مقروءة" : "No unread notifications")
                    : (language === "ar" ? "لا توجد إشعارات" : "No notifications")}
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/notification-preferences")}>
                  {language === "ar" ? "إعدادات الإشعارات" : "Notification Settings"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([dateLabel, items]) => (
                <div key={dateLabel}>
                  <p className="mb-3 text-sm font-medium text-muted-foreground">{dateLabel}</p>
                  <div className="space-y-2">
                    {items.map((notification) => (
                      <Card
                        key={notification.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-sm",
                          !notification.is_read && "border-s-[3px] border-s-primary bg-primary/5"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={cn("mt-0.5 rounded-lg p-2 shrink-0", getTypeColor(notification.type || "info"))}>
                              {getTypeIcon(notification.type || "info")}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h3 className={cn("text-sm", !notification.is_read ? "font-semibold" : "font-medium")}>
                                    {language === "ar" && notification.title_ar ? notification.title_ar : notification.title}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                    {language === "ar" && notification.body_ar ? notification.body_ar : notification.body}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0"
                                  onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                                >
                                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span>
                                  {formatDistanceToNow(new Date(notification.created_at), {
                                    addSuffix: true,
                                    locale: language === "ar" ? ar : enUS,
                                  })}
                                </span>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {getTypeLabel(notification.type || "info")}
                                </Badge>
                                {notification.is_read && notification.read_at && (
                                  <span className="flex items-center gap-1">
                                    <Check className="h-3 w-3" />
                                    {language === "ar" ? "تمت القراءة" : "Read"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
