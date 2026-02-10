import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star,
  Award,
  TrendingUp,
  MessageSquare,
  Truck,
  Phone,
  ThumbsUp,
} from "lucide-react";

export default function CompanyEvaluations() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();

  const { data: evaluations = [], isLoading } = useQuery({
    queryKey: ["companyEvaluations", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("company_evaluations")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const avg = (field: string) => {
    const vals = evaluations.map((e: any) => e[field]).filter(Boolean);
    return vals.length > 0 ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length) : 0;
  };

  const overallAvg = avg("overall_rating");
  const qualityAvg = avg("quality_rating");
  const deliveryAvg = avg("delivery_rating");
  const communicationAvg = avg("communication_rating");
  const valueAvg = avg("value_rating");

  const ratingCategories = [
    { label: language === "ar" ? "الجودة" : "Quality", value: qualityAvg, icon: ThumbsUp, color: "text-chart-5" },
    { label: language === "ar" ? "التسليم" : "Delivery", value: deliveryAvg, icon: Truck, color: "text-primary" },
    { label: language === "ar" ? "التواصل" : "Communication", value: communicationAvg, icon: Phone, color: "text-chart-3" },
    { label: language === "ar" ? "القيمة" : "Value", value: valueAvg, icon: TrendingUp, color: "text-chart-4" },
  ];

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`h-4 w-4 ${s <= Math.round(rating) ? "fill-chart-4 text-chart-4" : "text-muted-foreground/30"}`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Award className="h-6 w-6 text-primary" />
          {language === "ar" ? "التقييمات" : "Evaluations"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {language === "ar" ? "تقييمات الأداء والخدمات" : "Performance and service evaluations"}
        </p>
      </div>

      {/* Overall Score */}
      <Card className="border-s-[3px] border-s-chart-4">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-chart-4/10">
            <Star className="h-8 w-8 fill-chart-4 text-chart-4" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{language === "ar" ? "التقييم العام" : "Overall Rating"}</p>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-3xl font-bold">{overallAvg.toFixed(1)}</p>
              <span className="text-muted-foreground">/5</span>
              {renderStars(overallAvg)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {language === "ar" ? `بناءً على ${evaluations.length} تقييم` : `Based on ${evaluations.length} evaluations`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ratingCategories.map((cat) => (
          <Card key={cat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <cat.icon className={`h-4 w-4 ${cat.color}`} />
                <p className="text-sm font-medium">{cat.label}</p>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">{cat.value.toFixed(1)}</span>
                {renderStars(cat.value)}
              </div>
              <Progress value={(cat.value / 5) * 100} className="h-1.5" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          {language === "ar" ? "الملاحظات" : "Reviews"}
        </h2>
        {evaluations.length > 0 ? (
          evaluations.map((evaluation) => (
            <Card key={evaluation.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {renderStars(evaluation.overall_rating || 0)}
                    <span className="text-sm font-medium">{evaluation.overall_rating}/5</span>
                  </div>
                  {evaluation.is_public && (
                    <Badge variant="outline" className="text-xs">
                      {language === "ar" ? "عام" : "Public"}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 mb-3">
                  {evaluation.quality_rating && (
                    <Badge variant="secondary" className="text-xs">
                      {language === "ar" ? "جودة" : "Quality"}: {evaluation.quality_rating}/5
                    </Badge>
                  )}
                  {evaluation.delivery_rating && (
                    <Badge variant="secondary" className="text-xs">
                      {language === "ar" ? "تسليم" : "Delivery"}: {evaluation.delivery_rating}/5
                    </Badge>
                  )}
                  {evaluation.communication_rating && (
                    <Badge variant="secondary" className="text-xs">
                      {language === "ar" ? "تواصل" : "Comm"}: {evaluation.communication_rating}/5
                    </Badge>
                  )}
                </div>
                {(evaluation.review || evaluation.review_ar) && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {language === "ar" ? evaluation.review_ar || evaluation.review : evaluation.review}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
                <Award className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                {language === "ar" ? "لا توجد تقييمات بعد" : "No evaluations yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
