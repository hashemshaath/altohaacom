import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, BookOpen, ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export function MasterclassProgressWidget() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["dashboard-enrollments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("masterclass_enrollments")
        .select("id, status, progress_percent, masterclass_id, masterclasses(id, title, title_ar, cover_image_url, category)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("enrolled_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  if (!user) return null;

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/30 px-4 py-3">
          <Skeleton className="h-5 w-44" />
        </div>
        <CardContent className="p-4 space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-md" />)}
        </CardContent>
      </Card>
    );
  }

    return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-md border-border/50">
      <div className="pointer-events-none absolute -top-14 -end-14 h-36 w-36 rounded-full bg-chart-3/5 blur-[45px]" />
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-3/10">
            <GraduationCap className="h-3.5 w-3.5 text-chart-3" />
          </div>
          {isAr ? "دوراتي التعليمية" : "My Courses"}
        </h3>
        <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" asChild>
          <Link to="/masterclasses">
            {isAr ? "عرض الكل" : "View All"}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>
      <CardContent className="p-4">
        {enrollments && enrollments.length > 0 ? (
          <div className="space-y-3">
            {enrollments.map((enrollment: any) => {
              const mc = enrollment.masterclasses as any;
              if (!mc) return null;
              const title = isAr && mc.title_ar ? mc.title_ar : mc.title;
              const progress = enrollment.progress_percent || 0;

              return (
                <Link
                  key={enrollment.id}
                  to={`/masterclasses/${mc.id}`}
                  className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-accent/20"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                    {mc.cover_image_url ? (
                      <img src={mc.cover_image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <BookOpen className="h-4 w-4 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{title}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Progress value={progress} className="h-1.5 flex-1" />
                      <span className="text-[10px] font-medium text-muted-foreground shrink-0">
                        {progress}%
                      </span>
                    </div>
                  </div>
                  {progress >= 100 && (
                    <CheckCircle className="h-4 w-4 text-chart-5 shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <GraduationCap className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isAr ? "لم تسجل في أي دورة بعد" : "No courses enrolled yet"}
            </p>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <Link to="/masterclasses">
                {isAr ? "استكشف الدورات" : "Explore Courses"}
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
