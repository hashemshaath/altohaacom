import { lazy, Suspense, useEffect, useRef, memo } from "react";
import { MembershipExpiryBanner } from "@/components/membership/MembershipExpiryBanner";
import { ActivityPulse } from "@/components/ui/activity-pulse";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/PageShell";
import { Trophy, Users, GraduationCap, Landmark, MessageSquare, ShoppingBag, Sparkles, Award, Star, UtensilsCrossed, HandHeart, AlertCircle, Megaphone, ClipboardList, ArrowRight, LayoutDashboard, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAwardPoints } from "@/hooks/useAwardPoints";
import { usePrefetchRoute } from "@/hooks/usePrefetchRoute";
import { useAccountType } from "@/hooks/useAccountType";
import { DashboardWidgetSkeleton } from "@/components/dashboard/DashboardWidgetSkeleton";
import { DashboardLayoutControl, useDashboardLayout } from "@/components/dashboard/DashboardLayoutControl";
import { ProfileCompletionCard } from "@/components/profile/ProfileCompletionCard";
import { GlobalSearchWidget } from "@/components/dashboard/GlobalSearchWidget";
import { ScrollToTopFAB } from "@/components/mobile/ScrollToTopFAB";

// Lazy-loaded widgets
const UpcomingCompetitionsWidget = lazy(() => import("@/components/dashboard/UpcomingCompetitionsWidget").then(m => ({ default: m.UpcomingCompetitionsWidget })));
const LiveCompetitionsWidget = lazy(() => import("@/components/dashboard/LiveCompetitionsWidget").then(m => ({ default: m.LiveCompetitionsWidget })));
const RecentActivityWidget = lazy(() => import("@/components/dashboard/RecentActivityWidget").then(m => ({ default: m.RecentActivityWidget })));
const ReferralWidget = lazy(() => import("@/components/dashboard/ReferralWidget").then(m => ({ default: m.ReferralWidget })));
const QuickStatsWidget = lazy(() => import("@/components/dashboard/QuickStatsWidget").then(m => ({ default: m.QuickStatsWidget })));
const MasterclassProgressWidget = lazy(() => import("@/components/dashboard/MasterclassProgressWidget").then(m => ({ default: m.MasterclassProgressWidget })));
const NotificationsSummaryWidget = lazy(() => import("@/components/dashboard/NotificationsSummaryWidget").then(m => ({ default: m.NotificationsSummaryWidget })));
const UpcomingExhibitionsWidget = lazy(() => import("@/components/dashboard/UpcomingExhibitionsWidget").then(m => ({ default: m.UpcomingExhibitionsWidget })));
const EventsCalendarWidget = lazy(() => import("@/components/dashboard/EventsCalendarWidget").then(m => ({ default: m.EventsCalendarWidget })));
const ChefScheduleWidget = lazy(() => import("@/components/dashboard/ChefScheduleWidget").then(m => ({ default: m.ChefScheduleWidget })));
const ContentStatsWidget = lazy(() => import("@/components/dashboard/ContentStatsWidget").then(m => ({ default: m.ContentStatsWidget })));
const ProfileInsightsWidget = lazy(() => import("@/components/dashboard/ProfileInsightsWidget").then(m => ({ default: m.ProfileInsightsWidget })));
const NotificationActivityWidget = lazy(() => import("@/components/dashboard/NotificationActivityWidget").then(m => ({ default: m.NotificationActivityWidget })));
const EngagementAnalyticsWidget = lazy(() => import("@/components/dashboard/EngagementAnalyticsWidget").then(m => ({ default: m.EngagementAnalyticsWidget })));
const ProgressReportWidget = lazy(() => import("@/components/dashboard/ProgressReportWidget").then(m => ({ default: m.ProgressReportWidget })));
const NotificationPreferencesWidget = lazy(() => import("@/components/dashboard/NotificationPreferencesWidget").then(m => ({ default: m.NotificationPreferencesWidget })));
const DashboardPersonalizationWidget = lazy(() => import("@/components/dashboard/DashboardPersonalizationWidget").then(m => ({ default: m.DashboardPersonalizationWidget })));
const QuickActionsWidget = lazy(() => import("@/components/dashboard/QuickActionsWidget").then(m => ({ default: m.QuickActionsWidget })));
const DailyDigestWidget = lazy(() => import("@/components/dashboard/DailyDigestWidget").then(m => ({ default: m.DailyDigestWidget })));
const StreakWidget = lazy(() => import("@/components/dashboard/StreakWidget").then(m => ({ default: m.StreakWidget })));
const WeeklyOverviewWidget = lazy(() => import("@/components/dashboard/WeeklyOverviewWidget").then(m => ({ default: m.WeeklyOverviewWidget })));
const WalletBalanceWidget = lazy(() => import("@/components/dashboard/WalletBalanceWidget").then(m => ({ default: m.WalletBalanceWidget })));
const GoalsMilestonesWidget = lazy(() => import("@/components/dashboard/GoalsMilestonesWidget").then(m => ({ default: m.GoalsMilestonesWidget })));
// Fan-specific widgets
const FanTrendingWidget = lazy(() => import("@/components/dashboard/FanTrendingWidget").then(m => ({ default: m.FanTrendingWidget })));
const FanSuggestedFollowsWidget = lazy(() => import("@/components/dashboard/FanSuggestedFollowsWidget").then(m => ({ default: m.FanSuggestedFollowsWidget })));
const FanRecommendationsWidget = lazy(() => import("@/components/dashboard/FanRecommendationsWidget").then(m => ({ default: m.FanRecommendationsWidget })));
const FanEventWatchlist = lazy(() => import("@/components/fan/FanEventWatchlist").then(m => ({ default: m.FanEventWatchlist })));

