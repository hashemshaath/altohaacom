import { useLanguage } from "@/i18n/LanguageContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, BarChart3, Users, Star, UserX, History } from "lucide-react";
import MembershipOverview from "@/components/admin/membership/MembershipOverview";
import MembershipMembersTab from "@/components/admin/membership/MembershipMembersTab";
import MembershipBenefitsTab from "@/components/admin/membership/MembershipBenefitsTab";
import MembershipCancellationsTab from "@/components/admin/membership/MembershipCancellationsTab";
import MembershipHistoryTab from "@/components/admin/membership/MembershipHistoryTab";

export default function MembershipManagement() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={CreditCard}
        title={isAr ? "إدارة العضويات" : "Membership Management"}
        description={isAr ? "إدارة شاملة لمستويات العضوية والاشتراكات والتجديدات" : "Comprehensive membership tiers, subscriptions, and renewals management"}
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            {isAr ? "نظرة عامة" : "Overview"}
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5">
            <Users className="h-4 w-4" />
            {isAr ? "الأعضاء" : "Members"}
          </TabsTrigger>
          <TabsTrigger value="benefits" className="gap-1.5">
            <Star className="h-4 w-4" />
            {isAr ? "المميزات" : "Benefits"}
          </TabsTrigger>
          <TabsTrigger value="cancellations" className="gap-1.5">
            <UserX className="h-4 w-4" />
            {isAr ? "الإلغاءات" : "Cancellations"}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-4 w-4" />
            {isAr ? "السجل" : "History"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><MembershipOverview /></TabsContent>
        <TabsContent value="members"><MembershipMembersTab /></TabsContent>
        <TabsContent value="benefits"><MembershipBenefitsTab /></TabsContent>
        <TabsContent value="cancellations"><MembershipCancellationsTab /></TabsContent>
        <TabsContent value="history"><MembershipHistoryTab /></TabsContent>
      </Tabs>
    </div>
  );
}
