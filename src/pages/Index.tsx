import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Trophy, GraduationCap, ShoppingBag } from "lucide-react";

const Index = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const features = [
    { icon: Users, title: t("communityTitle"), desc: t("communityDesc") },
    { icon: Trophy, title: t("competitionsTitle"), desc: t("competitionsDesc") },
    { icon: GraduationCap, title: t("masterclassesTitle"), desc: t("masterclassesDesc") },
    { icon: ShoppingBag, title: t("shopTitle"), desc: t("shopDesc") },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container flex flex-col items-center py-24 text-center md:py-32">
          <img src="/altohaa-logo.png" alt="Altohaa" className="mb-6 h-24 w-auto md:h-32" />
          <h1 className="mb-4 font-serif text-4xl font-bold tracking-tight md:text-6xl">
            Altohaa
          </h1>
          <p className="mb-2 font-serif text-xl text-primary md:text-2xl">
            {t("heroTitle")}
          </p>
          <p className="mb-8 max-w-2xl text-muted-foreground md:text-lg">
            {t("heroSubtitle")}
          </p>
          <div className="flex gap-3">
            {user ? (
              <Button size="lg" asChild>
                <Link to="/dashboard">{t("home")}</Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link to="/auth?tab=signup">{t("joinNow")}</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/auth">{t("signIn")}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16 md:py-24">
        <h2 className="mb-12 text-center font-serif text-3xl font-bold md:text-4xl">
          {t("featuresTitle")}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="group transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 rounded-full bg-primary/10 p-3">
                  <f.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="flex-1" />
      <Footer />
    </div>
  );
};

export default Index;
