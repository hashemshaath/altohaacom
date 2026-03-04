import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { BookOpen, Plus, Trash2 } from "lucide-react";

const programTypes = ["diploma", "degree", "certificate", "course", "workshop", "bootcamp", "apprenticeship"];
const programLevels = ["beginner", "intermediate", "advanced", "professional", "bachelor", "master", "doctorate"];
const programStatuses = ["draft", "open", "in_progress", "completed", "cancelled"];

const programTypeLabels: Record<string, { en: string; ar: string }> = {
  diploma: { en: "Diploma", ar: "دبلوم" }, degree: { en: "Degree", ar: "درجة علمية" },
  certificate: { en: "Certificate", ar: "شهادة" }, course: { en: "Course", ar: "دورة" },
  workshop: { en: "Workshop", ar: "ورشة عمل" }, bootcamp: { en: "Bootcamp", ar: "معسكر تدريبي" },
  apprenticeship: { en: "Apprenticeship", ar: "تدريب مهني" },
};
const programLevelLabels: Record<string, { en: string; ar: string }> = {
  beginner: { en: "Beginner", ar: "مبتدئ" }, intermediate: { en: "Intermediate", ar: "متوسط" },
  advanced: { en: "Advanced", ar: "متقدم" }, professional: { en: "Professional", ar: "محترف" },
  bachelor: { en: "Bachelor", ar: "بكالوريوس" }, master: { en: "Master", ar: "ماجستير" },
  doctorate: { en: "Doctorate", ar: "دكتوراه" },
};
const programStatusLabels: Record<string, { en: string; ar: string }> = {
  draft: { en: "Draft", ar: "مسودة" }, open: { en: "Open", ar: "مفتوح" },
  in_progress: { en: "In Progress", ar: "قيد التنفيذ" }, completed: { en: "Completed", ar: "مكتمل" },
  cancelled: { en: "Cancelled", ar: "ملغى" },
};

interface Props {
  entityId: string;
  onDeleteRequest: (type: string, id: string, name: string) => void;
}

export function EntityProgramsTab({ entityId, onDeleteRequest }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", name_ar: "", description: "", program_type: "course", level: "beginner", duration_months: "", status: "draft", max_students: "", tuition_fee: "", start_date: "", end_date: "" });

  const { data: programs } = useQuery({
    queryKey: ["admin-entity-programs", entityId],
    queryFn: async () => {
      const { data, error } = await supabase.from("entity_programs").select("id, name, name_ar, description, program_type, level, duration_months, status, max_students, tuition_fee, start_date, end_date, created_at").eq("entity_id", entityId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("entity_programs").insert({
        entity_id: entityId, name: form.name, name_ar: form.name_ar || null,
        description: form.description || null, program_type: form.program_type,
        level: form.level, duration_months: form.duration_months ? parseInt(form.duration_months) : null,
        status: form.status, max_students: form.max_students ? parseInt(form.max_students) : null,
        tuition_fee: form.tuition_fee ? parseFloat(form.tuition_fee) : null,
        start_date: form.start_date || null, end_date: form.end_date || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-entity-programs", entityId] });
      toast({ title: isAr ? "تم إضافة البرنامج" : "Program added" });
      setShowForm(false);
      setForm({ name: "", name_ar: "", description: "", program_type: "course", level: "beginner", duration_months: "", status: "draft", max_students: "", tuition_fee: "", start_date: "", end_date: "" });
    },
  });

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{programs?.length || 0} {isAr ? "برنامج" : "programs"}</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="me-1 h-3.5 w-3.5" />{isAr ? "برنامج جديد" : "Add Program"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 space-y-3 bg-muted/30">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>{isAr ? "الاسم (EN)" : "Name (EN)"} *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>{isAr ? "الاسم (AR)" : "Name (AR)"}</Label><Input value={form.name_ar} onChange={e => setForm(p => ({ ...p, name_ar: e.target.value }))} dir="rtl" /></div>
          </div>
          <div><Label>{isAr ? "الوصف" : "Description"}</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <Label>{isAr ? "النوع" : "Type"}</Label>
              <Select value={form.program_type} onValueChange={v => setForm(p => ({ ...p, program_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{programTypes.map(t => <SelectItem key={t} value={t}>{isAr ? programTypeLabels[t]?.ar : programTypeLabels[t]?.en}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isAr ? "المستوى" : "Level"}</Label>
              <Select value={form.level} onValueChange={v => setForm(p => ({ ...p, level: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{programLevels.map(l => <SelectItem key={l} value={l}>{isAr ? programLevelLabels[l]?.ar : programLevelLabels[l]?.en}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{isAr ? "المدة (أشهر)" : "Duration (months)"}</Label><Input type="number" value={form.duration_months} onChange={e => setForm(p => ({ ...p, duration_months: e.target.value }))} /></div>
            <div>
              <Label>{isAr ? "الحالة" : "Status"}</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{programStatuses.map(s => <SelectItem key={s} value={s}>{isAr ? programStatusLabels[s]?.ar : programStatusLabels[s]?.en}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div><Label>{isAr ? "الحد الأقصى للطلاب" : "Max Students"}</Label><Input type="number" value={form.max_students} onChange={e => setForm(p => ({ ...p, max_students: e.target.value }))} /></div>
            <div><Label>{isAr ? "الرسوم" : "Tuition Fee"}</Label><Input type="number" value={form.tuition_fee} onChange={e => setForm(p => ({ ...p, tuition_fee: e.target.value }))} /></div>
            <div><Label>{isAr ? "تاريخ البدء" : "Start Date"}</Label><Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} /></div>
            <div><Label>{isAr ? "تاريخ الانتهاء" : "End Date"}</Label><Input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}>
              {saveMutation.isPending ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ البرنامج" : "Save Program")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
          </div>
        </Card>
      )}

      {programs && programs.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "البرنامج" : "Program"}</TableHead>
                <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                <TableHead>{isAr ? "المستوى" : "Level"}</TableHead>
                <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead>{isAr ? "المدة" : "Duration"}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{isAr && p.name_ar ? p.name_ar : p.name}</TableCell>
                  <TableCell><Badge variant="secondary">{isAr ? programTypeLabels[p.program_type]?.ar : programTypeLabels[p.program_type]?.en || p.program_type}</Badge></TableCell>
                  <TableCell>{isAr ? programLevelLabels[p.level || ""]?.ar : programLevelLabels[p.level || ""]?.en || p.level || "-"}</TableCell>
                  <TableCell><Badge variant={p.status === "open" ? "default" : "secondary"}>{isAr ? programStatusLabels[p.status || ""]?.ar : programStatusLabels[p.status || ""]?.en || p.status}</Badge></TableCell>
                  <TableCell>{p.duration_months ? `${p.duration_months} ${isAr ? "شهر" : "mo"}` : "-"}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onDeleteRequest("program", p.id, isAr && p.name_ar ? p.name_ar : p.name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : !showForm && (
        <div className="py-12 text-center">
          <BookOpen className="mx-auto mb-2 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{isAr ? "لا توجد برامج بعد" : "No programs yet"}</p>
        </div>
      )}
    </div>
  );
}
