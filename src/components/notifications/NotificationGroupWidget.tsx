import { useMemo, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Trophy, Building2, CreditCard, Users, ShoppingCart, GraduationCap, Settings, HeadphonesIcon, CalendarDays } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface GroupedNotification {
  key: string;
  category: string;
  icon: typeof Bell;
  color: string;
  bg: string;
  count: number;
  latestTitle: string;
  latestTime: string;
  unreadCount: number;
  ids: string[];
}

const categoryConfig: Record<string, { icon: typeof Bell; color: string; bg: string; en: string; ar: string }> = {
  competitions: { icon: Trophy, color: "text-primary", bg: "bg-primary/10", en: "Competitions", ar: "المسابقات" },
  exhibitions: { icon: CalendarDays, color: "text-chart-5", bg: "bg-chart-5/10", en: "Exhibitions", ar: "المعارض" },
  company: { icon: Building2, color: "text-chart-2", bg: "bg-chart-2/10", en: "Companies", ar: "الشركات" },
  financial: { icon: CreditCard, color: "text-chart-4", bg: "bg-chart-4/10", en: "Financial", ar: "المالية" },
  orders: { icon: ShoppingCart, color: "text-chart-3", bg: "bg-chart-3/10", en: "Orders", ar: "الطلبات" },
  masterclass: { icon: GraduationCap, color: "text-chart-1", bg: "bg-chart-1/10", en: "Masterclass", ar: "الدورات" },
  community: { icon: Users, color: "text-chart-2", bg: "bg-chart-2/10", en: "Community", ar: "المجتمع" },
  support: { icon: HeadphonesIcon, color: "text-chart-3", bg: "bg-chart-3/10", en: "Support", ar: "الدعم" },
  account: { icon: Settings, color: "text-muted-foreground", bg: "bg-muted/50", en: "Account", ar: "الحساب" },
};

function categorize(n: { link?: string | null; title?: string; title_ar?: string | null; body?: string | null }): string {
  const text = `${n.link || ""} ${n.title || ""} ${n.title_ar || ""} ${n.body || ""}`.toLowerCase();
  const keywords: Record<string, string[]> = {
    competitions: ["competition", "judge", "score", "مسابق"],
    exhibitions: ["exhibition", "معرض"],
    company: ["company", "شركة"],
    financial: ["invoice", "payment", "فاتور"],
    orders: ["order", "shipped", "طلب"],
    masterclass: ["masterclass", "lesson", "درس"],
    community: ["follower", "recipe", "badge", "متابع", "وصفة"],
    support: ["ticket", "support", "تذكرة"],
  };
  for (const [cat, kws] of Object.entries(keywords)) {
    if (kws.some(kw => text.includes(kw))) return cat;
  }
  return "account";
}

export const NotificationGroupWidget = memo(function NotificationGroupWidget() {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();

  const groups = useMemo(() => {
    const map = new Map<string, GroupedNotification>();
    
    for (const n of notifications) {
      const cat = categorize(n);
      const existing = map.get(cat);
      const config = categoryConfig[cat] || categoryConfig.account;
      
      if (existing) {
        existing.count++;
        if (!n.is_read) existing.unreadCount++;
        existing.ids.push(n.id);
        if (new Date(n.created_at) > new Date(existing.latestTime)) {
          existing.latestTitle = isAr && n.title_ar ? n.title_ar : n.title || "";
          existing.latestTime = n.created_at;
        }
      } else {
        map.set(cat, {
          key: cat,
          category: isAr ? config.ar : config.en,
          icon: config.icon,
          color: config.color,
          bg: config.bg,
          count: 1,
          latestTitle: isAr && n.title_ar ? n.title_ar : n.title || "",
          latestTime: n.created_at,
          unreadCount: n.is_read ? 0 : 1,
          ids: [n.id],
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.unreadCount - a.unreadCount || b.count - a.count);
  }, [notifications, isAr]);

  const markGroupRead = async (group: GroupedNotification) => {
    await Promise.allSettled(group.ids.filter((_, i) => i < 50).map(id => markAsRead(id)));
  };

  if (groups.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Bell className="h-3 w-3" />
          {isAr ? "ملخص الإشعارات" : "Notification Summary"}
        </h3>
        {unreadCount > 0 && (
          <Badge variant="secondary" className="text-[10px]">
            <AnimatedCounter value={unreadCount} className="inline" /> {isAr ? "جديد" : "new"}
          </Badge>
        )}
      </div>
      {groups.slice(0, 6).map((group) => {
        const Icon = group.icon;
        return (
          <Card
            key={group.key}
            className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${group.unreadCount > 0 ? "border-s-[3px] border-s-primary" : ""}`}
            onClick={() => navigate("/notifications")}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${group.bg}`}>
                <Icon className={`h-4 w-4 ${group.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold">{group.category}</span>
                  <Badge variant="secondary" className="text-[9px] px-1.5 h-4">
                    <AnimatedCounter value={group.count} className="inline" />
                  </Badge>
                  {group.unreadCount > 0 && (
                    <Badge className="text-[9px] px-1.5 h-4 ms-auto">
                      <AnimatedCounter value={group.unreadCount} className="inline" />
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{group.latestTitle}</p>
                <span className="text-[9px] text-muted-foreground">
                  {formatDistanceToNow(new Date(group.latestTime), { addSuffix: true, locale: isAr ? ar : enUS })}
                </span>
              </div>
              {group.unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={(e) => { e.stopPropagation(); markGroupRead(group); }}
                >
                  <CheckCheck className="h-3.5 w-3.5 text-primary" />
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});
