import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useCreateScheduleEvent, useUpdateScheduleEvent,
  EVENT_TYPE_CONFIG, PARTICIPATION_TYPES, BROADCAST_TYPES,
  type ChefScheduleEvent, type ScheduleEventType, type ScheduleVisibility, type ScheduleStatus,
} from "@/hooks/useChefSchedule";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { X, Save, Plus } from "lucide-react";

interface Props {
  event?: ChefScheduleEvent | null;
  onClose: () => void;
  defaultDate?: string;
}

export default function ChefScheduleEventForm({ event, onClose, defaultDate }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const createEvent = useCreateScheduleEvent();
  const updateEvent = useUpdateScheduleEvent();

  const { data: chefs = [] } = useQuery({
    queryKey: ["admin-chefs-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar")
        .limit(500);
      return data || [];
    },
  });

  const [form, setForm] = useState({
    chef_id: event?.chef_id || "",
    event_type: event?.event_type || "other" as ScheduleEventType,
    title: event?.title || "",
    title_ar: event?.title_ar || "",
    description: event?.description || "",
    start_date: event?.start_date?.slice(0, 16) || defaultDate || "",
    end_date: event?.end_date?.slice(0, 16) || "",
    all_day: event?.all_day ?? true,
    city: event?.city || "",
    country_code: event?.country_code || "",
    venue: event?.venue || "",
    venue_ar: event?.venue_ar || "",
    channel_name: event?.channel_name || "",
    program_name: event?.program_name || "",
    broadcast_type: event?.broadcast_type || "",
    participation_type: event?.participation_type || "",
    visibility: event?.visibility || "management" as ScheduleVisibility,
    status: event?.status || "tentative" as ScheduleStatus,
    is_contracted: event?.is_contracted ?? false,
    fee_amount: event?.fee_amount || 0,
    fee_currency: event?.fee_currency || "SAR",
    notes: event?.notes || "",
  });

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.chef_id || !form.title || !form.start_date) {
      toast.error(isAr ? "يرجى ملء الحقول المطلوبة" : "Please fill required fields");
      return;
    }

    const payload: any = {
      ...form,
      start_date: new Date(form.start_date).toISOString(),
      end_date: form.end_date ? new Date(form.end_date).toISOString() : new Date(form.start_date).toISOString(),
      fee_amount: form.fee_amount || null,
    };

    try {
      if (event) {
        await updateEvent.mutateAsync({ id: event.id, ...payload });
        toast.success(isAr ? "تم تحديث الحدث" : "Event updated");
      } else {
        await createEvent.mutateAsync(payload);
        toast.success(isAr ? "تم إنشاء الحدث" : "Event created");
      }
      onClose();
    } catch {
      toast.error(isAr ? "خطأ في الحفظ" : "Save failed");
    }
  };

  const isTv = form.event_type === "tv_interview";

  return (
    <Card className="border-primary/20 bg-card">
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <CardTitle className="text-sm">{event ? (isAr ? "تعديل الحدث" : "Edit Event") : (isAr ? "إضافة حدث جديد" : "Add New Event")}</CardTitle>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}><X className="h-4 w-4" /></Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Chef */}
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "الشيف *" : "Chef *"}</Label>
            <Select value={form.chef_id} onValueChange={v => set("chef_id", v)}>
              <SelectTrigger className="h-9"><SelectValue placeholder={isAr ? "اختر شيف" : "Select chef"} /></SelectTrigger>
              <SelectContent>
                {chefs.map(c => (
                  <SelectItem key={c.user_id} value={c.user_id}>{isAr ? c.full_name_ar || c.full_name : c.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "النوع *" : "Type *"}</Label>
            <Select value={form.event_type} onValueChange={v => set("event_type", v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(EVENT_TYPE_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "الحالة" : "Status"}</Label>
            <Select value={form.status} onValueChange={v => set("status", v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tentative">{isAr ? "مبدئي" : "Tentative"}</SelectItem>
                <SelectItem value="confirmed">{isAr ? "مؤكد" : "Confirmed"}</SelectItem>
                <SelectItem value="cancelled">{isAr ? "ملغى" : "Cancelled"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "العنوان *" : "Title *"}</Label>
            <Input value={form.title} onChange={e => set("title", e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
            <Input value={form.title_ar} onChange={e => set("title_ar", e.target.value)} className="h-9" dir="rtl" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "تاريخ البدء *" : "Start Date *"}</Label>
            <Input type={form.all_day ? "date" : "datetime-local"} value={form.start_date?.slice(0, form.all_day ? 10 : 16)} onChange={e => set("start_date", e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "تاريخ الانتهاء" : "End Date"}</Label>
            <Input type={form.all_day ? "date" : "datetime-local"} value={form.end_date?.slice(0, form.all_day ? 10 : 16)} onChange={e => set("end_date", e.target.value)} className="h-9" />
          </div>
          <div className="flex items-end gap-2 pb-1">
            <Switch checked={form.all_day} onCheckedChange={v => set("all_day", v)} />
            <Label className="text-xs">{isAr ? "طوال اليوم" : "All Day"}</Label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "المدينة" : "City"}</Label>
            <Input value={form.city} onChange={e => set("city", e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "رمز الدولة" : "Country Code"}</Label>
            <Input value={form.country_code} onChange={e => set("country_code", e.target.value)} className="h-9" maxLength={2} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "المكان" : "Venue"}</Label>
            <Input value={form.venue} onChange={e => set("venue", e.target.value)} className="h-9" />
          </div>
        </div>

        {/* TV Fields */}
        {isTv && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-lg border border-chart-4/20 bg-chart-4/5">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "القناة" : "Channel"}</Label>
              <Input value={form.channel_name} onChange={e => set("channel_name", e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "البرنامج" : "Program"}</Label>
              <Input value={form.program_name} onChange={e => set("program_name", e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "نوع البث" : "Broadcast"}</Label>
              <Select value={form.broadcast_type} onValueChange={v => set("broadcast_type", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BROADCAST_TYPES.map(b => <SelectItem key={b.value} value={b.value}>{isAr ? b.ar : b.en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Participation & Visibility */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "نوع المشاركة" : "Participation"}</Label>
            <Select value={form.participation_type} onValueChange={v => set("participation_type", v)}>
              <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {PARTICIPATION_TYPES.map(p => <SelectItem key={p.value} value={p.value}>{isAr ? p.ar : p.en}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "الرؤية" : "Visibility"}</Label>
            <Select value={form.visibility} onValueChange={v => set("visibility", v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="private">{isAr ? "خاص" : "Private"}</SelectItem>
                <SelectItem value="management">{isAr ? "إدارة" : "Management"}</SelectItem>
                <SelectItem value="public">{isAr ? "عام" : "Public"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "ملاحظات" : "Notes"}</Label>
            <Input value={form.notes || ""} onChange={e => set("notes", e.target.value)} className="h-9" />
          </div>
        </div>

        {/* Contract */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="flex items-center gap-2">
            <Switch checked={form.is_contracted} onCheckedChange={v => set("is_contracted", v)} />
            <Label className="text-xs">{isAr ? "تعاقدي" : "Contracted"}</Label>
          </div>
          {form.is_contracted && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "المبلغ" : "Fee Amount"}</Label>
                <Input type="number" value={form.fee_amount} onChange={e => set("fee_amount", +e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "العملة" : "Currency"}</Label>
                <Input value={form.fee_currency} onChange={e => set("fee_currency", e.target.value)} className="h-9" maxLength={3} />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>{isAr ? "إلغاء" : "Cancel"}</Button>
          <Button size="sm" onClick={handleSubmit} disabled={createEvent.isPending || updateEvent.isPending}>
            {event ? <Save className="h-3.5 w-3.5 me-1.5" /> : <Plus className="h-3.5 w-3.5 me-1.5" />}
            {event ? (isAr ? "حفظ" : "Save") : (isAr ? "إنشاء" : "Create")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
