import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings2, FileText, ChefHat, Trophy, Wrench, UtensilsCrossed, Printer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEvaluationDomains } from "@/hooks/useEvaluationSystem";
import { CriteriaManager } from "@/components/evaluation/CriteriaManager";
import { TemplatesManager } from "@/components/evaluation/TemplatesManager";

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Settings2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{isAr ? "مركز التقييم" : "Evaluation Center"}</h1>
            <p className="text-sm text-muted-foreground">
              {isAr
                ? "إعداد وتخصيص معايير التقييم وقوالبها لجميع المجالات — المسابقات، طاولة الشيف، لجان التحكيم"
                : "Configure and manage evaluation criteria & templates for all domains — Competitions, Chef's Table, Judging Panels"}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 print:hidden" onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5" />
          {isAr ? "طباعة" : "Print"}
        </Button>
      </div>

      {/* Domain Stats */}
      <DomainStats />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="print:hidden">
          <TabsTrigger value="criteria" className="gap-1.5">
            <Settings2 className="h-3.5 w-3.5" />
            {isAr ? "معايير التقييم" : "Criteria"}
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
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
