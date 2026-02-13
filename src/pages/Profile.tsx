import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead } from "@/components/SEOHead";
import { User, Briefcase, Award, Edit, Shield, Crown, BarChart3, Wallet, FileText } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileOverviewTab } from "@/components/profile/ProfileOverviewTab";
import { ProfileCareerTab } from "@/components/profile/ProfileCareerTab";
import { ProfileCertificates } from "@/components/profile/ProfileCertificates";
import { CompetitionHistory } from "@/components/profile/CompetitionHistory";
import { UserBadgesDisplay } from "@/components/badges/UserBadgesDisplay";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { ProfilePrivacySettings } from "@/components/profile/ProfilePrivacySettings";
import { UnifiedMembershipTab } from "@/components/membership/UnifiedMembershipTab";
import { ProfileAnalyticsDashboard } from "@/components/profile/ProfileAnalyticsDashboard";
import { WalletDashboard } from "@/components/wallet/WalletDashboard";
import { ProfileInvoicesTab } from "@/components/profile/ProfileInvoicesTab";
import { useSearchParams } from "react-router-dom";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];

export default function Profile() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);

  const fetchProfile = async () => {
    if (!user) return;
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);
    if (profileRes.data) setProfile(profileRes.data);
    if (rolesRes.data) setRoles(rolesRes.data.map((r) => r.role));
    setLoading(false);
  };

  useEffect(() => { fetchProfile(); }, [user]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SEOHead title="Profile" description="Your Altohaa profile" />
        <Header />
        <main className="container flex-1 py-6 md:py-8 max-w-5xl">
          <Skeleton className="h-44 w-full rounded-2xl mb-6" />
          <Skeleton className="h-10 w-80 mb-6" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </main>
        <Footer />
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: isAr ? "نظرة عامة" : "Overview", icon: User },
    { id: "career", label: isAr ? "السيرة المهنية" : "Career", icon: Briefcase },
    { id: "achievements", label: isAr ? "الإنجازات" : "Achievements", icon: Award },
    { id: "membership", label: isAr ? "العضوية" : "Membership", icon: Crown },
    { id: "wallet", label: isAr ? "المحفظة" : "Wallet", icon: Wallet },
    { id: "invoices", label: isAr ? "الفواتير" : "Invoices", icon: FileText },
    { id: "analytics", label: isAr ? "الإحصائيات" : "Analytics", icon: BarChart3 },
    { id: "edit", label: isAr ? "تعديل" : "Edit", icon: Edit },
    { id: "privacy", label: isAr ? "الخصوصية" : "Privacy", icon: Shield },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background" dir={isAr ? "rtl" : "ltr"}>
      <SEOHead title="Profile" description="Your Altohaa profile" />
      <Header />
      <main className="container flex-1 py-6 md:py-8 max-w-5xl">
        {profile && user && (
          <ProfileHeader profile={profile} roles={roles} userId={user.id} onProfileUpdate={fetchProfile} />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="w-full justify-start gap-1 bg-muted/50 p-1 rounded-xl h-auto flex-wrap">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg px-3 py-2"
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            {profile && user && <ProfileOverviewTab profile={profile} userId={user.id} />}
          </TabsContent>

          <TabsContent value="career" className="mt-6">
            {user && <ProfileCareerTab userId={user.id} />}
          </TabsContent>

          <TabsContent value="achievements" className="mt-6 space-y-6">
            {user && <ProfileCertificates userId={user.id} isOwner={true} />}
            {user && <CompetitionHistory userId={user.id} />}
            {user && <UserBadgesDisplay userId={user.id} />}
          </TabsContent>

          <TabsContent value="membership" className="mt-6">
            {profile && user && (
              <UnifiedMembershipTab profile={profile} userId={user.id} onMembershipChange={fetchProfile} />
            )}
          </TabsContent>

          <TabsContent value="wallet" className="mt-6">
            {user && <WalletDashboard userId={user.id} />}
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            {user && <ProfileAnalyticsDashboard userId={user.id} />}
          </TabsContent>

          <TabsContent value="invoices" className="mt-6">
            {user && <ProfileInvoicesTab userId={user.id} />}
          </TabsContent>

          <TabsContent value="edit" className="mt-6">
            {profile && user && <ProfileEditForm profile={profile} userId={user.id} onSaved={fetchProfile} />}
          </TabsContent>

          <TabsContent value="privacy" className="mt-6">
            {profile && user && <ProfilePrivacySettings profile={profile} userId={user.id} onSaved={fetchProfile} />}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
