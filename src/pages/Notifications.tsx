import { useState, useMemo } from "react";
import { Bell, Check, CheckCheck, Trash2, X, Filter, Info, AlertTriangle, CircleCheck, CircleX, ShoppingCart, Trophy, FileText, Building2, GraduationCap, Users, Handshake, HeadphonesIcon, CreditCard, CalendarDays, Settings } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type NotificationSection =
  | "all"
  | "account"
  | "competitions"
  | "exhibitions"
  | "company"
  | "financial"
  | "orders"
  | "masterclass"
  | "mentorship"
  | "community"
  | "support"
  | "admin";

const sectionConfig: {
  key: NotificationSection;
  en: string;
  ar: string;
  icon: React.ElementType;
  keywords: string[];
}[] = [
  { key: "all", en: "All", ar: "الكل", icon: Bell, keywords: [] },
  { key: "account", en: "Account", ar: "الحساب", icon: Settings, keywords: ["welcome", "profile", "verified", "password", "membership", "suspend", "مرحب", "ملف", "توثيق", "كلمة", "عضوية", "تعليق", "حساب", "account"] },
  { key: "competitions", en: "Competitions", ar: "المسابقات", icon: Trophy, keywords: ["competition", "judge", "score", "certificate", "registration", "result", "مسابق", "حكم", "تقييم", "شهاد", "تسجيل", "نتائج", "نتيجة"] },
  { key: "exhibitions", en: "Exhibitions", ar: "المعارض", icon: CalendarDays, keywords: ["exhibition", "expo", "معرض", "عرض"] },
  { key: "company", en: "Companies", ar: "الشركات", icon: Building2, keywords: ["company", "شركة", "شركت", "تفعيل"] },
  { key: "financial", en: "Financial", ar: "المالية", icon: CreditCard, keywords: ["invoice", "payment", "فاتور", "دفع", "مالي", "استحقاق"] },
  { key: "orders", en: "Orders", ar: "الطلبات", icon: ShoppingCart, keywords: ["order", "shipped", "delivered", "طلب", "شحن", "تسليم"] },
  { key: "masterclass", en: "Masterclasses", ar: "الدروس", icon: GraduationCap, keywords: ["masterclass", "lesson", "module", "درس", "وحدة", "تعليم"] },
  { key: "mentorship", en: "Mentorship", ar: "الإرشاد", icon: Handshake, keywords: ["mentor", "مرشد", "إرشاد", "جلسة"] },
  { key: "community", en: "Community", ar: "المجتمع", icon: Users, keywords: ["follower", "message", "recipe", "badge", "comment", "متابع", "رسالة", "وصفة", "شارة", "تعليق"] },
  { key: "support", en: "Support", ar: "الدعم", icon: HeadphonesIcon, keywords: ["ticket", "support", "تذكرة", "دعم"] },
  { key: "admin", en: "Admin", ar: "إدارة", icon: FileText, keywords: ["admin", "review", "system", "alert", "إدار", "مراجع", "نظام", "تنبيه"] },
];

function categorizeNotification(n: { link?: string | null; title?: string; title_ar?: string | null; body?: string | null }): NotificationSection {
  const text = `${n.link || ""} ${n.title || ""} ${n.title_ar || ""} ${n.body || ""}`.toLowerCase();
  for (const section of sectionConfig) {
    if (section.key === "all") continue;
    if (section.keywords.some((kw) => text.includes(kw))) return section.key;
  }
  return "account";
}

