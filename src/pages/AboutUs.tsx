import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Info, Target, Eye, Heart, Globe, Trophy, Users, GraduationCap, ArrowRight } from "lucide-react";

export default function AboutUs() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const values = isAr ? [
    { icon: Trophy, title: "التميز", desc: "نسعى لتحقيق أعلى معايير الجودة في كل ما نقدمه لمجتمع الطهاة." },
    { icon: Users, title: "المجتمع", desc: "نؤمن بقوة التواصل والتعاون بين المحترفين في صناعة الطهي." },
    { icon: Heart, title: "الشغف", desc: "نشارك شغف الطهاة ونعمل على دعمهم في كل خطوة من مسيرتهم المهنية." },
    { icon: Globe, title: "العالمية", desc: "نربط الطهاة حول العالم ونوفر منصة عالمية للتنافس والتطور." },
    { icon: GraduationCap, title: "التعلم المستمر", desc: "نقدم فرص تعليمية متنوعة لتطوير المهارات والارتقاء بالمستوى المهني." },
  ] : [
    { icon: Trophy, title: "Excellence", desc: "We strive for the highest quality standards in everything we offer to the culinary community." },
    { icon: Users, title: "Community", desc: "We believe in the power of connection and collaboration among culinary professionals." },
    { icon: Heart, title: "Passion", desc: "We share chefs' passion and support them at every step of their professional journey." },
    { icon: Globe, title: "Global Reach", desc: "We connect chefs worldwide and provide a global platform for competition and growth." },
    { icon: GraduationCap, title: "Continuous Learning", desc: "We offer diverse educational opportunities to develop skills and advance professional levels." },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background" dir={isAr ? "rtl" : "ltr"}>
      <SEOHead title={isAr ? "من نحن" : "About Us"} description={isAr ? "تعرف على منصة الطهاة" : "Learn about Altohaa"} />
      <Header />
      <main className="flex-1">
        <section className="border-b border-border/40 bg-gradient-to-b from-primary/5 to-background">
          <div className="container py-10 md:py-14 max-w-5xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <Info className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">{isAr ? "من نحن" : "About Us"}</span>
            </div>
            <h1 className="font-serif text-3xl font-bold md:text-4xl">{isAr ? "عن منصة الطهاة" : "About Altohaa"}</h1>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              {isAr ? "المنصة الرائدة لمجتمع الطهي العالمي — نجمع الطهاة والحكام والمنظمين والرعاة في مكان واحد." : "The premier global culinary community platform — uniting chefs, judges, organizers, and sponsors in one place."}
            </p>
          </div>
        </section>

        <div className="container py-8 md:py-12 max-w-5xl space-y-10">
          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="py-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 mb-4">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-bold mb-2">{isAr ? "رسالتنا" : "Our Mission"}</h2>
                <p className="text-sm leading-7 text-muted-foreground">
                  {isAr
                    ? "تمكين الطهاة والمحترفين في صناعة الطهي من تطوير مهاراتهم والتنافس على المستوى العالمي والحصول على الاعتراف المهني الذي يستحقونه من خلال منصة رقمية متكاملة تربطهم بالفرص والموارد والمجتمع المهني."
                    : "Empowering chefs and culinary professionals to develop their skills, compete globally, and gain the professional recognition they deserve through an integrated digital platform connecting them with opportunities, resources, and a professional community."}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 mb-4">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-bold mb-2">{isAr ? "رؤيتنا" : "Our Vision"}</h2>
                <p className="text-sm leading-7 text-muted-foreground">
                  {isAr
                    ? "أن نكون المنصة العالمية الأولى لمجتمع الطهي، حيث يجد كل طاهٍ فرصته للتألق والنمو والتواصل مع أفضل العقول في صناعة الطهي حول العالم، مع الحفاظ على أصالة المطبخ العربي وتقاليده العريقة."
                    : "To be the world's leading culinary community platform where every chef finds their opportunity to shine, grow, and connect with the best minds in the culinary industry, while preserving the authenticity and rich traditions of Arab cuisine."}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Values */}
          <div>
            <h2 className="text-xl font-bold mb-5 text-center">{isAr ? "قيمنا" : "Our Values"}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {values.map((v, i) => (
                <Card key={i} className="transition-all hover:shadow-md hover:-translate-y-0.5">
                  <CardContent className="py-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-3">
                      <v.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1">{v.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="py-8 text-center">
              <h2 className="text-xl font-bold mb-2">{isAr ? "انضم إلى مجتمع الطهاة" : "Join the Altohaa Community"}</h2>
              <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
                {isAr ? "كن جزءاً من أكبر مجتمع طهي عربي وعالمي" : "Be part of the largest Arab and global culinary community"}
              </p>
              <Button asChild>
                <Link to="/register">{isAr ? "سجل الآن" : "Register Now"} <ArrowRight className="ms-2 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
