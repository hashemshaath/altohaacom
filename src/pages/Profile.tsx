import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { User, Edit, Shield, Crown, BarChart3, Wallet, FileText, Gift, Trophy, ShoppingBag, ExternalLink, Link2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileOverviewTab } from "@/components/profile/ProfileOverviewTab";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { ProfilePrivacySettings } from "@/components/profile/ProfilePrivacySettings";
import { UnifiedMembershipTab } from "@/components/membership/UnifiedMembershipTab";
import { ProfileAnalyticsDashboard } from "@/components/profile/ProfileAnalyticsDashboard";
import { WalletDashboard } from "@/components/wallet/WalletDashboard";
import { ProfileInvoicesTab } from "@/components/profile/ProfileInvoicesTab";
import { useSearchParams, Link } from "react-router-dom";
import { ProfileReferralsTab } from "@/components/profile/ProfileReferralsTab";
import { CompetitionHistory } from "@/components/profile/CompetitionHistory";

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
    { id: "overview", label: isAr ? "ملفي الشخصي" : "Profile", icon: User, description: isAr ? "ملخص عام" : "Your summary" },
    { id: "competitions", label: isAr ? "المسابقات" : "Competitions", icon: Trophy, description: isAr ? "سجل المسابقات" : "Competition history" },
    { id: "membership", label: isAr ? "العضوية" : "Membership", icon: Crown, description: isAr ? "خطتك الحالية" : "Your plan" },
    { id: "wallet", label: isAr ? "المحفظة" : "Wallet", icon: Wallet, description: isAr ? "الرصيد والنقاط" : "Balance & points" },
    { id: "orders", label: isAr ? "الطلبات" : "Orders", icon: ShoppingBag, description: isAr ? "طلبات المتجر" : "Shop orders" },
    { id: "referrals", label: isAr ? "الإحالات" : "Referrals", icon: Gift, description: isAr ? "دعوة الأصدقاء" : "Invite friends" },
    { id: "invoices", label: isAr ? "الفواتير" : "Invoices", icon: FileText, description: isAr ? "سجل الدفعات" : "Payment history" },
    { id: "analytics", label: isAr ? "الإحصائيات" : "Analytics", icon: BarChart3, description: isAr ? "أداء الملف" : "Profile insights" },
    { id: "social-links", label: isAr ? "صفحة الروابط" : "Social Links", icon: Link2, description: isAr ? "إدارة روابطك" : "Manage your links", href: "/social-links" },
    { id: "edit", label: isAr ? "تعديل" : "Edit", icon: Edit, description: isAr ? "تحديث البيانات" : "Update info" },
    { id: "privacy", label: isAr ? "الخصوصية" : "Privacy", icon: Shield, description: isAr ? "إعدادات الأمان" : "Security settings" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead title="Profile" description="Your Altoha profile" />
      <Header />
       <main className="container flex-1 py-4 md:py-6">
        <div className="relative group">
          {profile && user && (
            <ProfileHeader profile={profile} roles={roles} userId={user.id} onProfileUpdate={fetchProfile} />
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <div className="sticky top-12 z-30 -mx-4 border-y border-border/30 bg-background/90 px-4 py-2 backdrop-blur-xl md:rounded-2xl md:border md:mx-0 md:px-4 shadow-sm">
            <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-transparent p-0 no-scrollbar snap-x snap-mandatory">
              {tabs.map((tab) => {
                const TabTag = (tab as any).href ? "a" : TabsTrigger;
                if ((tab as any).href) {
                  return (
                    <Link
                      key={tab.id}
                      to={(tab as any).href}
                      className="group relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 snap-start min-w-max hover:bg-muted/60 text-muted-foreground"
                    >
                      <tab.icon className="h-3.5 w-3.5 shrink-0" />
                      <span>{tab.label}</span>
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </Link>
                  );
                }
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="group relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 snap-start min-w-max data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/60"
                  >
                    <tab.icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>


          <TabsContent value="overview" className="mt-6">
            {profile && user && <ProfileOverviewTab profile={profile} userId={user.id} />}
          </TabsContent>

          <TabsContent value="competitions" className="mt-6">
            {user && <CompetitionHistory userId={user.id} />}
          </TabsContent>

          <TabsContent value="membership" className="mt-6">
            {profile && user && (
              <UnifiedMembershipTab profile={profile} userId={user.id} onMembershipChange={fetchProfile} />
            )}
          </TabsContent>

          <TabsContent value="wallet" className="mt-6">
            {user && <WalletDashboard userId={user.id} />}
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            {user && <ProfileOrdersTab userId={user.id} isAr={isAr} />}
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


// ── Inline Orders Tab ─────────────────────────────────────────────────────────
function ProfileOrdersTab({ userId, isAr }: { userId: string; isAr: boolean }) {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["profile-shop-orders", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("shop_orders")
        .select("id, order_number, total_amount, currency, status, created_at")
        .eq("buyer_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });

  const statusColors: Record<string, string> = {
    pending: "bg-chart-4/15 text-chart-4",
    processing: "bg-primary/15 text-primary",
    shipped: "bg-chart-3/15 text-chart-3",
    delivered: "bg-chart-5/15 text-chart-5",
    cancelled: "bg-destructive/15 text-destructive",
    refunded: "bg-muted text-muted-foreground",
  };

  if (isLoading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
    </div>
  );

  if (!orders.length) return (
    <Card>
      <CardContent className="flex flex-col items-center py-12 text-center gap-3">
        <ShoppingBag className="h-10 w-10 text-muted-foreground/30" />
        <p className="font-medium text-muted-foreground">{isAr ? "لا توجد طلبات بعد" : "No orders yet"}</p>
        <Link to="/shop">
          <Button size="sm">{isAr ? "تسوق الآن" : "Shop Now"}</Button>
        </Link>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{isAr ? `${orders.length} طلبات` : `${orders.length} Orders`}</h3>
        <Link to="/shop/orders">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <ExternalLink className="h-3 w-3" />
            {isAr ? "عرض الكل" : "View All"}
          </Button>
        </Link>
      </div>
      {orders.map((order: any) => (
        <Card key={order.id} className="border-border/50 hover:shadow-sm transition-shadow">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <ShoppingBag className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" dir="ltr">{order.order_number || order.id.slice(0,8).toUpperCase()}</p>
              <p className="text-xs text-muted-foreground">
                {order.created_at ? format(new Date(order.created_at), "dd MMM yyyy") : "—"}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className={`text-[10px] h-5 capitalize ${statusColors[order.status] || "bg-muted text-muted-foreground"}`}>
                {isAr
                  ? ({ pending: "قيد الانتظار", processing: "قيد المعالجة", shipped: "مشحون", delivered: "تم التسليم", cancelled: "ملغي", refunded: "مسترد" } as Record<string,string>)[order.status] || order.status
                  : order.status}
              </Badge>
              <p className="text-sm font-bold text-primary">
                {(order.total_amount || 0).toLocaleString()} <span className="text-xs text-muted-foreground">{order.currency || "SAR"}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
