import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAccountType } from "@/hooks/useAccountType";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Clock, CheckCircle, ChefHat, Award, Star, Users } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  iconBg?: string;
  iconColor?: string;
  accent?: string;
}

function StatCard({ icon: Icon, label, value, iconBg = "bg-primary/10", iconColor = "text-primary", accent = "border-primary/20" }: StatCardProps) {
  return (
    <Card className={`group relative overflow-hidden border-s-4 ${accent} bg-card/60 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 hover:bg-card`}>
      <div className="pointer-events-none absolute -end-6 -top-6 h-12 w-12 rounded-full bg-primary/5 blur-xl transition-all duration-500 group-hover:h-24 group-hover:w-24 group-hover:bg-primary/10" />
      <CardContent className="flex items-center gap-2.5 sm:gap-4 p-3 sm:p-4">
        <div className={`flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl ${iconBg} shadow-inner transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}>
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <AnimatedCounter value={value} className="text-xl sm:text-2xl font-black leading-none tracking-tight text-foreground tabular-nums group-hover:text-primary transition-colors" />
          </div>
          <p className="mt-1 truncate text-[0.625rem] sm:text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground/80">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export const QuickStatsWidget = memo(function QuickStatsWidget() {
  const { user } = useAuth();
  const isAr = useIsAr();
  const { isProfessional } = useAccountType();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["user-quick-stats-v2", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const [regsRes, recipesRes, certsRes, followersRes, badgesRes] = await Promise.allSettled([
        supabase.from("competition_registrations").select("status, competitions(status)").eq("participant_id", user.id),
        supabase.from("recipes").select("id", { count: "exact", head: true }).eq("author_id", user.id),
        supabase.from("certificates").select("id", { count: "exact", head: true }).eq("recipient_id", user.id),
        supabase.from("user_follows").select("id", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("user_badges").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gc = (r: PromiseSettledResult<{ data: any; count: number | null }>) => r.status === "fulfilled" ? r.value : { data: null, count: 0 };
      const regs = (gc(regsRes).data || []) as Array<{ status: string; competitions: { status: string } | null }>;
      
      let pending = 0, approved = 0, completed = 0;
      regs.forEach((reg) => {
        if (reg.status === "pending") pending++;
        if (reg.status === "approved") approved++;
        if (reg.competitions?.status === "completed" && reg.status === "approved") completed++;
      });

      return {
        totalCompetitions: regs.length,
        pendingRegistrations: pending,
        approvedRegistrations: approved,
        completedCompetitions: completed,
        recipes: gc(recipesRes).count || 0,
        certificates: gc(certsRes).count || 0,
        followers: gc(followersRes).count || 0,
        badges: gc(badgesRes).count || 0,
      };
    },
    enabled: !!user,
  });

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="grid gap-2.5 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-3.5 p-4">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="space-y-2"><Skeleton className="h-6 w-10" /><Skeleton className="h-3 w-20" /></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Professional chefs get richer stats
  if (isProfessional) {
    return (
      <div className="grid gap-2.5 grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard icon={Trophy} label={isAr ? "المسابقات" : "Competitions"} value={stats?.totalCompetitions || 0} accent="border-primary/30" />
        <StatCard icon={Medal} label={isAr ? "مكتملة" : "Completed"} value={stats?.completedCompetitions || 0} iconBg="bg-chart-1/10" iconColor="text-chart-1" accent="border-chart-1/30" />
        <StatCard icon={ChefHat} label={isAr ? "الوصفات" : "Recipes"} value={stats?.recipes || 0} iconBg="bg-chart-2/10" iconColor="text-chart-2" accent="border-chart-2/30" />
        <StatCard icon={Award} label={isAr ? "شهادات" : "Certificates"} value={stats?.certificates || 0} iconBg="bg-chart-3/10" iconColor="text-chart-3" accent="border-chart-3/30" />
        <StatCard icon={Users} label={isAr ? "متابعون" : "Followers"} value={stats?.followers || 0} iconBg="bg-chart-5/10" iconColor="text-chart-5" accent="border-chart-5/30" />
        <StatCard icon={Star} label={isAr ? "شارات" : "Badges"} value={stats?.badges || 0} iconBg="bg-chart-4/10" iconColor="text-chart-4" accent="border-chart-4/30" />
      </div>
    );
  }

  // Regular users
  return (
    <div className="grid gap-2.5 grid-cols-2 lg:grid-cols-4">
      <StatCard icon={Trophy} label={isAr ? "المسابقات" : "Total"} value={stats?.totalCompetitions || 0} accent="border-primary/30" />
      <StatCard icon={Clock} label={isAr ? "قيد الانتظار" : "Pending"} value={stats?.pendingRegistrations || 0} iconBg="bg-chart-4/10" iconColor="text-chart-4" accent="border-chart-4/30" />
      <StatCard icon={CheckCircle} label={isAr ? "مقبول" : "Approved"} value={stats?.approvedRegistrations || 0} iconBg="bg-chart-5/10" iconColor="text-chart-5" accent="border-chart-5/30" />
      <StatCard icon={Medal} label={isAr ? "مكتملة" : "Completed"} value={stats?.completedCompetitions || 0} iconBg="bg-chart-1/10" iconColor="text-chart-1" accent="border-chart-1/30" />
    </div>
  );
});
