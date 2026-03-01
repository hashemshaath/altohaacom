import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {
  BookOpen, Plus, Edit, Trash2, Users, Eye, EyeOff,
  GraduationCap, ChevronDown, ChevronUp, Save, X, ArrowLeft, MapPin,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { format } from "date-fns";
import { ModuleLessonManager } from "@/components/masterclass/ModuleLessonManager";
import { useAllCountries } from "@/hooks/useCountries";
import { countryFlag } from "@/lib/countryFlag";
import { MasterclassInsightsWidget } from "@/components/admin/MasterclassInsightsWidget";

export default function MasterclassesAdmin() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [managingModulesId, setManagingModulesId] = useState<string | null>(null);

  const { data: allCountries = [] } = useAllCountries();

  const [form, setForm] = useState({
    title: "",
    title_ar: "",
    description: "",
    description_ar: "",
    category: "general",
    level: "beginner",
    is_free: true,
    price: 0,
    duration_hours: 0,
    is_self_paced: true,
    status: "draft",
    country_code: "",
  });

  const isAr = language === "ar";

  const { data: masterclasses = [], isLoading } = useQuery({
    queryKey: ["admin-masterclasses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("masterclasses")
        .select("*, masterclass_modules(id), masterclass_enrollments(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { country_code, ...rest } = form;
      const { error } = await supabase.from("masterclasses").insert({
        ...rest,
        country_code: country_code || null,
        instructor_id: user.id,
        price: rest.is_free ? 0 : rest.price,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-masterclasses"] });
      setShowCreateForm(false);
      resetForm();
      toast({ title: language === "ar" ? "تم الإنشاء" : "Created successfully" });
    },
    onError: (err: any) => {
      toast({ title: language === "ar" ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("masterclasses").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-masterclasses"] });
      toast({ title: language === "ar" ? "تم التحديث" : "Updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("masterclasses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-masterclasses"] });
      toast({ title: language === "ar" ? "تم الحذف" : "Deleted" });
    },
  });

  const resetForm = () => {
    setForm({
      title: "", title_ar: "", description: "", description_ar: "",
      category: "general", level: "beginner", is_free: true, price: 0,
      duration_hours: 0, is_self_paced: true, status: "draft", country_code: "",
    });
  };

  const bulk = useAdminBulkActions(masterclasses);

  const { exportCSV } = useCSVExport({
    columns: [
      { header: isAr ? "العنوان" : "Title", accessor: (r: any) => isAr && r.title_ar ? r.title_ar : r.title },
      { header: isAr ? "التصنيف" : "Category", accessor: (r: any) => r.category },
      { header: isAr ? "المستوى" : "Level", accessor: (r: any) => r.level },
      { header: isAr ? "الحالة" : "Status", accessor: (r: any) => r.status },
      { header: isAr ? "المدة" : "Duration", accessor: (r: any) => r.duration_hours },
      { header: isAr ? "المسجلين" : "Enrollments", accessor: (r: any) => r.masterclass_enrollments?.length || 0 },
    ],
    filename: "masterclasses",
  });

  const bulkDelete = async () => {
    const ids = [...bulk.selected];
    for (const id of ids) await deleteMutation.mutateAsync(id);
    bulk.clearSelection();
  };

  const bulkPublish = async () => {
    const ids = [...bulk.selected];
    for (const id of ids) await updateStatusMutation.mutateAsync({ id, status: "published" });
    bulk.clearSelection();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      published: "default",
      draft: "secondary",
      archived: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  // Show module manager for a specific masterclass
  if (managingModulesId) {
    const mc = masterclasses.find((m: any) => m.id === managingModulesId);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setManagingModulesId(null)}>
            <ArrowLeft className="h-4 w-4 me-2" />
            {language === "ar" ? "رجوع" : "Back"}
          </Button>
          <h1 className="font-serif text-2xl font-bold">
            {mc ? (language === "ar" && mc.title_ar ? mc.title_ar : mc.title) : ""}
          </h1>
        </div>
        <ModuleLessonManager masterclassId={managingModulesId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={GraduationCap}
        title={language === "ar" ? "إدارة الدورات التعليمية" : "Masterclasses Management"}
        description={language === "ar" ? "إنشاء وإدارة الدورات والمحتوى التعليمي" : "Create and manage courses and educational content"}
        actions={
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? <X className="me-2 h-4 w-4" /> : <Plus className="me-2 h-4 w-4" />}
            {showCreateForm
              ? (language === "ar" ? "إلغاء" : "Cancel")
              : (language === "ar" ? "إنشاء دورة" : "Create Masterclass")}
          </Button>
        }
      />

      <MasterclassInsightsWidget />

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{language === "ar" ? "دورة جديدة" : "New Masterclass"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{language === "ar" ? "العنوان (إنجليزي)" : "Title (English)"}</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
                <Input value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} dir="rtl" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{language === "ar" ? "الوصف (إنجليزي)" : "Description (English)"}</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
                <Textarea value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} rows={3} dir="rtl" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>{language === "ar" ? "التصنيف" : "Category"}</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "المستوى" : "Level"}</Label>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">{language === "ar" ? "مبتدئ" : "Beginner"}</SelectItem>
                    <SelectItem value="intermediate">{language === "ar" ? "متوسط" : "Intermediate"}</SelectItem>
                    <SelectItem value="advanced">{language === "ar" ? "متقدم" : "Advanced"}</SelectItem>
                    <SelectItem value="all_levels">{language === "ar" ? "جميع المستويات" : "All Levels"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "المدة (ساعات)" : "Duration (hours)"}</Label>
                <Input type="number" value={form.duration_hours} onChange={(e) => setForm({ ...form, duration_hours: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2 max-w-xs">
              <Label>{language === "ar" ? "الدولة" : "Country"}</Label>
              <Select value={form.country_code} onValueChange={(v) => setForm({ ...form, country_code: v })}>
                <SelectTrigger>
                  <MapPin className="me-1.5 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder={language === "ar" ? "اختر الدولة" : "Select country"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{language === "ar" ? "بدون تحديد" : "No country"}</SelectItem>
                  {allCountries.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {countryFlag(c.code)} {language === "ar" ? c.name_ar || c.name : c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_free} onCheckedChange={(v) => setForm({ ...form, is_free: v })} />
                <Label>{language === "ar" ? "مجاني" : "Free"}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_self_paced} onCheckedChange={(v) => setForm({ ...form, is_self_paced: v })} />
                <Label>{language === "ar" ? "ذاتي التعلم" : "Self-paced"}</Label>
              </div>
            </div>
            {!form.is_free && (
              <div className="space-y-2 max-w-xs">
                <Label>{language === "ar" ? "السعر (ريال)" : "Price (SAR)"}</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
              </div>
            )}
            <Button onClick={() => createMutation.mutate()} disabled={!form.title || createMutation.isPending}>
              <Save className="me-2 h-4 w-4" />
              {createMutation.isPending ? (language === "ar" ? "جاري الإنشاء..." : "Creating...") : (language === "ar" ? "إنشاء" : "Create")}
            </Button>
          </CardContent>
        </Card>
      )}

      <BulkActionBar
        count={bulk.count}
        onClear={bulk.clearSelection}
        onExport={() => exportCSV(bulk.selectedItems)}
        onDelete={bulkDelete}
        onStatusChange={() => bulkPublish()}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: language === "ar" ? "إجمالي الدورات" : "Total Courses", value: masterclasses.length, icon: BookOpen },
          { label: language === "ar" ? "منشورة" : "Published", value: masterclasses.filter((m: any) => m.status === "published").length, icon: Eye },
          { label: language === "ar" ? "مسودات" : "Drafts", value: masterclasses.filter((m: any) => m.status === "draft").length, icon: EyeOff },
          {
            label: language === "ar" ? "إجمالي المسجلين" : "Total Enrollments",
            value: masterclasses.reduce((sum: number, m: any) => sum + (m.masterclass_enrollments?.length || 0), 0),
            icon: Users,
          },
        ].map((stat, i) => (
          <Card key={i} className="rounded-2xl border-border/40 group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-xl bg-primary/10 p-2 transition-transform duration-300 group-hover:scale-110">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : masterclasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <GraduationCap className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">{language === "ar" ? "لا توجد دورات" : "No masterclasses yet"}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <Checkbox checked={bulk.isAllSelected} onCheckedChange={bulk.toggleAll} />
                  </TableHead>
                  <TableHead>{language === "ar" ? "العنوان" : "Title"}</TableHead>
                  <TableHead>{language === "ar" ? "المستوى" : "Level"}</TableHead>
                  <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{language === "ar" ? "الوحدات" : "Modules"}</TableHead>
                  <TableHead>{language === "ar" ? "المسجلين" : "Enrollments"}</TableHead>
                  <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
                  <TableHead>{language === "ar" ? "الإجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {masterclasses.map((mc: any) => (
                  <TableRow key={mc.id} className={bulk.isSelected(mc.id) ? "bg-primary/5" : ""}>
                    <TableCell>
                      <Checkbox checked={bulk.isSelected(mc.id)} onCheckedChange={() => bulk.toggleOne(mc.id)} />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{mc.title}</p>
                        {mc.title_ar && <p className="text-xs text-muted-foreground" dir="rtl">{mc.title_ar}</p>}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{mc.level}</Badge></TableCell>
                    <TableCell>{getStatusBadge(mc.status)}</TableCell>
                    <TableCell>{mc.masterclass_modules?.length || 0}</TableCell>
                    <TableCell>{mc.masterclass_enrollments?.length || 0}</TableCell>
                    <TableCell className="text-sm">{format(new Date(mc.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => setManagingModulesId(mc.id)}>
                          <BookOpen className="h-3 w-3 me-1" />
                          {language === "ar" ? "المحتوى" : "Content"}
                        </Button>
                        {mc.status === "draft" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: mc.id, status: "published" })}>
                            <Eye className="h-3 w-3 me-1" />
                            {language === "ar" ? "نشر" : "Publish"}
                          </Button>
                        )}
                        {mc.status === "published" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: mc.id, status: "archived" })}>
                            <EyeOff className="h-3 w-3 me-1" />
                            {language === "ar" ? "أرشفة" : "Archive"}
                          </Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(mc.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
