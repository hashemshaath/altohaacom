import { useIsAr } from "@/hooks/useIsAr";
import { useState, useMemo } from "react";
import { EntityFormGuard } from "@/components/admin/EntityFormGuard";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import EntityFormTabs, { EntityFormData, emptyForm, typeOptions, scopeOptions } from "@/components/admin/entities/EntityFormTabs";
import EstablishmentDetailDrawer from "@/components/admin/establishments/EstablishmentDetailDrawer";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { BulkImportPanel } from "@/components/admin/BulkImportPanel";
import { BatchDuplicateScanner } from "@/components/admin/BatchDuplicateScanner";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import { SortableTableHead } from "@/components/admin/SortableTableHead";
import { AdminTablePagination } from "@/components/admin/AdminTablePagination";
import { AdminTableCard } from "@/components/admin/AdminTableCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Building2, Plus, XCircle, CheckCircle, Eye, EyeOff, FileSpreadsheet,
  ScanSearch, Download, Search, Pencil, Settings2, Trash2, ShieldCheck, Users, Clock,
  ArrowUpRight, TrendingUp, BarChart3
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cn } from "@/lib/utils";
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip } from "recharts";

// --- Status config ---
const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; en: string; ar: string }> = {
  active: { variant: "default", en: "Active", ar: "نشط" },
  pending: { variant: "outline", en: "Pending", ar: "قيد المراجعة" },
  suspended: { variant: "destructive", en: "Suspended", ar: "موقوف" },
  archived: { variant: "secondary", en: "Archived", ar: "مؤرشف" },
};

