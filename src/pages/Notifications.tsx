import React, { useState, useMemo, useCallback } from "react";
import { Bell, Check, CheckCheck, Trash2, X, Filter, Info, AlertTriangle, CircleCheck, CircleX, ShoppingCart, Trophy, FileText, Building2, GraduationCap, Users, Handshake, HeadphonesIcon, CreditCard, CalendarDays, Settings, Search, Sparkles } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SwipeableNotificationCard } from "@/components/notifications/SwipeableNotificationCard";
import { NotificationBatchActions } from "@/components/notifications/NotificationBatchActions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNotifications } from "@/hooks/useNotifications";
import { useNotificationProfiles } from "@/hooks/useNotificationProfiles";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAccountType } from "@/hooks/useAccountType";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toEnglishDigits } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";

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
  const { getProfile } = useNotificationProfiles(notifications);
  const { language } = useLanguage();
  const { isFan } = useAccountType();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState<NotificationSection>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const isAr = language === "ar";

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleBatchRead = useCallback(async () => {
    await Promise.allSettled(Array.from(selectedIds).map(id => markAsRead(id)));
    setSelectedIds(new Set());
  }, [selectedIds, markAsRead]);

  const handleBatchDelete = useCallback(async () => {
    await Promise.allSettled(Array.from(selectedIds).map(id => deleteNotification(id)));
    setSelectedIds(new Set());
  }, [selectedIds, deleteNotification]);

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
    const matchesSearch = !searchQuery || 
      (n.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.title_ar || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.body || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.body_ar || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRead && matchesType && matchesSection && matchesSearch;
  });

  // Group by date
  const grouped = filteredNotifications.reduce<Record<string, typeof filteredNotifications>>((acc, n) => {
    const date = new Date(n.created_at);
    let key: string;
    if (isToday(date)) key = isAr ? "اليوم" : "Today";
    else if (isYesterday(date)) key = isAr ? "أمس" : "Yesterday";
    else key = toEnglishDigits(format(date, "MMM d, yyyy", { locale: isAr ? ar : enUS }));
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

  // Bulk mark filtered as read
  const markFilteredAsRead = async () => {
    const unreadFiltered = filteredNotifications.filter((n) => !n.is_read);
    await Promise.allSettled(unreadFiltered.map((n) => markAsRead(n.id)));
  };

  const FAN_SECTIONS: NotificationSection[] = ["all", "account", "competitions", "exhibitions", "orders", "community", "support"];
  
  const activeSections = sectionConfig.filter(
    (s) => {
      if (isFan && !FAN_SECTIONS.includes(s.key)) return false;
      return s.key === "all" || (sectionCounts[s.key] || 0) > 0;
    }
  );

  return (
    <PageShell title={isAr ? "الإشعارات" : "Notifications"} description={isAr ? "مركز الإشعارات" : "Your notification center"} seoProps={{ noIndex: true }} className="max-w-3xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15 shadow-sm">
                <Bell className="h-5.5 w-5.5 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold tracking-tight">
                  {isAr ? "مركز الإشعارات" : "Notification Center"}
                </h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                    {isAr ? <><AnimatedCounter value={unreadCount} className="inline" /> إشعار غير مقروء</> : <><AnimatedCounter value={unreadCount} className="inline" /> unread</>}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => navigate("/notification-preferences")}>
                <Settings className="me-2 h-4 w-4" />
                {isAr ? "الإعدادات" : "Settings"}
              </Button>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" className="rounded-xl" onClick={markAllAsRead}>
                  <CheckCheck className="me-2 h-4 w-4" />
                  {isAr ? "قراءة الكل" : "Mark All Read"}
                </Button>
              )}
              {notifications.length - unreadCount > 0 && (
                <Button variant="outline" size="sm" className="rounded-xl" onClick={clearAllRead}>
                  <Trash2 className="me-2 h-4 w-4" />
                  {isAr ? "مسح المقروءة" : "Clear Read"}
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: isAr ? "الإجمالي" : "Total", value: notifications.length, color: "primary", icon: Bell },
              { label: isAr ? "غير مقروء" : "Unread", value: unreadCount, color: "chart-4", icon: Sparkles },
              { label: isAr ? "مقروء" : "Read", value: notifications.length - unreadCount, color: "chart-5", icon: Check },
            ].map(s => (
              <Card key={s.label} className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-${s.color}/10 group-hover:scale-110 transition-transform duration-300`}>
                    <s.icon className={`h-4.5 w-4.5 text-${s.color}`} />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
                    <AnimatedCounter value={typeof s.value === 'number' ? s.value : 0} className="text-xl font-bold" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isAr ? "بحث في الإشعارات..." : "Search notifications..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10 rounded-xl h-10 bg-muted/30 border-border/50 focus:bg-card"
            />
          </div>

          {/* Section Tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {activeSections.map((section) => {
              const Icon = section.icon;
              const count = sectionCounts[section.key] || 0;
              const isActive = sectionFilter === section.key;
              return (
                <Button
                  key={section.key}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "gap-1.5 rounded-xl transition-all duration-200 active:scale-95",
                    isActive && "shadow-sm shadow-primary/20"
                  )}
                  onClick={() => setSectionFilter(section.key)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {isAr ? section.ar : section.en}
                  {count > 0 && (
                    <Badge 
                      variant={isActive ? "outline" : "secondary"} 
                      className={cn(
                        "text-[10px] h-4 px-1.5 ms-0.5",
                        isActive && "border-primary-foreground/30 text-primary-foreground"
                      )}
                    >
                      <AnimatedCounter value={count} className="inline" />
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>

          {/* Read/Type Filters */}
          <div className="flex items-center gap-3 sticky top-0 z-20 bg-background/80 backdrop-blur-xl py-2 -mx-1 px-1 rounded-xl">
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList className="rounded-xl">
                <TabsTrigger value="all" className="rounded-xl">{isAr ? "الكل" : "All"}</TabsTrigger>
                <TabsTrigger value="unread" className="rounded-xl">{isAr ? "غير مقروء" : "Unread"}</TabsTrigger>
                <TabsTrigger value="read" className="rounded-xl">{isAr ? "مقروء" : "Read"}</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px] rounded-xl">
                <Filter className="me-2 h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">{isAr ? "كل الأنواع" : "All Types"}</SelectItem>
                <SelectItem value="info">{isAr ? "معلومات" : "Info"}</SelectItem>
                <SelectItem value="success">{isAr ? "نجاح" : "Success"}</SelectItem>
                <SelectItem value="warning">{isAr ? "تحذير" : "Warning"}</SelectItem>
                <SelectItem value="error">{isAr ? "خطأ" : "Error"}</SelectItem>
              </SelectContent>
            </Select>
            {filter === "unread" && filteredNotifications.some((n) => !n.is_read) && (
              <Button variant="ghost" size="sm" onClick={markFilteredAsRead} className="text-xs text-primary rounded-xl">
                <CheckCheck className="me-1 h-3 w-3" />
                {isAr ? "قراءة المعروضة" : "Mark visible read"}
              </Button>
            )}
          </div>

          {/* Batch Actions */}
          <NotificationBatchActions
            selectedCount={selectedIds.size}
            onMarkRead={handleBatchRead}
            onDelete={handleBatchDelete}
            onClearSelection={() => setSelectedIds(new Set())}
          />

          {/* Notifications List */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4 rounded-xl" />
                        <Skeleton className="h-3 w-1/2 rounded-xl" />
                        <div className="flex gap-2 pt-1">
                          <Skeleton className="h-4 w-16 rounded-full" />
                          <Skeleton className="h-4 w-16 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <Card className="rounded-2xl border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
                  <Bell className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <p className="text-muted-foreground font-medium">
                  {searchQuery
                    ? (isAr ? "لا توجد نتائج" : "No results found")
                    : filter === "unread"
                    ? (isAr ? "لا توجد إشعارات غير مقروءة" : "No unread notifications")
                    : (isAr ? "لا توجد إشعارات" : "No notifications")}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {isAr ? "ستظهر الإشعارات الجديدة هنا" : "New notifications will appear here"}
                </p>
                <Button variant="outline" size="sm" className="mt-4 rounded-xl" onClick={() => navigate("/notification-preferences")}>
                  {isAr ? "إعدادات الإشعارات" : "Notification Settings"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([dateLabel, items]) => (
                <div key={dateLabel}>
                  <div className="flex items-center gap-3 mb-3">
                    <p className="text-sm font-semibold text-muted-foreground">{dateLabel}</p>
                    <div className="flex-1 h-px bg-border/50" />
                    <Badge variant="secondary" className="text-[10px] rounded-xl">
                      {toEnglishDigits(items.length)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {items.map((notification) => {
                      const profile = getProfile(notification.metadata as any);
                      const isSelected = selectedIds.has(notification.id);
                      return (
                        <SwipeableNotificationCard
                          key={notification.id}
                          isRead={notification.is_read}
                          onMarkRead={() => markAsRead(notification.id)}
                          onDelete={() => deleteNotification(notification.id)}
                        >
                          <Card
                            className={cn(
                              "cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group rounded-2xl border-border/50",
                              !notification.is_read && "border-s-[3px] border-s-primary bg-primary/[0.03]",
                              isSelected && "ring-2 ring-primary bg-primary/10"
                            )}
                            onClick={() => {
                              if (selectedIds.size > 0) {
                                toggleSelect(notification.id);
                              } else {
                                handleNotificationClick(notification);
                              }
                            }}
                            onContextMenu={(e) => { e.preventDefault(); toggleSelect(notification.id); }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                {/* Avatar or icon */}
                                {profile ? (
                                  <div className="relative shrink-0 mt-0.5">
                                    <Avatar className="h-10 w-10 rounded-xl">
                                      <AvatarImage src={profile.avatar_url || undefined} />
                                      <AvatarFallback className="text-sm rounded-xl">{(profile.full_name || "U")[0].toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span className={cn(
                                      "absolute -bottom-0.5 -end-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-card",
                                      getTypeColor(notification.type || "info")
                                    )}>
                                      {React.cloneElement(getTypeIcon(notification.type || "info") as React.ReactElement, { className: "h-2.5 w-2.5" })}
                                    </span>
                                  </div>
                                ) : (
                                  <div className={cn("mt-0.5 rounded-xl p-2.5 shrink-0", getTypeColor(notification.type || "info"))}>
                                    {getTypeIcon(notification.type || "info")}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      {profile && (
                                        <p className="text-xs text-muted-foreground mb-0.5 font-medium">
                                          {profile.full_name || profile.username}
                                        </p>
                                      )}
                                      <h3 className={cn("text-sm leading-snug", !notification.is_read ? "font-semibold" : "font-medium")}>
                                        {isAr && notification.title_ar ? notification.title_ar : notification.title}
                                      </h3>
                                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                        {isAr && notification.body_ar ? notification.body_ar : notification.body}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {!notification.is_read && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 rounded-xl"
                                          onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                                          title={isAr ? "قراءة" : "Mark as read"}
                                        >
                                          <Check className="h-3.5 w-3.5 text-primary" />
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-xl"
                                        onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                                      >
                                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2.5 mt-2 text-xs text-muted-foreground flex-wrap">
                                    <span className="tabular-nums">
                                      {toEnglishDigits(formatDistanceToNow(new Date(notification.created_at), {
                                        addSuffix: true,
                                        locale: isAr ? ar : enUS,
                                      }))}
                                    </span>
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-md">
                                      {getTypeLabel(notification.type || "info")}
                                    </Badge>
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-md">
                                      {getSectionLabel(notification)}
                                    </Badge>
                                    {notification.is_read && notification.read_at && (
                                      <span className="flex items-center gap-1 text-chart-5">
                                        <Check className="h-3 w-3" />
                                        {isAr ? "تمت القراءة" : "Read"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </SwipeableNotificationCard>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </PageShell>
  );
}
