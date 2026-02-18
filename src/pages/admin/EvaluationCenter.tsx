import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UtensilsCrossed, Gavel, BarChart3, Award, Settings2, ChefHat, Trophy, Wrench } from "lucide-react";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEvaluationDomains } from "@/hooks/useEvaluationSystem";
import { CriteriaManager } from "@/components/evaluation/CriteriaManager";

const ChefsTableAdmin = lazy(() => import("./ChefsTableAdmin"));
const JudgesAdmin = lazy(() => import("./JudgesAdmin"));

// Inline Results Overview for admin
function ResultsOverview() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <p className="text-lg font-medium">{isAr ? "نتائج التقييم" : "Evaluation Results"}</p>
      <p className="mt-1 text-sm text-muted-foreground max-w-md">
        {isAr
          ? "يمكنك الاطلاع على نتائج التقييم من صفحة تفاصيل كل جلسة تقييم"
          : "View evaluation results from each session's detail page"}
      </p>
    </div>
  );
}

function CertificatesOverview() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Award className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <p className="text-lg font-medium">{isAr ? "شهادات التقييم" : "Evaluation Certificates"}</p>
      <p className="mt-1 text-sm text-muted-foreground max-w-md">
        {isAr
          ? "يتم إصدار الشهادات تلقائياً (فائزين، تقدير للمحكمين، مشاركة) من صفحة الشهادات الرئيسية"
          : "Certificates (winners, judge appreciation, participation) are auto-issued from the main Certificates page"}
      </p>
    </div>
  );
}

function DomainStats() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: domains } = useEvaluationDomains();

  const domainIcons: Record<string, React.ElementType> = {
    chefs_table: ChefHat,
    competition: Trophy,
    equipment: Wrench,
    beverage: UtensilsCrossed,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {domains?.map(d => {
        const Icon = domainIcons[d.slug] || UtensilsCrossed;
        return (
          <Card key={d.id} className="border-border/40">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">{isAr && d.name_ar ? d.name_ar : d.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {isAr && d.description_ar ? d.description_ar : d.description}
                </p>
              </div>
              <Badge variant={d.is_active ? "default" : "secondary"} className="ms-auto text-[9px]">
                {d.is_active ? (isAr ? "نشط" : "Active") : (isAr ? "معطل" : "Inactive")}
              </Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function EvaluationCenter() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState("criteria");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{isAr ? "مركز التقييم" : "Evaluation Center"}</h1>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? "نظام تقييم شامل يدعم طاولة الشيف، المسابقات، المعدات والمشروبات — بمعايير WACS و ACF الدولية"
              : "Comprehensive evaluation system supporting Chef's Table, Competitions, Equipment & Beverages — aligned with WACS & ACF standards"}
          </p>
        </div>
      </div>

      {/* Domain Stats */}
      <DomainStats />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="criteria" className="gap-1.5">
            <Settings2 className="h-3.5 w-3.5" />
            {isAr ? "معايير التقييم" : "Evaluation Criteria"}
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-1.5">
            <UtensilsCrossed className="h-3.5 w-3.5" />
            {isAr ? "الجلسات" : "Sessions"}
          </TabsTrigger>
          <TabsTrigger value="judges" className="gap-1.5">
            <Gavel className="h-3.5 w-3.5" />
            {isAr ? "المحكمين" : "Judges"}
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            {isAr ? "النتائج" : "Results"}
          </TabsTrigger>
          <TabsTrigger value="certificates" className="gap-1.5">
            <Award className="h-3.5 w-3.5" />
            {isAr ? "الشهادات" : "Certificates"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="criteria">
          <CriteriaManager />
        </TabsContent>

        <TabsContent value="sessions">
          <Suspense fallback={<Skeleton className="h-96" />}>
            <ChefsTableAdmin />
          </Suspense>
        </TabsContent>

        <TabsContent value="judges">
          <Suspense fallback={<Skeleton className="h-96" />}>
            <JudgesAdmin />
          </Suspense>
        </TabsContent>

        <TabsContent value="results">
          <ResultsOverview />
        </TabsContent>

        <TabsContent value="certificates">
          <CertificatesOverview />
        </TabsContent>
      </Tabs>
    </div>
  );
}
