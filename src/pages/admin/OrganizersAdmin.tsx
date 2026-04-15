import { useIsAr } from "@/hooks/useIsAr";
import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { usePagination } from "@/hooks/usePagination";
import { AdminTablePagination } from "@/components/admin/AdminTablePagination";
import { OrganizerExhibitionsPanel } from "@/components/admin/OrganizerExhibitionsPanel";
import OrganizerDetailDrawer from "@/components/admin/OrganizerDetailDrawer";
import OrganizerEditForm from "@/components/admin/OrganizerEditForm";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminTableCard } from "@/components/admin/AdminTableCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Building2, Plus, MoreHorizontal, Eye, Pencil, Trash2,
  Globe, Mail, Phone, CheckCircle2, Star, Download, RefreshCw,
  Shield, ScanSearch, FileSpreadsheet, Link2, ArrowUpDown, ArrowUp, ArrowDown,
  LayoutGrid, LayoutList, MapPin, Clock, BarChart3, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, AreaChart, Area,
} from "recharts";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

const BulkImportPanel = lazy(() => import("@/components/admin/BulkImportPanel").then(m => ({ default: m.BulkImportPanel })));
const BatchDuplicateScanner = lazy(() => import("@/components/admin/BatchDuplicateScanner").then(m => ({ default: m.BatchDuplicateScanner })));

type ViewMode = "table" | "cards";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function WidgetFallback() {
  const isAr = useIsAr();
  return <div className="h-48 rounded-2xl bg-muted/30 animate-pulse" />;
}