// Enhancement widgets
const NotificationGroupWidget = lazy(() => import("@/components/notifications/NotificationGroupWidget").then(m => ({ default: m.NotificationGroupWidget })));
const MessageSearchWidget = lazy(() => import("@/components/messages/MessageSearchWidget").then(m => ({ default: m.MessageSearchWidget })));
const ActivityHeatmapWidget = lazy(() => import("@/components/dashboard/ActivityHeatmapWidget").then(m => ({ default: m.ActivityHeatmapWidget })));
const ProfileSummaryCard = lazy(() => import("@/components/dashboard/ProfileSummaryCard").then(m => ({ default: m.ProfileSummaryCard })));
const RecentOrdersWidget = lazy(() => import("@/components/dashboard/RecentOrdersWidget").then(m => ({ default: m.RecentOrdersWidget })));
const RecentChatsWidget = lazy(() => import("@/components/dashboard/RecentChatsWidget").then(m => ({ default: m.RecentChatsWidget })));
const AchievementsChallengesWidget = lazy(() => import("@/components/dashboard/AchievementsChallengesWidget").then(m => ({ default: m.AchievementsChallengesWidget })));
const SmartRecommendationsWidget = lazy(() => import("@/components/community/SmartRecommendations").then(m => ({ default: m.SmartRecommendations })));

