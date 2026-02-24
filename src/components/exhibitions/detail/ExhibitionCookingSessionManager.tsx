import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChefHat, Plus, Edit, Trash2, Radio, Check, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Props {
  exhibitionId: string;
  isAr: boolean;
}

export function ExhibitionCookingSessionManager({ exhibitionId, isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", title_ar: "", description: "", description_ar: "",
    chef_id: "", difficulty: "intermediate",
    scheduled_start: "", scheduled_end: "",
    max_participants: 30, cuisine_type: "",
    ingredients: "",
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["mgmt-cooking-sessions", exhibitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("exhibition_cooking_sessions")
        .select("*")
        .eq("exhibition_id", exhibitionId)
        .order("scheduled_start");
      return data || [];
    },
    staleTime: 1000 * 30,
  });

  const { data: regCounts = {} } = useQuery({
    queryKey: ["mgmt-cooking-reg-counts", exhibitionId],
    queryFn: async () => {
      if (!sessions.length) return {};
      const ids = sessions.map((s: any) => s.id);
      const { data } = await supabase
        .from("exhibition_session_registrations")
        .select("session_id")
        .in("session_id", ids);
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => counts[r.session_id] = (counts[r.session_id] || 0) + 1);
      return counts;
    },
    enabled: sessions.length > 0,
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        exhibition_id: exhibitionId,
        title: form.title,
        title_ar: form.title_ar || null,
        description: form.description || null,
        description_ar: form.description_ar || null,
        chef_id: form.chef_id || user?.id,
        difficulty: form.difficulty,
        scheduled_start: form.scheduled_start,
        scheduled_end: form.scheduled_end,
        max_participants: form.max_participants,
        cuisine_type: form.cuisine_type || null,
        ingredients: form.ingredients ? form.ingredients.split(",").map(s => s.trim()).filter(Boolean) : [],
      };

      if (editingId) {
        const { error } = await supabase.from("exhibition_cooking_sessions").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("exhibition_cooking_sessions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? t("Session updated", "تم تحديث الجلسة") : t("Session created", "تم إنشاء الجلسة"));
      queryClient.invalidateQueries({ queryKey: ["mgmt-cooking-sessions"] });
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("exhibition_cooking_sessions").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("Status updated", "تم تحديث الحالة"));
      queryClient.invalidateQueries({ queryKey: ["mgmt-cooking-sessions"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exhibition_cooking_sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("Session deleted", "تم حذف الجلسة"));
      queryClient.invalidateQueries({ queryKey: ["mgmt-cooking-sessions"] });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ title: "", title_ar: "", description: "", description_ar: "", chef_id: "", difficulty: "intermediate", scheduled_start: "", scheduled_end: "", max_participants: 30, cuisine_type: "", ingredients: "" });
  };

  const editSession = (s: any) => {
    setForm({
      title: s.title || "",
      title_ar: s.title_ar || "",
      description: s.description || "",
      description_ar: s.description_ar || "",
      chef_id: s.chef_id || "",
      difficulty: s.difficulty || "intermediate",
      scheduled_start: s.scheduled_start ? format(new Date(s.scheduled_start), "yyyy-MM-dd'T'HH:mm") : "",
      scheduled_end: s.scheduled_end ? format(new Date(s.scheduled_end), "yyyy-MM-dd'T'HH:mm") : "",
      max_participants: s.max_participants || 30,
      cuisine_type: s.cuisine_type || "",
      ingredients: (s.ingredients || []).join(", "),
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { cls: string; icon: any }> = {
      live: { cls: "bg-destructive text-destructive-foreground", icon: Radio },
      completed: { cls: "bg-muted text-muted-foreground", icon: Check },
      scheduled: { cls: "bg-primary/10 text-primary", icon: Clock },
      cancelled: { cls: "bg-destructive/20 text-destructive", icon: Trash2 },
    };
    const cfg = map[status] || map.scheduled;
    return <Badge className={`${cfg.cls} text-[10px] gap-1`}><cfg.icon className="h-2.5 w-2.5" />{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ChefHat className="h-4 w-4 text-primary" />
          {t("Cooking Sessions", "جلسات الطهي")} ({sessions.length})
        </h3>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-3.5 w-3.5 me-1" />{t("Add Session", "إضافة جلسة")}
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">{editingId ? t("Edit Session", "تعديل الجلسة") : t("New Session", "جلسة جديدة")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label className="text-xs">{t("Title (EN)", "العنوان (EN)")}</Label><Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="text-sm" /></div>
              <div><Label className="text-xs">{t("Title (AR)", "العنوان (AR)")}</Label><Input value={form.title_ar} onChange={e => setForm(f => ({...f, title_ar: e.target.value}))} className="text-sm" dir="rtl" /></div>
              <div><Label className="text-xs">{t("Start", "البداية")}</Label><Input type="datetime-local" value={form.scheduled_start} onChange={e => setForm(f => ({...f, scheduled_start: e.target.value}))} className="text-sm" /></div>
              <div><Label className="text-xs">{t("End", "النهاية")}</Label><Input type="datetime-local" value={form.scheduled_end} onChange={e => setForm(f => ({...f, scheduled_end: e.target.value}))} className="text-sm" /></div>
              <div>
                <Label className="text-xs">{t("Difficulty", "المستوى")}</Label>
                <Select value={form.difficulty} onValueChange={v => setForm(f => ({...f, difficulty: v}))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">{t("Beginner", "مبتدئ")}</SelectItem>
                    <SelectItem value="intermediate">{t("Intermediate", "متوسط")}</SelectItem>
                    <SelectItem value="advanced">{t("Advanced", "متقدم")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">{t("Max Participants", "الحد الأقصى")}</Label><Input type="number" value={form.max_participants} onChange={e => setForm(f => ({...f, max_participants: +e.target.value}))} className="text-sm" /></div>
              <div><Label className="text-xs">{t("Cuisine Type", "نوع المطبخ")}</Label><Input value={form.cuisine_type} onChange={e => setForm(f => ({...f, cuisine_type: e.target.value}))} className="text-sm" /></div>
              <div><Label className="text-xs">{t("Ingredients (comma-separated)", "المكونات (مفصولة بفواصل)")}</Label><Input value={form.ingredients} onChange={e => setForm(f => ({...f, ingredients: e.target.value}))} className="text-sm" /></div>
            </div>
            <div><Label className="text-xs">{t("Description (EN)", "الوصف (EN)")}</Label><Textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="text-sm" rows={2} /></div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => saveMut.mutate()} disabled={!form.title || !form.scheduled_start || saveMut.isPending}>
                {editingId ? t("Update", "تحديث") : t("Create", "إنشاء")}
              </Button>
              <Button size="sm" variant="outline" onClick={resetForm}>{t("Cancel", "إلغاء")}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{t("Title", "العنوان")}</TableHead>
                  <TableHead className="text-xs">{t("Time", "الوقت")}</TableHead>
                  <TableHead className="text-xs">{t("Status", "الحالة")}</TableHead>
                  <TableHead className="text-xs">{t("Registrations", "التسجيلات")}</TableHead>
                  <TableHead className="text-xs">{t("Actions", "إجراءات")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs font-medium">{isAr ? s.title_ar || s.title : s.title}</TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">
                      {format(new Date(s.scheduled_start), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell>{statusBadge(s.status)}</TableCell>
                    <TableCell>
                      <span className="text-xs flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {regCounts[s.id] || 0}/{s.max_participants || "∞"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {s.status === "scheduled" && (
                          <Button size="sm" variant="outline" className="h-6 text-[9px]" onClick={() => statusMut.mutate({ id: s.id, status: "live" })}>
                            <Radio className="h-2.5 w-2.5 me-0.5" />{t("Go Live", "بث")}
                          </Button>
                        )}
                        {s.status === "live" && (
                          <Button size="sm" variant="outline" className="h-6 text-[9px]" onClick={() => statusMut.mutate({ id: s.id, status: "completed" })}>
                            <Check className="h-2.5 w-2.5 me-0.5" />{t("End", "إنهاء")}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => editSession(s)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => deleteMut.mutate(s.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {sessions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                      {t("No cooking sessions yet", "لا توجد جلسات طهي بعد")}
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
