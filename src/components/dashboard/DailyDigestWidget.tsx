import { useIsAr } from "@/hooks/useIsAr";
import React, { memo } from "react";
import { CACHE } from "@/lib/queryConfig";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Trophy, Users, MessageSquare, Bell, TrendingUp, Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export const DailyDigestWidget = memo(function DailyDigestWidget() {
  const { user } = useAuth();
  const isAr = useIsAr();

  const { data: digest, isLoading } = useQuery({
    queryKey: ["daily-digest", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const [notifRes, msgRes, compRes] = await Promise.all([
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false),
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("receiver_id", user.id)
          .eq("is_read", false),
        supabase
          .from("competition_registrations")
          .select("id, competitions!inner(title, title_ar, competition_start)")
          .eq("participant_id", user.id)
          .eq("status", "approved")
          .gte("competitions.competition_start", todayISO)
          .limit(3),
      ]);

      return {
        unreadNotifications: notifRes.count || 0,
        unreadMessages: msgRes.count || 0,
        upcomingCompetitions: compRes.data || [],
      };
    },
    enabled: !!user,
    ...CACHE.short,
  });

  if (!user || isLoading || !digest) return null;

  const hasActivity = digest.unreadNotifications > 0 || digest.unreadMessages > 0 || digest.upcomingCompetitions.length > 0;

  if (!hasActivity) return null;

  const items: { icon: React.ElementType; text: string; color: string; bg: string; href?: string }[] = [];

  if (digest.unreadNotifications > 0) {
    items.push({
      icon: Bell,
      text: isAr
        ? `لديك ${digest.unreadNotifications} إشعار غير مقروء`
        : `You have ${digest.unreadNotifications} unread notification${digest.unreadNotifications > 1 ? "s" : ""}`,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/notifications",
    });
  }

  if (digest.unreadMessages > 0) {
    items.push({
      icon: MessageSquare,
      text: isAr
        ? `لديك ${digest.unreadMessages} رسالة جديدة`
        : `${digest.unreadMessages} new message${digest.unreadMessages > 1 ? "s" : ""} waiting`,
      color: "text-chart-2",
      bg: "bg-chart-2/10",
      href: "/messages",
    });
  }

  digest.upcomingCompetitions.forEach((reg) => {
    const comp = reg.competitions;
    if (!comp) return;
    const title = isAr ? ((comp as any).title_ar || (comp as any).title) : (comp as any).title;
    const timeStr = (comp as any).competition_start
      ? formatDistanceToNow(new Date((comp as any).competition_start), { addSuffix: true, locale: isAr ? ar : enUS })
      : "";
    items.push({
      icon: Trophy,
      text: isAr ? `مسابقة "${title}" تبدأ ${timeStr}` : `"${title}" starts ${timeStr}`,
      color: "text-chart-4",
      bg: "bg-chart-4/10",
    });
  });

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {isAr ? "ملخصك اليوم" : "Your Daily Digest"}
          <Badge variant="secondary" className="text-xs px-1.5 ms-auto">
            {items.length} {isAr ? "عنصر" : "items"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.map((item, i) => {
          const content = (
            <div className="flex items-start gap-2.5 text-xs rounded-xl px-2.5 py-2 transition-all hover:bg-muted/40 active:scale-[0.98] touch-manipulation group/item">
              <div className={`flex h-7 w-7 items-center justify-center rounded-xl ${item.bg} shrink-0 mt-0.5 transition-transform group-hover/item:scale-110`}>
                <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
              </div>
              <p className="text-muted-foreground leading-relaxed flex-1 group-hover/item:text-foreground transition-colors">{item.text}</p>
              {item.href && <ArrowRight className="h-3 w-3 text-muted-foreground/40 mt-1 shrink-0 rtl:rotate-180 opacity-0 group-hover/item:opacity-100 transition-opacity" />}
            </div>
          );
          return item.href ? (
            <Link key={i} to={item.href}>{content}</Link>
          ) : (
            <div key={i}>{content}</div>
          );
        })}
      </CardContent>
    </Card>
  );
});
