import { useState, useEffect, lazy, Suspense } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageShell } from "@/components/PageShell";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { User, Edit, Shield, Crown, BarChart3, Wallet, FileText, Gift, Trophy, ShoppingBag, ExternalLink, Link2, Heart, Users, Award, Sparkles, Lock } from "lucide-react";
import { useSearchParams, Link } from "react-router-dom";
import { useProfileData } from "@/hooks/useProfileData";
import { useAccountType } from "@/hooks/useAccountType";
import { useUserFeatures } from "@/hooks/useMembershipFeatures";
import { UpgradePrompt } from "@/components/membership/UpgradePrompt";

// Lazy-load heavy tabs for faster initial paint
const ProfileOverviewTab = lazy(() => import("@/components/profile/ProfileOverviewTab").then(m => ({ default: m.ProfileOverviewTab })));
const ProfileEditForm = lazy(() => import("@/components/profile/ProfileEditForm").then(m => ({ default: m.ProfileEditForm })));
const ProfilePrivacySettings = lazy(() => import("@/components/profile/ProfilePrivacySettings").then(m => ({ default: m.ProfilePrivacySettings })));
const UnifiedMembershipTab = lazy(() => import("@/components/membership/UnifiedMembershipTab").then(m => ({ default: m.UnifiedMembershipTab })));
const ProfileAnalyticsDashboard = lazy(() => import("@/components/profile/ProfileAnalyticsDashboard").then(m => ({ default: m.ProfileAnalyticsDashboard })));
const WalletDashboard = lazy(() => Promise.resolve({ default: (_props: any) => null as any }));
const ProfileInvoicesTab = lazy(() => import("@/components/profile/ProfileInvoicesTab").then(m => ({ default: m.ProfileInvoicesTab })));
const ProfileReferralsTab = lazy(() => import("@/components/profile/ProfileReferralsTab").then(m => ({ default: m.ProfileReferralsTab })));
const CompetitionHistory = lazy(() => import("@/components/profile/CompetitionHistory").then(m => ({ default: m.CompetitionHistory })));
const ProfileOrdersTab = lazy(() => import("@/components/profile/ProfileOrdersTab").then(m => ({ default: m.ProfileOrdersTab })));
const FanFavoritesTab = lazy(() => import("@/components/fan/FanFavoritesTab").then(m => ({ default: m.FanFavoritesTab })));


import { ProfileHeader } from "@/components/profile/ProfileHeader";

function TabFallback() {
  return <PageSkeleton variant="list" count={4} className="mt-6" />;
}

// Map tab IDs to feature codes
const TAB_FEATURE_MAP: Record<string, string> = {
  competitions: "tab_competitions",
  membership: "tab_membership",
  wallet: "tab_wallet",
  orders: "tab_orders",
  referrals: "tab_referrals",
  invoices: "tab_invoices",
  analytics: "tab_analytics",
  "social-links": "tab_social_links",
  favorites: "tab_favorites",
};

