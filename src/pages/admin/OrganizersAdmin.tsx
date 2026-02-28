import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
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
  Globe, Mail, Phone, MapPin, CheckCircle2, XCircle, Star, ExternalLink,
  Users, Landmark, Link2, Shield,
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
}

const emptyForm: OrganizerForm = {
  name: "", name_ar: "", slug: "", description: "", description_ar: "",
  logo_url: "", cover_image_url: "", email: "", phone: "", website: "",
  address: "", address_ar: "", city: "", city_ar: "", country: "", country_ar: "",
  country_code: "", status: "active", is_verified: false, is_featured: false,
  services: "", targeted_sectors: "",
};

export default function OrganizersAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<OrganizerForm>(emptyForm);

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

  const saveMutation = useMutation({
    mutationFn: async (f: OrganizerForm) => {
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

  const openEdit = (org: any) => {
    setEditId(org.id);
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
    });
    setDialogOpen(true);
  };

  const filtered = (organizers || []).filter((o: any) => {
    const matchSearch = !search || o.name?.toLowerCase().includes(search.toLowerCase()) || o.name_ar?.includes(search);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: organizers?.length || 0,
    active: organizers?.filter((o: any) => o.status === "active").length || 0,
    verified: organizers?.filter((o: any) => o.is_verified).length || 0,
    featured: organizers?.filter((o: any) => o.is_featured).length || 0,
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
          <Card key={s.label} className="border-border/40">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
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

      {/* Toolbar */}
      <Card className="border-border/40">
        <CardContent className="p-3 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2 items-center flex-1 min-w-0">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder={isAr ? "بحث..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} className="ps-9 h-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                <SelectItem value="active">{isAr ? "نشط" : "Active"}</SelectItem>
                <SelectItem value="inactive">{isAr ? "غير نشط" : "Inactive"}</SelectItem>
                <SelectItem value="pending">{isAr ? "قيد المراجعة" : "Pending"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={() => { setEditId(null); setForm(emptyForm); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 me-1.5" />{isAr ? "إضافة منظم" : "Add Organizer"}
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
      ) : (
        <Card className="border-border/40 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "المنظم" : "Organizer"}</TableHead>
                <TableHead>{isAr ? "الموقع" : "Location"}</TableHead>
                <TableHead>{isAr ? "التواصل" : "Contact"}</TableHead>
                <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead>{isAr ? "المعارض" : "Events"}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {isAr ? "لا توجد نتائج" : "No organizers found"}
                  </TableCell>
                </TableRow>
              ) : filtered.map((org: any) => (
                <TableRow key={org.id}>
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
                  <TableCell className="text-sm font-medium">{org.total_exhibitions}</TableCell>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? (isAr ? "تعديل المنظم" : "Edit Organizer") : (isAr ? "إضافة منظم" : "Add Organizer")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{isAr ? "الاسم (EN)" : "Name (EN)"}</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>{isAr ? "الاسم (AR)" : "Name (AR)"}</Label><Input value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} dir="rtl" /></div>
            </div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto-generated" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{isAr ? "الوصف (EN)" : "Description (EN)"}</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
              <div><Label>{isAr ? "الوصف (AR)" : "Description (AR)"}</Label><Textarea value={form.description_ar} onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))} rows={3} dir="rtl" /></div>
            </div>

            <Separator />
            {/* Media */}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{isAr ? "رابط الشعار" : "Logo URL"}</Label><Input value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} /></div>
              <div><Label>{isAr ? "صورة الغلاف" : "Cover Image URL"}</Label><Input value={form.cover_image_url} onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))} /></div>
            </div>

            <Separator />
            {/* Contact */}
            <div className="grid grid-cols-3 gap-3">
              <div><Label>{isAr ? "البريد" : "Email"}</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" /></div>
              <div><Label>{isAr ? "الهاتف" : "Phone"}</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} dir="ltr" /></div>
              <div><Label>{isAr ? "الموقع" : "Website"}</Label><Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} /></div>
            </div>

            <Separator />
            {/* Location */}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{isAr ? "المدينة" : "City"}</Label><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
              <div><Label>{isAr ? "الدولة" : "Country"}</Label><Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{isAr ? "المدينة (AR)" : "City (AR)"}</Label><Input value={form.city_ar} onChange={e => setForm(f => ({ ...f, city_ar: e.target.value }))} dir="rtl" /></div>
              <div><Label>{isAr ? "رمز الدولة" : "Country Code"}</Label><Input value={form.country_code} onChange={e => setForm(f => ({ ...f, country_code: e.target.value }))} maxLength={2} placeholder="SA" /></div>
            </div>

            <Separator />
            {/* Services */}
            <div><Label>{isAr ? "الخدمات (مفصولة بفاصلة)" : "Services (comma-separated)"}</Label><Input value={form.services} onChange={e => setForm(f => ({ ...f, services: e.target.value }))} placeholder="Exhibitions, Training, Competitions" /></div>
            <div><Label>{isAr ? "القطاعات المستهدفة" : "Targeted Sectors"}</Label><Input value={form.targeted_sectors} onChange={e => setForm(f => ({ ...f, targeted_sectors: e.target.value }))} placeholder="Food & Beverage, Hospitality" /></div>

            <Separator />
            {/* Flags */}
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
          </div>
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