export default function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAllRead, loading } = useNotifications();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState<NotificationSection>("all");
  const isAr = language === "ar";

  const sectionCounts = useMemo(() => {
    const counts: Record<string, number> = { all: notifications.length };
    for (const n of notifications) {
      const cat = categorizeNotification(n);
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [notifications]);

  const filteredNotifications = notifications.filter((n) => {
    const matchesRead = filter === "all" || (filter === "unread" ? !n.is_read : n.is_read);
    const matchesType = typeFilter === "all" || n.type === typeFilter;
    const matchesSection = sectionFilter === "all" || categorizeNotification(n) === sectionFilter;
    return matchesRead && matchesType && matchesSection;
  });

  // Group by date
  const grouped = filteredNotifications.reduce<Record<string, typeof filteredNotifications>>((acc, n) => {
    const date = new Date(n.created_at);
    let key: string;
    if (isToday(date)) key = isAr ? "اليوم" : "Today";
    else if (isYesterday(date)) key = isAr ? "أمس" : "Yesterday";
    else key = format(date, "MMM d, yyyy", { locale: isAr ? ar : enUS });
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
      case "success": return "bg-chart-5/10 text-chart-5";
      case "warning": return "bg-chart-4/10 text-chart-4";
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
    return isAr ? labels[type]?.ar || type : labels[type]?.en || type;
  };

  const getSectionLabel = (n: typeof notifications[0]) => {
    const cat = categorizeNotification(n);
    const section = sectionConfig.find((s) => s.key === cat);
    return section ? (isAr ? section.ar : section.en) : "";
  };

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  // Active sections (only show tabs that have notifications)
  const activeSections = sectionConfig.filter(
    (s) => s.key === "all" || (sectionCounts[s.key] || 0) > 0
  );

  return (
    <div className="flex min-h-screen flex-col bg-background" dir={isAr ? "rtl" : "ltr"}>
      <Header />
      <main className="container flex-1 py-6 md:py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15 shadow-sm">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold">
                  {isAr ? "مركز الإشعارات" : "Notification Center"}
                </h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {isAr ? `${unreadCount} إشعار غير مقروء` : `${unreadCount} unread`}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <CheckCheck className="me-2 h-4 w-4" />
                  {isAr ? "قراءة الكل" : "Mark All Read"}
                </Button>
              )}
              {notifications.length - unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={clearAllRead}>
                  <Trash2 className="me-2 h-4 w-4" />
                  {isAr ? "مسح المقروءة" : "Clear Read"}
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-s-[3px] border-s-primary">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">{isAr ? "الإجمالي" : "Total"}</p>
                <p className="text-xl font-bold">{notifications.length}</p>
              </CardContent>
            </Card>
            <Card className="border-s-[3px] border-s-chart-4">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">{isAr ? "غير مقروء" : "Unread"}</p>
                <p className="text-xl font-bold">{unreadCount}</p>
              </CardContent>
            </Card>
            <Card className="border-s-[3px] border-s-chart-5">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">{isAr ? "مقروء" : "Read"}</p>
                <p className="text-xl font-bold">{notifications.length - unreadCount}</p>
              </CardContent>
            </Card>
          </div>

          {/* Section Tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {activeSections.map((section) => {
              const Icon = section.icon;
              const count = sectionCounts[section.key] || 0;
              return (
                <Button
                  key={section.key}
                  variant={sectionFilter === section.key ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setSectionFilter(section.key)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {isAr ? section.ar : section.en}
                  {count > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ms-1">
                      {count}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>

          {/* Read/Type Filters */}
          <div className="flex items-center gap-3">
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList>
                <TabsTrigger value="all">{isAr ? "الكل" : "All"}</TabsTrigger>
                <TabsTrigger value="unread">{isAr ? "غير مقروء" : "Unread"}</TabsTrigger>
                <TabsTrigger value="read">{isAr ? "مقروء" : "Read"}</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px]">
                <Filter className="me-2 h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "كل الأنواع" : "All Types"}</SelectItem>
                <SelectItem value="info">{isAr ? "معلومات" : "Info"}</SelectItem>
                <SelectItem value="success">{isAr ? "نجاح" : "Success"}</SelectItem>
                <SelectItem value="warning">{isAr ? "تحذير" : "Warning"}</SelectItem>
                <SelectItem value="error">{isAr ? "خطأ" : "Error"}</SelectItem>
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
                    ? (isAr ? "لا توجد إشعارات غير مقروءة" : "No unread notifications")
                    : (isAr ? "لا توجد إشعارات" : "No notifications")}
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/notification-preferences")}>
                  {isAr ? "إعدادات الإشعارات" : "Notification Settings"}
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
                          "cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
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
                                    {isAr && notification.title_ar ? notification.title_ar : notification.title}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                    {isAr && notification.body_ar ? notification.body_ar : notification.body}
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
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                                <span>
                                  {formatDistanceToNow(new Date(notification.created_at), {
                                    addSuffix: true,
                                    locale: isAr ? ar : enUS,
                                  })}
                                </span>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {getTypeLabel(notification.type || "info")}
                                </Badge>
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  {getSectionLabel(notification)}
                                </Badge>
                                {notification.is_read && notification.read_at && (
                                  <span className="flex items-center gap-1">
                                    <Check className="h-3 w-3" />
                                    {isAr ? "تمت القراءة" : "Read"}
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
