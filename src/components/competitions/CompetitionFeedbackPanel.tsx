import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Star, ThumbsUp, AlertTriangle } from "lucide-react";

interface Props {
  competitionId: string;
}

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; en: string; ar: string }> = {
  general: { icon: <MessageCircle className="h-3.5 w-3.5" />, color: "bg-primary/10 text-primary", en: "General", ar: "عام" },
  strength: { icon: <ThumbsUp className="h-3.5 w-3.5" />, color: "bg-chart-5/10 text-chart-5", en: "Strength", ar: "نقاط القوة" },
  improvement: { icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "bg-chart-4/10 text-chart-4", en: "Improvement", ar: "نقاط التحسين" },
  technique: { icon: <Star className="h-3.5 w-3.5" />, color: "bg-chart-3/10 text-chart-3", en: "Technique", ar: "التقنية" },
};

export const CompetitionFeedbackPanel = memo(function CompetitionFeedbackPanel({ competitionId }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();

  const { data: feedback, isLoading } = useQuery({
    queryKey: ["competition-feedback", competitionId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("competition_feedback")
        .select("id, competition_id, registration_id, judge_id, category, comment, comment_ar, score_breakdown, is_visible, released_at, created_at")
        .eq("competition_id", competitionId)
        .eq("is_visible", true);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;

  if (!feedback?.length) {
    return (
      <Card className="border-dashed border-2 border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <MessageCircle className="h-10 w-10 text-muted-foreground/20 mb-3" />
          <p className="font-medium text-sm">{isAr ? "لا توجد ملاحظات بعد" : "No feedback available yet"}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isAr ? "سيتم نشر ملاحظات الحكام بعد انتهاء التحكيم" : "Judge feedback will be released after judging concludes"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10">
          <MessageCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">{isAr ? "ملاحظات الحكام" : "Judge Feedback"}</h3>
          <p className="text-xs text-muted-foreground">{isAr ? "تعليقات وتقييمات مفصلة" : "Detailed comments & evaluations"}</p>
        </div>
      </div>

      <div className="space-y-3">
        {feedback.map(fb => {
          const cat = CATEGORY_CONFIG[fb.category || "general"] || CATEGORY_CONFIG.general;
          return (
            <Card key={fb.id} className="border-border/50 hover:shadow-sm transition-all">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${cat.color}`}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px]">{isAr ? cat.ar : cat.en}</Badge>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {isAr && fb.comment_ar ? fb.comment_ar : fb.comment}
                    </p>
                    {fb.score_breakdown && (
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {Object.entries(fb.score_breakdown as Record<string, number>).map(([key, val]) => (
                          <div key={key} className="rounded-xl bg-muted/50 p-2 text-center">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{key}</p>
                            <p className="text-sm font-bold text-primary">{val}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
