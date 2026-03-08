/**
 * Smart notification digest summary widget for the dashboard.
 * Provides an AI-style overview of recent notification activity.
 */
import { useMemo, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Bell, TrendingUp, TrendingDown, Minus, ChevronRight, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { inferPriority } from "./NotificationPriorityBadge";

export const NotificationDigest = memo(function NotificationDigest() {
  const { notifications, unreadCount } = useNotifications();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();

  const digest = useMemo(() => {
    if (!notifications.length) return null;

    const now = Date.now();
    const last24h = notifications.filter(n => now - new Date(n.created_at).getTime() < 86400000);
    const prev24h = notifications.filter(n => {
      const age = now - new Date(n.created_at).getTime();
      return age >= 86400000 && age < 172800000;
    });

    const urgentCount = last24h.filter(n => inferPriority(n) === "urgent").length;
    const highCount = last24h.filter(n => inferPriority(n) === "high").length;

    // Category breakdown
    const categories = new Map<string, number>();
    last24h.forEach(n => {
      const type = n.type || "other";
      categories.set(type, (categories.get(type) || 0) + 1);
    });
    const topCategories = Array.from(categories.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const trend = last24h.length > prev24h.length ? "up" : last24h.length < prev24h.length ? "down" : "stable";

    return {
      total24h: last24h.length,
      prev24h: prev24h.length,
      urgentCount,
      highCount,
      topCategories,
      trend,
    };
  }, [notifications]);

  if (!digest || digest.total24h === 0) return null;

  const TrendIcon = digest.trend === "up" ? TrendingUp : digest.trend === "down" ? TrendingDown : Minus;
  const trendColor = digest.trend === "up" ? "text-chart-3" : digest.trend === "down" ? "text-chart-4" : "text-muted-foreground";

  const typeLabels: Record<string, { en: string; ar: string }> = {
    follow: { en: "Follows", ar: "متابعات" },
    reaction: { en: "Reactions", ar: "تفاعلات" },
    follow_request: { en: "Requests", ar: "طلبات" },
    exhibition_update: { en: "Events", ar: "فعاليات" },
    exhibition_review: { en: "Reviews", ar: "تقييمات" },
    story_view: { en: "Views", ar: "مشاهدات" },
    comment: { en: "Comments", ar: "تعليقات" },
    booth_assignment: { en: "Booths", ar: "أجنحة" },
    supplier_inquiry: { en: "Inquiries", ar: "استفسارات" },
    bio_subscriber: { en: "Subscribers", ar: "مشتركين" },
    schedule: { en: "Schedule", ar: "جدول" },
    system: { en: "System", ar: "النظام" },
  };

  return (
    <Card className="border-border/40 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-chart-4/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold">{isAr ? "ملخص الإشعارات" : "Notification Digest"}</h3>
              <p className="text-[10px] text-muted-foreground">{isAr ? "آخر ٢٤ ساعة" : "Last 24 hours"}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => navigate("/notifications")}>
            {isAr ? "عرض الكل" : "View all"}
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="rounded-xl bg-muted/30 p-2.5 text-center">
            <p className="text-lg font-bold"><AnimatedCounter value={digest.total24h} /></p>
            <p className="text-[9px] text-muted-foreground">{isAr ? "إشعار" : "Notifications"}</p>
          </div>
          <div className="rounded-xl bg-muted/30 p-2.5 text-center">
            <p className="text-lg font-bold text-primary"><AnimatedCounter value={unreadCount} /></p>
            <p className="text-[9px] text-muted-foreground">{isAr ? "غير مقروء" : "Unread"}</p>
          </div>
          <div className="rounded-xl bg-muted/30 p-2.5 text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendIcon className={`h-4 w-4 ${trendColor}`} />
            </div>
            <p className="text-[9px] text-muted-foreground">
              {digest.trend === "up" ? (isAr ? "أكثر نشاطاً" : "More active") :
               digest.trend === "down" ? (isAr ? "أقل نشاطاً" : "Less active") :
               (isAr ? "مستقر" : "Stable")}
            </p>
          </div>
        </div>

        {/* Urgent alert */}
        {digest.urgentCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-2.5 mb-3">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-xs font-medium text-destructive">
              {isAr
                ? `${digest.urgentCount} إشعار عاجل يحتاج انتباهك`
                : `${digest.urgentCount} urgent notification${digest.urgentCount > 1 ? "s" : ""} need${digest.urgentCount === 1 ? "s" : ""} attention`}
            </p>
          </div>
        )}

        {/* Top categories */}
        <div className="flex flex-wrap gap-1.5">
          {digest.topCategories.map(([type, count]) => {
            const label = typeLabels[type] || { en: type, ar: type };
            return (
              <Badge key={type} variant="secondary" className="text-[10px] gap-1">
                {isAr ? label.ar : label.en}
                <span className="font-bold">{count}</span>
              </Badge>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
