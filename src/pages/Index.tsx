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

      {/* Hero with vibrant gradient */}
      <section className="relative overflow-hidden">
        {/* Background gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary)/0.15),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(var(--accent)/0.15),_transparent_50%)]" />
        
        {/* Animated accent blobs */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl animate-pulse delay-1000" />
        
        <div className="container relative flex flex-col items-center py-24 text-center md:py-32">
          <div className="mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 p-4 ring-1 ring-primary/20">
            <img src="/altohaa-logo.png" alt="Altohaa" className="h-20 w-auto md:h-28" />
          </div>
          <h1 className="mb-4 font-serif text-4xl font-bold tracking-tight md:text-6xl">
            <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              Altohaa
            </span>
          </h1>
          <p className="mb-2 font-serif text-xl text-primary md:text-2xl">
            {t("heroTitle")}
          </p>
          <p className="mb-8 max-w-2xl text-muted-foreground md:text-lg">
            {t("heroSubtitle")}
          </p>
          <div className="flex gap-3">
            {user ? (
              <Button size="lg" className="group transition-all duration-300 hover:shadow-lg hover:shadow-primary/25" asChild>
                <Link to="/dashboard">
                  {t("home")}
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" className="group transition-all duration-300 hover:shadow-lg hover:shadow-primary/25" asChild>
                  <Link to="/auth?tab=signup">{t("joinNow")}</Link>
                </Button>
                <Button size="lg" variant="outline" className="transition-all duration-300 hover:border-accent hover:text-accent" asChild>
                  <Link to="/auth">{t("signIn")}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features with enhanced cards */}
      <section className="container py-16 md:py-24">
        <h2 className="mb-12 text-center font-serif text-3xl font-bold md:text-4xl">
          <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {t("featuresTitle")}
          </span>
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <Card 
              key={f.title} 
              className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              {/* Gradient hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              
              <CardContent className="relative flex flex-col items-center p-6 text-center">
                <div className="mb-4 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 p-3 ring-1 ring-primary/10 transition-all duration-300 group-hover:ring-primary/30 group-hover:shadow-lg group-hover:shadow-primary/10">
                  <f.icon className="h-7 w-7 text-primary transition-transform duration-300 group-hover:scale-110" />
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