export default function EstablishmentsAdmin() {
  const { user } = useAuth();
  const isAr = useIsAr();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EntityFormData>(emptyForm);
  const [selectedManager, setSelectedManager] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: entities, isLoading } = useQuery({
    queryKey: ["admin-culinary-entities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("culinary_entities")
        .select("id, name, name_ar, abbreviation, abbreviation_ar, type, scope, status, is_visible, is_verified, username, country, city, logo_url, website, email, phone, description, description_ar, entity_number, slug, created_at, entity_followers:entity_followers(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Stats
  const stats = useMemo(() => {
    if (!entities) return { total: 0, active: 0, pending: 0, visible: 0, hidden: 0, verified: 0, byType: {} as Record<string, number> };
    const byType: Record<string, number> = {};
    entities.forEach(e => { byType[e.type] = (byType[e.type] || 0) + 1; });
    return {
      total: entities.length,
      active: entities.filter(e => e.status === "active").length,
      pending: entities.filter(e => e.status === "pending").length,
      visible: entities.filter(e => e.is_visible).length,
      hidden: entities.filter(e => !e.is_visible).length,
      verified: entities.filter(e => e.is_verified).length,
      byType,
    };
  }, [entities]);

  // Filter
  const filtered = useMemo(() => {
    if (!entities) return [];
    return entities.filter(e => {
      if (statusFilter === "active" && e.status !== "active") return false;
      if (statusFilter === "pending" && e.status !== "pending") return false;
      if (statusFilter === "visible" && !e.is_visible) return false;
      if (statusFilter === "hidden" && e.is_visible) return false;
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (e.name?.toLowerCase().includes(s) || e.name_ar?.toLowerCase().includes(s) || e.city?.toLowerCase().includes(s) || e.entity_number?.toLowerCase().includes(s));
      }
      return true;
    });
  }, [entities, search, typeFilter, statusFilter]);

  const { sorted, sortColumn, sortDirection, toggleSort } = useTableSort(filtered, "created_at", "desc");
  const pagination = usePagination(sorted, { defaultPageSize: 15 });

  const { selected, toggleOne, toggleAll, clearSelection, isAllSelected, count, selectedItems } =
    useAdminBulkActions(sorted || []);

  const { exportCSV } = useCSVExport({
    columns: [
      { header: isAr ? "الرقم" : "Number", accessor: r => r.entity_number },
      { header: isAr ? "الاسم" : "Name", accessor: r => isAr && r.name_ar ? r.name_ar : r.name },
      { header: isAr ? "النوع" : "Type", accessor: r => r.type },
      { header: isAr ? "الحالة" : "Status", accessor: r => r.status },
      { header: isAr ? "المدينة" : "City", accessor: r => r.city || "" },
    ],
    filename: "entities",
  });

  // --- Handlers ---
  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase.from("culinary_entities").update({ status: status as any }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-culinary-entities"] });
    toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" });
  };

  const handleToggleVisibility = async (id: string, visible: boolean) => {
    const { error } = await supabase.from("culinary_entities").update({ is_visible: visible }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-culinary-entities"] });
  };

  const handleVerifiedChange = async (id: string, verified: boolean) => {
    const { error } = await supabase.from("culinary_entities").update({ is_verified: verified }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-culinary-entities"] });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("culinary_entities").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-culinary-entities"] });
    toast({ title: isAr ? "تم الحذف" : "Deleted" });
    setDeleteConfirm(null);
  };

  const handleEdit = (entity: any) => {
    setEditingId(entity.id);
    setForm({
      ...emptyForm,
      name: entity.name || "", name_ar: entity.name_ar || "",
      abbreviation: entity.abbreviation || "", abbreviation_ar: entity.abbreviation_ar || "",
      description: entity.description || "", description_ar: entity.description_ar || "",
      type: entity.type, scope: entity.scope || "local", status: entity.status || "pending",
      is_visible: entity.is_visible ?? false, is_verified: entity.is_verified ?? false,
      country: entity.country || "", city: entity.city || "",
      address: entity.address || "", address_ar: entity.address_ar || "",
      postal_code: entity.postal_code || "",
      email: entity.email || "", phone: entity.phone || "",
      fax: entity.fax || "", website: entity.website || "",
      logo_url: entity.logo_url || "", cover_image_url: entity.cover_image_url || "",
      president_name: entity.president_name || "", president_name_ar: entity.president_name_ar || "",
      secretary_name: entity.secretary_name || "", secretary_name_ar: entity.secretary_name_ar || "",
      founded_year: entity.founded_year || undefined, member_count: entity.member_count || undefined,
      mission: entity.mission || "", mission_ar: entity.mission_ar || "",
      username: entity.username || "",
      registration_number: entity.registration_number || "", license_number: entity.license_number || "",
      internal_notes: entity.internal_notes || "",
      services_input: (entity.services || []).join(", "),
      specializations_input: (entity.specializations || []).join(", "),
      tags_input: (entity.tags || []).join(", "),
      latitude: entity.latitude?.toString() || "", longitude: entity.longitude?.toString() || "",
    });
    setSelectedManager(entity.account_manager_id || "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: isAr ? "الاسم مطلوب" : "Name is required", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const payload: any = {
        name: form.name, name_ar: form.name_ar || null,
        abbreviation: form.abbreviation || null, abbreviation_ar: form.abbreviation_ar || null,
        description: form.description || null, description_ar: form.description_ar || null,
        type: form.type, scope: form.scope, status: form.status,
        is_visible: form.is_visible, is_verified: form.is_verified,
        country: form.country || null, city: form.city || null,
        address: form.address || null, address_ar: form.address_ar || null,
        postal_code: form.postal_code || null,
        email: form.email || null, phone: form.phone || null,
        fax: form.fax || null, website: form.website || null,
        logo_url: form.logo_url || null, cover_image_url: form.cover_image_url || null,
        president_name: form.president_name || null, president_name_ar: form.president_name_ar || null,
        secretary_name: form.secretary_name || null, secretary_name_ar: form.secretary_name_ar || null,
        founded_year: form.founded_year || null, member_count: form.member_count || null,
        mission: form.mission || null, mission_ar: form.mission_ar || null,
        username: form.username || null,
        registration_number: form.registration_number || null, license_number: form.license_number || null,
        internal_notes: form.internal_notes || null,
        account_manager_id: selectedManager || null,
        services: form.services_input ? form.services_input.split(",").map(s => s.trim()).filter(Boolean) : null,
        specializations: form.specializations_input ? form.specializations_input.split(",").map(s => s.trim()).filter(Boolean) : null,
        tags: form.tags_input ? form.tags_input.split(",").map(s => s.trim()).filter(Boolean) : null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      };

      if (editingId) {
        const { error } = await supabase.from("culinary_entities").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const slug = form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36);
        const { error } = await supabase.from("culinary_entities").insert({ ...payload, slug, created_by: user?.id || null });
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["admin-culinary-entities"] });
      toast({ title: editingId ? (isAr ? "تم التحديث" : "Updated") : (isAr ? "تمت الإضافة" : "Added") });
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const bulkActivate = async () => {
    const ids = Array.from(selected);
    const { error } = await supabase.from("culinary_entities").update({ status: "active" as any }).in("id", ids);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-culinary-entities"] });
    clearSelection();
    toast({ title: isAr ? `تم تفعيل ${ids.length} جهة` : `${ids.length} activated` });
  };

  const bulkDeactivate = async () => {
    const ids = Array.from(selected);
    const { error } = await supabase.from("culinary_entities").update({ status: "suspended" as any }).in("id", ids);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-culinary-entities"] });
    clearSelection();
    toast({ title: isAr ? `تم تعطيل ${ids.length} جهة` : `${ids.length} suspended` });
  };

  // Chart data
  const typeChartData = useMemo(() => {
    return Object.entries(stats.byType).map(([key, value]) => ({
      name: typeOptions.find(t => t.value === key)?.[isAr ? "ar" : "en"] || key,
      value,
    }));
  }, [stats.byType, isAr]);

  const statusChartData = useMemo(() => [
    { name: isAr ? "نشط" : "Active", value: stats.active, fill: "hsl(var(--chart-3))" },
    { name: isAr ? "قيد المراجعة" : "Pending", value: stats.pending, fill: "hsl(var(--chart-4))" },
    { name: isAr ? "مخفي" : "Hidden", value: stats.hidden, fill: "hsl(var(--muted-foreground))" },
  ], [stats, isAr]);

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{isAr ? "إدارة الجهات" : "Entities"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAr ? "إدارة الجمعيات والأكاديميات والجهات" : "Manage associations, academies & organizations"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => exportCSV(sorted || [])}>
            <Download className="h-3.5 w-3.5" />
            {isAr ? "تصدير" : "Export"}
          </Button>
          <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(!showForm); }}>
            <Plus className="h-3.5 w-3.5" />
            {isAr ? "إضافة جهة" : "Add Entity"}
          </Button>
        </div>
      </div>

      {/* Metric Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: isAr ? "الإجمالي" : "Total", value: stats.total, icon: Building2, onClick: () => setStatusFilter("all") },
          { label: isAr ? "نشطة" : "Active", value: stats.active, icon: CheckCircle, onClick: () => setStatusFilter("active") },
          { label: isAr ? "قيد المراجعة" : "Pending", value: stats.pending, icon: Clock, onClick: () => setStatusFilter("pending") },
          { label: isAr ? "موثقة" : "Verified", value: stats.verified, icon: ShieldCheck, onClick: () => {} },
          { label: isAr ? "مرئية" : "Visible", value: stats.visible, icon: Eye, onClick: () => setStatusFilter("visible") },
          { label: isAr ? "مخفية" : "Hidden", value: stats.hidden, icon: EyeOff, onClick: () => setStatusFilter("hidden") },
        ].map(m => (
          <button
            key={m.label}
            onClick={m.onClick}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3 text-start transition-all hover:border-border hover:shadow-sm",
              statusFilter !== "all" && m.label === (statusFilter === "active" ? (isAr ? "نشطة" : "Active") : statusFilter === "pending" ? (isAr ? "قيد المراجعة" : "Pending") : statusFilter === "visible" ? (isAr ? "مرئية" : "Visible") : statusFilter === "hidden" ? (isAr ? "مخفية" : "Hidden") : "") && "border-primary/50 bg-primary/5"
            )}
          >
            <m.icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-lg font-semibold leading-none"><AnimatedCounter value={m.value} /></p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{m.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-9 bg-muted/50 p-0.5">
          <TabsTrigger value="list" className="text-xs h-8 gap-1.5 px-3">
            <Building2 className="h-3.5 w-3.5" />
            {isAr ? "القائمة" : "List"}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs h-8 gap-1.5 px-3">
            <BarChart3 className="h-3.5 w-3.5" />
            {isAr ? "التحليلات" : "Analytics"}
          </TabsTrigger>
          <TabsTrigger value="import" className="text-xs h-8 gap-1.5 px-3">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            {isAr ? "استيراد" : "Import"}
          </TabsTrigger>
          <TabsTrigger value="scanner" className="text-xs h-8 gap-1.5 px-3">
            <ScanSearch className="h-3.5 w-3.5" />
            {isAr ? "فاحص التكرارات" : "Dedup"}
          </TabsTrigger>
        </TabsList>

        {/* === LIST TAB === */}
        <TabsContent value="list" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={isAr ? "بحث بالاسم أو الرقم..." : "Search by name or number..."}
                className="ps-8 h-8 text-xs bg-card"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue placeholder={isAr ? "النوع" : "Type"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "جميع الأنواع" : "All Types"}</SelectItem>
                {typeOptions.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}
              </SelectContent>
            </Select>
            {(search || typeFilter !== "all" || statusFilter !== "all") && (
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); }}>
                <XCircle className="h-3.5 w-3.5" />
                {isAr ? "مسح" : "Clear"}
              </Button>
            )}
          </div>

          {/* Bulk Actions */}
          <BulkActionBar count={count} onClear={clearSelection} onExport={() => exportCSV(selectedItems)} onStatusChange={bulkActivate}>
            <Button variant="destructive" size="sm" className="gap-1.5" onClick={bulkDeactivate}>
              <XCircle className="h-3.5 w-3.5" />
              {isAr ? "إيقاف" : "Suspend"}
            </Button>
          </BulkActionBar>

          {/* Form */}
          {showForm && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-4">
              <EntityFormGuard
                entity={{ name: form.name, name_ar: form.name_ar, email: form.email, phone: form.phone, website: form.website, city: form.city, country: form.country }}
                tables={["culinary_entities", "organizers", "companies", "establishments"]}
                excludeId={editingId || undefined}
                translationFields={[
                  { en: form.name, ar: form.name_ar, key: "name" },
                  { en: form.description, ar: form.description_ar, key: "description" },
                ]}
                translationContext="culinary entity / association / academy"
                onTranslated={u => setForm(prev => ({ ...prev, ...u }))}
              />
              <EntityFormTabs
                form={form}
                editingId={editingId}
                selectedManager={selectedManager}
                isSaving={isSaving}
                onUpdate={(key, value) => setForm(prev => ({ ...prev, [key]: value }))}
                onManagerChange={setSelectedManager}
                onSave={handleSave}
                onCancel={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
              />
            </div>
          )}

          {/* Table */}
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
          ) : !filtered.length ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-lg border border-dashed border-border">
              <Building2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">{isAr ? "لا توجد جهات مطابقة" : "No entities found"}</p>
            </div>
          ) : (
            <AdminTableCard>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10"><Checkbox checked={isAllSelected} onCheckedChange={toggleAll} /></TableHead>
                    <SortableTableHead column="entity_number" label="#" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} className="hidden xl:table-cell w-20" />
                    <SortableTableHead column="name" label={isAr ? "الجهة" : "Entity"} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    <SortableTableHead column="type" label={isAr ? "النوع" : "Type"} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} className="hidden md:table-cell" />
                    <SortableTableHead column="status" label={isAr ? "الحالة" : "Status"} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    <TableHead className="hidden lg:table-cell">{isAr ? "مرئي" : "Vis."}</TableHead>
                    <TableHead className="hidden lg:table-cell">{isAr ? "متابعون" : "Followers"}</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagination.paginated.map(entity => {
                    const displayName = isAr && entity.name_ar ? entity.name_ar : entity.name;
                    const sc = statusConfig[entity.status] || statusConfig.pending;
                    const followers = (entity as any).entity_followers?.length || 0;

                    return (
                      <TableRow key={entity.id} className="group">
                        <TableCell className="w-10">
                          <Checkbox checked={selected.has(entity.id)} onCheckedChange={() => toggleOne(entity.id)} />
                        </TableCell>
                        <TableCell className="hidden xl:table-cell font-mono text-[11px] text-muted-foreground">{entity.entity_number}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            {entity.logo_url ? (
                              <img loading="lazy" decoding="async" src={entity.logo_url} alt={entity.name || "Entity"} className="h-8 w-8 rounded-lg object-cover border shrink-0" />
                            ) : (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium truncate max-w-[180px]">{displayName}</p>
                                {entity.is_verified && <ShieldCheck className="h-3 w-3 text-primary shrink-0" />}
                              </div>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {entity.username && `@${entity.username}`}
                                {entity.username && entity.city && " · "}
                                {entity.city}{entity.country ? `, ${entity.country}` : ""}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="secondary" className="text-[11px] font-normal">
                            {typeOptions.find(t => t.value === entity.type)?.[isAr ? "ar" : "en"] || entity.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select value={entity.status} onValueChange={v => handleStatusChange(entity.id, v)}>
                            <SelectTrigger className="h-6 w-[100px] text-[11px] border-none bg-transparent p-0 shadow-none">
                              <Badge variant={sc.variant} className="text-[11px] font-normal cursor-pointer">
                                {isAr ? sc.ar : sc.en}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusConfig).map(([k, v]) => (
                                <SelectItem key={k} value={k} className="text-xs">{isAr ? v.ar : v.en}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <button
                            onClick={() => handleToggleVisibility(entity.id, !entity.is_visible)}
                            className="p-1 rounded hover:bg-muted transition-colors"
                          >
                            {entity.is_visible ? <Eye className="h-3.5 w-3.5 text-chart-3" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                          </button>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground tabular-nums">{followers}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDetailId(entity.id)}>
                                  <Settings2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">{isAr ? "إدارة" : "Manage"}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(entity)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">{isAr ? "تعديل" : "Edit"}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(entity.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">{isAr ? "حذف" : "Delete"}</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <AdminTablePagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                startItem={pagination.startItem}
                endItem={pagination.endItem}
                pageSize={pagination.pageSize}
                pageSizeOptions={pagination.pageSizeOptions}
                hasNext={pagination.hasNext}
                hasPrev={pagination.hasPrev}
                onPageChange={pagination.goTo}
                onPageSizeChange={pagination.changePageSize}
              />
            </AdminTableCard>
          )}
        </TabsContent>

        {/* === ANALYTICS TAB === */}
        <TabsContent value="analytics" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Type Distribution */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-medium mb-4">{isAr ? "التوزيع حسب النوع" : "Distribution by Type"}</h3>
              {typeChartData.length > 0 ? (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={typeChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                        {typeChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <RTooltip formatter={(v: number, name: string) => [v, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">{isAr ? "لا توجد بيانات" : "No data"}</p>
              )}
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {typeChartData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-medium mb-4">{isAr ? "الحالة" : "Status Breakdown"}</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={80} />
                    <RTooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                      {statusChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="rounded-lg border border-border bg-card p-4 md:col-span-2">
              <h3 className="text-sm font-medium mb-3">{isAr ? "نظرة سريعة" : "Quick Overview"}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: isAr ? "نسبة التفعيل" : "Activation Rate", value: stats.total ? `${Math.round((stats.active / stats.total) * 100)}%` : "0%", sub: `${stats.active}/${stats.total}` },
                  { label: isAr ? "نسبة التوثيق" : "Verification Rate", value: stats.total ? `${Math.round((stats.verified / stats.total) * 100)}%` : "0%", sub: `${stats.verified}/${stats.total}` },
                  { label: isAr ? "نسبة الظهور" : "Visibility Rate", value: stats.total ? `${Math.round((stats.visible / stats.total) * 100)}%` : "0%", sub: `${stats.visible}/${stats.total}` },
                  { label: isAr ? "أنواع مختلفة" : "Unique Types", value: String(Object.keys(stats.byType).length), sub: isAr ? "تصنيف" : "categories" },
                ].map(s => (
                  <div key={s.label} className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs font-medium mt-0.5">{s.label}</p>
                    <p className="text-[11px] text-muted-foreground">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* === IMPORT TAB === */}
        <TabsContent value="import" className="mt-4">
          <BulkImportPanel
            entityType="entity"
            onImportComplete={() => queryClient.invalidateQueries({ queryKey: ["admin-culinary-entities"] })}
          />
        </TabsContent>

        {/* === SCANNER TAB === */}
        <TabsContent value="scanner" className="mt-4">
          <BatchDuplicateScanner
            defaultTable="culinary_entities"
            onMergeComplete={() => queryClient.invalidateQueries({ queryKey: ["admin-culinary-entities"] })}
          />
        </TabsContent>
      </Tabs>

      {/* Detail Drawer */}
      <EstablishmentDetailDrawer entityId={detailId} open={!!detailId} onClose={() => setDetailId(null)} />

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={v => !v && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? "تأكيد الحذف" : "Confirm Deletion"}</AlertDialogTitle>
            <AlertDialogDescription>{isAr ? "هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure? This action cannot be undone."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              {isAr ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
