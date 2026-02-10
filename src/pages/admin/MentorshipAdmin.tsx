import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  useMentorshipPrograms,
  useAllMentorApplications,
  useAllMentorshipMatches,
  useReviewApplication,
  useCreateProgram,
  useUpdateProgram,
} from "@/hooks/useMentorship";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  GraduationCap,
  Users,
  ClipboardList,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
} from "lucide-react";

export default function MentorshipAdmin() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === "ar";

  const { data: programs = [], isLoading: programsLoading } = useMentorshipPrograms();
  const { data: applications = [] } = useAllMentorApplications();
  const { data: matches = [] } = useAllMentorshipMatches();
  const reviewMutation = useReviewApplication();
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();

  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newWeeks, setNewWeeks] = useState("12");
  const [createOpen, setCreateOpen] = useState(false);

  const pendingApps = applications.filter(a => a.status === "pending");

  const handleCreateProgram = () => {
    if (!newTitle) return;
    createProgram.mutate(
      { title: newTitle, description: newDesc, duration_weeks: parseInt(newWeeks) || 12 },
      {
        onSuccess: () => {
          toast({ title: isAr ? "تم إنشاء البرنامج" : "Program created" });
          setNewTitle(""); setNewDesc(""); setCreateOpen(false);
        },
      }
    );
  };

  const handleReview = (id: string, status: "approved" | "rejected") => {
    reviewMutation.mutate({ id, status }, {
      onSuccess: () => toast({ title: isAr ? "تم التحديث" : "Application updated" }),
    });
  };

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    active: "bg-chart-2/10 text-chart-2",
    completed: "bg-primary/10 text-primary",
    archived: "bg-muted text-muted-foreground",
    pending: "bg-chart-4/10 text-chart-4",
    approved: "bg-chart-2/10 text-chart-2",
    rejected: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">
            {isAr ? "إدارة الإرشاد" : "Mentorship Management"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isAr ? "إدارة البرامج والطلبات والمطابقات" : "Manage programs, applications, and matches"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { icon: BookOpen, label: isAr ? "البرامج" : "Programs", value: programs.length, color: "border-s-primary" },
          { icon: ClipboardList, label: isAr ? "طلبات معلقة" : "Pending Apps", value: pendingApps.length, color: "border-s-chart-4" },
          { icon: Users, label: isAr ? "المطابقات" : "Matches", value: matches.length, color: "border-s-chart-2" },
          { icon: GraduationCap, label: isAr ? "إجمالي الطلبات" : "Total Apps", value: applications.length, color: "border-s-chart-3" },
        ].map(s => (
          <Card key={s.label} className={`border-s-[3px] ${s.color}`}>
            <CardContent className="flex items-center gap-3 pt-5">
              <s.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="programs">
        <TabsList>
          <TabsTrigger value="programs">{isAr ? "البرامج" : "Programs"}</TabsTrigger>
          <TabsTrigger value="applications">
            {isAr ? "الطلبات" : "Applications"}
            {pendingApps.length > 0 && <Badge variant="destructive" className="ms-1.5 text-[10px]">{pendingApps.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="matches">{isAr ? "المطابقات" : "Matches"}</TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-1"><Plus className="h-4 w-4" />{isAr ? "برنامج جديد" : "New Program"}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{isAr ? "إنشاء برنامج" : "Create Program"}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>{isAr ? "العنوان" : "Title"}</Label><Input value={newTitle} onChange={e => setNewTitle(e.target.value)} /></div>
                  <div><Label>{isAr ? "الوصف" : "Description"}</Label><Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} /></div>
                  <div><Label>{isAr ? "المدة (أسابيع)" : "Duration (weeks)"}</Label><Input type="number" value={newWeeks} onChange={e => setNewWeeks(e.target.value)} /></div>
                  <Button onClick={handleCreateProgram} disabled={createProgram.isPending} className="w-full">{isAr ? "إنشاء" : "Create"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {programs.map(p => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{isAr ? p.title_ar || p.title : p.title}</h3>
                    <Badge className={statusColors[p.status] || ""}>{p.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {p.duration_weeks} {isAr ? "أسابيع" : "weeks"} · {isAr ? "حد أقصى" : "max"} {p.max_matches}
                  </p>
                </div>
                <div className="flex gap-2">
                  {p.status === "draft" && (
                    <Button size="sm" variant="outline" onClick={() => updateProgram.mutate({ id: p.id, status: "active" })}>
                      {isAr ? "تفعيل" : "Activate"}
                    </Button>
                  )}
                  {p.status === "active" && (
                    <Button size="sm" variant="outline" onClick={() => updateProgram.mutate({ id: p.id, status: "completed" })}>
                      {isAr ? "إنهاء" : "Complete"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="applications" className="mt-4 space-y-3">
          {applications.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">{isAr ? "لا توجد طلبات" : "No applications"}</CardContent></Card>
          ) : (
            applications.map(app => (
              <Card key={app.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[app.status] || ""}>{app.status}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {app.years_experience} {isAr ? "سنوات خبرة" : "yrs exp"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(app.expertise || []).slice(0, 3).map(e => (
                        <Badge key={e} variant="outline" className="text-[10px]">{e}</Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{app.bio}</p>
                  </div>
                  {app.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleReview(app.id, "approved")}>
                        <CheckCircle className="h-4 w-4 text-chart-2" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleReview(app.id, "rejected")}>
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="matches" className="mt-4 space-y-3">
          {matches.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">{isAr ? "لا توجد مطابقات" : "No matches"}</CardContent></Card>
          ) : (
            matches.map(m => (
              <Card key={m.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <Badge className={statusColors[m.status] || ""}>{m.status}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {m.matched_at ? format(new Date(m.matched_at), "PPP") : "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
