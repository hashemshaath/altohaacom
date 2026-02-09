import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Trophy, Newspaper, GraduationCap, MessageSquare, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function PlatformOverview() {
  const { language } = useLanguage();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["analyticsOverview"],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: totalCompetitions },
        { count: totalArticles },
        { count: totalMasterclasses },
        { count: totalCertificates },
        { count: totalMessages },
        { data: roleDistribution },
        { data: competitionsByStatus },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("competitions").select("*", { count: "exact", head: true }),
        supabase.from("articles").select("*", { count: "exact", head: true }),
        supabase.from("masterclasses").select("*", { count: "exact", head: true }),
        supabase.from("certificates").select("*", { count: "exact", head: true }),
        supabase.from("messages").select("*", { count: "exact", head: true }),
        supabase.from("user_roles").select("role"),
        supabase.from("competitions").select("status"),
      ]);

      // Aggregate role distribution
      const roleCounts: Record<string, number> = {};
      (roleDistribution || []).forEach((r: any) => {
        roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
      });
      const roleData = Object.entries(roleCounts).map(([name, value]) => ({ name, value }));

      // Aggregate competition status
      const statusCounts: Record<string, number> = {};
      (competitionsByStatus || []).forEach((c: any) => {
        const label = c.status || "unknown";
        statusCounts[label] = (statusCounts[label] || 0) + 1;
      });
      const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

      return {
        totalUsers: totalUsers || 0,
        totalCompetitions: totalCompetitions || 0,
        totalArticles: totalArticles || 0,
        totalMasterclasses: totalMasterclasses || 0,
        totalCertificates: totalCertificates || 0,
        totalMessages: totalMessages || 0,
        roleData,
        statusData,
      };
    },
    staleTime: 1000 * 60,
  });

  const cards = [
    { label: language === "ar" ? "المستخدمين" : "Users", value: stats?.totalUsers, icon: Users },
    { label: language === "ar" ? "المسابقات" : "Competitions", value: stats?.totalCompetitions, icon: Trophy },
    { label: language === "ar" ? "المقالات" : "Articles", value: stats?.totalArticles, icon: Newspaper },
    { label: language === "ar" ? "الدورات" : "Masterclasses", value: stats?.totalMasterclasses, icon: GraduationCap },
    { label: language === "ar" ? "الشهادات" : "Certificates", value: stats?.totalCertificates, icon: Award },
    { label: language === "ar" ? "الرسائل" : "Messages", value: stats?.totalMessages, icon: MessageSquare },
  ];

  return (
    <div className="space-y-6 mt-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "..." : (card.value || 0).toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{language === "ar" ? "توزيع الأدوار" : "Role Distribution"}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.roleData && stats.roleData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={stats.roleData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                    {stats.roleData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-muted-foreground">{language === "ar" ? "لا توجد بيانات" : "No data available"}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{language === "ar" ? "حالة المسابقات" : "Competition Status"}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.statusData && stats.statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-muted-foreground">{language === "ar" ? "لا توجد بيانات" : "No data available"}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
