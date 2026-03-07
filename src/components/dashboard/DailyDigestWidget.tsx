import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Trophy, Users, MessageSquare, Bell, TrendingUp, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export const DailyDigestWidget = memo(function DailyDigestWidget() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";

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
          .select("id, competitions!inner(title, title_ar, start_date)")
          .eq("participant_id", user.id)
          .eq("status", "approved")
          .gte("competitions.start_date", todayISO)
          .limit(3),
      ]);

      return {
        unreadNotifications: notifRes.count || 0,
        unreadMessages: msgRes.count || 0,
        upcomingCompetitions: compRes.data || [],
      };
    },
    enabled: !!user,
    staleTime: 120000,
  });

  if (!user || isLoading || !digest) return null;

  const hasActivity = digest.unreadNotifications > 0 || digest.unreadMessages > 0 || digest.upcomingCompetitions.length > 0;

  if (!hasActivity) return null;

  const items: { icon: React.ElementType; text: string; color: string; bg: string }[] = [];

  if (digest.unreadNotifications > 0) {
    items.push({
      icon: Bell,
      text: isAr
        ? `لديك ${digest.unreadNotifications} إشعار غير مقروء`
        : `You have ${digest.unreadNotifications} unread notification${digest.unreadNotifications > 1 ? "s" : ""}`,
      color: "text-primary",
      bg: "bg-primary/10",
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
    });
  }

  digest.upcomingCompetitions.forEach((reg: any) => {
    const comp = reg.competitions;
    if (!comp) return;
    const title = isAr ? (comp.title_ar || comp.title) : comp.title;
    const timeStr = comp.start_date
      ? formatDistanceToNow(new Date(comp.start_date), { addSuffix: true, locale: isAr ? ar : enUS })
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
          <Badge variant="secondary" className="text-[9px] px-1.5 ms-auto">
            {items.length} {isAr ? "عنصر" : "items"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5 text-xs">
            <div className={`flex h-6 w-6 items-center justify-center rounded-md ${item.bg} shrink-0 mt-0.5`}>
              <item.icon className={`h-3 w-3 ${item.color}`} />
            </div>
            <p className="text-muted-foreground leading-relaxed">{item.text}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
