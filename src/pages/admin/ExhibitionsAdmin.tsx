import { useState, useMemo, memo, lazy, Suspense } from "react";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import { SortableTableHead } from "@/components/admin/SortableTableHead";
import { AdminTablePagination } from "@/components/admin/AdminTablePagination";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { deriveExhibitionStatus, EXHIBITION_STATUS_LEGEND } from "@/lib/exhibitionStatus";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ExhibitionEditForm } from "@/components/admin/ExhibitionEditForm";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminTableCard } from "@/components/admin/AdminTableCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import {
  Plus, Pencil, Trash2, Eye, Landmark, Calendar, Building, Ticket,
  Globe, Search, Copy, FileSpreadsheet, CheckCircle, XCircle, Layers,
  Download, TrendingUp, Clock, MoreHorizontal, BarChart3, Users, MapPin,
  ListFilter, Import, ScanSearch,
} from "lucide-react";
import { EventSeriesManager } from "@/components/admin/EventSeriesManager";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import ExhibitionDetailDrawer from "@/components/admin/ExhibitionDetailDrawer";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/config/routes";

const BulkImportPanel = lazy(() => import("@/components/admin/BulkImportPanel").then(m => ({ default: m.BulkImportPanel })));
const BatchDuplicateScanner = lazy(() => import("@/components/admin/BatchDuplicateScanner").then(m => ({ default: m.BatchDuplicateScanner })));

type ExhibitionStatus = Database["public"]["Enums"]["exhibition_status"];

const statusOptions: { value: ExhibitionStatus; en: string; ar: string }[] = [
  { value: "pending", en: "Pending Approval", ar: "بانتظار الموافقة" },
  { value: "draft", en: "Draft", ar: "مسودة" },
  { value: "upcoming", en: "Upcoming", ar: "قادمة" },
  { value: "active", en: "Active", ar: "نشطة" },
  { value: "completed", en: "Completed", ar: "مكتملة" },
  { value: "cancelled", en: "Cancelled", ar: "ملغاة" },
];

const typeOptions: { value: string; en: string; ar: string }[] = [
  { value: "exhibition", en: "Exhibition", ar: "معرض" },
  { value: "conference", en: "Conference", ar: "مؤتمر" },
  { value: "summit", en: "Summit", ar: "قمة" },
  { value: "workshop", en: "Workshop", ar: "ورشة عمل" },
  { value: "food_festival", en: "Food Festival", ar: "مهرجان طعام" },
  { value: "trade_show", en: "Trade Show", ar: "معرض تجاري" },
  { value: "competition_event", en: "Competition Event", ar: "حدث تنافسي" },
];

const statusColorMap: Record<string, string> = {
  pending: "bg-chart-4/10 text-chart-4",
  draft: "bg-muted text-muted-foreground",
  upcoming: "bg-chart-4/10 text-chart-4",
  active: "bg-chart-2/10 text-chart-2",
  completed: "bg-chart-1/10 text-chart-1",
  cancelled: "bg-destructive/10 text-destructive",
};

type TabKey = "events" | "series" | "import" | "dedup" | "stats";

const TAB_CONFIG = (isAr: boolean) => [
  { value: "events" as TabKey, icon: Landmark, label: isAr ? "الفعاليات" : "Events" },
  { value: "series" as TabKey, icon: Layers, label: isAr ? "السلاسل" : "Series" },
  { value: "import" as TabKey, icon: Import, label: isAr ? "استيراد" : "Import" },
  { value: "dedup" as TabKey, icon: ScanSearch, label: isAr ? "التكرارات" : "Dedup" },
  { value: "stats" as TabKey, icon: BarChart3, label: isAr ? "الإحصائيات" : "Statistics" },
];

function WidgetFallback() {
  return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>;
}