function W({ children, lines }: { children: React.ReactNode; lines?: number }) {
  return <Suspense fallback={<DashboardWidgetSkeleton lines={lines} />}>{children}</Suspense>;
}

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const { widgets, toggleWidget, resetLayout, isVisible } = useDashboardLayout();
  const { isFan } = useAccountType();

  const { data: profile } = useQuery({
    queryKey: ["dashboard-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, full_name_ar, username, profile_completed, avatar_url, account_type")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const awardPoints = useAwardPoints();
  const dailyLoginAwarded = useRef(false);
  useEffect(() => {
    if (user && !dailyLoginAwarded.current) {
      dailyLoginAwarded.current = true;
      awardPoints.mutate({ actionType: "daily_login", silent: true });
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const firstName = isAr
    ? (profile?.full_name_ar?.split(" ")[0] || profile?.full_name?.split(" ")[0] || "")
    : (profile?.full_name?.split(" ")[0] || "");

  const greeting = isAr
    ? `مرحباً${firstName ? ` ${firstName}` : ""}`
    : `Welcome back${firstName ? `, ${firstName}` : ""}`;
  const subtitle = isFan
    ? (isAr ? "تابع آخر أخبار الطهاة والمسابقات والمعارض" : "Stay updated on chefs, competitions & exhibitions")
    : (isAr ? "إليك ملخص نشاطك ومسابقاتك القادمة" : "Your culinary milestones await below.");

  const sections = isFan ? [
    { icon: Users, title: isAr ? "المجتمع" : "Community", href: "/community", color: "text-chart-2", bg: "bg-chart-2/10", ring: "ring-chart-2/15", glow: "group-hover:shadow-chart-2/10" },
    { icon: Trophy, title: isAr ? "المسابقات" : "Competitions", href: "/competitions", color: "text-primary", bg: "bg-primary/10", ring: "ring-primary/15", glow: "group-hover:shadow-primary/10" },
    { icon: Landmark, title: isAr ? "المعارض" : "Exhibits", href: "/exhibitions", color: "text-chart-5", bg: "bg-chart-5/10", ring: "ring-chart-5/15", glow: "group-hover:shadow-chart-5/10" },
    { icon: UtensilsCrossed, title: isAr ? "الوصفات" : "Recipes", href: "/recipes", color: "text-chart-4", bg: "bg-chart-4/10", ring: "ring-chart-4/15", glow: "group-hover:shadow-chart-4/10" },
    { icon: GraduationCap, title: isAr ? "الدورات" : "Courses", href: "/masterclasses", color: "text-chart-3", bg: "bg-chart-3/10", ring: "ring-chart-3/15", glow: "group-hover:shadow-chart-3/10" },
    { icon: ShoppingBag, title: isAr ? "المتجر" : "Shop", href: "/shop", color: "text-primary", bg: "bg-primary/8", ring: "ring-primary/10", glow: "group-hover:shadow-primary/10" },
    { icon: MessageSquare, title: isAr ? "الرسائل" : "Messages", href: "/messages", color: "text-chart-2", bg: "bg-chart-2/10", ring: "ring-chart-2/15", glow: "group-hover:shadow-chart-2/10" },
  ] : [
    { icon: Trophy, title: isAr ? "المسابقات" : "Compete", href: "/competitions", color: "text-primary", bg: "bg-primary/10", ring: "ring-primary/15", glow: "group-hover:shadow-primary/10" },
    { icon: Users, title: isAr ? "المجتمع" : "Community", href: "/community", color: "text-chart-2", bg: "bg-chart-2/10", ring: "ring-chart-2/15", glow: "group-hover:shadow-chart-2/10" },
    { icon: GraduationCap, title: isAr ? "الدورات" : "Courses", href: "/masterclasses", color: "text-chart-3", bg: "bg-chart-3/10", ring: "ring-chart-3/15", glow: "group-hover:shadow-chart-3/10" },
    { icon: Landmark, title: isAr ? "المعارض" : "Exhibits", href: "/exhibitions", color: "text-chart-5", bg: "bg-chart-5/10", ring: "ring-chart-5/15", glow: "group-hover:shadow-chart-5/10" },
    { icon: UtensilsCrossed, title: isAr ? "الوصفات" : "Recipes", href: "/recipes", color: "text-chart-4", bg: "bg-chart-4/10", ring: "ring-chart-4/15", glow: "group-hover:shadow-chart-4/10" },
    { icon: HandHeart, title: isAr ? "الإرشاد" : "Mentor", href: "/mentorship", color: "text-chart-1", bg: "bg-chart-1/10", ring: "ring-chart-1/15", glow: "group-hover:shadow-chart-1/10" },
    { icon: ShoppingBag, title: isAr ? "المتجر" : "Shop", href: "/shop", color: "text-primary", bg: "bg-primary/8", ring: "ring-primary/10", glow: "group-hover:shadow-primary/10" },
    { icon: MessageSquare, title: isAr ? "الرسائل" : "Messages", href: "/messages", color: "text-chart-2", bg: "bg-chart-2/10", ring: "ring-chart-2/15", glow: "group-hover:shadow-chart-2/10" },
    { icon: ClipboardList, title: isAr ? "طلباتي" : "Orders", href: "/shop/orders", color: "text-chart-3", bg: "bg-chart-3/10", ring: "ring-chart-3/15", glow: "group-hover:shadow-chart-3/10" },
    { icon: Megaphone, title: isAr ? "أعلن معنا" : "Advertise", href: "/advertise", color: "text-chart-4", bg: "bg-chart-4/10", ring: "ring-chart-4/15", glow: "group-hover:shadow-chart-4/10" },
  ];

  return (
    <PageShell title="Dashboard" description="Your personal Altoha dashboard">
      {/* Membership Expiry Banner */}
      <MembershipExpiryBanner className="mb-4" />

      {/* Welcome Banner */}
      <WelcomeBanner
        greeting={greeting}
        subtitle={subtitle}
        isAr={isAr}
        widgets={widgets}
        toggleWidget={toggleWidget}
        resetLayout={resetLayout}
        avatarUrl={profile?.avatar_url}
        firstName={firstName}
      />

      {/* Global Search */}
      <GlobalSearchWidget />

      {/* Profile Completion Nudge */}
      {user && profile && !profile.profile_completed && <ProfileNudge isAr={isAr} />}

      {/* Quick Navigation */}
      <QuickAccessGrid sections={sections} isAr={isAr} />

      {/* Quick Stats */}
      {user && isVisible("quick-stats") && (
        <div className="mb-5"><W lines={1}><QuickStatsWidget /></W></div>
      )}

      {/* Achievements Summary */}
      {user && isVisible("achievements") && (
        <div className="mb-5"><AchievementsSummary userId={user.id} isAr={isAr} /></div>
      )}


      {/* Daily Digest */}
      {user && (
        <div className="mb-5"><W><DailyDigestWidget /></W></div>
      )}

      {/* ─── Main 3-Column Grid ─── */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-12 pb-20 sm:pb-0">
        {/* Left Column - Profile & Identity (sticky on desktop) */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="lg:sticky lg:top-20 space-y-4">
            {user && <ProfileCompletionCard />}
            {user && <W><ProfileSummaryCard /></W>}
            {user && <W><WalletBalanceWidget /></W>}
            {user && <W><StreakWidget /></W>}
            {user && <W><QuickActionsWidget /></W>}
          </div>
        </aside>

        {/* Center Column - Main Content Feed */}
        <main className="lg:col-span-6 space-y-4 md:space-y-5">

          {/* Common content */}
          {isVisible("competitions") && <W><UpcomingCompetitionsWidget /></W>}
          {isVisible("exhibitions") && <W><UpcomingExhibitionsWidget /></W>}
          {user && !isFan && isVisible("masterclass") && <W><MasterclassProgressWidget /></W>}

          {/* AI Recommendations */}
          {user && <W><SmartRecommendationsWidget /></W>}

          {/* Pro extras */}
          {user && !isFan && <W><ActivityHeatmapWidget /></W>}
          {user && !isFan && isVisible("engagement") && <W><EngagementAnalyticsWidget /></W>}
          {user && !isFan && isVisible("content-stats") && <W><ContentStatsWidget /></W>}
          {user && !isFan && isVisible("progress-report") && <W><ProgressReportWidget /></W>}

          {/* Shared activity */}
          {isVisible("activity") && <W><RecentActivityWidget /></W>}
        </main>

        {/* Right Column - Activity & Social */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="lg:sticky lg:top-20 space-y-4">
            {user && <W><NotificationGroupWidget /></W>}
            {user && <W><RecentChatsWidget /></W>}
            {user && <W><GoalsMilestonesWidget /></W>}
            {user && <W><AchievementsChallengesWidget /></W>}
            {user && <W><RecentOrdersWidget /></W>}
            {user && <W><LiveCompetitionsWidget /></W>}

            {/* Fan sidebar */}
            {user && isFan && <W><FanEventWatchlist /></W>}
            {user && isFan && <W><FanSuggestedFollowsWidget /></W>}
            {user && isFan && <W><FanTrendingWidget /></W>}

            {/* Pro sidebar */}
            {user && !isFan && isVisible("profile-insights") && <W><ProfileInsightsWidget /></W>}
            {user && !isFan && isVisible("chef-schedule") && <W><ChefScheduleWidget /></W>}

            {/* Shared sidebar */}
            {user && isVisible("referral") && <W><ReferralWidget /></W>}
            {user && isVisible("notification-activity") && <W><NotificationActivityWidget /></W>}
            {user && isVisible("events-calendar") && <W><EventsCalendarWidget /></W>}
            {user && isVisible("notification-prefs") && <W><NotificationPreferencesWidget /></W>}
            {user && isVisible("notifications") && <W><NotificationsSummaryWidget /></W>}
            {user && <W><MessageSearchWidget /></W>}
            {user && <W><DashboardPersonalizationWidget /></W>}
          </div>
        </aside>
      </div>
      <ScrollToTopFAB />
    </PageShell>
  );
}

/* ---------- Sub-Components ---------- */

const WelcomeBanner = memo(function WelcomeBanner({
  greeting, subtitle, isAr, widgets, toggleWidget, resetLayout, avatarUrl, firstName,
}: {
  greeting: string; subtitle: string; isAr: boolean;
  widgets: any[]; toggleWidget: (id: string) => void; resetLayout: () => void;
  avatarUrl?: string | null; firstName: string;
}) {
  return (
    <div className="relative mb-5 sm:mb-6 overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/8 via-background to-accent/8 p-4 sm:p-6 md:p-8 shadow-lg">
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -end-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-[80px] animate-pulse" />
      <div className="pointer-events-none absolute -start-8 -bottom-8 h-36 w-36 rounded-full bg-accent/10 blur-[60px] animate-pulse [animation-delay:2s]" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />

      <div className="relative flex items-start gap-3 sm:gap-4">
        {/* Avatar */}
        <Link to="/profile" className="shrink-0 hidden sm:block">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow p-[2px] shadow-xl transition-all hover:scale-105 hover:shadow-primary/20">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full rounded-[14px] object-cover bg-card" />
            ) : (
              <div className="h-full w-full rounded-[14px] bg-primary/10 flex items-center justify-center">
                <LayoutDashboard className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div>
              <h1 className="font-serif text-lg sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                {greeting} 👋
                <ActivityPulse status="live" label={isAr ? "متصل" : "Online"} />
              </h1>
              <p className="mt-1 text-[10px] sm:text-xs sm:mt-1.5 text-muted-foreground/80">{subtitle}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <DashboardLayoutControl widgets={widgets} toggleWidget={toggleWidget} resetLayout={resetLayout} />
              <Link to="/profile?tab=edit">
                <Button variant="secondary" size="sm" className="gap-1.5 shadow-sm rounded-xl text-xs">
                  <span className="hidden sm:inline">{isAr ? "إدارة الملف" : "Manage Profile"}</span>
                  <span className="sm:hidden">{isAr ? "الملف" : "Profile"}</span>
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const ProfileNudge = memo(function ProfileNudge({ isAr }: { isAr: boolean }) {
  return (
    <div className="mb-5 animate-fade-in">
      <Link to="/onboarding">
        <Card className="group border-chart-4/30 bg-gradient-to-r from-chart-4/5 to-transparent transition-all hover:shadow-md active:scale-[0.99]">
          <CardContent className="flex items-center gap-3 py-3.5 px-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-chart-4/10 ring-2 ring-chart-4/20">
              <AlertCircle className="h-4 w-4 text-chart-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{isAr ? "أكمل ملفك الشخصي" : "Complete Your Profile"}</p>
              <p className="text-xs text-muted-foreground truncate">{isAr ? "أكمل معلوماتك لفتح جميع المزايا" : "Finish setup to unlock all features"}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 rtl:rotate-180" />
          </CardContent>
        </Card>
      </Link>
    </div>
  );
});

const QuickAccessGrid = memo(function QuickAccessGrid({ sections, isAr }: { sections: Array<{ icon: any; title: string; href: string; color: string; bg: string; ring: string; glow: string }>; isAr: boolean }) {
  const { prefetchProps } = usePrefetchRoute();
  return (
    <div className="mb-6">
      <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
        <Sparkles className="h-3 w-3 text-primary" />
        {isAr ? "الوصول السريع" : "Quick Access"}
      </h2>
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 sm:grid sm:grid-cols-5 lg:grid-cols-10 sm:overflow-visible scrollbar-none" dir={isAr ? "rtl" : "ltr"}>
          {sections.map((s) => (
            <Link key={s.title} to={s.href} className="group shrink-0 sm:shrink" {...prefetchProps(s.href)}>
              <div className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 active:scale-[0.92] w-[68px] sm:w-auto ${s.glow}`}>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg} ring-1 ${s.ring} transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <span className="text-[9px] font-semibold text-center text-foreground/80 leading-tight w-full line-clamp-2">{s.title}</span>
              </div>
            </Link>
          ))}
        </div>
        <div className="pointer-events-none absolute end-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent sm:hidden" />
      </div>
    </div>
  );
});

const AchievementsSummary = memo(function AchievementsSummary({ userId, isAr }: { userId: string; isAr: boolean }) {
  const { data } = useQuery({
    queryKey: ["dashboard-achievements", userId],
    queryFn: async (): Promise<{ certificates: number; competitions: number; badges: number }> => {
      const [certsRes, regsRes, badgesRes] = await Promise.all([
        supabase.from("certificates").select("id", { count: "exact", head: true }).eq("recipient_id", userId),
        supabase.from("competition_registrations").select("id", { count: "exact", head: true }).eq("participant_id", userId),
        supabase.from("user_badges").select("id", { count: "exact", head: true }).eq("user_id", userId),
      ]);
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
        <Card key={item.label} className={`border-s-[3px] ${item.border} transition-all duration-200 hover:shadow-md active:scale-[0.97]`}>
          <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.bg}`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <div>
              <AnimatedCounter value={item.value} className="text-xl" />
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-tight">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
