import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Award, MessageSquare } from "lucide-react";
import { CompanyEvaluation } from "@/components/company/evaluations/evaluationTypes";
import { EvaluationStats } from "@/components/company/evaluations/EvaluationStats";
import { EvaluationCard } from "@/components/company/evaluations/EvaluationCard";

export default function CompanyEvaluations() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

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
      return (data || []) as unknown as CompanyEvaluation[];
    },
    enabled: !!companyId,
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, response, responseAr }: { id: string; response: string; responseAr: string }) => {
      const { error } = await supabase
        .from("company_evaluations")
        .update({
          company_response: response || null,
          company_response_ar: responseAr || null,
          responded_at: new Date().toISOString(),
          responded_by: user?.id || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyEvaluations"] });
      toast({ title: isAr ? "تم إرسال الرد" : "Response submitted" });
    },
    onError: () => {
      toast({ title: isAr ? "حدث خطأ" : "Error submitting response", variant: "destructive" });
    },
  });

  const avg = (field: keyof CompanyEvaluation) => {
    const vals = evaluations.map((e) => e[field] as number | null).filter((v): v is number => v != null);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
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
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Award className="h-6 w-6 text-primary" />
          {isAr ? "التقييمات" : "Evaluations"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isAr ? "تقييمات الأداء والخدمات" : "Performance and service evaluations"}
        </p>
      </div>

      <EvaluationStats
        overallAvg={avg("overall_rating")}
        qualityAvg={avg("quality_rating")}
        deliveryAvg={avg("delivery_rating")}
        communicationAvg={avg("communication_rating")}
        valueAvg={avg("value_rating")}
        totalCount={evaluations.length}
        language={language}
      />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          {isAr ? "الملاحظات" : "Reviews"}
        </h2>
        {evaluations.length > 0 ? (
          evaluations.map((evaluation) => (
            <EvaluationCard
              key={evaluation.id}
              evaluation={evaluation}
              language={language}
              onRespond={(id, response, responseAr) => respondMutation.mutate({ id, response, responseAr })}
              isResponding={respondMutation.isPending}
            />
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
                <Award className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                {isAr ? "لا توجد تقييمات بعد" : "No evaluations yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
