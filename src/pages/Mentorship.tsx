import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useMentorshipPrograms, useMyMentorshipMatches, useMyMentorApplication } from "@/hooks/useMentorship";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import {
  GraduationCap,
  Users,
  Clock,
  ArrowRight,
  Sparkles,
  HandHeart,
  Target,
  BookOpen,
} from "lucide-react";

export default function Mentorship() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const { data: programs = [], isLoading } = useMentorshipPrograms("active");
  const { data: myMatches = [] } = useMyMentorshipMatches();
  const { data: myApplication } = useMyMentorApplication();

  const statusColors: Record<string, string> = {
    active: "bg-chart-2/10 text-chart-2 border-chart-2/20",
    pending: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    completed: "bg-primary/10 text-primary border-primary/20",
    cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title={isAr ? "برنامج الإرشاد - التُهاء" : "Mentorship Program - Altohaa"}
        description={isAr ? "برنامج إرشاد الطهاة" : "Chef-to-student mentoring program"}
      />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/90 via-primary to-chart-3/80 py-16 text-primary-foreground">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary-foreground/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-primary-foreground/5 blur-2xl" />
          <div className="container relative z-10 mx-auto px-4 text-center">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-primary-foreground/20 backdrop-blur-sm mb-4">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold md:text-4xl">
              {isAr ? "برنامج الإرشاد" : "Mentorship Program"}
            </h1>
            <p className="mt-3 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              {isAr
                ? "تواصل مع طهاة محترفين للتعلم والنمو في رحلتك الطهوية"
                : "Connect with experienced chefs to learn, grow, and advance your culinary journey"}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {user && !myApplication && (
                <Link to="/mentorship/apply">
                  <Button size="lg" variant="secondary" className="gap-2">
                    <HandHeart className="h-4 w-4" />
                    {isAr ? "تقدم كمرشد" : "Apply as Mentor"}
                  </Button>
                </Link>
              )}
              {myApplication && (
                <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground px-4 py-2">
                  <Sparkles className="h-3 w-3 me-1" />
                  {isAr ? `طلب الإرشاد: ${myApplication.status}` : `Mentor Application: ${myApplication.status}`}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 space-y-8">
          <Tabs defaultValue="programs">
            <TabsList>
              <TabsTrigger value="programs" className="gap-1.5">
                <BookOpen className="h-4 w-4" />
                {isAr ? "البرامج" : "Programs"}
              </TabsTrigger>
              {user && (
                <TabsTrigger value="my-mentorship" className="gap-1.5">
                  <Target className="h-4 w-4" />
                  {isAr ? "إرشادي" : "My Mentorship"}
                  {myMatches.length > 0 && (
                    <Badge variant="secondary" className="ms-1 text-[10px]">{myMatches.length}</Badge>
                  )}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="programs" className="mt-6">
              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map(i => (
                    <Card key={i}><CardContent className="py-8"><Skeleton className="h-40 w-full" /></CardContent></Card>
                  ))}
                </div>
              ) : programs.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-3">
                      <GraduationCap className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold">{isAr ? "لا توجد برامج متاحة حالياً" : "No programs available yet"}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isAr ? "تحقق لاحقاً للبرامج الجديدة" : "Check back later for new mentorship programs"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {programs.map(program => (
                    <Link key={program.id} to={`/mentorship/${program.id}`}>
                      <Card className="h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                        {program.cover_image_url && (
                          <div className="aspect-video overflow-hidden rounded-t-lg">
                            <img src={program.cover_image_url} alt={program.title} className="h-full w-full object-cover" />
                          </div>
                        )}
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{isAr ? program.title_ar || program.title : program.title}</CardTitle>
                            <Badge className={statusColors[program.status] || "bg-muted text-muted-foreground"}>
                              {program.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {isAr ? program.description_ar || program.description : program.description}
                          </p>
                          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {program.duration_weeks} {isAr ? "أسابيع" : "weeks"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {isAr ? `${program.max_matches} حد أقصى` : `Max ${program.max_matches}`}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center gap-1 text-sm font-medium text-primary">
                            {isAr ? "عرض التفاصيل" : "View Details"}
                            <ArrowRight className="h-3 w-3" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            {user && (
              <TabsContent value="my-mentorship" className="mt-6">
                {myMatches.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center py-16 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-3">
                        <HandHeart className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold">{isAr ? "لا توجد علاقات إرشاد بعد" : "No mentorship matches yet"}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {isAr ? "تصفح البرامج المتاحة وقدم طلبك" : "Browse available programs and apply"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {myMatches.map(match => (
                      <Link key={match.id} to={`/mentorship/match/${match.id}`}>
                        <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                          <CardContent className="flex items-center gap-4 pt-6">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                              <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge className={statusColors[match.status] || ""}>{match.status}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {match.mentor_id === user?.id
                                    ? isAr ? "أنت المرشد" : "You are Mentor"
                                    : isAr ? "أنت المتعلم" : "You are Mentee"}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {isAr ? "بدأ في" : "Started"} {match.matched_at ? new Date(match.matched_at).toLocaleDateString() : "N/A"}
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
