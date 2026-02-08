import { useLanguage } from "@/i18n/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Users, GraduationCap, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { t } = useLanguage();

  const sections = [
    { icon: Trophy, title: t("competitionsTitle"), badge: t("comingSoon") },
    { icon: Users, title: t("communityTitle"), badge: t("comingSoon") },
    { icon: GraduationCap, title: t("masterclassesTitle"), badge: t("comingSoon") },
    { icon: ShoppingBag, title: t("shopTitle"), badge: t("comingSoon") },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex-1 py-8">
        <h1 className="mb-8 font-serif text-3xl font-bold">{t("home")}</h1>
        <div className="grid gap-6 sm:grid-cols-2">
          {sections.map((s) => (
            <Card key={s.title} className="group cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-full bg-primary/10 p-3">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{s.title}</h3>
                </div>
                <Badge variant="secondary">{s.badge}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
