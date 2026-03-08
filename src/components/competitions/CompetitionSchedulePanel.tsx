import { useState, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Plus, CalendarClock, Coffee, Trophy, Settings2, Scale, Clock, MapPin, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Props {
  competitionId: string;
  isOrganizer: boolean;
}

const SLOT_TYPES = [
  { value: "competition", en: "Competition", ar: "مسابقة", icon: Trophy, color: "bg-primary/10 text-primary" },
  { value: "break", en: "Break", ar: "استراحة", icon: Coffee, color: "bg-chart-4/10 text-chart-4" },
  { value: "ceremony", en: "Ceremony", ar: "حفل", icon: Trophy, color: "bg-chart-5/10 text-chart-5" },
  { value: "setup", en: "Setup", ar: "تجهيز", icon: Settings2, color: "bg-muted text-muted-foreground" },
  { value: "judging", en: "Judging", ar: "تحكيم", icon: Scale, color: "bg-chart-3/10 text-chart-3" },
];

export function CompetitionSchedulePanel({ competitionId, isOrganizer }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "", title_ar: "", slot_type: "competition",
    start_time: "", end_time: "", station_number: "",
    location: "", location_ar: "", notes: "",
  });

  const { data: slots, isLoading } = useQuery({
    queryKey: ["competition-schedule", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_schedule_slots")
        .select("id, competition_id, title, title_ar, slot_type, start_time, end_time, station_number, location, location_ar, notes, sort_order")
        .eq("competition_id", competitionId)
        .order("start_time");
      if (error) throw error;
      return data;
    },
  });

  const createSlot = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("competition_schedule_slots").insert({
        competition_id: competitionId,
        title: form.title,
        title_ar: form.title_ar || undefined,
        slot_type: form.slot_type,
        start_time: form.start_time,
        end_time: form.end_time,
        station_number: form.station_number || undefined,
        location: form.location || undefined,
        location_ar: form.location_ar || undefined,
        notes: form.notes || undefined,
        sort_order: (slots?.length || 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-schedule", competitionId] });
      setShowCreate(false);
      setForm({ title: "", title_ar: "", slot_type: "competition", start_time: "", end_time: "", station_number: "", location: "", location_ar: "", notes: "" });
      toast({ title: isAr ? "تمت الإضافة" : "Slot added" });
    },
    onError: () => toast({ title: isAr ? "خطأ" : "Error", variant: "destructive" }),
  });

  const deleteSlot = useMutation({
    mutationFn: async (slotId: string) => {
      const { error } = await supabase.from("competition_schedule_slots").delete().eq("id", slotId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-schedule", competitionId] });
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;

  // Group by date
  const groupedByDate: Record<string, typeof slots> = {};
  slots?.forEach(slot => {
    const dateKey = format(new Date(slot.start_time), "yyyy-MM-dd");
    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
    groupedByDate[dateKey]!.push(slot);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10">
            <CalendarClock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{isAr ? "الجدول الزمني" : "Schedule"}</h3>
            <p className="text-xs text-muted-foreground">{isAr ? "فترات المسابقة والفعاليات" : "Time slots & event scheduling"}</p>
          </div>
        </div>
        {isOrganizer && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="me-1.5 h-4 w-4" />{isAr ? "فترة" : "Add Slot"}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{isAr ? "إضافة فترة زمنية" : "Add Schedule Slot"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{isAr ? "العنوان (EN)" : "Title (EN)"}</Label>
                    <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{isAr ? "العنوان (AR)" : "Title (AR)"}</Label>
                    <Input value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} dir="rtl" />
                  </div>
                </div>
                <div>
                  <Label>{isAr ? "النوع" : "Type"}</Label>
                  <Select value={form.slot_type} onValueChange={v => setForm(f => ({ ...f, slot_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SLOT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{isAr ? "وقت البداية" : "Start Time"}</Label>
                    <Input type="datetime-local" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{isAr ? "وقت النهاية" : "End Time"}</Label>
                    <Input type="datetime-local" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{isAr ? "رقم المحطة" : "Station #"}</Label>
                    <Input value={form.station_number} onChange={e => setForm(f => ({ ...f, station_number: e.target.value }))} placeholder="A1" />
                  </div>
                  <div>
                    <Label>{isAr ? "الموقع" : "Location"}</Label>
                    <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                  </div>
                </div>
                <Button onClick={() => createSlot.mutate()} disabled={!form.title || !form.start_time || !form.end_time || createSlot.isPending}>
                  {createSlot.isPending ? "..." : (isAr ? "إضافة" : "Add Slot")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!slots?.length ? (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarClock className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <p className="font-medium text-sm">{isAr ? "لا يوجد جدول زمني" : "No schedule configured"}</p>
            <p className="text-xs text-muted-foreground mt-1">{isAr ? "أضف فترات زمنية لتنظيم المسابقة" : "Add time slots to organize the competition"}</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedByDate).map(([dateKey, daySlots]) => (
          <div key={dateKey}>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs font-bold px-3 py-1">
                {format(new Date(dateKey), "EEEE, MMM d")}
              </Badge>
              <span className="text-[10px] text-muted-foreground">{daySlots!.length} {isAr ? "فترة" : "slots"}</span>
            </div>
            <div className="space-y-1.5 relative">
              <div className="absolute start-[18px] top-0 bottom-0 w-px bg-border/60" />
              {daySlots!.map(slot => {
                const slotType = SLOT_TYPES.find(t => t.value === slot.slot_type);
                const SlotIcon = slotType?.icon || Clock;
                return (
                  <div key={slot.id} className="relative flex items-center gap-3 rounded-xl border border-border/50 p-3 hover:bg-muted/30 transition-colors group">
                    <div className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${slotType?.color || "bg-muted"}`}>
                      <SlotIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{isAr && slot.title_ar ? slot.title_ar : slot.title}</span>
                        <Badge variant="outline" className="text-[9px]">{slotType ? (isAr ? slotType.ar : slotType.en) : slot.slot_type}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {format(new Date(slot.start_time), "h:mm a")} – {format(new Date(slot.end_time), "h:mm a")}
                        </span>
                        {slot.station_number && (
                          <span className="flex items-center gap-1">#{slot.station_number}</span>
                        )}
                        {slot.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5" />{isAr && slot.location_ar ? slot.location_ar : slot.location}
                          </span>
                        )}
                      </div>
                    </div>
                    {isOrganizer && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => deleteSlot.mutate(slot.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
