import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead } from "@/components/SEOHead";
import { User, Edit, Shield, Crown, BarChart3, Wallet, FileText, Gift } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileOverviewTab } from "@/components/profile/ProfileOverviewTab";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { ProfilePrivacySettings } from "@/components/profile/ProfilePrivacySettings";
import { UnifiedMembershipTab } from "@/components/membership/UnifiedMembershipTab";
import { ProfileAnalyticsDashboard } from "@/components/profile/ProfileAnalyticsDashboard";
import { WalletDashboard } from "@/components/wallet/WalletDashboard";
import { ProfileInvoicesTab } from "@/components/profile/ProfileInvoicesTab";
import { useSearchParams } from "react-router-dom";
import { ProfileReferralsTab } from "@/components/profile/ProfileReferralsTab";

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
        <main className="container flex-1 py-4 md:py-6">
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
    { id: "membership", label: isAr ? "العضوية" : "Membership", icon: Crown },
    { id: "wallet", label: isAr ? "المحفظة" : "Wallet", icon: Wallet },
    { id: "referrals", label: isAr ? "الإحالات" : "Referrals", icon: Gift },
    { id: "invoices", label: isAr ? "الفواتير" : "Invoices", icon: FileText },
    { id: "analytics", label: isAr ? "الإحصائيات" : "Analytics", icon: BarChart3 },
    { id: "edit", label: isAr ? "تعديل" : "Edit", icon: Edit },
    { id: "privacy", label: isAr ? "الخصوصية" : "Privacy", icon: Shield },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background" dir={isAr ? "rtl" : "ltr"}>
      <SEOHead title="Profile" description="Your Altohaa profile" />
      <Header />
       <main className="container flex-1 py-4 md:py-6">
        <div className="relative group">
          {profile && user && (
            <ProfileHeader profile={profile} roles={roles} userId={user.id} onProfileUpdate={fetchProfile} />
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-10">
          <div className="sticky top-[64px] z-30 -mx-4 border-y border-border/40 bg-background/80 px-4 py-3 backdrop-blur-md md:rounded-2xl md:border md:mx-0 md:px-6 shadow-sm">
            <TabsList className="h-auto w-full justify-start gap-1.5 overflow-x-auto bg-transparent p-0 no-scrollbar snap-x snap-mandatory">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="group relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 snap-start min-w-max data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 hover:bg-primary/5 hover:text-primary"
                >
                  <tab.icon className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110 group-data-[state=active]:scale-110" />
                  <span className="relative z-10">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>


          <TabsContent value="overview" className="mt-6">
            {profile && user && <ProfileOverviewTab profile={profile} userId={user.id} />}
          </TabsContent>


          <TabsContent value="membership" className="mt-6">
            {profile && user && (
              <UnifiedMembershipTab profile={profile} userId={user.id} onMembershipChange={fetchProfile} />
            )}
          </TabsContent>

          <TabsContent value="wallet" className="mt-6">
            {user && <WalletDashboard userId={user.id} />}
          </TabsContent>

          <TabsContent value="referrals" className="mt-6">
            {user && <ProfileReferralsTab userId={user.id} />}
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
