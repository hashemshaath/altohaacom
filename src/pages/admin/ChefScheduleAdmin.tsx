import { useState, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useChefScheduleEvents, useUpdateScheduleEvent, useDeleteScheduleEvent,
  EVENT_TYPE_CONFIG, PARTICIPATION_TYPES,
  type ChefScheduleEvent, type ScheduleEventType,
} from "@/hooks/useChefSchedule";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import {
  Calendar, Trophy, ChefHat, Landmark, Tv, Mic, GraduationCap, MessageSquare,
  MapPin, User, Plane, Ban, MoreHorizontal, Clock, Eye, EyeOff,
  Lock, Shield, Globe, Search, Filter, CheckCircle, AlertCircle,
  Briefcase, DollarSign, Users, BarChart3, Trash2, Plus, Download, Edit,
  CalendarDays,
} from "lucide-react";
import ChefScheduleEventForm from "@/components/admin/chef-schedule/ChefScheduleEventForm";
import AdminScheduleCalendar from "@/components/admin/chef-schedule/AdminScheduleCalendar";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";

const EVENT_ICONS: Record<string, any> = {
  competition: Trophy, chefs_table: ChefHat, exhibition: Landmark,
  tv_interview: Tv, conference: Mic, training: GraduationCap,
  consultation: MessageSquare, visit: MapPin, personal: User,
  travel: Plane, unavailable: Ban, other: MoreHorizontal,
};

const VIS_ICONS: Record<string, any> = { private: Lock, management: Shield, public: Globe };

