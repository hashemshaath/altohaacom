import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, Calendar, MapPin, Trophy } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { format } from "date-fns";

interface Props {
  userId: string;
  isAdmin?: boolean;
}

const eventTypes = [
  { value: "competition", en: "Competition", ar: "مسابقة" },
  { value: "exhibition", en: "Exhibition", ar: "معرض" },
  { value: "conference", en: "Conference", ar: "مؤتمر" },
  { value: "workshop", en: "Workshop", ar: "ورشة عمل" },
  { value: "visit", en: "Official Visit", ar: "زيارة رسمية" },
  { value: "training", en: "Training", ar: "تدريب" },
];

const roleOptions = [
  { value: "judge", en: "Judge", ar: "محكّم" },
  { value: "head_judge", en: "Head Judge", ar: "رئيس لجنة التحكيم" },
  { value: "speaker", en: "Speaker", ar: "متحدث" },
  { value: "trainer", en: "Trainer", ar: "مدرب" },
  { value: "attendee", en: "Attendee", ar: "حاضر" },
  { value: "organizer", en: "Organizer", ar: "منظم" },
];

const emptyForm = {
  event_type: "competition", event_name: "", event_name_ar: "",
  location: "", country: "", start_date: "", end_date: "",
  role_played: "judge", notes: "", achievements: "",
};

