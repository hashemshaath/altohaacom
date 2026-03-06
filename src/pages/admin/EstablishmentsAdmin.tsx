import { useState, useMemo } from "react";
import { EntityFormGuard } from "@/components/admin/EntityFormGuard";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EntityStatsCards from "@/components/admin/entities/EntityStatsCards";
import EntityTableRow from "@/components/admin/entities/EntityTableRow";
import EntityFormTabs, { EntityFormData, emptyForm, typeOptions, scopeOptions } from "@/components/admin/entities/EntityFormTabs";
import EstablishmentDetailDrawer from "@/components/admin/establishments/EstablishmentDetailDrawer";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { BulkImportPanel } from "@/components/admin/BulkImportPanel";
import { BatchDuplicateScanner } from "@/components/admin/BatchDuplicateScanner";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Plus, Search, XCircle, CheckCircle, Eye, FileSpreadsheet, ScanSearch, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function EstablishmentsAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
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
  const [adminTab, setAdminTab] = useState<"list" | "scanner">("list");

  // Fetch culinary_entities
  const { data: entities, isLoading } = useQuery({
    queryKey: ["admin-culinary-entities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("culinary_entities")
        .select("id, name, name_ar, abbreviation, abbreviation_ar, type, scope, status, is_visible, country, city, logo_url, website, email, phone, description, description_ar, entity_number, slug, created_at, entity_followers:entity_followers(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Stats
  const stats = useMemo(() => {
    if (!entities) return { total: 0, active: 0, pending: 0, visible: 0, hidden: 0 };
    return {
      total: entities.length,
      active: entities.filter((e: any) => e.status === "active").length,
      pending: entities.filter((e: any) => e.status === "pending").length,
      visible: entities.filter((e: any) => e.is_visible).length,
      hidden: entities.filter((e: any) => !e.is_visible).length,
    };
  }, [entities]);

  // Filter
  const filtered = useMemo(() => {
    if (!entities) return [];
    return entities.filter((e: any) => {
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

  const { selected, toggleOne, toggleAll, clearSelection, isAllSelected, count, selectedItems } =
    useAdminBulkActions(filtered || []);

  const { exportCSV } = useCSVExport({
    columns: [
      { header: isAr ? "الرقم" : "Number", accessor: (r: any) => r.entity_number },
      { header: isAr ? "الاسم" : "Name", accessor: (r: any) => isAr && r.name_ar ? r.name_ar : r.name },
      { header: isAr ? "النوع" : "Type", accessor: (r: any) => r.type },
      { header: isAr ? "الحالة" : "Status", accessor: (r: any) => r.status },
      { header: isAr ? "المدينة" : "City", accessor: (r: any) => r.city || "" },
    ],
    filename: "entities",
  });

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
    toast({ title: visible ? (isAr ? "مرئي" : "Visible") : (isAr ? "مخفي" : "Hidden") });
  };

  const handleVerifiedChange = async (id: string, verified: boolean) => {
    const { error } = await supabase.from("culinary_entities").update({ is_verified: verified }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-culinary-entities"] });
    toast({ title: verified ? (isAr ? "تم التوثيق" : "Verified") : (isAr ? "تم إلغاء التوثيق" : "Unverified") });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("culinary_entities").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-culinary-entities"] });
    toast({ title: isAr ? "تم الحذف" : "Deleted" });
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
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <AdminPageHeader
          icon={Building2}
          title={isAr ? "إدارة الجهات" : "Entities Management"}
          description={isAr ? "إدارة الجمعيات والأكاديميات والجهات الحكومية" : "Manage associations, academies, and organizations"}
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
          defaultTable="culinary_entities"
          onMergeComplete={() => queryClient.invalidateQueries({ queryKey: ["admin-culinary-entities"] })}
        />
      ) : (
      <>
      <EntityStatsCards stats={stats} activeFilter={statusFilter} onFilterChange={f => setStatusFilter(f || "all")} />

      {/* Toolbar */}
      <Card className="border-border/50">
        <CardContent className="p-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={isAr ? "بحث بالاسم أو الرقم..." : "Search by name or number..."} value={search} onChange={e => setSearch(e.target.value)} className="ps-9 h-9" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder={isAr ? "النوع" : "Type"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "جميع الأنواع" : "All Types"}</SelectItem>
              {typeOptions.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => setShowBulkImport(!showBulkImport)}>
            <FileSpreadsheet className="h-3.5 w-3.5 me-1.5" />{isAr ? "استيراد جماعي" : "Bulk Import"}
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(!showForm); }}>
            <Plus className="h-4 w-4" />
            {isAr ? "إضافة جهة" : "Add Entity"}
          </Button>
        </CardContent>
      </Card>

      {showBulkImport && (
        <BulkImportPanel
          entityType="entity"
          onImportComplete={() => { setShowBulkImport(false); queryClient.invalidateQueries({ queryKey: ["admin-culinary-entities"] }); }}
        />
      )}

      {/* Bulk Actions */}
      <BulkActionBar count={count} onClear={clearSelection} onExport={() => exportCSV(selectedItems)} onStatusChange={bulkActivate}>
        <Button variant="destructive" size="sm" className="gap-1.5" onClick={bulkDeactivate}>
          <XCircle className="h-3.5 w-3.5" />
          {isAr ? "إيقاف" : "Suspend"}
        </Button>
      </BulkActionBar>

      {/* Form */}
      {showForm && (
        <>
        <EntityFormGuard
          entity={{ name: form.name, name_ar: form.name_ar, email: form.email, phone: form.phone, website: form.website, city: form.city, country: form.country }}
          tables={["culinary_entities", "organizers", "companies", "establishments"]}
          excludeId={editingId || undefined}
          translationFields={[
            { en: form.name, ar: form.name_ar, key: "name" },
            { en: form.description, ar: form.description_ar, key: "description" },
          ]}
          translationContext="culinary entity / association / academy"
          onTranslated={(u) => setForm(prev => ({ ...prev, ...u }))}
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
        </>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : !filtered.length ? (
        <div className="py-16 text-center">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{isAr ? "لا توجد جهات" : "No entities found"}</p>
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox checked={isAllSelected} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead className="hidden xl:table-cell">{isAr ? "الرقم" : "#"}</TableHead>
                <TableHead>{isAr ? "الجهة" : "Entity"}</TableHead>
                <TableHead className="hidden md:table-cell">{isAr ? "النوع" : "Type"}</TableHead>
                <TableHead className="hidden xl:table-cell">{isAr ? "النطاق" : "Scope"}</TableHead>
                <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead>{isAr ? "مرئي" : "Visible"}</TableHead>
                <TableHead className="hidden lg:table-cell">{isAr ? "المتابعون" : "Followers"}</TableHead>
                <TableHead className="text-end">{isAr ? "إجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entity: any) => (
                <EntityTableRow
                  key={entity.id}
                  entity={entity}
                  typeLabel={typeOptions.find(t => t.value === entity.type)}
                  scopeLabel={scopeOptions.find(s => s.value === entity.scope)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleVisibility={handleToggleVisibility}
                  onManage={(id) => setDetailId(id)}
                  onStatusChange={handleStatusChange}
                  onVerifiedChange={handleVerifiedChange}
                  selected={selected.has(entity.id)}
                  onSelect={(id, checked) => toggleOne(id)}
                />
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Detail Drawer */}
      <EstablishmentDetailDrawer
        entityId={detailId}
        open={!!detailId}
        onClose={() => setDetailId(null)}
      />
      </>
      )}
    </div>
  );
}