export default function Profile() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);
  const { user, profile, roles, isLoading, refetchProfile } = useProfileData();
  const { isFan } = useAccountType();
  const { data: enabledFeatures, isLoading: featuresLoading } = useUserFeatures();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  if (isLoading) {
    return (
      <PageShell title={isAr ? "ملفي الشخصي" : "My Profile"} seoProps={{ noIndex: true }}>
        <PageSkeleton variant="detail" />
      </PageShell>
    );
  }

  // Helper to check if a tab is allowed by membership
  const isTabAllowed = (tabId: string): boolean => {
    const featureCode = TAB_FEATURE_MAP[tabId];
    if (!featureCode) return true;
    if (featuresLoading || !enabledFeatures) return true;
    return enabledFeatures.has(featureCode);
  };

  const allTabs = [
    { id: "overview", label: isAr ? "ملفي الشخصي" : "Profile", icon: User },
    ...(isFan ? [
      { id: "favorites", label: isAr ? "المفضلة" : "Favorites", icon: Heart },
    ] : [
      { id: "competitions", label: isAr ? "المسابقات" : "Competitions", icon: Trophy },
    ]),
    { id: "membership", label: isAr ? "العضوية" : "Membership", icon: Crown },
    { id: "wallet", label: isAr ? "المحفظة" : "Wallet", icon: Wallet },
    { id: "orders", label: isAr ? "الطلبات" : "Orders", icon: ShoppingBag },
    { id: "referrals", label: isAr ? "الإحالات" : "Referrals", icon: Gift },
    ...(!isFan ? [
      { id: "invoices", label: isAr ? "الفواتير" : "Invoices", icon: FileText },
      { id: "analytics", label: isAr ? "الإحصائيات" : "Analytics", icon: BarChart3 },
      { id: "social-links", label: isAr ? "صفحة الروابط" : "Social Links", icon: Link2, href: "/social-links" },
    ] : []),
    { id: "edit", label: isAr ? "تعديل" : "Edit", icon: Edit },
    { id: "privacy", label: isAr ? "الخصوصية" : "Privacy", icon: Shield },
  ];

  const tabs = allTabs;

  return (
    <PageShell
      title={isAr ? "ملفي الشخصي" : "My Profile"}
      description={isAr
        ? `الملف الشخصي لـ ${profile?.display_name_ar || profile?.full_name_ar || profile?.full_name || "المستخدم"} على الطهاة`
        : `${profile?.display_name || profile?.full_name || "User"}'s professional culinary profile on Altoha`
      }
      seoProps={{
        ogImage: profile?.avatar_url,
        lang: language,
        keywords: isAr ? "طاهي, ملف شخصي, الطهاة" : "chef, profile, culinary, altoha",
        jsonLd: profile ? {
          "@context": "https://schema.org",
          "@type": "Person",
          name: profile.display_name || profile.full_name,
          jobTitle: profile.job_title || profile.specialization,
          image: profile.avatar_url,
          url: `${window.location.origin}/u/${profile.username}`,
        } : undefined,
        noIndex: true,
      }}
    >
      {profile && user && (
        <ProfileHeader profile={profile} roles={roles} userId={user.id} onProfileUpdate={refetchProfile} />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        {/* Tab Navigation */}
        <div className="sticky top-12 z-30 -mx-4 border-y border-border/20 bg-background/90 px-3 py-2 backdrop-blur-xl md:rounded-2xl md:border md:border-border/30 md:mx-0 md:px-3 md:bg-card/60 shadow-sm">
          <TabsList className="h-auto w-full justify-start gap-0.5 overflow-x-auto bg-transparent p-0 scrollbar-none snap-x snap-mandatory" dir={isAr ? "rtl" : "ltr"}>
            {tabs.map((tab) => {
              const locked = !isTabAllowed(tab.id);
              if ((tab as any).href) {
                return (
                  <Link
                    key={tab.id}
                    to={(tab as any).href}
                    className="group relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold transition-all duration-200 snap-start min-w-max hover:bg-muted/50 text-muted-foreground"
                  >
                    <tab.icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{tab.label}</span>
                    <ExternalLink className="h-2.5 w-2.5 opacity-40" />
                  </Link>
                );
              }
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={`group relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold transition-all duration-200 snap-start min-w-max data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/15 hover:bg-muted/50 active:scale-95 ${locked ? "opacity-50" : ""}`}
                >
                  <tab.icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{tab.label}</span>
                  {locked && <Lock className="h-2.5 w-2.5 text-muted-foreground/60" />}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <Suspense fallback={<TabFallback />}>
          <TabsContent value="overview" className="mt-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            {profile && user && <ProfileOverviewTab profile={profile} userId={user.id} />}
          </TabsContent>

          <TabsContent value="competitions" className="mt-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            {isTabAllowed("competitions") ? (user && <CompetitionHistory userId={user.id} />) : <UpgradePrompt variant="card" featureName="Competitions" featureNameAr="المسابقات" />}
          </TabsContent>

          <TabsContent value="favorites" className="mt-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            {isTabAllowed("favorites") ? (user && <FanFavoritesTab />) : <UpgradePrompt variant="card" featureName="Favorites" featureNameAr="المفضلة" />}
          </TabsContent>


          <TabsContent value="membership" className="mt-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            {profile && user && <UnifiedMembershipTab profile={profile} userId={user.id} onMembershipChange={refetchProfile} />}
          </TabsContent>

          <TabsContent value="wallet" className="mt-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            {isTabAllowed("wallet") ? (user && <WalletDashboard userId={user.id} />) : <UpgradePrompt variant="card" featureName="Wallet" featureNameAr="المحفظة" />}
          </TabsContent>

          <TabsContent value="orders" className="mt-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            {isTabAllowed("orders") ? (user && <ProfileOrdersTab userId={user.id} isAr={isAr} />) : <UpgradePrompt variant="card" featureName="Orders" featureNameAr="الطلبات" />}
          </TabsContent>

          <TabsContent value="referrals" className="mt-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            {isTabAllowed("referrals") ? (user && <ProfileReferralsTab userId={user.id} />) : <UpgradePrompt variant="card" featureName="Referrals" featureNameAr="الإحالات" />}
          </TabsContent>

          <TabsContent value="analytics" className="mt-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            {isTabAllowed("analytics") ? (user && (
              <div className="space-y-6">
                <ProfileAnalyticsDashboard userId={user.id} />
              </div>
            )) : <UpgradePrompt variant="card" featureName="Analytics" featureNameAr="الإحصائيات" />}
          </TabsContent>

          <TabsContent value="invoices" className="mt-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            {isTabAllowed("invoices") ? (user && <ProfileInvoicesTab userId={user.id} />) : <UpgradePrompt variant="card" featureName="Invoices" featureNameAr="الفواتير" />}
          </TabsContent>

          <TabsContent value="edit" className="mt-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            {profile && user && <ProfileEditForm profile={profile} userId={user.id} onSaved={refetchProfile} />}
          </TabsContent>

          <TabsContent value="privacy" className="mt-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            {profile && user && <ProfilePrivacySettings profile={profile} userId={user.id} onSaved={refetchProfile} />}
          </TabsContent>
        </Suspense>
      </Tabs>
    </PageShell>
  );
}
