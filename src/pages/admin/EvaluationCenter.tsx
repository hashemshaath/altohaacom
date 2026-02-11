import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UtensilsCrossed, Gavel, BarChart3, Award } from "lucide-react";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const TastingsAdmin = lazy(() => import("./TastingsAdmin"));
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

export default function EvaluationCenter() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState("sessions");

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
              ? "إدارة جلسات التقييم والتذوق والمحكمين والنتائج والشهادات"
              : "Manage evaluation & tasting sessions, judges, results, and certificates"}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
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

        <TabsContent value="sessions">
          <Suspense fallback={<Skeleton className="h-96" />}>
            <TastingsAdmin />
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