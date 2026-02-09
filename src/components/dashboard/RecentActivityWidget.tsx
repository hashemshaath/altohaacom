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

  const { data: activities, isLoading } = useQuery({
    queryKey: ["recent-activity-widget", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Fetch user's recent registrations
      const { data: registrations, error } = await supabase
        .from("competition_registrations")
        .select(`
          id,
          status,
          registered_at,
          approved_at,
          dish_name,
          competition_id,
          competitions (
            id,
            title,
            title_ar
          )
        `)
        .eq("participant_id", user.id)
        .order("registered_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      // Transform to activity items
      const activityItems: ActivityItem[] = [];

      registrations?.forEach((reg) => {
        const comp = reg.competitions as { id: string; title: string; title_ar: string | null } | null;
        const competitionTitle = comp
          ? language === "ar" && comp.title_ar
            ? comp.title_ar
            : comp.title
          : language === "ar"
          ? "مسابقة"
          : "Competition";

        activityItems.push({
          id: reg.id,
          type: "registration",
          title:
            language === "ar"
              ? `سجلت في ${competitionTitle}`
              : `Registered for ${competitionTitle}`,
          subtitle: reg.dish_name || (language === "ar" ? "طبق" : "Dish"),
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
      case "approved":
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "pending":
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <ChefHat className="h-4 w-4 text-muted-foreground" />;
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
      approved: language === "ar" ? "موافق عليه" : "Approved",
      pending: language === "ar" ? "معلق" : "Pending",
      rejected: language === "ar" ? "مرفوض" : "Rejected",
      withdrawn: language === "ar" ? "منسحب" : "Withdrawn",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            {language === "ar" ? "النشاط الأخير" : "Recent Activity"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <Activity className="mx-auto mb-2 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {language === "ar"
                ? "سجل الدخول لعرض نشاطك"
                : "Sign in to view your activity"}
            </p>
            <Link to="/auth">
              <span className="mt-2 inline-block text-primary hover:underline">
                {t("signIn")}
              </span>
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
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          {language === "ar" ? "النشاط الأخير" : "Recent Activity"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <Link
                key={activity.id}
                to={`/competitions/${activity.competitionId}`}
                className="block"
              >
                <div className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                  <div className="mt-0.5">{getStatusIcon(activity.status)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{activity.title}</p>
                      {getStatusBadge(activity.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Trophy className="mx-auto mb-2 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {language === "ar"
                ? "لا يوجد نشاط حتى الآن"
                : "No activity yet"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {language === "ar"
                ? "سجل في مسابقة للبدء!"
                : "Register for a competition to get started!"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
