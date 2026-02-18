import { useState, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGlobalEvents, useCreateGlobalEvent, useUpdateGlobalEvent, useDeleteGlobalEvent,
  type GlobalEventRecord,
} from "@/hooks/useGlobalEvents";
import { GLOBAL_EVENT_LABELS, GLOBAL_EVENT_COLORS, type GlobalEventType } from "@/hooks/useGlobalEventsCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { downloadCSV } from "@/lib/exportUtils";
import {
  Globe, Plus, Search, Edit2, Trash2, Save, X, Calendar, MapPin,
  Trophy, Landmark, ChefHat, Tv, Mic, GraduationCap, Plane, Users,
  MoreHorizontal, BookOpen, UtensilsCrossed, Palmtree, Ban, ExternalLink,
  CheckCircle, XCircle, RefreshCw, Eye, Download, Filter,
} from "lucide-react";

const ICONS: Record<string, any> = {
  Trophy, Landmark, ChefHat, Tv, Mic, GraduationCap, MapPin, Plane, Users,
  MoreHorizontal, BookOpen, UtensilsCrossed, Palmtree, Ban,
};

const EVENT_TYPES: GlobalEventType[] = [
  "competition", "exhibition", "chefs_table", "tv_interview", "conference",
  "training", "masterclass", "tasting", "visit", "travel", "vacation", "meeting", "other",
];

const TARGET_AUDIENCES = [
  { value: "chefs", en: "Chefs", ar: "الطهاة" },
  { value: "judges", en: "Judges", ar: "الحكام" },
  { value: "sponsors", en: "Sponsors", ar: "الرعاة" },
  { value: "students", en: "Students", ar: "الطلاب" },
  { value: "public", en: "Public", ar: "العامة" },
  { value: "organizers", en: "Organizers", ar: "المنظمين" },
];

