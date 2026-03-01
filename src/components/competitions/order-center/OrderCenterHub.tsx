import { useState, lazy, Suspense, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard, ClipboardList, Package, Lightbulb, CheckSquare,
  Send, Wallet, Truck, Activity, BarChart3, ClipboardCheck, BookTemplate, FileInput,
} from "lucide-react";
import { useDeadlineAlerts } from "./useDeadlineAlerts";

// Lazy load all tab panels for performance
const RequirementsListPanel = lazy(() => import("../RequirementsListPanel").then(m => ({ default: m.RequirementsListPanel })));
const SuggestionPanel = lazy(() => import("./SuggestionPanel").then(m => ({ default: m.SuggestionPanel })));
const DeliveryChecklist = lazy(() => import("./DeliveryChecklist").then(m => ({ default: m.DeliveryChecklist })));
const SupermarketCatalog = lazy(() => import("./SupermarketCatalog").then(m => ({ default: m.SupermarketCatalog })));
const QuoteRequestPanel = lazy(() => import("./QuoteRequestPanel").then(m => ({ default: m.QuoteRequestPanel })));
const OrderOverviewDashboard = lazy(() => import("./OrderOverviewDashboard").then(m => ({ default: m.OrderOverviewDashboard })));
const BudgetTracker = lazy(() => import("./BudgetTracker").then(m => ({ default: m.BudgetTracker })));
const VendorAssignmentPanel = lazy(() => import("./VendorAssignmentPanel").then(m => ({ default: m.VendorAssignmentPanel })));
const OrderActivityLog = lazy(() => import("./OrderActivityLog").then(m => ({ default: m.OrderActivityLog })));
const VendorPerformance = lazy(() => import("./VendorPerformance").then(m => ({ default: m.VendorPerformance })));
const ReadinessChecklist = lazy(() => import("./ReadinessChecklist").then(m => ({ default: m.ReadinessChecklist })));
const RequirementTemplates = lazy(() => import("./RequirementTemplates").then(m => ({ default: m.RequirementTemplates })));
const ItemRequestPanel = lazy(() => import("./ItemRequestPanel").then(m => ({ default: m.ItemRequestPanel })));

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

function TabSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-3">
        <Skeleton className="h-20 flex-1 rounded-xl" />
        <Skeleton className="h-20 flex-1 rounded-xl" />
        <Skeleton className="h-20 flex-1 rounded-xl" />
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}

export function OrderCenterHub({ competitionId, isOrganizer }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState("overview");

  // Show toast alerts for overdue/upcoming deadlines on load
  useDeadlineAlerts(competitionId);

  const handleTabChange = useCallback((id: string) => setActiveTab(id), []);

  const TAB_COMPONENTS: Record<string, React.ReactNode> = {
    overview: <OrderOverviewDashboard competitionId={competitionId} isOrganizer={isOrganizer} />,
    requests: <ItemRequestPanel competitionId={competitionId} isOrganizer={isOrganizer} />,
    lists: <RequirementsListPanel competitionId={competitionId} isOrganizer={isOrganizer} />,
    catalog: <SupermarketCatalog />,
    checklist: <DeliveryChecklist competitionId={competitionId} isOrganizer={isOrganizer} />,
    quotes: <QuoteRequestPanel competitionId={competitionId} isOrganizer={isOrganizer} />,
    budget: <BudgetTracker competitionId={competitionId} isOrganizer={isOrganizer} />,
    vendors: <VendorAssignmentPanel competitionId={competitionId} isOrganizer={isOrganizer} />,
    performance: <VendorPerformance competitionId={competitionId} isOrganizer={isOrganizer} />,
    suggestions: <SuggestionPanel competitionId={competitionId} isOrganizer={isOrganizer} />,
    templates: <RequirementTemplates competitionId={competitionId} isOrganizer={isOrganizer} />,
    readiness: <ReadinessChecklist competitionId={competitionId} isOrganizer={isOrganizer} />,
    activity: <OrderActivityLog competitionId={competitionId} isOrganizer={isOrganizer} />,
  };

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

      {/* Sticky Grouped Tab Navigation */}
      <div className="sticky top-0 z-20 rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
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
                        onClick={() => handleTabChange(tab.id)}
                        className={`
                          flex items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] sm:text-xs font-medium transition-all active:scale-95
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

      {/* Tab Content with Suspense */}
      <div className="mt-4">
        <Suspense fallback={<TabSkeleton />}>
          {TAB_COMPONENTS[activeTab] || null}
        </Suspense>
      </div>
    </div>
  );
}
