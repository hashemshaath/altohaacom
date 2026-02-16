import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Trophy, Medal, Award, Star, Calendar, ChefHat, TrendingUp, Target, BarChart3 } from "lucide-react";
import { countryFlag } from "@/lib/countryFlag";
import { format } from "date-fns";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function ChefPortfolio() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const targetUserId = userId || user?.id;

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["portfolio-profile", targetUserId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", targetUserId!).single();
      return data;
    },
    enabled: !!targetUserId,
  });

  const { data: registrations } = useQuery({
    queryKey: ["portfolio-registrations", targetUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("competition_registrations")
        .select("*, competitions(id, title, title_ar, competition_start, competition_end, status, country_code, cover_image_url)")
        .eq("participant_id", targetUserId!)
        .order("registered_at", { ascending: false });
      return data || [];
    },
    enabled: !!targetUserId,
  });

  const { data: scores } = useQuery({
    queryKey: ["portfolio-scores", targetUserId],
    queryFn: async () => {
      // Get registrations first, then scores via registration_id
      const { data: regs } = await supabase
        .from("competition_registrations")
        .select("id, competitions(title)")
        .eq("participant_id", targetUserId!);
      if (!regs?.length) return [];
      const regIds = regs.map(r => r.id);
      const regMap = Object.fromEntries(regs.map(r => [r.id, r]));
      const { data: scoreData } = await supabase
        .from("competition_scores")
        .select("score, registration_id")
        .in("registration_id", regIds);
      return (scoreData || []).map(s => ({
        ...s,
        compTitle: (regMap[s.registration_id] as any)?.competitions?.title || "Unknown",
      }));
    },
    enabled: !!targetUserId,
  });

  const { data: certificates } = useQuery({
    queryKey: ["portfolio-certificates", targetUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("certificates")
        .select("*")
        .eq("recipient_id", targetUserId!)
        .eq("status", "issued")
        .order("issued_at", { ascending: false });
      return data || [];
    },
    enabled: !!targetUserId,
  });

  const { data: ranking } = useQuery({
    queryKey: ["portfolio-ranking", targetUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("chef_rankings")
        .select("*")
        .eq("user_id", targetUserId!)
        .eq("ranking_period", "all_time")
        .maybeSingle();
      return data;
    },
    enabled: !!targetUserId,
  });

  if (profileLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container flex-1 py-8">
          <Skeleton className="h-48 w-full rounded-xl mb-6" />
          <div className="grid gap-4 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        </main>
        <Footer />
      </div>
    );
  }

  const totalComps = registrations?.length || 0;
  const approvedComps = registrations?.filter(r => r.status === "approved").length || 0;
  const avgScore = scores?.length ? (scores.reduce((s: number, sc: any) => s + Number(sc.score), 0) / scores.length).toFixed(1) : "—";
  const totalCerts = certificates?.length || 0;

  // Score distribution for chart
  const scoresByComp = scores?.reduce((acc: Record<string, number[]>, s: any) => {
    const title = s.compTitle || "Unknown";
    if (!acc[title]) acc[title] = [];
    acc[title].push(Number(s.score));
    return acc;
  }, {} as Record<string, number[]>) || {};

  const scoreChartData = Object.entries(scoresByComp).map(([name, vals]) => ({
    name: name.length > 15 ? name.substring(0, 15) + "..." : name,
    avg: Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)),
  }));

  // Radar data for performance dimensions
  const radarData = [
    { subject: isAr ? "المشاركات" : "Competitions", value: Math.min(totalComps * 20, 100) },
    { subject: isAr ? "الدرجات" : "Scores", value: scores?.length ? Number(avgScore) : 0 },
    { subject: isAr ? "الشهادات" : "Certificates", value: Math.min(totalCerts * 25, 100) },
    { subject: isAr ? "الميداليات" : "Medals", value: Math.min((ranking?.gold_medals || 0) * 30 + (ranking?.silver_medals || 0) * 20 + (ranking?.bronze_medals || 0) * 10, 100) },
    { subject: isAr ? "الاتساق" : "Consistency", value: ranking?.average_score || 0 },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead title={`${profile?.full_name || "Chef"} - Portfolio`} description="Professional chef competition portfolio" />
      <Header />
      <main className="flex-1">
        {/* Profile Hero */}
        <section className="border-b border-border/40 bg-gradient-to-b from-primary/5 to-background">
          <div className="container py-8 sm:py-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="h-24 w-24 rounded-2xl overflow-hidden bg-muted ring-4 ring-primary/10 shrink-0">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center"><ChefHat className="h-10 w-10 text-muted-foreground/20" /></div>
                )}
              </div>
              <div className="text-center sm:text-start">
                <h1 className="text-2xl sm:text-3xl font-bold">{profile?.full_name || "—"}</h1>
                {profile?.job_title && <p className="text-sm text-muted-foreground mt-1">{profile.job_title}</p>}
                <div className="flex items-center gap-3 mt-3 justify-center sm:justify-start flex-wrap">
                  {profile?.country_code && <Badge variant="outline" className="text-xs">{countryFlag(profile.country_code)} {profile.country_code}</Badge>}
                  {ranking?.rank && <Badge className="text-xs bg-primary/10 text-primary">#{ranking.rank} {isAr ? "عالمياً" : "Global"}</Badge>}
                  {ranking && (
                    <div className="flex gap-1">
                      {ranking.gold_medals > 0 && <span className="text-sm">🥇{ranking.gold_medals}</span>}
                      {ranking.silver_medals > 0 && <span className="text-sm">🥈{ranking.silver_medals}</span>}
                      {ranking.bronze_medals > 0 && <span className="text-sm">🥉{ranking.bronze_medals}</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container py-8">
          {/* Stats */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 mb-8">
            {[
              { icon: Trophy, label: isAr ? "المسابقات" : "Competitions", value: totalComps, color: "text-primary" },
              { icon: Star, label: isAr ? "متوسط الدرجة" : "Avg Score", value: avgScore, color: "text-chart-4" },
              { icon: Award, label: isAr ? "الشهادات" : "Certificates", value: totalCerts, color: "text-chart-5" },
              { icon: TrendingUp, label: isAr ? "النقاط" : "Total Points", value: ranking?.total_points || 0, color: "text-chart-3" },
            ].map((stat, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 shrink-0">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-bold">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Competition History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    {isAr ? "سجل المسابقات" : "Competition History"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {registrations?.length ? (
                    <div className="space-y-3">
                      {registrations.map((reg) => {
                        const comp = reg.competitions as any;
                        return (
                          <div key={reg.id} className="flex items-center gap-3 rounded-xl border border-border/60 p-3 hover:bg-muted/30 transition-colors">
                            <div className="h-12 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                              {comp?.cover_image_url ? (
                                <img src={comp.cover_image_url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center"><Trophy className="h-4 w-4 text-muted-foreground/20" /></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{isAr && comp?.title_ar ? comp.title_ar : comp?.title}</p>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                {comp?.country_code && <span>{countryFlag(comp.country_code)}</span>}
                                {comp?.competition_start && <span>{format(new Date(comp.competition_start), "MMM yyyy")}</span>}
                              </div>
                            </div>
                            <Badge variant={reg.status === "approved" ? "default" : "secondary"} className="text-[10px] shrink-0">
                              {reg.status}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">{isAr ? "لا توجد مشاركات بعد" : "No competitions yet"}</p>
                  )}
                </CardContent>
              </Card>

              {/* Score Chart */}
              {scoreChartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      {isAr ? "الدرجات حسب المسابقة" : "Scores by Competition"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={scoreChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              {/* Performance Radar */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    {isAr ? "الأداء العام" : "Performance Overview"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                      <Radar name="Performance" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Certificates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    {isAr ? "الشهادات" : "Certificates"}
                    {totalCerts > 0 && <Badge variant="secondary" className="text-[10px]">{totalCerts}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {certificates?.length ? (
                    <div className="space-y-2">
                      {certificates.slice(0, 5).map((cert) => (
                        <div key={cert.id} className="flex items-center gap-2 rounded-lg bg-muted/40 p-2.5">
                          <Award className="h-4 w-4 text-chart-5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">{isAr && cert.event_name_ar ? cert.event_name_ar : cert.event_name}</p>
                            <p className="text-[10px] text-muted-foreground">{cert.type} • {cert.issued_at ? format(new Date(cert.issued_at), "MMM yyyy") : "—"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">{isAr ? "لا توجد شهادات" : "No certificates yet"}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
