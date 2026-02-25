import { lazy, Suspense, useEffect, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Users, GraduationCap, Landmark, MessageSquare, ShoppingBag, Sparkles, Award, Star, UtensilsCrossed, HandHeart, AlertCircle, Megaphone, ClipboardList, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { useAwardPoints } from "@/hooks/useAwardPoints";
import { DashboardWidgetSkeleton } from "@/components/dashboard/DashboardWidgetSkeleton";
import { DashboardLayoutControl, useDashboardLayout } from "@/components/dashboard/DashboardLayoutControl";

// Lazy-loaded widgets
const UpcomingCompetitionsWidget = lazy(() => import("@/components/dashboard/UpcomingCompetitionsWidget").then(m => ({ default: m.UpcomingCompetitionsWidget })));
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

function W({ children, lines }: { children: React.ReactNode; lines?: number }) {
  return <Suspense fallback={<DashboardWidgetSkeleton lines={lines} />}>{children}</Suspense>;
}

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const { widgets, toggleWidget, resetLayout, isVisible } = useDashboardLayout();

  const { data: profile } = useQuery({
    queryKey: ["dashboard-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, username, profile_completed")
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

  const firstName = profile?.full_name?.split(" ")[0] || "";
  const greeting = isAr
    ? `مرحباً${firstName ? ` ${firstName}` : ""}`
    : `Welcome back${firstName ? `, ${firstName}` : ""}`;

  const sections = [
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
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead title="Dashboard" description="Your personal Altoha dashboard" />
      <Header />
      <main className="container flex-1 py-4 md:py-6">
        {/* Welcome Banner */}
        <WelcomeBanner greeting={greeting} isAr={isAr} widgets={widgets} toggleWidget={toggleWidget} resetLayout={resetLayout} />

        {/* Profile Completion Nudge */}
        {user && profile && !profile.profile_completed && <ProfileNudge isAr={isAr} />}

        {/* Quick Navigation */}
        <QuickAccessGrid sections={sections} isAr={isAr} />

        {/* Quick Stats */}
        {user && isVisible("quick-stats") && (
          <div className="mb-8"><W lines={1}><QuickStatsWidget /></W></div>
        )}

        {/* Achievements Summary */}
        {user && isVisible("achievements") && (
          <div className="mb-8"><AchievementsSummary userId={user.id} isAr={isAr} /></div>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {isVisible("competitions") && <W><UpcomingCompetitionsWidget /></W>}
            {isVisible("exhibitions") && <W><UpcomingExhibitionsWidget /></W>}
            {user && isVisible("masterclass") && <W><MasterclassProgressWidget /></W>}
          </div>
          <div className="space-y-6">
            {user && isVisible("profile-insights") && <W><ProfileInsightsWidget /></W>}
            {user && isVisible("progress-report") && <W><ProgressReportWidget /></W>}
            {user && isVisible("engagement") && <W><EngagementAnalyticsWidget /></W>}
            {user && isVisible("notification-activity") && <W><NotificationActivityWidget /></W>}
            {user && isVisible("content-stats") && <W><ContentStatsWidget /></W>}
            {user && isVisible("referral") && <W><ReferralWidget /></W>}
            {user && isVisible("chef-schedule") && <W><ChefScheduleWidget /></W>}
            {user && isVisible("events-calendar") && <W><EventsCalendarWidget /></W>}
            {user && isVisible("notification-prefs") && <W><NotificationPreferencesWidget /></W>}
            {user && isVisible("notifications") && <W><NotificationsSummaryWidget /></W>}
            {isVisible("activity") && <W><RecentActivityWidget /></W>}
            {user && <W><DashboardPersonalizationWidget /></W>}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ---------- Sub-Components ---------- */

function WelcomeBanner({ greeting, isAr, widgets, toggleWidget, resetLayout }: {
  greeting: string; isAr: boolean;
  widgets: any[]; toggleWidget: (id: string) => void; resetLayout: () => void;
}) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 sm:p-6 md:p-8 group shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20">
      <div className="pointer-events-none absolute -end-16 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-[80px] animate-pulse" />
      <div className="pointer-events-none absolute -start-8 -bottom-8 h-36 w-36 rounded-full bg-accent/15 blur-[60px] animate-pulse [animation-delay:2s]" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-2 ring-primary/10 shadow-inner transition-transform duration-300 group-hover:scale-105">
            <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-primary animate-pulse" />
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground truncate">{greeting} 👋</h1>
            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground font-medium line-clamp-1 sm:line-clamp-none">
              {isAr ? "إليك ملخص نشاطك ومسابقاتك القادمة" : "Your culinary milestones await below."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DashboardLayoutControl widgets={widgets} toggleWidget={toggleWidget} resetLayout={resetLayout} />
          <Link to="/profile?tab=edit">
            <Button variant="secondary" size="sm" className="gap-1.5 shadow-sm rounded-xl text-xs sm:text-sm">
              <span className="hidden sm:inline">{isAr ? "إدارة الملف" : "Manage Profile"}</span>
              <span className="sm:hidden">{isAr ? "الملف" : "Profile"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProfileNudge({ isAr }: { isAr: boolean }) {
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
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

function QuickAccessGrid({ sections, isAr }: { sections: Array<{ icon: any; title: string; href: string; color: string; bg: string; ring: string; glow: string }>; isAr: boolean }) {
  return (
    <div className="mb-8">
      <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
        <Sparkles className="h-3 w-3 text-primary" />
        {isAr ? "الوصول السريع" : "Quick Access"}
      </h2>
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 sm:grid sm:grid-cols-5 lg:grid-cols-10 sm:overflow-visible" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {sections.map((s) => (
            <Link key={s.title} to={s.href} className="group shrink-0 sm:shrink">
              <div className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm transition-all duration-200 hover:shadow-md hover:border-border/60 active:scale-[0.92] w-[68px] sm:w-auto ${s.glow}`}>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg} ring-1 ${s.ring} transition-all duration-200 group-hover:scale-105`}>
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
}

function AchievementsSummary({ userId, isAr }: { userId: string; isAr: boolean }) {
  const { data } = useQuery({
    queryKey: ["dashboard-achievements", userId],
    queryFn: async (): Promise<{ certificates: number; competitions: number; badges: number }> => {
      const [certsRes, regsRes, badgesRes] = await Promise.all([
        (supabase as any).from("certificates").select("id").eq("recipient_id", userId),
        (supabase as any).from("competition_registrations").select("id").eq("participant_id", userId),
        (supabase as any).from("user_badges").select("id").eq("user_id", userId),
      ]);
      return {
        certificates: certsRes.data?.length || 0,
        competitions: regsRes.data?.length || 0,
        badges: badgesRes.data?.length || 0,
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
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {items.map((item) => (
        <Card key={item.label} className={`border-s-[3px] ${item.border} transition-all duration-200 hover:shadow-md active:scale-[0.97] group`}>
          <CardContent className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-4">
            <div className={`hidden xs:flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.bg} sm:flex`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums">{item.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-tight">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}