import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Sparkles, MessageSquare, Trophy, Heart, UserPlus, Eye } from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-1))",
];

const TYPE_ICONS: Record<string, React.ElementType> = {
  follow: UserPlus,
  reaction: Heart,
  competition: Trophy,
  message: MessageSquare,
  view: Eye,
};

export function EngagementAnalyticsWidget() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["engagement-analytics", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data: notifs } = await supabase
        .from("notifications")
        .select("type")
        .eq("user_id", user.id)
        .gte("created_at", thirtyDaysAgo);

      if (!notifs || notifs.length === 0) return null;

      // Group by type
      const grouped: Record<string, number> = {};
      for (const n of notifs) {
        const t = n.type || "info";
        grouped[t] = (grouped[t] || 0) + 1;
      }

      const typeLabels: Record<string, { en: string; ar: string }> = {
        follow: { en: "Follows", ar: "متابعات" },
        follow_request: { en: "Follow Requests", ar: "طلبات متابعة" },
        reaction: { en: "Reactions", ar: "تفاعلات" },
        story_view: { en: "Story Views", ar: "مشاهدات القصص" },
        exhibition_update: { en: "Exhibitions", ar: "المعارض" },
        exhibition_review: { en: "Reviews", ar: "تقييمات" },
        exhibition_reminder: { en: "Reminders", ar: "تذكيرات" },
        supplier_review: { en: "Supplier Reviews", ar: "تقييمات الموردين" },
        supplier_inquiry: { en: "Inquiries", ar: "استفسارات" },
        schedule: { en: "Schedule", ar: "الجدول" },
        live_session: { en: "Live Sessions", ar: "جلسات مباشرة" },
        bio_milestone: { en: "Milestones", ar: "إنجازات" },
        bio_subscriber: { en: "Subscribers", ar: "مشتركون" },
        booth_assignment: { en: "Booths", ar: "أجنحة" },
        info: { en: "General", ar: "عام" },
        success: { en: "Success", ar: "نجاح" },
        warning: { en: "Warnings", ar: "تحذيرات" },
        error: { en: "Errors", ar: "أخطاء" },
      };

      // Take top 5 types
      const sorted = Object.entries(grouped)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      const chartData = sorted.map(([type, count]) => ({
        name: isAr ? (typeLabels[type]?.ar || type) : (typeLabels[type]?.en || type),
        value: count,
        type,
      }));

      return { chartData, total: notifs.length };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  if (!user) return null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3"><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-md border-border/50">
      <div className="pointer-events-none absolute -bottom-8 -end-8 h-24 w-24 rounded-full bg-chart-4/5 blur-[40px]" />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-4/10">
            <PieChart className="h-3.5 w-3.5 text-chart-4" />
          </div>
          {isAr ? "تحليل التفاعل" : "Engagement Breakdown"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4">
          {/* Donut chart */}
          <div className="h-24 w-24 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Pie
                  data={data.chartData}
                  innerRadius={25}
                  outerRadius={40}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  strokeWidth={0}
                >
                  {data.chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </RechartsPie>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-1.5">
            {data.chartData.map((item, i) => {
              const Icon = TYPE_ICONS[item.type] || Sparkles;
              return (
                <div key={item.type} className="flex items-center gap-2 text-xs">
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="truncate text-muted-foreground">{item.name}</span>
                  <span className="ms-auto font-semibold tabular-nums">{item.value}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center text-[11px] text-muted-foreground border-t border-border/40 pt-2">
          {isAr
            ? `${data.total} إشعار خلال 30 يوم`
            : `${data.total} notifications in 30 days`}
        </div>
      </CardContent>
    </Card>
  );
}
