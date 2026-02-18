import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useCompanyPagePermissions } from "@/hooks/useCompanyPermissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Edit, Trash2, Save, X, Image } from "lucide-react";

const CATEGORIES = [
  "kitchen-equipment", "bakery", "utensils", "uniforms", "packaging",
  "ingredients", "beverages", "cleaning", "furniture", "technology", "other",
];

interface Product {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  category: string | null;
  sku: string | null;
  unit_price: number;
  currency: string;
  in_stock: boolean;
  is_active: boolean;
  image_url: string | null;
}

export function SupplierCatalogManager() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { companyId } = useCompanyAccess();
  const permissions = useCompanyPagePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "", name_ar: "", description: "", description_ar: "",
    category: "other", sku: "", unit_price: "", currency: "SAR",
    in_stock: true, is_active: true, image_url: "",
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["supplierCatalog", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("company_catalog")
        .select("*")
        .eq("company_id", companyId)
        .order("category")
        .order("name");
      return (data || []) as Product[];
    },
    enabled: !!companyId,
  });

  const resetForm = () => {
    setForm({ name: "", name_ar: "", description: "", description_ar: "", category: "other", sku: "", unit_price: "", currency: "SAR", in_stock: true, is_active: true, image_url: "" });
    setEditingId(null);
    setShowAdd(false);
  };

  const startEdit = (p: Product) => {
    setForm({
      name: p.name, name_ar: p.name_ar || "", description: p.description || "",
      description_ar: p.description_ar || "", category: p.category || "other",
      sku: p.sku || "", unit_price: p.unit_price?.toString() || "0",
      currency: p.currency || "SAR", in_stock: p.in_stock ?? true,
      is_active: p.is_active ?? true, image_url: p.image_url || "",
    });
    setEditingId(p.id);
    setShowAdd(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyId || !form.name.trim()) throw new Error("Invalid");
      const payload = {
        company_id: companyId,
        name: form.name.trim(),
        name_ar: form.name_ar.trim() || null,
        description: form.description.trim() || null,
        description_ar: form.description_ar.trim() || null,
        category: form.category,
        sku: form.sku.trim() || null,
        unit_price: parseFloat(form.unit_price) || 0,
        currency: form.currency,
        in_stock: form.in_stock,
        is_active: form.is_active,
        image_url: form.image_url.trim() || null,
      };
      if (editingId) {
        const { error } = await supabase.from("company_catalog").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("company_catalog").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplierCatalog", companyId] });
      toast({ title: isAr ? "تم الحفظ" : "Saved" });
      resetForm();
    },
    onError: () => toast({ title: isAr ? "فشل الحفظ" : "Save failed", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("company_catalog").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplierCatalog", companyId] });
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
    },
  });

  const canEdit = permissions.canEditProfile;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {isAr ? "إدارة كتالوج المنتجات" : "Product Catalog Management"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? `${products.length} منتج` : `${products.length} products`}
          </p>
        </div>
        {canEdit && !showAdd && (
          <Button size="sm" onClick={() => { resetForm(); setShowAdd(true); }}>
            <Plus className="me-1.5 h-3.5 w-3.5" />
            {isAr ? "إضافة منتج" : "Add Product"}
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAdd && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {editingId ? (isAr ? "تعديل المنتج" : "Edit Product") : (isAr ? "إضافة منتج جديد" : "Add New Product")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "الاسم (إنجليزي)" : "Name (English)"}</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Product name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
                <Input value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} dir="rtl" placeholder="اسم المنتج" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "الوصف" : "Description"}</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
                <Textarea value={form.description_ar} onChange={e => setForm({ ...form, description_ar: e.target.value })} rows={2} dir="rtl" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "التصنيف" : "Category"}</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">SKU</Label>
                <Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="SKU-001" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "السعر" : "Price"}</Label>
                <Input type="number" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "العملة" : "Currency"}</Label>
                <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAR">SAR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="AED">AED</SelectItem>
                    <SelectItem value="KWD">KWD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "رابط الصورة" : "Image URL"}</Label>
              <Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.in_stock} onCheckedChange={v => setForm({ ...form, in_stock: v })} />
                <Label className="text-xs">{isAr ? "متوفر" : "In Stock"}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                <Label className="text-xs">{isAr ? "نشط" : "Active"}</Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name.trim()}>
                <Save className="me-1.5 h-3.5 w-3.5" />
                {isAr ? "حفظ" : "Save"}
              </Button>
              <Button size="sm" variant="outline" onClick={resetForm}>
                <X className="me-1.5 h-3.5 w-3.5" />
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map(p => (
          <Card key={p.id} className={`rounded-xl overflow-hidden ${!p.is_active ? "opacity-60" : ""}`}>
            {p.image_url ? (
              <div className="h-32 bg-muted">
                <img src={p.image_url} className="h-full w-full object-cover" alt={p.name} />
              </div>
            ) : (
              <div className="h-32 bg-muted/50 flex items-center justify-center">
                <Image className="h-8 w-8 text-muted-foreground/20" />
              </div>
            )}
            <CardContent className="p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm">{p.name}</p>
                  {p.name_ar && <p className="text-xs text-muted-foreground" dir="rtl">{p.name_ar}</p>}
                </div>
                {p.unit_price > 0 && (
                  <span className="text-sm font-bold text-primary">{p.unit_price} {p.currency}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {p.category && <Badge variant="outline" className="text-[9px]">{p.category}</Badge>}
                {p.sku && <Badge variant="outline" className="text-[9px] font-mono">{p.sku}</Badge>}
                {p.in_stock ? (
                  <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20 text-[9px]">{isAr ? "متوفر" : "In Stock"}</Badge>
                ) : (
                  <Badge variant="destructive" className="text-[9px]">{isAr ? "نفد" : "Out"}</Badge>
                )}
                {!p.is_active && <Badge variant="secondary" className="text-[9px]">{isAr ? "غير نشط" : "Inactive"}</Badge>}
              </div>
              {canEdit && (
                <div className="flex gap-1.5 pt-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => startEdit(p)}>
                    <Edit className="me-1 h-3 w-3" />{isAr ? "تعديل" : "Edit"}
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={() => deleteMutation.mutate(p.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {products.length === 0 && !isLoading && (
        <div className="py-12 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">{isAr ? "لا توجد منتجات" : "No products yet"}</p>
        </div>
      )}
    </div>
  );
}
