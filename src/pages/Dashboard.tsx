import { useLanguage } from "@/i18n/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Users, GraduationCap, Landmark, Newspaper, MessageSquare, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { UpcomingCompetitionsWidget } from "@/components/dashboard/UpcomingCompetitionsWidget";
import { RecentActivityWidget } from "@/components/dashboard/RecentActivityWidget";
import { QuickStatsWidget } from "@/components/dashboard/QuickStatsWidget";
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
    ? `مرحباً${firstName ? ` ${firstName}` : ""} 👋`
    : `Welcome back${firstName ? `, ${firstName}` : ""} 👋`;

  const sections = [
    { icon: Trophy, title: t("competitionsTitle"), href: "/competitions" },
    { icon: Users, title: t("communityTitle"), href: "/community" },
    { icon: GraduationCap, title: t("masterclassesTitle"), href: "/masterclasses" },
    { icon: Landmark, title: t("exhibitions") || "Exhibitions", href: "/exhibitions" },
    { icon: Newspaper, title: t("news") || "News", href: "/news" },
    { icon: MessageSquare, title: isAr ? "الرسائل" : "Messages", href: "/messages" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead title="Dashboard" description="Your personal Altohaa dashboard" />
      <Header />
      <main className="container flex-1 py-6 md:py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-serif text-2xl font-bold md:text-3xl">{greeting}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAr
              ? "إليك ملخص نشاطك ومسابقاتك القادمة"
              : "Here's a summary of your activity and upcoming competitions"}
          </p>
        </div>

        {/* Quick Stats */}
        {user && (
          <div className="mb-8">
            <QuickStatsWidget />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <UpcomingCompetitionsWidget />
          </div>
          <div>
            <RecentActivityWidget />
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mt-10">
          <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {t("quickLinks")}
          </h2>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {sections.map((s) => (
              <Link key={s.title} to={s.href}>
                <Card className="group h-full transition-all hover:shadow-sm hover:-translate-y-0.5">
                  <CardContent className="flex flex-col items-center gap-2.5 p-4 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                      <s.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-xs font-medium leading-tight">{s.title}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
