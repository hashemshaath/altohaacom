import { useIsAr } from "@/hooks/useIsAr";
import { useState, useMemo } from "react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import {
  useMentorshipPrograms,
  useAllMentorApplications,
  useAllMentorshipMatches,
  useAllMenteeEnrollments,
  useReviewApplication,
  useCreateProgram,
  useUpdateProgram,
  useCreateMatch,
  useMentorshipAnalytics,
} from "@/hooks/useMentorship";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Handshake,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  BarChart3,
  Star,
  UserPlus,
  User,
  TrendingUp,
} from "lucide-react";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

export default function MentorshipAdmin() {
  const isAr = useIsAr();
  const { toast } = useToast();

  const { data: programs = [] } = useMentorshipPrograms();
  const { data: applications = [] } = useAllMentorApplications();
  const { data: matches = [] } = useAllMentorshipMatches();
  const { data: enrollments = [] } = useAllMenteeEnrollments();
  const { data: analytics } = useMentorshipAnalytics();
  const reviewMutation = useReviewApplication();
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();
  const createMatch = useCreateMatch();

  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newWeeks, setNewWeeks] = useState("12");
  const [createOpen, setCreateOpen] = useState(false);
  const [matchOpen, setMatchOpen] = useState(false);
  const [matchProgramId, setMatchProgramId] = useState("");
  const [matchMentorId, setMatchMentorId] = useState("");
  const [matchMenteeId, setMatchMenteeId] = useState("");
  const [appSearch, setAppSearch] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState("all");

  const pendingApps = applications.filter(a => a.status === "pending");
  const approvedMentors = applications.filter(a => a.status === "approved");

  const bulkApps = useAdminBulkActions(applications);

  const { exportCSV: exportAppsCSV } = useCSVExport({
    columns: [
      { header: isAr ? "الاسم" : "Name", accessor: (r) => r.profile?.full_name || "" },
      { header: isAr ? "الحالة" : "Status", accessor: (r) => r.status },
      { header: isAr ? "سنوات الخبرة" : "Experience", accessor: (r) => r.years_experience },
      { header: isAr ? "التخصصات" : "Expertise", accessor: (r) => (r.expertise || []).join(", ") },
      { header: isAr ? "النبذة" : "Bio", accessor: (r) => r.bio || "" },
    ],
    filename: "mentor-applications",
  });
  const pendingEnrollments = enrollments.filter(e => e.status === "pending");

  const filteredApps = useMemo(() => {
    const q = appSearch.toLowerCase().trim();
    return applications.filter(app => {
      if (appStatusFilter !== "all" && app.status !== appStatusFilter) return false;
      if (q) {
        const text = `${app.profile?.full_name || ""} ${app.bio || ""} ${(app.expertise || []).join(" ")}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [applications, appSearch, appStatusFilter]);

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    active: "bg-chart-2/10 text-chart-2",
    completed: "bg-primary/10 text-primary",
    archived: "bg-muted text-muted-foreground",
    pending: "bg-chart-4/10 text-chart-4",
    approved: "bg-chart-2/10 text-chart-2",
    rejected: "bg-destructive/10 text-destructive",
    matched: "bg-primary/10 text-primary",
  };

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

  const handleCreateMatch = () => {
    if (!matchProgramId || !matchMentorId || !matchMenteeId) {
      toast({ variant: "destructive", title: isAr ? "يرجى ملء جميع الحقول" : "Please fill all fields" });
      return;
    }
    createMatch.mutate(
      { program_id: matchProgramId, mentor_id: matchMentorId, mentee_id: matchMenteeId },
      {
        onSuccess: () => {
          toast({ title: isAr ? "تم إنشاء المطابقة" : "Match created" });
          setMatchOpen(false); setMatchProgramId(""); setMatchMentorId(""); setMatchMenteeId("");
        },
        onError: (err: Error) => {
          toast({ variant: "destructive", title: isAr ? "فشل" : "Failed", description: err instanceof Error ? err.message : String(err) });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Handshake}
        title={isAr ? "إدارة الإرشاد" : "Mentorship Management"}
        description={isAr ? "إدارة البرامج والطلبات والمطابقات" : "Manage programs, applications, and matches"}
      />

      {/* Analytics Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: BookOpen, label: isAr ? "البرامج النشطة" : "Active Programs", value: analytics?.activePrograms || 0, color: "border-s-primary" },
          { icon: ClipboardList, label: isAr ? "طلبات معلقة" : "Pending Apps", value: analytics?.pendingApplications || 0, color: "border-s-chart-4" },
          { icon: Users, label: isAr ? "مطابقات نشطة" : "Active Matches", value: analytics?.activeMatches || 0, color: "border-s-chart-2" },
          { icon: Star, label: isAr ? "متوسط تقييم المرشد" : "Avg Mentor Rating", value: analytics?.avgMentorRating || 0, color: "border-s-chart-3" },
          { icon: UserPlus, label: isAr ? "تسجيلات معلقة" : "Pending Enrollments", value: analytics?.pendingEnrollments || 0, color: "border-s-chart-5" },
          { icon: GraduationCap, label: isAr ? "إجمالي الطلبات" : "Total Applications", value: analytics?.totalApplications || 0, color: "border-s-chart-1" },
          { icon: TrendingUp, label: isAr ? "جلسات مكتملة" : "Completed Sessions", value: analytics?.completedSessions || 0, color: "border-s-primary" },
          { icon: CheckCircle, label: isAr ? "مطابقات مكتملة" : "Completed Matches", value: analytics?.completedMatches || 0, color: "border-s-chart-2" },
        ].map(s => (
          <Card key={s.label} className={`border-s-[3px] ${s.color}`}>
            <CardContent className="flex items-center gap-3 pt-5">
              <s.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold"><AnimatedCounter value={s.value} /></p>
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
            {pendingApps.length > 0 && <Badge variant="destructive" className="ms-1.5 text-xs">{pendingApps.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="enrollments">
            {isAr ? "التسجيلات" : "Enrollments"}
            {pendingEnrollments.length > 0 && <Badge variant="destructive" className="ms-1.5 text-xs">{pendingEnrollments.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="matches">{isAr ? "المطابقات" : "Matches"}</TabsTrigger>
        </TabsList>

        {/* Programs Tab */}
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

        {/* Applications Tab */}
        <TabsContent value="applications" className="mt-4 space-y-3">
          <AdminFilterBar
            searchValue={appSearch}
            onSearchChange={setAppSearch}
            searchPlaceholder={isAr ? "بحث في الطلبات..." : "Search applications..."}
          >
            <Select value={appStatusFilter} onValueChange={setAppStatusFilter}>
              <SelectTrigger className="w-[140px] h-9 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All Status"}</SelectItem>
                <SelectItem value="pending">{isAr ? "معلقة" : "Pending"}</SelectItem>
                <SelectItem value="approved">{isAr ? "مقبولة" : "Approved"}</SelectItem>
                <SelectItem value="rejected">{isAr ? "مرفوضة" : "Rejected"}</SelectItem>
              </SelectContent>
            </Select>
          </AdminFilterBar>

          <BulkActionBar
            count={bulkApps.count}
            onClear={bulkApps.clearSelection}
            onExport={() => exportAppsCSV(bulkApps.selectedItems)}
          />
          {applications.length === 0 ? (
            <AdminEmptyState icon={ClipboardList} title="No applications" titleAr="لا توجد طلبات" description="Mentor applications will appear here" descriptionAr="ستظهر طلبات الإرشاد هنا عند تقديمها" />
          ) : filteredApps.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">{isAr ? "لا توجد نتائج" : "No results found"}</p>
          ) : (
            filteredApps.map(app => (
              <Card key={app.id} className={bulkApps.isSelected(app.id) ? "ring-1 ring-primary/30" : ""}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={bulkApps.isSelected(app.id)}
                      onCheckedChange={() => bulkApps.toggleOne(app.id)}
                    />
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={app.profile?.avatar_url || ""} />
                      <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{app.profile?.full_name || "Unknown"}</p>
                        <Badge className={statusColors[app.status] || ""}>{app.status}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {app.years_experience} {isAr ? "سنوات خبرة" : "yrs exp"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(app.expertise || []).slice(0, 3).map(e => (
                          <Badge key={e} variant="outline" className="text-xs">{e}</Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{app.bio}</p>
                    </div>
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

        {/* Enrollments Tab */}
        <TabsContent value="enrollments" className="mt-4 space-y-3">
          {enrollments.length === 0 ? (
            <AdminEmptyState icon={GraduationCap} title="No enrollments" titleAr="لا توجد تسجيلات" description="Mentee enrollments will appear here" descriptionAr="ستظهر تسجيلات المتعلمين هنا" />
          ) : (
            enrollments.map(enrollment => (
              <Card key={enrollment.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={enrollment.profile?.avatar_url || ""} />
                      <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{enrollment.profile?.full_name || "Unknown"}</p>
                        <Badge className={statusColors[enrollment.status] || ""}>{enrollment.status}</Badge>
                        {enrollment.experience_level && (
                          <Badge variant="outline" className="text-xs capitalize">{enrollment.experience_level}</Badge>
                        )}
                      </div>
                      {enrollment.goals_description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{enrollment.goals_description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{format(new Date(enrollment.created_at), "PPP")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Matches Tab */}
        <TabsContent value="matches" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={matchOpen} onOpenChange={setMatchOpen}>
              <DialogTrigger asChild>
                <Button className="gap-1"><Plus className="h-4 w-4" />{isAr ? "مطابقة جديدة" : "New Match"}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{isAr ? "إنشاء مطابقة" : "Create Match"}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{isAr ? "البرنامج" : "Program"}</Label>
                    <Select value={matchProgramId} onValueChange={setMatchProgramId}>
                      <SelectTrigger><SelectValue placeholder={isAr ? "اختر برنامج" : "Select program"} /></SelectTrigger>
                      <SelectContent>
                        {programs.filter(p => p.status === "active").map(p => (
                          <SelectItem key={p.id} value={p.id}>{isAr ? p.title_ar || p.title : p.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{isAr ? "المرشد (من الطلبات المقبولة)" : "Mentor (from approved apps)"}</Label>
                    <Select value={matchMentorId} onValueChange={setMatchMentorId}>
                      <SelectTrigger><SelectValue placeholder={isAr ? "اختر مرشد" : "Select mentor"} /></SelectTrigger>
                      <SelectContent>
                        {approvedMentors.map(m => (
                          <SelectItem key={m.id} value={m.user_id}>
                            {m.profile?.full_name || m.user_id.slice(0, 8)} ({m.years_experience} yrs)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{isAr ? "المتعلم (من التسجيلات المعلقة)" : "Mentee (from pending enrollments)"}</Label>
                    <Select value={matchMenteeId} onValueChange={setMatchMenteeId}>
                      <SelectTrigger><SelectValue placeholder={isAr ? "اختر متعلم" : "Select mentee"} /></SelectTrigger>
                      <SelectContent>
                        {pendingEnrollments.map(e => (
                          <SelectItem key={e.id} value={e.user_id}>
                            {e.profile?.full_name || e.user_id.slice(0, 8)} ({e.experience_level})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateMatch} disabled={createMatch.isPending} className="w-full">
                    {isAr ? "إنشاء المطابقة" : "Create Match"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {matches.length === 0 ? (
            <AdminEmptyState icon={Handshake} title="No matches" titleAr="لا توجد مطابقات" description="Mentor-mentee matches will appear here" descriptionAr="ستظهر المطابقات هنا عند إنشائها" />
          ) : (
            matches.map(m => (
              <Card key={m.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      <Avatar className="h-9 w-9 border-2 border-background">
                        <AvatarImage src={m.mentor_profile?.avatar_url || ""} />
                        <AvatarFallback className="text-xs">M</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-9 w-9 border-2 border-background">
                        <AvatarImage src={m.mentee_profile?.avatar_url || ""} />
                        <AvatarFallback className="text-xs">S</AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {m.mentor_profile?.full_name || "Mentor"} ↔ {m.mentee_profile?.full_name || "Mentee"}
                        </p>
                        <Badge className={statusColors[m.status] || ""}>{m.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {m.matched_at ? format(new Date(m.matched_at), "PPP") : "N/A"}
                      </p>
                    </div>
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
