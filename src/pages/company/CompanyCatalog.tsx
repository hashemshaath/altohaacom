import { useState } from "react";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, Package, Filter } from "lucide-react";

interface CatalogItem {
  id: string;
  company_id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  category: string;
  subcategory: string | null;
  sku: string | null;
  unit: string | null;
  unit_price: number | null;
  currency: string | null;
  quantity_available: number | null;
  in_stock: boolean | null;
  is_active: boolean | null;
  image_url: string | null;
  created_at: string | null;
}

const defaultForm = {
  name: "",
  name_ar: "",
  description: "",
  description_ar: "",
  category: "",
  subcategory: "",
  sku: "",
  unit: "",
  unit_price: 0,
  currency: "SAR",
  quantity_available: 0,
  in_stock: true,
  is_active: true,
  image_url: "",
};

const categories = [
  { value: "ingredients", en: "Ingredients", ar: "مكونات" },
  { value: "equipment", en: "Equipment", ar: "معدات" },
  { value: "packaging", en: "Packaging", ar: "تغليف" },
  { value: "utensils", en: "Utensils", ar: "أدوات" },
  { value: "uniforms", en: "Uniforms", ar: "أزياء" },
  { value: "cleaning", en: "Cleaning Supplies", ar: "مواد تنظيف" },
  { value: "other", en: "Other", ar: "أخرى" },
];

