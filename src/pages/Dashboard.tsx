import { useLanguage } from "@/i18n/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Users, GraduationCap, Landmark, MessageSquare, ShoppingBag, Sparkles, Award, Star, UtensilsCrossed, HandHeart, AlertCircle, Megaphone, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import { UpcomingCompetitionsWidget } from "@/components/dashboard/UpcomingCompetitionsWidget";
import { RecentActivityWidget } from "@/components/dashboard/RecentActivityWidget";
import { ReferralWidget } from "@/components/dashboard/ReferralWidget";
import { QuickStatsWidget } from "@/components/dashboard/QuickStatsWidget";
import { MasterclassProgressWidget } from "@/components/dashboard/MasterclassProgressWidget";
import { ArrowRight } from "lucide-react";
import { NotificationsSummaryWidget } from "@/components/dashboard/NotificationsSummaryWidget";
import { UpcomingExhibitionsWidget } from "@/components/dashboard/UpcomingExhibitionsWidget";
import { EventsCalendarWidget } from "@/components/dashboard/EventsCalendarWidget";
import { ChefScheduleWidget } from "@/components/dashboard/ChefScheduleWidget";
import { ContentStatsWidget } from "@/components/dashboard/ContentStatsWidget";
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
        .select("full_name, username, profile_completed")
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
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const firstName = profile?.full_name?.split(" ")[0] || "";
  const greeting = isAr
    ? `مرحباً${firstName ? ` ${firstName}` : ""}`
    : `Welcome back${firstName ? `, ${firstName}` : ""}`;

  const sections = [
    { icon: Trophy, title: isAr ? "المسابقات" : "Competitions", href: "/competitions", color: "text-primary", bg: "bg-primary/10", ring: "ring-primary/15", glow: "group-hover:shadow-primary/10" },
    { icon: Users, title: isAr ? "المجتمع" : "Community", href: "/community", color: "text-chart-2", bg: "bg-chart-2/10", ring: "ring-chart-2/15", glow: "group-hover:shadow-chart-2/10" },
    { icon: GraduationCap, title: isAr ? "الدورات" : "Courses", href: "/masterclasses", color: "text-chart-3", bg: "bg-chart-3/10", ring: "ring-chart-3/15", glow: "group-hover:shadow-chart-3/10" },
    { icon: Landmark, title: isAr ? "المعارض" : "Exhibitions", href: "/exhibitions", color: "text-chart-5", bg: "bg-chart-5/10", ring: "ring-chart-5/15", glow: "group-hover:shadow-chart-5/10" },
    { icon: UtensilsCrossed, title: isAr ? "الوصفات" : "Recipes", href: "/recipes", color: "text-chart-4", bg: "bg-chart-4/10", ring: "ring-chart-4/15", glow: "group-hover:shadow-chart-4/10" },
    { icon: HandHeart, title: isAr ? "الإرشاد" : "Mentorship", href: "/mentorship", color: "text-chart-1", bg: "bg-chart-1/10", ring: "ring-chart-1/15", glow: "group-hover:shadow-chart-1/10" },
    { icon: ShoppingBag, title: isAr ? "المتجر" : "Shop", href: "/shop", color: "text-primary", bg: "bg-primary/8", ring: "ring-primary/10", glow: "group-hover:shadow-primary/10" },
    { icon: MessageSquare, title: isAr ? "الرسائل" : "Messages", href: "/messages", color: "text-chart-2", bg: "bg-chart-2/10", ring: "ring-chart-2/15", glow: "group-hover:shadow-chart-2/10" },
    { icon: ClipboardList, title: isAr ? "طلباتي" : "My Orders", href: "/shop/orders", color: "text-chart-3", bg: "bg-chart-3/10", ring: "ring-chart-3/15", glow: "group-hover:shadow-chart-3/10" },
    { icon: Megaphone, title: isAr ? "أعلن معنا" : "Advertise", href: "/advertise", color: "text-chart-4", bg: "bg-chart-4/10", ring: "ring-chart-4/15", glow: "group-hover:shadow-chart-4/10" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead title="Dashboard" description="Your personal Altoha dashboard" />
      <Header />
      <main className="container flex-1 py-4 md:py-6">
        {/* Welcome Banner */}
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 sm:p-8 group shadow-sm transition-all duration-500 hover:shadow-lg hover:border-primary/20">
          <div className="pointer-events-none absolute -end-24 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-[100px] animate-pulse" />
          <div className="pointer-events-none absolute -start-10 -bottom-10 h-48 w-48 rounded-full bg-accent/15 blur-[80px] animate-pulse [animation-delay:2s]" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-4 ring-primary/5 shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold sm:text-3xl md:text-4xl tracking-tight text-foreground">{greeting} 👋</h1>
                <p className="mt-1.5 text-sm text-muted-foreground font-medium max-w-md">
                  {isAr
                    ? "إليك ملخص نشاطك ومسابقاتك القادمة"
                    : "Discover your progress and upcoming culinary milestones below."}
                </p>
              </div>
            </div>
            <Link to="/profile?tab=edit">
              <Button variant="secondary" className="gap-2 shadow-sm rounded-xl">
                {isAr ? "إدارة الملف الشخصي" : "Manage Profile"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Profile Completion Nudge */}
        {user && profile && !profile.profile_completed && (
          <div className="mb-8 animate-fade-in">
            <Link to="/onboarding">
              <Card className="group border-chart-4/30 bg-gradient-to-r from-chart-4/5 to-transparent transition-all hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-4/10 ring-2 ring-chart-4/20">
                    <AlertCircle className="h-5 w-5 text-chart-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{isAr ? "أكمل ملفك الشخصي" : "Complete Your Profile"}</p>
                    <p className="text-xs text-muted-foreground">{isAr ? "أكمل معلوماتك لفتح جميع المزايا" : "Finish setting up your profile to unlock all features"}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        {/* Quick Navigation - Premium Pill Grid */}
        <div className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {isAr ? "الوصول السريع" : "Quick Access"}
          </h2>
          <div className="grid grid-cols-5 gap-2 sm:gap-3 md:grid-cols-5 lg:grid-cols-10">
            {sections.map((s) => (
              <Link key={s.title} to={s.href} className="group">
                <Card className={`h-full border-border/30 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-border/50 hover:bg-card active:scale-95 ${s.glow}`}>
                  <CardContent className="flex flex-col items-center gap-2 p-3 sm:p-4 text-center">
                    <div className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl ${s.bg} ring-1 ${s.ring} transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
                      <s.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${s.color} transition-transform duration-300 group-hover:scale-110`} />
                    </div>
                    <span className="text-[10px] font-semibold tracking-tight sm:text-xs text-foreground/80 group-hover:text-foreground transition-colors leading-tight">{s.title}</span>
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
            {user && <ContentStatsWidget />}
            {user && <ReferralWidget />}
            {user && <ChefScheduleWidget />}
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
