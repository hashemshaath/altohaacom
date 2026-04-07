import { lazy, Suspense, useEffect, useRef, memo } from "react";
import { MembershipExpiryBanner } from "@/components/membership/MembershipExpiryBanner";
import { ActivityPulse } from "@/components/ui/activity-pulse";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/PageShell";
import { Trophy, Users, GraduationCap, Landmark, MessageSquare, ShoppingBag, Sparkles, Award, Star, UtensilsCrossed, HandHeart, AlertCircle, Megaphone, ClipboardList, ArrowRight, LayoutDashboard, ChevronRight, Calendar, TrendingUp, Zap } from "lucide-react";
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
const FanTrendingWidget = lazy(() => import("@/components/dashboard/FanTrendingWidget").then(m => ({ default: m.FanTrendingWidget })));
const FanSuggestedFollowsWidget = lazy(() => import("@/components/dashboard/FanSuggestedFollowsWidget").then(m => ({ default: m.FanSuggestedFollowsWidget })));
const FanRecommendationsWidget = lazy(() => import("@/components/dashboard/FanRecommendationsWidget").then(m => ({ default: m.FanRecommendationsWidget })));
const FanEventWatchlist = lazy(() => import("@/components/fan/FanEventWatchlist").then(m => ({ default: m.FanEventWatchlist })));
const NotificationGroupWidget = lazy(() => import("@/components/notifications/NotificationGroupWidget").then(m => ({ default: m.NotificationGroupWidget })));
const NotificationDigest = lazy(() => import("@/components/notifications/NotificationDigest").then(m => ({ default: m.NotificationDigest })));
const MessageSearchWidget = lazy(() => import("@/components/messages/MessageSearchWidget").then(m => ({ default: m.MessageSearchWidget })));
const ActivityHeatmapWidget = lazy(() => import("@/components/dashboard/ActivityHeatmapWidget").then(m => ({ default: m.ActivityHeatmapWidget })));
const ProfileSummaryCard = lazy(() => import("@/components/dashboard/ProfileSummaryCard").then(m => ({ default: m.ProfileSummaryCard })));
const RecentOrdersWidget = lazy(() => import("@/components/dashboard/RecentOrdersWidget").then(m => ({ default: m.RecentOrdersWidget })));
const RecentChatsWidget = lazy(() => import("@/components/dashboard/RecentChatsWidget").then(m => ({ default: m.RecentChatsWidget })));
const AchievementsChallengesWidget = lazy(() => import("@/components/dashboard/AchievementsChallengesWidget").then(m => ({ default: m.AchievementsChallengesWidget })));
const SmartRecommendationsWidget = lazy(() => import("@/components/community/SmartRecommendations").then(m => ({ default: m.SmartRecommendations })));
const PlatformScoreWidget = lazy(() => import("@/components/dashboard/PlatformScoreWidget").then(m => ({ default: m.PlatformScoreWidget })));
const WeeklyTrendChart = lazy(() => import("@/components/dashboard/WeeklyTrendChart").then(m => ({ default: m.WeeklyTrendChart })));
const JobAvailabilityWidget = lazy(() => import("@/components/dashboard/JobAvailabilityWidget").then(m => ({ default: m.JobAvailabilityWidget })));
import { WidgetErrorBoundary } from "@/components/WidgetErrorBoundary";

