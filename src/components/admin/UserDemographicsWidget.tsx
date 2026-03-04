import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Globe, Users, Shield, UserCheck, Crown, Star, TrendingUp, Clock } from "lucide-react";

export function UserDemographicsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["user-demographics-widget"],
    queryFn: async () => {
      const [
        { data: countryData },
        { data: roleData },
        { data: tierData },
        { count: verifiedCount },
        { count: totalCount },
        { count: newThisWeek },
        { count: onlineRecent },
      ] = await Promise.all([
        supabase.from("profiles").select("country_code").not("country_code", "is", null).limit(1000),
        supabase.from("user_roles").select("role").limit(1000),
        supabase.from("profiles").select("membership_tier").limit(1000),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_verified", true),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("last_login_at", new Date(Date.now() - 3600000).toISOString()),
      ]);

      // Country distribution - top 5
      const countryCounts: Record<string, number> = {};
      countryData?.forEach(p => {
        if (p.country_code) countryCounts[p.country_code] = (countryCounts[p.country_code] || 0) + 1;
      });
      const topCountries = Object.entries(countryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // Role distribution
      const roleCounts: Record<string, number> = {};
      roleData?.forEach(r => { roleCounts[r.role] = (roleCounts[r.role] || 0) + 1; });

      // Tier distribution
      const tierCounts: Record<string, number> = {};
      tierData?.forEach(p => {
        const tier = p.membership_tier || "basic";
        tierCounts[tier] = (tierCounts[tier] || 0) + 1;
      });

      return {
        topCountries,
        roleCounts,
        tierCounts,
        verifiedCount: verifiedCount || 0,
        totalCount: totalCount || 0,
        newThisWeek: newThisWeek || 0,
        onlineRecent: onlineRecent || 0,
      };
    },
    staleTime: 60000,
  });

  if (!data) return null;

  const maxCountry = data.topCountries[0]?.[1] || 1;

  const tierColors: Record<string, string> = {
    basic: "text-muted-foreground",
    silver: "text-chart-3",
    gold: "text-chart-4",
    platinum: "text-chart-1",
    diamond: "text-primary",
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Globe className="h-4 w-4 text-chart-1" />
          {isAr ? "تحليل المستخدمين" : "User Demographics"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-4">
        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { icon: Users, label: isAr ? "الإجمالي" : "Total", value: data.totalCount, color: "text-primary" },
            { icon: UserCheck, label: isAr ? "موثقون" : "Verified", value: data.verifiedCount, color: "text-chart-2" },
            { icon: TrendingUp, label: isAr ? "جدد هذا الأسبوع" : "New This Week", value: data.newThisWeek, color: "text-chart-3" },
            { icon: Clock, label: isAr ? "نشط الآن" : "Online Now", value: data.onlineRecent, color: "text-chart-4" },
          ].map((s, i) => (
            <div key={i} className="p-2 rounded-xl bg-muted/30 flex items-center gap-2">
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              <div>
                <p className="text-sm font-bold">{s.value}</p>
                <p className="text-[9px] text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Top countries */}
        <div>
          <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">{isAr ? "أعلى الدول" : "Top Countries"}</p>
          <div className="space-y-1.5">
            {data.topCountries.map(([code, count]) => (
              <div key={code} className="flex items-center gap-2">
                <span className="text-xs font-mono w-6">{code}</span>
                <Progress value={(count / maxCountry) * 100} className="h-1.5 flex-1" />
                <span className="text-[10px] text-muted-foreground w-8 text-end">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Role & Tier badges */}
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(data.roleCounts).map(([role, count]) => (
            <Badge key={role} variant="outline" className="text-[9px] gap-1">
              <Shield className="h-2.5 w-2.5" /> {role}: {count}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(data.tierCounts).map(([tier, count]) => (
            <Badge key={tier} variant="secondary" className={`text-[9px] gap-1 ${tierColors[tier] || ""}`}>
              <Crown className="h-2.5 w-2.5" /> {tier}: {count}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
