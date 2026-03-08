import { useState, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Clock, MapPin, Trash2, Star, Edit, CalendarClock, Users } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  exhibitionId: string;
  isAr: boolean;
}

const CATEGORIES = [
  { value: "session", en: "Session", ar: "جلسة" },
  { value: "workshop", en: "Workshop", ar: "ورشة عمل" },
  { value: "keynote", en: "Keynote", ar: "كلمة رئيسية" },
  { value: "panel", en: "Panel", ar: "حلقة نقاش" },
  { value: "demo", en: "Demo", ar: "عرض" },
  { value: "networking", en: "Networking", ar: "تواصل" },
  { value: "break", en: "Break", ar: "استراحة" },
];

export function ExhibitionScheduleManager({ exhibitionId, isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", title_ar: "", description: "", description_ar: "",
    speaker_name: "", speaker_name_ar: "", location: "", location_ar: "",
    category: "session", start_time: "", end_time: "",
    max_attendees: "", is_featured: false,
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["schedule-items-manage", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_schedule_items")
        .select("id, exhibition_id, title, title_ar, description, description_ar, speaker_name, speaker_name_ar, speaker_image_url, location, location_ar, category, start_time, end_time, max_attendees, is_featured, sort_order, created_by, created_at, updated_at")
        .eq("exhibition_id", exhibitionId)
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        exhibition_id: exhibitionId,
        title: form.title,
        title_ar: form.title_ar || null,
        description: form.description || null,
        description_ar: form.description_ar || null,
        speaker_name: form.speaker_name || null,
        speaker_name_ar: form.speaker_name_ar || null,
        location: form.location || null,
        location_ar: form.location_ar || null,
        category: form.category,
        start_time: form.start_time,
        end_time: form.end_time,
        max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
        is_featured: form.is_featured,
        created_by: user?.id,
      };
      if (editingId) {
        const { error } = await supabase.from("exhibition_schedule_items").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("exhibition_schedule_items").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-items-manage", exhibitionId] });
      queryClient.invalidateQueries({ queryKey: ["exhibition-feature-counts"] });
      toast({ title: t("Saved ✅", "تم الحفظ ✅") });
      resetForm();
    },
    onError: () => toast({ title: t("Save failed", "فشل الحفظ"), variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exhibition_schedule_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-items-manage", exhibitionId] });
      toast({ title: t("Deleted", "تم الحذف") });
    },
  });

  const resetForm = () => {
    setForm({ title: "", title_ar: "", description: "", description_ar: "", speaker_name: "", speaker_name_ar: "", location: "", location_ar: "", category: "session", start_time: "", end_time: "", max_attendees: "", is_featured: false });
    setEditingId(null);
    setDialogOpen(false);
  };

  const openEdit = (item: any) => {
    setForm({
      title: item.title, title_ar: item.title_ar || "", description: item.description || "",
      description_ar: item.description_ar || "", speaker_name: item.speaker_name || "",
      speaker_name_ar: item.speaker_name_ar || "", location: item.location || "",
      location_ar: item.location_ar || "", category: item.category,
      start_time: item.start_time?.slice(0, 16) || "", end_time: item.end_time?.slice(0, 16) || "",
      max_attendees: item.max_attendees?.toString() || "", is_featured: item.is_featured || false,
    });
    setEditingId(item.id);
    setDialogOpen(true);
  };

  const catLabel = (cat: string) => {
    const found = CATEGORIES.find(c => c.value === cat);
    return found ? (isAr ? found.ar : found.en) : cat;
  };

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            {t("Schedule Items", "جدول الفعاليات")} ({items.length})
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-8 text-xs">
                <Plus className="h-3 w-3" />{t("Add", "إضافة")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-sm">{editingId ? t("Edit Item", "تعديل") : t("Add Schedule Item", "إضافة فعالية")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder={t("Title *", "العنوان *")} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="text-xs" />
                  <Input placeholder={t("Title (Arabic)", "العنوان (عربي)")} value={form.title_ar} onChange={e => setForm({ ...form, title_ar: e.target.value })} className="text-xs" dir="rtl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Textarea placeholder={t("Description", "الوصف")} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="text-xs min-h-[60px]" />
                  <Textarea placeholder={t("Description (Arabic)", "الوصف (عربي)")} value={form.description_ar} onChange={e => setForm({ ...form, description_ar: e.target.value })} className="text-xs min-h-[60px]" dir="rtl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder={t("Speaker Name", "اسم المتحدث")} value={form.speaker_name} onChange={e => setForm({ ...form, speaker_name: e.target.value })} className="text-xs" />
                  <Input placeholder={t("Speaker (Arabic)", "المتحدث (عربي)")} value={form.speaker_name_ar} onChange={e => setForm({ ...form, speaker_name_ar: e.target.value })} className="text-xs" dir="rtl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder={t("Location", "الموقع")} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="text-xs" />
                  <Input placeholder={t("Location (Arabic)", "الموقع (عربي)")} value={form.location_ar} onChange={e => setForm({ ...form, location_ar: e.target.value })} className="text-xs" dir="rtl" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value} className="text-xs">{isAr ? c.ar : c.en}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input type="number" placeholder={t("Max attendees", "الحد الأقصى")} value={form.max_attendees} onChange={e => setForm({ ...form, max_attendees: e.target.value })} className="text-xs" />
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} className="rounded" />
                    {t("Featured", "مميز")}
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">{t("Start Time *", "وقت البدء *")}</label>
                    <Input type="datetime-local" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">{t("End Time *", "وقت الانتهاء *")}</label>
                    <Input type="datetime-local" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="text-xs" />
                  </div>
                </div>
                <Button className="w-full" size="sm" disabled={!form.title || !form.start_time || !form.end_time || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                  {saveMutation.isPending ? "..." : editingId ? t("Update", "تحديث") : t("Add Item", "إضافة")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="py-10 text-center">
            <CalendarClock className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">{t("No schedule items yet", "لا توجد فعاليات بعد")}</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {items.map((item: any) => (
              <div key={item.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 shrink-0 mt-0.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Badge variant="secondary" className="text-[9px] h-4 capitalize">{catLabel(item.category)}</Badge>
                    {item.is_featured && <Star className="h-3 w-3 text-chart-4 fill-chart-4" />}
                  </div>
                  <p className="text-xs font-semibold truncate">{isAr && item.title_ar ? item.title_ar : item.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{format(new Date(item.start_time), "MMM d, HH:mm")} - {format(new Date(item.end_time), "HH:mm")}</span>
                    {item.location && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{isAr && item.location_ar ? item.location_ar : item.location}</span>}
                    {item.max_attendees && <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{item.max_attendees}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
