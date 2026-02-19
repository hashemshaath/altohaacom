import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
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

  useEffect(() => { fetchProfile(); }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SEOHead title="Profile" description="Your Altoha profile" />
        <Header />
        <main className="container flex-1 py-4 md:py-6">
          {/* Profile header skeleton */}
          <div className="rounded-2xl border bg-card p-6 mb-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            </div>
          </div>
          {/* Tab bar skeleton */}
          <Skeleton className="h-12 w-full rounded-xl mb-6" />
          {/* Content skeleton */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="pt-6"><Skeleton className="h-5 w-24 mb-2" /><Skeleton className="h-8 w-32" /></CardContent></Card>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: isAr ? "مساحتي" : "My Space", icon: User, description: isAr ? "ملخص عام" : "Your summary" },
    { id: "membership", label: isAr ? "العضوية" : "Membership", icon: Crown, description: isAr ? "خطتك الحالية" : "Your plan" },
    { id: "wallet", label: isAr ? "المحفظة" : "Wallet", icon: Wallet, description: isAr ? "الرصيد والنقاط" : "Balance & points" },
    { id: "referrals", label: isAr ? "الإحالات" : "Referrals", icon: Gift, description: isAr ? "دعوة الأصدقاء" : "Invite friends" },
    { id: "invoices", label: isAr ? "الفواتير" : "Invoices", icon: FileText, description: isAr ? "سجل الدفعات" : "Payment history" },
    { id: "analytics", label: isAr ? "الإحصائيات" : "Analytics", icon: BarChart3, description: isAr ? "أداء الملف" : "Profile insights" },
    { id: "edit", label: isAr ? "تعديل" : "Edit", icon: Edit, description: isAr ? "تحديث البيانات" : "Update info" },
    { id: "privacy", label: isAr ? "الخصوصية" : "Privacy", icon: Shield, description: isAr ? "إعدادات الأمان" : "Security settings" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background" dir={isAr ? "rtl" : "ltr"}>
      <SEOHead title="Profile" description="Your Altoha profile" />
      <Header />
       <main className="container flex-1 py-4 md:py-6">
        <div className="relative group">
          {profile && user && (
            <ProfileHeader profile={profile} roles={roles} userId={user.id} onProfileUpdate={fetchProfile} />
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <div className="sticky top-[56px] z-30 -mx-4 border-y border-border/30 bg-background/90 px-4 py-2 backdrop-blur-xl md:rounded-2xl md:border md:mx-0 md:px-4 shadow-sm">
            <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-transparent p-0 no-scrollbar snap-x snap-mandatory">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="group relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 snap-start min-w-max data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/60"
                >
                  <tab.icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{tab.label}</span>
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
