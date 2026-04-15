import { useIsAr } from "@/hooks/useIsAr";
import { lazy, Suspense, useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  CreditCard, BarChart3, Users, Star, UserX, History, TrendingUp,
  PieChart, Share2, ShieldAlert, FileText, Settings2, GitBranch,
  Wallet, Receipt, Bell, Shield, UserCog, Zap, DollarSign,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const MembershipOverview = lazy(() => import("@/components/admin/membership/MembershipOverview"));
const MembershipMembersTab = lazy(() => import("@/components/admin/membership/MembershipMembersTab"));
const MembershipBenefitsTab = lazy(() => import("@/components/admin/membership/MembershipBenefitsTab"));
const MembershipCancellationsTab = lazy(() => import("@/components/admin/membership/MembershipCancellationsTab"));
const MembershipHistoryTab = lazy(() => import("@/components/admin/membership/MembershipHistoryTab"));
const MembershipFeatureAnalytics = lazy(() => import("@/components/admin/membership/MembershipFeatureAnalytics"));
const MembershipAnalyticsDashboard = lazy(() => import("@/components/admin/membership/MembershipAnalyticsDashboard"));
const MembershipReferralsTab = lazy(() => import("@/components/admin/membership/MembershipReferralsTab"));
const MembershipChurnRetention = lazy(() => import("@/components/admin/membership/MembershipChurnRetention"));
const MembershipDigestPanel = lazy(() => import("@/components/admin/membership/MembershipDigestPanel"));
const MembershipPolicySettings = lazy(() => import("@/components/admin/membership/MembershipPolicySettings"));
const MembershipLifecycleTimeline = lazy(() => import("@/components/admin/membership/MembershipLifecycleTimeline"));
const MembershipFeatureControl = lazy(() => import("@/components/admin/membership/MembershipFeatureControl"));
const MembershipUserOverrides = lazy(() => import("@/components/admin/membership/MembershipUserOverrides"));
const MembershipWalletTab = lazy(() => import("@/components/admin/membership/MembershipWalletTab"));
const MembershipInvoicesTab = lazy(() => import("@/components/admin/membership/MembershipInvoicesTab"));
const MembershipNotificationsTab = lazy(() => import("@/components/admin/membership/MembershipNotificationsTab"));
const MembershipBulkOperationsTab = lazy(() => import("@/components/admin/membership/MembershipBulkOperationsTab"));
const MembershipRevenueTab = lazy(() => import("@/components/admin/membership/MembershipRevenueTab"));

function TabFallback() {
  const isAr = useIsAr();
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
      </div>
      <Skeleton className="h-56 w-full rounded-lg" />
    </div>
  );
}

// Group tabs into categories for better navigation
const tabGroups = (isAr: boolean) => [
  {
    label: isAr ? "الرئيسية" : "Core",
    tabs: [
      { value: "overview", icon: BarChart3, label: isAr ? "عامة" : "Overview" },
      { value: "members", icon: Users, label: isAr ? "أعضاء" : "Members" },
      { value: "revenue", icon: DollarSign, label: isAr ? "الإيرادات" : "Revenue" },
      { value: "benefits", icon: Star, label: isAr ? "مميزات" : "Benefits" },
    ],
  },
  {
    label: isAr ? "المالية" : "Finance",
    tabs: [
      { value: "wallet", icon: Wallet, label: isAr ? "المحفظة" : "Wallet" },
      { value: "invoices", icon: Receipt, label: isAr ? "الفواتير" : "Invoices" },
    ],
  },
  {
    label: isAr ? "العمليات" : "Operations",
    tabs: [
      { value: "bulk", icon: Zap, label: isAr ? "جماعية" : "Bulk" },
      { value: "features", icon: Shield, label: isAr ? "التحكم" : "Features" },
      { value: "overrides", icon: UserCog, label: isAr ? "تجاوزات" : "Overrides" },
      { value: "notifications", icon: Bell, label: isAr ? "إشعارات" : "Alerts" },
    ],
  },
  {
    label: isAr ? "التحليلات" : "Analytics",
    tabs: [
      { value: "analytics", icon: TrendingUp, label: isAr ? "تحليلات" : "Analytics" },
      { value: "dashboard", icon: PieChart, label: isAr ? "لوحة" : "Dashboard" },
      { value: "retention", icon: ShieldAlert, label: isAr ? "الاحتفاظ" : "Retention" },
      { value: "referrals", icon: Share2, label: isAr ? "إحالات" : "Referrals" },
    ],
  },
  {
    label: isAr ? "السجلات" : "Records",
    tabs: [
      { value: "cancellations", icon: UserX, label: isAr ? "إلغاء" : "Cancel" },
      { value: "history", icon: History, label: isAr ? "سجل" : "History" },
      { value: "timeline", icon: GitBranch, label: isAr ? "الزمني" : "Timeline" },
      { value: "digest", icon: FileText, label: isAr ? "ملخص" : "Digest" },
      { value: "policy", icon: Settings2, label: isAr ? "سياسات" : "Policy" },
    ],
  },
];

