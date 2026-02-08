import { useLanguage } from "@/i18n/LanguageContext";
import { useAdminStats } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Flag } from "lucide-react";

export default function AdminDashboard() {
  const { t } = useLanguage();
  const { data: stats, isLoading } = useAdminStats();

  const statCards = [
    {
      title: t("totalUsers"),
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: t("activeMembers"),
      value: stats?.activeMembers || 0,
      icon: UserCheck,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: t("pendingReports"),
      value: stats?.pendingReports || 0,
      icon: Flag,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold">{t("adminPanel")}</h1>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoading ? "..." : stat.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("actions")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Select a section from the sidebar to manage users, roles, memberships, or moderate content.
        </CardContent>
      </Card>
    </div>
  );
}
