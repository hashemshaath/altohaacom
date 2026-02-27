import { useLanguage } from "@/i18n/LanguageContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, BarChart3, Users, Star, UserX, History, TrendingUp, PieChart, Share2, ShieldAlert, FileText } from "lucide-react";
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
export default function MembershipManagement() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="space-y-4 sm:space-y-6">
      <AdminPageHeader
        icon={CreditCard}
        title={isAr ? "إدارة العضويات" : "Memberships"}
        description={isAr ? "إدارة مستويات العضوية والاشتراكات" : "Tiers, subscriptions & renewals"}
      />

      <Tabs defaultValue="overview" className="space-y-3 sm:space-y-4">
        <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
          <TabsList className="h-8 sm:h-9 gap-0.5 sm:gap-1 w-max">
            <TabsTrigger value="overview" className="gap-1 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              {isAr ? "عامة" : "Overview"}
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-1 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              {isAr ? "أعضاء" : "Members"}
            </TabsTrigger>
            <TabsTrigger value="benefits" className="gap-1 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3">
              <Star className="h-3 w-3 sm:h-4 sm:w-4" />
              {isAr ? "مميزات" : "Benefits"}
            </TabsTrigger>
            <TabsTrigger value="cancellations" className="gap-1 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3">
              <UserX className="h-3 w-3 sm:h-4 sm:w-4" />
              {isAr ? "إلغاء" : "Cancel"}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3">
              <History className="h-3 w-3 sm:h-4 sm:w-4" />
              {isAr ? "سجل" : "History"}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              {isAr ? "تحليلات" : "Analytics"}
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-1 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3">
              <PieChart className="h-3 w-3 sm:h-4 sm:w-4" />
              {isAr ? "لوحة التحكم" : "Dashboard"}
            </TabsTrigger>
            <TabsTrigger value="referrals" className="gap-1 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3">
              <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
              {isAr ? "الإحالات" : "Referrals"}
            </TabsTrigger>
            <TabsTrigger value="churn" className="gap-1 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3">
              <ShieldAlert className="h-3 w-3 sm:h-4 sm:w-4" />
              {isAr ? "التسرب" : "Churn"}
            </TabsTrigger>
            <TabsTrigger value="digest" className="gap-1 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              {isAr ? "الملخص" : "Digest"}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview"><MembershipOverview /></TabsContent>
        <TabsContent value="members"><MembershipMembersTab /></TabsContent>
        <TabsContent value="benefits"><MembershipBenefitsTab /></TabsContent>
        <TabsContent value="cancellations"><MembershipCancellationsTab /></TabsContent>
        <TabsContent value="history"><MembershipHistoryTab /></TabsContent>
        <TabsContent value="analytics"><MembershipFeatureAnalytics /></TabsContent>
        <TabsContent value="dashboard"><MembershipAnalyticsDashboard /></TabsContent>
        <TabsContent value="referrals"><MembershipReferralsTab /></TabsContent>
        <TabsContent value="churn"><MembershipChurnRetention /></TabsContent>
        <TabsContent value="digest"><MembershipDigestPanel /></TabsContent>
      </Tabs>
    </div>
  );
}
