import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function CompanyEvaluations() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();

  const { data: evaluations, isLoading } = useQuery({
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

  const avgRating = evaluations && evaluations.length > 0
    ? (evaluations.reduce((sum, e) => sum + (e.overall_rating || 0), 0) / evaluations.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === "ar" ? "التقييمات" : "Evaluations"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {language === "ar" ? "تقييمات الأداء والخدمات" : "Performance and service evaluations"}
        </p>
      </div>

      {/* Average Rating */}
      {evaluations && evaluations.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">
                {language === "ar" ? "متوسط التقييم" : "Average Rating"}
              </p>
              <p className="mt-2 text-3xl font-bold">{avgRating} / 5</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {language === "ar" ? "قائمة التقييمات" : "Evaluations List"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : evaluations && evaluations.length > 0 ? (
            <div className="space-y-4">
              {evaluations.map((evaluation) => (
                <Card key={evaluation.id} className="border">
                  <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === "ar" ? "التقييم الكلي" : "Overall Rating"}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-2xl font-bold">{evaluation.overall_rating}</span>
                          <span className="text-muted-foreground">/5</span>
                        </div>
                      </div>
                      {evaluation.quality_rating && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {language === "ar" ? "جودة" : "Quality"}
                          </p>
                          <p className="mt-2 font-medium">{evaluation.quality_rating}/5</p>
                        </div>
                      )}
                      {evaluation.delivery_rating && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {language === "ar" ? "التسليم" : "Delivery"}
                          </p>
                          <p className="mt-2 font-medium">{evaluation.delivery_rating}/5</p>
                        </div>
                      )}
                      {evaluation.communication_rating && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {language === "ar" ? "التواصل" : "Communication"}
                          </p>
                          <p className="mt-2 font-medium">{evaluation.communication_rating}/5</p>
                        </div>
                      )}
                    </div>
                    {evaluation.review && (
                      <div className="mt-4 border-t pt-4">
                        <p className="text-sm text-muted-foreground">
                          {language === "ar" ? "الملاحظات" : "Comments"}
                        </p>
                        <p className="mt-2">{evaluation.review}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {language === "ar" ? "لا توجد تقييمات" : "No evaluations found"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
