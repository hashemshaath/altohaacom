import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
  Shield, Landmark, Users, BarChart3, Calendar,
  Twitter, Facebook, Linkedin, Instagram,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formTab, setFormTab] = useState("basic");

  const { data: organizers, isLoading } = useQuery({
    queryKey: ["admin-organizers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const countries = useMemo(() =>
    [...new Set((organizers || []).map((o: any) => o.country).filter(Boolean))] as string[],
    [organizers]
  );

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
      setSelectedIds([]);
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
      setSelectedIds([]);
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
      setSelectedIds([]);
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

  const filtered = (organizers || []).filter((o: any) => {
    const matchSearch = !search || o.name?.toLowerCase().includes(search.toLowerCase()) || o.name_ar?.includes(search) || o.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchCountry = countryFilter === "all" || o.country === countryFilter;
    return matchSearch && matchStatus && matchCountry;
  });

  const stats = {
    total: organizers?.length || 0,
    active: organizers?.filter((o: any) => o.status === "active").length || 0,
    verified: organizers?.filter((o: any) => o.is_verified).length || 0,
    featured: organizers?.filter((o: any) => o.is_featured).length || 0,
  };

  const toggleAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((o: any) => o.id));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const { toast: toastHook } = useToast();
  const handleExport = () => {
    const data = organizers || [];
    if (!data.length) {
      toastHook({ title: isAr ? "لا توجد بيانات" : "No data", variant: "destructive" });
      return;
    }
    const escape = (val: any): string => {
      const str = val == null ? "" : String(val);
      return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const headers = ["Name", "Name (AR)", "Email", "Phone", "Website", "City", "Country", "Status", "Verified", "Featured", "Events", "Views", "Rating", "Services", "Founded"];
    const rows = data.map((o: any) => [
      o.name, o.name_ar || "", o.email || "", o.phone || "", o.website || "",
      o.city || "", o.country || "", o.status, o.is_verified ? "Yes" : "No",
      o.is_featured ? "Yes" : "No", o.total_exhibitions || 0, o.total_views || 0,
      o.average_rating || 0, (o.services || []).join("; "), o.founded_year || "",
    ].map(escape).join(","));
    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `organizers_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toastHook({ title: isAr ? `✅ تم تصدير ${data.length} صف` : `✅ Exported ${data.length} rows` });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Building2}
        title={isAr ? "المنظمين" : "Organizers"}
        description={isAr ? "إدارة منظمي الفعاليات وربطهم بالمعارض" : "Manage event organizers and link them to exhibitions"}
      />

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
      {selectedIds.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3 flex flex-wrap gap-2 items-center justify-between">
            <span className="text-sm font-medium">
              {selectedIds.length} {isAr ? "محدد" : "selected"}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => bulkStatusMutation.mutate({ ids: selectedIds, status: "active" })}>
                <CheckCircle2 className="h-3.5 w-3.5 me-1" />{isAr ? "تفعيل" : "Activate"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => bulkVerifyMutation.mutate({ ids: selectedIds, verified: true })}>
                <Shield className="h-3.5 w-3.5 me-1" />{isAr ? "توثيق" : "Verify"}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => { if (confirm(isAr ? "حذف المحدد؟" : "Delete selected?")) bulkDeleteMutation.mutate(selectedIds); }}>
                <Trash2 className="h-3.5 w-3.5 me-1" />{isAr ? "حذف" : "Delete"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
            <Button size="sm" variant="outline" onClick={handleExport}>
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
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
      ) : (
        <Card className="rounded-2xl border-border/40 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={selectedIds.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                </TableHead>
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
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {isAr ? "لا توجد نتائج" : "No organizers found"}
                  </TableCell>
                </TableRow>
              ) : filtered.map((org: any) => (
                <TableRow key={org.id} className={selectedIds.includes(org.id) ? "bg-primary/5" : ""}>
                  <TableCell>
                    <Checkbox checked={selectedIds.includes(org.id)} onCheckedChange={() => toggleOne(org.id)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 rounded-lg">
                        {org.logo_url && <AvatarImage src={org.logo_url} />}
                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-bold">{org.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <Link to={`/organizers/${org.slug}`} className="font-medium text-sm hover:text-primary truncate block">{org.name}</Link>
                        {org.name_ar && <p className="text-[10px] text-muted-foreground truncate" dir="rtl">{org.name_ar}</p>}
                      </div>
                      {org.is_verified && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                      {org.is_featured && <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
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

      {/* Create/Edit Dialog with Tabs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? (isAr ? "تعديل المنظم" : "Edit Organizer") : (isAr ? "إضافة منظم" : "Add Organizer")}</DialogTitle>
          </DialogHeader>

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

          <DialogFooter>
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