export default function JudgeVisitLogsPanel({ userId, isAdmin }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: logs, isLoading } = useQuery({
    queryKey: ["judge-visit-logs", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("judge_visit_logs")
        .select("id, user_id, competition_id, event_name, event_name_ar, event_type, role_played, location, country, start_date, end_date, achievements, notes, created_by, created_at, updated_at")
        .eq("user_id", userId)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: userId,
        event_type: form.event_type,
        event_name: form.event_name,
        event_name_ar: form.event_name_ar || null,
        location: form.location || null,
        country: form.country || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        role_played: form.role_played || null,
        notes: form.notes || null,
        achievements: form.achievements || null,
        created_by: user?.id,
      };
      if (editingId) {
        const { error } = await supabase.from("judge_visit_logs").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("judge_visit_logs").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["judge-visit-logs", userId] });
      toast({ title: editingId ? (isAr ? "تم التحديث" : "Updated") : (isAr ? "تم الإضافة" : "Added") });
      resetForm();
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("judge_visit_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["judge-visit-logs", userId] });
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
    },
  });

  const resetForm = () => { setForm(emptyForm); setEditingId(null); setShowForm(false); };

  const startEdit = (log: any) => {
    setForm({
      event_type: log.event_type || "competition",
      event_name: log.event_name || "",
      event_name_ar: log.event_name_ar || "",
      location: log.location || "",
      country: log.country || "",
      start_date: log.start_date || "",
      end_date: log.end_date || "",
      role_played: log.role_played || "judge",
      notes: log.notes || "",
      achievements: log.achievements || "",
    });
    setEditingId(log.id);
    setShowForm(true);
  };

  const stats = {
    total: logs?.length || 0,
    competitions: logs?.filter(l => l.event_type === "competition").length || 0,
    countries: new Set(logs?.map(l => l.country).filter(Boolean)).size,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{isAr ? "سجل الزيارات والمشاركات" : "Visit & Participation Log"}</h3>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? (isAr ? "إغلاق" : "Close") : <><Plus className="me-2 h-4 w-4" />{isAr ? "إضافة سجل" : "Add Entry"}</>}
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-3 text-center"><AnimatedCounter value={stats.total} className="text-xl font-bold text-primary" /><p className="text-xs text-muted-foreground">{isAr ? "إجمالي" : "Total Events"}</p></Card>
        <Card className="p-3 text-center"><AnimatedCounter value={stats.competitions} className="text-xl font-bold text-primary" /><p className="text-xs text-muted-foreground">{isAr ? "مسابقات" : "Competitions"}</p></Card>
        <Card className="p-3 text-center"><AnimatedCounter value={stats.countries} className="text-xl font-bold text-primary" /><p className="text-xs text-muted-foreground">{isAr ? "دول" : "Countries"}</p></Card>
      </div>

      {showForm && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>{isAr ? "نوع الفعالية" : "Event Type"}</Label>
                <Select value={form.event_type} onValueChange={v => setForm(p => ({ ...p, event_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {eventTypes.map(e => <SelectItem key={e.value} value={e.value}>{isAr ? e.ar : e.en}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isAr ? "الدور" : "Role Played"}</Label>
                <Select value={form.role_played} onValueChange={v => setForm(p => ({ ...p, role_played: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roleOptions.map(r => <SelectItem key={r.value} value={r.value}>{isAr ? r.ar : r.en}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>{isAr ? "اسم الفعالية (EN)" : "Event Name (EN)"} *</Label><Input value={form.event_name} onChange={e => setForm(p => ({ ...p, event_name: e.target.value }))} /></div>
              <div><Label>{isAr ? "اسم الفعالية (AR)" : "Event Name (AR)"}</Label><Input value={form.event_name_ar} onChange={e => setForm(p => ({ ...p, event_name_ar: e.target.value }))} dir="rtl" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div><Label>{isAr ? "الموقع" : "Location"}</Label><Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} /></div>
              <div><Label>{isAr ? "الدولة" : "Country"}</Label><Input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} /></div>
              <div><Label>{isAr ? "تاريخ البداية" : "Start Date"}</Label><Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} /></div>
              <div><Label>{isAr ? "تاريخ النهاية" : "End Date"}</Label><Input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>{isAr ? "الإنجازات" : "Achievements"}</Label><Input value={form.achievements} onChange={e => setForm(p => ({ ...p, achievements: e.target.value }))} placeholder={isAr ? "مثل: جائزة أفضل محكّم" : "e.g. Best Judge Award"} /></div>
              <div><Label>{isAr ? "ملاحظات" : "Notes"}</Label><Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.event_name}>
                {saveMutation.isPending ? "..." : editingId ? (isAr ? "تحديث" : "Update") : (isAr ? "إضافة" : "Add")}
              </Button>
              <Button variant="outline" onClick={resetForm}>{isAr ? "إلغاء" : "Cancel"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                <TableHead>{isAr ? "الفعالية" : "Event"}</TableHead>
                <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                <TableHead>{isAr ? "الدور" : "Role"}</TableHead>
                <TableHead>{isAr ? "الموقع" : "Location"}</TableHead>
                <TableHead>{isAr ? "الإنجازات" : "Achievements"}</TableHead>
                <TableHead className="text-end">{isAr ? "الإجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">{isAr ? "جاري التحميل..." : "Loading..."}</TableCell></TableRow>
              ) : logs?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{isAr ? "لا توجد سجلات" : "No records yet"}</TableCell></TableRow>
              ) : (
                logs?.map(log => {
                  const eventLabel = eventTypes.find(e => e.value === log.event_type);
                  const roleLabel = roleOptions.find(r => r.value === log.role_played);
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {log.start_date ? format(new Date(log.start_date), "yyyy-MM-dd") : "—"}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{isAr && log.event_name_ar ? log.event_name_ar : log.event_name}</p>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{isAr ? eventLabel?.ar : eventLabel?.en}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{isAr ? roleLabel?.ar : roleLabel?.en}</Badge></TableCell>
                      <TableCell>
                        {log.location || log.country ? (
                          <span className="flex items-center gap-1 text-sm"><MapPin className="h-3 w-3" />{log.location}{log.country ? `, ${log.country}` : ""}</span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {log.achievements ? (
                          <Badge className="bg-chart-4/20 text-chart-4"><Trophy className="me-1 h-3 w-3" />{log.achievements}</Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => startEdit(log)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(log.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
