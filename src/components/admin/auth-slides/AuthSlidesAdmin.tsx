import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Plus, Trash2, GripVertical, Image, Save, Loader2, Layers } from "lucide-react";

interface Slide {
  id: string;
  title: string | null;
  title_ar: string | null;
  subtitle: string | null;
  subtitle_ar: string | null;
  image_url: string;
  page_type: string;
  sort_order: number;
  is_active: boolean;
}

export function AuthSlidesAdmin() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const qc = useQueryClient();

  const { data: slides = [], isLoading } = useQuery({
    queryKey: ["admin-auth-hero-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auth_hero_slides")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Slide[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (slide: Partial<Slide> & { id?: string }) => {
      if (slide.id) {
        const { error } = await supabase.from("auth_hero_slides").update(slide).eq("id", slide.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("auth_hero_slides").insert([{
          title: slide.title || null,
          title_ar: slide.title_ar || null,
          subtitle: slide.subtitle || null,
          subtitle_ar: slide.subtitle_ar || null,
          image_url: slide.image_url!,
          page_type: slide.page_type || "both",
          is_active: slide.is_active ?? true,
          sort_order: slides.length,
          created_by: user?.id,
        }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-auth-hero-slides"] });
      qc.invalidateQueries({ queryKey: ["auth-hero-slides"] });
      toast.success(isAr ? "تم الحفظ" : "Saved");
    },
    onError: () => toast.error(isAr ? "خطأ" : "Error"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("auth_hero_slides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-auth-hero-slides"] });
      qc.invalidateQueries({ queryKey: ["auth-hero-slides"] });
      toast.success(isAr ? "تم الحذف" : "Deleted");
    },
  });

  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Slide>>({});

  const startEdit = (slide: Slide) => {
    setEditId(slide.id);
    setForm({ ...slide });
  };

  const startNew = () => {
    setEditId("new");
    setForm({ title: "", title_ar: "", subtitle: "", subtitle_ar: "", image_url: "", page_type: "both", is_active: true });
  };

  const handleSave = () => {
    if (!form.image_url) {
      toast.error(isAr ? "الصورة مطلوبة" : "Image URL required");
      return;
    }
    if (editId === "new") {
      saveMutation.mutate({ ...form });
    } else if (editId) {
      saveMutation.mutate({ ...form, id: editId });
    }
    setEditId(null);
    setForm({});
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        icon={Layers}
        title={isAr ? "شرائح صفحة تسجيل الدخول" : "Auth Page Hero Slides"}
        description={isAr ? "إدارة صور وعناوين الشرائح في صفحات تسجيل الدخول والتسجيل" : "Manage slider images and titles on login & registration pages"}
      />

      <Button onClick={startNew} className="gap-2">
        <Plus className="h-4 w-4" /> {isAr ? "إضافة شريحة" : "Add Slide"}
      </Button>

      {/* Edit form */}
      {editId && (
        <Card className="border-primary/30">
          <CardContent className="p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Title (EN)</Label>
                <Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">العنوان (AR)</Label>
                <Input value={form.title_ar || ""} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} dir="rtl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Subtitle (EN)</Label>
                <Input value={form.subtitle || ""} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">الوصف (AR)</Label>
                <Input value={form.subtitle_ar || ""} onChange={(e) => setForm({ ...form, subtitle_ar: e.target.value })} dir="rtl" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "رابط الصورة" : "Image URL"}</Label>
              <Input value={form.image_url || ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="/auth-hero-1.jpg" dir="ltr" />
              {form.image_url && (
                <img src={form.image_url} alt="Preview" className="h-32 w-full object-cover rounded-xl mt-2" />
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "نوع الصفحة" : "Page Type"}</Label>
                <Select value={form.page_type || "both"} onValueChange={(v) => setForm({ ...form, page_type: v })}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">{isAr ? "الكل" : "Both"}</SelectItem>
                    <SelectItem value="individual">{isAr ? "أفراد" : "Individual"}</SelectItem>
                    <SelectItem value="company">{isAr ? "شركات" : "Company"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 mt-5">
                <Switch checked={form.is_active ?? true} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label className="text-xs">{isAr ? "نشط" : "Active"}</Label>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isAr ? "حفظ" : "Save"}
              </Button>
              <Button variant="ghost" onClick={() => { setEditId(null); setForm({}); }}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slides list */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : slides.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center p-8">{isAr ? "لا توجد شرائح" : "No slides yet"}</p>
        ) : (
          slides.map((slide) => (
            <Card key={slide.id} className={`${!slide.is_active ? "opacity-50" : ""}`}>
              <CardContent className="flex items-center gap-3 p-3">
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="h-14 w-20 rounded-lg overflow-hidden shrink-0 bg-muted">
                  <img src={slide.image_url} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{isAr ? slide.title_ar || slide.title : slide.title || "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{isAr ? slide.subtitle_ar || slide.subtitle : slide.subtitle || "—"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-mono">
                      {slide.page_type === "both" ? (isAr ? "الكل" : "Both") : slide.page_type === "company" ? (isAr ? "شركات" : "Company") : (isAr ? "أفراد" : "Individual")}
                    </span>
                    {!slide.is_active && <span className="text-[10px] text-muted-foreground">{isAr ? "معطل" : "Inactive"}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(slide)}>
                    {isAr ? "تعديل" : "Edit"}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(slide.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
