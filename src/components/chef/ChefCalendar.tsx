import { useState, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  useChefScheduleEvents, useChefScheduleSettings,
  useCreateScheduleEvent, useUpdateScheduleEvent, useDeleteScheduleEvent,
  useSaveScheduleSettings,
  EVENT_TYPE_CONFIG, PARTICIPATION_TYPES, BROADCAST_TYPES,
  getDaysInMonth,
  type ChefScheduleEvent, type ScheduleEventType, type ScheduleVisibility, type ScheduleStatus,
} from "@/hooks/useChefSchedule";
import {
  useGlobalEventsCalendar, GLOBAL_EVENT_COLORS, GLOBAL_EVENT_LABELS,
  type GlobalEvent, type GlobalEventType,
} from "@/hooks/useGlobalEventsCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format, isSameDay, isSameMonth, isToday, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import {
  Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight,
  Trophy, ChefHat, Landmark, Tv, Mic, GraduationCap, MessageSquare,
  MapPin, User, Plane, Ban, MoreHorizontal, Eye, EyeOff, Lock,
  Globe, Shield, Settings, Clock, Edit2, Trash2, Save, X,
  Briefcase, DollarSign, BookOpen, UtensilsCrossed, Palmtree, Users,
} from "lucide-react";

const EVENT_ICONS: Record<string, any> = {
  competition: Trophy, chefs_table: ChefHat, exhibition: Landmark,
  tv_interview: Tv, conference: Mic, training: GraduationCap,
  consultation: MessageSquare, visit: MapPin, personal: User,
  travel: Plane, unavailable: Ban, other: MoreHorizontal,
};

const GLOBAL_ICONS: Record<string, any> = {
  Trophy, Landmark, ChefHat, Tv, Mic, GraduationCap, MapPin, Plane, Users,
  MoreHorizontal, BookOpen, UtensilsCrossed, Palmtree, Ban,
};

const VISIBILITY_ICONS: Record<string, any> = { private: Lock, management: Shield, public: Globe };

interface Props {
  chefId: string;
  isAdmin?: boolean;
}

