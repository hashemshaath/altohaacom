import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Users, GraduationCap, Star, TrendingUp } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export function MasterclassInsightsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-masterclass-insights"],
    queryFn: async () => {
      const r1 = await supabase.from("masterclasses").select("*", { count: "exact", head: true });
      const r2 = await (supabase as any).from("masterclasses").select("*", { count: "exact", head: true }).eq("is_published", true);
      const r3 = await (supabase as any).from("masterclass_modules").select("*", { count: "exact", head: true });
      const r4 = await (supabase as any).from("masterclass_enrollments").select("progress_percentage, completed_at");
      const r5 = await (supabase as any).from("masterclasses").select("id, title, title_ar, enrollment_count, average_rating")
        .eq("is_published", true).order("enrollment_count", { ascending: false }).limit(5);

      const totalCourses = r1.count || 0;
      const published = r2.count || 0;
      const totalModules = r3.count || 0;
      const enrollments = r4.data || [];
      const totalEnrollments = enrollments.length;
      const topCourses = r5.data || [];

      const completionRate = totalEnrollments
        ? Math.round((enrollments.filter((e: any) => e.completed_at).length / totalEnrollments) * 100)
        : 0;
      const avgProgress = totalEnrollments
        ? Math.round(enrollments.reduce((s: number, e: any) => s + (e.progress_percentage || 0), 0) / totalEnrollments)
        : 0;

      return {
        totalCourses: totalCourses || 0,
        published: published || 0,
        totalEnrollments: totalEnrollments || 0,
        totalModules: totalModules || 0,
        completionRate,
        avgProgress,
        topCourses: topCourses || [],
      };
    },
    staleTime: 1000 * 60 * 3,
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <GraduationCap className="h-4 w-4 text-chart-4" />
          {isAr ? "إحصائيات الدورات" : "Course Insights"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: BookOpen, label: isAr ? "الدورات" : "Courses", value: `${data?.published}/${data?.totalCourses}`, color: "text-primary" },
            { icon: Users, label: isAr ? "المسجلين" : "Enrollments", value: data?.totalEnrollments, color: "text-chart-2" },
          ].map((m, i) => (
            <div key={i} className="text-center p-2 rounded-xl bg-muted/30 group transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
              <m.icon className={`h-3.5 w-3.5 mx-auto mb-1 ${m.color} transition-transform duration-300 group-hover:scale-110`} />
              <p className="text-sm font-bold">{typeof m.value === "number" ? <AnimatedCounter value={m.value} /> : m.value}</p>
              <p className="text-[9px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Completion & Progress */}
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">{isAr ? "معدل الإكمال" : "Completion Rate"}</span>
              <span className="font-medium text-chart-2"><AnimatedCounter value={data?.completionRate || 0} suffix="%" /></span>
            </div>
            <Progress value={data?.completionRate || 0} className="h-1.5" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">{isAr ? "متوسط التقدم" : "Avg Progress"}</span>
              <span className="font-medium"><AnimatedCounter value={data?.avgProgress || 0} suffix="%" /></span>
            </div>
            <Progress value={data?.avgProgress || 0} className="h-1.5" />
          </div>
        </div>

        {/* Top Courses */}
        {data?.topCourses && data.topCourses.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{isAr ? "الأكثر تسجيلاً" : "Top Courses"}</p>
            {data.topCourses.map((course: any) => (
              <div key={course.id} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-muted/20">
                <span className="truncate flex-1">{isAr && course.title_ar ? course.title_ar : course.title}</span>
                <div className="flex items-center gap-1.5 shrink-0 ms-2">
                  {course.average_rating > 0 && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 gap-0.5">
                      <Star className="h-2 w-2 text-chart-4 fill-chart-4" />{course.average_rating.toFixed(1)}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                    {course.enrollment_count} <Users className="h-2 w-2 ms-0.5" />
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
