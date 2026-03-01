import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { HandHeart, CheckCircle2, XCircle, Clock, ClipboardList, Plus, Users } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";

interface Props {
  exhibitionId: string;
  isAr: boolean;
}

export function ExhibitionVolunteerManager({ exhibitionId, isAr }: Props) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [taskDialog, setTaskDialog] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");

  const { data: volunteers = [] } = useQuery({
    queryKey: ["org-volunteers", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_volunteers")
        .select("*")
        .eq("exhibition_id", exhibitionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: profiles = {} } = useQuery({
    queryKey: ["vol-profiles", exhibitionId],
    queryFn: async () => {
      const userIds = volunteers.map((v: any) => v.user_id);
      if (userIds.length === 0) return {};
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url, email")
        .in("user_id", userIds);
      const map: Record<string, any> = {};
      (data || []).forEach((p: any) => { map[p.user_id] = p; });
      return map;
    },
    enabled: volunteers.length > 0,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["vol-tasks", exhibitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("exhibition_volunteer_tasks")
        .select("*")
        .eq("exhibition_id", exhibitionId)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, roleTitle }: { id: string; status: string; roleTitle?: string }) => {
      const updates: any = { status, reviewed_at: new Date().toISOString() };
      if (roleTitle) updates.role_title = roleTitle;
      const { error } = await supabase.from("exhibition_volunteers").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("Updated", "تم التحديث"));
      queryClient.invalidateQueries({ queryKey: ["org-volunteers", exhibitionId] });
    },
  });

  const createTask = useMutation({
    mutationFn: async () => {
      if (!taskDialog || !taskTitle) return;
      const { error } = await supabase.from("exhibition_volunteer_tasks").insert({
        exhibition_id: exhibitionId,
        volunteer_id: taskDialog,
        title: taskTitle,
        description: taskDesc || null,
        priority: taskPriority,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("Task assigned", "تم تعيين المهمة"));
      setTaskDialog(null);
      setTaskTitle("");
      setTaskDesc("");
      queryClient.invalidateQueries({ queryKey: ["vol-tasks", exhibitionId] });
    },
  });

  const filtered = filter === "all" ? volunteers : volunteers.filter((v: any) => v.status === filter);
  const counts = { all: volunteers.length, pending: 0, approved: 0, rejected: 0 };
  volunteers.forEach((v: any) => { if (counts[v.status as keyof typeof counts] !== undefined) counts[v.status as keyof typeof counts]++; });

  const statusBadge = (s: string) => {
    const map: Record<string, { icon: React.ReactNode; cls: string }> = {
      pending: { icon: <Clock className="h-2.5 w-2.5" />, cls: "bg-chart-4/10 text-chart-4" },
      approved: { icon: <CheckCircle2 className="h-2.5 w-2.5" />, cls: "bg-chart-3/10 text-chart-3" },
      rejected: { icon: <XCircle className="h-2.5 w-2.5" />, cls: "bg-destructive/10 text-destructive" },
      checked_in: { icon: <CheckCircle2 className="h-2.5 w-2.5" />, cls: "bg-primary/10 text-primary" },
    };
    const m = map[s] || map.pending;
    return <Badge className={`${m.cls} text-[10px] gap-0.5`}>{m.icon}{s}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { l: t("Total", "الكل"), v: counts.all, c: "text-primary" },
          { l: t("Pending", "بانتظار"), v: counts.pending, c: "text-chart-4" },
          { l: t("Approved", "مقبول"), v: counts.approved, c: "text-chart-3" },
          { l: t("Rejected", "مرفوض"), v: counts.rejected, c: "text-destructive" },
        ].map((s) => (
          <Card key={s.l} className="border-border/40">
            <CardContent className="p-3 text-center">
              <AnimatedCounter value={s.v} className={`text-xl font-bold ${s.c}`} />
              <p className="text-[10px] text-muted-foreground">{s.l}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "pending", "approved", "rejected"].map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className="text-xs">
            {f === "all" ? t("All", "الكل") : f === "pending" ? t("Pending", "بانتظار") : f === "approved" ? t("Approved", "مقبول") : t("Rejected", "مرفوض")}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t("Volunteers", "المتطوعون")} ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{t("Name", "الاسم")}</TableHead>
                  <TableHead className="text-xs">{t("Skills", "المهارات")}</TableHead>
                  <TableHead className="text-xs">{t("Status", "الحالة")}</TableHead>
                  <TableHead className="text-xs">{t("Applied", "التقديم")}</TableHead>
                  <TableHead className="text-xs">{t("Actions", "إجراءات")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v: any) => {
                  const p = (profiles as any)[v.user_id];
                  const taskCount = tasks.filter((tk: any) => tk.volunteer_id === v.id).length;
                  return (
                    <TableRow key={v.id}>
                      <TableCell className="text-xs font-medium">{p?.full_name || p?.username || "—"}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-wrap gap-1">
                          {(v.skills || []).slice(0, 3).map((s: string) => (
                            <Badge key={s} variant="outline" className="text-[9px]">{s}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{statusBadge(v.status)}</TableCell>
                      <TableCell className="text-[10px] text-muted-foreground">{format(new Date(v.created_at), "MMM d")}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {v.status === "pending" && (
                            <>
                              <Button size="sm" variant="outline" className="h-7 text-[10px] text-chart-3" onClick={() => updateStatus.mutate({ id: v.id, status: "approved" })}>
                                <CheckCircle2 className="h-3 w-3 me-1" />{t("Approve", "قبول")}
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-[10px] text-destructive" onClick={() => updateStatus.mutate({ id: v.id, status: "rejected" })}>
                                <XCircle className="h-3 w-3 me-1" />{t("Reject", "رفض")}
                              </Button>
                            </>
                          )}
                          <Dialog open={taskDialog === v.id} onOpenChange={(o) => { if (!o) setTaskDialog(null); }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => setTaskDialog(v.id)}>
                                <ClipboardList className="h-3 w-3 me-1" />
                                {taskCount > 0 && <span className="text-primary">{taskCount}</span>}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle className="text-sm">{t("Assign Task", "تعيين مهمة")}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-3">
                                <Input placeholder={t("Task title", "عنوان المهمة")} value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                                <Textarea placeholder={t("Description", "الوصف")} value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} rows={2} />
                                <Select value={taskPriority} onValueChange={setTaskPriority}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">{t("Low", "منخفض")}</SelectItem>
                                    <SelectItem value="medium">{t("Medium", "متوسط")}</SelectItem>
                                    <SelectItem value="high">{t("High", "عالي")}</SelectItem>
                                    <SelectItem value="urgent">{t("Urgent", "عاجل")}</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button onClick={() => createTask.mutate()} disabled={!taskTitle || createTask.isPending} className="w-full">
                                  <Plus className="h-4 w-4 me-2" />{t("Assign", "تعيين")}
                                </Button>

                                {/* Existing tasks */}
                                {tasks.filter((tk: any) => tk.volunteer_id === v.id).length > 0 && (
                                  <div className="border-t pt-3 space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground">{t("Assigned Tasks", "المهام المعينة")}</p>
                                    {tasks.filter((tk: any) => tk.volunteer_id === v.id).map((tk: any) => (
                                      <div key={tk.id} className="flex items-center gap-2 text-xs p-2 rounded-md bg-muted/40">
                                        <Badge variant="outline" className="text-[9px]">{tk.priority}</Badge>
                                        <span className="flex-1">{tk.title}</span>
                                        <Badge variant="outline" className="text-[9px]">{tk.status}</Badge>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">
                      <HandHeart className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                      {t("No volunteers yet", "لا يوجد متطوعين بعد")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
