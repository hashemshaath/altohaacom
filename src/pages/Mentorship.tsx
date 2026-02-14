import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useMentorshipPrograms, useMyMentorshipMatches, useMyMentorApplication } from "@/hooks/useMentorship";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  User,
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
        title={isAr ? "برنامج الإرشاد - الطهاة" : "Mentorship Program - Altohaa"}
        description={isAr ? "برنامج إرشاد الطهاة" : "Chef-to-student mentoring program"}
      />
      <Header />

      <main className="flex-1">
        {/* Hero - Premium */}
        <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/5 via-background to-chart-3/5">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80')] bg-fixed bg-cover bg-center opacity-[0.03] grayscale pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          
          <div className="absolute -top-40 start-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[120px] animate-pulse pointer-events-none" />
          <div className="absolute -bottom-20 end-1/3 h-72 w-72 rounded-full bg-chart-3/15 blur-[100px] animate-pulse [animation-delay:1.5s] pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <div className="container relative py-12 md:py-20">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between animate-fade-in">
              <div className="flex-1 space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 ring-1 ring-primary/20 backdrop-blur-sm shadow-inner transition-transform hover:scale-105">
                  <div className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    {isAr ? "برنامج التمكين المهني" : "Professional Empowerment Program"}
                  </span>
                </div>
                
                <div className="space-y-4">
                  <h1 className="font-serif text-4xl font-black tracking-tight md:text-6xl lg:text-7xl text-balance leading-[1.05]">
                    {isAr ? (
                      <>برنامج <span className="text-primary italic relative">الإرشاد<span className="absolute -bottom-2 inset-x-0 h-3 bg-primary/10 -rotate-2 -z-10" /></span> المهني</>
                    ) : (
                      <>Culinary <span className="text-primary italic relative">Mentorship<span className="absolute -bottom-2 inset-x-0 h-4 bg-primary/10 -rotate-1 -z-10" /></span> Hub</>
                    )}
                  </h1>
                  <p className="max-w-xl text-lg text-muted-foreground font-medium md:text-xl leading-relaxed">
                    {isAr
                      ? "تواصل مع طهاة محترفين للتعلم والنمو في رحلتك في الطهي."
                      : "Connect with experienced chefs to learn, grow, and advance your culinary journey."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  {user && !myApplication && (
                    <Link to="/mentorship/apply">
                      <Button size="lg" className="h-14 rounded-2xl px-10 font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                        <HandHeart className="me-2 h-5 w-5" />
                        {isAr ? "تقدم كمرشد" : "Apply as Mentor"}
                      </Button>
                    </Link>
                  )}
                  {myApplication && (
                    <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary px-6 py-3 text-sm font-bold rounded-2xl">
                      <Sparkles className="h-4 w-4 me-2 animate-pulse" />
                      {isAr ? `طلب الإرشاد: ${myApplication.status}` : `Mentor Application: ${myApplication.status}`}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-8 space-y-8">
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
                    {myMatches.map(match => {
                      const isMentor = match.mentor_id === user?.id;
                      const partnerProfile = isMentor ? match.mentee_profile : match.mentor_profile;
                      const partnerRole = isMentor ? (isAr ? "المتعلم" : "Mentee") : (isAr ? "المرشد" : "Mentor");
                      return (
                        <Link key={match.id} to={`/mentorship/match/${match.id}`}>
                          <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                            <CardContent className="flex items-center gap-4 pt-6">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={partnerProfile?.avatar_url || ""} />
                                <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium text-sm">{partnerProfile?.full_name || "Unknown"}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={statusColors[match.status] || ""}>{match.status}</Badge>
                                  <span className="text-xs text-muted-foreground">{partnerRole}</span>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {isAr ? "بدأ في" : "Started"} {match.matched_at ? new Date(match.matched_at).toLocaleDateString() : "N/A"}
                                </p>
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
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
