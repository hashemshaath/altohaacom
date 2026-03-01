import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  useChefsTableSession, useChefsTableInvitations, useChefsTableEvaluations,
  useChefsTableMedia, useRespondToInvitation,
} from "@/hooks/useChefsTable";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { EvaluationRadarChart } from "@/components/evaluation/EvaluationRadarChart";
import { EvaluationBarChart } from "@/components/evaluation/EvaluationBarChart";
import { EvaluationScoreCard } from "@/components/evaluation/EvaluationScoreCard";
import { ChefScoringForm } from "@/components/evaluation/ChefScoringForm";
import { EvaluationReport } from "@/components/evaluation/EvaluationReport";
import { 
  ArrowLeft, ChefHat, Calendar, MapPin, Package, Star, ThumbsUp, ThumbsDown, 
  Users, Image, FileText, Check, X, Clock, BarChart3, ClipboardCheck, ScrollText
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const scoreLabels = [
  { key: "taste_score", en: "Taste & Flavor", ar: "المذاق والنكهة", color: "bg-chart-1" },
  { key: "texture_score", en: "Texture", ar: "القوام", color: "bg-chart-2" },
  { key: "aroma_score", en: "Aroma", ar: "الرائحة", color: "bg-chart-3" },
  { key: "versatility_score", en: "Versatility", ar: "تعدد الاستخدامات", color: "bg-chart-4" },
  { key: "value_score", en: "Value for Money", ar: "القيمة", color: "bg-chart-5" },
  { key: "presentation_score", en: "Presentation", ar: "التقديم", color: "bg-primary" },
];

export default function ChefsTableDetail() {
  const { id } = useParams();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: session, isLoading } = useChefsTableSession(id);
  const { data: invitations = [] } = useChefsTableInvitations(id);
  const { data: evaluations = [] } = useChefsTableEvaluations(id);
  const { data: media = [] } = useChefsTableMedia(id);
  const respondToInvitation = useRespondToInvitation();

  const myInvitation = invitations.find(inv => inv.chef_id === user?.id);
  const myEvaluation = evaluations.find(e => e.chef_id === user?.id);
  const canEvaluate = myInvitation?.status === "accepted" && (!myEvaluation || myEvaluation.status === "draft");
  const submittedEvaluations = evaluations.filter(e => e.status === "submitted");
  const recommendedCount = submittedEvaluations.filter(e => e.is_recommended).length;
  const avgScores = scoreLabels.map(s => {
    const scores = submittedEvaluations.map(e => (e as any)[s.key]).filter((v: any) => v != null);
    return { ...s, avg: scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0 };
  });

  // Compute overall score
  const overallAvg = avgScores.length ? avgScores.reduce((s, c) => s + c.avg, 0) / avgScores.length : 0;

  // Radar chart data
  const radarData = avgScores.map(s => ({
    name: isAr ? s.ar : s.en,
    score: parseFloat(s.avg.toFixed(1)),
    maxScore: 10,
    fullMark: 10,
  }));

  // Per-evaluator data for overlay radar
  const evaluatorData = submittedEvaluations.map((ev, i) => ({
    name: `${isAr ? "مقيّم" : "Evaluator"} ${i + 1}`,
    scores: scoreLabels.map(s => ({
      name: isAr ? s.ar : s.en,
      score: (ev as any)[s.key] || 0,
    })),
  }));

  // Bar chart data
  const barData = avgScores.map(s => ({
    name: isAr ? s.ar : s.en,
    score: parseFloat(s.avg.toFixed(1)),
    maxScore: 10,
  }));

  // Category scores for score card
  const categoryScores = avgScores.map(s => ({
    name: isAr ? s.ar : s.en,
    score: parseFloat(s.avg.toFixed(1)),
    weight: Math.round(100 / avgScores.length),
  }));

  const handleInvitationResponse = async (status: "accepted" | "declined") => {
    if (!myInvitation) return;
    try {
      await respondToInvitation.mutateAsync({ id: myInvitation.id, status });
      toast.success(status === "accepted" 
        ? (isAr ? "تم قبول الدعوة" : "Invitation accepted") 
        : (isAr ? "تم رفض الدعوة" : "Invitation declined"));
    } catch {
      toast.error(isAr ? "حدث خطأ" : "Something went wrong");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <ChefHat className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-lg font-medium">{isAr ? "الجلسة غير موجودة" : "Session not found"}</p>
          <Button variant="ghost" onClick={() => navigate("/chefs-table")} className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            {isAr ? "العودة" : "Go Back"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead title={`${session.title} | ${isAr ? "طاولة الشيف" : "Chef's Table"}`} />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Button variant="ghost" onClick={() => navigate("/chefs-table")} className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            {isAr ? "طاولة الشيف" : "Chef's Table"}
          </Button>

          {/* Header Card */}
          <Card className="mb-6 overflow-hidden border-border/40">
            {session.cover_image_url && (
              <div className="aspect-[3/1] overflow-hidden">
                <img src={session.cover_image_url} alt={session.title} className="h-full w-full object-cover" />
              </div>
            )}
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="font-bold text-xs uppercase tracking-wider">
                  {session.status}
                </Badge>
                <Badge variant="secondary" className="text-xs gap-1">
                  <Package className="h-3 w-3" />
                  {session.product_category}
                </Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-black mb-2">
                {isAr && session.title_ar ? session.title_ar : session.title}
              </h1>
              <p className="text-lg font-semibold text-primary/80 mb-3">
                {isAr && session.product_name_ar ? session.product_name_ar : session.product_name}
              </p>
              {session.description && (
                <p className="text-muted-foreground font-medium leading-relaxed">
                  {isAr && session.description_ar ? session.description_ar : session.description}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-6 text-sm text-muted-foreground">
                {session.session_date && (
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    {format(new Date(session.session_date), "PPP")}
                  </span>
                )}
                {session.venue && (
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-chart-4" />
                    {isAr && session.venue_ar ? session.venue_ar : session.venue}
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {invitations.length} {isAr ? "طاهٍ مدعو" : "chefs invited"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Chef Invitation Banner */}
          {myInvitation && myInvitation.status === "pending" && (
            <Card className="mb-6 border-primary/30 bg-primary/5">
              <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
                <ChefHat className="h-10 w-10 text-primary" />
                <div className="flex-1 text-center sm:text-start">
                  <h3 className="font-bold text-lg">{isAr ? "لقد تمت دعوتك!" : "You're Invited!"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isAr ? "تمت دعوتك لتقييم هذا المنتج. هل تقبل الدعوة؟" : "You've been invited to evaluate this product. Will you accept?"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleInvitationResponse("accepted")} className="gap-2">
                    <Check className="h-4 w-4" />
                    {isAr ? "قبول" : "Accept"}
                  </Button>
                  <Button variant="outline" onClick={() => handleInvitationResponse("declined")} className="gap-2">
                    <X className="h-4 w-4" />
                    {isAr ? "رفض" : "Decline"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs defaultValue={canEvaluate ? "evaluate" : "evaluations"} className="space-y-4">
            <TabsList className="h-11 rounded-xl bg-muted/50 p-1 flex-wrap">
              {canEvaluate && (
                <TabsTrigger value="evaluate" className="rounded-xl gap-1.5">
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  {isAr ? "قيّم المنتج" : "Evaluate"}
                </TabsTrigger>
              )}
              <TabsTrigger value="evaluations" className="rounded-xl gap-1.5">
                <Star className="h-3.5 w-3.5" />
                {isAr ? "التقييمات" : "Evaluations"} ({submittedEvaluations.length})
              </TabsTrigger>
              <TabsTrigger value="charts" className="rounded-xl gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                {isAr ? "التحليل البياني" : "Analysis Charts"}
              </TabsTrigger>
              <TabsTrigger value="gallery" className="rounded-xl gap-1.5">
                <Image className="h-3.5 w-3.5" />
                {isAr ? "المعرض" : "Gallery"} ({media.length})
              </TabsTrigger>
              <TabsTrigger value="chefs" className="rounded-xl gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {isAr ? "الطهاة" : "Chefs"} ({invitations.length})
              </TabsTrigger>
              <TabsTrigger value="report" className="rounded-xl gap-1.5">
                <ScrollText className="h-3.5 w-3.5" />
                {isAr ? "التقرير" : "Report"}
              </TabsTrigger>
            </TabsList>

            {/* Evaluate Tab */}
            {canEvaluate && (
              <TabsContent value="evaluate">
                <ChefScoringForm
                  sessionId={session.id}
                  invitationId={myInvitation!.id}
                  productCategory={session.product_category}
                  entityId={session.id}
                  evaluatorId={user!.id}
                  subjectId={session.id}
                  existingEvaluation={myEvaluation}
                />
              </TabsContent>
            )}

            {/* Evaluations Tab */}
            <TabsContent value="evaluations" className="space-y-6">
              {/* Score Summary Card */}
              {submittedEvaluations.length > 0 && (
                <EvaluationScoreCard
                  overallScore={parseFloat(overallAvg.toFixed(1))}
                  maxScore={10}
                  evaluatorCount={submittedEvaluations.length}
                  criteriaCount={scoreLabels.length}
                  categoryScores={categoryScores}
                  isAr={isAr}
                />
              )}

              {/* Recommendation Summary */}
              {submittedEvaluations.length > 0 && (
                <Card className="border-border/40">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6 flex-wrap">
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="h-5 w-5 text-chart-5" />
                        <span className="text-2xl font-black">{recommendedCount}</span>
                        <span className="text-sm text-muted-foreground">{isAr ? "يوصي" : "Recommend"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ThumbsDown className="h-5 w-5 text-destructive" />
                        <span className="text-2xl font-black">{submittedEvaluations.length - recommendedCount}</span>
                        <span className="text-sm text-muted-foreground">{isAr ? "لا يوصي" : "Don't Recommend"}</span>
                      </div>
                      <div className="ms-auto">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{isAr ? "نسبة التوصية" : "Recommendation Rate"}</span>
                          <span className="text-lg font-black text-primary">
                            {submittedEvaluations.length > 0 
                              ? Math.round((recommendedCount / submittedEvaluations.length) * 100) 
                              : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Individual Reviews */}
              {submittedEvaluations.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="mx-auto h-10 w-10 text-muted-foreground/30" />
                    <p className="mt-3 font-medium">{isAr ? "لا توجد تقييمات بعد" : "No evaluations yet"}</p>
                  </CardContent>
                </Card>
              ) : (
                submittedEvaluations.map((ev, idx) => (
                  <Card key={ev.id} className="border-border/40">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <ChefHat className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">
                              {isAr && ev.review_title_ar ? ev.review_title_ar : ev.review_title || `${isAr ? "مقيّم" : "Evaluator"} ${idx + 1}`}
                            </h3>
                            {ev.submitted_at && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {format(new Date(ev.submitted_at), "PPP")}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant={ev.is_recommended ? "default" : "destructive"} className="gap-1.5">
                          {ev.is_recommended ? <ThumbsUp className="h-3 w-3" /> : <ThumbsDown className="h-3 w-3" />}
                          {ev.is_recommended ? (isAr ? "يوصي" : "Recommended") : (isAr ? "لا يوصي" : "Not Recommended")}
                        </Badge>
                      </div>
                      
                      {ev.review_text && (
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                          {isAr && ev.review_text_ar ? ev.review_text_ar : ev.review_text}
                        </p>
                      )}

                      {ev.cooking_experience && (
                        <div className="mb-4">
                          <h4 className="text-sm font-bold mb-1">{isAr ? "تجربة الطهي" : "Cooking Experience"}</h4>
                          <p className="text-sm text-muted-foreground">
                            {isAr && ev.cooking_experience_ar ? ev.cooking_experience_ar : ev.cooking_experience}
                          </p>
                        </div>
                      )}

                      {/* Individual scores grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        {scoreLabels.map(s => {
                          const val = (ev as any)[s.key];
                          if (val == null) return null;
                          return (
                            <div key={s.key} className="flex items-center justify-between rounded-xl border border-border/50 p-2.5">
                              <span className="text-xs text-muted-foreground">{isAr ? s.ar : s.en}</span>
                              <span className="text-sm font-black">{val}/10</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Pros & Cons */}
                      <div className="grid md:grid-cols-2 gap-3">
                        {ev.pros && (
                          <div className="rounded-xl bg-chart-5/5 border border-chart-5/20 p-3">
                            <p className="text-xs font-bold text-chart-5 mb-1">{isAr ? "المميزات" : "Strengths"}</p>
                            <p className="text-sm">{isAr && ev.pros_ar ? ev.pros_ar : ev.pros}</p>
                          </div>
                        )}
                        {ev.cons && (
                          <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3">
                            <p className="text-xs font-bold text-destructive mb-1">{isAr ? "نقاط التحسين" : "Areas to Improve"}</p>
                            <p className="text-sm">{isAr && ev.cons_ar ? ev.cons_ar : ev.cons}</p>
                          </div>
                        )}
                      </div>

                      {ev.endorsement_text && (
                        <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
                          <p className="text-sm font-medium italic text-primary">
                            "{isAr && ev.endorsement_text_ar ? ev.endorsement_text_ar : ev.endorsement_text}"
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Charts & Analysis Tab */}
            <TabsContent value="charts" className="space-y-6">
              {submittedEvaluations.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground/30" />
                    <p className="mt-3 font-medium">{isAr ? "لا توجد بيانات كافية للتحليل" : "Not enough data for analysis"}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isAr ? "تحتاج إلى تقييم واحد على الأقل" : "Need at least one evaluation"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid lg:grid-cols-2 gap-6">
                    <EvaluationRadarChart
                      title={isAr ? "تحليل الأبعاد — المتوسط العام" : "Multi-Dimensional Analysis — Overall Average"}
                      data={radarData}
                      evaluatorData={evaluatorData.length > 1 ? evaluatorData : undefined}
                      isAr={isAr}
                    />
                    <EvaluationBarChart
                      title={isAr ? "متوسط الدرجات حسب المعيار" : "Average Scores by Criterion"}
                      data={barData}
                      isAr={isAr}
                    />
                  </div>

                  {/* Per-evaluator comparison */}
                  {evaluatorData.length > 1 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">{isAr ? "مقارنة تقييمات الطهاة" : "Chef Evaluations Comparison"}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-start p-2 font-bold">{isAr ? "المعيار" : "Criterion"}</th>
                                {evaluatorData.map(ev => (
                                  <th key={ev.name} className="text-center p-2 font-bold">{ev.name}</th>
                                ))}
                                <th className="text-center p-2 font-bold text-primary">{isAr ? "المتوسط" : "Average"}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {scoreLabels.map(s => (
                                <tr key={s.key} className="border-b border-border/30">
                                  <td className="p-2 font-medium">{isAr ? s.ar : s.en}</td>
                                  {evaluatorData.map(ev => {
                                    const found = ev.scores.find(sc => sc.name === (isAr ? s.ar : s.en));
                                    return (
                                      <td key={ev.name} className="text-center p-2">{found?.score || "—"}</td>
                                    );
                                  })}
                                  <td className="text-center p-2 font-black text-primary">
                                    {avgScores.find(a => a.key === s.key)?.avg.toFixed(1)}
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-muted/30">
                                <td className="p-2 font-black">{isAr ? "الإجمالي" : "Overall"}</td>
                                {evaluatorData.map(ev => {
                                  const total = ev.scores.reduce((s, c) => s + c.score, 0) / ev.scores.length;
                                  return <td key={ev.name} className="text-center p-2 font-bold">{total.toFixed(1)}</td>;
                                })}
                                <td className="text-center p-2 font-black text-primary">{overallAvg.toFixed(1)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* Gallery Tab */}
            <TabsContent value="gallery">
              {media.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Image className="mx-auto h-10 w-10 text-muted-foreground/30" />
                    <p className="mt-3 font-medium">{isAr ? "لا توجد صور بعد" : "No media yet"}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {media.map(m => (
                    <div key={m.id} className="aspect-square overflow-hidden rounded-xl border border-border/40">
                      {m.media_type === "image" ? (
                        <img src={m.media_url} alt={m.title || ""} className="h-full w-full object-cover" />
                      ) : (
                        <video src={m.media_url} className="h-full w-full object-cover" controls />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Report Tab */}
            <TabsContent value="report">
              <EvaluationReport
                session={session}
                evaluations={evaluations}
                media={media}
                invitationCount={invitations.length}
                isAr={isAr}
              />
            </TabsContent>

            {/* Chefs Tab */}
            <TabsContent value="chefs">
              <div className="grid gap-3 md:grid-cols-2">
                {invitations.map(inv => (
                  <Card key={inv.id} className="border-border/40">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <ChefHat className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{isAr ? "طاهٍ مدعو" : "Invited Chef"}</p>
                        <p className="text-xs text-muted-foreground">
                          {inv.status === "pending" ? (isAr ? "في انتظار الرد" : "Awaiting response") :
                           inv.status === "accepted" ? (isAr ? "قبل الدعوة" : "Accepted") :
                           inv.status === "declined" ? (isAr ? "رفض الدعوة" : "Declined") :
                           isAr ? "أكمل التقييم" : "Completed"}
                        </p>
                      </div>
                      <Badge variant={
                        inv.status === "accepted" ? "default" :
                        inv.status === "declined" ? "destructive" : "secondary"
                      } className="text-[10px] uppercase tracking-wider">
                        {inv.status === "pending" && <Clock className="h-3 w-3 me-1" />}
                        {inv.status === "accepted" && <Check className="h-3 w-3 me-1" />}
                        {inv.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </main>
        <Footer />
      </div>
    </>
  );
}
