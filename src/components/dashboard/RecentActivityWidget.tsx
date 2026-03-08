import { useEffect, useState, useCallback, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Trophy, CheckCircle, XCircle, Clock, ChefHat, Zap, UserPlus, Star, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  icon: "registration" | "follow" | "reaction" | "review" | "badge" | "general";
  status?: string;
  timestamp: string;
  link?: string;
}

const ICON_MAP = {
  registration: <Trophy className="h-3.5 w-3.5 text-primary" />,
  follow: <UserPlus className="h-3.5 w-3.5 text-chart-2" />,
  reaction: <Star className="h-3.5 w-3.5 text-chart-4" />,
  review: <MessageSquare className="h-3.5 w-3.5 text-chart-3" />,
  badge: <Zap className="h-3.5 w-3.5 text-chart-5" />,
  general: <Activity className="h-3.5 w-3.5 text-muted-foreground" />,
};

export const RecentActivityWidget = memo(function RecentActivityWidget() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const isAr = language === "ar";
  const [realtimeItems, setRealtimeItems] = useState<ActivityItem[]>([]);

  const { data: activities, isLoading } = useQuery({
    queryKey: ["recent-activity-widget", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const items: ActivityItem[] = [];

      // Fetch competition registrations
      const { data: regs } = await supabase
        .from("competition_registrations")
        .select("id, status, registered_at, dish_name, competition_id, competitions (id, title, title_ar)")
        .eq("participant_id", user.id)
        .order("registered_at", { ascending: false })
        .limit(3);

      regs?.forEach((reg) => {
        const comp = reg.competitions as { id: string; title: string; title_ar: string | null } | null;
        const title = comp ? (isAr && comp.title_ar ? comp.title_ar : comp.title) : "";
        items.push({
          id: reg.id,
          type: "registration",
          title: isAr ? `سجلت في ${title}` : `Registered for ${title}`,
          icon: "registration",
          status: reg.status,
          timestamp: reg.registered_at,
          link: `/competitions/${reg.competition_id}`,
        });
      });

      // Fetch recent notifications as activity proxy
      const { data: notifs } = await supabase
        .from("notifications")
        .select("id, title, title_ar, type, created_at, link")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      notifs?.forEach((n) => {
        const iconType = n.type === "follow" ? "follow" : n.type === "reaction" ? "reaction" : n.type?.includes("review") ? "review" : "general";
        items.push({
          id: n.id,
          type: n.type || "general",
          title: isAr && n.title_ar ? n.title_ar : n.title,
          icon: iconType as any,
          timestamp: n.created_at,
          link: n.link || undefined,
        });
      });

      // Sort by timestamp and deduplicate
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return items.slice(0, 8);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  // Realtime: listen for new notifications as live activity
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("activity-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
        const n = payload.new as any;
        const iconType = n.type === "follow" ? "follow" : n.type === "reaction" ? "reaction" : "general";
        setRealtimeItems((prev) => [{
          id: n.id,
          type: n.type || "general",
          title: isAr && n.title_ar ? n.title_ar : n.title,
          icon: iconType as any,
          timestamp: n.created_at,
          link: n.link || undefined,
        }, ...prev].slice(0, 3));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, isAr]);

  const allItems = [...realtimeItems, ...(activities || [])].slice(0, 8);

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      approved: "default", pending: "secondary", rejected: "destructive", withdrawn: "outline",
    };
    const labels: Record<string, string> = {
      approved: isAr ? "موافق" : "Approved", pending: isAr ? "معلق" : "Pending",
      rejected: isAr ? "مرفوض" : "Rejected", withdrawn: isAr ? "منسحب" : "Withdrawn",
    };
    return <Badge variant={variants[status] || "secondary"} className="text-[10px]">{labels[status] || status}</Badge>;
  };

  if (!user) {
    return (
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/30 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10">
              <Activity className="h-3.5 w-3.5 text-accent-foreground" />
            </div>
            {isAr ? "النشاط المباشر" : "Live Activity"}
          </h3>
        </div>
        <CardContent className="p-4">
          <div className="py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Activity className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">{isAr ? "سجل الدخول لعرض نشاطك" : "Sign in to view your activity"}</p>
            <Link to="/login" className="mt-2 inline-block text-sm text-primary hover:underline">{t("signIn")}</Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/30 px-4 py-3"><Skeleton className="h-5 w-36" /></div>
        <CardContent className="p-4 space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-md" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-md border-border/50">
      <div className="pointer-events-none absolute -top-12 -end-12 h-32 w-32 rounded-full bg-accent/8 blur-[40px]" />
      <div className="border-b bg-muted/30 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <div className="relative flex h-6 w-6 items-center justify-center rounded-md bg-accent/10">
            <Activity className="h-3.5 w-3.5 text-accent-foreground" />
            {realtimeItems.length > 0 && (
              <span className="absolute -top-1 -end-1 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-chart-5 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-chart-5" />
              </span>
            )}
          </div>
          {isAr ? "النشاط المباشر" : "Live Activity"}
          {realtimeItems.length > 0 && (
            <Badge variant="outline" className="text-[9px] border-chart-5/30 text-chart-5">
              {isAr ? "مباشر" : "LIVE"}
            </Badge>
          )}
        </h3>
      </div>
      <CardContent className="p-0">
        {allItems.length > 0 ? (
          <div className="divide-y divide-border/20">
            {allItems.map((item, idx) => {
              const isNew = realtimeItems.some((r) => r.id === item.id);
              const Wrapper = item.link ? Link : "div";
              const wrapperProps = item.link ? { to: item.link } : {};
              return (
                <Wrapper
                  key={item.id}
                  {...(wrapperProps as any)}
                  className={`group flex items-start gap-2.5 px-4 py-3 transition-all hover:bg-muted/30 ${isNew ? "bg-chart-5/5 animate-fade-in" : ""}`}
                >
                  <div className="mt-0.5 shrink-0">{ICON_MAP[item.icon] || ICON_MAP.general}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium line-clamp-2 leading-snug">{item.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      {getStatusBadge(item.status)}
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </Wrapper>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center px-4">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Trophy className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">{isAr ? "لا يوجد نشاط حتى الآن" : "No activity yet"}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});