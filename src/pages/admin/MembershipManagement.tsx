import { lazy, Suspense } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard, BarChart3, Users, Star, UserX, History, TrendingUp,
  PieChart, Share2, ShieldAlert, FileText, Settings2, GitBranch,
  Wallet, Receipt, Bell, Shield, UserCog, Zap, DollarSign,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy-load all tab components for performance
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
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function MembershipManagement() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const tabs = [
    { value: "overview", icon: BarChart3, label: isAr ? "عامة" : "Overview" },
    { value: "members", icon: Users, label: isAr ? "أعضاء" : "Members" },
    { value: "bulk", icon: Zap, label: isAr ? "عمليات جماعية" : "Bulk Ops" },
    { value: "revenue", icon: DollarSign, label: isAr ? "الإيرادات" : "Revenue" },
    { value: "benefits", icon: Star, label: isAr ? "مميزات" : "Benefits" },
    { value: "features", icon: Shield, label: isAr ? "التحكم" : "Features" },
    { value: "overrides", icon: UserCog, label: isAr ? "تجاوزات" : "Overrides" },
    { value: "wallet", icon: Wallet, label: isAr ? "المحفظة" : "Wallet" },
    { value: "invoices", icon: Receipt, label: isAr ? "الفواتير" : "Invoices" },
    { value: "notifications", icon: Bell, label: isAr ? "إشعارات" : "Alerts" },
    { value: "cancellations", icon: UserX, label: isAr ? "إلغاء" : "Cancel" },
    { value: "history", icon: History, label: isAr ? "سجل" : "History" },
    { value: "analytics", icon: TrendingUp, label: isAr ? "تحليلات" : "Analytics" },
    { value: "dashboard", icon: PieChart, label: isAr ? "لوحة" : "Dashboard" },
    { value: "referrals", icon: Share2, label: isAr ? "إحالات" : "Referrals" },
    { value: "retention", icon: ShieldAlert, label: isAr ? "الاحتفاظ" : "Retention" },
    { value: "digest", icon: FileText, label: isAr ? "ملخص" : "Digest" },
    { value: "timeline", icon: GitBranch, label: isAr ? "الزمني" : "Timeline" },
    { value: "policy", icon: Settings2, label: isAr ? "سياسات" : "Policy" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <AdminPageHeader
        icon={CreditCard}
        title={isAr ? "إدارة العضويات" : "Memberships"}
        description={isAr ? "إدارة مستويات العضوية والاشتراكات والفواتير والمحافظ" : "Tiers, subscriptions, billing, wallets & lifecycle"}
      />

      <Tabs defaultValue="overview" className="space-y-3 sm:space-y-4">
        <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
          <TabsList className="h-8 sm:h-9 gap-0.5 sm:gap-1 w-max rounded-2xl border border-border/40 bg-muted/30 backdrop-blur p-1 sm:p-1.5">
            {tabs.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="gap-1 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3 rounded-xl data-[state=active]:shadow-sm"
              >
                <tab.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
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
