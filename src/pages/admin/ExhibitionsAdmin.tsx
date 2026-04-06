import { useState } from "react";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import { SortableTableHead } from "@/components/admin/SortableTableHead";
import { AdminTablePagination } from "@/components/admin/AdminTablePagination";

import { BulkImportPanel } from "@/components/admin/BulkImportPanel";
import { BatchDuplicateScanner } from "@/components/admin/BatchDuplicateScanner";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { deriveExhibitionStatus, EXHIBITION_STATUS_LEGEND } from "@/lib/exhibitionStatus";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, Landmark, Calendar, Building, Ticket, Globe, X, Search, Copy, FileSpreadsheet, CheckCircle, XCircle, Layers, Download, TrendingUp, Clock } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { EventSeriesManager } from "@/components/admin/EventSeriesManager";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import ExhibitionDetailDrawer from "@/components/admin/ExhibitionDetailDrawer";

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

export default function ExhibitionsAdmin() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [editingExhibition, setEditingExhibition] = useState<any>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showDedupScanner, setShowDedupScanner] = useState(false);
  const [showSeries, setShowSeries] = useState(false);
  const [drawerExhibitionId, setDrawerExhibitionId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [organizerFilter, setOrganizerFilter] = useState<string>("all");
  const [seriesFilter, setSeriesFilter] = useState<string>("all");

  const t = (en: string, ar: string) => isAr ? ar : en;

  const { data: seriesList } = useQuery({
    queryKey: ["event-series-select"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("event_series").select("id, name, name_ar").eq("is_active", true).order("name");
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
  const uniqueYears = [...new Set(exhibitions?.map(e => new Date(e.start_date).getFullYear().toString()) || [])].sort((a, b) => Number(b) - Number(a));
  const uniqueCities = [...new Set(exhibitions?.map(e => e.city).filter(Boolean) || [])].sort();
  const uniqueOrganizers = [...new Set(exhibitions?.map(e => e.organizer_name).filter(Boolean) || [])].sort();

  const filteredExhibitions = exhibitions?.filter((ex) => {
    const matchesSearch = !searchQuery ||
      ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.title_ar && ex.title_ar.includes(searchQuery)) ||
      (ex.organizer_name && ex.organizer_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || ex.status === statusFilter;
    const matchesType = typeFilter === "all" || ex.type === typeFilter;
    const matchesYear = yearFilter === "all" || new Date(ex.start_date).getFullYear().toString() === yearFilter;
    const matchesCity = cityFilter === "all" || ex.city === cityFilter;
    const matchesOrganizer = organizerFilter === "all" || ex.organizer_name === organizerFilter;
    const matchesSeries = seriesFilter === "all" || (seriesFilter === "none" ? !(ex as any).series_id : (ex as any).series_id === seriesFilter);
    return matchesSearch && matchesStatus && matchesType && matchesYear && matchesCity && matchesOrganizer && matchesSeries;
  });

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

  // Bulk actions
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
      const payload = {
        ...rest,
        title: (rest.title || "") + " (Copy)",
        title_ar: rest.title_ar ? rest.title_ar + " (نسخة)" : null,
        slug: newSlug,
        status: "draft" as ExhibitionStatus,
        view_count: 0,
        created_by: user?.id,
      };
      const { error } = await supabase.from("exhibitions").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exhibitions"] });
      toast({ title: t("Exhibition duplicated", "تم تكرار الفعالية") });
    },
    onError: (err: Error) => {
      toast({ title: t("Error", "خطأ"), description: err.message, variant: "destructive" });
    },
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

  const openCreateForm = () => {
    setEditingExhibition(null);
    setShowForm(true);
    setShowBulkImport(false);
    setShowDedupScanner(false);
  };

  const openEditForm = (ex: any) => {
    setEditingExhibition(ex);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingExhibition(null);
  };

  const getTypeName = (type: string) => {
    const opt = typeOptions.find(o => o.value === type);
    return opt ? (isAr ? opt.ar : opt.en) : type;
  };

  // If form is open, show the full-screen edit form
  if (showForm) {
    return (
      <div className="space-y-4">
        <AdminPageHeader
          icon={Landmark}
          title={editingExhibition ? t("Edit Exhibition", "تعديل المعرض") : t("Create Exhibition", "إنشاء معرض")}
          description={editingExhibition ? (isAr && editingExhibition.title_ar ? editingExhibition.title_ar : editingExhibition.title) : t("Fill in the details to create a new exhibition", "أدخل التفاصيل لإنشاء معرض جديد")}
        />
        <ExhibitionEditForm
          exhibition={editingExhibition}
          onClose={closeForm}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Landmark}
        title={t("Exhibitions & Events", "إدارة المعارض والفعاليات")}
        description={t("Create, manage, and monitor all exhibitions, conferences, and events", "إنشاء وإدارة ومراقبة جميع المعارض والمؤتمرات والفعاليات")}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowSeries(!showSeries)}>
              <Layers className="me-2 h-4 w-4" />
              {t("Series", "السلاسل")}
            </Button>
            <Button variant={showDedupScanner ? "secondary" : "outline"} size="sm" onClick={() => { setShowDedupScanner(!showDedupScanner); if (showBulkImport) setShowBulkImport(false); }}>
              <Search className="me-2 h-4 w-4" />
              {t("Dedup Scanner", "فاحص التكرارات")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setShowBulkImport(!showBulkImport); if (showDedupScanner) setShowDedupScanner(false); }}>
              <FileSpreadsheet className="me-2 h-4 w-4" />
              {t("Bulk Import", "استيراد جماعي")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportExhibitions(filteredExhibitions || [])}>
              <Download className="me-2 h-4 w-4" />
              {t("Export CSV", "تصدير CSV")}
            </Button>
            <Button onClick={openCreateForm} size="sm">
              <Plus className="me-2 h-4 w-4" />
              {t("Add Event", "إضافة فعالية")}
            </Button>
          </div>
        }
      />

      {/* Event Series Manager */}
      {showSeries && (
        <EventSeriesManager onCreateEdition={(series, year) => {
          setEditingExhibition({
            title: `${series.name} ${year}`,
            title_ar: series.name_ar ? `${series.name_ar} ${year}` : "",
            venue: series.default_venue || "",
            venue_ar: series.default_venue_ar || "",
            city: series.default_city || "",
            country: series.default_country || "",
            organizer_name: series.default_organizer_name || "",
            organizer_name_ar: series.default_organizer_name_ar || "",
            organizer_email: series.default_organizer_email || "",
            cover_image_url: series.cover_image_url || "",
            tags: series.tags || [],
            series_id: series.id,
            edition_year: year,
            type: "exhibition",
            status: "draft",
          });
          setShowForm(true);
          setShowSeries(false);
        }} />
      )}

      {/* Bulk Import */}
      {showBulkImport && (
        <BulkImportPanel entityType="exhibition" onImportComplete={() => { setShowBulkImport(false); queryClient.invalidateQueries({ queryKey: ["admin-exhibitions"] }); }} />
      )}

      {/* Dedup Scanner */}
      {showDedupScanner && (
        <BatchDuplicateScanner
          defaultTable="exhibitions"
          onMergeComplete={() => queryClient.invalidateQueries({ queryKey: ["admin-exhibitions"] })}
        />
      )}

      {/* Search & Filter */}
      <AdminFilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t("Search by name, organizer...", "بحث بالاسم، المنظم...")}
      >
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] rounded-xl"><SelectValue placeholder={t("Status", "الحالة")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Statuses", "جميع الحالات")}</SelectItem>
            {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{isAr ? opt.ar : opt.en}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px] rounded-xl"><SelectValue placeholder={t("Type", "النوع")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Types", "جميع الأنواع")}</SelectItem>
            {typeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{isAr ? opt.ar : opt.en}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-[120px] rounded-xl"><SelectValue placeholder={t("Year", "السنة")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Years", "جميع السنوات")}</SelectItem>
            {uniqueYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-[140px] rounded-xl"><SelectValue placeholder={t("City", "المدينة")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Cities", "جميع المدن")}</SelectItem>
            {uniqueCities.map(c => <SelectItem key={c!} value={c!}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={organizerFilter} onValueChange={setOrganizerFilter}>
          <SelectTrigger className="w-[160px] rounded-xl"><SelectValue placeholder={t("Organizer", "المنظم")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Organizers", "جميع المنظمين")}</SelectItem>
            {uniqueOrganizers.map(o => <SelectItem key={o!} value={o!}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={seriesFilter} onValueChange={setSeriesFilter}>
          <SelectTrigger className="w-[160px] rounded-xl"><SelectValue placeholder={t("Series", "السلسلة")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Series", "جميع السلاسل")}</SelectItem>
            <SelectItem value="none">{t("No Series", "بدون سلسلة")}</SelectItem>
            {seriesList?.map(s => <SelectItem key={s.id} value={s.id}>{isAr && s.name_ar ? s.name_ar : s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </AdminFilterBar>

      {/* Status Legend */}
      <Card className="rounded-2xl border-border/40">
        <CardContent className="p-3">
          <p className="text-[10px] font-semibold text-muted-foreground mb-2">{t("Status Key", "مفتاح الحالة")}</p>
          <div className="flex flex-wrap gap-2">
            {EXHIBITION_STATUS_LEGEND.map(s => (
              <span key={s.status} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${s.color}`}>
                <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                {isAr ? s.labelAr : s.label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

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
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-10">
                <Checkbox checked={bulk.isAllSelected} onCheckedChange={bulk.toggleAll} />
              </TableHead>
              <SortableTableHead column="title" label={t("Event", "الفعالية")} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
              <TableHead className="font-semibold">{t("Organizer", "المنظم")}</TableHead>
              <SortableTableHead column="type" label={t("Type", "النوع")} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
              <SortableTableHead column="status" label={t("Status", "الحالة")} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
              <TableHead className="font-semibold">{t("Tickets", "التذاكر")}</TableHead>
              <SortableTableHead column="start_date" label={t("Date", "التاريخ")} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
              <TableHead className="font-semibold">{t("Location", "الموقع")}</TableHead>
              <TableHead className="text-end font-semibold">{t("Actions", "الإجراءات")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4 rounded" /></TableCell>
                  <TableCell><div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-xl" /><div><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-20 mt-1" /></div></div></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-7 w-7 rounded" /></TableCell>
                </TableRow>
              ))
            ) : sortedExhibitions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="p-0">
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
                return (
                  <TableRow key={ex.id} className={`group hover:bg-muted/20 transition-colors duration-150 cursor-pointer ${bulk.isSelected(ex.id) ? "bg-primary/5" : ""}`} onClick={() => setDrawerExhibitionId(ex.id)}>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Checkbox checked={bulk.isSelected(ex.id)} onCheckedChange={() => bulk.toggleOne(ex.id)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {ex.cover_image_url && (
                          <img src={ex.cover_image_url} alt="" className="h-10 w-14 rounded-md object-cover shrink-0" />
                        )}
                        <div className="min-w-0">
                          <Link to={`/exhibitions/${ex.slug}`} className="font-semibold text-sm truncate block group-hover:text-primary transition-colors hover:underline">
                            {isAr && ex.title_ar ? ex.title_ar : ex.title}
                            {(ex as any).edition_year ? (
                              <span className="text-primary ms-1 font-bold">+{(ex as any).edition_year}</span>
                            ) : (
                              <span className="text-primary ms-1 font-bold">{new Date(ex.start_date).getFullYear()}</span>
                            )}
                          </Link>
                          {(ex as any).exhibition_number && (
                            <Badge variant="outline" className="text-[9px] h-4 font-mono px-1.5 mt-0.5">{(ex as any).exhibition_number}</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {orgLogoUrl ? (
                          <img src={orgLogoUrl} alt="" className="h-7 w-7 rounded object-contain shrink-0 bg-muted p-0.5" />
                        ) : ex.organizer_name ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 shrink-0">
                            <Building className="h-3.5 w-3.5 text-primary" />
                          </div>
                        ) : null}
                        {ex.organizer_name ? (
                          <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                            {isAr && ex.organizer_name_ar ? ex.organizer_name_ar : ex.organizer_name}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">{getTypeName(ex.type)}</Badge>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const derived = deriveExhibitionStatus({
                          dbStatus: ex.status,
                          startDate: ex.start_date,
                          endDate: ex.end_date,
                          registrationDeadline: ex.registration_deadline,
                        });
                        return (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className={`inline-flex items-center gap-1.5 rounded-full border-0 px-2.5 py-1 text-[10px] font-medium cursor-pointer hover:ring-2 hover:ring-ring/30 transition-all ${derived.color}`}>
                                {derived.status === "started" ? (
                                  <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
                                  </span>
                                ) : (
                                  <span className={`h-2 w-2 rounded-full ${derived.dot}`} />
                                )}
                                {isAr ? derived.labelAr : derived.label}
                                {derived.urgent && derived.daysLeft && (
                                  <span className="font-bold">({derived.daysLeft}d)</span>
                                )}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="min-w-[180px]">
                              <p className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground">{t("Change Status", "تغيير الحالة")}</p>
                              {statusOptions.map(opt => (
                                <DropdownMenuItem
                                  key={opt.value}
                                  disabled={ex.status === opt.value}
                                  onClick={async () => {
                                    const { error } = await supabase.from("exhibitions").update({ status: opt.value }).eq("id", ex.id);
                                    if (error) {
                                      toast({ title: "Error", description: error.message, variant: "destructive" });
                                      return;
                                    }
                                    queryClient.invalidateQueries({ queryKey: ["admin-exhibitions"] });
                                    toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" });
                                  }}
                                  className="text-xs"
                                >
                                  <span className={`h-2 w-2 rounded-full me-2 ${statusColorMap[opt.value]?.split(" ")[0] || "bg-muted"}`} />
                                  {isAr ? opt.ar : opt.en}
                                  {ex.status === opt.value && <span className="ms-auto text-[9px] text-muted-foreground">{t("Current", "الحالية")}</span>}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        <Ticket className="h-3 w-3 me-1" />
                        {(ex as any).ticket_count ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(ex.start_date), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {ex.is_virtual ? (
                        <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{t("Virtual", "افتراضي")}</span>
                      ) : (
                        <span>{ex.city || ""}{ex.country ? `, ${ex.country}` : ""}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                        {ex.status === "pending" && (
                          <>
                            <Button size="icon" variant="ghost" onClick={() => approveExhibition.mutate(ex.id)} className="h-8 w-8 text-chart-2 hover:text-chart-2" title={t("Approve", "موافقة")}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => rejectExhibition.mutate(ex.id)} className="h-8 w-8 text-destructive hover:text-destructive" title={t("Reject", "رفض")}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button size="icon" variant="ghost" asChild className="h-8 w-8">
                          <Link to={`/exhibitions/${ex.slug}`} title={t("View", "عرض")}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEditForm(ex)} className="h-8 w-8" title={t("Edit", "تعديل")}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => duplicateMutation.mutate(ex)} className="h-8 w-8" title={t("Duplicate", "تكرار")}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(ex.id)} className="h-8 w-8 text-destructive hover:text-destructive" title={t("Delete", "حذف")}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
      <ExhibitionDetailDrawer
        exhibitionId={drawerExhibitionId}
        open={!!drawerExhibitionId}
        onClose={() => setDrawerExhibitionId(null)}
      />
    </div>
  );
}