export default function ExhibitionsAdmin() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const t = (en: string, ar: string) => (isAr ? ar : en);

  const [activeTab, setActiveTab] = useState<TabKey>("events");
  const [showForm, setShowForm] = useState(false);
  const [editingExhibition, setEditingExhibition] = useState<any>(null);
  const [drawerExhibitionId, setDrawerExhibitionId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [organizerFilter, setOrganizerFilter] = useState<string>("all");
  const [seriesFilter, setSeriesFilter] = useState<string>("all");

  const { data: seriesList } = useQuery({
    queryKey: ["event-series-select"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("event_series").select("id, name, name_ar").eq("is_active", true).order("name").limit(500);
      return data as any[] || [];
    },
  });

  const { data: exhibitions, isLoading } = useQuery({
    queryKey: ["admin-exhibitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibitions")
        .select("id, title, title_ar, slug, type, status, start_date, end_date, city, country, venue, venue_ar, organizer_name, organizer_name_ar, organizer_email, organizer_phone, organizer_website, organizer_logo_url, organizer_type, organizer_entity_id, organizer_company_id, organizer_user_id, cover_image_url, logo_url, is_virtual, is_free, is_featured, view_count, max_attendees, ticket_price, ticket_price_ar, registration_url, website_url, map_url, virtual_link, description, description_ar, tags, target_audience, includes_competitions, includes_training, includes_seminars, series_id, edition_year, exhibition_number, created_at, created_by, currency, registration_deadline")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Derived filter values
  const uniqueYears = useMemo(() => [...new Set(exhibitions?.map(e => (e as any).edition_year?.toString() || new Date(e.start_date).getFullYear().toString()) || [])].sort((a, b) => Number(b) - Number(a)), [exhibitions]);
  const uniqueCities = useMemo(() => [...new Set(exhibitions?.map(e => e.city).filter(Boolean) || [])].sort(), [exhibitions]);
  const uniqueOrganizers = useMemo(() => [...new Set(exhibitions?.map(e => e.organizer_name).filter(Boolean) || [])].sort(), [exhibitions]);

  const filteredExhibitions = useMemo(() => exhibitions?.filter((ex) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      ex.title.toLowerCase().includes(q) ||
      (ex.title_ar && ex.title_ar.includes(searchQuery)) ||
      (ex.organizer_name && ex.organizer_name.toLowerCase().includes(q)) ||
      (ex.city && ex.city.toLowerCase().includes(q));
    const matchesStatus = statusFilter === "all" || ex.status === statusFilter;
    const matchesType = typeFilter === "all" || ex.type === typeFilter;
    const matchesYear = yearFilter === "all" || ((ex as any).edition_year?.toString() || new Date(ex.start_date).getFullYear().toString()) === yearFilter;
    const matchesCity = cityFilter === "all" || ex.city === cityFilter;
    const matchesOrganizer = organizerFilter === "all" || ex.organizer_name === organizerFilter;
    const matchesSeries = seriesFilter === "all" || (seriesFilter === "none" ? !(ex as any).series_id : (ex as any).series_id === seriesFilter);
    return matchesSearch && matchesStatus && matchesType && matchesYear && matchesCity && matchesOrganizer && matchesSeries;
  }), [exhibitions, searchQuery, statusFilter, typeFilter, yearFilter, cityFilter, organizerFilter, seriesFilter]);

  const { sorted: sortedExhibitions, sortColumn, sortDirection, toggleSort } = useTableSort(filteredExhibitions || []);
  const exPagination = usePagination(sortedExhibitions || []);
  const bulk = useAdminBulkActions(exPagination.paginated || []);

  const { exportCSV: exportExhibitions } = useCSVExport({
    columns: [
      { header: isAr ? "الاسم" : "Title", accessor: (r) => isAr && r.title_ar ? r.title_ar : r.title },
      { header: isAr ? "النوع" : "Type", accessor: (r) => r.type },
      { header: isAr ? "الحالة" : "Status", accessor: (r) => r.status },
      { header: isAr ? "التاريخ" : "Date", accessor: (r) => r.start_date ? format(new Date(r.start_date), "yyyy-MM-dd") : "" },
      { header: isAr ? "المدينة" : "City", accessor: (r) => r.city || "" },
      { header: isAr ? "المنظم" : "Organizer", accessor: (r) => r.organizer_name || "" },
    ],
    filename: "exhibitions",
  });

  // Mutations
  const bulkStatusChange = async (status: string) => {
    const ids = [...bulk.selected];
    const { error } = await supabase.from("exhibitions").update({ status: status as any }).in("id", ids);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-exhibitions"] });
    bulk.clearSelection();
    toast({ title: isAr ? `تم تحديث ${ids.length} فعالية` : `${ids.length} updated` });
  };

  const bulkDelete = async () => {
    const ids = [...bulk.selected];
    const { error } = await supabase.from("exhibitions").delete().in("id", ids);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-exhibitions"] });
    bulk.clearSelection();
    toast({ title: isAr ? `تم حذف ${ids.length} فعالية` : `${ids.length} deleted` });
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exhibitions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exhibitions"] });
      toast({ title: t("Exhibition deleted", "تم حذف الفعالية") });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (ex: any) => {
      const { id, created_at, updated_at, view_count, slug, ...rest } = ex;
      const newSlug = (slug || "") + "-copy-" + Date.now().toString(36);
      const payload = { ...rest, title: (rest.title || "") + " (Copy)", title_ar: rest.title_ar ? rest.title_ar + " (نسخة)" : null, slug: newSlug, status: "draft" as ExhibitionStatus, view_count: 0, created_by: user?.id };
      const { error } = await supabase.from("exhibitions").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exhibitions"] });
      toast({ title: t("Exhibition duplicated", "تم تكرار الفعالية") });
    },
    onError: (err: Error) => toast({ title: t("Error", "خطأ"), description: err.message, variant: "destructive" }),
  });

  const approveExhibition = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exhibitions").update({ status: "draft" as ExhibitionStatus }).eq("id", id);
      if (error) throw error;
      await supabase.from("admin_actions").insert({ admin_id: user!.id, action_type: "approve_exhibition", details: { exhibition_id: id } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exhibitions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-counts"] });
      toast({ title: t("Exhibition approved", "تمت الموافقة") });
    },
  });

  const rejectExhibition = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exhibitions").update({ status: "cancelled" as ExhibitionStatus }).eq("id", id);
      if (error) throw error;
      await supabase.from("admin_actions").insert({ admin_id: user!.id, action_type: "reject_exhibition", details: { exhibition_id: id } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exhibitions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-counts"] });
      toast({ title: t("Exhibition rejected", "تم رفض الفعالية") });
    },
  });

  const openCreateForm = () => { setEditingExhibition(null); setShowForm(true); };
  const openEditForm = (ex: any) => { setEditingExhibition(ex); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingExhibition(null); };

  const getTypeName = (type: string) => {
    const opt = typeOptions.find(o => o.value === type);
    return opt ? (isAr ? opt.ar : opt.en) : type;
  };

  const activeFilterCount = [statusFilter, typeFilter, yearFilter, cityFilter, organizerFilter, seriesFilter].filter(f => f !== "all").length;
  const tabs = TAB_CONFIG(isAr);

  // KPI data
  const kpis = useMemo(() => {
    if (!exhibitions) return [];
    return [
      { label: t("Total", "الإجمالي"), value: exhibitions.length, icon: Landmark, color: "text-foreground" },
      { label: t("Active", "نشطة"), value: exhibitions.filter(e => e.status === "active").length, icon: TrendingUp, color: "text-chart-2" },
      { label: t("Pending", "معلقة"), value: exhibitions.filter(e => e.status === "pending").length, icon: Clock, color: "text-chart-4" },
      { label: t("Views", "المشاهدات"), value: exhibitions.reduce((s, e) => s + (e.view_count || 0), 0), icon: Eye, color: "text-primary" },
    ];
  }, [exhibitions, isAr]);

  // ── Edit Form View ──
  if (showForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={closeForm} className="text-muted-foreground">
            ← {t("Back", "رجوع")}
          </Button>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              {editingExhibition ? t("Edit Exhibition", "تعديل المعرض") : t("Create Exhibition", "إنشاء معرض")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {editingExhibition ? (isAr && editingExhibition.title_ar ? editingExhibition.title_ar : editingExhibition.title) : t("Fill in the details to create a new exhibition", "أدخل التفاصيل لإنشاء معرض جديد")}
            </p>
          </div>
        </div>
        <ExhibitionEditForm exhibition={editingExhibition} onClose={closeForm} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("Exhibitions & Events", "المعارض والفعاليات")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("Manage all exhibitions, conferences, and events", "إدارة جميع المعارض والمؤتمرات والفعاليات")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => exportExhibitions(filteredExhibitions || [])}>
            <Download className="h-3.5 w-3.5 me-1.5" />
            {t("Export", "تصدير")}
          </Button>
          <Button size="sm" onClick={openCreateForm}>
            <Plus className="h-3.5 w-3.5 me-1.5" />
            {t("Add Event", "إضافة فعالية")}
          </Button>
        </div>
      </div>

      {/* ─── KPI Strip ─── */}
      {kpis.length > 0 && (
        <div className="flex items-center gap-6 overflow-x-auto pb-1">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="flex items-center gap-2.5 shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60">
                <kpi.icon className={cn("h-3.5 w-3.5", kpi.color)} />
              </div>
              <div>
                <p className={cn("text-lg font-bold tabular-nums leading-none", kpi.color)}>
                  <AnimatedCounter value={kpi.value} />
                </p>
                <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Tab Navigation ─── */}
      <div className="flex items-center gap-1 overflow-x-auto pb-px border-b border-border/40">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-150 border-b-2 -mb-px",
              activeTab === tab.value
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Tab Content ─── */}
      {activeTab === "events" && (
        <div className="space-y-4">
          {/* Filters */}
          <AdminFilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={t("Search by name, organizer, city...", "بحث بالاسم، المنظم، المدينة...")}
          >
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] rounded-lg h-9 text-xs"><SelectValue placeholder={t("Status", "الحالة")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Statuses", "جميع الحالات")}</SelectItem>
                {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{isAr ? opt.ar : opt.en}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] rounded-lg h-9 text-xs"><SelectValue placeholder={t("Type", "النوع")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Types", "جميع الأنواع")}</SelectItem>
                {typeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{isAr ? opt.ar : opt.en}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[110px] rounded-lg h-9 text-xs"><SelectValue placeholder={t("Year", "السنة")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Years", "جميع السنوات")}</SelectItem>
                {uniqueYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-[130px] rounded-lg h-9 text-xs"><SelectValue placeholder={t("City", "المدينة")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Cities", "جميع المدن")}</SelectItem>
                {uniqueCities.map(c => <SelectItem key={c!} value={c!}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={organizerFilter} onValueChange={setOrganizerFilter}>
              <SelectTrigger className="w-[150px] rounded-lg h-9 text-xs"><SelectValue placeholder={t("Organizer", "المنظم")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Organizers", "جميع المنظمين")}</SelectItem>
                {uniqueOrganizers.map(o => <SelectItem key={o!} value={o!}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={seriesFilter} onValueChange={setSeriesFilter}>
              <SelectTrigger className="w-[150px] rounded-lg h-9 text-xs"><SelectValue placeholder={t("Series", "السلسلة")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Series", "جميع السلاسل")}</SelectItem>
                <SelectItem value="none">{t("No Series", "بدون سلسلة")}</SelectItem>
                {seriesList?.map(s => <SelectItem key={s.id} value={s.id}>{isAr && s.name_ar ? s.name_ar : s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-8 px-2 text-muted-foreground" onClick={() => { setStatusFilter("all"); setTypeFilter("all"); setYearFilter("all"); setCityFilter("all"); setOrganizerFilter("all"); setSeriesFilter("all"); }}>
                {t("Clear", "مسح")} ({activeFilterCount})
              </Button>
            )}
          </AdminFilterBar>

          {/* Status Legend */}
          <div className="flex flex-wrap gap-1.5">
            {EXHIBITION_STATUS_LEGEND.map(s => (
              <span key={s.status} className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", s.color)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
                {isAr ? s.labelAr : s.label}
              </span>
            ))}
          </div>

          <BulkActionBar
            count={bulk.count}
            onClear={bulk.clearSelection}
            onExport={() => exportExhibitions(bulk.selectedItems)}
            onDelete={bulkDelete}
            onStatusChange={bulkStatusChange}
          />

          {/* Table */}
          <AdminTableCard>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="w-10">
                    <Checkbox checked={bulk.isAllSelected} onCheckedChange={bulk.toggleAll} />
                  </TableHead>
                  <SortableTableHead column="title" label={t("Event", "الفعالية")} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                  <TableHead className="text-xs font-medium text-muted-foreground">{t("Organizer", "المنظم")}</TableHead>
                  <SortableTableHead column="type" label={t("Type", "النوع")} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                  <SortableTableHead column="status" label={t("Status", "الحالة")} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                  <SortableTableHead column="start_date" label={t("Date", "التاريخ")} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                  <TableHead className="text-xs font-medium text-muted-foreground">{t("Location", "الموقع")}</TableHead>
                  <TableHead className="text-end text-xs font-medium text-muted-foreground w-20">{t("Actions", "الإجراءات")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full rounded" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : sortedExhibitions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0">
                      <AdminEmptyState
                        icon={Landmark}
                        title="No events found"
                        titleAr="لا توجد فعاليات"
                        description="Try adjusting your filters or create a new event"
                        descriptionAr="جرب تعديل الفلاتر أو أنشئ فعالية جديدة"
                        actionLabel="Add Event"
                        actionLabelAr="إضافة فعالية"
                        onAction={openCreateForm}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  exPagination.paginated?.map((ex) => {
                    const orgLogoUrl = (ex as any).organizer_logo_url || ex.logo_url;
                    const derived = deriveExhibitionStatus({ dbStatus: ex.status, startDate: ex.start_date, endDate: ex.end_date, registrationDeadline: ex.registration_deadline });

                    return (
                      <TableRow
                        key={ex.id}
                        className={cn(
                          "group hover:bg-muted/30 transition-colors duration-150 cursor-pointer border-border/30",
                          bulk.isSelected(ex.id) && "bg-primary/5"
                        )}
                        onClick={() => setDrawerExhibitionId(ex.id)}
                      >
                        <TableCell onClick={e => e.stopPropagation()}>
                          <Checkbox checked={bulk.isSelected(ex.id)} onCheckedChange={() => bulk.toggleOne(ex.id)} />
                        </TableCell>

                        {/* Event */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {ex.cover_image_url ? (
                              <img loading="lazy" decoding="async" src={ex.cover_image_url} alt={ex.title || "Exhibition"} className="h-9 w-13 rounded-lg object-cover shrink-0 ring-1 ring-border/30" />
                            ) : (
                              <div className="h-9 w-13 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                                <Landmark className="h-3.5 w-3.5 text-muted-foreground/40" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-[13px] truncate group-hover:text-primary transition-colors">
                                {(() => {
                                  const title = isAr && ex.title_ar ? ex.title_ar : ex.title;
                                  const year = (ex as any).edition_year;
                                  if (!year || title.includes(String(year))) return title;
                                  return `${title} ${year}`;
                                })()}
                              </p>
                              <div className="flex items-center gap-1 mt-0.5">
                                {(ex as any).edition_year && (
                                  <span className="text-[10px] font-mono text-muted-foreground">{(ex as any).edition_year}</span>
                                )}
                                {(ex as any).exhibition_number && (
                                  <span className="text-[10px] text-muted-foreground">#{(ex as any).exhibition_number}</span>
                                )}
                                {ex.is_featured && <span className="text-[10px] text-chart-4">★</span>}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Organizer */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {orgLogoUrl ? (
                              <img loading="lazy" decoding="async" src={orgLogoUrl} alt="Organizer" className="h-5 w-5 rounded object-contain shrink-0 bg-muted p-0.5" />
                            ) : ex.organizer_name ? (
                              <div className="h-5 w-5 rounded bg-muted flex items-center justify-center shrink-0">
                                <Building className="h-2.5 w-2.5 text-muted-foreground" />
                              </div>
                            ) : null}
                            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                              {ex.organizer_name ? (isAr && ex.organizer_name_ar ? ex.organizer_name_ar : ex.organizer_name) : "—"}
                            </span>
                          </div>
                        </TableCell>

                        {/* Type */}
                        <TableCell>
                          <span className="text-xs text-muted-foreground">{getTypeName(ex.type)}</span>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className={cn("inline-flex items-center gap-1.5 rounded-full border-0 px-2 py-0.5 text-[11px] font-medium cursor-pointer hover:ring-2 hover:ring-ring/20 transition-all", derived.color)}>
                                {derived.status === "started" ? (
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
                                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
                                  </span>
                                ) : (
                                  <span className={cn("h-1.5 w-1.5 rounded-full", derived.dot)} />
                                )}
                                {isAr ? derived.labelAr : derived.label}
                                {derived.urgent && derived.daysLeft && <span className="font-bold">({derived.daysLeft}d)</span>}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="min-w-[180px]">
                              <p className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground">{t("Change Status", "تغيير الحالة")}</p>
                              {statusOptions.map(opt => (
                                <DropdownMenuItem
                                  key={opt.value}
                                  disabled={ex.status === opt.value}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const { error } = await supabase.from("exhibitions").update({ status: opt.value }).eq("id", ex.id);
                                    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
                                    queryClient.invalidateQueries({ queryKey: ["admin-exhibitions"] });
                                    toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" });
                                  }}
                                  className="text-xs"
                                >
                                  <span className={cn("h-2 w-2 rounded-full me-2", statusColorMap[opt.value]?.split(" ")[0] || "bg-muted")} />
                                  {isAr ? opt.ar : opt.en}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>

                        {/* Date */}
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                          {format(new Date(ex.start_date), "dd MMM yyyy")}
                        </TableCell>

                        {/* Location */}
                        <TableCell className="text-xs text-muted-foreground">
                          {ex.is_virtual ? (
                            <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{t("Virtual", "افتراضي")}</span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[100px]">{ex.city || ""}{ex.country ? `, ${ex.country}` : ""}</span>
                            </span>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                            {ex.status === "pending" && (
                              <div className="flex gap-0.5 me-1">
                                <Button size="icon" variant="ghost" onClick={() => approveExhibition.mutate(ex.id)} className="h-7 w-7 text-chart-2 hover:text-chart-2">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => rejectExhibition.mutate(ex.id)} className="h-7 w-7 text-destructive hover:text-destructive">
                                  <XCircle className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="min-w-[160px]">
                                <DropdownMenuItem asChild>
                                  <Link to={`/exhibitions/${ex.slug}`} className="flex items-center gap-2 text-xs">
                                    <Eye className="h-3.5 w-3.5" /> {t("View", "عرض")}
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditForm(ex)} className="text-xs">
                                  <Pencil className="h-3.5 w-3.5 me-2" /> {t("Edit", "تعديل")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => duplicateMutation.mutate(ex)} className="text-xs">
                                  <Copy className="h-3.5 w-3.5 me-2" /> {t("Duplicate", "تكرار")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => deleteMutation.mutate(ex.id)} className="text-xs text-destructive focus:text-destructive">
                                  <Trash2 className="h-3.5 w-3.5 me-2" /> {t("Delete", "حذف")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <AdminTablePagination
              page={exPagination.page} totalPages={exPagination.totalPages} totalItems={exPagination.totalItems}
              startItem={exPagination.startItem} endItem={exPagination.endItem} pageSize={exPagination.pageSize}
              pageSizeOptions={exPagination.pageSizeOptions} hasNext={exPagination.hasNext} hasPrev={exPagination.hasPrev}
              onPageChange={exPagination.goTo} onPageSizeChange={exPagination.changePageSize}
            />
          </AdminTableCard>
        </div>
      )}

      {activeTab === "series" && (
        <EventSeriesManager onCreateEdition={(series, year) => {
          setEditingExhibition({
            title: `${series.name} ${year}`, title_ar: series.name_ar ? `${series.name_ar} ${year}` : "",
            venue: series.default_venue || "", venue_ar: series.default_venue_ar || "",
            city: series.default_city || "", country: series.default_country || "",
            organizer_name: series.default_organizer_name || "", organizer_name_ar: series.default_organizer_name_ar || "",
            organizer_email: series.default_organizer_email || "", cover_image_url: series.cover_image_url || "",
            tags: series.tags || [], series_id: series.id, edition_year: year, type: "exhibition", status: "draft",
          });
          setShowForm(true);
        }} />
      )}

      {activeTab === "import" && (
        <Suspense fallback={<WidgetFallback />}>
          <BulkImportPanel entityType="exhibition" onImportComplete={() => queryClient.invalidateQueries({ queryKey: ["admin-exhibitions"] })} />
        </Suspense>
      )}

      {activeTab === "dedup" && (
        <Suspense fallback={<WidgetFallback />}>
          <BatchDuplicateScanner defaultTable="exhibitions" onMergeComplete={() => queryClient.invalidateQueries({ queryKey: ["admin-exhibitions"] })} />
        </Suspense>
      )}

      {activeTab === "stats" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{t("Detailed exhibition analytics and performance metrics", "تحليلات مفصلة وأداء الفعاليات")}</p>
            <Link to={ROUTES.adminExhibitionStats}>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-3.5 w-3.5 me-1.5" />
                {t("Full Dashboard", "لوحة كاملة")}
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t("Completed", "مكتملة"), value: exhibitions?.filter(e => e.status === "completed").length || 0, icon: CheckCircle, color: "text-chart-1" },
              { label: t("Upcoming", "قادمة"), value: exhibitions?.filter(e => e.status === "upcoming").length || 0, icon: Calendar, color: "text-chart-4" },
              { label: t("With Series", "ضمن سلسلة"), value: exhibitions?.filter(e => (e as any).series_id).length || 0, icon: Layers, color: "text-chart-5" },
              { label: t("Featured", "مميزة"), value: exhibitions?.filter(e => e.is_featured).length || 0, icon: TrendingUp, color: "text-chart-3" },
            ].map(item => (
              <Card key={item.label} className="border-border/40">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center">
                    <item.icon className={cn("h-4 w-4", item.color)} />
                  </div>
                  <div>
                    <p className={cn("text-xl font-bold tabular-nums", item.color)}>
                      <AnimatedCounter value={item.value} />
                    </p>
                    <p className="text-[11px] text-muted-foreground">{item.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <ExhibitionDetailDrawer
        exhibitionId={drawerExhibitionId}
        open={!!drawerExhibitionId}
        onClose={() => setDrawerExhibitionId(null)}
      />
    </div>
  );
}
