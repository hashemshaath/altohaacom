import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Building2, Plus, MoreHorizontal, Eye, Pencil, Trash2,
  Globe, Mail, Phone, CheckCircle2, Star, Download, RefreshCw,
  Shield, ScanSearch, FileSpreadsheet, Link2, ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

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
  // Inline edit mode
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: organizers, isLoading } = useQuery({
    queryKey: ["admin-organizers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizers")
        .select("id, name, name_ar, slug, email, phone, website, city, country, status, is_verified, is_featured, logo_url, cover_image_url, organizer_number, total_exhibitions, total_views, average_rating, description, description_ar, address, address_ar, city_ar, country_ar, country_code, services, targeted_sectors, founded_year, social_links, created_at")
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
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-organizers"] });
      toast.success(isAr ? "تم الحذف" : "Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("organizers").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-organizers"] });
      clearSelection();
      toast.success(isAr ? "تم الحذف" : "Deleted");
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase.from("organizers").update({ status }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-organizers"] });
      clearSelection();
      toast.success(isAr ? "تم التحديث" : "Updated");
    },
  });

  const bulkVerifyMutation = useMutation({
    mutationFn: async ({ ids, verified }: { ids: string[]; verified: boolean }) => {
      const { error } = await supabase.from("organizers").update({ is_verified: verified }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-organizers"] });
      clearSelection();
      toast.success(isAr ? "تم التحديث" : "Updated");
    },
  });

  const refreshStatsMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("refresh_organizer_stats", { p_organizer_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-organizers"] });
      toast.success(isAr ? "تم تحديث الإحصائيات" : "Stats refreshed");
    },
  });

  const openEdit = (orgId: string | null) => {
    setEditId(orgId);
    setEditMode(true);
  };

  const stats = {
    total: organizers?.length || 0,
    active: organizers?.filter((o) => o.status === "active").length || 0,
    verified: organizers?.filter((o) => o.is_verified).length || 0,
    featured: organizers?.filter((o) => o.is_featured).length || 0,
  };

  const selectedArray = Array.from(selected);

  const toggleSort = useCallback((key: string) => {
    setSortKey(prev => {
      if (prev === key) {
        setSortDir(d => d === "asc" ? "desc" : "asc");
        return key;
      }
      setSortDir("asc");
      return key;
    });
  }, []);

  const SortIcon = ({ col }: { col: string }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />;
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
          title={isAr ? "المنظمين" : "Organizers"}
          description={isAr ? "إدارة منظمي الفعاليات وربطهم بالمعارض" : "Manage event organizers and link them to exhibitions"}
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
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: isAr ? "الإجمالي" : "Total", value: stats.total, icon: Building2 },
              { label: isAr ? "نشط" : "Active", value: stats.active, icon: CheckCircle2 },
              { label: isAr ? "موثق" : "Verified", value: stats.verified, icon: Shield },
              { label: isAr ? "مميز" : "Featured", value: stats.featured, icon: Star },
            ].map(s => (
              <Card key={s.label} className="rounded-2xl border-border/40 group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
                    <s.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
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
                <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                <SelectItem value="active">{isAr ? "نشط" : "Active"}</SelectItem>
                <SelectItem value="inactive">{isAr ? "غير نشط" : "Inactive"}</SelectItem>
                <SelectItem value="pending">{isAr ? "قيد المراجعة" : "Pending"}</SelectItem>
              </SelectContent>
            </Select>
            {countries.length > 0 && (
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-28 h-9 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "كل الدول" : "All"}</SelectItem>
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

          {/* Table */}
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
                    <TableHead className="text-center"><button onClick={() => toggleSort("average_rating")} className="flex items-center gap-1 hover:text-foreground transition-colors mx-auto">{isAr ? "التقييم" : "Rating"} <SortIcon col="average_rating" /></button></TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagination.paginated.map((org) => (
                    <TableRow key={org.id} className={`cursor-pointer ${selected.has(org.id) ? "bg-primary/5" : ""}`} onClick={() => setDetailId(org.id)}>
                      <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selected.has(org.id)} onCheckedChange={() => toggleOne(org.id)} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 rounded-xl">
                            {org.logo_url && <AvatarImage src={org.logo_url} />}
                            <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-xs font-bold">{org.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Link to={`/organizers/${org.slug}`} onClick={e => e.stopPropagation()} className="font-medium text-sm hover:text-primary truncate">{org.name}</Link>
                              {org.is_verified && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                              {org.is_featured && <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {org.organizer_number && <Badge variant="outline" className="text-[9px] h-4 font-mono px-1.5">{org.organizer_number}</Badge>}
                              {org.name_ar && <span className="text-[10px] text-muted-foreground truncate" dir="rtl">{org.name_ar}</span>}
                            </div>
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
                        <Badge variant={org.status === "active" ? "default" : "secondary"} className="text-[10px] capitalize">{org.status}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm font-medium">{org.total_exhibitions || 0}</TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">{(org.total_views || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        {org.average_rating > 0 ? (
                          <span className="text-sm font-medium flex items-center justify-center gap-0.5">
                            <Star className="h-3 w-3 text-amber-500" />{org.average_rating}
                          </span>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
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
                            <DropdownMenuItem onClick={() => refreshStatsMutation.mutate(org.id)}>
                              <RefreshCw className="h-3.5 w-3.5 me-2" />{isAr ? "تحديث الإحصائيات" : "Refresh Stats"}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm(isAr ? "هل أنت متأكد؟" : "Are you sure?")) deleteMutation.mutate(org.id); }}>
                              <Trash2 className="h-3.5 w-3.5 me-2" />{isAr ? "حذف" : "Delete"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
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
