import { useLanguage } from "@/i18n/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Users, GraduationCap, Landmark, Newspaper, MessageSquare, ShoppingBag, Sparkles, Award, Star, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { UpcomingCompetitionsWidget } from "@/components/dashboard/UpcomingCompetitionsWidget";
import { RecentActivityWidget } from "@/components/dashboard/RecentActivityWidget";
import { ReferralWidget } from "@/components/dashboard/ReferralWidget";
import { QuickStatsWidget } from "@/components/dashboard/QuickStatsWidget";
import { MasterclassProgressWidget } from "@/components/dashboard/MasterclassProgressWidget";
import { NotificationsSummaryWidget } from "@/components/dashboard/NotificationsSummaryWidget";
import { UpcomingExhibitionsWidget } from "@/components/dashboard/UpcomingExhibitionsWidget";
import { EventsCalendarWidget } from "@/components/dashboard/EventsCalendarWidget";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { useAwardPoints } from "@/hooks/useAwardPoints";
import { useEffect, useRef } from "react";

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";

  const { data: profile } = useQuery({
    queryKey: ["dashboard-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Award daily login points once per session
  const awardPoints = useAwardPoints();
  const dailyLoginAwarded = useRef(false);
  useEffect(() => {
    if (user && !dailyLoginAwarded.current) {
      dailyLoginAwarded.current = true;
      awardPoints.mutate({ actionType: "daily_login", silent: true });
    }
  }, [user]);

  const firstName = profile?.full_name?.split(" ")[0] || "";
  const greeting = isAr
    ? `مرحباً${firstName ? ` ${firstName}` : ""}`
    : `Welcome back${firstName ? `, ${firstName}` : ""}`;

  const sections = [
    { icon: Trophy, title: t("competitionsTitle"), href: "/competitions", color: "text-primary", bg: "bg-primary/10" },
    { icon: Users, title: t("communityTitle"), href: "/community", color: "text-chart-2", bg: "bg-chart-2/10" },
    { icon: GraduationCap, title: t("masterclassesTitle"), href: "/masterclasses", color: "text-chart-3", bg: "bg-chart-3/10" },
    { icon: Landmark, title: t("exhibitions") || "Exhibitions", href: "/exhibitions", color: "text-chart-5", bg: "bg-chart-5/10" },
    { icon: Newspaper, title: t("news") || "News", href: "/news", color: "text-chart-4", bg: "bg-chart-4/10" },
    { icon: MessageSquare, title: isAr ? "الرسائل" : "Messages", href: "/messages", color: "text-chart-1", bg: "bg-chart-1/10" },
    { icon: ShoppingBag, title: isAr ? "المتجر" : "Shop", href: "/shop", color: "text-accent-foreground", bg: "bg-accent/30" },
    { icon: Gift, title: isAr ? "الإحالات" : "Referrals", href: "/referrals", color: "text-chart-4", bg: "bg-chart-4/10" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead title="Dashboard" description="Your personal Altohaa dashboard" />
      <Header />
      <main className="container flex-1 py-6 md:py-10">
        {/* Welcome Banner */}
        <Card className="mb-8 overflow-hidden border-primary/15 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative group">
          {/* Decorative glows */}
          <div className="pointer-events-none absolute -end-16 -top-16 h-48 w-48 rounded-full bg-primary/8 blur-[80px] animate-pulse" />
          <div className="pointer-events-none absolute -start-10 -bottom-10 h-36 w-36 rounded-full bg-accent/10 blur-[60px] animate-pulse [animation-delay:1s]" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
          <CardContent className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-4 ring-primary/5 shadow-sm transition-transform duration-300 group-hover:scale-105">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-xl font-bold sm:text-2xl md:text-3xl">{greeting} 👋</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isAr
                    ? "إليك ملخص نشاطك ومسابقاتك القادمة"
                    : "Here's a summary of your activity and upcoming events"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Navigation */}
        <div className="mb-8">
          <div className="grid gap-2.5 grid-cols-4 sm:grid-cols-4 lg:grid-cols-8">
            {sections.map((s, i) => (
              <Link key={s.title} to={s.href}>
                <Card className="group h-full transition-all duration-200 hover:shadow-md hover:-translate-y-1 border-border/50 hover:border-primary/20 bg-card/80"
                  style={{ animationDelay: `${i * 50}ms` }}>
                  <CardContent className="flex flex-col items-center gap-2.5 p-3 text-center sm:p-4">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.bg} transition-all duration-200 group-hover:scale-110 ring-2 ring-transparent group-hover:ring-primary/10 group-hover:shadow-sm`}>
                      <s.icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                    <h3 className="text-[11px] font-medium leading-tight sm:text-xs">{s.title}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        {user && (
          <div className="mb-8">
            <QuickStatsWidget />
          </div>
        )}

        {/* Achievements Summary */}
        {user && (
          <div className="mb-8">
            <AchievementsSummary userId={user.id} isAr={isAr} />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <UpcomingCompetitionsWidget />
            <UpcomingExhibitionsWidget />
            {user && <MasterclassProgressWidget />}
          </div>
          <div className="space-y-6">
            {user && <ReferralWidget />}
            {user && <EventsCalendarWidget />}
            {user && <NotificationsSummaryWidget />}
            <RecentActivityWidget />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function AchievementsSummary({ userId, isAr }: { userId: string; isAr: boolean }) {
  const { data } = useQuery({
    queryKey: ["dashboard-achievements", userId],
    queryFn: async (): Promise<{ certificates: number; competitions: number; badges: number }> => {
      const certsRes = await (supabase.from("certificates").select("id", { count: "exact", head: true }) as any).eq("recipient_id", userId);
      const regsRes = await (supabase.from("competition_registrations").select("id", { count: "exact", head: true }) as any).eq("user_id", userId);
      const badgesRes = await (supabase.from("user_badges").select("id", { count: "exact", head: true }) as any).eq("user_id", userId);
      return {
        certificates: certsRes.count || 0,
        competitions: regsRes.count || 0,
        badges: badgesRes.count || 0,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  if (!data || (data.certificates === 0 && data.competitions === 0 && data.badges === 0)) return null;

  const items = [
    { icon: Trophy, label: isAr ? "مسابقات" : "Competitions", value: data.competitions, color: "text-primary", bg: "bg-primary/10", border: "border-s-primary" },
    { icon: Award, label: isAr ? "شهادات" : "Certificates", value: data.certificates, color: "text-chart-3", bg: "bg-chart-3/10", border: "border-s-chart-3" },
    { icon: Star, label: isAr ? "شارات" : "Badges", value: data.badges, color: "text-chart-4", bg: "bg-chart-4/10", border: "border-s-chart-4" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <Card key={item.label} className={`border-s-[3px] ${item.border} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group`}>
          <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.bg} transition-transform group-hover:scale-110`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <div>
              <p className="text-lg font-bold sm:text-xl tabular-nums">{item.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
