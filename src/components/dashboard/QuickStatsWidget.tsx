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
  iconBg?: string;
  iconColor?: string;
  accent?: string;
}

function StatCard({ icon: Icon, label, value, iconBg = "bg-primary/10", iconColor = "text-primary", accent = "border-primary/20" }: StatCardProps) {
  return (
    <Card className={`border-s-[3px] ${accent} transition-shadow hover:shadow-sm`}>
      <CardContent className="flex items-center gap-3.5 p-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold leading-none tracking-tight">{value}</p>
          <p className="mt-1.5 truncate text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickStatsWidget() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: stats, isLoading } = useQuery({
    queryKey: ["user-quick-stats", user?.id],
    queryFn: async () => {
      if (!user) {
        return { totalCompetitions: 0, pendingRegistrations: 0, approvedRegistrations: 0, completedCompetitions: 0 };
      }

      const { data: registrations, error } = await supabase
        .from("competition_registrations")
        .select("status, competitions(status)")
        .eq("participant_id", user.id);

      if (error) throw error;

      const stats = { totalCompetitions: registrations?.length || 0, pendingRegistrations: 0, approvedRegistrations: 0, completedCompetitions: 0 };

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

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-3.5 p-4">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-10" />
                <Skeleton className="h-3 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={Trophy}
        label={isAr ? "إجمالي المسابقات" : "Total Competitions"}
        value={stats?.totalCompetitions || 0}
        accent="border-primary/30"
      />
      <StatCard
        icon={Clock}
        label={isAr ? "بانتظار الموافقة" : "Pending Approval"}
        value={stats?.pendingRegistrations || 0}
        iconBg="bg-chart-4/10"
        iconColor="text-chart-4"
        accent="border-chart-4/30"
      />
      <StatCard
        icon={CheckCircle}
        label={isAr ? "مقبول" : "Approved"}
        value={stats?.approvedRegistrations || 0}
        iconBg="bg-chart-5/10"
        iconColor="text-chart-5"
        accent="border-chart-5/30"
      />
      <StatCard
        icon={Medal}
        label={isAr ? "مسابقات مكتملة" : "Completed"}
        value={stats?.completedCompetitions || 0}
        iconBg="bg-chart-1/10"
        iconColor="text-chart-1"
        accent="border-chart-1/30"
      />
    </div>
  );
}