export default function GlobalEventsAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [editing, setEditing] = useState<Partial<GlobalEventRecord> | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: events = [], isLoading } = useGlobalEvents({ status: statusFilter });
  const createEvent = useCreateGlobalEvent();
  const updateEvent = useUpdateGlobalEvent();
  const deleteEvent = useDeleteGlobalEvent();

  const filtered = useMemo(() => events.filter(ev => {
    if (typeFilter !== "all" && ev.type !== typeFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return ev.title?.toLowerCase().includes(q) || ev.title_ar?.toLowerCase().includes(q) || ev.city?.toLowerCase().includes(q);
  }), [events, typeFilter, search]);

  const handleSave = async () => {
    if (!editing?.title || !editing?.start_date) {
      toast.error(isAr ? "يرجى ملء العنوان والتاريخ" : "Please fill title and date");
      return;
    }
    try {
      if (editing.id) {
        await updateEvent.mutateAsync(editing as GlobalEventRecord);
        toast.success(isAr ? "تم التحديث" : "Updated");
      } else {
        await createEvent.mutateAsync({ ...editing, created_by: user?.id });
        toast.success(isAr ? "تم الإضافة" : "Added");
      }
      setEditing(null);
    } catch {
      toast.error(isAr ? "حدث خطأ" : "Error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent.mutateAsync(id);
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      toast.success(isAr ? "تم الحذف" : "Deleted");
    } catch {
      toast.error(isAr ? "خطأ" : "Error");
    }
  };

  const openNew = () => {
    setEditing({
      type: "other",
      title: "",
      start_date: format(new Date(), "yyyy-MM-dd"),
      all_day: true,
      timezone: "Asia/Riyadh",
      is_international: false,
      is_recurring: false,
      target_audience: [],
      tags: [],
      status: "active",
      priority: 0,
    });
  };

  // Bulk actions
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleAll = () => {
    setSelectedIds(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(e => e.id)));
  };
  const bulkUpdateStatus = async (status: string) => {
    try {
      await Promise.all(Array.from(selectedIds).map(id => updateEvent.mutateAsync({ id, status } as any)));
      toast.success(isAr ? `تم تحديث ${selectedIds.size} فعالية` : `Updated ${selectedIds.size} events`);
      setSelectedIds(new Set());
    } catch { toast.error(isAr ? "خطأ" : "Error"); }
  };
  const bulkDelete = async () => {
    try {
      await Promise.all(Array.from(selectedIds).map(id => deleteEvent.mutateAsync(id)));
      toast.success(isAr ? `تم حذف ${selectedIds.size} فعالية` : `Deleted ${selectedIds.size} events`);
      setSelectedIds(new Set());
    } catch { toast.error(isAr ? "خطأ" : "Error"); }
  };

  const exportEvents = () => {
    downloadCSV(filtered.map(ev => ({
      type: GLOBAL_EVENT_LABELS[ev.type as GlobalEventType]?.en || ev.type,
      title: ev.title,
      title_ar: ev.title_ar || "",
      start_date: ev.start_date,
      end_date: ev.end_date || "",
      city: ev.city || "",
      country_code: ev.country_code || "",
      venue: ev.venue || "",
      organizer: ev.organizer || "",
      status: ev.status,
      international: ev.is_international ? "Yes" : "No",
      recurring: ev.is_recurring ? "Yes" : "No",
    })), `global-events-${format(new Date(), "yyyy-MM-dd")}`, [
      { key: "type", label: "Type" },
      { key: "title", label: "Title" },
      { key: "title_ar", label: "Title (AR)" },
      { key: "start_date", label: "Start Date" },
      { key: "end_date", label: "End Date" },
      { key: "city", label: "City" },
      { key: "country_code", label: "Country" },
      { key: "venue", label: "Venue" },
      { key: "organizer", label: "Organizer" },
      { key: "status", label: "Status" },
      { key: "international", label: "International" },
      { key: "recurring", label: "Recurring" },
    ]);
    toast.success(isAr ? "تم التصدير" : "Exported");
  };

  // ─── Inline Edit Form ─────────────────
  if (editing) {
    const typeLabel = GLOBAL_EVENT_LABELS[editing.type as GlobalEventType];
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            {editing.id ? (isAr ? "تعديل فعالية" : "Edit Event") : (isAr ? "فعالية جديدة" : "New Event")}
          </h1>
          <Button variant="ghost" size="icon" onClick={() => setEditing(null)}><X className="h-4 w-4" /></Button>
        </div>

        <div className="grid gap-4 max-w-4xl">
          {/* Type & Title */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">{isAr ? "النوع" : "Type"}</Label>
              <Select value={editing.type || "other"} onValueChange={v => setEditing(p => ({ ...p!, type: v }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(t => {
                    const l = GLOBAL_EVENT_LABELS[t];
                    const IconC = ICONS[l?.icon] || MoreHorizontal;
                    return (
                      <SelectItem key={t} value={t}>
                        <span className="flex items-center gap-2"><IconC className="h-3.5 w-3.5" />{isAr ? l?.ar : l?.en}</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">{isAr ? "العنوان (EN)" : "Title (EN)"}</Label>
              <Input value={editing.title || ""} onChange={e => setEditing(p => ({ ...p!, title: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">{isAr ? "العنوان (AR)" : "Title (AR)"}</Label>
              <Input value={editing.title_ar || ""} onChange={e => setEditing(p => ({ ...p!, title_ar: e.target.value }))} dir="rtl" />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">{isAr ? "تاريخ البداية" : "Start Date"}</Label>
              <Input type="date" value={editing.start_date || ""} onChange={e => setEditing(p => ({ ...p!, start_date: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">{isAr ? "تاريخ النهاية" : "End Date"}</Label>
              <Input type="date" value={editing.end_date || ""} onChange={e => setEditing(p => ({ ...p!, end_date: e.target.value }))} />
            </div>
            <div className="flex items-end gap-3">
              <div className="flex items-center gap-2">
                <Switch checked={editing.all_day ?? true} onCheckedChange={v => setEditing(p => ({ ...p!, all_day: v }))} />
                <Label className="text-xs">{isAr ? "يوم كامل" : "All Day"}</Label>
              </div>
            </div>
            <div>
              <Label className="text-xs">{isAr ? "الحالة" : "Status"}</Label>
              <Select value={editing.status || "active"} onValueChange={v => setEditing(p => ({ ...p!, status: v }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{isAr ? "نشط" : "Active"}</SelectItem>
                  <SelectItem value="draft">{isAr ? "مسودة" : "Draft"}</SelectItem>
                  <SelectItem value="cancelled">{isAr ? "ملغى" : "Cancelled"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">{isAr ? "المدينة" : "City"}</Label>
              <Input value={editing.city || ""} onChange={e => setEditing(p => ({ ...p!, city: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">{isAr ? "رمز الدولة" : "Country Code"}</Label>
              <Input value={editing.country_code || ""} onChange={e => setEditing(p => ({ ...p!, country_code: e.target.value }))} placeholder="SA" maxLength={2} />
            </div>
            <div>
              <Label className="text-xs">{isAr ? "المكان (EN)" : "Venue (EN)"}</Label>
              <Input value={editing.venue || ""} onChange={e => setEditing(p => ({ ...p!, venue: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">{isAr ? "المكان (AR)" : "Venue (AR)"}</Label>
              <Input value={editing.venue_ar || ""} onChange={e => setEditing(p => ({ ...p!, venue_ar: e.target.value }))} dir="rtl" />
            </div>
          </div>

          {/* Organizer & Link */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">{isAr ? "المنظم" : "Organizer"}</Label>
              <Input value={editing.organizer || ""} onChange={e => setEditing(p => ({ ...p!, organizer: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">{isAr ? "المنظم (AR)" : "Organizer (AR)"}</Label>
              <Input value={editing.organizer_ar || ""} onChange={e => setEditing(p => ({ ...p!, organizer_ar: e.target.value }))} dir="rtl" />
            </div>
            <div>
              <Label className="text-xs">{isAr ? "رابط" : "Link"}</Label>
              <Input value={editing.link || ""} onChange={e => setEditing(p => ({ ...p!, link: e.target.value }))} placeholder="https://..." />
            </div>
          </div>

          {/* Flags */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={editing.is_international ?? false} onCheckedChange={v => setEditing(p => ({ ...p!, is_international: v }))} />
              <Label className="text-xs">{isAr ? "دولي" : "International"}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editing.is_recurring ?? false} onCheckedChange={v => setEditing(p => ({ ...p!, is_recurring: v }))} />
              <Label className="text-xs">{isAr ? "متكرر سنوياً" : "Annual Recurring"}</Label>
            </div>
          </div>

          {/* Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{isAr ? "الوصف (EN)" : "Description (EN)"}</Label>
              <Textarea value={editing.description || ""} onChange={e => setEditing(p => ({ ...p!, description: e.target.value }))} rows={3} />
            </div>
            <div>
              <Label className="text-xs">{isAr ? "الوصف (AR)" : "Description (AR)"}</Label>
              <Textarea value={editing.description_ar || ""} onChange={e => setEditing(p => ({ ...p!, description_ar: e.target.value }))} rows={3} dir="rtl" />
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <Label className="text-xs mb-2 block">{isAr ? "الجمهور المستهدف" : "Target Audience"}</Label>
            <div className="flex flex-wrap gap-2">
              {TARGET_AUDIENCES.map(ta => {
                const active = editing.target_audience?.includes(ta.value);
                return (
                  <Button
                    key={ta.value}
                    variant={active ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      const current = editing.target_audience || [];
                      setEditing(p => ({
                        ...p!,
                        target_audience: active ? current.filter(v => v !== ta.value) : [...current, ta.value],
                      }));
                    }}
                  >
                    {isAr ? ta.ar : ta.en}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditing(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button className="gap-1.5" onClick={handleSave} disabled={!editing.title}>
              <Save className="h-3.5 w-3.5" />{isAr ? "حفظ" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main List ─────────────────────────
  const stats = {
    total: events.length,
    active: events.filter(e => e.status === "active").length,
    recurring: events.filter(e => e.is_recurring).length,
    international: events.filter(e => e.is_international).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            {isAr ? "تقويم الفعاليات العالمية" : "Global Events Calendar"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAr ? "إدارة الفعاليات العالمية والمحلية المتكررة" : "Manage global and local recurring events"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportEvents} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />{isAr ? "تصدير" : "Export CSV"}
          </Button>
          <Button className="gap-1.5" onClick={openNew}>
            <Plus className="h-4 w-4" />{isAr ? "فعالية جديدة" : "New Event"}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: isAr ? "الإجمالي" : "Total", value: stats.total, icon: Calendar, color: "text-primary bg-primary/10" },
          { label: isAr ? "نشط" : "Active", value: stats.active, icon: CheckCircle, color: "text-chart-5 bg-chart-5/10" },
          { label: isAr ? "متكرر" : "Recurring", value: stats.recurring, icon: RefreshCw, color: "text-chart-3 bg-chart-3/10" },
          { label: isAr ? "دولي" : "International", value: stats.international, icon: Globe, color: "text-chart-1 bg-chart-1/10" },
        ].map(kpi => (
          <Card key={kpi.label} className="border-border/40">
            <CardContent className="p-3 flex items-center gap-2.5">
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", kpi.color)}>
                <kpi.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-black tabular-nums leading-tight">{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={isAr ? "بحث..." : "Search..."} className="ps-9 h-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "جميع الأنواع" : "All Types"}</SelectItem>
            {EVENT_TYPES.map(t => {
              const l = GLOBAL_EVENT_LABELS[t];
              return <SelectItem key={t} value={t}>{isAr ? l?.ar : l?.en}</SelectItem>;
            })}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
            <SelectItem value="active">{isAr ? "نشط" : "Active"}</SelectItem>
            <SelectItem value="draft">{isAr ? "مسودة" : "Draft"}</SelectItem>
            <SelectItem value="cancelled">{isAr ? "ملغى" : "Cancelled"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg border border-primary/20 bg-primary/5">
          <span className="text-xs font-medium">{selectedIds.size} {isAr ? "محدد" : "selected"}</span>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => bulkUpdateStatus("active")}>
            <CheckCircle className="h-3 w-3" />{isAr ? "تنشيط" : "Activate"}
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => bulkUpdateStatus("cancelled")}>
            <Ban className="h-3 w-3" />{isAr ? "إلغاء" : "Cancel"}
          </Button>
          <Button variant="destructive" size="sm" className="h-7 text-xs gap-1" onClick={bulkDelete}>
            <Trash2 className="h-3 w-3" />{isAr ? "حذف" : "Delete"}
          </Button>
        </div>
      )}

      {/* Table */}
      <Card className="border-border/40 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <Checkbox
                  checked={filtered.length > 0 && selectedIds.size === filtered.length}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead className="text-xs">{isAr ? "النوع" : "Type"}</TableHead>
              <TableHead className="text-xs">{isAr ? "العنوان" : "Title"}</TableHead>
              <TableHead className="text-xs">{isAr ? "التاريخ" : "Date"}</TableHead>
              <TableHead className="text-xs">{isAr ? "الموقع" : "Location"}</TableHead>
              <TableHead className="text-xs">{isAr ? "الحالة" : "Status"}</TableHead>
              <TableHead className="text-xs">{isAr ? "خصائص" : "Flags"}</TableHead>
              <TableHead className="text-xs">{isAr ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">{isAr ? "جاري التحميل..." : "Loading..."}</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">{isAr ? "لا توجد فعاليات" : "No events"}</TableCell></TableRow>
            ) : (
              filtered.map(ev => {
                const typeKey = ev.type as GlobalEventType;
                const label = GLOBAL_EVENT_LABELS[typeKey] || GLOBAL_EVENT_LABELS.other;
                const colors = GLOBAL_EVENT_COLORS[typeKey] || GLOBAL_EVENT_COLORS.other;
                const IconComp = ICONS[label?.icon] || MoreHorizontal;
                return (
                  <TableRow key={ev.id} className={ev.status === "cancelled" ? "opacity-50" : ""}>
                    <TableCell>
                      <Checkbox checked={selectedIds.has(ev.id)} onCheckedChange={() => toggleSelect(ev.id)} />
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-[9px] border gap-1", colors.bg, colors.text, colors.border)}>
                        <IconComp className="h-3 w-3" />{isAr ? label?.ar : label?.en}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium max-w-[200px]">
                      <span className="truncate block">{isAr && ev.title_ar ? ev.title_ar : ev.title}</span>
                    </TableCell>
                    <TableCell className="text-xs tabular-nums">
                      {format(parseISO(ev.start_date), "MMM d, yyyy")}
                      {ev.end_date && <span className="text-muted-foreground"> – {format(parseISO(ev.end_date), "MMM d")}</span>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {ev.city}{ev.country_code && `, ${ev.country_code}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ev.status === "active" ? "default" : ev.status === "cancelled" ? "destructive" : "outline"} className="text-[9px]">
                        {ev.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {ev.is_international && <Badge variant="outline" className="text-[8px] px-1">{isAr ? "دولي" : "Intl"}</Badge>}
                        {ev.is_recurring && <Badge variant="outline" className="text-[8px] px-1">{isAr ? "متكرر" : "Recurring"}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditing(ev)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(ev.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
