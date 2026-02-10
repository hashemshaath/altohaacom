import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { countryFlag } from "@/lib/countryFlag";
import { Users, Trophy, Building2, Award, Globe } from "lucide-react";

interface CountryStats {
  code: string;
  name: string;
  name_ar: string | null;
  is_active: boolean;
  users: number;
  competitions: number;
  companies: number;
  certificates: number;
}

export function CountryOverviewDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: countryStats, isLoading } = useQuery({
    queryKey: ["country-overview-stats"],
    queryFn: async () => {
      // Fetch active countries
      const { data: countries } = await supabase
        .from("countries")
        .select("code, name, name_ar, is_active")
        .eq("is_active", true)
        .order("name");

      if (!countries || countries.length === 0) return [];

      const codes = countries.map((c) => c.code);

      // Parallel count queries
      const [usersRes, compsRes, companiesRes, certsRes] = await Promise.all([
        supabase.from("profiles").select("country_code").in("country_code", codes),
        supabase.from("competitions").select("country_code").in("country_code", codes),
        supabase.from("companies").select("country_code").not("country_code", "is", null).in("country_code", codes),
        supabase.from("certificates").select("id"),
      ]);

      const countBy = (data: { country_code: string | null }[] | null, code: string) =>
        (data || []).filter((r) => r.country_code === code).length;

      const stats: CountryStats[] = countries.map((c) => ({
        code: c.code,
        name: c.name,
        name_ar: c.name_ar,
        is_active: c.is_active ?? false,
        users: countBy(usersRes.data, c.code),
        competitions: countBy(compsRes.data, c.code),
        companies: countBy(companiesRes.data, c.code),
        certificates: 0,
      }));

      // Sort by total activity descending
      stats.sort((a, b) => (b.users + b.competitions + b.companies) - (a.users + a.competitions + a.companies));

      return stats;
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalUsers = countryStats?.reduce((s, c) => s + c.users, 0) || 1;
  const totalComps = countryStats?.reduce((s, c) => s + c.competitions, 0) || 0;
  const totalCompanies = countryStats?.reduce((s, c) => s + c.companies, 0) || 0;

  const statItems = [
    { icon: Users, label: isAr ? "إجمالي المستخدمين" : "Total Users", value: totalUsers, color: "text-primary" },
    { icon: Trophy, label: isAr ? "المسابقات" : "Competitions", value: totalComps, color: "text-chart-3" },
    { icon: Building2, label: isAr ? "الشركات" : "Companies", value: totalCompanies, color: "text-chart-4" },
    { icon: Globe, label: isAr ? "الدول النشطة" : "Active Countries", value: countryStats?.length || 0, color: "text-chart-5" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((s, i) => (
          <Card key={i}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
                <s.icon className={`h-7 w-7 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Per-Country Cards */}
      {(!countryStats || countryStats.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Globe className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              {isAr ? "لا توجد بيانات للدول بعد" : "No country data available yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {countryStats.map((country) => {
            const total = country.users + country.competitions + country.companies;
            const userPct = totalUsers > 0 ? Math.round((country.users / totalUsers) * 100) : 0;

            return (
              <Card key={country.code} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="text-xl">{countryFlag(country.code)}</span>
                      {isAr ? country.name_ar || country.name : country.name}
                    </CardTitle>
                    <Badge variant="outline" className="font-mono text-[10px]">{country.code}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* User share bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{isAr ? "حصة المستخدمين" : "User Share"}</span>
                      <span className="font-medium">{userPct}%</span>
                    </div>
                    <Progress value={userPct} className="h-1.5" />
                  </div>

                  {/* Stat rows */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-primary/5 p-2.5 text-center">
                      <Users className="h-3.5 w-3.5 mx-auto text-primary mb-1" />
                      <p className="text-lg font-bold text-primary">{country.users}</p>
                      <p className="text-[10px] text-muted-foreground">{isAr ? "مستخدم" : "Users"}</p>
                    </div>
                    <div className="rounded-lg bg-chart-3/5 p-2.5 text-center">
                      <Trophy className="h-3.5 w-3.5 mx-auto text-chart-3 mb-1" />
                      <p className="text-lg font-bold text-chart-3">{country.competitions}</p>
                      <p className="text-[10px] text-muted-foreground">{isAr ? "مسابقة" : "Comps"}</p>
                    </div>
                    <div className="rounded-lg bg-chart-4/5 p-2.5 text-center">
                      <Building2 className="h-3.5 w-3.5 mx-auto text-chart-4 mb-1" />
                      <p className="text-lg font-bold text-chart-4">{country.companies}</p>
                      <p className="text-[10px] text-muted-foreground">{isAr ? "شركة" : "Co."}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
