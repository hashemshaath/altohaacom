import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useMentorshipPrograms, useMyMentorshipMatches, useMyMentorApplication } from "@/hooks/useMentorship";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageShell } from "@/components/PageShell";
import { Input } from "@/components/ui/input";
import {
  GraduationCap, Users, Clock, ArrowRight, Sparkles,
  HandHeart, Target, BookOpen, User, Search,
} from "lucide-react";

export default function Mentorship() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
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
    <PageShell
      title={isAr ? "برنامج الإرشاد - الطهاة" : "Mentorship Program - Altoha"}
      description={isAr ? "برنامج إرشاد الطهاة" : "Chef-to-student mentoring program"}
      container={false}
      padding="none"
    >
      {/* Compact Hero */}
      <section className="border-b border-border/40 bg-gradient-to-b from-primary/5 to-background">
        <div className="container py-8 md:py-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 ring-1 ring-primary/20">
                <HandHeart className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  {isAr ? "التمكين المهني" : "Professional Empowerment"}
                </span>
              </div>
              <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
                {isAr ? "برنامج الإرشاد" : "Mentorship"}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                {isAr
                  ? "تواصل مع طهاة محترفين للتعلم والنمو في رحلتك في الطهي."
                  : "Connect with experienced chefs to learn, grow, and advance your culinary journey."}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {user && !myApplication && (
                <Link to="/mentorship/apply">
                  <Button className="shadow-sm shadow-primary/15">
                    <HandHeart className="me-1.5 h-4 w-4" />
                    {isAr ? "تقدم كمرشد" : "Apply as Mentor"}
                  </Button>
                </Link>
              )}
              {myApplication && (
                <Badge variant="outline" className="gap-1.5 border-primary/20 bg-primary/5 text-primary px-3 py-1.5">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  {isAr ? `طلب: ${myApplication.status}` : `Application: ${myApplication.status}`}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container py-4 md:py-6 space-y-8">
        <Tabs defaultValue="programs">
          <div className="sticky top-12 z-40 -mx-4 border-y border-border/40 bg-background/80 px-4 py-3 backdrop-blur-md md:rounded-2xl md:border md:mx-0 md:px-6 space-y-3">
            <div className="relative max-w-md">
              <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <Input placeholder={isAr ? "ابحث عن برنامج..." : "Search programs..."} value={search} onChange={e => setSearch(e.target.value)} className="h-11 border-border/40 bg-muted/20 ps-11 transition-all focus:bg-background focus:ring-primary/20 rounded-xl" />
            </div>
            <TabsList className="h-auto w-full justify-start gap-1.5 overflow-x-auto bg-transparent p-0 no-scrollbar">
              <TabsTrigger value="programs" className="gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 hover:bg-primary/5 hover:text-primary">
                <BookOpen className="h-3.5 w-3.5" />
                {isAr ? "البرامج" : "Programs"}
              </TabsTrigger>
              {user && (
                <TabsTrigger value="my-mentorship" className="gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 hover:bg-primary/5 hover:text-primary">
                  <Target className="h-3.5 w-3.5" />
                  {isAr ? "إرشادي" : "My Mentorship"}
                  {myMatches.length > 0 && (
                    <Badge variant="secondary" className="ms-1 text-[10px]">{myMatches.length}</Badge>
                  )}
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="programs" className="mt-6">
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => (
                  <Card key={i}><CardContent className="py-8"><Skeleton className="h-40 w-full" /></CardContent></Card>
                ))}
              </div>
            ) : (() => {
              const filteredPrograms = programs.filter(p => {
                if (!search) return true;
                const q = search.toLowerCase();
                return p.title?.toLowerCase().includes(q) || p.title_ar?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
              });
              return filteredPrograms.length === 0 ? (
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
                {filteredPrograms.map(program => (
                  <Link key={program.id} to={`/mentorship/${program.id}`}>
                    <Card className="group h-full overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:border-primary/30 hover:bg-card">
                      {program.cover_image_url && (
                        <div className="aspect-video overflow-hidden bg-muted relative">
                          <img src={program.cover_image_url} alt={program.title} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" loading="lazy" />
                          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                        </div>
                      )}
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h3 className="text-base font-bold leading-tight group-hover:text-primary transition-colors duration-300">
                            {isAr ? program.title_ar || program.title : program.title}
                          </h3>
                          <Badge variant="outline" className={`shrink-0 text-[10px] font-bold ${statusColors[program.status] || "bg-muted text-muted-foreground"}`}>
                            {program.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                          {isAr ? program.description_ar || program.description : program.description}
                        </p>
                        <div className="flex items-center justify-between border-t border-border/40 pt-4">
                          <div className="flex items-center gap-4 text-[11px] font-bold text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3 text-primary" />
                              {program.duration_weeks} {isAr ? "أسابيع" : "weeks"}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Users className="h-3 w-3 text-chart-2" />
                              {isAr ? `${program.max_matches} حد أقصى` : `Max ${program.max_matches}`}
                            </span>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            );
            })()}
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
    </PageShell>
  );
}
