import { useLanguage } from "@/i18n/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, ClipboardList, Package, Lightbulb, CheckSquare, Send, Wallet, Truck, Activity, BarChart3, ClipboardCheck, BookTemplate, FileInput } from "lucide-react";
import { RequirementsListPanel } from "../RequirementsListPanel";
import { SuggestionPanel } from "./SuggestionPanel";
import { DeliveryChecklist } from "./DeliveryChecklist";
import { CatalogBrowser } from "./CatalogBrowser";
import { QuoteRequestPanel } from "./QuoteRequestPanel";
import { OrderOverviewDashboard } from "./OrderOverviewDashboard";
import { BudgetTracker } from "./BudgetTracker";
import { VendorAssignmentPanel } from "./VendorAssignmentPanel";
import { OrderActivityLog } from "./OrderActivityLog";
import { VendorPerformance } from "./VendorPerformance";
import { ReadinessChecklist } from "./ReadinessChecklist";
import { RequirementTemplates } from "./RequirementTemplates";
import { ItemRequestPanel } from "./ItemRequestPanel";

interface Props {
  competitionId: string;
  isOrganizer?: boolean;
}

export function OrderCenterHub({ competitionId, isOrganizer }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const tabs = [
    { id: "overview", icon: <LayoutDashboard className="h-3.5 w-3.5" />, label: isAr ? "نظرة عامة" : "Overview" },
    { id: "requests", icon: <FileInput className="h-3.5 w-3.5" />, label: isAr ? "طلبات العناصر" : "Item Requests" },
    { id: "lists", icon: <ClipboardList className="h-3.5 w-3.5" />, label: isAr ? "قوائم المتطلبات" : "Requirement Lists" },
    { id: "catalog", icon: <Package className="h-3.5 w-3.5" />, label: isAr ? "كتالوج العناصر" : "Item Catalog" },
    { id: "checklist", icon: <CheckSquare className="h-3.5 w-3.5" />, label: isAr ? "قائمة التحقق" : "Delivery Checklist" },
    { id: "quotes", icon: <Send className="h-3.5 w-3.5" />, label: isAr ? "طلبات الأسعار" : "Quote Requests" },
    { id: "budget", icon: <Wallet className="h-3.5 w-3.5" />, label: isAr ? "الميزانية" : "Budget" },
    { id: "vendors", icon: <Truck className="h-3.5 w-3.5" />, label: isAr ? "الموردين" : "Vendors" },
    { id: "performance", icon: <BarChart3 className="h-3.5 w-3.5" />, label: isAr ? "أداء الموردين" : "Performance" },
    { id: "suggestions", icon: <Lightbulb className="h-3.5 w-3.5" />, label: isAr ? "الاقتراحات" : "Suggestions" },
    { id: "templates", icon: <BookTemplate className="h-3.5 w-3.5" />, label: isAr ? "القوالب" : "Templates" },
    { id: "readiness", icon: <ClipboardCheck className="h-3.5 w-3.5" />, label: isAr ? "الجاهزية" : "Readiness" },
    { id: "activity", icon: <Activity className="h-3.5 w-3.5" />, label: isAr ? "سجل النشاط" : "Activity Log" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-chart-4/10">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">{isAr ? "مركز إدارة الطلبات" : "Order Management Center"}</h2>
          <p className="text-xs text-muted-foreground">
            {isAr ? "إدارة شاملة لجميع متطلبات وتجهيزات المسابقة" : "Comprehensive management of all competition requirements & supplies"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5 text-xs">
              {tab.icon} {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OrderOverviewDashboard competitionId={competitionId} isOrganizer={isOrganizer} />
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <ItemRequestPanel competitionId={competitionId} isOrganizer={isOrganizer} />
        </TabsContent>

        <TabsContent value="lists" className="mt-4">
          <RequirementsListPanel competitionId={competitionId} isOrganizer={isOrganizer} />
        </TabsContent>

        <TabsContent value="catalog" className="mt-4">
          <CatalogBrowser competitionId={competitionId} isOrganizer={isOrganizer} />
        </TabsContent>

        <TabsContent value="checklist" className="mt-4">
          <DeliveryChecklist competitionId={competitionId} isOrganizer={isOrganizer} />
        </TabsContent>

        <TabsContent value="quotes" className="mt-4">
          <QuoteRequestPanel competitionId={competitionId} isOrganizer={isOrganizer} />
        </TabsContent>

        <TabsContent value="budget" className="mt-4">
          <BudgetTracker competitionId={competitionId} isOrganizer={isOrganizer} />
        </TabsContent>

        <TabsContent value="vendors" className="mt-4">
          <VendorAssignmentPanel competitionId={competitionId} isOrganizer={isOrganizer} />
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <VendorPerformance competitionId={competitionId} isOrganizer={isOrganizer} />
        </TabsContent>

        <TabsContent value="suggestions" className="mt-4">
          <SuggestionPanel competitionId={competitionId} isOrganizer={isOrganizer} />
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <RequirementTemplates competitionId={competitionId} isOrganizer={isOrganizer} />
        </TabsContent>

        <TabsContent value="readiness" className="mt-4">
          <ReadinessChecklist competitionId={competitionId} isOrganizer={isOrganizer} />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <OrderActivityLog competitionId={competitionId} isOrganizer={isOrganizer} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
