import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Trophy, CheckCircle, XCircle, Clock, ChefHat } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "registration" | "status_change";
  title: string;
  subtitle: string;
  status: string;
  timestamp: string;
  competitionId: string;
}

export function RecentActivityWidget() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const isAr = language === "ar";

  const { data: activities, isLoading } = useQuery({
    queryKey: ["recent-activity-widget", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: registrations, error } = await supabase
        .from("competition_registrations")
        .select(`
          id, status, registered_at, approved_at, dish_name, competition_id,
          competitions (id, title, title_ar)
        `)
        .eq("participant_id", user.id)
        .order("registered_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      const activityItems: ActivityItem[] = [];

      registrations?.forEach((reg) => {
        const comp = reg.competitions as { id: string; title: string; title_ar: string | null } | null;
        const competitionTitle = comp
          ? isAr && comp.title_ar ? comp.title_ar : comp.title
          : isAr ? "مسابقة" : "Competition";

        activityItems.push({
          id: reg.id,
          type: "registration",
          title: isAr ? `سجلت في ${competitionTitle}` : `Registered for ${competitionTitle}`,
          subtitle: reg.dish_name || (isAr ? "طبق" : "Dish"),
          status: reg.status,
          timestamp: reg.approved_at || reg.registered_at,
          competitionId: reg.competition_id,
        });
      });

      return activityItems.slice(0, 5);
    },
    enabled: !!user,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-3.5 w-3.5 text-chart-5" />;
      case "rejected": return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      case "pending": return <Clock className="h-3.5 w-3.5 text-chart-4" />;
      default: return <ChefHat className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      approved: "default",
      pending: "secondary",
      rejected: "destructive",
      withdrawn: "outline",
    };
    const labels: Record<string, string> = {
      approved: isAr ? "موافق عليه" : "Approved",
      pending: isAr ? "معلق" : "Pending",
      rejected: isAr ? "مرفوض" : "Rejected",
      withdrawn: isAr ? "منسحب" : "Withdrawn",
    };
    return (
      <Badge variant={variants[status] || "secondary"} className="text-[10px]">
        {labels[status] || status}
      </Badge>
    );
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" />
            {isAr ? "النشاط الأخير" : "Recent Activity"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60">
              <Activity className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isAr ? "سجل الدخول لعرض نشاطك" : "Sign in to view your activity"}
            </p>
            <Link to="/auth" className="mt-2 inline-block text-sm text-primary hover:underline">
              {t("signIn")}
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          {isAr ? "النشاط الأخير" : "Recent Activity"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities && activities.length > 0 ? (
          <div className="divide-y">
            {activities.map((activity) => (
              <Link
                key={activity.id}
                to={`/competitions/${activity.competitionId}`}
                className="flex items-start gap-2.5 py-3 first:pt-0 last:pb-0 transition-colors hover:bg-muted/30 -mx-1 px-1 rounded-md"
              >
                <div className="mt-1 shrink-0">{getStatusIcon(activity.status)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2 leading-snug">{activity.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    {getStatusBadge(activity.status)}
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60">
              <Trophy className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isAr ? "لا يوجد نشاط حتى الآن" : "No activity yet"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isAr ? "سجل في مسابقة للبدء!" : "Register for a competition to get started!"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
