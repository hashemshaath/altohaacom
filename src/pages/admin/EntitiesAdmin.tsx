import { useState, useEffect, useMemo } from "react";
import { BulkImportPanel } from "@/components/admin/BulkImportPanel";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowDown, ArrowUp, ArrowUpDown, Building2, Download, FileSpreadsheet, FilterX, Plus, Search, Sparkles } from "lucide-react";
import { SmartImportDialog, type ImportedData } from "@/components/smart-import/SmartImportDialog";
import { EntitySubModulesPanel } from "@/components/entities/EntitySubModulesPanel";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EntityStatsCards from "@/components/admin/entities/EntityStatsCards";
import EntityTableRow from "@/components/admin/entities/EntityTableRow";
import EntityFormTabs, {
  emptyForm, typeOptions, scopeOptions, statusOptions,
  type EntityFormData,
} from "@/components/admin/entities/EntityFormTabs";
import { useEntityMutations } from "@/hooks/useEntityMutations";
import type { Database } from "@/integrations/supabase/types";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function useDebounce(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

type SortKey = "name" | "type" | "status" | "created_at";
type SortDir = "asc" | "desc";

export default function EntitiesAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [showForm, setShowForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showSmartImport, setShowSmartImport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EntityFormData>(emptyForm);
  const [selectedManager, setSelectedManager] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [managingEntity, setManagingEntity] = useState<{ id: string; name: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);

  const { data: entities, isLoading } = useQuery({
    queryKey: ["admin-entities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("culinary_entities")
        .select("*, entity_followers(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateField = (key: keyof EntityFormData, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedManager("");
    setEditingId(null);
    setShowForm(false);
  };

  const { saveMutation, deleteMutation, toggleVisibility, changeStatus, changeVerified } = useEntityMutations({
    form,
    editingId,
    selectedManager,
    onSuccess: () => resetForm(),
  });

  const isDirty = useMemo(() => {
    if (!showForm) return false;
    return JSON.stringify(form) !== JSON.stringify(emptyForm) || selectedManager !== "";
  }, [form, selectedManager, showForm]);

  const handleCloseForm = () => {
    if (isDirty) {
      setShowUnsavedWarning(true);
      setPendingClose(true);
    } else {
      resetForm();
    }
  };

  const startEdit = (entity: any) => {
    setForm({
      name: entity.name || "", name_ar: entity.name_ar || "",
      abbreviation: entity.abbreviation || "", abbreviation_ar: entity.abbreviation_ar || "",
      description: entity.description || "", description_ar: entity.description_ar || "",
      type: entity.type, scope: entity.scope, status: entity.status,
      is_visible: entity.is_visible, is_verified: entity.is_verified || false,
      country: entity.country || "", city: entity.city || "",
      address: entity.address || "", address_ar: entity.address_ar || "",
      postal_code: entity.postal_code || "",
      email: entity.email || "", phone: entity.phone || "",
      fax: entity.fax || "", website: entity.website || "",
      logo_url: entity.logo_url || "", cover_image_url: entity.cover_image_url || "",
      president_name: entity.president_name || "", president_name_ar: entity.president_name_ar || "",
      secretary_name: entity.secretary_name || "", secretary_name_ar: entity.secretary_name_ar || "",
      founded_year: entity.founded_year || undefined,
      member_count: entity.member_count || undefined,
      mission: entity.mission || "", mission_ar: entity.mission_ar || "",
      username: entity.username || "",
      registration_number: entity.registration_number || "",
      license_number: entity.license_number || "",
      internal_notes: entity.internal_notes || "",
      services_input: (entity.services || []).join(", "),
      specializations_input: (entity.specializations || []).join(", "),
      tags_input: (entity.tags || []).join(", "),
      latitude: (entity as any).latitude?.toString() || "",
      longitude: (entity as any).longitude?.toString() || "",
    });
    setSelectedManager(entity.account_manager_id || "");
    setEditingId(entity.id);
    setShowForm(true);
  };

  // Sort + Filter
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 ms-1 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 ms-1" /> : <ArrowDown className="h-3 w-3 ms-1" />;
  };

  const filtered = useMemo(() => {
    let result = entities?.filter(e => {
      const matchesSearch = (e.name + (e.name_ar || "") + (e.entity_number || "")).toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesType = filterType === "all" || e.type === filterType;
      const matchesVisible = filterStatus === "visible" ? e.is_visible : true;
      const matchesHidden = filterStatus === "hidden" ? !e.is_visible : true;
      const matchesStatus = filterStatus === "all" || filterStatus === "visible" || filterStatus === "hidden" || e.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus && matchesVisible && matchesHidden;
    }) || [];

    result.sort((a, b) => {
      let cmp = 0;
      const valA = (a as any)[sortKey] || "";
      const valB = (b as any)[sortKey] || "";
      cmp = String(valA).localeCompare(String(valB));
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [entities, debouncedSearch, filterType, filterStatus, sortKey, sortDir]);

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedEntities = filtered.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const stats = {
    total: entities?.length || 0,
    active: entities?.filter(e => e.status === "active").length || 0,
    pending: entities?.filter(e => e.status === "pending").length || 0,
    visible: entities?.filter(e => e.is_visible).length || 0,
    hidden: entities?.filter(e => !e.is_visible).length || 0,
  };

  const statusLabels: Record<string, { en: string; ar: string }> = {
    pending: { en: "Pending", ar: "قيد المراجعة" },
    active: { en: "Active", ar: "نشط" },
    suspended: { en: "Suspended", ar: "موقوف" },
    archived: { en: "Archived", ar: "مؤرشف" },
  };

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const headers = ["Entity Number", "Name", "Name (AR)", "Type", "Scope", "Status", "Country", "City", "Email", "Phone", "Verified", "Visible"];
    const rows = filtered.map(e => [
      e.entity_number, e.name, e.name_ar || "", e.type, e.scope, e.status,
      e.country || "", e.city || "", e.email || "", e.phone || "",
      e.is_verified ? "Yes" : "No", e.is_visible ? "Yes" : "No",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `entities-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: isAr ? "تم التصدير" : "Export complete" });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Building2}
        title={isAr ? "سجل الجهات والجمعيات" : "Culinary Entities Registry"}
        description={isAr ? "إدارة الجمعيات والجهات الحكومية والخاصة المتعلقة بالطهي" : "Manage culinary associations, government & private entities"}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!filtered.length}>
              <Download className="me-2 h-4 w-4" />
              {isAr ? "تصدير" : "Export"}
            </Button>
            <Button variant={showBulkImport ? "secondary" : "outline"} size="sm" onClick={() => { setShowBulkImport(!showBulkImport); if (showForm) handleCloseForm(); }}>
              <FileSpreadsheet className="me-2 h-4 w-4" />
              {isAr ? "استيراد" : "Import"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSmartImport(true)}>
              <Sparkles className="me-2 h-4 w-4" />
              {isAr ? "استيراد ذكي" : "Smart Import"}
            </Button>
            <Button size="sm" onClick={() => { if (showForm) { handleCloseForm(); } else { resetForm(); setShowForm(true); } if (showBulkImport) setShowBulkImport(false); }}>
              {showForm ? (isAr ? "إغلاق" : "Close") : <><Plus className="me-2 h-4 w-4" />{isAr ? "إضافة جهة" : "Add Entity"}</>}
            </Button>
          </div>
        }
      />

      <EntityStatsCards stats={stats} activeFilter={filterStatus} onFilterChange={(f) => { setFilterStatus(f); setCurrentPage(1); }} />

      {showBulkImport && (
        <BulkImportPanel entityType="entity" onImportComplete={() => { setShowBulkImport(false); }} />
      )}

      {showForm && (
        <EntityFormTabs
          form={form}
          editingId={editingId}
          selectedManager={selectedManager}
          isSaving={saveMutation.isPending}
          onUpdate={updateField}
          onManagerChange={setSelectedManager}
          onSave={() => saveMutation.mutate()}
          onCancel={handleCloseForm}
        />
      )}

      <SmartImportDialog
        open={showSmartImport}
        onOpenChange={setShowSmartImport}
        entityType="entity"
        onImport={(data: ImportedData) => {
          setForm(prev => ({
            ...prev,
            name: data.name_en || prev.name,
            name_ar: data.name_ar || prev.name_ar,
            description: data.description_en || prev.description,
            description_ar: data.description_ar || prev.description_ar,
            country: data.country_code || prev.country,
            city: data.city_en || prev.city,
            address: data.full_address_en || prev.address,
            address_ar: data.full_address_ar || prev.address_ar,
            postal_code: data.postal_code || prev.postal_code,
            email: data.email || prev.email,
            phone: data.phone || prev.phone,
            website: data.website || prev.website,
            latitude: data.latitude?.toString() || prev.latitude,
            longitude: data.longitude?.toString() || prev.longitude,
          }));
          setShowForm(true);
        }}
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={isAr ? "بحث بالاسم أو الرقم..." : "Search by name or number..."}
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="ps-10"
          />
        </div>
        <Select value={filterType} onValueChange={v => { setFilterType(v); setCurrentPage(1); }}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "جميع الأنواع" : "All Types"}</SelectItem>
            {typeOptions.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setCurrentPage(1); }}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "جميع الحالات" : "All Status"}</SelectItem>
            {statusOptions.map(s => <SelectItem key={s} value={s}>{isAr ? statusLabels[s]?.ar : statusLabels[s]?.en}</SelectItem>)}
            <SelectItem value="visible">{isAr ? "مرئية فقط" : "Visible Only"}</SelectItem>
            <SelectItem value="hidden">{isAr ? "مخفية فقط" : "Hidden Only"}</SelectItem>
          </SelectContent>
        </Select>
        {(searchQuery || filterType !== "all" || filterStatus !== "all") && (
          <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => { setSearchQuery(""); setFilterType("all"); setFilterStatus("all"); setCurrentPage(1); }}>
            <FilterX className="h-3.5 w-3.5" />
            {isAr ? "مسح" : "Clear"}
          </Button>
        )}
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {totalFiltered} {isAr ? "نتيجة" : "results"}
        </span>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden xl:table-cell w-[100px]">{isAr ? "الرقم" : "#"}</TableHead>
                  <TableHead>
                    <button className="flex items-center font-medium hover:text-foreground transition-colors" onClick={() => toggleSort("name")}>
                      {isAr ? "الجهة" : "Entity"}<SortIcon col="name" />
                    </button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <button className="flex items-center font-medium hover:text-foreground transition-colors" onClick={() => toggleSort("type")}>
                      {isAr ? "النوع" : "Type"}<SortIcon col="type" />
                    </button>
                  </TableHead>
                  <TableHead className="hidden xl:table-cell">{isAr ? "النطاق" : "Scope"}</TableHead>
                  <TableHead>
                    <button className="flex items-center font-medium hover:text-foreground transition-colors" onClick={() => toggleSort("status")}>
                      {isAr ? "الحالة" : "Status"}<SortIcon col="status" />
                    </button>
                  </TableHead>
                  <TableHead className="w-[44px]">{isAr ? "مرئي" : "Vis."}</TableHead>
                  <TableHead className="hidden lg:table-cell w-[44px]">{isAr ? "متابع" : "Flw."}</TableHead>
                  <TableHead className="text-end">{isAr ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-12">
                    <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </TableCell></TableRow>
                ) : paginatedEntities.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <Building2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>{isAr ? "لا توجد جهات مسجلة" : "No entities found"}</p>
                  </TableCell></TableRow>
                ) : (
                  paginatedEntities.map(entity => (
                    <EntityTableRow
                      key={entity.id}
                      entity={entity as any}
                      typeLabel={typeOptions.find(t => t.value === entity.type)}
                      scopeLabel={scopeOptions.find(s => s.value === entity.scope)}
                      onEdit={startEdit}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      onToggleVisibility={(id, visible) => toggleVisibility.mutate({ id, visible })}
                      onManage={(id, name) => setManagingEntity({ id, name })}
                      onStatusChange={(id, status) => changeStatus.mutate({ id, status: status as Database["public"]["Enums"]["entity_status"] })}
                      onVerifiedChange={(id, verified) => changeVerified.mutate({ id, verified })}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalFiltered > 0 && (
            <div className="flex flex-col gap-3 border-t p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{isAr ? "عرض" : "Show"}</span>
                <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="h-8 w-[70px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">
                  {isAr ? `من ${totalFiltered}` : `of ${totalFiltered}`}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-8" disabled={safeCurrentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
                  {isAr ? "السابق" : "Prev"}
                </Button>
                <span className="px-3 text-xs text-muted-foreground">
                  {safeCurrentPage} / {totalPages}
                </span>
                <Button variant="outline" size="sm" className="h-8" disabled={safeCurrentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  {isAr ? "التالي" : "Next"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {managingEntity && (
        <EntitySubModulesPanel
          entityId={managingEntity.id}
          entityName={managingEntity.name}
          onClose={() => setManagingEntity(null)}
        />
      )}

      {/* Unsaved changes warning */}
      <AlertDialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? "تغييرات غير محفوظة" : "Unsaved Changes"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? "لديك تغييرات غير محفوظة. هل تريد تجاهلها والإغلاق؟"
                : "You have unsaved changes. Discard them and close?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingClose(false)}>
              {isAr ? "متابعة التحرير" : "Keep Editing"}
            </AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { setShowUnsavedWarning(false); setPendingClose(false); resetForm(); }}>
              {isAr ? "تجاهل والإغلاق" : "Discard & Close"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
