import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Clock, CheckCircle } from "lucide-react";

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  iconColor?: string;
}

function StatCard({ icon: Icon, label, value, iconColor = "text-primary" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="rounded-full bg-primary/10 p-3">
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickStatsWidget() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["user-quick-stats", user?.id],
    queryFn: async () => {
      if (!user) {
        return {
          totalCompetitions: 0,
          pendingRegistrations: 0,
          approvedRegistrations: 0,
          completedCompetitions: 0,
        };
      }

      const { data: registrations, error } = await supabase
        .from("competition_registrations")
        .select("status, competitions(status)")
        .eq("participant_id", user.id);

      if (error) throw error;

      const stats = {
        totalCompetitions: registrations?.length || 0,
        pendingRegistrations: 0,
        approvedRegistrations: 0,
        completedCompetitions: 0,
      };

      registrations?.forEach((reg) => {
        if (reg.status === "pending") stats.pendingRegistrations++;
        if (reg.status === "approved") stats.approvedRegistrations++;
        const comp = reg.competitions as { status: string } | null;
        if (comp?.status === "completed" && reg.status === "approved") {
          stats.completedCompetitions++;
        }
      });

      return stats;
    },
    enabled: !!user,
  });

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-4">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={Trophy}
        label={language === "ar" ? "إجمالي المسابقات" : "Total Competitions"}
        value={stats?.totalCompetitions || 0}
      />
      <StatCard
        icon={Clock}
        label={language === "ar" ? "بانتظار الموافقة" : "Pending Approval"}
        value={stats?.pendingRegistrations || 0}
        iconColor="text-warning"
      />
      <StatCard
        icon={CheckCircle}
        label={language === "ar" ? "مقبول" : "Approved"}
        value={stats?.approvedRegistrations || 0}
        iconColor="text-primary"
      />
      <StatCard
        icon={Medal}
        label={language === "ar" ? "مسابقات مكتملة" : "Completed"}
        value={stats?.completedCompetitions || 0}
        iconColor="text-amber-500"
      />
    </div>
  );
}