export default function CompanyCatalog() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [form, setForm] = useState(defaultForm);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["companyCatalog", companyId, searchQuery, categoryFilter],
    queryFn: async () => {
      if (!companyId) return [];
      let query = supabase
        .from("company_catalog")
        .select("*")
        .eq("company_id", companyId)
        .order("category")
        .order("name");

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);
      }
      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CatalogItem[];
    },
    enabled: !!companyId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (!companyId) throw new Error("No company");
      const payload = {
        company_id: companyId,
        name: data.name,
        name_ar: data.name_ar || null,
        description: data.description || null,
        description_ar: data.description_ar || null,
        category: data.category,
        subcategory: data.subcategory || null,
        sku: data.sku || null,
        unit: data.unit || null,
        unit_price: data.unit_price || null,
        currency: data.currency || "SAR",
        quantity_available: data.quantity_available || null,
        in_stock: data.in_stock,
        is_active: data.is_active,
        image_url: data.image_url || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("company_catalog")
          .update(payload)
          .eq("id", editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("company_catalog").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyCatalog"] });
      setDialogOpen(false);
      setEditingItem(null);
      setForm(defaultForm);
      toast({ title: language === "ar" ? "تم الحفظ" : "Saved successfully" });
    },
    onError: () => {
      toast({
        title: language === "ar" ? "حدث خطأ" : "Error saving",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("company_catalog").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyCatalog"] });
      toast({ title: language === "ar" ? "تم الحذف" : "Item deleted" });
    },
  });

  const openEdit = (item: CatalogItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      name_ar: item.name_ar || "",
      description: item.description || "",
      description_ar: item.description_ar || "",
      category: item.category,
      subcategory: item.subcategory || "",
      sku: item.sku || "",
      unit: item.unit || "",
      unit_price: item.unit_price || 0,
      currency: item.currency || "SAR",
      quantity_available: item.quantity_available || 0,
      in_stock: item.in_stock ?? true,
      is_active: item.is_active ?? true,
      image_url: item.image_url || "",
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingItem(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const getCategoryLabel = (val: string) => {
    const cat = categories.find((c) => c.value === val);
    return cat ? (language === "ar" ? cat.ar : cat.en) : val;
  };

  const activeCount = items.filter((i) => i.is_active).length;
  const inStockCount = items.filter((i) => i.in_stock).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {language === "ar" ? "كتالوج المنتجات" : "Product Catalog"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {language === "ar"
              ? "إدارة منتجاتكم وخدماتكم"
              : "Manage your products and services"}
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          {language === "ar" ? "إضافة منتج" : "Add Product"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "الإجمالي" : "Total"}
                </p>
                <p className="text-xl font-bold">{items.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-chart-5" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "نشط" : "Active"}
                </p>
                <p className="text-xl font-bold">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "متوفر" : "In Stock"}
                </p>
                <p className="text-xl font-bold">{inStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={language === "ar" ? "بحث بالاسم أو SKU..." : "Search by name or SKU..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {language === "ar" ? "كل الفئات" : "All Categories"}
                </SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {language === "ar" ? cat.ar : cat.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <Skeleton className="m-6 h-64" />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">
                {language === "ar" ? "لا توجد منتجات" : "No products yet"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {language === "ar"
                  ? "أضف أول منتج إلى الكتالوج"
                  : "Add your first product to the catalog"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "ar" ? "المنتج" : "Product"}</TableHead>
                    <TableHead>{language === "ar" ? "الفئة" : "Category"}</TableHead>
                    <TableHead>{language === "ar" ? "SKU" : "SKU"}</TableHead>
                    <TableHead>{language === "ar" ? "السعر" : "Price"}</TableHead>
                    <TableHead>{language === "ar" ? "الكمية" : "Qty"}</TableHead>
                    <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                    <TableHead className="text-right">
                      {language === "ar" ? "إجراءات" : "Actions"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="h-10 w-10 rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{item.name}</p>
                            {item.name_ar && (
                              <p className="text-xs text-muted-foreground" dir="rtl">
                                {item.name_ar}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getCategoryLabel(item.category)}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {item.sku || "-"}
                      </TableCell>
                      <TableCell>
                        {item.unit_price != null
                          ? `${item.unit_price.toLocaleString()} ${item.currency || "SAR"}`
                          : "-"}
                        {item.unit && (
                          <span className="text-xs text-muted-foreground"> / {item.unit}</span>
                        )}
                      </TableCell>
                      <TableCell>{item.quantity_available ?? "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {item.is_active ? (
                            <Badge variant="default" className="w-fit">
                              {language === "ar" ? "نشط" : "Active"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="w-fit">
                              {language === "ar" ? "غير نشط" : "Inactive"}
                            </Badge>
                          )}
                          {item.in_stock ? (
                            <Badge variant="outline" className="w-fit text-chart-5 border-chart-5">
                              {language === "ar" ? "متوفر" : "In Stock"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="w-fit text-destructive border-destructive">
                              {language === "ar" ? "نفد" : "Out"}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem
                ? language === "ar"
                  ? "تعديل المنتج"
                  : "Edit Product"
                : language === "ar"
                  ? "إضافة منتج جديد"
                  : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "ar" ? "الاسم (إنجليزي)" : "Name (English)"} *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
                <Input
                  value={form.name_ar}
                  onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "ar" ? "الوصف (إنجليزي)" : "Description (English)"}</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
                <Textarea
                  value={form.description_ar}
                  onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
                  dir="rtl"
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{language === "ar" ? "الفئة" : "Category"} *</Label>
                <Select
                  value={form.category}
                  onValueChange={(val) => setForm({ ...form, category: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={language === "ar" ? "اختر الفئة" : "Select category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {language === "ar" ? cat.ar : cat.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "الفئة الفرعية" : "Subcategory"}</Label>
                <Input
                  value={form.subcategory}
                  onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>{language === "ar" ? "السعر" : "Unit Price"}</Label>
                <Input
                  type="number"
                  value={form.unit_price}
                  onChange={(e) => setForm({ ...form, unit_price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "العملة" : "Currency"}</Label>
                <Select
                  value={form.currency}
                  onValueChange={(val) => setForm({ ...form, currency: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAR">SAR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="AED">AED</SelectItem>
                    <SelectItem value="KWD">KWD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "الوحدة" : "Unit"}</Label>
                <Input
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="kg, box, piece..."
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "الكمية" : "Quantity"}</Label>
                <Input
                  type="number"
                  value={form.quantity_available}
                  onChange={(e) =>
                    setForm({ ...form, quantity_available: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{language === "ar" ? "رابط الصورة" : "Image URL"}</Label>
              <Input
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.in_stock}
                  onCheckedChange={(val) => setForm({ ...form, in_stock: val })}
                />
                <Label>{language === "ar" ? "متوفر" : "In Stock"}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(val) => setForm({ ...form, is_active: val })}
                />
                <Label>{language === "ar" ? "نشط" : "Active"}</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {language === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={() => saveMutation.mutate(form)}
                disabled={!form.name || !form.category || saveMutation.isPending}
              >
                {saveMutation.isPending
                  ? language === "ar"
                    ? "جارٍ الحفظ..."
                    : "Saving..."
                  : language === "ar"
                    ? "حفظ"
                    : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