export default function OrganizersAdmin() {
  const isAr = useIsAr();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("list");
  const [exhibitionsPanel, setExhibitionsPanel] = useState<{ id: string; name: string; logo?: string | null } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [verifiedFilter, setVerifiedFilter] = useState<"all" | "verified" | "unverified">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: organizers, isLoading } = useQuery({
    queryKey: ["admin-organizers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizers")
        .select("id, name, name_ar, slug, email, phone, website, city, city_ar, country, country_ar, country_code, status, is_verified, is_featured, logo_url, cover_image_url, organizer_number, total_exhibitions, total_views, average_rating, follower_count, description, description_ar, address, address_ar, services, targeted_sectors, founded_year, social_links, created_at")
        .order("created_at", { ascending: false });
      if (error) throw handleSupabaseError(error);
      return data || [];
    },
  });

  const countries = useMemo(() =>
    [...new Set((organizers || []).map((o) => o.country).filter(Boolean))] as string[],
    [organizers]
  );

  const filtered = useMemo(() => {
    const list = (organizers || []).filter((o) => {
      const matchSearch = !search || o.name?.toLowerCase().includes(search.toLowerCase()) || o.name_ar?.includes(search) || o.email?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      const matchCountry = countryFilter === "all" || o.country === countryFilter;
      const matchVerified = verifiedFilter === "all" || (verifiedFilter === "verified" ? o.is_verified : !o.is_verified);
      return matchSearch && matchStatus && matchCountry && matchVerified;
    });
    return list.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [organizers, search, statusFilter, countryFilter, verifiedFilter, sortKey, sortDir]);

  const { selected, toggleOne, toggleAll, clearSelection, isAllSelected, count: selectedCount } = useAdminBulkActions(filtered);
  const pagination = usePagination(filtered, { defaultPageSize: 15 });

  const { exportCSV } = useCSVExport({
    columns: [
      { header: "Number", accessor: (o) => o.organizer_number },
      { header: "Name", accessor: (o) => o.name },
      { header: "Name (AR)", accessor: (o) => o.name_ar },
      { header: "Email", accessor: (o) => o.email },
      { header: "Phone", accessor: (o) => o.phone },
      { header: "Website", accessor: (o) => o.website },
      { header: "City", accessor: (o) => o.city },
      { header: "Country", accessor: (o) => o.country },
      { header: "Status", accessor: (o) => o.status },
      { header: "Verified", accessor: (o) => o.is_verified ? "Yes" : "No" },
      { header: "Featured", accessor: (o) => o.is_featured ? "Yes" : "No" },
      { header: "Events", accessor: (o) => o.total_exhibitions || 0 },
      { header: "Views", accessor: (o) => o.total_views || 0 },
      { header: "Rating", accessor: (o) => o.average_rating || 0 },
      { header: "Services", accessor: (o) => (o.services || []).join("; ") },
      { header: "Founded", accessor: (o) => o.founded_year },
    ],
    filename: "organizers",
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("organizers").delete().eq("id", id);
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-organizers"] }); toast.success(isAr ? "تم الحذف" : "Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("organizers").delete().in("id", ids);
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-organizers"] }); clearSelection(); toast.success(isAr ? "تم الحذف" : "Deleted"); },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase.from("organizers").update({ status }).in("id", ids);
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-organizers"] }); clearSelection(); toast.success(isAr ? "تم التحديث" : "Updated"); },
  });

  const bulkVerifyMutation = useMutation({
    mutationFn: async ({ ids, verified }: { ids: string[]; verified: boolean }) => {
      const { error } = await supabase.from("organizers").update({ is_verified: verified }).in("id", ids);
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-organizers"] }); clearSelection(); toast.success(isAr ? "تم التحديث" : "Updated"); },
  });

  const quickToggleVerify = useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const { error } = await supabase.from("organizers").update({ is_verified: verified }).eq("id", id);
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-organizers"] }); toast.success(isAr ? "تم التحديث" : "Updated"); },
  });

  const quickToggleFeatured = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const { error } = await supabase.from("organizers").update({ is_featured: featured }).eq("id", id);
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-organizers"] }); toast.success(isAr ? "تم التحديث" : "Updated"); },
  });

  const refreshStatsMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("refresh_organizer_stats", { p_organizer_id: id });
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-organizers"] }); toast.success(isAr ? "تم تحديث الإحصائيات" : "Stats refreshed"); },
  });

  const openEdit = (orgId: string | null) => { setEditId(orgId); setEditMode(true); };

  const stats = useMemo(() => {
    const all = organizers || [];
    const totalEvents = all.reduce((s, o) => s + (o.total_exhibitions || 0), 0);
    const totalViews = all.reduce((s, o) => s + (o.total_views || 0), 0);
    const totalFollowers = all.reduce((s, o) => s + (o.follower_count || 0), 0);
    const rated = all.filter(o => o.average_rating > 0);
    const avgRating = rated.length > 0 ? +(rated.reduce((s, o) => s + o.average_rating, 0) / rated.length).toFixed(1) : 0;
    return {
      total: all.length,
      active: all.filter(o => o.status === "active").length,
      inactive: all.filter(o => o.status === "inactive").length,
      pending: all.filter(o => o.status === "pending").length,
      verified: all.filter(o => o.is_verified).length,
      featured: all.filter(o => o.is_featured).length,
      totalEvents,
      totalViews,
      totalFollowers,
      avgRating,
      countriesCount: countries.length,
    };
  }, [organizers, countries]);

  const selectedArray = Array.from(selected);

  const toggleSort = useCallback((key: string) => {
    setSortKey(prev => {
      if (prev === key) { setSortDir(d => d === "asc" ? "desc" : "asc"); return key; }
      setSortDir("asc");
      return key;
    });
  }, []);

  const SortIcon = ({ col }: { col: string }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />;
  };

  const getProfileCompleteness = (org: NonNullable<typeof organizers>[number]): number => {
    let score = 0;
    const checks = [org.name, org.name_ar, org.email, org.phone, org.website, org.logo_url, org.cover_image_url, org.description, org.city, org.country, org.services?.length > 0, org.founded_year, org.social_links && Object.keys(org.social_links).length > 0];
    checks.forEach(c => { if (c) score++; });
    return Math.round((score / checks.length) * 100);
  };

  // Analytics data
  const analyticsData = useMemo(() => {
    const all = organizers || [];
    const statusData = [
      { name: isAr ? "نشط" : "Active", value: stats.active },
      { name: isAr ? "غير نشط" : "Inactive", value: stats.inactive },
      { name: isAr ? "قيد المراجعة" : "Pending", value: stats.pending },
    ].filter(d => d.value > 0);

    const countryData = Object.entries(
      all.reduce((acc: Record<string, number>, o) => {
        const c = o.country || (isAr ? "غير محدد" : "Unknown");
        acc[c] = (acc[c] || 0) + 1;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

    const topOrganizers = [...all]
      .sort((a, b) => (b.total_exhibitions || 0) - (a.total_exhibitions || 0))
      .slice(0, 10)
      .map(o => ({
        name: isAr ? (o.name_ar || o.name)?.slice(0, 15) : o.name?.slice(0, 15),
        events: o.total_exhibitions || 0,
        views: Math.round((o.total_views || 0) / 1000),
      }));

    const verificationData = [
      { name: isAr ? "موثق" : "Verified", value: stats.verified },
      { name: isAr ? "غير موثق" : "Unverified", value: stats.total - stats.verified },
    ];

    return { statusData, countryData, topOrganizers, verificationData };
  }, [organizers, stats, isAr]);

  // ── Inline Edit Mode ──
  if (editMode) {
    return (
      <OrganizerEditForm
        organizerId={editId}
        onClose={() => { setEditMode(false); setEditId(null); }}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <AdminPageHeader
        icon={Building2}
        title={isAr ? "إدارة المنظمين" : "Organizer Management"}
        description={isAr ? "إدارة منظمي الفعاليات والمعارض" : "Manage event organizers & track performance"}
        actions={
          <Button size="sm" onClick={() => openEdit(null)} className="gap-1.5 rounded-xl">
            <Plus className="h-4 w-4" />{isAr ? "إضافة" : "Add"}
          </Button>
        }
      />

      {/* KPI Strip */}
      <div className="flex items-center gap-5 overflow-x-auto pb-1">
        {[
          { label: isAr ? "الإجمالي" : "Total", value: stats.total, color: "text-foreground" },
          { label: isAr ? "نشط" : "Active", value: stats.active, color: "text-chart-2" },
          { label: isAr ? "موثق" : "Verified", value: stats.verified, color: "text-primary" },
          { label: isAr ? "مميز" : "Featured", value: stats.featured, color: "text-chart-4" },
          { label: isAr ? "المعارض" : "Events", value: stats.totalEvents, color: "text-chart-3" },
          { label: isAr ? "المشاهدات" : "Views", value: stats.totalViews, color: "text-chart-5" },
          { label: isAr ? "الدول" : "Countries", value: stats.countriesCount, color: "text-muted-foreground" },
        ].map(kpi => (
          <div key={kpi.label} className="flex items-baseline gap-2 shrink-0">
            <AnimatedCounter value={kpi.value} className={cn("text-2xl font-bold tracking-tight", kpi.color)} />
            <span className="text-xs text-muted-foreground whitespace-nowrap">{kpi.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 rounded-xl">
          <TabsTrigger value="list" className="gap-1.5 rounded-xl text-xs">
            <Building2 className="h-3.5 w-3.5" />{isAr ? "المنظمين" : "Organizers"}
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-1.5 rounded-xl text-xs">
            <FileSpreadsheet className="h-3.5 w-3.5" />{isAr ? "استيراد" : "Import"}
          </TabsTrigger>
          <TabsTrigger value="dedup" className="gap-1.5 rounded-xl text-xs">
            <ScanSearch className="h-3.5 w-3.5" />{isAr ? "التكرارات" : "Dedup"}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5 rounded-xl text-xs">
            <BarChart3 className="h-3.5 w-3.5" />{isAr ? "التحليلات" : "Analytics"}
          </TabsTrigger>
        </TabsList>

        {/* ═══ List Tab ═══ */}
        <TabsContent value="list" className="space-y-4">
          {/* Bulk Action Bar */}
          <BulkActionBar
            count={selectedCount}
            onClear={clearSelection}
            onDelete={() => { if (confirm(isAr ? "حذف المحدد؟" : "Delete selected?")) bulkDeleteMutation.mutate(selectedArray); }}
            onStatusChange={() => bulkStatusMutation.mutate({ ids: selectedArray, status: "active" })}
            onExport={() => exportCSV(filtered.filter((o) => selected.has(o.id)))}
          >
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => bulkVerifyMutation.mutate({ ids: selectedArray, verified: true })}>
              <Shield className="h-3.5 w-3.5" />{isAr ? "توثيق" : "Verify"}
            </Button>
          </BulkActionBar>

          {/* Toolbar */}
          <AdminFilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder={isAr ? "بحث بالاسم أو البريد..." : "Search by name or email..."}
          >
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-28 h-9 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All Status"}</SelectItem>
                <SelectItem value="active">{isAr ? "نشط" : "Active"}</SelectItem>
                <SelectItem value="inactive">{isAr ? "غير نشط" : "Inactive"}</SelectItem>
                <SelectItem value="pending">{isAr ? "قيد المراجعة" : "Pending"}</SelectItem>
              </SelectContent>
            </Select>
            {countries.length > 0 && (
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-28 h-9 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "كل الدول" : "All Countries"}</SelectItem>
                  {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Select value={verifiedFilter} onValueChange={(v) => setVerifiedFilter(v as "all" | "verified" | "unverified")}>
              <SelectTrigger className="w-28 h-9 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                <SelectItem value="verified">{isAr ? "موثق" : "Verified"}</SelectItem>
                <SelectItem value="unverified">{isAr ? "غير موثق" : "Unverified"}</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center border rounded-xl overflow-hidden">
              <Button variant={viewMode === "table" ? "default" : "ghost"} size="icon" className="h-9 w-9 rounded-none" onClick={() => setViewMode("table")}>
                <LayoutList className="h-3.5 w-3.5" />
              </Button>
              <Button variant={viewMode === "cards" ? "default" : "ghost"} size="icon" className="h-9 w-9 rounded-none" onClick={() => setViewMode("cards")}>
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Button size="sm" variant="outline" onClick={() => exportCSV(organizers || [])}>
              <Download className="h-3.5 w-3.5 me-1.5" />{isAr ? "تصدير" : "Export"}
            </Button>
          </AdminFilterBar>

          {/* Content */}
          {isLoading ? (
            <AdminTableSkeleton rows={6} columns={5} />
          ) : filtered.length === 0 ? (
            <AdminEmptyState
              icon={Building2}
              title="No organizers found"
              titleAr="لا توجد نتائج"
              description="Create your first organizer to get started"
              descriptionAr="أنشئ أول منظم للبدء"
              actionLabel="Add Organizer"
              actionLabelAr="إضافة منظم"
              onAction={() => openEdit(null)}
            />
          ) : viewMode === "cards" ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pagination.paginated.map((org: any) => {
                  const pct = getProfileCompleteness(org);
                  return (
                    <Card key={org.id} className="rounded-2xl border-border/40 overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                      <div className="relative h-24 bg-gradient-to-br from-primary/20 to-primary/5">
                        {org.cover_image_url && <img src={org.cover_image_url} alt={org.name || "Organizer"} className="w-full h-full object-cover" loading="lazy" />}
                        <div className="absolute top-2 end-2 flex gap-1">
                          <Badge variant={org.status === "active" ? "default" : "secondary"} className="text-[0.6875rem] h-5 capitalize">{org.status}</Badge>
                        </div>
                        <div className="absolute -bottom-5 start-4">
                          <Avatar className="h-10 w-10 rounded-xl border-2 border-background shadow-md">
                            {org.logo_url && <AvatarImage src={org.logo_url} />}
                            <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-xs font-bold">{org.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                      <CardContent className="pt-7 pb-3 px-4 space-y-2.5">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-semibold truncate">{isAr ? (org.name_ar || org.name) : org.name}</h3>
                              {org.is_verified && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                              {org.is_featured && <Star className="h-3.5 w-3.5 text-chart-4 shrink-0" />}
                            </div>
                            {org.organizer_number && <Badge variant="outline" className="text-[0.625rem] h-4 font-mono px-1 mt-0.5">{org.organizer_number}</Badge>}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(org.id)}><Pencil className="h-3.5 w-3.5 me-2" />{isAr ? "تعديل" : "Edit"}</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDetailId(org.id)}><Building2 className="h-3.5 w-3.5 me-2" />{isAr ? "التفاصيل" : "Details"}</DropdownMenuItem>
                              <DropdownMenuItem asChild><Link to={`/organizers/${org.slug}`}><Eye className="h-3.5 w-3.5 me-2" />{isAr ? "عرض" : "View"}</Link></DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm(isAr ? "هل أنت متأكد؟" : "Are you sure?")) deleteMutation.mutate(org.id); }}>
                                <Trash2 className="h-3.5 w-3.5 me-2" />{isAr ? "حذف" : "Delete"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {(org.city || org.country) && (
                          <div className="flex items-center gap-1 text-[0.6875rem] text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{isAr ? `${org.city_ar || org.city || ""}${org.country_ar ? `, ${org.country_ar}` : org.country ? `, ${org.country}` : ""}` : `${org.city || ""}${org.country ? `, ${org.country}` : ""}`}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { v: org.total_exhibitions || 0, l: isAr ? "معارض" : "Events" },
                            { v: (org.total_views || 0).toLocaleString(), l: isAr ? "مشاهدات" : "Views" },
                            { v: org.average_rating > 0 ? org.average_rating : "—", l: isAr ? "تقييم" : "Rating" },
                          ].map(s => (
                            <div key={s.l} className="rounded-lg bg-muted/40 p-1.5 text-center">
                              <p className="text-xs font-bold">{s.v}</p>
                              <p className="text-[0.625rem] text-muted-foreground">{s.l}</p>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[0.6875rem]">
                            <span className="text-muted-foreground">{isAr ? "اكتمال الملف" : "Profile"}</span>
                            <span className={cn("font-medium", pct >= 80 ? "text-chart-2" : pct >= 50 ? "text-chart-4" : "text-muted-foreground")}>{pct}%</span>
                          </div>
                          <Progress value={pct} className="h-1" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
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
            </>
          ) : (
            <AdminTableCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"><Checkbox checked={isAllSelected} onCheckedChange={toggleAll} /></TableHead>
                    <TableHead><button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-foreground transition-colors">{isAr ? "المنظم" : "Organizer"} <SortIcon col="name" /></button></TableHead>
                    <TableHead><button onClick={() => toggleSort("country")} className="flex items-center gap-1 hover:text-foreground transition-colors">{isAr ? "الموقع" : "Location"} <SortIcon col="country" /></button></TableHead>
                    <TableHead>{isAr ? "التواصل" : "Contact"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead className="text-center"><button onClick={() => toggleSort("total_exhibitions")} className="flex items-center gap-1 hover:text-foreground transition-colors mx-auto">{isAr ? "المعارض" : "Events"} <SortIcon col="total_exhibitions" /></button></TableHead>
                    <TableHead className="text-center"><button onClick={() => toggleSort("total_views")} className="flex items-center gap-1 hover:text-foreground transition-colors mx-auto">{isAr ? "المشاهدات" : "Views"} <SortIcon col="total_views" /></button></TableHead>
                    <TableHead className="text-center">{isAr ? "الملف" : "Profile"}</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagination.paginated.map((org: any) => {
                    const pct = getProfileCompleteness(org);
                    return (
                      <TableRow key={org.id} className={cn("group transition-colors", selected.has(org.id) ? "bg-primary/5" : "")} data-clickable="true" onClick={() => setDetailId(org.id)}>
                        <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selected.has(org.id)} onCheckedChange={() => toggleOne(org.id)} /></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 rounded-lg">
                              {org.logo_url && <AvatarImage src={org.logo_url} />}
                              <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-bold">{org.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-sm truncate">{isAr ? (org.name_ar || org.name) : org.name}</span>
                                {org.is_verified && <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />}
                                {org.is_featured && <Star className="h-3 w-3 text-chart-4 shrink-0" />}
                              </div>
                              {org.organizer_number && <span className="text-[0.6875rem] text-muted-foreground font-mono">{org.organizer_number}</span>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {org.city && org.country ? `${org.city}, ${org.country}` : org.country || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1.5">
                            {org.email && <Mail className="h-3.5 w-3.5 text-muted-foreground" />}
                            {org.phone && <Phone className="h-3.5 w-3.5 text-muted-foreground" />}
                            {org.website && <Globe className="h-3.5 w-3.5 text-muted-foreground" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={org.status === "active" ? "default" : "secondary"} className="text-[0.6875rem] capitalize">{org.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm font-medium">{org.total_exhibitions || 0}</TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">{(org.total_views || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <Progress value={pct} className="h-1 w-10" />
                            <span className={cn("text-[0.6875rem] font-medium", pct >= 80 ? "text-chart-2" : pct >= 50 ? "text-chart-4" : "text-muted-foreground")}>{pct}%</span>
                          </div>
                        </TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDetailId(org.id)}><Building2 className="h-3.5 w-3.5 me-2" />{isAr ? "التفاصيل" : "Details"}</DropdownMenuItem>
                              <DropdownMenuItem asChild><Link to={`/organizers/${org.slug}`}><Eye className="h-3.5 w-3.5 me-2" />{isAr ? "عرض" : "View"}</Link></DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(org.id)}><Pencil className="h-3.5 w-3.5 me-2" />{isAr ? "تعديل" : "Edit"}</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setExhibitionsPanel({ id: org.id, name: org.name, logo: org.logo_url })}>
                                <Link2 className="h-3.5 w-3.5 me-2" />{isAr ? "المعارض" : "Exhibitions"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => quickToggleVerify.mutate({ id: org.id, verified: !org.is_verified })}>
                                <Shield className="h-3.5 w-3.5 me-2" />{org.is_verified ? (isAr ? "إلغاء التوثيق" : "Unverify") : (isAr ? "توثيق" : "Verify")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => quickToggleFeatured.mutate({ id: org.id, featured: !org.is_featured })}>
                                <Star className="h-3.5 w-3.5 me-2" />{org.is_featured ? (isAr ? "إلغاء التمييز" : "Unfeature") : (isAr ? "تمييز" : "Feature")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => refreshStatsMutation.mutate(org.id)}>
                                <RefreshCw className="h-3.5 w-3.5 me-2" />{isAr ? "تحديث" : "Refresh Stats"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm(isAr ? "هل أنت متأكد؟" : "Are you sure?")) deleteMutation.mutate(org.id); }}>
                                <Trash2 className="h-3.5 w-3.5 me-2" />{isAr ? "حذف" : "Delete"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

        {/* ═══ Import Tab ═══ */}
        <TabsContent value="import">
          <Suspense fallback={<WidgetFallback />}>
            <BulkImportPanel
              entityType="organizer"
              onImportComplete={() => qc.invalidateQueries({ queryKey: ["admin-organizers"] })}
            />
          </Suspense>
        </TabsContent>

        {/* ═══ Dedup Tab ═══ */}
        <TabsContent value="dedup">
          <Suspense fallback={<WidgetFallback />}>
            <BatchDuplicateScanner
              defaultTable="organizers"
              onMergeComplete={() => qc.invalidateQueries({ queryKey: ["admin-organizers"] })}
            />
          </Suspense>
        </TabsContent>

        {/* ═══ Analytics Tab ═══ */}
        <TabsContent value="analytics" className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Status Distribution */}
            <Card className="rounded-2xl border-border/40">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {isAr ? "توزيع الحالات" : "Status Distribution"}
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={analyticsData.statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                        {analyticsData.statusData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))", fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  {analyticsData.statusData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="font-medium">{d.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Verification */}
            <Card className="rounded-2xl border-border/40">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  {isAr ? "التوثيق" : "Verification Status"}
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={analyticsData.verificationData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                        <Cell fill="hsl(var(--primary))" />
                        <Cell fill="hsl(var(--muted-foreground) / 0.3)" />
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))", fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  {analyticsData.verificationData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ background: i === 0 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)" }} />
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="font-medium">{d.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* By Country */}
            <Card className="rounded-2xl border-border/40">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {isAr ? "حسب الدولة" : "By Country"}
                </h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.countryData} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <RechartsTooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))", fontSize: 12 }} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Organizers */}
            <Card className="rounded-2xl border-border/40">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Star className="h-4 w-4 text-chart-4" />
                  {isAr ? "أفضل المنظمين" : "Top Organizers by Events"}
                </h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData.topOrganizers} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="orgEventsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" angle={-30} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <RechartsTooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))", fontSize: 12 }} />
                      <Area type="monotone" dataKey="events" stroke="hsl(var(--primary))" fill="url(#orgEventsGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Panels & Drawers */}
      {exhibitionsPanel && (
        <OrganizerExhibitionsPanel
          open={!!exhibitionsPanel}
          onOpenChange={o => { if (!o) setExhibitionsPanel(null); }}
          organizerId={exhibitionsPanel.id}
          organizerName={exhibitionsPanel.name}
          organizerLogo={exhibitionsPanel.logo}
        />
      )}
      <OrganizerDetailDrawer
        organizerId={detailId}
        open={!!detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}
