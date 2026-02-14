import { useState } from "react";
import { BulkImportPanel } from "@/components/admin/BulkImportPanel";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Building2, FileSpreadsheet, Plus, Search } from "lucide-react";
import { EntitySubModulesPanel } from "@/components/entities/EntitySubModulesPanel";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EntityStatsCards from "@/components/admin/entities/EntityStatsCards";
import EntityTableRow from "@/components/admin/entities/EntityTableRow";
import EntityFormTabs, {
  emptyForm, typeOptions, scopeOptions, statusOptions,
  type EntityFormData,
} from "@/components/admin/entities/EntityFormTabs";
import type { Database } from "@/integrations/supabase/types";

type EntityType = Database["public"]["Enums"]["entity_type"];

export default function EntitiesAdmin() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [showForm, setShowForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EntityFormData>(emptyForm);
  const [selectedManager, setSelectedManager] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [managingEntity, setManagingEntity] = useState<{ id: string; name: string } | null>(null);

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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const slug = form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const payload = {
        name: form.name,
        name_ar: form.name_ar || null,
        abbreviation: form.abbreviation || null,
        abbreviation_ar: form.abbreviation_ar || null,
        description: form.description || null,
        description_ar: form.description_ar || null,
        type: form.type,
        scope: form.scope,
        status: form.status,
        is_visible: form.is_visible,
        is_verified: form.is_verified,
        country: form.country || null,
        city: form.city || null,
        address: form.address || null,
        address_ar: form.address_ar || null,
        postal_code: form.postal_code || null,
        email: form.email || null,
        phone: form.phone || null,
        fax: form.fax || null,
        website: form.website || null,
        logo_url: form.logo_url || null,
        cover_image_url: form.cover_image_url || null,
        president_name: form.president_name || null,
        president_name_ar: form.president_name_ar || null,
        secretary_name: form.secretary_name || null,
        secretary_name_ar: form.secretary_name_ar || null,
        founded_year: form.founded_year || null,
        member_count: form.member_count || null,
        mission: form.mission || null,
        mission_ar: form.mission_ar || null,
        username: form.username || null,
        registration_number: form.registration_number || null,
        license_number: form.license_number || null,
        internal_notes: form.internal_notes || null,
        services: form.services_input ? form.services_input.split(",").map(s => s.trim()) : [],
        specializations: form.specializations_input ? form.specializations_input.split(",").map(s => s.trim()) : [],
        tags: form.tags_input ? form.tags_input.split(",").map(s => s.trim()) : [],
        account_manager_id: selectedManager || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        slug,
        created_by: user?.id,
      };

      if (editingId) {
        const { error } = await supabase.from("culinary_entities").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("culinary_entities").insert({ ...payload, entity_number: "" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-entities"] });
      const wasCreating = !editingId;
      toast({ title: editingId ? (isAr ? "تم تحديث الجهة" : "Entity updated") : (isAr ? "تم إنشاء الجهة" : "Entity created") });
      if (wasCreating) {
        import("@/lib/notificationTriggers").then(({ notifyAdminEntityReview }) => {
          notifyAdminEntityReview({ entityName: form.name, entityNameAr: form.name_ar || undefined, submittedBy: "Admin" });
        });
      }
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("culinary_entities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-entities"] });
      toast({ title: isAr ? "تم حذف الجهة" : "Entity deleted" });
    },
  });

  const toggleVisibility = useMutation({
    mutationFn: async ({ id, visible }: { id: string; visible: boolean }) => {
      const { error } = await supabase.from("culinary_entities").update({ is_visible: visible }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-entities"] }),
  });

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedManager("");
    setEditingId(null);
    setShowForm(false);
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

  const filtered = entities?.filter(e => {
    const matchesSearch = (e.name + (e.name_ar || "") + (e.entity_number || "")).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || e.type === filterType;
    const matchesStatus = filterStatus === "all" || e.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: entities?.length || 0,
    active: entities?.filter(e => e.status === "active").length || 0,
    pending: entities?.filter(e => e.status === "pending").length || 0,
    visible: entities?.filter(e => e.is_visible).length || 0,
  };

  const statusLabels: Record<string, { en: string; ar: string }> = {
    pending: { en: "Pending", ar: "قيد المراجعة" },
    active: { en: "Active", ar: "نشط" },
    suspended: { en: "Suspended", ar: "موقوف" },
    archived: { en: "Archived", ar: "مؤرشف" },
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Building2}
        title={isAr ? "سجل الجهات والجمعيات" : "Culinary Entities Registry"}
        description={isAr ? "إدارة الجمعيات والجهات الحكومية والخاصة المتعلقة بالطهي" : "Manage culinary associations, government & private entities"}
        actions={
          <div className="flex gap-2">
            <Button variant={showBulkImport ? "secondary" : "outline"} size="sm" onClick={() => { setShowBulkImport(!showBulkImport); if (showForm) setShowForm(false); }}>
              <FileSpreadsheet className="me-2 h-4 w-4" />
              {isAr ? "استيراد" : "Import"}
            </Button>
            <Button size="sm" onClick={() => { resetForm(); setShowForm(!showForm); if (showBulkImport) setShowBulkImport(false); }}>
              {showForm ? (isAr ? "إغلاق" : "Close") : <><Plus className="me-2 h-4 w-4" />{isAr ? "إضافة جهة" : "Add Entity"}</>}
            </Button>
          </div>
        }
      />

      <EntityStatsCards stats={stats} />

      {showBulkImport && (
        <BulkImportPanel entityType="entity" onImportComplete={() => { setShowBulkImport(false); queryClient.invalidateQueries({ queryKey: ["admin-entities"] }); }} />
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
          onCancel={resetForm}
        />
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={isAr ? "بحث بالاسم أو الرقم..." : "Search by name or number..."} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="ps-10" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "جميع الأنواع" : "All Types"}</SelectItem>
            {typeOptions.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "جميع الحالات" : "All Status"}</SelectItem>
            {statusOptions.map(s => <SelectItem key={s} value={s}>{isAr ? statusLabels[s]?.ar : statusLabels[s]?.en}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "الرقم" : "#"}</TableHead>
                <TableHead>{isAr ? "الجهة" : "Entity"}</TableHead>
                <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                <TableHead>{isAr ? "النطاق" : "Scope"}</TableHead>
                <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead>{isAr ? "الرؤية" : "Visibility"}</TableHead>
                <TableHead>{isAr ? "المتابعون" : "Followers"}</TableHead>
                <TableHead className="text-end">{isAr ? "الإجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12">
                  <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </TableCell></TableRow>
              ) : filtered?.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  <Building2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>{isAr ? "لا توجد جهات مسجلة" : "No entities found"}</p>
                </TableCell></TableRow>
              ) : (
                filtered?.map(entity => (
                  <EntityTableRow
                    key={entity.id}
                    entity={entity as any}
                    typeLabel={typeOptions.find(t => t.value === entity.type)}
                    scopeLabel={scopeOptions.find(s => s.value === entity.scope)}
                    onEdit={startEdit}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onToggleVisibility={(id, visible) => toggleVisibility.mutate({ id, visible })}
                    onManage={(id, name) => setManagingEntity({ id, name })}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {managingEntity && (
        <EntitySubModulesPanel
          entityId={managingEntity.id}
          entityName={managingEntity.name}
          onClose={() => setManagingEntity(null)}
        />
      )}
    </div>
  );
}
