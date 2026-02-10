import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMentorshipProgram } from "@/hooks/useMentorship";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { GraduationCap, Clock, Users, ArrowLeft, HandHeart, Target, CheckCircle } from "lucide-react";

export default function MentorshipDetail() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const { data: program, isLoading } = useMentorshipProgram(id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-64 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-xl font-bold">{isAr ? "البرنامج غير موجود" : "Program not found"}</h2>
          <Link to="/mentorship">
            <Button variant="outline" className="mt-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              {isAr ? "العودة" : "Go Back"}
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead title={`${program.title} - Altohaa`} description={program.description || ""} />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/90 via-primary to-chart-3/80 py-12 text-primary-foreground">
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary-foreground/10 blur-3xl" />
          <div className="container relative z-10 mx-auto px-4">
            <Link to="/mentorship" className="inline-flex items-center gap-1 text-sm text-primary-foreground/70 hover:text-primary-foreground mb-4">
              <ArrowLeft className="h-3 w-3" />
              {isAr ? "العودة للبرامج" : "Back to Programs"}
            </Link>
            <h1 className="text-3xl font-bold">{isAr ? program.title_ar || program.title : program.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground">
                <Clock className="h-3 w-3 me-1" />
                {program.duration_weeks} {isAr ? "أسابيع" : "weeks"}
              </Badge>
              <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground">
                <Users className="h-3 w-3 me-1" />
                {isAr ? `${program.max_matches} حد أقصى` : `Max ${program.max_matches} matches`}
              </Badge>
              <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground capitalize">
                {program.category}
              </Badge>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{isAr ? "عن البرنامج" : "About the Program"}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">
                  {isAr ? program.description_ar || program.description || "لا يوجد وصف" : program.description || "No description available"}
                </p>
              </CardContent>
            </Card>

            {program.requirements && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-chart-2" />
                    {isAr ? "المتطلبات" : "Requirements"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {isAr ? program.requirements_ar || program.requirements : program.requirements}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="border-primary/20">
              <CardContent className="py-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mx-auto">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold">{isAr ? "انضم كمتعلم" : "Join as Mentee"}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isAr ? "سجل في البرنامج وسيتم ربطك بمرشد" : "Enroll and get matched with an experienced mentor"}
                  </p>
                </div>
                {user ? (
                  <Button className="w-full gap-2">
                    <Target className="h-4 w-4" />
                    {isAr ? "التسجيل كمتعلم" : "Enroll as Mentee"}
                  </Button>
                ) : (
                  <Link to="/auth">
                    <Button variant="outline" className="w-full">
                      {isAr ? "سجل الدخول أولاً" : "Sign in to Enroll"}
                    </Button>
                  </Link>
                )}
                <Separator />
                <div className="text-center">
                  <h3 className="font-semibold">{isAr ? "هل أنت طاهٍ محترف؟" : "Are you an experienced chef?"}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isAr ? "تقدم كمرشد وساعد الآخرين" : "Apply as a mentor and help others grow"}
                  </p>
                </div>
                {user ? (
                  <Link to="/mentorship/apply">
                    <Button variant="outline" className="w-full gap-2">
                      <HandHeart className="h-4 w-4" />
                      {isAr ? "تقدم كمرشد" : "Apply as Mentor"}
                    </Button>
                  </Link>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
