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
import {
  BookOpen, Plus, Edit, Trash2, Users, Eye, EyeOff,
  GraduationCap, ChevronDown, ChevronUp, Save, X, ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import { ModuleLessonManager } from "@/components/masterclass/ModuleLessonManager";

export default function MasterclassesAdmin() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [managingModulesId, setManagingModulesId] = useState<string | null>(null);

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
  });

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
      const { error } = await supabase.from("masterclasses").insert({
        ...form,
        instructor_id: user.id,
        price: form.is_free ? 0 : form.price,
      });
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
      duration_hours: 0, is_self_paced: true, status: "draft",
    });
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
            <ArrowLeft className="h-4 w-4 mr-2" />
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">
            {language === "ar" ? "إدارة الدورات التعليمية" : "Masterclasses Management"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ar" ? "إنشاء وإدارة الدورات والمحتوى التعليمي" : "Create and manage courses and educational content"}
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showCreateForm
            ? (language === "ar" ? "إلغاء" : "Cancel")
            : (language === "ar" ? "إنشاء دورة" : "Create Masterclass")}
        </Button>
      </div>

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
              <Save className="mr-2 h-4 w-4" />
              {createMutation.isPending ? (language === "ar" ? "جاري الإنشاء..." : "Creating...") : (language === "ar" ? "إنشاء" : "Create")}
            </Button>
          </CardContent>
        </Card>
      )}

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
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-primary/10 p-2">
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
                  <TableRow key={mc.id}>
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
                          <BookOpen className="h-3 w-3 mr-1" />
                          {language === "ar" ? "المحتوى" : "Content"}
                        </Button>
                        {mc.status === "draft" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: mc.id, status: "published" })}>
                            <Eye className="h-3 w-3 mr-1" />
                            {language === "ar" ? "نشر" : "Publish"}
                          </Button>
                        )}
                        {mc.status === "published" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: mc.id, status: "archived" })}>
                            <EyeOff className="h-3 w-3 mr-1" />
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
