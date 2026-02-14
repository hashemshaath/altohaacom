import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  useMentorshipMatchDetails,
  useMentorshipSessions,
  useMentorshipGoals,
  useCreateSession,
  useCreateGoal,
  useUpdateGoalProgress,
  useUpdateSessionFeedback,
  useCompleteSession,
} from "@/hooks/useMentorship";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Target,
  Plus,
  Clock,
  Video,
  CheckCircle,
  Circle,
  Star,
  MessageSquare,
  User,
} from "lucide-react";
import { format } from "date-fns";

export default function MentorshipMatch() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAr = language === "ar";

  const { data: match, isLoading: matchLoading } = useMentorshipMatchDetails(id);
  const { data: sessions = [] } = useMentorshipSessions(id);
  const { data: goals = [] } = useMentorshipGoals(id);
  const createSession = useCreateSession(id || "");
  const createGoal = useCreateGoal(id || "");
  const updateGoal = useUpdateGoalProgress(id || "");
  const updateFeedback = useUpdateSessionFeedback(id || "");
  const completeSession = useCompleteSession(id || "");

  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDesc, setGoalDesc] = useState("");
  const [sessionOpen, setSessionOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);

  const isMentor = match?.mentor_id === user?.id;
  const overallProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length)
    : 0;

  const statusColors: Record<string, string> = {
    scheduled: "bg-chart-4/10 text-chart-4",
    completed: "bg-chart-2/10 text-chart-2",
    cancelled: "bg-destructive/10 text-destructive",
    no_show: "bg-muted text-muted-foreground",
    pending: "bg-chart-4/10 text-chart-4",
    active: "bg-primary/10 text-primary",
    in_progress: "bg-primary/10 text-primary",
    dropped: "bg-destructive/10 text-destructive",
  };

  if (matchLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-8"><Skeleton className="h-64 w-full" /></main>
        <Footer />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-16 text-center">
          <h2 className="text-xl font-bold">{isAr ? "لم يتم العثور" : "Match not found"}</h2>
          <Link to="/mentorship"><Button variant="outline" className="mt-4">{isAr ? "العودة" : "Go Back"}</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  const handleCreateSession = () => {
    if (!sessionTitle || !sessionDate) return;
    createSession.mutate(
      { title: sessionTitle, scheduled_at: new Date(sessionDate).toISOString() },
      {
        onSuccess: () => {
          toast({ title: isAr ? "تم إنشاء الجلسة" : "Session created" });
          setSessionTitle(""); setSessionDate(""); setSessionOpen(false);
        },
      }
    );
  };

  const handleCreateGoal = () => {
    if (!goalTitle) return;
    createGoal.mutate(
      { title: goalTitle, description: goalDesc || undefined },
      {
        onSuccess: () => {
          toast({ title: isAr ? "تم إنشاء الهدف" : "Goal created" });
          setGoalTitle(""); setGoalDesc(""); setGoalOpen(false);
        },
      }
    );
  };

  const handleSubmitFeedback = (sessionId: string) => {
    updateFeedback.mutate(
      { sessionId, feedback: feedbackText, rating: feedbackRating, isMentor },
      {
        onSuccess: () => {
          toast({ title: isAr ? "تم إرسال التقييم" : "Feedback submitted" });
          setFeedbackOpen(null); setFeedbackText(""); setFeedbackRating(5);
        },
      }
    );
  };

  const mentorName = match.mentor_profile?.full_name || (isAr ? "المرشد" : "Mentor");
  const menteeName = match.mentee_profile?.full_name || (isAr ? "المتعلم" : "Mentee");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8 space-y-6">
        <Link to="/mentorship" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> {isAr ? "العودة" : "Back"}
        </Link>

        {/* Match Overview with Profiles */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Badge className={statusColors[match.status] || ""}>{match.status}</Badge>
                <span className="text-sm text-muted-foreground">
                  {isAr ? "بدأ في" : "Started"} {match.matched_at ? format(new Date(match.matched_at), "PPP") : "N/A"}
                </span>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">{isAr ? "التقدم الكلي" : "Overall Progress"}</p>
                <div className="flex items-center gap-2">
                  <Progress value={overallProgress} className="w-32" />
                  <span className="text-sm font-bold">{overallProgress}%</span>
                </div>
              </div>
            </div>

            {/* Mentor & Mentee Profiles */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={match.mentor_profile?.avatar_url || ""} />
                  <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-muted-foreground">{isAr ? "المرشد" : "Mentor"}</p>
                  <p className="font-medium text-sm">{mentorName}</p>
                  {match.mentor_profile?.specialization && (
                    <p className="text-xs text-muted-foreground">{match.mentor_profile.specialization}</p>
                  )}
                </div>
                {isMentor && <Badge variant="outline" className="ms-auto text-[10px]">{isAr ? "أنت" : "You"}</Badge>}
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={match.mentee_profile?.avatar_url || ""} />
                  <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-muted-foreground">{isAr ? "المتعلم" : "Mentee"}</p>
                  <p className="font-medium text-sm">{menteeName}</p>
                  {match.mentee_profile?.specialization && (
                    <p className="text-xs text-muted-foreground">{match.mentee_profile.specialization}</p>
                  )}
                </div>
                {!isMentor && <Badge variant="outline" className="ms-auto text-[10px]">{isAr ? "أنت" : "You"}</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="sessions">
          <TabsList>
            <TabsTrigger value="sessions" className="gap-1.5">
              <Calendar className="h-4 w-4" />
              {isAr ? "الجلسات" : "Sessions"} ({sessions.length})
            </TabsTrigger>
            <TabsTrigger value="goals" className="gap-1.5">
              <Target className="h-4 w-4" />
              {isAr ? "الأهداف" : "Goals"} ({goals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Dialog open={sessionOpen} onOpenChange={setSessionOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1"><Plus className="h-3 w-3" />{isAr ? "جلسة جديدة" : "New Session"}</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{isAr ? "إنشاء جلسة" : "Create Session"}</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><Label>{isAr ? "العنوان" : "Title"}</Label><Input value={sessionTitle} onChange={e => setSessionTitle(e.target.value)} /></div>
                    <div><Label>{isAr ? "الموعد" : "Date & Time"}</Label><Input type="datetime-local" value={sessionDate} onChange={e => setSessionDate(e.target.value)} /></div>
                    <Button onClick={handleCreateSession} disabled={createSession.isPending} className="w-full">{isAr ? "إنشاء" : "Create"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {sessions.length === 0 ? (
              <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">{isAr ? "لا توجد جلسات" : "No sessions yet"}</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {sessions.map(session => {
                  const hasFeedback = isMentor ? session.mentor_feedback : session.mentee_feedback;
                  const canFeedback = session.status === "completed" && !hasFeedback;
                  return (
                    <Card key={session.id} className="transition-all hover:shadow-sm">
                      <CardContent className="py-4 space-y-3">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <Video className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{session.title}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(session.scheduled_at), "PPp")}
                              {session.duration_minutes && ` · ${session.duration_minutes}min`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={statusColors[session.status] || ""}>{session.status}</Badge>
                            {session.status === "scheduled" && (
                              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => completeSession.mutate(session.id)}>
                                <CheckCircle className="h-3 w-3 me-1" />{isAr ? "إتمام" : "Complete"}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Feedback display */}
                        {(session.mentor_feedback || session.mentee_feedback) && (
                          <div className="grid gap-2 sm:grid-cols-2 pt-2 border-t">
                            {session.mentor_feedback && (
                              <div className="p-2 rounded bg-muted/50 text-xs">
                                <p className="font-medium flex items-center gap-1 mb-1">
                                  <MessageSquare className="h-3 w-3" /> {isAr ? "تقييم المرشد" : "Mentor Feedback"}
                                  {session.mentor_rating && (
                                    <span className="flex items-center gap-0.5 ms-auto">
                                      <Star className="h-3 w-3 fill-chart-4 text-chart-4" /> {session.mentor_rating}/5
                                    </span>
                                  )}
                                </p>
                                <p className="text-muted-foreground">{session.mentor_feedback}</p>
                              </div>
                            )}
                            {session.mentee_feedback && (
                              <div className="p-2 rounded bg-muted/50 text-xs">
                                <p className="font-medium flex items-center gap-1 mb-1">
                                  <MessageSquare className="h-3 w-3" /> {isAr ? "تقييم المتعلم" : "Mentee Feedback"}
                                  {session.mentee_rating && (
                                    <span className="flex items-center gap-0.5 ms-auto">
                                      <Star className="h-3 w-3 fill-chart-4 text-chart-4" /> {session.mentee_rating}/5
                                    </span>
                                  )}
                                </p>
                                <p className="text-muted-foreground">{session.mentee_feedback}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Feedback button */}
                        {canFeedback && (
                          <Dialog open={feedbackOpen === session.id} onOpenChange={open => setFeedbackOpen(open ? session.id : null)}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-xs gap-1">
                                <Star className="h-3 w-3" />{isAr ? "أضف تقييم" : "Add Feedback"}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>{isAr ? "تقييم الجلسة" : "Session Feedback"}</DialogTitle></DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>{isAr ? "التقييم" : "Rating"}</Label>
                                  <div className="flex gap-1 mt-1">
                                    {[1, 2, 3, 4, 5].map(r => (
                                      <button key={r} onClick={() => setFeedbackRating(r)} className="p-1">
                                        <Star className={`h-6 w-6 ${r <= feedbackRating ? "fill-chart-4 text-chart-4" : "text-muted-foreground"}`} />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <Label>{isAr ? "ملاحظات" : "Comments"}</Label>
                                  <Textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} rows={3} />
                                </div>
                                <Button onClick={() => handleSubmitFeedback(session.id)} disabled={updateFeedback.isPending} className="w-full">
                                  {isAr ? "إرسال" : "Submit"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="goals" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1"><Plus className="h-3 w-3" />{isAr ? "هدف جديد" : "New Goal"}</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{isAr ? "إنشاء هدف" : "Create Goal"}</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><Label>{isAr ? "العنوان" : "Title"}</Label><Input value={goalTitle} onChange={e => setGoalTitle(e.target.value)} /></div>
                    <div><Label>{isAr ? "الوصف" : "Description"}</Label><Textarea value={goalDesc} onChange={e => setGoalDesc(e.target.value)} rows={2} /></div>
                    <Button onClick={handleCreateGoal} disabled={createGoal.isPending} className="w-full">{isAr ? "إنشاء" : "Create"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {goals.length === 0 ? (
              <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">{isAr ? "لا توجد أهداف" : "No goals yet"}</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {goals.map(goal => (
                  <Card key={goal.id}>
                    <CardContent className="py-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {goal.status === "completed" ? (
                            <CheckCircle className="h-4 w-4 text-chart-2" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium text-sm">{goal.title}</p>
                            {goal.description && <p className="text-xs text-muted-foreground">{goal.description}</p>}
                          </div>
                        </div>
                        <Badge className={statusColors[goal.status] || ""}>{goal.status}</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={goal.progress || 0} className="flex-1" />
                        <span className="text-xs font-medium w-10 text-end">{goal.progress || 0}%</span>
                      </div>
                      {goal.status !== "completed" && (
                        <div className="flex gap-2 pt-1">
                          {[25, 50, 75, 100].map(p => (
                            <Button
                              key={p}
                              variant="outline"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => updateGoal.mutate({ goalId: goal.id, progress: p })}
                            >
                              {p}%
                            </Button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