export function ChefCalendar({ chefId, isAdmin = false }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<Partial<ChefScheduleEvent> | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week" | "list">("month");
  const [calendarScope, setCalendarScope] = useState<"my" | "global">("my");
  const [showSettings, setShowSettings] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStart = new Date(year, month, 1).toISOString();
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  const { data: events = [], isLoading } = useChefScheduleEvents(chefId, { start: monthStart, end: monthEnd });
  const { data: globalEvents = [] } = useGlobalEventsCalendar();
  const { data: settings } = useChefScheduleSettings(chefId);
  const createEvent = useCreateScheduleEvent();
  const updateEvent = useUpdateScheduleEvent();
  const deleteEvent = useDeleteScheduleEvent();
  const saveSettings = useSaveScheduleSettings();

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);

  // Private events by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, ChefScheduleEvent[]> = {};
    events.forEach(ev => {
      const dateKey = format(parseISO(ev.start_date), "yyyy-MM-dd");
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(ev);
    });
    return map;
  }, [events]);

  // Global events by date (for overlay)
  const globalEventsByDate = useMemo(() => {
    const map: Record<string, GlobalEvent[]> = {};
    if (calendarScope !== "global") return map;
    globalEvents.forEach(ge => {
      const dateKey = format(parseISO(ge.start_date), "yyyy-MM-dd");
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(ge);
    });
    return map;
  }, [globalEvents, calendarScope]);

  const selectedDatePrivateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return eventsByDate[key] || [];
  }, [selectedDate, eventsByDate]);

  const selectedDateGlobalEvents = useMemo(() => {
    if (!selectedDate || calendarScope !== "global") return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return globalEventsByDate[key] || [];
  }, [selectedDate, globalEventsByDate, calendarScope]);

  const stats = useMemo(() => ({
    total: events.length,
    confirmed: events.filter(e => e.status === "confirmed").length,
    tentative: events.filter(e => e.status === "tentative").length,
    contracted: events.filter(e => e.is_contracted).length,
    publicEvents: events.filter(e => e.visibility === "public").length,
    globalCount: globalEvents.length,
  }), [events, globalEvents]);

  const navigate = (dir: number) => {
    setCurrentDate(new Date(year, month + dir, 1));
  };

  const handleSaveEvent = async () => {
    if (!editingEvent?.title || !editingEvent?.start_date || !editingEvent?.end_date) return;
    try {
      if (editingEvent.id) {
        await updateEvent.mutateAsync(editingEvent as ChefScheduleEvent & { id: string });
        toast.success(isAr ? "تم تحديث الحدث" : "Event updated");
      } else {
        await createEvent.mutateAsync({ ...editingEvent, chef_id: chefId });
        toast.success(isAr ? "تم إضافة الحدث" : "Event added");
      }
      setEditingEvent(null);
    } catch {
      toast.error(isAr ? "حدث خطأ" : "Error saving event");
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteEvent.mutateAsync(id);
      toast.success(isAr ? "تم حذف الحدث" : "Event deleted");
    } catch {
      toast.error(isAr ? "حدث خطأ" : "Error deleting event");
    }
  };

  const openNewEvent = (date?: Date) => {
    const d = date || selectedDate || new Date();
    const startStr = format(d, "yyyy-MM-dd") + "T09:00";
    const endStr = format(d, "yyyy-MM-dd") + "T17:00";
    setEditingEvent({
      event_type: "personal",
      title: "",
      start_date: startStr,
      end_date: endStr,
      all_day: false,
      visibility: (settings?.default_visibility as ScheduleVisibility) || "private",
      status: "confirmed",
      priority: "normal",
      is_contracted: false,
      contract_status: "none",
      fee_currency: "SAR",
      show_details_publicly: false,
      timezone: "Asia/Riyadh",
    });
  };

  const weekDays = isAr
    ? ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // ─── Event Form ─────────────────────────
  if (editingEvent) {
    const isTV = editingEvent.event_type === "tv_interview";
    const VisIcon = VISIBILITY_ICONS[editingEvent.visibility || "private"] || Lock;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {editingEvent.id ? (isAr ? "تعديل الحدث" : "Edit Event") : (isAr ? "حدث جديد" : "New Event")}
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setEditingEvent(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-4">
          {/* Type & Title */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">{isAr ? "النوع" : "Type"}</Label>
              <Select value={editingEvent.event_type || "personal"} onValueChange={v => setEditingEvent(p => ({ ...p!, event_type: v as ScheduleEventType }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_TYPE_CONFIG).map(([k, v]) => {
                    const Icon = EVENT_ICONS[k] || MoreHorizontal;
                    return (
                      <SelectItem key={k} value={k}>
                        <span className="flex items-center gap-2"><Icon className="h-3.5 w-3.5" />{isAr ? v.ar : v.en}</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">{isAr ? "العنوان" : "Title"}</Label>
              <Input value={editingEvent.title || ""} onChange={e => setEditingEvent(p => ({ ...p!, title: e.target.value }))} />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">{isAr ? "البداية" : "Start"}</Label>
              <Input type="datetime-local" value={editingEvent.start_date || ""} onChange={e => setEditingEvent(p => ({ ...p!, start_date: e.target.value }))} className="text-xs" />
            </div>
            <div>
              <Label className="text-xs">{isAr ? "النهاية" : "End"}</Label>
              <Input type="datetime-local" value={editingEvent.end_date || ""} onChange={e => setEditingEvent(p => ({ ...p!, end_date: e.target.value }))} className="text-xs" />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex items-center gap-2">
                <Switch checked={editingEvent.all_day || false} onCheckedChange={v => setEditingEvent(p => ({ ...p!, all_day: v }))} />
                <Label className="text-xs">{isAr ? "يوم كامل" : "All Day"}</Label>
              </div>
            </div>
            <div>
              <Label className="text-xs">{isAr ? "الحالة" : "Status"}</Label>
              <Select value={editingEvent.status || "confirmed"} onValueChange={v => setEditingEvent(p => ({ ...p!, status: v as ScheduleStatus }))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">{isAr ? "مؤكد" : "Confirmed"}</SelectItem>
                  <SelectItem value="tentative">{isAr ? "مبدئي" : "Tentative"}</SelectItem>
                  <SelectItem value="cancelled">{isAr ? "ملغى" : "Cancelled"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">{isAr ? "الموقع" : "Location"}</Label>
              <Input value={editingEvent.location || ""} onChange={e => setEditingEvent(p => ({ ...p!, location: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">{isAr ? "المدينة" : "City"}</Label>
              <Input value={editingEvent.city || ""} onChange={e => setEditingEvent(p => ({ ...p!, city: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">{isAr ? "المكان" : "Venue"}</Label>
              <Input value={editingEvent.venue || ""} onChange={e => setEditingEvent(p => ({ ...p!, venue: e.target.value }))} />
            </div>
          </div>

          {/* Participation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">{isAr ? "نوع المشاركة" : "Participation"}</Label>
              <Select value={editingEvent.participation_type || ""} onValueChange={v => setEditingEvent(p => ({ ...p!, participation_type: v }))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={isAr ? "اختر..." : "Select..."} /></SelectTrigger>
                <SelectContent>
                  {PARTICIPATION_TYPES.map(pt => (
                    <SelectItem key={pt.value} value={pt.value}>{isAr ? pt.ar : pt.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">{isAr ? "الجهة المنظمة" : "Organizer"}</Label>
              <Input value={editingEvent.organizer || ""} onChange={e => setEditingEvent(p => ({ ...p!, organizer: e.target.value }))} />
            </div>
          </div>

          {/* TV/Media Section */}
          {isTV && (
            <Card className="border-chart-4/20 bg-chart-4/5">
              <CardContent className="p-4 space-y-3">
                <p className="text-xs font-bold flex items-center gap-2"><Tv className="h-3.5 w-3.5" />{isAr ? "تفاصيل المقابلة" : "TV Interview Details"}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">{isAr ? "القناة" : "Channel"}</Label>
                    <Input value={editingEvent.channel_name || ""} onChange={e => setEditingEvent(p => ({ ...p!, channel_name: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">{isAr ? "البرنامج" : "Program"}</Label>
                    <Input value={editingEvent.program_name || ""} onChange={e => setEditingEvent(p => ({ ...p!, program_name: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">{isAr ? "نوع البث" : "Broadcast"}</Label>
                    <Select value={editingEvent.broadcast_type || ""} onValueChange={v => setEditingEvent(p => ({ ...p!, broadcast_type: v }))}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={isAr ? "اختر..." : "Select..."} /></SelectTrigger>
                      <SelectContent>
                        {BROADCAST_TYPES.map(bt => (
                          <SelectItem key={bt.value} value={bt.value}>{isAr ? bt.ar : bt.en}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contract & Fee */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-end gap-2">
              <div className="flex items-center gap-2">
                <Switch checked={editingEvent.is_contracted || false} onCheckedChange={v => setEditingEvent(p => ({ ...p!, is_contracted: v }))} />
                <Label className="text-xs">{isAr ? "عقد" : "Contracted"}</Label>
              </div>
            </div>
            {editingEvent.is_contracted && (
              <>
                <div>
                  <Label className="text-xs">{isAr ? "حالة العقد" : "Contract Status"}</Label>
                  <Select value={editingEvent.contract_status || "none"} onValueChange={v => setEditingEvent(p => ({ ...p!, contract_status: v }))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{isAr ? "قيد الانتظار" : "Pending"}</SelectItem>
                      <SelectItem value="confirmed">{isAr ? "مؤكد" : "Confirmed"}</SelectItem>
                      <SelectItem value="completed">{isAr ? "مكتمل" : "Completed"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{isAr ? "المبلغ" : "Fee"}</Label>
                  <Input type="number" value={editingEvent.fee_amount || ""} onChange={e => setEditingEvent(p => ({ ...p!, fee_amount: +e.target.value }))} />
                </div>
              </>
            )}
          </div>

          {/* Visibility */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs flex items-center gap-1.5">
                <VisIcon className="h-3 w-3" />{isAr ? "الرؤية" : "Visibility"}
              </Label>
              <Select value={editingEvent.visibility || "private"} onValueChange={v => setEditingEvent(p => ({ ...p!, visibility: v as ScheduleVisibility }))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">{isAr ? "خاص" : "Private"}</SelectItem>
                  <SelectItem value="management">{isAr ? "الإدارة" : "Management"}</SelectItem>
                  <SelectItem value="public">{isAr ? "عام" : "Public"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editingEvent.visibility === "public" && (
              <div className="flex items-end gap-2">
                <div className="flex items-center gap-2">
                  <Switch checked={editingEvent.show_details_publicly || false} onCheckedChange={v => setEditingEvent(p => ({ ...p!, show_details_publicly: v }))} />
                  <Label className="text-xs">{isAr ? "عرض التفاصيل" : "Show Details"}</Label>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs">{isAr ? "ملاحظات" : "Notes"}</Label>
            <Textarea value={editingEvent.notes || ""} onChange={e => setEditingEvent(p => ({ ...p!, notes: e.target.value }))} rows={2} />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditingEvent(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button size="sm" className="gap-1.5" onClick={handleSaveEvent} disabled={!editingEvent.title}>
              <Save className="h-3.5 w-3.5" />{isAr ? "حفظ" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Settings Panel ─────────────────────
  if (showSettings) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Settings className="h-4 w-4" />{isAr ? "إعدادات الجدول" : "Schedule Settings"}
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}><X className="h-4 w-4" /></Button>
        </div>

        <Card className="border-border/40">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">{isAr ? "مشاركة مع الإدارة" : "Share with Management"}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "يمكن للإدارة رؤية جدولك" : "Management can see your schedule"}</p>
              </div>
              <Switch checked={settings?.share_with_management ?? false}
                onCheckedChange={v => saveSettings.mutate({ chef_id: chefId, share_with_management: v })} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">{isAr ? "عرض على الملف الشخصي" : "Show on Profile"}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "عرض التوفر في ملفك الشخصي" : "Show availability on your profile"}</p>
              </div>
              <Switch checked={settings?.show_availability_on_profile ?? false}
                onCheckedChange={v => saveSettings.mutate({ chef_id: chefId, show_availability_on_profile: v })} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">{isAr ? "مزامنة المسابقات تلقائياً" : "Auto-sync Competitions"}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "إضافة المسابقات المسجلة تلقائياً" : "Auto-add registered competitions"}</p>
              </div>
              <Switch checked={settings?.auto_sync_competitions ?? true}
                onCheckedChange={v => saveSettings.mutate({ chef_id: chefId, auto_sync_competitions: v })} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">{isAr ? "مزامنة طاولة الشيف" : "Auto-sync Chef's Table"}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "إضافة جلسات التقييم تلقائياً" : "Auto-add evaluation sessions"}</p>
              </div>
              <Switch checked={settings?.auto_sync_chefs_table ?? true}
                onCheckedChange={v => saveSettings.mutate({ chef_id: chefId, auto_sync_chefs_table: v })} />
            </div>
            <Separator />
            <div>
              <Label className="text-xs">{isAr ? "الرؤية الافتراضية" : "Default Visibility"}</Label>
              <Select value={settings?.default_visibility || "private"} onValueChange={v => saveSettings.mutate({ chef_id: chefId, default_visibility: v })}>
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">{isAr ? "خاص" : "Private"}</SelectItem>
                  <SelectItem value="management">{isAr ? "الإدارة" : "Management"}</SelectItem>
                  <SelectItem value="public">{isAr ? "عام" : "Public"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Main Calendar View ────────────────
  return (
    <div className="space-y-4">
      {/* Calendar Scope Toggle */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl border border-border/40 bg-muted/20 w-fit">
        <Button
          variant={calendarScope === "my" ? "default" : "ghost"}
          size="sm"
          className="h-7 text-xs gap-1.5 px-3"
          onClick={() => setCalendarScope("my")}
        >
          <Lock className="h-3 w-3" />
          {isAr ? "تقويمي" : "My Calendar"}
          <Badge variant="secondary" className="text-[9px] px-1 h-4">{stats.total}</Badge>
        </Button>
        <Button
          variant={calendarScope === "global" ? "default" : "ghost"}
          size="sm"
          className="h-7 text-xs gap-1.5 px-3"
          onClick={() => setCalendarScope("global")}
        >
          <Globe className="h-3 w-3" />
          {isAr ? "التقويم العام" : "Global Calendar"}
          <Badge variant="secondary" className="text-[9px] px-1 h-4">{stats.globalCount}</Badge>
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-bold text-base min-w-[160px] text-center">
            {currentDate.toLocaleString(isAr ? "ar" : "en", { month: "long", year: "numeric" })}
          </h3>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setCurrentDate(new Date())}>
            {isAr ? "اليوم" : "Today"}
          </Button>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] gap-1">
            <CalendarIcon className="h-3 w-3" />{stats.total} {isAr ? "حدث" : "events"}
          </Badge>
          {stats.contracted > 0 && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Briefcase className="h-3 w-3" />{stats.contracted} {isAr ? "عقد" : "contracted"}
            </Badge>
          )}
          <div className="hidden sm:flex border rounded-xl overflow-hidden">
            <Button variant={viewMode === "month" ? "default" : "ghost"} size="sm" className="h-7 text-[10px] rounded-none px-2" onClick={() => setViewMode("month")}>
              {isAr ? "شهر" : "Month"}
            </Button>
            <Button variant={viewMode === "week" ? "default" : "ghost"} size="sm" className="h-7 text-[10px] rounded-none px-2" onClick={() => setViewMode("week")}>
              {isAr ? "أسبوع" : "Week"}
            </Button>
            <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" className="h-7 text-[10px] rounded-none px-2" onClick={() => setViewMode("list")}>
              {isAr ? "قائمة" : "List"}
            </Button>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowSettings(true)}>
            <Settings className="h-3 w-3" />
          </Button>
          <Button size="sm" className="h-7 text-xs gap-1" onClick={() => openNewEvent()}>
            <Plus className="h-3 w-3" />{isAr ? "جديد" : "New"}
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {Object.entries(EVENT_TYPE_CONFIG).slice(0, 6).map(([key, config]) => {
          const Icon = EVENT_ICONS[key] || MoreHorizontal;
          const count = events.filter(e => e.event_type === key).length;
          if (count === 0) return null;
          return (
            <div key={key} className={`rounded-xl border px-2 py-1.5 text-center ${config.color}`}>
              <Icon className="h-3.5 w-3.5 mx-auto mb-0.5" />
              <p className="text-sm font-black tabular-nums">{count}</p>
              <p className="text-[8px] font-bold uppercase tracking-wider">{isAr ? config.ar : config.en}</p>
            </div>
          );
        })}
      </div>

      {/* Week View */}
      {viewMode === "week" && (() => {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const weekDaysFull = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(startOfWeek);
          d.setDate(d.getDate() + i);
          return d;
        });
        const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7am-6pm

        return (
          <Card className="border-border/40 overflow-hidden">
            <div className="grid grid-cols-8">
              {/* Time column header */}
              <div className="p-2 border-b border-r border-border/30 bg-muted/30" />
              {weekDaysFull.map((d, i) => (
                <div key={i} className={cn(
                  "p-2 text-center border-b border-border/30 bg-muted/30",
                  isToday(d) && "bg-primary/10"
                )}>
                  <div className="text-[10px] text-muted-foreground">{weekDays[d.getDay()]}</div>
                  <div className={cn("text-sm font-bold", isToday(d) && "text-primary")}>{d.getDate()}</div>
                </div>
              ))}
              {/* Time slots */}
              {hours.map(hour => (
                <>
                  <div key={`t-${hour}`} className="p-1 text-[10px] text-muted-foreground text-end pe-2 border-r border-border/20 h-16 flex items-start justify-end">
                    {`${hour}:00`}
                  </div>
                  {weekDaysFull.map((d, di) => {
                    const dateKey = format(d, "yyyy-MM-dd");
                    const hourEvents = (eventsByDate[dateKey] || []).filter(ev => {
                      if (ev.all_day) return hour === 7;
                      const h = new Date(ev.start_date).getHours();
                      return h === hour;
                    });
                    return (
                      <div
                        key={`${hour}-${di}`}
                        className={cn("border-r border-b border-border/10 h-16 p-0.5 cursor-pointer hover:bg-muted/20", isToday(d) && "bg-primary/5")}
                        onClick={() => { setSelectedDate(d); openNewEvent(d); }}
                      >
                        {hourEvents.map(ev => {
                          const config = EVENT_TYPE_CONFIG[ev.event_type as ScheduleEventType] || EVENT_TYPE_CONFIG.other;
                          return (
                            <div
                              key={ev.id}
                              className={`text-[8px] rounded px-1 py-0.5 truncate border ${config.color} cursor-pointer mb-0.5`}
                              onClick={e => { e.stopPropagation(); setEditingEvent(ev); }}
                            >
                              {ev.title}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </Card>
        );
      })()}

      {/* List View */}
      {viewMode === "list" && (
        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {isAr ? "جميع الأحداث" : "All Events"} 
              <Badge variant="outline" className="text-[10px]">{events.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {events.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                {isAr ? "لا توجد أحداث هذا الشهر" : "No events this month"}
              </div>
            ) : (
              <div className="divide-y divide-border/20">
                {events.map(ev => {
                  const config = EVENT_TYPE_CONFIG[ev.event_type as ScheduleEventType] || EVENT_TYPE_CONFIG.other;
                  const Icon = EVENT_ICONS[ev.event_type] || MoreHorizontal;
                  const VisIcon = VISIBILITY_ICONS[ev.visibility] || Lock;
                  return (
                    <div key={ev.id} className="p-3 hover:bg-muted/20 transition-colors flex items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${config.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-semibold text-xs ${ev.status === "cancelled" ? "line-through opacity-50" : ""}`}>{ev.title}</h4>
                          <VisIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                          {ev.is_contracted && <Briefcase className="h-3 w-3 text-chart-2 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span>{format(parseISO(ev.start_date), "MMM d")} {!ev.all_day && format(parseISO(ev.start_date), "HH:mm")}</span>
                          {ev.city && <span>· {ev.city}</span>}
                          {ev.channel_name && <span>· {ev.channel_name}</span>}
                        </div>
                      </div>
                      <Badge className={`text-[8px] border shrink-0 ${config.color}`}>{isAr ? config.ar : config.en}</Badge>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditingEvent(ev)}><Edit2 className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => handleDeleteEvent(ev.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Month Calendar Grid */}
      {viewMode === "month" && (
      <Card className="border-border/40 overflow-hidden">
        <div className="grid grid-cols-7">
          {/* Week Day Headers */}
          {weekDays.map(d => (
            <div key={d} className="p-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/30 bg-muted/30">
              {d}
            </div>
          ))}

          {/* Day Cells */}
          {days.map((day, i) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDate[dateKey] || [];
            const dayGlobalEvents = globalEventsByDate[dateKey] || [];
            const totalEvents = dayEvents.length + dayGlobalEvents.length;
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const today = isToday(day);

            return (
              <div
                key={i}
                onClick={() => setSelectedDate(day)}
                className={`min-h-[80px] p-1 border-b border-r border-border/20 cursor-pointer transition-colors
                  ${!isCurrentMonth ? "bg-muted/20 opacity-40" : "hover:bg-muted/30"}
                  ${isSelected ? "bg-primary/5 ring-1 ring-primary/30" : ""}
                  ${today ? "bg-primary/5" : ""}
                `}
              >
                <div className={`text-xs font-bold mb-0.5 ${today ? "text-primary" : "text-muted-foreground"}`}>
                  {day.getDate()}
                </div>
                <div className="space-y-0.5">
                  {/* Private events */}
                  {dayEvents.slice(0, calendarScope === "global" ? 2 : 3).map(ev => {
                    const config = EVENT_TYPE_CONFIG[ev.event_type as ScheduleEventType] || EVENT_TYPE_CONFIG.other;
                    return (
                      <div
                        key={ev.id}
                        className={`text-[9px] rounded px-1 py-0.5 truncate font-medium border ${config.color} ${ev.status === "cancelled" ? "line-through opacity-50" : ""}`}
                        onClick={e => { e.stopPropagation(); setEditingEvent(ev); }}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    );
                  })}
                  {/* Global events overlay */}
                  {calendarScope === "global" && dayGlobalEvents.slice(0, 2).map(ge => {
                    const colors = GLOBAL_EVENT_COLORS[ge.type];
                    return (
                      <div
                        key={`g-${ge.id}`}
                        className={cn("text-[9px] rounded px-1 py-0.5 truncate font-medium border opacity-80", colors.bg, colors.text, colors.border)}
                        title={`🌐 ${ge.title}`}
                      >
                        🌐 {ge.title}
                      </div>
                    );
                  })}
                  {totalEvents > (calendarScope === "global" ? 4 : 3) && (
                    <p className="text-[8px] text-muted-foreground text-center">+{totalEvents - (calendarScope === "global" ? 4 : 3)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      )}

      {/* Selected Date Detail */}
      {selectedDate && (
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(selectedDate, isAr ? "EEEE, d MMMM yyyy" : "EEEE, MMMM d, yyyy")}
                <Badge variant="outline" className="text-[10px]">
                  {selectedDatePrivateEvents.length + selectedDateGlobalEvents.length} {isAr ? "أحداث" : "events"}
                </Badge>
              </CardTitle>
              <Button size="sm" className="h-7 text-xs gap-1" onClick={() => openNewEvent(selectedDate)}>
                <Plus className="h-3 w-3" />{isAr ? "إضافة" : "Add"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {selectedDatePrivateEvents.length === 0 && selectedDateGlobalEvents.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                {isAr ? "لا توجد أحداث في هذا اليوم" : "No events on this day"}
                <br />
                <Button variant="link" size="sm" className="text-xs mt-1" onClick={() => openNewEvent(selectedDate)}>
                  {isAr ? "أضف حدثاً" : "Add an event"}
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/20">
                {/* Private events */}
                {selectedDatePrivateEvents.map(ev => {
                  const config = EVENT_TYPE_CONFIG[ev.event_type as ScheduleEventType] || EVENT_TYPE_CONFIG.other;
                  const Icon = EVENT_ICONS[ev.event_type] || MoreHorizontal;
                  const VisIcon = VISIBILITY_ICONS[ev.visibility] || Lock;
                  return (
                    <div key={ev.id} className="p-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${config.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`font-bold text-sm ${ev.status === "cancelled" ? "line-through opacity-50" : ""}`}>{ev.title}</h4>
                            <Badge className={`text-[9px] border ${config.color}`}>{isAr ? config.ar : config.en}</Badge>
                            <VisIcon className="h-3 w-3 text-muted-foreground" />
                            {ev.status === "tentative" && <Badge variant="outline" className="text-[9px]">{isAr ? "مبدئي" : "Tentative"}</Badge>}
                            {ev.is_contracted && <Badge variant="secondary" className="text-[9px] gap-0.5"><Briefcase className="h-2.5 w-2.5" />{isAr ? "عقد" : "Contract"}</Badge>}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {ev.all_day
                                ? (isAr ? "يوم كامل" : "All Day")
                                : `${format(parseISO(ev.start_date), "HH:mm")} - ${format(parseISO(ev.end_date), "HH:mm")}`}
                            </span>
                            {ev.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.location}</span>}
                            {ev.channel_name && <span className="flex items-center gap-1"><Tv className="h-3 w-3" />{ev.channel_name}{ev.program_name ? ` — ${ev.program_name}` : ""}</span>}
                            {ev.participation_type && (
                              <Badge variant="outline" className="text-[9px]">
                                {isAr ? (PARTICIPATION_TYPES.find(p => p.value === ev.participation_type)?.ar || ev.participation_type) : ev.participation_type}
                              </Badge>
                            )}
                            {ev.fee_amount && ev.fee_amount > 0 && (
                              <span className="flex items-center gap-1 text-primary font-bold"><DollarSign className="h-3 w-3" />{ev.fee_amount.toLocaleString()} {ev.fee_currency}</span>
                            )}
                          </div>
                          {ev.notes && <p className="text-xs text-muted-foreground mt-1">{ev.notes}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingEvent(ev)}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDeleteEvent(ev.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* Global events */}
                {selectedDateGlobalEvents.map(ge => {
                  const colors = GLOBAL_EVENT_COLORS[ge.type];
                  const label = GLOBAL_EVENT_LABELS[ge.type];
                  const IconComp = GLOBAL_ICONS[label?.icon] || MoreHorizontal;
                  return (
                    <div key={`g-${ge.id}`} className="p-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border", colors.bg, colors.border)}>
                          <IconComp className={cn("h-4 w-4", colors.text)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={cn("text-[9px] border", colors.bg, colors.text, colors.border)}>
                              🌐 {isAr ? label?.ar : label?.en}
                            </Badge>
                            {ge.is_recurring && <Badge variant="outline" className="text-[9px]">{isAr ? "سنوي" : "Annual"}</Badge>}
                          </div>
                          {ge.link ? (
                            <Link to={ge.link} className="text-sm font-semibold hover:text-primary transition-colors mt-0.5 block">{ge.title}</Link>
                          ) : (
                            <p className="text-sm font-semibold mt-0.5">{ge.title}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                            {ge.end_date && <span>→ {format(parseISO(ge.end_date), "MMM d")}</span>}
                            {ge.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ge.city}</span>}
                            {ge.venue && <span>{ge.venue}</span>}
                            {ge.channel_name && <span className="flex items-center gap-1"><Tv className="h-3 w-3" />{ge.channel_name}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
