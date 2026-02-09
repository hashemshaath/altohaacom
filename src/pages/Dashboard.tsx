import { useLanguage } from "@/i18n/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Users, GraduationCap, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { UpcomingCompetitionsWidget } from "@/components/dashboard/UpcomingCompetitionsWidget";
import { RecentActivityWidget } from "@/components/dashboard/RecentActivityWidget";
import { QuickStatsWidget } from "@/components/dashboard/QuickStatsWidget";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const sections = [
    { icon: Users, title: t("communityTitle"), badge: null, href: "/community" },
    { icon: Trophy, title: t("competitionsTitle"), badge: null, href: "/competitions" },
    { icon: GraduationCap, title: t("masterclassesTitle"), badge: t("comingSoon"), href: "#" },
    { icon: ShoppingBag, title: t("shopTitle"), badge: t("comingSoon"), href: "#" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex-1 py-8">
        <h1 className="mb-8 font-serif text-3xl font-bold">{t("home")}</h1>

        {/* Quick Stats (only for logged-in users) */}
        {user && (
          <div className="mb-8">
            <QuickStatsWidget />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Upcoming Competitions */}
          <div className="lg:col-span-2">
            <UpcomingCompetitionsWidget />
          </div>

          {/* Right Column - Recent Activity */}
          <div>
            <RecentActivityWidget />
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">
            {t("quickLinks")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sections.map((s) => (
              <Link key={s.title} to={s.href}>
                <Card className="group cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <s.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{s.title}</h3>
                    </div>
                    {s.badge && <Badge variant="secondary">{s.badge}</Badge>}
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
