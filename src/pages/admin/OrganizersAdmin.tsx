import { useState, useMemo, useEffect, useCallback } from "react";
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
import { useEntityDedup } from "@/hooks/useEntityDedup";
import { useAutoTranslate } from "@/hooks/useAutoTranslate";
import { DeduplicationPanel } from "@/components/admin/DeduplicationPanel";
import { BatchDuplicateScanner } from "@/components/admin/BatchDuplicateScanner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
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
  Building2, Plus, Search, MoreHorizontal, Eye, Pencil, Trash2,
  Globe, Mail, Phone, CheckCircle2, Star, Download, RefreshCw,
  Shield, ScanSearch, Languages, FileSpreadsheet,
  Twitter, Facebook, Linkedin, Instagram,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface OrganizerForm {
  name: string;
  name_ar: string;
  slug: string;
  description: string;
  description_ar: string;
  logo_url: string;
  cover_image_url: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  address_ar: string;
  city: string;
  city_ar: string;
  country: string;
  country_ar: string;
  country_code: string;
  status: string;
  is_verified: boolean;
  is_featured: boolean;
  services: string;
  targeted_sectors: string;
  founded_year: string;
  social_twitter: string;
  social_facebook: string;
  social_linkedin: string;
  social_instagram: string;
}

const emptyForm: OrganizerForm = {
  name: "", name_ar: "", slug: "", description: "", description_ar: "",
  logo_url: "", cover_image_url: "", email: "", phone: "", website: "",
  address: "", address_ar: "", city: "", city_ar: "", country: "", country_ar: "",
  country_code: "", status: "active", is_verified: false, is_featured: false,
  services: "", targeted_sectors: "", founded_year: "",
  social_twitter: "", social_facebook: "", social_linkedin: "", social_instagram: "",
};