function W({ children, lines, name }: { children: React.ReactNode; lines?: number; name?: string }) {
  return (
    <WidgetErrorBoundary name={name}>
      <Suspense fallback={<DashboardWidgetSkeleton lines={lines} />}>{children}</Suspense>
    </WidgetErrorBoundary>
  );
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
        .select("full_name, full_name_ar, username, profile_completed, avatar_url, account_type, membership_tier, loyalty_points")
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

  const hour = new Date().getHours();
  const timeGreeting = isAr
    ? (hour < 12 ? "صباح الخير" : hour < 18 ? "مساء الخير" : "مساء النور")
    : (hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");

  const firstName = isAr
    ? (profile?.full_name_ar?.split(" ")[0] || profile?.full_name?.split(" ")[0] || "")
    : (profile?.full_name?.split(" ")[0] || "");

  const greeting = `${timeGreeting}${firstName ? (isAr ? ` ${firstName}` : `, ${firstName}`) : ""}`;
  const subtitle = isFan
    ? (isAr ? "تابع آخر أخبار الطهاة والمسابقات والمعارض" : "Stay updated on chefs, competitions & exhibitions")
    : (isAr ? "إليك ملخص نشاطك ومسابقاتك القادمة" : "Your culinary milestones await below.");

  const sections = isFan ? [
    { icon: Sparkles, title: isAr ? "مقترح لك" : "For You", href: "/for-you", color: "text-primary", bg: "bg-primary/10", ring: "ring-primary/15", glow: "group-hover:shadow-primary/10" },
    { icon: Users, title: isAr ? "المجتمع" : "Community", href: "/community", color: "text-chart-2", bg: "bg-chart-2/10", ring: "ring-chart-2/15", glow: "group-hover:shadow-chart-2/10" },
    { icon: Trophy, title: isAr ? "المسابقات" : "Competitions", href: "/competitions", color: "text-primary", bg: "bg-primary/10", ring: "ring-primary/15", glow: "group-hover:shadow-primary/10" },
    { icon: Landmark, title: isAr ? "المعارض" : "Exhibits", href: "/exhibitions", color: "text-chart-5", bg: "bg-chart-5/10", ring: "ring-chart-5/15", glow: "group-hover:shadow-chart-5/10" },
    { icon: UtensilsCrossed, title: isAr ? "الوصفات" : "Recipes", href: "/recipes", color: "text-chart-4", bg: "bg-chart-4/10", ring: "ring-chart-4/15", glow: "group-hover:shadow-chart-4/10" },
    { icon: GraduationCap, title: isAr ? "الدورات" : "Courses", href: "/masterclasses", color: "text-chart-3", bg: "bg-chart-3/10", ring: "ring-chart-3/15", glow: "group-hover:shadow-chart-3/10" },
    { icon: ShoppingBag, title: isAr ? "المتجر" : "Shop", href: "/shop", color: "text-primary", bg: "bg-primary/8", ring: "ring-primary/10", glow: "group-hover:shadow-primary/10" },
    { icon: MessageSquare, title: isAr ? "الرسائل" : "Messages", href: "/messages", color: "text-chart-2", bg: "bg-chart-2/10", ring: "ring-chart-2/15", glow: "group-hover:shadow-chart-2/10" },
  ] : [
    { icon: Sparkles, title: isAr ? "مقترح لك" : "For You", href: "/for-you", color: "text-primary", bg: "bg-primary/10", ring: "ring-primary/15", glow: "group-hover:shadow-primary/10" },
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
    <PageShell title="Dashboard" description="Your personal Altoha dashboard" seoProps={{ noIndex: true }}>
      {/* Membership Expiry Banner */}
      <MembershipExpiryBanner className="mb-4" />

      {/* ── Hero Welcome Section ── */}
      <HeroWelcome
        greeting={greeting}
        subtitle={subtitle}
        isAr={isAr}
        widgets={widgets}
        toggleWidget={toggleWidget}
        resetLayout={resetLayout}
        avatarUrl={profile?.avatar_url}
        firstName={firstName}
        membershipTier={profile?.membership_tier}
        loyaltyPoints={profile?.loyalty_points}
      />

      {/* Global Search */}
      <div className="mb-6">
        <GlobalSearchWidget />
      </div>

      {/* Profile Completion Nudge */}
      {user && profile && !profile.profile_completed && <ProfileNudge isAr={isAr} />}

      {/* Quick Navigation */}
      <QuickAccessGrid sections={sections} isAr={isAr} />

      {/* Quick Stats - Full width row */}
      {user && isVisible("quick-stats") && (
        <div className="mb-6"><W lines={1}><QuickStatsWidget /></W></div>
      )}

      {/* Weekly Overview */}
      {user && isVisible("weekly-overview") && (
        <div className="mb-6"><W lines={2}><WeeklyOverviewWidget /></W></div>
      )}

      {/* Achievements Summary */}
      {user && isVisible("achievements") && (
        <div className="mb-6"><AchievementsSummary userId={user.id} isAr={isAr} /></div>
      )}

      {/* Daily Digest */}
      {user && isVisible("daily-digest") && (
        <div className="mb-6"><W><DailyDigestWidget /></W></div>
      )}

      {/* ─── Main 3-Column Grid ─── */}
      <div className="grid gap-5 lg:grid-cols-12 pb-20 sm:pb-0">
        {/* Left Column - Profile & Identity */}
        <aside className="lg:col-span-3 space-y-4">
          <SectionLabel icon={Star} label={isAr ? "ملفك الشخصي" : "Your Profile"} />
          <div className="lg:sticky lg:top-20 space-y-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:scrollbar-none lg:pe-1">
            {user && <ProfileCompletionCard />}
            {user && <W><ProfileSummaryCard /></W>}
            {user && isVisible("platform-score") && <W><PlatformScoreWidget /></W>}
            {user && isVisible("wallet") && <W><WalletBalanceWidget /></W>}
            {user && isVisible("streak") && <W><StreakWidget /></W>}
            {user && isVisible("quick-actions") && <W><QuickActionsWidget /></W>}
          </div>
        </aside>

        {/* Center Column - Main Content Feed */}
        <main className="lg:col-span-6 space-y-5">
          <SectionLabel icon={Trophy} label={isAr ? "النشاط الرئيسي" : "Main Feed"} />

          {isVisible("competitions") && <W><UpcomingCompetitionsWidget /></W>}
          {isVisible("exhibitions") && <W><UpcomingExhibitionsWidget /></W>}
          {user && !isFan && isVisible("masterclass") && <W><MasterclassProgressWidget /></W>}
          {user && isVisible("recommendations") && <W><SmartRecommendationsWidget /></W>}
          {user && !isFan && isVisible("weekly-trend") && <W><WeeklyTrendChart /></W>}
          {user && !isFan && isVisible("activity-heatmap") && <W><ActivityHeatmapWidget /></W>}
          {user && !isFan && isVisible("engagement") && <W><EngagementAnalyticsWidget /></W>}
          {user && !isFan && isVisible("content-stats") && <W><ContentStatsWidget /></W>}
          {user && !isFan && isVisible("progress-report") && <W><ProgressReportWidget /></W>}
          {isVisible("activity") && <W><RecentActivityWidget /></W>}
        </main>

        {/* Right Column - Activity & Social */}
        <aside className="lg:col-span-3 space-y-4">
          <SectionLabel icon={MessageSquare} label={isAr ? "التحديثات" : "Updates"} />
          <div className="lg:sticky lg:top-20 space-y-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:scrollbar-none lg:pe-1">
            {user && isVisible("notification-digest") && <W><NotificationDigest /></W>}
            {user && isVisible("notification-groups") && <W><NotificationGroupWidget /></W>}
            {user && isVisible("recent-chats") && <W><RecentChatsWidget /></W>}
            {user && isVisible("goals") && <W><GoalsMilestonesWidget /></W>}
            {user && isVisible("achievements-challenges") && <W><AchievementsChallengesWidget /></W>}
            {user && isVisible("recent-orders") && <W><RecentOrdersWidget /></W>}
            {user && isVisible("live-competitions") && <W><LiveCompetitionsWidget /></W>}

            {user && isFan && <W><FanEventWatchlist /></W>}
            {user && isFan && <W><FanSuggestedFollowsWidget /></W>}
            {user && isFan && <W><FanTrendingWidget /></W>}

            {user && !isFan && isVisible("profile-insights") && <W><ProfileInsightsWidget /></W>}
            {user && !isFan && isVisible("chef-schedule") && <W><ChefScheduleWidget /></W>}
            {user && !isFan && <W name="job-availability"><JobAvailabilityWidget /></W>}

            {user && isVisible("referral") && <W><ReferralWidget /></W>}
            {user && isVisible("notification-activity") && <W><NotificationActivityWidget /></W>}
            {user && isVisible("events-calendar") && <W><EventsCalendarWidget /></W>}
            {user && isVisible("notification-prefs") && <W><NotificationPreferencesWidget /></W>}
            {user && isVisible("notifications") && <W><NotificationsSummaryWidget /></W>}
            {user && isVisible("message-search") && <W><MessageSearchWidget /></W>}
            {user && <W><DashboardPersonalizationWidget /></W>}
          </div>
        </aside>
      </div>
      <ScrollToTopFAB />
    </PageShell>
  );
}

/* ══════════════════════════════════════════════════════════
   Sub-Components
   ══════════════════════════════════════════════════════════ */

const SectionLabel = memo(function SectionLabel({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-1 lg:mb-0">
      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-3 w-3 text-primary" />
      </div>
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </h2>
      <div className="flex-1 h-px bg-gradient-to-r from-border/60 to-transparent hidden lg:block" />
    </div>
  );
});

/* ── Hero Welcome ── */
const HeroWelcome = memo(function HeroWelcome({
  greeting, subtitle, isAr, widgets, toggleWidget, resetLayout, avatarUrl, firstName, membershipTier, loyaltyPoints,
}: {
  greeting: string; subtitle: string; isAr: boolean;
  widgets: any[]; toggleWidget: (id: string) => void; resetLayout: () => void;
  avatarUrl?: string | null; firstName: string;
  membershipTier?: string | null; loyaltyPoints?: number | null;
}) {
  const tierColors: Record<string, string> = {
    free: "from-muted/30 to-muted/10",
    professional: "from-primary/15 via-primary/5 to-accent/10",
    enterprise: "from-chart-4/15 via-primary/10 to-chart-3/5",
  };
  const tierBg = tierColors[membershipTier || "free"] || tierColors.free;

  return (
    <div className={`relative mb-6 overflow-hidden rounded-2xl sm:rounded-3xl border border-border/30 bg-gradient-to-br ${tierBg} shadow-xl`}>
      {/* Decorative elements */}
      <div className="pointer-events-none absolute -end-20 -top-20 h-56 w-56 rounded-full bg-primary/8 blur-[100px]" />
      <div className="pointer-events-none absolute -start-12 bottom-0 h-40 w-40 rounded-full bg-accent/8 blur-[80px]" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />

      {/* Subtle pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

      <div className="relative p-5 sm:p-7 md:p-8">
        <div className="flex items-start gap-4 sm:gap-5">
          {/* Avatar with tier ring */}
          <Link to="/profile" className="shrink-0 hidden sm:block">
            <div className={`h-16 w-16 sm:h-[72px] sm:w-[72px] rounded-2xl p-[2.5px] shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-primary/25 ${
              membershipTier === "enterprise" ? "bg-gradient-to-br from-chart-4 via-primary to-chart-3" :
              membershipTier === "professional" ? "bg-gradient-to-br from-primary to-primary-glow" :
              "bg-gradient-to-br from-muted-foreground/30 to-muted-foreground/10"
            }`}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" loading="lazy" className="h-full w-full rounded-[13px] object-cover bg-card" />
              ) : (
                <div className="h-full w-full rounded-[13px] bg-card flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">{firstName?.charAt(0) || "U"}</span>
                </div>
              )}
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    {greeting}
                  </h1>
                  <ActivityPulse status="live" label={isAr ? "متصل" : "Online"} />
                </div>
                <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground/80 line-clamp-1">{subtitle}</p>

                {/* Quick stats chips */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {membershipTier && membershipTier !== "free" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/15">
                      <Zap className="h-3 w-3" />
                      {membershipTier === "enterprise" ? (isAr ? "مؤسسي" : "Enterprise") : (isAr ? "احترافي" : "Professional")}
                    </span>
                  )}
                  {(loyaltyPoints ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-chart-4/10 text-chart-4 border border-chart-4/15">
                      <Star className="h-3 w-3" />
                      <AnimatedCounter value={loyaltyPoints || 0} /> {isAr ? "نقطة" : "pts"}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-muted/60 text-muted-foreground border border-border/30">
                    <Calendar className="h-3 w-3" />
                    {new Date().toLocaleDateString(isAr ? "ar-SA" : "en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <DashboardLayoutControl widgets={widgets} toggleWidget={toggleWidget} resetLayout={resetLayout} />
                <Link to="/profile?tab=edit">
                  <Button variant="secondary" size="sm" className="gap-1.5 shadow-sm rounded-xl text-xs hidden sm:flex">
                    {isAr ? "إدارة الملف" : "Manage Profile"}
                    <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

/* ── Profile Nudge ── */
const ProfileNudge = memo(function ProfileNudge({ isAr }: { isAr: boolean }) {
  return (
    <div className="mb-6 animate-fade-in">
      <Link to="/onboarding">
        <Card className="group rounded-2xl border-chart-4/30 bg-gradient-to-r from-chart-4/5 to-transparent transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]">
          <CardContent className="flex items-center gap-3 py-3.5 px-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-4/10 ring-2 ring-chart-4/20 transition-transform duration-300 group-hover:scale-110">
              <AlertCircle className="h-5 w-5 text-chart-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">{isAr ? "أكمل ملفك الشخصي" : "Complete Your Profile"}</p>
              <p className="text-xs text-muted-foreground truncate">{isAr ? "أكمل معلوماتك لفتح جميع المزايا والمكافآت" : "Finish setup to unlock all features & rewards"}</p>
            </div>
            <div className="shrink-0 flex items-center gap-1">
              <span className="text-xs font-bold text-chart-4 hidden sm:block">{isAr ? "أكمل الآن" : "Complete Now"}</span>
              <ChevronRight className="h-4 w-4 text-chart-4 group-hover:translate-x-0.5 transition-all duration-300 shrink-0 rtl:rotate-180" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
});

/* ── Quick Access Grid ── */
const QuickAccessGrid = memo(function QuickAccessGrid({ sections, isAr }: { sections: Array<{ icon: any; title: string; href: string; color: string; bg: string; ring: string; glow: string }>; isAr: boolean }) {
  const { prefetchProps } = usePrefetchRoute();
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-3 w-3 text-primary" />
          </div>
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            {isAr ? "الوصول السريع" : "Quick Access"}
          </h2>
        </div>
      </div>

      <div className="relative">
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 sm:grid sm:grid-cols-5 lg:grid-cols-11 sm:overflow-visible scrollbar-none touch-manipulation" dir={isAr ? "rtl" : "ltr"}>
          {sections.map((s) => (
            <Link key={s.title} to={s.href} className="group shrink-0 sm:shrink" {...prefetchProps(s.href)}>
              <div className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 active:scale-[0.95] w-[72px] sm:w-auto ${s.glow}`}>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg} ring-1 ${s.ring} transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <s.icon className={`h-4.5 w-4.5 ${s.color}`} />
                </div>
                <span className="text-[9px] sm:text-[10px] font-semibold text-center text-foreground/80 leading-tight w-full line-clamp-2">{s.title}</span>
              </div>
            </Link>
          ))}
        </div>
        <div className="pointer-events-none absolute end-0 top-0 bottom-2 w-10 bg-gradient-to-l from-background to-transparent sm:hidden" />
      </div>
    </div>
  );
});

/* ── Achievements Summary ── */
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
    { icon: Trophy, label: isAr ? "مسابقات" : "Competitions", value: data.competitions, color: "text-primary", bg: "bg-primary/10", border: "border-s-primary/60" },
    { icon: Award, label: isAr ? "شهادات" : "Certificates", value: data.certificates, color: "text-chart-3", bg: "bg-chart-3/10", border: "border-s-chart-3/60" },
    { icon: Star, label: isAr ? "شارات" : "Badges", value: data.badges, color: "text-chart-4", bg: "bg-chart-4/10", border: "border-s-chart-4/60" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {items.map((item) => (
        <Card key={item.label} className={`border-s-[3px] ${item.border} rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] group`}>
          <CardContent className="flex items-center gap-3 p-3.5 sm:p-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.bg} border border-border/20 transition-transform duration-300 group-hover:scale-110`}>
              <item.icon className={`h-4.5 w-4.5 ${item.color}`} />
            </div>
            <div>
              <AnimatedCounter value={item.value} className="text-2xl font-black tabular-nums" />
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-tight font-medium">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
