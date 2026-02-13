import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, ClipboardList, Package, Lightbulb, CheckSquare, Send, Wallet, Truck, Activity, BarChart3, ClipboardCheck, BookTemplate, FileInput } from "lucide-react";
import { RequirementsListPanel } from "../RequirementsListPanel";
import { SuggestionPanel } from "./SuggestionPanel";
import { DeliveryChecklist } from "./DeliveryChecklist";
import { SupermarketCatalog } from "./SupermarketCatalog";
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

const TAB_GROUPS = [
  {
    labelEn: "Core",
    labelAr: "أساسي",
    tabs: [
      { id: "overview", icon: LayoutDashboard, labelEn: "Overview", labelAr: "نظرة عامة" },
      { id: "requests", icon: FileInput, labelEn: "Requests", labelAr: "الطلبات" },
      { id: "lists", icon: ClipboardList, labelEn: "Lists", labelAr: "القوائم" },
      { id: "catalog", icon: Package, labelEn: "Supermarket", labelAr: "السوبرماركت" },
    ],
  },
  {
    labelEn: "Logistics",
    labelAr: "لوجستيات",
    tabs: [
      { id: "checklist", icon: CheckSquare, labelEn: "Checklist", labelAr: "التحقق" },
      { id: "vendors", icon: Truck, labelEn: "Vendors", labelAr: "الموردين" },
      { id: "quotes", icon: Send, labelEn: "Quotes", labelAr: "الأسعار" },
      { id: "budget", icon: Wallet, labelEn: "Budget", labelAr: "الميزانية" },
    ],
  },
  {
    labelEn: "Insights",
    labelAr: "تحليلات",
    tabs: [
      { id: "performance", icon: BarChart3, labelEn: "Performance", labelAr: "الأداء" },
      { id: "suggestions", icon: Lightbulb, labelEn: "Suggestions", labelAr: "اقتراحات" },
      { id: "templates", icon: BookTemplate, labelEn: "Templates", labelAr: "القوالب" },
      { id: "readiness", icon: ClipboardCheck, labelEn: "Readiness", labelAr: "الجاهزية" },
      { id: "activity", icon: Activity, labelEn: "Activity", labelAr: "النشاط" },
    ],
  },
];

export function OrderCenterHub({ competitionId, isOrganizer }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-4">
      {/* Header */}
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

      {/* Grouped Tab Navigation - responsive */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <ScrollArea className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-stretch sm:divide-x sm:divide-border/40 sm:rtl:divide-x-reverse min-w-max">
            {TAB_GROUPS.map((group) => (
              <div key={group.labelEn} className="flex flex-col">
                <div className="px-3 py-1 bg-muted/40 border-b border-border/40">
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? group.labelAr : group.labelEn}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 px-1 py-1 flex-wrap sm:flex-nowrap">
                  {group.tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] sm:text-xs font-medium transition-all
                          ${isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }
                        `}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="whitespace-nowrap">{isAr ? tab.labelAr : tab.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-1.5" />
        </ScrollArea>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === "overview" && <OrderOverviewDashboard competitionId={competitionId} isOrganizer={isOrganizer} />}
        {activeTab === "requests" && <ItemRequestPanel competitionId={competitionId} isOrganizer={isOrganizer} />}
        {activeTab === "lists" && <RequirementsListPanel competitionId={competitionId} isOrganizer={isOrganizer} />}
        {activeTab === "catalog" && <SupermarketCatalog />}
        {activeTab === "checklist" && <DeliveryChecklist competitionId={competitionId} isOrganizer={isOrganizer} />}
        {activeTab === "quotes" && <QuoteRequestPanel competitionId={competitionId} isOrganizer={isOrganizer} />}
        {activeTab === "budget" && <BudgetTracker competitionId={competitionId} isOrganizer={isOrganizer} />}
        {activeTab === "vendors" && <VendorAssignmentPanel competitionId={competitionId} isOrganizer={isOrganizer} />}
        {activeTab === "performance" && <VendorPerformance competitionId={competitionId} isOrganizer={isOrganizer} />}
        {activeTab === "suggestions" && <SuggestionPanel competitionId={competitionId} isOrganizer={isOrganizer} />}
        {activeTab === "templates" && <RequirementTemplates competitionId={competitionId} isOrganizer={isOrganizer} />}
        {activeTab === "readiness" && <ReadinessChecklist competitionId={competitionId} isOrganizer={isOrganizer} />}
        {activeTab === "activity" && <OrderActivityLog competitionId={competitionId} isOrganizer={isOrganizer} />}
      </div>
    </div>
  );
}