export default function ChefScheduleAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [visFilter, setVisFilter] = useState("all");

  // Inline form state
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ChefScheduleEvent | null>(null);
  const [defaultDate, setDefaultDate] = useState<string>("");

  // Bulk selection — will be initialized after filtered is computed

  const { data: allEvents = [], isLoading } = useChefScheduleEvents();
  const updateEvent = useUpdateScheduleEvent();
  const deleteEvent = useDeleteScheduleEvent();

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-chef-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name, full_name_ar, avatar_url").limit(500);
      return data || [];
    },
  });

  const profileMap = Object.fromEntries(profiles.map(p => [p.user_id, p]));

  const filtered = useMemo(() => allEvents.filter(ev => {
    if (typeFilter !== "all" && ev.event_type !== typeFilter) return false;
    if (statusFilter !== "all" && ev.status !== statusFilter) return false;
    if (visFilter !== "all" && ev.visibility !== visFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return ev.title?.toLowerCase().includes(q) || ev.location?.toLowerCase().includes(q) || ev.city?.toLowerCase().includes(q) || ev.channel_name?.toLowerCase().includes(q);
    }
    return true;
  }), [allEvents, typeFilter, statusFilter, visFilter, search]);

  const bulk = useAdminBulkActions(filtered);

  const { exportCSV: exportScheduleCSV } = useCSVExport({
    columns: [
      { header: isAr ? "الشيف" : "Chef", accessor: (r: any) => profileMap[r.chef_id]?.full_name || "" },
      { header: isAr ? "النوع" : "Type", accessor: (r: any) => EVENT_TYPE_CONFIG[r.event_type as ScheduleEventType]?.en || r.event_type },
      { header: isAr ? "العنوان" : "Title", accessor: (r: any) => r.title },
      { header: isAr ? "تاريخ البدء" : "Start Date", accessor: (r: any) => r.start_date },
      { header: isAr ? "تاريخ الانتهاء" : "End Date", accessor: (r: any) => r.end_date },
      { header: isAr ? "المدينة" : "City", accessor: (r: any) => r.city || "" },
      { header: isAr ? "الحالة" : "Status", accessor: (r: any) => r.status },
      { header: isAr ? "الظهور" : "Visibility", accessor: (r: any) => r.visibility },
      { header: isAr ? "الرسوم" : "Fee", accessor: (r: any) => r.fee_amount || "" },
    ],
    filename: "chef-schedule",
  });

  const stats = {
    total: allEvents.length,
    confirmed: allEvents.filter(e => e.status === "confirmed").length,
    tentative: allEvents.filter(e => e.status === "tentative").length,
    cancelled: allEvents.filter(e => e.status === "cancelled").length,
    contracted: allEvents.filter(e => e.is_contracted).length,
    publicCount: allEvents.filter(e => e.visibility === "public").length,
    totalFees: allEvents.reduce((s, e) => s + (e.fee_amount || 0), 0),
  };

  const typeBreakdown = Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => ({
    key, config,
    count: allEvents.filter(e => e.event_type === key).length,
  })).filter(t => t.count > 0).sort((a, b) => b.count - a.count);

  const handleApprove = async (id: string) => {
    try {
      await updateEvent.mutateAsync({ id, status: "confirmed" });
      toast.success(isAr ? "تم تأكيد الحدث" : "Event confirmed");
    } catch { toast.error(isAr ? "خطأ" : "Error"); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent.mutateAsync(id);
      toast.success(isAr ? "تم الحذف" : "Deleted");
    } catch { toast.error(isAr ? "خطأ" : "Error"); }
  };

  const handleEdit = (ev: ChefScheduleEvent) => {
    setEditingEvent(ev);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingEvent(null);
    setDefaultDate("");
    setShowForm(true);
  };

  const handleDateClick = (date: string) => {
    setEditingEvent(null);
    setDefaultDate(date);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingEvent(null);
    setDefaultDate("");
  };

  const bulkUpdateStatus = async (status: string) => {
    try {
      await Promise.all([...bulk.selected].map(id => updateEvent.mutateAsync({ id, status: status as any })));
      toast.success(isAr ? `تم تحديث ${bulk.count} حدث` : `Updated ${bulk.count} events`);
      bulk.clearSelection();
    } catch { toast.error(isAr ? "خطأ" : "Error"); }
  };

  const bulkDelete = async () => {
    try {
      await Promise.all([...bulk.selected].map(id => deleteEvent.mutateAsync(id)));
      toast.success(isAr ? `تم حذف ${bulk.count} حدث` : `Deleted ${bulk.count} events`);
      bulk.clearSelection();
    } catch { toast.error(isAr ? "خطأ" : "Error"); }
  };


  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={CalendarDays}
        title={isAr ? "إدارة جداول الطهاة" : "Chef Schedule Management"}
        description={isAr ? "عرض وإدارة جداول جميع الطهاة والفعاليات" : "View and manage all chef schedules and events"}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportScheduleCSV(filtered)} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />{isAr ? "تصدير" : "Export CSV"}
            </Button>
            <Button size="sm" onClick={handleAddNew} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />{isAr ? "إضافة حدث" : "Add Event"}
            </Button>
          </div>
        }
      />

      {/* Inline Form */}
      {showForm && (
        <ChefScheduleEventForm
          event={editingEvent}
          onClose={handleFormClose}
          defaultDate={defaultDate}
        />
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: isAr ? "الإجمالي" : "Total", value: stats.total, icon: Calendar, color: "text-primary bg-primary/10" },
          { label: isAr ? "مؤكد" : "Confirmed", value: stats.confirmed, icon: CheckCircle, color: "text-chart-5 bg-chart-5/10" },
          { label: isAr ? "مبدئي" : "Tentative", value: stats.tentative, icon: AlertCircle, color: "text-chart-4 bg-chart-4/10" },
          { label: isAr ? "ملغى" : "Cancelled", value: stats.cancelled, icon: Ban, color: "text-destructive bg-destructive/10" },
          { label: isAr ? "عقود" : "Contracted", value: stats.contracted, icon: Briefcase, color: "text-chart-2 bg-chart-2/10" },
          { label: isAr ? "عام" : "Public", value: stats.publicCount, icon: Globe, color: "text-chart-3 bg-chart-3/10" },
          { label: isAr ? "إجمالي الرسوم" : "Total Fees", value: stats.totalFees.toLocaleString(), icon: DollarSign, color: "text-primary bg-primary/10" },
        ].map(kpi => (
          <Card key={kpi.label} className="rounded-2xl border-border/40 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="p-3 flex items-center gap-2.5">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${kpi.color}`}>
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

      <Tabs defaultValue="events">
        <TabsList className="rounded-2xl border border-border/40 bg-muted/30 backdrop-blur p-1.5 h-auto">
          <TabsTrigger value="events" className="gap-1.5 rounded-xl data-[state=active]:shadow-sm"><Calendar className="h-3.5 w-3.5" />{isAr ? "الأحداث" : "Events"}</TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1.5 rounded-xl data-[state=active]:shadow-sm"><CalendarDays className="h-3.5 w-3.5" />{isAr ? "التقويم" : "Calendar"}</TabsTrigger>
          <TabsTrigger value="overview" className="gap-1.5 rounded-xl data-[state=active]:shadow-sm"><BarChart3 className="h-3.5 w-3.5" />{isAr ? "نظرة عامة" : "Overview"}</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4 mt-4">
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
                {Object.entries(EVENT_TYPE_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "جميع الحالات" : "All Status"}</SelectItem>
                <SelectItem value="confirmed">{isAr ? "مؤكد" : "Confirmed"}</SelectItem>
                <SelectItem value="tentative">{isAr ? "مبدئي" : "Tentative"}</SelectItem>
                <SelectItem value="cancelled">{isAr ? "ملغى" : "Cancelled"}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={visFilter} onValueChange={setVisFilter}>
              <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "جميع الرؤية" : "All Visibility"}</SelectItem>
                <SelectItem value="private">{isAr ? "خاص" : "Private"}</SelectItem>
                <SelectItem value="management">{isAr ? "إدارة" : "Management"}</SelectItem>
                <SelectItem value="public">{isAr ? "عام" : "Public"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <BulkActionBar
            count={bulk.count}
            onClear={bulk.clearSelection}
            onDelete={bulkDelete}
            onStatusChange={() => bulkUpdateStatus("confirmed")}
            onExport={() => exportScheduleCSV(bulk.selectedItems)}
          >
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => bulkUpdateStatus("cancelled")}>
              <Ban className="h-3 w-3" />{isAr ? "إلغاء الكل" : "Cancel All"}
            </Button>
          </BulkActionBar>

          {/* Events Table */}
          <Card className="rounded-2xl border-border/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <Checkbox
                      checked={bulk.isAllSelected}
                      onCheckedChange={bulk.toggleAll}
                    />
                  </TableHead>
                  <TableHead className="text-xs">{isAr ? "الشيف" : "Chef"}</TableHead>
                  <TableHead className="text-xs">{isAr ? "النوع" : "Type"}</TableHead>
                  <TableHead className="text-xs">{isAr ? "العنوان" : "Title"}</TableHead>
                  <TableHead className="text-xs">{isAr ? "التاريخ" : "Date"}</TableHead>
                  <TableHead className="text-xs">{isAr ? "الموقع" : "Location"}</TableHead>
                  <TableHead className="text-xs">{isAr ? "الحالة" : "Status"}</TableHead>
                  <TableHead className="text-xs">{isAr ? "الرؤية" : "Vis."}</TableHead>
                  <TableHead className="text-xs">{isAr ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      {isAr ? "لا توجد أحداث" : "No events found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(ev => {
                    const config = EVENT_TYPE_CONFIG[ev.event_type as ScheduleEventType] || EVENT_TYPE_CONFIG.other;
                    const Icon = EVENT_ICONS[ev.event_type] || MoreHorizontal;
                    const VisIcon = VIS_ICONS[ev.visibility] || Lock;
                    const chef = profileMap[ev.chef_id];
                    return (
                      <TableRow key={ev.id} className={ev.status === "cancelled" ? "opacity-50" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={bulk.isSelected(ev.id)}
                            onCheckedChange={() => bulk.toggleOne(ev.id)}
                          />
                        </TableCell>
                        <TableCell className="text-xs font-medium">{isAr && chef?.full_name_ar ? chef.full_name_ar : chef?.full_name || "—"}</TableCell>
                        <TableCell>
                          <Badge className={`text-[9px] border gap-1 ${config.color}`}>
                            <Icon className="h-3 w-3" />{isAr ? config.ar : config.en}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium max-w-[200px] truncate">
                          {ev.title}
                          {ev.channel_name && <span className="text-muted-foreground ms-1">({ev.channel_name})</span>}
                        </TableCell>
                        <TableCell className="text-xs tabular-nums">
                          {format(parseISO(ev.start_date), "MMM d, yyyy")}
                          {!ev.all_day && <span className="text-muted-foreground ms-1">{format(parseISO(ev.start_date), "HH:mm")}</span>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{ev.city || ev.location || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={ev.status === "confirmed" ? "default" : ev.status === "cancelled" ? "destructive" : "outline"} className="text-[9px]">
                            {ev.status}
                          </Badge>
                        </TableCell>
                        <TableCell><VisIcon className="h-3.5 w-3.5 text-muted-foreground" /></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(ev)} title={isAr ? "تعديل" : "Edit"}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            {ev.status === "tentative" && (
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-chart-5" onClick={() => handleApprove(ev.id)} title={isAr ? "تأكيد" : "Confirm"}>
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(ev.id)} title={isAr ? "حذف" : "Delete"}>
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
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar" className="mt-4">
          <AdminScheduleCalendar
            events={allEvents}
            profileMap={profileMap}
            onEventClick={handleEdit}
            onDateClick={handleDateClick}
          />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Type Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {typeBreakdown.map(({ key, config, count }) => {
              const Icon = EVENT_ICONS[key] || MoreHorizontal;
              const pct = allEvents.length ? Math.round((count / allEvents.length) * 100) : 0;
              return (
                <Card key={key} className="border-border/40">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xl font-black tabular-nums">{count}</p>
                      <p className="text-xs text-muted-foreground">{isAr ? config.ar : config.en}</p>
                      <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Monthly Distribution */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                {isAr ? "التوزيع الشهري" : "Monthly Distribution"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const monthCounts: Record<string, number> = {};
                allEvents.forEach(ev => {
                  const m = format(parseISO(ev.start_date), "MMM yyyy");
                  monthCounts[m] = (monthCounts[m] || 0) + 1;
                });
                const entries = Object.entries(monthCounts).slice(-12);
                const maxCount = Math.max(...entries.map(([, c]) => c), 1);
                return entries.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">{isAr ? "لا توجد بيانات" : "No data"}</p>
                ) : (
                  <div className="flex items-end gap-1.5 h-32">
                    {entries.map(([month, count]) => (
                      <div key={month} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] font-bold tabular-nums">{count}</span>
                        <div className="w-full rounded-t bg-primary/70 transition-all" style={{ height: `${(count / maxCount) * 100}%`, minHeight: 4 }} />
                        <span className="text-[8px] text-muted-foreground whitespace-nowrap">{month.split(" ")[0]}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Contracted Events Summary */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                {isAr ? "الأحداث التعاقدية" : "Contracted Events"}
                <Badge variant="outline" className="ms-auto text-[10px]">{allEvents.filter(e => e.is_contracted).length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allEvents.filter(e => e.is_contracted).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">{isAr ? "لا توجد عقود" : "No contracted events"}</p>
              ) : (
                <div className="space-y-2">
                  {allEvents.filter(e => e.is_contracted).map(ev => {
                    const config = EVENT_TYPE_CONFIG[ev.event_type as ScheduleEventType] || EVENT_TYPE_CONFIG.other;
                    const chef = profileMap[ev.chef_id];
                    return (
                      <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/30 hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => handleEdit(ev)}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{ev.title}</p>
                          <p className="text-xs text-muted-foreground">{chef?.full_name || "—"} · {format(parseISO(ev.start_date), "MMM d, yyyy")}</p>
                        </div>
                        <Badge className={`text-[9px] border ${config.color}`}>{isAr ? config.ar : config.en}</Badge>
                        {ev.fee_amount ? (
                          <span className="text-sm font-bold text-primary tabular-nums">{ev.fee_amount.toLocaleString()} {ev.fee_currency}</span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