export default function MembershipManagement() {
  const isAr = useIsAr();
  const [activeTab, setActiveTab] = useState("overview");
  const groups = tabGroups(isAr);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{isAr ? "إدارة العضويات" : "Memberships"}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isAr ? "مستويات العضوية والاشتراكات والفواتير والمحافظ" : "Tiers, subscriptions, billing, wallets & lifecycle"}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* Grouped Tab Navigation */}
        <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
          <div className="flex items-center gap-1 w-max">
            {groups.map((group, gi) => (
              <div key={group.label} className="flex items-center">
                {gi > 0 && <div className="h-5 w-px bg-border/50 mx-1.5 shrink-0" />}
                {group.tabs.map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-all whitespace-nowrap",
                      activeTab === tab.value
                        ? "bg-foreground text-background font-medium shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <tab.icon className="h-3 w-3 shrink-0" />
                    {tab.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        <TabsContent value="overview"><Suspense fallback={<TabFallback />}><MembershipOverview /></Suspense></TabsContent>
        <TabsContent value="members"><Suspense fallback={<TabFallback />}><MembershipMembersTab /></Suspense></TabsContent>
        <TabsContent value="bulk"><Suspense fallback={<TabFallback />}><MembershipBulkOperationsTab /></Suspense></TabsContent>
        <TabsContent value="revenue"><Suspense fallback={<TabFallback />}><MembershipRevenueTab /></Suspense></TabsContent>
        <TabsContent value="benefits"><Suspense fallback={<TabFallback />}><MembershipBenefitsTab /></Suspense></TabsContent>
        <TabsContent value="features"><Suspense fallback={<TabFallback />}><MembershipFeatureControl /></Suspense></TabsContent>
        <TabsContent value="overrides"><Suspense fallback={<TabFallback />}><MembershipUserOverrides /></Suspense></TabsContent>
        <TabsContent value="wallet"><Suspense fallback={<TabFallback />}><MembershipWalletTab /></Suspense></TabsContent>
        <TabsContent value="invoices"><Suspense fallback={<TabFallback />}><MembershipInvoicesTab /></Suspense></TabsContent>
        <TabsContent value="notifications"><Suspense fallback={<TabFallback />}><MembershipNotificationsTab /></Suspense></TabsContent>
        <TabsContent value="cancellations"><Suspense fallback={<TabFallback />}><MembershipCancellationsTab /></Suspense></TabsContent>
        <TabsContent value="history"><Suspense fallback={<TabFallback />}><MembershipHistoryTab /></Suspense></TabsContent>
        <TabsContent value="analytics"><Suspense fallback={<TabFallback />}><MembershipFeatureAnalytics /></Suspense></TabsContent>
        <TabsContent value="dashboard"><Suspense fallback={<TabFallback />}><MembershipAnalyticsDashboard /></Suspense></TabsContent>
        <TabsContent value="referrals"><Suspense fallback={<TabFallback />}><MembershipReferralsTab /></Suspense></TabsContent>
        <TabsContent value="retention"><Suspense fallback={<TabFallback />}><MembershipChurnRetention /></Suspense></TabsContent>
        <TabsContent value="digest"><Suspense fallback={<TabFallback />}><MembershipDigestPanel /></Suspense></TabsContent>
        <TabsContent value="timeline"><Suspense fallback={<TabFallback />}><MembershipLifecycleTimeline /></Suspense></TabsContent>
        <TabsContent value="policy"><Suspense fallback={<TabFallback />}><MembershipPolicySettings /></Suspense></TabsContent>
      </Tabs>
    </div>
  );
}
