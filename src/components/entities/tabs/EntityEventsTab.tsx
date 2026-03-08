import { useState, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

const eventTypes = ["competition", "workshop", "seminar", "conference", "exhibition", "graduation", "open_day", "general"];

const eventTypeLabels: Record<string, { en: string; ar: string }> = {
  competition: { en: "Competition", ar: "مسابقة" }, workshop: { en: "Workshop", ar: "ورشة عمل" },
  seminar: { en: "Seminar", ar: "ندوة" }, conference: { en: "Conference", ar: "مؤتمر" },
  exhibition: { en: "Exhibition", ar: "معرض" }, graduation: { en: "Graduation", ar: "حفل تخرج" },
  open_day: { en: "Open Day", ar: "يوم مفتوح" }, general: { en: "General", ar: "عام" },
};
const eventStatusLabels: Record<string, { en: string; ar: string }> = {
  draft: { en: "Draft", ar: "مسودة" }, upcoming: { en: "Upcoming", ar: "قادم" },
  ongoing: { en: "Ongoing", ar: "جاري" }, completed: { en: "Completed", ar: "مكتمل" },
  cancelled: { en: "Cancelled", ar: "ملغى" },
};

interface Props {
  entityId: string;
  onDeleteRequest: (type: string, id: string, name: string) => void;
}

export const EntityEventsTab = memo(function EntityEventsTab({ entityId, onDeleteRequest }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", title_ar: "", description: "", event_type: "general", start_date: "", end_date: "", location: "", is_virtual: false, max_attendees: "", status: "upcoming" });

  const { data: events } = useQuery({
    queryKey: ["admin-entity-events", entityId],
    queryFn: async () => {
      const { data, error } = await supabase.from("entity_events").select("id, entity_id, title, title_ar, description, event_type, start_date, end_date, location, is_virtual, max_attendees, status, created_at").eq("entity_id", entityId).order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("entity_events").insert({
        entity_id: entityId, title: form.title, title_ar: form.title_ar || null,
        description: form.description || null, event_type: form.event_type,
        start_date: form.start_date || null, end_date: form.end_date || null,
        location: form.location || null, is_virtual: form.is_virtual,
        max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
        status: form.status, created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-entity-events", entityId] });
      toast({ title: isAr ? "تم إضافة الفعالية" : "Event added" });
      setShowForm(false);
      setForm({ title: "", title_ar: "", description: "", event_type: "general", start_date: "", end_date: "", location: "", is_virtual: false, max_attendees: "", status: "upcoming" });
    },
  });

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{events?.length || 0} {isAr ? "فعالية" : "events"}</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="me-1 h-3.5 w-3.5" />{isAr ? "فعالية جديدة" : "Add Event"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 space-y-3 bg-muted/30">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>{isAr ? "العنوان (EN)" : "Title (EN)"} *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
            <div><Label>{isAr ? "العنوان (AR)" : "Title (AR)"}</Label><Input value={form.title_ar} onChange={e => setForm(p => ({ ...p, title_ar: e.target.value }))} dir="rtl" /></div>
          </div>
          <div><Label>{isAr ? "الوصف" : "Description"}</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <Label>{isAr ? "النوع" : "Type"}</Label>
              <Select value={form.event_type} onValueChange={v => setForm(p => ({ ...p, event_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{eventTypes.map(t => <SelectItem key={t} value={t}>{isAr ? eventTypeLabels[t]?.ar : eventTypeLabels[t]?.en}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{isAr ? "الموقع" : "Location"}</Label><Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} /></div>
            <div><Label>{isAr ? "البداية" : "Start"}</Label><Input type="datetime-local" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} /></div>
            <div><Label>{isAr ? "النهاية" : "End"}</Label><Input type="datetime-local" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} /></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_virtual} onCheckedChange={v => setForm(p => ({ ...p, is_virtual: v }))} />
              <Label>{isAr ? "افتراضي" : "Virtual"}</Label>
            </div>
            <div className="w-32"><Label>{isAr ? "الحد الأقصى" : "Max Attendees"}</Label><Input type="number" value={form.max_attendees} onChange={e => setForm(p => ({ ...p, max_attendees: e.target.value }))} /></div>
            <div>
              <Label>{isAr ? "الحالة" : "Status"}</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(eventStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => saveMutation.mutate()} disabled={!form.title || saveMutation.isPending}>
              {saveMutation.isPending ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ الفعالية" : "Save Event")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
          </div>
        </Card>
      )}

      {events && events.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "الفعالية" : "Event"}</TableHead>
                <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{isAr && e.title_ar ? e.title_ar : e.title}</TableCell>
                  <TableCell><Badge variant="secondary">{isAr ? eventTypeLabels[e.event_type]?.ar : eventTypeLabels[e.event_type]?.en || e.event_type}</Badge></TableCell>
                  <TableCell>{e.start_date ? format(new Date(e.start_date), "MMM d, yyyy") : "-"}</TableCell>
                  <TableCell><Badge variant={e.status === "upcoming" ? "default" : "secondary"}>{isAr ? eventStatusLabels[e.status || ""]?.ar : eventStatusLabels[e.status || ""]?.en || e.status}</Badge></TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onDeleteRequest("event", e.id, isAr && e.title_ar ? e.title_ar : e.title)}>
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
          <Calendar className="mx-auto mb-2 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{isAr ? "لا توجد فعاليات بعد" : "No events yet"}</p>
        </div>
      )}
    </div>
  );
});
