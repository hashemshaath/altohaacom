import { memo, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Bell, Heart, Trophy, ShoppingCart, CheckCircle, FileText, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface CategoryStat {
  key: string;
  label: string;
  labelAr: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  count: number;
  unread: number;
}

function categorize(type: string | null, link: string | null, title: string | null): string {
  const t = type || "";
  const l = link || "";
  const ttl = (title || "").toLowerCase();
  if (["reaction", "follow", "follow_request", "story_view", "live_session", "comment", "mention"].includes(t)) return "social";
  if (l.includes("/community") || ttl.includes("follow")) return "social";
  if (l.includes("/admin/") || ttl.includes("approv") || ttl.includes("review") || ttl.includes("verif")) return "approvals";
  if (l.includes("/order") || l.includes("/invoice") || ttl.includes("order") || ttl.includes("payment")) return "orders";
  if (l.includes("/competition") || ttl.includes("competition") || ttl.includes("judge")) return "events";
  return "general";
}

export const NotificationDigestWidget = memo(function NotificationDigestWidget({ className }: { className?: string }) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { notifications, unreadCount } = useNotifications();
  const navigate = useNavigate();

  const stats = useMemo<CategoryStat[]>(() => {
    const cats: Record<string, { count: number; unread: number }> = {
      social: { count: 0, unread: 0 },
      approvals: { count: 0, unread: 0 },
      events: { count: 0, unread: 0 },
      orders: { count: 0, unread: 0 },
      general: { count: 0, unread: 0 },
    };

    for (const n of notifications) {
      const cat = categorize(n.type, n.link, n.title);
      if (cats[cat]) {
        cats[cat].count++;
        if (!n.is_read) cats[cat].unread++;
      }
    }

    return [
      { key: "social", label: "Social", labelAr: "اجتماعي", icon: Heart, color: "text-destructive", bgColor: "bg-destructive/10", ...cats.social },
      { key: "approvals", label: "Approvals", labelAr: "موافقات", icon: CheckCircle, color: "text-chart-2", bgColor: "bg-chart-2/10", ...cats.approvals },
      { key: "events", label: "Events", labelAr: "فعاليات", icon: Trophy, color: "text-chart-4", bgColor: "bg-chart-4/10", ...cats.events },
      { key: "orders", label: "Orders", labelAr: "طلبات", icon: ShoppingCart, color: "text-primary", bgColor: "bg-primary/10", ...cats.orders },
      { key: "general", label: "General", labelAr: "عام", icon: FileText, color: "text-muted-foreground", bgColor: "bg-muted", ...cats.general },
    ].filter(c => c.count > 0);
  }, [notifications]);

  if (notifications.length === 0) return null;

  const urgentCount = notifications.filter(n => !n.is_read && (
    n.priority === "urgent" || n.priority === "high" ||
    (n.title || "").toLowerCase().includes("urgent") ||
    (n.title || "").toLowerCase().includes("عاجل")
  )).length;

  return (
    <Card
      className={cn(
        "overflow-hidden cursor-pointer hover:shadow-md transition-shadow border-border/50",
        unreadCount > 0 && "ring-1 ring-primary/20",
        className
      )}
      onClick={() => navigate("/notifications")}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell className="h-4.5 w-4.5 text-primary" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -end-1 h-2 w-2 rounded-full bg-destructive">
                  <span className="absolute inset-0 rounded-full bg-destructive animate-ping opacity-75" />
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold">{isAr ? "ملخص الإشعارات" : "Notification Digest"}</h3>
          </div>
          <div className="flex items-center gap-1.5">
            {urgentCount > 0 && (
              <Badge variant="destructive" className="text-[10px] gap-0.5 animate-pulse">
                <AlertTriangle className="h-2.5 w-2.5" />
                {urgentCount} {isAr ? "عاجل" : "urgent"}
              </Badge>
            )}
            <Badge variant="secondary" className="text-[10px]">
              <AnimatedCounter value={unreadCount} className="inline" /> {isAr ? "جديد" : "new"}
            </Badge>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {stats.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.key}
                className={cn(
                  "flex items-center gap-2 rounded-xl p-2 transition-colors",
                  cat.bgColor
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", cat.color)} />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{isAr ? cat.labelAr : cat.label}</p>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <AnimatedCounter value={cat.count} className="inline font-semibold" />
                    {cat.unread > 0 && (
                      <Badge className="h-3.5 text-[8px] px-1 bg-primary text-primary-foreground">
                        {cat.unread}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent activity indicator */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
            <span>{isAr ? "آخر إشعار:" : "Latest:"} {getRelativeTime(notifications[0]?.created_at, isAr)}</span>
            <span className="text-primary font-medium">{isAr ? "عرض الكل ←" : "View all →"}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

function getRelativeTime(dateStr: string | undefined, isAr: boolean): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return isAr ? "الآن" : "just now";
  if (mins < 60) return isAr ? `منذ ${mins} د` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return isAr ? `منذ ${hours} س` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return isAr ? `منذ ${days} ي` : `${days}d ago`;
}
