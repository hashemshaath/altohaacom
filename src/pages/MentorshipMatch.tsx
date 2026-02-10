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
} from "@/hooks/useMentorship";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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

  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [sessionOpen, setSessionOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);

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
    in_progress: "bg-primary/10 text-primary",
    dropped: "bg-destructive/10 text-destructive",
  };

  if (matchLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8"><Skeleton className="h-64 w-full" /></main>
        <Footer />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
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
      { title: goalTitle },
      {
        onSuccess: () => {
          toast({ title: isAr ? "تم إنشاء الهدف" : "Goal created" });
          setGoalTitle(""); setGoalOpen(false);
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        <Link to="/mentorship" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> {isAr ? "العودة" : "Back"}
        </Link>

        {/* Match Overview */}
        <Card>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={statusColors[match.status] || ""}>{match.status}</Badge>
                <Badge variant="outline">{isMentor ? (isAr ? "أنت المرشد" : "Mentor") : (isAr ? "أنت المتعلم" : "Mentee")}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {isAr ? "بدأ في" : "Started"} {match.matched_at ? format(new Date(match.matched_at), "PPP") : "N/A"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">{isAr ? "التقدم الكلي" : "Overall Progress"}</p>
              <div className="flex items-center gap-2">
                <Progress value={overallProgress} className="w-32" />
                <span className="text-sm font-bold">{overallProgress}%</span>
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
                {sessions.map(session => (
                  <Card key={session.id} className="transition-all hover:shadow-sm">
                    <CardContent className="flex items-center gap-4 py-4">
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
                      <Badge className={statusColors[session.status] || ""}>{session.status}</Badge>
                    </CardContent>
                  </Card>
                ))}
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
                          <p className="font-medium text-sm">{goal.title}</p>
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
