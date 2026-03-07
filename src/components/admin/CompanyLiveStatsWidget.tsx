import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVisibleRefetchInterval } from "@/hooks/useVisibleRefetchInterval";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle, Clock, MapPin, TrendingUp, Users, Star, Factory } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subDays } from "date-fns";
import { AnimatedCounter } from "@/components/ui/animated-counter";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export function CompanyLiveStatsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["companyLiveStats"],
    queryFn: async () => {
      const [companiesRes, establishmentsRes, entitiesRes, contactsRes] = await Promise.all([
        supabase.from("companies").select("id, status, type, country_code, is_verified, created_at, total_reviews, rating"),
        supabase.from("establishments").select("id, type, country_code, created_at, is_active"),
        supabase.from("culinary_entities").select("id, status, entity_type, country_code, created_at"),
        supabase.from("company_contacts").select("id, company_id, role"),
      ]);

      const companies = companiesRes.data || [];
      const establishments = establishmentsRes.data || [];
      const entities = entitiesRes.data || [];
      const contacts = contactsRes.data || [];

      // Totals
      const totalCompanies = companies.length;
      const verifiedCompanies = companies.filter(c => c.is_verified).length;
      const activeCompanies = companies.filter(c => (c as any).status === "active").length;
      const totalEstablishments = establishments.length;
      const totalEntities = entities.length;

      // 14-day registration trend
      const trend: Record<string, { companies: number; establishments: number }> = {};
      for (let i = 13; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "MM/dd");
        trend[d] = { companies: 0, establishments: 0 };
      }
      companies.forEach(c => {
        const d = format(new Date(c.created_at), "MM/dd");
        if (d in trend) trend[d].companies++;
      });
      establishments.forEach(e => {
        const d = format(new Date(e.created_at), "MM/dd");
        if (d in trend) trend[d].establishments++;
      });
      const trendData = Object.entries(trend).map(([date, v]) => ({ date, ...v }));

      // Type distribution
      const typeMap: Record<string, number> = {};
      companies.forEach(c => {
        const t = c.type || "other";
        typeMap[t] = (typeMap[t] || 0) + 1;
      });
      const typeData = Object.entries(typeMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);

      // Top countries
      const countryMap: Record<string, number> = {};
      [...companies, ...establishments].forEach(c => {
        const cc = (c as any).country_code || "N/A";
        countryMap[cc] = (countryMap[cc] || 0) + 1;
      });
      const topCountries = Object.entries(countryMap).sort(([, a], [, b]) => b - a).slice(0, 5);

      // Average rating
      const rated = companies.filter(c => c.rating && c.rating > 0);
      const avgRating = rated.length > 0
        ? (rated.reduce((s, c) => s + Number(c.rating), 0) / rated.length).toFixed(1)
        : "0";

      // Employees count
      const totalEmployees = contacts.length;

      return {
        totalCompanies, verifiedCompanies, activeCompanies,
        totalEstablishments, totalEntities, totalEmployees,
        trendData, typeData, topCountries, avgRating,
        verificationRate: totalCompanies > 0 ? Math.round((verifiedCompanies / totalCompanies) * 100) : 0,
      };
    },
    refetchInterval: 60000,
  });

  if (!data) return null;

  const stats = [
    { label: isAr ? "الشركات" : "Companies", value: data.totalCompanies, icon: Building2, color: "text-primary" },
    { label: isAr ? "المنشآت" : "Establishments", value: data.totalEstablishments, icon: Factory, color: "text-chart-2" },
    { label: isAr ? "الجهات" : "Entities", value: data.totalEntities, icon: Users, color: "text-chart-3" },
    { label: isAr ? "نسبة التوثيق" : "Verified", value: `${data.verificationRate}%`, icon: CheckCircle, color: "text-chart-4" },
  ];

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          {isAr ? "إحصائيات الشركات والمؤسسات المباشرة" : "Companies & Establishments Live Stats"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-muted/50 rounded-xl p-3 text-center">
              <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
              <div className="text-lg font-bold"><AnimatedCounter value={typeof s.value === "number" ? s.value : 0} /></div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Registration Trend */}
          <div className="md:col-span-2">
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "تسجيلات آخر 14 يوم" : "14-Day Registrations"}
            </p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={data.trendData}>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="companies" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} name={isAr ? "شركات" : "Companies"} />
                <Bar dataKey="establishments" fill="hsl(var(--chart-3))" radius={[2, 2, 0, 0]} name={isAr ? "منشآت" : "Establishments"} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Type Distribution */}
          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "توزيع الأنواع" : "Type Distribution"}
            </p>
            {data.typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={data.typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} innerRadius={25}>
                    {data.typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-xs text-muted-foreground">
                {isAr ? "لا توجد بيانات" : "No data"}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          <div className="bg-muted/50 rounded-xl p-2">
            <div className="flex items-center gap-1 mb-1">
              <Star className="h-3 w-3 text-chart-4" />
              <span className="text-[10px] text-muted-foreground">{isAr ? "متوسط التقييم" : "Avg Rating"}</span>
            </div>
            <span className="font-bold text-sm">{data.avgRating} ⭐</span>
          </div>
          <div className="bg-muted/50 rounded-xl p-2">
            <div className="flex items-center gap-1 mb-1">
              <Users className="h-3 w-3 text-primary" />
              <span className="text-[10px] text-muted-foreground">{isAr ? "الموظفون" : "Employees"}</span>
            </div>
            <span className="font-bold text-sm">{data.totalEmployees}</span>
          </div>
          <div className="bg-muted/50 rounded-xl p-2 col-span-2 md:col-span-1">
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="h-3 w-3 text-chart-3" />
              <span className="text-[10px] text-muted-foreground">{isAr ? "أعلى الدول" : "Top Countries"}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {data.topCountries.map(([cc, count]) => (
                <Badge key={cc} variant="secondary" className="text-[9px] px-1 py-0">{cc}: {count}</Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
