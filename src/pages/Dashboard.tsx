import { useLanguage } from "@/i18n/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Users, GraduationCap, Landmark, Newspaper, MessageSquare, ShoppingBag, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { UpcomingCompetitionsWidget } from "@/components/dashboard/UpcomingCompetitionsWidget";
import { RecentActivityWidget } from "@/components/dashboard/RecentActivityWidget";
import { QuickStatsWidget } from "@/components/dashboard/QuickStatsWidget";
import { MasterclassProgressWidget } from "@/components/dashboard/MasterclassProgressWidget";
import { NotificationsSummaryWidget } from "@/components/dashboard/NotificationsSummaryWidget";
import { UpcomingExhibitionsWidget } from "@/components/dashboard/UpcomingExhibitionsWidget";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";

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
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead title="Dashboard" description="Your personal Altohaa dashboard" />
      <Header />
      <main className="container flex-1 py-6 md:py-10">
        {/* Welcome Banner */}
        <Card className="mb-8 overflow-hidden border-primary/10 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-4 ring-primary/5">
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
          <div className="grid gap-2.5 grid-cols-3 sm:grid-cols-4 lg:grid-cols-7">
            {sections.map((s) => (
              <Link key={s.title} to={s.href}>
                <Card className="group h-full transition-all hover:shadow-md hover:-translate-y-1 border-border/50 hover:border-primary/20">
                  <CardContent className="flex flex-col items-center gap-2 p-3 text-center sm:p-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg} transition-transform group-hover:scale-110`}>
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

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <UpcomingCompetitionsWidget />
            <UpcomingExhibitionsWidget />
            {user && <MasterclassProgressWidget />}
          </div>
          <div className="space-y-6">
            {user && <NotificationsSummaryWidget />}
            <RecentActivityWidget />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
