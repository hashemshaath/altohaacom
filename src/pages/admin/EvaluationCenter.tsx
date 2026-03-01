import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Settings2, FileText, ChefHat, Trophy, Wrench, UtensilsCrossed, Printer, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEvaluationDomains, useEvaluationCriteriaByDomain } from "@/hooks/useEvaluationSystem";
import { CriteriaManager } from "@/components/evaluation/CriteriaManager";
import { TemplatesManager } from "@/components/evaluation/TemplatesManager";
import { useCSVExport } from "@/hooks/useCSVExport";

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
          <Card key={d.id} className="rounded-2xl border-border/40 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
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
  const { data: domains } = useEvaluationDomains();

  const { exportCSV } = useCSVExport({
    columns: [
      { header: isAr ? "الاسم" : "Name", accessor: (r: any) => isAr && r.name_ar ? r.name_ar : r.name },
      { header: "Slug", accessor: (r: any) => r.slug },
      { header: isAr ? "الوصف" : "Description", accessor: (r: any) => isAr && r.description_ar ? r.description_ar : r.description || "" },
      { header: isAr ? "نشط" : "Active", accessor: (r: any) => r.is_active ? "Yes" : "No" },
    ],
    filename: "evaluation-domains",
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Settings2}
        title={isAr ? "مركز التقييم" : "Evaluation Center"}
        description={isAr
          ? "إعداد وتخصيص معايير التقييم وقوالبها لجميع المجالات — المسابقات، طاولة الشيف، لجان التحكيم"
          : "Configure and manage evaluation criteria & templates for all domains — Competitions, Chef's Table, Judging Panels"}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 print:hidden" onClick={() => domains?.length && exportCSV(domains)}>
              <Download className="h-3.5 w-3.5" />
              {isAr ? "تصدير" : "Export"}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 print:hidden" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" />
              {isAr ? "طباعة" : "Print"}
            </Button>
          </div>
        }
      />

      {/* Domain Stats */}
      <DomainStats />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="print:hidden rounded-2xl border border-border/40 bg-muted/30 backdrop-blur p-1.5 h-auto">
          <TabsTrigger value="criteria" className="gap-1.5 rounded-xl data-[state=active]:shadow-sm">
            <Settings2 className="h-3.5 w-3.5" />
            {isAr ? "معايير التقييم" : "Criteria"}
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5 rounded-xl data-[state=active]:shadow-sm">
            <FileText className="h-3.5 w-3.5" />
            {isAr ? "القوالب" : "Templates"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="criteria">
          <CriteriaManager />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
