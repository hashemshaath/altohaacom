import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExhibitionAnalyticsWidget } from "@/components/admin/ExhibitionAnalyticsWidget";
import { ExhibitionTicketStatsWidget } from "@/components/admin/ExhibitionTicketStatsWidget";
import { ExhibitionLiveStatsWidget } from "@/components/admin/ExhibitionLiveStatsWidget";
import { ExhibitionManagementWidget } from "@/components/admin/ExhibitionManagementWidget";
import { ExhibitionActivityLog } from "@/components/admin/ExhibitionActivityLog";
import { ExhibitionAdvancedAnalytics } from "@/components/admin/ExhibitionAdvancedAnalytics";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { BarChart3, Landmark, Calendar, TrendingUp, CheckCircle, Clock, Eye, Ticket } from "lucide-react";

export default function ExhibitionStatsAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const t = (en: string, ar: string) => (isAr ? ar : en);

  const { data: exhibitions } = useQuery({
    queryKey: ["admin-exhibitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibitions")
        .select("id, status, start_date, view_count");
      if (error) throw error;
      return data;
    },
  });

  const stats = exhibitions
    ? [
        { label: t("Total Events", "إجمالي الفعاليات"), value: exhibitions.length, color: "text-foreground", bg: "bg-muted/60", icon: Landmark },
        { label: t("Pending", "معلقة"), value: exhibitions.filter((e) => e.status === "pending").length, color: "text-chart-4", bg: "bg-chart-4/10", icon: Clock },
        { label: t("Active", "نشطة"), value: exhibitions.filter((e) => e.status === "active").length, color: "text-chart-2", bg: "bg-chart-2/10", icon: TrendingUp },
        { label: t("Upcoming", "قادمة"), value: exhibitions.filter((e) => e.status === "upcoming").length, color: "text-chart-4", bg: "bg-chart-4/10", icon: Calendar },
        { label: t("Completed", "مكتملة"), value: exhibitions.filter((e) => e.status === "completed").length, color: "text-chart-1", bg: "bg-chart-1/10", icon: CheckCircle },
        { label: t("Total Views", "المشاهدات"), value: exhibitions.reduce((sum, e) => sum + (e.view_count || 0), 0), color: "text-primary", bg: "bg-primary/10", icon: Eye },
      ]
    : [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={BarChart3}
        title={t("Events Statistics", "إحصائيات الفعاليات")}
        description={t("Overview of all exhibitions, conferences, and events performance", "نظرة عامة على أداء جميع المعارض والمؤتمرات والفعاليات")}
      />

      {/* Summary Cards */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.map((stat) => (
            <Card key={stat.label} className="group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.bg} shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div>
                  <p className={`text-xl font-bold ${stat.color}`}>
                    <AnimatedCounter value={stat.value} />
                  </p>
                  <p className="text-[12px] text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Analytics Widgets */}
      <div className="grid gap-4 md:grid-cols-2">
        <ExhibitionLiveStatsWidget />
        <ExhibitionTicketStatsWidget />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ExhibitionAnalyticsWidget />
        </div>
        <ExhibitionActivityLog />
      </div>

      <ExhibitionManagementWidget />
      <ExhibitionAdvancedAnalytics />
    </div>
  );
}
