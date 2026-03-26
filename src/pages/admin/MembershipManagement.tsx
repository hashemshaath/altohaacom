import { useLanguage } from "@/i18n/LanguageContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard, BarChart3, Users, Star, UserX, History, TrendingUp,
  PieChart, Share2, ShieldAlert, FileText, Settings2, GitBranch,
  Wallet, Receipt, Bell, Shield, UserCog,
} from "lucide-react";
import MembershipOverview from "@/components/admin/membership/MembershipOverview";
import MembershipMembersTab from "@/components/admin/membership/MembershipMembersTab";
import MembershipBenefitsTab from "@/components/admin/membership/MembershipBenefitsTab";
import MembershipCancellationsTab from "@/components/admin/membership/MembershipCancellationsTab";
import MembershipHistoryTab from "@/components/admin/membership/MembershipHistoryTab";
import MembershipFeatureAnalytics from "@/components/admin/membership/MembershipFeatureAnalytics";
import MembershipAnalyticsDashboard from "@/components/admin/membership/MembershipAnalyticsDashboard";
import MembershipReferralsTab from "@/components/admin/membership/MembershipReferralsTab";
import MembershipChurnRetention from "@/components/admin/membership/MembershipChurnRetention";
import MembershipDigestPanel from "@/components/admin/membership/MembershipDigestPanel";
import MembershipPolicySettings from "@/components/admin/membership/MembershipPolicySettings";
import MembershipLifecycleTimeline from "@/components/admin/membership/MembershipLifecycleTimeline";
import MembershipFeatureControl from "@/components/admin/membership/MembershipFeatureControl";
import MembershipUserOverrides from "@/components/admin/membership/MembershipUserOverrides";
import MembershipWalletTab from "@/components/admin/membership/MembershipWalletTab";
import MembershipInvoicesTab from "@/components/admin/membership/MembershipInvoicesTab";
import MembershipNotificationsTab from "@/components/admin/membership/MembershipNotificationsTab";

export default function MembershipManagement() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const tabs = [
    { value: "overview", icon: BarChart3, label: isAr ? "عامة" : "Overview" },
    { value: "members", icon: Users, label: isAr ? "أعضاء" : "Members" },
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
    { value: "churn", icon: ShieldAlert, label: isAr ? "التسرب" : "Churn" },
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

        <TabsContent value="overview"><MembershipOverview /></TabsContent>
        <TabsContent value="members"><MembershipMembersTab /></TabsContent>
        <TabsContent value="benefits"><MembershipBenefitsTab /></TabsContent>
        <TabsContent value="features"><MembershipFeatureControl /></TabsContent>
        <TabsContent value="overrides"><MembershipUserOverrides /></TabsContent>
        <TabsContent value="wallet"><MembershipWalletTab /></TabsContent>
        <TabsContent value="invoices"><MembershipInvoicesTab /></TabsContent>
        <TabsContent value="notifications"><MembershipNotificationsTab /></TabsContent>
        <TabsContent value="cancellations"><MembershipCancellationsTab /></TabsContent>
        <TabsContent value="history"><MembershipHistoryTab /></TabsContent>
        <TabsContent value="analytics"><MembershipFeatureAnalytics /></TabsContent>
        <TabsContent value="dashboard"><MembershipAnalyticsDashboard /></TabsContent>
        <TabsContent value="referrals"><MembershipReferralsTab /></TabsContent>
        <TabsContent value="churn"><MembershipChurnRetention /></TabsContent>
        <TabsContent value="digest"><MembershipDigestPanel /></TabsContent>
        <TabsContent value="timeline"><MembershipLifecycleTimeline /></TabsContent>
        <TabsContent value="policy"><MembershipPolicySettings /></TabsContent>
      </Tabs>
    </div>
  );
}
