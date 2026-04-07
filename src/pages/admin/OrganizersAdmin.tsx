import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { BulkImportPanel } from "@/components/admin/BulkImportPanel";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { usePagination } from "@/hooks/usePagination";
import { AdminTablePagination } from "@/components/admin/AdminTablePagination";
import { BatchDuplicateScanner } from "@/components/admin/BatchDuplicateScanner";
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
  LayoutGrid, LayoutList, TrendingUp, Calendar, MapPin, ExternalLink,
  Activity, Users, BarChart3, Zap, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type ViewMode = "table" | "cards";

export default function OrganizersAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [adminTab, setAdminTab] = useState<"list" | "scanner">("list");
  const [showBulkImport, setShowBulkImport] = useState(false);
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
      if (error) throw error;
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
    return list.sort((a: any, b: any) => {
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
      { header: "Number", accessor: (o: any) => o.organizer_number },
      { header: "Name", accessor: (o: any) => o.name },
      { header: "Name (AR)", accessor: (o: any) => o.name_ar },
      { header: "Email", accessor: (o: any) => o.email },
      { header: "Phone", accessor: (o: any) => o.phone },
      { header: "Website", accessor: (o: any) => o.website },
      { header: "City", accessor: (o: any) => o.city },
      { header: "Country", accessor: (o: any) => o.country },
      { header: "Status", accessor: (o: any) => o.status },
      { header: "Verified", accessor: (o: any) => o.is_verified ? "Yes" : "No" },
      { header: "Featured", accessor: (o: any) => o.is_featured ? "Yes" : "No" },
      { header: "Events", accessor: (o: any) => o.total_exhibitions || 0 },
      { header: "Views", accessor: (o: any) => o.total_views || 0 },
      { header: "Rating", accessor: (o: any) => o.average_rating || 0 },
      { header: "Services", accessor: (o: any) => (o.services || []).join("; ") },
      { header: "Founded", accessor: (o: any) => o.founded_year },
    ],
    filename: "organizers",
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("organizers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-organizers"] }); toast.success(isAr ? "تم الحذف" : "Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("organizers").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-organizers"] }); clearSelection(); toast.success(isAr ? "تم الحذف" : "Deleted"); },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase.from("organizers").update({ status }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-organizers"] }); clearSelection(); toast.success(isAr ? "تم التحديث" : "Updated"); },
  });

  const bulkVerifyMutation = useMutation({
    mutationFn: async ({ ids, verified }: { ids: string[]; verified: boolean }) => {
      const { error } = await supabase.from("organizers").update({ is_verified: verified }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-organizers"] }); clearSelection(); toast.success(isAr ? "تم التحديث" : "Updated"); },
  });

  const quickToggleVerify = useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const { error } = await supabase.from("organizers").update({ is_verified: verified }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-organizers"] }); toast.success(isAr ? "تم التحديث" : "Updated"); },
  });

  const quickToggleFeatured = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const { error } = await supabase.from("organizers").update({ is_featured: featured }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-organizers"] }); toast.success(isAr ? "تم التحديث" : "Updated"); },
  });

  const refreshStatsMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("refresh_organizer_stats", { p_organizer_id: id });
      if (error) throw error;
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
    const avgRating = rated.length > 0 ? (rated.reduce((s, o) => s + o.average_rating, 0) / rated.length).toFixed(1) : "0";
    return {
      total: all.length,
      active: all.filter(o => o.status === "active").length,
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

  const getProfileCompleteness = (org: any): number => {
    let score = 0;
    const checks = [org.name, org.name_ar, org.email, org.phone, org.website, org.logo_url, org.cover_image_url, org.description, org.city, org.country, org.services?.length > 0, org.founded_year, org.social_links && Object.keys(org.social_links).length > 0];
    checks.forEach(c => { if (c) score++; });
    return Math.round((score / checks.length) * 100);
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <AdminPageHeader
          icon={Building2}
          title={isAr ? "إدارة المنظمين" : "Organizer Management"}
          description={isAr ? "إدارة منظمي الفعاليات والمعارض وربطهم بالأحداث" : "Manage event organizers, link exhibitions & track performance"}
        />
        <div className="flex gap-2 shrink-0">
          <Button variant={adminTab === "list" ? "default" : "outline"} size="sm" onClick={() => setAdminTab("list")}>
            <Building2 className="h-4 w-4 me-1" />{isAr ? "القائمة" : "List"}
          </Button>
          <Button variant={adminTab === "scanner" ? "default" : "outline"} size="sm" onClick={() => setAdminTab("scanner")}>
            <ScanSearch className="h-4 w-4 me-1" />{isAr ? "فاحص التكرارات" : "Dedup Scanner"}
          </Button>
        </div>
      </div>

      {adminTab === "scanner" ? (
        <BatchDuplicateScanner
          defaultTable="organizers"
          onMergeComplete={() => qc.invalidateQueries({ queryKey: ["admin-organizers"] })}
        />
      ) : (
        <>
          {/* Enhanced Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: isAr ? "الإجمالي" : "Total", value: stats.total, icon: Building2, color: "text-primary", bg: "bg-primary/10" },
              { label: isAr ? "نشط" : "Active", value: stats.active, icon: CheckCircle2, color: "text-chart-2", bg: "bg-chart-2/10", sub: `${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%` },
              { label: isAr ? "موثق" : "Verified", value: stats.verified, icon: Shield, color: "text-blue-600", bg: "bg-blue-600/10" },
              { label: isAr ? "المعارض" : "Events", value: stats.totalEvents, icon: Calendar, color: "text-purple-600", bg: "bg-purple-600/10" },
              { label: isAr ? "المشاهدات" : "Views", value: stats.totalViews.toLocaleString(), icon: Eye, color: "text-amber-600", bg: "bg-amber-600/10" },
              { label: isAr ? "الدول" : "Countries", value: stats.countriesCount, icon: MapPin, color: "text-rose-600", bg: "bg-rose-600/10" },
            ].map(s => (
              <Card key={s.label} className="rounded-2xl border-border/40 group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110", s.bg)}>
                    <s.icon className={cn("h-4 w-4", s.color)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold leading-tight">{s.value}</p>
                    <p className="text-[12px] text-muted-foreground truncate">{s.label}</p>
                    {s.sub && <p className="text-[12px] text-chart-2 font-medium">{s.sub}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

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
            <Select value={verifiedFilter} onValueChange={(v) => setVerifiedFilter(v as any)}>
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

            <Button size="sm" variant="outline" onClick={() => setShowBulkImport(!showBulkImport)}>
              <FileSpreadsheet className="h-3.5 w-3.5 me-1.5" />{isAr ? "استيراد" : "Import"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportCSV(organizers || [])}>
              <Download className="h-3.5 w-3.5 me-1.5" />{isAr ? "تصدير" : "Export"}
            </Button>
            <Button size="sm" onClick={() => openEdit(null)}>
              <Plus className="h-4 w-4 me-1.5" />{isAr ? "إضافة منظم" : "Add Organizer"}
            </Button>
          </AdminFilterBar>

          {showBulkImport && (
            <BulkImportPanel
              entityType="organizer"
              onImportComplete={() => { setShowBulkImport(false); qc.invalidateQueries({ queryKey: ["admin-organizers"] }); }}
            />
          )}

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
            /* ═══ Card View ═══ */
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pagination.paginated.map((org: any) => {
                  const pct = getProfileCompleteness(org);
                  return (
                    <Card key={org.id} className="rounded-2xl border-border/40 overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                      {/* Cover */}
                      <div className="relative h-28 bg-gradient-to-br from-primary/20 to-primary/5">
                        {org.cover_image_url && (
                          <img src={org.cover_image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                        )}
                        <div className="absolute top-2 end-2 flex gap-1">
                          <Badge variant={org.status === "active" ? "default" : "secondary"} className="text-[12px] h-5 capitalize shadow-sm">{org.status}</Badge>
                        </div>
                        {/* Logo */}
                        <div className="absolute -bottom-5 start-4">
                          <Avatar className="h-12 w-12 rounded-xl border-2 border-background shadow-md">
                            {org.logo_url && <AvatarImage src={org.logo_url} />}
                            <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-sm font-bold">{org.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>

                      <CardContent className="pt-8 pb-4 px-4 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-bold truncate">{isAr ? (org.name_ar || org.name) : org.name}</h3>
                              {org.is_verified && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                              {org.is_featured && <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                            </div>
                            {org.name_ar && !isAr && <p className="text-[12px] text-muted-foreground truncate" dir="rtl">{org.name_ar}</p>}
                            {org.organizer_number && <Badge variant="outline" className="text-[12px] h-4 font-mono px-1.5 mt-1">{org.organizer_number}</Badge>}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(org.id)}><Pencil className="h-3.5 w-3.5 me-2" />{isAr ? "تعديل" : "Edit"}</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDetailId(org.id)}><Building2 className="h-3.5 w-3.5 me-2" />{isAr ? "التفاصيل" : "Details"}</DropdownMenuItem>
                              <DropdownMenuItem asChild><Link to={`/organizers/${org.slug}`}><Eye className="h-3.5 w-3.5 me-2" />{isAr ? "عرض" : "View"}</Link></DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setExhibitionsPanel({ id: org.id, name: org.name, logo: org.logo_url })}><Link2 className="h-3.5 w-3.5 me-2" />{isAr ? "المعارض" : "Exhibitions"}</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm(isAr ? "هل أنت متأكد؟" : "Are you sure?")) deleteMutation.mutate(org.id); }}>
                                <Trash2 className="h-3.5 w-3.5 me-2" />{isAr ? "حذف" : "Delete"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Location */}
                        {(org.city || org.country) && (
                          <div className="flex items-center gap-1 text-[12px] text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{isAr ? `${org.city_ar || org.city || ""}${org.country_ar ? `, ${org.country_ar}` : org.country ? `, ${org.country}` : ""}` : `${org.city || ""}${org.country ? `, ${org.country}` : ""}`}</span>
                          </div>
                        )}

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { v: org.total_exhibitions || 0, l: isAr ? "معارض" : "Events", icon: Calendar },
                            { v: (org.total_views || 0).toLocaleString(), l: isAr ? "مشاهدات" : "Views", icon: Eye },
                            { v: org.average_rating > 0 ? org.average_rating : "—", l: isAr ? "تقييم" : "Rating", icon: Star },
                          ].map(s => (
                            <div key={s.l} className="rounded-xl bg-muted/40 p-2 text-center">
                              <p className="text-xs font-bold">{s.v}</p>
                              <p className="text-[12px] text-muted-foreground">{s.l}</p>
                            </div>
                          ))}
                        </div>

                        {/* Profile Completeness */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[12px]">
                            <span className="text-muted-foreground">{isAr ? "اكتمال الملف" : "Profile"}</span>
                            <span className={cn("font-medium", pct >= 80 ? "text-chart-2" : pct >= 50 ? "text-amber-600" : "text-destructive")}>{pct}%</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant={org.is_verified ? "default" : "outline"} size="icon" className="h-7 w-7 rounded-lg"
                                  onClick={(e) => { e.stopPropagation(); quickToggleVerify.mutate({ id: org.id, verified: !org.is_verified }); }}>
                                  <Shield className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p className="text-xs">{org.is_verified ? (isAr ? "إلغاء التوثيق" : "Unverify") : (isAr ? "توثيق" : "Verify")}</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant={org.is_featured ? "default" : "outline"} size="icon" className="h-7 w-7 rounded-lg"
                                  onClick={(e) => { e.stopPropagation(); quickToggleFeatured.mutate({ id: org.id, featured: !org.is_featured }); }}>
                                  <Star className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p className="text-xs">{org.is_featured ? (isAr ? "إلغاء التمييز" : "Unfeature") : (isAr ? "تمييز" : "Feature")}</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <div className="flex-1" />
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 rounded-lg" onClick={() => openEdit(org.id)}>
                            <Pencil className="h-3 w-3" />{isAr ? "تعديل" : "Edit"}
                          </Button>
                        </div>

                        {/* Contact Icons */}
                        <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                          {org.email && (
                            <a href={`mailto:${org.email}`} onClick={e => e.stopPropagation()} className="text-muted-foreground hover:text-primary transition-colors">
                              <Mail className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {org.phone && (
                            <a href={`tel:${org.phone}`} onClick={e => e.stopPropagation()} className="text-muted-foreground hover:text-primary transition-colors">
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {org.website && (
                            <a href={org.website} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-muted-foreground hover:text-primary transition-colors">
                              <Globe className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <div className="flex-1" />
                          {org.founded_year && (
                            <span className="text-[12px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />{isAr ? `تأسس ${org.founded_year}` : `Est. ${org.founded_year}`}
                            </span>
                          )}
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
            /* ═══ Table View ═══ */
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
                      <TableRow key={org.id} className={cn("cursor-pointer transition-colors", selected.has(org.id) ? "bg-primary/5" : "hover:bg-muted/30")} onClick={() => setDetailId(org.id)}>
                        <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selected.has(org.id)} onCheckedChange={() => toggleOne(org.id)} /></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 rounded-xl">
                              {org.logo_url && <AvatarImage src={org.logo_url} />}
                              <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-xs font-bold">{org.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-sm truncate">{isAr ? (org.name_ar || org.name) : org.name}</span>
                                {org.is_verified && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                                {org.is_featured && <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {org.organizer_number && <Badge variant="outline" className="text-[12px] h-4 font-mono px-1.5">{org.organizer_number}</Badge>}
                                {org.name_ar && !isAr && <span className="text-[12px] text-muted-foreground truncate" dir="rtl">{org.name_ar}</span>}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{org.city && org.country ? `${org.city}, ${org.country}` : org.country || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1.5">
                            {org.email && <TooltipProvider><Tooltip><TooltipTrigger><Mail className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="text-xs">{org.email}</p></TooltipContent></Tooltip></TooltipProvider>}
                            {org.phone && <TooltipProvider><Tooltip><TooltipTrigger><Phone className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="text-xs">{org.phone}</p></TooltipContent></Tooltip></TooltipProvider>}
                            {org.website && <TooltipProvider><Tooltip><TooltipTrigger><Globe className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="text-xs">{org.website}</p></TooltipContent></Tooltip></TooltipProvider>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={org.status === "active" ? "default" : "secondary"} className="text-[12px] capitalize">{org.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm font-medium">{org.total_exhibitions || 0}</TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">{(org.total_views || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-flex items-center gap-1.5">
                                  <Progress value={pct} className="h-1.5 w-12" />
                                  <span className={cn("text-[12px] font-medium", pct >= 80 ? "text-chart-2" : pct >= 50 ? "text-amber-600" : "text-muted-foreground")}>{pct}%</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent><p className="text-xs">{isAr ? "اكتمال الملف الشخصي" : "Profile completeness"}</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDetailId(org.id)}>
                                <Building2 className="h-3.5 w-3.5 me-2" />{isAr ? "التفاصيل" : "Details"}
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/organizers/${org.slug}`}><Eye className="h-3.5 w-3.5 me-2" />{isAr ? "عرض" : "View"}</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(org.id)}>
                                <Pencil className="h-3.5 w-3.5 me-2" />{isAr ? "تعديل" : "Edit"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setExhibitionsPanel({ id: org.id, name: org.name, logo: org.logo_url })}>
                                <Link2 className="h-3.5 w-3.5 me-2" />{isAr ? "المعارض المرتبطة" : "Linked Exhibitions"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => quickToggleVerify.mutate({ id: org.id, verified: !org.is_verified })}>
                                <Shield className="h-3.5 w-3.5 me-2" />{org.is_verified ? (isAr ? "إلغاء التوثيق" : "Unverify") : (isAr ? "توثيق" : "Verify")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => quickToggleFeatured.mutate({ id: org.id, featured: !org.is_featured })}>
                                <Star className="h-3.5 w-3.5 me-2" />{org.is_featured ? (isAr ? "إلغاء التمييز" : "Unfeature") : (isAr ? "تمييز" : "Feature")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => refreshStatsMutation.mutate(org.id)}>
                                <RefreshCw className="h-3.5 w-3.5 me-2" />{isAr ? "تحديث الإحصائيات" : "Refresh Stats"}
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
        </>
      )}

      {/* Organizer Exhibitions Panel */}
      {exhibitionsPanel && (
        <OrganizerExhibitionsPanel
          open={!!exhibitionsPanel}
          onOpenChange={o => { if (!o) setExhibitionsPanel(null); }}
          organizerId={exhibitionsPanel.id}
          organizerName={exhibitionsPanel.name}
          organizerLogo={exhibitionsPanel.logo}
        />
      )}

      {/* Detail Drawer */}
      <OrganizerDetailDrawer
        organizerId={detailId}
        open={!!detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}