export default function OrganizersAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<OrganizerForm>(emptyForm);
  const [formTab, setFormTab] = useState("basic");
  const [adminTab, setAdminTab] = useState<"list" | "scanner">("list");
  const [showBulkImport, setShowBulkImport] = useState(false);

  // Dedup
  const { checking, duplicates, checkEntity, clearDuplicates } = useEntityDedup({
    tables: ["organizers", "companies", "culinary_entities", "establishments"],
    excludeId: editId || undefined,
  });

  // Auto-translate
  const { autoTranslateFields } = useAutoTranslate();
  const [translating, setTranslating] = useState(false);

  // Debounced dedup check on name/email change
  useEffect(() => {
    if (!dialogOpen || (!form.name && !form.email)) return;
    const timer = setTimeout(() => {
      checkEntity({
        name: form.name,
        name_ar: form.name_ar,
        email: form.email,
        phone: form.phone,
        website: form.website,
        city: form.city,
        country: form.country,
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [form.name, form.email, form.website, dialogOpen]);

  const handleAutoTranslate = useCallback(async () => {
    setTranslating(true);
    try {
      const updates = await autoTranslateFields([
        { en: form.name, ar: form.name_ar, key: "name" },
        { en: form.description, ar: form.description_ar, key: "description" },
        { en: form.address, ar: form.address_ar, key: "address" },
        { en: form.city, ar: form.city_ar, key: "city" },
        { en: form.country, ar: form.country_ar, key: "country" },
      ], "event organizer / exhibition management");
      if (Object.keys(updates).length > 0) {
        setForm(f => ({ ...f, ...updates }));
        toast.success(isAr ? "تمت الترجمة التلقائية" : "Auto-translated successfully");
      } else {
        toast.info(isAr ? "لا حاجة للترجمة" : "Nothing to translate");
      }
    } catch {
      toast.error(isAr ? "فشلت الترجمة" : "Translation failed");
    } finally {
      setTranslating(false);
    }
  }, [form, autoTranslateFields, isAr]);

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
    [...new Set((organizers || []).map((o: any) => o.country).filter(Boolean))] as string[],
    [organizers]
  );

  const filtered = useMemo(() => (organizers || []).filter((o: any) => {
    const matchSearch = !search || o.name?.toLowerCase().includes(search.toLowerCase()) || o.name_ar?.includes(search) || o.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchCountry = countryFilter === "all" || o.country === countryFilter;
    return matchSearch && matchStatus && matchCountry;
  }), [organizers, search, statusFilter, countryFilter]);

  const { selected, toggleOne, toggleAll, clearSelection, isAllSelected, count: selectedCount } = useAdminBulkActions(filtered);

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

  const saveMutation = useMutation({
    mutationFn: async (f: OrganizerForm) => {
      const socialLinks: Record<string, string> = {};
      if (f.social_twitter) socialLinks.twitter = f.social_twitter;
      if (f.social_facebook) socialLinks.facebook = f.social_facebook;
      if (f.social_linkedin) socialLinks.linkedin = f.social_linkedin;
      if (f.social_instagram) socialLinks.instagram = f.social_instagram;

      const payload = {
        name: f.name,
        name_ar: f.name_ar || null,
        slug: f.slug || f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, ""),
        description: f.description || null,
        description_ar: f.description_ar || null,
        logo_url: f.logo_url || null,
        cover_image_url: f.cover_image_url || null,
        email: f.email || null,
        phone: f.phone || null,
        website: f.website || null,
        address: f.address || null,
        address_ar: f.address_ar || null,
        city: f.city || null,
        city_ar: f.city_ar || null,
        country: f.country || null,
        country_ar: f.country_ar || null,
        country_code: f.country_code || null,
        status: f.status,
        is_verified: f.is_verified,
        is_featured: f.is_featured,
        services: f.services ? f.services.split(",").map(s => s.trim()).filter(Boolean) : null,
        targeted_sectors: f.targeted_sectors ? f.targeted_sectors.split(",").map(s => s.trim()).filter(Boolean) : null,
        founded_year: f.founded_year ? parseInt(f.founded_year) : null,
        social_links: Object.keys(socialLinks).length > 0 ? socialLinks : null,
      };

      if (editId) {
        const { error } = await supabase.from("organizers").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("organizers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-organizers"] });
      setDialogOpen(false);
      setEditId(null);
      setForm(emptyForm);
      toast.success(editId ? (isAr ? "تم التحديث" : "Updated") : (isAr ? "تمت الإضافة" : "Created"));
    },
    onError: (e: any) => toast.error(e.message),
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
    onError: (e: any) => toast.error(e.message),
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

  const openEdit = (org: any) => {
    setEditId(org.id);
    const social = org.social_links || {};
    setForm({
      name: org.name || "", name_ar: org.name_ar || "", slug: org.slug || "",
      description: org.description || "", description_ar: org.description_ar || "",
      logo_url: org.logo_url || "", cover_image_url: org.cover_image_url || "",
      email: org.email || "", phone: org.phone || "", website: org.website || "",
      address: org.address || "", address_ar: org.address_ar || "",
      city: org.city || "", city_ar: org.city_ar || "", country: org.country || "",
      country_ar: org.country_ar || "", country_code: org.country_code || "",
      status: org.status || "active", is_verified: org.is_verified || false,
      is_featured: org.is_featured || false,
      services: (org.services || []).join(", "),
      targeted_sectors: (org.targeted_sectors || []).join(", "),
      founded_year: org.founded_year?.toString() || "",
      social_twitter: social.twitter || "",
      social_facebook: social.facebook || "",
      social_linkedin: social.linkedin || "",
      social_instagram: social.instagram || "",
    });
    setFormTab("basic");
    setDialogOpen(true);
  };

  const stats = {
    total: organizers?.length || 0,
    active: organizers?.filter((o: any) => o.status === "active").length || 0,
    verified: organizers?.filter((o: any) => o.is_verified).length || 0,
    featured: organizers?.filter((o: any) => o.is_featured).length || 0,
  };

  const selectedArray = Array.from(selected);

  return (
    <div className="space-y-6">
      {/* Header with tab toggle */}
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
            onExport={() => exportCSV(filtered.filter((o: any) => selected.has(o.id)))}
          >
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => bulkVerifyMutation.mutate({ ids: selectedArray, verified: true })}>
              <Shield className="h-3.5 w-3.5" />{isAr ? "توثيق" : "Verify"}
            </Button>
          </BulkActionBar>

          {/* Toolbar */}
          <Card className="rounded-2xl border-border/40 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-3 flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-2 items-center flex-1 min-w-0">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={isAr ? "بحث بالاسم أو البريد..." : "Search by name or email..."} value={search} onChange={e => setSearch(e.target.value)} className="ps-9 h-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                    <SelectItem value="active">{isAr ? "نشط" : "Active"}</SelectItem>
                    <SelectItem value="inactive">{isAr ? "غير نشط" : "Inactive"}</SelectItem>
                    <SelectItem value="pending">{isAr ? "قيد المراجعة" : "Pending"}</SelectItem>
                  </SelectContent>
                </Select>
                {countries.length > 0 && (
                  <Select value={countryFilter} onValueChange={setCountryFilter}>
                    <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{isAr ? "كل الدول" : "All"}</SelectItem>
                      {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => exportCSV(organizers || [])}>
                  <Download className="h-3.5 w-3.5 me-1.5" />{isAr ? "تصدير" : "Export"}
                </Button>
                <Button size="sm" onClick={() => { setEditId(null); setForm(emptyForm); setFormTab("basic"); setDialogOpen(true); }}>
                  <Plus className="h-4 w-4 me-1.5" />{isAr ? "إضافة منظم" : "Add Organizer"}
                </Button>
              </div>
            </CardContent>
          </Card>

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
              onAction={() => { setEditId(null); setForm(emptyForm); setFormTab("basic"); setDialogOpen(true); }}
            />
          ) : (
            <Card className="rounded-2xl border-border/40 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"><Checkbox checked={isAllSelected} onCheckedChange={toggleAll} /></TableHead>
                    <TableHead>{isAr ? "المنظم" : "Organizer"}</TableHead>
                    <TableHead>{isAr ? "الموقع" : "Location"}</TableHead>
                    <TableHead>{isAr ? "التواصل" : "Contact"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead className="text-center">{isAr ? "المعارض" : "Events"}</TableHead>
                    <TableHead className="text-center">{isAr ? "المشاهدات" : "Views"}</TableHead>
                    <TableHead className="text-center">{isAr ? "التقييم" : "Rating"}</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((org: any) => (
                    <TableRow key={org.id} className={selected.has(org.id) ? "bg-primary/5" : ""}>
                      <TableCell><Checkbox checked={selected.has(org.id)} onCheckedChange={() => toggleOne(org.id)} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 rounded-xl">
                            {org.logo_url && <AvatarImage src={org.logo_url} />}
                            <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-xs font-bold">{org.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Link to={`/organizers/${org.slug}`} className="font-medium text-sm hover:text-primary truncate">{org.name}</Link>
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
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/organizers/${org.slug}`}><Eye className="h-3.5 w-3.5 me-2" />{isAr ? "عرض" : "View"}</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(org)}>
                              <Pencil className="h-3.5 w-3.5 me-2" />{isAr ? "تعديل" : "Edit"}
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
            </Card>
          )}
        </>
      )}

      {/* Create/Edit Dialog with Dedup + Auto-Translate */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) clearDuplicates(); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? (isAr ? "تعديل المنظم" : "Edit Organizer") : (isAr ? "إضافة منظم" : "Add Organizer")}</DialogTitle>
          </DialogHeader>

          {/* Dedup warnings */}
          <DeduplicationPanel duplicates={duplicates} checking={checking} onDismiss={clearDuplicates} compact />

          <Tabs value={formTab} onValueChange={setFormTab}>
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="basic">{isAr ? "الأساسية" : "Basic"}</TabsTrigger>
              <TabsTrigger value="contact">{isAr ? "التواصل" : "Contact"}</TabsTrigger>
              <TabsTrigger value="details">{isAr ? "التفاصيل" : "Details"}</TabsTrigger>
              <TabsTrigger value="social">{isAr ? "التواصل الاجتماعي" : "Social"}</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{isAr ? "الاسم (EN)" : "Name (EN)"} *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><Label>{isAr ? "الاسم (AR)" : "Name (AR)"}</Label><Input value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} dir="rtl" /></div>
              </div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto-generated" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{isAr ? "الوصف (EN)" : "Description (EN)"}</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
                <div><Label>{isAr ? "الوصف (AR)" : "Description (AR)"}</Label><Textarea value={form.description_ar} onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))} rows={3} dir="rtl" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{isAr ? "رابط الشعار" : "Logo URL"}</Label><Input value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} /></div>
                <div><Label>{isAr ? "صورة الغلاف" : "Cover Image URL"}</Label><Input value={form.cover_image_url} onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))} /></div>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_verified} onCheckedChange={v => setForm(f => ({ ...f, is_verified: v }))} />
                  <Label>{isAr ? "موثق" : "Verified"}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_featured} onCheckedChange={v => setForm(f => ({ ...f, is_featured: v }))} />
                  <Label>{isAr ? "مميز" : "Featured"}</Label>
                </div>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{isAr ? "نشط" : "Active"}</SelectItem>
                    <SelectItem value="inactive">{isAr ? "غير نشط" : "Inactive"}</SelectItem>
                    <SelectItem value="pending">{isAr ? "قيد المراجعة" : "Pending"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-3">
                <div><Label>{isAr ? "البريد" : "Email"}</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" /></div>
                <div><Label>{isAr ? "الهاتف" : "Phone"}</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} dir="ltr" /></div>
                <div><Label>{isAr ? "الموقع" : "Website"}</Label><Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{isAr ? "العنوان (EN)" : "Address (EN)"}</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
                <div><Label>{isAr ? "العنوان (AR)" : "Address (AR)"}</Label><Input value={form.address_ar} onChange={e => setForm(f => ({ ...f, address_ar: e.target.value }))} dir="rtl" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{isAr ? "المدينة" : "City"}</Label><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
                <div><Label>{isAr ? "المدينة (AR)" : "City (AR)"}</Label><Input value={form.city_ar} onChange={e => setForm(f => ({ ...f, city_ar: e.target.value }))} dir="rtl" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>{isAr ? "الدولة" : "Country"}</Label><Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} /></div>
                <div><Label>{isAr ? "الدولة (AR)" : "Country (AR)"}</Label><Input value={form.country_ar} onChange={e => setForm(f => ({ ...f, country_ar: e.target.value }))} dir="rtl" /></div>
                <div><Label>{isAr ? "رمز الدولة" : "Code"}</Label><Input value={form.country_code} onChange={e => setForm(f => ({ ...f, country_code: e.target.value }))} maxLength={2} placeholder="SA" /></div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div><Label>{isAr ? "سنة التأسيس" : "Founded Year"}</Label><Input value={form.founded_year} onChange={e => setForm(f => ({ ...f, founded_year: e.target.value }))} type="number" placeholder="2010" /></div>
              <div><Label>{isAr ? "الخدمات (مفصولة بفاصلة)" : "Services (comma-separated)"}</Label><Input value={form.services} onChange={e => setForm(f => ({ ...f, services: e.target.value }))} placeholder="Exhibitions, Training, Competitions" /></div>
              <div><Label>{isAr ? "القطاعات المستهدفة" : "Targeted Sectors"}</Label><Input value={form.targeted_sectors} onChange={e => setForm(f => ({ ...f, targeted_sectors: e.target.value }))} placeholder="Food & Beverage, Hospitality" /></div>
            </TabsContent>

            <TabsContent value="social" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Twitter className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input value={form.social_twitter} onChange={e => setForm(f => ({ ...f, social_twitter: e.target.value }))} placeholder="https://twitter.com/..." />
                </div>
                <div className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input value={form.social_facebook} onChange={e => setForm(f => ({ ...f, social_facebook: e.target.value }))} placeholder="https://facebook.com/..." />
                </div>
                <div className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input value={form.social_linkedin} onChange={e => setForm(f => ({ ...f, social_linkedin: e.target.value }))} placeholder="https://linkedin.com/..." />
                </div>
                <div className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input value={form.social_instagram} onChange={e => setForm(f => ({ ...f, social_instagram: e.target.value }))} placeholder="https://instagram.com/..." />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 me-auto"
              onClick={handleAutoTranslate}
              disabled={translating}
            >
              <Languages className="h-3.5 w-3.5" />
              {translating ? "..." : (isAr ? "ترجمة تلقائية" : "Auto-Translate")}
            </Button>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.name || saveMutation.isPending}>
              {saveMutation.isPending ? "..." : editId ? (isAr ? "تحديث" : "Update") : (isAr ? "إضافة" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
